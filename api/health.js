// GET /api/health — 서버 상태 확인
import { cors, json } from './_lib/cors.js'
import { ENV } from './_lib/config.js'

export default function handler(req, res) {
  if (cors(req, res)) return

  return json(res, {
    status: 'ok',
    service: 'anybridge-backend',
    version: '1.0.0',
    demoMode: ENV.DEMO_MODE,
    timestamp: new Date().toISOString(),
    services: {
      gemini: !!ENV.GEMINI_API_KEY,
      claude: !!ENV.CLAUDE_API_KEY,
      supabase: !!ENV.SUPABASE_URL,
      slack: !!ENV.SLACK_BOT_TOKEN,
    },
  })
}
