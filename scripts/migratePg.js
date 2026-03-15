// Supabase PostgreSQL 직접 연결로 마이그레이션 실행
import pg from 'pg'

// Supabase 직접 연결 (Transaction Pooler)
// 형식: postgresql://postgres.[ref]:[password]@[host]:6543/postgres
const DATABASE_URL = process.env.DATABASE_URL || 
  `postgresql://postgres.owfkajoqksaaoompvxph:${process.env.SUPABASE_DB_PASSWORD}@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres`

if (!process.env.SUPABASE_DB_PASSWORD && !process.env.DATABASE_URL) {
  console.log('⚠️ SUPABASE_DB_PASSWORD 환경변수가 필요합니다.')
  console.log('Supabase Dashboard > Settings > Database > Connection string에서 비밀번호를 확인하세요.')
  console.log('')
  console.log('사용법: SUPABASE_DB_PASSWORD=your_password node scripts/migratePg.js')
  console.log('')
  console.log('또는 Supabase SQL Editor에서 직접 실행하세요:')
  console.log('URL: https://supabase.com/dashboard/project/owfkajoqksaaoompvxph/sql/new')
  console.log('')
  console.log('=== SQL ===')
  console.log(`
-- 1. feedback 테이블
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

-- 2. conversations metadata 컬럼
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
`)
  process.exit(0)
}

const client = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } })

async function run() {
  await client.connect()
  console.log('✅ PostgreSQL 연결 성공\n')

  const sqls = [
    {
      name: 'feedback 테이블 생성',
      sql: `CREATE TABLE IF NOT EXISTS feedback (
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
      )`
    },
    { name: 'feedback session 인덱스', sql: `CREATE INDEX IF NOT EXISTS idx_feedback_session ON feedback(session_id)` },
    { name: 'feedback rating 인덱스', sql: `CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating)` },
    { name: 'conversations metadata 컬럼', sql: `ALTER TABLE conversations ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'` },
  ]

  for (const { name, sql } of sqls) {
    try {
      await client.query(sql)
      console.log(`✅ ${name}`)
    } catch (err) {
      console.log(`❌ ${name}: ${err.message}`)
    }
  }

  await client.end()
  console.log('\n✅ 마이그레이션 완료')
}

run().catch(err => { console.error('Fatal:', err.message); process.exit(1) })
