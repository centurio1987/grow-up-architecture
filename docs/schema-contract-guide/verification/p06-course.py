#!/usr/bin/env python3
"""P06 온라인 강의: 환불 금액과 정원 불변식(확정 + 결제 대기 ≤ 정원)을 사건 순서대로 따라갑니다.

환불 규칙(주어진 자료): 개강 전 전액. 개강 후 7일 이내이고 진도율 30% 미만이면 50%. 그 밖에는 없음.
개강일 2026-11-02(월). "7일 이내"는 개강일을 1일째로 셀 때 7일째(11-08)까지로 가정(풀이의 가정).
"""
import json
from datetime import date

FEE, OPEN = 120000, date(2026,11,2)
def refund(req: date, progress: int):
    if req < OPEN: return FEE
    day = (req - OPEN).days + 1
    if day <= 7 and progress < 30: return FEE // 2
    return 0
refunds = {"10-28 진도 0%": refund(date(2026,10,28),0), "11-06 진도 20%": refund(date(2026,11,6),20),
           "11-06 진도 40%": refund(date(2026,11,6),40), "11-12 진도 10%": refund(date(2026,11,12),10),
           "11-08 진도 10% (7일째)": refund(date(2026,11,8),10), "11-09 진도 10% (8일째)": refund(date(2026,11,9),10)}

cap = 30
state = {"확정": 29, "결제대기": 1, "대기열": ["W1","W2","W3"]}   # S30 이 결제 대기 중
log = []
def snap(ev):
    s = dict(state); s["대기열"] = list(state["대기열"]); log.append({"사건": ev, **s,
            "남은 자리": cap - state["확정"] - state["결제대기"],
            "불변식": state["확정"] + state["결제대기"] <= cap})
snap("시작: 확정 29, S30 결제 대기, 대기열 W1~W3")
state["결제대기"] -= 1; state["확정"] += 1; snap("S30 결제 승인 → 수강 확정")
state["확정"] -= 1; snap("S12 환불 완료 → 자리 하나")
state["결제대기"] += 1; state["대기열"].pop(0); snap("W1 승격(24시간 결제 기회)")
state["결제대기"] -= 1; snap("W1 결제 시한 지남")
state["결제대기"] += 1; state["대기열"].pop(0); snap("W2 승격")
state["결제대기"] -= 1; state["확정"] += 1; snap("W2 결제 완료 → 수강 확정")
print(json.dumps({"환불": refunds, "정원 따라가기": log}, ensure_ascii=False, indent=1))
