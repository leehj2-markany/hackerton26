// Supabase Management API로 SQL 실행
// 프로젝트 ref: owfkajoqksaaoompvxph
// Management API는 Supabase access token이 필요하므로,
// 대안: Supabase의 pg 직접 연결 사용

// 방법 1: fetch로 Supabase SQL Editor API 호출 (비공식이지만 동작)
// 방법 2: Supabase anon key로 rpc 호출 (exec_sql 함수가 있어야 함)
// 방법 3: 직접 PostgreSQL 연결

// 여기서는 Supabase REST API의 rpc를 시도하고, 실패하면 안내 출력

const SUPABASE_URL = 'https://owfkajoqksaaoompvxph.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY

const SQL_STATEMENTS = [
  // 1. feedback 테이블
  `CREATE TABLE IF NOT EXISTS feedback (
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
  )`,
  `CREATE INDEX IF NOT EXISTS idx_feedback_session ON feedback(session_id)`,
  `CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating)`,
  // 2. conversations metadata 컬럼
  `ALTER TABLE conversations ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'`,
]

async function execViaRpc(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`RPC failed: ${res.status} ${text}`)
  }
  return res.json()
}

async function run() {
  console.log('Attempting SQL execution via Supabase RPC...\n')
  
  for (const sql of SQL_STATEMENTS) {
    const shortSql = sql.replace(/\s+/g, ' ').slice(0, 80) + '...'
    try {
      await execViaRpc(sql)
      console.log(`✅ ${shortSql}`)
    } catch (err) {
      console.log(`❌ ${shortSql}`)
      console.log(`   Error: ${err.message}\n`)
    }
  }

  console.log('\n--- If RPC failed, run SQL manually in Supabase SQL Editor ---')
  console.log('URL: https://supabase.com/dashboard/project/owfkajoqksaaoompvxph/sql/new')
  console.log('\nSQL to run:')
  console.log('---')
  console.log(SQL_STATEMENTS.join(';\n') + ';')
  console.log('---')
}

run()
