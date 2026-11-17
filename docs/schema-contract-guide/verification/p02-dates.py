#!/usr/bin/env python3
"""P02 작은 도서관 상호대차: 풀이에 쓴 날짜를 계산합니다.

규칙(문제의 주어진 자료에서): 순회 차량은 화·목 14:00 출발, 같은 날 15:00 도착.
보관 기한 = 도착일 + 3일. 대출 기간 = 수령일 + 14일. 반납된 책은 다음 차량으로 돌아감.
"""
import json
from datetime import date, timedelta

W = "월화수목금토일"
def wd(d): return f"{d.isoformat()}({W[d.weekday()]})"
def next_run(d, include_today=True):
    x = d if include_today else d + timedelta(days=1)
    while x.weekday() not in (1, 3):  # 화=1, 목=3
        x += timedelta(days=1)
    return x

req = date(2026, 11, 2)                 # 신청(월)
ship = next_run(req, include_today=False)  # 다음 날 오전 발송 처리, 그날 차량
arrive = ship
hold_until = arrive + timedelta(days=3)
pickup = date(2026, 11, 5)
due = pickup + timedelta(days=14)
returned = due
back = next_run(returned, include_today=False)
# 미수령 사례: 도착 11-03, 보관 기한 11-06 이 지나면 다음 차량으로 반송
unclaimed_back = next_run(hold_until, include_today=False)
out = {"신청": wd(req), "발송·도착": wd(arrive), "보관 기한": wd(hold_until), "수령": wd(pickup),
       "반납 예정": wd(due), "반납 후 느티 도착": wd(back), "미수령 시 반송 차량": wd(unclaimed_back),
       "2026-11-01 요일": W[date(2026,11,1).weekday()], "2026-11-17 요일": W[date(2026,11,17).weekday()]}
print(json.dumps(out, ensure_ascii=False, indent=2))
