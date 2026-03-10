# 마크애니 RAG 복합질문 50개 테스트 결과

> 테스트 일시: 2026-03-10
> 총 청크: 39개 (시트 28 + 레거시 11)
> 임베딩 모델: gemini-embedding-001
> 완전 매칭: **34/50 (68.0%)** | 부분 매칭: **16/50 (32.0%)** | 미매칭: **0/50 (0%)**
> 부분 포함 정확도: **100%**

---

## 2제품 조합 (20개)

| # | 쿼리 | 기대 제품 | 결과 | Top 5 (유사도%) |
|---|-------|-----------|------|-----------------|
| 1 | 문서 암호화하면서 인쇄할 때 워터마크도 넣고 싶어요 | Document SAFER, Print SAFER | ✅ | **Print SAFER(74.3%)**, Print TRACER(72.8%), **Document SAFER(72.4%)**, SafeCopy(71.8%), TRACER SDK Print(70.6%) |
| 2 | 사내 문서 암호화하고 화면 캡처도 차단하고 싶습니다 | Document SAFER, Screen SAFER | ✅ | **Screen SAFER(74.7%)**, **Document SAFER(74.0%)**, Document SAFER(73.4%), iScreen SAFER(73.0%), Document SAFER(73.0%) |
| 3 | 문서 암호화랑 개인정보 탐지를 같이 하고 싶어요 | Document SAFER, Privacy SAFER | ✅ | **Privacy SAFER(75.6%)**, **Document SAFER(73.7%)**, Document SAFER(73.4%), Document SAFER(72.7%), DS I/F Client(71.4%) |
| 4 | PC에서 파일 유출 막고 USB도 통제하고 싶습니다 | SafePC Enterprise, SafeUSB | ✅ | **SafeUSB(73.5%)**, **SafePC Enterprise(73.0%)**, Document SAFER(69.1%), Privacy SAFER(68.6%), Document SAFER(67.7%) |
| 5 | 모바일에서 문서 보면서 캡처 방지도 하고 싶어요 | Mobile DOCS, Mobile Capture SAFER | ✅ | **Mobile Capture SAFER(77.0%)**, Mobile STICKER(73.3%), iScreen SAFER(73.0%), **Mobile DOCS(73.0%)**, TRACER SDK Mobile(70.7%) |
| 6 | 모바일 문서 암호화하면서 화면에 워터마크도 넣고 싶습니다 | Mobile SAFER, Mobile STICKER | ✅ | **Mobile STICKER(77.7%)**, TRACER SDK Mobile(74.1%), **Mobile SAFER(73.9%)**, Mobile DOCS(72.8%), 국방모바일보안(71.1%) |
| 7 | 서버랑 클라이언트 양쪽에서 DRM 연동 개발해야 합니다 | DS I/F (Server), DS I/F (Client) | ✅ | **DS I/F Client(75.5%)**, **DS I/F Server(75.5%)**, DRM(73.7%), Web SAFER(72.6%), DRM(72.0%) |
| 8 | 전자문서 위변조 방지하고 원본 검증도 하고 싶어요 | ePage SAFER, ePS Document DNA | ✅ | **ePS Document DNA(74.2%)**, **ePage SAFER(73.5%)**, Document SAFER(72.3%), Document SAFER(71.5%), Document SAFER(71.1%) |
| 9 | 웹에서 문서 DRM 걸고 브라우저 보안도 적용하고 싶습니다 | Web SAFER, ePage SAFER WebDRM | ✅ | **Web SAFER(78.7%)**, **ePage SAFER WebDRM(77.2%)**, DRM(75.1%), Document SAFER(74.4%), DRM(73.7%) |
| 10 | 출력물이랑 화면 둘 다 비가시성 워터마크로 추적하고 싶어요 | Print TRACER, Screen TRACER | ✅ | **Print TRACER(77.9%)**, **Screen TRACER(76.6%)**, TRACER SDK Print(75.9%), SafeCopy(75.7%), TRACER SDK Screen(75.2%) |
| 11 | 국방 환경에서 모바일 보안하면서 KCMVP 암호모듈도 써야 합니다 | 국방모바일보안, MACRYPTO | ✅ | **국방모바일보안(77.4%)**, **MACRYPTO(75.5%)**, DRM(74.4%), Mobile SAFER(72.0%), Mobile DOCS(71.6%) |
| 12 | 영상 콘텐츠 보호하면서 출력물 추적도 하고 싶습니다 | ContentSAFER, Print TRACER | ✅ | **Print TRACER(75.3%)**, SafeCopy(74.5%), **ContentSAFER(74.5%)**, TRACER SDK Print(73.4%), Print SAFER(72.5%) |
| 13 | 아이폰이랑 안드로이드 둘 다 캡처 방지해야 합니다 | iScreen SAFER, Mobile Capture SAFER | ✅ | **Mobile Capture SAFER(74.6%)**, **iScreen SAFER(71.9%)**, Mobile STICKER(68.5%), Screen SAFER(68.1%), Screen TRACER(66.9%) |
| 14 | 협력사에 문서 보내면서 DRM 보안도 유지하고 싶어요 | Cowork SAFER, Document SAFER | ✅ | **Cowork SAFER(73.9%)**, DRM(73.7%), DRM(71.6%), DRM(71.4%), **Document SAFER(70.7%)** |
| 15 | PC 정보유출 방지하면서 개인정보 파일도 탐지하고 싶습니다 | SafePC Enterprise, Privacy SAFER | ✅ | **Privacy SAFER(74.1%)**, **SafePC Enterprise(72.5%)**, SafeUSB(69.0%), Document SAFER(68.8%), Document SAFER(68.2%) |
| 16 | 화면 캡처 차단하면서 비가시성 워터마크도 넣고 싶어요 | Screen SAFER, Screen TRACER | ✅ | **Screen TRACER(74.9%)**, **Screen SAFER(73.0%)**, Mobile STICKER(72.5%), TRACER SDK Screen(71.8%), Print TRACER(71.0%) |
| 17 | 여러 문서 병합하고 위변조 방지도 적용하고 싶습니다 | ePS DocumentMerger, ePage SAFER | 🟡 | **ePS DocumentMerger(74.2%)**, Document SAFER(70.9%), Document SAFER(70.8%), Document SAFER(69.1%), ePS Document DNA(68.5%) — ⚠️ ePage SAFER 미검출 |
| 18 | 서버에서 암호화하고 웹 브라우저에서 보여주고 싶어요 | DS I/F (Server), Web SAFER | ✅ | **DS I/F Server(70.7%)**, **Web SAFER(70.6%)**, ePage SAFER WebDRM(70.4%), DRM(68.1%), DS I/F Client(67.8%) |
| 19 | 모바일에서 문서 열람하면서 사용자 정보 워터마크도 표시하고 싶어요 | Mobile DOCS, Mobile STICKER | ✅ | **Mobile STICKER(73.8%)**, TRACER SDK Mobile(71.3%), **Mobile DOCS(71.1%)**, Mobile SAFER(69.1%), 국방모바일보안(65.6%) |
| 20 | USB로 문서 반출할 때 암호화 유지하면서 매체 통제도 하고 싶습니다 | SafeUSB, Document SAFER | ✅ | **SafeUSB(73.3%)**, **Document SAFER(71.9%)**, Document SAFER(69.8%), Document SAFER(69.2%), Print SAFER(68.8%) |

