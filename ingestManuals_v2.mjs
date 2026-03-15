import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { config } from 'dotenv'
import { readFileSync, writeFileSync } from 'fs'

config({ path: '.env' })
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const embedModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' })

// 매뉴얼 목록 — Drive에서 읽을 파일들
const MANUALS = [
  { id: '1oAygbzciDa3RDIvl9PwuFdVTpdeOxsbJ', product: 'Document SAFER', group: 'DRM 제품군', title: 'Document SAFER Green 관리자매뉴얼' },
  { id: '1wJcj9OUK0PtJjRCVne-Xna7sOYEJUsKo', product: 'Document SAFER', group: 'DRM 제품군', title: 'Document SAFER BLUE 관리자매뉴얼' },
  { id: '10NezP_n94oJEDkHgg7uh_oOyfLNk7pH-', product: 'Screen SAFER', group: 'DRM 제품군', title: 'Screen SAFER 관리자매뉴얼' },
  { id: '11lJc6qwFnVMwD7IHYst0ISFLbHwWVZqm', product: 'SafeUSB', group: 'DLP 제품군', title: 'SafeUSB+ 사용자매뉴얼' },
]

function chunkText(text, product, group, docTitle, maxLen = 1500) {
  const chunks = []
  const parts = text.split(/\n(?=\d+\.[\d.]*\s)/)
  let buf = '', sec = ''
  for (const p of parts) {
    const m = p.match(/^(\d+\.[\d.]*\s+.{2,60})/)
    if (m) sec = m[1].trim().slice(0, 50)
    if (buf.length + p.length > maxLen && buf.length > 100) {
      chunks.push({
        content: `[제품명] ${product}\n[제품군] ${group}\n[문서] ${docTitle}\n[섹션] ${sec}\n${buf.trim()}`,
        metadata: { source: 'product_manual_v2', product_group: group, product_name: product, title: `${docTitle} — ${sec}` }
      })
      buf = ''
    }
    buf += p + '\n'
  }
  if (buf.trim().length > 50) {
    chunks.push({
      content: `[제품명] ${product}\n[제품군] ${group}\n[문서] ${docTitle}\n[섹션] ${sec}\n${buf.trim()}`,
      metadata: { source: 'product_manual_v2', product_group: group, product_name: product, title: `${docTitle} — ${sec}` }
    })
  }
  return chunks
}

// 로컬 캐시에서 텍스트 읽기 (이전에 저장한 것)
const cacheFile = '/Users/hyeonjinlee/tmp_hackerton/manual_texts.json'
let texts
try { texts = JSON.parse(readFileSync(cacheFile, 'utf8')) } catch { texts = {} }

// 텍스트가 없으면 종료 (별도로 저장 필요)
if (Object.keys(texts).length === 0) {
  console.log('❌ manual_texts.json이 비어있습니다. 먼저 텍스트를 저장하세요.')
  process.exit(1)
}

const allChunks = []
for (const m of MANUALS) {
  const text = texts[m.id]
  if (!text) { console.log(`⏭️ ${m.title}: 텍스트 없음`); continue }
  const chunks = chunkText(text, m.product, m.group, m.title)
  allChunks.push(...chunks)
  console.log(`📄 ${m.title}: ${chunks.length}개 청크`)
}

console.log(`\n📦 총 ${allChunks.length}개 청크 → 임베딩 & 인서트 시작`)

let ok = 0, fail = 0
for (let i = 0; i < allChunks.length; i++) {
  const c = allChunks[i]
  try {
    const r = await embedModel.embedContent({ content: { parts: [{ text: c.content }] }, taskType: 'RETRIEVAL_DOCUMENT' })
    const { error } = await supabase.from('knowledge_chunks').insert({
      content: c.content, embedding: r.embedding.values, metadata: c.metadata
    })
    if (error) { fail++; console.log(`❌ [${i+1}] ${error.message}`) }
    else { ok++; if (ok % 10 === 0) console.log(`✅ ${ok}/${allChunks.length}...`) }
  } catch (e) { fail++; console.log(`❌ [${i+1}] ${e.message}`) }
  await new Promise(r => setTimeout(r, 200))
}
console.log(`\n🎉 완료: ${ok} 성공, ${fail} 실패`)
