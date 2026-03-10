#!/usr/bin/env node
/**
 * ANY 브릿지 - Supabase 시드 데이터 생성 스크립트
 * 500건의 리얼리스틱한 프리세일즈 케이스 데이터를 생성합니다.
 * 
 * 실행: node hackerton/backend/scripts/seed-data.js
 */

const SUPABASE_URL = 'https://owfkajoqksaaoompvxph.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93Zmtham9xa3NhYW9vbXB2eHBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxOTE5MTUsImV4cCI6MjA4Nzc2NzkxNX0.ZdA6ANCTwhBCEiRytuQ9S-UfHlKnB7jJUo3nq0-U5XQ';

const BATCH_SIZE = 50;

// ─── 고객 분포 (총 500건) ───
const CUSTOMERS = [
  { id: 'CUST-SKH', name: 'SK하이닉스', count: 150 },
  { id: 'CUST-MND', name: '국방부', count: 100 },
  { id: 'CUST-SEC', name: '삼성전자', count: 80 },
  { id: 'CUST-LGE', name: 'LG전자', count: 60 },
  { id: 'CUST-MOI', name: '행정안전부', count: 50 },
  { id: 'CUST-DAPA', name: '방위사업청', count: 30 },
  { id: 'CUST-NAVY', name: '해군본부', count: 20 },
  { id: 'CUST-ETC', name: '기타', count: 10 },
];

// ─── 제품 분포 (총 500건) ───
const PRODUCTS = [
  { name: 'DRM', count: 200 },
  { name: 'Document SAFER', count: 150 },
  { name: 'Print SAFER', count: 80 },
  { name: 'Screen SAFER', count: 70 },
];

// ─── 상태 분포 (총 500건) ───
const STATUSES = [
  { value: 'ai_resolved', count: 300 },
  { value: 'escalated', count: 100 },
  { value: 'resolved', count: 50 },
  { value: 'closed', count: 30 },
  { value: 'ai_responding', count: 15 },
  { value: 'created', count: 5 },
];

// ─── 신뢰도 분포 (총 500건) ───
const CONFIDENCES = [
  { value: 'high', count: 250, scoreMin: 80, scoreMax: 95 },
  { value: 'medium', count: 150, scoreMin: 55, scoreMax: 75 },
  { value: 'low', count: 100, scoreMin: 30, scoreMax: 50 },
];

