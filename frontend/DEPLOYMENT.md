# 배포 가이드

## Vercel 배포

### 1. Vercel CLI 설치
```bash
npm install -g vercel
```

### 2. Vercel 로그인
```bash
vercel login
```

### 3. 프로젝트 배포
```bash
# 프로젝트 루트에서
cd hackerton/frontend
vercel

# 프로덕션 배포
vercel --prod
```

### 4. 환경 변수 설정 (향후 백엔드 연동 시)
```bash
vercel env add VITE_API_URL
vercel env add VITE_SLACK_WEBHOOK_URL
```

## 로컬 테스트

### 개발 서버 실행
```bash
npm run dev
```
브라우저에서 http://localhost:3000 접속

### 프로덕션 빌드 테스트
```bash
npm run build
npm run preview
```

## 데모 시연 체크리스트

### 시나리오 1: SK하이닉스 (2분)
- [ ] 홈페이지 로드 확인
- [ ] 챗봇 자동 팝업 확인
- [ ] "SK하이닉스" 입력 → 고객 정보 매칭 확인
- [ ] 질문 입력 → AI 사고 과정 패널 표시 확인
- [ ] 답변 생성 → 신뢰도 배지 확인
- [ ] 우측 정보 패널 표시 확인 (데스크톱)
- [ ] 과거 이력 참조 확인
- [ ] 10개 질문 빠른 응답 확인

### 시나리오 2: 국방부 (3분)
- [ ] "국방부" 입력 → 고객 정보 매칭 확인
- [ ] 복합 질문 입력 → 질문 분해 확인
- [ ] AI 사고 과정 패널에서 3개 서브질문 표시 확인
- [ ] "담당자 연결하기" 버튼 표시 확인
- [ ] 버튼 클릭 → 담당자 입장 애니메이션 확인
- [ ] 4명 순차 입장 확인 (채소희 → 송인찬 → 이현진 → 박우호)
- [ ] 진행 상황 표시 확인 (1/4 → 2/4 → 3/4 → 4/4)
- [ ] 최종 메시지 표시 확인

### 반응형 테스트
- [ ] 모바일 (< 768px) 레이아웃 확인
- [ ] 태블릿 (768px - 1024px) 레이아웃 확인
- [ ] 데스크톱 (> 1024px) 레이아웃 확인
- [ ] XL 데스크톱 (> 1280px) 정보 패널 표시 확인

### UI/UX 테스트
- [ ] 최소화/펼치기 버튼 동작 확인
- [ ] 스크롤 동작 확인
- [ ] 메시지 입력 및 전송 확인
- [ ] Enter 키 전송 확인
- [ ] 애니메이션 부드러움 확인
- [ ] 로딩 상태 표시 확인

## 트러블슈팅

### 문제: npm install 실패
```bash
# 캐시 삭제 후 재시도
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 문제: 빌드 실패
```bash
# 의존성 확인
npm list
npm audit fix

# Vite 캐시 삭제
rm -rf node_modules/.vite
npm run build
```

### 문제: 포트 충돌
```bash
# vite.config.js에서 포트 변경
server: {
  port: 3001  // 다른 포트로 변경
}
```

### 문제: Tailwind CSS 적용 안됨
```bash
# PostCSS 설정 확인
cat postcss.config.js

# Tailwind 설정 확인
cat tailwind.config.js

# 개발 서버 재시작
npm run dev
```

## 성능 최적화

### 1. 이미지 최적화
- 로고 및 아이콘은 SVG 사용
- 필요시 WebP 포맷 사용

### 2. 코드 스플리팅
```javascript
// 향후 라우팅 추가 시
const Dashboard = lazy(() => import('./components/Dashboard'))
```

### 3. 번들 크기 분석
```bash
npm run build
npx vite-bundle-visualizer
```

## 보안 체크리스트

- [ ] 환경 변수로 API 키 관리
- [ ] HTTPS 사용 (Vercel 자동 제공)
- [ ] CSP 헤더 설정 (향후)
- [ ] XSS 방지 (React 기본 제공)
- [ ] CSRF 토큰 (향후 백엔드 연동 시)

## 모니터링

### Vercel Analytics
```bash
# Vercel 대시보드에서 활성화
# - 페이지 뷰
# - 로딩 시간
# - 에러 추적
```

### 사용자 피드백
- 챗봇 만족도 수집 (향후 구현)
- 에러 로그 수집 (향후 구현)

## 백업 및 롤백

### Git 태그 생성
```bash
git tag -a v1.0.0 -m "Initial release"
git push origin v1.0.0
```

### Vercel 롤백
```bash
# Vercel 대시보드에서 이전 배포로 롤백 가능
# 또는 CLI 사용
vercel rollback
```

## 다음 단계

1. ✅ Frontend 배포 완료
2. ⏳ Backend API 개발 및 연동
3. ⏳ Slack 웹훅 연동
4. ⏳ 실제 데이터 연동
5. ⏳ 성능 모니터링 설정
