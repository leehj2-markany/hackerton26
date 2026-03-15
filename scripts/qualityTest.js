// 답변 품질 리뷰 테스트 스크립트
const API = 'https://hackerton-kappa.vercel.app/api/chat'

const TEST_CASES = [
  // 1. 단일 제품 기본 질문
  { q: 'Document SAFER의 주요 기능을 알려주세요', category: '단일제품-기본', expect: '암호화, 권한관리, 반출, 캡처방지 등' },
  // 2. 구축/도입 컨설팅 질문
  { q: 'DRM 500유저 규모 망분리 환경에서 도입하려고 합니다. 구축 기간과 절차를 알려주세요', category: '컨설팅-구축', expect: '구축기간, 프로세스 단계, 레퍼런스' },
  // 3. 제품 비교 (complex)
  { q: 'Document SAFER와 SafePC Enterprise의 차이점이 뭔가요?', category: '제품비교-complex', expect: 'DRM vs DLP 구분, 각 제품 특징' },
  // 4. 기술 세부사항
  { q: 'Screen SAFER 워터마크 설정 방법과 차단정책 종류를 알려주세요', category: '기술상세', expect: '4가지 차단정책, 워터마크 설정값' },
  // 5. 전제조건 규칙 테스트
  { q: 'Mobile DOCS 도입을 검토하고 있습니다', category: '전제조건', expect: 'Document SAFER 필수 전제조건 안내' },
  // 6. DLP/DRM 구분 테스트
  { q: 'SafePC Enterprise에 Print SAFER가 포함되어 있나요?', category: 'DLP-DRM구분', expect: '별개 제품임을 명확히 안내' },
  // 7. 버전 구분 테스트
  { q: 'SafePC Enterprise V8.0의 새로운 기능은 뭔가요?', category: '버전구분', expect: 'MSA/Docker, MacOS, JWT, 웹콘솔' },
  // 8. 매뉴얼 기반 상세 질문
  { q: 'Print SAFER 관리자 콘솔에서 출력 정책을 설정하는 방법을 알려주세요', category: '매뉴얼상세', expect: '관리콘솔 메뉴, 정책 설정 절차' },
  // 9. 복합 질문 (3개 제품)
  { q: 'DRM, 출력보안, 화면보안을 통합 도입하려고 합니다. 각 제품 추천과 연동 방안을 알려주세요', category: '복합-3제품', expect: 'Document SAFER + Print SAFER + Screen SAFER 각각 설명 + 통합 시너지' },
  // 10. 에스컬레이션 경계 테스트
  { q: '견적서를 받고 싶습니다', category: '에스컬레이션', expect: '[ESCALATION] 마커 + 담당자 연결 안내' },
]

async function runTest(tc, idx) {
  const start = Date.now()
  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: tc.q, sessionId: `quality_test_${idx}`, conversationHistory: [] }),
    })
    const json = await res.json()
    const elapsed = ((Date.now() - start) / 1000).toFixed(1)
    const d = json.data || {}
    return { ...tc, idx: idx+1, elapsed, answer: d.answer || '', model: d.model, complexity: d.complexity,
      confidence: d.confidence, score: d.confidenceScore, escalation: d.needsEscalation,
      thinkingSteps: (d.thinkingProcess||[]).length, answerLen: (d.answer||'').length }
  } catch (e) {
    return { ...tc, idx: idx+1, error: e.message }
  }
}

