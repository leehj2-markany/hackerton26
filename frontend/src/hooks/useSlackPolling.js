import { useEffect } from 'react'
import { pollSlackMessages } from '../api/chatApi'

const REAL_SLACK_AGENTS = ['송인찬', '이현진']

/**
 * [Issue 3] 에스컬레이션 모드 백그라운드 폴링 훅
 * 초기 폴링 루프(90초) 종료 후에도 담당자 답변을 지속 캡처
 * [Fix] isEscalationBusy 중에는 폴링 스킵 — 초기 폴링 루프와 중복 방지
 */
export default function useSlackPolling({ escalationMode, slackChannelId, sessionClosed, seenSlackTsRef, slackPollSinceRef, setMessages, isEscalationBusy, setShowContinueOrEnd }) {
  useEffect(() => {
    if (!escalationMode || !slackChannelId || sessionClosed) return
    const POLL_INTERVAL = 10000
    const intervalId = setInterval(async () => {
      // 초기 폴링 루프가 돌고 있으면 백그라운드 폴링 스킵 (중복 메시지 방지)
      if (isEscalationBusy) return
      try {
        const sinceTs = slackPollSinceRef.current || '0'
        const result = await pollSlackMessages(sinceTs, 20, slackChannelId)
        const newMessages = result?.data?.messages || []
        let hasNew = false
        for (const msg of newMessages) {
          if (seenSlackTsRef.current.has(msg.ts)) continue
          if (!REAL_SLACK_AGENTS.includes(msg.agentName)) continue
          seenSlackTsRef.current.add(msg.ts)
          hasNew = true
          setMessages(prev => [...prev, {
            type: 'agent',
            agentName: msg.agentName,
            agentRole: msg.agentRole || '',
            agentAvatar: msg.agentAvatar || '👤',
            text: msg.text,
            files: msg.files || undefined,
            isLive: true,
            timestamp: new Date(msg.timestamp)
          }])
        }
        // 새 담당자 메시지가 도착하면 "더 물어볼게요/충분합니다" 버튼 표시
        if (hasNew && setShowContinueOrEnd) {
          setShowContinueOrEnd(true)
        }
      } catch (err) {
        console.error('[background-poll] error:', err)
      }
    }, POLL_INTERVAL)
    return () => clearInterval(intervalId)
  }, [escalationMode, slackChannelId, sessionClosed, isEscalationBusy])
}
