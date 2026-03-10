import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { config } from 'dotenv'

config({ path: '.env' })

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' })

async function testQuery(query, expectedProducts = []) {
  const result = await embeddingModel.embedContent({
    content: { parts: [{ text: query }] },
    taskType: 'RETRIEVAL_QUERY',
  })
  const { data, error } = await supabase.rpc('match_knowledge', {
    query_embedding: result.embedding.values,
    match_count: 5,
    filter: {},
  })
  if (error) { console.error(`❌ "${query}" RPC 실패:`, error.message); return }

  const top5 = data.map(r => r.metadata?.product_name)
  const hits = expectedProducts.filter(p => top5.includes(p))
  const miss = expectedProducts.filter(p => !top5.includes(p))
  const icon = miss.length === 0 ? '✅' : hits.length > 0 ? '🟡' : '❌'

  console.log(`\n${icon} "${query}"`)
  data.forEach((r, i) => {
    const mark = expectedProducts.includes(r.metadata?.product_name) ? ' ◀' : ''
    console.log(`   ${i+1}. [${(r.similarity*100).toFixed(1)}%] ${r.metadata?.product_name}${mark}`)
  })
  if (miss.length > 0) console.log(`   ⚠️ 미검출: ${miss.join(', ')}`)
  return { query, hits: hits.length, miss: miss.length, total: expectedProducts.length }
}

console.log('=' .repeat(70))
console.log('  마크애니 RAG 벡터 검색 종합 테스트 (전 제품 + 복합질문)')
console.log('='.repeat(70))

const results = []

// ── 1. 제품군별 단일 쿼리 (전 29개 제품 커버) ──
console.log('\n── [DRM 제품군] ──')
results.push(await testQuery('기업 문서 암호화 통합 보안 솔루션', ['Document SAFER']))
results.push(await testQuery('문서 DRM 암호화 접근 제어 유출 방지', ['Document SAFER']))
results.push(await testQuery('개인정보 파일 탐지 암호화 컴플라이언스', ['Privacy SAFER']))
results.push(await testQuery('문서 인쇄 워터마크 출력 정책 제어', ['Print SAFER']))
results.push(await testQuery('출력물 비가시성 추적 코드 위변조 방지', ['Print TRACER']))
results.push(await testQuery('화면 캡처 방지 PrintScreen 차단', ['Screen SAFER']))
results.push(await testQuery('화면 비가시성 워터마크 촬영자 추적', ['Screen TRACER']))
results.push(await testQuery('웹 브라우저 문서 DRM 보호', ['Web SAFER']))
results.push(await testQuery('외부 협력사 문서 공유 보안 반출 제어', ['Cowork SAFER']))
results.push(await testQuery('모바일 DRM 문서 뷰어 스마트폰', ['Mobile DOCS']))
results.push(await testQuery('모바일 기기 문서 암호화 BYOD 보안', ['Mobile SAFER']))
results.push(await testQuery('모바일 화면 워터마크 사용자 정보 표시', ['Mobile STICKER']))
results.push(await testQuery('모바일 스크린샷 캡처 방지', ['Mobile Capture SAFER']))
results.push(await testQuery('iOS iPad iPhone 화면 캡처 방지', ['iScreen SAFER']))
results.push(await testQuery('군사 보안 국방 모바일 문서 보호', ['국방모바일보안']))
results.push(await testQuery('서버 DRM 연동 JAVA C 인터페이스 Unix', ['Document SAFER I/F (Server)']))
results.push(await testQuery('클라이언트 DRM 연동 인터페이스 개발', ['Document SAFER I/F (Client)']))
results.push(await testQuery('KCMVP 암호모듈 인증 국가정보원', ['MACRYPTO V3.0 (KCMVP)']))

console.log('\n── [DLP 제품군] ──')
results.push(await testQuery('PC 정보 유출 방지 USB 매체 제어 DLP', ['SafePC Enterprise']))
results.push(await testQuery('USB 저장매체 암호화 보안USB 발급 관리', ['SafeUSB']))

