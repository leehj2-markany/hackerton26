#!/bin/bash
# DESV 복합질문 테스트 — 10가지 케이스
API="https://hackerton-kappa.vercel.app/api/chat"

test_question() {
  local num="$1"
  local msg="$2"
  echo "━━━ TEST $num ━━━"
  echo "Q: $msg"
  
  result=$(curl -s -m 45 -X POST "$API" \
    -H "Content-Type: application/json" \
    -d "{\"message\":\"$msg\",\"customerId\":null,\"conversationHistory\":[]}")
  
  if [ -z "$result" ]; then
    echo "RESULT: ❌ TIMEOUT/NO RESPONSE"
    echo ""
    return
  fi

  echo "$result" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    d = data.get('data', {})
    cx = d.get('complexity', '?')
    ic = d.get('isComplex', False)
    model = d.get('model', '?')
    failed = d.get('aiFailed', False)
    enrich = d.get('enrichment')
    subs = d.get('subQuestions')
    ans = d.get('answer','')[:250]
    
    status = '❌ AI_FAILED' if failed else '✅ OK'
    desv = '🔀 DESV' if enrich else '📝 Standard'
    
    print(f'RESULT: {status} | {cx} | {model} | {desv}')
    if subs:
        for s in subs:
            p = s.get('product','') or ''
            print(f'  SUB: {s[\"question\"]} [{p}]')
    if enrich:
        print(f'  ENRICH: {enrich}')
    print(f'ANSWER: {ans}...')
except Exception as e:
    print(f'PARSE ERROR: {e}')
    print(sys.stdin.read()[:200])
" 2>/dev/null
  echo ""
}

echo "🧪 DESV 복합질문 테스트 시작 ($(date))"
echo "================================================"
echo ""

# 1. 이전 실패 케이스 (핵심)
test_question 1 "DRM과 개인정보추출 솔루션 250유저 구축검토 중입니다"

# 2. 두 제품 동시 구축
test_question 2 "DRM 300유저 도입하면서 SafeCopy도 같이 구축하고 싶습니다"

# 3. 제품 비교
test_question 3 "Document SAFER와 DRM의 차이점이 뭔가요? 어떤 걸 도입해야 할지 모르겠어요"

# 4. 복잡한 환경 조건 + 다중 제품
test_question 4 "500명 규모 망분리 환경에서 DRM이랑 Document SAFER 동시 도입 검토 중입니다"

# 5. 기술 + 영업 혼합 질문
test_question 5 "DRM API 연동 방법이랑 SafeCopy 견적을 같이 알고 싶습니다"

# 6. 3개 제품 동시 언급
test_question 6 "DRM, Document SAFER, SafeCopy 세 가지 제품 전체 도입 시 구축 기간이 얼마나 걸리나요?"

# 7. 업그레이드 + 신규 도입 혼합
test_question 7 "기존 DRM을 업그레이드하면서 ContentSAFER도 새로 도입하려고 합니다"

# 8. 인증 + 기술 복합
test_question 8 "CC인증 받은 DRM 제품의 SDK 연동 방법과 Document SAFER 모바일 뷰어 지원 여부를 알고 싶습니다"

# 9. 단일 제품 (simple 대조군)
test_question 9 "DRM 300유저 구매 검토 중입니다"

# 10. 인사 (simple 대조군)
test_question 10 "안녕하세요"

echo "================================================"
echo "🧪 테스트 완료 ($(date))"
