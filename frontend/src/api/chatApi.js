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
