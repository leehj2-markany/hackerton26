// Slack Web API 클라이언트 — native fetch 사용 (Vercel serverless 경량화)
// DEMO_MODE 지원: 실제 Slack API 호출 또는 mock 데이터 반환
import { ENV } from './config.js'

const SLACK_API = 'https://slack.com/api'

// ─── 유틸리티 ────────────────────────────────────────────

function headers() {
  return {
    'Authorization': `Bearer ${ENV.SLACK_BOT_TOKEN}`,
    'Content-Type': 'application/json; charset=utf-8',
  }
}

function log(tag, ...args) {
  console.log(`[Slack:${tag}]`, ...args)
}

function isDemoMode() {
  return ENV.DEMO_MODE || !ENV.SLACK_BOT_TOKEN
}

async function slackFetch(method, body) {
  const res = await fetch(`${SLACK_API}/${method}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!data.ok) {
    console.error(`[Slack API] ${method} failed:`, data.error)
    throw new Error(`Slack API error: ${data.error}`)
  }
  return data
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ─── 1. postMessage ─────────────────────────────────────

/** 채널에 메시지 전송 */
export async function postMessage(channelId, text, blocks) {
  log('postMessage', `channel=${channelId}, text=${text?.slice(0, 50)}...`)
  try {
    if (isDemoMode()) {
      log('postMessage', '[DEMO] 메시지 전송 시뮬레이션')
      return {
        ts: `${Date.now() / 1000}`,
        channel: channelId,
        text,
        demo: true,
      }
    }
    const body = { channel: channelId, text }
    if (blocks) body.blocks = blocks
    const data = await slackFetch('chat.postMessage', body)
    return { ts: data.ts, channel: data.channel }
  } catch (err) {
    console.error('[Slack:postMessage] 실패:', err.message)
    return { error: err.message, ts: `mock_${Date.now()}`, channel: channelId, demo: true }
  }
}

// ─── 2. postEscalationMessage ───────────────────────────

/** 에스컬레이션 메시지 전송 (Block Kit 포맷) */
export async function postEscalationMessage(channelId, caseData) {
  log('postEscalation', `channel=${channelId}, case=${caseData?.caseId || 'unknown'}`)

  const {
    caseId = 'CASE-001',
    customerId = '고객',
    customerName = customerId,
    question = '문의 내용 없음',
    subQuestions = [],
    aiAnswer = '',
    agents: assignedAgents = [],
    priority = '높음',
  } = caseData || {}

  const subQText = subQuestions.length > 0
    ? subQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')
    : '(서브질문 없음)'

  const agentText = assignedAgents.length > 0
    ? assignedAgents.map(a => `• ${a.avatar || '👤'} ${a.name} (${a.role})`).join('\n')
    : '• 👩‍💼 채소희 (고객센터)\n• 👨‍💼 송인찬 (어카운트 매니저)\n• 👨‍💻 이현진 (SE)\n• 👨‍🔧 박우호 (개발리더)'

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `🚨 에스컬레이션: ${customerName} 문의`, emoji: true },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*케이스 ID:*\n\`${caseId}\`` },
        { type: 'mrkdwn', text: `*우선순위:*\n🔴 ${priority}` },
        { type: 'mrkdwn', text: `*고객:*\n${customerName}` },
        { type: 'mrkdwn', text: `*생성 시각:*\n${new Date().toLocaleString('ko-KR')}` },
      ],
    },
    { type: 'divider' },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*📋 원본 질문:*\n> ${question}` },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*🔍 AI 분해 서브질문:*\n${subQText}` },
    },
  ]

  if (aiAnswer) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*🤖 AI 초안 답변:*\n${aiAnswer.slice(0, 2500)}` },
    })
  }

  blocks.push(
    { type: 'divider' },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*👥 배정된 담당자:*\n${agentText}` },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: '✅ 담당 수락', emoji: true },
          style: 'primary',
          action_id: 'accept_escalation',
          value: caseId,
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: '📎 관련 자료 보기', emoji: true },
          action_id: 'view_references',
          value: caseId,
        },
      ],
    },
  )

  const fallbackText = `🚨 에스컬레이션: ${customerName} — ${question.slice(0, 100)}`

  try {
    return await postMessage(channelId, fallbackText, blocks)
  } catch (err) {
    console.error('[Slack:postEscalation] 실패:', err.message)
    return { error: err.message, demo: true }
  }
}

