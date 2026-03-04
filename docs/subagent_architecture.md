# ANY 브릿지 서브에이전트 아키텍처

## 분석 기준

요구사항 문서를 기반으로 다음 기준으로 서브에이전트 필요성을 판단:
1. **독립적 실행 가능성**: 다른 작업과 병렬 실행 가능한가?
2. **복잡도**: 단일 작업으로 처리하기에 너무 복잡한가?
3. **재사용성**: 여러 곳에서 반복 사용되는가?
4. **도메인 분리**: 명확히 구분되는 기술 도메인인가?

---

## 권장 서브에이전트 구조: 5개

### 1. Frontend Agent (프론트엔드 전담)
**담당 요구사항**: R1, R11 (일부)
**작업 범위**:
- 가상 홈페이지 클론 (마크애니 메인 페이지 소스 다운로드 + 수정)
- 챗봇 UI 컴포넌트 구현 (자동 팝업, 대화창, 입력 필드)
- 모바일 반응형 레이아웃
- AI 사고 과정 패널 UI (접이식)
- 실시간 정보 패널 (고객 정보, 과거 이력, 신뢰도 표시)
- 담당자 입장 표시 UI (프로필 사진 + 역할)
- 진행 상황 표시 (1/4, 2/4, 3/4, 4/4)

**독립 실행 가능**: ✅ 백엔드와 병렬 작업 가능
**예상 시간**: 8시간
**기술 스택**: HTML/CSS/JavaScript, React (선택)

---

### 2. Backend Core Agent (백엔드 핵심 로직)
**담당 요구사항**: R2, R3 (일부), R4, R13, R19, R20, R22, R23
**작업 범위**:
- Vercel Serverless Functions 세팅
- 고객 매칭 로직 (Google Sheets API 연동)
- Gemini File Search 세팅 + Store 업로드
- Agentic 라우팅 (인텐트 분류)
- CHECK 시맨틱 분석 (질문 분해 + Self-Reflection)
- RA-RAG Lite (Pre/Post-Retrieval Reasoning)
- Take a Step Back Prompting
- Prompt Caching 적용
- 케이스 상태 관리 (Supabase 연동)
- 에러 핸들링 + DEMO_MODE

**독립 실행 가능**: ⚠️ 프론트엔드 API 인터페이스 정의 후 병렬 가능
**예상 시간**: 18시간
**기술 스택**: Node.js, Vercel Functions, Gemini API, Supabase

---

### 3. Slack Integration Agent (Slack 에스컬레이션 전담)
**담당 요구사항**: R4, R5, R12, R16, R17, R18
**작업 범위**:
- Slack Bolt 연동 (presalesapp_in_slack 포팅)
- 그룹 채널 자동 생성
- 담당자 초대 로직
- 가상봇 구현 (채소희_봇, 박우호_봇)
  - 자동 인사 메시지
  - 질문 분류 안내 메시지
  - 최종 정리 메시지
- 실시간 담당자 입장 감지 (Polling 5초)
- 단계별 진행 메시지 자동 발송
- 롤 자동 배정 (도메인 타입 → 담당자 매핑)
- AI 코파일럿 (Claude Sonnet 4)
  - 답변 초안 생성
  - Slack Block Kit UI
  - "이 답변 사용" 버튼
- 담당자 답변 전달 (Slack → 챗봇 UI)

**독립 실행 가능**: ✅ 백엔드 API 인터페이스 정의 후 병렬 가능
**예상 시간**: 14시간
**기술 스택**: Slack Bolt, Slack API, Claude Sonnet 4 API

---

### 4. AI Safety & Quality Agent (AI 안전성 + 품질 관리)
**담당 요구사항**: R9, R21, R24
**작업 범위**:
- 프롬프트 인젝션 차단 (듀얼 방어)
  - 서버사이드 정규식 필터
  - Gemini 시스템 프롬프트 방어
- Constitutional AI 적용 (Claude Sonnet 4)
  - 마크애니 안전 원칙 3개 정의
  - Dual-Model Safety Verification
