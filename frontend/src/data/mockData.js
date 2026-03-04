export const mockScenarios = {
  skhynix: {
    customerInfo: {
      id: 'skhynix',
      name: 'SK하이닉스',
      product: 'Document SAFER',
      version: 'v3.1',
      license: '1,000 User',
      history: [
        { date: '2025-02-10', question: '윈도우 11 호환성 문의' },
        { date: '2025-01-25', question: 'PDF 암호화 오류 해결' },
        { date: '2025-01-15', question: '대량 파일 처리 속도 개선 요청' }
      ],
      aiInsight: '이 고객은 성능 최적화와 윈도우 11 호환성에 관심이 높습니다.',
      references: [
        '릴리스 노트 v3.2',
        '과거 문의 #2025-02-10',
        '성능 최적화 가이드'
      ]
    },
    responses: [
      'Document SAFER v3.2에서 대량 파일 처리 속도가 30% 개선되었습니다. SK하이닉스님께서 2월에 문의하신 성능 이슈가 해결되었습니다 ✅',
      '업그레이드 시 약 30분의 다운타임이 소요됩니다. 야간 작업을 권장드립니다.',
      'v3.2는 윈도우 11을 완벽하게 지원합니다. 과거 호환성 문제가 모두 해결되었습니다.',
      '라이선스 비용은 기존 계약 기준으로 20% 할인이 적용됩니다.',
      '백업은 자동으로 진행되며, 롤백 기능도 제공됩니다.',
      '업그레이드 후 1시간 교육 세션을 제공해 드립니다.',
      '삼성전자, LG전자 등 반도체 업계에서 이미 v3.2를 사용 중입니다.',
      '기술 지원은 24/7 제공되며, 전담 엔지니어가 배정됩니다.',
      '업그레이드 일정은 귀사 일정에 맞춰 조율 가능합니다.',
      '추가 문의사항이 있으시면 언제든 말씀해 주세요.'
    ]
  },
  
  defense: {
    customerInfo: {
      id: 'defense',
      name: '국방부',
      product: 'DRM',
      version: 'v2.8',
      license: '500 User',
      history: [
        { date: '2025-02-01', question: '보안 인증 관련 문의' },
        { date: '2025-01-20', question: '맞춤형 구축 가능성' },
        { date: '2025-01-10', question: '기존 시스템 연동 방안' }
      ],
      aiInsight: '이 고객은 보안 인증과 맞춤형 구축에 높은 관심을 보입니다.',
      references: [
        '정책기능서 v3.2',
        'CC인증서',
        'GS인증서',
        '국방부 프로젝트 사례'
      ]
    },
    responses: [
      '네, 국방부 맞춤형 DRM 구축이 가능합니다. ✅ 윈도우 11 호환: 지원됩니다 (정책기능서 v3.2 참조). ✅ 보안 인증: CC인증, GS인증 보유',
      '상세한 구축 방안과 견적은 전문 담당자가 직접 안내해 드리겠습니다.',
      '기존 국방부 프로젝트 경험을 바탕으로 보안 요구사항에 맞춰 제안서를 준비하겠습니다.'
    ]
  }
}

export const mockAgents = [
  { name: '채소희', role: '고객센터', avatar: '👩‍💼', email: 'chosh@markany.com', phone: '010-1234-5678', team: 'MCG-PartnerSuccess' },
  { name: '송인찬', role: '어카운트 매니저', avatar: '👨‍💼', email: 'songic@markany.com', phone: '010-9876-5432', team: 'MCG-Sales' },
  { name: '이현진', role: 'SE', avatar: '👨‍💻', email: 'leehj2@markany.com', phone: '010-2954-5227', team: 'MCG-PartnerSuccess' },
  { name: '박우호', role: '개발리더', avatar: '👨‍🔧', email: 'parkwh@markany.com', phone: '010-5555-7777', team: 'ES사업부-제품개발' }
]

