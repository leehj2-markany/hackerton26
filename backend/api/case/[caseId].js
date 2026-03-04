// GET /api/case/{caseId} — 케이스 상태 조회
import { cors, json, error } from '../lib/cors.js'

export default async function handler(req, res) {
  if (cors(req, res)) return
  if (req.method !== 'GET') return error(res, 'METHOD_NOT_ALLOWED', 'GET만 허용됩니다', 405)

  const { caseId } = req.query

  if (!caseId) {
    return error(res, 'INVALID_INPUT', 'caseId가 필요합니다.')
  }

  // 데모: 타임라인 생성
  const baseTime = new Date()
  const timeline = [
    { timestamp: new Date(baseTime - 60000).toISOString(), event: 'case_created', description: '케이스 생성' },
    { timestamp: new Date(baseTime - 55000).toISOString(), event: 'ai_response', description: 'AI 1차 답변 생성' },
    { timestamp: new Date(baseTime - 50000).toISOString(), event: 'escalation_requested', description: '담당자 연결 요청' },
    { timestamp: new Date(baseTime - 45000).toISOString(), event: 'agent_joined', description: '채소희 (고객센터) 입장' },
    { timestamp: new Date(baseTime - 40000).toISOString(), event: 'agent_joined', description: '송인찬 (어카운트 매니저) 입장' },
    { timestamp: new Date(baseTime - 35000).toISOString(), event: 'agent_joined', description: '이현진 (SE) 입장' },
    { timestamp: new Date(baseTime - 30000).toISOString(), event: 'agent_joined', description: '박우호 (개발리더) 입장' },
  ]

  return json(res, {
    success: true,
    data: {
      caseId,
      customerId: 'defense',
      customerName: '국방부',
      status: 'escalated',
      createdAt: timeline[0].timestamp,
      updatedAt: timeline[timeline.length - 1].timestamp,
      timeline,
    },
  })
}
