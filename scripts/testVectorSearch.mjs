import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { config } from 'dotenv'

config({ path: '.env' })

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' })

async function testQuery(query) {
  console.log(`\n🔍 쿼리: "${query}"`)
  const result = await embeddingModel.embedContent({
    content: { parts: [{ text: query }] },
    taskType: 'RETRIEVAL_QUERY',
  })
  const embedding = result.embedding.values

  const { data, error } = await supabase.rpc('match_knowledge', {
    query_embedding: embedding,
    match_count: 5,
    filter: {},
  })

  if (error) { console.error('❌ RPC 실패:', error.message); return }
  
  data.forEach((row, i) => {
    console.log(`  ${i+1}. [${(row.similarity*100).toFixed(1)}%] ${row.metadata?.product_name} — ${row.metadata?.title}`)
  })
}

await testQuery('위변조방지')
await testQuery('인턴 교육 수료증 위변조 방지')
await testQuery('DRM 문서 암호화')
await testQuery('모바일 화면 캡처 방지')
await testQuery('USB 보안')
