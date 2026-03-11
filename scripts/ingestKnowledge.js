#!/usr/bin/env node
// Google Sheets 제품 정보 → Gemini 임베딩 → Supabase pgvector 적재
// [의도] 하드코딩 STORES를 실제 벡터 DB로 교체하기 위한 1회성 데이터 파이프라인
// Phase 1: 시트 데이터(1depth)만 처리. Phase 2에서 하이퍼링크 문서 크롤링 추가 예정.
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { config } from 'dotenv'
import { DEEP_RESEARCH_CHUNKS } from './deepResearchChunks.js'

config({ path: '.env' })

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' })

// ── 시트 데이터 (MCP로 읽은 "제품정보 및 현황" 시트 Row 4~34) ──
// 컬럼: B=구분(그룹), C=제품명, D=버전정보, E=기능명세서, F=제품매뉴얼,
//        G=사전환경조사서, H=서버스펙, I=서버환경, J=사용자환경,
//        K=Application지원범위, L=CAD지원범위, M=Browser지원범위, N=연동시스템, O=비고
const SHEET_PRODUCTS = [
  // [의도] ES SAFER = Document SAFER 동일 제품 (내부 버전관리 명칭). Document SAFER로 통일.
  // ES SAFER 항목 제거, 통합 패키지 정보를 Document SAFER에 병합.
  {
    group: 'DRM 제품군', name: 'Document SAFER',
    version: 'Green(v7.0), Blue3(v3.0.02). ES SAFER 통합 패키지: Document SAFER + Print SAFER + Privacy SAFER + Screen SAFER',
    serverEnv: 'OS: Windows, Ubuntu, Rocky / WAS: Tomcat 9.0.65 / DB: Oracle 19c, MSSQL 2019, MariaDB 11.0.2 / JDK: Java 1.8',
    clientEnv: 'Windows 7, 8, 10, 11 (32/64bit)',
    appSupport: '표준 OA(Office, HWP, PDF, Notepad) 최신 버전까지 지원',
    cadSupport: 'ES사업부_제품개발팀_제품별_모듈담당자_V2.0',
    useCases: '기업 문서 DRM 암호화 및 유출 방지, 문서 생명주기 관리(생성~폐기), 접근 제어(RBAC), 사용 이력 추적 및 감사 로그, 교육자료/설계문서/연구자료 유출 방지, 외부 반출 제어(USB/이메일/클라우드), 대량 문서 일괄 암호화. DRM 암호화된 문서에 한해 워터마크 출력 지원 가능(범용 워터마크 아님). ES SAFER 통합 패키지로 Print SAFER/Privacy SAFER/Screen SAFER와 함께 도입 가능. USB 반출 시 문서를 DRM 암호화하여 반출 (SafeUSB는 보안USB 매체 관리, Document SAFER는 문서 자체 암호화). 도면 암호화 시 특수OA(CAD 등) 지원 확인 필요 — 어떤 도면 어플리케이션/버전을 사용하는지에 따라 지원 범위가 달라짐. 재택근무/원격근무 환경에서 사내 문서 유출 방지. 주의: 출력 로그 수집은 Print SAFER 영역, 캡처 로그 수집은 Screen SAFER 영역.',
    notes: 'MS오피스 DRM & MIP 저장 정책. ES SAFER는 Document SAFER의 통합 패키지 명칭(동일 제품).',
    docs: 'IST_표준기능정의서, 프로젝트_스펙정의서_v2.4.xlsx, (PQG_QAT)_ES SAFER_표준기능정의서',
  },
  {
    group: 'DRM 제품군', name: 'Privacy SAFER',
    version: 'v3.1',
    serverEnv: '상동 (Document SAFER와 동일)',
    clientEnv: 'Windows 7, 8, 10, 11 (32/64bit)',
    useCases: '개인정보 포함 문서 자동 탐지 및 암호화, 개인정보보호법/GDPR 컴플라이언스 대응, 개인정보 파일 보유 현황 관리, 비인가자 개인정보 접근 차단. SafePC Enterprise(DLP)와 연계하여 PC 내 개인정보 파일 탐지 및 관리 가능. SafePC Enterprise에서도 개인정보보호 옵션으로 개인정보 탐지 기능을 제공하므로, 단독 도입 또는 SafePC 옵션으로 도입 가능.',
    docs: 'IST_표준기능정의서',
  },
  {
    group: 'DRM 제품군', name: 'Print SAFER',
    version: 'v4.0',
    serverEnv: '상동 (Document SAFER와 동일)',
    clientEnv: 'Windows 7, 8, 10, 11 (32/64bit)',
    useCases: '출력물 가시성 워터마크 삽입(출력자 이름/부서/일시 등 눈에 보이는 워터마크), 출력 이력 관리콘솔 수집 및 감사 로그, 인쇄 정책 제어(인쇄 허용/차단/승인), 인쇄 매수 제한, 기밀 문서 인쇄 통제. 에이전트 설치 + 사용자 인증 기반으로 동작 — 에이전트 설치가 불가한 환경(외부 협력사 등)에서는 사용 불가. 주의: Print SAFER는 DRM 암호화 문서뿐 아니라 일반 문서 출력에도 적용 가능.',
    docs: 'IST_표준기능정의서',
  },
  {
    group: 'DRM 제품군', name: 'Print TRACER',
    version: 'v4.0',
    serverEnv: '상동 (Document SAFER와 동일)',
    clientEnv: 'Windows 7, 8, 10, 11 (32/64bit)',
    useCases: '출력물에 비가시성 워터마크(추적 코드) 삽입, 유출된 출력물이 획득되었을 때 어떤 사용자가 출력했는지 추적(비가시성 워터마크에 사용자 정보 포함), 복사/스캔된 출력물 원본 추적. Print SAFER 내 비가시성 기능으로 제공. 주의: 출력 이력 관리콘솔 수집은 Print SAFER 영역.',
    notes: 'Print SAFER 내 비가시성 기능으로 제공',
  },
  {
    group: 'DRM 제품군', name: 'Screen SAFER',
    version: 'v3.0',
    serverEnv: '상동 (Document SAFER와 동일)',
    clientEnv: 'Windows 7, 8, 10, 11 (32/64bit)',
    useCases: '화면 캡처 방지(PrintScreen/캡처 도구 차단), 원격 접속 시 화면 유출 방지, 화상회의 중 화면 녹화 차단, 기밀 문서 열람 시 화면 보호. Screen TRACER(비가시성 워터마크/추적) 기능도 함께 제공 가능. 캡처 차단 + 비가시성 워터마크 추적을 동시에 적용 가능. 에이전트 설치 + 사용자 인증 기반으로 동작. 사용자 정보 DB 구성이 가능해야 함. 에이전트 설치/사용자 DB 구성이 불가한 환경에서는 Web DRM(ePage SAFER for Web DRM)이 대안. 캡처 이력 로그 수집.',
    docs: 'IST_표준기능정의서',
  },
  {
    group: 'DRM 제품군', name: 'Screen TRACER',
    version: 'v3.0',
    serverEnv: '상동 (Document SAFER와 동일)',
    clientEnv: 'Windows 7, 8, 10, 11 (32/64bit), MAC OS',
    useCases: '사용자 화면에 비가시성 워터마크 삽입, 화면 촬영/캡처 유출 시 촬영자 추적, 내부 정보 유출 경로 역추적, MAC OS 환경 화면 추적. 주의: 화면 캡처 차단(화면보안) 기능은 없음 — 캡처 차단은 Screen SAFER가 담당.',
    notes: 'Screen SAFER 내 비가시성 기능으로 제공. TRACER 제품군(SDK)와 병행 체크 필요.',
  },
  {
    group: 'DRM 제품군', name: 'Web SAFER',
    version: 'v5.0',
    serverEnv: '고객사 서버 환경에 따름',
    clientEnv: 'Windows 7, 8, 10, 11 (32/64bit)',
    browserSupport: 'Chrome, Edge, Firefox, Opera, Whale',
    useCases: '웹화면 캡처방지 제어(PrintScreen/캡처도구 차단), 웹브라우저 우클릭 메뉴 비활성화, 웹브라우저 보안제어(인쇄/소스보기/클립보드/확장프로그램 제어), 웹 기반 그룹웨어/문서 시스템 화면 보안, 웹 환경 콘텐츠 열람 권한 관리. 주의: 파일 다운로드 차단은 Web SAFER 기능이 아님(JSP 개발단에서 처리해야 할 영역). Web DRM과 동일 제품.',
  },
  {
    group: 'DRM 제품군', name: 'Cowork SAFER',
    version: 'v2.0',
    serverEnv: 'OS: Windows, Ubuntu, Rocky / WAS: Tomcat 9.0.65 / DB: Oracle 19c, MSSQL 2019, MariaDB 11.0.2 / JDK: Java 1.8',
    clientEnv: 'Windows 7, 8, 10, 11 (32/64bit)',
    appSupport: 'MS-Office, 한글, PDF',
    useCases: '외부 협력사와의 문서 공유 시 보안 유지, 협업 문서 열람 기간/횟수 제한, 외부 반출 문서 회수 및 폐기, 파트너사/하청업체 문서 유출 방지. 보안PDF 형태로 유통하는 솔루션 — 원본 문서(도면 등)를 PDF로 가공한 후 Cowork SAFER 보안 적용 가능. 서버인증/로컬인증 방식 지원.',
    docs: 'IST_표준기능정의서',
  },
  {
    group: 'DRM 제품군', name: 'Mobile DOCS',
    version: 'Android: 4.x.x / iOS: 3.x.xx',
    serverEnv: '상동 (Document SAFER와 동일)',
    clientEnv: '최소 OS 사양: Android 7, iOS 14',
    useCases: 'Document SAFER로 DRM 암호화된 문서를 모바일에서 열람/편집하는 전용 뷰어. Document SAFER 도입이 필수 전제조건. 스마트폰/태블릿 문서 뷰어, 외근/출장 시 사내 암호화 문서 안전 열람.',
    docs: 'Mobile Docs_기능정의서_v_0.2.xlsx',
  },
  {
    group: 'DRM 제품군', name: 'Mobile SAFER',
    version: 'Android: 3.00.xxxx / iOS: 2.00.xxxx',
    serverEnv: 'OS: Rocky 9, Windows Server / WAS: Tomcat 8.5~9.0 / DB: MySQL 5.7/8, Oracle / JDK: 1.8',
    clientEnv: '최소 OS 사양: Android 10, iOS 14',
    useCases: '모바일 기기 MDM(Mobile Device Management) 솔루션, 모바일 기기 보안 정책 중앙 관리, 모바일 환경 문서 접근 제어, BYOD 환경 사내 문서 보호, 모바일 DRM 에이전트, 모바일 기기 분실/도난 시 원격 제어.',
    docs: 'Mobile SAFER (요구 명세서).pdf',
  },
  {
    group: 'DRM 제품군', name: 'Mobile STICKER',
    version: 'Android: 1.0.106 / iOS: 1.0.58',
    serverEnv: 'N/A',
    clientEnv: '최소 OS 사양: Android 7, iOS 10',
    useCases: '모바일 기기 경량 MDM(Mobile Device Management), 모바일 카메라 기능 차단, 모바일 녹음 기능 차단, 모바일 화면에 가시성 워터마크 표시(사용자 정보 워터마크). 관리 콘솔 없는 경량형 보안 에이전트. OS별 지원 범위 차이 있음(Android/iOS). 주의: 모바일 비가시성 워터마크(추적용)는 TRACER SDK for Mobile이 담당.',
    docs: 'Mobile STICKER (요구 명세서).pdf',
  },
  {
    group: 'DRM 제품군', name: 'Mobile Capture SAFER',
    version: 'Android: 2.5.xx / iOS: 1.2.xx',
    serverEnv: 'N/A',
    clientEnv: '최소 OS 사양: Android 7, iOS 15',
    useCases: '모바일 기기 화면 캡처 방지 전용, 스마트폰 스크린샷 차단, 모바일 앱 내 콘텐츠 캡처 제어',
    docs: 'Capture SAFER_V1.2_통합_기능정의서.pptx',
  },
  {
    group: 'DRM 제품군', name: 'iScreen SAFER',
    version: 'iOS: 2.1.02',
    serverEnv: 'N/A',
    clientEnv: '최소 OS 사양: iOS 11',
    useCases: 'iOS 기기 전용 화면 캡처 방지, iPad/iPhone 화면 캡처 차단, iOS 환경 문서 열람 시 화면 보안',
  },
  {
    group: 'DRM 제품군', name: '국방모바일보안',
    version: '',
    serverEnv: 'N/A',
    clientEnv: '최소 OS 사양: Android 7, iOS 10',
    useCases: '군사 보안 환경 모바일 문서 보호, 국방부/군 기관 모바일 보안 정책 적용, 군사 기밀 문서 모바일 열람 통제, 국방 모바일 오피스 보안. Mobile SAFER 기반.',
    docs: '02_MMSA_1R14a_요구사항정의서_V1.0.xlsx',
  },
  {
    group: 'DRM 제품군', name: 'Document SAFER I/F (Server)',
    version: 'Windows: Document SAFER 버전에 따름 / Linux/Unix: Document SAFER 제품 버전에 따름',
    serverEnv: '[서버 DRM] IBM AIX(POWERPC), SUN Oracle(SPARC/Intel), HP HP-UX(IA64/PA-RISC), Linux(Intel). Memory 무관, HDD 형태 무관, Storage 바이너리 약 300MB + 로그 용량. macrypto 미사용 Document SAFER Green은 소스 직접 컴파일 시 모든 UNIX 계열 OS 지원 가능.',
    clientEnv: '[서버 DRM] IBM AIX(AIX 5.3~), SUN Oracle(Solaris 5.10~), HP(HP-UX IA64 11.31~, PA-RISC 11.11~), Linux(kernel 2.6~). JDK 1.2 이상 연동 인터페이스 지원.',
    integration: 'JAVA 인터페이스를 사용하는 모든 시스템에 적용 가능. C 인터페이스를 사용하는 모든 시스템에 적용 가능. 서버에 접근하여 파일을 업로드/다운로드하는 시스템일 경우 적용 가능. 고객사 개발자가 서버 DRM 인터페이스를 호출하는 방법으로 연동.',
    useCases: '서버 측 문서 암호화/복호화 처리, ERP/그룹웨어/ECM 등 업무 시스템과 DRM 연동, 서버에서 파일 업로드/다운로드 시 자동 암호화, JAVA/C 인터페이스 기반 서버 DRM 연동 개발, Unix/Linux 서버 환경 문서 보안. 엔드포인트에서 암호화된 문서를 웹 프록시 구간 또는 기타 웹으로 전송되는 구간에서 복호화하여 평문으로 웹에서 출력. 주의: 암호화된 문서를 웹브라우저에서 직접 열 수 없음 — 복호화 필요. Document SAFER I/F(Client)와 쌍으로 사용.',
    docs: '연동IF정의서, MaFileCipherXU, Server DRM, MarkAny Unix 설치 지원 요청서 양식.xls',
  },
  {
    group: 'DRM 제품군', name: 'Document SAFER I/F (Client)',
    version: 'Document SAFER 제품 버전에 따름',
    clientEnv: 'Windows 7, 8, 10, 11 (32/64bit)',
    useCases: '클라이언트 측 DRM 연동 인터페이스, 사내 애플리케이션에 DRM 암호화/복호화 기능 탑재, 커스텀 애플리케이션 DRM 연동 개발. Document SAFER I/F(Server)와 쌍으로 사용.',
    docs: 'DSFileCipherX',
  },
  {
    group: 'DRM 제품군', name: 'MACRYPTO V3.0 (KCMVP)',
    version: 'V3.00',
    features: 'KCMVP 인증 암호모듈. 국가정보원 암호모듈 검증 제품.',
    useCases: 'KCMVP 인증 필수 환경(국가/공공기관)에서 암호화 요건 충족, ARIA/SEED/AES 국가 표준 암호 알고리즘 적용, 국가정보원 보안적합성 검증 대응, 공공기관 정보보호 시스템 암호모듈. Document SAFER 등 마크애니 제품의 암호화 엔진으로 사용.',
    docs: '20_Macrypto V3.00 (보안정책정의서)',
  },
  // ── DLP 제품군 ──
  {
    group: 'DLP 제품군', name: 'SafePC Enterprise',
    version: 'V7.0',
    serverEnv: '[202506 최신 버전 기준] OS: RedHat 9.4 / Rocky 9.4 / WAS: Tomcat 9.0.102 / DB: MariaDB 11.4.2 / JDK: OpenJDK 21.0.1',
    clientEnv: 'Windows 10 (32/64bit), Windows 11 (64bit). 이하 버전은 EOS로 정식 지원하지 않음.',
    browserSupport: 'Chrome, Edge, Firefox',
    useCases: 'PC 내 정보 유출 방지(DLP), USB/외장매체 사용 통제, 네트워크 파일 전송 제어, PC 보안 정책 중앙 관리, 매체 제어(USB/블루투스/Wi-Fi), 파일 반출 승인 워크플로우, 개인정보 파일 탐지 및 관리. 매체제어, 출력물보안, 개인정보보호 세 가지 기능을 옵션으로 제공하는 통합 DLP 솔루션. Privacy SAFER와 연계하여 개인정보 컴플라이언스 대응 가능.',
    notes: '기존 SecuPrint 기능 신규 제공 불가 (Litech 연동 제품 EOS). PrintSAFER 출력물 제어 기능 연동 개발 중.',
    docs: 'SAFEPC_정책정의서.xlsx, SafePC Enterprise V7.0 매뉴얼, 프로젝트_스펙정의서_v2.4.xlsx',
  },
  {
    group: 'DLP 제품군', name: 'SafeUSB',
    version: 'V7.1',
    serverEnv: '[202506 최신 버전 기준] OS: RedHat 9.4 / Rocky 9.4 / WAS: Tomcat 9.0.102 / DB: MariaDB 11.4.2 / JDK: OpenJDK 21.0.1',
    clientEnv: 'Windows 10 (32/64bit), Windows 11 (64bit). 이하 버전은 EOS로 정식 지원하지 않음.',
    browserSupport: 'Chrome, Edge, Firefox',
    useCases: 'USB 저장매체 암호화 및 접근 제어, 보안 USB 발급 및 관리, USB를 통한 파일 반출 통제, 분실/도난 USB 원격 잠금/삭제, 외부 USB 사용 차단 및 허용 정책 관리. 주의: 문서를 암호화하여 USB로 반출하는 것은 Document SAFER 영역. SafeUSB는 보안USB 매체 자체의 발급/관리/접근제어를 담당.',
    docs: 'SAFEPC_정책정의서.xlsx, SafeUSB+ V7.0 매뉴얼(관리자 사용자), 프로젝트_스펙정의서_v2.4.xlsx',
  },
  // ── 응용보안 제품군 ──
  {
    group: '응용보안 제품군', name: 'ePage SAFER',
    version: 'v2.5',
    serverEnv: 'OS: Windows NT 계열, Unix(IBM AIX 4.3+, SUN Solaris 5.7+, HP HP-UX 11.0+), Linux 전 기종(CentOS, Ubuntu, Rocky) / WAS: ALL / DB: N/A / JDK: 1.4 이상',
    clientEnv: 'Windows 7, 8, 10, 11 (32/64bit) / Linux(Fedora/Ubuntu) (32/64bit) / Mac 10.10 이상. EOS된 환경에서 사용은 가능하나 정식 지원은 아님.',
    browserSupport: 'Chrome, Edge, Firefox, Opera, Whale',
    integration: 'HTML 서식 연동, 리포트 연동(ClipReport_Clipsoft / Crownix_m2soft / OzReport_forcs / UbiReport_유비디시전), PDF 연동(PDF TEXT 추출)',
    useCases: '전자문서 위변조 방지(마크애니에서 위변조방지는 ePage SAFER 전용 영역), 증명서/수료증/계약서 등 발급 문서 진위 확인, 전자문서에 Document DNA(디지털 지문) 삽입, 웹 기반 전자문서 보안, 리포트/서식 출력물 위변조 방지, PDF 문서 위변조 방지, 웹 출력물/PDF에 2D 바코드 기반 위변조방지. 웹에서 출력하는 출력물 또는 PDF에 2D 바코드로 위변조방지를 적용하는 경우 ePage SAFER for ZeroClient 또는 Noax 버전 사용. PDF 전자문서 유통 시 진위여부 확인은 ePS Document DNA 영역.',
    docs: 'EVM-ePageSAFER v2.5 (요구 명세서).pdf, ePageSAFER 매뉴얼, AIT_ePS_사전조사서.xls',
  },
  {
    group: '응용보안 제품군', name: 'VoiceBarcode',
    version: 'v2.5',
    useCases: '음성 기반 바코드 인식, 시각장애인 접근성 지원, 음성 코드 삽입 및 인식. ePage SAFER 제품군의 부가 기능.',
  },
  {
    group: '응용보안 제품군', name: 'ePage SAFER for Web DRM',
    version: 'v2.5',
    serverEnv: 'OS: Windows 7, 8, 10, 11 (32/64bit) / WEB/WAS: ALL / DB: N/A / JDK: N/A',
    clientEnv: 'Windows 7, 8, 10, 11 (32/64bit)',
    browserSupport: 'Chrome, Edge, Firefox, Opera, Whale',
    integration: 'Nexacro NRE(넥사크로 EXE 환경) / WRE(일반 브라우저 환경)',
    useCases: '웹 환경 전자문서 DRM 보호(ePage SAFER의 웹 전용 버전), 웹화면 캡처방지 제어, 웹브라우저 보안제어, Nexacro 기반 업무 시스템 문서 보안, 브라우저에서 열람하는 전자문서 암호화 및 권한 제어, 웹 기반 증명서/서식 보안',
    docs: 'EVM-e-PageSAFER_V2.5 WebDRM 요구명세서.pdf, ePageSAFER WebDRM 매뉴얼',
  },
  {
    group: '응용보안 제품군', name: 'ePS DocumentMerger',
    version: 'v2.5',
    serverEnv: 'OS: Windows NT 계열, Unix(IBM AIX 4.3+, SUN Solaris 5.7+, HP HP-UX 11.0+), Linux 전 기종 / WAS: ALL / DB: N/A / JDK: 1.4 이상',
    clientEnv: 'Windows 7, 8, 10, 11 (32/64bit) / Linux(Fedora/Ubuntu) (32/64bit) / Mac 10.10 이상',
    browserSupport: 'Chrome, Edge, Firefox, Opera, Whale',
    useCases: 'PDF 문서를 보안뷰어로 유통하는 솔루션, PDF 문서 보안 뷰어 배포, 다수 PDF 문서 보안 패키징, 보안 뷰어를 통한 문서 열람 제어. 주의: 문서 병합(merge) 자체는 마크애니 솔루션의 주요 기능이 아님.',
    docs: 'ePS DocumentMerger 매뉴얼',
  },
  {
    group: '응용보안 제품군', name: 'ePS Document DNA',
    version: 'v2.5',
    serverEnv: 'OS: Windows NT 계열(PDF 변환 필요시 필수), Unix(IBM AIX 4.3+, SUN Solaris 5.7+, HP HP-UX 11.0+), Linux 전 기종 / WAS: ALL / DB: N/A / JDK: 1.4 이상',
    clientEnv: 'Windows 7, 8, 10, 11 (32/64bit) / Linux(Fedora/Ubuntu) (32/64bit) / Mac 10.10 이상',
    browserSupport: 'Chrome, Edge, Firefox, Opera, Whale',
    useCases: '전자문서에 고유 디지털 지문(Document DNA) 삽입, 문서 위변조 탐지 및 진위 확인(ePage SAFER와 함께 위변조방지 영역), 증명서/수료증/인증서/계약서 원본 검증, 출력물 위변조 방지, 문서 이력 추적, PDF 유통 시 원본검증이 필요한 경우 사용',
    docs: 'ePS Document DNA 매뉴얼',
  },
  // ── TRACER 제품군 ──
  {
    group: 'TRACER 제품군', name: 'TRACER SDK for Screen',
    version: 'V1.0',
    serverEnv: 'Windows Server, Linux',
    clientEnv: 'Windows 10, 11, MAC OS',
    useCases: '3rd party 소프트웨어에 화면 비가시성 워터마크/추적 기능 탑재(Add-in SDK), 자체 개발 앱에 화면 추적 기능 연동',
    notes: '화면보호 SW Add-in',
  },
  {
    group: 'TRACER 제품군', name: 'TRACER SDK for Print',
    version: 'V1.0',
    serverEnv: 'Windows Server, Linux',
    clientEnv: 'Windows 10, 11',
    useCases: '3rd party 소프트웨어에 출력물 비가시성 워터마크/추적 기능 탑재(Add-in SDK), 자체 개발 앱에 인쇄 추적 기능 연동',
    notes: '출력보호 SW Add-in',
  },
  {
    group: 'TRACER 제품군', name: 'TRACER SDK for Web',
    version: 'V1.0',
    serverEnv: 'Windows Server, Linux',
    clientEnv: '서버 Side임에 따라 무관',
    browserSupport: 'Chrome, Edge, Firefox, Opera, Whale',
    useCases: '웹 시스템에 문서 추적 기능 탑재(Add-in SDK), 웹 기반 업무 시스템에 추적 기능 연동, 서버 사이드 문서 추적 SDK',
    notes: '적용 시스템 Add-in',
  },
  {
    group: 'TRACER 제품군', name: 'TRACER SDK for Mobile',
    version: 'V1.0',
    clientEnv: '최소 OS 사양: Android 7, iOS 10',
    useCases: '모바일 네이티브 앱에 비가시성 워터마크/추적 기능 탑재(Add-in SDK), 자체 개발 모바일 앱에 워터마크/추적 기능 연동, 모바일 네이티브 앱에 비가시성 워터마크 적용(하이브리드 앱도 앱 접근 권한/소스 수정 가능 시 지원). 모바일 화면에 비가시성 워터마크를 적용하여 촬영자 추적이 필요한 경우 이 제품이 담당. 모바일 앱에 SDK를 연동하여 비가시성 워터마크 삽입.',
    notes: 'App Add-in',
  },
]