---

## 3제품 조합 (20개)

| # | 쿼리 | 기대 제품 | 결과 | Top 5 (유사도%) |
|---|-------|-----------|------|-----------------|
| 21 | 문서 암호화, 인쇄 워터마크, 화면 캡처 방지 세 가지 다 필요합니다 | Document SAFER, Print SAFER, Screen SAFER | ✅ | **Screen SAFER(74.6%)**, **Print SAFER(74.2%)**, **Document SAFER(73.7%)**, Print TRACER(73.6%), Document SAFER(73.3%) |
| 22 | 모바일에서 문서 보고 캡처 방지하고 워터마크도 넣어야 합니다 | Mobile DOCS, Mobile Capture SAFER, Mobile STICKER | ✅ | **Mobile STICKER(75.9%)**, **Mobile Capture SAFER(75.2%)**, TRACER SDK Mobile(73.0%), **Mobile DOCS(72.5%)**, Mobile SAFER(72.3%) |
| 23 | 문서 암호화하고 개인정보 탐지하고 PC 유출도 방지해야 합니다 | Document SAFER, Privacy SAFER, SafePC Enterprise | 🟡 | **Privacy SAFER(76.5%)**, **Document SAFER(76.2%)**, Document SAFER(75.6%), Document SAFER(73.8%), Mobile DOCS(71.2%) — ⚠️ SafePC Enterprise 미검출 |
| 24 | 전자문서 위변조 방지하고 원본 검증하면서 웹에서도 보안 적용하고 싶어요 | ePage SAFER, ePS Document DNA, ePage SAFER WebDRM | ✅ | **ePage SAFER WebDRM(75.1%)**, **ePage SAFER(75.1%)**, **ePS Document DNA(74.5%)**, Web SAFER(73.4%), Document SAFER(72.2%) |
| 25 | 서버 클라이언트 양쪽 DRM 연동하고 웹에서도 보여줘야 합니다 | DS I/F (Server), DS I/F (Client), Web SAFER | ✅ | **Web SAFER(75.6%)**, **DS I/F Server(75.0%)**, DRM(74.5%), ePage SAFER WebDRM(74.5%), **DS I/F Client(74.3%)** |
| 26 | 출력물 추적, 화면 추적, 영상 콘텐츠 보호 전부 필요합니다 | Print TRACER, Screen TRACER, ContentSAFER | 🟡 | **Print TRACER(77.2%)**, **Screen TRACER(76.0%)**, TRACER SDK Print(75.8%), SafeCopy(75.7%), TRACER SDK Screen(75.2%) — ⚠️ ContentSAFER 미검출 |
| 27 | 문서 암호화하고 협력사 반출 제어하면서 USB도 통제해야 합니다 | Document SAFER, Cowork SAFER, SafeUSB | 🟡 | **SafeUSB(72.8%)**, **Document SAFER(71.5%)**, Document SAFER(71.3%), Document SAFER(68.8%), Privacy SAFER(67.9%) — ⚠️ Cowork SAFER 미검출 |
| 28 | 국방 모바일 보안에 문서 뷰어랑 KCMVP 암호모듈 적용해야 합니다 | 국방모바일보안, Mobile DOCS, MACRYPTO | ✅ | **국방모바일보안(77.2%)**, **Mobile DOCS(75.5%)**, **MACRYPTO(75.1%)**, DRM(72.5%), Mobile SAFER(71.9%) |
| 29 | 문서 암호화하고 화면 캡처 막으면서 출력물도 추적하고 싶어요 | Document SAFER, Screen SAFER, Print TRACER | ✅ | **Print TRACER(74.6%)**, **Document SAFER(73.8%)**, SafeCopy(73.8%), Print SAFER(73.0%), **Screen SAFER(72.7%)** |
| 30 | 안드로이드 iOS 모바일 전부 문서 보안하고 캡처 방지해야 합니다 | Mobile SAFER, Mobile Capture SAFER, iScreen SAFER | ✅ | **Mobile Capture SAFER(79.0%)**, **iScreen SAFER(76.4%)**, Mobile DOCS(75.8%), Mobile STICKER(75.7%), **Mobile SAFER(74.3%)** |
| 31 | PC 유출 방지, USB 통제, 개인정보 탐지 세 가지 다 해야 합니다 | SafePC Enterprise, SafeUSB, Privacy SAFER | ✅ | **SafePC Enterprise(74.7%)**, **SafeUSB(73.9%)**, **Privacy SAFER(73.6%)**, Document SAFER(70.8%), Document SAFER(69.9%) |
| 32 | 웹에서 전자문서 DRM 걸고 병합하면서 위변조 방지도 해야 합니다 | ePage SAFER WebDRM, ePS DocumentMerger, ePage SAFER | 🟡 | **ePage SAFER WebDRM(75.7%)**, **ePS DocumentMerger(75.1%)**, Web SAFER(74.9%), Document SAFER(74.4%), DRM(73.5%) — ⚠️ ePage SAFER 미검출 |
| 33 | 사내 문서 암호화하고 모바일에서 열람하면서 캡처도 방지해야 합니다 | Document SAFER, Mobile DOCS, Mobile Capture SAFER | ✅ | **Mobile DOCS(76.9%)**, **Mobile Capture SAFER(74.2%)**, Mobile SAFER(73.9%), 국방모바일보안(73.1%), **Document SAFER(72.3%)** |
| 34 | 화면, 출력, 웹 전부 추적 SDK로 연동해야 합니다 | TRACER SDK Screen, TRACER SDK Print, TRACER SDK Web | ✅ | **TRACER SDK Screen(78.1%)**, **TRACER SDK Print(77.4%)**, **TRACER SDK Web(77.3%)**, TRACER SDK Mobile(76.0%), Screen TRACER(72.6%) |
| 35 | 문서 암호화하고 서버 DRM 연동하면서 KCMVP 암호모듈도 적용해야 합니다 | Document SAFER, DS I/F (Server), MACRYPTO | ✅ | **MACRYPTO(77.2%)**, **DS I/F Server(75.2%)**, **Document SAFER(75.2%)**, DRM(75.2%), DRM(74.3%) |
| 36 | 인쇄 워터마크 넣고 출력물 추적하면서 화면 캡처도 막아야 합니다 | Print SAFER, Print TRACER, Screen SAFER | 🟡 | **Print TRACER(77.1%)**, SafeCopy(76.3%), **Print SAFER(75.3%)**, TRACER SDK Print(75.0%), Screen TRACER(74.9%) — ⚠️ Screen SAFER 미검출 |
| 37 | 모바일 화면 워터마크 넣고 캡처 방지하면서 추적 SDK도 연동해야 합니다 | Mobile STICKER, Mobile Capture SAFER, TRACER SDK Mobile | ✅ | **Mobile STICKER(76.8%)**, **TRACER SDK Mobile(76.3%)**, TRACER SDK Screen(75.9%), Screen TRACER(75.1%), **Mobile Capture SAFER(74.1%)** |
| 38 | 협력사 문서 반출 제어하면서 웹 보안이랑 DRM도 적용해야 합니다 | Cowork SAFER, Web SAFER, Document SAFER | ✅ | **Web SAFER(75.4%)**, **Cowork SAFER(75.1%)**, ePage SAFER WebDRM(74.6%), DRM(74.3%), **Document SAFER(72.9%)** |
| 39 | 전자문서 위변조 방지하고 음성 바코드랑 디지털 지문도 넣어야 합니다 | ePage SAFER, VoiceBarcode, ePS Document DNA | ✅ | **ePS Document DNA(73.8%)**, **VoiceBarcode(73.8%)**, **ePage SAFER(71.4%)**, Document SAFER(70.9%), Print TRACER(69.8%) |
| 40 | 문서 암호화하고 개인정보 보호하면서 화면 캡처도 차단해야 합니다 | Document SAFER, Privacy SAFER, Screen SAFER | 🟡 | **Screen SAFER(75.0%)**, Screen TRACER(72.9%), Mobile Capture SAFER(72.8%), iScreen SAFER(72.6%), **Document SAFER(72.6%)** — ⚠️ Privacy SAFER 미검출 |

