import { useState, useEffect, useRef } from 'react'

const DEMO_STEPS = [
  // Phase 1: 고객 입력 (0~3초)
  { time: 0, type: 'system', text: '고객이 상담을 시작합니다...' },
  { time: 1500, type: 'user', text: 'SK하이닉스입니다. DRM 솔루션 도입을 검토하고 있습니다.' },
  // Phase 2: AI 사고 과정 (3~8초)
  { time: 3500, type: 'thinking', steps: [
    { icon: '🔍', text: '고객 정보 조회 중...' },
    { icon: '🧠', text: 'SK하이닉스 — DRM, Document SAFER 사용 중' },
    { icon: '📚', text: 'RAG 검색: 28개 제품 지식베이스에서 관련 문서 3건 발견' },
    { icon: '✅', text: 'AI Safety 검증 통과 — 신뢰도: High (92%)' },
  ]},
  // Phase 3: AI 답변 (8~15초)
  { time: 8500, type: 'ai', text: '안녕하세요, SK하이닉스 담당자님! 현재 Document SAFER를 사용 중이시군요.\n\nDRM 솔루션으로는 다음을 추천드립니다:\n\n1. **Document DRM** — 문서 암호화 + 권한 제어\n2. **Web DRM (Web SAFER)** — 브라우저 기반 캡처 방지\n\n현재 환경(Windows 11, 250유저)에 맞는 구축 제안서를 준비해 드릴까요?' },
  // Phase 4: 에스컬레이션 (15~22초)
  { time: 16000, type: 'user', text: '네, 담당자 연결해주세요. 견적도 필요합니다.' },
  { time: 17500, type: 'escalation', text: '담당자를 연결하고 있습니다...' },
  { time: 19000, type: 'agent-join', agents: [
    { name: '채소희', role: '고객센터', avatar: '👩‍💼' },
    { name: '송인찬', role: '세일즈', avatar: '👨‍💼' },
    { name: '이현진', role: 'SE', avatar: '👨‍💻' },
  ]},
  // Phase 5: 담당자 LIVE 답변 (22~28초)
  { time: 23000, type: 'live', name: '이현진', text: 'DRM 250유저 기준 구축 기간은 약 4~6주입니다. 견적서와 기술 자료 보내드리겠습니다.' },
  { time: 26000, type: 'system', text: '✅ 상담이 성공적으로 완료되었습니다' },
]

export default function DemoModal({ isOpen, onClose }) {
  const [visibleSteps, setVisibleSteps] = useState([])
  const [thinkingSteps, setThinkingSteps] = useState([])
  const [agentList, setAgentList] = useState([])
  const [progress, setProgress] = useState(0)
  const scrollRef = useRef(null)
  const timerRef = useRef([])

  useEffect(() => {
    if (!isOpen) return
    // Reset
    setVisibleSteps([])
    setThinkingSteps([])
    setAgentList([])
    setProgress(0)
    timerRef.current.forEach(clearTimeout)
    timerRef.current = []

    const totalDuration = 28000
    // Progress bar
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) { clearInterval(progressInterval); return 100 }
        return prev + (100 / (totalDuration / 100))
      })
    }, 100)
    timerRef.current.push(progressInterval)

    DEMO_STEPS.forEach(step => {
      if (step.type === 'thinking') {
        step.steps.forEach((s, i) => {
          const t = setTimeout(() => setThinkingSteps(prev => [...prev, s]), step.time + i * 1000)
          timerRef.current.push(t)
        })
      } else if (step.type === 'agent-join') {
        step.agents.forEach((a, i) => {
          const t = setTimeout(() => setAgentList(prev => [...prev, a]), step.time + i * 1200)
          timerRef.current.push(t)
        })
      } else {
        const t = setTimeout(() => setVisibleSteps(prev => [...prev, step]), step.time)
        timerRef.current.push(t)
      }
    })

    return () => {
      timerRef.current.forEach(clearTimeout)
      clearInterval(progressInterval)
    }
  }, [isOpen])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [visibleSteps, thinkingSteps, agentList])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold">데모 재생 중</span>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white text-xl leading-none">&times;</button>
        </div>
        {/* Progress */}
        <div className="h-1 bg-gray-200"><div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-100" style={{ width: `${progress}%` }}></div></div>

        {/* Chat area */}
        <div ref={scrollRef} className="h-[420px] overflow-y-auto p-4 space-y-3 bg-gray-50">
          {visibleSteps.map((step, i) => (
            <StepBubble key={i} step={step} />
          ))}
          {thinkingSteps.length > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-1.5 animate-fadeIn">
              <div className="text-xs font-semibold text-blue-600 mb-1">🧠 AI 사고 과정</div>
              {thinkingSteps.map((s, i) => (
                <div key={i} className="text-xs text-blue-800 flex items-center space-x-1.5 animate-fadeIn">
                  <span>{s.icon}</span><span>{s.text}</span>
                </div>
              ))}
            </div>
          )}
          {agentList.length > 0 && (
            <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 animate-fadeIn">
              <div className="text-xs font-semibold text-orange-600 mb-2">👥 담당자 연결</div>
              <div className="space-y-1.5">
                {agentList.map((a, i) => (
                  <div key={i} className="flex items-center space-x-2 text-sm animate-fadeIn">
                    <span>{a.avatar}</span>
                    <span className="font-medium text-gray-800">{a.name}</span>
                    <span className="text-xs text-gray-500">{a.role}</span>
                    <span className="text-green-500 text-xs">✅ 입장</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-white border-t border-gray-100 text-center">
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">닫기</button>
          <span className="mx-3 text-gray-300">|</span>
          <button onClick={() => window.dispatchEvent(new CustomEvent('openChatbot'))} className="text-sm text-blue-600 font-semibold hover:text-blue-700" >
            직접 체험하기 →
          </button>
        </div>
      </div>
    </div>
  )
}

function StepBubble({ step }) {
  if (step.type === 'system') {
    return <div className="text-center text-xs text-gray-400 py-1 animate-fadeIn">{step.text}</div>
  }
  if (step.type === 'user') {
    return (
      <div className="flex justify-end animate-fadeIn">
        <div className="bg-blue-600 text-white text-sm px-3.5 py-2 rounded-xl rounded-br-sm max-w-[75%] shadow-sm">{step.text}</div>
      </div>
    )
  }
  if (step.type === 'ai') {
    return (
      <div className="flex justify-start animate-fadeIn">
        <div className="bg-white text-gray-800 text-sm px-3.5 py-2.5 rounded-xl rounded-bl-sm max-w-[85%] shadow-sm border border-gray-100">
          <div className="text-xs font-semibold text-blue-600 mb-1">🤖 AI 답변</div>
          {step.text.split('\n').map((line, i) => (
            <p key={i} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
          ))}
        </div>
      </div>
    )
  }
  if (step.type === 'escalation') {
    return <div className="text-center text-xs text-orange-500 py-1 animate-pulse">{step.text}</div>
  }
  if (step.type === 'live') {
    return (
      <div className="flex justify-start animate-fadeIn">
        <div className="bg-orange-50 text-gray-800 text-sm px-3.5 py-2.5 rounded-xl rounded-bl-sm max-w-[85%] shadow-sm border border-orange-200">
          <div className="text-xs font-semibold text-orange-600 mb-1">🟢 {step.name} (LIVE)</div>
          <p className="leading-relaxed">{step.text}</p>
        </div>
      </div>
    )
  }
  return null
}
