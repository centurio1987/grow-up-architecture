#!/usr/bin/env python3
"""P08 동네 학원: 영수증 합계와 11월 출석률을 계산합니다."""
import json
from datetime import date, timedelta
# 영수증(동생, 둘째): 수학 중1B 11월 220,000 / 교재비 15,000 / 형제 할인 = 둘째부터 수강료의 10%
fee, book = 220000, 15000
sibling = fee * 10 // 100
total = fee + book - sibling
# 출석부: 중2A 반, 월·수·금 수업, 2026-11
days = [date(2026,11,1) + timedelta(days=i) for i in range(30)]
classes = [d for d in days if d.weekday() in (0, 2, 4)]
marks = {"○": 0, "지": 0, "조": 0, "×": 0}
# 학생 박서윤: 결석 1, 지각 2, 조퇴 1, 나머지 출석
seq = ["○"] * len(classes)
seq[3] = "×"; seq[5] = "지"; seq[9] = "지"; seq[11] = "조"
for m in seq: marks[m] += 1
n = len(classes)
print(json.dumps({"영수증": {"수강료": fee, "교재비": book, "형제 할인": sibling, "합계": total},
                  "11월 월수금 수업일": [d.isoformat() for d in classes], "수업일 수": n,
                  "박서윤 기호": marks,
                  "출석률(○만)": round(marks["○"] / n * 100, 1),
                  "출석률(○·지·조)": round((marks["○"] + marks["지"] + marks["조"]) / n * 100, 1),
                  "기호 순서": seq}, ensure_ascii=False, indent=1))
