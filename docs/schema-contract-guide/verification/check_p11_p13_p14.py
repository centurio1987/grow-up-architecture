#!/usr/bin/env python3
"""P11(회비 장부)·P13(운동 앱 로그)·P14(철물점 DB) 풀이에 쓴 수치를 계산합니다.

    python3 check_p11_p13_p14.py            # 세 문제 결과를 JSON 으로 출력

풀이의 숫자는 모두 이 스크립트의 출력에서 옮겼습니다. 자료를 바꾸면 다시 돌려 풀이를 맞춥니다.
"""
from __future__ import annotations

import csv
import json
import sqlite3
from collections import Counter, defaultdict
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "problems" / "data"


# ---------------------------------------------------------------- P11
def p11():
    with open(DATA / "p11-club-ledger.csv", newline="", encoding="utf-8") as f:
        grid = list(csv.reader(f))
    title, head1, head2, *body = grid
    # 병합 칸 풀기: 위 머리글의 빈 칸은 왼쪽 값을 이어받는다
    months, last = [], ""
    for v in head1:
        last = v or last
        months.append(last)
    cols = [(months[i], head2[i]) for i in range(len(head1))]
    amount_cols = [i for i, (m, k) in enumerate(cols) if k]
    members = [r for r in body if r[0] != "합계"]
    total = next(r for r in body if r[0] == "합계")

    facts = []  # (이름, 학번, 월, 항목, 칸 값)
    for r in members:
        for i in amount_cols:
            if r[i] != "":
                facts.append({"이름": r[0], "학번": r[1], "월": cols[i][0], "항목": cols[i][1], "값": r[i]})
    sums = {}
    for i in amount_cols:
        nums = [int(r[i]) for r in members if r[i].isdigit()]
        sums[f"{cols[i][0]} {cols[i][1]}"] = {"계산": sum(nums), "합계행": int(total[i])}
    ids = Counter(r[1].replace("-", "") for r in members)
    non_numeric = [{"이름": r[0], "칸": f"{cols[i][0]} {cols[i][1]}", "값": r[i]}
                   for r in members for i in amount_cols if r[i] and not r[i].isdigit()]
    return {
        "실제 열(월, 항목)": [f"{m} {k}" for m, k in cols if k],
        "회원 행 수": len(members),
        "하이픈을 지운 학번이 겹치는 경우": {k: v for k, v in ids.items() if v > 1},
        "하이픈이 든 학번": [r[1] for r in members if "-" in r[1]],
        "납부 사실 후보(빈 칸 제외) 개수": len(facts),
        "숫자가 아닌 금액 칸": non_numeric,
        "열 합계 비교": sums,
        "합계행과 다른 열": [k for k, v in sums.items() if v["계산"] != v["합계행"]],
        "금액 값의 종류": sorted({f["값"] for f in facts}),
    }


# ---------------------------------------------------------------- P13
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


def version_of(e):
    if "type" in e:
        return "v1"
    app = e.get("app", "")
    return "v" + app.split(".")[0]


def p13():
    lines = (DATA / "p13-workout-events.jsonl").read_text(encoding="utf-8").splitlines()
    events = [json.loads(x) for x in lines]
    by_ver = defaultdict(list)
    for e in events:
        by_ver[version_of(e)].append(e)
    presence = {}
    for ver, es in sorted(by_ver.items()):
        c = Counter(k for e in es for k in e)
        presence[ver] = {"줄 수": len(es), "필드 출현": dict(sorted(c.items()))}
    types = defaultdict(Counter)
    for e in events:
        for k, v in e.items():
            types[k][jtype(v)] += 1
    multi = {k: dict(v) for k, v in types.items() if len(v) > 1}
    dup = Counter(json.dumps(e, sort_keys=True, ensure_ascii=False) for e in events)
    offsets = Counter((e.get("ts") or e.get("at"))[-6:] if not (e.get("ts") or e.get("at")).endswith("Z") else "Z"
                      for e in events)
    units = Counter()
    for e in events:
        for k in ("duration", "distance"):
            if isinstance(e.get(k), dict):
                units[f"{k}.unit={e[k]['unit']}"] += 1
    return {
        "전체 줄 수": len(events),
        "버전별": presence,
        "타입이 둘 이상인 필드": multi,
        "글자 단위로 같은 줄": [json.loads(k)["event_id"] if "event_id" in json.loads(k) else k
                          for k, n in dup.items() if n > 1],
        "시각의 시간대 표기": dict(offsets),
        "v3 단위 표기": dict(units),
        "kind 값": dict(Counter(e.get("kind", "(없음, v1)") for e in events)),
    }


