// 3-Tier LLM 클라이언트 — Gemini Flash / Pro + Claude Opus 4
import { GoogleGenerativeAI } from '@google/generative-ai'
import { ENV } from './config.js'
import { searchKnowledge, formatContext } from './knowledgeBase.js'

let genAI = null

function getClient() {
  if (!genAI && ENV.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY)
  }
  return genAI
}

// Claude Opus 4 호출 (복잡한 에스컬레이션급 질문용)
async function callClaudeOpus(prompt) {
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
  })
  const data = await res.json()
  return data.content?.[0]?.text || ''
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

에스컬레이션 판단:
- 고객이 담당자/사람/전문가 연결을 요청하면 답변 맨 첫 줄에 [ESCALATION]을 붙여주세요
- 가격/비용/견적/계약 관련 질문도 [ESCALATION]을 붙여주세요
- 기술적으로 확신이 없는 질문도 [ESCALATION]을 붙여주세요
- 에스컬레이션이 필요 없는 일반 답변에는 [ESCALATION]을 붙이지 마세요

${KNOWLEDGE_BASE}`

// CHECK 시맨틱 분석: 복합 질문 분해 + 복잡도 레벨
export function analyzeQuestion(question) {
  // 도입/구축/전환 등 컨설팅급 질문은 짧아도 complex로 올림 (Pro 모델 라우팅)
  const consultingKeywords = ['도입', '구축', '신규', '검토', '전환', '마이그레이션', '교체', '적용']
  const isConsulting = consultingKeywords.some(k => question.includes(k))

  if (isConsulting) {
    const subQuestions = [
      { question: '도입/구축 컨설팅', role: 'sales', assignee: '송인찬' },
      { question: '기술 환경 분석', role: 'se', assignee: '이현진' },
    ]
    return { isComplex: true, complexity: 'complex', subQuestions }
  }

  const markers = ['?', '그리고', '또한', '와', '과', '및', '아울러']
  const hasMarkers = markers.some(m => question.includes(m)) && question.length > 30

  if (!hasMarkers) {
    return { isComplex: false, complexity: 'simple', subQuestions: null }
  }

  // 간단한 규칙 기반 분해 (데모용)
  const subQuestions = []
  if (question.includes('구축') || question.includes('가능')) {
    subQuestions.push({ question: '맞춤형 구축 가능성', role: 'sales', assignee: '송인찬' })
  }
  if (question.includes('호환') || question.includes('윈도우')) {
    subQuestions.push({ question: '윈도우 11 호환성', role: 'se', assignee: '이현진' })
  }
  if (question.includes('보안') || question.includes('인증')) {
    subQuestions.push({ question: '보안 인증 요구사항', role: 'dev', assignee: '박우호' })
  }
  if (question.includes('비용') || question.includes('가격') || question.includes('기간')) {
    subQuestions.push({ question: '비용 및 일정', role: 'sales', assignee: '송인찬' })
  }
  if (question.includes('연동') || question.includes('시스템')) {
    subQuestions.push({ question: '시스템 연동', role: 'se', assignee: '이현진' })
  }

  if (subQuestions.length === 0) {
    subQuestions.push({ question: question.slice(0, 30), role: 'sales', assignee: '송인찬' })
  }

  const isComplex = subQuestions.length > 1
  // 3개 이상 서브질문 또는 에스컬레이션 키워드 → critical (Claude Opus)
  const escalationKeywords = ['긴급', '장애', '보안사고', '법적', '계약', '소송', '감사']
  const isCritical = subQuestions.length >= 2 || escalationKeywords.some(k => question.includes(k))
  const complexity = isCritical ? 'critical' : isComplex ? 'complex' : 'simple'

  return { isComplex, complexity, subQuestions }
}

// 신뢰도 평가
function evaluateConfidence(question, answer) {
  const highKeywords = ['Document SAFER', 'DRM', 'SafeCopy', '인증', '호환', '업그레이드', '버전']
  const matchCount = highKeywords.filter(k => question.includes(k) || answer.includes(k)).length
  if (matchCount >= 2) return { level: 'high', score: 85 + Math.floor(Math.random() * 10) }
  if (matchCount >= 1) return { level: 'medium', score: 65 + Math.floor(Math.random() * 15) }
  return { level: 'low', score: 40 + Math.floor(Math.random() * 20) }
}

// Gemini로 답변 생성
export async function generateAnswer(question, customerInfo, conversationHistory = [], options = {}) {
  const client = getClient()
  const { skipRAG = false } = options

  // DEMO_MODE이거나 Gemini 클라이언트 없으면 mock 답변
  if (ENV.DEMO_MODE || !client) {
    return generateMockAnswer(question, customerInfo)
  }

  try {
    // 3-Tier LLM 라우팅:
    //   simple  → Gemini 2.5 Flash (~4s, 속도 우선)
    //   complex → Gemini 2.5 Pro (~15s, 정확도 우선)
    //   critical → Claude Opus 4 (~20s, 최고 성능)
    const analysis = analyzeQuestion(question)

    const contextParts = []
    if (customerInfo) {
      contextParts.push(`[고객 정보] ${customerInfo.name} / ${customerInfo.product} ${customerInfo.version} / ${customerInfo.license}`)
      if (customerInfo.history?.length) {
        contextParts.push(`[과거 문의] ${customerInfo.history.map(h => h.question).join(', ')}`)
      }
    }

    // RAG: 인사/간단 입력이면 스킵, 그 외에는 지식 베이스 검색
    if (!skipRAG) {
      const productHint = customerInfo?.product || null
      const ragResult = searchKnowledge(question, productHint, 3)
      const ragContext = formatContext(ragResult)
      if (ragContext) {
        contextParts.push(`[지식 베이스 검색 결과 — ${ragResult.stores.join(', ')} 제품]\n${ragContext}`)
      }
    }

    const historyText = conversationHistory
      .slice(-6)
      .map(h => `${h.role === 'user' ? '고객' : 'AI'}: ${h.content}`)
      .join('\n')

    const prompt = `${SYSTEM_PROMPT}

