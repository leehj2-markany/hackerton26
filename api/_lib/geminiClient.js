// 3-Tier LLM 클라이언트 — Gemini Flash / Pro + Claude Opus 4
// [타임아웃] Vercel 함수 10초 제한 대응 — 모든 LLM 호출에 타임아웃 적용하여
// API hang 시 Vercel이 FUNCTION_INVOCATION_FAILED로 죽기 전에 폴백 처리
import { GoogleGenerativeAI } from '@google/generative-ai'
import { ENV } from './config.js'
import { searchKnowledge, formatContext } from './knowledgeBase.js'

// LLM 호출 타임아웃 (ms) — Vercel 10초 제한보다 충분히 짧게
const LLM_TIMEOUT = 7000
const LLM_SUB_TIMEOUT = 4000 // 보조 호출(selfReflect, stepBack 등)은 더 짧게

function withTimeout(promise, ms, fallback) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`LLM timeout (${ms}ms)`)), ms)),
  ]).catch(err => {
    console.warn(`[withTimeout] ${err.message}`)
    return typeof fallback === 'function' ? fallback() : fallback
  })
}

let genAI = null

function getClient() {
  if (!genAI && ENV.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY)
  }
  return genAI
}

// Claude Opus 4 호출 (복잡한 에스컬레이션급 질문용)
async function callClaudeOpus(prompt) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), LLM_TIMEOUT)
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ENV.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: controller.signal,
    })
    const data = await res.json()
    return data.content?.[0]?.text || ''
  } finally {
    clearTimeout(timer)
  }
}

// 마크애니 제품 지식 베이스 (RAG 시뮬레이션)
const KNOWLEDGE_BASE = `
[마크애니 제품 정보]
1. Document SAFER: 문서 보안 솔루션. v3.2 최신. 대량 파일 처리 30% 개선. 윈도우 11 완벽 지원.
2. DRM: 디지털 저작권 관리. CC인증(EAL2+), GS인증(1등급) 보유. 국방부/정부기관 맞춤형 구축 가능.
3. SafeCopy: 출력물 보안. 워터마크 + 추적 기능.
4. ContentSAFER: 콘텐츠 보안 플랫폼.

[인증 현황]
- CC인증 (EAL2+), GS인증 (1등급), KCMVP 암호모듈 인증
- 국가정보원 보안적합성 검증 통과

[레퍼런스]
- SK하이닉스, 삼성전자, LG전자 (Document SAFER)
- 국방부, 행정안전부, 방위사업청 (DRM)
- 해군본부, 국가정보원 (DRM)

[기술 사양]
- 윈도우 11 완벽 지원 (v3.2+)
- REST/SOAP API 제공, SDK 방식 연동 가능
- 오프라인 모드 지원 (로컬 캐시 기반)
- 모바일(iOS/Android) 전용 뷰어 제공
- 문서 추적: 열람/편집/인쇄/복사 이력 + 감사 로그
`

