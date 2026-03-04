// Gemini 사용 가능한 모델 목록 확인
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY가 없습니다.');
    process.exit(1);
  }
  
  console.log('🔍 사용 가능한 Gemini 모델 목록 조회 중...\n');
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 간단한 테스트로 gemini-pro 시도
    const testModels = [
      'gemini-pro',
      'gemini-1.5-pro-latest',
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest'
    ];
    
    for (const modelName of testModels) {
      try {
        console.log(`\n테스트 중: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Hello');
        console.log(`✅ ${modelName} - 작동함!`);
        console.log(`   응답: ${result.response.text().substring(0, 50)}...`);
      } catch (error) {
        console.log(`❌ ${modelName} - 실패: ${error.message.substring(0, 100)}`);
      }
    }
    
  } catch (error) {
    console.error('에러:', error.message);
  }
}

listModels();
