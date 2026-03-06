// POST /api/escalate — 에스컬레이션 요청 (담당자 연결)
import { cors, json, error } from './lib/cors.js'
import { ENV, SLACK_USERS } from './lib/config.js'
import { agents } from './lib/mockData.js'
import { searchKnowledge } from './lib/knowledgeBase.js'
import {
  createChannel,
  inviteUsersToChannel,
  postEscalationMessage,
  postAiCopilotSuggestion,
  postMessage,
} from './lib/slackClient.js'

// 인메모리 에스컬레이션 상태 (데모용, 프로덕션에서는 Supabase 사용)
const escalations = new Map()

export default async function handler(req, res) {
  if (cors(req, res)) return

  // GET /api/escalate?channelId=xxx — 멤버 상태 조회
  if (req.method === 'GET') {
    const channelId = req.query.channelId
    if (!channelId) return error(res, 'INVALID_INPUT', 'channelId가 필요합니다.')

    const esc = escalations.get(channelId)
    if (!esc) {
      return json(res, {
        success: true,
        data: {
          channelId,
          members: agents.map((a, i) => ({
            ...a,
            joined: true,
            joinedAt: new Date(Date.now() - (agents.length - i) * 2000).toISOString(),
          })),
          progress: `${agents.length}/${agents.length}`,
          totalMembers: agents.length,
          joinedMembers: agents.length,
        },
      })
    }

    const joinedCount = esc.members.filter(m => m.joined).length
    return json(res, {
      success: true,
      data: {
        channelId,
        members: esc.members,
        progress: `${joinedCount}/${esc.members.length}`,
        totalMembers: esc.members.length,
        joinedMembers: joinedCount,
      },
    })
  }

  // POST /api/escalate — 에스컬레이션 생성
  if (req.method !== 'POST') return error(res, 'METHOD_NOT_ALLOWED', 'GET 또는 POST만 허용됩니다', 405)

  const { caseId, customerId, customerEnglishName, question, aiAnswer, subQuestions, product } = req.body || {}

  if (!question?.trim()) {
    return error(res, 'INVALID_INPUT', '질문이 비어있습니다.')
  }

  const members = agents.map(a => ({ ...a, joined: false, joinedAt: null, status: 'invited' }))
  const escalationCaseId = caseId || `case_${Date.now()}`
  const customerName = customerId || '고객'
  const productName = product || 'drm'

  let channelId, channelName, channelUrl

  try {
    // ── 1. Slack 채널 생성 (esc-{고객사영문약칭}-{제품}-{MMDD}-{HHmm} 형식) ──
    const channel = await createChannel(productName, customerName, customerEnglishName)
    channelId = channel.id
    channelName = channel.name
    channelUrl = channel.url

    // ── 2. 실제 담당자 초대 (SLACK_USERS에 ID가 있는 사용자만) ──
    const realUserIds = Object.values(SLACK_USERS)
      .map(u => u.id)
      .filter(Boolean)

    if (realUserIds.length > 0 && !channel.isSimulated) {
      const inviteResult = await inviteUsersToChannel(channelId, realUserIds)
      console.log('[escalate] 담당자 초대 결과:', inviteResult)

      // 초대된 사용자 상태 업데이트
      for (const member of members) {
        const slackUser = SLACK_USERS[member.name]
        if (slackUser?.id && inviteResult.invited.includes(slackUser.id)) {
          member.joined = true
          member.joinedAt = new Date().toISOString()
          member.status = 'joined'
        }
      }
    }

    // ── 3. 에스컬레이션 메시지 전송 (Block Kit) ──
    await postEscalationMessage(channelId, {
      caseId: escalationCaseId,
      customerId,
      customerName,
      question,
      aiAnswer,
      subQuestions,
      agents: members,
    })

    // ── 4. AI 코파일럿 답변 초안 전송 (RAG 참조 근거 포함) ──
    if (aiAnswer) {
      // RAG 검색으로 참조 근거 추출 (내부 담당자용)
      let references = []
      try {
        const ragResult = searchKnowledge(question, null, 3)
        references = ragResult.chunks.map(c => ({
          title: c.title,
          snippet: c.content?.slice(0, 150) || '',
          score: c.score ? `${Math.round(c.score * 100)}%` : '-',
        }))
      } catch (ragErr) {
        console.error('[escalate] RAG 검색 실패:', ragErr.message)
      }
      await postAiCopilotSuggestion(channelId, question, aiAnswer, references)
    }

    // ── 5. 담당자별 멘션 메시지 ──
    for (const [name, info] of Object.entries(SLACK_USERS)) {
      if (!info.id) continue
      const mention = `<@${info.id}>`
      await postMessage(
        channelId,
        `${mention} 님, ${customerName} 고객의 문의에 답변 부탁드립니다. 🙏\n_(이 채널에 답변을 작성하시면 고객에게 실시간 전달됩니다)_`
      )
    }

  } catch (err) {
    console.error('[escalate] Slack integration error (graceful degradation):', err.message)
    channelId = channelId || `C${Date.now().toString(36).toUpperCase()}`
    channelName = channelName || `#${customerName}-문의-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`
    channelUrl = channelUrl || `https://markany.slack.com/archives/${channelId}`
  }

  escalations.set(channelId, {
    caseId: escalationCaseId,
    customerId,
    question,
    members,
    channelId,
    createdAt: new Date().toISOString(),
  })

  return json(res, {
    success: true,
    data: {
      channelId,
      channelName,
      channelUrl,
      agents: members.map(m => ({ name: m.name, role: m.role, status: m.status, joined: m.joined })),
    },
  })
}