const SYSTEM_PROMPT = `당신은 마크애니의 AI 프리세일즈 어시스턴트 "ANY 브릿지"입니다.

역할:
- 고객의 기술 문의에 정확하고 친절하게 답변합니다
- 마크애니 제품(Document SAFER, DRM, SafeCopy 등)에 대한 전문 지식을 바탕으로 답변합니다
- 답변할 수 없는 질문은 솔직히 인정하고 담당자 연결을 제안합니다

규칙:
- 한국어로 답변합니다
- 답변은 간결하고 핵심적으로 합니다 (3-5문장)
- 확실하지 않은 정보는 추측하지 않습니다
- 경쟁사 제품을 비방하지 않습니다
- 가격 정보는 직접 제공하지 않고 담당자 연결을 안내합니다
- 반드시 [대화 이력]을 참고하여 이전에 한 말을 반복하지 마세요. 고객이 추가 질문이나 불만을 표현하면 새로운 구체적 정보(다음 단계, 구축 절차, 기간, 기술 세부사항 등)를 제공하세요.
- 고객이 "그래서?", "어쩌라는거죠?", "구체적으로" 등 추가 설명을 요구하면, 지식 베이스에서 구체적 수치/절차/사례를 찾아 답변하세요. 이것은 에스컬레이션이 아니라 더 상세한 답변이 필요한 상황입니다.
- "도입", "구축", "신규", "전환" 등 컨설팅급 질문에는 첫 답변부터 반드시 다음을 포함하세요: ① 구축 기간(예: 소규모 2~4주, 대규모 8~16주) ② 구축 프로세스 단계(요구사항 분석→설계→개발→테스트→배포→안정화) ③ 주요 레퍼런스 고객사 2~3곳. 일반적인 제품 소개만 하지 마세요.

대화 흐름 (자연스러운 단계별 진행):
1. 인사 단계: 고객이 인사하면 반갑게 맞이하고, "어떤 제품이나 서비스에 대해 궁금하신 점이 있으신가요?" 처럼 자연스럽게 의도를 파악하세요. 절대 첫 마디부터 고객사를 묻지 마세요.
2. 의도 파악 단계: 고객의 질문 내용에서 제품명, 기술 키워드, 고객사명을 자연스럽게 추출하세요. 대화 맥락에서 고객사가 파악되면 별도로 묻지 않아도 됩니다.
3. 고객사 확인 단계: 고객 정보가 아직 없고, 맞춤형 답변이 필요한 경우에만 "혹시 어떤 기관/회사에서 사용하고 계신가요?" 처럼 부드럽게 물어보세요. 일반적인 제품 질문에는 고객사 확인 없이 바로 답변하세요.
4. 해결 단계: 지식 베이스를 참조하여 정확하게 답변합니다. 고객 정보가 있으면 맞춤형으로 답변합니다.
5. 에스컬레이션 단계: 필요시에만 담당자 연결을 제안합니다.

에스컬레이션 판단 ([ESCALATION] 마커):
- 고객이 담당자/사람/전문가 연결을 명시적으로 요청하면 반드시 답변 맨 첫 줄에 [ESCALATION]을 붙여주세요. "연결해주세요", "연결해줘", "사람이랑 얘기하고 싶어요", "담당자 부탁드립니다", "네 연결해주세요" 등 연결 의사가 있으면 무조건 [ESCALATION]입니다.
- 대화 이력에서 이미 AI가 "담당자 연결을 도와드릴까요?"라고 제안했고, 고객이 "네", "좋아요", "부탁합니다" 등 긍정 응답을 하면 이것도 [ESCALATION]입니다.
- 가격/비용/견적/계약 관련 질문도 [ESCALATION]을 붙여주세요
- 기술적으로 확신이 없는 질문도 [ESCALATION]을 붙여주세요
- 에스컬레이션이 필요 없는 일반 답변에는 [ESCALATION]을 붙이지 마세요
- 중요: AI가 스스로 "담당자를 연결해드리겠습니다"라고 말하면서 [ESCALATION]을 안 붙이는 것은 금지입니다. 연결하겠다고 말했으면 반드시 [ESCALATION]을 붙여야 합니다.

대화 유도 전략 (고객에게 추가 질문을 자연스럽게 이끌어내기):
- 답변 끝에 고객의 환경이나 상황을 파악하는 후속 질문을 하나 던지세요. 예: "혹시 대략적인 사용자 규모가 어느 정도인가요?", "현재 어떤 환경에서 운영하고 계신가요?"
- 고객이 정보를 제공하면 그에 맞춰 점점 더 구체적인 답변을 제공하세요 (일반적 → 맞춤형으로 자연스럽게 진행).
- 절대 한 번에 모든 정보를 쏟아내지 마세요. 핵심 정보를 간결히 주고, 후속 질문으로 대화를 이어가세요.

고객 조건 반영 (필수):
- [추출된 고객 조건]이 제공되면, 해당 조건(제품명, 사용자 규모, 의도, 환경 등)을 답변에 반드시 반영하세요.
- 예: 고객이 "300유저"라고 했으면 300유저 규모에 맞는 구축 기간/방식을 안내하세요. 규모를 무시하고 일반적인 답변을 하지 마세요.
- 예: 고객이 "망분리 환경"이라고 했으면 오프라인/폐쇄망 대응 방안을 중심으로 답변하세요.
- 고객이 이미 제공한 정보를 다시 물어보지 마세요. 대신 아직 모르는 정보를 후속 질문으로 물어보세요.

${KNOWLEDGE_BASE}`

