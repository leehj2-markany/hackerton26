// 상세한 에러 정보 확인
require('dotenv').config();
const https = require('https');

const apiKey = process.env.GEMINI_API_KEY;

console.log('🔍 Gemini API 직접 호출 테스트\n');
console.log('API 키:', apiKey.substring(0, 20) + '...');

// REST API로 직접 호출
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

const data = JSON.stringify({
  contents: [{
    parts: [{
      text: "Hello"
    }]
  }]
});

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('\n📡 요청 URL:', url.replace(apiKey, 'API_KEY'));
console.log('📦 요청 데이터:', data);
console.log('\n⏳ 응답 대기 중...\n');

const req = https.request(url, options, (res) => {
  let responseData = '';
  
  console.log('📊 응답 상태:', res.statusCode, res.statusMessage);
  console.log('📋 응답 헤더:', JSON.stringify(res.headers, null, 2));
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('\n📄 응답 본문:');
    console.log(responseData);
    
    try {
      const json = JSON.parse(responseData);
      console.log('\n✅ JSON 파싱 성공:');
      console.log(JSON.stringify(json, null, 2));
      
      if (json.error) {
        console.log('\n❌ API 에러:');
        console.log('- 코드:', json.error.code);
        console.log('- 메시지:', json.error.message);
        console.log('- 상태:', json.error.status);
        
        if (json.error.message.includes('API key not valid')) {
          console.log('\n💡 해결방법: API 키가 유효하지 않습니다.');
        } else if (json.error.message.includes('not enabled')) {
          console.log('\n💡 해결방법: Generative Language API를 활성화해야 합니다.');
          console.log('   링크: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com');
        } else if (json.error.code === 404) {
          console.log('\n💡 해결방법: 모델을 찾을 수 없거나 API가 활성화되지 않았습니다.');
        }
      } else if (json.candidates) {
        console.log('\n🎉 성공! Gemini API가 정상 작동합니다!');
        console.log('응답:', json.candidates[0].content.parts[0].text);
      }
    } catch (e) {
      console.log('\n⚠️  JSON 파싱 실패:', e.message);
    }
  });
});

req.on('error', (error) => {
  console.error('\n❌ 요청 실패:', error);
});

req.write(data);
req.end();
