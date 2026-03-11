# 마크애니 RAG 복합질문 50개 테스트 결과

> 테스트 일시: 2026-03-11
> 테스트 스크립트: `scripts/testComplexQueries50.mjs`
> 임베딩 모델: `gemini-embedding-001` (3072차원)
> 검색 방식: Supabase pgvector `match_knowledge` RPC (코사인 유사도, Top 5)
> 총 청크 수: 54개 (SHEET_PRODUCTS 28 + HYPERLINK_CHUNKS 17 + LEGACY_CHUNKS 9)

## 결과 요약

| 항목 | 값 |
|------|-----|
| 총 쿼리 수 | 50 |
| ✅ 완전 매칭 | 32 |
| 🟡 부분 매칭 | 18 |
| ❌ 미매칭 | 0 |
| 완전 정확도 | 64.0% |
| 부분 포함 정확도 | 100.0% |

## 2제품 조합 (20개)

| # | 쿼리 | 기대 제품 | 결과 |
|---|-------|-----------|------|
| 1 | 문서 암호화하면서 인쇄할 때 워터마크도 넣고 싶어요 | Document SAFER, Print SAFER | ✅ |
| 2 | 사내 문서 암호화하고 화면 캡처도 차단하고 싶습니다 | Document SAFER, Screen SAFER | ✅ |
| 3 | 문서 암호화랑 개인정보 탐지를 같이 하고 싶어요 | Document SAFER, Privacy SAFER | ✅ |
| 4 | PC에서 파일 유출 막고 USB도 통제하고 싶습니다 | SafePC Enterprise, SafeUSB | ✅ |
| 5 | 모바일에서 문서 보면서 캡처 방지도 하고 싶어요 | Mobile DOCS, Mobile Capture SAFER | ✅ |
| 6 | 모바일 문서 암호화하면서 화면에 워터마크도 넣고 싶습니다 | Mobile SAFER, Mobile STICKER | 🟡 Mobile SAFER 미검출 |
| 7 | 서버랑 클라이언트 양쪽에서 DRM 연동 개발해야 합니다 | DS I/F (Server), DS I/F (Client) | ✅ |
| 8 | 전자문서 위변조 방지하고 원본 검증도 하고 싶어요 | ePage SAFER, ePS Document DNA | ✅ |
| 9 | 웹에서 문서 DRM 걸고 브라우저 보안도 적용하고 싶습니다 | Web SAFER, ePage SAFER for Web DRM | ✅ |
| 10 | 출력물이랑 화면 둘 다 비가시성 워터마크로 추적하고 싶어요 | Print TRACER, Screen TRACER | ✅ |
| 11 | 국방 환경에서 모바일 보안하면서 KCMVP 암호모듈도 써야 합니다 | 국방모바일보안, MACRYPTO | ✅ |
| 12 | 출력물 추적하면서 화면도 비가시성 워터마크로 추적하고 싶습니다 | Print TRACER, Screen TRACER | ✅ |
| 13 | 아이폰이랑 안드로이드 둘 다 캡처 방지해야 합니다 | iScreen SAFER, Mobile Capture SAFER | ✅ |
| 14 | 협력사에 문서 보내면서 DRM 보안도 유지하고 싶어요 | Cowork SAFER, Document SAFER | 🟡 Document SAFER 미검출 |
| 15 | PC 정보유출 방지하면서 개인정보 파일도 탐지하고 싶습니다 | SafePC Enterprise, Privacy SAFER | ✅ |
| 16 | 화면 캡처 차단하면서 비가시성 워터마크도 넣고 싶어요 | Screen SAFER, Screen TRACER | ✅ |
| 17 | 여러 문서 병합하고 위변조 방지도 적용하고 싶습니다 | ePS DocumentMerger, ePage SAFER | 🟡 ePage SAFER 미검출 |
| 18 | 서버에서 암호화하고 웹 브라우저에서 보여주고 싶어요 | DS I/F (Server), Web SAFER | ✅ |
| 19 | 모바일에서 문서 열람하면서 사용자 정보 워터마크도 표시하고 싶어요 | Mobile DOCS, Mobile STICKER | ✅ |
| 20 | USB로 문서 반출할 때 암호화 유지하면서 매체 통제도 하고 싶습니다 | SafeUSB, Document SAFER | ✅ |

