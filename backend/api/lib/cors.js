// CORS 미들웨어 - Vercel Serverless Functions용
const ALLOWED_ORIGINS = [
  'https://hackerton-kappa.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
]

export function cors(req, res) {
  const origin = req.headers.origin || ''
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ''
  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Max-Age', '86400')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return true
  }
  return false
}

export function json(res, data, status = 200) {
  res.status(status).json(data)
}

export function error(res, code, message, status = 400) {
  res.status(status).json({ success: false, error: { code, message } })
}
