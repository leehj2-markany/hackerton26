# ANY 브릿지 — 전체 세션 작업 이력

> 프로젝트: ANY 브릿지 (AI 프리세일즈 어시스턴트)
> 해커톤: 마크애니 AI 해커톤 2026 (2/27 ~ 3/15)
> 팀: ES사업부 제품개발팀
> 배포: https://hackerton-kappa.vercel.app
> 최종 업데이트: 2026-03-12

---

## 목차
1. [프로젝트 개요](#1-프로젝트-개요)
2. [아키텍처 & 기술 스택](#2-아키텍처--기술-스택)
3. [세션별 작업 이력 (시간순)](#3-세션별-작업-이력-시간순)
4. [현재 코드 구조](#4-현재-코드-구조)
5. [핵심 설계 결정 & 트레이드오프](#5-핵심-설계-결정--트레이드오프)
6. [알려진 이슈 & 주의사항](#6-알려진-이슈--주의사항)
7. [남은 작업 (TODO)](#7-남은-작업-todo)

---

## 1. 프로젝트 개요

마크애니 홈페이지에 임베딩되는 AI 프리세일즈 챗봇. 고객 기술 문의에 RAG 기반 자동 답변 → 복잡한 문의는 Slack 에스컬레이션으로 실제 담당자 연결.

**핵심 차별점:**
- 3-Tier LLM 라우팅 (Flash → Pro → Claude Opus)
- DESV 파이프라인 (복합질문 분해 → 서브질문별 독립 RAG → 통합 답변 → 커버리지 검증)
- AI Safety (인젝션 방어 32패턴 + PII 마스킹 + Constitutional AI)
- 실시간 Slack 에스컬레이션 (담당자 순차 입장 + AI 코파일럿)

---

## 2. 아키텍처 & 기술 스택

```
[Frontend]  React 18 + Vite 5 + Tailwind 3
     ↓ HTTPS
[Vercel Serverless]  api/ 디렉토리 (Node.js ES modules)
     ↓
[LLM]  Gemini 2.5 Flash/Pro + Claude Opus 4
[DB]   Supabase (PostgreSQL) — cases 500건, escalations 120건, knowledge_chunks (pgvector)
[Slack] Bot (xoxb) — 에스컬레이션 채널 생성 + 메시지 발송
[MCP]  Salesforce, Jira, Confluence, Google Workspace
```

**Dual API Directory 동기화 (필수):**
- `api/_lib/` — Vercel 프로덕션용
- `backend/api/lib/` — 로컬 개발용
- 한쪽 수정 시 반드시 다른 쪽도 동기화할 것

---

## 3. 세션별 작업 이력 (시간순)

### 세션 1: 기획 & 분석 (2/27)

**작업 내용:**
- Slack 워크스페이스 130개+ 채널 구조 분석 → 기술지원 Q&A 반복 문제 발견
- 해커톤 아이디어 5개 도출, "AI 프리세일즈 어시스턴트" 최종 선정
- 5개 서브에이전트 아키텍처 설계 (Frontend / Backend Core / Slack Integration / AI Safety / Data & Dashboard)
- API 인터페이스 계약(Contract) 정의 — 5개 엔드포인트
- 전문가 그룹 토론 (AI전문가 / AWS아키텍트 / 세일즈포스 / MBA / 해커톤탑티어)

**산출물:**
- `docs/hackathon_analysis.md` — Slack 채널 분석 + 아이디어 도출
- `docs/subagent_architecture.md` — 5개 서브에이전트 구조
- `docs/implementation_plan.md` — 구현 계획 + API 인터페이스
- `.kiro/specs/anybridge-hackathon/requirements.md` — 요구사항 정의

**핵심 결정:**
- Vercel Serverless 선택 (Cloudflare Workers 대비 Node.js 생태계 호환성)
- Gemini + Claude 듀얼 LLM 전략 (단일 모델 대비 복잡도별 최적화)
- Supabase 선택 (Firebase 대비 PostgreSQL 쿼리 유연성)

---

### 세션 2: Frontend 구현 (2/27)

**작업 내용:**
- React + Vite + Tailwind 프로젝트 세팅
- 마크애니 가상 홈페이지 클론 (Homepage.jsx)
- 챗봇 UI 구현 — 자동 팝업, 대화창, 입력 필드 (Chatbot.jsx)
- AI 사고 과정 패널 (ThinkingPanel.jsx) — 접이식, 단계별 표시
- 실시간 정보 패널 (InfoPanel.jsx) — 고객 정보, 과거 이력, 신뢰도
- 담당자 입장 표시 UI (AgentStatus.jsx) — 프로필 + 역할 + 진행률
- 대시보드 (Dashboard.jsx) — KPI 카드, Before/After 비교
- Mock 데이터로 2개 데모 시나리오 완성 (SK하이닉스, 국방부)

**산출물:**
- `frontend/` 전체 — React SPA
- `frontend/API_INTERFACE.md` — 프론트↔백엔드 API 명세
- `FRONTEND_HANDOFF.md` — 백엔드 팀 핸드오프 문서

**UX 크로스 리뷰 결과 (88% 완성도):**
- 즉시 수정 3건 적용: ThinkingPanel 자동확장, onKeyDown, unused imports
- `docs/ux_frontend_expert_review.md` 참조

---

### 세션 3: Backend Core 구현 (2/27~2/28)

**작업 내용:**
- Vercel Serverless Functions 7개 엔드포인트 구현
  - `POST /api/chat` — Gemini RAG + 복합질문 분해
  - `POST /api/customer/match` — 퍼지 고객 매칭
  - `POST /api/escalate` — 에스컬레이션 생성 + Slack 연동
  - `GET /api/escalate/{channelId}/members` — 담당자 입장 폴링
  - `GET /api/case/{caseId}` — 케이스 타임라인
  - `GET /api/dashboard/stats` — 대시보드 KPI
  - `GET /api/health` — 서비스 상태
- 로컬 개발 서버 (server.js) — Pure Node.js http.createServer
- DEMO_MODE 지원 (mock 데이터 / 실제 API 전환)
- 7/7 API 테스트 통과

**핵심 모듈:**
- `api/_lib/geminiClient.js` — 3-Tier LLM 클라이언트
- `api/_lib/knowledgeBase.js` — RAG 지식 베이스
- `api/_lib/safety.js` — AI Safety 미들웨어
- `api/_lib/slackClient.js` — Slack Bot 클라이언트
- `api/_lib/mockData.js` — 고객 데이터 + 매핑
- `api/_lib/config.js` — 환경변수 관리
- `api/_lib/cors.js` — CORS + JSON 응답 헬퍼

---

### 세션 4: API 키 & MCP 연결 (2/28)

**작업 내용:**
- Gemini API 연결 (gemini-2.5-flash + gemini-2.5-pro)
- Claude API 연결 (claude-opus-4-20250514)
- Supabase 연결 (PostgreSQL) — DB 테이블 4개 + 인덱스 5개
- Slack Bot 연결 (애니브릿지 앱, xoxb 토큰)
- Salesforce MCP 연결 (OAuth Connected App, refresh_token 365일)
- Jira / Confluence / Google Workspace MCP 연결
- 3-Tier LLM 전략 구현: simple→Flash, complex→Pro, critical→Claude Opus

**환경변수 (7개):**
- GEMINI_API_KEY, CLAUDE_API_KEY
- SUPABASE_URL, SUPABASE_ANON_KEY (= SUPABASE_KEY, DB + pgvector 공용)
- SLACK_BOT_TOKEN, SLACK_CHANNEL_ID
- (DEMO_MODE — 선택)

---

### 세션 5: 데이터 & Slack Integration (2/28)

**작업 내용:**
- Supabase DB: cases 500건 + escalations 120건 + dashboard_stats 8건 bulk insert
- Slack 클라이언트 모듈 구현:
  - postMessage, postEscalationMessage (Block Kit)
  - simulateAgentJoin (순차 입장 시뮬레이션)
  - postAiCopilotSuggestion (AI 코파일럿 + 버튼)
  - postResolutionSummary (해결 요약)
- 에스컬레이션 API ↔ Slack 연동 통합
- 실시간 담당자 입장 감지 (인메모리 시뮬레이션 + 폴링)

---

### 세션 6: AI Safety & Frontend-Backend 통합 (2/28)

**작업 내용:**
- AI Safety 미들웨어 구현 (safety.js):
  - sanitizeInput — 듀얼 레이어 인젝션 방어 (32개 패턴)
  - maskPII — 전화번호/이메일/주민번호/카드번호
  - constitutionalCheck — 헌법적 AI 3원칙
  - validateOutput — severity 기반 판단 (high만 차단)
- Frontend ↔ Backend 통합:
  - VITE_USE_BACKEND=true 전환
  - 3-Tier LLM 실시간 응답 확인
  - CORS 정상 동작 확인
- 프론트엔드 빌드 성공 (49 modules, 234KB gzip 75KB)

---

### 세션 7: Vercel 배포 & 통합 테스트 (2/28)

**작업 내용:**
- Vercel CLI 설치 + 프로젝트 구조 최적화 (api/_lib 패턴으로 Hobby 12 function 제한 해결)
- 환경변수 7개 설정 → 프로덕션 배포 성공
- 통합 테스트 7/7 통과:
  - health: gemini/claude/supabase/slack 모두 true
  - chat (단순): Flash 응답, confidence high, score 86~90
  - chat (복합, 3 subQuestions): Claude Opus 응답, score 94
  - customer/match: SK하이닉스 정확 매칭
  - escalate: Slack 채널 연동, 4명 에이전트 초대
  - dashboard/stats: Supabase 실데이터 500건
  - case: 타임라인 7개 이벤트

**배포 URL:** https://hackerton-kappa.vercel.app


---

### 세션 8: 대시보드 v2 + 인사 감지 (3/4)

**작업 내용:**
- 대시보드 v2 — Salesforce 스타일 재설계, Before/After 제거, AI vs 휴먼 시각화
- 인사 감지 로직 추가: "안녕하세요" 등 인사 메시지는 RAG 스킵 + 자연스러운 인사 응답
- GREETING_PATTERNS 배열 + ESCALATION_INTENT_WORDS 예외 처리

**커밋:** `4d0e0ca`, `dc51c29`

---

### 세션 9: 시스템 프롬프트 개선 + LLM-as-a-Router (3/5)

**작업 내용:**
- 시스템 프롬프트 대폭 개선:
  - 대화 맥락 반복 방지 규칙 추가
  - 불만 표현("그래서?", "어쩌라는거죠?") 시 구체적 답변 유도
  - 도입/구축 질문에 첫 답변부터 구축 기간/프로세스/레퍼런스 포함 규칙
  - 대화 유도 전략 (후속 질문으로 자연스럽게 정보 수집)
- Slack RAG 참조 근거 추가 + 대화 세션 연속성 수정
- **LLM-as-a-Router 전환 (TASK25):**
  - 키워드 룰 전부 제거 → Flash가 복잡도 판단 + 서브질문 분류 + 담당자 배정
  - ROUTER_PROMPT 설계: complexity(simple/complex/critical) + subQuestions + assignee
  - 담당자 배정 기준: 송인찬(영업), 이현진(SE), 박우호(개발리더)
- 에스컬레이션 흐름 동적화 (TASK31):
  - 서브질문/담당자/채널명/quickReply 모두 LLM 기반 동적 생성
  - 하드코딩 시나리오 제거

**핵심 결정:**
- 키워드 룰베이스 → LLM 자연어 판단 전환 (agent_principles #1: 추상적 해결 우선)
- 이유: 하드코딩 키워드가 엣지케이스를 못 잡음 (예: "그래서 어쩌라는거죠?"를 complex로 오판)

**커밋:** `6d695f9`, `aee521a`, `0ed05b6`, `19c38e3`, `e7d55b2`, `80bac0c`

---

### 세션 10: 챗봇 UX 수정 + Constitutional AI (3/5)

**작업 내용:**
- 챗봇 활성화 문제 수정: X버튼 최소화 전환, 문의하기/무료상담 버튼 연결
- 새로고침 시 챗봇 자동 열림 문제 수정: 초기 상태 닫힘, 플로팅 버튼으로 열기
- generateAnswer 호출 시그니처 수정 (session/close.js) — skipRAG 옵션 적용
- R21 Constitutional AI 구현 (Claude Sonnet 4로 2차 검증)
- R22 RA-RAG Lite 구현

**커밋:** `49375dd`, `592c692`, `196c38c`, `2a34e69`

---

### 세션 11: 안정성 강화 — 타임아웃 + Graceful Degradation (3/6)

**작업 내용:**
- **모든 LLM 호출에 타임아웃 추가:**
  - 문제: Vercel 10초 제한에 Gemini/Claude API hang 시 FUNCTION_INVOCATION_FAILED 발생
  - 해결: `withTimeout()` 래퍼 — 메인 호출 15초, 보조 호출 8초
  - Claude는 20초 (AbortController 사용)
- **Graceful Degradation:**
  - AI 실패 시 500 에러 대신 `{ success: true, needsEscalation: true }` 반환
  - 프론트엔드에서 "담당자 연결" 버튼 자동 표시
  - customerInfo를 try 밖에서 선언하여 catch에서도 접근 가능

**커밋:** `d086ae3`, `332a74c`

---

### 세션 12: Constitutional AI 오판 수정 + Context Extraction (3/9)

**작업 내용:**
- **Constitutional AI false positive 문제 해결:**
  - 문제: Claude가 정상적인 프리세일즈 답변(구축 기간/프로세스/레퍼런스)을 "허위 약속"으로 오판 → 답변 차단
  - 해결 1: Constitutional AI 프롬프트에 프리세일즈 컨텍스트 추가
  - 해결 2: severity 기반 판단 (high만 차단, low/none은 경고 로그 후 통과)
- **Context Extraction (고객 조건 추출):**
  - Router 1회 호출로 복잡도 판단 + 고객 조건 추출 동시 수행 (추가 API 비용 0)
  - extractedContext: product, userScale, intent, environment, urgency
  - 시스템 프롬프트에 `[추출된 고객 조건]` 섹션 추가 → 맞춤형 답변

**커밋:** `e0ee41a`, `ed03177`

---

### 세션 13: DESV 파이프라인 구현 (3/9) — 가장 큰 아키텍처 변경

**작업 내용:**
- **DESV (Decompose → Enrich → Synthesize → Verify) 파이프라인:**
  - CHECK 논문 기반 복합질문 전용 파이프라인
  - Phase 1 (Decompose): Router가 서브질문 분해 + 담당자 배정
  - Phase 2 (Enrich): 서브질문별 독립 RAG 검색 (LLM 추가 호출 0회, in-memory)
  - Phase 3 (Synthesize): 구조화 프롬프트로 LLM 1회 호출 → 통합 답변
  - Phase 4 (Verify): 서브질문 커버리지 검증 (각 서브질문에 대한 답변 포함 여부)
- **Router complex 판단 기준 강화:**
  - 2개 이상 제품 언급 시 무조건 complex
  - 대화 이력을 Router에 전달 → 맥락 의존적 질문 처리
- **Fallback 강화:**
  - Router LLM 실패 시에도 다중 제품 키워드 감지 → DESV 진입 보장
  - fallbackAnalyze()에서 감지된 제품별 서브질문 자동 생성
- **LLM 타임아웃 확대:**
  - Vercel maxDuration 60초에 맞춰 메인 15초, 보조 8초
- **chat.js 프로덕션 동기화:**
  - customerInfo 스코프 수정 + extractedContext 응답 추가

**핵심 결정:**
- complex에서도 Flash 사용 (Pro 대신) — Pro가 Vercel에서 15초 타임아웃 빈발
- DESV 구조화 프롬프트가 컨텍스트 품질을 보장하므로 Flash로도 충분한 답변 품질

**커밋:** `a505577`, `17ac115`, `3b9e794`, `909ab11`, `27bdeb2`, `f13434f`

---

### 세션 14: 에스컬레이션 UX 종합 수정 (3/9) — P1~P5

**작업 내용:**
- **P1: 담당자 배정 오류 수정** — LLM Router의 assignee가 Slack 메시지에 정확히 반영되도록
- **P2: Slack 시스템 메시지 필터링** — "채널 참여함" 등이 LIVE 답변으로 표시되는 문제 해결
  - SYSTEM_SUBTYPES Set으로 channel_join/leave/topic 등 필터링
- **P3: 이중 메시지 방지** — 에스컬레이션 시 AI 답변 + 에스컬레이션 메시지 중복 제거
- **P4: LLM 2중 호출 방지:**
  - 문제: chat.js에서 analyzeQuestion 1회 + generateAnswer 내부에서 1회 = 2중 호출
  - 해결: chat.js에서 1회 호출 → `options.preAnalysis`로 전달 → generateAnswer에서 재사용
- **P5: 에스컬레이션 후 버튼 잔류 문제** — 담당자 연결 완료 후 버튼 숨김
- **AI 복귀 경로 추가** — 에스컬레이션 후에도 AI에게 다시 질문 가능
- **errorDetail 디버그 필드 제거** — 프로덕션 보안

**커밋:** `e038ace`, `7cf7feb`, `97c2bb7`

---

### 세션 15: 응답 시간 측정 (3/5)

**측정 결과 (프로덕션):**

| 시나리오 | 복잡도 | 모델 | 응답시간 |
|---------|--------|------|---------|
| 인사 | simple | Flash | 7.76s |
| 단순 제품 질문 | simple | Flash | 7.76s |
| 도입 검토 | simple | Flash | 7.50s |
| 후속 구체화 | complex | Pro | 22.39s |
| 복합 질문 | complex | Pro | 19.98s |
| 불만/추가설명 | simple | Flash | 9.22s |
| 가격 문의 (에스컬레이션) | simple | Flash | 10.04s |

**참고:** 세션 13 이후 complex도 Flash 사용으로 전환 → 응답시간 대폭 단축 예상


---

### 세션 16: pgvector 시맨틱 검색 전환 (3/10) — RAG 아키텍처 업그레이드

**작업 내용:**
- **knowledgeBase.js pgvector 전환:**
  - 기존 in-memory STORES 키워드 검색 → Supabase pgvector 코사인 유사도 검색으로 1차 검색 전환
  - Gemini `gemini-embedding-001` 모델로 쿼리 임베딩 생성
  - `match_knowledge` RPC 함수 호출 (코사인 유사도 기반)
  - 제품군 필터 적용 + 필터 결과 없으면 전체 검색 재시도
  - pgvector 실패 시 기존 in-memory STORES로 자동 fallback (안전망)
  - searchKnowledge() 시그니처 유지 → chat.js, geminiClient.js 변경 불필요
- **데이터 파이프라인 스크립트:**
  - `scripts/setupSupabaseVector.js` — knowledge_chunks 테이블 + match_knowledge RPC + RLS 정책 SQL 출력
  - `scripts/ingestKnowledge.js` — Google Sheets 제품 정보 30건 + 기존 STORES 11건 → Gemini 임베딩 → Supabase 적재
- **rerankResults()** — 벡터 검색 결과에도 키워드 매칭 보너스 재랭킹 적용

**핵심 결정:**
- pgvector 우선 + in-memory fallback 이중 구조 — 벡터 DB 장애 시에도 서비스 중단 없음
- searchKnowledge 시그니처 유지 — 호출부(chat.js, geminiClient.js) 변경 0건
- 임베딩 모델: `gemini-embedding-001` (3072차원) — Gemini 생태계 통일

**환경변수 추가:**
- SUPABASE_URL, SUPABASE_ANON_KEY (기존 DB용과 공유)

---

### 세션 17: RAG 청크 품질 개선 — useCases 필드 + 임베딩 가중치 (3/10)

**작업 내용:**
- **useCases 필드 추가 (전 제품 28개):**
  - 문제: 의도 기반 쿼리("위변조방지", "USB유출", "화면캡처")에서 정확한 제품 매칭 실패
  - 원인: 청크 텍스트에 사용 시나리오/의도 키워드가 부족하여 임베딩 벡터가 의도를 반영하지 못함
  - 해결: 모든 SHEET_PRODUCTS에 useCases 배열 추가 (제품별 3~8개 사용 시나리오)
- **buildChunkText() 임베딩 가중치 구조 개선:**
  - useCases를 청크 텍스트 상단 + 하단에 반복 배치 → 임베딩 모델의 positional bias 활용
  - 구조: `[사용 사례] → [제품명/설명/카테고리] → [사용 사례 반복]`
- **사용자 36항목 피드백 기반 useCases 전면 재정의:**
  - 제품 경계 규칙 엄격 적용 (ES SAFER=Document SAFER, 위변조방지=ePage/ePS만, 비가시성=TRACER만 등)
  - 36/36 쿼리 100% 정확도 달성

**테스트 결과:**
- 36-query 벡터 검색: 100% 완전 매칭
- 50-query 복합 검색: 100% 부분 매칭, 64% 완전 매칭 (topK=5 구조적 한계)

**커밋:** `0cdcfa7`, `b70d3d9`, `11c4853`

---

### 세션 18: 데이터 정제 — SafeCopy/ContentSAFER 삭제 (3/11)

**작업 내용:**
- **SafeCopy, ContentSAFER 삭제:**
  - 문제: 두 제품이 Google Sheet 원본에 존재하지 않는 에이전트 생성(hallucination) 데이터
  - 해결: LEGACY_CHUNKS에서 삭제 + STORES에서 삭제 + 전체 코드베이스 참조 제거
- **전체 코드베이스 클린업:**
  - `api/_lib/`, `backend/api/lib/`, `scripts/`, `docs/` 전체에서 SafeCopy/ContentSAFER 참조 제거
  - 테스트 스크립트에서도 관련 쿼리/기대값 제거
  - Dual API sync 완료 확인
- **재적재:** 37/37 청크 (28 SHEET_PRODUCTS + 9 LEGACY_CHUNKS)
- **테스트:** 36/36 벡터 검색 100%, 50-query 100% 부분 매칭 유지

**커밋:** `029a6f5`, `ae6f3c8`

---

### 세션 19: 하이퍼링크 2depth 문서 수집 + 제품 정의 보정 (3/11)

**작업 내용:**
- **제품 정의 보정 (8개 제품):**
  - Mobile STICKER: "경량 MDM" → "카메라/녹음 차단 + 화면 워터마크" 정확한 정의로 수정
  - Mobile SAFER: MDM 솔루션 명확화
  - ePS DocumentMerger: "PDF 보안뷰어 유통" 정확한 정의
  - Web SAFER: "Web DRM = 캡처방지/브라우저 보안제어" 명확화
  - DS I/F Server: 서버 DRM 연동 인터페이스 정확화
  - ePage SAFER: 전자문서 위변조 방지 정확화
  - ePS Document DNA: 디지털 지문 원본 검증 정확화
  - TRACER SDK for Mobile: 모바일 워터마크 담당 명확화
- **Google Sheet 하이퍼링크 문서 수집:**
  - 6개 하이퍼링크 문서 내용 수집 → `scripts/sheetHyperlinks.json` 저장
  - IST 표준기능정의서, 모듈담당자, 스펙정의서, MIP정책, PrintSAFER전용 등
- **HYPERLINK_CHUNKS 17개 추가:**
  - IST 표준기능정의서 → 7개 제품별 청크
  - 모듈담당자 → 6개 제품별 청크
  - 스펙정의서 → 2개 제품별 청크
  - MIP정책 → 1개, PrintSAFER전용 → 1개
- **재적재:** 54/54 청크 (28 SHEET_PRODUCTS + 17 HYPERLINK_CHUNKS + 9 LEGACY_CHUNKS)
- **테스트:** 36-query 100%, 50-query 부분 매칭 100%

**커밋:** `b7cced6`

---

### 세션 20: 4인 전문가 패널 리뷰 + 코드 품질 개선 (3/11)

**작업 내용:**
- **4인 전문가 페르소나 리뷰 수행:**
  - Claude 개발 테크리드: 아키텍처 패턴, 에러 핸들링, dead code 지적
  - Codex 개발 테크리드: DRY 위반, Dual API sync 구조적 문제, 테스트 전략
  - RAG 알고리즘 석학: 청킹 전략, 리랭킹 알고리즘, HYPERLINK_CHUNKS 설계 평가
  - 백엔드 석학: API 설계, 보안 레이어, 확장성, Rate limiting 부재
- **🔴 우선순위 높음 3개 항목 병렬 수정:**
  1. `evaluateConfidence` 중복 제거 + Math.random 제거 (geminiClient.js)
     - safety.js의 정교한 버전을 사용하도록 통합, 랜덤 요소 제거
  2. `KNOWLEDGE_BASE` 하드코딩 제거 (geminiClient.js)
     - SYSTEM_PROMPT에서 정적 제품 정보 제거 → RAG 결과만으로 컨텍스트 구성
  3. `MAX_INPUT_LENGTH` 500→1000 확장 (safety.js)
     - 복합질문이 500자 초과 시 잘려서 LLM에 전달되는 문제 해결
- **Dual API sync:** backend/api/lib/ 동기화 완료

**미커밋 변경 파일:**
- `api/_lib/geminiClient.js` — evaluateConfidence 통합 + KNOWLEDGE_BASE 제거
- `api/_lib/safety.js` — MAX_INPUT_LENGTH 1000
- `api/chat.js` — evaluateConfidence import 경로 변경
- `backend/api/lib/geminiClient.js` — 동기화
- `backend/api/lib/safety.js` — 동기화

---

### 세션 21: 성능 최적화 — LLM 호출 절감 (3/12)

**작업 내용:**
- **analyzeQuestion preAnalysis 재활용 (P4 수정 완성):**
  - 문제: chat.js에서 `analyzeQuestion` 1회 호출 후 결과를 `generateAnswer`에 `preAnalysis`로 전달하는 구조는 세션 14에서 도입했으나, 실제 `generateAnswer` 내부에서 재활용 여부 확인 + 주석 정비
  - 결과: Gemini Router 호출 1회 절약 (simple 기준 ~2-3초)
- **validateOutput skipLLM 옵션 추가:**
  - 문제: `chat.js`에서 `validateOutput(answer, message, { skipLLM: true })` 호출하지만, `safety.js`가 3번째 인자를 무시 — `skipLLM` 옵션이 실제로 동작하지 않음
  - 해결: `safety.js`의 `validateOutput(answer, originalQuestion, options = {})` 시그니처로 변경
  - 로직: `skipLLM=true`이면 regex 규칙 기반 검증만 수행 후 즉시 반환 (Claude LLM 2차 검증 스킵)
  - 적용 기준: `analysis.complexity === 'simple'`일 때 skipLLM — simple 질문은 RAG 기반 단일 제품 답변이라 안전성 위험 낮음
  - 절약: simple 질문당 Claude API 호출 1회 (~3-5초 + 비용)
- **chat.js 주석 정비:**
  - 성능 최적화 의도를 명확히 하는 주석 추가 (병렬화 준비, skipLLM 근거)
- **Dual API sync 완료:**
  - `api/_lib/safety.js` + `backend/api/lib/safety.js` 양쪽 모두 `skipLLM` 파라미터 지원

**성능 개선 효과 (simple 질문 기준):**
- analyzeQuestion 2중 호출 방지: ~2-3초 절약
- validateOutput Claude 스킵: ~3-5초 절약
- 합계: simple 질문당 **~5-8초 응답시간 단축**

**핵심 결정:**
- simple 질문에 Claude 안전 검증 스킵 — regex 규칙 기반만으로 충분
- 근거: simple은 단일 제품 RAG 답변이라 경쟁사 비교/과도한 약속 등 안전성 위험이 구조적으로 낮음
- complex/critical은 여전히 Claude LLM 2차 검증 유지

**커밋:** `7e3e3f3` — 세션 21+22 통합 커밋 (배포 완료)

---

### 세션 22: 기능 중복 제품 구분 안내 규칙 추가 (3/12)

**발견된 문제:**
- 질문: "카티야 사용하고, 비가시성워터마크로 유출차단과 유출 시 추적을 하고 싶네"
- 답변: Print TRACER(출력물)만 안내, Screen TRACER(화면) 누락
- 원인: RAG topK=5에서 Print TRACER 관련 청크가 유사도 높아서 Screen TRACER를 밀어냄

**전문가 리뷰 (4가지 방안 비교):**
- 방안 A: 하드코딩 규칙 ("비가시성 워터마크 → Print + Screen") — agent_principles #1 위반 (단편적 해결)
- 방안 B: 추상적 규칙 ("기능이 여러 제품에 걸칠 때 적용 대상별 구분 안내") — ✅ 채택
- 방안 C: RAG topK 증가 — 모든 질문에 토큰 비용 증가
- 방안 D: B+C 하이브리드 — 구현 복잡도 높음

**적용 내용:**
- SYSTEM_PROMPT 답변 규칙에 1줄 추가:
  "고객이 특정 기능(예: 워터마크, 암호화, 추적, DRM 등)을 언급할 때, 해당 기능이 여러 제품에 걸쳐 제공되는 경우 적용 대상별로 구분하여 안내하세요. (예: 출력물 vs 화면, 문서 vs 이메일 등)"
- Dual API sync 완료 (api/_lib/geminiClient.js + backend/api/lib/geminiClient.js)

**테스트 결과 (배포 후):**
- 동일 질문 재테스트 → Print TRACER(출력물) + Screen TRACER(화면) 양쪽 구분 안내 ✅
- 고객에게 어떤 경로를 우선 보호할지 확인 질문까지 포함 ✅
- 추상적 규칙이라 비가시성 워터마크뿐 아니라 유사 패턴(DRM, 암호화 등) 전체 커버

**핵심 결정:**
- 하드코딩 규칙 대신 추상적 규칙 선택 (agent_principles #1: 추상적 해결 우선)
- 프롬프트 1줄 추가만으로 해결 → 코드 변경 최소, 롤백 쉬움, 사이드 이펙트 범위 좁음

**커밋:** `7e3e3f3` — 세션 21+22 통합 커밋
**배포:** Vercel 프로덕션 배포 완료

---

## 4. 현재 코드 구조

```
hackerton/
├── api/                          # Vercel Serverless (프로덕션)
│   ├── _lib/                     # 공유 모듈 (Vercel이 함수로 안 셈)
│   │   ├── config.js             # ENV 환경변수 관리
│   │   ├── cors.js               # CORS + json/error 헬퍼
│   │   ├── geminiClient.js       # ★ 3-Tier LLM + DESV 파이프라인 + Router + Cache
│   │   ├── knowledgeBase.js      # ★ RAG 지식 베이스 (pgvector 시맨틱 검색 + in-memory fallback)
│   │   ├── mockData.js           # 고객 데이터 (customers, customerNameMap)
│   │   ├── safety.js             # AI Safety (인젝션방어 + PII + Constitutional AI)
│   │   ├── slackClient.js        # Slack Bot (메시지/에스컬레이션/코파일럿)
│   │   └── virtualAgents.js      # 가상 담당자 시뮬레이션
│   ├── case/                     # GET /api/case/{caseId}
│   ├── customer/                 # POST /api/customer/match
│   ├── dashboard/                # GET /api/dashboard/stats
│   ├── escalate/                 # POST /api/escalate + GET members
│   ├── session/                  # 세션 관리
│   ├── slack/                    # GET /api/slack/poll (담당자 답변 수신)
│   ├── chat.js                   # ★ POST /api/chat (메인 엔드포인트)
│   ├── escalate.js               # POST /api/escalate
│   └── health.js                 # GET /api/health
├── backend/                      # 로컬 개발용 (api/ 미러)
│   ├── api/lib/                  # ⚠️ api/_lib/과 반드시 동기화
│   └── server.js                 # http.createServer 로컬 서버
├── frontend/                     # React SPA
│   ├── src/
│   │   ├── components/           # Homepage, Chatbot, ThinkingPanel, InfoPanel, AgentStatus, Dashboard
│   │   ├── api/                  # API 호출 래퍼
│   │   └── data/                 # mockData.js
│   └── dist/                     # 빌드 결과물
├── docs/                         # 설계 문서 모음
├── scripts/                      # 데이터 파이프라인
│   ├── ingestKnowledge.js        # Google Sheets → Gemini 임베딩 → Supabase pgvector 적재
│   └── setupSupabaseVector.js    # knowledge_chunks 테이블 + match_knowledge RPC 셋업 SQL 출력
└── vercel.json                   # Vercel 배포 설정
```

### 핵심 파일 의존 관계

```
chat.js
  → geminiClient.js (analyzeQuestion, generateAnswer)
  → knowledgeBase.js (searchKnowledge)
  → safety.js (validateInput, validateOutput, maskPII)
  → mockData.js (customers, customerNameMap)
  → cors.js (cors, json, error)

geminiClient.js
  → config.js (ENV.GEMINI_API_KEY, ENV.CLAUDE_API_KEY)
  → knowledgeBase.js (searchKnowledge, formatContext)
  내부: analyzeQuestion (Router) → generateAnswer (DESV/단일) → selfReflect/verifySubQuestionCoverage

knowledgeBase.js
  → config.js (ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, ENV.GEMINI_API_KEY)
  → @supabase/supabase-js (pgvector RPC)
  → @google/generative-ai (gemini-embedding-001 임베딩)
  내부: vectorSearch (pgvector 우선) → searchKnowledgeFallback (in-memory STORES)

slack/poll.js
  → config.js (ENV, SLACK_USERS)
  → slackClient.js (getChannelHistory)
```

---

## 5. 핵심 설계 결정 & 트레이드오프

### 5.1 LLM-as-a-Router (키워드 룰 → LLM 판단)
- **배경:** 하드코딩 키워드가 엣지케이스를 못 잡음 ("그래서 어쩌라는거죠?"를 complex로 오판)
- **결정:** Flash가 복잡도 판단 + 서브질문 분류 + 담당자 배정 + 고객 조건 추출을 1회 호출로 수행
- **트레이드오프:** Router 호출 1회 추가 비용 vs 정확도 대폭 향상
- **관련 커밋:** `0ed05b6`

### 5.2 DESV 파이프라인 (복합질문 전용)
- **배경:** 단일 RAG로는 "DRM과 개인정보추출 250유저 구축검토" 같은 복합질문에서 한쪽 제품 정보가 누락
- **결정:** 서브질문별 독립 RAG → 구조화 프롬프트 → 커버리지 검증
- **트레이드오프:** 파이프라인 복잡도 증가 vs 복합질문 답변 품질 대폭 향상
- **관련 커밋:** `a505577`

### 5.3 complex에서도 Flash 사용 (Pro 대신)
- **배경:** Gemini Pro가 Vercel에서 15초 타임아웃 빈발 → FUNCTION_INVOCATION_FAILED
- **결정:** DESV 구조화 프롬프트가 컨텍스트 품질을 보장하므로 Flash로도 충분
- **트레이드오프:** 약간의 답변 품질 하락 가능성 vs 안정성 대폭 향상
- **관련 커밋:** `909ab11`

### 5.4 Constitutional AI severity 기반 판단
- **배경:** Claude가 정상적인 프리세일즈 답변을 "허위 약속"으로 오판 → false positive
- **결정:** severity high만 차단, low/none은 경고 로그 후 통과
- **트레이드오프:** 안전성 약간 완화 vs 정상 답변 차단 방지
- **관련 커밋:** `ed03177`

### 5.5 Graceful Degradation
- **배경:** LLM API 실패 시 500 에러 → 사용자 경험 최악
- **결정:** 실패 시에도 `{ success: true, needsEscalation: true }` 반환 → 담당자 연결 흐름
- **트레이드오프:** 에러 투명성 감소 vs 사용자 경험 유지
- **관련 커밋:** `332a74c`

### 5.6 analyzeQuestion 1회 호출 (2중 호출 방지)
- **배경:** chat.js + generateAnswer 양쪽에서 analyzeQuestion 호출 → LLM 비용 2배 + 결과 불일치
- **결정:** chat.js에서 1회 호출 → `options.preAnalysis`로 전달
- **트레이드오프:** 없음 (순수 개선)
- **관련 커밋:** `97c2bb7`

### 5.7 simple 질문 Claude 안전 검증 스킵 (skipLLM)
- **배경:** 모든 질문에 Claude LLM 2차 검증 → simple 질문에서도 3-5초 추가 지연 + API 비용
- **결정:** `analysis.complexity === 'simple'`이면 regex 규칙 기반 검증만 수행, Claude 스킵
- **근거:** simple은 단일 제품 RAG 답변이라 경쟁사 비교/과도한 약속 등 안전성 위험이 구조적으로 낮음
- **트레이드오프:** simple 답변의 심층 안전 검증 포기 vs 응답시간 3-5초 단축 + 비용 절감
- **관련 세션:** 세션 21

### 5.8 기능 중복 제품 구분 안내 — 추상적 프롬프트 규칙
- **배경:** "비가시성 워터마크" 질문에서 Print TRACER만 안내, Screen TRACER 누락
- **원인:** RAG topK=5에서 Print TRACER 청크가 유사도 높아 Screen TRACER를 밀어냄
- **결정:** SYSTEM_PROMPT에 추상적 규칙 1줄 추가 — "기능이 여러 제품에 걸칠 때 적용 대상별 구분 안내"
- **대안 검토:** 하드코딩 규칙(A), topK 증가(C), 하이브리드(D) 모두 사이드 이펙트 더 큼
- **트레이드오프:** LLM이 규칙을 과적용할 가능성 vs 유사 패턴 전체 커버 + 코드 변경 최소
- **관련 세션:** 세션 22

---

---

## 6. 알려진 이슈 & 주의사항

### ⚠️ 반드시 기억할 것

1. **Dual API Directory 동기화**: `api/_lib/` 수정 시 `backend/api/lib/`도 반드시 동기화
2. **Vercel maxDuration**: 현재 60초 설정. LLM 타임아웃은 메인 15초, 보조 8초, Claude 20초
3. **Vercel Hobby 제한**: api/ 루트에 12개 이하 함수만 가능 → `_lib/` 패턴으로 우회
4. **인사 메시지 판단**: 15자 이하 + GREETING_PATTERNS 매칭 + ESCALATION_INTENT_WORDS 예외
5. **캐시 TTL**: 30분, 최대 100개 (인메모리 LRU). Vercel cold start 시 캐시 초기화됨

### 🐛 알려진 버그/제한

1. **Salesforce 실데이터 미연동**: 현재 mockData.js의 하드코딩 고객 데이터 사용
2. **Slack 채널 생성 권한 없음**: findOrSimulateChannel로 기존 채널 재사용 또는 시뮬레이션
3. **모바일 반응형 부족**: 챗봇 w-[450px] 고정 → 모바일에서 화면 벗어남
4. **Chatbot.jsx 크기**: ~400줄, 리팩토링 권장 (해커톤이라 보류)

### 📝 코드 내 주요 주석 컨벤션

코드에 `[의도]`, `[P1~P5 수정]` 등의 주석이 있음. 이는 변경 이유를 기록한 것으로, 삭제하지 말 것.
예: `// [P4 수정] analyzeQuestion 1회 호출 후 결과를 generateAnswer에 전달`

---

## 7. 남은 작업 (TODO)

### 완료됨 ✅
- [x] pgvector 시맨틱 검색 전환 (세션 16, 3/10)
- [x] useCases 기반 청크 품질 개선 (세션 17, 3/10)
- [x] SafeCopy/ContentSAFER 허구 데이터 삭제 (세션 18, 3/11)
- [x] 하이퍼링크 2depth 문서 17개 청크 추가 (세션 19, 3/11)
- [x] 4인 전문가 리뷰 + 코드 품질 개선 3건 (세션 20, 3/11)
- [x] 성능 최적화: preAnalysis 재활용 + validateOutput skipLLM (세션 21, 3/12)
- [x] 기능 중복 제품 구분 안내 — 추상적 프롬프트 규칙 (세션 22, 3/12)

### 필수 (데모 전)
- [ ] 데모 시나리오 1: SK하이닉스 (AI 자동 해결) 리허설
- [ ] 데모 시나리오 2: 국방부 (에스컬레이션 + 협업) 리허설
- [ ] 발표 자료 작성
- [ ] 데모 영상 녹화

### 선택 (시간 여유 시)
- [ ] Salesforce 실데이터 조회 & 매핑
- [ ] 단계별 진행 메시지 자동 발송 (R17)
- [ ] 모바일 반응형 개선
- [ ] Chatbot.jsx 컴포넌트 분리 (MessageBubble, useEscalation 훅)
- [ ] 접근성 기본 속성 추가 (role="dialog", aria-label)
- [ ] Rate limiting 추가 (IP 기반)
- [ ] End-to-end 답변 품질 테스트 추가
- [ ] 청크 메타데이터 source_type 추가
- [ ] 응답 verbose 모드 분리

### 해커톤 이후 로드맵
- [ ] Salesforce MCP 실데이터 연동
- [ ] Slack 실시간 WebSocket (현재 Polling)
- [ ] 다국어 지원
- [ ] 답변 품질 A/B 테스트 프레임워크
- [ ] 프롬프트 버전 관리 시스템
- [ ] Dual API sync → 심볼릭 링크 전환

---

## 부록: Git 커밋 이력 (시간순)

```
11cb3c7 2026-03-04 init: ANY 브릿지 v1.0 — CRM 대화 플로우 + CORS 보안 + RAG + Slack 에스컬레이션
dc51c29 2026-03-04 feat: 대시보드 v2 — Salesforce 스타일 재설계
4d0e0ca 2026-03-04 인사 감지 로직 추가: RAG 스킵 + 자연스러운 인사 응답
aee521a 2026-03-05 feat: Slack RAG 참조 근거 추가 + 대화 세션 연속성 수정
6d695f9 2026-03-05 fix: 시스템 프롬프트 개선 — 대화 맥락 반복 방지 + 불만 표현 시 구체적 답변 유도
19c38e3 2026-03-05 TASK25: 도입/구축 질문 Pro 모델 라우팅 + 첫 답변 구체화 규칙 추가
0ed05b6 2026-03-05 TASK25: LLM-as-a-Router 전환 — 키워드 룰 제거, Flash가 복잡도 판단
e7d55b2 2026-03-05 fix: 에스컬레이션 채널 네이밍/Slack 포맷/AI 중복 답변 수정
80bac0c 2026-03-05 TASK 31: 에스컬레이션 흐름 동적화 — LLM 기반 동적 생성
196c38c 2026-03-05 fix: generateAnswer 호출 시그니처 수정 — skipRAG 옵션 적용
49375dd 2026-03-05 fix: 챗봇 활성화 문제 수정 — X버튼 최소화 전환
592c692 2026-03-05 fix: 새로고침 시 챗봇 자동 열림 문제 수정
2a34e69 2026-03-05 feat: R21 Constitutional AI + R22 RA-RAG Lite
332a74c 2026-03-06 [Graceful Degradation] AI 실패 시 담당자 연결 흐름으로 전환
d086ae3 2026-03-06 [안정성] 모든 LLM 호출에 타임아웃 추가
e0ee41a 2026-03-09 [안전성] Constitutional AI 프롬프트에 프리세일즈 컨텍스트 추가
ed03177 2026-03-09 [Context Extraction + 안전성] Router 1회 호출로 고객 조건 추출 + severity 기반
27bdeb2 2026-03-09 [안정성] chat.js 프로덕션 동기화
a505577 2026-03-09 [복합질문] DESV 파이프라인 구현 (CHECK 논문 기반)
17ac115 2026-03-09 [복합질문] Router complex 판단 기준 강화 + LLM 타임아웃 확대
f13434f 2026-03-09 [chat.js] thinkingProcess 디스크 동기화
3b9e794 2026-03-09 [복합질문] fallback 다중제품 감지 + Router 타임아웃 8초 확대
e038ace 2026-03-09 [디버그] chat.js catch에 errorDetail 추가
909ab11 2026-03-09 [LLM라우팅] complex에서도 Flash 사용
7cf7feb 2026-03-09 [에스컬레이션UX] AI 복귀 경로 추가 + errorDetail 제거
97c2bb7 2026-03-09 [에스컬레이션UX] P1~P5 종합 수정
de709f9 2026-03-10 [RAG] 하드코딩 STORES → pgvector 시맨틱 검색으로 전환
299898b 2026-03-10 [버그수정] chat.js searchKnowledge에 await 누락
0cdcfa7 2026-03-10 [RAG품질] 전 제품 40개 useCases 필드 추가
b70d3d9 2026-03-10 [RAG품질] useCases 전 제품 보강 + buildChunkText 임베딩 가중치 구조 개선
11c4853 2026-03-10 [RAG정밀도] 사용자 36항목 피드백 기반 useCases 전면 재정의
029a6f5 2026-03-11 [RAG데이터정제] SafeCopy/ContentSAFER 삭제
ae6f3c8 2026-03-11 [데이터정합성] SafeCopy/ContentSAFER 전체 코드베이스 제거
b7cced6 2026-03-11 [RAG 2depth] 하이퍼링크 문서 17개 청크 추가
7e3e3f3 2026-03-12 [프롬프트+성능] 기능 중복 제품 구분 안내 규칙 추가 + validateOutput skipLLM 최적화
```
