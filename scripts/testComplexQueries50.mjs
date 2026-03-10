#!/usr/bin/env node
// 복합질문 50개 벡터 검색 테스트
// [의도] 실제 고객 질문 패턴을 시뮬레이션하여 RAG 정밀도 검증
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { config } from 'dotenv'

config({ path: '.env' })

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' })

async function testQuery(idx, query, expectedProducts = []) {
  const result = await embeddingModel.embedContent({
    content: { parts: [{ text: query }] },
    taskType: 'RETRIEVAL_QUERY',
  })
  const { data, error } = await supabase.rpc('match_knowledge', {
    query_embedding: result.embedding.values,
    match_count: 5,
    filter: {},
  })
  if (error) { console.error(`❌ [${idx}] "${query}" RPC 실패:`, error.message); return null }

  const top5 = data.map(r => r.metadata?.product_name)
  const hits = expectedProducts.filter(p => top5.includes(p))
  const miss = expectedProducts.filter(p => !top5.includes(p))
  const icon = miss.length === 0 ? '✅' : hits.length > 0 ? '🟡' : '❌'

  console.log(`\n${icon} [${idx}] "${query}"`)
  console.log(`   기대: ${expectedProducts.join(', ')}`)
  data.forEach((r, i) => {
    const mark = expectedProducts.includes(r.metadata?.product_name) ? ' ◀' : ''
    console.log(`   ${i+1}. [${(r.similarity*100).toFixed(1)}%] ${r.metadata?.product_name}${mark}`)
  })
  if (miss.length > 0) console.log(`   ⚠️ 미검출: ${miss.join(', ')}`)
  return { idx, query, hits: hits.length, miss: miss.length, total: expectedProducts.length, missNames: miss }
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

console.log('='.repeat(70))
console.log('  마크애니 RAG 복합질문 50개 테스트')
console.log('='.repeat(70))

const results = []

// ── 복합질문 50개: 실제 고객 시나리오 기반 ──
const queries = [
  // ── 2제품 조합 (20개) ──
  // 1. DRM + 출력보안
  ['문서 암호화하면서 인쇄할 때 워터마크도 넣고 싶어요', ['Document SAFER', 'Print SAFER']],
  // 2. DRM + 화면보안
  ['사내 문서 암호화하고 화면 캡처도 차단하고 싶습니다', ['Document SAFER', 'Screen SAFER']],
  // 3. DRM + 개인정보
  ['문서 암호화랑 개인정보 탐지를 같이 하고 싶어요', ['Document SAFER', 'Privacy SAFER']],
  // 4. DLP + USB
  ['PC에서 파일 유출 막고 USB도 통제하고 싶습니다', ['SafePC Enterprise', 'SafeUSB']],
  // 5. 모바일 뷰어 + 캡처방지
  ['모바일에서 문서 보면서 캡처 방지도 하고 싶어요', ['Mobile DOCS', 'Mobile Capture SAFER']],
  // 6. 모바일 보안 + 워터마크
  ['모바일 문서 암호화하면서 화면에 워터마크도 넣고 싶습니다', ['Mobile SAFER', 'Mobile STICKER']],
  // 7. 서버DRM + 클라이언트DRM
  ['서버랑 클라이언트 양쪽에서 DRM 연동 개발해야 합니다', ['Document SAFER I/F (Server)', 'Document SAFER I/F (Client)']],
  // 8. 위변조방지 + DNA
  ['전자문서 위변조 방지하고 원본 검증도 하고 싶어요', ['ePage SAFER', 'ePS Document DNA']],
  // 9. 웹DRM + 웹보안
  ['웹에서 문서 DRM 걸고 브라우저 보안도 적용하고 싶습니다', ['Web SAFER', 'ePage SAFER for Web DRM']],
  // 10. 출력추적 + 화면추적
  ['출력물이랑 화면 둘 다 비가시성 워터마크로 추적하고 싶어요', ['Print TRACER', 'Screen TRACER']],
  // 11. 국방 + 암호모듈
  ['국방 환경에서 모바일 보안하면서 KCMVP 암호모듈도 써야 합니다', ['국방모바일보안', 'MACRYPTO V3.0 (KCMVP)']],
  // 12. 출력추적 + 화면추적
  ['출력물 추적하면서 화면도 비가시성 워터마크로 추적하고 싶습니다', ['Print TRACER', 'Screen TRACER']],
  // 13. iOS + 모바일캡처
  ['아이폰이랑 안드로이드 둘 다 캡처 방지해야 합니다', ['iScreen SAFER', 'Mobile Capture SAFER']],
  // 14. 외부반출 + DRM
  ['협력사에 문서 보내면서 DRM 보안도 유지하고 싶어요', ['Cowork SAFER', 'Document SAFER']],
  // 15. DLP + 개인정보
  ['PC 정보유출 방지하면서 개인정보 파일도 탐지하고 싶습니다', ['SafePC Enterprise', 'Privacy SAFER']],
  // 16. 화면보안 + 화면추적
  ['화면 캡처 차단하면서 비가시성 워터마크도 넣고 싶어요', ['Screen SAFER', 'Screen TRACER']],
  // 17. 문서병합 + 위변조방지
  ['여러 문서 병합하고 위변조 방지도 적용하고 싶습니다', ['ePS DocumentMerger', 'ePage SAFER']],
  // 18. 서버DRM + 웹보안
  ['서버에서 암호화하고 웹 브라우저에서 보여주고 싶어요', ['Document SAFER I/F (Server)', 'Web SAFER']],
  // 19. 모바일뷰어 + 모바일워터마크
  ['모바일에서 문서 열람하면서 사용자 정보 워터마크도 표시하고 싶어요', ['Mobile DOCS', 'Mobile STICKER']],
  // 20. USB + DRM
  ['USB로 문서 반출할 때 암호화 유지하면서 매체 통제도 하고 싶습니다', ['SafeUSB', 'Document SAFER']],

  // ── 3제품 조합 (20개) ──
  // 21. DRM + 출력 + 화면
  ['문서 암호화, 인쇄 워터마크, 화면 캡처 방지 세 가지 다 필요합니다', ['Document SAFER', 'Print SAFER', 'Screen SAFER']],
  // 22. 모바일 3종
  ['모바일에서 문서 보고 캡처 방지하고 워터마크도 넣어야 합니다', ['Mobile DOCS', 'Mobile Capture SAFER', 'Mobile STICKER']],
  // 23. DRM + 개인정보 + DLP
  ['문서 암호화하고 개인정보 탐지하고 PC 유출도 방지해야 합니다', ['Document SAFER', 'Privacy SAFER', 'SafePC Enterprise']],
  // 24. 위변조 + DNA + 웹
  ['전자문서 위변조 방지하고 원본 검증하면서 웹에서도 보안 적용하고 싶어요', ['ePage SAFER', 'ePS Document DNA', 'ePage SAFER for Web DRM']],
  // 25. 서버DRM + 클라이언트DRM + 웹
  ['서버 클라이언트 양쪽 DRM 연동하고 웹에서도 보여줘야 합니다', ['Document SAFER I/F (Server)', 'Document SAFER I/F (Client)', 'Web SAFER']],
  // 26. 출력추적 + 화면추적 + 화면보안
  ['출력물 추적, 화면 추적, 화면 캡처 차단 전부 필요합니다', ['Print TRACER', 'Screen TRACER', 'Screen SAFER']],
  // 27. DRM + 외부반출 + USB
  ['문서 암호화하고 협력사 반출 제어하면서 USB도 통제해야 합니다', ['Document SAFER', 'Cowork SAFER', 'SafeUSB']],
  // 28. 국방 + 모바일뷰어 + 암호모듈
  ['국방 모바일 보안에 문서 뷰어랑 KCMVP 암호모듈 적용해야 합니다', ['국방모바일보안', 'Mobile DOCS', 'MACRYPTO V3.0 (KCMVP)']],
  // 29. DRM + 화면보안 + 출력추적
  ['문서 암호화하고 화면 캡처 막으면서 출력물도 추적하고 싶어요', ['Document SAFER', 'Screen SAFER', 'Print TRACER']],
  // 30. 모바일보안 + 캡처방지 + iOS
  ['안드로이드 iOS 모바일 전부 문서 보안하고 캡처 방지해야 합니다', ['Mobile SAFER', 'Mobile Capture SAFER', 'iScreen SAFER']],
  // 31. DLP + USB + 개인정보
  ['PC 유출 방지, USB 통제, 개인정보 탐지 세 가지 다 해야 합니다', ['SafePC Enterprise', 'SafeUSB', 'Privacy SAFER']],
  // 32. 웹DRM + 문서병합 + 위변조
  ['웹에서 전자문서 DRM 걸고 병합하면서 위변조 방지도 해야 합니다', ['ePage SAFER for Web DRM', 'ePS DocumentMerger', 'ePage SAFER']],
  // 33. DRM + 모바일뷰어 + 모바일캡처
  ['사내 문서 암호화하고 모바일에서 열람하면서 캡처도 방지해야 합니다', ['Document SAFER', 'Mobile DOCS', 'Mobile Capture SAFER']],
  // 34. 화면추적SDK + 출력추적SDK + 웹추적SDK
  ['화면, 출력, 웹 전부 추적 SDK로 연동해야 합니다', ['TRACER SDK for Screen', 'TRACER SDK for Print', 'TRACER SDK for Web']],
  // 35. DRM + 서버DRM + 암호모듈
  ['문서 암호화하고 서버 DRM 연동하면서 KCMVP 암호모듈도 적용해야 합니다', ['Document SAFER', 'Document SAFER I/F (Server)', 'MACRYPTO V3.0 (KCMVP)']],
  // 36. 출력보안 + 출력추적 + 화면보안
  ['인쇄 워터마크 넣고 출력물 추적하면서 화면 캡처도 막아야 합니다', ['Print SAFER', 'Print TRACER', 'Screen SAFER']],
  // 37. 모바일워터마크 + 모바일캡처 + 모바일추적SDK
  ['모바일 화면 워터마크 넣고 캡처 방지하면서 추적 SDK도 연동해야 합니다', ['Mobile STICKER', 'Mobile Capture SAFER', 'TRACER SDK for Mobile']],
  // 38. 외부반출 + 웹보안 + DRM
  ['협력사 문서 반출 제어하면서 웹 보안이랑 DRM도 적용해야 합니다', ['Cowork SAFER', 'Web SAFER', 'Document SAFER']],
  // 39. 위변조 + 음성바코드 + DNA
  ['전자문서 위변조 방지하고 음성 바코드랑 디지털 지문도 넣어야 합니다', ['ePage SAFER', 'VoiceBarcode', 'ePS Document DNA']],
  // 40. DRM + 개인정보 + 화면보안
  ['문서 암호화하고 개인정보 보호하면서 화면 캡처도 차단해야 합니다', ['Document SAFER', 'Privacy SAFER', 'Screen SAFER']],

  // ── 4제품 이상 조합 + 시나리오형 (10개) ──
  // 41. 대기업 통합 보안
  ['대기업에서 문서 암호화, 인쇄 보안, 화면 보안, USB 통제 전부 도입하고 싶습니다', ['Document SAFER', 'Print SAFER', 'Screen SAFER', 'SafePC Enterprise']],
  // 42. 공공기관 종합 보안
  ['공공기관에서 문서 DRM 적용하고 개인정보 보호하면서 KCMVP 인증도 받아야 합니다', ['Document SAFER', 'Privacy SAFER', 'MACRYPTO V3.0 (KCMVP)']],
  // 43. 금융기관 문서 보안
  ['금융기관에서 문서 암호화하고 출력물 추적하면서 개인정보 탐지도 해야 합니다', ['Document SAFER', 'Print TRACER', 'Privacy SAFER']],
  // 44. 제조업 설계문서 보안
  ['제조업에서 CAD 설계문서 암호화하고 외부 반출 제어하면서 USB도 통제해야 합니다', ['Document SAFER', 'Cowork SAFER', 'SafeUSB']],
  // 45. 모바일 오피스 종합
  ['모바일 오피스에서 문서 열람, 캡처 방지, 워터마크, 문서 암호화 전부 필요합니다', ['Mobile DOCS', 'Mobile Capture SAFER', 'Mobile STICKER', 'Mobile SAFER']],
  // 46. 웹 시스템 종합 보안
  ['웹 기반 업무 시스템에서 문서 DRM 걸고 위변조 방지하면서 추적도 해야 합니다', ['Web SAFER', 'ePage SAFER', 'TRACER SDK for Web']],
  // 47. 교육기관 시나리오
  ['학교에서 수료증 위변조 방지하고 교육자료 유출 막으면서 온라인 시험 화면도 보호해야 합니다', ['ePage SAFER', 'Document SAFER', 'Screen SAFER']],
  // 48. 국방 종합 시나리오
  ['군에서 모바일 문서 보안하고 KCMVP 적용하면서 화면 캡처도 방지해야 합니다', ['국방모바일보안', 'MACRYPTO V3.0 (KCMVP)', 'Mobile Capture SAFER']],
  // 49. 방송/미디어 시나리오
  ['방송사에서 대본 문서 유출 막고 출력물도 추적하면서 화면 캡처도 방지하고 싶습니다', ['Document SAFER', 'Print TRACER', 'Screen SAFER']],
  // 50. 연구소 종합 보안
  ['연구소에서 연구문서 암호화하고 서버 DRM 연동하면서 화면 캡처 방지랑 출력 추적도 해야 합니다', ['Document SAFER', 'Document SAFER I/F (Server)', 'Screen SAFER', 'Print TRACER']],
]

// ── 실행 ──
for (let i = 0; i < queries.length; i++) {
  const [query, expected] = queries[i]
  const r = await testQuery(i + 1, query, expected)
  results.push(r)
  if (i < queries.length - 1) await sleep(200)
}

// ── 결과 요약 ──
console.log('\n' + '='.repeat(70))
console.log('  복합질문 50개 결과 요약')
console.log('='.repeat(70))
const valid = results.filter(r => r)
const perfect = valid.filter(r => r.miss === 0)
const partial = valid.filter(r => r.miss > 0 && r.hits > 0)
const failed = valid.filter(r => r.hits === 0)
console.log(`총 ${valid.length}개 쿼리 | ✅ 완전 매칭: ${perfect.length} | 🟡 부분 매칭: ${partial.length} | ❌ 미매칭: ${failed.length}`)
console.log(`정확도: ${((perfect.length / valid.length) * 100).toFixed(1)}% (완전) / ${(((perfect.length + partial.length) / valid.length) * 100).toFixed(1)}% (부분 포함)`)
if (partial.length > 0) {
  console.log('\n🟡 부분 매칭 상세:')
  partial.forEach(r => console.log(`   [${r.idx}] "${r.query}" — 미검출: ${r.missNames.join(', ')}`))
}
if (failed.length > 0) {
  console.log('\n❌ 미매칭 상세:')
  failed.forEach(r => console.log(`   [${r.idx}] "${r.query}" — 미검출: ${r.missNames.join(', ')}`))
}
