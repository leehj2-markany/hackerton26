# ANY 브릿지 구현 계획 — 5개 서브에이전트

## 실행 순서

### 🎯 Phase 1: Frontend Agent (지금 시작)
**목표**: 가상 홈페이지 + 챗봇 UI 기본 구조
**예상 시간**: 8시간
**우선순위**: 1 (다른 에이전트가 API 개발하는 동안 UI 완성)

### 🔧 Phase 2: Backend Core Agent
**목표**: Gemini RAG + 라우팅 + CHECK
**예상 시간**: 18시간
**우선순위**: 2 (Frontend 완료 후 API 연동)

### 💬 Phase 3: Slack Integration Agent
**목표**: 에스컬레이션 + 가상봇 + AI 코파일럿
**예상 시간**: 14시간
**우선순위**: 3 (Backend Core 기본 완료 후)

### 🛡️ Phase 4: AI Safety & Quality Agent
**목표**: 안전성 검증 + Constitutional AI
**예상 시간**: 6시간
**우선순위**: 4 (Backend Core와 병렬 가능)

### 📊 Phase 5: Data & Dashboard Agent
**목표**: 가상 데이터 생성 + 대시보드
**예상 시간**: 9시간
**우선순위**: 5 (독립 실행 가능, 언제든 시작 가능)

---

## Frontend Agent 상세 작업 분할

### Task 1: 프로젝트 초기 세팅 (30분)
- [ ] hackerton/frontend 폴더 생성
- [ ] package.json 생성 (Vite + React)
- [ ] 기본 폴더 구조 생성
- [ ] Vercel 배포 설정

### Task 2: 마크애니 홈페이지 클론 (2시간)
- [ ] www.markany.com 메인 페이지 소스 다운로드
- [ ] HTML/CSS 정리 및 수정
- [ ] 불필요한 스크립트 제거
- [ ] 반응형 레이아웃 확인

### Task 3: 챗봇 UI 기본 구조 (2시간)
- [ ] 챗봇 위젯 컴포넌트 (우측 하단)
- [ ] 자동 팝업 로직
- [ ] 최소화/펼치기 기능
- [ ] 대화 메시지 리스트
- [ ] 입력 필드 + 전송 버튼

### Task 4: AI 사고 과정 패널 (1.5시간)
- [ ] 접이식 패널 컴포넌트
- [ ] 단계별 표시 로직
  - "🤔 질문 분석 중..."
  - "복합 질문 감지: N개 질문으로 나눔"
  - "논리 검증: ✅ 일관성 확인"
  - "정책기능서 검색 중... N건 발견"
- [ ] 애니메이션 효과 (순차 표시)

### Task 5: 실시간 정보 패널 (1.5시간)
- [ ] 우측 30% 패널 레이아웃
- [ ] 고객 정보 표시 영역
- [ ] 과거 이력 표시 영역
- [ ] AI 분석 인사이트 영역
- [ ] 신뢰도 배지 (🟢🟡🔴)
- [ ] 참조 문서 링크

### Task 6: 담당자 입장 표시 UI (1시간)
- [ ] 담당자 카드 컴포넌트
- [ ] 프로필 사진 + 역할 표시
- [ ] 진행 상황 표시 (1/4, 2/4, 3/4, 4/4)
- [ ] 입장 애니메이션

### Task 7: Mock 데이터 + 통합 테스트 (30분)
- [ ] Mock API 응답 데이터
- [ ] 전체 플로우 테스트
- [ ] 모바일 반응형 테스트

---

## API 인터페이스 정의 (Frontend ↔ Backend)

```typescript
// 1. 챗봇 메시지 전송
POST /api/chat
Request: {
  message: string
  customerId?: string
  sessionId: string
}
Response: {
  answer: string
  confidence: "high" | "medium" | "low"
  references: string[]
  thinkingProcess: string[]
  needsEscalation: boolean
}

// 2. 고객 매칭
POST /api/customer/match
Request: {
  customerName: string
}
Response: {
  matched: boolean
  customerInfo?: {
    name: string
    product: string
    salesManager: string
    engineer: string
  }
}

// 3. 에스컬레이션 요청
POST /api/escalate
Request: {
  caseId: string
  question: string
  subQuestions: Array<{ text: string, role: string }>
}
Response: {
  channelId: string
  channelUrl: string
}

// 4. 담당자 입장 상태 조회 (Polling)
GET /api/escalate/{channelId}/members
Response: {
  members: Array<{
    name: string
    role: string
    joinedAt: string
  }>
  progress: string // "1/4", "2/4", "3/4", "4/4"
}

// 5. 케이스 상태 조회
GET /api/case/{caseId}
Response: {
  status: string
  timeline: Array<{
    timestamp: string
    event: string
  }>
}
```

---

## 다음 단계

1. ✅ Frontend Agent 실행 (지금)
2. ⏳ Backend Core Agent 준비 (API 인터페이스 구현)
3. ⏳ Slack Integration Agent 준비
4. ⏳ AI Safety Agent 준비
5. ⏳ Data & Dashboard Agent 준비

**Frontend Agent 실행을 시작하겠습니다!**
