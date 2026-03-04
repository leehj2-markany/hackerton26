// 로컬 개발 서버 — Vercel Serverless Functions를 Express로 래핑
import { createServer } from 'http'
import { parse } from 'url'
import dotenv from 'dotenv'
dotenv.config()

const PORT = process.env.PORT || 3000

// 핸들러 매핑
const handlers = {}

async function loadHandlers() {
  handlers['/api/health'] = (await import('./api/health.js')).default
  handlers['/api/chat'] = (await import('./api/chat.js')).default
  handlers['/api/customer/match'] = (await import('./api/customer/match.js')).default
  handlers['/api/escalate'] = (await import('./api/escalate.js')).default
  handlers['/api/dashboard/stats'] = (await import('./api/dashboard/stats.js')).default
  // 동적 라우트는 아래에서 처리
}

const server = createServer(async (req, res) => {
  const { pathname, query } = parse(req.url, true)

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return }

  // body 파싱
  let body = ''
  if (req.method === 'POST') {
    body = await new Promise(resolve => {
      let data = ''
      req.on('data', chunk => data += chunk)
      req.on('end', () => resolve(data))
    })
  }

  // Express-like req/res 래핑
  const fakeReq = {
    method: req.method,
    headers: req.headers,
    query: query || {},
    body: body ? JSON.parse(body) : {},
  }
  const fakeRes = {
    statusCode: 200,
    _headers: {},
    setHeader(k, v) { this._headers[k] = v },
    status(code) { this.statusCode = code; return this },
    json(data) {
      res.writeHead(this.statusCode, { 'Content-Type': 'application/json', ...this._headers })
      res.end(JSON.stringify(data))
    },
    end() { res.writeHead(this.statusCode, this._headers); res.end() },
  }

  try {
    // 정적 라우트
    if (handlers[pathname]) {
      await handlers[pathname](fakeReq, fakeRes)
      return
    }

    // Slack 라우트: /api/slack/send, /api/slack/poll
    if (pathname === '/api/slack/send') {
      const handler = (await import('./api/slack/send.js')).default
      await handler(fakeReq, fakeRes)
      return
    }
    if (pathname === '/api/slack/poll') {
      const handler = (await import('./api/slack/poll.js')).default
      await handler(fakeReq, fakeRes)
      return
    }

    // 동적 라우트: /api/case/{caseId}
    const caseMatch = pathname.match(/^\/api\/case\/(.+)$/)
    if (caseMatch) {
      fakeReq.query.caseId = caseMatch[1]
      const handler = (await import('./api/case/[caseId].js')).default
      await handler(fakeReq, fakeRes)
      return
    }

    // 동적 라우트: /api/escalate/{channelId}/members
    const membersMatch = pathname.match(/^\/api\/escalate\/(.+)\/members$/)
    if (membersMatch) {
      fakeReq.query.channelId = membersMatch[1]
      const handler = (await import('./api/escalate/[channelId]/members.js')).default
      await handler(fakeReq, fakeRes)
      return
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ success: false, error: { code: 'NOT_FOUND', message: `${pathname} not found` } }))
  } catch (err) {
    console.error('Server error:', err)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } }))
  }
})

await loadHandlers()
server.listen(PORT, () => {
  console.log(`\n🚀 ANY 브릿지 Backend 서버 시작`)
  console.log(`   http://localhost:${PORT}/api/health`)
  console.log(`   DEMO_MODE: ${process.env.DEMO_MODE || 'true'}`)
  console.log(`\n📡 API 엔드포인트:`)
  console.log(`   POST /api/chat`)
  console.log(`   POST /api/customer/match`)
  console.log(`   POST /api/escalate`)
  console.log(`   GET  /api/escalate/{channelId}/members`)
  console.log(`   GET  /api/case/{caseId}`)
  console.log(`   GET  /api/dashboard/stats`)
  console.log(`   POST /api/slack/send`)
  console.log(`   GET  /api/slack/poll`)
  console.log(`   GET  /api/health\n`)
})