// ─── 3. simulateAgentJoin ───────────────────────────────

/** 에이전트 순차 입장 시뮬레이션 (데모용) */
export async function simulateAgentJoin(channelId, agents) {
  const defaultAgents = [
    { name: '채소희', role: 'sales', avatar: '👩‍💼', greeting: '안녕하세요! 고객센터 채소희입니다. 문의 내용 확인하겠습니다.' },
    { name: '박우호', role: 'dev', avatar: '👨‍🔧', greeting: '개발팀 박우호입니다. 기술적 부분 확인해보겠습니다.' },
    { name: '이현진', role: 'se', avatar: '👨‍💻', greeting: 'SE 이현진입니다. 고객 환경 기반으로 분석하겠습니다.' },
  ]

  const agentList = agents || defaultAgents
  const results = []

  log('simulateAgentJoin', `channel=${channelId}, agents=${agentList.length}명`)

  for (const agent of agentList) {
    try {
      await sleep(1500) // 1.5초 간격으로 순차 입장

      const joinBlocks = [
        {
          type: 'context',
          elements: [
            { type: 'mrkdwn', text: `${agent.avatar || '👤'} *${agent.name}* 님이 채널에 참여했습니다` },
          ],
        },
      ]

      const joinResult = await postMessage(
        channelId,
        `${agent.name} 님이 참여했습니다`,
        joinBlocks,
      )
      results.push({ agent: agent.name, action: 'joined', ...joinResult })

      // 인사 메시지
      await sleep(800)
      const greetingResult = await postMessage(
        channelId,
        agent.greeting || `${agent.name}입니다. 확인하겠습니다.`,
      )
      results.push({ agent: agent.name, action: 'greeting', ...greetingResult })

    } catch (err) {
      console.error(`[Slack:simulateAgentJoin] ${agent.name} 실패:`, err.message)
      results.push({ agent: agent.name, action: 'error', error: err.message })
    }
  }

  log('simulateAgentJoin', `완료: ${results.length}개 메시지 전송`)
  return results
}

// ─── 4. postAiCopilotSuggestion ─────────────────────────

/** AI 코파일럿 답변 초안 전송 (Block Kit + 버튼) */
export async function postAiCopilotSuggestion(channelId, question, suggestion) {
  log('postAiCopilot', `channel=${channelId}, question=${question?.slice(0, 40)}...`)

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: '🤖 AI 코파일럿 답변 초안', emoji: true },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*질문:*\n> ${question || '(질문 없음)'}` },
    },
    { type: 'divider' },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*💡 AI 추천 답변:*\n${(suggestion || 'AI 답변을 생성 중입니다...').slice(0, 2500)}`,
      },
    },
    {
      type: 'context',
      elements: [
        { type: 'mrkdwn', text: '⚡ _Gemini 2.5 Flash 기반 생성 | 담당자 검토 후 전송 권장_' },
      ],
    },
    { type: 'divider' },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: '✅ 이 답변 사용', emoji: true },
          style: 'primary',
          action_id: 'use_ai_answer',
          value: JSON.stringify({ question, suggestion: suggestion?.slice(0, 500) }),
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: '✏️ 수정 후 사용', emoji: true },
          action_id: 'edit_ai_answer',
          value: 'edit',
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: '❌ 무시', emoji: true },
          style: 'danger',
          action_id: 'dismiss_ai_answer',
          value: 'dismiss',
        },
      ],
    },
  ]

  const fallbackText = `🤖 AI 코파일럿 답변 초안: ${suggestion?.slice(0, 200) || '...'}`

  try {
    return await postMessage(channelId, fallbackText, blocks)
  } catch (err) {
    console.error('[Slack:postAiCopilot] 실패:', err.message)
    return { error: err.message, demo: true }
  }
}

// ─── 5. postResolutionSummary ───────────────────────────

