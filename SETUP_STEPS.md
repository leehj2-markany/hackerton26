# Gemini API 설정 단계별 가이드

## 현재 상황
- ✅ API 키는 존재함: `.env` 파일 참조
- ❌ 404 에러: Generative Language API가 활성화되지 않음

## 해결 방법

### 방법 1: Google Cloud Console에서 API 활성화 (현재 프로젝트 사용)

1. **Generative Language API 활성화**
   - 링크: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com
   - "사용 설정" 버튼 클릭
   - 현재 프로젝트에서 활성화

2. **API 키 제한 확인**
   - https://console.cloud.google.com/apis/credentials
   - 현재 API 키 클릭
   - "API 제한사항" 섹션에서 "Generative Language API" 허용 확인

3. **테스트**
   ```bash
   cd hackerton
   node test-simple.js
   ```

### 방법 2: Google AI Studio에서 새 API 키 생성 (권장)

Google AI Studio는 Gemini API 전용이므로 더 간단합니다:

1. **Google AI Studio 접속**
   - https://aistudio.google.com/app/apikey

2. **새 API 키 생성**
   - "Create API Key" 클릭
   - 프로젝트 선택 (또는 새로 생성)
   - API 키 자동으로 Generative Language API 권한 포함

3. **.env 파일 업데이트**
   ```bash
   GEMINI_API_KEY=새로운_API_키
   ```

4. **테스트**
   ```bash
   cd hackerton
   node test-simple.js
   ```

## 빠른 확인 명령어

```bash
# 현재 디렉토리에서
cd hackerton

# API 상태 확인
node test-simple.js

# 성공하면 전체 테스트
node test-gemini.js
```

## 예상 성공 메시지

```
API 키: (마스킹됨)
키 길이: 39

테스트 1: gemini-pro
✅ 성공!
응답: Hello! How can I help you today?
```

## 문제가 계속되면

1. 새 프로젝트 생성
2. Google AI Studio에서 해당 프로젝트로 API 키 생성
3. 결제 정보 등록 (무료 티어도 필요)
