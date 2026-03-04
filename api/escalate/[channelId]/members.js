// GET /api/escalate/{channelId}/members — 담당자 입장 상태 조회
import { cors, json, error } from '../_lib/cors.js'
import { agents } from '../_lib/mockData.js'

export default async function handler(req, res) {
  if (cors(req, res)) return
  if (req.method !== 'GET') return error(res, 'METHOD_NOT_ALLOWED', 'GET만 허용됩니다', 405)

  const { channelId } = req.query

  if (!channelId) {
    return error(res, 'INVALID_INPUT', 'channelId가 필요합니다.')
  }

  // 데모: 모든 담당자가 순차 입장한 상태 반환
  const now = Date.now()
  const members = agents.map((a, i) => ({
    ...a,
    joined: true,
    joinedAt: new Date(now - (agents.length - i) * 2000).toISOString(),
  }))

  return json(res, {
    success: true,
    data: {
      channelId,
      members,
      progress: `${agents.length}/${agents.length}`,
      totalMembers: agents.length,
      joinedMembers: agents.length,
    },
  })
}