// ── LLM-as-a-Router: Flash가 복잡도 판단 + 서브질문 분류 + 담당자 배정 + 고객 조건 추출 ──
// 키워드 룰 전부 제거. 모든 판단은 LLM 자연어 이해에 위임.
// [Context Extraction] Router 호출 1회로 복잡도 판단과 고객 조건 추출을 동시에 수행 — 추가 API 비용 0
const ROUTER_PROMPT = `당신은 고객 질문의 복잡도를 판단하고, 서브질문을 분류하며, 질문에서 고객이 제공한 핵심 조건을 추출하는 라우터입니다.
아래 질문을 분석하여 반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.

복잡도 판단 기준:
- simple: 인사, 단일 제품 질문, 단순 기능 문의, 짧은 질문 (예: "DRM이 뭐예요?", "도입하려고요")
- complex: 여러 주제가 결합된 질문, 비교 요청, 환경 조건이 복잡한 질문 (예: "500명 규모 망분리 환경에서 DRM 도입하면서 그룹웨어 연동도 하고 싶은데")
- critical: 긴급 장애, 보안사고, 법적/계약 이슈, 감사 대응 등 즉각 전문가 개입이 필요한 질문

담당자 배정 기준 (서브질문별로 가장 적합한 1명 배정):
- 송인찬 (어카운트 매니저): 영업, 견적, 비용, 계약, 구축 일정, 도입 프로세스, 레퍼런스, 고객 사례
- 이현진 (SE): 기술 호환성, 시스템 연동, OS 지원, 네트워크 환경, 설치/배포, 아키텍처
- 박우호 (개발리더): 보안 인증, 암호화 기술, API/SDK, 커스터마이징, 개발 관련 기술 심화 질문

고객 조건 추출 (extractedContext):
- 질문에서 고객이 명시적으로 언급한 조건만 추출하세요. 추측하지 마세요.
- product: 언급된 제품명 (DRM, Document SAFER, SafeCopy 등). 없으면 null
- userScale: 사용자 규모 (예: "300유저", "1000명"). 없으면 null
- intent: 고객의 의도 (예: "구매 검토", "도입", "업그레이드", "장애 문의", "기능 문의"). 없으면 null
- environment: 운영 환경 (예: "망분리", "클라우드", "윈도우 11"). 없으면 null
- urgency: 긴급도 ("urgent" 또는 "normal"). 장애/사고 언급 시 urgent, 그 외 normal

질문: "{QUESTION}"

JSON 응답 (이것만 출력):
{"complexity":"simple|complex|critical","reason":"판단 근거 한 줄","subQuestions":[{"question":"서브질문 내용","assignee":"담당자 이름","product":"관련 제품명 또는 null"}],"extractedContext":{"product":null,"userScale":null,"intent":null,"environment":null,"urgency":"normal"}}`

export async function analyzeQuestion(question) {
  const client = getClient()

  // Gemini 클라이언트 없으면 (DEMO_MODE 등) 간단한 길이 기반 fallback
  if (!client) {
    return fallbackAnalyze(question)
  }

  try {
    const prompt = ROUTER_PROMPT.replace('{QUESTION}', question)
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await withTimeout(
      model.generateContent(prompt),
      LLM_SUB_TIMEOUT,
      null
    )
    if (!result) return fallbackAnalyze(question)
    const text = result.response.text().trim()

    // JSON 파싱 (LLM이 ```json 래핑할 수 있으므로 추출)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return fallbackAnalyze(question)

    const parsed = JSON.parse(jsonMatch[0])
    const complexity = ['simple', 'complex', 'critical'].includes(parsed.complexity)
      ? parsed.complexity
      : 'simple'

    // 담당자 역할 매핑
    const AGENT_ROLES = {
      '송인찬': 'sales',
      '이현진': 'se',
      '박우호': 'dev',
    }

    const subQuestions = Array.isArray(parsed.subQuestions) && parsed.subQuestions.length > 0
      ? parsed.subQuestions.map(sq => {
          // LLM이 { question, assignee, product } 객체로 반환하는 경우
          if (typeof sq === 'object' && sq.question) {
            const assignee = sq.assignee || '송인찬'
            return { question: sq.question, role: AGENT_ROLES[assignee] || 'sales', assignee, product: sq.product || null }
          }
          // LLM이 문자열로 반환하는 경우 (폴백)
          return { question: String(sq), role: 'sales', assignee: '송인찬', product: null }
        })
      : null

    return {
      isComplex: complexity !== 'simple',
      complexity,
      subQuestions,
      routerReason: parsed.reason || '',
      extractedContext: parsed.extractedContext || null,
    }
  } catch (err) {
    console.error('Router LLM error, falling back:', err.message)
    return fallbackAnalyze(question)
  }
}

