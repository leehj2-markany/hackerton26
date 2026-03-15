import { useState, useEffect } from 'react'

const AgentStatus = ({ agents }) => {
  const totalAgents = agents.length
  const joinedCount = agents.filter(a => a.joined).length
  const allJoined = joinedCount === totalAgents
  const [collapsed, setCollapsed] = useState(false)

  // 전원 연결 완료 시 2초 후 자동 접기
  useEffect(() => {
    if (allJoined) {
      const timer = setTimeout(() => setCollapsed(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [allJoined])

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg my-2 overflow-hidden">
      <button
        onClick={() => setCollapsed(prev => !prev)}
        className="w-full p-3 flex items-center justify-between hover:bg-green-100 transition"
      >
        <span className="font-semibold text-green-900 flex items-center text-sm">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {allJoined ? '담당자 연결 완료' : '담당자 연결 중'}
        </span>
        <span className="flex items-center space-x-2">
          <span className="text-xs text-green-700">{allJoined ? '✅' : '⏳'} {joinedCount}/{totalAgents}</span>
          <svg className={`w-4 h-4 text-green-700 transition-transform ${collapsed ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {!collapsed && (
        <div className="px-3 pb-3 space-y-2">
          {agents.map((agent, index) => (
            <div key={index} className="flex items-center space-x-3 bg-white p-2 rounded-lg">
              <div className="text-2xl">{agent.avatar}</div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 text-sm">{agent.name}</div>
                <div className="text-xs text-gray-600">{agent.role}</div>
              </div>
              {agent.joined && (
                <div className="text-green-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AgentStatus