// ─── 제품별 질문 템플릿 ───
const QUESTIONS = {
  DRM: [
    '윈도우 11 환경에서 DRM 클라이언트 호환성 문의드립니다.',
    'DRM 적용 문서의 오프라인 열람 가능 여부를 확인하고 싶습니다.',
    'DRM 서버 이중화 구성 방안에 대해 문의합니다.',
    '기존 문서관리시스템(DMS)과 DRM 연동 방법이 궁금합니다.',
    'DRM 라이선스 갱신 절차와 비용을 알고 싶습니다.',
    'CC인증 및 GS인증 현황에 대해 확인 부탁드립니다.',
    'DRM 적용 시 문서 열람 속도 저하가 있는지 궁금합니다.',
    '모바일(iOS/Android) 환경에서 DRM 문서 열람이 가능한가요?',
    'DRM 정책 설정 시 부서별 차등 권한 부여가 가능한가요?',
    '대량 문서(10만건 이상) DRM 일괄 적용 방법을 알려주세요.',
    'DRM 감사 로그 기능과 리포팅 기능에 대해 문의합니다.',
    '폐쇄망 환경에서 DRM 서버 구축이 가능한가요?',
    'DRM 문서의 유효기간 설정 및 자동 폐기 기능이 있나요?',
    '타사 DRM에서 마크애니 DRM으로 마이그레이션 방법이 궁금합니다.',
    'DRM 적용 문서의 인쇄 제어(워터마크 포함) 기능을 알고 싶습니다.',
    'Active Directory(AD) 연동을 통한 사용자 인증이 가능한가요?',
    'DRM SDK를 활용한 커스텀 개발이 가능한지 문의합니다.',
    '클라우드 환경(AWS/Azure)에서 DRM 서버 운영이 가능한가요?',
    'DRM 적용 문서의 스크린 캡처 방지 기능에 대해 알고 싶습니다.',
    '문서 등급별(대외비, 비밀, 일반) 접근 제어 설정 방법을 알려주세요.',
  ],
  'Document SAFER': [
    'Document SAFER v3.2 업그레이드 시 주요 변경사항이 궁금합니다.',
    '대량 파일 처리 시 성능 최적화 방안을 알려주세요.',
    'PDF 암호화 적용 시 발생하는 오류 해결 방법이 궁금합니다.',
    'Document SAFER와 사내 그룹웨어 연동 방법을 문의합니다.',
    '문서 중앙화 솔루션과의 호환성을 확인하고 싶습니다.',
    '1,000 User 라이선스 견적을 요청드립니다.',
    '문서 자동 분류 기능의 정확도는 어느 정도인가요?',
    '백업 및 복구 절차에 대해 상세히 알고 싶습니다.',
    'Document SAFER 관리자 콘솔의 주요 기능을 알려주세요.',
    '윈도우 서버 2022에서 Document SAFER 설치가 가능한가요?',
    '문서 유출 방지를 위한 외부 반출 제어 기능이 있나요?',
    'Document SAFER의 API를 활용한 자동화 구현이 가능한가요?',
    '멀티 사이트 환경에서의 문서 동기화 방법을 알려주세요.',
    '사용자 교육 프로그램과 교육 자료 제공 여부를 확인합니다.',
    'Document SAFER 도입 시 예상 ROI를 알고 싶습니다.',
  ],
  'Print SAFER': [
    'Print SAFER 출력보안 솔루션의 주요 기능을 알고 싶습니다.',
    '프린터별 출력 제어 정책 설정이 가능한가요?',
    '출력물 워터마크 커스터마이징 옵션에 대해 문의합니다.',
    'Print SAFER와 복합기(MFP) 연동 지원 현황을 알려주세요.',
    '출력 이력 추적 및 감사 기능에 대해 상세히 알고 싶습니다.',
    '네트워크 프린터 환경에서 Print SAFER 적용 방법을 문의합니다.',
    '출력물 승인 워크플로우 기능이 있나요?',
    'Print SAFER 에이전트 자동 배포 방법을 알려주세요.',
    '개인정보 포함 문서 출력 시 자동 차단 기능이 있나요?',
    '출력 쿼터(할당량) 관리 기능에 대해 문의합니다.',
    'Print SAFER 도입 후 출력 비용 절감 효과는 어느 정도인가요?',
    'macOS 환경에서도 Print SAFER가 지원되나요?',
  ],
  'Screen SAFER': [
    'Screen SAFER의 화면 캡처 방지 기능에 대해 알고 싶습니다.',
    '원격 데스크톱 환경에서도 캡처 차단이 동작하나요?',
    'Screen SAFER에 포함된 Screen Tracer 기능이 궁금합니다.',
    '화면 워터마크 표시 기능이 있나요?',
    '특정 애플리케이션만 캡처 차단하는 선택적 보호가 가능한가요?',
    'Screen SAFER의 시스템 리소스 사용량은 어느 정도인가요?',
    '가상 환경(VDI)에서 Screen SAFER 적용이 가능한가요?',
    'Screen SAFER 관리자 콘솔에서 정책 설정 방법을 알려주세요.',
    '화면 녹화 프로그램도 차단이 가능한가요?',
    'Screen SAFER와 DRM을 함께 사용할 수 있나요?',
  ],
};

