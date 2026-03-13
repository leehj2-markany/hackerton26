# ANY 브릿지 UI/UX 리뷰 v3 — 에스컬레이션 개선

> 리뷰 일자: 2026-03-13
> 목적: 에스컬레이션 채널 네이밍, 채널 정리, 담당자 표시 개선
> 상태 태그: `<!-- STATUS: DONE -->` = 수정 완료, `<!-- STATUS: TODO -->` = 미수정

---

## 수정 항목

<!-- STATUS: DONE -->
### Issue 16: Slack 채널 네이밍 — 고객사명+고객이름+대표솔루션명

- **현재 동작**: `esc-{고객사영문약칭}-{제품명}-{MMDD}-{HHmm}` (예: `esc-drm-0313-0410`)
  - 스크린샷: `##esc-drm-0313-0410` — 고객사명 없음, 제품명만 표시
- **문제**: 채널명만으로 어떤 고객 건인지 식별 불가. 고객 이름도 없어서 담당자가 누구 건인지 모름
- **수정 방향**: `esc-{고객사명}-{고객이름}-{대표솔루션1개}` 형식으로 변경
  - 예: `esc-skhynix-홍길동-drm`, `esc-국방부--docsafer` (이름 없으면 공란)
  - 날짜/시간 제거 → 고객사+솔루션으로 충분히 식별 가능
  - 동일 조합 중복 시 `-2`, `-3` suffix 추가
- **수정 파일**:
  - `api/_lib/slackClient.js` — `createChannel()` 네이밍 로직
  - `api/escalate.js` — `createChannel()` 호출 시 고객이름 파라미터 추가
  - `frontend/src/components/Chatbot.jsx` — `escalateCase()` 호출 시 고객이름 전달
  - `backend/api/lib/slackClient.js` — Dual API sync

<!-- STATUS: DONE -->
### Issue 17: 상담 종료 시 Slack 채널 보관 및 삭제

- **현재 동작**: `session/close.js`에서 `archiveChannel(channelId)` 호출 → 채널 보관(archive)만 수행
- **문제**: 보관된 채널이 계속 쌓임. 삭제까지 해야 깔끔
- **Slack 채널 삭제 권한 정보**:
  - `conversations.archive` — Bot Token Scope: `channels:manage` (현재 보유)
  - `admin.conversations.delete` — Enterprise Grid 전용 API. User Token + `admin.conversations:write` scope 필요
  - **일반 Slack 워크스페이스(Free/Pro/Business+)에서는 API로 채널 삭제 불가**
  - 삭제는 Slack 웹/앱에서 수동으로만 가능하거나, Enterprise Grid 플랜 필요
- **수정 방향**: 
  - 보관(archive)은 현재대로 유지 (API 가능)
  - 삭제 시도: `admin.conversations.delete` 호출 → 실패 시 graceful fallback (보관만 유지)
  - `cleanup-channels.js` 스크립트는 이미 존재 — 운영용 일괄 정리 가능
- **수정 파일**:
  - `api/session/close.js` — archive 후 delete 시도 추가
  - `api/_lib/slackClient.js` — `deleteChannel()` 함수 추가
  - `backend/api/session/close.js` — Dual API sync
  - `backend/api/lib/slackClient.js` — Dual API sync

<!-- STATUS: DONE -->
### Issue 18: 담당자 연결 중 실제 초대된 인원 이름 표시

- **현재 동작**: AgentStatus 패널에 채소희 + 송인찬만 표시 (하드코딩 AGENT_MAP 기반)
  - 스크린샷: "담당자 연결 중 ⏳ 2/4" — 채소희, 송인찬만 보이고 실제 배정된 이현진 없음
- **문제**: 서브질문에 배정된 실제 담당자와 AgentStatus 패널 표시가 불일치
- **수정 방향**: 
  - `escalateCase` API 응답의 `agents` 배열 (실제 초대된 인원)을 AgentStatus에 반영
  - 채소희(고객센터)는 항상 첫 번째로 표시
  - 이후 API 응답의 agents 목록에서 실제 초대된 담당자만 순차 표시
  - "2/4" 카운트도 실제 초대 인원 기준으로 정확히 표시
- **수정 파일**:
  - `frontend/src/components/Chatbot.jsx` — `handleEscalation()` 내 agents 구성 로직

---

## 📋 수정 현황 요약

| # | 이슈 | 심각도 | 상태 |
|---|------|--------|------|
| 16 | Slack 채널 네이밍 개선 | 🟡 Medium | <!-- STATUS: DONE --> ✅ 수정 완료 |
| 17 | 상담 종료 시 채널 보관+삭제 | 🟡 Medium | <!-- STATUS: DONE --> ✅ 수정 완료 |
| 18 | 담당자 연결 중 실제 초대 인원 표시 | 🟡 Medium | <!-- STATUS: DONE --> ✅ 수정 완료 |
