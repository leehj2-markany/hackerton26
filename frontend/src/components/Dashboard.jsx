import { useState, useEffect, useMemo } from 'react'
import {
  heroKPIs, caseHistory,
  monthlyAIvsHuman, productAIvsHuman,
  aiAgents, recentEvents
} from '../data/dashboardData'

// ─── Hero KPI 카드 ───
const HeroKPICard = ({ kpi }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
    <div className="flex items-center justify-between mb-3">
      <span className="text-2xl">{kpi.icon}</span>
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
        kpi.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
      }`}>
        {kpi.change}
      </span>
    </div>
    <div className="text-3xl font-bold text-gray-900">
      {kpi.value}<span className="text-lg font-normal text-gray-400 ml-1">{kpi.unit}</span>
    </div>
    <div className="text-sm font-medium text-gray-600 mt-1">{kpi.label}</div>
    <div className="text-xs text-gray-400 mt-1">Before: {kpi.before}{kpi.beforeUnit}</div>
  </div>
)


// ─── AI vs 휴먼 처리 이력 테이블 ───
const CaseHistoryTable = ({ filter }) => {
  const filtered = useMemo(() => {
    if (filter === 'all') return caseHistory
    return caseHistory.filter(c => c.resolvedBy === filter)
  }, [filter])

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto max-h-80">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="text-left px-3 py-2 text-gray-500 font-medium">처리</th>
              <th className="text-left px-3 py-2 text-gray-500 font-medium">고객사</th>
              <th className="text-left px-3 py-2 text-gray-500 font-medium">제품</th>
              <th className="text-left px-3 py-2 text-gray-500 font-medium">문의 내용</th>
              <th className="text-right px-3 py-2 text-gray-500 font-medium">응답 시간</th>
              <th className="text-center px-3 py-2 text-gray-500 font-medium">만족도</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(c => (
              <tr key={c.id} className="hover:bg-gray-50 transition">
                <td className="px-3 py-2.5">
                  {c.resolvedBy === 'ai' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">🤖 AI</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">👤 {c.agent}</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-gray-900 font-medium">{c.customer}</td>
                <td className="px-3 py-2.5 text-gray-600">{c.product}</td>
                <td className="px-3 py-2.5 text-gray-600 max-w-xs truncate">{c.question}</td>
                <td className="px-3 py-2.5 text-right font-mono">
                  {c.resolvedBy === 'ai' ? (
                    <span className="text-blue-600">{c.responseTime}초</span>
                  ) : (
                    <span className="text-amber-600">{Math.round(c.responseTime / 60)}분</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-center">
                  {'⭐'.repeat(c.satisfaction)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── 월별 AI vs 휴먼 바 차트 (CSS) ───
const MonthlyChart = () => (
  <div className="space-y-4">
    {monthlyAIvsHuman.map(m => (
      <div key={m.month}>
        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className="font-medium text-gray-700">{m.month}</span>
          <span className="text-gray-400">{m.total}건 (AI {m.aiRate}%)</span>
        </div>
        <div className="flex h-7 rounded-lg overflow-hidden bg-gray-100">
          <div
            className="bg-blue-500 flex items-center justify-center text-xs text-white font-medium transition-all"
            style={{ width: `${(m.ai / m.total) * 100}%` }}
          >
            {m.ai}
          </div>
          <div
            className="bg-amber-400 flex items-center justify-center text-xs text-white font-medium transition-all"
            style={{ width: `${(m.human / m.total) * 100}%` }}
          >
            {m.human}
          </div>
          <div
            className="bg-gray-300 flex items-center justify-center text-xs text-gray-600 font-medium transition-all"
            style={{ width: `${(m.pending / m.total) * 100}%` }}
          >
            {m.pending}
          </div>
        </div>
      </div>
    ))}
    <div className="flex gap-4 text-xs text-gray-500 pt-1">
      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500 inline-block"></span> AI 해결</span>
      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400 inline-block"></span> 휴먼 개입</span>
      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-300 inline-block"></span> 진행 중</span>
    </div>
  </div>
)

// ─── 제품별 AI vs 휴먼 분포 ───
const ProductDistribution = () => (
  <div className="space-y-3">
    {productAIvsHuman.map(p => (
      <div key={p.name}>
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="font-medium text-gray-700">{p.name}</span>
          <span className="text-gray-400">{p.total}건 · AI {p.aiRate}%</span>
        </div>
        <div className="flex h-5 rounded-md overflow-hidden bg-gray-100">
          <div className="bg-blue-500 transition-all" style={{ width: `${(p.ai / p.total) * 100}%` }}></div>
          <div className="bg-amber-400 transition-all" style={{ width: `${(p.human / p.total) * 100}%` }}></div>
        </div>
      </div>
    ))}
  </div>
)

// ─── AI 에이전트 상태 카드 ───
const AgentStatusCards = () => (
  <div className="grid grid-cols-3 gap-4">
    {aiAgents.map(a => (
      <div key={a.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xl">{a.icon}</span>
          <span className="flex items-center gap-1 text-xs text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            활성
          </span>
        </div>
        <div className="text-sm font-semibold text-gray-800">{a.name}</div>
        <div className="text-xs text-gray-400 mt-0.5 mb-3">{a.description}</div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-bold text-gray-900">{a.accuracy}%</div>
            <div className="text-xs text-gray-400">정확도</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">{a.avgResponseTime}초</div>
            <div className="text-xs text-gray-400">응답</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">{a.todayCases}</div>
            <div className="text-xs text-gray-400">오늘</div>
          </div>
        </div>
      </div>
    ))}
  </div>
)

// ─── 실시간 이벤트 로그 ───
const EventLog = () => {
  const typeStyles = {
    ai: 'bg-blue-50 border-blue-100',
    human: 'bg-amber-50 border-amber-100',
    safety: 'bg-purple-50 border-purple-100'
  }

  return (
    <div className="space-y-2 max-h-72 overflow-y-auto">
      {recentEvents.map((evt, i) => (
        <div key={i} className={`flex items-start gap-3 p-2.5 rounded-lg border ${typeStyles[evt.type]}`}>
          <span className="text-sm mt-0.5">{evt.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-800">{evt.event}</div>
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap font-mono">{evt.time}</span>
        </div>
      ))}
    </div>
  )
}

// ─── 메인 대시보드 ───
const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [historyFilter, setHistoryFilter] = useState('all')

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const aiCount = caseHistory.filter(c => c.resolvedBy === 'ai').length
  const humanCount = caseHistory.filter(c => c.resolvedBy === 'human').length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <a href="/" className="text-gray-400 hover:text-markany-blue transition text-sm">← 홈</a>
            <h1 className="text-xl font-bold text-markany-dark">ANY 브릿지</h1>
            <span className="text-gray-400 text-sm">AI 성과 대시보드</span>
            <span className="bg-emerald-50 text-emerald-600 text-xs font-medium px-2.5 py-1 rounded-full">● LIVE</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>가상 데이터 500건 기반</span>
            <span className="font-mono">{currentTime.toLocaleTimeString('ko-KR')}</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Row 1: Hero KPI */}
        <div className="grid grid-cols-4 gap-4">
          {heroKPIs.map((kpi, i) => <HeroKPICard key={i} kpi={kpi} />)}
        </div>

        {/* Row 2: AI vs 휴먼 처리 이력 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">AI vs 휴먼 처리 이력</h2>
              <p className="text-xs text-gray-400 mt-0.5">최근 20건 · AI {aiCount}건 / 휴먼 {humanCount}건</p>
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
              {[
                { key: 'all', label: '전체' },
                { key: 'ai', label: '🤖 AI' },
                { key: 'human', label: '👤 휴먼' }
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setHistoryFilter(f.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                    historyFilter === f.key
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <CaseHistoryTable filter={historyFilter} />
        </div>

        {/* Row 4: 2-column — 월별 추이 + 제품별 분포 */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">월별 AI vs 휴먼 추이</h2>
            <MonthlyChart />
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">제품별 AI vs 휴먼 분포</h2>
            <ProductDistribution />
          </div>
        </div>

        {/* Row 5: 에이전트 상태 + 이벤트 로그 */}
        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">AI 에이전트 상태</h2>
            <AgentStatusCards />
          </div>
          <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">실시간 이벤트 로그</h2>
            <EventLog />
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-gray-400 py-4">
          ANY 브릿지 — 마크애니 AI 해커톤 2026 | 듀얼 LLM (Gemini + Claude) · 가상 데이터 500건 · Slack 에스컬레이션
        </footer>
      </div>
    </div>
  )
}

export default Dashboard
