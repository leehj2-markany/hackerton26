# 마크애니 RAG 벡터 검색 테스트 결과

> 테스트 일시: 2026-03-10
> 총 청크: 39개 (시트 28 + 레거시 11)
> 임베딩 모델: gemini-embedding-001
> 정확도: **36/36 (100%)**

## 단일 제품 쿼리 (29개)

| # | 쿼리 | 기대 제품 | 결과 | Top 5 (유사도%) |
|---|-------|-----------|------|-----------------|
| 1 | 기업문서 암호화 통합 보안 솔루션 | Document SAFER | ✅ 1위 | **Document SAFER(77.6%)**, DRM(74.4%), Document SAFER(74.2%), Document SAFER(73.9%), DS I/F Server(72.5%) |
| 2 | 문서 DRM 암호화 접근 제어 유출 방지 | Document SAFER | ✅ 2위 | DRM(78.4%), **Document SAFER(77.5%)**, Document SAFER(76.4%), Document SAFER(76.2%), Mobile DOCS(74.2%) |
| 3 | 개인정보 파일 탐지 암호화 컴플라이언스 | Privacy SAFER | ✅ 1위 | **Privacy SAFER(76.5%)**, Document SAFER(69.6%), Document SAFER(68.7%), Document SAFER(67.3%), DS I/F Server(67.0%) |
| 4 | 문서 인쇄 워터마크 출력 정책 제어 | Print SAFER | ✅ 1위 | **Print SAFER(74.2%)**, Print TRACER(72.0%), SafeCopy(70.4%), TRACER SDK Print(69.3%), Document SAFER(68.2%) |
| 5 | 출력물 비가시성 추적 코드 위변조 방지 | Print TRACER | ✅ 1위 | **Print TRACER(78.6%)**, SafeCopy(76.3%), TRACER SDK Print(75.0%), Screen TRACER(72.3%), TRACER SDK Screen(71.4%) |
| 6 | 화면캡처방지 Print Screen 차단 | Screen SAFER | ✅ 1위 | **Screen SAFER(75.4%)**, Screen TRACER(71.3%), Mobile Capture SAFER(70.8%), iScreen SAFER(70.7%), Print TRACER(68.5%) |
| 7 | 화면 비가시성 워터마크 촬영자 추적 | Screen TRACER | ✅ 1위 | **Screen TRACER(77.9%)**, Mobile STICKER(75.3%), TRACER SDK Screen(74.9%), ContentSAFER(74.4%), Print TRACER(72.6%) |
| 8 | 웹 브라우저 문서 DRM 보호 | Web SAFER | ✅ 1위 | **Web SAFER(78.1%)**, ePage SAFER WebDRM(76.5%), Document SAFER(74.4%), DRM(73.6%), Mobile DOCS(71.9%) |
| 9 | 외부 협력사 문서 공유 보안 반출 제어 | Cowork SAFER | ✅ 1위 | **Cowork SAFER(73.9%)**, Document SAFER(70.7%), Document SAFER(70.5%), DRM(69.4%), DRM(68.9%) |
| 10 | 모바일 DRM 문서 뷰어 스마트폰 | Mobile DOCS | ✅ 1위 | **Mobile DOCS(79.4%)**, Mobile SAFER(75.0%), Mobile STICKER(73.7%), 국방모바일보안(73.5%), Mobile Capture SAFER(72.7%) |
| 11 | 모바일 기기 문서 암호화 BYOD 보안 | Mobile SAFER | ✅ 2위 | Mobile DOCS(76.7%), **Mobile SAFER(76.0%)**, 국방모바일보안(73.5%), Document SAFER(71.9%), Mobile STICKER(70.8%) |
| 12 | 모바일 화면 워터마크 사용자 정보 표시 | Mobile STICKER | ✅ 1위 | **Mobile STICKER(78.9%)**, TRACER SDK Mobile(71.2%), Screen TRACER(71.2%), Mobile Capture SAFER(70.2%), Mobile SAFER(70.2%) |
| 13 | 모바일 스크린샷 캡처 방지 | Mobile Capture SAFER | ✅ 1위 | **Mobile Capture SAFER(77.0%)**, Mobile STICKER(72.5%), iScreen SAFER(72.2%), Screen SAFER(70.7%), Screen TRACER(69.8%) |
| 14 | iOS iPad iPhone 화면 캡처 방지 | iScreen SAFER | ✅ 1위 | **iScreen SAFER(77.5%)**, Mobile Capture SAFER(74.4%), Screen SAFER(71.4%), Screen TRACER(70.0%), Mobile STICKER(69.4%) |
| 15 | 군사 보안 국방 모바일 문서 보호 | 국방모바일보안 | ✅ 1위 | **국방모바일보안(81.4%)**, Mobile DOCS(76.1%), DRM(74.1%), Mobile SAFER(73.9%), TRACER SDK Mobile(72.8%) |
| 16 | 서버 DRM 연동 JAVA C 인터페이스 Unix | DS I/F (Server) | ✅ 1위 | **DS I/F Server(78.8%)**, DRM(72.8%), DS I/F Client(72.3%), Cowork SAFER(71.4%), Mobile SAFER(69.6%) |
| 17 | 클라이언트 DRM 연동 인터페이스 개발 | DS I/F (Client) | ✅ 1위 | **DS I/F Client(77.9%)**, DS I/F Server(74.1%), DRM(72.9%), Web SAFER(71.8%), DRM(71.3%) |
| 18 | KCMVP 암호모듈 인증 국가정보원 | MACRYPTO | ✅ 1위 | **MACRYPTO(78.8%)**, DRM(76.6%), 국방모바일보안(66.4%), DRM(66.1%), Document SAFER(66.0%) |
| 19 | PC 정보 유출 방지 USB 매체 제어 DLP | SafePC Enterprise | ✅ 2위 | SafeUSB(76.2%), **SafePC Enterprise(74.8%)**, Privacy SAFER(68.8%), Document SAFER(67.5%), Mobile STICKER(67.2%) |
| 20 | USB 저장매체 암호화 보안USB 발급 관리 | SafeUSB | ✅ 1위 | **SafeUSB(75.6%)**, Document SAFER(69.9%), Document SAFER(68.8%), Privacy SAFER(67.5%), Mobile SAFER(67.4%) |
| 21 | 전자문서 위변조 방지 증명서 수료증 진위 확인 | ePage SAFER, ePS Document DNA | ✅ 1,2위 | **ePS Document DNA(70.5%)**, **ePage SAFER(69.1%)**, Document SAFER(66.3%), Document SAFER(66.2%), DRM(65.5%) |
| 22 | 음성 바코드 시각장애인 접근성 | VoiceBarcode | ✅ 1위 | **VoiceBarcode(79.2%)**, Mobile STICKER(61.9%), Print TRACER(60.6%), TRACER SDK Screen(60.5%), TRACER SDK Mobile(60.3%) |
| 23 | 웹 전자문서 DRM Nexacro 브라우저 보안 | ePage SAFER WebDRM | ✅ 1위 | **ePage SAFER WebDRM(79.9%)**, Web SAFER(77.6%), Document SAFER(74.3%), DRM(72.3%), Mobile DOCS(72.2%) |
| 24 | 전자문서 병합 리포트 통합 출력 | ePS DocumentMerger | ✅ 1위 | **ePS DocumentMerger(75.2%)**, Document SAFER(68.4%), Print SAFER(68.1%), Document SAFER(68.1%), Document SAFER(68.0%) |
| 25 | Document DNA 디지털 지문 원본 검증 | ePS Document DNA | ✅ 1위 | **ePS Document DNA(77.2%)**, ePage SAFER(69.0%), Document SAFER(67.4%), Document SAFER(67.3%), Print TRACER(67.1%) |
| 26 | 화면 추적 SDK Add-in 3rd party 연동 | TRACER SDK Screen | ✅ 1위 | **TRACER SDK Screen(80.6%)**, TRACER SDK Print(76.8%), TRACER SDK Web(75.5%), TRACER SDK Mobile(74.8%), Screen TRACER(72.9%) |
| 27 | 출력물 추적 SDK 인쇄 워터마크 Add-in | TRACER SDK Print | ✅ 1위 | **TRACER SDK Print(81.7%)**, TRACER SDK Mobile(77.0%), TRACER SDK Screen(76.7%), Print TRACER(75.6%), TRACER SDK Web(74.5%) |
| 28 | 웹 시스템 문서 추적 서버사이드 SDK | TRACER SDK Web | ✅ 1위 | **TRACER SDK Web(80.5%)**, TRACER SDK Mobile(73.3%), TRACER SDK Print(73.1%), TRACER SDK Screen(72.8%), DS I/F Server(68.2%) |
| 29 | 모바일 앱 문서 추적 SDK Add-in | TRACER SDK Mobile | ✅ 1위 | **TRACER SDK Mobile(81.2%)**, TRACER SDK Web(75.2%), TRACER SDK Print(73.4%), TRACER SDK Screen(72.8%), Mobile DOCS(71.5%) |