// ── 하이퍼링크 문서 청크 (Google Sheet 하이퍼링크에서 수집한 2depth 문서) ──
// [의도] 시트 제품 정보(1depth)에 연결된 기능정의서/스펙정의서 등 상세 문서를 제품별로 분할하여 임베딩
// → 기능 상세 질문("Print SAFER 워터마크 설정 옵션은?")에 대한 검색 정확도 향상
const HYPERLINK_CHUNKS = [
  // ── Doc 1: MS오피스 DRM & MIP 저장 정책 → Document SAFER 전용 ──
  {
    group: 'DRM 제품군', name: 'Document SAFER',
    title: 'Document SAFER — MS오피스 DRM & MIP 저장 정책',
    content: `MS오피스 로컬 & 클라우드 저장 정책. 구독형 오피스(M365)와 설치형 오피스(~Office 2021)에 대한 DRM/MIP 정책 정의.
DRM만 사용 시와 로컬 DRM & 클라우드 MIP 사용 시의 저장 정책 구분:
- 로컬→로컬: DRM 암호화
- 로컬→클라우드: 저장 차단 또는 MIP 암호화
- 클라우드→로컬: DRM+MIP 이중 암호화
- 클라우드→클라우드: 저장 차단 또는 MIP 암호화
관련 정책키: DS_DRM_WITH_MIP(0:DRM만, 1:로컬DRM&클라우드MIP), DS_ALLOW_CLOUD(0:금지, 1:허용), TEAMS_SUPPORT_TYPE, QDRM_EX_n_EXT.
MIP 지원확장자: docx|docm|dotx|dotm|xlsx|xlsm|xltx|xltm|pptx|pptm|potx|potm.
파워포인트는 MIP 암호화만 가능(DRM암호화 실패 케이스 존재).
[용도/유스케이스] M365/클라우드 환경 DRM 정책 설정, MIP 연동 정책, 오피스 저장 경로별 암호화 정책 관리`,
    source_url: 'https://docs.google.com/spreadsheets/d/1KxGMwZd9bdtYF7WZaUhkmIhc2KTLhlTpmDR4esP_OwY/edit',
  },

  // ── Doc 2: IST_표준기능정의서 → 제품별 분할 ──
  {
    group: 'DRM 제품군', name: 'Document SAFER',
    title: 'Document SAFER — 표준기능정의서 상세',
    content: `Document SAFER Green/Blue3 표준기능정의서 상세 기능:
관리자 기본관리: 사용자등록/검색/인사연동, 부서관리, 결재관리, OEP관리, 시스템관리.
정책관리 전사정책: 문서교환(사내한/개인한/부서한), 오프라인정책, 화면캡처방지, 원격제어툴 차단, 시간동기화, DRM삭제, 가상프린터인쇄방지, 블록복사방지, 백업파일생성, 배치암호화(확장자/예외폴더/동작시간/실행스케줄/실행방식), 암호화툴, 자동암호화, 출력물워터마크정책(로고/출력정보/Copyright/텍스트이미지).
예외정책, 반출정책(사후확인/자가승인/사전승인, 업로드허용사이즈/개수, 다운로드기간/횟수).
이력조회: 사용이력/반출이력/설치현황/배치툴이력. 이력통계: 반출/사용통계.
에이전트: 로그인후화면숨기기, 자동로그아웃, 결제신청(복호화/PC반출), 알림조회, 패스워드변경, 컨텍스트메뉴(암호화파일속성/문서암호화), 트레이메뉴(로그인/OEP로그인/로그아웃/정책업데이트/종료), 배치암호화툴.
QDRM_EX: 실시간 암호화 정책(프로세스 감시, 파일 포맷 비교, 저장매체 대상).
[용도/유스케이스] Document SAFER 관리자 기능 상세, 정책 설정 옵션, 에이전트 기능 목록, 반출 정책 설정`,
    source_url: 'https://docs.google.com/spreadsheets/d/1eR74n1FlDsiGL3w3oPiSYkWUeHCwNr676-f4ASwlg68/edit',
  },
  {
    group: 'DRM 제품군', name: 'Print SAFER',
    title: 'Print SAFER — 표준기능정의서 상세 (IST)',
    content: `Print SAFER 표준기능정의서 기능 상세:
마스터정책: 워터마크 이미지/텍스트 설정.
전사정책: 출력허용/워터마크/로그/개인정보검출.
세팅정책: 프린터/포트/프로세스/IP 허용금지 리스트.
[용도/유스케이스] Print SAFER 관리자 정책 설정, 워터마크 마스터정책, 출력 제어 세팅`,
    source_url: 'https://docs.google.com/spreadsheets/d/1eR74n1FlDsiGL3w3oPiSYkWUeHCwNr676-f4ASwlg68/edit',
  },
  {
    group: 'DRM 제품군', name: 'Privacy SAFER',
    title: 'Privacy SAFER — 표준기능정의서 상세 (IST)',
    content: `Privacy SAFER 표준기능정의서 기능 상세:
기본정책: CPU점유율/메모리/격리폴더/동작모드 설정.
예약검사/수동검사/실시간검사: 필터목록, 처리방식, 확장자, 경로 설정.
개인정보 종류: 주민번호, 외국인번호, 계좌번호, 전화번호 등 탐지.
[용도/유스케이스] Privacy SAFER 검사 정책 설정, 개인정보 탐지 설정, 격리 폴더 관리`,
    source_url: 'https://docs.google.com/spreadsheets/d/1eR74n1FlDsiGL3w3oPiSYkWUeHCwNr676-f4ASwlg68/edit',
  },
  {
    group: 'DRM 제품군', name: 'Screen SAFER',
    title: 'Screen SAFER — 표준기능정의서 상세 (IST)',
    content: `Screen SAFER 표준기능정의서 기능 상세:
차단정책: 캡처차단 + 워터마크 설정.
스크린워터마크: 텍스트/이미지/농도/위치/각도 설정.
접근탐지: 원격감지(원격 접속 프로그램 탐지).
프로세스/URL 워터마크: 특정 프로세스나 URL 접근 시 워터마크 표시.
[용도/유스케이스] Screen SAFER 캡처차단 정책, 스크린 워터마크 설정 옵션, 원격 접속 탐지 설정`,
    source_url: 'https://docs.google.com/spreadsheets/d/1eR74n1FlDsiGL3w3oPiSYkWUeHCwNr676-f4ASwlg68/edit',
  },
  {
    group: 'DRM 제품군', name: 'Web SAFER',
    title: 'Web SAFER — 표준기능정의서 상세 (IST)',
    content: `Web SAFER 표준기능정의서 기능 상세:
URL보호, 저장/편집/인쇄/소스보기 차단, 캡처 차단, 원격프로그램 차단, 워터마크 표시, 클립보드 제어, 확장프로그램 제어.
Web DRM과 동일 제품(관리자 콘솔 유무 차이). 웹화면 캡처방지 및 브라우저 보안제어 전문.
[용도/유스케이스] Web SAFER 브라우저 보안 정책, 웹 캡처방지 설정, 클립보드/확장프로그램 제어`,
    source_url: 'https://docs.google.com/spreadsheets/d/1eR74n1FlDsiGL3w3oPiSYkWUeHCwNr676-f4ASwlg68/edit',
  },
  {
    group: 'DRM 제품군', name: 'Cowork SAFER',
    title: 'Cowork SAFER — 표준기능정의서 상세 (IST)',
    content: `Cowork SAFER 표준기능정의서 기능 상세:
외부반출 변환: MASDOC/ZIP/EXE 형식 지원.
인증방식: 서버인증/로컬인증.
권한상세설정: 저장/열람/인쇄/블록복사/화면캡처/사용기한 제어.
[용도/유스케이스] Cowork SAFER 외부반출 설정, 협업 문서 권한 관리, 반출 파일 형식 선택`,
    source_url: 'https://docs.google.com/spreadsheets/d/1eR74n1FlDsiGL3w3oPiSYkWUeHCwNr676-f4ASwlg68/edit',
  },
  {
    group: 'DLP 제품군', name: 'SafePC Enterprise',
    title: 'SafePC Enterprise — 표준기능정의서 DataLoss SAFER(USB보안)',
    content: `DataLoss SAFER(USB보안) 표준기능정의서 — SafePC Enterprise 연관:
매체제어: 병렬포트, IEEE1394, 이동식저장장치, 안드로이드, 아이폰, CD-DVD, Bluetooth, 시리얼포트 제어.
SafePC Enterprise V7.0에서 매체제어 기능 통합 제공.
[용도/유스케이스] USB/매체 제어 정책, 이동식 저장장치 차단, 블루투스/CD-DVD 제어`,
    source_url: 'https://docs.google.com/spreadsheets/d/1eR74n1FlDsiGL3w3oPiSYkWUeHCwNr676-f4ASwlg68/edit',
  },

  // ── Doc 4: IST_표준기능정의서_PrintSAFER.xlsx → Print SAFER 전용 상세 ──
  {
    group: 'DRM 제품군', name: 'Print SAFER',
    title: 'Print SAFER — 전용 기능정의서 상세',
    content: `Print SAFER 전용 표준기능정의서 상세:
Super관리자 마스터정책 — 워터마크 타입: 이미지/텍스트이미지/텍스트다이렉트/외곽선텍스트.
출력형식/위치(X,Y좌표 0~100)/각도(0~360)/출력개수(1x1,2x2,4x4)/분할단위(1~5)/DIB농도(-5~5)/워터마크농도(0~10)/이미지확대/이미지파일(bmp,jpg,png).
텍스트워터마크: 폰트/크기X축Y축/색상(RGB)/속성(보통/두껍게/이태릭/밑줄)/내용(자동입력-출력자ID/이름/부서/직위/IP/MAC/PC명/문서명/출력일시/프린터명 등).
세팅정책: 인쇄허용/금지, 워터마크허용/금지(프린터/포트/프로세스/IP 리스트).
전사정책 공통: 출력허용여부, 로그인상태체크, 워터마크사용여부, PDF워터마크삽입, 컬러프린터PS방식, 토너절약, Agent삭제허용, 개인정보검출/마스킹/로그저장, 프린터별농도설정, 프린트로그생성, 로그파일암호화, 이미지로그(타입/시작종료페이지), 텍스트로그(타입/시작종료페이지).
지원 어플리케이션: MS-Office(2003~2024), Adobe Acrobat(6.0~25.0), PDF Pro5, PDF XChange, Xodo, Word, Notepad++, ezPDFReader, Polaris Office.
[용도/유스케이스] Print SAFER 워터마크 상세 설정(위치/각도/농도/타입), 텍스트 워터마크 자동입력 항목, 인쇄 허용/금지 세팅, 지원 어플리케이션 목록`,
    source_url: 'https://docs.google.com/spreadsheets/d/1T2VZcWywtyeJRSjk3UbuXThUfcjMZHag/edit',
  },

  // ── Doc 5: 제품별 모듈담당자 → 제품별 기술 모듈 상세 ──
  {
    group: 'DRM 제품군', name: 'Document SAFER',
    title: 'Document SAFER — 모듈 구성 상세',
    content: `Document SAFER 모듈 구성 (ES사업부 제품개발팀):
서버DRM(Unix/Linux): MA_PMS, MA_DDS, MA_DEC, MA_FILECHK (1파트, 양정욱). 다양한 cipher 버전(51014/multi ccf/3.0/3.1/4.0/C2010R1/C2010R2,R3/blue/cipher2017/nx). 온나라1.0/2.0 인터페이스, 자바코어.
Agent(1파트, 조규선): MAAgent.exe(R3/Blue/NX/eGov&Json/금융권), 라이브업데이트(DSU_ServiceV6/DSU_LiveUpdateV6), 수동암호화툴(CipherToolPlus/DeCipherToolPlus), 배치툴(BatchEncDec), 서버인터페이스(MaFileCipherXU/DSFileCipherX), WebSocket SSO.
FileServer SAFER: FSSConfig/MFWorker/FSLogger/MFScanner.
웹파트: WEB-BLUE/WEB-ESPRESSO/SERVICE-INTEGRATION/TAKEOUT/PROCESS/LOG/TIMER/RETURNKEY.
[용도/유스케이스] Document SAFER 모듈 구성 확인, 서버DRM 바이너리 목록, Agent 구성요소, 웹파트 모듈 목록`,
    source_url: 'https://docs.google.com/spreadsheets/d/1sB-fhoSu3tsIUF5mQVsrKQc4bN-s_3-X2F2aoHFf9BU/edit',
  },
  {
    group: 'DRM 제품군', name: 'Print SAFER',
    title: 'Print SAFER — 모듈 구성 상세',
    content: `Print SAFER 모듈 구성:
v3: MPSAgent/MPS_Core/MPS_Policy_Helper/MPS_SSL_Helper/MPSLog/MPS_PDFConv/MPS_Print/MPS_WM.
v4: PS_Control/PS_Log/PS_Watermark/MPSAgent/mps_plugin/PS_Approval/PS_Policy/MPS_Service.
[용도/유스케이스] Print SAFER 모듈 구성 확인, v3/v4 모듈 차이, 워터마크/승인/정책 모듈 목록`,
    source_url: 'https://docs.google.com/spreadsheets/d/1sB-fhoSu3tsIUF5mQVsrKQc4bN-s_3-X2F2aoHFf9BU/edit',
  },
  {
    group: 'DRM 제품군', name: 'Screen SAFER',
    title: 'Screen SAFER — 모듈 구성 상세',
    content: `Screen SAFER 모듈 구성:
v2: ScreenSAFER2/MASSFH/ScreenSAFER_SA. CaptureSAFER용: MCS_ScreenSAFER2.
[용도/유스케이스] Screen SAFER 모듈 구성 확인, CaptureSAFER 연동 모듈`,
    source_url: 'https://docs.google.com/spreadsheets/d/1sB-fhoSu3tsIUF5mQVsrKQc4bN-s_3-X2F2aoHFf9BU/edit',
  },
  {
    group: 'DRM 제품군', name: 'Privacy SAFER',
    title: 'Privacy SAFER — 모듈 구성 상세',
    content: `Privacy SAFER 모듈 구성:
v2: PSRAgent/PSR_Core/PSRConfig/PSRPolicy.
v3: QPrSfAgent/QPrSfUI/QPrSfScan/QPrSfSvc.
v3.1: QPrSfAgent/QPrSfUI/QPrSfScan/QPrSfTaskManager/EvtNotifier.
커널드라이버: mapsftii.sys.
[용도/유스케이스] Privacy SAFER 모듈 구성 확인, v2/v3/v3.1 모듈 차이, 커널드라이버 정보`,
    source_url: 'https://docs.google.com/spreadsheets/d/1sB-fhoSu3tsIUF5mQVsrKQc4bN-s_3-X2F2aoHFf9BU/edit',
  },
  {
    group: 'DRM 제품군', name: 'Web SAFER',
    title: 'Web SAFER — 모듈 구성 상세',
    content: `Web SAFER 모듈 구성:
v4: WebSAFERControlAX/WebSAFERIE6~11/WSChrome.
NonActiveX: mawssvc/mawsmgr.
[용도/유스케이스] Web SAFER 모듈 구성 확인, ActiveX/NonActiveX 모듈 목록`,
    source_url: 'https://docs.google.com/spreadsheets/d/1sB-fhoSu3tsIUF5mQVsrKQc4bN-s_3-X2F2aoHFf9BU/edit',
  },
  {
    group: 'DRM 제품군', name: 'MACRYPTO V3.0 (KCMVP)',
    title: 'Image SAFER — 모듈 구성 상세',
    content: `Image SAFER 모듈 구성:
v4/v5: ImageSAFERSvc/ImageSAFERStart/ImageSAFERMgr/ImageSAFERFilter.
QDRM: v2 — mafmftii.sys/QDRM_EX_Agent/QDRM_EX_Core.
[용도/유스케이스] Image SAFER 모듈 구성, QDRM 실시간 암호화 모듈 정보`,
    source_url: 'https://docs.google.com/spreadsheets/d/1sB-fhoSu3tsIUF5mQVsrKQc4bN-s_3-X2F2aoHFf9BU/edit',
  },

  // ── Doc 6: 프로젝트_스펙정의서 → 사전환경 조사서 (제품별 분할) ──
  {
    group: 'DRM 제품군', name: 'Document SAFER',
    title: 'Document SAFER — 프로젝트 사전환경 조사서',
    content: `ES SAFER(DRM) 프로젝트 사전환경 조사서:
프로젝트정보: 코드/기간/영업담당/수행형태/환경.
계약제품: Document SAFER BLUE3, Print SAFER 4.0, Privacy SAFER 3.1, Screen SAFER, Mobile Docs.
서버정보: 표준OS Ubuntu Linux, DB MariaDB, WAS Tomcat, 이중화 Active-Active/Standby.
클라이언트정보: 지원OS Win10/11, VDI/물리PC, 유저수, 망구분.
타SW운영정보: AD/백신/DLP/문서중앙화/개인정보보호/키보드보안.
공통 사용포트: ssh:22, 관리자Web:8080/8443, Agent로그인:40001, 로그:40002, 시간동기화:40003, 프로세스:40004, 반출:40005, 개인정보로그:40006, 라이브업데이트:40007.
인사연동: AD/DB-to-DB/CSV, 테이블 HR_SYNC_USER/HR_SYNC_DEPT/HR_SYNC_POSI/HR_SYNC_APP.
로그인연동: 수동/AD-LDAP/AD-Windows계정/SSO.
[용도/유스케이스] DRM 프로젝트 사전환경 조사, 서버/클라이언트 스펙 확인, 포트 정의, 인사/로그인 연동 방식`,
    source_url: 'https://docs.google.com/spreadsheets/d/1GyZQlROU73HC4NnLkUdwAJyaC5H54BQ0/edit',
  },
  {
    group: 'DLP 제품군', name: 'SafePC Enterprise',
    title: 'SafePC Enterprise — 프로젝트 사전환경 조사서',
    content: `SafePC(DLP) 프로젝트 사전환경 조사서:
서버정보: OS RedHat9.4/Rocky9.4, 이중화 LifeKeeper만 사용.
클라이언트: 출력물보안 대상 Application, 개인정보 마스킹.
네트워크정보, 연동정보(그룹웨어/로그인/DRM).
SafePC 전용 포트: 10443/5436/5437/5500/5555/5562/5566/8977/9009/9080.
Print SAFER 시트: OA Application 목록, 옵션정보(개인정보 마스킹/OCR/텍스트로그/이미지로그).
Screen SAFER 시트: 적용대상(모니터/Application/업무시스템), TRACER 수록정보, 캡처방지/이력.
Privacy SAFER 시트: 개인정보 종류(주민번호/외국인번호/계좌번호/전화번호), OCR 필요여부.
[용도/유스케이스] SafePC DLP 프로젝트 사전환경 조사, 서버 스펙, 포트 정의, 연동 정보`,
    source_url: 'https://docs.google.com/spreadsheets/d/1GyZQlROU73HC4NnLkUdwAJyaC5H54BQ0/edit',
  },

  // ── Doc 7: DRM_서버_환경_스펙 → 제품별 서버 하드웨어 스펙 가이드 (depth 2) ──
  {
    group: 'DRM 제품군', name: 'Document SAFER',
    title: 'Document SAFER — 서버 하드웨어 스펙 가이드',
    content: `Document SAFER 서버 환경 스펙 (User수 기반 하드웨어 가이드):
540 User: Xeon 2.1GHz 8Core / 16GB Memory.
5,000 User: Xeon 2.3GHz 12Core / 32GB Memory.
10,000 User: Xeon Gold 2.3GHz 16Core / 48GB Memory.
40,000 User: Xeon Gold 2.3GHz 16Core / 64GB Memory.
공통환경: Ubuntu 22.04, MariaDB 10.4이상, OpenJDK 1.8, Tomcat 8이상.
이중화 구성 시 L4 로드밸런싱 필요.
[용도/유스케이스] Document SAFER 서버 스펙 산정, User수 기반 하드웨어 가이드, 이중화 구성 가이드`,
    source_url: 'https://docs.google.com/spreadsheets/d/1ITHOviKSv5PeDRXzqqn-4s4x0ynnkr_4/edit',
  },
  {
    group: 'DRM 제품군', name: 'Print SAFER',
    title: 'Print SAFER — 서버 하드웨어 스펙 가이드',
    content: `Print SAFER 서버 환경 스펙 (User수 기반 하드웨어 가이드):
1,000~40,000 User별 CPU/Memory/HDD 스펙 제공.
출력로그 관리에 따른 HDD DATA 추가 필요 (이미지로그/텍스트로그 저장 시 디스크 용량 증가).
공통환경: Ubuntu 22.04, MariaDB 10.4이상, OpenJDK 1.8, Tomcat 8이상.
[용도/유스케이스] Print SAFER 서버 스펙 산정, 출력로그 저장 디스크 용량 계획`,
    source_url: 'https://docs.google.com/spreadsheets/d/1ITHOviKSv5PeDRXzqqn-4s4x0ynnkr_4/edit',
  },
  {
    group: 'DRM 제품군', name: 'Screen SAFER',
    title: 'Screen SAFER — 서버 하드웨어 스펙 가이드',
    content: `Screen SAFER/TRACER 서버 환경 스펙 (User수 기반 하드웨어 가이드):
2,000~50,000 User별 CPU/Memory/HDD 스펙 제공.
현대자동차 50,000 User 운영서버 2중화 사례 포함.
공통환경: Ubuntu 22.04, MariaDB 10.4이상, OpenJDK 1.8, Tomcat 8이상.
이중화 구성 시 L4 로드밸런싱 필요.
[용도/유스케이스] Screen SAFER 서버 스펙 산정, 대규모(50,000 User) 운영 사례, 이중화 구성 가이드`,
    source_url: 'https://docs.google.com/spreadsheets/d/1ITHOviKSv5PeDRXzqqn-4s4x0ynnkr_4/edit',
  },

  // ── Doc 8: SafePC v8.0 관리시스템 요구명세서 (depth 2) ──
  {
    group: 'DLP 제품군', name: 'SafePC Enterprise',
    title: 'SafePC Enterprise v8.0 — 관리시스템 요구명세서',
    content: `SafePC Enterprise v8.0 관리시스템 요구명세서. MSA/Docker 기반 웹 관리시스템.
주요기능: 사용자인증(JWT), 환경설정(라이선스/서브시스템/접속/인사연동/로그인관리).
조직관리: 기업체/부서/사용자/결재.
정책관리: 네트워크(사이트차단/메신저차단/공유디렉터리), 디바이스(매체별 허용/차단), 프린터(가시성/비가시성 워터마크/개인정보마스킹), 자동암호화, 프로그램실행차단, 클립보드, 캡처방지, PC설정, 개인정보(검출/실시간/격리).
로그관리: 전체 보안 이벤트 로그 수집.
서버: Rocky Linux 9.4/RHEL 9.x, 클라이언트: Windows 10+/MacOS 10+, 브라우저: Chrome/Edge.
SafePC Enterprise는 매체제어 + 출력물보안 + 개인정보보호 3가지 옵션을 제공하는 통합 DLP 솔루션.
[용도/유스케이스] SafePC v8.0 관리시스템 기능 상세, MSA/Docker 아키텍처, 정책관리 옵션(매체제어/출력물보안/개인정보보호), 통합 DLP 솔루션 도입`,
    source_url: 'https://docs.google.com/document/d/1Sit1uK2aQhn2AOYxjukEWFsUIHuLa393R58VOmq7LyI/edit',
  },

  // ── Doc 9: SafePC Enterprise V7.0 매뉴얼(관리자) (depth 2) ──
  {
    group: 'DLP 제품군', name: 'SafePC Enterprise',
    title: 'SafePC Enterprise V7.0 — 관리자 매뉴얼',
    content: `SafePC Enterprise V7.0 관리자 매뉴얼.
보안관리: PC보안(방화벽/웹차단/컨텐츠업로드차단/웜차단/네트워크로그/매체제어-플로피/CD/USB/PDA/스마트폰/무선랜/HSDPA/WIBRO/테더링/프린트통제/프로그램실행차단/PC설정제어/BAD USB), 개인정보보호(패턴관리-정규식/키워드, 등급관리, 정책관리, 알림관리, 보안정책적용-기본/그룹/직위/개별), 보조기억매체관리(일반저장매체 등록/배포/회수/불용처리), 공유폴더통제.
자산관리: SW/HW관리, 라이센스관리.
감사로그: PC보안/개인정보보호/보조기억매체/신청이력/운영로그.
보고서: Agent설치현황/패턴등급통계/검출현황/매체제어현황.
SafePC Enterprise는 매체제어 + 출력물보안 + 개인정보보호 3가지 옵션을 제공.
[용도/유스케이스] SafePC 관리자 기능 상세, 매체제어(USB/CD/스마트폰/무선랜), 개인정보보호(패턴/등급/정책), 보조기억매체 관리, 감사로그/보고서 기능`,
    source_url: 'https://docs.google.com/document/d/1tM5Lc6Ics8La22uh4ZBhg02A5nrardAm/edit',
  },

  // ── Doc 10: 마크애니_DRM_SW_표준기능정의서 → 제품별 분할 (depth 2) ──
  {
    group: 'DRM 제품군', name: 'Document SAFER',
    title: 'Document SAFER — DRM SW 표준기능정의서 상세',
    content: `마크애니 DRM SW 표준기능정의서 — Document SAFER Green/Blue3:
관리자: 사용자/부서/결재/OEP/시스템관리.
정책: 문서교환/오프라인/캡처방지/원격제어/시간동기화/DRM삭제/블록복사/배치암호화/자동암호화/워터마크.
예외정책, 반출정책, 이력조회/통계, 에이전트.
QDRM_EX: 실시간암호화(프로세스감시/파일포맷비교/저장매체대상/오프라인정책, 프로세스정책).
[용도/유스케이스] Document SAFER DRM SW 표준기능 상세, QDRM_EX 실시간 암호화 정책`,
    source_url: 'https://docs.google.com/spreadsheets/d/17KhfAC6c-Vpp89nWvkidsQhFrn8bIy25/edit',
  },
  {
    group: 'DRM 제품군', name: 'Cowork SAFER',
    title: 'Cowork SAFER — DRM SW 표준기능정의서 상세',
    content: `마크애니 DRM SW 표준기능정의서 — Cowork SAFER:
외부반출변환: MASDOC/ZIP/EXE 형식.
인증: 서버인증/로컬인증.
권한상세설정: 저장/열람/인쇄/블록복사/화면캡처/사용기한 제어.
보안PDF 형태로 유통 — 원본 문서를 PDF로 가공 후 Cowork SAFER 적용.
[용도/유스케이스] Cowork SAFER 외부반출 기능 상세, 보안PDF 유통, 권한 제어 옵션`,
    source_url: 'https://docs.google.com/spreadsheets/d/17KhfAC6c-Vpp89nWvkidsQhFrn8bIy25/edit',
  },

  // ── Doc 11: [IST]정책정의서_v1 → 정책 인덱스 (depth 3) ──
  {
    group: 'DRM 제품군', name: 'Document SAFER',
    title: 'ES SAFER 제품별 정책정의서 인덱스',
    content: `ES SAFER 제품별 정책정의서 인덱스 ([IST]정책정의서_v1).
20개 이상의 시트로 구성된 상세 정책 정의서:
Json2019(표준)/espresso(표준)/Blue2(표준)/Blue_web(표준)/NX_web(표준)/ExchangePolicy/MADRMAgent/ESAgent/배치암호화툴/CipherTool/MASHLMGR/MaPrint옵션/LocalPolicy/자동암호화번호.
PrintSAFER_WEB, Privacy SAFER 3.1_web_Blue/ESPRESSO, ScreenSAFER_2.0_WEB, QDRM_EX_WEB, MIP정책정의서, ES SAFER정책정의서.
참고시트: 표준모듈리스트, DocSAFER 2019 설정값사용현황, 스크린세이퍼정책정의서(2.0/3.0), 개인정보QPRSF정책정의서, QDRM정책, PrintSAFER정책정의서, Espresso/Blue/eGov WEB 테이블명세서.
[용도/유스케이스] ES SAFER 전 제품 정책 정의서 인덱스, 정책 시트 목록 확인, 제품별 WEB 정책 정의서 참조`,
    source_url: 'https://docs.google.com/spreadsheets/d/1K418mxEs1VwE1ulyvlCMyzNStjx2daG60_WJL3eZ7PI/edit',
  },
]

