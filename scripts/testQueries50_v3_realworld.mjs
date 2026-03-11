#!/usr/bin/env node
// 테스트 쿼리 50개 v3 — 실제 고객 미팅 녹취 기반 리얼월드 질문
// [의도] Slack squad-미팅녹취모음 채널의 실제 고객 미팅 transcription preview에서
//        추출한 실제 유즈케이스 패턴을 기반으로 가상 질문 50개 생성
// [소스] 에스제이듀코, 삼성병원, 디어스세다, 민주당, 투데이시스템즈, 심플키,
//        에이치와이씨티, 이즈넷, 이티원, 인사이트, 지에스아이티엠, 이노블록 등
//        35+ 실제 고객 미팅 녹취 데이터 분석
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
console.log('  마크애니 RAG 테스트 쿼리 50개 v3 — 실제 고객 미팅 기반')
console.log('  (Slack squad-미팅녹취모음 35+ 고객 미팅 분석)')
console.log('='.repeat(70))

const results = []

const queries = [
  // ═══ A. DRM/문서보안 실제 문의 패턴 (에스제이듀코, 이즈넷, 이티원, 에이치와이씨티) — 10개 ═══
  // 1. 에스제이듀코 패턴: 홈페이지에서 DRM 문의 후 전화 상담
  ['홈페이지에서 DRM 솔루션 보고 문의드립니다. 사내 문서 암호화가 필요해요', ['Document SAFER']],
  // 2. 이티원 패턴: 홈페이지 통해 DRM 문의
  ['홈페이지에서 DRM 제품 봤는데 저희 회사에 도입하려면 어떻게 해야 하나요', ['Document SAFER']],
  // 3. 이즈넷 패턴: 파트너사 통한 DRM 도입 검토
  ['파트너사를 통해 DRM 도입을 검토 중인데 마크애니 제품 설명 부탁드립니다', ['Document SAFER']],
  // 4. 에이치와이씨티 패턴: DRM + 출력물 보안 동시 문의
  ['저희 회사에 DRM이랑 출력물 보안을 같이 도입하고 싶습니다', ['Document SAFER', 'Print SAFER']],
  // 5. 박기수격주회의 패턴: DRM + 오토마크 언급
  ['DRM이랑 오토마크를 같이 쓰고 있는데 연동이 되나요', ['Document SAFER', 'Print SAFER']],
  // 6. 삼성병원 패턴: 줌 연동 + 모듈 호출
  ['줌 같은 화상회의에서 화면 보안 모듈을 호출할 수 있나요', ['Screen SAFER']],
  // 7. 삼성병원2 패턴: 도입 일정 문의
  ['9월에 오픈해야 하는데 DRM 도입하려면 일정이 얼마나 걸리나요', ['Document SAFER']],
  // 8. 서영대학교 패턴: 제품 설명서만 받고 추가 설명 요청
  ['제품 설명서만 받았는데 실제로 어떻게 동작하는지 데모를 보고 싶습니다', ['Document SAFER']],
  // 9. 실제 패턴: ES SAFER라는 이름으로 문의
  ['ES SAFER 도입을 검토하고 있는데 기존 DRM과 뭐가 다른가요', ['Document SAFER']],
  // 10. 실제 패턴: 문서 반출 시 암호화
  ['직원이 문서를 USB로 반출할 때 자동으로 암호화되게 하고 싶어요', ['Document SAFER']],

  // ═══ B. 화면보안/워터마크 실제 문의 패턴 (민주당, 투데이시스템즈, 심플키) — 10개 ═══
  // 11. 민주당 패턴: 화면에 뿌려지는 워터마크
  ['컴퓨터 화면에 계속 워터마크가 깔려있는 방식으로 보안하고 싶어요', ['Screen SAFER']],
  // 12. 민주당 패턴: 눈에 안 보이는 워터마크
  ['화면에 워터마크를 넣되 눈에는 안 보이게 할 수 있나요', ['Screen TRACER']],
  // 13. 투데이시스템즈 패턴: 업로드/다운로드 시 워터마크
  ['시스템에 업로드 다운로드할 때 워터마크를 박는 방식이 있나요', ['Web SAFER']],
  // 14. 투데이시스템즈 패턴: 화면 전체 워터마크
  ['지금 화면 전체에 워터마크를 뿌리고 싶은데 어떤 제품이 맞나요', ['Screen SAFER']],
  // 15. 심플키 패턴: 컨텐츠 안에만 들어가는 워터마크
  ['컨텐츠 안에만 들어가는 워터마크 기술이 있다고 들었는데요', ['Screen TRACER']],
  // 16. 인사이트 패턴: 웹 화면 보안 + PDF + MDM
  ['웹 화면 보안이랑 PDF 보안을 같이 적용하고 싶습니다', ['Web SAFER', 'Cowork SAFER']],
  // 17. 지에스아이티엠 패턴: 이미지 전송 시 보안
  ['원본 이미지를 계속 전송할 때 보안 문제가 없는지 확인하고 싶어요', ['Document SAFER']],
  // 18. 지에스아이티엠2 패턴: 프린트할 때 워터마크
  ['프린트할 때 자동으로 워터마크가 찍히게 하고 싶습니다', ['Print SAFER']],
  // 19. 실제 패턴: 캡처 프로그램 차단
  ['직원들이 캡처 프로그램으로 화면 찍는 걸 막아야 합니다', ['Screen SAFER']],
  // 20. 실제 패턴: 화면 녹화 방지
  ['화면 녹화 프로그램도 차단할 수 있나요', ['Screen SAFER']],

  // ═══ C. CAD/도면/설계 보안 실제 패턴 (디어스세다, 국방, 오승근이사) — 8개 ═══
  // 21. 디어스세다 패턴: CAD 도면 보안 검토
  ['CAD 도면 보안을 검토하고 있는데 마크애니에서 지원 가능한가요', ['Document SAFER']],
  // 22. 디어스세다 패턴: 설계 도면 외부 유출 방지
  ['설계 도면이 외부로 유출되지 않도록 DRM을 적용하고 싶습니다', ['Document SAFER']],
  // 23. 국방 패턴: 군사 자료 보안
  ['국방 관련 자료를 안전하게 관리할 수 있는 보안 솔루션이 필요합니다', ['국방모바일보안']],
  // 24. 오승근이사 국방 패턴: 발출처 보안
  ['군에서 사용하는 문서의 발출처 관리와 보안이 필요합니다', ['국방모바일보안']],
  // 25. 실제 패턴: 건설 현장 도면 모바일 열람
  ['건설 현장에서 태블릿으로 도면을 보면서 캡처를 막아야 합니다', ['Mobile Capture SAFER']],
  // 26. 실제 패턴: 협력사에 도면 전달
  ['협력사에 설계 도면을 보내야 하는데 열람 기간을 제한하고 싶어요', ['Cowork SAFER']],
  // 27. 실제 패턴: 도면 출력 시 추적
  ['도면을 출력할 때 누가 출력했는지 추적할 수 있나요', ['Print TRACER']],
  // 28. 실제 패턴: 3D CAD 파일 보안
  ['3D CAD 파일도 DRM 암호화가 되나요', ['Document SAFER']],

  // ═══ D. 출력물 보안 실제 패턴 (협회, 에이치와이씨티 출력물DRM) — 7개 ═══
  // 29. 협회 출력물 보안 패턴
  ['협회에서 발급하는 출력물에 보안을 적용하고 싶습니다', ['Print SAFER']],
  // 30. 에이치와이씨티 출력물 DRM 패턴
  ['출력물에 DRM을 적용해서 복사나 스캔을 방지하고 싶어요', ['Print SAFER']],
  // 31. 실제 패턴: 출력물 유출 추적
  ['유출된 출력물이 발견됐는데 누가 출력했는지 추적할 수 있나요', ['Print TRACER']],
  // 32. 실제 패턴: 출력 이력 관리
  ['전 직원의 출력 이력을 관리하는 콘솔이 필요합니다', ['Print SAFER']],
  // 33. 실제 패턴: 인쇄 시 가시성 워터마크
  ['인쇄할 때 출력자 이름이랑 부서가 자동으로 찍히게 하고 싶어요', ['Print SAFER']],
  // 34. 실제 패턴: 비가시성 워터마크로 출력물 추적
  ['출력물에 눈에 안 보이는 코드를 넣어서 유출 시 추적하고 싶습니다', ['Print TRACER']],
  // 35. 실제 패턴: 웹 출력물 위변조 방지
  ['웹에서 발급하는 증명서에 2D 바코드로 위변조를 방지하고 싶어요', ['ePage SAFER']],

  // ═══ E. 모바일/DLP 실제 패턴 (이노블록 DLP, 페이코) — 8개 ═══
  // 36. 이노블록 DLP 패턴: 핸드폰 사무실 반입 통제
  ['점심시간에 핸드폰으로 사무실 문서를 촬영하는 걸 막고 싶어요', ['Mobile STICKER']],
  // 37. 이노블록 패턴: DLP + 매체제어
  ['PC에서 USB나 외부 매체로 파일 복사하는 걸 통제하고 싶습니다', ['SafePC Enterprise']],
  // 38. 페이코 패턴: 사용자 인증 기반 보안
  ['사용자별로 문서 접근 권한을 다르게 설정하고 싶어요', ['Document SAFER']],
  // 39. 실제 패턴: 모바일에서 사내 문서 열람
  ['직원들이 스마트폰으로 사내 문서를 안전하게 볼 수 있게 해주세요', ['Mobile DOCS']],
  // 40. 실제 패턴: 모바일 카메라 차단
  ['사무실 내에서 직원 스마트폰 카메라를 차단하고 싶습니다', ['Mobile STICKER']],
  // 41. 실제 패턴: 전사 정보유출방지
  ['전사적으로 정보유출 방지 체계를 구축하고 싶은데 어떤 제품 조합이 좋을까요', ['SafePC Enterprise', 'Document SAFER']],
  // 42. 실제 패턴: 개인정보 탐지
  ['PC에 저장된 개인정보 파일을 자동으로 찾아서 암호화하고 싶어요', ['Privacy SAFER']],
  // 43. 실제 패턴: 보안USB 매체관리
  ['회사 승인된 USB만 사용하게 하고 나머지는 차단하고 싶습니다', ['SafeUSB']],

  // ═══ F. 복합/특수 실제 패턴 (제이티트러스트, 신한시스템즈, 더존비즈온) — 7개 ═══
  // 44. 제이티트러스트 패턴: SSL + 데이터 암호화
  ['SSL 통신 암호화랑 저장 데이터 암호화를 같이 하고 싶습니다', ['Document SAFER']],
  // 45. 신한시스템즈 패턴: AI + 보안 제안
  ['AI 기반으로 보안 위협을 탐지하는 솔루션이 있나요', ['Document SAFER']],
  // 46. 실제 패턴: 전자문서 진위확인
  ['PDF 전자문서의 진위 여부를 확인할 수 있는 솔루션이 필요합니다', ['ePS Document DNA']],
  // 47. 실제 패턴: 국정원 암호모듈 검증
  ['국정원 KCMVP 인증 받은 암호모듈이 필요합니다', ['MACRYPTO V3.0 (KCMVP)']],
  // 48. 실제 패턴: 아이패드 화면 캡처 방지
  ['아이패드에서 화면 캡처를 막을 수 있는 솔루션이 있나요', ['iScreen SAFER']],
  // 49. 실제 패턴: 서버 DRM API 연동
  ['서버에서 DRM 암호화 API를 호출해서 자동으로 문서를 암호화하고 싶어요', ['Document SAFER I/F (Server)']],
  // 50. 실제 패턴: Nexacro 웹 DRM
  ['Nexacro 기반 시스템에 웹 DRM을 적용하고 싶습니다', ['ePage SAFER for Web DRM']],
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
console.log('  테스트 쿼리 50개 v3 결과 요약 — 실제 고객 미팅 기반')
console.log('='.repeat(70))
const valid = results.filter(r => r)
const perfect = valid.filter(r => r.miss === 0)
const partial = valid.filter(r => r.miss > 0 && r.hits > 0)
const failed = valid.filter(r => r.hits === 0)
console.log(`총 ${valid.length}개 쿼리 | ✅ 완전 매칭: ${perfect.length} | 🟡 부분 매칭: ${partial.length} | ❌ 미매칭: ${failed.length}`)
console.log(`정확도: ${((perfect.length / valid.length) * 100).toFixed(1)}% (완전) / ${(((perfect.length + partial.length) / valid.length) * 100).toFixed(1)}% (부분 포함)`)

// 카테고리별 결과
const categories = {
  'A. DRM/문서보안 실제 패턴': valid.slice(0, 10),
  'B. 화면보안/워터마크 실제 패턴': valid.slice(10, 20),
  'C. CAD/도면/설계 보안 패턴': valid.slice(20, 28),
  'D. 출력물 보안 실제 패턴': valid.slice(28, 35),
  'E. 모바일/DLP 실제 패턴': valid.slice(35, 43),
  'F. 복합/특수 실제 패턴': valid.slice(43, 50),
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