// ─── 제품별 AI 답변 템플릿 ───
const AI_ANSWERS = {
  DRM: [
    '마크애니 DRM은 윈도우 11을 완벽하게 지원합니다. 최신 버전(v3.2)에서 윈도우 11 호환성 이슈가 모두 해결되었으며, 정책기능서를 참고해 주시기 바랍니다.',
    '오프라인 환경에서도 DRM 문서 열람이 가능합니다. 로컬 캐시 기반으로 권한을 관리하며, 네트워크 복구 시 자동으로 서버와 동기화됩니다.',
    'DRM 서버 이중화는 Active-Standby 및 Active-Active 두 가지 방식을 지원합니다. 고객 환경에 맞는 최적의 구성을 제안드리겠습니다.',
    '기존 DMS와의 연동은 REST API 및 SDK를 통해 가능합니다. 표준 연동 가이드를 제공하며, 커스텀 연동 모듈 개발도 지원합니다.',
    '라이선스 갱신은 기존 계약 만료 30일 전부터 가능하며, 갱신 시 기존 계약 조건이 유지됩니다. 상세 비용은 담당 영업에게 문의 부탁드립니다.',
    'CC인증(EAL2+)과 GS인증(1등급)을 보유하고 있으며, 국가정보원 보안적합성 검증도 통과한 제품입니다.',
    'DRM 적용 시 문서 열람 속도 저하는 평균 0.3초 이내로, 사용자 체감 차이가 거의 없습니다. 대용량 문서의 경우 스트리밍 방식으로 최적화됩니다.',
    'iOS 및 Android 전용 뷰어 앱을 제공하며, 모바일 환경에서도 DRM 문서를 안전하게 열람할 수 있습니다.',
    '부서별, 직급별, 프로젝트별 차등 권한 부여가 가능합니다. 관리자 콘솔에서 세밀한 정책 설정이 가능합니다.',
    '대량 문서 DRM 일괄 적용은 배치 처리 도구를 통해 가능하며, 10만건 기준 약 2시간 내 처리가 완료됩니다.',
    '감사 로그는 문서 열람, 편집, 인쇄, 복사 등 모든 이벤트를 기록하며, 대시보드에서 실시간 모니터링이 가능합니다.',
    '폐쇄망 환경에서 온프레미스 서버 구축이 가능합니다. 국방부, 금융기관 등 다수의 폐쇄망 구축 경험이 있습니다.',
    '문서 유효기간 설정 및 자동 폐기 기능을 제공합니다. 기간 만료 시 자동으로 열람 권한이 회수됩니다.',
    '타사 DRM에서 마크애니 DRM으로의 마이그레이션 도구를 제공합니다. 기존 문서의 권한 정보를 유지하면서 전환이 가능합니다.',
    '인쇄 시 사용자 정보, 일시, 문서 등급 등을 포함한 워터마크를 자동 삽입할 수 있습니다. 워터마크 디자인은 커스터마이징 가능합니다.',
    'Active Directory 연동을 통한 SSO(Single Sign-On)를 지원합니다. LDAP, SAML 2.0 등 다양한 인증 프로토콜을 지원합니다.',
    'DRM SDK(Java, C++, .NET)를 제공하며, 고객사 시스템에 맞는 커스텀 개발이 가능합니다. SDK 문서와 샘플 코드를 제공합니다.',
    'AWS, Azure, GCP 등 주요 클라우드 환경에서 DRM 서버 운영이 가능합니다. 컨테이너(Docker/K8s) 배포도 지원합니다.',
    '화면 캡처 방지 기능을 제공하며, 캡처 시도 시 화면이 블랙아웃 처리됩니다. 원격 데스크톱 환경에서도 동작합니다.',
    '문서 등급별 접근 제어는 관리자 콘솔에서 설정 가능하며, 대외비/비밀/일반 등 고객사 보안 등급 체계에 맞춰 커스터마이징할 수 있습니다.',
  ],
  'Document SAFER': [
    'Document SAFER v3.2에서는 대량 파일 처리 속도가 30% 개선되었으며, 윈도우 11 완벽 지원, UI/UX 개선 등이 포함되었습니다.',
    '대량 파일 처리 시 멀티스레드 처리와 캐싱 최적화를 통해 성능을 극대화할 수 있습니다. 상세 튜닝 가이드를 제공합니다.',
    'PDF 암호화 오류는 주로 PDF 버전 호환성 이슈로 발생합니다. v3.2에서 PDF 2.0까지 지원하며, 해당 이슈가 해결되었습니다.',
    '그룹웨어 연동은 API 방식으로 가능하며, 주요 그룹웨어(한글과컴퓨터, 더존, 나라비전 등)와의 연동 경험이 있습니다.',
    '주요 문서 중앙화 솔루션(넷아이디, 파수닷컴 등)과 호환되며, 연동 가이드를 제공합니다.',
    '1,000 User 라이선스 견적은 담당 영업을 통해 상세 안내드리겠습니다. 기본 구성과 옵션에 따라 비용이 달라질 수 있습니다.',
    '문서 자동 분류 기능은 머신러닝 기반으로 동작하며, 평균 정확도 92% 이상을 달성하고 있습니다.',
    '자동 백업은 일 1회 수행되며, 장애 시 최대 1시간 이내 복구가 가능합니다. 롤백 기능도 제공됩니다.',
    '관리자 콘솔에서 사용자 관리, 정책 설정, 문서 현황 모니터링, 감사 로그 조회, 리포트 생성 등이 가능합니다.',
    '윈도우 서버 2022를 공식 지원합니다. 설치 가이드와 시스템 요구사항을 안내드리겠습니다.',
    '외부 반출 제어 기능을 통해 USB, 이메일, 클라우드 등을 통한 문서 유출을 방지할 수 있습니다.',
    'REST API를 제공하며, 문서 등록/조회/권한 설정 등의 자동화 구현이 가능합니다. API 문서를 제공합니다.',
    '멀티 사이트 환경에서는 마스터-슬레이브 구조로 문서를 동기화하며, 실시간 또는 스케줄 기반 동기화를 선택할 수 있습니다.',
    '도입 시 관리자 교육(2일)과 사용자 교육(1일)을 제공하며, 매뉴얼, 동영상, FAQ 등 교육 자료를 함께 제공합니다.',
    'Document SAFER 도입 후 평균 문서 관리 비용 40% 절감, 보안 사고 90% 감소 효과를 기대할 수 있습니다.',
  ],
  'Print SAFER': [
    'Print SAFER는 출력보안 솔루션으로, 인쇄 시 워터마크 삽입, 출력 제어, 출력 이력 추적, 승인 워크플로우 등의 기능을 제공합니다.',
    '프린터별, 사용자별, 부서별로 출력 제어 정책을 세밀하게 설정할 수 있습니다. 시간대별 제어도 가능합니다.',
    '워터마크는 텍스트, 이미지, QR코드 등 다양한 형태로 커스터마이징 가능하며, 사용자 정보를 자동 삽입할 수 있습니다.',
    '주요 복합기 제조사(삼성, HP, Canon, Xerox, Ricoh 등)의 MFP와 연동을 지원합니다.',
    '출력 이력은 실시간으로 기록되며, 누가/언제/어떤 문서를/어떤 프린터에서 출력했는지 상세 추적이 가능합니다.',
    '네트워크 프린터 환경에서는 프린트 서버에 Print SAFER 모듈을 설치하여 중앙 관리가 가능합니다.',
    '출력물 승인 워크플로우를 통해 상급자 승인 후 출력이 가능하도록 설정할 수 있습니다.',
    'Print SAFER 에이전트는 SCCM, GPO 등을 통한 자동 배포를 지원합니다.',
    '개인정보(주민번호, 전화번호 등) 포함 문서 출력 시 자동 감지 및 차단/경고 기능을 제공합니다.',
    '사용자별/부서별 월간 출력 쿼터를 설정할 수 있으며, 초과 시 자동 차단 또는 경고를 발생시킵니다.',
    'Print SAFER 도입 후 평균 출력량 30% 감소, 연간 출력 비용 약 25% 절감 효과를 기대할 수 있습니다.',
    'macOS 환경은 현재 베타 지원 중이며, 정식 지원은 다음 버전에서 제공될 예정입니다.',
  ],
  'Screen SAFER': [
    'Screen SAFER는 화면 캡처 방지 솔루션으로, PrintScreen, 캡처 도구, 원격 데스크톱 캡처를 차단합니다.',
    '원격 데스크톱(RDP, Citrix, VMware) 환경에서도 캡처 차단이 정상 동작합니다.',
    'Screen SAFER에는 Screen Tracer 기능이 포함되어 있어 화면 촬영 시 비가시성 워터마크로 촬영자를 추적할 수 있습니다.',
    '화면에 사용자 정보(이름, 부서, IP 등)를 워터마크로 표시하여 유출 억제 효과를 제공합니다.',
    '특정 애플리케이션만 선택적으로 캡처 차단하는 정책 설정이 가능합니다.',
    'Screen SAFER의 CPU 사용률은 평균 1% 미만으로, 시스템 성능에 거의 영향을 주지 않습니다.',
    'VDI(가상 데스크톱) 환경에서도 Screen SAFER 적용이 가능하며, Citrix, VMware Horizon을 지원합니다.',
    '관리자 콘솔에서 부서별/사용자별 캡처 차단 정책을 설정하고 실시간 모니터링이 가능합니다.',
    'OBS, Bandicam 등 화면 녹화 프로그램도 차단 대상에 포함됩니다.',
    'Screen SAFER와 Document SAFER(DRM)를 함께 사용하면 문서 암호화 + 화면 캡처 방지의 이중 보안이 가능합니다.',
  ],
};