# ---------------------------------------------------------------- P14
def p14():
    con = sqlite3.connect(":memory:")
    con.executescript((DATA / "p14-hardware-store.sql").read_text(encoding="utf-8"))
    q = lambda s: [list(r) for r in con.execute(s).fetchall()]  # noqa: E731
    return {
        "TB_ITEM 행": q("SELECT COUNT(*) FROM TB_ITEM")[0][0],
        "품목 코드 앞 두 글자 = CAT1 인 행": q("SELECT COUNT(*) FROM TB_ITEM WHERE substr(ITEM_CD,1,2)=CAT1")[0][0],
        "앞 두 글자와 CAT1 이 다른 품목": q("SELECT ITEM_CD, CAT1 FROM TB_ITEM WHERE substr(ITEM_CD,1,2)<>CAT1"),
        "품목 코드 3~4번째 글자 = CAT2 인 행": q("SELECT COUNT(*) FROM TB_ITEM WHERE substr(ITEM_CD,3,2)=CAT2")[0][0],
        "TB_STOCK 에만 있는 품목": q("SELECT ITEM_CD, WH_CD, QTY, UPD_DT FROM TB_STOCK WHERE ITEM_CD NOT IN (SELECT ITEM_CD FROM TB_ITEM)"),
        "TB_INOUT 에만 있는 거래처": q("SELECT SEQ, CUST_CD FROM TB_INOUT WHERE CUST_CD<>'' AND CUST_CD NOT IN (SELECT CUST_CD FROM TB_CUST)"),
        "TB_INOUT 의 빈 거래처 행": q("SELECT SEQ, IO_GB, REMARK FROM TB_INOUT WHERE CUST_CD=''"),
        "TB_STOCK (품목, 창고) 겹침": q("SELECT ITEM_CD, WH_CD, COUNT(*) FROM TB_STOCK GROUP BY 1,2 HAVING COUNT(*)>1"),
        "IO_GB 별 행 수와 수량 부호": q("SELECT IO_GB, COUNT(*), MIN(QTY), MAX(QTY) FROM TB_INOUT GROUP BY IO_GB ORDER BY IO_GB"),
        "PRICE1>=PRICE2>=PRICE3 인 품목": q("SELECT COUNT(*) FROM TB_ITEM WHERE PRICE1>=PRICE2 AND PRICE2>=PRICE3")[0][0],
        "MEMO 가 빈칸이 아닌 품목": q("SELECT ITEM_CD, MEMO FROM TB_ITEM WHERE MEMO<>''"),
        "TB_ITEM.CUST_CD 의 거래처 구분": q("SELECT I.CUST_CD, C.CUST_GB, COUNT(*) FROM TB_ITEM I LEFT JOIN TB_CUST C ON C.CUST_CD=I.CUST_CD GROUP BY 1,2 ORDER BY 1"),
        "기간 내 입출고 순증감(품목, 창고) — I·R 더하고 O 빼고 A 그대로": q(
            "SELECT ITEM_CD, WH_CD, SUM(CASE IO_GB WHEN 'I' THEN QTY WHEN 'R' THEN QTY WHEN 'O' THEN -QTY ELSE QTY END) "
            "FROM TB_INOUT GROUP BY 1,2 ORDER BY 1,2"),
    }


if __name__ == "__main__":
    print(json.dumps({"P11": p11(), "P13": p13(), "P14": p14()}, ensure_ascii=False, indent=2))
