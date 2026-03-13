// POST /api/session/close — 세션 종료: Slack 채널 보관 + 담당자 DM 발송
import { cors, json, error } from '../_lib/cors.js'
import { ENV, SLACK_USERS } from '../_lib/config.js'
import { archiveChannel, deleteChannel, sendDirectMessage, getChannelHistory } from '../_lib/slackClient.js'
import { generateAnswer } from '../_lib/geminiClient.js'

export default async function handler(req, res) {
  if (cors(req, res)) return
  if (req.method !== 'POST') return error(res, 'METHOD_NOT_ALLOWED', 'POST만 허용됩니다', 405)

  const { channelId, sessionId, customerInfo } = req.body || {}

  if (!channelId) {
    return json(res, { success: true, data: { archived: false, reason: 'channelId 없음' } })
  }

  const results = { archived: false, dmsSent: 0, summary: '' }

  try {
    // ── 1. Slack 채널 대화 이력 수집 ──
    let historyText = ''
    try {
      const messages = await getChannelHistory(channelId, 50)
      if (messages?.length > 0) {
        historyText = messages
          .filter(m => m.type === 'message' && m.text)
          .reverse()
          .map(m => m.text)
          .join('\n')
          .slice(0, 3000)
      }
    } catch (e) {
      console.error('[session/close] 이력 수집 실패:', e.message)
    }

    // ── 2. LLM으로 대화 요약 생성 ──
    const customerName = customerInfo?.company
      ? `${customerInfo.company} ${customerInfo.name || '고객'}`
      : customerInfo?.name || '고객'

    if (historyText) {
      try {
        const summaryResult = await generateAnswer(
          `다음은 고객 상담 Slack 채널의 대화 내용입니다. 3줄 이내로 핵심만 요약하세요.\n\n고객: ${customerName}\n\n대화:\n${historyText}`,
          null, [], { skipRAG: true, skipAnalysis: true }
        )
        results.summary = summaryResult?.answer || ''
      } catch (e) {
        console.error('[session/close] 요약 생성 실패:', e.message)
        results.summary = '(요약 생성 실패)'
      }
    }

    // ── 3. 참여 담당자에게 DM 발송 ──
    const customerEmail = customerInfo?.email || ''
    const customerPhone = customerInfo?.phone || ''
    const dmText = [
      `📋 상담 종료 알림`,
      `━━━━━━━━━━━━━━━`,
      `👤 고객: ${customerName}`,
      customerEmail ? `📧 이메일: ${customerEmail}` : null,
      customerPhone ? `📞 연락처: ${customerPhone}` : null,
      ``,
      results.summary ? `💬 주요 내용:\n${results.summary}` : null,
      ``,
      `🔗 세션: ${sessionId || '(미지정)'}`,
    ].filter(Boolean).join('\n')

    for (const [name, info] of Object.entries(SLACK_USERS)) {
      if (!info.id) continue
      try {
        await sendDirectMessage(info.id, dmText)
        results.dmsSent++
      } catch (e) {
        console.error(`[session/close] DM 발송 실패 (${name}):`, e.message)
      }
    }

    // ── 4. Slack 채널 보관 ──
    try {
      const archiveResult = await archiveChannel(channelId)
      results.archived = archiveResult?.ok || false
    } catch (e) {
      console.error('[session/close] 채널 보관 실패:', e.message)
    }

    // ── 5. [Issue 17] 채널 삭제 시도 (Enterprise Grid 전용, graceful fallback) ──
    if (results.archived) {
      try {
        const deleteResult = await deleteChannel(channelId)
        results.deleted = deleteResult?.ok || false
        if (!deleteResult?.ok) {
          console.log('[session/close] 채널 삭제 불가 (Enterprise Grid 전용) — 보관 상태 유지')
        }
      } catch (e) {
        console.error('[session/close] 채널 삭제 실패:', e.message)
        results.deleted = false
      }
    }

  } catch (err) {
    console.error('[session/close] 전체 처리 실패:', err.message)
  }

  return json(res, { success: true, data: results })
}