// 품질 평가 기준
function evaluate(r) {
  const issues = []
  const answer = r.answer.toLowerCase()

  // 1. 답변 길이 체크
  if (r.answerLen < 100) issues.push('⚠️ 답변이 너무 짧음 (<100자)')
  if (r.answerLen < 50) issues.push('❌ 답변 거의 없음 (<50자)')

  // 2. 카테고리별 기대값 체크
  if (r.category === '전제조건' && !answer.includes('document safer')) {
    issues.push('❌ 전제조건(Document SAFER 필수) 미안내')
  }
  if (r.category === 'DLP-DRM구분' && (answer.includes('포함') && !answer.includes('별개') && !answer.includes('독립'))) {
    issues.push('❌ DLP/DRM 구분 실패 — Print SAFER를 SafePC 하위로 설명')
  }
  if (r.category === '버전구분' && !answer.includes('msa') && !answer.includes('docker') && !answer.includes('macos') && !answer.includes('MacOS')) {
    issues.push('⚠️ V8.0 핵심 특징(MSA/Docker/MacOS) 미언급')
  }
  if (r.category === '에스컬레이션' && !r.escalation) {
    issues.push('❌ 에스컬레이션 미감지')
  }
  if (r.category === '컨설팅-구축') {
    if (!answer.includes('주') && !answer.includes('기간') && !answer.includes('개월')) issues.push('⚠️ 구축 기간 미안내')
    if (!answer.includes('레퍼런스') && !answer.includes('사례') && !answer.includes('고객사')) issues.push('⚠️ 레퍼런스 미안내')
  }
  if (r.category === '기술상세') {
    if (!answer.includes('캡처') && !answer.includes('차단')) issues.push('⚠️ 차단정책 미설명')
    if (!answer.includes('워터마크')) issues.push('⚠️ 워터마크 설정 미설명')
  }
  if (r.category === '복합-3제품') {
    const products = ['document safer', 'print safer', 'screen safer']
    const missing = products.filter(p => !answer.includes(p))
    if (missing.length > 0) issues.push(`⚠️ 누락 제품: ${missing.join(', ')}`)
  }
  if (r.category === '매뉴얼상세') {
    if (r.answerLen < 200) issues.push('⚠️ 매뉴얼 기반 답변이 너무 짧음')
  }

  // 3. 응답 시간 체크
  if (parseFloat(r.elapsed) > 15) issues.push(`⚠️ 응답 느림 (${r.elapsed}s)`)

  const grade = issues.filter(i => i.startsWith('❌')).length > 0 ? '❌ FAIL' :
                issues.filter(i => i.startsWith('⚠️')).length > 0 ? '⚠️ WARN' : '✅ PASS'
  return { grade, issues }
}

async function main() {
  console.log('=== 답변 품질 리뷰 테스트 (10개 시나리오) ===\n')
  const results = []
  // 순차 실행 (API rate limit 고려)
  for (let i = 0; i < TEST_CASES.length; i++) {
    const r = await runTest(TEST_CASES[i], i)
    results.push(r)
    const ev = evaluate(r)
    console.log(`[${r.idx}/10] ${ev.grade} ${r.category}`)
    console.log(`  Q: ${r.q}`)
    console.log(`  모델: ${r.model} | 복잡도: ${r.complexity} | 신뢰도: ${r.confidence}(${r.score}%) | ${r.elapsed}s | ${r.answerLen}자`)
    if (r.escalation) console.log(`  🚨 에스컬레이션 감지`)
    if (ev.issues.length > 0) console.log(`  ${ev.issues.join('\n  ')}`)
    // 답변 미리보기 (200자)
    console.log(`  A: ${(r.answer||'').slice(0, 200)}...`)
    console.log()
  }

  // 요약
  const pass = results.filter(r => evaluate(r).grade === '✅ PASS').length
  const warn = results.filter(r => evaluate(r).grade === '⚠️ WARN').length
  const fail = results.filter(r => evaluate(r).grade === '❌ FAIL').length
  const avgTime = (results.reduce((s,r) => s + parseFloat(r.elapsed||0), 0) / results.length).toFixed(1)
  const avgLen = Math.round(results.reduce((s,r) => s + (r.answerLen||0), 0) / results.length)
  console.log('=== 요약 ===')
  console.log(`✅ PASS: ${pass} | ⚠️ WARN: ${warn} | ❌ FAIL: ${fail}`)
  console.log(`평균 응답시간: ${avgTime}s | 평균 답변길이: ${avgLen}자`)
}

main().catch(e => console.error(e))
