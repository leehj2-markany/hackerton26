// 마크애니 제품 지식 베이스 — pgvector 시맨틱 검색 + 기존 STORES fallback
// [의도] 하드코딩 STORES → Supabase pgvector 벡터 검색으로 전환
// searchKnowledge() 시그니처 유지 → chat.js, geminiClient.js 변경 불필요
// Supabase 실패 시 기존 in-memory STORES로 자동 fallback (안전망)
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { ENV } from './config.js'

// ── Supabase + Gemini 임베딩 클라이언트 (lazy init) ──
let supabase = null
let embeddingModel = null
let vectorSearchAvailable = false // 벡터 검색 가용 여부 플래그

function initVectorSearch() {
  if (supabase) return // 이미 초기화됨
  try {
    if (ENV.SUPABASE_URL && ENV.SUPABASE_ANON_KEY) {
      supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY)
    }
    if (ENV.GEMINI_API_KEY) {
      const genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY)
      embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' })
    }
    vectorSearchAvailable = !!(supabase && embeddingModel)
    if (vectorSearchAvailable) {
      console.log('[knowledgeBase] ✅ pgvector 검색 초기화 완료')
    } else {
      console.log('[knowledgeBase] ⚠️ pgvector 불가 — STORES fallback 사용')
    }
  } catch (err) {
    console.error('[knowledgeBase] pgvector 초기화 실패:', err.message)
    vectorSearchAvailable = false
  }
}

// ── 쿼리 임베딩 생성 ──
async function generateQueryEmbedding(query) {
  const result = await embeddingModel.embedContent({
    content: { parts: [{ text: query }] },
    taskType: 'RETRIEVAL_QUERY',
  })
  return result.embedding.values
}

// ── pgvector 시맨틱 검색 ──
async function vectorSearch(query, productHint, topK) {
  const embedding = await generateQueryEmbedding(query)

  // 제품 힌트가 있으면 필터 적용
  const filter = {}
  if (productHint) {
    // productHint를 제품명 또는 제품군으로 매핑
    const hint = productHint.toLowerCase()
    if (hint.includes('drm') || hint.includes('document safer') || hint.includes('문서 보안')) {
      filter.product_group = 'DRM 제품군'
    } else if (hint.includes('dlp') || hint.includes('safepc') || hint.includes('safeusb')) {
      filter.product_group = 'DLP 제품군'
    } else if (hint.includes('tracer')) {
      filter.product_group = 'TRACER 제품군'
    } else if (hint.includes('epage') || hint.includes('content') || hint.includes('응용')) {
      filter.product_group = '응용보안 제품군'
    }
  }

  const { data, error } = await supabase.rpc('match_knowledge', {
    query_embedding: embedding,
    match_count: topK,
    filter: Object.keys(filter).length > 0 ? filter : {},
  })

  if (error) {
    console.error('[vectorSearch] RPC 실패:', error.message)
    return null
  }

  if (!data || data.length === 0) {
    // 필터가 있었으면 필터 없이 재시도
    if (Object.keys(filter).length > 0) {
      console.log('[vectorSearch] 필터 결과 없음 → 전체 검색 재시도')
      const { data: retryData, error: retryErr } = await supabase.rpc('match_knowledge', {
        query_embedding: embedding,
        match_count: topK,
        filter: {},
      })
      if (retryErr || !retryData?.length) return null
      return retryData
    }
    return null
  }

  return data
}

// ── 벡터 검색 결과 → searchKnowledge 반환 형식으로 변환 ──
function formatVectorResults(vectorData) {
  const chunks = vectorData.map(row => ({
    id: `vec-${row.id}`,
    title: row.metadata?.title || row.metadata?.product_name || '제품 정보',
    content: row.content,
    keywords: [row.metadata?.product_name, row.metadata?.product_group].filter(Boolean),
  }))

  const stores = [...new Set(vectorData.map(r => r.metadata?.product_name).filter(Boolean))]
  const scores = vectorData.map(r => Math.round((r.similarity || 0) * 100))

  return {
    chunks,
    stores,
    scores,
    totalSearched: vectorData.length,
    searchType: 'vector', // 디버깅용: 어떤 검색 방식이 사용되었는지
  }
}

