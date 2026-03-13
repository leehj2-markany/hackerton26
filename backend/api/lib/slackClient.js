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
export async function postAiCopilotSuggestion(channelId, question, suggestion, references = []) {
  log('postAiCopilot', `channel=${channelId}, question=${question?.slice(0, 40)}..., refs=${references.length}`)

  // RAG 참조 근거 텍스트 생성 (내부 담당자용)
  const refText = references.length > 0
    ? references.map((r, i) => `${i + 1}. 📄 *${r.title}* (유사도: ${r.score || '-'})\n   _${(r.snippet || '').slice(0, 120)}_`).join('\n')
    : '_(참조 문서 없음)_'

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
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*📚 참조 근거 (지식 베이스):*\n${refText}`,
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
    // [의도] 에러를 빈 배열로 삼키지 않고, 호출자가 에러 원인을 알 수 있도록 에러 정보 포함
    console.error('[Slack:getChannelHistory] 실패:', err.message)
    // not_in_channel 에러면 자동 참여 후 재시도
    if (err.message.includes('not_in_channel') || err.message.includes('channel_not_found')) {
      log('getChannelHistory', `Bot이 채널에 없음 → 자동 참여 시도: ${channelId}`)
      const joined = await ensureBotInChannel(channelId)
      if (joined) {
        try {
          const retryData = await slackFetch('conversations.history', { channel: channelId, limit })
          return retryData.messages || []
        } catch (retryErr) {
          console.error('[Slack:getChannelHistory] 재시도 실패:', retryErr.message)
        }
      }
    }
    return []
  }
}

// ─── 6-1. ensureBotInChannel — Bot 자동 채널 참여 ───────

/**
 * [의도] Bot이 채널 멤버가 아니면 conversations.history가 channel_not_found 반환
 * → 폴링이 영원히 빈 배열을 받아 담당자 답변을 감지 못하는 근본 원인 해결
 * conversations.join은 이미 참여 중이면 무시되므로 idempotent하게 호출 가능
 */
export async function ensureBotInChannel(channelId) {
  if (isDemoMode() || !channelId) return false
  try {
    await slackFetch('conversations.join', { channel: channelId })
    log('ensureBotInChannel', `Bot 채널 참여 성공: ${channelId}`)
    return true
  } catch (err) {
    // method_not_supported_for_channel_type: private 채널은 join 불가 (invite 필요)
    // already_in_channel: 이미 참여 중 (정상)
    if (err.message.includes('already_in_channel')) {
      log('ensureBotInChannel', `이미 참여 중: ${channelId}`)
      return true
    }
    console.error('[Slack:ensureBotInChannel] 실패:', err.message)
    return false
  }
}

// ─── 7. createChannel — 실제 Slack 채널 생성 ────────────

/**
 * Slack 채널 생성 (conversations.create)
 * [Issue 16] 형식: esc-{고객사명}-{고객이름}-{대표솔루션1개}
 * - 예: esc-skhynix-홍길동-drm, esc-국방부--docsafer (이름 없으면 공란)
 * - 동일 조합 중복 시 -2, -3 suffix 추가
 *
 * @param {string} productName - 제품명 (영문, 예: 'drm', 'safeguard')
 * @param {string} [customerName] - 고객사명 (한글 가능, 예: 'SK하이닉스')
 * @param {string} [customerContactName] - 고객 담당자 이름 (한글 가능, 예: '홍길동')
 */
export async function createChannel(productName, customerName, customerContactName) {
  // 하위 호환: 기존 단일 인자 호출 지원
  if (!customerName && productName) {
    const legacy = productName
    productName = legacy.replace(/[가-힣\s]/g, '').replace(/^-+|-+$/g, '') || 'general'
  }

  // [Issue 16] 제품명 정규화: 영문 소문자+숫자+하이픈만 허용
  const safeProduct = (productName || 'general')
    .replace(/[^a-z0-9\s-]/gi, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '') || 'general'

  // [Issue 16] 고객사명 정규화: 한글+영문+숫자+하이픈 허용, Slack 채널명 규칙 준수
  const safeCustomer = (customerName || '')
    .replace(/[^a-z0-9가-힣\s-]/gi, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '') || ''

  // [Issue 16] 고객 담당자 이름 정규화 (없으면 공란 → 하이픈 2개 연속)
  const safeContact = (customerContactName || '')
    .replace(/[^a-z0-9가-힣\s-]/gi, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '')

  // [Issue 16] 최종 채널명: esc-{고객사명}-{고객이름}-{대표솔루션} (80자 이내)
  const baseChannelName = safeCustomer
    ? `esc-${safeCustomer}-${safeContact}-${safeProduct}`.replace(/--+/g, '-').replace(/-$/g, '').slice(0, 80)
    : `esc-${safeProduct}`.slice(0, 80)

  log('createChannel', `customer=${customerName || '(미지정)'}, contact=${customerContactName || '(없음)'}, product=${productName}, channelName=${baseChannelName}`)

  if (isDemoMode()) {
    const mockId = `C_DEMO_${Date.now().toString(36).toUpperCase()}`
    log('createChannel', '[DEMO] mock 채널 반환')
    return {
      id: mockId,
      name: `#${baseChannelName}`,
      url: `https://markany.slack.com/archives/${mockId}`,
      isSimulated: true,
      created: new Date().toISOString(),
    }
  }

  // [Issue 16] 중복 시 -2, -3 suffix 추가하여 재시도
  let channelName = baseChannelName
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
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
      if (err.message.includes('name_taken')) {
        channelName = `${baseChannelName}-${attempt + 2}`.slice(0, 80)
        log('createChannel', `이름 충돌 → 재시도: ${channelName}`)
        continue
      }
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

  const ts = Date.now().toString(36)
  channelName = `${baseChannelName}-${ts}`.slice(0, 80)
  try {
    const data = await slackFetch('conversations.create', { name: channelName, is_private: false })
    const ch = data.channel
    return { id: ch.id, name: `#${ch.name}`, url: `https://markany.slack.com/archives/${ch.id}`, isSimulated: false, created: new Date().toISOString() }
  } catch (finalErr) {
    console.error('[Slack:createChannel] 최종 실패:', finalErr.message)
    return { id: `C_DEMO_${ts.toUpperCase()}`, name: `#${channelName}`, url: '#', isSimulated: true, error: finalErr.message }
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

/** 채널 보관 (archive) */
export async function archiveChannel(channelId) {
  log('archiveChannel', `channel=${channelId}`)
  try {
    if (isDemoMode()) {
      log('archiveChannel', '[DEMO] 채널 보관 시뮬레이션')
      return { ok: true, demo: true }
    }
    return await slackFetch('conversations.archive', { channel: channelId })
  } catch (err) {
    console.error('[Slack:archiveChannel] 실패:', err.message)
    return { ok: false, error: err.message }
  }
}

/**
 * [Issue 17] 채널 삭제 (admin.conversations.delete)
 * Enterprise Grid 전용 API — 일반 플랜에서는 실패하므로 graceful fallback
 */
export async function deleteChannel(channelId) {
  log('deleteChannel', `channel=${channelId}`)
  try {
    if (isDemoMode()) {
      log('deleteChannel', '[DEMO] 채널 삭제 시뮬레이션')
      return { ok: true, demo: true }
    }
    const res = await fetch(`${SLACK_API}/admin.conversations.delete`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ channel_id: channelId }),
    })
    const data = await res.json()
    if (data.ok) {
      log('deleteChannel', `채널 삭제 성공: ${channelId}`)
      return { ok: true, deleted: true }
    }
    log('deleteChannel', `채널 삭제 불가 (${data.error}) — 보관 상태 유지`)
    return { ok: false, error: data.error, archived: true }
  } catch (err) {
    console.error('[Slack:deleteChannel] 실패:', err.message)
    return { ok: false, error: err.message, archived: true }
  }
}

/** 사용자에게 DM 전송 */
export async function sendDirectMessage(userId, text, blocks) {
  log('sendDirectMessage', `user=${userId}, text=${text?.slice(0, 50)}...`)
  try {
    if (isDemoMode()) {
      log('sendDirectMessage', '[DEMO] DM 전송 시뮬레이션')
      return { ok: true, demo: true }
    }
    // DM은 chat.postMessage에 channel=userId로 전송
    const body = { channel: userId, text }
    if (blocks) body.blocks = blocks
    const data = await slackFetch('chat.postMessage', body)
    return { ok: true, ts: data.ts, channel: data.channel }
  } catch (err) {
    console.error('[Slack:sendDirectMessage] 실패:', err.message)
    return { ok: false, error: err.message }
  }
}
