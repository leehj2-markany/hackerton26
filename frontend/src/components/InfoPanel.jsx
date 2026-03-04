const InfoPanel = ({ customerInfo }) => {
  if (!customerInfo) return null

  const satisfactionColor = (score) => {
    if (score >= 4.5) return 'text-green-600'
    if (score >= 3.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const stageColor = (stage) => {
    const map = { '탐색': 'bg-gray-100 text-gray-700', '제안': 'bg-blue-100 text-blue-700', '협상': 'bg-yellow-100 text-yellow-700', '계약': 'bg-green-100 text-green-700' }
    return map[stage] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="fixed top-20 right-[490px] w-[350px] bg-white rounded-xl shadow-xl p-6 border border-gray-200 max-h-[calc(100vh-120px)] overflow-y-auto">
      {/* 고객 기본 정보 */}
      <div className="mb-5">
        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
          <svg className="w-5 h-5 mr-2 text-markany-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          고객 정보
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">회사명</span>
            <span className="font-semibold text-gray-900">{customerInfo.name}</span>
          </div>
          {customerInfo.industry && (
            <div className="flex justify-between">
              <span className="text-gray-500">산업</span>
              <span className="font-semibold text-gray-900">{customerInfo.industry}</span>
            </div>
          )}
          {customerInfo.accountType && (
            <div className="flex justify-between">
              <span className="text-gray-500">유형</span>
              <span className="px-2 py-0.5 bg-markany-light text-markany-blue rounded text-xs font-medium">{customerInfo.accountType}</span>
            </div>
          )}
          {customerInfo.billingCity && (
            <div className="flex justify-between">
              <span className="text-gray-500">소재지</span>
              <span className="font-semibold text-gray-900">{customerInfo.billingCity}</span>
            </div>
          )}
          {customerInfo.annualRevenue && (
            <div className="flex justify-between">
              <span className="text-gray-500">매출</span>
              <span className="font-semibold text-gray-900">{customerInfo.annualRevenue}</span>
            </div>
          )}
          {customerInfo.employees > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">임직원</span>
              <span className="font-semibold text-gray-900">{customerInfo.employees?.toLocaleString()}명</span>
            </div>
          )}
        </div>
      </div>

      {/* 제품 & 계약 */}
      <div className="mb-5">
        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
          <svg className="w-5 h-5 mr-2 text-markany-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          제품 & 계약
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">제품</span>
            <span className="font-semibold text-gray-900">{customerInfo.product}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">버전</span>
            <span className="font-semibold text-gray-900">{customerInfo.version}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">라이선스</span>
            <span className="font-semibold text-gray-900">{customerInfo.license}</span>
          </div>
          {customerInfo.deploymentDate && (
            <div className="flex justify-between">
              <span className="text-gray-500">도입일</span>
              <span className="font-semibold text-gray-900">{customerInfo.deploymentDate}</span>
            </div>
          )}
          {customerInfo.contractEndDate && (
            <div className="flex justify-between">
              <span className="text-gray-500">계약 만료</span>
              <span className="font-semibold text-red-600">{customerInfo.contractEndDate}</span>
            </div>
          )}
        </div>
      </div>

      {/* 담당자 & 만족도 */}
      <div className="mb-5">
        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
          <svg className="w-5 h-5 mr-2 text-markany-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          담당자
        </h3>
        <div className="space-y-2 text-sm">
          {customerInfo.salesManager && (
            <div className="flex justify-between items-center">
              <span className="text-gray-500">영업 담당</span>
              <span className="font-semibold text-gray-900">👨‍💼 {customerInfo.salesManager}</span>
            </div>
          )}
          {customerInfo.engineer && (
            <div className="flex justify-between items-center">
              <span className="text-gray-500">SE</span>
              <span className="font-semibold text-gray-900">👨‍💻 {customerInfo.engineer}</span>
            </div>
          )}
          {customerInfo.supportContact && (
            <div className="flex justify-between items-center">
              <span className="text-gray-500">고객센터</span>
              <span className="font-semibold text-gray-900">👩‍💼 {customerInfo.supportContact}</span>
            </div>
          )}
        </div>
        {customerInfo.satisfactionScore && (
          <div className="mt-3 bg-gray-50 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm text-gray-600">고객 만족도</span>
            <div className="flex items-center gap-1">
              <span className={`text-lg font-bold ${satisfactionColor(customerInfo.satisfactionScore)}`}>
                {customerInfo.satisfactionScore}
              </span>
              <span className="text-gray-400 text-sm">/ 5.0</span>
              <span className="ml-1">{'⭐'.repeat(Math.round(customerInfo.satisfactionScore))}</span>
            </div>
          </div>
        )}
      </div>

      {/* 영업 기회 (Opportunities) */}
      {customerInfo.opportunities?.length > 0 && (
        <div className="mb-5">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2 text-markany-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            영업 기회
          </h3>
          <div className="space-y-2">
            {customerInfo.opportunities.map((opp, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3 text-sm">
                <div className="font-semibold text-gray-900 mb-1">{opp.name}</div>
                <div className="flex items-center justify-between text-xs">
                  <span className={`px-2 py-0.5 rounded-full font-medium ${stageColor(opp.stage)}`}>{opp.stage}</span>
                  <span className="font-bold text-markany-blue">{opp.amount}</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">마감: {opp.closeDate}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 과거 이력 */}
      <div className="mb-5">
        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
          <svg className="w-5 h-5 mr-2 text-markany-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          과거 이력
        </h3>
        <div className="space-y-2">
          {customerInfo.history?.map((item, index) => (
            <div key={index} className="text-sm bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-400 text-xs">{item.date}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${item.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {item.status === 'resolved' ? '해결' : '진행중'}
                </span>
              </div>
              <div className="text-gray-900">{item.question}</div>
            </div>
          ))}
        </div>
      </div>

      {/* AI 분석 */}
      <div className="mb-5">
        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
          <svg className="w-5 h-5 mr-2 text-markany-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          AI 분석
        </h3>
        <div className="bg-blue-50 p-3 rounded-lg text-sm text-gray-700 leading-relaxed">
          {customerInfo.aiInsight}
        </div>
      </div>

      {/* 참조 문서 */}
      {customerInfo.references?.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2 text-markany-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            참조 문서
          </h3>
          <div className="space-y-1">
            {customerInfo.references.map((ref, index) => (
              <a key={index} href="#" className="block text-sm text-markany-blue hover:underline bg-gray-50 p-2 rounded">
                📄 {ref}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default InfoPanel