// ─── 에스컬레이션 사유 (low confidence 또는 escalated 상태용) ───
const ESCALATION_REASONS = [
  '고객이 상세 견적서를 요청하여 담당 영업 연결이 필요합니다.',
  '기술적으로 복잡한 커스텀 연동 요구사항으로 SE 확인이 필요합니다.',
  '보안 인증 관련 상세 문의로 전문 담당자 연결이 필요합니다.',
  '대규모 구축 프로젝트로 프로젝트 매니저 배정이 필요합니다.',
  '기존 시스템과의 호환성 이슈로 기술 검토가 필요합니다.',
  '계약 조건 협의가 필요하여 영업 담당자 연결을 요청합니다.',
  '고객 불만 사항으로 즉각적인 대응이 필요합니다.',
  'PoC(Proof of Concept) 진행 요청으로 기술팀 지원이 필요합니다.',
];

// ─── 유틸리티 함수 ───

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(monthsBack = 6) {
  const now = new Date();
  const start = new Date(now);
  start.setMonth(start.getMonth() - monthsBack);
  const diff = now.getTime() - start.getTime();
  const randomTime = start.getTime() + Math.random() * diff;
  return new Date(randomTime).toISOString();
}

function generateSessionId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'sess_';
  for (let i = 0; i < 12; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/**
 * 분포 배열을 셔플된 인덱스 배열로 변환
 * 예: [{value:'a', count:2}, {value:'b', count:1}] → ['a','a','b'] (셔플됨)
 */
function expandDistribution(items, key = 'value') {
  const expanded = [];
  for (const item of items) {
    for (let i = 0; i < item.count; i++) {
      expanded.push(item);
    }
  }
  // Fisher-Yates 셔플
  for (let i = expanded.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [expanded[i], expanded[j]] = [expanded[j], expanded[i]];
  }
  return expanded;
}

// ─── 500건 케이스 데이터 생성 ───

function generateCases() {
  const customerPool = expandDistribution(CUSTOMERS, 'name');
  const productPool = expandDistribution(PRODUCTS, 'name');
  const statusPool = expandDistribution(STATUSES);
  const confidencePool = expandDistribution(CONFIDENCES);

  const cases = [];

  for (let i = 0; i < 500; i++) {
    const customer = customerPool[i];
    const product = productPool[i];
    const status = statusPool[i];
    const conf = confidencePool[i];

    const questions = QUESTIONS[product.name];
    const answers = AI_ANSWERS[product.name];
    const question = randomPick(questions);
    const aiAnswer = randomPick(answers);

    const confidenceScore = randomInt(conf.scoreMin, conf.scoreMax);
    const needsEscalation = status.value === 'escalated' || conf.value === 'low';
    const isComplex = needsEscalation || conf.value === 'low' || status.value === 'escalated';

    const createdAt = randomDate(6);
    const updatedAt = new Date(
      new Date(createdAt).getTime() + randomInt(60000, 86400000 * 3)
    ).toISOString();

    cases.push({
      customer_id: customer.id,
      customer_name: customer.name,
      product: product.name,
      question,
      ai_answer: status.value === 'created' ? null : aiAnswer,
      confidence: status.value === 'created' ? null : conf.value,
      confidence_score: status.value === 'created' ? null : confidenceScore,
      status: status.value,
      needs_escalation: needsEscalation,
      is_complex: isComplex,
      session_id: generateSessionId(),
      created_at: createdAt,
      updated_at: updatedAt,
    });
  }

  return cases;
}

// ─── Supabase REST API 호출 ───

async function supabaseRequest(table, method, body = null, query = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': method === 'POST' ? 'return=minimal' : 'return=representation',
  };

  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase ${method} ${table} failed (${response.status}): ${errorText}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return null;
}

