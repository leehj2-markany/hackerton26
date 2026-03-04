# API 인터페이스 명세서

Frontend ↔ Backend 연동을 위한 API 인터페이스 정의

## Base URL

```
Development: http://localhost:5000/api
Production: https://anybridge.vercel.app/api
```

## 인증

현재 MVP에서는 인증 없음. 향후 JWT 토큰 기반 인증 추가 예정.

---

## 1. 챗봇 메시지 전송

고객이 챗봇에 메시지를 입력하면 AI가 답변을 생성합니다.

### Endpoint
```
POST /api/chat
```

### Request Headers
```json
{
  "Content-Type": "application/json"
}
```

### Request Body
```json
{
  "message": "Document SAFER를 v3.2로 업그레이드하면 성능이 개선되나요?",
  "customerId": "skhynix",
  "sessionId": "session_123456",
  "conversationHistory": [
    {
      "role": "user",
      "content": "SK하이닉스"
    },
    {
      "role": "assistant",
      "content": "감사합니다. SK하이닉스님의 정보를 확인했습니다 ✅"
    }
  ]
}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "answer": "Document SAFER v3.2에서 대량 파일 처리 속도가 30% 개선되었습니다...",
    "confidence": "high",
    "confidenceScore": 92,
    "references": [
      "릴리스 노트 v3.2",
      "과거 문의 #2025-02-10"
    ],
    "thinkingProcess": [
      "🤔 질문 분석 중...",
      "제품 분류: Document SAFER",
      "정책기능서 검색 중... 2건 발견",
      "신뢰도 평가: 🟢 높음",
      "답변 생성 중..."
    ],
    "needsEscalation": false,
    "isComplex": false,
    "subQuestions": null
  }
}
```

### Response (복합 질문)
```json
{
  "success": true,
  "data": {
    "answer": "네, 국방부 맞춤형 DRM 구축이 가능합니다...",
    "confidence": "high",
    "confidenceScore": 85,
    "references": [
      "정책기능서 v3.2",
      "CC인증서",
      "GS인증서"
    ],
    "thinkingProcess": [
      "🤔 질문 분석 중...",
      "복합 질문 감지: 3개 질문으로 나눠서 답변합니다",
      "질문 1: 국방부 맞춤형 DRM 구축 가능성",
      "질문 2: 윈도우 11 호환성",
      "질문 3: 보안 인증 요구사항",
      "논리 검증: ✅ 일관성 확인",
      "정책기능서 검색 중... 3건 발견",
      "신뢰도 평가: 🟢 높음",
      "답변 생성 중..."
    ],
    "needsEscalation": true,
    "isComplex": true,
    "subQuestions": [
      {
        "question": "국방부 맞춤형 DRM 구축 가능성",
        "role": "sales",
        "assignee": "송인찬"
      },
      {
        "question": "윈도우 11 호환성",
        "role": "se",
        "assignee": "이현진"
      },
      {
        "question": "보안 인증 요구사항",
        "role": "dev",
        "assignee": "박우호"
      }
    ]
  }
}
```

