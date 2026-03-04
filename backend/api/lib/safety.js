// AI Safety Middleware — ANY Bridge 프리세일즈 챗봇
// 프롬프트 인젝션 방어, PII 마스킹, 신뢰도 평가, 헌법적 AI 검증
// ─────────────────────────────────────────────────────

// ══════════════════════════════════════════════════════
// 1. 프롬프트 인젝션 탐지 패턴 (한/영 듀얼 레이어)
// ══════════════════════════════════════════════════════
const INJECTION_PATTERNS = [
  // ── English patterns ──
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /ignore\s+(all\s+)?above/i,
  /disregard\s+(all\s+)?(previous|prior|above)/i,
  /forget\s+(all\s+)?(previous|prior|your)\s+(instructions|rules|context)/i,
  /you\s+are\s+now\s+a/i,
  /act\s+as\s+(a\s+)?different/i,
  /new\s+system\s+prompt/i,
  /override\s+(system|safety|your)/i,
  /reveal\s+(your|the)\s+(system|internal|hidden)\s+prompt/i,
  /what\s+(is|are)\s+your\s+(system|initial)\s+(prompt|instructions)/i,
  /\bsystem\s*:\s*/i,
  /\bassistant\s*:\s*/i,
  /```\s*(system|prompt)/i,
  /\[INST\]/i,
  /<\|im_start\|>/i,
  /do\s+anything\s+now/i,
  /DAN\s+mode/i,
  /jailbreak/i,
  /bypass\s+(filter|safety|restriction)/i,
  /pretend\s+(you\s+)?(are|have)\s+no\s+(rules|restrictions)/i,
  // ── Korean patterns ──
  /이전\s*(의\s*)?(지시|명령|규칙|프롬프트).*무시/,
  /시스템\s*프롬프트/,
  /너는?\s*이제\s*부터/,
  /역할을?\s*바꿔/,
  /모든\s*규칙.*무시/,
  /내부\s*지침.*알려/,
  /탈옥/,
  /프롬프트\s*인젝션/,
  /지시\s*사항.*변경/,
  /안전\s*장치.*해제/,
  /제한\s*없이\s*답변/,
  /필터.*우회/,
]

const MAX_INPUT_LENGTH = 500

// 위험한 특수문자 패턴 (제어 문자, 유니코드 트릭)
const DANGEROUS_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F\u200B-\u200F\u2028-\u202F\uFEFF]/g

// ══════════════════════════════════════════════════════
// 2. PII 탐지 & 마스킹 규칙
// ══════════════════════════════════════════════════════
const PII_RULES = [
  {
    name: '전화번호',
    pattern: /01[016789]-?\d{3,4}-?\d{4}/g,
    replacer: (match) => {
      const digits = match.replace(/-/g, '')
      const prefix = digits.slice(0, 3)
      return `${prefix}-****-****`
    },
  },
  {
    name: '이메일',
    pattern: /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    replacer: (match, local, domain) => {
      const masked = local.charAt(0) + '***'
      return `${masked}@${domain}`
    },
  },
  {
    name: '주민등록번호',
    pattern: /(\d{6})-?([1-4]\d{6})/g,
    replacer: (match, front) => `${front}-*******`,
  },
  {
    name: '카드번호',
    pattern: /(\d{4})[-\s]?(\d{4})[-\s]?(\d{4})[-\s]?(\d{4})/g,
    replacer: (match, g1) => `${g1}-****-****-****`,
  },
]


// ══════════════════════════════════════════════════════
// 3. 헌법적 AI 원칙 (Constitutional AI Principles)
// ══════════════════════════════════════════════════════
const CONSTITUTIONAL_PRINCIPLES = [
  {
    id: 'no_competitor_bashing',
    name: '경쟁사 비방 금지',
    patterns: [
      /경쟁사.*보다\s*(나쁘|열등|부족|느리|불안정)/,
      /경쟁사.*단점/,
      /(파수|소프트캠프|시큐어소프트|핵클|패스워드).*보다\s*(못|나쁘|열등)/,
      /(파수|소프트캠프|시큐어소프트).*문제/,
      /타사\s*(제품|솔루션).*결함/,
      /competitor.*worse|inferior|lacks/i,
    ],
  },
  {
    id: 'no_direct_pricing',
    name: '가격 정보 직접 제공 금지',
    patterns: [
      /가격은?\s*\d+/,
      /\d+\s*(만\s*)?원/,
      /비용은?\s*약?\s*\d+/,
      /라이선스\s*당\s*\d+/,
      /\$\s*\d+/,
      /할인.*\d+\s*%/,
      /특별\s*가격/,
    ],
  },
  {
    id: 'no_unverified_claims',
    name: '확인되지 않은 정보 제공 금지',
    patterns: [
      /100%\s*(보장|안전|확실)/,
      /절대(로)?\s*(안전|문제\s*없)/,
      /완벽(하게|한)\s*(보안|보호|방어)/,
      /해킹.*불가능/,
      /무조건\s*(보장|안전)/,
      /guaranteed\s+100%/i,
      /약속\s*(합니다|드립니다|드릴게요)/,
      /무료로?\s*(제공|드리|해드)/,
      /계약.*보장|납기.*확약/,
    ],
  },
]

// ══════════════════════════════════════════════════════
// 4. 차단 입력 패턴 (기존 호환)
// ══════════════════════════════════════════════════════
const BLOCKED_INPUT_PATTERNS = [
  { pattern: /경쟁사.*비교.*나쁜|경쟁사.*깎아/i, reason: '경쟁사 비방 유도 요청은 처리할 수 없습니다.' },
  { pattern: /(정확한|구체적인)?\s*가격.*알려|견적.*뽑아|얼마.*인가요/i, reason: '가격 정보는 담당 영업팀을 통해 안내드립니다. 연결해 드릴까요?' },
  { pattern: /내부\s*(문서|자료|코드|소스).*유출|기밀.*공개/i, reason: '내부 기밀 정보 요청은 처리할 수 없습니다.' },
]

// ══════════════════════════════════════════════════════
// 5. 마크애니 제품 키워드 (신뢰도 평가용)
// ══════════════════════════════════════════════════════
const PRODUCT_KEYWORDS = [
  'Document SAFER', 'document safer', '문서 보안', '문서보안',
  'DRM', '디지털 저작권', '저작권 관리',
  'SafeCopy', '출력물 보안', '워터마크',
  'ContentSAFER', '콘텐츠 보안',
  'CC인증', 'GS인증', 'KCMVP', 'EAL2',
  '마크애니', 'MarkAny',
  '윈도우 11', 'Windows 11',
  'API', 'SDK', 'REST', 'SOAP',
  '오프라인', '모바일',
  'SK하이닉스', '삼성전자', 'LG전자',
  '국방부', '행정안전부', '방위사업청',
  '정책기능서', '감사 로그', '추적',
]

// ══════════════════════════════════════════════════════
// FUNCTION 1: sanitizeInput — 듀얼 레이어 프롬프트 인젝션 방어
// ══════════════════════════════════════════════════════
export function sanitizeInput(text) {
  if (!text || typeof text !== 'string') {
    return { safe: false, sanitized: '', blocked: true, reason: '유효하지 않은 입력입니다.' }
  }

  const trimmed = text.trim()

  // Layer 1: Regex 기반 인젝션 패턴 탐지
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      securityLog('injection_blocked', { input: trimmed.slice(0, 80), pattern: pattern.source })
      return {
        safe: false,
        sanitized: '',
        blocked: true,
        reason: '보안 정책에 의해 차단된 요청입니다.',
      }
    }
  }

  // Layer 2: 길이 제한 + 특수문자 제거
  let sanitized = trimmed.slice(0, MAX_INPUT_LENGTH)
  sanitized = sanitized.replace(DANGEROUS_CHARS, '')

  // 과도한 반복 문자 축소 (DoS 방지)
  sanitized = sanitized.replace(/(.)\1{20,}/g, '$1$1$1')

  return { safe: true, sanitized, blocked: false }
}

// ══════════════════════════════════════════════════════
// FUNCTION 2: maskPII — 개인정보 마스킹
// ══════════════════════════════════════════════════════
export function maskPII(text) {
  if (!text || typeof text !== 'string') return text || ''

  let masked = text
  for (const rule of PII_RULES) {
    // Reset regex state before each use
    rule.pattern.lastIndex = 0
    if (rule.pattern.test(masked)) {
      rule.pattern.lastIndex = 0
      masked = masked.replace(rule.pattern, rule.replacer)
      securityLog('pii_masked', { type: rule.name })
    }
  }
  return masked
}


// ══════════════════════════════════════════════════════
// FUNCTION 3: evaluateConfidence — 3단계 신뢰도 평가
// ══════════════════════════════════════════════════════
export function evaluateConfidence(question, answer, knowledgeBase = '') {
  const q = (question || '').toLowerCase()
  const a = (answer || '').toLowerCase()
  const kb = (knowledgeBase || '').toLowerCase()

  // 지식 베이스 + 질문/답변에서 키워드 매칭 수 계산
  let kbMatchCount = 0
  let qaMatchCount = 0

  for (const keyword of PRODUCT_KEYWORDS) {
    const kw = keyword.toLowerCase()
    const inQuestion = q.includes(kw)
    const inAnswer = a.includes(kw)
    const inKB = kb.includes(kw)

    if (inQuestion || inAnswer) qaMatchCount++
    if (inKB && (inQuestion || inAnswer)) kbMatchCount++
  }

  // 답변이 지식 베이스 내용과 직접 매칭되는지 확인
  const answerSentences = a.split(/[.!?。]\s*/).filter(s => s.length > 5)
  let directMatchRatio = 0
  if (kb && answerSentences.length > 0) {
    const matched = answerSentences.filter(sentence => {
      const words = sentence.split(/\s+/).filter(w => w.length > 1)
      const matchedWords = words.filter(w => kb.includes(w))
      return matchedWords.length / Math.max(words.length, 1) > 0.4
    })
    directMatchRatio = matched.length / answerSentences.length
  }

  // 점수 계산
  let score = 35 // 기본 점수

  // 지식 베이스 직접 매칭 보너스
  score += Math.min(kbMatchCount * 8, 30)

  // 질문-답변 키워드 매칭 보너스
  score += Math.min(qaMatchCount * 4, 16)

  // 직접 매칭 비율 보너스
  score += Math.floor(directMatchRatio * 15)

  // 점수 범위 클램핑 및 레벨 결정
  score = Math.max(30, Math.min(95, score))

  if (score >= 80) {
    return { level: 'high', score, emoji: '🟢' }
  }
  if (score >= 55) {
    return { level: 'medium', score, emoji: '🟡' }
  }

  securityLog('low_confidence', { score, question: q.slice(0, 50) })
  return { level: 'low', score, emoji: '🔴' }
}

// ══════════════════════════════════════════════════════
// FUNCTION 4: constitutionalCheck — 헌법적 AI 검증 (경량, API 호출 없음)
// ══════════════════════════════════════════════════════
export function constitutionalCheck(answer) {
  if (!answer || typeof answer !== 'string') {
    return { passed: true, violations: [] }
  }

  const violations = []

  for (const principle of CONSTITUTIONAL_PRINCIPLES) {
    for (const pattern of principle.patterns) {
      if (pattern.test(answer)) {
        violations.push(principle.name)
        securityLog('constitutional_violation', {
          principle: principle.id,
          name: principle.name,
          snippet: answer.slice(0, 60),
        })
        break // 같은 원칙에서 중복 위반 방지
      }
    }
  }

  return {
    passed: violations.length === 0,
    violations,
  }
}

// ══════════════════════════════════════════════════════
// FUNCTION 5: validateResponse — 전체 파이프라인 검증
// ══════════════════════════════════════════════════════
export function validateResponse(question, answer) {
  const constitutional = constitutionalCheck(answer)
  const confidence = evaluateConfidence(question, answer)

  return {
    safe: constitutional.passed,
    confidence,
    constitutional,
    needsReview: !constitutional.passed || confidence.level === 'low',
    summary: constitutional.passed
      ? `${confidence.emoji} 신뢰도 ${confidence.level} (${confidence.score}점)`
      : `⚠️ 헌법 위반: ${constitutional.violations.join(', ')}`,
  }
}

// ══════════════════════════════════════════════════════
// FUNCTION 6: securityLog — 보안 이벤트 로깅
// ══════════════════════════════════════════════════════
export function securityLog(event, details = {}) {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    event,
    ...details,
  }
  console.log(`[Safety:${event}] ${timestamp}`, JSON.stringify(details))
  return logEntry
}

// ══════════════════════════════════════════════════════
// 기존 호환 함수: validateInput / validateOutput
// (chat.js에서 import하여 사용 중)
// ══════════════════════════════════════════════════════
export function validateInput(text) {
  // sanitizeInput 듀얼 레이어 실행
  const result = sanitizeInput(text)
  if (!result.safe) {
    return { safe: false, reason: result.reason, sanitized: '' }
  }

  // 차단 입력 패턴 체크
  for (const rule of BLOCKED_INPUT_PATTERNS) {
    if (rule.pattern.test(result.sanitized)) {
      return { safe: false, reason: rule.reason, sanitized: '' }
    }
  }

  // PII 마스킹 (차단이 아닌 마스킹 후 통과)
  const sanitized = maskPII(result.sanitized)

  return { safe: true, sanitized }
}

export function validateOutput(text) {
  if (!text || typeof text !== 'string') {
    return { safe: true, sanitized: '' }
  }

  // 헌법적 AI 검증으로 출력 안전성 체크
  const check = constitutionalCheck(text)
  if (!check.passed) {
    return {
      safe: false,
      reason: `헌법 위반: ${check.violations.join(', ')}`,
      sanitized: text,
    }
  }

  return { safe: true, sanitized: text }
}
