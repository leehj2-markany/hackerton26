const Homepage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-markany-blue">
                MarkAny
              </div>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#" className="text-gray-700 hover:text-markany-blue transition">제품</a>
              <a href="#" className="text-gray-700 hover:text-markany-blue transition">솔루션</a>
              <a href="#" className="text-gray-700 hover:text-markany-blue transition">고객지원</a>
              <a href="#" className="text-gray-700 hover:text-markany-blue transition">회사소개</a>
              <a href="/dashboard" className="text-markany-blue font-semibold hover:text-markany-dark transition">📊 대시보드</a>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-700 hover:text-markany-blue transition">로그인</button>
              <button className="bg-markany-blue text-white px-4 py-2 rounded-lg hover:bg-markany-dark transition"
                onClick={() => window.dispatchEvent(new CustomEvent('openChatbot'))}
              >
                문의하기
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-markany-light to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              디지털 보안의 새로운 기준
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              마크애니는 20년 이상의 경험과 기술력으로 기업의 디지털 자산을 보호합니다.
              DRM, 워터마킹, 문서 보안 솔루션으로 안전한 디지털 환경을 만들어갑니다.
            </p>
            <div className="flex justify-center space-x-4">
              <button className="bg-markany-blue text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-markany-dark transition shadow-lg">
                제품 둘러보기
              </button>
              <button className="bg-white text-markany-blue px-8 py-3 rounded-lg text-lg font-semibold border-2 border-markany-blue hover:bg-markany-light transition"
                onClick={() => window.dispatchEvent(new CustomEvent('openChatbot'))}
              >
                무료 상담
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            주요 제품
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* DRM */}
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition border border-gray-100">
              <div className="w-16 h-16 bg-markany-blue rounded-lg flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">DRM</h3>
              <p className="text-gray-600 mb-4">
                강력한 디지털 저작권 관리 솔루션으로 콘텐츠를 안전하게 보호합니다.
              </p>
              <a href="#" className="text-markany-blue font-semibold hover:underline">
                자세히 보기 →
              </a>
            </div>

            {/* Document SAFER */}
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition border border-gray-100">
              <div className="w-16 h-16 bg-markany-blue rounded-lg flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Document SAFER</h3>
              <p className="text-gray-600 mb-4">
                기업 문서를 안전하게 관리하고 유출을 방지하는 통합 문서 보안 솔루션입니다.
              </p>
              <a href="#" className="text-markany-blue font-semibold hover:underline">
                자세히 보기 →
              </a>
            </div>

            {/* SafeCopy */}
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition border border-gray-100">
              <div className="w-16 h-16 bg-markany-blue rounded-lg flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">SafeCopy</h3>
              <p className="text-gray-600 mb-4">
                불법 복제를 방지하고 콘텐츠 배포를 안전하게 관리하는 솔루션입니다.
              </p>
              <a href="#" className="text-markany-blue font-semibold hover:underline">
                자세히 보기 →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            신뢰받는 파트너
          </h2>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-markany-blue mb-2">1,000+</div>
              <div className="text-gray-600">고객사</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-markany-blue mb-2">20+</div>
              <div className="text-gray-600">년 경험</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-markany-blue mb-2">99.9%</div>
              <div className="text-gray-600">가동률</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-markany-blue mb-2">24/7</div>
              <div className="text-gray-600">기술 지원</div>
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
              <p className="text-gray-400">
                디지털 보안의 새로운 기준
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">제품</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">DRM</a></li>
                <li><a href="#" className="hover:text-white transition">Document SAFER</a></li>
                <li><a href="#" className="hover:text-white transition">SafeCopy</a></li>
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
