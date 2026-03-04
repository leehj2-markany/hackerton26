# API 키 보안 관리 가이드

## 사고 이력

| 날짜 | 사건 | 원인 | 조치 |
|------|------|------|------|
| 2026-03-03 | Gemini API 키 leaked 차단 (403) | git 히스토리에 키 노출 → Google 자동 차단 | 새 키 발급 + Vercel 환경변수 교체 |

## 현재 키 관리 구조

- 로컬: `hackerton/.env` (`.gitignore`에 포함 — git 추적 안 됨)
- 프로덕션: Vercel 환경변수 (Dashboard 또는 CLI로 관리)
- 코드에서: `_lib/config.js`의 `ENV` 객체를 통해서만 접근 (`process.env` 직접 참조 금지)

## API 키 교체 절차

```bash
# 1. 로컬 .env 수정
vi hackerton/.env
# GEMINI_API_KEY=새_키_값

# 2. Vercel 환경변수 교체
cd hackerton
npx vercel env rm GEMINI_API_KEY production -y
echo "새_키_값" | npx vercel env add GEMINI_API_KEY production

# 3. 재배포
npx vercel --prod --yes

# 4. 테스트
curl -s https://hackerton-kappa.vercel.app/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"테스트"}' | python3 -m json.tool | grep model
# → "model": "gemini-2.5-flash" 확인
```

## 금지 사항

1. `.env` 파일을 절대 git에 커밋하지 않는다
2. API 키를 코드에 하드코딩하지 않는다
3. 테스트 스크립트에 키를 직접 넣지 않는다 (환경변수 참조)
4. Slack/채팅에 키를 평문으로 공유하지 않는다

## 키가 유출되었을 때

1. 즉시 해당 서비스에서 키 비활성화/삭제
2. 새 키 발급
3. 위 교체 절차 실행
4. git 히스토리에 키가 남아있다면: `git filter-branch` 또는 `BFG Repo-Cleaner`로 제거
5. GitHub에서 force push 후 모든 팀원에게 `git pull --rebase` 안내

## 환경변수 목록

| 변수명 | 용도 | 관리 위치 |
|--------|------|-----------|
| `GEMINI_API_KEY` | Gemini Flash/Pro API | Vercel + .env |
| `CLAUDE_API_KEY` | Claude Opus 4 API | Vercel + .env |
| `SUPABASE_URL` | Supabase 프로젝트 URL | Vercel + .env |
| `SUPABASE_ANON_KEY` | Supabase 익명 키 | Vercel + .env |
| `SLACK_BOT_TOKEN` | Slack Bot (xoxb) | Vercel + .env |
| `SLACK_USER_SONGIC` | 송인찬 Slack ID | Vercel + .env |
| `SLACK_USER_LEEHJ2` | 이현진 Slack ID | Vercel + .env |
| `DEMO_MODE` | 데모 모드 (true/false) | Vercel + .env |