/** 최종 해결 요약 메시지 전송 */
export async function postResolutionSummary(channelId, caseData, resolution) {
  log('postResolution', `channel=${channelId}, case=${caseData?.caseId || 'unknown'}`)

  const {
    caseId = 'CASE-001',
    customerName = '고객',
    question = '',
  } = caseData || {}

  const {
    summary = '문의가 해결되었습니다.',
    resolvedBy = '팀 협업',
    duration = '약 5분',
    satisfaction = '⭐⭐⭐⭐⭐',
    nextSteps = [],
  } = resolution || {}

  const nextStepsText = nextSteps.length > 0
    ? nextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')
    : '• 추가 조치 없음'

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: '✅ 문의 해결 완료', emoji: true },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*케이스:*\n\`${caseId}\`` },
        { type: 'mrkdwn', text: `*고객:*\n${customerName}` },
        { type: 'mrkdwn', text: `*해결 담당:*\n${resolvedBy}` },
        { type: 'mrkdwn', text: `*소요 시간:*\n${duration}` },
      ],
    },
    { type: 'divider' },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*📋 원본 질문:*\n> ${question || '(질문 없음)'}` },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*💡 해결 요약:*\n${summary}` },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*📌 후속 조치:*\n${nextStepsText}` },
    },
    { type: 'divider' },
    {
      type: 'context',
      elements: [
        { type: 'mrkdwn', text: `${satisfaction} | 해결 시각: ${new Date().toLocaleString('ko-KR')} | ANY 브릿지 AI 지원` },
      ],
    },
  ]

  const fallbackText = `✅ [${caseId}] ${customerName} 문의 해결 완료 — ${summary.slice(0, 100)}`

  try {
    return await postMessage(channelId, fallbackText, blocks)
  } catch (err) {
    console.error('[Slack:postResolution] 실패:', err.message)
    return { error: err.message, demo: true }
  }
}

// ─── 6. getChannelHistory ───────────────────────────────

/** 채널 최근 메시지 조회 */
export async function getChannelHistory(channelId, limit = 10) {
  log('getChannelHistory', `channel=${channelId}, limit=${limit}`)

  try {
    if (isDemoMode()) {
      log('getChannelHistory', '[DEMO] mock 히스토리 반환')
      return [
        { ts: `${Date.now() / 1000 - 300}`, user: 'U001', text: '안녕하세요! 고객센터 채소희입니다.', type: 'message' },
        { ts: `${Date.now() / 1000 - 240}`, user: 'U002', text: '어카운트 매니저 송인찬입니다. 확인하겠습니다.', type: 'message' },
        { ts: `${Date.now() / 1000 - 180}`, user: 'BOT', text: '🤖 AI 코파일럿: 관련 문서를 분석 중입니다...', type: 'message' },
        { ts: `${Date.now() / 1000 - 120}`, user: 'U003', text: 'SE 이현진입니다. 기술 검토 완료했습니다.', type: 'message' },
        { ts: `${Date.now() / 1000 - 60}`, user: 'U004', text: '개발팀 확인 결과, v3.2 패치로 해결 가능합니다.', type: 'message' },
      ].slice(0, limit)
    }

    const data = await slackFetch('conversations.history', { channel: channelId, limit })
    return data.messages || []
  } catch (err) {
    console.error('[Slack:getChannelHistory] 실패:', err.message)
    return []
  }
}

// ─── 7. createChannel — 실제 Slack 채널 생성 ────────────

/**
 * Slack 채널 생성 (conversations.create)
 * - 실제 모드: 채널 생성 후 ID 반환
 * - 데모 모드: mock 채널 객체 반환
 * - 이름 충돌 시 기존 채널 검색하여 반환
 */
export async function createChannel(caseName) {
  // 채널명 규칙: 소문자, 하이픈, 숫자만 허용 (Slack 제약)
  const dateSuffix = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const rawName = `${(caseName || 'case').replace(/[^a-z0-9가-힣\s-]/gi, '').replace(/\s+/g, '-').toLowerCase()}-${dateSuffix}`
  // Slack 채널명은 영문 소문자+숫자+하이픈만 허용, 한글 제거
  const channelName = rawName.replace(/[가-힣]/g, '').replace(/--+/g, '-').replace(/^-|-$/g, '').slice(0, 80)

  log('createChannel', `caseName=${caseName}, channelName=${channelName}`)

  if (isDemoMode()) {
    const mockId = `C_DEMO_${Date.now().toString(36).toUpperCase()}`
    log('createChannel', '[DEMO] mock 채널 반환')
    return {
      id: mockId,
      name: `#${channelName}`,
      url: `https://markany.slack.com/archives/${mockId}`,
      isSimulated: true,
      created: new Date().toISOString(),
    }
  }

  try {
    // 채널 생성 시도
    const data = await slackFetch('conversations.create', {
      name: channelName,
      is_private: false,
    })
    const ch = data.channel
    log('createChannel', `채널 생성 성공: #${ch.name} (${ch.id})`)
    return {
      id: ch.id,
      name: `#${ch.name}`,
      url: `https://markany.slack.com/archives/${ch.id}`,
      isSimulated: false,
      created: new Date().toISOString(),
    }
  } catch (err) {
    // name_taken → 기존 채널 검색
    if (err.message.includes('name_taken')) {
      log('createChannel', `이름 충돌 → 기존 채널 검색: ${channelName}`)
      try {
        const listData = await slackFetch('conversations.list', {
          types: 'public_channel',
          limit: 200,
        })
        const found = (listData.channels || []).find(c => c.name === channelName)
        if (found) {
          return {
            id: found.id,
            name: `#${found.name}`,
            url: `https://markany.slack.com/archives/${found.id}`,
            isSimulated: false,
            created: new Date(found.created * 1000).toISOString(),
            reused: true,
          }
        }
      } catch (_) { /* 검색 실패 → 폴백 */ }
    }

    // 채널 생성 실패 → SLACK_CHANNEL_ID 폴백
    console.error('[Slack:createChannel] 실패:', err.message)
    if (ENV.SLACK_CHANNEL_ID) {
      log('createChannel', `폴백 → 기본 채널 사용: ${ENV.SLACK_CHANNEL_ID}`)
      return {
        id: ENV.SLACK_CHANNEL_ID,
        name: '#anybridge-escalation',
        url: `https://markany.slack.com/archives/${ENV.SLACK_CHANNEL_ID}`,
        isSimulated: false,
        fallback: true,
      }
    }

    return {
      id: `C_DEMO_${Date.now().toString(36).toUpperCase()}`,
      name: `#${channelName}`,
      url: '#',
      isSimulated: true,
      error: err.message,
    }
  }
}

