import { useState } from 'react'

const ThinkingPanel = ({ steps }) => {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg my-2 overflow-hidden">
      <button
        onClick={() => setExpanded(prev => !prev)}
        className="w-full p-3 flex items-center justify-between hover:bg-blue-100 transition"
      >
        <h4 className="font-semibold text-blue-900 flex items-center text-sm">
          <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          AI 사고 과정
        </h4>
        <span className="flex items-center space-x-2">
          <span className="text-xs text-blue-600">{steps.length}단계 진행 중</span>
          <svg className={`w-4 h-4 text-blue-700 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-2">
          {steps.map((step, index) => (
            <div
              key={index}
              className="text-sm text-gray-700 animate-fadeIn flex items-start"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <span className="mr-2">•</span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ThinkingPanel
