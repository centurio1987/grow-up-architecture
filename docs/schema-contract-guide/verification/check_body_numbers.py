#!/usr/bin/env python3
"""본문(chapters/)에 적은 계산 예를 다시 셈해, 원고 문장이 그 값을 그대로 적고 있는지 봅니다.

실습 풀이와 13장 인구 왕복은 다른 스크립트가 맡습니다. 이 스크립트는 그 밖의 본문 계산
(글자 위치 자르기, 어림수, 곱셈·나눗셈 검산)을 맡습니다. 2026-11-18 에 1장 글자 밀림 예
("171000 1" → 실제로는 "11710001")와 12장 어림수("3만여" → 실제로는 29,200)가 틀린 채
발행된 것을 찾아 만든 검사입니다.

  python3 verification/check_body_numbers.py      (docs/schema-contract-guide 에서)
결과: verification/body-numbers.json. 하나라도 어긋나면 종료 코드 1.
표준 라이브러리만 씁니다.
"""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CH = ROOT / "chapters"


def text(name: str) -> str:
    return (CH / name).read_text(encoding="utf-8")


def fixed_width(fields: list[str]) -> tuple[str, list[tuple[int, int]]]:
    """필드를 이어 붙인 한 줄과, 필드마다 1부터 세는 (처음, 끝) 위치."""
    pos, p = [], 1
    for f in fields:
        pos.append((p, p + len(f) - 1))
        p += len(f)
    return "".join(fields), pos


checks: list[dict] = []


def check(chapter: str, claim: str, computed, expect_in_text: list[str], ok: bool = True) -> None:
    body = text(chapter)
    missing = [s for s in expect_in_text if s not in body]
    checks.append({
        "장": chapter,
        "주장": claim,
        "계산": computed,
        "원고에 있어야 할 문장": expect_in_text,
        "원고에 없음": missing,
        "맞음": ok and not missing,
    })


# 1장 — 고정 길이 파일. 회원번호가 네 글자에서 일곱 글자로 늘면 15~22번째 글자가 무엇이 되는가
before_fields = ["R1", "0007", "20261117", "1000", "1130"]
after_fields = ["R1", "G1-0007", "20261117", "1000", "1130"]
b_line, b_pos = fixed_width(before_fields)
a_line, a_pos = fixed_width(after_fields)
b_read, a_read = b_line[14:22], a_line[14:22]
# 원고 그림의 꺾쇠는 회원번호 · 날짜 · (시작+끝) 셋입니다.
a_brackets = [f"[{a_pos[1][0]}-{a_pos[1][1]}]", f"[{a_pos[2][0]}-{a_pos[2][1]}]", f"[{a_pos[3][0]}-{a_pos[4][1]}]"]
check("01-data-independence.md", "청구 프로그램이 15-22번째 글자를 읽은 값",
      {"처음 줄 길이": len(b_line), "처음 값": b_read, "바뀐 뒤 줄": a_line, "바뀐 뒤 값": a_read,
       "바뀐 뒤 위치": [f"{s}-{e}" for s, e in a_pos]},
      [f"한 줄 ({len(b_line)}글자)", f'"{b_read}"', f'"{a_read}"', "[3-9]", "[10-17]", "[18-25]"],
      ok=b_read == "10001130" and a_brackets == ["[3-9]", "[10-17]", "[18-25]"])

# 4장 — 하루 60건이면 한 해 2만여 건, 한 달 2천 건 안팎
y60, m60 = 60 * 365, 60 * 30
check("04-internal-schema.md", "하루 60건의 한 해 건수가 '2만여'", y60, ["2만여 건(하루 60건 가정)"], ok=20000 <= y60 < 30000)
check("04-internal-schema.md", "하루 60건의 한 달 건수가 '2천 건 안팎'", m60, ["2천 건 안팎"], ok=abs(m60 - 2000) / 2000 <= 0.15)

# 8장 — M07 초과 요금 검산
over8 = 210 - 120
check("08-csdp.md", "사용 210 - 무료 120 의 초과 요금", {"초과 분": over8, "요금": over8 // 30 * 3000},
      ["사용 210 - 무료 120 = 90분 → 90 / 30 = 3 → 3 × 3,000 = 9,000원"], ok=over8 == 90 and over8 // 30 * 3000 == 9000)

# 9장 — 날수로 나눈 무료 분
a9, b9 = 120 * 14 / 30, 600 * 16 / 30
check("09-external-design.md", "120 × 14/30 + 600 × 16/30", a9 + b9, ["120 × 14/30 + 600 × 16/30 = 56 + 320 = 376분"],
      ok=(a9, b9, a9 + b9) == (56, 320, 376))

# 12장 — 하루 80행의 한 해 행 수
y80 = 80 * 365
check("12-internal-design.md", "하루 80행의 한 해 행 수", y80, ["한 해 2만 9천여 행(80 × 365 = 29,200)"], ok=29000 <= y80 < 30000)

# 13장 — 월초 기준이면 김하나의 초과 요금
fee13 = math.ceil((330 - 120) / 30) * 3000
check("13-verification.md", "사용 330 - 무료 120 의 초과 요금", fee13, ["21,000원"], ok=fee13 == 21000)

# 21장 — 검사한 조합 수
lhs1, lhs2 = 13 * 12, math.comb(13, 2)
check("21-rough-principles.md", "왼쪽 한 열·두 열 조합 수", {"한 열": lhs1, "두 열 왼쪽": lhs2, "두 열 × 오른쪽": lhs2 * 11},
      ["13 × 12 = 156개", "78 × 11 = 858개"], ok=lhs1 == 156 and lhs2 == 78 and lhs2 * 11 == 858)

# 24장 — 근사 종속 오차
g3 = 2 / 12
check("24-profiling.md", "지울 행 2 / 전체 12", round(g3, 4), ["2 / 12 ≈ 0.1667"], ok=round(g3, 4) == 0.1667)

out = ROOT / "verification" / "body-numbers.json"
out.write_text(json.dumps({"검사": checks, "모두 맞음": all(c["맞음"] for c in checks)}, ensure_ascii=False, indent=2), encoding="utf-8")
bad = [c for c in checks if not c["맞음"]]
for c in checks:
    print(("맞음  " if c["맞음"] else "어긋남 ") + c["장"] + " · " + c["주장"] + (f" · 원고에 없음: {c['원고에 없음']}" if c["원고에 없음"] else ""))
sys.exit(1 if bad else 0)
