#!/usr/bin/env node
// Supabase에 knowledge_chunks 테이블 + match_knowledge RPC 함수 생성
// [의도] pgvector 기반 시맨틱 검색을 위한 DB 스키마 셋업 — 1회성 실행 스크립트
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env' })

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

async function setup() {
  console.log('🔧 Supabase Vector DB 셋업 시작...\n')

  // 1. pgvector 확장 활성화
  console.log('1️⃣ pgvector 확장 활성화...')
  const { error: extErr } = await supabase.rpc('exec_sql', {
    sql: 'CREATE EXTENSION IF NOT EXISTS vector;'
  }).catch(() => ({ error: { message: 'exec_sql RPC 없음 — Supabase Dashboard에서 직접 실행 필요' } }))
  
  if (extErr) {
    console.log('⚠️  pgvector 확장은 Supabase Dashboard > SQL Editor에서 직접 실행하세요:')
    console.log('   CREATE EXTENSION IF NOT EXISTS vector;\n')
  } else {
    console.log('   ✅ pgvector 확장 활성화 완료\n')
  }

  // SQL 스크립트 출력 (Supabase Dashboard SQL Editor에서 실행)
  const sql = `
-- ============================================
-- ANY 브릿지 Knowledge Vector DB 스키마
-- Supabase Dashboard > SQL Editor에서 실행하세요
-- ============================================

-- 1. pgvector 확장 활성화
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. knowledge_chunks 테이블 생성
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  embedding vector(768),  -- Gemini text-embedding-004 차원
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 벡터 검색 인덱스 (IVFFlat — 소규모 데이터에 적합)
-- 데이터 삽입 후 실행해야 함 (빈 테이블에서는 인덱스 생성 불가)
-- CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx 
--   ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

-- 4. metadata 검색용 GIN 인덱스
CREATE INDEX IF NOT EXISTS knowledge_chunks_metadata_idx 
  ON knowledge_chunks USING GIN (metadata);

-- 5. match_knowledge RPC 함수 (코사인 유사도 기반 검색)
CREATE OR REPLACE FUNCTION match_knowledge(
  query_embedding vector(768),
  match_count INT DEFAULT 5,
  filter JSONB DEFAULT '{}'
)
RETURNS TABLE (
  id BIGINT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.content,
    kc.metadata,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks kc
  WHERE 
    CASE 
      WHEN filter->>'product_group' IS NOT NULL 
      THEN kc.metadata->>'product_group' = filter->>'product_group'
      ELSE TRUE
    END
    AND
    CASE
      WHEN filter->>'product_name' IS NOT NULL
      THEN kc.metadata->>'product_name' = filter->>'product_name'
      ELSE TRUE
    END
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 6. RLS 정책 (anon 키로 읽기 허용)
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow anonymous read" ON knowledge_chunks
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Allow anonymous insert" ON knowledge_chunks
  FOR INSERT WITH CHECK (true);

SELECT 'Setup complete! knowledge_chunks 테이블 + match_knowledge 함수 생성됨' AS result;
`.trim()

  console.log('📋 아래 SQL을 Supabase Dashboard > SQL Editor에서 실행하세요:\n')
  console.log('=' .repeat(60))
  console.log(sql)
  console.log('=' .repeat(60))
  console.log('\n✅ SQL 출력 완료. Dashboard에서 실행 후 ingestKnowledge.js를 실행하세요.')
}

setup().catch(console.error)