## 복합질문 (7개)

| # | 쿼리 | 기대 제품 | 결과 | Top 5 (유사도%) |
|---|-------|-----------|------|-----------------|
| 30 | 인턴 교육 수료증 위변조 방지하고 교육자료 유출도 막고 싶습니다 | Document SAFER, Print TRACER, ePS Document DNA | ✅ 전부 | **Document SAFER(69.2%)**, SafeCopy(68.9%), **Print TRACER(68.0%)**, ContentSAFER(67.8%), **ePS Document DNA(67.7%)** |
| 31 | 문서 암호화도 하고 인쇄할 때 워터마크도 넣고 화면 캡처도 막고 싶어요 | Document SAFER, Print SAFER, Screen SAFER | ✅ 전부 | **Print SAFER(74.1%)**, **Document SAFER(73.4%)**, Print TRACER(73.3%), **Screen SAFER(72.9%)**, SafeCopy(72.7%) |
| 32 | 모바일에서 문서 보고 화면 캡처 방지하면서 워터마크도 넣고 싶습니다 | Mobile DOCS, Mobile Capture SAFER, Mobile STICKER | ✅ 전부 | **Mobile STICKER(75.8%)**, **Mobile Capture SAFER(74.7%)**, TRACER SDK Mobile(72.1%), iScreen SAFER(71.8%), **Mobile DOCS(71.5%)** |
| 33 | USB로 파일 반출 통제하고 PC에서 정보 유출도 방지하고 싶습니다 | SafeUSB, SafePC Enterprise | ✅ 1,2위 | **SafeUSB(74.1%)**, **SafePC Enterprise(73.5%)**, Document SAFER(68.7%), Privacy SAFER(68.6%), Document SAFER(67.1%) |
| 34 | 서버에서 문서 암호화하고 웹 브라우저에서 DRM 걸어서 보여주고 싶어요 | DS I/F (Server), Web SAFER | ✅ 전부 | **Web SAFER(76.3%)**, ePage SAFER WebDRM(75.9%), **DS I/F Server(74.7%)**, Mobile DOCS(73.7%), DRM(73.6%) |
| 35 | 영상 콘텐츠 저작권 보호하면서 출력물도 추적하고 싶습니다 | ContentSAFER, Print TRACER | ✅ 1,2위 | **ContentSAFER(74.2%)**, **Print TRACER(74.1%)**, SafeCopy(73.6%), TRACER SDK Print(72.2%), Print SAFER(71.1%) |
| 36 | 국방 환경에서 모바일 문서 보안하고 KCMVP 인증 암호모듈 적용하고 싶습니다 | 국방모바일보안, MACRYPTO | ✅ 1,2위 | **국방모바일보안(78.3%)**, **MACRYPTO(76.1%)**, Mobile DOCS(75.3%), DRM(74.8%), Mobile SAFER(73.7%) |

## 미세조정 이력

- ES SAFER → Document SAFER 통합 (동일 제품, 내부 버전관리 명칭)
- 제품 경계 규칙 적용: 위변조방지=ePage SAFER 전용, 비가시성=TRACER 제품군 전용
- Document SAFER 워터마크 표현 수정: DRM 암호화 문서에 한해 출력 지원(범용 아님)
- Screen SAFER/Screen TRACER 역할 분리 명확화
- 전 제품 useCases 교차참조 정리 (cross-reference)
- LEGACY_CHUNKS Document SAFER 주요기능 청크 워터마크 표현 수정
