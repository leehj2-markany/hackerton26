// 환경 변수 로드 (로컬 개발용, Vercel에서는 환경변수가 자동 주입됨)
try { const { config } = await import('dotenv'); config({ path: '.env' }) } catch (_) { /* Vercel 환경 */ }

export const ENV = {
  DEMO_MODE: process.env.DEMO_MODE === 'true',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN,
  SLACK_APP_TOKEN: process.env.SLACK_APP_TOKEN,
  SLACK_CHANNEL_ID: process.env.SLACK_CHANNEL_ID || '',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
}

// 실제 Slack 사용자 ID 매핑 (데모용)
export const SLACK_USERS = {
  '송인찬': { id: process.env.SLACK_USER_SONGIC || '', role: '어카운트 매니저', avatar: '👨‍💼' },
  '이현진': { id: process.env.SLACK_USER_LEEHJ2 || '', role: 'SE', avatar: '👨‍💻' },
}

// 가상 봇 에이전트 (Slack 전송 안 함)
export const VIRTUAL_AGENTS = ['채소희', '박우호']
