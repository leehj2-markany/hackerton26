# Gemini API 설정 가이드

## 현재 상태
❌ API 키가 유효하지 않거나 권한이 없습니다.

## 해결 방법

### 1. Google AI Studio에서 새 API 키 발급

1. **Google AI Studio 접속**
   - https://aistudio.google.com/app/apikey

2. **API 키 생성**
   - "Create API Key" 버튼 클릭
   - 프로젝트 선택 또는 새 프로젝트 생성
   - API 키 복사

3. **API 키 권한 확인**
   - Generative Language API가 활성화되어 있는지 확인
   - https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com

### 2. .env 파일 업데이트

```bash
# hackerton/.env 파일 수정
GEMINI_API_KEY=여기에_새로운_API_키_붙여넣기
```

### 3. 테스트 실행

```bash
cd hackerton
node check-api.js
```

## 무료 할당량

Gemini API 무료 티어:
- Gemini 1.5 Flash: 분당 15 요청, 일일 1,500 요청
- Gemini 1.5 Pro: 분당 2 요청, 일일 50 요청

## 참고 링크

- Google AI Studio: https://aistudio.google.com
- Gemini API 문서: https://ai.google.dev/docs
- 가격 정책: https://ai.google.dev/pricing

## 문제 해결

### API 키가 작동하지 않는 경우:
1. API 키가 올바르게 복사되었는지 확인
2. Generative Language API가 활성화되어 있는지 확인
3. 프로젝트에 결제 정보가 등록되어 있는지 확인 (무료 티어도 필요)
4. API 키 제한 설정 확인 (IP 제한 등)

### 할당량 초과 시:
- 무료 할당량을 초과했을 수 있습니다
- Google Cloud Console에서 할당량 확인
- 필요시 유료 플랜으로 업그레이드
