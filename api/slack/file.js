// GET /api/slack/file?url=<slack_url_private> — Slack 파일 다운로드 프록시
// Slack url_private는 토큰이 필요하므로 백엔드에서 프록시
import { cors, error } from '../_lib/cors.js'
import { ENV } from '../_lib/config.js'

export default async function handler(req, res) {
  if (cors(req, res)) return
  if (req.method !== 'GET') return error(res, 'METHOD_NOT_ALLOWED', 'GET만 허용됩니다', 405)

  const { url } = req.query
  if (!url || !url.startsWith('https://files.slack.com/')) {
    return error(res, 'INVALID_URL', 'Slack 파일 URL만 허용됩니다', 400)
  }

  try {
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${ENV.SLACK_BOT_TOKEN}` }
    })

    if (!response.ok) {
      return error(res, 'SLACK_ERROR', `Slack 파일 다운로드 실패: ${response.status}`, 502)
    }

    // 원본 Content-Type과 Content-Disposition 전달
    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const fileName = req.query.name || 'download'

    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`)
    res.setHeader('Cache-Control', 'private, max-age=3600')

    const buffer = Buffer.from(await response.arrayBuffer())
    res.send(buffer)
  } catch (err) {
    console.error('[slack/file] 프록시 실패:', err.message)
    return error(res, 'PROXY_ERROR', err.message, 500)
  }
}
