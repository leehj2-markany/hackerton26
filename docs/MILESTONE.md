# ANY 브릿지 해커톤 마일스톤

> 마크애니 AI 해커톤 2026 (2/27 ~ 3/15)
> 팀: ES사업부 제품개발팀 | 프로젝트: ANY 브릿지 (AI 프리세일즈 어시스턴트)

---

## Phase 0: 기획 & 설계 (2/27)
- [x] 해커톤 요구사항 분석 및 아키텍처 설계
- [x] 5개 서브에이전트 구조 확정
- [x] API 인터페이스 계약(Contract) 정의
- [x] 기술 스택 확정: React+Vite+Tailwind / Vercel Serverless / Supabase / Gemini+Claude

## Phase 1: 프론트엔드 구현 (2/27)
- [x] 마크애니 가상 홈페이지 클론 (Homepage.jsx)
- [x] 챗봇 UI 구현 — 자동 팝업, 대화창, 입력 필드 (Chatbot.jsx)
- [x] AI 사고 과정 패널 (ThinkingPanel.jsx) — 접이식, 자동 확장
- [x] 실시간 정보 패널 (InfoPanel.jsx) — 고객 정보, 과거 이력, 신뢰도
- [x] 담당자 입장 표시 UI (AgentStatus.jsx) — 프로필 + 역할 + 진행률
- [x] 대시보드 (Dashboard.jsx) — KPI 카드, Before/After 비교
- [x] UX 전문가 크로스 리뷰 완료 (88% 완성도)
- [x] 즉시 수정 3건 적용 (ThinkingPanel 자동확장, onKeyDown, unused imports)

## Phase 2: 백엔드 코어 구현 (2/27~2/28)
- [x] Vercel Serverless Functions 7개 엔드포인트 구현
  - POST /api/chat — Gemini RAG + CHECK 시맨틱 분석
  - POST /api/customer/match — 퍼지 고객 매칭
  - POST /api/escalate — 에스컬레이션 생성
  - GET /api/escalate/{channelId}/members — 담당자 입장 폴링
  - GET /api/case/{caseId} — 케이스 타임라인
  - GET /api/dashboard/stats — 대시보드 KPI
  - GET /api/health — 서비스 상태
- [x] 로컬 개발 서버 (server.js) — Pure Node.js
- [x] DEMO_MODE 지원 (mock 데이터 / 실제 API 전환)
- [x] 7/7 API 테스트 통과

## Phase 3: API 키 & MCP 연결 (2/28)
- [x] Gemini API 연결 (gemini-2.5-flash + gemini-2.5-pro)
- [x] Claude API 연결 (claude-opus-4, claude-sonnet-4)
- [x] Supabase 연결 (PostgreSQL)
- [x] Slack Bot 연결 (애니브릿지 앱, xoxb 토큰)
- [x] Salesforce MCP 연결 (OAuth Connected App "anybridge", refresh_token 365일)
- [x] Jira MCP 연결
- [x] Confluence MCP 연결
- [x] Google Workspace MCP 연결
- [x] 3-Tier LLM 전략 구현
  - simple → Gemini 2.5 Flash (~4s)
  - complex → Gemini 2.5 Pro (~15s)
  - critical → Claude Opus 4 (~20s, 서브질문 2개+ 또는 긴급 키워드)

## Phase 4: 데이터 & 인프라 (2/28~)
- [x] Supabase DB 테이블 생성 (cases, conversations, escalations, dashboard_stats) ✅ 2/28
- [x] 인덱스 5개 생성 + 초기 대시보드 데이터 삽입 ✅ 2/28
- [x] 가상 케이스 데이터 500건 생성 (seed-data.js) ✅ 2/28
- [x] Supabase bulk insert (cases 500건 + escalations 120건 + dashboard_stats 8건) ✅ 2/28
- [ ] Salesforce 실데이터 조회 & 매핑

## Phase 5: Slack Integration (2/28~)
- [x] Slack 클라이언트 모듈 구현 (slackClient.js) ✅ 2/28
  - postMessage, postEscalationMessage (Block Kit)
  - simulateAgentJoin (순차 입장 시뮬레이션)
  - postAiCopilotSuggestion (AI 코파일럿 + 버튼)
  - postResolutionSummary (해결 요약)
  - findOrSimulateChannel (채널 생성 권한 없이 동작)
- [x] 에스컬레이션 API ↔ Slack 연동 통합 ✅ 2/28
- [x] 실시간 담당자 입장 감지 (인메모리 시뮬레이션 + 폴링) ✅ 2/28
- [ ] 단계별 진행 메시지 자동 발송