// ─── 8. inviteUsersToChannel — 담당자 초대 ──────────────

/**
 * Slack 채널에 사용자 초대 (conversations.invite)
 * @param {string} channelId - 채널 ID
 * @param {string[]} userIds - 초대할 사용자 ID 배열
 * @returns {{ invited: string[], failed: string[] }}
 */
export async function inviteUsersToChannel(channelId, userIds) {
  log('inviteUsersToChannel', `channel=${channelId}, users=${userIds.length}명`)

  if (isDemoMode() || !userIds.length) {
    return { invited: [], failed: [], demo: true }
  }

  const invited = []
  const failed = []

  for (const userId of userIds) {
    if (!userId) continue
    try {
      await slackFetch('conversations.invite', {
        channel: channelId,
        users: userId,
      })
      invited.push(userId)
      log('inviteUsersToChannel', `초대 성공: ${userId}`)
    } catch (err) {
      // already_in_channel은 성공으로 처리
      if (err.message.includes('already_in_channel')) {
        invited.push(userId)
        log('inviteUsersToChannel', `이미 참여 중: ${userId}`)
      } else {
        failed.push({ userId, error: err.message })
        console.error(`[Slack:invite] ${userId} 실패:`, err.message)
      }
    }
  }

  return { invited, failed }
}

// ─── 하위 호환: findOrSimulateChannel (deprecated) ──────

export async function findOrSimulateChannel(caseName) {
  return createChannel(caseName)
}

// ─── 기존 유틸리티 (하위 호환) ──────────────────────────

/** 채널 멤버 목록 조회 */
export async function getChannelMembers(channelId) {
  try {
    if (isDemoMode()) {
      return ['U001', 'U002', 'U003', 'U004']
    }
    const data = await slackFetch('conversations.members', { channel: channelId })
    return data.members || []
  } catch (err) {
    console.error('[Slack:getChannelMembers] 실패:', err.message)
    return []
  }
}

/** 메시지에 이모지 리액션 추가 */
export async function addReaction(channelId, timestamp, emoji) {
  try {
    if (isDemoMode()) {
      return { ok: true, demo: true }
    }
    return await slackFetch('reactions.add', {
      channel: channelId,
      timestamp,
      name: emoji,
    })
  } catch (err) {
    console.error('[Slack:addReaction] 실패:', err.message)
    return { ok: false, error: err.message }
  }
}
