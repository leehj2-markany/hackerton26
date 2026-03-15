// ANY 브릿지 — Backend API 클라이언트
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// DEMO_MODE: true면 프론트엔드 mock 데이터 사용, false면 백엔드 API 호출
const USE_BACKEND = import.meta.env.VITE_USE_BACKEND === 'true'

async function request(path, options = {}) {
  const url = `${API_URL}${path}`
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }))
    throw new Error(err.error?.message || `API Error: ${res.status}`)
  }
  return res.json()
}

// 1. 챗봇 메시지 전송
export async function sendMessage(message, customerId, sessionId, conversationHistory = []) {
  return request('/chat', {
    method: 'POST',
    body: JSON.stringify({ message, customerId, sessionId, conversationHistory }),
  })
}

// 1-1. 챗봇 메시지 전송 (SSE 스트리밍)
// onToken(text): 토큰 단위 콜백, onMeta(data): 메타데이터 콜백
// 반환: { answer, confidence, needsEscalation, ... }
export async function sendMessageStream(message, customerId, sessionId, conversationHistory = [], { onToken, onMeta } = {}) {
  const url = `${API_URL}/chat`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, customerId, sessionId, conversationHistory, stream: true }),
  })
  if (!res.ok) {
    throw new Error(`Stream API Error: ${res.status}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let finalData = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    let currentEvent = null
    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7).trim()
      } else if (line.startsWith('data: ') && currentEvent) {
        try {
          const data = JSON.parse(line.slice(6))
          if (currentEvent === 'token' && onToken) {
            onToken(data.text)
          } else if (currentEvent === 'meta' && onMeta) {
            onMeta(data)
          } else if (currentEvent === 'done') {
            finalData = data
          } else if (currentEvent === 'error') {
            throw new Error(data.message || 'Stream error')
          }
        } catch (e) {
          if (e.message === 'Stream error' || e.message?.includes('Stream')) throw e
        }
        currentEvent = null
      }
    }
  }

  return { success: true, data: finalData }
}

// 2. 고객 매칭
export async function matchCustomer(customerName) {
  return request('/customer/match', {
    method: 'POST',
    body: JSON.stringify({ customerName }),
  })
}

// 3. 에스컬레이션 요청
export async function escalateCase(caseData) {
  return request('/escalate', {
    method: 'POST',
    body: JSON.stringify(caseData),
  })
}

// 4. 담당자 입장 상태 조회
export async function getAgentStatus(channelId) {
  return request(`/escalate/${channelId}/members`)
}

// 5. 케이스 상태 조회
export async function getCaseStatus(caseId) {
  return request(`/case/${caseId}`)
}

// 6. 대시보드 데이터
export async function getDashboardStats(period = 'all') {
  return request(`/dashboard/stats?period=${period}`)
}

// 7. 헬스 체크
export async function checkHealth() {
  return request('/health')
}

// 8. Slack 질문 전송 (실제 담당자에게)
export async function sendSlackQuestion(question, assignees, customerName, caseContext, channelId) {
  return request('/slack/send', {
    method: 'POST',
    body: JSON.stringify({ question, assignees, customerName, caseContext, channelId }),
  })
}

// 9. Slack 답변 폴링 (실제 담당자 응답 수신)
export async function pollSlackMessages(sinceTs, limit = 20, channelId) {
  const params = new URLSearchParams()
  if (sinceTs) params.set('since', sinceTs)
  if (limit) params.set('limit', String(limit))
  if (channelId) params.set('channelId', channelId)
  return request(`/slack/poll?${params.toString()}`)
}

export { API_URL }

// 10. 세션 종료 (채널 보관 + DM 발송)
export async function closeSession(channelId, sessionId, customerInfo) {
  return request('/session/close', {
    method: 'POST',
    body: JSON.stringify({ channelId, sessionId, customerInfo }),
  })
}

// 11. 피드백 제출
export async function submitFeedback(feedbackData) {
  return request('/feedback', {
    method: 'POST',
    body: JSON.stringify(feedbackData),
  })
}

// 12. 세션 종료 (sendBeacon용 — 탭 닫기/리프레시 시)
export function closeSessionBeacon(channelId, sessionId, customerInfo) {
  const url = `${API_URL}/session/close`
  const body = JSON.stringify({ channelId, sessionId, customerInfo })
  navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }))
}
