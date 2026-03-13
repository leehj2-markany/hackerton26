const https = require('https');
const TOKEN = process.env.SLACK_BOT_TOKEN;
if (!TOKEN) { console.error('SLACK_BOT_TOKEN 환경변수를 설정하세요'); process.exit(1); }

function api(method, body) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'slack.com', path: `/api/${method}`,
      method: postData ? 'POST' : 'GET',
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }
    };
    if (!postData && method.includes('?')) { opts.path = `/api/${method}`; }
    const req = https.request(opts, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function main() {
  const action = process.argv[2] || 'list';
  // 페이지네이션으로 전체 채널 조회
  // action=bot → 봇이 참여 중인 채널만 (users.conversations)
  const apiMethod = action === 'bot' ? 'users.conversations' : 'conversations.list';
  let allChannels = [];
  let cursor = '';
  do {
    const cursorParam = cursor ? `&cursor=${encodeURIComponent(cursor)}` : '';
    const page = await api(`${apiMethod}?types=public_channel,private_channel&limit=1000&exclude_archived=false${cursorParam}`);
    if (!page.ok) { console.log('Error:', page.error); return; }
    allChannels = allChannels.concat(page.channels || []);
    cursor = page.response_metadata?.next_cursor || '';
  } while (cursor);
  const res = { ok: true, channels: allChannels };
  if (!res.ok) { console.log('Error:', res.error); return; }
  const esc = res.channels.filter(c => c.name.startsWith('esc-'));
  esc.sort((a, b) => b.created - a.created);
  console.log(`전체 채널: ${res.channels.length}개 | esc- 채널: ${esc.length}개\n`);
  if (action === 'all' || action === 'bot') {
    console.log(action === 'bot' ? '--- 봇이 참여 중인 채널 ---' : '--- 전체 채널 ---');
    for (const ch of res.channels.sort((a,b) => b.created - a.created)) {
      const d = new Date(ch.created * 1000).toLocaleString('ko-KR', {timeZone:'Asia/Seoul'});
      const st = ch.is_archived ? '🗄️아카이브' : '✅활성';
      console.log(`${ch.id} | #${ch.name} | ${d} | ${st}`);
    }
    return;
  }
  for (const ch of esc) {
    const d = new Date(ch.created * 1000).toLocaleString('ko-KR', {timeZone:'Asia/Seoul'});
    const st = ch.is_archived ? '🗄️아카이브' : '✅활성';
    console.log(`${ch.id} | #${ch.name} | ${d} | ${st}`);
  }
  if (action === 'cleanup' && esc.length > 0) {
    console.log(`\n--- ${esc.length}개 채널 아카이브 처리 시작 ---`);
    for (const ch of esc) {
      if (!ch.is_archived) {
        const r = await api('conversations.archive', { channel: ch.id });
        console.log(`아카이브 #${ch.name}: ${r.ok ? '성공' : r.error}`);
      } else {
        console.log(`이미 아카이브: #${ch.name}`);
      }
    }
    console.log('완료');
  }
}
main().catch(console.error);
