// POST /api/chat — 챗봇 메시지 전송 + AI 답변 생성
import { cors, json, error } from './_lib/cors.js'
import { generateAnswer, generateAnswerStream, analyzeQuestion } from './_lib/geminiClient.js'
import { customers, customerNameMap } from './_lib/mockData.js'
import { validateInput, validateOutput, maskPII } from './_lib/safety.js'
import { searchKnowledge } from './_lib/knowledgeBase.js'
import { saveMessage, getCustomerPastSessions, formatPastSessionsForPrompt } from './_lib/sessionStore.js'

// 인사/간단한 입력 패턴
const GREETING_PATTERNS = [
  '안녕하세요', '안녕', '반갑습니다', '감사합니다', '고마워요', '고맙습니다',
  '네', '아니요', '예', '아니오', '좋아요', '알겠습니다', '확인했습니다',
  '하이', '헬로', 'hi', 'hello', '처음 뵙겠습니다', '수고하세요',
]

// 에스컬레이션 의도가 포함된 메시지는 인사로 처리하지 않음
const ESCALATION_INTENT_WORDS = ['연결', '담당자', '사람', '전문가', '상담', '견적', '계약']

function isGreetingMessage(msg) {
  const trimmed = msg.trim().replace(/[.!~?？ ]+$/g, '')
  if (trimmed.length > 15) return false
  if (ESCALATION_INTENT_WORDS.some(w => trimmed.includes(w))) return false
  return GREETING_PATTERNS.some(p => trimmed.includes(p))
}

