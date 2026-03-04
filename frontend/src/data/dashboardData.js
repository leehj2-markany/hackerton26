// 대시보드 데이터 — AI vs 휴먼 처리 구분 시각화

// Hero KPI 4개
export const heroKPIs = [
  {
    label: 'AI 자동 해결률',
    value: 60,
    unit: '%',
    before: 12,
    beforeUnit: '%',
    change: '+48%p',
    positive: true,
    icon: '🤖',
    description: 'AI가 단독으로 해결한 비율'
  },
  {
    label: 'AI 평균 응답',
    value: 25,
    unit: '초',
    before: 272,
    beforeUnit: '분',
    change: '-93.4%',
    positive: true,
    icon: '⚡',
    description: '첫 응답까지 걸리는 시간'
  },
  {
    label: '고객 만족도',
    value: 4.2,
    unit: '/5.0',
    before: 3.1,
    beforeUnit: '/5.0',
    change: '+1.1p',
    positive: true,
    icon: '⭐',
    description: 'CSAT 평균 점수'
  },
  {
    label: '건당 비용 절감',
    value: 73,
    unit: '%',
    before: 45000,
    beforeUnit: '원',
    change: '-₩33K',
    positive: true,
    icon: '💰',
    description: '₩45,000 → ₩12,000'
  }
]

// AI vs 휴먼 처리 이력 — 최근 케이스 20건
export const caseHistory = [
  { id: 'C-001', customer: 'SK하이닉스', product: 'DRM', question: 'Windows 11 호환성 문의', resolvedBy: 'ai', responseTime: 6, satisfaction: 5, date: '2026-02-28' },
  { id: 'C-002', customer: '국방부', product: 'Document SAFER', question: '망분리 환경 구축 가능 여부', resolvedBy: 'human', responseTime: 1440, satisfaction: 4, date: '2026-02-28', agent: '송인찬' },
  { id: 'C-003', customer: 'SK하이닉스', product: 'DRM', question: '라이선스 갱신 절차', resolvedBy: 'ai', responseTime: 4, satisfaction: 5, date: '2026-02-27' },
  { id: 'C-004', customer: '국민건강보험공단', product: 'SafeCopy', question: '대량 배포 시 성능 이슈', resolvedBy: 'human', responseTime: 960, satisfaction: 4, date: '2026-02-27', agent: '이현진' },
  { id: 'C-005', customer: 'SK하이닉스', product: 'DRM', question: 'API 연동 가이드 요청', resolvedBy: 'ai', responseTime: 8, satisfaction: 4, date: '2026-02-26' },
  { id: 'C-006', customer: '현대자동차', product: 'Content SAFER', question: '클라우드 환경 지원 여부', resolvedBy: 'ai', responseTime: 5, satisfaction: 5, date: '2026-02-26' },
  { id: 'C-007', customer: '국방부', product: 'DRM', question: '보안 인증(CC) 취득 현황', resolvedBy: 'ai', responseTime: 7, satisfaction: 4, date: '2026-02-25' },
  { id: 'C-008', customer: '삼성전자', product: 'Document SAFER', question: '기존 ECM 연동 + 커스터마이징 범위', resolvedBy: 'human', responseTime: 2160, satisfaction: 3, date: '2026-02-25', agent: '송인찬' },
  { id: 'C-009', customer: 'LG에너지솔루션', product: 'DRM', question: 'macOS 지원 여부', resolvedBy: 'ai', responseTime: 3, satisfaction: 5, date: '2026-02-24' },
  { id: 'C-010', customer: '국민건강보험공단', product: 'SafeCopy', question: '출력물 보안 정책 설정 방법', resolvedBy: 'ai', responseTime: 9, satisfaction: 4, date: '2026-02-24' },
  { id: 'C-011', customer: 'SK하이닉스', product: 'DRM', question: '모바일 DRM 지원 범위', resolvedBy: 'ai', responseTime: 5, satisfaction: 5, date: '2026-02-23' },
  { id: 'C-012', customer: '국방부', product: 'DRM', question: '국방부 전용 커스터마이징 + 납품 일정 + 유지보수 조건', resolvedBy: 'human', responseTime: 1800, satisfaction: 4, date: '2026-02-23', agent: '박우호' },
  { id: 'C-013', customer: '현대자동차', product: 'Content SAFER', question: '동영상 DRM 적용 가능 여부', resolvedBy: 'ai', responseTime: 6, satisfaction: 4, date: '2026-02-22' },
  { id: 'C-014', customer: '삼성전자', product: 'DRM', question: '글로벌 라이선스 정책', resolvedBy: 'human', responseTime: 1200, satisfaction: 4, date: '2026-02-22', agent: '이현진' },
  { id: 'C-015', customer: 'LG에너지솔루션', product: 'Document SAFER', question: '문서 등급 분류 자동화', resolvedBy: 'ai', responseTime: 7, satisfaction: 5, date: '2026-02-21' },
  { id: 'C-016', customer: 'SK하이닉스', product: 'DRM', question: 'SSO 연동 방법', resolvedBy: 'ai', responseTime: 4, satisfaction: 5, date: '2026-02-21' },
  { id: 'C-017', customer: '국민건강보험공단', product: 'SafeCopy', question: '감사 로그 조회 기능', resolvedBy: 'ai', responseTime: 5, satisfaction: 4, date: '2026-02-20' },
  { id: 'C-018', customer: '국방부', product: 'Document SAFER', question: '보안등급별 접근 제어 + 감사 추적 요건', resolvedBy: 'human', responseTime: 2400, satisfaction: 3, date: '2026-02-20', agent: '송인찬' },
  { id: 'C-019', customer: '현대자동차', product: 'DRM', question: '파일 암호화 알고리즘 종류', resolvedBy: 'ai', responseTime: 3, satisfaction: 5, date: '2026-02-19' },
  { id: 'C-020', customer: 'SK하이닉스', product: 'DRM', question: 'Linux 서버 지원 여부', resolvedBy: 'ai', responseTime: 4, satisfaction: 5, date: '2026-02-19' }
]


