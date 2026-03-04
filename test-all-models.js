// 여러 Gemini 모델 비교 테스트
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const models = [
  { name: 'gemini-2.5-flash', desc: '가장 빠른 최신 모델' },
  { name: 'gemini-2.5-pro', desc: '가장 강력한 최신 모델' },
  { name: 'gemini-2.0-flash', desc: '빠른 2.0 모델' },
  { name: 'gemini-pro-latest', desc: '최신 Pro 모델' },
  { name: 'gemini-flash-latest', desc: '최신 Flash 모델' }
];

async function testAllModels() {
  console.log('🚀 Gemini 모델 비교 테스트\n');
  
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const prompt = 'AI 해커톤에 대해 한 문장으로 설명해주세요.';
  console.log(`📝 테스트 질문: "${prompt}"\n`);
  console.log('─'.repeat(80));
  
  for (const modelInfo of models) {
    try {
      console.log(`\n🤖 모델: ${modelInfo.name}`);
      console.log(`   설명: ${modelInfo.desc}`);
      
      const startTime = Date.now();
      const model = genAI.getGenerativeModel({ model: modelInfo.name });
      const result = await model.generateContent(prompt);
      const endTime = Date.now();
      
      const text = result.response.text();
      const responseTime = endTime - startTime;
      
      console.log(`   ⏱️  응답 시간: ${responseTime}ms`);
      console.log(`   💬 응답: ${text}`);
      console.log('   ✅ 성공');
      
    } catch (error) {
      console.log(`   ❌ 실패: ${error.message.substring(0, 100)}`);
    }
    
    console.log('─'.repeat(80));
  }
  
  console.log('\n🎉 테스트 완료!');
  console.log('\n💡 추천:');
  console.log('   - 빠른 응답이 필요하면: gemini-2.5-flash');
  console.log('   - 복잡한 작업이 필요하면: gemini-2.5-pro');
  console.log('   - 안정적인 버전이 필요하면: gemini-pro-latest');
}

testAllModels();
