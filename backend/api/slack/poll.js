// GET /api/slack/poll — Slack 채널에서 새 메시지 폴링 (실제 담당자 답변 수신)
import { cors, json, error } from '../lib/cors.js'
import { ENV, SLACK_USERS } from '../lib/config.js'
import { getChannelHistory } from '../lib/slackClient.js'

// 실제 사용자 ID → 이름 역매핑
function buildUserIdMap() {
  const map = {}
  for (const [name, info] of Object.entries(SLACK_USERS)) {
    if (info.id) map[info.id] = { name, role: info.role, avatar: info.avatar }
  }
  return map
}

export default async function handler(req, res) {
  if (cors(req, res)) return
  if (req.method !== 'GET') return error(res, 'METHOD_NOT_ALLOWED', 'GET만 허용됩니다', 405)

  const { since, limit, channelId: queryChannelId } = req.query
  const channelId = queryChannelId || ENV.SLACK_CHANNEL_ID

  if (!channelId) {
    return json(res, {
      success: true,
      data: { messages: [], mock: true, reason: 'SLACK_CHANNEL_ID 미설정' },
    })
  }

  try {
    const messages = await getChannelHistory(channelId, parseInt(limit) || 20)
    const userIdMap = buildUserIdMap()

    // since 타임스탬프 이후 메시지만 필터
    const sinceTs = since ? parseFloat(since) : 0
    const filtered = messages
      .filter(msg => {
        // 봇 메시지 제외 (봇이 보낸 질문 메시지 등)
        if (msg.bot_id || msg.subtype === 'bot_message') return false
        // since 이후 메시지만
        if (sinceTs && parseFloat(msg.ts) <= sinceTs) return false
        // 실제 담당자 메시지만 (userIdMap에 있는 사용자)
        return msg.user && userIdMap[msg.user]
      })
      .map(msg => {
        const userInfo = userIdMap[msg.user]
        return {
          ts: msg.ts,
          user: msg.user,
          agentName: userInfo?.name || 'Unknown',
          agentRole: userInfo?.role || '',
          agentAvatar: userInfo?.avatar || '👤',
          text: msg.text,
          timestamp: new Date(parseFloat(msg.ts) * 1000).toISOString(),
        }
      })
      .sort((a, b) => parseFloat(a.ts) - parseFloat(b.ts)) // 오래된 순

    return json(res, {
      success: true,
      data: {
        messages: filtered,
        channelId,
        polledAt: new Date().toISOString(),
        totalRaw: messages.length,
        filteredCount: filtered.length,
      },
    })
  } catch (err) {
    console.error('[slack/poll] 실패:', err.message)
    return json(res, {
      success: true,
      data: { messages: [], error: err.message, mock: true },
    })
  }
}