export default async function handler(req, res) {
  if (cors(req, res)) return
  if (req.method !== 'POST') return error(res, 'METHOD_NOT_ALLOWED', 'POST만 허용됩니다', 405)

  const { message, customerId, sessionId, conversationHistory, stream: useStream } = req.body || {}

  if (!message?.trim()) {
    return error(res, 'INVALID_INPUT', '메시지가 비어있습니다.')
  }

  // fire-and-forget: 사용자 메시지 저장
  saveMessage(sessionId, 'user', message, { customer_id: customerId || null })

  // ── AI Safety: 입력 검증 ──
  const inputCheck = validateInput(message)
  if (!inputCheck.safe) {
    return json(res, {
      success: true,
      data: {
        answer: inputCheck.reason,
        confidence: 'high',
        confidenceScore: 100,
        references: [],
        thinkingProcess: ['🛡️ 안전성 검사 수행', `차단 사유: ${inputCheck.reason}`],
        needsEscalation: false,
        isComplex: false,
        blocked: true,
      },
    })
  }

  // customerInfo는 try 밖에서 선언 — catch에서도 접근 가능하도록
  let customerInfo = null

  // ── 스트리밍 모드 ──
  if (useStream) {
    return handleStreamChat(req, res, message, customerId, conversationHistory)
  }

  try {
    // 고객 정보: 명시적 customerId 또는 메시지에서 자동 매칭
    customerInfo = customerId ? customers[customerId] : null
    if (!customerInfo) {
      const matchedKey = Object.keys(customerNameMap).find(k => message.includes(k))
      if (matchedKey) {
        const matchedId = customerNameMap[matchedKey]
        customerInfo = customers[matchedId] || null
      }
    }

    // ── 인사/간단한 입력 → RAG 스킵, ThinkingProcess 스킵 ──
    if (isGreetingMessage(message)) {
      const result = await generateAnswer(message, customerInfo, conversationHistory || [], { skipRAG: true })
      const greetingAnswer = result.answer
      saveMessage(sessionId, 'assistant', greetingAnswer, { model: result.model, complexity: 'simple' })
      return json(res, {
        success: true,
        data: {
          answer: greetingAnswer,
          confidence: 'high',
          confidenceScore: 95,
          references: [],
          thinkingProcess: [],
          needsEscalation: false,
          isComplex: false,
          subQuestions: null,
          model: result.model,
          complexity: 'simple',
          customerInfo: customerInfo || null,
        },
      })
    }

    // [P4 수정] analyzeQuestion 1회 호출 후 결과를 generateAnswer에 전달
    const analysis = await analyzeQuestion(message)
    const thinkingProcess = ['🤔 질문 분석 중...']

    // ── 장기 메모리: 이전 세션 이력 조회 (고객 매칭 시) ──
    let pastSessionContext = ''
    if (customerId) {
      try {
        const pastMsgs = await getCustomerPastSessions(customerId, sessionId, 20)
        pastSessionContext = formatPastSessionsForPrompt(pastMsgs)
        if (pastSessionContext) {
          thinkingProcess.push(`🧠 장기 메모리: 이전 ${new Set(pastMsgs.map(m => m.session_id)).size}개 세션 이력 로드`)
        }
      } catch (e) {
        console.error('[chat] 장기 메모리 조회 실패:', e.message)
      }
    }

    if (customerInfo) {
      thinkingProcess.push(`👤 고객 매칭: ${customerInfo.name} (${customerInfo.product} ${customerInfo.version})`)
      thinkingProcess.push(`📊 세일즈포스 데이터: ${customerInfo.accountType} / ${customerInfo.industry} / 만족도 ${customerInfo.satisfactionScore}`)
    }

    if (analysis.isComplex) {
      thinkingProcess.push(`🔀 복합 질문 감지 (DESV): ${analysis.subQuestions?.length || 0}개 서브질문으로 분해 → 독립 RAG 검색`)
      if (analysis.subQuestions) {
        analysis.subQuestions.forEach((sq, i) => {
          thinkingProcess.push(`  서브질문 ${i + 1}: ${sq.question}${sq.product ? ` [${sq.product}]` : ''}`)
        })
      }
    } else {
      if (customerInfo) {
        thinkingProcess.push(`제품 분류: ${customerInfo.product}`)
      }
    }

    // RAG 검색 수행 및 thinkingProcess에 반영
    // [의도] searchKnowledge가 async(pgvector)로 변경됨 → await 필수
    const productHint = customerInfo?.product || null
    const ragResult = await searchKnowledge(message, productHint, 3)
    thinkingProcess.push(`📚 지식 베이스 검색 중... ${ragResult.chunks.length}건 발견 (${ragResult.stores?.join(', ') || ''})`)
    ragResult.chunks.forEach((chunk, i) => {
      thinkingProcess.push(`  참조 ${i + 1}: ${chunk.title}`)
    })
    thinkingProcess.push('🛡️ 안전성 검증 + 신뢰도 평가 중...')

    // [성능최적화] generateAnswer와 validateOutput 병렬화 준비
    // generateAnswer 내부에서 selfReflect까지 끝난 후, validateOutput을 순차로 돌리면
    // ~3-5초 낭비. generateAnswer 완료 즉시 validateOutput을 시작하도록 구조 변경.
    const result = await generateAnswer(message, customerInfo, conversationHistory || [], { preAnalysis: analysis, pastSessionContext })

    // geminiClient에서 반환한 thinkingProcess 병합
    if (result.thinkingProcess?.length) {
      thinkingProcess.push(...result.thinkingProcess)
    }

    // 모델 선택 표시
    if (result.complexity === 'critical') {
      thinkingProcess.push('💎 모델 선택: Claude Opus 4 (최고 성능)')
    } else {
      thinkingProcess.push('🧠 모델 선택: Claude Sonnet 4 (속도+퀄리티)')
    }

    thinkingProcess.push(
      result.confidence === 'high' ? '신뢰도 평가: 🟢 높음' :
      result.confidence === 'medium' ? '신뢰도 평가: 🟡 중간' : '신뢰도 평가: 🔴 낮음'
    )
    thinkingProcess.push('답변 생성 중...')

    // ── AI Safety: 출력 검증 ──
    // [성능최적화] simple 질문은 regex-only 검증 (Claude LLM 스킵), complex/critical만 full 검증
    // simple은 RAG 기반 단일 제품 답변이라 안전성 위험이 낮음
    const outputCheck = await validateOutput(result.answer, message, { skipLLM: analysis.complexity === 'simple' })
    let finalAnswer = result.answer
    if (!outputCheck.safe) {
      finalAnswer = '죄송합니다. 안전한 답변을 생성하지 못했습니다. 담당자에게 문의해 주세요.'
      thinkingProcess.push('🛡️ 출력 안전성 검증: ⚠️ 수정됨')
    } else {
      thinkingProcess.push('🛡️ 출력 안전성 검증: ✅ 통과')
    }

    finalAnswer = maskPII(finalAnswer)
    console.log(`[chat] confidence=${result.confidence} (${result.confidenceScore}%), model=${result.model}, complexity=${result.complexity}`)

    // fire-and-forget: AI 답변 저장
    saveMessage(sessionId, 'assistant', finalAnswer, {
      model: result.model,
      complexity: result.complexity,
      confidence_score: result.confidenceScore,
      customer_id: customerId || null,
    })

    return json(res, {
      success: true,
      data: {
        answer: finalAnswer,
        confidence: result.confidence,
        confidenceScore: result.confidenceScore,
        references: result.references,
        thinkingProcess,
        needsEscalation: result.needsEscalation,
        isComplex: result.isComplex,
        subQuestions: result.subQuestions,
        extractedContext: result.extractedContext || null,
        model: result.model,
        complexity: result.complexity,
        customerInfo: customerInfo || null,
        selfReflection: result.selfReflection || null,
        selfConsistency: result.selfConsistency || null,
      },
    })
  } catch (err) {
    console.error('Chat API error:', err)
    return json(res, {
      success: true,
      data: {
        answer: '죄송합니다, 현재 AI 응답 생성에 일시적인 문제가 발생했습니다.\n담당자를 직접 연결해 드릴 수 있습니다. 아래 버튼을 눌러주세요.',
        confidence: 'low',
        confidenceScore: 0,
        references: [],
        thinkingProcess: ['⚠️ AI 응답 생성 실패', '🔄 담당자 연결 모드로 전환'],
        needsEscalation: true,
        isComplex: false,
        subQuestions: null,
        model: 'fallback',
        complexity: 'simple',
        customerInfo: customerInfo || null,
        aiFailed: true,
      },
    })
  }
}