## 3제품 조합 (20개)

| # | 쿼리 | 기대 제품 | 결과 |
|---|-------|-----------|------|
| 21 | 문서 암호화, 인쇄 워터마크, 화면 캡처 방지 세 가지 다 필요합니다 | Document SAFER, Print SAFER, Screen SAFER | ✅ |
| 22 | 모바일에서 문서 보고 캡처 방지하고 워터마크도 넣어야 합니다 | Mobile DOCS, Mobile Capture SAFER, Mobile STICKER | ✅ |
| 23 | 문서 암호화하고 개인정보 탐지하고 PC 유출도 방지해야 합니다 | Document SAFER, Privacy SAFER, SafePC Enterprise | 🟡 SafePC Enterprise 미검출 |
| 24 | 전자문서 위변조 방지하고 원본 검증하면서 웹에서도 보안 적용하고 싶어요 | ePage SAFER, ePS Document DNA, ePage SAFER for Web DRM | ✅ |
| 25 | 서버 클라이언트 양쪽 DRM 연동하고 웹에서도 보여줘야 합니다 | DS I/F (Server), DS I/F (Client), Web SAFER | ✅ |
| 26 | 출력물 추적, 화면 추적, 화면 캡처 차단 전부 필요합니다 | Print TRACER, Screen TRACER, Screen SAFER | ✅ |
| 27 | 문서 암호화하고 협력사 반출 제어하면서 USB도 통제해야 합니다 | Document SAFER, Cowork SAFER, SafeUSB | 🟡 Cowork SAFER 미검출 |
| 28 | 국방 모바일 보안에 문서 뷰어랑 KCMVP 암호모듈 적용해야 합니다 | 국방모바일보안, Mobile DOCS, MACRYPTO | ✅ |
| 29 | 문서 암호화하고 화면 캡처 막으면서 출력물도 추적하고 싶어요 | Document SAFER, Screen SAFER, Print TRACER | ✅ |
| 30 | 안드로이드 iOS 모바일 전부 문서 보안하고 캡처 방지해야 합니다 | Mobile SAFER, Mobile Capture SAFER, iScreen SAFER | 🟡 Mobile SAFER 미검출 |
| 31 | PC 유출 방지, USB 통제, 개인정보 탐지 세 가지 다 해야 합니다 | SafePC Enterprise, SafeUSB, Privacy SAFER | ✅ |
| 32 | 웹에서 전자문서 DRM 걸고 병합하면서 위변조 방지도 해야 합니다 | ePage SAFER for Web DRM, ePS DocumentMerger, ePage SAFER | 🟡 ePage SAFER 미검출 |
| 33 | 사내 문서 암호화하고 모바일에서 열람하면서 캡처도 방지해야 합니다 | Document SAFER, Mobile DOCS, Mobile Capture SAFER | ✅ |
| 34 | 화면, 출력, 웹 전부 추적 SDK로 연동해야 합니다 | TRACER SDK Screen, TRACER SDK Print, TRACER SDK Web | ✅ |
| 35 | 문서 암호화하고 서버 DRM 연동하면서 KCMVP 암호모듈도 적용해야 합니다 | Document SAFER, DS I/F (Server), MACRYPTO | ✅ |
| 36 | 인쇄 워터마크 넣고 출력물 추적하면서 화면 캡처도 막아야 합니다 | Print SAFER, Print TRACER, Screen SAFER | 🟡 Screen SAFER 미검출 |
| 37 | 모바일 화면 워터마크 넣고 캡처 방지하면서 추적 SDK도 연동해야 합니다 | Mobile STICKER, Mobile Capture SAFER, TRACER SDK Mobile | ✅ |
| 38 | 협력사 문서 반출 제어하면서 웹 보안이랑 DRM도 적용해야 합니다 | Cowork SAFER, Web SAFER, Document SAFER | 🟡 Document SAFER 미검출 |
| 39 | 전자문서 위변조 방지하고 음성 바코드랑 디지털 지문도 넣어야 합니다 | ePage SAFER, VoiceBarcode, ePS Document DNA | ✅ |
| 40 | 문서 암호화하고 개인정보 보호하면서 화면 캡처도 차단해야 합니다 | Document SAFER, Privacy SAFER, Screen SAFER | 🟡 Privacy SAFER 미검출 |

