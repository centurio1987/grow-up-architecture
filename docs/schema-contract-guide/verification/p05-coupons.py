#!/usr/bin/env python3
"""P05 온라인 서점 쿠폰: 주어진 Examples 표와 풀이에서 더한 경계값 줄을 규칙으로 다시 계산합니다.

규칙(풀이에서 Examples 로부터 끌어낸 것):
- 할인·최소 금액·배송비 판단은 모두 종이책 금액(할인 전) 기준. 전자책은 셈하지 않음
- WELCOME10: 정률 10%, 10원 미만 내림, 최대 5,000원, 최소 20,000원, 회원당 1회
- BOOK3000 : 정액 3,000원, 최소 15,000원
- 배송비 3,000원, 할인 전 종이책 금액 20,000원 이상이면 0원 (종이책이 없으면 배송 없음)
- 최소 금액은 "이상"으로 해석(경계 포함). 이 해석은 풀이의 가정
"""
import json

COUPONS = {"WELCOME10": {"kind": "rate", "rate": 10, "cap": 5000, "min": 20000},
           "BOOK3000": {"kind": "fixed", "amount": 3000, "min": 15000}}

def ship(paper):
    if paper == 0:
        return 0
    return 0 if paper >= 20000 else 3000

def apply(member, code, paper, ebook, used):
    c = COUPONS[code]
    if (member, code) in used:
        return {"결과": "거절: 이미 사용한 쿠폰"}
    if paper < c["min"]:
        return {"결과": "거절: 최소 주문 금액 미달"}
    if c["kind"] == "rate":
        d = (paper * c["rate"] // 100) // 10 * 10
        d = min(d, c["cap"])
    else:
        d = c["amount"]
    used.add((member, code))
    s = ship(paper)
    return {"결과": "적용", "할인": d, "배송비": s, "결제": paper - d + ebook + s}

seed = [("M1","WELCOME10",25000,0),("M2","WELCOME10",60000,0),("M3","WELCOME10",18000,5000),
        ("M4","WELCOME10",23450,0),("M1","WELCOME10",30000,0),("M5","BOOK3000",15000,0),
        ("M6","BOOK3000",14900,2000),("M7","BOOK3000",0,20000),("M8","WELCOME10",21000,0)]
extra = [("M9","WELCOME10",20000,0),("M10","WELCOME10",19990,0),("M11","WELCOME10",50000,0),
         ("M12","WELCOME10",50010,0),("M13","BOOK3000",20000,0),("M14","WELCOME10",20005,0)]
used = set()
out = {"주어진 줄": [], "더한 줄": []}
for r in seed:
    out["주어진 줄"].append({"입력": r, **apply(*r, used)})
for r in extra:
    out["더한 줄"].append({"입력": r, **apply(*r, used)})
print(json.dumps(out, ensure_ascii=False, indent=1))
