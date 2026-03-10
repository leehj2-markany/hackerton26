#!/usr/bin/env node
// 벡터 검색 동작 확인용 1회성 테스트
import { config } from 'dotenv'
config({ path: '.env' })

import { searchKnowledge, formatContext } from '../api/_lib/knowledgeBase.js'

const queries = [
  { q: 'SafePC Enterprise 서버 환경이 뭐야?', hint: 'SafePC' },
  { q: 'DRM 인증 현황 알려줘', hint: 'DRM' },
  { q: 'ePage SAFER 브라우저 지원 범위', hint: null },
]

for (const { q, hint } of queries) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`Q: ${q}`)
  console.log(`hint: ${hint || '(없음)'}`)
  const result = await searchKnowledge(q, hint, 3)
  console.log(`searchType: ${result.searchType}`)
  console.log(`chunks: ${result.chunks.length}개`)
  result.chunks.forEach((c, i) => {
    console.log(`  [${i + 1}] ${c.title} (score: ${result.scores[i]})`)
  })
  console.log(`stores: ${result.stores.join(', ')}`)
}