## Phase 6: AI Safety & Quality (2/28~)
- [x] AI Safety 미들웨어 구현 (safety.js) ✅ 2/28
  - sanitizeInput (듀얼 레이어 인젝션 방어, 32개 패턴)
  - maskPII (전화번호/이메일/주민번호/카드번호)
  - evaluateConfidence (3단계 신뢰도 평가)
  - constitutionalCheck (헌법적 AI 3원칙)
  - validateResponse (전체 파이프라인)
  - securityLog (보안 이벤트 로깅)
- [x] chat.js에 safety 미들웨어 통합 ✅ 2/28

## Phase 7: Frontend ↔ Backend 통합 (2/28)
- [x] Chatbot.jsx → 백엔드 API 연동 (sendMessage, matchCustomer, escalateCase) ✅ 2/28
- [x] VITE_USE_BACKEND=true 전환 ✅ 2/28
- [x] 3-Tier LLM 실시간 응답 확인 (Gemini Flash/Pro + Claude Opus 4) ✅ 2/28
- [x] AI Safety 파이프라인 통합 (입력 검증 + 출력 검증 + PII 마스킹) ✅ 2/28
- [x] 에스컬레이션 API 백그라운드 연동 (Slack 메시지 발송) ✅ 2/28
- [x] 프론트엔드 빌드 성공 (49 modules, 234KB gzip 75KB) ✅ 2/28
- [x] CORS 정상 동작 확인 ✅ 2/28
- [ ] 에러 핸들링 & 폴백 처리 (mock 데이터 자동 폴백 구현 완료)

## Phase 7.5: 통합 테스트 (2/28) ✅
- [x] GET /api/health — 전체 서비스 연결 확인 (gemini, claude, supabase, slack 모두 true)
- [x] POST /api/chat (단순 질문) — Gemini 2.5 Flash 응답, confidence: high, score: 86~90
- [x] POST /api/chat (복합 질문, 3 subQuestions) — Claude Opus 4 응답, confidence: high, score: 94
- [x] POST /api/customer/match — SK하이닉스 정확 매칭
- [x] POST /api/escalate — Slack 채널 연동, 4명 에이전트 초대
- [x] GET /api/dashboard/stats — Supabase 실데이터 (500건, 60% AI 해결률)
- [x] GET /api/escalate/{channelId}/members — 4/4 담당자 입장 확인
- [x] GET /api/case/{caseId} — 타임라인 7개 이벤트 정상

## Phase 8: Vercel 배포 (2/28) ✅
- [x] Vercel CLI 설치 + 로그인 ✅ 2/28
- [x] 프로젝트 구조 최적화 (api/_lib 패턴으로 Hobby 12 function 제한 해결) ✅ 2/28
- [x] 환경변수 7개 설정 (GEMINI, CLAUDE, SUPABASE, SLACK) ✅ 2/28
- [x] 프로덕션 배포 성공 ✅ 2/28
- [x] 프론트엔드 + 백엔드 API 동작 확인 ✅ 2/28
- 🔗 URL: https://hackerton-kappa.vercel.app

## Phase 9: 데모 & 발표 준비 (예정)
- [ ] 데모 시나리오 1: SK하이닉스 (AI 자동 해결)
- [ ] 데모 시나리오 2: 국방부 (에스컬레이션 + 협업)
- [ ] 발표 자료 작성
- [ ] 데모 영상 녹화

---

## 기술 하이라이트 (발표용)

| 기술 | 적용 내용 |
|------|-----------|
| 3-Tier LLM | Gemini Flash(속도 ~4s) → Pro(정확도 ~15s) → Claude Opus 4(최고성능 ~20s) 자동 라우팅 |
| CHECK 시맨틱 분석 | 복합 질문 자동 분해 + 서브질문별 담당자 배정 |
| RAG + Knowledge Base | 마크애니 제품 지식 기반 답변 생성 |
| AI Safety | 듀얼 레이어 인젝션 방어(32패턴) + PII 마스킹 + 헌법적 AI 3원칙 |
| MCP 7종 연동 | Salesforce, Slack, Jira, Confluence, Google Workspace, Gemini, Claude |
| Vercel Serverless | 서버리스 아키텍처로 무중단 배포 |
| Supabase | PostgreSQL 기반 실시간 케이스 관리 (500건 실데이터) |
| OAuth 2.0 | Salesforce Connected App 지속적 토큰 관리 (365일) |
| Graceful Degradation | API 실패 시 mock 데이터 자동 폴백 |
