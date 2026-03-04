// POST /api/slack/send — Slack 채널에 질문 전송 (실제 담당자에게)
import { cors, json, error } from '../_lib/cors.js'
import { ENV, SLACK_USERS, VIRTUAL_AGENTS } from '../_lib/config.js'
import { postMessage, createChannel, inviteUsersToChannel } from '../_lib/slackClient.js'

export default async function handler(req, res) {
  if (cors(req, res)) return
  if (req.method !== 'POST') return error(res, 'METHOD_NOT_ALLOWED', 'POST만 허용됩니다', 405)

  const { question, assignees, customerName, caseContext, channelId: providedChannelId } = req.body || {}

  if (!question?.trim()) return error(res, 'INVALID_INPUT', '질문이 비어있습니다.')

  // 채널 결정: 제공된 channelId > 환경변수 > 새 채널 생성
  let channelId = providedChannelId || ENV.SLACK_CHANNEL_ID
  let channelCreated = false

  if (!channelId) {
    // 채널이 없으면 새로 생성
    try {
      const channel = await createChannel(`${customerName || 'customer'}-문의`)
      channelId = channel.id
      channelCreated = true

      // 실제 담당자 초대
      const realUserIds = Object.values(SLACK_USERS).map(u => u.id).filter(Boolean)
      if (realUserIds.length > 0 && !channel.isSimulated) {
        await inviteUsersToChannel(channelId, realUserIds)
      }
    } catch (err) {
      console.error('[slack/send] 채널 생성 실패:', err.message)
      return json(res, {
        success: true,
        data: { sent: false, reason: '채널 생성 실패: ' + err.message, mock: true },
      })
    }
  }

  // 실제 Slack 사용자에게만 전송 (가상 봇 제외)
  const realAssignees = (assignees || []).filter(a => !VIRTUAL_AGENTS.includes(a.name))
  const results = []

  try {
    // 1. 채널에 질문 요약 메시지 전송
    const mentions = realAssignees
      .map(a => {
        const user = SLACK_USERS[a.name]
        return user?.id ? `<@${user.id}>` : `@${a.name}`
      })
      .join(' ')

    const headerText = `🔔 *[ANY 브릿지] ${customerName || '고객'} 문의*\n\n` +
      `> ${question}\n\n` +
      `${mentions} 님, 위 질문에 대해 답변 부탁드립니다. 🙏\n` +
      `_(이 채널에 답변을 작성해 주시면 고객에게 실시간 전달됩니다)_`

    const msgResult = await postMessage(channelId, headerText)
    results.push({ type: 'question', ...msgResult })

    // 2. 서브질문별 개별 멘션 (있는 경우)
    if (realAssignees.length > 0 && caseContext?.decomposition) {
      for (const d of caseContext.decomposition) {
        if (VIRTUAL_AGENTS.includes(d.assignee)) continue
        const user = SLACK_USERS[d.assignee]
        const mention = user?.id ? `<@${user.id}>` : `@${d.assignee}`
        const subText = `📌 ${mention} — *${d.subQuestion}* 관련 답변 부탁드립니다.`
        const subResult = await postMessage(channelId, subText)
        results.push({ type: 'sub_question', assignee: d.assignee, ...subResult })
      }
    }

    return json(res, {
      success: true,
      data: {
        sent: true,
        channelId,
        channelCreated,
        messageCount: results.length,
        results,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (err) {
    console.error('[slack/send] 실패:', err.message)
    return json(res, {
      success: true,
      data: { sent: false, error: err.message, channelId, mock: true },
    })
  }
}
