# Frontend → Backend 핸드오프 문서

## 개요

Frontend Agent가 완료되었습니다. 이 문서는 Backend Core Agent 팀이 작업을 시작하는 데 필요한 모든 정보를 제공합니다.

## 완료된 작업

### ✅ Frontend 구현 완료
- 마크애니 가상 홈페이지
- AI 챗봇 UI (자동 팝업, 최소화/펼치기)
- 고객 매칭 UI
- AI 사고 과정 패널
- 실시간 정보 패널
- 담당자 입장 표시
- 2개 데모 시나리오 (SK하이닉스, 국방부)
- Mock 데이터로 전체 플로우 시연 가능
- 반응형 디자인
- Vercel 배포 준비

### 📁 프로젝트 위치
```
hackerton/frontend/
```

### 🚀 실행 방법
```bash
cd hackerton/frontend
npm install
npm run dev
```

## Backend 팀이 구현해야 할 API

### 우선순위 1 (필수, Week 2 초반)

#### 1. POST /api/chat
**목적**: AI 답변 생성
**구현 내용**:
- Gemini 2.5 Pro File Search 연동
- Agentic 라우팅 (인텐트 분류)
- CHECK 시맨틱 분석 (복합 질문 분해)
- 신뢰도 평가
- 참조 문서 추출

**Frontend 연동 포인트**:
- `src/components/Chatbot.jsx` - `handleAIResponse()` 함수
- 현재 Mock 데이터로 시뮬레이션 중
- API 연동 시 `fetch('/api/chat', ...)` 호출로 교체

#### 2. POST /api/customer/match
**목적**: 고객 정보 조회
**구현 내용**:
- 유지보수 현황 시트 조회
- 퍼지 매칭 (하이닉스 → SK하이닉스)
- 고객 정보 반환 (제품, 버전, 담당자, 과거 이력)

**Frontend 연동 포인트**:
- `src/components/Chatbot.jsx` - `handleSend()` 함수
- 고객명 감지 시 API 호출

### 우선순위 2 (중요, Week 2 중반)

#### 3. POST /api/escalate
**목적**: Slack 에스컬레이션
**구현 내용**:
- Slack 채널 생성
- 담당자 초대
- 가상봇 (채소희, 박우호) 자동 입장
- 질문 분해 후 롤 자동 배정

**Frontend 연동 포인트**:
- `src/components/Chatbot.jsx` - `handleEscalation()` 함수
- "담당자 연결하기" 버튼 클릭 시 호출

#### 4. GET /api/escalate/{channelId}/members
**목적**: 담당자 입장 상태 조회
**구현 내용**:
- Slack 채널 멤버 조회
- 입장 시각 추적
- 진행 상황 계산 (2/4)

**Frontend 연동 포인트**:
- `src/components/Chatbot.jsx` - 폴링 방식 (2초 간격)
- `src/components/AgentStatus.jsx` - 상태 표시

### 우선순위 3 (선택, Week 2 후반)

#### 5. GET /api/dashboard/stats
**목적**: 대시보드 KPI 데이터
**구현 내용**:
- Supabase에서 가상 데이터 500건 조회
- 1차 해결률, 평균 응답 시간, 만족도 계산
- 제품별 분포, 월별 추이

## API 인터페이스 명세

상세 명세는 `hackerton/frontend/API_INTERFACE.md` 참조

### 요약

```typescript
// 1. 챗봇 메시지
POST /api/chat
Request: { message, customerId, sessionId, conversationHistory }
Response: { answer, confidence, references, thinkingProcess, needsEscalation, subQuestions }

// 2. 고객 매칭
POST /api/customer/match
Request: { customerName }
Response: { matched, customerInfo }

// 3. 에스컬레이션
POST /api/escalate
Request: { caseId, customerId, question, subQuestions }
Response: { channelId, channelUrl, agents }

// 4. 담당자 상태
GET /api/escalate/{channelId}/members
Response: { members, progress, totalMembers, joinedMembers }

// 5. 대시보드
GET /api/dashboard/stats
Response: { totalCases, aiResolvedCases, firstResolutionRate, ... }
```

## Frontend 코드 구조

### 주요 컴포넌트

```
src/components/
├── Homepage.jsx          # 홈페이지 (독립적, API 불필요)
├── Chatbot.jsx            # 챗봇 메인 (API 연동 필요)
├── ThinkingPanel.jsx      # AI 사고 과정 (props로 데이터 받음)
├── InfoPanel.jsx          # 정보 패널 (props로 데이터 받음)
└── AgentStatus.jsx        # 담당자 상태 (props로 데이터 받음)
```

### API 연동이 필요한 함수

#### Chatbot.jsx
```javascript
// 1. 고객 매칭
const handleSend = async () => {
  // TODO: API 연동
  // const response = await fetch('/api/customer/match', ...)
}

// 2. AI 응답
const handleAIResponse = async (question) => {
  // TODO: API 연동
  // const response = await fetch('/api/chat', ...)
}

// 3. 에스컬레이션
const handleEscalation = () => {
  // TODO: API 연동
  // const response = await fetch('/api/escalate', ...)
  
  // TODO: 폴링 시작
  // const pollInterval = setInterval(async () => {
  //   const status = await fetch(`/api/escalate/${channelId}/members`)
  // }, 2000)
}
```

## Mock 데이터 구조

현재 Frontend는 `src/data/mockData.js`의 Mock 데이터로 동작합니다.