// ── 기존 knowledgeBase.js의 STORES 데이터도 함께 적재 (풍부한 설명 텍스트) ──
const LEGACY_CHUNKS = [
  {
    group: 'DRM 제품군', name: 'DRM',
    content: `마크애니 DRM(Digital Rights Management)은 기업 및 공공기관의 디지털 문서를 암호화하여 무단 열람, 복사, 인쇄, 유출을 방지하는 문서 보안 솔루션입니다. 1999년 출시 이후 25년 이상의 기술 축적으로 국내 DRM 시장 점유율 1위를 유지하고 있습니다.
[용도/유스케이스] 기업/공공기관 문서 암호화, 무단 열람·복사·인쇄·유출 방지, 디지털 문서 보안 통합 솔루션 도입`,
    title: 'DRM 제품 개요',
  },
  {
    group: 'DRM 제품군', name: 'DRM',
    content: `마크애니 DRM 인증 현황: CC인증(EAL2+) 국제 공통평가기준 인증, GS인증(1등급) TTA 소프트웨어 품질 인증, KCMVP 암호모듈 인증(ARIA, SEED, AES 국가 표준 암호 알고리즘), 국가정보원 보안적합성 검증 통과. 국방부, 행정안전부, 방위사업청, 해군본부, 국가정보원 등 최고 보안 등급 기관에서 운용 중.
[용도/유스케이스] 보안 인증 요건 충족(CC인증/GS인증/KCMVP), 공공기관·국방 보안적합성 검증 대응, 국가 표준 암호 알고리즘 적용`,
    title: 'DRM 인증 현황',
  },
  {
    group: 'DRM 제품군', name: 'DRM',
    content: `마크애니 DRM 맞춤형 구축: 국방부/정부기관(망분리, 보안등급별 문서분류, 감사로그 강화, 오프라인 모드), 대기업(10,000+ User, AD/LDAP, SSO, 그룹웨어 연동), 금융기관(금융보안원 가이드라인, 개인정보 보호, 감사 추적). 구축 기간: 소규모(100 User 이하) 2~4주, 중규모(100~1,000) 4~8주, 대규모(1,000+) 8~16주. 프로세스: 요구사항 분석→설계→개발/커스터마이징→테스트→파일럿→전사 배포→안정화.
[용도/유스케이스] 국방/정부기관 맞춤 구축, 대기업 AD/LDAP/SSO 연동, 금융기관 컴플라이언스 대응, 망분리 환경 문서 보안, 대규모 사용자 환경 DRM 구축`,
    title: 'DRM 맞춤형 구축',
  },
  {
    group: 'DRM 제품군', name: 'DRM',
    content: `마크애니 DRM v3.2 기술 사양: OS(Windows 10/11, Server 2016/2019/2022, macOS 12+, Linux Ubuntu 20.04+/CentOS 7+), 모바일(iOS 15+, Android 12+), 브라우저(Chrome 90+, Edge 90+, Firefox 90+, Safari 15+), 오프라인 모드(로컬 캐시 최대 30일), API(REST/SOAP/SDK C++/Java/.NET), 연동(AD/LDAP, SSO SAML 2.0/OAuth 2.0, 그룹웨어, ERP SAP/Oracle), 암호화(AES-256, ARIA-256, SEED-256), 성능(단일 파일 0.5초, 1,000파일 5분 이내).
[용도/유스케이스] 멀티 OS 환경 DRM 적용, 모바일·브라우저 호환 문서 보안, REST/SOAP API 연동 개발, SSO/AD/LDAP 통합 인증 연동, ERP·그룹웨어 연동`,
    title: 'DRM 호환성 및 기술 사양',
  },
  {
    group: 'DRM 제품군', name: 'DRM',
    content: `마크애니 DRM 주요 레퍼런스: 국방부(군사 기밀 문서 보안, 2020~현재, 5,000+ User), 행정안전부(전자정부 문서 보안 표준, 2018~), 방위사업청(방산 기술 문서 보안, 2019~), 해군본부(함정 설계 문서 보안, 2021~), 국가정보원(기밀 문서 관리, 2017~), SK하이닉스(반도체 설계 문서 보안, 2022~, 10,000+ User), 삼성전자(연구개발 문서 보안, 2020~), LG전자(제품 설계 문서 보안, 2021~), 국민건강보험공단(개인정보 문서 보안, 2023~). 총 1,000+ 고객사, 500,000+ 사용자.
[용도/유스케이스] 국방·공공기관 도입 사례 참고, 대기업(SK하이닉스/삼성전자/LG전자) 도입 사례, 금융·의료 기관 개인정보 문서 보안 사례`,
    title: 'DRM 주요 레퍼런스',
  },
  {
    group: 'DRM 제품군', name: 'Document SAFER',
    content: `Document SAFER는 기업 문서의 생성부터 폐기까지 전 생명주기를 관리하는 통합 문서 보안 솔루션. 문서 암호화, 접근 제어, 사용 이력 추적, 출력 보안을 하나의 플랫폼에서 제공. v3.2에서 대량 파일 처리 30% 개선, 윈도우 11 완벽 지원, 클라우드 하이브리드 환경 지원 추가.
[용도/유스케이스] 문서 생명주기 관리(생성~폐기), 문서 암호화 및 접근 제어, 사용 이력 추적 및 감사 로그, 출력 보안, 교육자료·설계문서·연구자료 유출 방지, 클라우드 하이브리드 환경 문서 보안`,
    title: 'Document SAFER 제품 개요',
  },
  {
    group: 'DRM 제품군', name: 'Document SAFER',
    content: `Document SAFER v3.2 주요 기능: 1) AES-256 실시간 투명 암호화 2) RBAC 역할 기반 접근 제어 3) 열람/편집/인쇄/복사/캡처 이력 추적 + 감사 로그 4) DRM 암호화 문서에 한해 인쇄 시 워터마크 출력 지원(범용 워터마크 아님) 5) USB/이메일/클라우드 외부 반출 제어 6) 배치 처리 엔진 최적화(1,000파일 30% 속도 개선) 7) On-Premise + Cloud(AWS/Azure/GCP) 하이브리드 배포.
[용도/유스케이스] AES-256 실시간 암호화, 역할 기반 접근 제어(RBAC), 감사 로그 및 이력 추적, USB/이메일/클라우드 반출 제어, 대량 파일 일괄 암호화`,
    title: 'Document SAFER 주요 기능',
  },
  {
    group: 'DRM 제품군', name: 'Document SAFER',
    content: `Document SAFER v3.1→v3.2 업그레이드: 소요 30분(서버 재시작 포함), 다운타임 약 30분(야간 작업 권장), v3.0 이상 직접 업그레이드 가능(v2.x는 마이그레이션 필요), 자동 백업 + 1시간 이내 롤백, 기존 라이선스 유지(유지보수 계약 내 추가 비용 없음), 업그레이드 후 1시간 온라인 교육 제공.
[용도/유스케이스] Document SAFER 버전 업그레이드, 기존 v3.0/v3.1에서 v3.2 마이그레이션, 업그레이드 소요 시간 및 다운타임 안내`,
    title: 'Document SAFER 업그레이드 가이드',
  },
  {
    group: 'DRM 제품군', name: 'Document SAFER',
    content: `Document SAFER v3.2 호환성: Windows 10(21H2+)/11(22H2+) 완벽 지원, Windows Server 2019/2022, macOS 13+ 뷰어 전용, 오피스(MS Office 2016/2019/2021/365, 한컴오피스 2020+), PDF(Adobe Acrobat Reader DC, Foxit Reader), CAD(AutoCAD 2020+, SolidWorks 2020+ 플러그인), 브라우저(Chrome/Edge/Firefox 웹 뷰어). 과거 윈도우 11 호환성 문제(v3.1 이하 커널 드라이버 충돌 블루스크린)가 v3.2에서 완전 해결.
[용도/유스케이스] Windows 11 환경 DRM 호환성 확인, MS Office/한컴오피스/PDF/CAD 지원 범위 확인, macOS 뷰어 지원, 브라우저 웹 뷰어 지원`,
    title: 'Document SAFER 호환성',
  },
  // SafeCopy, ContentSAFER 삭제 — 시트 원본에 없는 제품. 출처 불명 데이터 제거.
]