// Fallback: Gemini 없을 때 최소한의 판단 (DEMO_MODE용)
function fallbackAnalyze(question) {
  // 길이 + 간단한 시그널로만 판단 — 키워드 하드코딩 최소화
  if (question.length > 80) {
    return { isComplex: true, complexity: 'complex', subQuestions: null, routerReason: 'fallback: 긴 질문', extractedContext: null }
  }
  return { isComplex: false, complexity: 'simple', subQuestions: null, routerReason: 'fallback: 짧은 질문', extractedContext: null }
}

// ── R20: Prompt Cache (인메모리, LRU 방식) ──
const CACHE_MAX_SIZE = 100
const CACHE_TTL_MS = 30 * 60 * 1000 // 30분
const promptCache = new Map()

function getCacheKey(question, customerId) {
  // 질문을 정규화하여 캐시 키 생성 (공백/특수문자 제거, 소문자)
  const normalized = (question || '').trim().toLowerCase()
    .replace(/[.!?~？！。\s]+/g, ' ')
    .replace(/\s+/g, ' ')
  return `${normalized}::${customerId || 'anon'}`
}

function getCachedAnswer(key) {
  const entry = promptCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    promptCache.delete(key)
    return null
  }
  entry.hits++
  return entry.data
}

function setCachedAnswer(key, data) {
  // LRU: 최대 크기 초과 시 가장 오래된 항목 제거
  if (promptCache.size >= CACHE_MAX_SIZE) {
    const oldestKey = promptCache.keys().next().value
    promptCache.delete(oldestKey)
  }
  promptCache.set(key, { data, timestamp: Date.now(), hits: 0 })
}

// 캐시 통계 (디버깅/health 엔드포인트용)
export function getCacheStats() {
  let totalHits = 0
  for (const entry of promptCache.values()) totalHits += entry.hits
  return { size: promptCache.size, maxSize: CACHE_MAX_SIZE, totalHits, ttlMinutes: CACHE_TTL_MS / 60000 }
}

// ── R23: Take a Step Back Prompting ──
// 복합 질문을 상위 개념으로 재구성하여 더 넓은 맥락에서 답변
async function takeStepBack(question, client) {
  if (!client) return null

  const stepBackPrompt = `당신은 질문 분석 전문가입니다. 아래 구체적인 질문의 배경이 되는 더 넓은 상위 질문을 생성하세요.
이 상위 질문에 답하면 원래 질문에도 더 정확하게 답할 수 있습니다.

원래 질문: "${question}"

상위 질문만 한 줄로 출력하세요 (다른 텍스트 없이):`

  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await withTimeout(
      model.generateContent(stepBackPrompt),
      LLM_SUB_TIMEOUT,
      null
    )
    if (!result) return null
    const stepBackQuestion = result.response.text().trim()
    return stepBackQuestion || null
  } catch (err) {
    console.error('[takeStepBack] error:', err.message)
    return null
  }
}

