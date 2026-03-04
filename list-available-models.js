// 사용 가능한 모델 목록 확인
require('dotenv').config();
const https = require('https');

const apiKey = process.env.GEMINI_API_KEY;

console.log('🔍 사용 가능한 Gemini 모델 목록 조회\n');

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

console.log('📡 요청 URL:', url.replace(apiKey, 'API_KEY'));
console.log('⏳ 응답 대기 중...\n');

https.get(url, (res) => {
  let data = '';
  
  console.log('📊 응답 상태:', res.statusCode, res.statusMessage);
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      
      if (json.error) {
        console.log('\n❌ API 에러:');
        console.log(JSON.stringify(json.error, null, 2));
        
        if (json.error.status === 'PERMISSION_DENIED' || json.error.message.includes('not enabled')) {
          console.log('\n💡 Generative Language API가 활성화되지 않았습니다!');
          console.log('\n해결 방법:');
          console.log('1. 다음 링크로 이동:');
          console.log('   https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com');
          console.log('2. "사용 설정" 또는 "Enable" 버튼 클릭');
          console.log('3. 몇 분 후 다시 테스트');
        }
      } else if (json.models) {
        console.log('\n✅ 사용 가능한 모델:', json.models.length, '개\n');
        
        json.models.forEach((model, index) => {
          console.log(`${index + 1}. ${model.name}`);
          console.log(`   - 표시 이름: ${model.displayName || 'N/A'}`);
          console.log(`   - 설명: ${model.description || 'N/A'}`);
          console.log(`   - 지원 메서드: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
          console.log('');
        });
        
        console.log('🎉 API가 정상 작동합니다!');
        console.log('\n추천 모델:');
        const recommended = json.models.find(m => m.name.includes('gemini-pro') || m.name.includes('gemini-1.5'));
        if (recommended) {
          console.log(`- ${recommended.name}`);
          console.log(`  사용법: genAI.getGenerativeModel({ model: '${recommended.name.replace('models/', '')}' })`);
        }
      }
    } catch (e) {
      console.log('\n⚠️  응답 파싱 실패:', e.message);
      console.log('원본 응답:', data);
    }
  });
}).on('error', (error) => {
  console.error('\n❌ 요청 실패:', error);
});