- 환각 방지 (ConfRAG + CHECK)
  - 신뢰도 3단계 평가 (🟢🟡🔴)
  - Self-Consistency Checking (3가지 온도)
- 개인정보 필터링 (마스킹)
- 보안 로깅

**독립 실행 가능**: ⚠️ 백엔드 코어와 통합 필요 (미들웨어 형태)
**예상 시간**: 6시간
**기술 스택**: Gemini API, Claude Sonnet 4 API, 정규식

---

### 5. Data & Dashboard Agent (데이터 + 대시보드)
**담당 요구사항**: R8, R10 (일부)
**작업 범위**:
- 세일즈포스 MCP 데이터 조회
  - 연간 고객 문의 건수
  - 평균 첫 응답 시간
  - 제품별 문의 분포
- 가상 케이스 데이터 500건 생성 (Claude Sonnet 4)
  - 고객사 분포 (SK하이닉스 150건, 국방부 100건 등)
  - 제품 분포 (DRM 200건, Document SAFER 150건 등)
  - 케이스 상태 (AI해결 300건, 에스컬레이션 150건 등)
- Supabase bulk insert
- 대시보드 구현
  - 1차 해결률 (60%)
  - 평균 응답 시간 (AI 25초, 담당자 포함 18분)
  - 고객 만족도 (4.2/5.0)
  - 제품별 문의 분포 차트
  - Before/After 비교 패널
- Google Sheets API 연동 (선택)

**독립 실행 가능**: ✅ 완전 독립 실행 가능
**예상 시간**: 9시간
**기술 스택**: Salesforce MCP, Claude Sonnet 4 API, Supabase, Chart.js

---

## 서브에이전트 실행 순서

### Phase 1: 병렬 실행 (Week 1, 12시간)
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Frontend Agent  │  │ Backend Core    │  │ Data & Dashboard│
│ (8h)            │  │ Agent (6h)      │  │ Agent (4h)      │
│                 │  │                 │  │                 │
│ - 홈페이지 클론  │  │ - Gemini Setup  │  │ - 세일즈포스 조회│
│ - 챗봇 UI       │  │ - File Search   │  │ - 가상 데이터    │
│ - 반응형        │  │ - RAG 연동      │  │   500건 생성    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Phase 2: 통합 + 병렬 실행 (Week 2, 33시간)
```
┌─────────────────────────────────────────────────────────┐
│ Backend Core Agent (계속, 12h)                           │
│ - CHECK 분해 + Self-Reflection                          │
│ - RA-RAG Lite + Take a Step Back                        │
│ - 케이스 상태 관리 + 에러 핸들링                          │
└─────────────────────────────────────────────────────────┘
         ↓ API 인터페이스 정의 완료 후
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Slack           │  │ AI Safety &     │  │ Data & Dashboard│
│ Integration     │  │ Quality Agent   │  │ Agent (계속, 5h)│
│ Agent (14h)     │  │ (6h)            │  │                 │
│                 │  │                 │  │ - 대시보드 구현  │
│ - Slack 연동    │  │ - 인젝션 차단   │  │ - Supabase 연동 │
│ - 가상봇 2개    │  │ - Constitutional│  │ - 차트 시각화   │
│ - 실시간 입장   │  │   AI            │  │                 │
│ - AI 코파일럿   │  │ - Self-Consist. │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Phase 3: 통합 + 폴리싱 (Week 3, 12시간)
```
┌─────────────────────────────────────────────────────────┐
│ 전체 통합 테스트 + 폴리싱 (모든 에이전트 협업)            │
│ - API 인터페이스 통합                                    │
│ - 데모 시나리오 1, 2 리허설                              │
│ - 에러 핸들링 보완                                       │
│ - UI/UX 폴리싱                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 서브에이전트 간 인터페이스

### API 계약 (Contract)

