// 대화 세션 저장 모듈 — Supabase conversations 테이블
// fire-and-forget 패턴: 저장 실패가 메인 플로우를 차단하지 않음
import { createClient } from '@supabase/supabase-js'
import { ENV } from './config.js'

let supabase = null

function getClient() {
  if (!supabase && ENV.SUPABASE_URL && ENV.SUPABASE_ANON_KEY) {
    supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY)
  }
  return supabase
}

/**
 * 메시지를 conversations 테이블에 저장 (fire-and-forget)
 * @param {string} sessionId
 * @param {'user'|'assistant'|'agent'|'system'} role
 * @param {string} content
 * @param {object} [metadata] - { model, complexity, confidence_score, customer_id }
 */
export function saveMessage(sessionId, role, content, metadata = {}) {
  try {
    const client = getClient()
    if (!client || !sessionId) return

    // fire-and-forget: 프로미스를 반환하지만 await하지 않음
    client
      .from('conversations')
      .insert({
        session_id: sessionId,
        role,
        content,
        metadata: Object.keys(metadata).length > 0 ? metadata : {},
      })
      .then(({ error }) => {
        if (error) console.error('[sessionStore] 저장 실패:', error.message)
      })
      .catch((err) => console.error('[sessionStore] 저장 오류:', err.message))
  } catch (err) {
    console.error('[sessionStore] saveMessage 예외:', err.message)
  }
}

/**
 * 세션 대화 이력 조회 (최신순)
 * @param {string} sessionId
 * @param {number} [limit=50]
 * @returns {Promise<Array>}
 */
export async function getSessionHistory(sessionId, limit = 50) {
  try {
    const client = getClient()
    if (!client || !sessionId) return []

    const { data, error } = await client
      .from('conversations')
      .select('role, content, metadata, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[sessionStore] 이력 조회 실패:', error.message)
      return []
    }
    return data || []
  } catch (err) {
    console.error('[sessionStore] getSessionHistory 예외:', err.message)
    return []
  }
}

/**
 * 고객의 이전 세션 대화 이력 조회 (장기 메모리)
 * metadata.customer_id로 같은 고객의 과거 세션을 찾아 요약 반환
 * @param {string} customerId - 고객 ID
 * @param {string} currentSessionId - 현재 세션 (제외)
 * @param {number} [limit=20] - 최대 메시지 수
 * @returns {Promise<Array<{role: string, content: string, created_at: string, session_id: string}>>}
 */
export async function getCustomerPastSessions(customerId, currentSessionId, limit = 20) {
  try {
    const client = getClient()
    if (!client || !customerId) return []

    const { data, error } = await client
      .from('conversations')
      .select('role, content, session_id, created_at')
      .neq('session_id', currentSessionId || '')
      .contains('metadata', { customer_id: customerId })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[sessionStore] 이전 세션 조회 실패:', error.message)
      return []
    }
    return data || []
  } catch (err) {
    console.error('[sessionStore] getCustomerPastSessions 예외:', err.message)
    return []
  }
}

/**
 * 이전 세션 이력을 프롬프트용 텍스트로 포맷
 * @param {Array} pastMessages - getCustomerPastSessions 결과
 * @returns {string} 프롬프트에 삽입할 텍스트
 */
export function formatPastSessionsForPrompt(pastMessages) {
  if (!pastMessages?.length) return ''

  // 세션별로 그룹핑
  const sessions = new Map()
  for (const msg of pastMessages) {
    if (!sessions.has(msg.session_id)) sessions.set(msg.session_id, [])
    sessions.get(msg.session_id).push(msg)
  }

  const lines = []
  let sessionNum = 0
  for (const [sid, msgs] of sessions) {
    sessionNum++
    if (sessionNum > 3) break // 최근 3개 세션만
    const date = msgs[0]?.created_at?.split('T')[0] || ''
    lines.push(`[이전 상담 ${sessionNum} (${date})]`)
    // 시간순 정렬 후 요약
    const sorted = msgs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    for (const m of sorted.slice(0, 6)) { // 세션당 최대 6턴
      const role = m.role === 'user' ? '고객' : 'AI'
      const text = m.content.length > 150 ? m.content.slice(0, 150) + '...' : m.content
      lines.push(`${role}: ${text}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}
