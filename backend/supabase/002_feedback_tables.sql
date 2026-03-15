-- 피드백 테이블 — 사용자 만족/불만족 수집
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  message_index INT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  rating TEXT CHECK (rating IN ('positive', 'negative')),
  comment TEXT,
  model TEXT,
  complexity TEXT,
  confidence_score INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_feedback_session ON feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating);