**1. Frontend ↔ Backend Core**
```typescript
// 챗봇 메시지 전송
POST /api/chat
Request: { message: string, customerId?: string, sessionId: string }
Response: { 
  answer: string, 
  confidence: "high" | "medium" | "low",
  references: string[],
  thinkingProcess: string[],
  needsEscalation: boolean
}

// 케이스 상태 조회
GET /api/case/{caseId}
Response: { 
  status: "접수" | "AI응답중" | "AI해결" | "에스컬레이션" | "종료",
  timeline: Array<{ timestamp, event }>
}
```

**2. Backend Core ↔ Slack Integration**
```typescript
// 에스컬레이션 요청
POST /api/escalate
Request: { 
  caseId: string, 
  question: string, 
  subQuestions: Array<{ text, role }>,
  customerInfo: object
}
Response: { 
  channelId: string, 
  channelUrl: string 
}

// 담당자 입장 상태 조회 (Polling)
GET /api/escalate/{channelId}/members
Response: { 
  members: Array<{ name, role, joinedAt }>,
  progress: "1/4" | "2/4" | "3/4" | "4/4"
}
```

**3. Backend Core ↔ AI Safety**
```typescript
// 안전성 검증 (미들웨어)
POST /api/safety/verify
Request: { input: string, output: string }
Response: { 
  safe: boolean, 
  reason?: string,
  confidence: number
}
```

**4. Backend Core ↔ Data & Dashboard**
```typescript
// 케이스 기록
POST /api/cases
Request: { caseData: object }

// 대시보드 데이터 조회
GET /api/dashboard/metrics
Response: { 
  firstResolutionRate: number,
  avgResponseTime: number,
  satisfaction: number,
  productDistribution: object
}
```

---

## 대안: 최소 서브에이전트 구조 (3개)

시간이 부족하거나 팀 규모가 작다면:

### 1. Frontend Agent (8h)
- 프론트엔드 전체

### 2. Backend + Slack Agent (24h)
- 백엔드 코어 + Slack 통합 + AI 안전성 통합

### 3. Data Agent (9h)
- 데이터 생성 + 대시보드

---

## 권장 사항

### ✅ 5개 서브에이전트 구조 추천 이유:
1. **명확한 책임 분리**: 각 에이전트가 독립적인 도메인 담당
2. **병렬 실행 최적화**: Week 1에 3개 동시 실행 가능
3. **재사용성**: Slack Integration Agent는 향후 다른 프로젝트에도 활용 가능
4. **디버깅 용이**: 문제 발생 시 해당 에이전트만 수정
5. **팀 협업**: 5명 팀이라면 각자 1개씩 담당 가능

### ⚠️ 주의사항:
1. **API 인터페이스 먼저 정의**: Week 1 초반에 모든 에이전트 간 계약 확정
2. **Mock 데이터 준비**: 각 에이전트가 독립 테스트 가능하도록
3. **통합 테스트 시간 확보**: Week 3에 최소 4시간 이상
4. **에이전트 간 의존성 최소화**: 순환 참조 방지

---

## 실행 계획

### Week 1 (12h)
- **Day 1-2**: API 인터페이스 정의 회의 (2h) + 3개 에이전트 병렬 시작
- **Day 3-4**: Frontend Agent 완료 (8h)
- **Day 5**: Backend Core Agent 기본 완료 (6h), Data Agent 데이터 생성 완료 (4h)

### Week 2 (33h)
- **Day 1-2**: Backend Core Agent 고급 기능 (12h)
- **Day 3-4**: Slack Integration Agent (14h) + AI Safety Agent (6h) 병렬
- **Day 5**: Data Agent 대시보드 완료 (5h)

### Week 3 (12h)
- **Day 1-2**: 전체 통합 테스트 (8h)
- **Day 3**: 폴리싱 + 데모 리허설 (4h)

---

## 결론

**권장: 5개 서브에이전트**
- Frontend Agent
- Backend Core Agent
- Slack Integration Agent
- AI Safety & Quality Agent
- Data & Dashboard Agent

**최소: 3개 서브에이전트** (시간 부족 시)
- Frontend Agent
- Backend + Slack Agent
- Data Agent

**핵심**: API 인터페이스를 먼저 확정하고, 병렬 실행을 최대화하는 것이 성공의 열쇠입니다.
