# ANY 브릿지 프로젝트 전체 리뷰

> 리뷰 일자: 2026-03-12
> 리뷰어: Kiro AI
> 목적: 해커톤 프로젝트 전체 아키텍처/코드 품질 리뷰 — 향후 개선 참고용

---

## 1. 아키텍처 개요

- Vercel Serverless API (`api/`) + React Vite 프론트엔드 (`frontend/`)
- Supabase pgvector 시맨틱 검색 + in-memory STORES fallback
- 3-Tier LLM: Gemini Flash (기본) / Gemini Pro (미사용) / Claude Opus 4 (critical)
- Slack 연동: 에스컬레이션 시 채널 자동 생성 → 실시간 폴링
- Dual API Directory: `api/_lib/` ↔ `backend/api/lib/` 동기화 필수

---

## 2. 잘 설계된 부분 (강점)

### 2-1. LLM 라우팅
- LLM-as-Router로 복잡도 판단을 하드코딩 대신 자연어에 위임
- DESV 파이프라인 (Decompose → Enrich → Synthesize → Verify)이 복합질문을 체계적으로 처리
- Router 1회 호출로 복잡도 판단 + 고객 조건 추출 동시 수행 (추가 API 비용 0)

### 2-2. RAG 검색
- pgvector 시맨틱 검색 → 키워드 fallback 이중 안전망
- dedupByProduct로 같은 제품이 top 결과 독점 방지
- rerankResults로 제목/바이그램/키워드 밀도 기반 재랭킹

### 2-3. 안전성
- 프롬프트 인젝션 방어 (한/영 듀얼 레이어, 20+ 패턴)
- PII 마스킹 (전화번호, 이메일, 주민번호, 카드번호)
- Constitutional AI 검증 (regex + 선택적 LLM)
- 입력 길이 제한 (1000자)

### 2-4. 에스컬레이션 흐름
- 가상 에이전트(박우호) LLM 즉시 응답 + 실제 담당자 Slack 폴링 병렬 처리
- 채널 자동 생성 (`esc-{고객}-{제품}-{MMDD}-{HHmm}`)
- 세션 종료 시 채널 보관 + DM 발송 + LLM 요약

### 2-5. 성능 최적화
- 프롬프트 캐시 (LRU 100개, 30분 TTL)
- simple 질문은 selfReflect 스킵 (Flash 1회 호출 절약)
- simple 질문은 validateOutput에서 LLM 스킵 (regex-only)
- analyzeQuestion 결과를 preAnalysis로 전달하여 2중 호출 방지

### 2-6. Dual API 동기화
- 리뷰 시점 기준 7개 파일 모두 완벽 동기화 (diff 없음)

---

## 3. 개선 가능한 포인트

### 3-1. [코드 일관성] searchKnowledge async/sync 혼재
- **파일**: `api/_lib/knowledgeBase.js`
- **현상**: `searchKnowledge`가 async인데 fallback 경로(`searchKnowledgeFallback`)는 sync
- **영향**: `await`가 불필요하다는 TS 힌트 발생. 동작에는 문제 없음
- **제안**: `searchKnowledgeFallback`도 async로 통일하거나, 반환값을 `Promise.resolve()`로 래핑

### 3-2. [런타임 에러 가능성] setSlackPollSince 미정의
- **파일**: `frontend/src/components/Chatbot.jsx`
- **현상**: `handleFollowUpQuestion`에서 `setSlackPollSince(pollStartTs)` 호출하지만, state가 `slackPollSinceRef` (useRef)로 변경됨
- **영향**: `setSlackPollSince`가 정의되지 않아 런타임 에러 가능
- **제안**: `slackPollSinceRef.current = pollStartTs`로 수정

