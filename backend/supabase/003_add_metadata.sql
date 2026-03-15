-- conversations 테이블에 metadata JSONB 컬럼 추가
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