### mockScenarios 구조
```javascript
{
  skhynix: {
    customerInfo: { name, product, version, license, history, aiInsight, references },
    responses: [ ... ]
  },
  defense: {
    customerInfo: { ... },
    responses: [ ... ]
  }
}
```

### Backend API 응답 형식
Backend API는 이 Mock 데이터 구조와 동일한 형식으로 응답해야 합니다.

## 환경 변수

### Frontend (.env)
```env
# Development
VITE_API_URL=http://localhost:5000/api

# Production
VITE_API_URL=https://anybridge-api.vercel.app/api
```

### Backend (.env)
```env
# Gemini API
GEMINI_API_KEY=your_gemini_api_key
GEMINI_FILE_SEARCH_STORE_ID=store_drm

# Slack
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...

# Supabase
SUPABASE_URL=https://...
SUPABASE_KEY=...

# Google Sheets
GOOGLE_SHEETS_API_KEY=...
MAINTENANCE_SHEET_ID=...
```

## 통합 테스트 시나리오

### 시나리오 1: SK하이닉스 (AI 자동 해결)
1. Frontend: "SK하이닉스" 입력
2. Backend: `/api/customer/match` 호출 → 고객 정보 반환
3. Frontend: 정보 패널 표시
4. Frontend: "Document SAFER를 v3.2로 업그레이드하면 성능이 개선되나요?" 입력
5. Backend: `/api/chat` 호출 → AI 답변 생성
6. Frontend: AI 사고 과정 + 답변 표시

### 시나리오 2: 국방부 (에스컬레이션)
1. Frontend: "국방부" 입력
2. Backend: `/api/customer/match` 호출
3. Frontend: 복합 질문 입력
4. Backend: `/api/chat` 호출 → 복합 질문 분해 + needsEscalation: true
5. Frontend: "담당자 연결하기" 버튼 표시
6. Frontend: 버튼 클릭
7. Backend: `/api/escalate` 호출 → Slack 채널 생성
8. Frontend: 폴링 시작 (2초 간격)
9. Backend: `/api/escalate/{channelId}/members` 호출 → 담당자 상태 반환
10. Frontend: 담당자 입장 표시 (순차 애니메이션)

## 배포 전략

### Frontend (Vercel)
```bash
cd hackerton/frontend
vercel --prod
```

### Backend (Vercel Serverless Functions)
```bash
cd hackerton/backend
vercel --prod
```

### 환경 변수 설정
```bash
# Frontend
vercel env add VITE_API_URL

# Backend
vercel env add GEMINI_API_KEY
vercel env add SLACK_BOT_TOKEN
vercel env add SUPABASE_URL
```

## CORS 설정

Backend에서 CORS 허용 필요:

```javascript
// Vercel Serverless Function
export default async function handler(req, res) {
  // CORS 헤더
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  // API 로직
  // ...
}
```

## 에러 처리

Frontend는 다음과 같이 에러를 처리합니다:

```javascript
try {
  const response = await fetch('/api/chat', ...)
  const data = await response.json()
  
  if (!data.success) {
    // 에러 메시지 표시
    setMessages(prev => [...prev, {
      type: 'ai',
      text: '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      timestamp: new Date()
    }])
  }
} catch (error) {
  // 네트워크 에러
  setMessages(prev => [...prev, {
    type: 'ai',
    text: '네트워크 연결을 확인해 주세요.',
    timestamp: new Date()
  }])
}
```

Backend는 항상 다음 형식으로 응답해야 합니다:

```javascript
// 성공
{ success: true, data: { ... } }

// 실패
{ success: false, error: { code: 'ERROR_CODE', message: '에러 메시지' } }
```

## 다음 단계

### Week 2 초반 (Backend Core Agent)
1. ✅ Frontend 완료
2. ⏳ Gemini File Search 세팅
3. ⏳ `/api/chat` 구현
4. ⏳ `/api/customer/match` 구현
5. ⏳ Frontend-Backend 통합 테스트

### Week 2 중반 (Slack Integration Agent)
1. ⏳ `/api/escalate` 구현
2. ⏳ `/api/escalate/{channelId}/members` 구현
3. ⏳ 가상봇 구현 (채소희, 박우호)
4. ⏳ 통합 테스트

### Week 2 후반 (Data & Dashboard Agent)
1. ⏳ 가상 데이터 500건 생성
2. ⏳ `/api/dashboard/stats` 구현
3. ⏳ 대시보드 UI 구현 (별도 페이지)

## 문의 및 지원

### Frontend 관련 문의
- 코드 위치: `hackerton/frontend/`
- 문서: `README.md`, `API_INTERFACE.md`, `QUICKSTART.md`

### Backend 관련 문의
- 구현 계획: `hackerton/docs/implementation_plan.md`
- 요구사항: `.kiro/specs/anybridge-hackathon/requirements.md`

## 체크리스트

### Backend 팀 시작 전 확인사항
- [ ] Frontend 프로젝트 실행 확인 (`npm run dev`)
- [ ] 2개 데모 시나리오 테스트
- [ ] API 인터페이스 명세 검토
- [ ] Mock 데이터 구조 이해
- [ ] 환경 변수 준비
- [ ] Gemini API 키 발급
- [ ] Slack 워크스페이스 설정
- [ ] Supabase 프로젝트 생성

### 통합 준비 체크리스트
- [ ] CORS 설정
- [ ] 에러 처리 표준화
- [ ] 환경 변수 설정
- [ ] API 응답 형식 통일
- [ ] 로깅 설정

---

**Frontend Agent 작업 완료!** 🎉

Backend Core Agent 팀, 화이팅! 💪
