# 마크애니 RAG 벡터 검색 종합 테스트 결과

> 테스트 일시: 2026-03-11
> 테스트 스크립트: `scripts/testVectorSearchFull.mjs`
> 임베딩 모델: `gemini-embedding-001` (3072차원)
> 검색 방식: Supabase pgvector `match_knowledge` RPC (코사인 유사도)
> 총 청크 수: 54개 (SHEET_PRODUCTS 28 + HYPERLINK_CHUNKS 17 + LEGACY_CHUNKS 9)

## 결과 요약

| 항목 | 값 |
|------|-----|
| 총 쿼리 수 | 36 |
| ✅ 완전 매칭 | 36 |
| 🟡 부분 매칭 | 0 |
| ❌ 미매칭 | 0 |
| 완전 정확도 | 100.0% |
| 부분 포함 정확도 | 100.0% |

## 단일 제품 쿼리 (29개)

| # | 쿼리 | 기대 제품 | 결과 | Top 1 (유사도%) |
|---|-------|-----------|------|-----------------|
| 1 | 기업 문서 암호화 통합 보안 솔루션 | Document SAFER | ✅ 1위 | Document SAFER(77.7%) |
| 2 | 문서 DRM 암호화 접근 제어 유출 방지 | Document SAFER | ✅ 2위 | DRM(78.4%), Document SAFER(77.6%) |
| 3 | 개인정보 파일 탐지 암호화 컴플라이언스 | Privacy SAFER | ✅ 1위 | Privacy SAFER(76.5%) |
| 4 | 문서 인쇄 워터마크 출력 정책 제어 | Print SAFER | ✅ 1위 | Print SAFER(74.2%) |
| 5 | 출력물 비가시성 추적 코드 위변조 방지 | Print TRACER | ✅ 1위 | Print TRACER(78.6%) |
| 6 | 화면 캡처 방지 PrintScreen 차단 | Screen SAFER | ✅ 1위 | Screen SAFER(75.3%) |
| 7 | 화면 비가시성 워터마크 촬영자 추적 | Screen TRACER | ✅ 1위 | Screen TRACER(77.8%) |
| 8 | 웹 브라우저 문서 DRM 보호 | Web SAFER | ✅ 1위 | Web SAFER(78.1%) |
| 9 | 외부 협력사 문서 공유 보안 반출 제어 | Cowork SAFER | ✅ 1위 | Cowork SAFER(73.8%) |
| 10 | 모바일 DRM 문서 뷰어 스마트폰 | Mobile DOCS | ✅ 1위 | Mobile DOCS(79.4%) |
| 11 | 모바일 기기 문서 암호화 BYOD 보안 | Mobile SAFER | ✅ 2위 | Mobile DOCS(76.7%), Mobile SAFER(76.0%) |
| 12 | 모바일 화면 워터마크 사용자 정보 표시 | Mobile STICKER | ✅ 1위 | Mobile STICKER(78.9%) |
| 13 | 모바일 스크린샷 캡처 방지 | Mobile Capture SAFER | ✅ 1위 | Mobile Capture SAFER(77.0%) |
| 14 | iOS iPad iPhone 화면 캡처 방지 | iScreen SAFER | ✅ 1위 | iScreen SAFER(77.5%) |
| 15 | 군사 보안 국방 모바일 문서 보호 | 국방모바일보안 | ✅ 1위 | 국방모바일보안(81.4%) |
| 16 | 서버 DRM 연동 JAVA C 인터페이스 Unix | DS I/F (Server) | ✅ 1위 | DS I/F Server(78.8%) |
| 17 | 클라이언트 DRM 연동 인터페이스 개발 | DS I/F (Client) | ✅ 1위 | DS I/F Client(77.9%) |
| 18 | KCMVP 암호모듈 인증 국가정보원 | MACRYPTO | ✅ 1위 | MACRYPTO(78.7%) |
| 19 | PC 정보 유출 방지 USB 매체 제어 DLP | SafePC Enterprise | ✅ 2위 | SafeUSB(76.2%), SafePC(74.8%) |
| 20 | USB 저장매체 암호화 보안USB 발급 관리 | SafeUSB | ✅ 1위 | SafeUSB(75.5%) |
| 21 | 전자문서 위변조 방지 증명서 수료증 진위 확인 | ePage SAFER, ePS Document DNA | ✅ 1,2위 | ePS Document DNA(70.5%), ePage SAFER(69.1%) |
| 22 | 음성 바코드 시각장애인 접근성 | VoiceBarcode | ✅ 1위 | VoiceBarcode(79.2%) |
| 23 | 웹 전자문서 DRM Nexacro 브라우저 보안 | ePage SAFER for Web DRM | ✅ 1위 | ePage SAFER WebDRM(79.9%) |
| 24 | 전자문서 병합 리포트 통합 출력 | ePS DocumentMerger | ✅ 1위 | ePS DocumentMerger(75.3%) |
| 25 | Document DNA 디지털 지문 원본 검증 | ePS Document DNA | ✅ 1위 | ePS Document DNA(77.2%) |
| 26 | 화면 추적 SDK Add-in 3rd party 연동 | TRACER SDK for Screen | ✅ 1위 | TRACER SDK Screen(80.6%) |
| 27 | 출력물 추적 SDK 인쇄 워터마크 Add-in | TRACER SDK for Print | ✅ 1위 | TRACER SDK Print(81.7%) |
| 28 | 웹 시스템 문서 추적 서버사이드 SDK | TRACER SDK for Web | ✅ 1위 | TRACER SDK Web(80.4%) |
| 29 | 모바일 앱 문서 추적 SDK Add-in | TRACER SDK for Mobile | ✅ 1위 | TRACER SDK Mobile(81.2%) |

## 복합질문 (7개)

| # | 쿼리 | 기대 제품 | 결과 |
|---|-------|-----------|------|
| 30 | 인턴 교육 수료증 위변조 방지하고 교육자료 유출도 막고 싶습니다 | Document SAFER, Print TRACER, ePS Document DNA | ✅ 전부 |
| 31 | 문서 암호화도 하고 인쇄할 때 워터마크도 넣고 화면 캡처도 막고 싶어요 | Document SAFER, Print SAFER, Screen SAFER | ✅ 전부 |
| 32 | 모바일에서 문서 보고 화면 캡처 방지하면서 워터마크도 넣고 싶습니다 | Mobile DOCS, Mobile Capture SAFER, Mobile STICKER | ✅ 전부 |
| 33 | USB로 파일 반출 통제하고 PC에서 정보 유출도 방지하고 싶습니다 | SafeUSB, SafePC Enterprise | ✅ 1,2위 |
| 34 | 서버에서 문서 암호화하고 웹 브라우저에서 DRM 걸어서 보여주고 싶어요 | DS I/F (Server), Web SAFER | ✅ 전부 |
| 35 | 영상 콘텐츠 저작권 보호하면서 출력물도 추적하고 싶습니다 | Print TRACER | ✅ 1위 |
| 36 | 국방 환경에서 모바일 문서 보안하고 KCMVP 인증 암호모듈 적용하고 싶습니다 | 국방모바일보안, MACRYPTO | ✅ 1,2위 |

## 분석

- 전 29개 제품 단일 쿼리: 100% 정확도 (모두 Top 5 내 검출)
- 복합질문 7개: 100% 정확도
- 평균 Top 1 유사도: ~77%
- SafeCopy, ContentSAFER 삭제 후에도 정확도 유지 — 시트 기반 실제 제품만으로 충분한 커버리지
