// Supabase SQL 마이그레이션 실행 스크립트
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://owfkajoqksaaoompvxph.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_KEY) {
  console.error('SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY required')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function run() {
  console.log('=== Supabase Migration Check ===\n')

  // 1. feedback 테이블 존재 확인
  console.log('1. Checking feedback table...')
  const { data: fbData, error: fbErr } = await supabase.from('feedback').select('id').limit(1)
  if (fbErr && fbErr.message.includes('does not exist')) {
    console.log('   ❌ feedback table does not exist — needs manual SQL execution')
    console.log('   Run this SQL in Supabase SQL Editor:')
    console.log(`
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
`)
  } else if (fbErr) {
    console.log('   ⚠️ Error:', fbErr.message)
  } else {
    console.log('   ✅ feedback table exists')
  }

  // 2. conversations 테이블 + metadata 컬럼 확인
  console.log('\n2. Checking conversations table + metadata column...')
  const { data: convData, error: convErr } = await supabase.from('conversations').select('id, metadata').limit(1)
  if (convErr && convErr.message.includes('does not exist')) {
    console.log('   ❌ conversations table does not exist')
  } else if (convErr && convErr.message.includes('metadata')) {
    console.log('   ⚠️ conversations table exists but metadata column missing')
    console.log('   Run: ALTER TABLE conversations ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT \'{}\';')
  } else if (convErr) {
    console.log('   ⚠️ Error:', convErr.message)
  } else {
    console.log('   ✅ conversations table with metadata column exists')
  }

  // 3. 테스트 insert + delete (feedback)
  console.log('\n3. Testing feedback insert...')
  const testRow = {
    session_id: 'test_migration_check',
    question: 'test',
    answer: 'test',
    rating: 'positive',
  }
  const { data: insertData, error: insertErr } = await supabase.from('feedback').insert(testRow).select('id')
  if (insertErr) {
    console.log('   ❌ Insert failed:', insertErr.message)
  } else {
    console.log('   ✅ Insert OK, cleaning up...')
    if (insertData?.[0]?.id) {
      await supabase.from('feedback').delete().eq('id', insertData[0].id)
      console.log('   ✅ Cleanup done')
    }
  }

  // 4. 테스트 insert + delete (conversations)
  console.log('\n4. Testing conversations insert with metadata...')
  const testConv = {
    session_id: 'test_migration_check',
    role: 'user',
    content: 'test message',
    metadata: { customer_id: 'test_cust' },
  }
  const { data: convInsert, error: convInsertErr } = await supabase.from('conversations').insert(testConv).select('id')
  if (convInsertErr) {
    console.log('   ❌ Insert failed:', convInsertErr.message)
  } else {
    console.log('   ✅ Insert OK with metadata, cleaning up...')
    if (convInsert?.[0]?.id) {
      await supabase.from('conversations').delete().eq('id', convInsert[0].id)
      console.log('   ✅ Cleanup done')
    }
  }

  console.log('\n=== Migration Check Complete ===')
}

run().catch(err => { console.error('Fatal:', err); process.exit(1) })