// ─── 배치 삽입 ───

async function insertBatch(table, records, batchNum, totalBatches) {
  process.stdout.write(`  📦 배치 ${batchNum}/${totalBatches} (${records.length}건)...`);
  await supabaseRequest(table, 'POST', records);
  console.log(' ✅');
}

// ─── 기존 데이터 삭제 ───

async function clearExistingData() {
  console.log('\n🗑️  기존 데이터 삭제 중...');

  // 외래키 의존성 순서대로 삭제
  try {
    await supabaseRequest('conversations', 'DELETE', null, '?id=not.is.null');
    console.log('  ✅ conversations 테이블 초기화');
  } catch (e) {
    console.log('  ⚠️  conversations:', e.message);
  }

  try {
    await supabaseRequest('escalations', 'DELETE', null, '?id=not.is.null');
    console.log('  ✅ escalations 테이블 초기화');
  } catch (e) {
    console.log('  ⚠️  escalations:', e.message);
  }

  try {
    await supabaseRequest('cases', 'DELETE', null, '?id=not.is.null');
    console.log('  ✅ cases 테이블 초기화');
  } catch (e) {
    console.log('  ⚠️  cases:', e.message);
  }

  try {
    await supabaseRequest('dashboard_stats', 'DELETE', null, '?id=not.is.null');
    console.log('  ✅ dashboard_stats 테이블 초기화');
  } catch (e) {
    console.log('  ⚠️  dashboard_stats:', e.message);
  }
}

