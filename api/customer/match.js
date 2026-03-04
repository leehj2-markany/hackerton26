// POST /api/customer/match — 고객 매칭
import { cors, json, error } from '../_lib/cors.js'
import { customers, customerNameMap } from '../_lib/mockData.js'

export default async function handler(req, res) {
  if (cors(req, res)) return
  if (req.method !== 'POST') return error(res, 'METHOD_NOT_ALLOWED', 'POST만 허용됩니다', 405)

  const { customerName } = req.body || {}

  if (!customerName?.trim()) {
    return error(res, 'INVALID_INPUT', '고객명이 비어있습니다.')
  }

  // 퍼지 매칭
  const key = Object.keys(customerNameMap).find(k =>
    customerName.includes(k) || k.includes(customerName)
  )
  const customerId = key ? customerNameMap[key] : null
  const customer = customerId ? customers[customerId] : null

  if (!customer) {
    return json(res, {
      success: true,
      data: { matched: false, message: '등록되지 않은 고객입니다. 고객명을 다시 확인해 주세요.' },
    })
  }

  return json(res, {
    success: true,
    data: { matched: true, customerInfo: customer },
  })
}
