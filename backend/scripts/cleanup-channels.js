#!/usr/bin/env node
// Slack 상담 채널 일괄 정리 스크립트
// - esc-* 패턴 채널을 조회 → 보관(archive) → 삭제(delete)
// - Enterprise Grid 플랜: 보관 + 삭제 모두 가능
// - 사용법: node cleanup-channels.js [--dry-run] [--archive-only] [--pattern esc-*]
//
// [채널정리] 상담 종료 후 쌓이는 esc-* 채널을 일괄 정리하기 위한 운영 스크립트
// Enterprise Grid의 admin.conversations.delete 활용

import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
// .env는 hackerton/backend/.env에 위치
config({ path: resolve(__dirname, '..', '.env') })

const SLACK_API = 'https://slack.com/api'
const BOT_TOKEN = process.env.SLACK_BOT_TOKEN

// CLI 인자 파싱
const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const ARCHIVE_ONLY = args.includes('--archive-only')
const patternIdx = args.indexOf('--pattern')
const PATTERN = patternIdx !== -1 ? args[patternIdx + 1] : 'esc-'

if (!BOT_TOKEN) {
  console.error('❌ SLACK_BOT_TOKEN 환경변수가 설정되지 않았습니다.')
  console.error('   hackerton/backend/.env 파일에 SLACK_BOT_TOKEN을 설정하세요.')
  process.exit(1)
}

console.log('🧹 Slack 상담 채널 정리 스크립트')
console.log(`   패턴: "${PATTERN}*"`)
console.log(`   모드: ${DRY_RUN ? '🔍 DRY RUN (실제 변경 없음)' : ARCHIVE_ONLY ? '📦 보관만' : '🗑️ 보관 + 삭제'}`)
console.log('')

// ─── Slack API 헬퍼 ─────────────────────────────────────

async function slackFetch(method, body = {}, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(`${SLACK_API}/${method}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BOT_TOKEN}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (data.ok || data.error !== 'ratelimited') return data
    // Rate limited → Retry-After 헤더 또는 기본 30초 대기
    const retryAfter = parseInt(res.headers.get('Retry-After') || '30', 10)
    console.log(`  ⏳ Rate limited, ${retryAfter}초 대기 후 재시도... (${attempt + 1}/${retries})`)
    await sleep(retryAfter * 1000)
  }
  return { ok: false, error: 'ratelimited_exhausted' }
}

// ─── 1. esc-* 패턴 채널 조회 (활성 + 보관 모두) ────────

async function listEscChannels() {
  const channels = []
  let cursor = ''

  // 활성 채널 조회
  do {
    const params = { types: 'public_channel', limit: 200, exclude_archived: false }
    if (cursor) params.cursor = cursor
    const data = await slackFetch('conversations.list', params)
    if (!data.ok) {
      console.error('❌ conversations.list 실패:', data.error)
      break
    }
    const matched = (data.channels || []).filter(c => c.name.startsWith(PATTERN))
    channels.push(...matched)
    cursor = data.response_metadata?.next_cursor || ''
  } while (cursor)

  return channels
}

// ─── 2. 채널 보관 ───────────────────────────────────────

async function archiveChannel(channelId, channelName) {
  if (DRY_RUN) {
    console.log(`  📦 [DRY] 보관 예정: #${channelName} (${channelId})`)
    return true
  }
  const data = await slackFetch('conversations.archive', { channel: channelId })
  if (data.ok) {
    console.log(`  📦 보관 완료: #${channelName}`)
    return true
  }
  if (data.error === 'already_archived') {
    console.log(`  📦 이미 보관됨: #${channelName}`)
    return true
  }
  console.error(`  ❌ 보관 실패: #${channelName} — ${data.error}`)
  return false
}

// ─── 3. 채널 삭제 (Enterprise Grid) ────────────────────

async function deleteChannel(channelId, channelName) {
  if (DRY_RUN) {
    console.log(`  🗑️  [DRY] 삭제 예정: #${channelName} (${channelId})`)
    return true
  }
  if (ARCHIVE_ONLY) return false

  const data = await slackFetch('admin.conversations.delete', { channel_id: channelId })
  if (data.ok) {
    console.log(`  🗑️  삭제 완료: #${channelName}`)
    return true
  }
  // Enterprise Grid가 아닌 경우 또는 권한 부족
  if (data.error === 'not_allowed' || data.error === 'feature_not_enabled' || data.error === 'not_an_admin') {
    console.error(`  ⚠️  삭제 불가 (플랜/권한 제한): #${channelName} — ${data.error}`)
    console.error(`     → Slack 웹에서 수동 삭제하거나, Workspace Owner 권한이 필요합니다.`)
    return false
  }
  console.error(`  ❌ 삭제 실패: #${channelName} — ${data.error}`)
  return false
}

// ─── 메인 실행 ──────────────────────────────────────────

async function main() {
  // 1. 채널 조회
  console.log('🔍 채널 조회 중...')
  const channels = await listEscChannels()

  if (channels.length === 0) {
    console.log(`\n✅ "${PATTERN}*" 패턴에 해당하는 채널이 없습니다.`)
    return
  }

  const active = channels.filter(c => !c.is_archived)
  const archived = channels.filter(c => c.is_archived)

  console.log(`\n📊 조회 결과:`)
  console.log(`   전체: ${channels.length}개`)
  console.log(`   활성: ${active.length}개`)
  console.log(`   보관됨: ${archived.length}개`)
  console.log('')

  // 채널 목록 출력
  channels.forEach(c => {
    const status = c.is_archived ? '📦' : '🟢'
    const created = new Date(c.created * 1000).toLocaleString('ko-KR')
    console.log(`   ${status} #${c.name} (${c.id}) — 생성: ${created}`)
  })
  console.log('')

  // 2. 활성 채널 보관
  let archivedCount = 0
  if (active.length > 0) {
    console.log(`📦 활성 채널 ${active.length}개 보관 처리...`)
    for (const ch of active) {
      const ok = await archiveChannel(ch.id, ch.name)
      if (ok) archivedCount++
      await sleep(500) // Rate limit 방지
    }
    console.log('')
  }

  // 3. 전체 채널 삭제 (보관된 것 포함)
  let deletedCount = 0
  if (!ARCHIVE_ONLY) {
    const toDelete = channels // 보관 + 활성 모두 삭제 대상
    console.log(`🗑️  채널 ${toDelete.length}개 삭제 처리...`)
    for (const ch of toDelete) {
      const ok = await deleteChannel(ch.id, ch.name)
      if (ok) deletedCount++
      await sleep(500) // Rate limit 방지
    }
    console.log('')
  }

  // 4. 결과 요약
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`✅ 완료`)
  console.log(`   보관: ${archivedCount}개`)
  if (!ARCHIVE_ONLY) console.log(`   삭제: ${deletedCount}개`)
  if (DRY_RUN) console.log(`   ⚠️  DRY RUN 모드 — 실제 변경 없음`)
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

main().catch(err => {
  console.error('❌ 스크립트 실행 실패:', err)
  process.exit(1)
})