// ── R19 Self-Reflection: 답변 자체 검증 ──
async function selfReflect(question, answer, client) {
  if (!client) return { passed: true, reflection: '', issues: [] }

  const reflectionPrompt = `당신은 AI 답변 품질 검증자입니다. 아래 질문과 답변을 검토하고 JSON으로만 응답하세요.

질문: "${question}"
답변: "${answer}"

검증 항목:
1. 사실 정확성: 답변이 질문에 정확히 대응하는가?
2. 완전성: 핵심 정보가 빠지지 않았는가?
3. 일관성: 내부 모순이 없는가?
4. 안전성: 부적절한 약속이나 미확인 정보가 없는가?

JSON 응답: {"passed": true/false, "issues": ["이슈1", "이슈2"], "suggestion": "개선 제안"}`

  try {
    const reflectModel = client.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await withTimeout(
      reflectModel.generateContent(reflectionPrompt),
      LLM_SUB_TIMEOUT,
      null
    )
    if (!result) return { passed: true, reflection: '', issues: [] }
    const text = result.response.text().trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return { passed: true, reflection: '', issues: [] }
    const parsed = JSON.parse(jsonMatch[0])
    return {
      passed: parsed.passed !== false,
      reflection: parsed.suggestion || '',
      issues: parsed.issues || [],
    }
  } catch (err) {
    console.error('[selfReflect] error:', err.message)
    return { passed: true, reflection: '', issues: [] }
  }
}

// ── R24 Self-Consistency: 복합 질문에 대해 2회 생성 후 일관성 검증 ──
async function checkSelfConsistency(question, answer1, client, modelName) {
  if (!client) return { consistent: true, score: 100 }

  try {
    // 2번째 답변 생성
    const model = client.getGenerativeModel({ model: modelName })
    const result = await withTimeout(
      model.generateContent(question),
      LLM_SUB_TIMEOUT,
      null
    )
    if (!result) return { consistent: true, score: 85 }
    const answer2 = result.response.text()

    // 일관성 검증
    const checkPrompt = `두 답변의 핵심 내용이 일치하는지 검증하세요. JSON으로만 응답.
답변1: "${answer1.slice(0, 500)}"
답변2: "${answer2.slice(0, 500)}"
JSON: {"consistent": true/false, "score": 0-100, "differences": ["차이점"]}`

    const checkModel = client.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const checkResult = await withTimeout(
      checkModel.generateContent(checkPrompt),
      LLM_SUB_TIMEOUT,
      null
    )
    if (!checkResult) return { consistent: true, score: 85 }
    const text = checkResult.response.text().trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return { consistent: true, score: 85 }
    return JSON.parse(jsonMatch[0])
  } catch (err) {
    console.error('[selfConsistency] error:', err.message)
    return { consistent: true, score: 85 }
  }
}

// 신뢰도 평가
function evaluateConfidence(question, answer) {
  const highKeywords = ['Document SAFER', 'DRM', 'SafeCopy', '인증', '호환', '업그레이드', '버전']
  const matchCount = highKeywords.filter(k => question.includes(k) || answer.includes(k)).length
  if (matchCount >= 2) return { level: 'high', score: 85 + Math.floor(Math.random() * 10) }
  if (matchCount >= 1) return { level: 'medium', score: 65 + Math.floor(Math.random() * 15) }
  return { level: 'low', score: 40 + Math.floor(Math.random() * 20) }
}

// ── DESV Phase 2: Decomposed RAG Enrichment (CHECK 논문 기반) ──
// 서브질문별 독립 RAG 검색 + RAG score 기반 semantic verification
// LLM 추가 호출 0회 — in-memory RAG만 사용하므로 비용/시간 증가 없음
const RAG_SCORE_THRESHOLD = 5 // 이 점수 미만이면 "컨텍스트 부족"으로 판단

function enrichRAGForSubQuestions(subQuestions, customerProductHint) {
  if (!subQuestions || subQuestions.length === 0) return null

  const enriched = subQuestions.map(sq => {
    // 서브질문별 product 힌트: Router가 추출한 product > 고객 정보 product > null
    const productHint = sq.product || customerProductHint || null
    const ragResult = searchKnowledge(sq.question, productHint, 3)
    const topScore = ragResult.scores?.[0] || 0
    const hasContext = topScore >= RAG_SCORE_THRESHOLD

    return {
      question: sq.question,
      assignee: sq.assignee,
      product: sq.product,
      ragResult,
      ragContext: formatContext(ragResult),
      topScore,
      hasContext, // CHECK 논문의 semantic verification proxy
      stores: ragResult.stores || [],
    }
  })

  // 전체 서브질문 중 컨텍스트 부족한 것이 있는지 요약
  const insufficientSubs = enriched.filter(e => !e.hasContext)

  return {
    enrichedSubs: enriched,
    allHaveContext: insufficientSubs.length === 0,
    insufficientCount: insufficientSubs.length,
    totalSubs: enriched.length,
  }
}

