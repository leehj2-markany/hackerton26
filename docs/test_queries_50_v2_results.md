# RAG 테스트 쿼리 50개 v2 결과

> 최종 실행일: 2026-03-11 (TASK 13 Deep Research 완료 후 재테스트)
> 목적: 자연어 패턴 + 경계 케이스 + 업종별 시나리오 기반 RAG 정확도 평가
> 임베딩 모델: gemini-embedding-001 (3072차원)
> 검색: pgvector `match_knowledge` RPC (top5) + dedupByProduct
> 총 청크: 85개 (SHEET_PRODUCTS 28 + HYPERLINK_CHUNKS 25 + DEEP_RESEARCH_CHUNKS 23 + LEGACY_CHUNKS 9)

---

## 종합 결과

### 최신 (TASK 13 Deep Research 완료 후)

| 항목 | 값 |
|------|-----|
| 총 쿼리 | 50개 |
| ✅ 완전 매칭 | 44개 (88.0%) |
| 🟡 부분 매칭 | 5개 |
| ❌ 미매칭 | 1개 |
| 부분 포함 정확도 | 98.0% |

### 이전 (TASK 12 기준, 62 chunks)

| 항목 | 값 |
|------|-----|
| ✅ 완전 매칭 | 45개 (90.0%) |
| 부분 포함 정확도 | 98.0% |
| 총 청크 | 62개 |

