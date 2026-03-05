import { useState, useEffect, useRef } from 'react'
import ThinkingPanel from './ThinkingPanel'
import InfoPanel from './InfoPanel'
import AgentStatus from './AgentStatus'
import { mockAgents } from '../data/mockData'
import { sendMessage, escalateCase, sendSlackQuestion, pollSlackMessages, closeSession, closeSessionBeacon } from '../api/chatApi'

// 실제 Slack 사용자 (에스컬레이션 후 폴링 대상) — 박우호는 가상 에이전트
const REAL_SLACK_AGENTS = ['송인찬', '이현진']
// 가상 에이전트 (LLM으로 답변 생성)
const VIRTUAL_AGENTS = ['박우호']

/**
 * Slack raw 멘션/포맷 제거 (프론트엔드 안전장치)
 * 백엔드에서 이미 변환하지만, 혹시 누락된 경우를 대비
 * "<@U04N9LV482Z>" → "사용자", "<#C123|general>" → "#general", "<http://url|label>" → "label"
 */
const formatSlackText = (text) => {
  if (!text) return text
  return text
    .replace(/<@[A-Z0-9]+>/g, '사용자')                    // 유저 멘션
    .replace(/<#[A-Z0-9]+\|([^>]+)>/g, '#$1')              // 채널 링크
    .replace(/<(https?:\/\/[^|>]+)\|([^>]+)>/g, '$2')      // URL with label
    .replace(/<(https?:\/\/[^>]+)>/g, '$1')                 // URL without label
    .replace(/<!subteam\^[A-Z0-9]+\|@([^>]+)>/g, '@$1')    // 유저그룹 멘션
}

// 초기 고객 정보 수집 폼 (대화 시작 시)
const IntakeForm = ({ onSubmit }) => {
  const [company, setCompany] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const isValid = company.trim() && email.trim() && email.includes('@')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!isValid) return
    onSubmit({ company: company.trim(), name: name.trim(), email: email.trim(), phone: phone.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="text-center mb-4">
        <div className="text-2xl mb-1">👋</div>
        <p className="text-sm text-gray-700 font-semibold">마크애니에 오신 것을 환영합니다</p>
        <p className="text-xs text-gray-500 mt-1">간단한 정보를 입력해 주시면 맞춤형 상담을 시작합니다</p>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">기업명 <span className="text-red-500">*</span></label>
        <input
          type="text" value={company} onChange={e => setCompany(e.target.value)}
          placeholder="예: 삼성전자"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-markany-blue focus:border-transparent"
          autoFocus
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">담당자명</label>
        <input
          type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="예: 홍길동"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-markany-blue focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">이메일 <span className="text-red-500">*</span></label>
        <input
          type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="예: hong@company.com"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-markany-blue focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">연락처</label>
        <input
          type="tel" value={phone} onChange={e => setPhone(e.target.value)}
          placeholder="예: 010-1234-5678"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-markany-blue focus:border-transparent"
        />
      </div>
      <button
        type="submit" disabled={!isValid}
        className="w-full bg-markany-blue text-white py-2.5 rounded-lg hover:bg-markany-dark transition text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
      >
        상담 시작하기
      </button>
    </form>
  )
}


const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  // Homepage 버튼(문의하기/무료상담) 클릭 시 챗봇 열기 이벤트 수신
  useEffect(() => {
    const handleOpenChatbot = () => {
      setIsOpen(true)
      setIsMinimized(false)
    }
    window.addEventListener('openChatbot', handleOpenChatbot)
    return () => window.removeEventListener('openChatbot', handleOpenChatbot)
  }, [])
  const [showIntakeForm, setShowIntakeForm] = useState(true)
  const [sessionClosed, setSessionClosed] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [showThinking, setShowThinking] = useState(false)
  const [thinkingSteps, setThinkingSteps] = useState([])
  const [customerInfo, setCustomerInfo] = useState(null)
  const [showAgentStatus, setShowAgentStatus] = useState(false)
  const [agents, setAgents] = useState([])
  const [escalationMode, setEscalationMode] = useState(false)
  const [followUpIndex, setFollowUpIndex] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [typingAgent, setTypingAgent] = useState(null)
  const [showQuickReplies, setShowQuickReplies] = useState(false)
  const [, setSlackPollSince] = useState(null)
  const [slackChannelId, setSlackChannelId] = useState(null)
  const [slackChannelName, setSlackChannelName] = useState(null)
  const [sessionId] = useState(() => `session_${Date.now()}`)
  const messagesEndRef = useRef(null)
  // 에스컬레이션 시 서브질문 저장 (동적 quickReply 생성용)
  const [escalationSubQuestions, setEscalationSubQuestions] = useState(null)

  // quickReplyOptions: 서브질문이 있으면 그 기반, 없으면 기본값
  const defaultQuickReplies = [
    '구축 기간과 비용은 어느 정도인가요?',
    '기존 시스템과 연동이 가능한가요?',
    '보안 인증은 어떤 것들이 있나요?',
    '다른 기관에서도 사용 중인 사례가 있나요?',
    '계약 진행 절차와 다음 단계가 궁금합니다.'
  ]
  const quickReplyOptions = escalationSubQuestions?.length > 0
    ? escalationSubQuestions.map(sq => sq.question)
    : defaultQuickReplies

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // sessionStorage에서 고객 정보가 있으면 자동으로 챗봇 열기 (기존 세션 복원)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('anybridge_customer')
      if (saved) {
        setIsOpen(true)
      }
    } catch (_) { /* 무시 */ }
  }, [])

  // sessionStorage에서 고객 정보 복원
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('anybridge_customer')
      if (saved) {
        const parsed = JSON.parse(saved)
        setCustomerInfo(parsed)
        setShowIntakeForm(false)
        setMessages([{ type: 'ai', text: `안녕하세요 ${parsed.company} ${parsed.name || ''}님! 무엇을 도와드릴까요?`, timestamp: new Date() }])
      }
      const savedChannel = sessionStorage.getItem('anybridge_channelId')
      if (savedChannel) setSlackChannelId(savedChannel)
      const savedChannelName = sessionStorage.getItem('anybridge_channelName')
      if (savedChannelName) setSlackChannelName(savedChannelName)
    } catch (_) { /* 무시 */ }
  }, [])

  // beforeunload: 탭 닫기/리프레시 시 세션 종료 API 호출
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionClosed) return
      const chId = slackChannelId || sessionStorage.getItem('anybridge_channelId')
      if (!chId) return
      const custRaw = sessionStorage.getItem('anybridge_customer')
      const cust = custRaw ? JSON.parse(custRaw) : null
      closeSessionBeacon(chId, sessionId, cust)
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [slackChannelId, sessionId, sessionClosed])

  // slackChannelId 변경 시 sessionStorage에 저장
  useEffect(() => {
    if (slackChannelId) sessionStorage.setItem('anybridge_channelId', slackChannelId)
  }, [slackChannelId])

  useEffect(() => {
    if (slackChannelName) sessionStorage.setItem('anybridge_channelName', slackChannelName)
  }, [slackChannelName])

  // 초기 정보 수집 완료 핸들러
  const handleIntakeSubmit = (info) => {
    const custInfo = {
      id: `cust_${Date.now()}`,
      name: info.name || '',
      company: info.company,
      email: info.email,
      phone: info.phone || '',
      product: '',
    }
    setCustomerInfo(custInfo)
    setShowIntakeForm(false)
    sessionStorage.setItem('anybridge_customer', JSON.stringify(custInfo))
    const greeting = info.name
      ? `안녕하세요 ${info.company} ${info.name}님! 무엇을 도와드릴까요?`
      : `안녕하세요 ${info.company}님! 무엇을 도와드릴까요?`
    setMessages([{ type: 'ai', text: greeting, timestamp: new Date() }])
  }

  const handleSend = async () => {
    if (!inputValue.trim() || isProcessing) return

    const userMessage = { type: 'user', text: inputValue, timestamp: new Date() }
    setMessages(prev => [...prev, userMessage])
    const currentInput = inputValue
    setInputValue('')

    // 에스컬레이션 모드: 추가 질의 처리
    if (escalationMode) {
      handleFollowUpQuestion(currentInput)
      return
    }

    // 모든 입력을 백엔드 LLM으로 전송 — 모델이 판단
    handleAIResponse(currentInput)
  }

  // 에스컬레이션 후 추가 질의 처리 — 가상 에이전트는 LLM, 실제 담당자는 Slack 폴링
  const handleFollowUpQuestion = async (question) => {
    setIsProcessing(true)
    setShowQuickReplies(false)

    // 담당자 정보 매핑 (handleEscalation과 동일)
    const AGENT_MAP = {
      '채소희': { role: '고객센터', avatar: '👩‍💼' },
      '송인찬': { role: '어카운트 매니저', avatar: '👨‍💼' },
      '이현진': { role: 'SE', avatar: '👨‍💻' },
      '박우호': { role: '개발리더', avatar: '👨‍🔧' },
    }

    // 1. 채소희가 질문 접수
    await delay(1000)
    setMessages(prev => [...prev, {
      type: 'agent', agentName: '채소희', agentRole: '고객센터', agentAvatar: '👩‍💼',
      text: '네, 담당자분들께 바로 전달하겠습니다! 💬',
      timestamp: new Date()
    }])

    // 2. Slack 채널에 질문 전달 (UI 표시)
    await delay(800)
    const channelDisplay = slackChannelName || `${customerInfo?.name || '고객'}-문의`
    setMessages(prev => [...prev, {
      type: 'slack',
      channel: `#${channelDisplay}`,
      text: `#${channelDisplay}\n\n[고객 추가 질문]\n"${question}"\n\n담당자분들 확인 부탁드립니다. 🙏`,
      timestamp: new Date()
    }])

    // 3. 실제 Slack 전송
    const pollStartTs = String(Date.now() / 1000)
    setSlackPollSince(pollStartTs)
    const realAgents = REAL_SLACK_AGENTS.map(name => ({ name, role: (AGENT_MAP[name] || {}).role || '담당자' }))
    sendSlackQuestion(
      question,
      realAgents,
      customerInfo?.name || '고객',
      { followUp: true },
      slackChannelId
    ).then(res => {
      if (res?.data?.channelId) setSlackChannelId(res.data.channelId)
    }).catch(err => console.error('Slack send error:', err))

    // 4-A. 가상 에이전트 (박우호) — LLM으로 답변 생성
    let answeredCount = 0
    for (const vName of VIRTUAL_AGENTS) {
      const vInfo = AGENT_MAP[vName] || { role: '담당자', avatar: '👤' }
      setTypingAgent({ name: vName, avatar: vInfo.avatar })
      let virtualAnswer = ''
      try {
        const result = await sendMessage(
          `당신은 ${vName} (${vInfo.role})입니다. 개발자 스타일로 간결하고 기술적으로 답변하세요. 반말이나 구어체를 섞어도 됩니다. 질문: "${question}". 고객: ${customerInfo?.name || '고객'}, 제품: ${customerInfo?.product || 'DRM'}.`,
          customerInfo?.id || null, `esc_followup_${Date.now()}`, []
        )
        if (result?.data?.answer) virtualAnswer = result.data.answer
      } catch (e) { console.error(`LLM for ${vName}:`, e) }
      if (!virtualAnswer) virtualAnswer = '확인 후 답변드리겠습니다.'
      setTypingAgent(null)
      setMessages(prev => [...prev, {
        type: 'agent', agentName: vName, agentRole: vInfo.role, agentAvatar: vInfo.avatar,
        text: virtualAnswer, timestamp: new Date()
      }])
      answeredCount++
    }

    // 4-B. 실제 Slack 사용자 — 폴링 (1명 답변 시 추가 대기 30초로 단축)
    const answeredAgents = new Set()
    const maxPollTime = 90000 // 90초 (기존 3분에서 단축)
    const shortenedWait = 30000 // 1명 답변 후 나머지 대기 시간
    const pollInterval = 3000
    const startTime = Date.now()
    let firstAnswerTime = null

    setTypingAgent({ name: '담당자', avatar: '💬' })

    while (answeredAgents.size < REAL_SLACK_AGENTS.length) {
      const elapsed = Date.now() - startTime
      // 전체 타임아웃 체크
      if (elapsed > maxPollTime) break
      // 1명 이상 답변 후 추가 대기 시간 초과 체크
      if (firstAnswerTime && (Date.now() - firstAnswerTime) > shortenedWait) break

      await delay(pollInterval)
      try {
        const pollResult = await pollSlackMessages(pollStartTs, 20, slackChannelId)
        const newMessages = pollResult?.data?.messages || []
        for (const msg of newMessages) {
          if (!answeredAgents.has(msg.agentName) && REAL_SLACK_AGENTS.includes(msg.agentName)) {
            answeredAgents.add(msg.agentName)
            if (!firstAnswerTime) firstAnswerTime = Date.now()
            setTypingAgent(null)
            const aInfo = AGENT_MAP[msg.agentName] || {}
            setMessages(prev => [...prev, {
              type: 'agent', agentName: msg.agentName, agentRole: aInfo.role || msg.agentRole,
              agentAvatar: aInfo.avatar || msg.agentAvatar, text: msg.text, isLive: true, timestamp: new Date(msg.timestamp)
            }])
            answeredCount++
            if (answeredAgents.size < REAL_SLACK_AGENTS.length) {
              setTypingAgent({ name: '담당자', avatar: '💬' })
            }
          }
        }
      } catch (err) { console.error('Slack poll error:', err) }
    }
    setTypingAgent(null)

    // 5. 마무리 메시지
    await delay(1500)
    const totalExpected = VIRTUAL_AGENTS.length + REAL_SLACK_AGENTS.length
    if (answeredCount >= totalExpected) {
      setMessages(prev => [...prev, {
        type: 'agent', agentName: '채소희', agentRole: '고객센터', agentAvatar: '👩‍💼',
        text: '담당자 답변이 모두 도착했습니다 ✅\n혹시 더 궁금하신 점이 있으신가요?',
        showContinueOrEnd: true, timestamp: new Date()
      }])
    } else if (answeredCount > 0) {
      const remaining = totalExpected - answeredCount
      setMessages(prev => [...prev, {
        type: 'agent', agentName: '채소희', agentRole: '고객센터', agentAvatar: '👩‍💼',
        text: `담당자 답변이 도착했습니다 ✅\n나머지 ${remaining}명은 슬랙 채널에서 확인 후 답변드릴 예정입니다.\n혹시 더 궁금하신 점이 있으신가요?`,
        showContinueOrEnd: true, timestamp: new Date()
      }])
    } else {
      setMessages(prev => [...prev, {
        type: 'agent', agentName: '채소희', agentRole: '고객센터', agentAvatar: '👩‍💼',
        text: '담당자분들이 현재 다른 업무 중인 것 같습니다.\n슬랙 채널에 질문이 전달되어 있으니, 확인 후 답변드릴 예정입니다. 📩\n혹시 더 궁금하신 점이 있으신가요?',
        showContinueOrEnd: true, timestamp: new Date()
      }])
    }

    setFollowUpIndex(prev => prev + 1)
    setIsProcessing(false)
    setShowQuickReplies(true)
  }

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

  // Slack에서 특정 에이전트의 답변을 폴링하는 헬퍼
  const pollForAgent = async (agentName, sinceTs, maxWaitMs = 60000, channelId = null) => {
    const pollInterval = 3000
    const startTime = Date.now()
    while ((Date.now() - startTime) < maxWaitMs) {
      await delay(pollInterval)
      try {
        const result = await pollSlackMessages(sinceTs, 20, channelId)
        const msgs = result?.data?.messages || []
        const found = msgs.find(m => m.agentName === agentName)
        if (found) return found
      } catch (err) {
        console.error(`pollForAgent(${agentName}) error:`, err)
      }
    }
    return null // 타임아웃
  }

  const handleAIResponse = async (question) => {
    // 짧은 인사/간단한 입력은 ThinkingPanel 스킵 (Drift/Intercom 패턴)
    const isSimpleGreeting = question.trim().length <= 10 && !question.includes('?')
    if (!isSimpleGreeting) {
      setShowThinking(true)
      setThinkingSteps(['🤔 질문 분석 중...'])
    }
    setIsProcessing(true)

    try {
      const history = messages
        .filter(m => m.type === 'user' || m.type === 'ai')
        .slice(-6)
        .map(m => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.text }))

      const result = await sendMessage(question, customerInfo?.id || null, sessionId, history)
      const data = result.data

      // 백엔드에서 고객 매칭 정보가 오면 InfoPanel용으로 저장
      if (data.customerInfo && !customerInfo) {
        setCustomerInfo(data.customerInfo)
      }

      // ThinkingPanel: 인사가 아니고 confidence가 low가 아닐 때만 표시
      const showThinkingSteps = !isSimpleGreeting && data.confidence !== 'low'
      if (showThinkingSteps && data.thinkingProcess) {
        for (let i = 0; i < data.thinkingProcess.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 300))
          setThinkingSteps(data.thinkingProcess.slice(0, i + 1))
        }
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      const response = {
        type: 'ai',
        text: data.answer,
        confidence: data.confidence,
        references: data.references || [],
        model: data.model,
        complexity: data.complexity,
        subQuestions: data.subQuestions || null,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, response])
      setShowThinking(false)
      setThinkingSteps([])
      setIsProcessing(false)

      // LLM이 에스컬레이션 필요하다고 판단하면 버튼 표시
      // 만족도 조사는 매 응답마다 하지 않음 — 대화 종료 시에만 (Intercom 패턴)
      if (data.needsEscalation) {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            type: 'ai',
            text: '이 질문은 전문가의 추가 확인이 필요합니다. 담당자를 연결해 드릴까요?',
            showEscalation: true,
            timestamp: new Date()
          }])
        }, 1000)
      }
    } catch (err) {
      console.error('Backend API error:', err)
      setShowThinking(false)
      setThinkingSteps([])
      setIsProcessing(false)
      setMessages(prev => [...prev, {
        type: 'ai',
        text: '죄송합니다, 일시적으로 AI 응답을 생성하지 못했습니다. 다시 시도해 주세요.',
        timestamp: new Date()
      }])
    }
  }

  const handleSatisfactionYes = () => {
    const thankMsg = {
      type: 'ai',
      text: '감사합니다! 😊 추가 문의사항이 있으시면 언제든 말씀해 주세요.',
      timestamp: new Date()
    }
    setMessages(prev => {
      const updated = prev.map(msg => msg.showSatisfaction ? { ...msg, showSatisfaction: false, answered: 'yes' } : msg)
      return [...updated, thankMsg]
    })
  }

  const handleSatisfactionNo = () => {
    setMessages(prev => {
      const updated = prev.map(msg => msg.showSatisfaction ? { ...msg, showSatisfaction: false, answered: 'no' } : msg)
      const escalationMsg = {
        type: 'ai',
        text: '담당자를 연결해 드릴까요? 전문가가 직접 답변해 드리겠습니다.',
        showEscalation: true,
        timestamp: new Date()
      }
      return [...updated, escalationMsg]
    })
  }

  const handleContinueChat = () => {
    setMessages(prev => {
      const updated = prev.map(msg => msg.showContinueOrEnd ? { ...msg, showContinueOrEnd: false, continueChoice: 'continue' } : msg)
      return [...updated, {
        type: 'agent',
        agentName: '채소희', agentRole: '고객센터', agentAvatar: '👩‍💼',
        text: '네, 편하게 질문해 주세요! 😊\n담당자분들이 대기하고 있습니다.',
        timestamp: new Date()
      }]
    })
    setShowQuickReplies(true)
  }

  const handleQuickReply = (question) => {
    setShowQuickReplies(false)
    setInputValue('')
    const userMessage = { type: 'user', text: question, timestamp: new Date() }
    setMessages(prev => [...prev, userMessage])
    handleFollowUpQuestion(question)
  }

  // 새 대화 시작 — 모든 상태 초기화
  const handleNewChat = () => {
    sessionStorage.removeItem('anybridge_customer')
    sessionStorage.removeItem('anybridge_channelId')
    sessionStorage.removeItem('anybridge_channelName')
    setMessages([])
    setCustomerInfo(null)
    setShowIntakeForm(true)
    setSessionClosed(false)
    setEscalationMode(false)
    setShowAgentStatus(false)
    setAgents([])
    setShowThinking(false)
    setThinkingSteps([])
    setInputValue('')
    setIsProcessing(false)
    setTypingAgent(null)
    setShowQuickReplies(false)
    setSlackChannelId(null)
    setSlackChannelName(null)
    setEscalationSubQuestions(null)
    setFollowUpIndex(0)
  }

  const handleEndChat = async () => {
    setMessages(prev => prev.map(msg => msg.showContinueOrEnd ? { ...msg, showContinueOrEnd: false, continueChoice: 'end' } : msg))
    setIsProcessing(true)
    setShowQuickReplies(false)

    // 채소희 마무리 인사
    await delay(1500)
    const custName = customerInfo?.name || customerInfo?.company || '고객'
    setMessages(prev => [...prev, {
      type: 'agent',
      agentName: '채소희', agentRole: '고객센터', agentAvatar: '👩‍💼',
      text: `오늘 상담해 주셔서 감사합니다, ${custName}님! 😊\n담당자분들의 연락처를 슬랙 프로필에서 확인하여 전달드릴게요.\n추후 궁금하신 점이 있으시면 언제든 연락 주세요 🙏`,
      timestamp: new Date()
    }])

    // 담당자 연락처 카드
    await delay(2000)
    const involvedAgents = mockAgents.filter(a => a.name !== '채소희')
    setMessages(prev => [...prev, {
      type: 'contactCard',
      agents: involvedAgents,
      timestamp: new Date()
    }])

    // 세션 종료 API 호출 (채널 보관 + DM 발송)
    if (slackChannelId) {
      try {
        await closeSession(slackChannelId, sessionId, customerInfo)
        setSessionClosed(true)
      } catch (e) {
        console.error('Session close error:', e)
      }
    }

    // 이메일 발송 안내
    await delay(1500)
    const emailAddr = customerInfo?.email
    if (emailAddr) {
      setMessages(prev => [...prev, {
        type: 'agent',
        agentName: '채소희', agentRole: '고객센터', agentAvatar: '👩‍💼',
        text: `상담 내용을 ${emailAddr}로 정리하여 발송해 드리겠습니다. 📧\n좋은 하루 보내세요! 👋`,
        timestamp: new Date()
      }])
    } else {
      setMessages(prev => [...prev, {
        type: 'agent',
        agentName: '채소희', agentRole: '고객센터', agentAvatar: '👩‍💼',
        text: '담당자가 확인 후 연락드리겠습니다. 좋은 하루 보내세요! 👋',
        timestamp: new Date()
      }])
    }

    // sessionStorage 정리
    sessionStorage.removeItem('anybridge_channelId')
    sessionStorage.removeItem('anybridge_channelName')

    setIsProcessing(false)
    setEscalationMode(false)
    setShowAgentStatus(false)
  }

  const handleEscalation = async () => {
    setShowAgentStatus(true)
    setIsProcessing(true)

    // 담당자 정보 매핑
    const AGENT_MAP = {
      '채소희': { role: '고객센터', avatar: '👩‍💼' },
      '송인찬': { role: '어카운트 매니저', avatar: '👨‍💼' },
      '이현진': { role: 'SE', avatar: '👨‍💻' },
      '박우호': { role: '개발리더', avatar: '👨‍🔧' },
    }

    // Remove escalation button
    setMessages(prev => prev.map(msg => msg.showEscalation ? { ...msg, showEscalation: false } : msg))

    // 마지막 사용자/AI 메시지 추출
    const lastUserMsg = messages.filter(m => m.type === 'user').pop()
    const lastAiMsg = messages.filter(m => m.type === 'ai').pop()

    // 서브질문 추출 (AI 분석 결과 기반, 없으면 기본값)
    const subQuestions = lastAiMsg?.subQuestions || [
      { question: lastUserMsg?.text || '고객 문의', assignee: '송인찬' }
    ]

    // 서브질문 기반 quickReply용 저장
    setEscalationSubQuestions(subQuestions)

    // 백엔드 에스컬레이션 API 호출 → channelName 수신
    let escalationResult = null
    const escalationPromise = escalateCase({
      caseId: `case_${Date.now()}`,
      customerId: customerInfo?.id || 'unknown',
      question: lastUserMsg?.text || '',
      aiAnswer: lastAiMsg?.text || '',
      subQuestions: subQuestions,
    }).then(res => { escalationResult = res }).catch(err => console.error('Escalation API error:', err))

    // System: connecting
    setMessages(prev => [...prev, {
      type: 'system',
      text: '담당자를 연결하고 있습니다...',
      timestamp: new Date()
    }])

    // Step 1: 채소희 입장
    await delay(1500)
    setAgents(prev => [...prev, { name: '채소희', ...AGENT_MAP['채소희'], joined: true }])
    setMessages(prev => [...prev, {
      type: 'system',
      text: '채소희 (고객센터)가 입장했습니다',
      timestamp: new Date()
    }])

    // Step 2: 채소희 인사
    await delay(1500)
    setMessages(prev => [...prev, {
      type: 'agent',
      agentName: '채소희', agentRole: '고객센터', agentAvatar: '👩‍💼',
      text: '안녕하세요, 고객센터 채소희입니다.\n제가 직접 도와드리겠습니다. 관련 전문가분들을 바로 연결해 드릴게요!',
      timestamp: new Date()
    }])

    // 서브질문에서 고유 담당자 목록 추출 (채소희 제외)
    const assigneeNames = [...new Set(subQuestions.map(sq => sq.assignee).filter(Boolean))]
    const assignees = assigneeNames.map(name => ({
      name,
      ...(AGENT_MAP[name] || { role: '담당자', avatar: '👤' })
    }))

    // Step 3: 담당자 순차 입장
    for (const agent of assignees) {
      await delay(1200)
      setAgents(prev => [...prev, { ...agent, joined: true }])
      setMessages(prev => [...prev, {
        type: 'system',
        text: `${agent.name} (${agent.role})가 입장했습니다`,
        timestamp: new Date()
      }])
    }

    // escalation API 응답 대기 (최대 5초)
    await Promise.race([escalationPromise, delay(5000)])

    // 채널명: 백엔드 응답 기반 동적 생성, 없으면 고객명 기반 폴백
    const channelName = escalationResult?.data?.channelName
      || `${customerInfo?.name || '고객'}-문의`
    setSlackChannelName(channelName)

    // Step 4: 채소희 질문 분류 (서브질문 기반 동적 생성)
    await delay(1000)
    const numEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣']
    const classificationLines = subQuestions.map((sq, i) => {
      const num = numEmojis[i] || `${i + 1}.`
      return `${num} ${sq.question} → ${sq.assignee}님 답변 예정`
    }).join('\n')
    setMessages(prev => [...prev, {
      type: 'agent',
      agentName: '채소희', agentRole: '고객센터', agentAvatar: '👩‍💼',
      text: `모든 담당자가 입장했습니다 ✅\n\n질문을 ${subQuestions.length}개 영역으로 분류했습니다:\n\n${classificationLines}\n\n슬랙 채널에 답변 요청을 보내겠습니다.`,
      timestamp: new Date()
    }])

    // Step 5: 슬랙 채널 답변 요청 (동적 생성)
    await delay(1000)
    const slackMentionLines = subQuestions.map(sq =>
      `@${sq.assignee} 님, 고객님께서 [${sq.question}] 관련 문의를 주셨습니다. 답변 부탁드립니다. 🙏`
    ).join('\n')
    setMessages(prev => [...prev, {
      type: 'slack',
      channel: `#${channelName}`,
      text: `#${channelName}\n\n${slackMentionLines}`,
      timestamp: new Date()
    }])

    // Step 6: 실제 Slack으로 질문 전송 + channelId 캡처
    const escalationPollStartTs = String(Date.now() / 1000)
    setSlackPollSince(escalationPollStartTs)
    let activeChannelId = slackChannelId
    try {
      const sendResult = await sendSlackQuestion(
        lastUserMsg?.text || '고객 문의',
        assignees.map(a => ({ name: a.name, role: a.role })),
        customerInfo?.name || '고객',
        { decomposition: subQuestions.map(sq => ({ assignee: sq.assignee, subQuestion: sq.question })) },
        slackChannelId
      )
      if (sendResult?.data?.channelId) {
        activeChannelId = sendResult.data.channelId
        setSlackChannelId(activeChannelId)
      }
    } catch (err) {
      console.error('Slack send error:', err)
    }

    // Step 7: 담당자별 답변 루프 (서브질문 기반 동적)
    let answeredCount = 0
    for (const sq of subQuestions) {
      const agentName = sq.assignee
      const agentInfo = AGENT_MAP[agentName] || { role: '담당자', avatar: '👤' }

      if (VIRTUAL_AGENTS.includes(agentName)) {
        // 가상 에이전트 (박우호) — LLM으로 답변 생성
        setTypingAgent({ name: agentName, avatar: agentInfo.avatar })
        let virtualAnswer = ''
        try {
          const result = await sendMessage(
            `당신은 ${agentName} (${agentInfo.role})입니다. 개발자 스타일로 간결하고 기술적으로 답변하세요. 반말이나 구어체를 섬어도 됩니다. 질문: "${sq.question}". 고객: ${customerInfo?.name || '고객'}, 제품: ${customerInfo?.product || 'DRM'}. 원래 질문: ${lastUserMsg?.text || ''}`,
            customerInfo?.id || null, `esc_${Date.now()}`, []
          )
          if (result?.data?.answer) virtualAnswer = result.data.answer
        } catch (e) { console.error(`LLM for ${agentName}:`, e) }
        if (!virtualAnswer) virtualAnswer = '확인 후 답변드리겠습니다.'
        setTypingAgent(null)
        setMessages(prev => [...prev, {
          type: 'agent', agentName, agentRole: agentInfo.role, agentAvatar: agentInfo.avatar,
          text: virtualAnswer, timestamp: new Date()
        }])
        answeredCount++
      } else {
        // 실제 Slack 사용자 — 폴링 대기
        setTypingAgent({ name: agentName, avatar: agentInfo.avatar })
        const agentAnswer = await pollForAgent(agentName, escalationPollStartTs, 60000, activeChannelId)
        setTypingAgent(null)
        if (agentAnswer) {
          setMessages(prev => [...prev, {
            type: 'agent', agentName, agentRole: agentInfo.role, agentAvatar: agentInfo.avatar,
            text: agentAnswer.text, isLive: true, timestamp: new Date(agentAnswer.timestamp)
          }])
          answeredCount++
        } else {
          // 타임아웃 안내
          setMessages(prev => [...prev, {
            type: 'agent', agentName: '채소희', agentRole: '고객센터', agentAvatar: '👩‍💼',
            text: `${agentName}님이 현재 다른 업무 중입니다. 슬랙 채널에서 확인 후 답변드릴 예정입니다. 📩`,
            timestamp: new Date()
          }])
        }
      }
    }

    // Step 8: 채소희 마무리 + 선택지
    await delay(2000)
    const totalQ = subQuestions.length
    const completionText = answeredCount === totalQ
      ? `${totalQ}개 질문에 대한 답변이 모두 완료되었습니다 ✅\n혹시 더 궁금하신 점이 있으신가요?`
      : `${totalQ}개 중 ${answeredCount}개 질문에 대한 답변이 완료되었습니다.\n나머지는 슬랙 채널에서 답변 예정입니다.\n혹시 더 궁금하신 점이 있으신가요?`
    setMessages(prev => [...prev, {
      type: 'agent',
      agentName: '채소희', agentRole: '고객센터', agentAvatar: '👩‍💼',
      text: completionText,
      showContinueOrEnd: true,
      timestamp: new Date()
    }])

    // 에스컬레이션 모드 활성화 (이후 질문은 담당자가 답변)
    setEscalationMode(true)
    setIsProcessing(false)
    setShowQuickReplies(true)
  }

  return (
    <>
      {/* Floating Chat Button — 챗봇이 닫혀있거나 최소화 상태일 때 표시 */}
      {(!isOpen || isMinimized) && (
        <button
          onClick={() => { setIsOpen(true); setIsMinimized(false) }}
          className="fixed bottom-6 right-6 bg-markany-blue text-white p-4 rounded-full shadow-2xl hover:bg-markany-dark transition-all z-50 animate-bounce"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}

      {/* Chatbot Window */}
      {isOpen && !isMinimized && (
        <div className="fixed bottom-6 right-6 w-[450px] h-[700px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-markany-blue to-markany-dark text-white p-4 rounded-t-2xl flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="font-semibold">마크애니 AI 지원</span>
              {escalationMode && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">담당자 연결됨</span>}
            </div>
            <div className="flex space-x-1">
              {/* 새 대화 버튼 — 인테이크 폼이 아닌 상태에서만 표시 */}
              {!showIntakeForm && (
                <button onClick={handleNewChat} className="hover:bg-white/20 p-1 rounded transition" title="새 대화">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
              <button onClick={() => setIsMinimized(true)} className="hover:bg-white/20 p-1 rounded transition" title="최소화">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <button onClick={() => setIsMinimized(true)} className="hover:bg-white/20 p-1 rounded transition" title="닫기">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {showIntakeForm && (
              <div className="flex justify-center items-center h-full">
                <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <IntakeForm onSubmit={handleIntakeSubmit} />
                </div>
              </div>
            )}
            {!showIntakeForm && messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.type === 'agent' ? (
                  <div className="max-w-[85%]">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">{msg.agentAvatar}</span>
                      <span className="text-xs font-semibold text-gray-700">{msg.agentName}</span>
                      <span className="text-xs text-gray-400">{msg.agentRole}</span>
                      {msg.isLive && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">🟢 LIVE</span>}
                    </div>
                    <div className="bg-blue-50 border border-blue-200 text-gray-800 rounded-lg p-3 ml-7">
                      <p className="whitespace-pre-wrap text-sm">{formatSlackText(msg.text)}</p>
                      {msg.showContinueOrEnd && (
                        <div className="mt-3 flex space-x-2">
                          <button onClick={handleContinueChat} className="flex-1 bg-markany-blue text-white py-2 px-3 rounded-lg hover:bg-markany-dark transition text-sm font-semibold">
                            💬 더 물어볼게요
                          </button>
                          <button onClick={handleEndChat} className="flex-1 bg-gray-500 text-white py-2 px-3 rounded-lg hover:bg-gray-600 transition text-sm font-semibold">
                            ✅ 충분합니다, 감사해요
                          </button>
                        </div>
                      )}
                      {msg.continueChoice === 'continue' && <div className="mt-2 text-xs text-blue-600 font-medium">💬 질문 계속</div>}
                      {msg.continueChoice === 'end' && <div className="mt-2 text-xs text-gray-500 font-medium">✅ 충분합니다</div>}

                    </div>
                  </div>
                ) : msg.type === 'contactCard' ? (
                  <div className="max-w-[90%] w-full">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm">📇</span>
                      <span className="text-xs font-semibold text-gray-700">담당자 연락처 (Slack 프로필)</span>
                    </div>
                    <div className="space-y-2 ml-5">
                      {msg.agents.map((agent, ai) => (
                        <div key={ai} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-xl">{agent.avatar}</span>
                            <div>
                              <div className="text-sm font-semibold text-gray-800">{agent.name}</div>
                              <div className="text-xs text-gray-500">{agent.role} · {agent.team}</div>
                            </div>
                            <span className="ml-auto flex items-center space-x-1">
                              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                              <span className="text-xs text-gray-400">온라인</span>
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1 ml-8">
                            <div className="flex items-center space-x-2">
                              <span>📧</span>
                              <span className="text-blue-600">{agent.email}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span>📞</span>
                              <span className="text-blue-600">{agent.phone}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : msg.type === 'slack' ? (
                  <div className="max-w-[90%] w-full">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm">💬</span>
                      <span className="text-xs font-semibold text-purple-700">Slack</span>
                      <span className="text-xs text-purple-400">{msg.channel}</span>
                    </div>
                    <div className="bg-purple-50 border-l-4 border-purple-400 text-gray-800 rounded-r-lg p-3 ml-5">
                      <p className="whitespace-pre-wrap text-sm">{formatSlackText(msg.text).split('\n').map((line, li) => {
                        // @이름 부분을 파란색 볼드로 하이라이트
                        const parts = line.split(/(@\S+)/g)
                        return (
                          <span key={li}>
                            {parts.map((part, pi) =>
                              part.startsWith('@') ? (
                                <span key={pi} className="text-blue-600 font-bold bg-blue-100 px-1 rounded">{part}</span>
                              ) : part.startsWith('#') && li === 0 ? (
                                <span key={pi} className="text-purple-700 font-bold">{part}</span>
                              ) : (
                                <span key={pi}>{part}</span>
                              )
                            )}
                            {li < formatSlackText(msg.text).split('\n').length - 1 && '\n'}
                          </span>
                        )
                      })}</p>
                    </div>
                  </div>
                ) : (
                <div className={`max-w-[80%] ${
                  msg.type === 'user' 
                    ? 'bg-markany-blue text-white' 
                    : msg.type === 'system'
                    ? 'bg-yellow-100 text-gray-800 text-sm italic'
                    : 'bg-white text-gray-800 shadow-sm'
                } rounded-lg p-3`}>
                  <p className="whitespace-pre-wrap">{formatSlackText(msg.text)}</p>
                  {/* 신뢰도는 콘솔 로그에만 남기고 UI에는 표시하지 않음 */}
                  {msg.showEscalation && (
                    <button
                      onClick={handleEscalation}
                      className="mt-3 w-full bg-markany-blue text-white py-2 px-4 rounded-lg hover:bg-markany-dark transition text-sm font-semibold"
                    >
                      담당자 연결하기
                    </button>
                  )}
                  {msg.showSatisfaction && (
                    <div className="mt-3 flex space-x-2">
                      <button onClick={handleSatisfactionYes} className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition text-sm font-semibold">
                        👍 네
                      </button>
                      <button onClick={handleSatisfactionNo} className="flex-1 bg-gray-400 text-white py-2 px-4 rounded-lg hover:bg-gray-500 transition text-sm font-semibold">
                        👎 아니요
                      </button>
                    </div>
                  )}
                  {msg.answered === 'yes' && <div className="mt-2 text-xs text-green-600 font-medium">✅ 만족</div>}
                  {msg.answered === 'no' && <div className="mt-2 text-xs text-red-500 font-medium">❌ 불만족 → 담당자 연결</div>}
                </div>
                )}
              </div>
            ))}
            
            {!showIntakeForm && showThinking && <ThinkingPanel steps={thinkingSteps} />}
            {!showIntakeForm && showAgentStatus && <AgentStatus agents={agents} />}
            
            {/* Quick Reply chips */}
            {showQuickReplies && !isProcessing && (
              <div className="flex flex-wrap gap-2 px-1">
                {quickReplyOptions.slice(followUpIndex, followUpIndex + 3).map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickReply(q)}
                    className="bg-white border border-markany-blue text-markany-blue text-xs px-3 py-1.5 rounded-full hover:bg-markany-blue hover:text-white transition"
                  >
                    {q.length > 25 ? q.slice(0, 25) + '...' : q}
                  </button>
                ))}
              </div>
            )}
            
            {/* Typing indicator */}
            {typingAgent && (
              <div className="flex justify-start">
                <div className="bg-blue-50 border border-blue-200 text-gray-600 rounded-lg p-3 text-sm flex items-center space-x-2">
                  <span className="text-lg">{typingAgent.avatar}</span>
                  <span className="font-medium text-gray-700">{typingAgent.name}님이 입력 중</span>
                  <span className="flex space-x-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </span>
                </div>
              </div>
            )}
            
            {/* Processing indicator (no specific agent) */}
            {isProcessing && !typingAgent && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-600 rounded-lg p-3 text-sm animate-pulse">
                  담당자가 답변을 준비하고 있습니다...
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && handleSend()}
                placeholder={showIntakeForm ? '위 정보를 입력해 주세요' : isProcessing ? '담당자 답변 대기 중...' : '메시지를 입력하세요...'}
                disabled={isProcessing || showIntakeForm}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-markany-blue disabled:bg-gray-100 disabled:text-gray-400"
              />
              <button
                onClick={handleSend}
                disabled={isProcessing || showIntakeForm}
                className="bg-markany-blue text-white px-6 py-2 rounded-lg hover:bg-markany-dark transition font-semibold disabled:opacity-50"
              >
                전송
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Panel - Desktop Only */}
      {isOpen && !isMinimized && customerInfo && (
        <div className="hidden xl:block">
          <InfoPanel customerInfo={customerInfo} />
        </div>
      )}
    </>
  )
}

export default Chatbot
