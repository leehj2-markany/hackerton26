# ANY 브릿지 프론트엔드

마크애니 가상 홈페이지 + AI 챗봇 UI

## 기능

### ✅ 구현 완료
- [x] 마크애니 스타일 홈페이지 (헤더, 히어로, 제품 섹션, 푸터)
- [x] 챗봇 UI (우측 하단 고정, 자동 팝업)
- [x] 최소화/펼치기 기능
- [x] 고객명 기반 자동 매칭 (SK하이닉스, 국방부)
- [x] AI 사고 과정 패널 (단계별 표시)
- [x] 실시간 정보 패널 (고객 정보, 과거 이력, AI 분석)
- [x] 담당자 입장 표시 (4명 순차 입장 애니메이션)
- [x] 신뢰도 배지 (🟢높음/🟡중간/🔴낮음)
- [x] 참조 문서 표시
- [x] 에스컬레이션 버튼
- [x] 반응형 디자인 (모바일 대응)

### 📋 데모 시나리오

#### 시나리오 1: SK하이닉스 (AI 자동 해결)
1. 고객명 입력: "SK하이닉스" 또는 "하이닉스"
2. 질문 입력: "Document SAFER를 v3.2로 업그레이드하면 성능이 개선되나요?"
3. AI가 과거 이력을 참조하여 맞춤 답변 제공
4. 10여 차례 빠른 질의응답 가능

#### 시나리오 2: 국방부 (에스컬레이션 & 협업)
1. 고객명 입력: "국방부"
2. 복합 질문 입력: "국방부 맞춤형 DRM 구축이 가능한가요? 윈도우 11 호환성과 보안 인증 요구사항도 알려주세요"
3. AI가 질문을 3개로 분해하여 분석
4. "담당자 연결하기" 버튼 클릭
5. 4명의 담당자가 순차적으로 입장 (채소희 → 송인찬 → 이현진 → 박우호)

## 설치 및 실행

```bash
# 패키지 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프리뷰
npm run preview
```

## 기술 스택

- **React 18** - UI 라이브러리
- **Vite** - 빌드 도구
- **Tailwind CSS** - 스타일링
- **Mock Data** - 백엔드 없이 전체 플로우 시연 가능

## 폴더 구조

```
frontend/
├── src/
│   ├── components/
│   │   ├── Homepage.jsx          # 마크애니 홈페이지
│   │   ├── Chatbot.jsx            # 메인 챗봇 컴포넌트
│   │   ├── ThinkingPanel.jsx      # AI 사고 과정 패널
│   │   ├── InfoPanel.jsx          # 실시간 정보 패널
│   │   └── AgentStatus.jsx        # 담당자 입장 표시
│   ├── data/
│   │   └── mockData.js            # Mock 데이터
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## API 인터페이스 (향후 백엔드 연동용)

### 1. 챗봇 메시지 전송
```
POST /api/chat
Request: { message, customerId, sessionId }
Response: { answer, confidence, references, thinkingProcess, needsEscalation }
```

### 2. 고객 매칭
```
POST /api/customer/match
Request: { customerName }
Response: { matched, customerInfo }
```

### 3. 에스컬레이션 요청
```
POST /api/escalate
Request: { caseId, question, subQuestions }
Response: { channelId, channelUrl }
```

### 4. 담당자 입장 상태 조회
```
GET /api/escalate/{channelId}/members
Response: { members, progress }
```

## 브랜드 컬러

- Primary Blue: `#0066CC`
- Dark Blue: `#003366`
- Light Blue: `#E6F2FF`

## 반응형 브레이크포인트

- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px
- XL Desktop: > 1280px (정보 패널 표시)

## 다음 단계

1. ✅ Frontend 완성
2. ⏳ Backend API 개발 (Gemini RAG + 라우팅)
3. ⏳ Slack 연동 (에스컬레이션)
4. ⏳ Vercel 배포

## 라이선스

MIT