console.log('\n── [응용보안 제품군] ──')
results.push(await testQuery('전자문서 위변조 방지 증명서 수료증 진위 확인', ['ePage SAFER', 'ePS Document DNA']))
results.push(await testQuery('음성 바코드 시각장애인 접근성', ['VoiceBarcode']))
results.push(await testQuery('웹 전자문서 DRM Nexacro 브라우저 보안', ['ePage SAFER for Web DRM']))
results.push(await testQuery('전자문서 병합 리포트 통합 출력', ['ePS DocumentMerger']))
results.push(await testQuery('Document DNA 디지털 지문 원본 검증', ['ePS Document DNA']))

console.log('\n── [TRACER 제품군] ──')
results.push(await testQuery('화면 추적 SDK Add-in 3rd party 연동', ['TRACER SDK for Screen']))
results.push(await testQuery('출력물 추적 SDK 인쇄 워터마크 Add-in', ['TRACER SDK for Print']))
results.push(await testQuery('웹 시스템 문서 추적 서버사이드 SDK', ['TRACER SDK for Web']))
results.push(await testQuery('모바일 앱 문서 추적 SDK Add-in', ['TRACER SDK for Mobile']))

// ── 2. 복합질문 (여러 제품이 동시에 필요한 시나리오) ──
console.log('\n── [복합질문] ──')
results.push(await testQuery('인턴 교육 수료증 위변조 방지하고 교육자료 유출도 막고 싶습니다', ['Print TRACER', 'Document SAFER', 'ePS Document DNA']))
results.push(await testQuery('문서 암호화도 하고 인쇄할 때 워터마크도 넣고 화면 캡처도 막고 싶어요', ['Document SAFER', 'Print SAFER', 'Screen SAFER']))
results.push(await testQuery('모바일에서 문서 보고 화면 캡처 방지하면서 워터마크도 넣고 싶습니다', ['Mobile DOCS', 'Mobile Capture SAFER', 'Mobile STICKER']))
results.push(await testQuery('USB로 파일 반출 통제하고 PC에서 정보 유출도 방지하고 싶습니다', ['SafeUSB', 'SafePC Enterprise']))
results.push(await testQuery('서버에서 문서 암호화하고 웹 브라우저에서 DRM 걸어서 보여주고 싶어요', ['Document SAFER I/F (Server)', 'Web SAFER']))
results.push(await testQuery('영상 콘텐츠 저작권 보호하면서 출력물도 추적하고 싶습니다', ['ContentSAFER', 'Print TRACER']))
results.push(await testQuery('국방 환경에서 모바일 문서 보안하고 KCMVP 인증 암호모듈 적용하고 싶습니다', ['국방모바일보안', 'MACRYPTO V3.0 (KCMVP)']))

// ── 3. 결과 요약 ──
console.log('\n' + '='.repeat(70))
console.log('  결과 요약')
console.log('='.repeat(70))
const valid = results.filter(r => r)
const perfect = valid.filter(r => r.miss === 0)
const partial = valid.filter(r => r.miss > 0 && r.hits > 0)
const failed = valid.filter(r => r.hits === 0)
console.log(`총 ${valid.length}개 쿼리 | ✅ 완전 매칭: ${perfect.length} | 🟡 부분 매칭: ${partial.length} | ❌ 미매칭: ${failed.length}`)
console.log(`정확도: ${((perfect.length / valid.length) * 100).toFixed(1)}% (완전) / ${(((perfect.length + partial.length) / valid.length) * 100).toFixed(1)}% (부분 포함)`)
if (partial.length > 0) {
  console.log('\n🟡 부분 매칭 상세:')
  partial.forEach(r => console.log(`   "${r.query}"`))
}
if (failed.length > 0) {
  console.log('\n❌ 미매칭 상세:')
  failed.forEach(r => console.log(`   "${r.query}"`))
}