---

## 4제품 이상 조합 + 시나리오형 (10개)

| # | 쿼리 | 기대 제품 | 결과 | Top 5 (유사도%) |
|---|-------|-----------|------|-----------------|
| 41 | 대기업에서 문서 암호화, 인쇄 보안, 화면 보안, USB 통제 전부 도입하고 싶습니다 | Document SAFER, Print SAFER, Screen SAFER, SafePC Enterprise | 🟡 | DRM(72.9%), **Document SAFER(72.9%)**, Document SAFER(72.4%), Document SAFER(72.1%), DRM(70.7%) — ⚠️ Print SAFER, Screen SAFER, SafePC Enterprise 미검출 |
| 42 | 공공기관에서 문서 DRM 적용하고 개인정보 보호하면서 KCMVP 인증도 받아야 합니다 | Document SAFER, Privacy SAFER, MACRYPTO | 🟡 | DRM(77.0%), **MACRYPTO(76.1%)**, DRM(74.0%), DRM(73.7%), DRM(73.1%) — ⚠️ Document SAFER, Privacy SAFER 미검출 |
| 43 | 금융기관에서 문서 암호화하고 출력물 추적하면서 개인정보 탐지도 해야 합니다 | Document SAFER, Print TRACER, Privacy SAFER | ✅ | SafeCopy(75.5%), **Document SAFER(72.9%)**, Document SAFER(72.4%), **Print TRACER(71.8%)**, **Privacy SAFER(71.8%)** |
| 44 | 제조업에서 CAD 설계문서 암호화하고 외부 반출 제어하면서 USB도 통제해야 합니다 | Document SAFER, Cowork SAFER, SafeUSB | 🟡 | **Document SAFER(70.1%)**, **SafeUSB(69.6%)**, Document SAFER(68.9%), Document SAFER(67.9%), DRM(67.4%) — ⚠️ Cowork SAFER 미검출 |
| 45 | 모바일 오피스에서 문서 열람, 캡처 방지, 워터마크, 문서 암호화 전부 필요합니다 | Mobile DOCS, Mobile Capture SAFER, Mobile STICKER, Mobile SAFER | 🟡 | **Mobile DOCS(78.0%)**, **Mobile SAFER(76.6%)**, **Mobile STICKER(76.6%)**, 국방모바일보안(75.7%), TRACER SDK Mobile(75.3%) — ⚠️ Mobile Capture SAFER 미검출 |
| 46 | 웹 기반 업무 시스템에서 문서 DRM 걸고 위변조 방지하면서 추적도 해야 합니다 | Web SAFER, ePage SAFER, TRACER SDK Web | 🟡 | ePage SAFER WebDRM(75.0%), **Web SAFER(74.3%)**, Document SAFER(73.9%), DRM(73.4%), Document SAFER(73.3%) — ⚠️ ePage SAFER, TRACER SDK Web 미검출 |
| 47 | 학교에서 수료증 위변조 방지하고 교육자료 유출 막으면서 온라인 시험 화면도 보호해야 합니다 | ePage SAFER, Document SAFER, Screen SAFER | 🟡 | Screen TRACER(70.0%), **Screen SAFER(69.6%)**, TRACER SDK Screen(68.6%), iScreen SAFER(68.5%), Mobile STICKER(67.7%) — ⚠️ ePage SAFER, Document SAFER 미검출 |
| 48 | 군에서 모바일 문서 보안하고 KCMVP 적용하면서 화면 캡처도 방지해야 합니다 | 국방모바일보안, MACRYPTO, Mobile Capture SAFER | 🟡 | **Mobile Capture SAFER(75.9%)**, **국방모바일보안(73.7%)**, iScreen SAFER(72.6%), Screen SAFER(72.1%), Mobile STICKER(71.2%) — ⚠️ MACRYPTO 미검출 |
| 49 | 방송사에서 영상 콘텐츠 보호하면서 대본 문서 유출도 막고 출력물도 추적하고 싶습니다 | ContentSAFER, Document SAFER, Print TRACER | 🟡 | SafeCopy(75.3%), **ContentSAFER(74.3%)**, **Print TRACER(73.7%)**, Print SAFER(72.1%), TRACER SDK Print(72.0%) — ⚠️ Document SAFER 미검출 |
| 50 | 연구소에서 연구문서 암호화하고 서버 DRM 연동하면서 화면 캡처 방지랑 출력 추적도 해야 합니다 | Document SAFER, DS I/F (Server), Screen SAFER, Print TRACER | 🟡 | **Screen SAFER(75.5%)**, **Document SAFER(74.9%)**, Document SAFER(74.8%), DRM(74.2%), Screen TRACER(73.9%) — ⚠️ DS I/F (Server), Print TRACER 미검출 |