// 월별 AI vs 휴먼 추이
export const monthlyAIvsHuman = [
  { month: '12월', total: 145, ai: 78, human: 52, pending: 15, aiRate: 54 },
  { month: '1월', total: 168, ai: 98, human: 55, pending: 15, aiRate: 58 },
  { month: '2월', total: 187, ai: 124, human: 43, pending: 20, aiRate: 66 }
]

// 제품별 AI vs 휴먼 분포
export const productAIvsHuman = [
  { name: 'DRM', total: 200, ai: 140, human: 60, aiRate: 70, color: '#0066CC' },
  { name: 'Document SAFER', total: 150, ai: 80, human: 70, aiRate: 53, color: '#10B981' },
  { name: 'SafeCopy', total: 80, ai: 55, human: 25, aiRate: 69, color: '#F59E0B' },
  { name: 'Content SAFER', total: 70, ai: 25, human: 45, aiRate: 36, color: '#8B5CF6' }
]

// AI 에이전트 상태 (외부 관점 3개)
export const aiAgents = [
  {
    id: 'rag',
    name: 'RAG 검색 엔진',
    icon: '🔍',
    status: 'active',
    description: '제품 지식 기반 자동 응답',
    accuracy: 92,
    avgResponseTime: 4.2,
    todayCases: 28
  },
  {
    id: 'safety',
    name: 'AI 안전성 가드',
    icon: '🛡️',
    status: 'active',
    description: '프롬프트 인젝션 차단 + PII 마스킹',
    accuracy: 99.8,
    avgResponseTime: 0.3,
    todayCases: 45
  },
  {
    id: 'escalation',
    name: '에스컬레이션 매니저',
    icon: '📞',
    status: 'active',
    description: 'Slack 채널 생성 + 담당자 배정',
    accuracy: 95,
    avgResponseTime: 2.1,
    todayCases: 12
  }
]

// 실시간 이벤트 로그
export const recentEvents = [
  { time: '14:32:15', type: 'ai', event: 'SK하이닉스 — DRM Windows 11 호환성 문의 자동 해결 (6.2초)', icon: '🤖' },
  { time: '14:31:48', type: 'safety', event: '프롬프트 인젝션 시도 차단 (한국어 패턴)', icon: '🛡️' },
  { time: '14:30:22', type: 'human', event: '국방부 에스컬레이션 → 송인찬 담당자 배정', icon: '👤' },
  { time: '14:29:55', type: 'ai', event: '현대자동차 — Content SAFER 클라우드 지원 자동 해결 (5.1초)', icon: '🤖' },
  { time: '14:28:10', type: 'human', event: '삼성전자 ECM 연동 건 → 이현진 담당자 응답 완료', icon: '✅' },
  { time: '14:27:33', type: 'ai', event: 'LG에너지솔루션 — DRM macOS 지원 자동 해결 (3.4초)', icon: '🤖' },
  { time: '14:26:01', type: 'safety', event: 'Constitutional AI 검증 통과 — 경쟁사 비교 요청 필터링', icon: '🛡️' },
  { time: '14:25:18', type: 'human', event: '국방부 커스터마이징 건 → 박우호 담당자 채널 입장', icon: '👤' }
]
