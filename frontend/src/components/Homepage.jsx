import { useState } from 'react'

const Homepage = () => {
  // [Issue 5] 모바일 햄버거 메뉴
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-markany-blue">MarkAny</div>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#" className="text-gray-700 hover:text-markany-blue transition">제품</a>
              <a href="#" className="text-gray-700 hover:text-markany-blue transition">솔루션</a>
              <a href="#" className="text-gray-700 hover:text-markany-blue transition">고객지원</a>
              <a href="#" className="text-gray-700 hover:text-markany-blue transition">회사소개</a>
              <a href="/dashboard" className="text-markany-blue font-semibold hover:text-markany-dark transition">📊 대시보드</a>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <button className="text-gray-700 hover:text-markany-blue transition">로그인</button>
              <button
                className="bg-markany-blue text-white px-4 py-2 rounded-lg hover:bg-markany-dark transition"
                onClick={() => window.dispatchEvent(new CustomEvent('openChatbot'))}
              >
                문의하기
              </button>
            </div>
            {/* [Issue 5] 모바일 햄버거 버튼 */}
            <button
              className="md:hidden p-2 text-gray-700 hover:text-markany-blue transition"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="메뉴"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
          {/* [Issue 5] 모바일 메뉴 드롭다운 */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-100 py-3 space-y-2">
              <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">제품</a>
              <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">솔루션</a>
              <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">고객지원</a>
              <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">회사소개</a>
              <a href="/dashboard" className="block px-4 py-2 text-markany-blue font-semibold hover:bg-blue-50 rounded-lg">📊 대시보드</a>
              <div className="px-4 pt-2 space-y-2">
                <button className="w-full text-left text-gray-700 py-2">로그인</button>
                <button
                  className="w-full bg-markany-blue text-white px-4 py-2 rounded-lg hover:bg-markany-dark transition"
                  onClick={() => { setMobileMenuOpen(false); window.dispatchEvent(new CustomEvent('openChatbot')) }}
                >
                  문의하기
                </button>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Hero Section — AI-powered solution showcase with gradient animation */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-24 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-indigo-400 rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div>
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/80 backdrop-blur text-sm font-medium text-markany-blue mb-6 shadow-sm">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                AI 상담 가능
              </div>
              <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
                AI가 답변하는<br />
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">보안 기술 상담</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                마크애니의 AI 프리세일즈 어시스턴트가 DRM, 워터마킹, 문서 보안에 대한 전문 상담을 즉시 제공합니다. 24시간 대기 없이, AI가 먼저 답변합니다.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-8 py-3.5 rounded-xl text-lg font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg shadow-blue-500/25"
                  onClick={() => window.dispatchEvent(new CustomEvent('openChatbot'))}
                >
                  AI 상담 시작하기
                </button>
                <button className="bg-white text-gray-700 px-8 py-3.5 rounded-xl text-lg font-semibold border border-gray-200 hover:bg-gray-50 transition-all">
                  데모 영상 보기
                </button>
              </div>
              <div className="flex items-center space-x-6 mt-8 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  <span>24/7 즉시 응답</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  <span>RAG 기반 정확한 답변</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  <span>Slack 에스컬레이션</span>
                </div>
              </div>
            </div>
            {/* Right: Chat preview mockup */}
            <div className="hidden lg:block">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-gray-200 p-1 shadow-2xl">
                <div className="bg-white rounded-xl overflow-hidden">
                  {/* Mock chat header */}
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 flex items-center space-x-2">
                    <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-bold">Anybridge</div>
                      <div className="text-xs text-white/70 flex items-center space-x-1">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                        <span>온라인</span>
                      </div>
                    </div>
                  </div>
                  {/* Mock messages */}
                  <div className="p-4 space-y-3 bg-gray-50 h-64">
                    <div className="flex justify-end">
                      <div className="bg-blue-600 text-white text-sm px-3 py-2 rounded-lg max-w-[70%]">카티아 환경에서 비가시성 워터마크 적용하고 싶습니다</div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-white text-gray-800 text-sm px-3 py-2 rounded-lg shadow-sm max-w-[80%] border border-gray-100">
                        <p className="font-semibold text-blue-700 text-xs mb-1">🤖 AI 답변</p>
                        <p>카티아 환경에서 비가시성 워터마크는 두 가지 방식으로 적용 가능합니다:</p>
                        <p className="mt-1"><strong>1. Print TRACER</strong> — 출력물 추적</p>
                        <p><strong>2. Screen TRACER</strong> — 화면 캡처 추적</p>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="bg-blue-600 text-white text-sm px-3 py-2 rounded-lg">구축 기간은 어느 정도인가요?</div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-gray-200 text-gray-500 text-sm px-3 py-2 rounded-lg animate-pulse">AI가 답변을 작성하고 있습니다...</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">주요 제품</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* DRM */}
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">DRM</h3>
              <p className="text-gray-600 mb-4">강력한 디지털 저작권 관리 솔루션으로 콘텐츠를 안전하게 보호합니다.</p>
              <a href="#" className="text-markany-blue font-semibold hover:underline">자세히 보기 →</a>
            </div>

            {/* Document SAFER */}
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Document SAFER</h3>
              <p className="text-gray-600 mb-4">기업 문서를 안전하게 관리하고 유출을 방지하는 통합 문서 보안 솔루션입니다.</p>
              <a href="#" className="text-markany-blue font-semibold hover:underline">자세히 보기 →</a>
            </div>

            {/* Print TRACER — 출력물 비가시성 워터마크 기반 유출 추적 솔루션 */}
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9V2h12v7" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 14h12v8H6z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Print TRACER</h3>
              <p className="text-gray-600 mb-4">출력물에 비가시성 워터마크를 삽입하여 유출 경로를 추적하는 솔루션입니다.</p>
              <a href="#" className="text-markany-blue font-semibold hover:underline">자세히 보기 →</a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section — AI-specific metrics */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">신뢰받는 파트너</h2>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">500+</div>
              <div className="text-gray-600">보안 기술 문서</div>
            </div>
            <div>
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">28</div>
              <div className="text-gray-600">제품 라인업</div>
            </div>
            <div>
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">&lt; 10초</div>
              <div className="text-gray-600">AI 평균 응답</div>
            </div>
            <div>
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">24/7</div>
              <div className="text-gray-600">무중단 상담</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold mb-4">MarkAny</div>
              <p className="text-gray-400">디지털 보안의 새로운 기준</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">제품</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">DRM</a></li>
                <li><a href="#" className="hover:text-white transition">Document SAFER</a></li>
                <li><a href="#" className="hover:text-white transition">Print TRACER</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">지원</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">고객센터</a></li>
                <li><a href="#" className="hover:text-white transition">기술문서</a></li>
                <li><a href="#" className="hover:text-white transition">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">회사</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">회사소개</a></li>
                <li><a href="#" className="hover:text-white transition">채용</a></li>
                <li><a href="#" className="hover:text-white transition">문의</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2026 MarkAny. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Homepage
