#!/bin/bash
# ANY 브릿지 Vercel 배포 스크립트
# 사용법: bash deploy.sh

echo "🚀 ANY 브릿지 Vercel 배포 시작..."

# 1. Vercel 로그인 확인
npx vercel whoami 2>/dev/null
if [ $? -ne 0 ]; then
  echo "❌ Vercel 로그인이 필요합니다. 'npx vercel login' 실행 후 다시 시도하세요."
  exit 1
fi

# 2. 환경변수 설정 (최초 1회)
echo ""
echo "📋 환경변수를 Vercel에 설정합니다..."
echo "   (이미 설정된 경우 스킵됩니다)"

npx vercel env add DEMO_MODE production <<< "false" 2>/dev/null || true
npx vercel env add GEMINI_API_KEY production < <(grep GEMINI_API_KEY backend/.env | cut -d= -f2) 2>/dev/null || true
npx vercel env add CLAUDE_API_KEY production < <(grep CLAUDE_API_KEY backend/.env | cut -d= -f2) 2>/dev/null || true
npx vercel env add SUPABASE_URL production < <(grep SUPABASE_URL backend/.env | cut -d= -f2) 2>/dev/null || true
npx vercel env add SUPABASE_ANON_KEY production < <(grep SUPABASE_ANON_KEY backend/.env | cut -d= -f2) 2>/dev/null || true
npx vercel env add SLACK_BOT_TOKEN production < <(grep SLACK_BOT_TOKEN backend/.env | cut -d= -f2) 2>/dev/null || true
npx vercel env add SLACK_APP_TOKEN production < <(grep SLACK_APP_TOKEN backend/.env | cut -d= -f2) 2>/dev/null || true

# 3. 프로덕션 배포
echo ""
echo "🔨 프로덕션 배포 중..."
npx vercel --prod

echo ""
echo "✅ 배포 완료!"
