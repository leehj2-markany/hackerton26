// GET /api/slack/poll — Slack 채널에서 새 메시지 폴링 (실제 담당자 답변 수신)
import { cors, json, error } from '../_lib/cors.js'
import { ENV, SLACK_USERS } from '../_lib/config.js'
import { getChannelHistory, ensureBotInChannel } from '../_lib/slackClient.js'

// 실제 사용자 ID → 이름 역매핑
function buildUserIdMap() {
  const map = {}
  for (const [name, info] of Object.entries(SLACK_USERS)) {
    if (info.id) map[info.id] = { name, role: info.role, avatar: info.avatar }
  }
  return map
}

/**
 * Slack raw 텍스트에서 <@userId> 멘션을 사람 이름으로 변환
 * 추가로 채널 링크, URL 포맷 등 Slack 전용 마크업도 정리
 * 예: "<@U04N9LV482Z> 님이 채널에 참여함" → "송인찬 님이 채널에 참여함"
 */
function formatSlackMentions(text, userIdMap) {
  if (!text) return text
  return text
    .replace(/<@([A-Z0-9]+)>/g, (match, userId) => {
      const userInfo = userIdMap[userId]
      return userInfo ? userInfo.name : match
    })
    .replace(/<#[A-Z0-9]+\|([^>]+)>/g, '#$1')              // 채널 링크 → #채널명
    .replace(/<(https?:\/\/[^|>]+)\|([^>]+)>/g, '$2')      // URL with label → label
    .replace(/<(https?:\/\/[^>]+)>/g, '$1')                 // URL without label → URL
    .replace(/<!subteam\^[A-Z0-9]+\|@([^>]+)>/g, '@$1')    // 유저그룹 멘션
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
    // [의도] Bot이 채널 멤버가 아니면 conversations.history가 실패하는 근본 원인 해결
    // 매 폴링마다 호출하지만 conversations.join은 idempotent (이미 참여 중이면 무시)
    // Vercel serverless는 stateless이므로 "이미 join했는지" 캐싱 불가 → 매번 호출이 안전
    await ensureBotInChannel(channelId)

    const messages = await getChannelHistory(channelId, parseInt(limit) || 20)
    const userIdMap = buildUserIdMap()

    // [디버그] userIdMap이 비어있으면 환경변수 미설정 — 모든 메시지가 필터링됨
    const userIdMapSize = Object.keys(userIdMap).length
    if (userIdMapSize === 0) {
      console.warn('[slack/poll] ⚠️ userIdMap이 비어있음 — SLACK_USER_* 환경변수 확인 필요')
    }

    // since 타임스탬프 이후 메시지만 필터
    const sinceTs = since ? parseFloat(since) : 0
    // [P2 수정] Slack 시스템 메시지 필터링 — "채널 참여함" 등이 LIVE 답변으로 표시되는 문제 해결
    const SYSTEM_SUBTYPES = new Set([
      'channel_join', 'channel_leave', 'channel_topic', 'channel_purpose',
      'channel_name', 'channel_archive', 'channel_unarchive',
      'group_join', 'group_leave', 'group_topic', 'group_purpose',
      'pinned_item', 'unpinned_item',
    ])

    const filtered = messages
      .filter(msg => {
        // 봇 메시지 제외 (봇이 보낸 질문 메시지 등)
        if (msg.bot_id || msg.subtype === 'bot_message') return false
        // 시스템 메시지 제외 (채널 참여/퇴장/토픽 변경 등)
        if (msg.subtype && SYSTEM_SUBTYPES.has(msg.subtype)) return false
        // since 이후 메시지만
        if (sinceTs && parseFloat(msg.ts) <= sinceTs) return false
        // 실제 담당자 메시지만 (userIdMap에 있는 사용자)
        return msg.user && userIdMap[msg.user]
      })
      .map(msg => {
        const userInfo = userIdMap[msg.user]

        // Slack 첨부파일 정보 추출
        const files = (msg.files || []).map(f => ({
          id: f.id,
          name: f.name,
          mimetype: f.mimetype,
          size: f.size,
          url: f.url_private,
          thumb: f.thumb_360 || f.thumb_160 || f.thumb_80 || null,
          filetype: f.filetype,
        }))

        return {
          ts: msg.ts,
          user: msg.user,
          agentName: userInfo?.name || 'Unknown',
          agentRole: userInfo?.role || '',
          agentAvatar: userInfo?.avatar || '👤',
          text: formatSlackMentions(msg.text, userIdMap),
          files: files.length > 0 ? files : undefined,
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
        // [디버그] 프론트엔드에서 문제 진단용 — userIdMap 크기와 등록된 에이전트 이름
        debug: {
          userIdMapSize,
          registeredAgents: Object.values(userIdMap).map(u => u.name),
        },
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