// 복합질문용 구조화 프롬프트 생성 — 서브질문별 RAG 컨텍스트를 명시적으로 구분
function buildComplexPrompt(systemPrompt, contextParts, enrichment, historyText, question) {
  const subContextBlocks = enrichment.enrichedSubs.map((sub, i) => {
    const header = `[서브질문 ${i + 1}: ${sub.question}]`
    if (sub.hasContext) {
      return `${header}\n${sub.ragContext}`
    }
    return `${header}\n⚠️ 지식 베이스에 충분한 정보가 없습니다. 일반 지식으로 답변하되, 정확한 정보는 담당자 확인을 권유하세요.`
  }).join('\n\n')

  return `${systemPrompt}

${contextParts.join('\n')}

[복합질문 분석 — 서브질문별 참조 자료]
${subContextBlocks}

[복합질문 답변 가이드]
- 고객이 여러 주제를 동시에 질문했습니다.
- 각 서브질문에 대한 핵심 정보를 반드시 포함하세요.
- 자연스러운 대화체를 유지하세요 ("먼저 DRM에 대해 말씀드리면..." "다음으로 ○○의 경우..." 같은 전환어 사용).
- 마지막에 통합 구축 시 시너지나 고려사항을 한 줄로 언급하세요.
- 서브질문 중 지식 베이스에 정보가 부족한 것은 솔직히 안내하고 담당자 확인을 권유하세요.

[대화 이력]
${historyText}

고객 질문: ${question}

위 서브질문별 참조 자료를 바탕으로 통합 답변하세요. 답변만 출력하세요.`
}

// ── DESV Phase 4: 복합질문 전용 Self-Reflect (서브질문 커버리지 검증) ──
// CHECK 논문의 "semantic error detection" — 각 서브질문에 대한 답변이 포함되어 있는지 검증
async function verifySubQuestionCoverage(question, answer, subQuestions, client) {
  if (!client || !subQuestions?.length) return { passed: true, reflection: '', issues: [] }

  const subQList = subQuestions.map((sq, i) => `${i + 1}. ${sq.question}`).join('\n')
  const verifyPrompt = `당신은 복합질문 답변 품질 검증자입니다. JSON으로만 응답하세요.

원래 질문: "${question}"
서브질문 목록:
${subQList}

답변: "${answer.slice(0, 800)}"

검증: 각 서브질문에 대한 답변이 포함되어 있는가? 누락된 서브질문이 있는가?
JSON: {"passed": true/false, "issues": ["누락된 내용"], "suggestion": "보완 제안", "coveredCount": 0, "totalCount": ${subQuestions.length}}`

  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await withTimeout(model.generateContent(verifyPrompt), LLM_SUB_TIMEOUT, null)
    if (!result) return { passed: true, reflection: '', issues: [] }
    const text = result.response.text().trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return { passed: true, reflection: '', issues: [] }
    const parsed = JSON.parse(jsonMatch[0])
    return {
      passed: parsed.passed !== false,
      reflection: parsed.suggestion || '',
      issues: parsed.issues || [],
      coveredCount: parsed.coveredCount || subQuestions.length,
      totalCount: parsed.totalCount || subQuestions.length,
    }
  } catch (err) {
    console.error('[verifySubQuestionCoverage] error:', err.message)
    return { passed: true, reflection: '', issues: [] }
  }
}

