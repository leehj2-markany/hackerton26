import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { config } from 'dotenv'
import { readFileSync } from 'fs'

config({ path: '.env' })
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' })

const chunks = JSON.parse(readFileSync('/Users/hyeonjinlee/tmp_hackerton/manualChunks.json', 'utf8'))
console.log(`📦 ${chunks.length}개 청크 인제스트 시작`)

for (let i = 0; i < chunks.length; i++) {
  const c = chunks[i]
  try {
    const r = await model.embedContent({ content: { parts: [{ text: c.content }] }, taskType: 'RETRIEVAL_DOCUMENT' })
    const { error } = await supabase.from('knowledge_chunks').insert({
      content: c.content,
      embedding: r.embedding.values,
      metadata: c.metadata
    })
    console.log(`${error ? '❌' : '✅'} [${i+1}/${chunks.length}] ${c.metadata.title}${error ? ' — '+error.message : ''}`)
  } catch (e) { console.log(`❌ [${i+1}] ${c.metadata.title} — ${e.message}`) }
  await new Promise(r => setTimeout(r, 200))
}
console.log('🎉 완료')