// ── Row-based chunking: 제품별로 모든 정보를 하나의 텍스트 청크로 병합 ──
// [의도] useCases를 제품명 바로 다음에 배치 + 청크 끝에 한 번 더 반복
// → 임베딩 공간에서 "용도" 시그널이 기술 스펙에 희석되지 않도록 가중치 강화
// → ePage SAFER 같은 제품이 "위변조방지" 쿼리에서 제대로 매칭되도록
function buildChunkText(product) {
  const parts = [`[제품명] ${product.name}`]
  parts.push(`[제품군] ${product.group}`)
  // useCases를 상단에 배치 — 임베딩 모델은 앞부분 텍스트에 더 높은 가중치 부여
  if (product.useCases) parts.push(`[용도/유스케이스] ${product.useCases}`)
  if (product.version) parts.push(`[버전] ${product.version}`)
  if (product.features) parts.push(`[주요기능] ${product.features}`)
  if (product.serverEnv) parts.push(`[서버환경] ${product.serverEnv}`)
  if (product.clientEnv) parts.push(`[사용자환경] ${product.clientEnv}`)
  if (product.appSupport) parts.push(`[Application 지원범위] ${product.appSupport}`)
  if (product.cadSupport) parts.push(`[CAD 지원범위] ${product.cadSupport}`)
  if (product.browserSupport) parts.push(`[브라우저 지원범위] ${product.browserSupport}`)
  if (product.integration) parts.push(`[연동 시스템] ${product.integration}`)
  if (product.notes) parts.push(`[비고] ${product.notes}`)
  if (product.docs) parts.push(`[관련 문서] ${product.docs}`)
  // useCases를 끝에 한 번 더 반복 — 임베딩 벡터에서 용도 시그널 강화
  if (product.useCases) parts.push(`[핵심 용도 요약] ${product.name}: ${product.useCases}`)
  return parts.join('\n')
}

