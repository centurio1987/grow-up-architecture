#!/usr/bin/env python3
"""P12: 요금 가설(무게 구간 + 제주 추가)이 자료의 송장마다 맞는지 셉니다.

가설  2kg 이하 4,000원 · 5kg 이하 5,000원 · 10kg 이하 6,000원 · 시도가 제주면 3,000원 추가
"""
import csv
import json
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "problems" / "data"


def fee(w, sido):
    base = 4000 if w <= 2 else 5000 if w <= 5 else 6000 if w <= 10 else None
    return None if base is None else base + (3000 if sido == "제주" else 0)


rows = list(csv.DictReader(open(DATA / "p12-delivery-log.csv", encoding="utf-8")))
parcels = {}
for r in rows:
    parcels[r["송장번호"]] = (float(r["무게kg"]), r["시도"], int(r["요금"]))
res = [{"송장": k, "무게": w, "시도": s, "요금": f, "가설": fee(w, s), "맞음": fee(w, s) == f}
       for k, (w, s, f) in sorted(parcels.items())]
print(json.dumps({"송장 수": len(res), "맞은 송장": sum(x["맞음"] for x in res), "송장별": res},
                 ensure_ascii=False, indent=2))
