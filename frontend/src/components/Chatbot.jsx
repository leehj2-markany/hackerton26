import { useState, useEffect, useRef } from 'react'
import ThinkingPanel from './ThinkingPanel'
import InfoPanel from './InfoPanel'
import AgentStatus from './AgentStatus'
import { mockAgents } from '../data/mockData'
import { sendMessage, escalateCase, sendSlackQuestion, pollSlackMessages } from '../api/chatApi'

// 실제 Slack 사용자 (에스컬레이션 후 폴링 대상)
const REAL_SLACK_AGENTS = ['송인찬', '이현진']

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

// 이메일/연락처 수집 인라인 폼
const EmailCollectForm = ({ onSubmit }) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const handleSubmit = () => {
    if (!name.trim() || !email.trim()) return
    onSubmit(email.trim(), phone.trim(), name.trim())
  }

  return (
    <div className="mt-3 space-y-2">
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="이름 (필수)"
        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="이메일 (필수)"
        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <input
        type="tel"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        placeholder="연락처 (선택)"
        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <button
        onClick={handleSubmit}
        disabled={!name.trim() || !email.trim()}
        className="w-full bg-markany-blue text-white py-2 rounded-lg hover:bg-markany-dark transition text-sm font-semibold disabled:opacity-50"
      >
        📧 상담 내역 받기
      </button>
    </div>
  )
}

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState([
    { type: 'ai', text: '안녕하세요, 마크애니입니다. 무엇을 도와드릴까요?', timestamp: new Date() }
  ])
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
  const [, setCollectingEmail] = useState(false)
  const [, setCollectedEmail] = useState('')
  const [, setSlackPollSince] = useState(null)
  const [slackChannelId, setSlackChannelId] = useState(null)
  const [sessionId] = useState(() => `session_${Date.now()}`)
  const messagesEndRef = useRef(null)

  const quickReplyOptions = [
    '구축 기간은 얼마나 걸리나요? 그리고 비용은 어느 정도인가요?',
    '기존 국방부 내부 시스템과 연동이 가능한가요?',
    '보안 등급은 어떻게 되나요? 군사 기밀 문서도 처리 가능한가요?',
    '다른 정부기관에서도 사용 중인 사례가 있나요?',
    '계약 진행 절차와 다음 단계가 궁금합니다.'
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const timer = setTimeout(() => { setIsOpen(true) }, 1000)
    return () => clearTimeout(timer)
  }, [])

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

  // 에스컬레이션 후 추가 질의 처리 — AI 개입 없이 Slack 채널로 전달
  const handleFollowUpQuestion = async (question) => {
    setIsProcessing(true)
    setShowQuickReplies(false)

    // 담당자 풀 (표시용)
    const agentPool = [
      { name: '송인찬', role: '어카운트 매니저', avatar: '👨‍💼' },
      { name: '이현진', role: 'SE', avatar: '👨‍💻' },
      { name: '박우호', role: '개발리더', avatar: '👨‍🔧' },
    ]

    // 1. 채소희가 질문 접수 → Slack 전달 안내
    await delay(1000)
    setMessages(prev => [...prev, {
      type: 'agent', agentName: '채소희', agentRole: '고객센터', agentAvatar: '👩‍💼',
      text: '네, 담당자분들께 바로 전달하겠습니다! 💬',
      timestamp: new Date()
    }])

    // 2. Slack 채널에 질문 전달 (UI 표시)
    await delay(800)
    const channelName = customerInfo?.name || '고객'
    setMessages(prev => [...prev, {
      type: 'slack',
      channel: `#${channelName}-문의`,
      text: `#${channelName}-문의\n\n[고객 추가 질문]\n"${question}"\n\n담당자분들 확인 부탁드립니다. 🙏`,
      timestamp: new Date()
    }])

    // 3. 실제 Slack 전송
    const pollStartTs = String(Date.now() / 1000)
    setSlackPollSince(pollStartTs)
    const allAssignees = agentPool.map(a => ({ name: a.name, role: a.role }))
    sendSlackQuestion(
      question,
      allAssignees,
      customerInfo?.name || '고객',
      { followUp: true },
      slackChannelId
    ).then(res => {
      if (res?.data?.channelId) setSlackChannelId(res.data.channelId)
    }).catch(err => console.error('Slack send error:', err))

    // 4. 담당자 답변 대기 — Slack 폴링만, AI 답변 생성 없음
    const realAgentNames = [...REAL_SLACK_AGENTS]
    const answeredAgents = new Set()
    const maxPollTime = 180000 // 3분 대기
    const pollInterval = 3000
    const startTime = Date.now()

    // 타이핑 인디케이터 표시
    setTypingAgent({ name: '담당자', avatar: '💬' })

    while (answeredAgents.size < realAgentNames.length && (Date.now() - startTime) < maxPollTime) {
      await delay(pollInterval)
      try {
        const pollResult = await pollSlackMessages(pollStartTs, 20, slackChannelId)
        const newMessages = pollResult?.data?.messages || []
        for (const msg of newMessages) {
          if (!answeredAgents.has(msg.agentName)) {
            answeredAgents.add(msg.agentName)
            setTypingAgent(null)
            setMessages(prev => [...prev, {
              type: 'agent', agentName: msg.agentName, agentRole: msg.agentRole,
              agentAvatar: msg.agentAvatar, text: msg.text, isLive: true, timestamp: new Date(msg.timestamp)
            }])
            // 아직 대기 중인 담당자가 있으면 타이핑 인디케이터 유지
            if (answeredAgents.size < realAgentNames.length) {
              setTypingAgent({ name: '담당자', avatar: '💬' })
            }
          }
        }
      } catch (err) { console.error('Slack poll error:', err) }
    }
    setTypingAgent(null)

    // 5. 결과에 따른 마무리 메시지
    await delay(1500)
    if (answeredAgents.size > 0) {
      // 답변이 하나라도 온 경우
      setMessages(prev => [...prev, {
        type: 'agent', agentName: '채소희', agentRole: '고객센터', agentAvatar: '👩‍💼',
        text: '담당자 답변이 도착했습니다 ✅\n혹시 더 궁금하신 점이 있으신가요?',
        showContinueOrEnd: true, timestamp: new Date()
      }])
    } else {
      // 타임아웃 — AI 대신 안내 메시지만 표시
      setMessages(prev => [...prev, {
        type: 'agent', agentName: '채소희', agentRole: '고객센터', agentAvatar: '👩‍💼',
        text: '담당자분들이 현재 다른 업무 중인 것 같습니다.\n슬랙 채널에 질문이 전달되어 있으니, 확인 후 답변드릴 예정입니다. 📩\n혹시 더 궁금하신 점이 있으신가요?',
        showContinueOrEnd: true, timestamp: new Date()
      }])
    }

    setFollowUpIndex(prev => prev + 1)
    setIsProcessing(false)
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

  const handleEndChat = async () => {
    setMessages(prev => prev.map(msg => msg.showContinueOrEnd ? { ...msg, showContinueOrEnd: false, continueChoice: 'end' } : msg))
    setIsProcessing(true)
    setShowQuickReplies(false)

    // 채소희 마무리 인사
    await delay(1500)
    setMessages(prev => [...prev, {
      type: 'agent',
      agentName: '채소희', agentRole: '고객센터', agentAvatar: '👩‍💼',
      text: '오늘 상담해 주셔서 감사합니다! 😊\n담당자분들의 연락처를 슬랙 프로필에서 확인하여 전달드릴게요.\n추후 궁금하신 점이 있으시면 언제든 연락 주세요 🙏',
      timestamp: new Date()
    }])

    // 슬랙 프로필에서 연락처 추출 메시지
    await delay(2000)
    setMessages(prev => [...prev, {
      type: 'system',
      text: '📋 Slack 프로필에서 담당자 연락처를 추출하고 있습니다...',
      timestamp: new Date()
    }])

    // 담당자 연락처 카드 (슬랙 프로필 기반)
    await delay(2000)
    const involvedAgents = mockAgents.filter(a => a.name !== '채소희')
    setMessages(prev => [...prev, {
      type: 'contactCard',
      agents: involvedAgents,
      timestamp: new Date()
    }])

    // 이메일/연락처 수집 요청
    await delay(1500)
    setMessages(prev => [...prev, {
      type: 'agent',
      agentName: '채소희', agentRole: '고객센터', agentAvatar: '👩‍💼',
      text: '상담 내용을 정리하여 이메일로 발송해 드리겠습니다.\n이메일 주소와 연락처를 남겨주시겠어요? 📧',
      showEmailForm: true,
      timestamp: new Date()
    }])

    setCollectingEmail(true)
    setIsProcessing(false)
  }

  const handleEmailSubmit = async (email, phone, name) => {
    setCollectingEmail(false)
    setIsProcessing(true)

    // 이메일 폼 버튼 숨기기
    setMessages(prev => prev.map(msg => msg.showEmailForm ? { ...msg, showEmailForm: false } : msg))

    // 사용자 입력 표시
    setMessages(prev => [...prev, {
      type: 'user',
      text: `${name} / ${email}${phone ? ' / ' + phone : ''}`,
      timestamp: new Date()
    }])

    setCollectedEmail(email)

    // 채소희 확인 메시지
    await delay(1500)
    setMessages(prev => [...prev, {
      type: 'agent',
      agentName: '채소희', agentRole: '고객센터', agentAvatar: '👩‍💼',
      text: `감사합니다, ${name}님! ✅\n${email}로 오늘 상담 내용을 정리하여 발송해 드리겠습니다.\n좋은 하루 보내세요! 👋`,
      timestamp: new Date()
    }])

    await delay(1000)
    setMessages(prev => [...prev, {
      type: 'system',
      text: `📧 상담 요약 이메일 발송 예약 완료 → ${email}`,
      timestamp: new Date()
    }])

    setIsProcessing(false)
    setEscalationMode(false)
    setShowAgentStatus(false)
  }

  const handleEscalation = async () => {
    setShowAgentStatus(true)
    setIsProcessing(true)
    
    const agentList = [
      { name: '채소희', role: '고객센터', avatar: '👩‍💼' },
      { name: '송인찬', role: '어카운트 매니저', avatar: '👨‍💼' },
      { name: '이현진', role: 'SE', avatar: '👨‍💻' },
      { name: '박우호', role: '개발리더', avatar: '👨‍🔧' }
    ]

    // Remove escalation button
    setMessages(prev => prev.map(msg => msg.showEscalation ? { ...msg, showEscalation: false } : msg))

    // 백엔드 에스컬레이션 API 호출 (백그라운드)
    const lastUserMsg = messages.filter(m => m.type === 'user').pop()
    const lastAiMsg = messages.filter(m => m.type === 'ai').pop()
    escalateCase({
      caseId: `case_${Date.now()}`,
      customerId: customerInfo?.id || 'unknown',
      question: lastUserMsg?.text || '',
      aiAnswer: lastAiMsg?.text || '',
    }).catch(err => console.error('Escalation API background error:', err))

    // System: connecting
    setMessages(prev => [...prev, {
      type: 'system',
      text: '담당자를 연결하고 있습니다...',
      timestamp: new Date()
    }])

    // Step 1: 채소희 입장 (1.5초)
    await delay(1500)
    setAgents(prev => [...prev, { ...agentList[0], joined: true }])
    setMessages(prev => [...prev, {
      type: 'system',
      text: '채소희 (고객센터)가 입장했습니다',
      timestamp: new Date()
    }])

    // Step 2: 채소희 인사 (1.5초)
    await delay(1500)
    setMessages(prev => [...prev, {
      type: 'agent',
      agentName: '채소희', agentRole: '고객센터', agentAvatar: '👩‍💼',
      text: '불편을 드려 죄송합니다 😔\n안녕하세요, 고객센터 채소희입니다.\n제가 직접 도와드리겠습니다. 관련 전문가분들을 바로 연결해 드릴게요!',
      timestamp: new Date()
    }])

    // Step 3: 송인찬 입장 (1.5초)
    await delay(1500)
    setAgents(prev => [...prev, { ...agentList[1], joined: true }])
    setMessages(prev => [...prev, {
      type: 'system',
      text: '송인찬 (어카운트 매니저)가 입장했습니다',
      timestamp: new Date()
    }])

    // Step 4: 채소희 안내 (1초)
    await delay(1000)
    setMessages(prev => [...prev, {
      type: 'agent',
      agentName: '채소희', agentRole: '고객센터', agentAvatar: '👩‍💼',
      text: '영업 담당 송인찬님이 입장하셨습니다. 구축 관련 문의를 답변해 주실 거예요.',
      timestamp: new Date()
    }])

    // Step 5: 이현진 입장 (1.5초)
    await delay(1500)
    setAgents(prev => [...prev, { ...agentList[2], joined: true }])
    setMessages(prev => [...prev, {
      type: 'system',
      text: '이현진 (SE)가 입장했습니다',
      timestamp: new Date()
    }])

    // Step 6: 박우호 입장 (1.5초)
    await delay(1500)
    setAgents(prev => [...prev, { ...agentList[3], joined: true }])
    setMessages(prev => [...prev, {
      type: 'system',
      text: '박우호 (개발리더)가 입장했습니다',
      timestamp: new Date()
    }])

    // Step 7: 채소희 질문 분류 (1초)
    await delay(1000)
    setMessages(prev => [...prev, {
      type: 'agent',
      agentName: '채소희', agentRole: '고객센터', agentAvatar: '👩‍💼',
      text: '모든 담당자가 입장했습니다 ✅\n\n질문을 3개 영역으로 분류했습니다:\n\n1️⃣ 구축 가능성 → 송인찬님 답변 예정\n2️⃣ 윈도우 11 호환성 → 이현진님 답변 예정\n3️⃣ 보안 인증 → 박우호님 답변 예정\n\n슬랙 채널에 답변 요청을 보내겠습니다.',
      timestamp: new Date()
    }])

    // Step 7.5: 슬랙 채널 답변 요청 (1초)
    await delay(1000)
    setMessages(prev => [...prev, {
      type: 'slack',
      channel: '#국방부-DRM-구축',
      text: '#국방부-DRM-구축\n\n@송인찬 님, 고객님께서 [구축 가능성] 관련 문의를 주셨습니다. 답변 부탁드립니다. 🙏\n@이현진 님, 고객님께서 [윈도우 11 호환성] 관련 문의를 주셨습니다. 답변 부탁드립니다. 🙏\n@박우호 님, 고객님께서 [보안 인증] 관련 문의를 주셨습니다. 답변 부탁드립니다. 🙏',
      timestamp: new Date()
    }])

    // Step 7.6: 실제 Slack으로 질문 전송 (백그라운드) + channelId 캡처
    const escalationPollStartTs = String(Date.now() / 1000)
    setSlackPollSince(escalationPollStartTs)
    let activeChannelId = slackChannelId
    try {
      const sendResult = await sendSlackQuestion(
        lastUserMsg?.text || '고객 문의',
        [
          { name: '송인찬', role: '어카운트 매니저' },
          { name: '이현진', role: 'SE' },
          { name: '박우호', role: '개발리더' },
        ],
        customerInfo?.name || '고객',
        { decomposition: [
          { assignee: '송인찬', subQuestion: '구축 가능성' },
          { assignee: '이현진', subQuestion: '윈도우 11 호환성' },
          { assignee: '박우호', subQuestion: '보안 인증' },
        ]},
        slackChannelId
      )
      if (sendResult?.data?.channelId) {
        activeChannelId = sendResult.data.channelId
        setSlackChannelId(activeChannelId)
      }
    } catch (err) {
      console.error('Slack send error:', err)
    }

    // Step 8: 송인찬 답변 — Slack 라이브 대기 (AI 폴백 없음)
    setTypingAgent({ name: '송인찬', avatar: '👨‍💼' })
    const songicAnswer = await pollForAgent('송인찬', escalationPollStartTs, 60000, activeChannelId)
    setTypingAgent(null)
    if (songicAnswer) {
      setMessages(prev => [...prev, {
        type: 'agent', agentName: '송인찬', agentRole: '어카운트 매니저', agentAvatar: '👨‍💼',
        text: songicAnswer.text, isLive: true, timestamp: new Date(songicAnswer.timestamp)
      }])
    } else {
      // 타임아웃 — AI 대신 안내 메시지만 표시
      setMessages(prev => [...prev, {
        type: 'agent', agentName: '채소희', agentRole: '고객센터', agentAvatar: '👩‍💼',
        text: '송인찬님이 현재 다른 업무 중입니다. 슬랙 채널에서 확인 후 답변드릴 예정입니다. 📩',
        timestamp: new Date()
      }])
    }

    // Step 9: 이현진 답변 — Slack 라이브 대기 (AI 폴백 없음)
    setTypingAgent({ name: '이현진', avatar: '👨‍💻' })
    const leehjAnswer = await pollForAgent('이현진', escalationPollStartTs, 60000, activeChannelId)
    setTypingAgent(null)
    if (leehjAnswer) {
      setMessages(prev => [...prev, {
        type: 'agent', agentName: '이현진', agentRole: 'SE', agentAvatar: '👨‍💻',
        text: leehjAnswer.text, isLive: true, timestamp: new Date(leehjAnswer.timestamp)
      }])
    } else {
      // 타임아웃 — AI 대신 안내 메시지만 표시
      setMessages(prev => [...prev, {
        type: 'agent', agentName: '채소희', agentRole: '고객센터', agentAvatar: '👩‍💼',
        text: '이현진님이 현재 다른 업무 중입니다. 슬랙 채널에서 확인 후 답변드릴 예정입니다. 📩',
        timestamp: new Date()
      }])
    }

    // Step 10: 박우호 답변 (가상 봇 — LLM API로 생성)
    setTypingAgent({ name: '박우호', avatar: '👨‍🔧' })
    let parkAnswer = ''
    try {
      const result = await sendMessage(
        `박우호 (개발리더) 역할로 "보안 인증" 질문에 답변해주세요. 고객: ${customerInfo?.name || '고객'}, 제품: ${customerInfo?.product || 'DRM'}. 원래 질문: ${lastUserMsg?.text || ''}`,
        customerInfo?.id || null, `esc_${Date.now()}`, []
      )
      if (result?.data?.answer) parkAnswer = result.data.answer
    } catch (e) { console.error('LLM for 박우호:', e) }
    if (!parkAnswer) parkAnswer = '확인 후 답변드리겠습니다.'
    setTypingAgent(null)
    setMessages(prev => [...prev, {
      type: 'agent',
      agentName: '박우호', agentRole: '개발리더', agentAvatar: '👨‍🔧',
      text: parkAnswer,
      timestamp: new Date()
    }])

    // Step 11: 채소희 마무리 + 선택지 (2초)
    await delay(2000)
    setMessages(prev => [...prev, {
      type: 'agent',
      agentName: '채소희', agentRole: '고객센터', agentAvatar: '👩‍💼',
      text: '3개 질문에 대한 답변이 모두 완료되었습니다 ✅\n혹시 더 궁금하신 점이 있으신가요?',
      showContinueOrEnd: true,
      timestamp: new Date()
    }])

    // 에스컬레이션 모드 활성화 (이후 질문은 담당자가 답변)
    setEscalationMode(true)
    setIsProcessing(false)
    setShowQuickReplies(true)
  }

  if (!isOpen && !isMinimized) return null

  return (
    <>
      {/* Minimized Button */}
      {isMinimized && (
        <button
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-6 right-6 bg-markany-blue text-white p-4 rounded-full shadow-2xl hover:bg-markany-dark transition-all z-50 animate-bounce"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}

      {/* Chatbot Window */}
      {!isMinimized && (
        <div className="fixed bottom-6 right-6 w-[450px] h-[700px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-markany-blue to-markany-dark text-white p-4 rounded-t-2xl flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="font-semibold">마크애니 AI 지원</span>
              {escalationMode && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">담당자 연결됨</span>}
            </div>
            <div className="flex space-x-2">
              <button onClick={() => setIsMinimized(true)} className="hover:bg-white/20 p-1 rounded transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg, index) => (
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
                      {msg.showEmailForm && (
                        <EmailCollectForm onSubmit={handleEmailSubmit} />
                      )}
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
                  {msg.confidence && msg.confidence !== 'low' && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="flex items-center space-x-2 text-xs">
                        <span>{msg.confidence === 'high' ? '🟢 높음' : '🟡 중간'}</span>
                        <span className="text-gray-500">신뢰도</span>
                      </div>
                      {msg.references?.length > 0 && (
                        <div className="mt-1 text-xs text-gray-500">
                          참조: {msg.references.join(', ')}
                        </div>
                      )}
                    </div>
                  )}
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
            
            {showThinking && <ThinkingPanel steps={thinkingSteps} />}
            {showAgentStatus && <AgentStatus agents={agents} />}
            
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
                placeholder={isProcessing ? '담당자 답변 대기 중...' : '메시지를 입력하세요...'}
                disabled={isProcessing}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-markany-blue disabled:bg-gray-100 disabled:text-gray-400"
              />
              <button
                onClick={handleSend}
                disabled={isProcessing}
                className="bg-markany-blue text-white px-6 py-2 rounded-lg hover:bg-markany-dark transition font-semibold disabled:opacity-50"
              >
                전송
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Panel - Desktop Only */}
      {!isMinimized && customerInfo && (
        <div className="hidden xl:block">
          <InfoPanel customerInfo={customerInfo} />
        </div>
      )}
    </>
  )
}

export default Chatbot
