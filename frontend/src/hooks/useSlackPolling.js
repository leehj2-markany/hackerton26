import { useEffect, useRef } from 'react'
import { pollSlackMessages } from '../api/chatApi'

const REAL_SLACK_AGENTS = ['송인찬', '이현진']

/**
 * [Issue 3] 에스컬레이션 모드 백그라운드 폴링 훅
 * 초기 폴링 루프(90초) 종료 후에도 담당자 답변을 지속 캡처
 */
export default function useSlackPolling({ escalationMode, slackChannelId, sessionClosed, seenSlackTsRef, slackPollSinceRef, setMessages }) {
  useEffect(() => {
    if (!escalationMode || !slackChannelId || sessionClosed) return
    const POLL_INTERVAL = 10000
    const intervalId = setInterval(async () => {
      try {
        const sinceTs = slackPollSinceRef.current || '0'
        const result = await pollSlackMessages(sinceTs, 20, slackChannelId)
        const newMessages = result?.data?.messages || []
        for (const msg of newMessages) {
          if (seenSlackTsRef.current.has(msg.ts)) continue
          if (!REAL_SLACK_AGENTS.includes(msg.agentName)) continue
          seenSlackTsRef.current.add(msg.ts)
          setMessages(prev => [...prev, {
            type: 'agent',
            agentName: msg.agentName,
            agentRole: msg.agentRole || '',
            agentAvatar: msg.agentAvatar || '👤',
            text: msg.text,
            isLive: true,
            timestamp: new Date(msg.timestamp)
          }])
        }
      } catch (err) {
        console.error('[background-poll] error:', err)
      }
    }, POLL_INTERVAL)
    return () => clearInterval(intervalId)
  }, [escalationMode, slackChannelId, sessionClosed])
}