${contextParts.join('\n')}

[대화 이력]
${historyText}

고객 질문: ${question}

위 정보를 바탕으로 답변해주세요. 지식 베이스 검색 결과를 우선 참조하되, 답변만 출력하세요.`

    let answer, modelName

    if (analysis.complexity === 'critical' && ENV.CLAUDE_API_KEY) {
      // Critical → Claude Opus 4
      modelName = 'claude-opus-4'
      answer = await callClaudeOpus(prompt)
    } else {
      // Simple → Flash, Complex → Pro
      modelName = analysis.complexity === 'complex' ? 'gemini-2.5-pro' : 'gemini-2.5-flash'
      const model = client.getGenerativeModel({ model: modelName })
      const result = await model.generateContent(prompt)
      answer = result.response.text()
    }

    // LLM 응답에서 [ESCALATION] 마커 감지
    let llmWantsEscalation = false
    if (answer.includes('[ESCALATION]')) {
      llmWantsEscalation = true
      answer = answer.replace(/\[ESCALATION\]\s*/g, '').trim()
    }

    const confidence = evaluateConfidence(question, answer)

    // 에스컬레이션은 LLM 판단([ESCALATION] 마커)에만 의존
    // 신뢰도 낮음이나 복합 질문이라고 자동 에스컬레이션하지 않음
    return {
      answer,
      confidence: confidence.level,
      confidenceScore: confidence.score,
      references: customerInfo?.references || [],
      needsEscalation: llmWantsEscalation,
      isComplex: analysis.isComplex,
      complexity: analysis.complexity,
      subQuestions: analysis.subQuestions,
      model: modelName,
    }
  } catch (err) {
    console.error('Gemini API error:', err.message)
    return generateMockAnswer(question, customerInfo)
  }
}

// Mock 답변 생성 (DEMO_MODE 또는 Gemini 클라이언트 없을 때)
function generateMockAnswer(question, customerInfo) {
  const analysis = analyzeQuestion(question)
  const confidence = evaluateConfidence(question, '')

  // 인사/간단한 입력 감지
  const greetings = ['안녕하세요', '안녕', '반갑습니다', '감사합니다', '고마워요', '하이', '헬로', 'hi', 'hello', '처음 뵙겠습니다', '수고하세요']
  const trimmed = question.trim().replace(/[.!~?？ ]+$/g, '')
  if (trimmed.length <= 15 && greetings.some(g => trimmed.includes(g))) {
    return {
      answer: '안녕하세요! 마크애니 AI 프리세일즈 어시스턴트 ANY 브릿지입니다. 😊\n어떤 제품이나 서비스에 대해 궁금하신 점이 있으신가요?',
      confidence: 'high',
      confidenceScore: 95,
      references: [],
      needsEscalation: false,
      isComplex: false,
      subQuestions: null,
      model: 'mock',
    }
  }

  const productAnswers = {
    'Document SAFER': 'Document SAFER v3.2에서 대량 파일 처리 속도가 30% 개선되었습니다. 윈도우 11을 완벽하게 지원하며, 과거 호환성 문제가 모두 해결되었습니다.',
    'DRM': '네, 맞춤형 DRM 구축이 가능합니다. ✅ 윈도우 11 호환: 지원됩니다 (정책기능서 v3.2 참조). ✅ 보안 인증: CC인증, GS인증 보유. 국방부 보안 요구사항에 충분히 부합합니다.',
  }

  const product = customerInfo?.product || 'DRM'
  let answer = productAnswers[product] || '마크애니 제품에 대해 안내해 드리겠습니다.'

  if (question.includes('업그레이드') || question.includes('성능')) {
    answer = `${product} 최신 버전에서 성능이 크게 개선되었습니다. ${customerInfo?.name || '고객'}님의 환경에 맞는 업그레이드 방안을 안내해 드리겠습니다.`
  }

  return {
    answer,
    confidence: confidence.level,
    confidenceScore: confidence.score,
    references: customerInfo?.references || ['정책기능서 v3.2'],
    needsEscalation: false,
    isComplex: analysis.isComplex,
    subQuestions: analysis.subQuestions,
    model: 'mock',
  }
}
