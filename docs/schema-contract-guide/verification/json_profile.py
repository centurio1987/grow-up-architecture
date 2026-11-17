#!/usr/bin/env python3
"""JSON 줄 로그(jsonl)의 모양을 셉니다. 25장과 P13 풀이의 숫자를 여기서 옮깁니다.

    python3 json_profile.py <로그.jsonl>

- 모양: 줄마다 최상위 필드 이름의 집합. 같은 집합끼리 묶어 줄 수를 셉니다.
- 필드: 필드마다 몇 줄에 나오는지, 값의 JSON 타입이 무엇인지 셉니다.
  값이 null 인 것과 필드가 아예 없는 것을 따로 셉니다.
- 같은 줄: 필드 순서를 무시하고 글자 단위로 같은 줄을 찾습니다.
"""
import json
import sys
from collections import Counter, defaultdict


def jtype(v):
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "boolean"
    if isinstance(v, int):
        return "integer"
    if isinstance(v, float):
        return "number"
    if isinstance(v, str):
        return "string"
    if isinstance(v, list):
        return "array"
    return "object"


def main(path):
    rows = [json.loads(x) for x in open(path, encoding="utf-8") if x.strip()]
    shapes = Counter(tuple(sorted(r)) for r in rows)
    fields = defaultdict(Counter)
    for r in rows:
        for k, v in r.items():
            fields[k][jtype(v)] += 1
    canon = Counter(json.dumps(r, sort_keys=True, ensure_ascii=False) for r in rows)
    out = {
        "줄 수": len(rows),
        "모양": [{"필드": list(k), "줄 수": n} for k, n in shapes.most_common()],
        "필드": {k: {"나온 줄": sum(c.values()), "없는 줄": len(rows) - sum(c.values()), "타입": dict(c)}
                 for k, c in sorted(fields.items())},
        "같은 줄": [k for k, n in canon.items() if n > 1],
    }
    json.dump(out, sys.stdout, ensure_ascii=False, indent=2)
    print()


if __name__ == "__main__":
    main(sys.argv[1])
