// 마크애니 제품 지식 베이스 — RAG 검색용 문서 청크
// 정책기능서 기반 제품별 상세 정보 (File Search Store 시뮬레이션)

// ── 제품별 Store 분리 (Gemini File Search Store 패턴) ──
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
4. 출력 보안: 인쇄 시 워터마크 자동 삽입. 출력물 추적 코드 포함.
5. 외부 반출 제어: USB, 이메일, 클라우드 업로드 시 자동 암호화 또는 차단.
6. 대량 파일 처리: v3.2에서 배치 처리 엔진 최적화로 1,000파일 동시 처리 시 30% 속도 개선.
7. 클라우드 하이브리드: On-Premise + Cloud(AWS, Azure, GCP) 하이브리드 배포 지원.`,
        keywords: ['기능', '암호화', '접근 제어', '이력', '출력', '워터마크', '대량', '클라우드']
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

  safecopy: {
    id: 'store_safecopy',
    product: 'SafeCopy',
    chunks: [
      {
        id: 'sc-overview',
        title: 'SafeCopy 제품 개요',
        content: `SafeCopy는 출력물 보안 솔루션으로, 인쇄 문서에 비가시적 워터마크를 삽입하여 유출 시 출력자를 추적할 수 있습니다. 복사기/스캐너를 통한 2차 유출도 추적 가능합니다. 주요 기능: 비가시적 워터마크 삽입, 출력자 추적, 출력 정책 관리, 출력 이력 감사, 복사/스캔 추적. 국방부, 금융기관, 대기업 등 보안이 중요한 환경에서 널리 사용됩니다.`,
        keywords: ['SafeCopy', '출력물', '워터마크', '추적', '인쇄']
      },
    ]
  },

  content_safer: {
    id: 'store_content_safer',
    product: 'ContentSAFER',
    chunks: [
      {
        id: 'cs-overview',
        title: 'ContentSAFER 제품 개요',
        content: `ContentSAFER는 디지털 콘텐츠(영상, 이미지, 음원 등)의 저작권을 보호하는 솔루션입니다. 포렌식 워터마킹 기술로 콘텐츠에 비가시적 식별 정보를 삽입하여 불법 복제 및 유출 경로를 추적합니다. OTT 플랫폼, 방송사, 영화 배급사 등에서 사용됩니다. 주요 기능: 포렌식 워터마킹, 실시간 스트리밍 워터마킹, 콘텐츠 추적, 불법 복제 탐지.`,
        keywords: ['ContentSAFER', '콘텐츠', '워터마킹', '포렌식', '저작권', 'OTT']
      },
    ]
  },
}


// ── RAG 검색 엔진 (Gemini File Search 시뮬레이션) ──

/**
 * 제품명으로 Store 선택
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
 * 키워드 기반 시맨틱 검색 (TF-IDF 경량 시뮬레이션)
 * @param {string} query - 검색 쿼리
 * @param {string|null} productHint - 제품 힌트 (있으면 해당 Store 우선)
 * @param {number} topK - 반환할 최대 청크 수
 * @returns {{ chunks: Array, store: string, scores: Array }}
 */
export function searchKnowledge(query, productHint = null, topK = 3) {
  const queryTokens = tokenize(query)
  const results = []

  // 제품 힌트가 있으면 해당 Store 우선 검색
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

  // 점수 내림차순 정렬 후 topK 반환
  results.sort((a, b) => b.score - a.score)
  const topResults = results.slice(0, topK)

  return {
    chunks: topResults.map(r => r.chunk),
    stores: [...new Set(topResults.map(r => r.store))],
    scores: topResults.map(r => r.score),
    totalSearched: results.length,
  }
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
  // 한국어 + 영어 토큰화 (공백 + 조사 분리)
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
    // 정확 매칭
    if (chunkTokens.has(token)) {
      score += 2
    }
    // 부분 매칭 (키워드에 포함)
    for (const kw of (chunk.keywords || [])) {
      if (kw.toLowerCase().includes(token) || token.includes(kw.toLowerCase())) {
        score += 3 // 키워드 매칭은 가중치 높음
      }
    }
    // 본문 부분 매칭
    if (chunkText.includes(token)) {
      score += 1
    }
  }

  return score
}