---

## 부분 매칭 상세 (16건)

| # | 쿼리 | 미검출 제품 |
|---|-------|-------------|
| 17 | 여러 문서 병합하고 위변조 방지도 적용하고 싶습니다 | ePage SAFER |
| 23 | 문서 암호화하고 개인정보 탐지하고 PC 유출도 방지해야 합니다 | SafePC Enterprise |
| 26 | 출력물 추적, 화면 추적, 영상 콘텐츠 보호 전부 필요합니다 | ContentSAFER |
| 27 | 문서 암호화하고 협력사 반출 제어하면서 USB도 통제해야 합니다 | Cowork SAFER |
| 32 | 웹에서 전자문서 DRM 걸고 병합하면서 위변조 방지도 해야 합니다 | ePage SAFER |
| 36 | 인쇄 워터마크 넣고 출력물 추적하면서 화면 캡처도 막아야 합니다 | Screen SAFER |
| 40 | 문서 암호화하고 개인정보 보호하면서 화면 캡처도 차단해야 합니다 | Privacy SAFER |
| 41 | 대기업에서 문서 암호화, 인쇄 보안, 화면 보안, USB 통제 전부 도입하고 싶습니다 | Print SAFER, Screen SAFER, SafePC Enterprise |
| 42 | 공공기관에서 문서 DRM 적용하고 개인정보 보호하면서 KCMVP 인증도 받아야 합니다 | Document SAFER, Privacy SAFER |
| 44 | 제조업에서 CAD 설계문서 암호화하고 외부 반출 제어하면서 USB도 통제해야 합니다 | Cowork SAFER |
| 45 | 모바일 오피스에서 문서 열람, 캡처 방지, 워터마크, 문서 암호화 전부 필요합니다 | Mobile Capture SAFER |
| 46 | 웹 기반 업무 시스템에서 문서 DRM 걸고 위변조 방지하면서 추적도 해야 합니다 | ePage SAFER, TRACER SDK Web |
| 47 | 학교에서 수료증 위변조 방지하고 교육자료 유출 막으면서 온라인 시험 화면도 보호해야 합니다 | ePage SAFER, Document SAFER |
| 48 | 군에서 모바일 문서 보안하고 KCMVP 적용하면서 화면 캡처도 방지해야 합니다 | MACRYPTO |
| 49 | 방송사에서 영상 콘텐츠 보호하면서 대본 문서 유출도 막고 출력물도 추적하고 싶습니다 | Document SAFER |
| 50 | 연구소에서 연구문서 암호화하고 서버 DRM 연동하면서 화면 캡처 방지랑 출력 추적도 해야 합니다 | DS I/F (Server), Print TRACER |
