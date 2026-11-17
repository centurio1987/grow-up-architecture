#!/usr/bin/env python3
"""P03 동물병원 진료 예약: 빈 슬롯과 초진 가능 시작 시각을 계산합니다.

규칙(주어진 자료): 진료 슬롯 20분. 재진 = 슬롯 1개, 초진 = 이어진 슬롯 2개(40분).
11-18(수) 김수의 오전 진료 09:00~12:00, 이미 잡힌 예약은 아래 목록.
"""
import json
from datetime import datetime, timedelta

start, end, step = datetime(2026,11,18,9,0), datetime(2026,11,18,12,0), timedelta(minutes=20)
booked = {"09:20","09:40","10:40","11:20"}   # 슬롯 시작 시각 (09:20-10:00 은 초진 하나)
slots = []
t = start
while t < end:
    slots.append(t.strftime("%H:%M")); t += step
free = [s for s in slots if s not in booked]
first_visit = [s for i, s in enumerate(slots[:-1]) if s in free and slots[i+1] in free]
print(json.dumps({"슬롯 수": len(slots), "슬롯": slots, "빈 슬롯": free, "초진 가능 시작": first_visit},
                 ensure_ascii=False, indent=1))