// ── 기존 제품별 Store (fallback용 — pgvector 실패 시 사용) ──
export const STORES = {
  drm: {
    id: 'store_drm',
    product: 'DRM',
    chunks: [
      {
        id: 'drm-overview',
        title: 'DRM 제품 개요',
        content: `마크애니 DRM(Digital Rights Management)은 기업 및 공공기관의 디지털 문서를 암호화하여 무단 열람, 복사, 인쇄, 유출을 방지하는 문서 보안 솔루션입니다. 1999년 출시 이후 25년 이상의 기술 축적으로 국내 DRM 시장 점유율 1위를 유지하고 있습니다. 최신 버전 v3.2에서는 윈도우 11 완벽 지원, 대량 파일 처리 30% 성능 개선, 모바일 뷰어 강화 등이 포함되었습니다.`,
        keywords: ['DRM', '디지털 저작권', '문서 보안', '암호화', '개요']
      },
      {
        id: 'drm-cert',
        title: 'DRM 인증 현황',
        content: `마크애니 DRM은 다음 보안 인증을 보유하고 있습니다:
- CC인증 (EAL2+): 국제 공통평가기준 인증. 정보보호 제품의 보안 기능 및 보증 수준을 국제적으로 인정.
- GS인증 (1등급): 한국정보통신기술협회(TTA) 소프트웨어 품질 인증. 기능성, 신뢰성, 사용성, 효율성, 유지보수성, 이식성 6개 항목 평가.
- KCMVP 암호모듈 인증: 국가정보원 암호모듈 검증. ARIA, SEED, AES 등 국가 표준 암호 알고리즘 적용.
- 국가정보원 보안적합성 검증 통과: 국가·공공기관 도입 필수 요건 충족.
국방부, 행정안전부, 방위사업청, 해군본부, 국가정보원 등 최고 보안 등급 기관에서 운용 중입니다.`,
        keywords: ['인증', 'CC인증', 'GS인증', 'KCMVP', '보안', '국방부']
      },
      {
        id: 'drm-custom',
        title: 'DRM 맞춤형 구축',
        content: `마크애니 DRM은 고객 환경에 맞는 맞춤형 구축을 지원합니다:
- 국방부/정부기관: 망분리 환경, 보안 등급별 문서 분류, 감사 로그 강화, 오프라인 모드 필수 지원.
- 대기업: 대규모 사용자(10,000+) 환경, AD/LDAP 연동, SSO 통합, 그룹웨어 연동.
- 금융기관: 금융보안원 가이드라인 준수, 개인정보 보호 강화, 감사 추적 기능.
구축 기간: 소규모(100 User 이하) 2~4주, 중규모(100~1,000 User) 4~8주, 대규모(1,000+ User) 8~16주.
구축 프로세스: 요구사항 분석 → 설계 → 개발/커스터마이징 → 테스트 → 파일럿 → 전사 배포 → 안정화.`,
        keywords: ['구축', '맞춤형', '커스터마이징', '기간', '프로세스', '국방부']
      },
      {
        id: 'drm-compat',
        title: 'DRM 호환성 및 기술 사양',
        content: `마크애니 DRM v3.2 기술 사양:
- OS 지원: Windows 10/11 (64bit), Windows Server 2016/2019/2022, macOS 12+, Linux (Ubuntu 20.04+, CentOS 7+)
- 모바일: iOS 15+, Android 12+ 전용 뷰어 앱 제공
- 브라우저: Chrome 90+, Edge 90+, Firefox 90+, Safari 15+ (웹 뷰어)
- 오프라인 모드: 로컬 캐시 기반 오프라인 문서 열람 지원 (최대 30일)
- API: REST API, SOAP API, SDK(C++/Java/.NET) 제공
- 연동: AD/LDAP, SSO(SAML 2.0, OAuth 2.0), 그룹웨어(한글과컴퓨터, 더존), ERP(SAP, Oracle)
- 암호화: AES-256, ARIA-256, SEED-256 지원
- 성능: 단일 파일 암호화 0.5초 이내, 대량 처리(1,000파일) 5분 이내 (v3.2 기준 30% 개선)`,
        keywords: ['호환', '윈도우', 'Windows 11', '사양', 'API', '연동', '오프라인', '모바일']
      },
      {
        id: 'drm-references',
        title: 'DRM 주요 레퍼런스',
        content: `마크애니 DRM 주요 고객사:
- 국방부: 군사 기밀 문서 보안 시스템 구축 (2020~현재, 5,000+ User)
- 행정안전부: 전자정부 문서 보안 표준 솔루션 (2018~현재)
- 방위사업청: 방산 기술 문서 보안 (2019~현재)
- 해군본부: 함정 설계 문서 보안 (2021~현재)
- 국가정보원: 기밀 문서 관리 시스템 (2017~현재)
- SK하이닉스: 반도체 설계 문서 보안 (2022~현재, 10,000+ User)
- 삼성전자: 연구개발 문서 보안 (2020~현재)
- LG전자: 제품 설계 문서 보안 (2021~현재)
- 국민건강보험공단: 개인정보 문서 보안 (2023~현재)
총 1,000+ 고객사, 500,000+ 사용자 운용 중.`,
        keywords: ['레퍼런스', '고객사', '사례', 'SK하이닉스', '국방부', '삼성전자']
      },
    ]
  },

  document_safer: {
    id: 'store_document_safer',
    product: 'Document SAFER',
    chunks: [
      {
        id: 'ds-overview',
        title: 'Document SAFER 제품 개요',
        content: `Document SAFER는 기업 문서의 생성부터 폐기까지 전 생명주기를 관리하는 통합 문서 보안 솔루션입니다. 문서 암호화, 접근 제어, 사용 이력 추적, 출력 보안을 하나의 플랫폼에서 제공합니다. v3.2 최신 버전에서는 대량 파일 처리 속도 30% 개선, 윈도우 11 완벽 지원, 클라우드 하이브리드 환경 지원이 추가되었습니다.`,
        keywords: ['Document SAFER', '문서 보안', '통합', '생명주기']
      },
      {
        id: 'ds-features',
        title: 'Document SAFER 주요 기능',
        content: `Document SAFER v3.2 주요 기능:
1. 문서 암호화: AES-256 기반 실시간 암호화/복호화. 사용자 투명 암호화(Transparent Encryption) 지원.
2. 접근 제어: 역할 기반 접근 제어(RBAC). 부서/직급/프로젝트별 세분화된 권한 설정.
3. 사용 이력 추적: 열람, 편집, 인쇄, 복사, 화면 캡처 등 모든 문서 사용 이력 기록. 감사 로그 자동 생성.
4. 출력 보안: DRM 암호화 문서에 한해 인쇄 시 워터마크 출력 지원(범용 워터마크 아님).
5. 외부 반출 제어: USB, 이메일, 클라우드 업로드 시 자동 암호화 또는 차단.
6. 대량 파일 처리: v3.2에서 배치 처리 엔진 최적화로 1,000파일 동시 처리 시 30% 속도 개선.
7. 클라우드 하이브리드: On-Premise + Cloud(AWS, Azure, GCP) 하이브리드 배포 지원.`,
        keywords: ['기능', '암호화', '접근 제어', '이력', '출력', '대량', '클라우드']
      },
      {
        id: 'ds-upgrade',
        title: 'Document SAFER 업그레이드 가이드',
        content: `Document SAFER v3.1 → v3.2 업그레이드 안내:
- 업그레이드 소요 시간: 약 30분 (서버 재시작 포함)
- 다운타임: 약 30분 (야간 작업 권장)
- 호환성: v3.0 이상에서 직접 업그레이드 가능. v2.x는 마이그레이션 필요.
- 백업: 업그레이드 전 자동 백업 수행. 롤백 기능 제공 (1시간 이내 복원 가능).
- 라이선스: 기존 라이선스 유지. 추가 비용 없음 (유지보수 계약 내).
- 교육: 업그레이드 후 1시간 온라인 교육 세션 제공.
- 주요 개선사항: 대량 파일 처리 30% 개선, 윈도우 11 완벽 지원, UI/UX 개선, 보안 패치 15건 적용.`,
        keywords: ['업그레이드', '버전', 'v3.2', '다운타임', '백업', '롤백', '교육']
      },
      {
        id: 'ds-compat',
        title: 'Document SAFER 호환성',
        content: `Document SAFER v3.2 호환성:
- Windows 10 (21H2+): 완벽 지원
- Windows 11 (22H2+): 완벽 지원 (v3.2에서 호환성 이슈 전면 해결)
- Windows Server 2019/2022: 지원
- macOS 13+: 뷰어 전용 지원
- 오피스: Microsoft Office 2016/2019/2021/365, 한글과컴퓨터 한컴오피스 2020+
- PDF: Adobe Acrobat Reader DC, Foxit Reader 지원
- CAD: AutoCAD 2020+, SolidWorks 2020+ (플러그인 방식)
- 브라우저: Chrome, Edge, Firefox (웹 뷰어)
과거 윈도우 11 호환성 문제(v3.1 이하): 커널 드라이버 충돌로 인한 블루스크린 이슈가 v3.2에서 완전 해결되었습니다.`,
        keywords: ['호환', '윈도우 11', 'Windows 11', 'macOS', '오피스', 'CAD']
      },
    ]
  },

  // SafeCopy, ContentSAFER 삭제 — 시트 원본에 없는 제품
}