## 4제품 이상 조합 + 시나리오형 (10개)

| # | 쿼리 | 기대 제품 | 결과 |
|---|-------|-----------|------|
| 41 | 대기업에서 문서 암호화, 인쇄 보안, 화면 보안, USB 통제 전부 도입하고 싶습니다 | Document SAFER, Print SAFER, Screen SAFER, SafePC Enterprise | 🟡 Print SAFER, Screen SAFER, SafePC Enterprise 미검출 |
| 42 | 공공기관에서 문서 DRM 적용하고 개인정보 보호하면서 KCMVP 인증도 받아야 합니다 | Document SAFER, Privacy SAFER, MACRYPTO | 🟡 Document SAFER, Privacy SAFER 미검출 |
| 43 | 금융기관에서 문서 암호화하고 출력물 추적하면서 개인정보 탐지도 해야 합니다 | Document SAFER, Print TRACER, Privacy SAFER | ✅ |
| 44 | 제조업에서 CAD 설계문서 암호화하고 외부 반출 제어하면서 USB도 통제해야 합니다 | Document SAFER, Cowork SAFER, SafeUSB | 🟡 Cowork SAFER 미검출 |
| 45 | 모바일 오피스에서 문서 열람, 캡처 방지, 워터마크, 문서 암호화 전부 필요합니다 | Mobile DOCS, Mobile Capture SAFER, Mobile STICKER, Mobile SAFER | ✅ |
| 46 | 웹 기반 업무 시스템에서 문서 DRM 걸고 위변조 방지하면서 추적도 해야 합니다 | Web SAFER, ePage SAFER, TRACER SDK Web | 🟡 Web SAFER, ePage SAFER 미검출 |
| 47 | 학교에서 수료증 위변조 방지하고 교육자료 유출 막으면서 온라인 시험 화면도 보호해야 합니다 | ePage SAFER, Document SAFER, Screen SAFER | 🟡 ePage SAFER, Document SAFER 미검출 |
| 48 | 군에서 모바일 문서 보안하고 KCMVP 적용하면서 화면 캡처도 방지해야 합니다 | 국방모바일보안, MACRYPTO, Mobile Capture SAFER | 🟡 MACRYPTO 미검출 |
| 49 | 방송사에서 대본 문서 유출 막고 출력물도 추적하면서 화면 캡처도 방지하고 싶습니다 | Document SAFER, Print TRACER, Screen SAFER | 🟡 Document SAFER 미검출 |
| 50 | 연구소에서 연구문서 암호화하고 서버 DRM 연동하면서 화면 캡처 방지랑 출력 추적도 해야 합니다 | Document SAFER, DS I/F (Server), Screen SAFER, Print TRACER | 🟡 DS I/F (Server), Print TRACER 미검출 |

## 부분 매칭 분석 (18건)

대부분 3~4개 제품을 동시에 기대하는 복합 질문에서 Top 5 안에 모든 제품이 들어오지 못하는 구조적 한계.
벡터 검색 topK=5 제한 + 유사도 경쟁에서 밀리는 패턴. 실제 챗봇에서는 LLM이 컨텍스트를 종합 판단하므로 부분 매칭도 유효한 응답 생성 가능.

| 패턴 | 건수 | 설명 |
|------|------|------|
| Mobile SAFER 미검출 | 2 | MDM 솔루션이라 "문서 보안/워터마크" 쿼리에서 유사도 낮음 |
| ePage SAFER 미검출 | 4 | "위변조방지" 키워드 없이 간접 표현 시 유사도 경쟁에서 밀림 |
| Cowork SAFER 미검출 | 3 | "협력사/반출" 키워드가 Document SAFER 반출 기능과 경쟁 |
| Document SAFER 미검출 | 4 | 범용 "문서 보안" 쿼리에서 DRM 레거시 청크가 상위 차지 |
| 기타 (SafePC, Privacy, Screen, MACRYPTO 등) | 5 | 4제품 이상 조합에서 topK=5 한계 |
