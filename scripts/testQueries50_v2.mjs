#!/usr/bin/env node
// 테스트 쿼리 50개 v2 — 실제 고객 자연어 패턴 + 경계 케이스 + 업종별 시나리오
// [의도] 기존 50개(복합질문 조합)와 다른 각도: 간접 표현, 유의어, 업종 맥락, 경계 혼동 케이스
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
  return { idx, query, hits: hits.length, miss: miss.length, total: expectedProducts.length, missNames: miss, expectedProducts, top5 }
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

console.log('='.repeat(70))
console.log('  마크애니 RAG 테스트 쿼리 50개 v2')
console.log('  (자연어 패턴 + 경계 케이스 + 업종별 시나리오)')
console.log('='.repeat(70))

const results = []

const queries = [
  // ═══ A. 간접 표현 / 유의어 (제품명 없이 의도만) — 10개 ═══
  // 1. "DRM"이라는 단어 없이 문서 암호화 의도
  ['직원들이 퇴사할 때 회사 문서 가져가는 걸 막고 싶어요', ['Document SAFER']],
  // 2. 캡처 방지를 일상 언어로
  ['화면 스크린샷 찍는 거 막을 수 있나요', ['Screen SAFER']],
  // 3. USB 통제를 일상 언어로
  ['직원들이 USB에 파일 복사해서 빼돌리는 걸 차단하고 싶습니다', ['SafeUSB']],
  // 4. 개인정보 탐지를 컴플라이언스 관점으로
  ['개인정보보호법 준수를 위해 사내 파일에서 주민번호 같은 거 자동으로 찾아야 합니다', ['Privacy SAFER']],
  // 5. 출력 추적을 일상 언어로
  ['누가 어떤 문서를 프린터로 출력했는지 추적하고 싶어요', ['Print TRACER']],
  // 6. 모바일 문서 열람을 일상 언어로
  ['출장 중에 스마트폰으로 사내 문서 볼 수 있게 해주세요', ['Mobile DOCS']],
  // 7. 외부 협력사 문서 공유를 일상 언어로
  ['외주 업체한테 도면 보내야 하는데 유출 안 되게 하고 싶어요', ['Cowork SAFER']],
  // 8. 웹 브라우저 보안을 일상 언어로
  ['크롬에서 사내 문서 열 때 다운로드 못 하게 막고 싶습니다', ['Web SAFER']],
  // 9. 인쇄 워터마크를 일상 언어로
  ['프린트할 때 자동으로 출력자 이름이 찍히게 하고 싶어요', ['Print SAFER']],
  // 10. 암호모듈을 규제 관점으로
  ['국가정보원 암호모듈 검증 받은 솔루션이 필요합니다', ['MACRYPTO V3.0 (KCMVP)']],

  // ═══ B. 경계 혼동 케이스 (제품 구분이 어려운 질문) — 10개 ═══
  // 11. Screen SAFER vs Screen TRACER 구분
  ['화면에 보이지 않는 워터마크를 넣어서 유출자를 추적하고 싶어요', ['Screen TRACER']],
  // 12. Screen SAFER vs Screen TRACER 구분 (반대)
  ['화면 캡처 자체를 원천 차단하고 싶습니다', ['Screen SAFER']],
  // 13. Print SAFER vs Print TRACER 구분
  ['출력물에 눈에 안 보이는 추적 코드를 넣고 싶어요', ['Print TRACER']],
  // 14. Print SAFER vs Print TRACER 구분 (반대)
  ['인쇄할 때 눈에 보이는 워터마크를 넣어서 무단 복사를 억제하고 싶어요', ['Print SAFER']],
  // 15. Document SAFER vs DRM 구분 (동일 제품)
  ['ES SAFER 도입을 검토하고 있습니다', ['Document SAFER']],
  // 16. Mobile STICKER vs TRACER SDK for Mobile 구분
  ['모바일 화면에 사용자 정보 워터마크를 표시하고 싶어요', ['Mobile STICKER']],
  // 17. Mobile STICKER vs Mobile SAFER 구분
  ['직원 스마트폰 카메라랑 녹음 기능을 차단하고 싶습니다', ['Mobile STICKER']],
  // 18. ePS DocumentMerger 정확한 이해
  ['PDF 문서를 보안 뷰어로 유통하고 싶습니다', ['ePS DocumentMerger']],
  // 19. ePage SAFER vs ePS Document DNA 구분
  ['전자 증명서의 진위 여부를 확인할 수 있는 솔루션이 필요합니다', ['ePS Document DNA']],
  // 20. ePage SAFER vs ePS Document DNA 구분 (반대)
  ['전자문서에 위변조 방지 기능을 적용하고 싶습니다', ['ePage SAFER']],

  // ═══ C. 업종별 시나리오 (단일 제품 매칭) — 10개 ═══
  // 21. 반도체 업종
  ['반도체 설계 도면이 외부로 유출되지 않도록 보호해야 합니다', ['Document SAFER']],
  // 22. 국방 업종
  ['군사 기밀 문서를 모바일에서 안전하게 열람해야 합니다', ['국방모바일보안']],
  // 23. 금융 업종
  ['은행에서 고객 개인정보가 포함된 파일을 자동 탐지해야 합니다', ['Privacy SAFER']],
  // 24. 의료 업종
  ['병원에서 환자 진료기록 출력 시 추적 코드를 넣어야 합니다', ['Print TRACER']],
  // 25. 교육 업종
  ['온라인 시험 중 학생들이 화면 캡처하는 걸 막아야 합니다', ['Screen SAFER']],
  // 26. 법률 업종
  ['로펌에서 계약서 원본의 위변조 여부를 검증해야 합니다', ['ePS Document DNA']],
  // 27. 건설 업종
  ['건설 현장에서 도면을 모바일로 보면서 캡처 방지해야 합니다', ['Mobile Capture SAFER']],
  // 28. 제약 업종
  ['제약회사 연구 데이터를 USB로 반출할 때 암호화해야 합니다', ['SafeUSB']],
  // 29. 공공기관
  ['정부 기관에서 민원 서류의 위변조를 방지해야 합니다', ['ePage SAFER']],
  // 30. 방송/미디어
  ['방송 대본이 촬영 현장에서 유출되지 않도록 화면 워터마크를 넣어야 합니다', ['Screen TRACER']],

  // ═══ D. SDK/연동 관련 (개발자 관점) — 5개 ═══
  // 31. 화면 추적 SDK
  ['우리 앱에 화면 워터마크 기능을 SDK로 연동하고 싶습니다', ['TRACER SDK for Screen']],
  // 32. 출력 추적 SDK
  ['자체 인쇄 시스템에 출력 추적 기능을 Add-in으로 넣고 싶어요', ['TRACER SDK for Print']],
  // 33. 웹 추적 SDK
  ['웹 애플리케이션에 서버사이드 문서 추적을 연동해야 합니다', ['TRACER SDK for Web']],
  // 34. 모바일 추적 SDK
  ['모바일 앱에 비가시성 워터마크 추적 기능을 넣어야 합니다', ['TRACER SDK for Mobile']],
  // 35. 서버 DRM 연동
  ['Java 서버에서 DRM 암호화/복호화 API를 호출해야 합니다', ['Document SAFER I/F (Server)']],

  // ═══ E. 복합 시나리오 (자연어 + 다중 제품) — 10개 ═══
  // 36. 재택근무 시나리오
  ['재택근무 직원들이 집에서 문서 작업할 때 유출 방지하면서 화면 캡처도 막아야 합니다', ['Document SAFER', 'Screen SAFER']],
  // 37. 스마트팩토리 시나리오
  ['공장에서 태블릿으로 작업지시서 보면서 캡처 방지하고 워터마크도 넣어야 합니다', ['Mobile DOCS', 'Mobile Capture SAFER', 'Mobile STICKER']],
  // 38. 감사 대응 시나리오
  ['감사 대비해서 누가 어떤 문서를 출력하고 화면 캡처했는지 전부 추적해야 합니다', ['Print TRACER', 'Screen TRACER']],
  // 39. 협력사 보안 시나리오
  ['협력사에 설계 도면 보내면서 열람 기간 제한하고 인쇄도 통제하고 싶어요', ['Cowork SAFER', 'Print SAFER']],
  // 40. 클라우드 전환 시나리오
  ['온프레미스에서 클라우드로 전환하면서 문서 보안이랑 웹 DRM을 같이 적용해야 합니다', ['Document SAFER', 'Web SAFER']],
  // 41. 시각장애인 접근성
  ['시각장애인도 바코드를 읽을 수 있는 음성 안내 솔루션이 필요합니다', ['VoiceBarcode']],
  // 42. 전사 DLP 구축
  ['전사적으로 PC 정보유출 방지하면서 USB 통제하고 개인정보도 탐지해야 합니다', ['SafePC Enterprise', 'SafeUSB', 'Privacy SAFER']],
  // 43. 모바일 MDM + 보안
  ['직원 스마트폰 관리하면서 사내 문서도 안전하게 열람하게 하고 싶어요', ['Mobile SAFER', 'Mobile DOCS']],
  // 44. 인증서/증명서 발급 시스템
  ['온라인으로 발급하는 증명서에 위변조 방지랑 디지털 지문을 넣어야 합니다', ['ePage SAFER', 'ePS Document DNA']],
  // 45. iOS 전용 환경
  ['아이패드로 사내 문서 열람할 때 화면 캡처를 막아야 합니다', ['iScreen SAFER']],

  // ═══ F. 엣지 케이스 / 까다로운 질문 — 5개 ═══
  // 46. DRM 적용 문서의 워터마크 (Document SAFER 범위)
  ['DRM 암호화된 문서를 인쇄할 때 워터마크가 자동으로 나오나요', ['Document SAFER']],
  // 47. 클라이언트 DRM 연동
  ['윈도우 클라이언트에서 DRM 연동 개발을 해야 합니다', ['Document SAFER I/F (Client)']],
  // 48. Nexacro 웹 DRM
  ['Nexacro 기반 전자문서 시스템에 DRM을 적용하고 싶습니다', ['ePage SAFER for Web DRM']],
  // 49. 비가시성 워터마크 전반 (TRACER 제품군)
  ['비가시성 워터마크 기술로 문서 유출자를 추적하고 싶습니다', ['Print TRACER', 'Screen TRACER']],
  // 50. 모바일 비가시성 워터마크
  ['모바일 앱에서 비가시성 워터마크로 촬영자를 추적하고 싶습니다', ['TRACER SDK for Mobile']],
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
console.log('  테스트 쿼리 50개 v2 결과 요약')
console.log('='.repeat(70))
const valid = results.filter(r => r)
const perfect = valid.filter(r => r.miss === 0)
const partial = valid.filter(r => r.miss > 0 && r.hits > 0)
const failed = valid.filter(r => r.hits === 0)
console.log(`총 ${valid.length}개 쿼리 | ✅ 완전 매칭: ${perfect.length} | 🟡 부분 매칭: ${partial.length} | ❌ 미매칭: ${failed.length}`)
console.log(`정확도: ${((perfect.length / valid.length) * 100).toFixed(1)}% (완전) / ${(((perfect.length + partial.length) / valid.length) * 100).toFixed(1)}% (부분 포함)`)

// 카테고리별 결과
const categories = {
  'A. 간접표현/유의어': valid.slice(0, 10),
  'B. 경계혼동 케이스': valid.slice(10, 20),
  'C. 업종별 시나리오': valid.slice(20, 30),
  'D. SDK/연동': valid.slice(30, 35),
  'E. 복합 시나리오': valid.slice(35, 45),
  'F. 엣지 케이스': valid.slice(45, 50),
}
console.log('\n카테고리별 정확도:')
for (const [cat, items] of Object.entries(categories)) {
  const p = items.filter(r => r && r.miss === 0).length
  console.log(`  ${cat}: ${p}/${items.length} (${((p/items.length)*100).toFixed(0)}%)`)
}

if (partial.length > 0) {
  console.log('\n🟡 부분 매칭 상세:')
  partial.forEach(r => console.log(`   [${r.idx}] "${r.query}" — 미검출: ${r.missNames.join(', ')}`))
}
if (failed.length > 0) {
  console.log('\n❌ 미매칭 상세:')
  failed.forEach(r => console.log(`   [${r.idx}] "${r.query}" — 미검출: ${r.missNames.join(', ')}`))
}
