// 백엔드 API 단위 테스트 — 직접 handler 호출
import dotenv from 'dotenv'
dotenv.config()

// Mock req/res
function mockReq(method, body = {}, query = {}) {
  return { method, body, query, headers: { origin: 'http://localhost:5173' } }
}

function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(k, v) { this.headers[k] = v },
    status(code) { this.statusCode = code; return this },
    json(data) { this.body = data; return this },
    end() { return this },
  }
  return res
}

async function test(name, fn) {
  try {
    await fn()
    console.log(`✅ ${name}`)
  } catch (err) {
    console.log(`❌ ${name}: ${err.message}`)
  }
}

// Tests
async function run() {
  console.log('=== ANY 브릿지 Backend API 테스트 ===\n')

  // 1. Health
  const health = await import('./api/health.js')
  await test('GET /api/health', async () => {
    const req = mockReq('GET')
    const res = mockRes()
    health.default(req, res)
    if (res.body.status !== 'ok') throw new Error('health check failed')
    console.log('   demoMode:', res.body.demoMode, '| services:', JSON.stringify(res.body.services))
  })

  // 2. Customer Match
  const match = await import('./api/customer/match.js')
  await test('POST /api/customer/match (SK하이닉스)', async () => {
    const req = mockReq('POST', { customerName: 'SK하이닉스' })
    const res = mockRes()
    await match.default(req, res)
    if (!res.body.data.matched) throw new Error('should match')
    console.log('   customer:', res.body.data.customerInfo.name, '| product:', res.body.data.customerInfo.product)
  })

  await test('POST /api/customer/match (미등록)', async () => {
    const req = mockReq('POST', { customerName: '삼성전자' })
    const res = mockRes()
    await match.default(req, res)
    if (res.body.data.matched) throw new Error('should not match')
  })

  // 3. Chat
  const chat = await import('./api/chat.js')
  await test('POST /api/chat (단순 질문)', async () => {
    const req = mockReq('POST', {
      message: 'Document SAFER v3.2 업그레이드 시 성능 개선이 있나요?',
      customerId: 'skhynix',
      sessionId: 'test_session',
    })
    const res = mockRes()
    await chat.default(req, res)
    if (!res.body.success) throw new Error('chat failed')
    console.log('   confidence:', res.body.data.confidence, '| score:', res.body.data.confidenceScore)
    console.log('   answer:', res.body.data.answer.slice(0, 60) + '...')
    console.log('   thinking:', res.body.data.thinkingProcess.length, 'steps')
  })

  await test('POST /api/chat (복합 질문)', async () => {
    const req = mockReq('POST', {
      message: '국방부 맞춤형 DRM 구축이 가능한가요? 윈도우 11 호환성과 보안 인증 요구사항도 알려주세요',
      customerId: 'defense',
      sessionId: 'test_session',
    })
    const res = mockRes()
    await chat.default(req, res)
    if (!res.body.data.isComplex) throw new Error('should be complex')
    console.log('   isComplex:', res.body.data.isComplex, '| subQuestions:', res.body.data.subQuestions?.length)
  })

  // 4. Escalate
  const escalate = await import('./api/escalate.js')
  await test('POST /api/escalate', async () => {
    const req = mockReq('POST', {
      caseId: 'case_test',
      customerId: 'defense',
      question: '국방부 맞춤형 DRM 구축이 가능한가요?',
    })
    const res = mockRes()
    await escalate.default(req, res)
    if (!res.body.data.channelId) throw new Error('no channelId')
    console.log('   channelId:', res.body.data.channelId, '| agents:', res.body.data.agents.length)
  })

  // 5. Case
  const caseApi = await import('./api/case/[caseId].js')
  await test('GET /api/case/{caseId}', async () => {
    const req = mockReq('GET', {}, { caseId: 'case_test' })
    const res = mockRes()
    await caseApi.default(req, res)
    if (!res.body.data.timeline) throw new Error('no timeline')
    console.log('   status:', res.body.data.status, '| timeline:', res.body.data.timeline.length, 'events')
  })

  // 6. Dashboard
  const dashboard = await import('./api/dashboard/stats.js')
  await test('GET /api/dashboard/stats', async () => {
    const req = mockReq('GET', {}, { period: 'all' })
    const res = mockRes()
    await dashboard.default(req, res)
    if (res.body.data.totalCases !== 500) throw new Error('wrong total')
    console.log('   totalCases:', res.body.data.totalCases, '| aiResolved:', res.body.data.aiResolvedCases, '| rate:', res.body.data.firstResolutionRate + '%')
  })

  // 7. Escalate Members
  const members = await import('./api/escalate/[channelId]/members.js')
  await test('GET /api/escalate/{channelId}/members', async () => {
    const req = mockReq('GET', {}, { channelId: 'C_TEST' })
    const res = mockRes()
    await members.default(req, res)
    if (res.body.data.totalMembers !== 4) throw new Error('wrong member count')
    console.log('   members:', res.body.data.members.map(m => m.name).join(', '))
  })

  console.log('\n=== 테스트 완료 ===')
}

run().catch(console.error)
