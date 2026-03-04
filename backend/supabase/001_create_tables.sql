-- ANY 브릿지 Supabase 테이블 생성
-- Supabase SQL Editor에서 실행하세요

-- 1. 케이스 테이블
CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  product TEXT,
  question TEXT NOT NULL,
  ai_answer TEXT,
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
  confidence_score INT,
  status TEXT DEFAULT 'created' CHECK (status IN ('created', 'ai_responding', 'ai_resolved', 'escalated', 'resolved', 'closed')),
  needs_escalation BOOLEAN DEFAULT FALSE,
  is_complex BOOLEAN DEFAULT FALSE,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 대화 이력 테이블
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  role TEXT CHECK (role IN ('user', 'assistant', 'agent', 'system')),
  content TEXT NOT NULL,
  agent_name TEXT,
  agent_role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 에스컬레이션 테이블
CREATE TABLE IF NOT EXISTS escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  channel_id TEXT,
  channel_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'resolved', 'closed')),
  sub_questions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 4. 대시보드 통계 테이블
CREATE TABLE IF NOT EXISTS dashboard_stats (
  id SERIAL PRIMARY KEY,
  period TEXT NOT NULL,
  total_cases INT DEFAULT 0,
  ai_resolved INT DEFAULT 0,
  escalated INT DEFAULT 0,
  in_progress INT DEFAULT 0,
  avg_response_time_ai INT DEFAULT 25,
  avg_response_time_agent INT DEFAULT 1080,
  satisfaction_avg DECIMAL(3,1) DEFAULT 4.2,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 인덱스
CREATE INDEX IF NOT EXISTS idx_cases_customer ON cases(customer_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_conversations_case ON conversations(case_id);
CREATE INDEX IF NOT EXISTS idx_conversations_session ON conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_escalations_case ON escalations(case_id);

-- 6. 초기 대시보드 데이터 삽입
INSERT INTO dashboard_stats (period, total_cases, ai_resolved, escalated, in_progress)
VALUES ('all', 500, 300, 150, 50)
ON CONFLICT DO NOTHING;
