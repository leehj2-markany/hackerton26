// 대시보드 Mock 데이터 — 서브에이전트 5개 + KPI + 가상 케이스 500건 기반

export const subAgents = [
  {
    id: 'frontend',
    name: 'Frontend Agent',
    nameKo: '프론트엔드 에이전트',
    icon: '🎨',
    status: 'active', // active, idle, processing, error
    description: '가상 홈페이지 + 챗봇 UI + 반응형',
    requirements: ['R1', 'R11'],
    metrics: { tasksCompleted: 12, tasksTotal: 14, uptime: 99.8 },
    lastActivity: '챗봇 Quick Reply 칩 구현 완료',
    techStack: ['React', 'Tailwind CSS', 'Vite']
  },
  {
    id: 'backend',
    name: 'Backend Core Agent',
    nameKo: '백엔드 코어 에이전트',
    icon: '⚙️',
    status: 'processing',
    description: 'Gemini RAG + Agentic 라우팅 + CHECK 분석',
    requirements: ['R2', 'R3', 'R4', 'R13', 'R19', 'R20', 'R22', 'R23'],
    metrics: { tasksCompleted: 8, tasksTotal: 18, uptime: 99.5 },
    lastActivity: 'CHECK 시맨틱 분석 Self-Reflection 구현 중',
    techStack: ['Node.js', 'Vercel Functions', 'Gemini API', 'Supabase']
  },
  {
    id: 'slack',
    name: 'Slack Integration Agent',
    nameKo: '슬랙 연동 에이전트',
    icon: '💬',
    status: 'idle',
    description: 'Slack 에스컬레이션 + 가상봇 + AI 코파일럿',
    requirements: ['R4', 'R5', 'R12', 'R16', 'R17', 'R18'],
    metrics: { tasksCompleted: 5, tasksTotal: 14, uptime: 98.9 },
    lastActivity: '채소희_봇 자동 인사 메시지 구현 완료',
    techStack: ['Slack Bolt', 'Slack API', 'Claude Sonnet 4']
  },
  {
    id: 'safety',
    name: 'AI Safety Agent',
    nameKo: 'AI 안전성 에이전트',
    icon: '🛡️',
    status: 'active',
    description: '프롬프트 인젝션 차단 + Constitutional AI + 환각 방지',
    requirements: ['R9', 'R21', 'R24'],
    metrics: { tasksCompleted: 4, tasksTotal: 6, uptime: 100 },
    lastActivity: 'Constitutional AI 안전 원칙 3개 정의 완료',
    techStack: ['Gemini API', 'Claude Sonnet 4', 'RegExp']
  },
  {
    id: 'dashboard',
    name: 'Data & Dashboard Agent',
    nameKo: '데이터 & 대시보드 에이전트',
    icon: '📊',
    status: 'active',
    description: '세일즈포스 MCP + 가상 데이터 500건 + KPI 시각화',
    requirements: ['R8', 'R10'],
    metrics: { tasksCompleted: 6, tasksTotal: 9, uptime: 99.9 },
    lastActivity: '가상 케이스 데이터 500건 Supabase 적재 완료',
    techStack: ['Salesforce MCP', 'Claude Sonnet 4', 'Supabase']
  }
]

// KPI 핵심 지표 (가상 데이터 500건 기반)
export const kpiMetrics = {
  firstResolutionRate: { value: 60, target: 65, unit: '%', label: '1차 해결률', icon: '✅' },
  avgResponseTimeAI: { value: 25, target: 30, unit: '초', label: 'AI 평균 응답', icon: '⚡' },
  avgResponseTimeTotal: { value: 18, target: 30, unit: '분', label: '전체 평균 응답', icon: '⏱️' },
  satisfaction: { value: 4.2, target: 4.0, unit: '/5.0', label: '고객 만족도', icon: '⭐' }
}

// Before/After 비교 (세일즈포스 실측 vs ANY브릿지 도입 후)
export const beforeAfter = {
  before: {
    label: 'Before (현재)',
    source: '세일즈포스 실측',
    metrics: {
      avgResponseTime: '4시간 32분',
      firstResolutionRate: '12%',
      satisfaction: '3.1/5.0',
      escalationRate: '88%',
      costPerCase: '₩45,000'
    }
  },
  after: {
    label: 'After (ANY브릿지)',
    source: '가상 데이터 500건 시뮬레이션',
    metrics: {
      avgResponseTime: '18분',
      firstResolutionRate: '60%',
      satisfaction: '4.2/5.0',
      escalationRate: '40%',
      costPerCase: '₩12,000'
    }
  }
}

// 제품별 문의 분포 (가상 데이터 500건)
export const productDistribution = [
  { name: 'DRM', count: 200, percentage: 40, color: '#3B82F6' },
  { name: 'Document SAFER', count: 150, percentage: 30, color: '#10B981' },
  { name: 'SafeCopy', count: 80, percentage: 16, color: '#F59E0B' },
  { name: '기타', count: 70, percentage: 14, color: '#8B5CF6' }
]

// 케이스 상태 분포
export const caseStatusDistribution = [
  { status: 'AI 해결', count: 300, percentage: 60, color: '#10B981' },
  { status: '에스컬레이션→해결', count: 150, percentage: 30, color: '#3B82F6' },
  { status: '진행 중', count: 50, percentage: 10, color: '#F59E0B' }
]

// 월별 문의 추이 (최근 3개월)
export const monthlyTrend = [
  { month: '12월', total: 145, aiResolved: 78, escalated: 52, pending: 15 },
  { month: '1월', total: 168, aiResolved: 98, escalated: 55, pending: 15 },
  { month: '2월', total: 187, aiResolved: 124, escalated: 43, pending: 20 }
]

// 실시간 이벤트 로그
export const recentEvents = [
  { time: '14:32:15', agent: 'Backend Core', event: 'SK하이닉스 문의 AI 자동 해결 (6.2초)', type: 'success' },
  { time: '14:31:48', agent: 'AI Safety', event: '프롬프트 인젝션 시도 차단', type: 'warning' },
  { time: '14:30:22', agent: 'Slack Integration', event: '국방부 에스컬레이션 채널 생성', type: 'info' },
  { time: '14:29:55', agent: 'Frontend', event: 'Quick Reply 칩 클릭 → 추가 질의 처리', type: 'info' },
  { time: '14:28:10', agent: 'Data & Dashboard', event: 'KPI 메트릭 갱신 완료', type: 'success' },
  { time: '14:27:33', agent: 'Backend Core', event: 'CHECK 시맨틱 분석: 3개 서브질문 분해', type: 'info' },
  { time: '14:26:01', agent: 'AI Safety', event: 'Constitutional AI 검증 통과', type: 'success' },
  { time: '14:25:18', agent: 'Slack Integration', event: '채소희_봇 인사 메시지 발송', type: 'info' }
]
