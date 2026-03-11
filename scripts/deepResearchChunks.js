// ── Deep Research Chunks: 4개 sub-agent가 수집한 deepResearch JSON → 벡터 DB 임베딩용 청크 ──
// [의도] 기존 HYPERLINK_CHUNKS(요약 수준)에서 다루지 못한 상세 정책 필드, CAD 지원 매트릭스,
// SDK API, 매뉴얼 운영 가이드 등을 추가하여 RAG 검색 정확도를 높임
// 각 청크는 특정 질문에 답할 수 있는 "답변 단위"로 설계
export const DEEP_RESEARCH_CHUNKS = [

  // ═══════════════════════════════════════════════════════════════
  // Part 1: IST 표준기능정의서 raw_data 상세 + DRM 서버 스펙
  // ═══════════════════════════════════════════════════════════════

  // ── Document SAFER JSON 웹 CCF 정책 상세 (1014행 정책정의서에서 핵심 추출) ──
  {
    group: 'DRM 제품군', name: 'Document SAFER',
    title: 'Document SAFER — JSON/Espresso CCF 정책 필드 상세',
    content: `Document SAFER JSON2019/Espresso 표준 CCF 정책 필드 상세 (정책정의서 기반):
에이전트 정책: agent_auto_login(자동로그인 0/1), agent_policy_schedule_time(정책업데이트 주기 180분),
agent_password_change_rule(8|15|1|1|1 = 최소8자|최대15자|영문필수|특수문자필수|숫자필수),
agent_login_with_capturesafer2(ScreenSAFER SSO연동), agent_login_with_privacy_v3(개인정보보호 SSO연동).
문서교환정책: autodocexchangepolicy 값으로 제어 — 개인한/부서한/사내한/그룹사한 등.
오프라인정책: offlinepolicy(0=App사용불가, 1=파일사용불가, 2=읽기전용, 3=자체권한).
보안제어: loadimagesafer(화면캡처방지 0/1), protectremotetool(원격제어차단 0/1), autoblockcopypolicy(블록복사방지 0/1).
배치암호화: batch_enc_run_type(1=로그인시, 2=에이전트실행시, 3=스케줄), batch_enc_support_ext(대상확장자).
자동암호화: autoencryptpolicy(앱별 자동암호화 코드 — Word|Excel|PPT|HWP|PDF 등).
워터마크: vp_option_onoff_00(사용여부), vp_option_ci_logo_*(로고), vp_option_info_*(출력정보), vp_option_bg_*(배경).
반출정책: takeoutType(사후확인/자가승인/사전승인), takeoutupsize(-99=무제한), takeoutdowncnt(1~10회), takeoutdownterm(1~30일).
OEP(비상인증): agent_oep_off_auth_count(횟수), agent_oep_off_auth_period(기간).
암호화 알고리즘: CONTENTS_CIPHER_ALGORITHM(ARIA:0/AES:1/SEED:2), CONTENTS_CIPHER_MODE(ECB/CBC/CFB128/CTR), CONTENTS_CIPHER_KEYLENGTH(16).
로그인방식: USE_LOGIN(온라인:1/오프라인:2/모두:3/안함:0), ONLINE_LOGIN_METHOD(수동:1/자동:2/AD수동:3/AD자동:4/SSO:5).
[용도/유스케이스] Document SAFER CCF 정책 필드명/값 확인, 에이전트 정책 설정, 문서교환/오프라인/보안제어/배치암호화/반출 정책 상세`,
    source_url: 'https://docs.google.com/spreadsheets/d/1K418mxEs1VwE1ulyvlCMyzNStjx2daG60_WJL3eZ7PI/edit',
  },

  // ── 문서교환정책 코드 정의 (ExchangePolicy) ──
  {
    group: 'DRM 제품군', name: 'Document SAFER',
    title: 'Document SAFER — 문서교환정책(ExchangePolicy) 코드 정의',
    content: `Document SAFER 문서교환정책 코드값 정의 (R3/JSON/Blue 버전):
R3/JSON: NO_EXCHANGE=0(UserID매칭, 개인한), COMPANY_WIDE=1(CompanyID매칭, 사내한), GROUP_WIDE=2(GroupID매칭, 그룹사한),
NO_EXCHANGE_MACHINE_KEY=8(MachineKey확인), COMPANY_WIDE_READONLY_WHEN_ID_MISMATCH=9(ID불일치시 읽기전용),
MULTIUSER_OR_MULTIGROUP=10(DeptID또는UserID매칭), MACHINE_KEY_AND_USER_ID=11(가장강력-MachineKey+UserID 모두매칭),
MULTI_DEPTID=15(부서ID매칭), ENTERPRISE_WIDE=16(EnterpriseID만).
Blue 교환정책: 1=개인한, 2=직책직급한, 3=부서한, 4=그룹한, 5=사내한, 6=그룹사한.
[용도/유스케이스] 문서교환정책 코드값 확인, 개인한/부서한/사내한/그룹사한 설정, 교환정책 강도 비교`,
    source_url: 'https://docs.google.com/spreadsheets/d/1K418mxEs1VwE1ulyvlCMyzNStjx2daG60_WJL3eZ7PI/edit',
  },

  // ── QDRM_EX 실시간 암호화 정책 상세 ──
  {
    group: 'DRM 제품군', name: 'Document SAFER',
    title: 'Document SAFER — QDRM_EX 실시간 암호화 정책 상세',
    content: `QDRM_EX 실시간 암호화 모듈 정책 상세 (Document SAFER 부속):
전사정책: 실시간암호화 실행여부(0미실행/1실행), 등록프로세스감시여부(0미감시/1감시),
예외프로세스(전체경로 or 프로세스이름), 예외폴더(디렉토리경로), 예외확장자,
강제암호화경로, CCF미등록프로세스 감시대상확장자(|구분),
저장매체대상(1=로컬, 2=네트워크, 3=USB), 네트워크폴더에이전트사용여부(0/1),
파일포맷비교여부, 오프라인정책(0=로그인시만, 1=로그인&로그아웃시).
프로세스정책: 감시대상프로세스 등록, 감시프로세스제어이벤트(5=쓰기, 6=복사, 7=이동, 8=이름변경),
감시프로세스제어파일경로(0=비암호화, 1=암호화), 감시프로세스제어파일확장자(0=비암호화, 1=암호화).
주의: USB 대상 QDRM은 오류 케이스가 많아 기본 제외 권장.
[용도/유스케이스] QDRM_EX 실시간 암호화 설정, 프로세스별 감시 정책, 저장매체별 암호화 대상 설정`,
    source_url: 'https://docs.google.com/spreadsheets/d/1K418mxEs1VwE1ulyvlCMyzNStjx2daG60_WJL3eZ7PI/edit',
  },

  // ── MIP(Microsoft Information Protection) 정책 상세 ──
  {
    group: 'DRM 제품군', name: 'Document SAFER',
    title: 'Document SAFER — MIP(Microsoft 365) 연동 정책 상세',
    content: `Document SAFER MIP(Microsoft Information Protection) 연동 정책 상세:
기본정책: MIP_AppName(Ma365CoreAgent), MIP_ClientId/ClientSecret/TenantGuid(MS Compliance portal 코드),
MIP_SiteUrl(SharePoint URL), MIP_GRADE_DEFAULT(기본레이블),
ds_allow_cloud(원드라이브저장 1=가능/0=불가), MIP_Control_URL(Teams 다운로드시 암호화 URL),
TEAMS_BLOCK_FILE_TYPE(팀즈 업로드차단 확장자).
MIP정책: ds_drm_with_mip(0=DRM만사용, 1=로컬DRM&클라우드MIP),
DESKTOP Office MIP 제어: dscl_aip_desktop_use_drm_control/control_imagesafer/control_visibleprint/control_canprint/control_canblockcopy.
WEB Office MIP 제어: WEBSAFER_LOCAL_POLICY_ENABLE/USE_WATERMARK/IMAGESAFER/PRINT_BLOCK/SECURE_CLIP/URL_LIST.
QDRM 연동: QDRM_EX_ENABLE(실시간암호화), QDRM_EX_EXCEPTION_PROCESS(예외프로세스).
[용도/유스케이스] Microsoft 365/Teams DRM 연동, MIP 레이블 정책, 클라우드 저장 제어, Teams 파일 암호화`,
    source_url: 'https://docs.google.com/spreadsheets/d/1K418mxEs1VwE1ulyvlCMyzNStjx2daG60_WJL3eZ7PI/edit',
  },

  // ── 배치암호화 툴 CCF 정책 상세 ──
  {
    group: 'DRM 제품군', name: 'Document SAFER',
    title: 'Document SAFER — 배치암호화 툴 정책 상세',
    content: `Document SAFER 배치암호화 툴(BatchEncTool) CCF 정책 상세:
BATCH_ENC_SUPPORT_EXT(대상확장자: xls,xlsx,ppt,pptx,docx,pdf 등), BATCH_ENC_ALL_DRIVES_TARGET(0=폴더선택/1=전체드라이브),
BATCH_ENC_INCLUDE_NETWORK_DRIVES(0=미암호화/1=암호화), BATCH_ENC_PASS_FD(예외폴더: c:\\windows|c:\\program files|),
batch_enc_run_flag(0=미실행/1=실행), batch_enc_run_type(1=로그인시/2=에이전트실행시/3=스케줄),
BATCH_ENC_UI_SILENCE(1=사일런스모드/0=UI모드), BATCH_ENC_STOPABLE(중지가능여부),
BATCH_ENC_SEND_EXECUTION_LOG(0=미사용/1=이전로그/2=표준로그전송),
BATCH_ENC_INCLUDE_USB_DRIVES(USB드라이브암호화), BATCH_ENC_EXCLUDE_THIRDPARTY_DRM_FILE(타사DRM파일제외),
BATCH_ENC_LOGIN_REQUIRED(0=오프라인가능/1=온라인필수),
BATCH_ENC_CUSTOM_HEADER_*(커스텀헤더: EXCHANGE_POLICY/CANSAVE/CANEDIT/VISIBLEPRINT/IMAGESAFER/BLOCKCOPY/OPENCOUNT/PRINTCOUNT/VALIDPERIOD/OFFLINE_POLICY).
[용도/유스케이스] 배치암호화 정책 설정, 대상 확장자/폴더/드라이브 설정, 스케줄 실행 설정, 사일런스 모드`,
    source_url: 'https://docs.google.com/spreadsheets/d/1K418mxEs1VwE1ulyvlCMyzNStjx2daG60_WJL3eZ7PI/edit',
  },

  // ── 수동암호화 툴(CipherTool) 정책 상세 ──
  {
    group: 'DRM 제품군', name: 'Document SAFER',
    title: 'Document SAFER — 수동암호화 툴(CipherTool) 정책 상세',
    content: `Document SAFER 수동암호화 툴(CipherTool) CCF 정책 상세:
Json: CIPHER_TOOL_CHECK_DOCGRADE(보안등급검사 0=안함/1=high/2=low),
cipher_tool_enc_support_ext(암호화 대상 확장자),
cipher_tool_plus_enc_docgrade(기본등급설정: 등급명|등급코드|편집|저장|블록복사|워터마크|캡처|인쇄횟수|열람횟수|유효기간|교환정책),
cipher_tool_enc_h_*(UI숨김: blockcopy/docgrade/edit/exchange/imgsafer/save/target/wm).
Blue: CIPHER_TOOL_CONTROL_SHOW_WINDOW(UI제어: 문서등급|열람|인쇄|유효기간|교환설정|출력|저장|블럭카피|워터마크|캡처|오프라인|열람로그|저장로그|출력로그|조직도|ACL — 0=disable/1=normal/2=hide),
CIPHER_TOOL_CONTROL_SETTING_0~N(등급별 암호화 세팅).
쉘메뉴(MASHLMGR): SHELL_MENU_ENC(암호화)/DEC(복호화)/TAKEOUT(반출)/MAIL(메일세이퍼)/CHANGE_GRADE(등급변경)/CONVERT(컨버전) 각 0=미사용/1=사용.
[용도/유스케이스] 수동암호화 등급 설정, 보안등급별 권한 제어, 쉘메뉴(우클릭) 설정, 암호화 UI 커스터마이징`,
    source_url: 'https://docs.google.com/spreadsheets/d/1K418mxEs1VwE1ulyvlCMyzNStjx2daG60_WJL3eZ7PI/edit',
  },

  // ── Print SAFER WEB 정책 상세 ──
  {
    group: 'DRM 제품군', name: 'Print SAFER',
    title: 'Print SAFER — WEB 정책 필드 상세 (정책정의서)',
    content: `Print SAFER WEB 표준 정책 필드 상세 (정책정의서 990행 기반):
마스터정책 워터마크: 타입(이미지/텍스트이미지/텍스트다이렉트/외곽선텍스트), 출력형식(중앙기본),
위치X/Y좌표(0~100), 출력각도(0~360), 출력개수(1x1/2x2/4x4), 분할단위(1~5),
DIB워터마크농도(-5~5), 워터마크농도(0~10), 이미지파일(bmp/jpg/png),
텍스트폰트(Arial권장), 폰트크기X/Y축, 폰트색상(RGB 0~255|0~255|0~255),
폰트속성(보통/두껍게/이태릭/밑줄).
텍스트내용 자동입력 코드: /NI00~14(사용자정보: ID/이름/부서/직위/이메일/전화),
/SI00~03(시스템정보: IP/MAC/PC명), /DI00~02(문서정보: 문서명),
/PI01~03(프린터정보: 프린터명/포트).
MaPrint 워터마크 출력정보 코드: /a=부서명, /b=사용자ID, /e=사용자명, /f=출력일시, /g=IP주소, /h=MAC주소, /i=PC명, /j=프린터명, /k=문서명.
세팅정책: 인쇄허용/금지프린터(프린터명/포트/프로세스/IP), 워터마크허용/금지프린터.
전사정책: 출력허용여부, 로그인상태체크, 워터마크사용여부(안함/사용/암호화문서만),
PDF워터마크삽입, 컬러프린터PS방식, 토너절약, 에이전트삭제허용,
개인정보검출(적용안함/승인프로세스/출력금지), 개인정보마스킹,
프린트로그생성(사용안함/사용/암호화문서만), 이미지로그(타입/모든페이지/시작종료페이지),
텍스트로그(DB저장/Txt파일), 프린터별농도설정(최대20개).
[용도/유스케이스] Print SAFER 워터마크 상세 설정(위치/각도/농도/색상/폰트), 텍스트 자동입력 코드, 인쇄 허용/금지 세팅, 로그 설정`,
    source_url: 'https://docs.google.com/spreadsheets/d/1K418mxEs1VwE1ulyvlCMyzNStjx2daG60_WJL3eZ7PI/edit',
  },

  // ── Privacy SAFER WEB 정책 상세 ──
  {
    group: 'DRM 제품군', name: 'Privacy SAFER',
    title: 'Privacy SAFER — WEB 정책 필드 상세 (정책정의서)',
    content: `Privacy SAFER 3.1 WEB 정책 필드 상세 (정책정의서 1017행 기반):
기본정책: CPU점유율(10단위 Max100), 검사가능최대파일크기(Byte), 메모리검사단위(Byte),
격리폴더경로, 격리폴더접근프로세스, 검사로그저장(1=로깅/2=미로깅),
개인정보동작모드(0x1=검사만, 0x2=실시간암호화, 0x3=검사+암호화),
이전파일재검사(1=안함/2=함), 로그전송주기(분), UI메뉴활성화(예약/수동/실시간/수동검사/로그/현황),
메모리점유율(%), 전체파일메모리로드(1=로드/2=안함).
검사정책(예약/수동/실시간 공통): 대상필터(주민번호/전화번호/카드번호/운전면허/여권/외국인등록/사업자등록),
검출후처리(0x00=작동안함/0x01=삭제/0x02=알림/0x04=암호화/0x08=격리/0x10=완전삭제),
암호화파일재검사(1=검사/2=미검사), 파일포맷검사(1=검사/2=미검사), 엑셀셀통합검사(1=수행/2=안함).
예약검사: 유형(예약/정기요일별/정기월별), 재시도(날짜/시간).
실시간검사: 예외프로세스/경로/확장자, 대상시스템(0x1=로컬/0x2=네트워크/0x4=USB).
[용도/유스케이스] Privacy SAFER 정책 필드 상세, 개인정보 검출 필터/처리방식, 검사 유형별 설정, 실시간 검사 예외 설정`,
    source_url: 'https://docs.google.com/spreadsheets/d/1K418mxEs1VwE1ulyvlCMyzNStjx2daG60_WJL3eZ7PI/edit',
  },

  // ── Screen SAFER WEB 정책 상세 ──
  {
    group: 'DRM 제품군', name: 'Screen SAFER',
    title: 'Screen SAFER — WEB 정책 필드 상세 (정책정의서)',
    content: `Screen SAFER 2.0 WEB 정책 필드 상세 (정책정의서 1011행 기반):
기본기능: 로그인방법(ON/OFF, 캡처세이퍼/AD로그인), SSO재시도간격/횟수, 로그인재시도간격/횟수,
정책갱신주기(분), 로그데이터암호화(AES/ARIA, CBC/ECB, 128bit/256bit),
기능비활성화키(비상키), 비활성화허용횟수(1~99, -99=무제한), 라이브업데이트.
전사정책-차단: 차단유형 4가지(캡처차단+워터마크/캡처허용+워터마크/캡처차단+워터마크미적용/모든기능비활성화).
프로세스보호: 보호방식(비활성화/프로세스보호/파일보호/레지스트보호), M_Guard 필요.
스크린워터마크 상세: 농도(0~255), 배경색(RGB), 다중간격(0~1000px),
텍스트(출력유형 %UserID%/%UserName%/%DeptName% 등, 출력문구 255자, 2열문구,
폰트, 기울기 0~360, 글자크기 0~300, 글자색 RGB, 테두리크기 0~10/색 RGB,
위치 최대9개 좌표 x,y/로구분, 동일형태출력),
이미지(파일경로 BMP/JPG/PNG 16x16이상, 확대축소비율, 위치 최대9개).
접근탐지: 원격접근감지워터마크(mstsc.exe 등), 프로세스/URL워터마크 사용여부.
캡처툴예외등록, 예외정책(차단/워터마크/캡처 사용자예외).
[용도/유스케이스] Screen SAFER 정책 필드 상세, 스크린 워터마크 농도/위치/각도/크기 설정, 차단유형 4가지, 비상키 설정`,
    source_url: 'https://docs.google.com/spreadsheets/d/1K418mxEs1VwE1ulyvlCMyzNStjx2daG60_WJL3eZ7PI/edit',
  },

  // ── Privacy SAFER 서버 스펙 ──
  {
    group: 'DRM 제품군', name: 'Privacy SAFER',
    title: 'Privacy SAFER — 서버 하드웨어 스펙 가이드',
    content: `Privacy SAFER 서버 환경 스펙 (User수 기반 하드웨어 가이드):
1,000명: Ubuntu 22.04, MariaDB, XeonSilver 8Core×2EA, 16GB, 500GB+2TB.
5,000명: 32GB. 10,000명: 32GB. 20,000명: 32GB. 30,000명: 64GB.
40,000명: XeonGold 16Core, 64GB, 1TB+2TB.
공통환경: Ubuntu 22.04, MariaDB 10.4이상, OpenJDK 1.8, Tomcat 8이상.
[용도/유스케이스] Privacy SAFER 서버 스펙 산정, User수 기반 하드웨어 가이드`,
    source_url: 'https://docs.google.com/spreadsheets/d/1ITHOviKSv5PeDRXzqqn-4s4x0ynnkr_4/edit',
  },

  // ═══════════════════════════════════════════════════════════════
  // Part 2: CAD/OA 지원 매트릭스 + SafePC 상세 + MS오피스 MIP 매트릭스
  // ═══════════════════════════════════════════════════════════════

  // ── CAD/OA 어플리케이션 지원 매트릭스 ──
  {
    group: 'DRM 제품군', name: 'Document SAFER',
    title: 'Document SAFER — CAD 어플리케이션 지원 매트릭스 상세',
    content: `Document SAFER CAD 어플리케이션 지원 매트릭스 (모듈담당자 시트 기반, 1006행):
AutoDesk 계열:
- AutoCAD: 2004~2026, acad.exe, x86/x64, 고객수 48개사, 지원확장자 dwg/dxf/dws, 자동암호화 지원, 로그/열람/인쇄/클립보드/프린트/워터마크/캡처방지 모두 지원.
- Inventor: 2018~2025, inventor.exe, x86/x64, 고객수 10개사, 지원확장자 dwg/idw/ipt/iam, 열람횟수 미지원.
- DWG TrueView: 2013~2023, dwgviewr.exe, x64, 고객수 2개사, 지원확장자 pdf/dwg/dxf/dwf/dwfx.
- Revit: 2019~2025, revit.exe, x64, 지원확장자 rvt/rfa/rte/rft.
CATIA 계열:
- CATIA: V5V14~V5R34, cnext.exe, x86/x64, 고객수 14개사, 지원확장자 CATPart/CATProduct, 열람횟수/자동암호화 미지원. 별도 협의 필요.
Siemens 계열:
- NX(UG): 지원, 별도 협의 필요.
- SolidEdge: 지원.
PTC 계열:
- Creo(Pro/E): 지원.
기타 CAD:
- SolidWorks, MicroStation, ZWCAD, GstarCAD 등.
주의: 도면 암호화 시 어떤 CAD 어플리케이션/버전을 사용하는지에 따라 지원 범위가 달라짐. CATIA는 별도 협의 필요.
[용도/유스케이스] 도면 암호화 지원 CAD 목록, AutoCAD/CATIA/Inventor/NX 지원 버전 확인, CAD별 DRM 기능 지원 범위(자동암호화/열람/인쇄/워터마크)`,
    source_url: 'https://docs.google.com/spreadsheets/d/1sB-fhoSu3tsIUF5mQVsrKQc4bN-s_3-X2F2aoHFf9BU/edit',
  },

  // ── OA 어플리케이션 지원 매트릭스 ──
  {
    group: 'DRM 제품군', name: 'Document SAFER',
    title: 'Document SAFER — OA 어플리케이션 지원 매트릭스 상세',
    content: `Document SAFER OA 어플리케이션 지원 매트릭스 (모듈담당자 시트 기반):
MS-Office: Excel 2003~2016(excel.exe), Word 2003~2016(winword.exe), PowerPoint 2003~2016(powerpnt.exe), x86/x64, 모든 DRM 기능 지원.
한컴오피스: 한글 2014~2024(hwp.exe), 한셀(hcell.exe), 한쇼(hshow.exe), 한워드(hword.exe), 한PDF(hpdf.exe), x86.
Adobe: Acrobat Reader DC(acrord32.exe/acrobat.exe), x86/x64.
기타 OA: 메모장(notepad.exe), 그림판(mspaint.exe), Polaris Office, ezPDFReader.
특수 OA: SAP(saplogon.exe, 750/770/800), 온나라 1.0/2.0 인터페이스.
Print SAFER 지원앱: MS-Office(PPT/Word 2003~2024), Adobe Acrobat(6.0~25.0DC), PDF Pro5, PDF XChange Pro(3.0~9.4), Xodo PDF, Notepad++(7.7), Polaris Office 2017.
[용도/유스케이스] OA 어플리케이션 DRM 지원 범위, MS-Office/한컴/Adobe 지원 버전, Print SAFER 지원 어플리케이션 목록`,
    source_url: 'https://docs.google.com/spreadsheets/d/1sB-fhoSu3tsIUF5mQVsrKQc4bN-s_3-X2F2aoHFf9BU/edit',
  },

  // ── SafePC Enterprise V7.0 보안관리 상세 ──
  {
    group: 'DLP 제품군', name: 'SafePC Enterprise',
    title: 'SafePC Enterprise V7.0 — 보안관리 기능 상세 (매뉴얼)',
    content: `SafePC Enterprise V7.0 보안관리 기능 상세 (관리자 매뉴얼 기반):
PC보안: 방화벽정책(허용/차단기반, TCP/UDP/ICMP), 웹차단정책(URL차단), 컨텐츠업로드차단,
웜차단정책(패킷기준치), 네트워크로그정책(HTTP/FTP/TELNET/SMTP/공유폴더/메신저/웹메일).
매체제어정책: 플로피/CD/DVD/USB/PDA/스마트폰/무선랜/HSDPA/WIBRO/가상포트/적외선/시리얼/패러럴/테더링 — 각각 읽기/쓰기 통제 및 로깅.
프린트통제정책: 워터마크/표시인식/바코드/오버레이.
프로그램실행차단, PC프로그램보호(프로세스숨김/레지스트리읽기삭제차단/폴더삭제차단).
PC설정제어: IP변경/Proxy/화면보호기/제어판 차단. BAD USB 매체허용.
보안정책 우선순위: 미디어반출 > 개별 > 직위 > 그룹 > 기본.
보안정책 적용 4가지: 내부기본/내부요청/외부요청/외부기본.
PC Agent 내/외부 상태: 내부(서버통신가능→내부정책), 외부(서버통신불가→외부정책, 3분후 자동전환).
개인정보보호: 패턴관리(정규식/키워드), 등급관리(매체제어/알림임계값), 정책관리(패턴+등급조합).
보조기억매체관리: 일반저장매체(회사용) 등록/배포/정책설정/불용처리/회수.
감사로그: PC보안/IP변경히스토리/개인정보보호/보조기억매체/신청이력/운영로그.
[용도/유스케이스] SafePC 매체제어 상세(USB/CD/스마트폰/무선랜/블루투스), 보안정책 우선순위, 내부/외부 정책 전환, 개인정보 패턴/등급 관리`,
    source_url: 'https://docs.google.com/document/d/1tM5Lc6Ics8La22uh4ZBhg02A5nrardAm/edit',
  },

  // ── MS오피스 MIP 정책 매트릭스 상세 ──
  {
    group: 'DRM 제품군', name: 'Document SAFER',
    title: 'Document SAFER — MS오피스 로컬 & 클라우드 저장 정책 매트릭스 상세',
    content: `MS오피스 로컬 & 클라우드 저장 정책 매트릭스 상세 (모든 조합):
정책키: DS_DRM_WITH_MIP(0=DRM만사용, 1=로컬DRM&클라우드MIP), DS_ALLOW_CLOUD(0=금지, 1=허용).
MIP 지원확장자: docx|docm|dotx|dotm|xlsx|xlsm|xltx|xltm|pptx|pptm|potx|potm.

구독형 M365 + DRM만사용 + 저장금지: 로컬→로컬=DRM암호화, 로컬→클라우드=저장차단, 클라우드→로컬=DRM+MIP이중암호화(PPT는 MIP만), 클라우드→클라우드=저장차단.
구독형 M365 + DRM만사용 + 저장허용: 로컬→클라우드=DRM+MIP이중암호화(DRM실패케이스있음), 클라우드→클라우드=DRM+MIP이중암호화.
구독형 M365 + 로컬DRM&클라우드MIP + 저장금지: 로컬→클라우드=MIP암호화, 클라우드→로컬=DRM암호화, 클라우드→클라우드=MIP암호화(아닐경우차단).
구독형 M365 + 로컬DRM&클라우드MIP + 저장허용: 로컬→클라우드=MIP암호화, 클라우드→로컬=DRM암호화, 클라우드→클라우드=MIP암호화.
설치형(~2021): 구독형과 동일 패턴이나, 로컬DRM&클라우드MIP+저장금지 시 클라우드→클라우드=저장차단(MIP미지원).
주의: 파워포인트는 DRM암호화 실패 케이스 존재 → MIP암호화만 적용되는 경우 있음.
[용도/유스케이스] M365/클라우드 환경 DRM+MIP 정책 조합별 동작 확인, 저장 경로별 암호화 방식, 파워포인트 MIP 제한사항`,
    source_url: 'https://docs.google.com/spreadsheets/d/1KxGMwZd9bdtYF7WZaUhkmIhc2KTLhlTpmDR4esP_OwY/edit',
  },

  // ── 포트 정의 + 인사연동 테이블 ──
  {
    group: 'DRM 제품군', name: 'Document SAFER',
    title: 'ES SAFER — 포트 정의 및 인사연동 테이블 구조',
    content: `ES SAFER 프로젝트 포트 정의 및 인사연동 테이블 구조 (스펙정의서 기반):
공통 포트: 22(ssh), 8080(관리자Web), 8443(https).
DRM 전용 포트: 40001(Agent로그인), 40002(로그전송), 40003(시간동기화), 40004(프로세스), 40005(반출), 40006(개인정보로그), 40007(라이브업데이트), 40009(인사연동).
SafePC 전용 포트: 10443, 5436, 5437, 5500, 5555, 5562, 5566, 8009, 8977, 9009, 9080, ICMP.
SERVER→AGENT: 5560(정책전송).
인사연동 방식: AD연동 / DB to DB(I/F Table) / CSV File to DB(spoon툴) / CSV수동Upload.
인사연동 테이블(DRM): HR_SYNC_USER(USER_ID PK, EMAIL, PASSWORD SHA256+base64, USER_NM, DEPT_ID, POSI_ID), HR_SYNC_DEPT(DEPT_ID, DEPT_NM, DEPT_ORD, UPPER_DEPT_ID), HR_SYNC_POSI(POSI_ID, POSI_NM, POSI_ORD), HR_SYNC_APP(USER_ID, DEPT_ID, LOWER_DEPT_FL).
인사연동 테이블(SafePC): ORG_PERSON(person_id, Password, name, dept_cd, dept_duty_cd, regi_type), ORG_GROUP_INFO(group_id, group_name, parent_id, type).
로그인연동: 수동로그인(ID/PW), AD-LDAP(자동로그인), AD-Windows계정(PW불필요), SSO(솔루션연동).
[용도/유스케이스] DRM/SafePC 포트 정의 확인, 방화벽 오픈 포트 목록, 인사연동 테이블 구조, 로그인 연동 방식`,
    source_url: 'https://docs.google.com/spreadsheets/d/1GyZQlROU73HC4NnLkUdwAJyaC5H54BQ0/edit',
  },

  // ── Screen TRACER 고객사별 실제 서버 스펙 ──
  {
    group: 'DRM 제품군', name: 'Screen TRACER',
    title: 'Screen TRACER — 고객사별 실제 서버 스펙 사례',
    content: `Screen TRACER 고객사별 실제 서버 스펙 사례:
현대케피코(2,000명): Rocky Linux, MariaDB, Tomcat9, Xeon IceLake 2.6GHz 4Core, 15GB, 100GB+500GB (VM, TRACER 단독).
현대제철(3,500명): CentOS, 2.6GHz 8Core, 16GB, 100GB (VM).
셀트리온(3,700명): Windows 2022, MS-SQL Express 2022, 2.8GHz 16Core, 64GB, 500GB+106TB (SAFER+TRACER 통합).
현대자동차(50,000명): Rocky Linux, MySQL 8.0, 2.0GHz 32Core, 128GB, 4TB (운영 2중화 + 중계 2중화).
[용도/유스케이스] Screen TRACER 대규모 운영 사례, 고객사별 서버 스펙 참고, 2,000~50,000명 규모별 하드웨어 가이드`,
    source_url: 'https://docs.google.com/spreadsheets/d/1ITHOviKSv5PeDRXzqqn-4s4x0ynnkr_4/edit',
  },

  // ═══════════════════════════════════════════════════════════════
  // Part 3: 매뉴얼 기반 상세 (Part 3 & Part 4 JSON 소스)
  // ═══════════════════════════════════════════════════════════════

  // ── WebSAFER ACL 적용 상세 (Chrome/Edge 적용문서 raw_content from part4) ──
  {
    group: 'DRM 제품군', name: 'Web SAFER',
    title: 'Web SAFER — Chrome/Edge ACL 적용 및 정책 변수 상세',
    content: `WebSAFER for Chrome & Edge ACL 적용 상세 (적용문서 Ver.2 기반):
라이선스 및 ACL 적용: setConfigFile() 함수로 INI 파일 기반 정책 적용, setUserAclFromScript() 함수로 스크립트 기반 정책 적용.
권한(ACL) 항목: save(편집/저장), edit(편집), print(인쇄), viewsource(소스보기), contextmenu(우클릭메뉴),
imagesafer(화면캡처방지), visibleprint(가시성워터마크인쇄), secureclipboard(클립보드제어),
filedownload(임시파일다운로드), protectremotetool(원격제어도구제한), protectallscreen(전체화면캡처방지).
INI 파일 구조: [main] 섹션(mode=auto/manual, lastgroup), [group] 섹션(lasturl, URL별 권한 설정).
mode=auto: 모든 URL에 동일 권한 적용. mode=manual: URL별 개별 권한 설정.
프로세스/원격/가상머신 검사 기능 내장.
설치 확인: C:\\Windows에 WSChrome.dll/WSEdge.dll 존재 확인.
프로세스: mawsmgr.exe(매니저), mawssvc.exe(서비스) 실행 확인.
서비스: WebSAFER Non-ActiveX Service 재시작으로 오류 대응.
SetConfigFile() fail 에러: 모든 브라우저 종료 후 재실행.
[용도/유스케이스] WebSAFER Chrome/Edge 적용 방법, ACL 권한 항목 상세, INI 파일 정책 설정, 오류 대응 가이드`,
    source_url: 'https://docs.google.com/document/d/1miDgElvGAGOWZzK4jGvqDScskmNPZCwC',
  },

  // ── Mobile Capture SAFER SDK API 상세 (Android API from part4) ──
  {
    group: 'DRM 제품군', name: 'Mobile Capture SAFER',
    title: 'Mobile Capture SAFER — Android SDK API 상세',
    content: `Mobile Capture SAFER Android SDK v1.52 API 상세:
기본기능: 단축키 화면캡처방지, 캡처APP방지, 루팅감지, 에뮬레이터감지.
부가기능: Wi-Fi연결제어(SSID화이트리스트), Bluetooth연결제어, USB연결감지, MIRRORING감지, Visual Watermark.
주요 API:
- getInstance(Activity, Handler, boolean): SDK 인스턴스 획득
- setSecureFlag(EnumSet<SecureFlag>): 보안 플래그 설정 (캡처방지/루팅감지/에뮬레이터감지 등)
- getSecureFlag(): 현재 보안 플래그 조회
- addSecureFlag(flag): 보안 플래그 추가
- removeSecureFlag(flag): 보안 플래그 제거
- setEvent(event): 이벤트 핸들러 설정
- initWatermark(str): 워터마크 초기화 (사용자 정보 문자열)
- enableCaptureActivity(activity, flag): 특정 Activity 캡처 허용/차단
지원환경: Android OS 6 이상, Android Studio.
iOS SDK: v1.50d (별도 PDF 가이드).
[용도/유스케이스] Mobile Capture SAFER SDK 연동 개발, Android API 호출 방법, 캡처방지/루팅감지/워터마크 API, Wi-Fi/Bluetooth 제어`,
    source_url: 'https://docs.google.com/document/d/1X3BDmSRmMf0EvJRBOCRs2OpukzY8fUF9',
  },

  // ── Cowork SAFER 변환툴 상세 (배포자매뉴얼 raw_content from part4) ──
  {
    group: 'DRM 제품군', name: 'Cowork SAFER',
    title: 'Cowork SAFER — 변환툴 및 권한 설정 상세 (배포자매뉴얼)',
    content: `Cowork SAFER 변환툴 매뉴얼 V1.0 상세:
변환 실행: 우클릭 > Cowork SAFER > MASDOC 변환.
변환형식 3가지: MASDOC(개별파일 보안 변환), ZIP(다수 파일 묶음 보안 변환), EXE(뷰어 통합 실행파일).
인증방식: 서버인증(계정 로그인 필요), 로컬인증(비밀번호 입력).
추가인증: 사용안함 / 사용자지정 / 비밀번호.
권한상세설정:
- 저장: 허용/불허
- 열람횟수: 제한 설정 가능
- 인쇄: 허용/불허, 인쇄횟수 제한
- 워터마크: 출력정보(출력자정보)/배경(로고)/Copyright
- 블록복사: 허용안함 설정 가능
- 화면캡처: 허용안함 설정 가능
- 사용기한: 만료기간(일수)/만료일자(특정날짜)/무제한
- 만료시삭제: 기한 만료 시 파일 자동 삭제
- 한기기제한: 1대 PC에서만 사용 가능하도록 제한
관리자 콘솔: http://서버IP:8081, 전사정책/예외정책 관리, 변환이력/사용이력 조회.
[용도/유스케이스] Cowork SAFER 변환 형식(MASDOC/ZIP/EXE) 선택, 외부반출 권한 설정, 인증방식 설정, 사용기한/열람횟수 제한`,
    source_url: 'https://docs.google.com/document/d/1Pc5-yEQBZtzMFwrjb3BwGF2FSAnLz67u',
  },

  // ── ePageSAFER WebDRM 개발자 매뉴얼 상세 (raw_content from part4) ──
  {
    group: '응용보안 제품군', name: 'ePage SAFER for Web DRM',
    title: 'ePage SAFER WebDRM — 개발자 매뉴얼 상세 (정책변수/적용방법)',
    content: `e-PageSAFER WebDRM Pack For NoAX 개발자 매뉴얼 상세:
웹 콘텐츠 보호: 무단 복사/저장/링크 방지 솔루션.
지원 브라우저: Chrome 19+, Firefox 15+, Opera 15+, Edge.
적용방법: MaWebDRM.js, MaWebDRM_Common.js, jquery include 후 정책변수 설정.
정책변수:
- MA_EXCEPT_SAVE: 저장 차단 (true=차단)
- MA_EXCEPT_PRINT: 인쇄 차단
- MA_EXCEPT_DEV: 개발자도구(F12) 차단
- MA_EXCEPT_COPY: 복사 차단
- MA_EXCEPT_ALL: 전체 차단
- MA_EXCEPT_RBTN: 우클릭 차단
- bImgsfOn: 화면캡쳐 방지 (ImageSAFER 연동)
- ICP: 화면 워터마크 문구 설정
라이선스: 도메인/IP 기반, MaWebDRM_Common.js의 maLicense 값 설정.
특허: KR 390929, 337954, 333163 등.
주의: 파일 다운로드 차단은 WebDRM 기능이 아님 — JSP 개발단에서 처리해야 할 영역.
[용도/유스케이스] ePage SAFER WebDRM 적용 개발, JavaScript 정책변수 설정, 브라우저별 지원 범위, 라이선스 설정 방법`,
    source_url: 'https://docs.google.com/document/d/1gBnbRyPfmGUrVX1ANMayXt5bzU1GYPT2',
  },

  // ── Screen SAFER 관리자 매뉴얼 상세 (차단정책 4가지, 워터마크 설정 from part4) ──
  {
    group: 'DRM 제품군', name: 'Screen SAFER',
    title: 'Screen SAFER — 관리자 매뉴얼 상세 (차단정책/워터마크/예외)',
    content: `Screen SAFER 관리자 매뉴얼 상세 (v1.0 + v2.0 통합):
접속정보: http://서버IP:8080/, admin/1234qwer!
메뉴 구성: 기본관리(사용자관리, 부서관리), 화면보안(기본정책-전사정책, 예외정책관리, 이력관리).
차단정책 4가지:
1. 캡처차단 + 스크린워터마크 적용 (가장 강력)
2. 캡처허용 + 스크린워터마크 적용 (추적만)
3. 캡처차단 + 스크린워터마크 미적용 (차단만)
4. 모든기능 비활성화 (보안 해제)
스크린워터마크 설정:
- 텍스트워터마크: 농도(0~255), 배경색(RGB), 간격, 기울기(0~360), 크기, 1열/2열 출력유형/문구
- 이미지워터마크: bmp/jpg/png 지원, 확대축소비율
v2.0 추가기능: 캡처 툴 허용 정책(전사 캡처 툴 관리에서 등록한 프로그램 예외 추가), 캡처세이퍼 삭제 허용/차단.
예외정책: 부서/사용자별 차단정책/워터마크/캡처 예외 설정.
이력관리: 에이전트 로그인 이력, 캡쳐 이력(캡처 시도 로그).
[용도/유스케이스] Screen SAFER 관리자 설정 가이드, 차단정책 4가지 선택, 스크린 워터마크 상세 설정, 캡처 툴 예외 등록, 이력 조회`,
    source_url: 'https://docs.google.com/document/d/1ArZq8atz-Enm5tjRMVnn3IaDA_pXCz-f',
  },

  // ── Mobile DOCS 관리자 매뉴얼 상세 (전사정책/예외정책/라이센스/이력 from part4) ──
  {
    group: 'DRM 제품군', name: 'Mobile DOCS',
    title: 'Mobile DOCS — 관리자 웹 매뉴얼 상세 (정책/라이센스/이력)',
    content: `Mobile DOCS 관리자 웹 매뉴얼 Ver2 상세:
접속정보: http://서버IP:8080/, admin/1234.
메뉴 구성: 기본관리(사용자관리, 부서관리), 모바일보안(전사정책, 예외정책, 라이센스관리, 이력조회).
전사정책: Document SAFER 서버와 연동하여 모바일 문서 열람/편집/인쇄 권한 제어.
예외정책: 부서/사용자별 별도 모바일 보안 정책 적용.
라이센스관리: 앱 설치 현황 조회, 로그인 현황 조회, 라이센스 발급/회수.
이력조회:
- 암호화 문서 열람 이력
- 편집 이력
- 인쇄 이력
- 미 권한(오프라인) 열람시도 이력
전제조건: Document SAFER 도입 필수 — Mobile DOCS는 DRM 암호화된 문서를 모바일에서 열람하는 전용 뷰어.
지원 OS: Android 7+, iOS 14+.
[용도/유스케이스] Mobile DOCS 관리자 설정, 모바일 문서 열람/편집/인쇄 정책, 라이센스 관리, 열람 이력 감사`,
    source_url: 'https://docs.google.com/document/d/1vYABc5GhkQciXxKsVlUZFXAOA6ANjckX',
  },

  // ── ES SAFER 프로젝트 스펙정의서 클라이언트 상세 (CAD Application 지원, MIP사용여부 from part2) ──
  {
    group: 'DRM 제품군', name: 'Document SAFER',
    title: 'ES SAFER — 프로젝트 스펙정의서 클라이언트 환경 상세',
    content: `ES SAFER 프로젝트 스펙정의서 클라이언트 환경 상세:
클라이언트 정보: 지원OS(Win10/11), VDI/물리PC 구분, 유저수, 망구분(내부/외부/DMZ).
타SW운영정보: AD(Active Directory), 백신, DLP, 문서중앙화, 개인정보보호, 키보드보안 — 각 제품명/버전/제조사 확인 필요.
CAD Application 지원 확인: 어떤 CAD 어플리케이션(AutoCAD/CATIA/NX/SolidWorks/Inventor 등)을 사용하는지, 어떤 버전인지 반드시 사전 확인.
QDRM 주의사항: QDRM_EX 실시간 암호화 적용 시 CAD 어플리케이션과의 호환성 별도 검증 필요.
MIP 사용여부: Microsoft 365 환경에서 MIP(Microsoft Information Protection) 사용 여부 확인 → DRM+MIP 이중 정책 설정 필요.
Print SAFER 시트: OA Application 목록(MS-Office/한컴/Adobe/기타), 옵션정보(개인정보 마스킹/OCR/텍스트로그/이미지로그).
Screen SAFER 시트: 적용대상(모니터/Application/업무시스템), TRACER 수록정보, 캡처방지/이력.
Privacy SAFER 시트: 개인정보 종류(주민번호/외국인번호/계좌번호/전화번호), OCR 필요여부.
[용도/유스케이스] DRM 프로젝트 사전환경 조사 체크리스트, CAD 지원 확인, MIP 연동 확인, 타SW 호환성 확인`,
    source_url: 'https://docs.google.com/spreadsheets/d/1GyZQlROU73HC4NnLkUdwAJyaC5H54BQ0/edit',
  },

]