// ── RA-RAG Lite: 검색 결과 재랭킹 ──
// 1차 키워드 검색 후, 질문과의 의미적 관련성을 재평가

/**
 * 검색 결과를 질문과의 관련성 기준으로 재랭킹
 * @param {string} query - 원본 질문
 * @param {object} searchResults - searchKnowledge 결과
 * @param {number} topK - 반환할 최대 청크 수
 */
export function rerankResults(query, searchResults, topK = 3) {
  if (!searchResults.chunks || searchResults.chunks.length <= 1) return searchResults

  const queryTokens = tokenize(query)
  const queryBigrams = generateBigrams(queryTokens)

  const reranked = searchResults.chunks.map((chunk, i) => {
    const originalScore = searchResults.scores?.[i] || 0

    // 1. 제목 매칭 보너스 (제목에 질문 키워드가 있으면 높은 관련성)
    const titleTokens = tokenize(chunk.title)
    const titleOverlap = queryTokens.filter(t => titleTokens.some(tt => tt.includes(t) || t.includes(tt))).length
    const titleBonus = titleOverlap * 5

    // 2. 바이그램 매칭 (연속 2단어 매칭은 단일 단어보다 높은 관련성)
    const chunkText = `${chunk.title} ${chunk.content}`.toLowerCase()
    const bigramBonus = queryBigrams.filter(bg => chunkText.includes(bg)).length * 4

    // 3. 키워드 밀도 (청크 내 질문 키워드 출현 빈도)
    const contentTokens = tokenize(chunk.content)
    const keywordDensity = queryTokens.filter(t => contentTokens.includes(t)).length / Math.max(queryTokens.length, 1)
    const densityBonus = Math.floor(keywordDensity * 10)

    // 4. 청크 길이 보너스 (더 상세한 청크 선호)
    const lengthBonus = chunk.content.length > 300 ? 2 : 0

    const finalScore = originalScore + titleBonus + bigramBonus + densityBonus + lengthBonus

    return { chunk, store: searchResults.stores?.[i] || '', score: finalScore, originalScore }
  })

  reranked.sort((a, b) => b.score - a.score)
  const top = reranked.slice(0, topK)

  return {
    chunks: top.map(r => r.chunk),
    stores: [...new Set(top.map(r => r.store))],
    scores: top.map(r => r.score),
    totalSearched: searchResults.totalSearched,
    reranked: true,
    searchType: searchResults.searchType || 'keyword',
  }
}

