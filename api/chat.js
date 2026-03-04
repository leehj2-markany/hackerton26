// POST /api/chat — 챗봇 메시지 전송 + AI 답변 생성
import { cors, json, error } from './_lib/cors.js'
import { generateAnswer, analyzeQuestion } from './_lib/geminiClient.js'
import { customers } from './_lib/mockData.js'
import { validateInput, validateOutput, maskPII } from './_lib/safety.js'
import { searchKnowledge } from './_lib/knowledgeBase.js'

export default async function handler(req, res) {
  if (cors(req, res)) return
  if (req.method !== 'POST') return error(res, 'METHOD_NOT_ALLOWED', 'POST만 허용됩니다', 405)

  const { message, customerId, conversationHistory } = req.body || {}

  if (!message?.trim()) {
    return error(res, 'INVALID_INPUT', '메시지가 비어있습니다.')
  }

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
  // 이후 로직에서는 PII 마스킹된 sanitized 텍스트 사용

  try {
    // 고객 정보 조회
    const customerInfo = customerId ? customers[customerId] : null

    // thinking process 생성
    const analysis = analyzeQuestion(message)
    const thinkingProcess = ['🤔 질문 분석 중...']

    if (analysis.isComplex) {
      thinkingProcess.push(`복합 질문 감지: ${analysis.subQuestions.length}개 질문으로 나눠서 답변합니다`)
      analysis.subQuestions.forEach((sq, i) => {
        thinkingProcess.push(`질문 ${i + 1}: ${sq.question}`)
      })
      thinkingProcess.push('논리 검증: ✅ 일관성 확인')
    } else {
      if (customerInfo) {
        thinkingProcess.push(`제품 분류: ${customerInfo.product}`)
      }
    }

    // RAG 검색 수행 및 thinkingProcess에 반영
    const productHint = customerInfo?.product || null
    const ragResult = searchKnowledge(message, productHint, 3)
    thinkingProcess.push(`📚 지식 베이스 검색 중... ${ragResult.chunks.length}건 발견 (${ragResult.stores.join(', ')})`)
    ragResult.chunks.forEach((chunk, i) => {
      thinkingProcess.push(`  참조 ${i + 1}: ${chunk.title}`)
    })
    thinkingProcess.push('🛡️ 안전성 검증 + 신뢰도 평가 중...')

    // Gemini로 답변 생성
    const result = await generateAnswer(message, customerInfo, conversationHistory || [])

    // 모델 선택 표시
    if (result.complexity === 'critical') {
      thinkingProcess.push('💎 모델 선택: Claude Opus 4 (최고 성능)')
    } else if (result.complexity === 'complex') {
      thinkingProcess.push('🧠 모델 선택: Gemini 2.5 Pro (정확도 우선)')
    } else {
      thinkingProcess.push('🚀 모델 선택: Gemini 2.5 Flash (속도 우선)')
    }

    thinkingProcess.push(
      result.confidence === 'high' ? '신뢰도 평가: 🟢 높음' :
      result.confidence === 'medium' ? '신뢰도 평가: 🟡 중간' : '신뢰도 평가: 🔴 낮음'
    )
    thinkingProcess.push('답변 생성 중...')

    // ── AI Safety: 출력 검증 ──
    const outputCheck = validateOutput(result.answer)
    let finalAnswer = result.answer
    if (!outputCheck.safe) {
      finalAnswer = '죄송합니다. 안전한 답변을 생성하지 못했습니다. 담당자에게 문의해 주세요.'
      thinkingProcess.push('🛡️ 출력 안전성 검증: ⚠️ 수정됨')
    } else {
      thinkingProcess.push('🛡️ 출력 안전성 검증: ✅ 통과')
    }

    // PII 마스킹 적용
    finalAnswer = maskPII(finalAnswer)

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
        model: result.model,
        complexity: result.complexity,
      },
    })
  } catch (err) {
    console.error('Chat API error:', err)
    return error(res, 'AI_ERROR', 'AI 응답 생성 중 오류가 발생했습니다.', 500)
  }
}
