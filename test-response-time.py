#!/usr/bin/env python3
"""ANY 브릿지 응답 시간 측정 스크립트"""
import json, time, urllib.request, os
from datetime import datetime

API_URL = "https://hackerton-kappa.vercel.app/api/chat"
LOG_FILE = os.path.join(os.path.dirname(__file__), "docs", "response_time_log.md")

SCENARIOS = [
    {
        "name": "인사",
        "payload": {"message": "안녕하세요", "conversationHistory": []},
    },
    {
        "name": "단순 제품 질문",
        "payload": {"message": "DRM이 뭐예요?", "conversationHistory": []},
    },
    {
        "name": "도입 검토",
        "payload": {"message": "drm 300유저 도입을 검토중입니다.", "conversationHistory": []},
    },
    {
        "name": "후속 구체화",
        "payload": {
            "message": "msoffice hwp pdf를 생각하고 있고, 내부문서정보를 외부 유출을 차단하고 싶어요",
            "conversationHistory": [
                {"role": "user", "content": "drm 300유저 도입을 검토중입니다."},
                {"role": "assistant", "content": "마크애니 DRM은 300 사용자 규모의 중규모 도입에 해당하며, 4~8주의 구축 기간이 소요됩니다."},
            ],
        },
    },
    {
        "name": "복합 질문",
        "payload": {
            "message": "500명 규모 망분리 환경에서 DRM 도입하면서 그룹웨어 연동도 하고 싶은데 가능한가요?",
            "conversationHistory": [],
        },
    },
    {
        "name": "불만/추가설명 요구",
        "payload": {
            "message": "그래서 어쩌라는거죠?",
            "conversationHistory": [
                {"role": "user", "content": "drm 신규 도입하려고해요"},
                {"role": "assistant", "content": "마크애니 DRM은 25년 이상 국내 시장 점유율 1위를 유지하며 소규모 2~4주, 대규모 8~16주가 소요됩니다."},
            ],
        },
    },
    {
        "name": "가격 문의",
        "payload": {"message": "DRM 300유저 기준으로 견적 좀 알려주세요", "conversationHistory": []},
    },
]


def call_api(payload):
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        API_URL,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    start = time.time()
    with urllib.request.urlopen(req, timeout=60) as resp:
        raw = resp.read().decode("utf-8")
    elapsed = time.time() - start
    data = json.loads(raw)
    return elapsed, data


def main():
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    lines = [
        "# ANY 브릿지 응답 시간 측정 로그\n",
        f"측정 시각: {ts}  ",
        f"API: {API_URL}\n",
        "| # | 시나리오 | 복잡도 | 모델 | 응답시간(초) | 에스컬레이션 | 답변 요약 |",
        "|---|---------|--------|------|-------------|-------------|----------|",
    ]

    for i, sc in enumerate(SCENARIOS, 1):
        name = sc["name"]
        print(f"[{i}/{len(SCENARIOS)}] {name} ...", end=" ", flush=True)
        try:
            elapsed, resp = call_api(sc["payload"])
            d = resp["data"]
            model = d.get("model", "N/A")
            complexity = d.get("complexity", "N/A")
            esc = "✅" if d.get("needsEscalation") else "❌"
            answer = d.get("answer", "").replace("|", "/").replace("\n", " ")
            summary = answer[:80] + "..." if len(answer) > 80 else answer
            lines.append(f"| {i} | {name} | {complexity} | {model} | {elapsed:.2f} | {esc} | {summary} |")
            print(f"{elapsed:.2f}s ({model})")
        except Exception as e:
            lines.append(f"| {i} | {name} | ERROR | ERROR | - | - | {str(e)[:60]} |")
            print(f"ERROR: {e}")

    # 요약 통계
    lines.append("")
    lines.append("## 요약")
    lines.append("")
    lines.append(f"- 총 시나리오: {len(SCENARIOS)}개")
    lines.append(f"- 측정 환경: Vercel Serverless (프로덕션)")
    lines.append(f"- 참고: 응답시간은 네트워크 왕복 + LLM 추론 + RAG 검색 포함")

    with open(LOG_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

    print(f"\n결과 저장: {LOG_FILE}")


if __name__ == "__main__":
    main()
