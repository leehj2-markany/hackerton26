const https = require('https');
const TOKEN = process.env.SLACK_BOT_TOKEN;
if (!TOKEN) { console.error('SLACK_BOT_TOKEN 환경변수를 설정하세요'); process.exit(1); }

function slackGet(method, params = '') {
  return new Promise((resolve, reject) => {
    const url = `https://slack.com/api/${method}?${params}`;
    const opts = { headers: { 'Authorization': `Bearer ${TOKEN}` } };
    https.get(url, opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function main() {
  const res = await slackGet('conversations.list', 'types=public_channel,private_channel&limit=200&exclude_archived=false');
  if (!res.ok) { console.log('Error:', res.error); return; }
  const channels = res.channels || [];
  const esc = channels.filter(c => c.name.startsWith('esc-'));
  esc.sort((a, b) => (b.created || 0) - (a.created || 0));
  console.log(`전체 채널: ${channels.length}개 | esc- 채널: ${esc.length}개\n`);
  if (esc.length === 0) { console.log('esc- 채널 없음'); return; }
  console.log('봇 생성 에스컬레이션 채널:');
  console.log('-'.repeat(80));
  for (const ch of esc) {
    const d = new Date(ch.created * 1000);
    const ts = d.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    const st = ch.is_archived ? '🗄️ 아카이브' : '✅ 활성';
    const purpose = (ch.purpose?.value || '').slice(0, 80);
    console.log(`  #${ch.name}`);
    console.log(`    ID: ${ch.id} | 생성: ${ts} | ${st} | 멤버: ${ch.num_members}명`);
    if (purpose) console.log(`    목적: ${purpose}`);
    console.log();
  }
}
main().catch(console.error);