// ─── 대시보드 통계 계산 및 삽입 ───

function calculateStats(cases) {
  const total = cases.length;
  const aiResolved = cases.filter(c => c.status === 'ai_resolved').length;
  const escalated = cases.filter(c => c.status === 'escalated').length;
  const resolved = cases.filter(c => c.status === 'resolved').length;
  const closed = cases.filter(c => c.status === 'closed').length;
  const aiResponding = cases.filter(c => c.status === 'ai_responding').length;
  const created = cases.filter(c => c.status === 'created').length;
  const inProgress = aiResponding + created;

  // 월별 통계 계산
  const monthlyStats = {};
  for (const c of cases) {
    const month = c.created_at.substring(0, 7); // YYYY-MM
    if (!monthlyStats[month]) {
      monthlyStats[month] = { total: 0, ai_resolved: 0, escalated: 0, in_progress: 0 };
    }
    monthlyStats[month].total++;
    if (c.status === 'ai_resolved') monthlyStats[month].ai_resolved++;
    if (c.status === 'escalated') monthlyStats[month].escalated++;
    if (['created', 'ai_responding'].includes(c.status)) monthlyStats[month].in_progress++;
  }

  const statsRecords = [];

  // 전체 통계
  statsRecords.push({
    period: 'all',
    total_cases: total,
    ai_resolved: aiResolved,
    escalated: escalated,
    in_progress: inProgress,
    avg_response_time_ai: 25,
    avg_response_time_agent: 1080,
    satisfaction_avg: 4.2,
  });

  // 월별 통계
  for (const [month, stats] of Object.entries(monthlyStats).sort()) {
    statsRecords.push({
      period: month,
      total_cases: stats.total,
      ai_resolved: stats.ai_resolved,
      escalated: stats.escalated,
      in_progress: stats.in_progress,
      avg_response_time_ai: randomInt(20, 35),
      avg_response_time_agent: randomInt(900, 1200),
      satisfaction_avg: (3.8 + Math.random() * 0.8).toFixed(1),
    });
  }

  return { statsRecords, summary: { total, aiResolved, escalated, resolved, closed, aiResponding, created } };
}

// ─── 에스컬레이션 레코드 생성 ───

function generateEscalations(cases) {
  const escalatedCases = cases.filter(c =>
    c.status === 'escalated' || c.needs_escalation
  );

  return escalatedCases.slice(0, 120).map((c, idx) => ({
    channel_id: `C${String(idx + 1).padStart(4, '0')}`,
    channel_name: `case-${c.customer_name}-${idx + 1}`,
    status: c.status === 'escalated' ? 'active' : (c.status === 'resolved' ? 'resolved' : 'pending'),
    sub_questions: JSON.stringify([
      { question: c.question, assignee: randomPick(['송인찬', '이현진', '박우호', '채소희']) },
    ]),
    created_at: c.created_at,
    resolved_at: ['resolved', 'closed'].includes(c.status)
      ? new Date(new Date(c.created_at).getTime() + randomInt(3600000, 86400000 * 5)).toISOString()
      : null,
  }));
}