// ── SSE 스트리밍 모드 핸들러 ──
async function handleStreamChat(req, res, message, customerId, conversationHistory) {
  const { sessionId } = req.body || {}
  // SSE 헤더 설정
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.flushHeaders?.()

  const sendSSE = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }

  let customerInfo = null
  try {
    customerInfo = customerId ? customers[customerId] : null
    if (!customerInfo) {
      const matchedKey = Object.keys(customerNameMap).find(k => message.includes(k))
      if (matchedKey) customerInfo = customers[customerNameMap[matchedKey]] || null
    }

    // 인사 → 스트리밍 불필요, 즉시 응답
    if (isGreetingMessage(message)) {
      const result = await generateAnswer(message, customerInfo, conversationHistory || [], { skipRAG: true })
      saveMessage(sessionId, 'assistant', result.answer, { model: result.model, complexity: 'simple' })
      sendSSE('meta', {
        confidence: 'high', model: result.model, complexity: 'simple',
        thinkingProcess: [], needsEscalation: false, customerInfo: customerInfo || null,
      })
      sendSSE('token', { text: result.answer })
      sendSSE('done', { answer: result.answer })
      res.end()
      return
    }

    // Router 분석
    const analysis = await analyzeQuestion(message)
    const thinkingProcess = ['🤔 질문 분석 중...']

    // ── 장기 메모리: 이전 세션 이력 조회 (고객 매칭 시) ──
    let pastSessionContext = ''
    if (customerId) {
      try {
        const pastMsgs = await getCustomerPastSessions(customerId, sessionId, 20)
        pastSessionContext = formatPastSessionsForPrompt(pastMsgs)
        if (pastSessionContext) {
          thinkingProcess.push(`🧠 장기 메모리: 이전 ${new Set(pastMsgs.map(m => m.session_id)).size}개 세션 이력 로드`)
        }
      } catch (e) {
        console.error('[stream] 장기 메모리 조회 실패:', e.message)
      }
    }

    if (customerInfo) {
      thinkingProcess.push(`👤 고객 매칭: ${customerInfo.name} (${customerInfo.product} ${customerInfo.version})`)
    }
    if (analysis.isComplex && analysis.subQuestions) {
      thinkingProcess.push(`🔀 복합 질문 감지: ${analysis.subQuestions.length}개 서브질문`)
    }

    // RAG 검색
    const productHint = customerInfo?.product || null
    const ragResult = await searchKnowledge(message, productHint, 3)
    thinkingProcess.push(`📚 지식 베이스: ${ragResult.chunks.length}건 (${ragResult.stores?.join(', ') || ''})`)
    thinkingProcess.push('🧠 모델 선택: Claude Sonnet 4 (속도+퀄리티)')

    // 메타데이터 먼저 전송 (ThinkingPanel용)
    sendSSE('meta', {
      thinkingProcess,
      complexity: analysis.complexity,
      model: analysis.complexity === 'critical' ? 'claude-opus-4' : 'claude-sonnet-4',
      customerInfo: customerInfo || null,
      subQuestions: analysis.subQuestions || null,
      extractedContext: analysis.extractedContext || null,
    })

    // 스트리밍 답변 생성
    const result = await generateAnswerStream(message, customerInfo, conversationHistory || [], {
      preAnalysis: analysis,
      pastSessionContext,
      onToken: (text) => sendSSE('token', { text }),
    })

    // 최종 메타데이터 (에스컬레이션, 신뢰도 등)
    const finalAnswer = maskPII(result.answer)
    // fire-and-forget: 스트리밍 답변 저장
    saveMessage(sessionId, 'assistant', finalAnswer, {
      model: result.model,
      complexity: analysis.complexity,
      confidence_score: result.confidenceScore,
      customer_id: customerId || null,
    })
    sendSSE('done', {
      answer: finalAnswer,
      confidence: result.confidence,
      confidenceScore: result.confidenceScore,
      needsEscalation: result.needsEscalation,
      references: result.references,
      model: result.model,
    })
    res.end()
  } catch (err) {
    console.error('[stream] error:', err.message)
    sendSSE('error', { message: 'AI 응답 생성 중 오류가 발생했습니다.' })
    res.end()
  }
}
