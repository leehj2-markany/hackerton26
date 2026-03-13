import { useEffect } from 'react'

/**
 * [Issue 6] 세션 복원 훅 — 에스컬레이션 상태 포함
 */
export default function useSessionRestore({
  setIsOpen, setCustomerInfo, setShowIntakeForm, setMessages,
  setSlackChannelId, setSlackChannelName, setEscalationMode
}) {
  // 고객 정보가 있으면 자동으로 챗봇 열기
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('anybridge_customer')
      if (saved) setIsOpen(true)
    } catch (_) {}
  }, [])

  // 고객 정보 + 에스컬레이션 상태 복원
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
      // [Issue 6] 에스컬레이션 모드 복원
      const savedEscMode = sessionStorage.getItem('anybridge_escalationMode')
      if (savedEscMode === 'true') setEscalationMode(true)
    } catch (_) {}
  }, [])
}
