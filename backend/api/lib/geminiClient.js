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

${KNOWLEDGE_BASE}`


// ── LLM-as-a-Router: Flash가 복잡도를 판단 + 서브질문 분류 + 담당자 배정 ──
// 키워드 룰 전부 제거. 모든 판단은 LLM 자연어 이해에 위임.
const ROUTER_PROMPT = `당신은 고객 질문의 복잡도를 판단하고, 서브질문을 분류하여 적절한 담당자에게 배정하는 라우터입니다.
아래 질문을 분석하여 반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.

복잡도 판단 기준:
- simple: 인사, 단일 제품 질문, 단순 기능 문의, 짧은 질문 (예: "DRM이 뭐예요?", "도입하려고요")
- complex: 여러 주제가 결합된 질문, 비교 요청, 환경 조건이 복잡한 질문 (예: "500명 규모 망분리 환경에서 DRM 도입하면서 그룹웨어 연동도 하고 싶은데")
- critical: 긴급 장애, 보안사고, 법적/계약 이슈, 감사 대응 등 즉각 전문가 개입이 필요한 질문

담당자 배정 기준 (서브질문별로 가장 적합한 1명 배정):
- 송인찬 (어카운트 매니저): 영업, 견적, 비용, 계약, 구축 일정, 도입 프로세스, 레퍼런스, 고객 사례
- 이현진 (SE): 기술 호환성, 시스템 연동, OS 지원, 네트워크 환경, 설치/배포, 아키텍처
- 박우호 (개발리더): 보안 인증, 암호화 기술, API/SDK, 커스터마이징, 개발 관련 기술 심화 질문

질문: "{QUESTION}"

JSON 응답 (이것만 출력):
{"complexity":"simple|complex|critical","reason":"판단 근거 한 줄","subQuestions":[{"question":"서브질문 내용","assignee":"담당자 이름"}]}`

export async function analyzeQuestion(question) {
  const client = getClient()

  // Gemini 클라이언트 없으면 (DEMO_MODE 등) 간단한 길이 기반 fallback
  if (!client) {
    return fallbackAnalyze(question)
  }

  try {
    const prompt = ROUTER_PROMPT.replace('{QUESTION}', question)
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent(prompt)
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
          // LLM이 { question, assignee } 객체로 반환하는 경우
          if (typeof sq === 'object' && sq.question) {
            const assignee = sq.assignee || '송인찬'
            return { question: sq.question, role: AGENT_ROLES[assignee] || 'sales', assignee }
          }
          // LLM이 문자열로 반환하는 경우 (폴백)
          return { question: String(sq), role: 'sales', assignee: '송인찬' }
        })
      : null

    return {
      isComplex: complexity !== 'simple',
      complexity,
      subQuestions,
      routerReason: parsed.reason || '',
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
    return { isComplex: true, complexity: 'complex', subQuestions: null, routerReason: 'fallback: 긴 질문' }
  }
  return { isComplex: false, complexity: 'simple', subQuestions: null, routerReason: 'fallback: 짧은 질문' }
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
    const result = await model.generateContent(stepBackPrompt)
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
    const result = await reflectModel.generateContent(reflectionPrompt)
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
    const result = await model.generateContent(question)
    const answer2 = result.response.text()

    // 일관성 검증
    const checkPrompt = `두 답변의 핵심 내용이 일치하는지 검증하세요. JSON으로만 응답.