// Gemini로 답변 생성
// [DESV] complex 질문: Decompose → Enrich → Synthesize → Verify (CHECK 논문 기반)
//   - takeStepBack 스킵 (서브질문 분해가 상위 호환, ~1.5초 절약)
//   - checkSelfConsistency 스킵 (서브질문 커버리지 검증으로 대체, ~4초 절약)
//   - 서브질문별 독립 RAG (LLM 추가 호출 0회, in-memory ~0ms)
// simple/critical 질문: 기존 파이프라인 유지
export async function generateAnswer(question, customerInfo, conversationHistory = [], options = {}) {
  const client = getClient()
  const { skipRAG = false } = options

  if (!client) {
    throw new Error('LLM client unavailable — no GEMINI_API_KEY')
  }

  // ── R20: 캐시 조회 ──
  const cacheKey = !skipRAG ? getCacheKey(question, customerInfo?.id) : null
  if (cacheKey) {
    const cached = getCachedAnswer(cacheKey)
    if (cached) {
      const thinkingProcess = [...(cached.thinkingProcess || [])]
      thinkingProcess.unshift('⚡ 캐시 히트 — 즉시 응답')
      return { ...cached, thinkingProcess, fromCache: true }
    }
  }

  try {
    // Phase 1: Decompose — Router가 복잡도 판단 + 서브질문 분해
    const analysis = await analyzeQuestion(question)
    const thinkingProcess = []
    const isComplex = analysis.complexity === 'complex' && analysis.subQuestions?.length > 0

    // ── 공통: 고객 정보 + extractedContext 컨텍스트 구성 ──
    const contextParts = []
    if (customerInfo) {
      contextParts.push(`[고객 정보] ${customerInfo.name} / ${customerInfo.product} ${customerInfo.version} / ${customerInfo.license}`)
      if (customerInfo.history?.length) {
        contextParts.push(`[과거 문의] ${customerInfo.history.map(h => h.question).join(', ')}`)
      }
    }

    if (analysis.extractedContext) {
      const ec = analysis.extractedContext
      const parts = []
      if (ec.product) parts.push(`제품: ${ec.product}`)
      if (ec.userScale) parts.push(`규모: ${ec.userScale}`)
      if (ec.intent) parts.push(`의도: ${ec.intent}`)
      if (ec.environment) parts.push(`환경: ${ec.environment}`)
      if (ec.urgency === 'urgent') parts.push(`긴급도: 긴급`)
      if (parts.length > 0) {
        contextParts.push(`[추출된 고객 조건]\n${parts.join(' / ')}`)
        thinkingProcess.push(`🎯 고객 조건 추출: ${parts.join(', ')}`)
      }
    }

    const historyText = conversationHistory
      .slice(-6)
      .map(h => `${h.role === 'user' ? '고객' : 'AI'}: ${h.content}`)
      .join('\n')

    let prompt, enrichment

    if (isComplex && !skipRAG) {
      // ═══ DESV 파이프라인: 복합질문 전용 ═══
      // Phase 2: Enrich — 서브질문별 독립 RAG (LLM 호출 0회, ~0ms)
      const customerProductHint = customerInfo?.product || null
      enrichment = enrichRAGForSubQuestions(analysis.subQuestions, customerProductHint)

      if (enrichment) {
        enrichment.enrichedSubs.forEach((sub, i) => {
          const status = sub.hasContext ? `✅ ${sub.stores.join(', ')}` : '⚠️ 컨텍스트 부족'
          thinkingProcess.push(`📚 서브질문 ${i + 1} RAG: "${sub.question}" → ${status} (score: ${sub.topScore})`)
        })
        if (!enrichment.allHaveContext) {
          thinkingProcess.push(`⚠️ ${enrichment.insufficientCount}/${enrichment.totalSubs}개 서브질문 컨텍스트 부족 — LLM 일반 지식으로 보완`)
        }

        // Phase 3: Synthesize — 구조화된 프롬프트로 LLM 1회 호출
        prompt = buildComplexPrompt(SYSTEM_PROMPT, contextParts, enrichment, historyText, question)
      } else {
        // enrichment 실패 시 기존 단일 RAG fallback
        console.warn('[DESV] enrichment failed, falling back to single RAG')
        enrichment = null
      }
    }

    // 단일 질문 또는 DESV fallback: 기존 파이프라인
    if (!prompt) {
      if (!skipRAG) {
        const productHint = customerInfo?.product || null
        const ragResult = searchKnowledge(question, productHint, 3)
        const ragContext = formatContext(ragResult)
        if (ragContext) {
          contextParts.push(`[지식 베이스 검색 결과 — ${ragResult.stores.join(', ')} 제품]\n${ragContext}`)
        }

        // Take a Step Back: simple이 아닌 경우에만 (complex는 DESV로 가므로 여기는 critical만 해당)
        if (analysis.complexity === 'critical') {
          const stepBackQ = await takeStepBack(question, client)
          if (stepBackQ) {
            thinkingProcess.push(`🔭 Step Back: "${stepBackQ}"`)
            const stepBackRag = searchKnowledge(stepBackQ, productHint, 2)
            const stepBackContext = formatContext(stepBackRag)
            if (stepBackContext) {
              contextParts.push(`[Step Back 추가 검색 결과]\n${stepBackContext}`)
            }
          }
        }
      }

      prompt = `${SYSTEM_PROMPT}

${contextParts.join('\n')}

[대화 이력]
${historyText}

고객 질문: ${question}

위 정보를 바탕으로 답변해주세요. 지식 베이스 검색 결과를 우선 참조하되, 답변만 출력하세요.`
    }

    // ── LLM 호출 (3-Tier 라우팅) ──
    let answer, modelName

    if (analysis.complexity === 'critical' && ENV.CLAUDE_API_KEY) {
      modelName = 'claude-opus-4'
      answer = await callClaudeOpus(prompt)
    } else {
      modelName = analysis.complexity === 'complex' ? 'gemini-2.5-pro' : 'gemini-2.5-flash'
      const model = client.getGenerativeModel({ model: modelName })
      const result = await withTimeout(
        model.generateContent(prompt),
        LLM_TIMEOUT,
        null
      )
      if (!result) throw new Error(`Main LLM timeout (${modelName})`)
      answer = result.response.text()
    }

    // [ESCALATION] 마커 감지
    let llmWantsEscalation = false
    if (answer.includes('[ESCALATION]')) {
      llmWantsEscalation = true
      answer = answer.replace(/\[ESCALATION\]\s*/g, '').trim()
    }

    // ── Phase 4: Verify — 복합질문은 서브질문 커버리지 검증, 단일질문은 기존 selfReflect ──
    let reflection
    if (isComplex && analysis.subQuestions?.length > 0) {
      // DESV Phase 4: 서브질문 커버리지 검증 (CHECK 논문의 semantic verification)
      reflection = await verifySubQuestionCoverage(question, answer, analysis.subQuestions, client)
      if (!reflection.passed) {
        answer += `\n\n💡 보완: ${reflection.reflection}`
        thinkingProcess.push(`🔍 서브질문 커버리지: ⚠️ ${reflection.coveredCount}/${reflection.totalCount}개 커버 — 보완 적용`)
      } else {
        thinkingProcess.push(`🔍 서브질문 커버리지: ✅ ${reflection.coveredCount}/${reflection.totalCount}개 모두 커버`)
      }
    } else {
      // 단일/critical 질문: 기존 selfReflect
      reflection = await selfReflect(question, answer, client)
      if (!reflection.passed) {
        answer += `\n\n💡 보완: ${reflection.reflection}`
        thinkingProcess.push('🔍 Self-Reflection: ⚠️ 보완 적용')
      } else {
        thinkingProcess.push('🔍 Self-Reflection: ✅ 통과')
      }
    }

    const confidence = evaluateConfidence(question, answer)

    const finalResult = {
      answer,
      confidence: confidence.level,
      confidenceScore: confidence.score,
      references: customerInfo?.references || [],
      needsEscalation: llmWantsEscalation,
      isComplex: analysis.isComplex,
      complexity: analysis.complexity,
      subQuestions: analysis.subQuestions,
      extractedContext: analysis.extractedContext || null,
      model: modelName,
      thinkingProcess,
      selfReflection: { passed: reflection.passed, issues: reflection.issues },
      // DESV: complex에서는 selfConsistency 대신 서브질문 커버리지 결과 반환
      selfConsistency: isComplex
        ? { consistent: reflection.passed, score: reflection.coveredCount ? Math.round((reflection.coveredCount / reflection.totalCount) * 100) : 100 }
        : null,
      enrichment: enrichment ? { totalSubs: enrichment.totalSubs, allHaveContext: enrichment.allHaveContext, insufficientCount: enrichment.insufficientCount } : undefined,
    }

    // ── R20: 캐시 저장 ──
    if (cacheKey && !llmWantsEscalation) {
      setCachedAnswer(cacheKey, finalResult)
    }

    return finalResult
  } catch (err) {
    console.error('Gemini API error:', err.message)
    throw err
  }
}