/**
 * 바이그램 생성 유틸리티
 */
function generateBigrams(tokens) {
  const bigrams = []
  for (let i = 0; i < tokens.length - 1; i++) {
    bigrams.push(`${tokens[i]} ${tokens[i + 1]}`)
  }
  return bigrams
}


// ── RAG 검색 엔진 ──

/**
 * 제품명으로 Store 선택 (fallback용)
 */
export function selectStore(productName) {
  const normalized = (productName || '').toLowerCase()
  if (normalized.includes('drm') || normalized.includes('저작권')) return STORES.drm
  if (normalized.includes('document') || normalized.includes('safer') || normalized.includes('문서 보안')) return STORES.document_safer
  if (normalized.includes('safecopy') || normalized.includes('출력') || normalized.includes('워터마크')) return STORES.safecopy
  if (normalized.includes('content') || normalized.includes('콘텐츠')) return STORES.content_safer
  return null
}

/**
 * 시맨틱 검색 (pgvector 우선, 실패 시 키워드 fallback)
 * [의도] 함수 시그니처 유지 → chat.js, geminiClient.js 변경 불필요
 * @param {string} query - 검색 쿼리
 * @param {string|null} productHint - 제품 힌트 (있으면 해당 Store 우선)
 * @param {number} topK - 반환할 최대 청크 수
 * @returns {{ chunks: Array, stores: string[], scores: Array }}
 */