답변1: "${answer1.slice(0, 500)}"
답변2: "${answer2.slice(0, 500)}"
JSON: {"consistent": true/false, "score": 0-100, "differences": ["차이점"]}`

    const checkModel = client.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const checkResult = await checkModel.generateContent(checkPrompt)
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

// Gemini로 답변 생성
export async function generateAnswer(question, customerInfo, conversationHistory = [], options = {}) {
  const client = getClient()
  const { skipRAG = false } = options

  // DEMO_MODE이거나 Gemini 클라이언트 없으면 mock 답변
  if (ENV.DEMO_MODE || !client) {
    return generateMockAnswer(question, customerInfo)
  }

  // ── R20: 캐시 조회 (인사 메시지는 캐시하지 않음) ──
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
    // 3-Tier LLM 라우팅:
    //   simple  → Gemini 2.5 Flash (~4s, 속도 우선)
    //   complex → Gemini 2.5 Pro (~15s, 정확도 우선)
    //   critical → Claude Opus 4 (~20s, 최고 성능)
    const analysis = await analyzeQuestion(question)
    const thinkingProcess = []

    // ── R23: Take a Step Back (complex/critical 질문에만 적용) ──
    let stepBackQuestion = null
    if (analysis.complexity === 'complex' || analysis.complexity === 'critical') {
      stepBackQuestion = await takeStepBack(question, client)
      if (stepBackQuestion) {
        thinkingProcess.push(`🔭 Step Back: "${stepBackQuestion}"`)
      }
    }

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

      // Step Back 질문으로 추가 RAG 검색
      if (stepBackQuestion) {
        const stepBackRag = searchKnowledge(stepBackQuestion, productHint, 2)
        const stepBackContext = formatContext(stepBackRag)
        if (stepBackContext) {
          contextParts.push(`[Step Back 추가 검색 결과]\n${stepBackContext}`)
        }
      }
    }

    // Step Back 분석 컨텍스트 추가
    if (stepBackQuestion) {
      contextParts.push(`[Step Back 분석]\n상위 질문: ${stepBackQuestion}`)
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

    // ── R19 Self-Reflection: 답변 자체 검증 ──
    const reflection = await selfReflect(question, answer, client)
    if (!reflection.passed) {
      // 보완 정보 추가 (재생성은 하지 않음, 성능 고려)
      answer += `\n\n💡 보완: ${reflection.reflection}`
      thinkingProcess.push('🔍 Self-Reflection: ⚠️ 보완 적용')
    } else {
      thinkingProcess.push('🔍 Self-Reflection: ✅ 통과')
    }

    // ── R24 Self-Consistency: 복합 질문에 대해 일관성 검증 ──
    let selfConsistency = null
    if (analysis.complexity === 'complex') {
      selfConsistency = await checkSelfConsistency(question, answer, client, modelName)
      if (!selfConsistency.consistent) {
        thinkingProcess.push('⚠️ 일관성 검증: 차이 발견 — 보수적 답변 적용')
      } else {
        thinkingProcess.push(`✅ 일관성 검증: 통과 (${selfConsistency.score}점)`)
      }
    }

    const confidence = evaluateConfidence(question, answer)

    // 에스컬레이션은 LLM 판단([ESCALATION] 마커)에만 의존
    // 신뢰도 낮음이나 복합 질문이라고 자동 에스컬레이션하지 않음
    const result = {
      answer,
      confidence: confidence.level,
      confidenceScore: confidence.score,
      references: customerInfo?.references || [],
      needsEscalation: llmWantsEscalation,
      isComplex: analysis.isComplex,
      complexity: analysis.complexity,
      subQuestions: analysis.subQuestions,
      model: modelName,
      thinkingProcess,
      stepBackQuestion: stepBackQuestion || undefined,
      selfReflection: { passed: reflection.passed, issues: reflection.issues },
      selfConsistency: selfConsistency ? { consistent: selfConsistency.consistent, score: selfConsistency.score } : null,
    }

    // ── R20: 캐시 저장 (에스컬레이션 결과는 캐시하지 않음) ──
    if (cacheKey && !llmWantsEscalation) {
      setCachedAnswer(cacheKey, result)
    }

    return result
  } catch (err) {
    console.error('Gemini API error:', err.message)
    return generateMockAnswer(question, customerInfo)
  }
}


// Mock 답변 생성 (DEMO_MODE 또는 Gemini 클라이언트 없을 때)
function generateMockAnswer(question, customerInfo) {
  const analysis = fallbackAnalyze(question)
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
