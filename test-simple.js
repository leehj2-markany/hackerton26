// 가장 간단한 Gemini API 테스트
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function simpleTest() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('API 키:', apiKey);
  console.log('키 길이:', apiKey.length);
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 가장 기본적인 모델명으로 시도
    console.log('\n테스트 1: gemini-pro');
    const model1 = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result1 = await model1.generateContent('Say hello');
    console.log('✅ 성공!');
    console.log('응답:', result1.response.text());
    
  } catch (error) {
    console.log('\n❌ 실패');
    console.log('전체 에러:', error);
    console.log('\n에러 상세:');
    if (error.response) {
      console.log('- Status:', error.response.status);
      console.log('- StatusText:', error.response.statusText);
      console.log('- Data:', error.response.data);
    }
  }
}

simpleTest();