### Error Response (400 Bad Request)
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "메시지가 비어있습니다."
  }
}
```

### Error Response (500 Internal Server Error)
```json
{
  "success": false,
  "error": {
    "code": "AI_ERROR",
    "message": "AI 응답 생성 중 오류가 발생했습니다."
  }
}
```

---

## 2. 고객 매칭

고객명을 입력하면 유지보수 현황 시트에서 고객 정보를 조회합니다.

### Endpoint
```
POST /api/customer/match
```

### Request Body
```json
{
  "customerName": "SK하이닉스"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "matched": true,
    "customerInfo": {
      "id": "skhynix",
      "name": "SK하이닉스",
      "product": "Document SAFER",
      "version": "v3.1",
      "license": "1,000 User",
      "deploymentDate": "2024-03-15",
      "salesManager": "송인찬",
      "engineer": "이현진",
      "supportContact": "채소희",
      "history": [
        {
          "date": "2025-02-10",
          "question": "윈도우 11 호환성 문의",
          "status": "resolved"
        },
        {
          "date": "2025-01-25",
          "question": "PDF 암호화 오류 해결",
          "status": "resolved"
        },
        {
          "date": "2025-01-15",
          "question": "대량 파일 처리 속도 개선 요청",
          "status": "resolved"
        }
      ],
      "aiInsight": "이 고객은 성능 최적화와 윈도우 11 호환성에 관심이 높습니다.",
      "references": [
        "릴리스 노트 v3.2",
        "과거 문의 #2025-02-10",
        "성능 최적화 가이드"
      ]
    }
  }
}
```

### Response (매칭 실패)
```json
{
  "success": true,
  "data": {
    "matched": false,
    "message": "등록되지 않은 고객입니다. 고객명을 다시 확인해 주세요."
  }
}
```

---

## 3. 에스컬레이션 요청

AI가 답변하기 어려운 질문을 담당자에게 연결합니다.

### Endpoint
```
POST /api/escalate
```

### Request Body
```json
{
  "caseId": "case_123456",
  "customerId": "defense",
  "question": "국방부 맞춤형 DRM 구축이 가능한가요? 윈도우 11 호환성과 보안 인증 요구사항도 알려주세요",
  "aiAnswer": "네, 국방부 맞춤형 DRM 구축이 가능합니다...",
  "subQuestions": [
    {
      "question": "국방부 맞춤형 DRM 구축 가능성",
      "role": "sales",
      "assignee": "송인찬"
    },
    {
      "question": "윈도우 11 호환성",
      "role": "se",
      "assignee": "이현진"
    },
    {
      "question": "보안 인증 요구사항",
      "role": "dev",
      "assignee": "박우호"
    }
  ],
  "conversationHistory": [...]
}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "channelId": "C123456789",
    "channelName": "#국방부-DRM-문의-20260227",
    "channelUrl": "https://markany.slack.com/archives/C123456789",
    "agents": [
      {
        "id": "U001",
        "name": "채소희",
        "role": "고객센터",
        "avatar": "👩‍💼",
        "status": "invited"
      },
      {
        "id": "U002",
        "name": "송인찬",
        "role": "어카운트 매니저",
        "avatar": "👨‍💼",
        "status": "invited"
      },
      {
        "id": "U003",
        "name": "이현진",
        "role": "SE",
        "avatar": "👨‍💻",
        "status": "invited"
      },
      {
        "id": "U004",
        "name": "박우호",
        "role": "개발리더",
        "avatar": "👨‍🔧",
        "status": "invited"
      }
    ]
  }
}
```

---

## 4. 담당자 입장 상태 조회

에스컬레이션 후 담당자들의 입장 상태를 실시간으로 조회합니다.

### Endpoint
```
GET /api/escalate/{channelId}/members
```

### Query Parameters
없음

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "channelId": "C123456789",
    "members": [
      {
        "id": "U001",
        "name": "채소희",
        "role": "고객센터",
        "avatar": "👩‍💼",
        "joined": true,
        "joinedAt": "2026-02-27T10:30:15Z"
      },
      {
        "id": "U002",
        "name": "송인찬",
        "role": "어카운트 매니저",
        "avatar": "👨‍💼",
        "joined": true,
        "joinedAt": "2026-02-27T10:30:17Z"
      },
      {
        "id": "U003",
        "name": "이현진",
        "role": "SE",
        "avatar": "👨‍💻",
        "joined": false,
        "joinedAt": null
      },
      {
        "id": "U004",
        "name": "박우호",
        "role": "개발리더",
        "avatar": "👨‍🔧",
        "joined": false,
        "joinedAt": null
      }
    ],
    "progress": "2/4",
    "totalMembers": 4,
    "joinedMembers": 2
  }
}
```

### Frontend 폴링 방식
```javascript
// 2초마다 상태 조회
const pollInterval = setInterval(async () => {
  const response = await fetch(`/api/escalate/${channelId}/members`)
  const data = await response.json()
  
  // 상태 업데이트
  updateAgentStatus(data.members)
  
  // 모두 입장하면 폴링 중지
  if (data.joinedMembers === data.totalMembers) {
    clearInterval(pollInterval)
  }
}, 2000)
```

---

## 5. 케이스 상태 조회

개별 케이스의 상태와 타임라인을 조회합니다.

