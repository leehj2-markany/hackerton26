import { useState, useEffect } from 'react'
import {
  subAgents, kpiMetrics, beforeAfter,
  productDistribution, caseStatusDistribution,
  monthlyTrend, recentEvents
} from '../data/dashboardData'

const statusColors = {
  active: 'bg-green-400',
  processing: 'bg-yellow-400 animate-pulse',
  idle: 'bg-gray-400',
  error: 'bg-red-400'
}

const statusLabels = {
  active: '활성',
  processing: '처리 중',
  idle: '대기',
  error: '오류'
}

const eventTypeColors = {
  success: 'text-green-600 bg-green-50',
  warning: 'text-yellow-600 bg-yellow-50',
  info: 'text-blue-600 bg-blue-50',
  error: 'text-red-600 bg-red-50'
}

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedAgent, setSelectedAgent] = useState(null)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const totalTasks = subAgents.reduce((sum, a) => sum + a.metrics.tasksTotal, 0)
  const completedTasks = subAgents.reduce((sum, a) => sum + a.metrics.tasksCompleted, 0)
  const overallProgress = Math.round((completedTasks / totalTasks) * 100)

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <a href="/" className="text-gray-400 hover:text-white transition text-sm">← 홈</a>
            <h1 className="text-xl font-bold text-blue-400">ANY 브릿지</h1>
            <span className="text-gray-400 text-sm">서브에이전트 대시보드</span>
            <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">● LIVE</span>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <span>전체 진행률: {overallProgress}%</span>
            <div className="w-32 bg-gray-700 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${overallProgress}%` }}></div>
            </div>
            <span>{currentTime.toLocaleTimeString('ko-KR')}</span>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Row 1: 서브에이전트 5개 카드 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">서브에이전트 상태</h2>
          <div className="grid grid-cols-5 gap-4">
            {subAgents.map(agent => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(selectedAgent?.id === agent.id ? null : agent)}
                className={`bg-gray-800 rounded-xl p-4 border transition-all hover:border-blue-500 text-left ${
                  selectedAgent?.id === agent.id ? 'border-blue-500 ring-1 ring-blue-500/50' : 'border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{agent.icon}</span>
                  <div className="flex items-center space-x-1.5">
                    <span className={`w-2 h-2 rounded-full ${statusColors[agent.status]}`}></span>
                    <span className="text-xs text-gray-400">{statusLabels[agent.status]}</span>
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">{agent.nameKo}</h3>
                <p className="text-xs text-gray-500 mb-3 line-clamp-1">{agent.description}</p>
                {/* Progress bar */}
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span>진행률</span>
                  <span>{agent.metrics.tasksCompleted}/{agent.metrics.tasksTotal}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${(agent.metrics.tasksCompleted / agent.metrics.tasksTotal) * 100}%` }}
                  ></div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Agent Detail Panel (선택 시) */}
        {selectedAgent && (
          <section className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{selectedAgent.icon}</span>
                <div>
                  <h3 className="text-lg font-semibold">{selectedAgent.nameKo}</h3>
                  <p className="text-sm text-gray-400">{selectedAgent.name}</p>
                </div>
              </div>
              <button onClick={() => setSelectedAgent(null)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gray-900 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">담당 요구사항</div>
                <div className="flex flex-wrap gap-1">
                  {selectedAgent.requirements.map(r => (
                    <span key={r} className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded">{r}</span>
                  ))}
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">기술 스택</div>
                <div className="flex flex-wrap gap-1">
                  {selectedAgent.techStack.map(t => (
                    <span key={t} className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded">{t}</span>
                  ))}
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">가동률</div>
                <div className="text-2xl font-bold text-green-400">{selectedAgent.metrics.uptime}%</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">최근 활동</div>
                <div className="text-sm text-gray-300">{selectedAgent.lastActivity}</div>
              </div>
            </div>
          </section>
        )}

        {/* Row 2: KPI 카드 4개 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">핵심 KPI (가상 데이터 500건 기반)</h2>
          <div className="grid grid-cols-4 gap-4">
            {Object.values(kpiMetrics).map((kpi, i) => {
              const isGood = kpi.label.includes('해결률') || kpi.label.includes('만족도')
                ? kpi.value >= kpi.target
                : kpi.value <= kpi.target
              return (
                <div key={i} className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{kpi.icon}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isGood ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {isGood ? '목표 달성' : '개선 필요'}
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-white">{kpi.value}<span className="text-lg text-gray-400">{kpi.unit}</span></div>
                  <div className="text-sm text-gray-400 mt-1">{kpi.label}</div>
                  <div className="text-xs text-gray-500 mt-1">목표: {kpi.target}{kpi.unit}</div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Row 3: 3-column layout */}
        <div className="grid grid-cols-3 gap-6">
          {/* 제품별 문의 분포 */}
          <section className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-400 mb-4">제품별 문의 분포</h3>
            <div className="space-y-3">
              {productDistribution.map(p => (
                <div key={p.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">{p.name}</span>
                    <span className="text-gray-400">{p.count}건 ({p.percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${p.percentage}%`, backgroundColor: p.color }}></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 케이스 상태 분포 */}
          <section className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-400 mb-4">케이스 상태 분포</h3>
            <div className="space-y-3">
              {caseStatusDistribution.map(c => (
                <div key={c.status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">{c.status}</span>
                    <span className="text-gray-400">{c.count}건 ({c.percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${c.percentage}%`, backgroundColor: c.color }}></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-700 text-center">
              <span className="text-2xl font-bold text-white">500</span>
              <span className="text-sm text-gray-400 ml-1">건 총 케이스</span>
            </div>
          </section>

          {/* 월별 추이 */}
          <section className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-400 mb-4">월별 문의 추이 (최근 3개월)</h3>
            <div className="space-y-3">
              {monthlyTrend.map(m => (
                <div key={m.month} className="bg-gray-900 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-white">{m.month}</span>
                    <span className="text-sm text-gray-400">{m.total}건</span>
                  </div>
                  <div className="flex space-x-1 h-4">
                    <div className="bg-green-500 rounded-sm" style={{ width: `${(m.aiResolved / m.total) * 100}%` }} title={`AI 해결: ${m.aiResolved}`}></div>
                    <div className="bg-blue-500 rounded-sm" style={{ width: `${(m.escalated / m.total) * 100}%` }} title={`에스컬레이션: ${m.escalated}`}></div>
                    <div className="bg-yellow-500 rounded-sm" style={{ width: `${(m.pending / m.total) * 100}%` }} title={`진행 중: ${m.pending}`}></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>🟢 AI {m.aiResolved}</span>
                    <span>🔵 에스컬 {m.escalated}</span>
                    <span>🟡 진행 {m.pending}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Row 4: Before/After + 실시간 이벤트 로그 */}
        <div className="grid grid-cols-2 gap-6">
          {/* Before/After 비교 */}
          <section className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-400 mb-4">Before / After 비교</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Before */}
              <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                <div className="text-sm font-semibold text-red-400 mb-1">{beforeAfter.before.label}</div>
                <div className="text-xs text-gray-500 mb-3">{beforeAfter.before.source}</div>
                <div className="space-y-2 text-sm">
                  {Object.entries(beforeAfter.before.metrics).map(([key, val]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-400">{formatMetricLabel(key)}</span>
                      <span className="text-red-300 font-mono">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* After */}
              <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
                <div className="text-sm font-semibold text-green-400 mb-1">{beforeAfter.after.label}</div>
                <div className="text-xs text-gray-500 mb-3">{beforeAfter.after.source}</div>
                <div className="space-y-2 text-sm">
                  {Object.entries(beforeAfter.after.metrics).map(([key, val]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-400">{formatMetricLabel(key)}</span>
                      <span className="text-green-300 font-mono">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-700 text-center">
              <span className="text-sm text-gray-400">응답 시간 </span>
              <span className="text-green-400 font-bold">93.4% 단축</span>
              <span className="text-gray-500 mx-2">|</span>
              <span className="text-sm text-gray-400">1차 해결률 </span>
              <span className="text-green-400 font-bold">+48%p 향상</span>
            </div>
          </section>

          {/* 실시간 이벤트 로그 */}
          <section className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-400 mb-4">실시간 이벤트 로그</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentEvents.map((evt, i) => (
                <div key={i} className={`flex items-start space-x-3 p-2 rounded-lg ${eventTypeColors[evt.type]}`}>
                  <span className="text-xs font-mono whitespace-nowrap mt-0.5">{evt.time}</span>
                  <div>
                    <span className="text-xs font-semibold">[{evt.agent}]</span>
                    <span className="text-xs ml-1">{evt.event}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-gray-600 py-4">
          ANY 브릿지 — 마크애니 AI 해커톤 2026 | 서브에이전트 5개 · 가상 데이터 500건 · 듀얼 LLM (Gemini + Claude)
        </footer>
      </div>
    </div>
  )
}

function formatMetricLabel(key) {
  const labels = {
    avgResponseTime: '평균 응답 시간',
    firstResolutionRate: '1차 해결률',
    satisfaction: '고객 만족도',
    escalationRate: '에스컬레이션률',
    costPerCase: '건당 비용'
  }
  return labels[key] || key
}

export default Dashboard