### 변화 분석
- 완전 매칭 90%→88% (-2%): Deep Research 23개 청크 추가로 Document SAFER/SafePC 등 상세 청크가 많아지면서 복합 시나리오에서 일부 제품 슬롯이 밀림
- 부분 포함 98%→98%: 동일 유지 — 핵심 제품은 top5 내에 항상 포함
- 사용자 피드백 기반 기대값 보정 시 (#37, #39) 실질 정확도 46/50 (92%) / 98%
- Deep Research 청크 추가로 정책 상세/CAD 매트릭스/SDK API/매뉴얼 등 심층 질문 대응력 대폭 향상

## 카테고리별 정확도

| 카테고리 | 결과 | 정확도 |
|----------|------|--------|
| A. 간접표현/유의어 (제품명 없이 의도만) | 10/10 | 100% |
| B. 경계혼동 케이스 (유사 제품 구분) | 10/10 | 100% |
| C. 업종별 시나리오 (단일 제품) | 10/10 | 100% |
| D. SDK/연동 (개발자 관점) | 5/5 | 100% |
| E. 복합 시나리오 (다중 제품) | 5/10 | 50% |
| F. 엣지 케이스 | 4/5 | 80% |

## TASK 13에서 적용된 개선사항

1. **Deep Research 4-agent 크롤링**: Google Drive 전체 문서 트리 탐색 (IST 표준기능정의서, 정책정의서, DRM SW 표준기능정의서, 프로젝트 스펙정의서, 모듈담당자, 15+ 매뉴얼 폴더)
2. **23개 Deep Research 청크 추가**:
   - Part 1 (10개): CCF 정책 필드, 문서교환정책 코드, QDRM_EX, MIP 연동, 배치암호화, CipherTool, Print/Privacy/Screen SAFER WEB 정책
   - Part 2 (6개): CAD/OA 지원 매트릭스, SafePC V7.0 보안관리 상세, MS오피스 MIP 매트릭스, 포트 정의/인사연동, Screen TRACER 고객사 스펙
   - Part 3 (7개): WebSAFER ACL 적용, Mobile Capture SAFER SDK API, Cowork SAFER 변환툴, ePageSAFER WebDRM 개발자 매뉴얼, Screen SAFER 관리자 매뉴얼, Mobile DOCS 관리자 매뉴얼, ES SAFER 클라이언트 환경
3. **총 청크 62→85개** (37% 증가)

## 부분 매칭 / 미매칭 상세

### 🟡 부분 매칭 (5건)

| # | 쿼리 | 기대 | 미검출 | 분석 |
|---|------|------|--------|------|
| 36 | 재택근무 문서 유출방지 + 캡처방지 | Document SAFER, Screen SAFER | Document SAFER | Screen SAFER가 "캡처방지" 시그널 독점. dedupByProduct로 Document SAFER 슬롯 밀림 |
| 37 | 태블릿 작업지시서 캡처방지+워터마크 | Mobile Capture SAFER | Mobile DOCS, Mobile STICKER | 사용자 피드백: "mobile docs 해당안됨, mobile sticker 해당안됨" → 기대값 보정 필요 |
| 39 | 협력사 도면 열람기간+인쇄통제 | Cowork SAFER, Print SAFER | Print SAFER | 사용자 피드백: "협력사에 에이전트 설치 불가하면 Print SAFER 제안 불가" → 기대값 보정 필요 |
| 40 | 클라우드 전환 + 웹 DRM | Document SAFER, Web SAFER | Web SAFER | ePage SAFER for Web DRM이 5위에 있으나 Web SAFER 미검출 |
| 42 | PC유출방지+USB+개인정보 | SafePC, SafeUSB, Privacy SAFER | Privacy SAFER | SafePC Enterprise deep research 청크가 개인정보보호 옵션을 상세히 포함하여 Privacy SAFER 슬롯 밀림 |

### ❌ 미매칭 (1건)

| # | 쿼리 | 기대 | 실제 1위 | 분석 |
|---|------|------|----------|------|
| 46 | DRM 암호화 문서 인쇄 시 워터마크 | Document SAFER | Print SAFER [74.3%] | "인쇄+워터마크" 시그널이 Print SAFER로 강하게 끌림. Document SAFER의 부가기능이지만 벡터 공간에서 Print SAFER가 더 가까움 |

## 전체 쿼리 결과 (50건)

| # | 카테고리 | 쿼리 | 기대 제품 | 결과 | Top1 [유사도] | 미검출 |
|---|----------|------|-----------|------|---------------|--------|
| 1 | A.간접표현 | 직원들이 퇴사할 때 회사 문서 가져가는 걸 막고 싶어요 | Document SAFER | ✅ | Document SAFER [68.6%] | - |
| 2 | A.간접표현 | 화면 스크린샷 찍는 거 막을 수 있나요 | Screen SAFER | ✅ | Mobile Capture SAFER [71.3%] | - |
| 3 | A.간접표현 | 직원들이 USB에 파일 복사해서 빼돌리는 걸 차단하고 싶습니다 | SafeUSB | ✅ | SafeUSB [70.3%] | - |
| 4 | A.간접표현 | 개인정보보호법 준수를 위해 사내 파일에서 주민번호 같은 거 자동으로 찾아야 합니다 | Privacy SAFER | ✅ | Privacy SAFER [73.8%] | - |
| 5 | A.간접표현 | 누가 어떤 문서를 프린터로 출력했는지 추적하고 싶어요 | Print TRACER | ✅ | Print TRACER [71.4%] | - |
| 6 | A.간접표현 | 출장 중에 스마트폰으로 사내 문서 볼 수 있게 해주세요 | Mobile DOCS | ✅ | Mobile DOCS [75.1%] | - |
| 7 | A.간접표현 | 외주 업체한테 도면 보내야 하는데 유출 안 되게 하고 싶어요 | Cowork SAFER | ✅ | Document SAFER [68.2%] | - |
| 8 | A.간접표현 | 크롬에서 사내 문서 열 때 다운로드 못 하게 막고 싶습니다 | Web SAFER | ✅ | Document SAFER [69.8%] | - |
| 9 | A.간접표현 | 프린트할 때 자동으로 출력자 이름이 찍히게 하고 싶어요 | Print SAFER | ✅ | Print TRACER [70.4%] | - |
| 10 | A.간접표현 | 국가정보원 암호모듈 검증 받은 솔루션이 필요합니다 | MACRYPTO V3.0 (KCMVP) | ✅ | MACRYPTO V3.0 (KCMVP) [75.8%] | - |
| 11 | B.경계혼동 | 화면에 보이지 않는 워터마크를 넣어서 유출자를 추적하고 싶어요 | Screen TRACER | ✅ | Screen TRACER [77.0%] | - |
| 12 | B.경계혼동 | 화면 캡처 자체를 원천 차단하고 싶습니다 | Screen SAFER | ✅ | Screen SAFER [74.9%] | - |
| 13 | B.경계혼동 | 출력물에 눈에 안 보이는 추적 코드를 넣고 싶어요 | Print TRACER | ✅ | Print TRACER [76.4%] | - |
| 14 | B.경계혼동 | 인쇄할 때 눈에 보이는 워터마크를 넣어서 무단 복사를 억제하고 싶어요 | Print SAFER | ✅ | Print TRACER [73.8%] | - |
| 15 | B.경계혼동 | ES SAFER 도입을 검토하고 있습니다 | Document SAFER | ✅ | Document SAFER [75.3%] | - |
| 16 | B.경계혼동 | 모바일 화면에 사용자 정보 워터마크를 표시하고 싶어요 | Mobile STICKER | ✅ | Mobile STICKER [71.2%] | - |
| 17 | B.경계혼동 | 직원 스마트폰 카메라랑 녹음 기능을 차단하고 싶습니다 | Mobile STICKER | ✅ | Mobile Capture SAFER [71.1%] | - |
| 18 | B.경계혼동 | PDF 문서를 보안 뷰어로 유통하고 싶습니다 | ePS DocumentMerger | ✅ | ePS DocumentMerger [72.5%] | - |
| 19 | B.경계혼동 | 전자 증명서의 진위 여부를 확인할 수 있는 솔루션이 필요합니다 | ePS Document DNA | ✅ | ePS Document DNA [73.0%] | - |
| 20 | B.경계혼동 | 전자문서에 위변조 방지 기능을 적용하고 싶습니다 | ePage SAFER | ✅ | ePS Document DNA [74.5%] | - |

| 21 | C.업종별 | 반도체 설계 도면이 외부로 유출되지 않도록 보호해야 합니다 | Document SAFER | ✅ | DRM [69.1%] | - |
| 23 | C.업종별 | 은행에서 고객 개인정보가 포함된 파일을 자동 탐지해야 합니다 | Privacy SAFER | ✅ | Privacy SAFER [72.8%] | - |
| 24 | C.업종별 | 병원에서 환자 진료기록 출력 시 추적 코드를 넣어야 합니다 | Print TRACER | ✅ | Print TRACER [69.8%] | - |
| 25 | C.업종별 | 온라인 시험 중 학생들이 화면 캡처하는 걸 막아야 합니다 | Screen SAFER | ✅ | Screen SAFER [71.5%] | - |
| 26 | C.업종별 | 로펌에서 계약서 원본의 위변조 여부를 검증해야 합니다 | ePS Document DNA | ✅ | ePS Document DNA [63.6%] | - |
| 27 | C.업종별 | 건설 현장에서 도면을 모바일로 보면서 캡처 방지해야 합니다 | Mobile Capture SAFER | ✅ | Mobile Capture SAFER [75.6%] | - |
| 28 | C.업종별 | 제약회사 연구 데이터를 USB로 반출할 때 암호화해야 합니다 | SafeUSB | ✅ | SafeUSB [69.2%] | - |
| 29 | C.업종별 | 정부 기관에서 민원 서류의 위변조를 방지해야 합니다 | ePage SAFER | ✅ | ePS Document DNA [69.1%] | - |
| 30 | C.업종별 | 방송 대본이 촬영 현장에서 유출되지 않도록 화면 워터마크를 넣어야 합니다 | Screen TRACER | ✅ | Screen TRACER [71.4%] | - |
| 31 | D.SDK | 우리 앱에 화면 워터마크 기능을 SDK로 연동하고 싶습니다 | TRACER SDK for Screen | ✅ | TRACER SDK for Screen [77.4%] | - |
| 32 | D.SDK | 자체 인쇄 시스템에 출력 추적 기능을 Add-in으로 넣고 싶어요 | TRACER SDK for Print | ✅ | TRACER SDK for Print [77.2%] | - |
| 33 | D.SDK | 웹 애플리케이션에 서버사이드 문서 추적을 연동해야 합니다 | TRACER SDK for Web | ✅ | TRACER SDK for Web [77.7%] | - |
| 34 | D.SDK | 모바일 앱에 비가시성 워터마크 추적 기능을 넣어야 합니다 | TRACER SDK for Mobile | ✅ | TRACER SDK for Mobile [79.6%] | - |
| 35 | D.SDK | Java 서버에서 DRM 암호화/복호화 API를 호출해야 합니다 | Document SAFER I/F (Server) | ✅ | Document SAFER I/F (Server) [73.6%] | - |
| 36 | E.복합 | 재택근무 직원들이 집에서 문서 작업할 때 유출 방지하면서 화면 캡처도 막아야 합니다 | Document SAFER, Screen SAFER | 🟡 | Screen SAFER [74.0%] | Document SAFER |
| 37 | E.복합 | 공장에서 태블릿으로 작업지시서 보면서 캡처 방지하고 워터마크도 넣어야 합니다 | Mobile DOCS, Mobile Capture SAFER, Mobile STICKER | 🟡 | Screen TRACER [71.4%] | Mobile DOCS, Mobile STICKER |
| 38 | E.복합 | 감사 대비해서 누가 어떤 문서를 출력하고 화면 캡처했는지 전부 추적해야 합니다 | Print TRACER, Screen TRACER | ✅ | Print TRACER [72.5%] | - |
| 39 | E.복합 | 협력사에 설계 도면 보내면서 열람 기간 제한하고 인쇄도 통제하고 싶어요 | Cowork SAFER, Print SAFER | 🟡 | Cowork SAFER [70.6%] | Print SAFER |
| 40 | E.복합 | 온프레미스에서 클라우드로 전환하면서 문서 보안이랑 웹 DRM을 같이 적용해야 합니다 | Document SAFER, Web SAFER | 🟡 | Document SAFER [74.3%] | Web SAFER |

| 41 | E.복합 | 시각장애인도 바코드를 읽을 수 있는 음성 안내 솔루션이 필요합니다 | VoiceBarcode | ✅ | VoiceBarcode [76.2%] | - |
| 42 | E.복합 | 전사적으로 PC 정보유출 방지하면서 USB 통제하고 개인정보도 탐지해야 합니다 | SafePC Enterprise, SafeUSB, Privacy SAFER | 🟡 | SafePC Enterprise [75.1%] | Privacy SAFER |
| 43 | E.복합 | 직원 스마트폰 관리하면서 사내 문서도 안전하게 열람하게 하고 싶어요 | Mobile SAFER, Mobile DOCS | ✅ | Mobile DOCS [75.4%] | - |
| 44 | E.복합 | 온라인으로 발급하는 증명서에 위변조 방지랑 디지털 지문을 넣어야 합니다 | ePage SAFER, ePS Document DNA | ✅ | ePS Document DNA [72.0%] | - |
| 45 | E.복합 | 아이패드로 사내 문서 열람할 때 화면 캡처를 막아야 합니다 | iScreen SAFER | ✅ | iScreen SAFER [74.7%] | - |
| 46 | F.엣지 | DRM 암호화된 문서를 인쇄할 때 워터마크가 자동으로 나오나요 | Document SAFER | ❌ | Print SAFER [74.3%] | Document SAFER |
| 47 | F.엣지 | 윈도우 클라이언트에서 DRM 연동 개발을 해야 합니다 | Document SAFER I/F (Client) | ✅ | Document SAFER I/F (Client) [76.8%] | - |
| 48 | F.엣지 | Nexacro 기반 전자문서 시스템에 DRM을 적용하고 싶습니다 | ePage SAFER for Web DRM | ✅ | ePage SAFER for Web DRM [76.1%] | - |
| 49 | F.엣지 | 비가시성 워터마크 기술로 문서 유출자를 추적하고 싶습니다 | Print TRACER, Screen TRACER | ✅ | Print TRACER [73.9%] | - |
| 50 | F.엣지 | 모바일 앱에서 비가시성 워터마크로 촬영자를 추적하고 싶습니다 | TRACER SDK for Mobile | ✅ | TRACER SDK for Mobile [78.0%] | - |
