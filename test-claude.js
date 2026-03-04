require('dotenv').config({ path: __dirname + '/.env' });

async function testClaudeAPI() {
  console.log('🚀 Claude API 테스트 시작...\n');
  
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    console.error('❌ CLAUDE_API_KEY가 .env 파일에 없습니다.');
    process.exit(1);
  }
  
  console.log('✅ API 키 로드 완료');
  console.log(`   키 앞 20자: ${apiKey.substring(0, 20)}...`);
  
  try {
    console.log('\n📡 Claude Sonnet 4 모델 연결 중...');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        messages: [
          { role: 'user', content: '안녕하세요! 마크애니 ANY 브릿지 해커톤 프로젝트 테스트입니다. 간단히 인사해주세요.' }
        ]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`HTTP ${response.status}: ${err}`);
    }

    const data = await response.json();
    const text = data.content[0].text;
    
    console.log('\n✅ Claude API 응답 성공!\n');
    console.log('📝 응답 내용:');
    console.log('─'.repeat(50));
    console.log(text);
    console.log('─'.repeat(50));
    console.log(`\n📊 모델: ${data.model}`);
    console.log(`📊 토큰: 입력 ${data.usage.input_tokens} / 출력 ${data.usage.output_tokens}`);
    console.log('\n🎉 테스트 완료! Claude API가 정상 작동합니다.');
    
  } catch (error) {
    console.error('\n❌ Claude API 호출 실패:');
    console.error(`   에러: ${error.message}`);
    process.exit(1);
  }
}

testClaudeAPI();
