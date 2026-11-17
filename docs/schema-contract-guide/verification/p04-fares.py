#!/usr/bin/env python3
"""P04 공유 자전거: 정산 규칙(기본 30분 1,000원, 초과 10분마다 200원, 올림)으로 요금을 계산합니다."""
import json
def fare(minutes):
    over = max(0, minutes - 30)
    return 1000 + -(-over // 10) * 200
cases = [12, 30, 31, 40, 45, 47, 60, 95]
print(json.dumps({f"{m}분": fare(m) for m in cases}, ensure_ascii=False, indent=1))
