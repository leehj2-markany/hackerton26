// POST/GET /api/feedback — 피드백 수집 및 통계 조회
import { cors, json, error } from './_lib/cors.js'
import { ENV } from './_lib/config.js'

let supabase = null
async function getSupabase() {
  if (supabase) return supabase
  if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) return null
  try {
    const { createClient } = await import('@supabase/supabase-js')
    supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY)
    return supabase
  } catch { return null }
}

export default async function handler(req, res) {
  if (cors(req, res)) return

  if (req.method === 'POST') {
    const { session_id, message_index, question, answer, rating, comment, model, complexity, confidence_score } = req.body || {}
    if (!session_id || !question || !answer || !rating) {
      return error(res, 'MISSING_FIELDS', 'session_id, question, answer, rating are required')
    }

    const row = { session_id, message_index, question, answer, rating, comment: comment || null, model: model || null, complexity: complexity || null, confidence_score: confidence_score ?? null }

    const sb = await getSupabase()
    if (sb) {
      const { error: dbErr } = await sb.from('feedback').insert(row)
      if (dbErr) {
        // 테이블 미존재 등 DB 에러 시 fallback (로그만 남기고 성공 반환)
        console.error('Feedback insert error (fallback to log):', dbErr.message)
      }
    } else {
      console.log('[Feedback fallback]', row)
    }

    return json(res, { success: true })
  }

  if (req.method === 'GET') {
    const sb = await getSupabase()
    if (!sb) return json(res, { success: true, data: { total: 0, positive: 0, negative: 0, rate: 0, byModel: {} } })

    const { data, error: dbErr } = await sb.from('feedback').select('rating, model')
    if (dbErr) return error(res, 'DB_ERROR', dbErr.message, 500)

    const total = data.length
    const positive = data.filter(r => r.rating === 'positive').length
    const negative = total - positive
    const byModel = {}
    data.forEach(r => {
      const m = r.model || 'unknown'
      if (!byModel[m]) byModel[m] = { total: 0, positive: 0 }
      byModel[m].total++
      if (r.rating === 'positive') byModel[m].positive++
    })

    return json(res, { success: true, data: { total, positive, negative, rate: total ? +(positive / total * 100).toFixed(1) : 0, byModel } })
  }

  return error(res, 'METHOD_NOT_ALLOWED', 'Use GET or POST', 405)
}
