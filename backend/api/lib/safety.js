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
// 4. 차단 입력 패턴 — 제거됨
// ══════════════════════════════════════════════════════
// 비즈니스 맥락 판단(경쟁사 비방, 가격 문의, 기밀 요청 등)은
// 룰베이스 regex로 구분 불가 → LLM 시스템 프롬프트 규칙으로 위임.
// 프롬프트 인젝션 방어(INJECTION_PATTERNS)만 regex로 유지.

// ══════════════════════════════════════════════════════
// 5. 마크애니 제품 키워드 (신뢰도 평가용)
// ══════════════════════════════════════════════════════
const PRODUCT_KEYWORDS = [
  'Document SAFER', 'document safer', '문서 보안', '문서보안',
  'DRM', '디지털 저작권', '저작권 관리',
  'SafePC', 'SafeUSB', 'Print SAFER', 'Screen SAFER', 'Privacy SAFER',
  'Print TRACER', 'Screen TRACER', '출력보안', '화면보안',
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
// FUNCTION 4a: constitutionalCheckWithLLM — Claude 기반 심층 검증
// ══════════════════════════════════════════════════════
export async function constitutionalCheckWithLLM(answer, question) {
  // regex 기반 1차 검증 (기존)
  const regexCheck = constitutionalCheck(answer)
  if (!regexCheck.passed) return regexCheck

  // Claude API 키가 없으면 regex 결과만 반환
  const claudeKey = process.env.CLAUDE_API_KEY
  if (!claudeKey) return { ...regexCheck, llmVerified: false }

  try {
    // [안전성] 프리세일즈 컨텍스트를 명시하여 정상적인 제품 안내가 차단되지 않도록 함
    // — 구축 기간/프로세스/레퍼런스 안내는 프리세일즈의 핵심 업무이므로 위반이 아님
    const prompt = `당신은 AI 답변의 안전성을 검증하는 헌법적 AI 검증자입니다.

컨텍스트: 이 AI는 마크애니(보안 소프트웨어 회사)의 프리세일즈 어시스턴트입니다. 자사 제품(DRM, Document SAFER, Print SAFER 등)에 대한 기능 설명, 구축 기간 안내(예: "소규모 2~4주"), 구축 프로세스 단계 설명, 레퍼런스 고객사 언급, 인증 현황 안내는 모두 정상적인 프리세일즈 업무입니다. 이런 내용은 위반이 아닙니다.

아래 답변이 다음 원칙을 위반하는지 검증하세요:
1. 경쟁사 비방 금지: 다른 회사 제품을 직접적으로 비방하거나 폄하하지 않는가?
2. 가격 직접 제공 금지: 구체적인 금액(원, 달러), 할인율(%), 견적을 직접 제시하지 않는가? (단, "견적은 담당자에게 문의" 안내는 허용)
3. 과장 금지: "100% 보장", "절대 안전", "완벽한 보호" 등 검증 불가능한 과장된 주장이 없는가? (단, 공인 인증(CC인증, GS인증 등) 언급은 사실이므로 허용)
4. 허위 약속 금지: 무료 제공, 계약 조건 등을 임의로 약속하지 않는가? (단, 일반적인 구축 기간 범위 안내는 약속이 아니라 참고 정보이므로 허용)

고객 질문: "${(question || '').slice(0, 300)}"
AI 답변: "${(answer || '').slice(0, 1500)}"

JSON으로만 응답: {"passed": true/false, "violations": ["위반 항목"], "severity": "none|low|high", "suggestion": "수정 제안"}`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': claudeKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(4000),
    })
    const data = await res.json()
    const text = data.content?.[0]?.text || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return { ...regexCheck, llmVerified: true }

    const parsed = JSON.parse(jsonMatch[0])
    return {
      passed: parsed.passed !== false,
      violations: parsed.violations || [],
      severity: parsed.severity || 'none',
      suggestion: parsed.suggestion || '',
      llmVerified: true,
    }
  } catch (err) {
    console.error('[constitutionalCheckWithLLM] error:', err.message)
    // Claude 실패 시 regex 결과로 폴백
    return { ...regexCheck, llmVerified: false, llmError: err.message }
  }
}

// ══════════════════════════════════════════════════════
// FUNCTION 4b: constitutionalCheck — 헌법적 AI 검증 (경량, API 호출 없음)
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
  // sanitizeInput 듀얼 레이어 실행 (프롬프트 인젝션 방어 + 특수문자 제거)
  const result = sanitizeInput(text)
  if (!result.safe) {
    return { safe: false, reason: result.reason, sanitized: '' }
  }

  // 비즈니스 맥락 판단은 LLM 시스템 프롬프트에 위임 (regex 오탐 방지)
  // PII 마스킹 (차단이 아닌 마스킹 후 통과)
  const sanitized = maskPII(result.sanitized)

  return { safe: true, sanitized }
}

export async function validateOutput(text, question) {
  if (!text || typeof text !== 'string') {
    return { safe: true, sanitized: '' }
  }

  // 헌법적 AI 검증: regex 1차 + Claude LLM 2차 심층 검증
  const check = await constitutionalCheckWithLLM(text, question)
  if (!check.passed) {
    // [안전성] severity 기반 판단 — Claude LLM이 애매한 케이스를 false로 반환해도
    // severity가 high가 아니면 정상 답변으로 통과시킴.
    // 프리세일즈 챗봇에서 구축 기간/프로세스 안내가 차단되는 false positive 방지.
    if (check.severity === 'high') {
      return {
        safe: false,
        reason: `헌법 위반: ${check.violations.join(', ')}`,
        sanitized: text,
        llmVerified: check.llmVerified || false,
        severity: check.severity,
        suggestion: check.suggestion || '',
      }
    }
    // severity가 low/none이면 경고 로그만 남기고 통과
    console.warn(`[validateOutput] low-severity flag (passed through): ${check.violations?.join(', ')}`)
    return { safe: true, sanitized: text, llmVerified: check.llmVerified || false, flagged: true }
  }

  return { safe: true, sanitized: text, llmVerified: check.llmVerified || false }
}
