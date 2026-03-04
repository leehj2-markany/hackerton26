require('dotenv').config({ path: __dirname + '/.env' });

async function testSupabase() {
  console.log('🚀 Supabase 연결 테스트 시작...\n');

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error('❌ SUPABASE_URL 또는 SUPABASE_ANON_KEY가 없습니다.');
    process.exit(1);
  }

  console.log('✅ 환경변수 로드 완료');
  console.log(`   URL: ${url}`);
  console.log(`   Key 앞 30자: ${key.substring(0, 30)}...`);

  try {
    // REST API로 직접 테스트 (패키지 설치 불필요)
    const response = await fetch(`${url}/rest/v1/`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });

    if (response.ok) {
      console.log(`\n✅ Supabase 연결 성공! (HTTP ${response.status})`);
      console.log('🎉 Supabase가 정상 작동합니다.');
    } else {
      const err = await response.text();
      console.error(`\n❌ 연결 실패: HTTP ${response.status}`);
      console.error(`   ${err}`);
    }
  } catch (error) {
    console.error(`\n❌ 연결 실패: ${error.message}`);
    process.exit(1);
  }
}

testSupabase();
