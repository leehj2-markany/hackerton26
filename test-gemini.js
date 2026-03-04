// Gemini API 테스트 스크립트
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiAPI() {
  console.log('🚀 Gemini API 테스트 시작...\n');
  
  // API 키 확인
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY가 .env 파일에 없습니다.');
    process.exit(1);
  }
  
  console.log('✅ API 키 로드 완료');
  console.log(`   키 앞 10자: ${apiKey.substring(0, 10)}...`);
  
  try {
    // Gemini 클라이언트 초기화
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    console.log('\n📡 Gemini 2.5 Flash 모델 연결 중...');
    
    // 간단한 테스트 질문
    const prompt = '안녕하세요! 마크애니 ANY 브릿지 프로젝트를 위한 테스트입니다. 간단히 인사해주세요.';
    
    console.log(`\n💬 질문: ${prompt}`);
    console.log('\n⏳ 응답 대기 중...\n');
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    console.log('✅ Gemini API 응답 성공!\n');
    console.log('📝 응답 내용:');
    console.log('─'.repeat(50));
    console.log(text);
    console.log('─'.repeat(50));
    
    console.log('\n🎉 테스트 완료! Gemini API가 정상 작동합니다.');
    
  } catch (error) {
    console.error('\n❌ Gemini API 호출 실패:');
    console.error(`   에러 메시지: ${error.message}`);
    if (error.response) {
      console.error(`   상태 코드: ${error.response.status}`);
      console.error(`   상세: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    process.exit(1);
  }
}

// 테스트 실행
testGeminiAPI();
