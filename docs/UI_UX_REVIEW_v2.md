# ANY 브릿지 UI/UX 리뷰 v2 — 테스트 기반 이슈

> 리뷰 일자: 2026-03-12 (최종 업데이트: 2026-03-12)
> 목적: 실제 테스트에서 발견된 UI/UX 버그 및 개선 사항
> 상태 태그: `<!-- STATUS: DONE -->` = 수정 완료, `<!-- STATUS: TODO -->` = 미수정

---

## 🔴 Critical Issues (테스트에서 발견)

<!-- STATUS: DONE -->
### Issue 1: Slack 채널 답변이 챗봇으로 전달되지 않음
- **재현 경로**: 에스컬레이션 → Slack 채널 생성 → 담당자가 채널에서 답변 → 챗봇에 표시 안 됨
- **근본 원인**: `escalateCase()`가 생성한 `channelId`를 `sendSlackQuestion()`에 전달하지 않음. React state(`slackChannelId`)는 비동기 업데이트라 `setSlackChannelId()` 직후에도 이전 값(null) 참조. 결과적으로 `sendSlackQuestion`이 null channelId로 호출되어 새 채널을 또 생성하거나 기본 채널로 전송 → 폴링 채널과 답변 채널 불일치
- **추가 원인**: 초기 폴링 루프(90초) 타임아웃 후 도착하는 답변을 캡처하는 메커니즘 없음
- **영향도**: Critical — 핵심 기능(담당자 실시간 답변) 불가
- **상태**: ✅ 수정 완료 (v2: 2026-03-12)
- **수정 내용**:
  1. `escalationResult?.data?.channelId`를 즉시 `slackChannelId`에 반영 + `activeChannelId` 로컬 변수로 `sendSlackQuestion`에 전달
  2. 에스컬레이션 모드 백그라운드 폴링 `useEffect` 추가 — 10초 간격으로 지속 폴링, `seenSlackTsRef`로 중복 방지
  3. 초기 폴링 루프에서도 `seenSlackTsRef`에 등록하여 백그라운드 폴링과 중복 방지
- **파일**: `Chatbot.jsx`

<!-- STATUS: DONE -->
### Issue 2: 담당자 답변 대기 중 채팅창 비활성화
- **재현 경로**: 에스컬레이션 → 입력창 비활성화 → 추가 질문 불가
- **예상 원인**: `isEscalationBusy`가 폴링 완료 전까지 true 유지
- **영향도**: High
- **상태**: ✅ 수정 완료
- **수정 내용**: 입력 disabled 조건 분리, 에스컬레이션 초기 시퀀스만 busy, placeholder 상태별 세분화

<!-- STATUS: DONE -->
### Issue 8: 신뢰도 배지(ConfidenceBadge) 고객 노출
- **재현 경로**: AI 답변 → 메시지 하단에 "🔴 낮은 신뢰도 — 정확하지 않을 수 있습니다" 표시
- **문제**: 고객 대면 챗봇에서 신뢰도를 노출하면 오히려 불신을 유발. 내부 디버깅 전용 데이터를 고객에게 보여줄 이유 없음
- **영향도**: High — 고객 신뢰 저해
- **상태**: ✅ 수정 완료
- **수정 내용**: ConfidenceBadge 컴포넌트 및 인라인 렌더링 제거. confidence 데이터는 msg 객체에 유지(디버깅용). 코드 주석 `[P11][REMOVED]`로 제거 의도 기록
- **파일**: `Chatbot.jsx` L53-54

---

## 🟡 기존 UI/UX 개선 포인트 (코드 리뷰 기반)

<!-- STATUS: TODO -->
### Issue 3: Chatbot.jsx 단일 파일 비대화 (1300+ lines)
- 모든 로직(intake, 메시지, 에스컬레이션, 폴링)이 하나의 컴포넌트에 집중
- 커스텀 훅 분리 권장: `useSlackPolling`, `useEscalation`, `useAIChat`
- **상태**: � 미수정 (해커톤 기간 내 리팩토링 우선순위 낮음)

<!-- STATUS: TODO -->
### Issue 4: 에스컬레이션 버튼 이중 표시 가능성
- 빠른 연속 클릭 시 중복 에스컬레이션 요청 가능 (debounce 없음)
- **상태**: 🔲 미수정

<!-- STATUS: TODO -->
### Issue 5: 모바일 반응형 미흡
- Homepage 헤더 네비게이션이 모바일에서 숨겨지지만 햄버거 메뉴 없음
- 챗봇 위젯이 모바일에서 전체 화면을 차지하지 않아 사용성 저하 가능
- **상태**: 🔲 미수정

<!-- STATUS: TODO -->
### Issue 6: 세션 복원 시 에스컬레이션 상태 미복원
- `sessionStorage`에서 고객 정보와 채널 ID는 복원하지만, `escalationMode` 상태는 복원하지 않음
- 페이지 새로고침 시 에스컬레이션 모드가 초기화되어 AI 모드로 돌아감
- **상태**: 🔲 미수정

<!-- STATUS: TODO -->
### Issue 7: ThinkingPanel 애니메이션 타이밍
- 실제 LLM 응답이 빠르면 ThinkingPanel이 닫히기 전에 답변이 표시될 수 있음
- 최소 표시 시간 보장 로직 없음
- **상태**: 🔲 미수정

---

## 📋 수정 현황 요약

| # | 이슈 | 심각도 | 상태 |
|---|------|--------|------|
| 1 | Slack 답변 미전달 | 🔴 Critical | <!-- STATUS: DONE --> ✅ 완료 |
| 2 | 대기 중 입력 비활성화 | 🔴 High | <!-- STATUS: DONE --> ✅ 완료 |
| 8 | 신뢰도 배지 고객 노출 | 🔴 High | <!-- STATUS: DONE --> ✅ 완료 |
| 3 | Chatbot.jsx 비대화 | 🟡 Medium | <!-- STATUS: TODO --> 🔲 미수정 |
| 4 | 에스컬레이션 debounce | 🟢 Low | <!-- STATUS: TODO --> 🔲 미수정 |
| 5 | 모바일 반응형 | 🟡 Medium | <!-- STATUS: TODO --> 🔲 미수정 |
| 6 | 세션 복원 에스컬레이션 | 🟡 Medium | <!-- STATUS: TODO --> 🔲 미수정 |
| 7 | ThinkingPanel 타이밍 | 🟢 Low | <!-- STATUS: TODO --> 🔲 미수정 |