### 3-3. [불필요한 LLM 호출] session/close 요약 생성
- **파일**: `api/session/close.js`
- **현상**: `generateAnswer`를 요약용으로 호출하는데, skipRAG만 전달 → Router 분석(analyzeQuestion)까지 실행됨
- **영향**: 불필요한 LLM 호출 1회 (Flash Router) 낭비
- **제안**: 요약 전용 경량 함수 분리 또는 `skipAnalysis` 옵션 추가

### 3-4. [데이터 정합성] dashboard satisfaction distribution 하드코딩
- **파일**: `api/dashboard/stats.js`
- **현상**: Supabase에서 stats를 가져와도 `customerSatisfaction.distribution`은 항상 하드코딩 값 반환
- **영향**: 대시보드 만족도 분포가 실제 데이터를 반영하지 않음
- **제안**: Supabase에 satisfaction 테이블 추가하거나, stats 테이블에 distribution 컬럼 추가

### 3-5. [보안] CORS origin fallback
- **파일**: `api/_lib/cors.js`
- **현상**: origin이 허용 목록에 없으면 프로덕션 URL(`hackerton-kappa.vercel.app`)을 기본값으로 설정
- **영향**: 허용되지 않은 origin에서도 프로덕션 CORS 헤더가 반환됨
- **제안**: 허용 목록에 없으면 CORS 헤더를 설정하지 않거나, 403 반환

### 3-6. [UX] 인사 메시지 판단 로직 한계
- **파일**: `api/chat.js`
- **현상**: `isGreetingMessage`가 15자 이하 + 패턴 매칭으로 판단
- **영향**: "안녕하세요 DRM 문의드립니다" (15자 초과)는 인사로 안 잡히지만, "네 연결해주세요"는 에스컬레이션 의도 단어로 정상 처리됨. 대체로 잘 동작하나 엣지케이스 존재
- **제안**: 현재 수준으로 충분하나, 향후 LLM 판단으로 전환 고려

### 3-7. [확장성] 고객 데이터 하드코딩
- **파일**: `api/_lib/mockData.js`
- **현상**: SK하이닉스, 국방부 2개 고객만 하드코딩
- **영향**: 해커톤 데모용으로는 충분하나, 실제 운영 시 Supabase/CRM 연동 필요
- **제안**: Supabase `customers` 테이블로 마이그레이션

### 3-8. [성능] Chatbot.jsx 파일 크기
- **파일**: `frontend/src/components/Chatbot.jsx` (1300+ lines)
- **현상**: 하나의 컴포넌트에 intake form, 메시지 렌더링, 에스컬레이션 로직, 폴링 등 모든 기능이 집중
- **영향**: 유지보수 어려움, 코드 리뷰 부담
- **제안**: 커스텀 훅 분리 (`useSlackPolling`, `useEscalation`, `useAIChat`)

---

## 4. Dual API 동기화 상태 (2026-03-12 기준)

| 파일 | `api/_lib/` | `backend/api/lib/` | 동기화 |
|------|-------------|---------------------|--------|
| config.js | ✅ | ✅ | ✅ 일치 |
| cors.js | ✅ | ✅ | ✅ 일치 |
| geminiClient.js | ✅ | ✅ | ✅ 일치 |
| knowledgeBase.js | ✅ | ✅ | ✅ 일치 |
| mockData.js | ✅ | ✅ | ✅ 일치 |
| safety.js | ✅ | ✅ | ✅ 일치 |
| slackClient.js | ✅ | ✅ | ✅ 일치 |

---

## 5. 기술 스택 요약

| 영역 | 기술 |
|------|------|
| Frontend | React 18, React Router 7, Tailwind CSS 3, Vite 5 |
| Backend | Node.js (ES modules), Vercel Serverless |
| LLM | Gemini 2.5 Flash/Pro, Claude Opus 4 |
| Vector DB | Supabase pgvector + Gemini Embedding 001 |
| 메시징 | Slack API (채널 생성, 메시지, 폴링) |
| 안전성 | Prompt Injection 방어, PII 마스킹, Constitutional AI |