// ─── 메인 실행 ───

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   ANY 브릿지 - Supabase 시드 데이터 생성기   ║');
  console.log('╚══════════════════════════════════════════════╝');

  try {
    // 1. 기존 데이터 삭제
    await clearExistingData();

    // 2. 케이스 데이터 생성
    console.log('\n📊 500건 케이스 데이터 생성 중...');
    const cases = generateCases();
    console.log(`  ✅ ${cases.length}건 생성 완료`);

    // 분포 확인
    const customerDist = {};
    const productDist = {};
    const statusDist = {};
    const confDist = {};
    for (const c of cases) {
      customerDist[c.customer_name] = (customerDist[c.customer_name] || 0) + 1;
      productDist[c.product] = (productDist[c.product] || 0) + 1;
      statusDist[c.status] = (statusDist[c.status] || 0) + 1;
      if (c.confidence) confDist[c.confidence] = (confDist[c.confidence] || 0) + 1;
    }

    console.log('\n📈 데이터 분포 확인:');
    console.log('  고객:', JSON.stringify(customerDist));
    console.log('  제품:', JSON.stringify(productDist));
    console.log('  상태:', JSON.stringify(statusDist));
    console.log('  신뢰도:', JSON.stringify(confDist));

    // 3. 배치 삽입 - cases
    console.log('\n💾 cases 테이블에 데이터 삽입 중...');
    const totalBatches = Math.ceil(cases.length / BATCH_SIZE);
    for (let i = 0; i < cases.length; i += BATCH_SIZE) {
      const batch = cases.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      await insertBatch('cases', batch, batchNum, totalBatches);
    }
    console.log(`  🎉 cases ${cases.length}건 삽입 완료!`);

    // 4. 에스컬레이션 데이터 생성 및 삽입
    console.log('\n💾 escalations 데이터 생성 및 삽입 중...');
    // escalations는 case_id가 필요하므로, 삽입된 cases를 조회
    const insertedCases = await supabaseRequest(
      'cases', 'GET', null,
      '?select=id,status,needs_escalation,customer_name,question,created_at&order=created_at.asc&limit=500'
    );

    if (insertedCases && insertedCases.length > 0) {
      const escalatedCases = insertedCases.filter(c =>
        c.status === 'escalated' || c.needs_escalation
      );

      const escalations = escalatedCases.slice(0, 120).map((c, idx) => ({
        case_id: c.id,
        channel_id: `C${String(idx + 1).padStart(4, '0')}`,
        channel_name: `case-${c.customer_name}-${idx + 1}`,
        status: c.status === 'escalated' ? 'active' : 'pending',
        sub_questions: [
          { question: c.question, assignee: randomPick(['송인찬', '이현진', '박우호', '채소희']) },
        ],
        created_at: c.created_at,
        resolved_at: null,
      }));

      const escBatches = Math.ceil(escalations.length / BATCH_SIZE);
      for (let i = 0; i < escalations.length; i += BATCH_SIZE) {
        const batch = escalations.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        await insertBatch('escalations', batch, batchNum, escBatches);
      }
      console.log(`  🎉 escalations ${escalations.length}건 삽입 완료!`);
    }

    // 5. 대시보드 통계 삽입
    console.log('\n💾 dashboard_stats 업데이트 중...');
    const { statsRecords, summary } = calculateStats(cases);
    await supabaseRequest('dashboard_stats', 'POST', statsRecords);
    console.log(`  ✅ dashboard_stats ${statsRecords.length}건 삽입 완료`);

    // 6. 최종 요약
    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║              🎉 시드 데이터 완료!             ║');
    console.log('╠══════════════════════════════════════════════╣');
    console.log(`║  총 케이스:     ${String(summary.total).padStart(5)}건                    ║`);
    console.log(`║  AI 해결:       ${String(summary.aiResolved).padStart(5)}건                    ║`);
    console.log(`║  에스컬레이션:  ${String(summary.escalated).padStart(5)}건                    ║`);
    console.log(`║  해결됨:        ${String(summary.resolved).padStart(5)}건                    ║`);
    console.log(`║  종료:          ${String(summary.closed).padStart(5)}건                    ║`);
    console.log(`║  AI 응답중:     ${String(summary.aiResponding).padStart(5)}건                    ║`);
    console.log(`║  생성됨:        ${String(summary.created).padStart(5)}건                    ║`);
    console.log('╚══════════════════════════════════════════════╝');

  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