// 에스컬레이션 후 추가 질의 데이터 (국방부 시나리오)
// 각 질문은 분해 → 담당자 배정 → 15초 후 답변 플로우를 따름
export const defenseFollowUpQuestions = [
  {
    question: '구축 기간은 얼마나 걸리나요? 그리고 비용은 어느 정도인가요?',
    decomposition: [
      { subQuestion: '구축 기간', assignee: '송인찬', role: '어카운트 매니저', avatar: '👨‍💼' },
      { subQuestion: '구축 비용', assignee: '송인찬', role: '어카운트 매니저', avatar: '👨‍💼' }
    ],
    answers: [
      { agent: '송인찬', role: '어카운트 매니저', avatar: '👨‍💼', text: '국방부 규모 기준으로 구축 기간은 약 3~4개월 소요됩니다. 1단계 설계(1개월), 2단계 구축(2개월), 3단계 안정화(1개월)로 진행됩니다.\n\n비용은 500 User 기준 초기 구축비 + 연간 유지보수비로 구성되며, 상세 견적서를 별도로 전달드리겠습니다. 📋' }
    ]
  },
  {
    question: '기존 국방부 내부 시스템과 연동이 가능한가요?',
    decomposition: [
      { subQuestion: '기존 시스템 연동 가능성', assignee: '이현진', role: 'SE', avatar: '👨‍💻' },
      { subQuestion: '연동 기술 방식', assignee: '박우호', role: '개발리더', avatar: '👨‍🔧' }
    ],
    answers: [
      { agent: '이현진', role: 'SE', avatar: '👨‍💻', text: '네, 기존 시스템과의 연동은 충분히 가능합니다. 저희 DRM은 표준 API(REST, SOAP)를 제공하고 있어서 대부분의 시스템과 호환됩니다. 국방부 내부 문서관리시스템(DMS)과의 연동 경험도 있습니다. 🔧' },
      { agent: '박우호', role: '개발리더', avatar: '👨‍🔧', text: '기술적으로 말씀드리면, SDK 방식과 API 방식 두 가지를 제공합니다. 국방부 보안 환경에서는 SDK 방식을 권장드리며, 커스텀 연동 모듈도 개발 가능합니다. 🛡️' }
    ]
  },
  {
    question: '보안 등급은 어떻게 되나요? 군사 기밀 문서도 처리 가능한가요?',
    decomposition: [
      { subQuestion: '보안 등급 및 인증 현황', assignee: '박우호', role: '개발리더', avatar: '👨‍🔧' },
      { subQuestion: '군사 기밀 문서 처리', assignee: '이현진', role: 'SE', avatar: '👨‍💻' }
    ],
    answers: [
      { agent: '박우호', role: '개발리더', avatar: '👨‍🔧', text: '현재 CC인증(EAL2+), GS인증(1등급)을 보유하고 있습니다. 국가정보원 보안적합성 검증도 통과한 제품입니다. 군사 기밀 등급 문서 처리를 위한 암호화 모듈은 KCMVP 인증을 받았습니다. 🛡️' },
      { agent: '이현진', role: 'SE', avatar: '👨‍💻', text: '군사 기밀 문서의 경우, 문서 등급별 접근 제어(비밀, 대외비, 일반)를 세분화하여 설정할 수 있습니다. 문서 열람/편집/출력/복사 각각에 대해 권한을 개별 설정 가능합니다. 🔧' }
    ]
  },
  {
    question: '오프라인 환경에서도 DRM이 작동하나요?',
    decomposition: [
      { subQuestion: '오프라인 환경 지원', assignee: '이현진', role: 'SE', avatar: '👨‍💻' }
    ],
    answers: [
      { agent: '이현진', role: 'SE', avatar: '👨‍💻', text: '네, 오프라인 환경을 완벽하게 지원합니다. 오프라인 모드에서는 로컬 캐시 기반으로 권한을 관리하며, 네트워크 복구 시 자동으로 서버와 동기화됩니다.\n\n국방부처럼 폐쇄망 환경에서는 온프레미스 서버를 별도 구축하여 완전한 독립 운영이 가능합니다. 🔧' }
    ]
  },
  {
    question: '사용자 교육은 어떻게 진행되나요? 교육 자료도 제공되나요?',
    decomposition: [
      { subQuestion: '사용자 교육 방식', assignee: '송인찬', role: '어카운트 매니저', avatar: '👨‍💼' },
      { subQuestion: '교육 자료 제공', assignee: '송인찬', role: '어카운트 매니저', avatar: '👨‍💼' }
    ],
    answers: [
      { agent: '송인찬', role: '어카운트 매니저', avatar: '👨‍💼', text: '교육은 3단계로 진행됩니다.\n\n1️⃣ 관리자 교육 (2일): 시스템 운영 및 정책 설정\n2️⃣ 일반 사용자 교육 (1일): 기본 사용법\n3️⃣ 보안 담당자 교육 (1일): 보안 정책 관리\n\n교육 자료(매뉴얼, 동영상, FAQ)는 모두 제공되며, 국방부 보안 환경에 맞춰 커스터마이징된 자료를 준비해 드립니다. 📚' }
    ]
  },
  {
    question: '장애 발생 시 대응 체계는 어떻게 되나요?',
    decomposition: [
      { subQuestion: '장애 대응 체계', assignee: '이현진', role: 'SE', avatar: '👨‍💻' },
      { subQuestion: '기술 지원 SLA', assignee: '송인찬', role: '어카운트 매니저', avatar: '👨‍💼' }
    ],
    answers: [
      { agent: '이현진', role: 'SE', avatar: '👨‍💻', text: '장애 대응은 3단계 에스컬레이션 체계로 운영됩니다.\n\n🟢 1단계: 원격 지원 (30분 내 초기 대응)\n🟡 2단계: 현장 출동 (4시간 내)\n🔴 3단계: 긴급 패치 배포 (24시간 내)\n\n국방부 전용 핫라인도 별도 운영됩니다. 🔧' },
      { agent: '송인찬', role: '어카운트 매니저', avatar: '👨‍💼', text: 'SLA는 가용성 99.9%를 보장하며, 장애 등급별 대응 시간이 계약서에 명시됩니다. 전담 엔지니어 1명이 상시 배정되어 국방부만 전담합니다. 📋' }
    ]
  },
  {
    question: '다른 정부기관에서도 사용 중인 사례가 있나요?',
    decomposition: [
      { subQuestion: '정부기관 레퍼런스', assignee: '송인찬', role: '어카운트 매니저', avatar: '👨‍💼' }
    ],
    answers: [
      { agent: '송인찬', role: '어카운트 매니저', avatar: '👨‍💼', text: '네, 다수의 정부기관에서 사용 중입니다.\n\n✅ 행정안전부 - 전자문서 DRM (3,000 User)\n✅ 방위사업청 - 방산 문서 보안 (1,500 User)\n✅ 국가정보원 - 기밀문서 관리 (비공개)\n✅ 해군본부 - 함정 기술문서 보안 (800 User)\n\n국방부와 유사한 보안 요구사항을 가진 기관들의 성공 사례를 별도 자료로 준비해 드리겠습니다. 📋' }
    ]
  },
  {
    question: '문서 추적 기능이 있나요? 누가 언제 열람했는지 확인하고 싶습니다.',
    decomposition: [
      { subQuestion: '문서 추적 및 감사 로그', assignee: '박우호', role: '개발리더', avatar: '👨‍🔧' }
    ],
    answers: [
      { agent: '박우호', role: '개발리더', avatar: '👨‍🔧', text: '문서 추적 기능은 저희 DRM의 핵심 기능 중 하나입니다.\n\n📊 추적 가능 항목:\n- 문서 열람 이력 (누가, 언제, 어디서)\n- 편집/인쇄/복사 이력\n- 권한 변경 이력\n- 비정상 접근 시도 탐지\n\n대시보드에서 실시간 모니터링이 가능하며, 정기 보고서도 자동 생성됩니다. 감사 로그는 법적 증거로도 활용 가능합니다. 🛡️' }
    ]
  },
  {
    question: '모바일에서도 DRM 문서를 열 수 있나요? 태블릿도 지원되나요?',
    decomposition: [
      { subQuestion: '모바일/태블릿 지원', assignee: '이현진', role: 'SE', avatar: '👨‍💻' }
    ],
    answers: [
      { agent: '이현진', role: 'SE', avatar: '👨‍💻', text: '모바일 및 태블릿 지원됩니다.\n\n📱 지원 환경:\n- iOS (iPhone/iPad): 전용 뷰어 앱 제공\n- Android: 전용 뷰어 앱 제공\n- Windows 태블릿: 데스크톱 버전과 동일\n\n다만 국방부 보안 환경에서는 MDM(모바일 기기 관리)과 연동하여 승인된 기기에서만 접근 가능하도록 설정하는 것을 권장드립니다. 🔧' }
    ]
  },
  {
    question: '계약 진행 절차와 다음 단계가 궁금합니다.',
    decomposition: [
      { subQuestion: '계약 진행 절차', assignee: '송인찬', role: '어카운트 매니저', avatar: '👨‍💼' },
      { subQuestion: '다음 단계 안내', assignee: '채소희', role: '고객센터', avatar: '👩‍💼' }
    ],
    answers: [
      { agent: '송인찬', role: '어카운트 매니저', avatar: '👨‍💼', text: '계약 진행은 다음과 같습니다.\n\n1️⃣ 요구사항 확인 미팅 (1주 내)\n2️⃣ 기술 검토 및 PoC (2주)\n3️⃣ 제안서 및 견적서 제출\n4️⃣ 계약 체결\n5️⃣ 구축 착수\n\n다음 주 중으로 요구사항 확인 미팅을 잡아드릴까요? 📋' },
      { agent: '채소희', role: '고객센터', avatar: '👩‍💼', text: '오늘 상담 내용을 정리하여 이메일로 발송해 드리겠습니다.\n미팅 일정 조율이 필요하시면 저에게 말씀해 주세요.\n\n오늘 긴 시간 상담해 주셔서 감사합니다! 😊\n추가 궁금하신 점은 언제든 연락 주세요. 🙏' }
    ]
  }
]