// ── Gemini 임베딩 생성 (rate limit 대응: 배치 + 딜레이) ──
async function generateEmbedding(text) {
  const result = await embeddingModel.embedContent({
    content: { parts: [{ text }] },
    taskType: 'RETRIEVAL_DOCUMENT',
  })
  return result.embedding.values
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ── 메인 실행 ──
async function ingest() {
  console.log('🚀 Knowledge Ingestion 시작\n')

  // 기존 데이터 삭제 (재실행 시 중복 방지)
  console.log('🗑️  기존 knowledge_chunks 데이터 삭제...')
  const { error: delErr } = await supabase.from('knowledge_chunks').delete().neq('id', 0)
  if (delErr) {
    console.log(`⚠️  삭제 실패 (테이블이 없을 수 있음): ${delErr.message}`)
    console.log('   → setupSupabaseVector.js의 SQL을 먼저 실행하세요.\n')
    return
  }
  console.log('   ✅ 기존 데이터 삭제 완료\n')

  const allChunks = []

  // 1. 시트 데이터 → 청크
  console.log('📊 시트 데이터 청크 생성...')
  for (const product of SHEET_PRODUCTS) {
    const text = buildChunkText(product)
    allChunks.push({
      content: text,
      metadata: {
        source: 'google_sheet',
        product_group: product.group,
        product_name: product.name,
        version: product.version || '',
        title: `${product.name} 제품 정보`,
      },
    })
  }
  console.log(`   ✅ 시트 데이터: ${SHEET_PRODUCTS.length}개 청크\n`)

  // 2. 하이퍼링크 문서 → 청크 (기능정의서/스펙정의서 등 2depth 상세 문서)
  console.log('🔗 하이퍼링크 문서 청크 추가...')
  for (const chunk of HYPERLINK_CHUNKS) {
    const text = [
      `[제품명] ${chunk.name}`,
      `[제품군] ${chunk.group}`,
      `[문서제목] ${chunk.title}`,
      chunk.content,
    ].join('\n')
    allChunks.push({
      content: text,
      metadata: {
        source: 'hyperlink_doc',
        product_group: chunk.group,
        product_name: chunk.name,
        title: chunk.title,
        source_url: chunk.source_url || '',
      },
    })
  }
  console.log(`   ✅ 하이퍼링크 문서: ${HYPERLINK_CHUNKS.length}개 청크\n`)

  // 3. Deep Research 청크 → 상세 정책/매뉴얼/SDK/CAD 매트릭스 등
  console.log('🔬 Deep Research 청크 추가...')
  for (const chunk of DEEP_RESEARCH_CHUNKS) {
    const text = [
      `[제품명] ${chunk.name}`,
      `[제품군] ${chunk.group}`,
      `[문서제목] ${chunk.title}`,
      chunk.content,
    ].join('\n')
    allChunks.push({
      content: text,
      metadata: {
        source: 'deep_research',
        product_group: chunk.group,
        product_name: chunk.name,
        title: chunk.title,
        source_url: chunk.source_url || '',
      },
    })
  }
  console.log(`   ✅ Deep Research: ${DEEP_RESEARCH_CHUNKS.length}개 청크\n`)

  // 4. 기존 STORES 데이터 → 청크 (풍부한 설명 텍스트)
  console.log('📚 기존 지식 베이스 청크 추가...')
  for (const chunk of LEGACY_CHUNKS) {
    allChunks.push({
      content: chunk.content,
      metadata: {
        source: 'legacy_stores',
        product_group: chunk.group,
        product_name: chunk.name,
        title: chunk.title,
      },
    })
  }
  console.log(`   ✅ 기존 지식 베이스: ${LEGACY_CHUNKS.length}개 청크\n`)

  console.log(`📐 총 ${allChunks.length}개 청크 임베딩 생성 시작...\n`)

  // 3. 임베딩 생성 + Supabase 적재 (1개씩, rate limit 대응)
  let successCount = 0
  let failCount = 0

  for (let i = 0; i < allChunks.length; i++) {
    const chunk = allChunks[i]
    const label = chunk.metadata.title || chunk.metadata.product_name
    process.stdout.write(`  [${i + 1}/${allChunks.length}] ${label}... `)

    try {
      const embedding = await generateEmbedding(chunk.content)

      const { error: insertErr } = await supabase.from('knowledge_chunks').insert({
        content: chunk.content,
        embedding: embedding,
        metadata: chunk.metadata,
      })

      if (insertErr) {
        console.log(`❌ DB 삽입 실패: ${insertErr.message}`)
        failCount++
      } else {
        console.log('✅')
        successCount++
      }
    } catch (err) {
      console.log(`❌ 임베딩 실패: ${err.message}`)
      failCount++
    }

    // Rate limit 대응: 100ms 딜레이
    if (i < allChunks.length - 1) await sleep(150)
  }

  console.log(`\n${'='.repeat(50)}`)
  console.log(`✅ 완료: ${successCount}개 성공, ${failCount}개 실패 (총 ${allChunks.length}개)`)
  console.log(`${'='.repeat(50)}`)

  // 4. IVFFlat 인덱스 생성 안내 (데이터 삽입 후에만 가능)
  if (successCount > 0) {
    console.log('\n📌 벡터 검색 인덱스를 Supabase SQL Editor에서 실행하세요:')
    console.log('   CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx')
    console.log('     ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);')
  }
}

ingest().catch(err => {
  console.error('❌ Ingestion 실패:', err)
  process.exit(1)
})
