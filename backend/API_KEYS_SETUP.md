# 🔑 ANY 브릿지 백엔드 — API 키 & 토큰 설정 가이드

## 현재 상태 요약

| 서비스 | 상태 | 용도 | 필요한 작업 |
|--------|------|------|-------------|
| Gemini API | ✅ 테스트 완료 | RAG/라우팅/CHECK | 키 복사만 하면 됨 |
| Claude API | ❌ 미설정 | 코파일럿/데이터 생성 | API 키 발급 필요 |
| Supabase | ❌ 미설정 | PostgreSQL DB | 프로젝트 생성 필요 |
| Slack Bot | ❌ 미설정 | Slack Bolt 연동 | Bot Token 발급 필요 |
| Slack MCP | ✅ 설정 완료 | MCP 채널 조회용 | 백엔드용 별도 토큰 필요 |
| Confluence | ✅ 설정 완료 | 문서 조회 | 백엔드에서는 불필요 |
| Google Workspace | ✅ 설정 완료 | 시트/드라이브 | 백엔드에서는 불필요 |
| Salesforce | ⚠️ 토큰 만료 가능 | 고객 데이터 조회 | 토큰 갱신 필요할 수 있음 |

---

## 1. Gemini API Key ✅ (이미 완료)

```env
GEMINI_API_KEY=your_gemini_api_key_here
```
- 테스트 완료 (gemini-2.5-flash 정상 동작)
- hackerton/.env에서 복사

---

## 2. Claude API Key ❌ (발급 필요)

**용도**: AI 코파일럿 답변 초안 생성 + 가상 케이스 데이터 500건 생성 + Constitutional AI

**발급 방법**:
1. https://console.anthropic.com/ 접속
2. 로그인 (또는 회원가입)
3. Settings → API Keys → Create Key
4. 키 이름: `anybridge-hackathon`
5. 생성된 키 복사 (sk-ant-api03-... 형식)

```env
CLAUDE_API_KEY=sk-ant-api03-여기에_키_붙여넣기
```

**비용 예상**: Claude Sonnet 4 기준
- 코파일럿 답변 생성: ~$0.01/건
- 데이터 500건 생성: ~$2-3
- 해커톤 전체: ~$10 이내

---

## 3. Supabase ❌ (프로젝트 생성 필요)

**용도**: 케이스 데이터 저장, 대시보드 KPI, 대화 이력

**설정 방법**:
1. https://supabase.com/ 접속 → 로그인
2. New Project 클릭
3. 설정:
   - Organization: 기존 또는 새로 생성
   - Project name: `anybridge`
   - Database Password: 안전한 비밀번호 설정 (메모해두기)
   - Region: `Northeast Asia (Tokyo)` 선택
4. 프로젝트 생성 후 Settings → API 에서:
   - Project URL 복사
   - anon public 키 복사

```env
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.여기에_키_붙여넣기
```

**DB 테이블 생성** (프로젝트 생성 후 SQL Editor에서 실행):
```sql
-- 케이스 테이블
CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  product TEXT,
  question TEXT NOT NULL,
  ai_answer TEXT,
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
  status TEXT DEFAULT 'created' CHECK (status IN ('created', 'ai_responding', 'ai_resolved', 'escalated', 'resolved', 'closed')),
  needs_escalation BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 대시보드 통계용 가상 데이터 테이블
CREATE TABLE dashboard_stats (
  id SERIAL PRIMARY KEY,
  period TEXT NOT NULL,
  total_cases INT DEFAULT 0,
  ai_resolved INT DEFAULT 0,
  escalated INT DEFAULT 0,
  avg_response_time_ai INT DEFAULT 25,
  avg_response_time_agent INT DEFAULT 1080,
  satisfaction_avg DECIMAL(3,1) DEFAULT 4.2,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 대화 이력 테이블
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id),
  session_id TEXT NOT NULL,
  role TEXT CHECK (role IN ('user', 'assistant', 'agent', 'system')),
  content TEXT NOT NULL,
  agent_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Slack Bot Token ❌ (앱 생성 필요)

**용도**: Slack Bolt로 채널 생성, 메시지 발송, 담당자 초대, 실시간 이벤트 수신

**현재 MCP 토큰과의 차이**:
- MCP 토큰 (`xoxp-...`): 사용자 토큰, 읽기 위주
- Bot 토큰 (`xoxb-...`): 봇 토큰, 채널 생성/메시지 발송 가능
- App 토큰 (`xapp-...`): Socket Mode용, 실시간 이벤트 수신

**설정 방법**:
1. https://api.slack.com/apps 접속
2. Create New App → From scratch
3. App Name: `ANY브릿지봇`, Workspace: 마크애니 워크스페이스 선택
4. **OAuth & Permissions** → Bot Token Scopes 추가:
   - `channels:manage` (채널 생성)
   - `channels:read` (채널 조회)
   - `channels:join` (채널 입장)
   - `chat:write` (메시지 발송)
   - `users:read` (사용자 조회)
   - `groups:write` (프라이빗 채널)
   - `im:write` (DM 발송)
5. Install to Workspace → Allow
6. Bot User OAuth Token 복사 (`xoxb-...`)
7. **Socket Mode** → Enable Socket Mode
8. App-Level Token 생성 (이름: `anybridge-socket`, scope: `connections:write`)
9. App Token 복사 (`xapp-...`)

```env
SLACK_BOT_TOKEN=xoxb-여기에_봇_토큰
SLACK_APP_TOKEN=xapp-여기에_앱_토큰
SLACK_SIGNING_SECRET=여기에_signing_secret
```

> ⚠️ Slack Bot은 Sub-agent 2 (Slack Integration Agent)에서 사용합니다.
> Sub-agent 1 (Backend Core)은 Slack 없이도 동작합니다.

---

## 5. 최종 .env 파일 템플릿

아래 내용을 `hackerton/backend/.env`에 저장하세요:

```env
# ===== ANY 브릿지 백엔드 =====

# Demo Mode (true면 외부 API 없이 mock 데이터로 동작)
DEMO_MODE=true

# --- Sub-agent 1: Backend Core ---
# Gemini API (✅ 테스트 완료)
GEMINI_API_KEY=your_gemini_api_key_here

# --- Sub-agent 2: Slack Integration ---
# Slack Bot (❌ 발급 필요)
# SLACK_BOT_TOKEN=xoxb-여기에_봇_토큰
# SLACK_APP_TOKEN=xapp-여기에_앱_토큰

# --- Sub-agent 3: AI Safety + Data ---
# Claude API (❌ 발급 필요)
# CLAUDE_API_KEY=sk-ant-api03-여기에_키

# Supabase (❌ 프로젝트 생성 필요)
# SUPABASE_URL=https://xxxxxxxx.supabase.co
# SUPABASE_ANON_KEY=eyJ...

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:5173
```

---

## 🚀 우선순위

| 순서 | 작업 | 필요한 서비스 | 소요 시간 |
|------|------|--------------|----------|
| 1 | Backend Core 구현 | Gemini만 (✅) | 지금 바로 |
| 2 | Supabase 설정 | Supabase | 10분 |
| 3 | Claude API 발급 | Anthropic | 5분 |
| 4 | Slack Bot 생성 | Slack API | 15분 |

> **DEMO_MODE=true 상태에서는 Gemini API만으로 Backend Core 전체가 동작합니다.**
> 나머지는 각 Sub-agent 구현 시점에 설정하면 됩니다.
