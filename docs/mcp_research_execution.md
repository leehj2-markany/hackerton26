# MCP 데이터 리서치 실행 계획

## ✅ 실행 승인 완료
- 시간 투자: 2.5시간 (가치 있음)
- 접근 권한: 모든 MCP API/토큰 지원
- 데이터 소스: SK하이닉스, 국방부 지원 채널 확인됨
- 기밀 정보: 회사 내부 해커톤이라 문제없음
- 시나리오: 구현 후 폴리싱

---

## 🚀 Phase 1: MCP 서버 설정 (우선)

### 필요한 MCP 서버
1. ✅ Slack MCP (이미 설정됨)
2. ⏳ Jira MCP (설정 필요)
3. ✅ Confluence MCP (이미 설정됨)
4. ✅ Google Workspace MCP (Drive, Gmail 포함, 이미 설정됨)

### Jira MCP 설정 필요
**설정 파일**: `.kiro/settings/mcp.json`

```json
{
  "mcpServers": {
    "jira": {
      "command": "uvx",
      "args": ["mcp-server-jira"],
      "env": {
        "JIRA_URL": "https://markany.atlassian.net",
        "JIRA_EMAIL": "사용자_이메일",
        "JIRA_API_TOKEN": "제공받을_토큰"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

---

## 📊 Phase 2: 데이터 리서치 실행

### Step 1: Slack 채널 리서치 (30분)

**목표**: SK하이닉스, 국방부 지원 채널에서 실제 질문 추출

**실행 순서**:
1. SK하이닉스 관련 채널 검색
2. 국방부 관련 채널 검색
3. 최근 3개월 메시지 히스토리 조회
4. 질문 패턴 추출 (10~15개)

**Slack MCP 명령어**:
```
1. 채널 리스트 조회: mcp_slack_slack_list_channels
2. 채널 히스토리 조회: mcp_slack_slack_get_channel_history
3. 스레드 조회: mcp_slack_slack_get_thread_replies
```

---

### Step 2: Jira 이슈 리서치 (30분)

**목표**: 고객사별 기술 지원 이슈에서 질문 추출

**JQL 쿼리**:
```jql
project = "고객지원" AND 
created >= -6M AND 
(labels = "SK하이닉스" OR labels = "국방부" OR 
 summary ~ "SK하이닉스" OR summary ~ "국방부") AND
issuetype IN ("문의", "기술지원", "Bug") AND
status IN ("완료", "해결됨")
ORDER BY created DESC
```

**Jira MCP 명령어**:
```
1. 이슈 검색: mcp_jira_jira_get (path: "/rest/api/3/search/jql")
2. 이슈 상세: mcp_jira_jira_get (path: "/rest/api/3/issue/{issueKey}")
```

---

### Step 3: Confluence 리서치 (30분)

**목표**: FAQ, 정책기능서에서 자주 묻는 질문 추출

**검색 쿼리**:
```
스페이스: 제품문서, 고객지원
키워드: FAQ, 자주 묻는 질문, Document SAFER, DRM
```

**Confluence MCP 명령어**:
```
1. 스페이스 조회: mcp_confluence_conf_get (path: "/wiki/api/v2/spaces")
2. 페이지 검색: mcp_confluence_conf_get (path: "/wiki/rest/api/search")
3. 페이지 내용: mcp_confluence_conf_get (path: "/wiki/api/v2/pages/{id}/body")
```

---

### Step 4: Google Drive 리서치 (30분)

**목표**: 제안서, 기술문서에서 고객 요구사항 추출

**검색 쿼리**:
```
파일명: "SK하이닉스" OR "국방부" OR "제안서" OR "RFP"
파일 타입: PDF, DOCX
폴더: 제안서, 영업자료
```

**Google Drive MCP 명령어**:
```
1. 파일 검색: mcp_google_workspace_search_drive_files
2. 파일 내용: mcp_google_workspace_get_drive_file_content
```

---

### Step 5: Gmail 리서치 (선택, 30분)

**목표**: 고객 이메일에서 문의 패턴 추출

**검색 쿼리**:
```
from: @skhynix.com OR subject: SK하이닉스
from: @mnd.go.kr OR subject: 국방부
subject: 문의 OR 질문 OR 요청
newer_than: 6m
```

---

## 📝 Phase 3: 데이터 정리 및 분류 (30분)

### 질문 분류 기준
1. **기술 질문**: 호환성, 설치, 설정, 오류
2. **가격 질문**: 라이선스, 비용, 계약
3. **절차 질문**: 도입, 업그레이드, 교육
4. **복합 질문**: 2개 이상 카테고리 포함

### 데이터 정리 포맷
```markdown
## SK하이닉스 질문 (10개)

### 1. [기술] Document SAFER 업그레이드 성능
- 출처: Slack #squad-hotline-drm, 2025-02-10
- 원문: "v3.2로 업그레이드하면 대량 파일 처리 속도가 개선되나요?"
- 답변: "30% 개선되었습니다"
- 참조: 릴리스 노트 v3.2

### 2. [기술] 윈도우 11 호환성
- 출처: Jira CUST-1234, 2024-11-15
- 원문: "윈도우 11에서 정상 작동하나요?"
- 답변: "v3.2부터 완벽 지원"
- 참조: 정책기능서 v3.2

...
```

---

## 🎯 Phase 4: 데모 시나리오 적용 (30분)

### 시나리오 1: SK하이닉스 (10개 질문 선정)
1. 리서치 결과에서 TOP 10 선정
2. 데모 흐름에 맞게 순서 조정
3. 질문 표현 자연스럽게 다듬기
4. 답변 스크립트 작성

### 시나리오 2: 국방부 (복합 질문 구성)
1. 리서치 결과에서 복합 질문 찾기
2. 없으면 2~3개 질문 조합
3. 서브질문 분해 시나리오 작성
4. 담당자 배정 로직 매핑

---

## ✅ 실행 체크리스트

### MCP 설정
- [ ] Jira MCP 설정 확인 (API 토큰 필요)
- [ ] Slack MCP 권한 확인 (채널 리스트, 히스토리, DM)
- [ ] Confluence MCP 테스트
- [ ] Google Workspace MCP 테스트

### 리서치 실행
- [ ] Slack: SK하이닉스 채널 검색 및 히스토리 조회
- [ ] Slack: 국방부 채널 검색 및 히스토리 조회
- [ ] Jira: JQL 쿼리 실행 (SK하이닉스, 국방부)
- [ ] Confluence: FAQ 페이지 조회
- [ ] Confluence: 정책기능서 조회
- [ ] Google Drive: 제안서 검색 (SK하이닉스, 국방부)
- [ ] Gmail: 고객 이메일 검색 (선택)

### 데이터 정리
- [ ] 질문 분류 (기술/가격/절차/복합)
- [ ] TOP 10 질문 선정 (시나리오 1)
- [ ] 복합 질문 구성 (시나리오 2)
- [ ] 답변 스크립트 작성
- [ ] 참조 문서 링크 정리

### 시나리오 적용
- [ ] 시나리오 1 질문 10개 업데이트
- [ ] 시나리오 2 복합 질문 업데이트
- [ ] 고객 이력 데이터 생성 (SK하이닉스)
- [ ] AI 답변 데이터 준비

---

## 🚀 다음 단계

**즉시 실행**:
1. Jira MCP API 토큰 받기
2. MCP 서버 설정 및 테스트
3. Slack 채널 리서치 시작

**예상 소요 시간**: 2.5시간
**완료 목표**: 오늘 중

진행하시겠습니까?
