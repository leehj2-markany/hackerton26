// Gemini API 키 및 모델 확인
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function checkAPI() {
  console.log('🔍 Gemini API 상태 확인\n');
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY가 없습니다.');
    return;
  }
  
  console.log('✅ API 키:', apiKey.substring(0, 15) + '...');
  console.log('   키 길이:', apiKey.length, '자');
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // API 문서에 따른 최신 모델명들
    const modelsToTest = [
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-1.5-pro-latest', 
      'gemini-1.5-pro',
      'gemini-pro',
      'gemini-1.0-pro',
      'gemini-1.0-pro-latest'
    ];
    
    console.log('\n📋 모델 테스트 시작...\n');
    
    for (const modelName of modelsToTest) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Hi');
        const text = result.response.text();
        
        console.log(`✅ ${modelName}`);
        console.log(`   응답: ${text.substring(0, 50)}...\n`);
        
        // 첫 번째 성공한 모델로 충분
        console.log(`\n🎉 사용 가능한 모델: ${modelName}`);
        return;
        
      } catch (error) {
        console.log(`❌ ${modelName}`);
        console.log(`   에러: ${error.message.substring(0, 100)}...\n`);
      }
    }
    
    console.log('\n⚠️  모든 모델 테스트 실패');
    console.log('API 키가 유효하지 않거나 권한이 없을 수 있습니다.');
    
  } catch (error) {
    console.error('\n❌ 에러:', error.message);
  }
}

checkAPI();
