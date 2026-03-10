#!/usr/bin/env node
// Google Sheets 제품 정보 → Gemini 임베딩 → Supabase pgvector 적재
// [의도] 하드코딩 STORES를 실제 벡터 DB로 교체하기 위한 1회성 데이터 파이프라인
// Phase 1: 시트 데이터(1depth)만 처리. Phase 2에서 하이퍼링크 문서 크롤링 추가 예정.
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { config } from 'dotenv'

config({ path: '.env' })

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' })

// ── 시트 데이터 (MCP로 읽은 "제품정보 및 현황" 시트 Row 4~34) ──
// 컬럼: B=구분(그룹), C=제품명, D=버전정보, E=기능명세서, F=제품매뉴얼,
//        G=사전환경조사서, H=서버스펙, I=서버환경, J=사용자환경,
//        K=Application지원범위, L=CAD지원범위, M=Browser지원범위, N=연동시스템, O=비고
const SHEET_PRODUCTS = [
  {
    group: 'DRM 제품군', name: 'ES SAFER',
    version: 'Document SAFER Green, Document SAFER Blue3, Print SAFER 4.0, Privacy SAFER 3.1, Screen SAFER 3.0',
    serverEnv: 'OS: Windows, Ubuntu, Rocky / WAS: Tomcat 9.0.100 / DB: MariaDB 11.6 / JDK: Java 1.8',
    clientEnv: 'Windows 10, 11 (32/64bit)',
    features: 'ES SAFER 통합 제품군. Document SAFER, Print SAFER, Privacy SAFER, Screen SAFER를 포함하는 통합 문서보안 솔루션.',
    docs: '(PQG_QAT)_ES SAFER_표준기능정의서, 프로젝트_스펙정의서_v2.4.xlsx',
  },
  {
    group: 'DRM 제품군', name: 'Document SAFER',
    version: 'Green(v7.0), Blue3(v3.0.02)',
    serverEnv: 'OS: Windows, Ubuntu, Rocky / WAS: Tomcat 9.0.65 / DB: Oracle 19c, MSSQL 2019, MariaDB 11.0.2 / JDK: Java 1.8',
    clientEnv: 'Windows 7, 8, 10, 11 (32/64bit)',
    appSupport: '표준 OA(Office, HWP, PDF, Notepad) 최신 버전까지 지원',
    cadSupport: 'ES사업부_제품개발팀_제품별_모듈담당자_V2.0',
    notes: 'MS오피스 DRM & MIP 저장 정책',
    docs: 'IST_표준기능정의서, 프로젝트_스펙정의서_v2.4.xlsx',
  },
  {
    group: 'DRM 제품군', name: 'Privacy SAFER',
    version: 'v3.1',
    serverEnv: '상동 (Document SAFER와 동일)',
    clientEnv: 'Windows 7, 8, 10, 11 (32/64bit)',
    docs: 'IST_표준기능정의서',
  },
  {
    group: 'DRM 제품군', name: 'Print SAFER',
    version: 'v4.0',
    serverEnv: '상동 (Document SAFER와 동일)',
    clientEnv: 'Windows 7, 8, 10, 11 (32/64bit)',
    docs: 'IST_표준기능정의서',
  },
  {
    group: 'DRM 제품군', name: 'Print TRACER',
    version: 'v4.0',
    serverEnv: '상동 (Document SAFER와 동일)',
    clientEnv: 'Windows 7, 8, 10, 11 (32/64bit)',
    notes: 'Print SAFER 내 비가시성 기능으로 제공',
  },
  {
    group: 'DRM 제품군', name: 'Screen SAFER',
    version: 'v3.0',
    serverEnv: '상동 (Document SAFER와 동일)',
    clientEnv: 'Windows 7, 8, 10, 11 (32/64bit)',
    docs: 'IST_표준기능정의서',
  },
  {
    group: 'DRM 제품군', name: 'Screen TRACER',
    version: 'v3.0',
    serverEnv: '상동 (Document SAFER와 동일)',
    clientEnv: 'Windows 7, 8, 10, 11 (32/64bit), MAC OS',
    notes: 'Screen SAFER 내 비가시성 기능으로 제공. TRACER 제품군(SDK)와 병행 체크 필요.',
  },
  {
    group: 'DRM 제품군', name: 'Web SAFER',
    version: 'v5.0',
    serverEnv: '고객사 서버 환경에 따름',
    clientEnv: 'Windows 7, 8, 10, 11 (32/64bit)',
    browserSupport: 'Chrome, Edge, Firefox, Opera, Whale',
  },
  {
    group: 'DRM 제품군', name: 'Cowork SAFER',
    version: 'v2.0',
    serverEnv: 'OS: Windows, Ubuntu, Rocky / WAS: Tomcat 9.0.65 / DB: Oracle 19c, MSSQL 2019, MariaDB 11.0.2 / JDK: Java 1.8',
    clientEnv: 'Windows 7, 8, 10, 11 (32/64bit)',
    appSupport: 'MS-Office, 한글, PDF',
    docs: 'IST_표준기능정의서',
  },
  {
    group: 'DRM 제품군', name: 'Mobile DOCS',
    version: 'Android: 4.x.x / iOS: 3.x.xx',
    serverEnv: '상동 (Document SAFER와 동일)',
    clientEnv: '최소 OS 사양: Android 7, iOS 14',
    docs: 'Mobile Docs_기능정의서_v_0.2.xlsx',
  },
  {
    group: 'DRM 제품군', name: 'Mobile SAFER',
    version: 'Android: 3.00.xxxx / iOS: 2.00.xxxx',
    serverEnv: 'OS: Rocky 9, Windows Server / WAS: Tomcat 8.5~9.0 / DB: MySQL 5.7/8, Oracle / JDK: 1.8',
    clientEnv: '최소 OS 사양: Android 10, iOS 14',
    docs: 'Mobile SAFER (요구 명세서).pdf',
  },
  {
    group: 'DRM 제품군', name: 'Mobile STICKER',
    version: 'Android: 1.0.106 / iOS: 1.0.58',
    serverEnv: 'N/A',
    clientEnv: '최소 OS 사양: Android 7, iOS 10',
    docs: 'Mobile STICKER (요구 명세서).pdf',
  },
  {
    group: 'DRM 제품군', name: 'Mobile Capture SAFER',
    version: 'Android: 2.5.xx / iOS: 1.2.xx',
    serverEnv: 'N/A',
    clientEnv: '최소 OS 사양: Android 7, iOS 15',
    docs: 'Capture SAFER_V1.2_통합_기능정의서.pptx',
  },
  {
    group: 'DRM 제품군', name: 'iScreen SAFER',
    version: 'iOS: 2.1.02',
    serverEnv: 'N/A',
    clientEnv: '최소 OS 사양: iOS 11',
  },
  {
    group: 'DRM 제품군', name: '국방모바일보안',
    version: '',
    serverEnv: 'N/A',
    clientEnv: '최소 OS 사양: Android 7, iOS 10',
    docs: '02_MMSA_1R14a_요구사항정의서_V1.0.xlsx',
  },
  {
    group: 'DRM 제품군', name: 'Document SAFER I/F (Server)',
    version: 'Windows: Document SAFER 버전에 따름 / Linux/Unix: Document SAFER 제품 버전에 따름',
    serverEnv: '[서버 DRM] IBM AIX(POWERPC), SUN Oracle(SPARC/Intel), HP HP-UX(IA64/PA-RISC), Linux(Intel). Memory 무관, HDD 형태 무관, Storage 바이너리 약 300MB + 로그 용량. macrypto 미사용 Document SAFER Green은 소스 직접 컴파일 시 모든 UNIX 계열 OS 지원 가능.',
    clientEnv: '[서버 DRM] IBM AIX(AIX 5.3~), SUN Oracle(Solaris 5.10~), HP(HP-UX IA64 11.31~, PA-RISC 11.11~), Linux(kernel 2.6~). JDK 1.2 이상 연동 인터페이스 지원.',
    integration: 'JAVA 인터페이스를 사용하는 모든 시스템에 적용 가능. C 인터페이스를 사용하는 모든 시스템에 적용 가능. 서버에 접근하여 파일을 업로드/다운로드하는 시스템일 경우 적용 가능. 고객사 개발자가 서버 DRM 인터페이스를 호출하는 방법으로 연동.',
    docs: '연동IF정의서, MaFileCipherXU, Server DRM, MarkAny Unix 설치 지원 요청서 양식.xls',
  },
  {
    group: 'DRM 제품군', name: 'Document SAFER I/F (Client)',
    version: 'Document SAFER 제품 버전에 따름',
    clientEnv: 'Windows 7, 8, 10, 11 (32/64bit)',
    docs: 'DSFileCipherX',
  },
  {
    group: 'DRM 제품군', name: 'MACRYPTO V3.0 (KCMVP)',
    version: 'V3.00',
    features: 'KCMVP 인증 암호모듈. 국가정보원 암호모듈 검증 제품.',
    docs: '20_Macrypto V3.00 (보안정책정의서)',
  },
  // ── DLP 제품군 ──
  {
    group: 'DLP 제품군', name: 'SafePC Enterprise',
    version: 'V7.0',
    serverEnv: '[202506 최신 버전 기준] OS: RedHat 9.4 / Rocky 9.4 / WAS: Tomcat 9.0.102 / DB: MariaDB 11.4.2 / JDK: OpenJDK 21.0.1',
    clientEnv: 'Windows 10 (32/64bit), Windows 11 (64bit). 이하 버전은 EOS로 정식 지원하지 않음.',
    browserSupport: 'Chrome, Edge, Firefox',
    notes: '기존 SecuPrint 기능 신규 제공 불가 (Litech 연동 제품 EOS). PrintSAFER 출력물 제어 기능 연동 개발 중.',
    docs: 'SAFEPC_정책정의서.xlsx, SafePC Enterprise V7.0 매뉴얼, 프로젝트_스펙정의서_v2.4.xlsx',
  },
  {
    group: 'DLP 제품군', name: 'SafeUSB',
    version: 'V7.1',
    serverEnv: '[202506 최신 버전 기준] OS: RedHat 9.4 / Rocky 9.4 / WAS: Tomcat 9.0.102 / DB: MariaDB 11.4.2 / JDK: OpenJDK 21.0.1',
    clientEnv: 'Windows 10 (32/64bit), Windows 11 (64bit). 이하 버전은 EOS로 정식 지원하지 않음.',
    browserSupport: 'Chrome, Edge, Firefox',
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
    docs: 'EVM-ePageSAFER v2.5 (요구 명세서).pdf, ePageSAFER 매뉴얼, AIT_ePS_사전조사서.xls',
  },
  {
    group: '응용보안 제품군', name: 'VoiceBarcode',
    version: 'v2.5',
  },
  {
    group: '응용보안 제품군', name: 'ePage SAFER for Web DRM',
    version: 'v2.5',
    serverEnv: 'OS: Windows 7, 8, 10, 11 (32/64bit) / WEB/WAS: ALL / DB: N/A / JDK: N/A',
    clientEnv: 'Windows 7, 8, 10, 11 (32/64bit)',
    browserSupport: 'Chrome, Edge, Firefox, Opera, Whale',
    integration: 'Nexacro NRE(넥사크로 EXE 환경) / WRE(일반 브라우저 환경)',
    docs: 'EVM-e-PageSAFER_V2.5 WebDRM 요구명세서.pdf, ePageSAFER WebDRM 매뉴얼',
  },
  {
    group: '응용보안 제품군', name: 'ePS DocumentMerger',
    version: 'v2.5',
    serverEnv: 'OS: Windows NT 계열, Unix(IBM AIX 4.3+, SUN Solaris 5.7+, HP HP-UX 11.0+), Linux 전 기종 / WAS: ALL / DB: N/A / JDK: 1.4 이상',
    clientEnv: 'Windows 7, 8, 10, 11 (32/64bit) / Linux(Fedora/Ubuntu) (32/64bit) / Mac 10.10 이상',
    browserSupport: 'Chrome, Edge, Firefox, Opera, Whale',
    docs: 'ePS DocumentMerger 매뉴얼',
  },
  {
    group: '응용보안 제품군', name: 'ePS Document DNA',
    version: 'v2.5',
    serverEnv: 'OS: Windows NT 계열(PDF 변환 필요시 필수), Unix(IBM AIX 4.3+, SUN Solaris 5.7+, HP HP-UX 11.0+), Linux 전 기종 / WAS: ALL / DB: N/A / JDK: 1.4 이상',
    clientEnv: 'Windows 7, 8, 10, 11 (32/64bit) / Linux(Fedora/Ubuntu) (32/64bit) / Mac 10.10 이상',
    browserSupport: 'Chrome, Edge, Firefox, Opera, Whale',
    docs: 'ePS Document DNA 매뉴얼',
  },
  // ── TRACER 제품군 ──
  {
    group: 'TRACER 제품군', name: 'TRACER SDK for Screen',
    version: 'V1.0',
    serverEnv: 'Windows Server, Linux',
    clientEnv: 'Windows 10, 11, MAC OS',
    notes: '화면보호 SW Add-in',
  },
  {
    group: 'TRACER 제품군', name: 'TRACER SDK for Print',
    version: 'V1.0',
    serverEnv: 'Windows Server, Linux',
    clientEnv: 'Windows 10, 11',
    notes: '출력보호 SW Add-in',
  },
  {
    group: 'TRACER 제품군', name: 'TRACER SDK for Web',
    version: 'V1.0',
    serverEnv: 'Windows Server, Linux',
    clientEnv: '서버 Side임에 따라 무관',
    browserSupport: 'Chrome, Edge, Firefox, Opera, Whale',
    notes: '적용 시스템 Add-in',
  },
  {
    group: 'TRACER 제품군', name: 'TRACER SDK for Mobile',
    version: 'V1.0',
    clientEnv: '최소 OS 사양: Android 7, iOS 10',
    notes: 'App Add-in',
  },
]

