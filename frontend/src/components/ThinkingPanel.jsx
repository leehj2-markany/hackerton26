import { useState } from 'react'

// [의도] AI 사고 과정을 시각적으로 매력적이게 표현 — 전문가 토론에서 "ThinkingPanel이 너무 단조롭다" 피드백 반영
// 그라데이션 배경 + 스텝 인디케이터 + 펄스 애니메이션으로 "AI가 열심히 분석 중" 느낌 전달
const ThinkingPanel = ({ steps }) => {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/60 rounded-xl my-2 overflow-hidden shadow-sm">
      <button
        onClick={() => setExpanded(prev => !prev)}
        className="w-full p-3 flex items-center justify-between hover:bg-white/40 transition-all"
      >
        <div className="flex items-center space-x-2">
          {/* Animated brain icon */}
          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h4 className="font-semibold text-gray-800 text-sm">AI 분석 중</h4>
        </div>
        <div className="flex items-center space-x-2">
          {/* Step progress dots */}
          <div className="flex space-x-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-blue-500"
                style={{ opacity: 0.4 + (i / steps.length) * 0.6 }}
              />
            ))}
          </div>
          <span className="text-xs text-blue-600 font-medium">{steps.length}단계</span>
          <svg className={`w-4 h-4 text-blue-600 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-1.5">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex items-start space-x-2 animate-fadeIn"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Step number badge */}
              <div className="flex-shrink-0 w-5 h-5 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-[10px] text-white font-bold">{index + 1}</span>
              </div>
              <span className="text-sm text-gray-700 leading-relaxed">{step}</span>
            </div>
          ))}
          {/* Loading bar at bottom */}
          <div className="mt-2 h-1 bg-blue-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse" style={{ width: `${Math.min(95, steps.length * 25)}%`, transition: 'width 0.5s ease' }} />
          </div>
        </div>
      )}
    </div>
  )
}

export default ThinkingPanel