export async function searchKnowledge(query, productHint = null, topK = 3) {
  // lazy init
  initVectorSearch()

  // ── 1차: pgvector 시맨틱 검색 시도 ──
  if (vectorSearchAvailable) {
    try {
      const vectorData = await vectorSearch(query, productHint, topK)
      if (vectorData && vectorData.length > 0) {
        const result = formatVectorResults(vectorData)
        // 벡터 검색 결과에도 재랭킹 적용 (키워드 매칭 보너스 추가)
        return rerankResults(query, result, topK)
      }
      console.log('[searchKnowledge] 벡터 검색 결과 없음 → fallback')
    } catch (err) {
      console.error('[searchKnowledge] 벡터 검색 실패:', err.message, '→ fallback')
    }
  }

  // ── 2차: 기존 in-memory 키워드 검색 (fallback) ──
  return searchKnowledgeFallback(query, productHint, topK)
}

/**
 * 기존 키워드 기반 검색 (fallback)
 */
function searchKnowledgeFallback(query, productHint = null, topK = 3) {
  const queryTokens = tokenize(query)
  const results = []

  const stores = productHint
    ? [selectStore(productHint), ...Object.values(STORES).filter(s => s.product !== productHint)]
    : Object.values(STORES)

  for (const store of stores) {
    if (!store) continue
    for (const chunk of store.chunks) {
      const score = computeRelevance(queryTokens, chunk)
      results.push({ chunk, store: store.product, score })
    }
  }

  results.sort((a, b) => b.score - a.score)
  const topResults = results.slice(0, topK)

  const rawResult = {
    chunks: topResults.map(r => r.chunk),
    stores: [...new Set(topResults.map(r => r.store))],
    scores: topResults.map(r => r.score),
    totalSearched: results.length,
    searchType: 'keyword',
  }

  return rerankResults(query, rawResult, topK)
}

/**
 * 검색 결과를 컨텍스트 문자열로 변환
 */
export function formatContext(searchResult) {
  if (!searchResult.chunks.length) return ''
  return searchResult.chunks.map((chunk, i) => (
    `[참조 ${i + 1}: ${chunk.title}]\n${chunk.content}`
  )).join('\n\n')
}

// ── 내부 유틸리티 ──

function tokenize(text) {
  return (text || '').toLowerCase()
    .replace(/[^\w가-힣\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1)
}

function computeRelevance(queryTokens, chunk) {
  const chunkText = `${chunk.title} ${chunk.content} ${(chunk.keywords || []).join(' ')}`.toLowerCase()
  const chunkTokens = new Set(tokenize(chunkText))

  let score = 0
  for (const token of queryTokens) {
    if (chunkTokens.has(token)) {
      score += 2
    }
    for (const kw of (chunk.keywords || [])) {
      if (kw.toLowerCase().includes(token) || token.includes(kw.toLowerCase())) {
        score += 3
      }
    }
    if (chunkText.includes(token)) {
      score += 1
    }
  }

  return score
}
