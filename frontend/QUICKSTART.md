# 빠른 시작 가이드

## 5분 안에 시작하기

### 1. 설치
```bash
cd hackerton/frontend
npm install
```

### 2. 실행
```bash
npm run dev
```

브라우저에서 http://localhost:3000 자동 오픈

### 3. 데모 시연

#### 시나리오 1: SK하이닉스 (2분)
1. 챗봇에 "SK하이닉스" 입력
2. "Document SAFER를 v3.2로 업그레이드하면 성능이 개선되나요?" 입력
3. AI 답변 확인
4. 우측 정보 패널 확인 (데스크톱)

#### 시나리오 2: 국방부 (3분)
1. 챗봇에 "국방부" 입력
2. "국방부 맞춤형 DRM 구축이 가능한가요? 윈도우 11 호환성과 보안 인증 요구사항도 알려주세요" 입력
3. AI 사고 과정 확인
4. "담당자 연결하기" 버튼 클릭
5. 4명 담당자 입장 확인

## 주요 기능

### ✅ 구현 완료
- 마크애니 스타일 홈페이지
- AI 챗봇 (자동 팝업)
- 고객 매칭 (SK하이닉스, 국방부)
- AI 사고 과정 패널
- 실시간 정보 패널
- 담당자 입장 표시
- 반응형 디자인

### 🎨 디자인
- 브랜드 컬러: 마크애니 블루 (#0066CC)
- 폰트: 시스템 기본 폰트
- 아이콘: Heroicons (SVG)

### 📱 반응형
- 모바일: < 768px
- 태블릿: 768px - 1024px
- 데스크톱: > 1024px
- XL: > 1280px (정보 패널 표시)

## 파일 구조

```
src/
├── components/
│   ├── Homepage.jsx          # 홈페이지
│   ├── Chatbot.jsx            # 챗봇 메인
│   ├── ThinkingPanel.jsx      # AI 사고 과정
│   ├── InfoPanel.jsx          # 정보 패널
│   └── AgentStatus.jsx        # 담당자 상태
├── data/
│   └── mockData.js            # Mock 데이터
├── App.jsx
├── main.jsx
└── index.css
```

## 커스터마이징

### 브랜드 컬러 변경
`tailwind.config.js`:
```javascript
colors: {
  'markany-blue': '#0066CC',
  'markany-dark': '#003366',
  'markany-light': '#E6F2FF',
}
```

### Mock 데이터 수정
`src/data/mockData.js`:
```javascript
export const mockScenarios = {
  skhynix: { ... },
  defense: { ... }
}
```

### 담당자 목록 수정
`src/data/mockData.js`:
```javascript
export const mockAgents = [
  { name: '채소희', role: '고객센터', avatar: '👩‍💼' },
  ...
]
```

## 트러블슈팅

### 포트 충돌
```bash
# vite.config.js에서 포트 변경
server: { port: 3001 }
```

### 빌드 에러
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Tailwind 적용 안됨
```bash
# 개발 서버 재시작
npm run dev
```

## 다음 단계

1. ✅ Frontend 완성
2. ⏳ Backend API 개발
3. ⏳ Slack 연동
4. ⏳ Vercel 배포

## 도움말

- README.md - 전체 문서
- DEPLOYMENT.md - 배포 가이드
- TESTING_CHECKLIST.md - 테스트 체크리스트

## 문의

프로젝트 관련 문의는 팀 채널로 연락주세요.