### Endpoint
```
GET /api/case/{caseId}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "caseId": "case_123456",
    "customerId": "defense",
    "customerName": "국방부",
    "status": "escalated",
    "createdAt": "2026-02-27T10:30:00Z",
    "updatedAt": "2026-02-27T10:30:20Z",
    "timeline": [
      {
        "timestamp": "2026-02-27T10:30:00Z",
        "event": "case_created",
        "description": "케이스 생성"
      },
      {
        "timestamp": "2026-02-27T10:30:05Z",
        "event": "ai_response",
        "description": "AI 1차 답변 생성"
      },
      {
        "timestamp": "2026-02-27T10:30:10Z",
        "event": "escalation_requested",
        "description": "담당자 연결 요청"
      },
      {
        "timestamp": "2026-02-27T10:30:15Z",
        "event": "agent_joined",
        "description": "채소희 (고객센터) 입장"
      },
      {
        "timestamp": "2026-02-27T10:30:17Z",
        "event": "agent_joined",
        "description": "송인찬 (어카운트 매니저) 입장"
      }
    ]
  }
}
```

---

## 6. 대시보드 데이터 조회

대시보드에 표시할 KPI 데이터를 조회합니다.

### Endpoint
```
GET /api/dashboard/stats
```

### Query Parameters
- `period` (optional): `day` | `week` | `month` | `all` (default: `all`)

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "period": "all",
    "totalCases": 500,
    "aiResolvedCases": 300,
    "escalatedCases": 150,
    "inProgressCases": 50,
    "firstResolutionRate": 60.0,
    "averageResponseTime": {
      "ai": 25,
      "withAgent": 1080
    },
    "customerSatisfaction": {
      "average": 4.2,
      "total": 450,
      "distribution": {
        "5": 200,
        "4": 180,
        "3": 50,
        "2": 15,
        "1": 5
      }
    },
    "productDistribution": [
      { "product": "DRM", "count": 200 },
      { "product": "Document SAFER", "count": 150 },
      { "product": "SafeCopy", "count": 80 },
      { "product": "기타", "count": 70 }
    ],
    "monthlyTrend": [
      { "month": "2024-12", "cases": 150, "aiResolved": 90 },
      { "month": "2025-01", "cases": 180, "aiResolved": 108 },
      { "month": "2025-02", "cases": 170, "aiResolved": 102 }
    ]
  }
}
```

---

## 에러 코드

| 코드 | 설명 |
|------|------|
| `INVALID_INPUT` | 입력 데이터가 유효하지 않음 |
| `CUSTOMER_NOT_FOUND` | 고객을 찾을 수 없음 |
| `AI_ERROR` | AI 응답 생성 중 오류 |
| `SLACK_ERROR` | Slack 연동 오류 |
| `DATABASE_ERROR` | 데이터베이스 오류 |
| `UNAUTHORIZED` | 인증 실패 (향후) |
| `RATE_LIMIT_EXCEEDED` | 요청 제한 초과 (향후) |

---

## 환경 변수

Frontend에서 사용할 환경 변수:

```env
# .env.development
VITE_API_URL=http://localhost:5000/api

# .env.production
VITE_API_URL=https://anybridge-api.vercel.app/api
```

---

## 사용 예시

### React에서 API 호출

```javascript
// src/api/chatApi.js
const API_URL = import.meta.env.VITE_API_URL

export const sendMessage = async (message, customerId, sessionId, history) => {
  try {
    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        customerId,
        sessionId,
        conversationHistory: history
      })
    })
    
    if (!response.ok) {
      throw new Error('API request failed')
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}

export const matchCustomer = async (customerName) => {
  const response = await fetch(`${API_URL}/customer/match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerName })
  })
  return response.json()
}

export const escalateCase = async (caseData) => {
  const response = await fetch(`${API_URL}/escalate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(caseData)
  })
  return response.json()
}

export const getAgentStatus = async (channelId) => {
  const response = await fetch(`${API_URL}/escalate/${channelId}/members`)
  return response.json()
}
```

---

## 다음 단계

1. ✅ API 인터페이스 정의 완료
2. ⏳ Backend API 구현
3. ⏳ Frontend API 연동
4. ⏳ 통합 테스트