// ── 기존 knowledgeBase.js의 STORES 데이터도 함께 적재 (풍부한 설명 텍스트) ──
const LEGACY_CHUNKS = [
  {
    group: 'DRM 제품군', name: 'DRM',
    content: `마크애니 DRM(Digital Rights Management)은 기업 및 공공기관의 디지털 문서를 암호화하여 무단 열람, 복사, 인쇄, 유출을 방지하는 문서 보안 솔루션입니다. 1999년 출시 이후 25년 이상의 기술 축적으로 국내 DRM 시장 점유율 1위를 유지하고 있습니다.`,
    title: 'DRM 제품 개요',
  },
  {
    group: 'DRM 제품군', name: 'DRM',
    content: `마크애니 DRM 인증 현황: CC인증(EAL2+) 국제 공통평가기준 인증, GS인증(1등급) TTA 소프트웨어 품질 인증, KCMVP 암호모듈 인증(ARIA, SEED, AES 국가 표준 암호 알고리즘), 국가정보원 보안적합성 검증 통과. 국방부, 행정안전부, 방위사업청, 해군본부, 국가정보원 등 최고 보안 등급 기관에서 운용 중.`,
    title: 'DRM 인증 현황',
  },
  {
    group: 'DRM 제품군', name: 'DRM',
    content: `마크애니 DRM 맞춤형 구축: 국방부/정부기관(망분리, 보안등급별 문서분류, 감사로그 강화, 오프라인 모드), 대기업(10,000+ User, AD/LDAP, SSO, 그룹웨어 연동), 금융기관(금융보안원 가이드라인, 개인정보 보호, 감사 추적). 구축 기간: 소규모(100 User 이하) 2~4주, 중규모(100~1,000) 4~8주, 대규모(1,000+) 8~16주. 프로세스: 요구사항 분석→설계→개발/커스터마이징→테스트→파일럿→전사 배포→안정화.`,
    title: 'DRM 맞춤형 구축',
  },
  {
    group: 'DRM 제품군', name: 'DRM',
    content: `마크애니 DRM v3.2 기술 사양: OS(Windows 10/11, Server 2016/2019/2022, macOS 12+, Linux Ubuntu 20.04+/CentOS 7+), 모바일(iOS 15+, Android 12+), 브라우저(Chrome 90+, Edge 90+, Firefox 90+, Safari 15+), 오프라인 모드(로컬 캐시 최대 30일), API(REST/SOAP/SDK C++/Java/.NET), 연동(AD/LDAP, SSO SAML 2.0/OAuth 2.0, 그룹웨어, ERP SAP/Oracle), 암호화(AES-256, ARIA-256, SEED-256), 성능(단일 파일 0.5초, 1,000파일 5분 이내).`,
    title: 'DRM 호환성 및 기술 사양',
  },
  {
    group: 'DRM 제품군', name: 'DRM',
    content: `마크애니 DRM 주요 레퍼런스: 국방부(군사 기밀 문서 보안, 2020~현재, 5,000+ User), 행정안전부(전자정부 문서 보안 표준, 2018~), 방위사업청(방산 기술 문서 보안, 2019~), 해군본부(함정 설계 문서 보안, 2021~), 국가정보원(기밀 문서 관리, 2017~), SK하이닉스(반도체 설계 문서 보안, 2022~, 10,000+ User), 삼성전자(연구개발 문서 보안, 2020~), LG전자(제품 설계 문서 보안, 2021~), 국민건강보험공단(개인정보 문서 보안, 2023~). 총 1,000+ 고객사, 500,000+ 사용자.`,
    title: 'DRM 주요 레퍼런스',
  },
  {
    group: 'DRM 제품군', name: 'Document SAFER',
    content: `Document SAFER는 기업 문서의 생성부터 폐기까지 전 생명주기를 관리하는 통합 문서 보안 솔루션. 문서 암호화, 접근 제어, 사용 이력 추적, 출력 보안을 하나의 플랫폼에서 제공. v3.2에서 대량 파일 처리 30% 개선, 윈도우 11 완벽 지원, 클라우드 하이브리드 환경 지원 추가.`,
    title: 'Document SAFER 제품 개요',
  },
  {
    group: 'DRM 제품군', name: 'Document SAFER',
    content: `Document SAFER v3.2 주요 기능: 1) AES-256 실시간 투명 암호화 2) RBAC 역할 기반 접근 제어 3) 열람/편집/인쇄/복사/캡처 이력 추적 + 감사 로그 4) 인쇄 시 워터마크 자동 삽입 + 출력물 추적 코드 5) USB/이메일/클라우드 외부 반출 제어 6) 배치 처리 엔진 최적화(1,000파일 30% 속도 개선) 7) On-Premise + Cloud(AWS/Azure/GCP) 하이브리드 배포.`,
    title: 'Document SAFER 주요 기능',
  },
  {
    group: 'DRM 제품군', name: 'Document SAFER',
    content: `Document SAFER v3.1→v3.2 업그레이드: 소요 30분(서버 재시작 포함), 다운타임 약 30분(야간 작업 권장), v3.0 이상 직접 업그레이드 가능(v2.x는 마이그레이션 필요), 자동 백업 + 1시간 이내 롤백, 기존 라이선스 유지(유지보수 계약 내 추가 비용 없음), 업그레이드 후 1시간 온라인 교육 제공.`,
    title: 'Document SAFER 업그레이드 가이드',
  },
  {
    group: 'DRM 제품군', name: 'Document SAFER',
    content: `Document SAFER v3.2 호환성: Windows 10(21H2+)/11(22H2+) 완벽 지원, Windows Server 2019/2022, macOS 13+ 뷰어 전용, 오피스(MS Office 2016/2019/2021/365, 한컴오피스 2020+), PDF(Adobe Acrobat Reader DC, Foxit Reader), CAD(AutoCAD 2020+, SolidWorks 2020+ 플러그인), 브라우저(Chrome/Edge/Firefox 웹 뷰어). 과거 윈도우 11 호환성 문제(v3.1 이하 커널 드라이버 충돌 블루스크린)가 v3.2에서 완전 해결.`,
    title: 'Document SAFER 호환성',
  },
  {
    group: 'DRM 제품군', name: 'SafeCopy',
    content: `SafeCopy는 출력물 보안 솔루션. 인쇄 문서에 비가시적 워터마크를 삽입하여 유출 시 출력자 추적 가능. 복사기/스캐너를 통한 2차 유출도 추적. 주요 기능: 비가시적 워터마크 삽입, 출력자 추적, 출력 정책 관리, 출력 이력 감사, 복사/스캔 추적. 국방부, 금융기관, 대기업 등 보안 중요 환경에서 사용.`,
    title: 'SafeCopy 제품 개요',
  },
  {
    group: '응용보안 제품군', name: 'ContentSAFER',
    content: `ContentSAFER는 디지털 콘텐츠(영상, 이미지, 음원 등) 저작권 보호 솔루션. 포렌식 워터마킹 기술로 콘텐츠에 비가시적 식별 정보를 삽입하여 불법 복제 및 유출 경로 추적. OTT 플랫폼, 방송사, 영화 배급사 등에서 사용. 주요 기능: 포렌식 워터마킹, 실시간 스트리밍 워터마킹, 콘텐츠 추적, 불법 복제 탐지.`,
    title: 'ContentSAFER 제품 개요',
  },
]

// ── Row-based chunking: 제품별로 모든 정보를 하나의 텍스트 청크로 병합 ──
function buildChunkText(product) {
  const parts = [`[제품명] ${product.name}`]
  parts.push(`[제품군] ${product.group}`)
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

  // 2. 기존 STORES 데이터 → 청크 (풍부한 설명 텍스트)
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
