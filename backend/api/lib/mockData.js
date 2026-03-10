// 데모용 Mock 데이터 — 세일즈포스 Account 스타일 고객 정보
export const customers = {
  skhynix: {
    id: 'skhynix',
    name: 'SK하이닉스',
    product: 'Document SAFER',
    version: 'v3.1',
    license: '1,000 User',
    deploymentDate: '2024-03-15',
    contractEndDate: '2026-03-14',
    industry: '반도체',
    annualRevenue: '₩63조',
    employees: 29000,
    billingCity: '이천',
    salesManager: '송인찬',
    engineer: '이현진',
    supportContact: '채소희',
    accountType: '기존 고객',
    satisfactionScore: 4.5,
    history: [
      { date: '2025-02-10', question: '윈도우 11 호환성 문의', status: 'resolved' },
      { date: '2025-01-25', question: 'PDF 암호화 오류 해결', status: 'resolved' },
      { date: '2025-01-15', question: '대량 파일 처리 속도 개선 요청', status: 'resolved' },
    ],
    aiInsight: '이 고객은 성능 최적화와 윈도우 11 호환성에 관심이 높습니다. 최근 3건의 문의가 모두 해결되어 만족도가 높은 상태입니다. v3.2 업그레이드 제안 적기입니다.',
    references: ['릴리스 노트 v3.2', '과거 문의 #2025-02-10', '성능 최적화 가이드'],
    opportunities: [
      { name: 'Document SAFER v3.2 업그레이드', stage: '제안', amount: '₩1.2억', closeDate: '2026-06-30' },
      { name: 'Print SAFER 추가 도입', stage: '탐색', amount: '₩5,000만', closeDate: '2026-09-30' },
    ],
  },
  defense: {
    id: 'defense',
    name: '국방부',
    product: 'DRM',
    version: 'v2.8',
    license: '500 User',
    deploymentDate: '2023-11-20',
    contractEndDate: '2026-11-19',
    industry: '공공/국방',
    annualRevenue: '비공개',
    employees: 0,
    billingCity: '서울 용산',
    salesManager: '송인찬',
    engineer: '이현진',
    supportContact: '채소희',
    accountType: '기존 고객',
    satisfactionScore: 4.2,
    history: [
      { date: '2025-02-01', question: '보안 인증 관련 문의', status: 'resolved' },
      { date: '2025-01-20', question: '맞춤형 구축 가능성', status: 'resolved' },
      { date: '2025-01-10', question: '기존 시스템 연동 방안', status: 'resolved' },
    ],
    aiInsight: '이 고객은 보안 인증과 맞춤형 구축에 높은 관심을 보입니다. CC인증, GS인증 보유 사실이 핵심 셀링 포인트입니다. 폐쇄망 환경 대응이 중요합니다.',
    references: ['정책기능서 v3.2', 'CC인증서', 'GS인증서', '국방부 프로젝트 사례'],
    opportunities: [
      { name: 'DRM v3.0 맞춤형 구축', stage: '협상', amount: '₩3.5억', closeDate: '2026-04-30' },
      { name: '모바일 DRM 확장', stage: '탐색', amount: '₩1억', closeDate: '2026-12-31' },
    ],
  },
}

// 고객명 → ID 퍼지 매칭 맵
export const customerNameMap = {
  'SK하이닉스': 'skhynix', '하이닉스': 'skhynix', 'skhynix': 'skhynix', 'SK': 'skhynix',
  '국방부': 'defense', '국방': 'defense', 'defense': 'defense',
}

export const agents = [
  { id: 'U001', name: '채소희', role: '고객센터', avatar: '👩‍💼' },
  { id: 'U002', name: '송인찬', role: '어카운트 매니저', avatar: '👨‍💼' },
  { id: 'U003', name: '이현진', role: 'SE', avatar: '👨‍💻' },
  { id: 'U004', name: '박우호', role: '개발리더', avatar: '👨‍🔧' },
]
