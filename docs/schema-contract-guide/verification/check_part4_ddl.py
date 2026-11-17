#!/usr/bin/env python3
"""P11~P14 풀이의 재설계 DDL 을 SQLite 에서 실행하고, 원래 자료를 정제 규칙대로 옮겨 넣어 봅니다.

    python3 check_part4_ddl.py        # 결과 JSON 을 출력합니다

풀이에 적은 행 수·합계·거부 건수는 모두 이 출력에서 옮겼습니다.
"""
from __future__ import annotations

import csv
import json
import sqlite3
from datetime import datetime, timezone, timedelta
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "problems" / "data"
KST = timezone(timedelta(hours=9))


def fk_con():
    con = sqlite3.connect(":memory:")
    con.execute("PRAGMA foreign_keys = ON")
    return con


# ------------------------------------------------------------------ P11
P11_DDL = """
CREATE TABLE member (
  student_id TEXT PRIMARY KEY CHECK (length(student_id) = 8 AND student_id GLOB '[0-9]*'),
  name TEXT NOT NULL,
  phone TEXT                                   -- 지금 연락처. 옛 번호는 보관하지 않음(가정)
);
CREATE TABLE member_status (                   -- 활동·휴학 이력. 월 단위
  student_id TEXT NOT NULL REFERENCES member(student_id),
  from_month TEXT NOT NULL,                    -- 'YYYY-MM'
  status TEXT NOT NULL CHECK (status IN ('활동','휴학')),
  PRIMARY KEY (student_id, from_month)
);
CREATE TABLE event (
  event_id TEXT PRIMARY KEY,
  month TEXT NOT NULL,
  name TEXT NOT NULL,
  fee INTEGER NOT NULL CHECK (fee >= 0)
);
CREATE TABLE dues_payment (                    -- 월 회비 납부
  student_id TEXT NOT NULL REFERENCES member(student_id),
  month TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  PRIMARY KEY (student_id, month)
);
CREATE TABLE dues_exemption (                  -- 면제(노란 칸)
  student_id TEXT NOT NULL REFERENCES member(student_id),
  month TEXT NOT NULL,
  reason TEXT,
  PRIMARY KEY (student_id, month)
);
CREATE TABLE event_payment (                   -- 행사 참가비 납부. 행이 있으면 참가
  student_id TEXT NOT NULL REFERENCES member(student_id),
  event_id TEXT NOT NULL REFERENCES event(event_id),
  amount INTEGER NOT NULL CHECK (amount > 0),
  PRIMARY KEY (student_id, event_id)
);
"""


def p11():
    with open(DATA / "p11-club-ledger.csv", newline="", encoding="utf-8") as f:
        grid = list(csv.reader(f))
    _, h1, h2, *body = grid
    months, last = [], ""
    for v in h1:
        last = v or last
        months.append(last)
    month_code = {"3월": "2026-03", "4월": "2026-04", "5월": "2026-05"}
    con = fk_con()
    con.executescript(P11_DDL)
    con.executemany("INSERT INTO event VALUES (?,?,?,?)",
                    [("MT-2026-03", "2026-03", "MT", 30000), ("FES-2026-05", "2026-05", "축제", 5000)])
    members = [r for r in body if r[0] != "합계"]
    seen = {}
    for r in members:                                      # 정제: 학번의 '-' 를 지우고, 같은 학번은 한 사람
        sid = r[1].replace("-", "")
        seen[sid] = (r[0], r[2])                           # 나중 줄의 연락처를 지금 연락처로(가정)
    con.executemany("INSERT INTO member VALUES (?,?,?)", [(k, v[0], v[1]) for k, v in seen.items()])
    con.executemany("INSERT INTO member_status VALUES (?,?,?)", [
        ("20221111", "2026-03", "활동"), ("20221111", "2026-04", "휴학"), ("20221111", "2026-05", "활동"),
        ("20231234", "2026-03", "활동"), ("20241001", "2026-03", "활동"), ("20235678", "2026-03", "활동"),
        ("20245555", "2026-04", "활동")])
    dues = exempt = events = 0
    for r in members:
        sid = r[1].replace("-", "")
        for i, kind in enumerate(h2):
            if not kind or not r[i]:
                continue
            m = month_code[months[i]]
            if kind == "회비":
                if r[i] == "면제":
                    con.execute("INSERT INTO dues_exemption VALUES (?,?,?)", (sid, m, "노란 칸"))
                    exempt += 1
                else:
                    con.execute("INSERT INTO dues_payment VALUES (?,?,?)", (sid, m, int(r[i])))
                    dues += 1
            else:
                eid = "MT-2026-03" if kind == "MT" else "FES-2026-05"
                con.execute("INSERT INTO event_payment VALUES (?,?,?)", (sid, eid, int(r[i])))
                events += 1
    q = lambda s: [list(x) for x in con.execute(s)]  # noqa: E731
    # 같은 학번이 같은 달 회비를 두 번 내면 기본 키가 막는다
    try:
        con.execute("INSERT INTO dues_payment VALUES ('20221111','2026-05',10000)")
        dup = "받아들임"
    except sqlite3.DatabaseError as e:
        dup = str(e)
    return {
        "회원 수": q("SELECT COUNT(*) FROM member")[0][0],
        "회비 납부 행": dues, "면제 행": exempt, "행사 납부 행": events,
        "월별 회비 합": q("SELECT month, SUM(amount) FROM dues_payment GROUP BY month ORDER BY month"),
        "행사별 합": q("SELECT event_id, SUM(amount) FROM event_payment GROUP BY event_id ORDER BY event_id"),
        "덜 낸 회비(10000 미만)": q("SELECT student_id, month, amount FROM dues_payment WHERE amount < 10000"),
        "같은 달 회비 두 번": dup,
    }


# ------------------------------------------------------------------ P12
P12_DDL = """
CREATE TABLE zip (zip TEXT PRIMARY KEY, sido TEXT NOT NULL);
CREATE TABLE driver (
  driver_code TEXT PRIMARY KEY, name TEXT NOT NULL, area TEXT NOT NULL, hired_on TEXT NOT NULL
);
CREATE TABLE parcel (
  waybill TEXT PRIMARY KEY,
  received_on TEXT NOT NULL,
  sender TEXT NOT NULL,
  receiver TEXT NOT NULL,
  receiver_addr TEXT NOT NULL,
  zip TEXT NOT NULL REFERENCES zip(zip),
  weight_kg REAL NOT NULL CHECK (weight_kg > 0),
  fee INTEGER NOT NULL CHECK (fee > 0)          -- 접수 때 받은 요금(그때의 요금표를 따름)
);
CREATE TABLE parcel_event (
  waybill TEXT NOT NULL REFERENCES parcel(waybill),
  seq INTEGER NOT NULL,                          -- 송장 안에서 1, 2, 3 ...
  status TEXT NOT NULL CHECK (status IN ('집하','간선상차','배송출발','배송실패','배송완료','반송')),
  at TEXT NOT NULL,
  driver_code TEXT REFERENCES driver(driver_code),  -- 목록에 없는 기사는 NULL + 확인 대기
  driver_unverified TEXT,                        -- 원래 적힌 코드(확인 대기일 때만)
  PRIMARY KEY (waybill, seq)
);
"""


def p12():
    rows = list(csv.DictReader(open(DATA / "p12-delivery-log.csv", encoding="utf-8")))
    drivers = list(csv.DictReader(open(DATA / "p12-drivers.csv", encoding="utf-8")))
    con = fk_con()
    con.executescript(P12_DDL)
    con.executemany("INSERT INTO driver VALUES (?,?,?,?)",
                    [(d["기사코드"], d["기사이름"], d["담당구역"], d["입사일"]) for d in drivers])
    con.executemany("INSERT OR IGNORE INTO zip VALUES (?,?)", [(r["우편번호"], r["시도"]) for r in rows])
    con.executemany("INSERT OR IGNORE INTO parcel VALUES (?,?,?,?,?,?,?,?)", [
        (r["송장번호"], r["접수일"], r["보내는분"], r["받는분"], r["받는분주소"], r["우편번호"],
         float(r["무게kg"]), int(r["요금"])) for r in rows])
    fk_fail, seqs = 0, {}
    for r in rows:
        w = r["송장번호"]
        seqs[w] = seqs.get(w, 0) + 1
        try:
            con.execute("INSERT INTO parcel_event VALUES (?,?,?,?,?,NULL)",
                        (w, seqs[w], r["상태"], r["상태시각"], r["기사코드"]))
        except sqlite3.IntegrityError:
            fk_fail += 1                                    # 정제 규칙: 코드를 옮겨 적고 NULL 로
            con.execute("INSERT INTO parcel_event VALUES (?,?,?,?,NULL,?)",
                        (w, seqs[w], r["상태"], r["상태시각"], r["기사코드"]))
    q = lambda s: [list(x) for x in con.execute(s)]  # noqa: E731
    return {
        "송장": q("SELECT COUNT(*) FROM parcel")[0][0],
        "상태 이벤트": q("SELECT COUNT(*) FROM parcel_event")[0][0],
        "우편번호": q("SELECT COUNT(*) FROM zip")[0][0],
        "외래 키로 거부된 이벤트": fk_fail,
        "확인 대기 기사": q("SELECT waybill, seq, status, driver_unverified FROM parcel_event WHERE driver_unverified IS NOT NULL"),
        "배송출발이 두 번인 송장": q("SELECT waybill, COUNT(*) FROM parcel_event WHERE status='배송출발' GROUP BY waybill HAVING COUNT(*)>1"),
        "송장마다 기사 수": q("SELECT waybill, COUNT(DISTINCT driver_code) FROM parcel_event GROUP BY waybill HAVING COUNT(DISTINCT driver_code)>1"),
        "기사 이름(정규화 뒤 D01)": q("SELECT name FROM driver WHERE driver_code='D01'"),
    }


# ------------------------------------------------------------------ P13
P13_DDL = """
CREATE TABLE workout (
  workout_key TEXT PRIMARY KEY,           -- v3 는 event_id, v1·v2 는 user|끝난 시각(UTC)
  user_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('run','cycle','swim')),
  ended_at_utc TEXT NOT NULL,
  duration_sec INTEGER NOT NULL CHECK (duration_sec > 0),
  distance_m INTEGER CHECK (distance_m IS NULL OR distance_m >= 0),   -- NULL = 모름
  lap_count INTEGER,                      -- v2 의 laps(정수)
  pool_m INTEGER,
  source_shape TEXT NOT NULL CHECK (source_shape IN ('v1','v2','v3')),
  source_app TEXT
);
CREATE TABLE workout_lap (                 -- v3 의 laps(배열)
  workout_key TEXT NOT NULL REFERENCES workout(workout_key),
  n INTEGER NOT NULL,
  sec INTEGER NOT NULL,
  PRIMARY KEY (workout_key, n)
);
"""


def to_utc(s: str) -> str:
    return datetime.fromisoformat(s.replace("Z", "+00:00")).astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


UNIT_SEC = {"min": 60, "h": 3600, "s": 1}
UNIT_M = {"km": 1000, "m": 1}


def p13():
    con = fk_con()
    con.executescript(P13_DDL)
    events = [json.loads(x) for x in open(DATA / "p13-workout-events.jsonl", encoding="utf-8") if x.strip()]
    dup = 0
    for e in events:
        if "type" in e:                                   # v1: run_end, km, 초
            shape, user, kind, at = "v1", e["user"], "run", e["ts"]
            dur, dist = e["dur"], round(e["dist"] * 1000)
            laps = pool = None
            key = f'{user}|{to_utc(at)}'
        elif e["app"].startswith("2."):                   # v2
            shape, user, kind, at = "v2", e["user_id"], e["kind"], e["at"]
            dur = e["duration_sec"]
            dist = None if e.get("distance_km") is None else round(e["distance_km"] * 1000)
            laps, pool = e.get("laps"), e.get("pool_m")
            key = f'{user}|{to_utc(at)}'
        else:                                             # v3: 단위가 붙은 값
            shape, user, kind, at = "v3", e["user_id"], e["kind"], e["at"]
            d = e["duration"]
            dur = round(d["value"] * UNIT_SEC[d["unit"]])
            dist = None if "distance" not in e else round(e["distance"]["value"] * UNIT_M[e["distance"]["unit"]])
            laps, pool = None, e.get("pool_m")
            key = e["event_id"]
        try:
            con.execute("INSERT INTO workout VALUES (?,?,?,?,?,?,?,?,?,?)",
                        (key, user, kind, to_utc(at), dur, dist, laps, pool, shape, e.get("app")))
        except sqlite3.IntegrityError:
            dup += 1                                      # 정제 규칙: 같은 키는 한 번만
            continue
        if isinstance(e.get("laps"), list):
            con.executemany("INSERT INTO workout_lap VALUES (?,?,?)", [(key, l["n"], l["sec"]) for l in e["laps"]])
    q = lambda s: [list(x) for x in con.execute(s)]  # noqa: E731
    return {
        "입력 줄": len(events), "운동 행": q("SELECT COUNT(*) FROM workout")[0][0], "중복으로 건너뜀": dup,
        "운동 행 전부": q("SELECT workout_key, user_id, kind, ended_at_utc, duration_sec, distance_m, lap_count, source_shape FROM workout ORDER BY ended_at_utc"),
        "거리 모름(NULL)": q("SELECT workout_key FROM workout WHERE distance_m IS NULL ORDER BY workout_key"),
        "랩 행": q("SELECT COUNT(*) FROM workout_lap")[0][0],
    }


# ------------------------------------------------------------------ P14
P14_NEW = """
CREATE TABLE party (                                   -- TB_CUST
  party_code TEXT PRIMARY KEY, name TEXT NOT NULL, tel TEXT,
  role TEXT NOT NULL CHECK (role IN ('supplier','customer','unverified'))
);
CREATE TABLE warehouse (wh_code TEXT PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE category (cat1 TEXT PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE item (
  item_code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cat1 TEXT REFERENCES category(cat1),
  cat2 TEXT,                                            -- 코드표 없음(q)
  unit TEXT NOT NULL,
  main_supplier TEXT REFERENCES party(party_code),
  in_use INTEGER NOT NULL CHECK (in_use IN (0,1)),
  unverified INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE item_price (                               -- PRICE1~3 를 세로로
  item_code TEXT NOT NULL REFERENCES item(item_code),
  price_kind TEXT NOT NULL CHECK (price_kind IN ('retail','trade','price3_unknown')),
  won INTEGER NOT NULL CHECK (won >= 0),
  PRIMARY KEY (item_code, price_kind)
);
CREATE TABLE item_replacement (                         -- MEMO 의 '대체:'
  item_code TEXT NOT NULL REFERENCES item(item_code),
  replaced_by TEXT NOT NULL REFERENCES item(item_code),
  PRIMARY KEY (item_code)
);
CREATE TABLE stock (
  item_code TEXT NOT NULL REFERENCES item(item_code),
  wh_code TEXT NOT NULL REFERENCES warehouse(wh_code),
  qty INTEGER NOT NULL,
  updated_on TEXT NOT NULL,
  PRIMARY KEY (item_code, wh_code)
);
CREATE TABLE stock_move (                               -- TB_INOUT
  seq INTEGER PRIMARY KEY,
  moved_on TEXT NOT NULL,                               -- 'YYYY-MM-DD'
  item_code TEXT NOT NULL REFERENCES item(item_code),
  kind TEXT NOT NULL CHECK (kind IN ('in','out','return','adjust')),
  qty_change INTEGER NOT NULL,                          -- 재고에 더하는 값(부호 포함)
  wh_code TEXT NOT NULL REFERENCES warehouse(wh_code),
  party_code TEXT REFERENCES party(party_code),
  remark TEXT
);
-- 회계 프로그램이 읽던 모양을 그대로 내주는 호환 뷰 (이름도 그대로)
CREATE VIEW TB_INOUT AS
SELECT seq AS SEQ,
       replace(moved_on, '-', '') AS DT,
       item_code AS ITEM_CD,
       CASE kind WHEN 'in' THEN 'I' WHEN 'out' THEN 'O' WHEN 'return' THEN 'R' ELSE 'A' END AS IO_GB,
       CASE kind WHEN 'out' THEN -qty_change ELSE qty_change END AS QTY,
       wh_code AS WH_CD,
       COALESCE(party_code, '') AS CUST_CD,
       COALESCE(remark, '') AS REMARK
FROM stock_move;
"""


def p14():
    old = sqlite3.connect(":memory:")
    old.executescript((DATA / "p14-hardware-store.sql").read_text(encoding="utf-8"))
    new = fk_con()
    new.executescript(P14_NEW)
    gb = {"S": "supplier", "C": "customer"}
    new.executemany("INSERT INTO party VALUES (?,?,?,?)",
                    [(c, n, t, gb[g]) for c, n, t, g in old.execute("SELECT * FROM TB_CUST")])
    new.executemany("INSERT INTO warehouse VALUES (?,?)", old.execute("SELECT CD, CD_NM FROM TB_CODE WHERE GRP_CD='WH'"))
    new.executemany("INSERT INTO category VALUES (?,?)", old.execute("SELECT CD, CD_NM FROM TB_CODE WHERE GRP_CD='CAT1'"))
    for cd, nm, c1, c2, unit, p1, p2, p3, cust, memo, use in old.execute("SELECT * FROM TB_ITEM"):
        new.execute("INSERT INTO item VALUES (?,?,?,?,?,?,?,0)", (cd, nm, c1, c2, unit, cust or None, 1 if use == "Y" else 0))
        new.executemany("INSERT INTO item_price VALUES (?,?,?)",
                        [(cd, "retail", p1), (cd, "trade", p2), (cd, "price3_unknown", p3)])
    for cd, memo in old.execute("SELECT ITEM_CD, MEMO FROM TB_ITEM WHERE MEMO LIKE '%대체:%'"):
        new.execute("INSERT INTO item_replacement VALUES (?,?)", (cd, memo.split("대체:")[1].strip()))
    # 정제 규칙: 목록에 없는 품목·거래처는 '확인 대기'로 만들어 넣는다(지우지 않음)
    orphan_items = [r[0] for r in old.execute("SELECT DISTINCT ITEM_CD FROM TB_STOCK WHERE ITEM_CD NOT IN (SELECT ITEM_CD FROM TB_ITEM)")]
    for cd in orphan_items:
        new.execute("INSERT INTO item VALUES (?,?,NULL,NULL,'?',NULL,0,1)", (cd, "(확인 대기)"))
    orphan_parties = [r[0] for r in old.execute("SELECT DISTINCT CUST_CD FROM TB_INOUT WHERE CUST_CD<>'' AND CUST_CD NOT IN (SELECT CUST_CD FROM TB_CUST)")]
    for cd in orphan_parties:
        new.execute("INSERT INTO party VALUES (?,?,NULL,'unverified')", (cd, "(확인 대기)"))
    new.executemany("INSERT INTO stock VALUES (?,?,?,?)", old.execute("SELECT ITEM_CD, WH_CD, QTY, UPD_DT FROM TB_STOCK"))
    kind = {"I": "in", "O": "out", "R": "return", "A": "adjust"}
    for seq, dt, item, gb_, qty, wh, cust, remark in old.execute("SELECT * FROM TB_INOUT"):
        change = -qty if gb_ == "O" else qty                # R 은 거래처 반품(+)으로 가정(q)
        new.execute("INSERT INTO stock_move VALUES (?,?,?,?,?,?,?,?)",
                    (seq, f"{dt[:4]}-{dt[4:6]}-{dt[6:]}", item, kind[gb_], change, wh, cust or None, remark or None))
    acct = "SELECT DT, ITEM_CD, QTY, CUST_CD FROM TB_INOUT WHERE IO_GB = 'O' AND DT = ? ORDER BY SEQ"
    dates = [r[0] for r in old.execute("SELECT DISTINCT DT FROM TB_INOUT ORDER BY DT")]
    same = all(list(old.execute(acct, (d,))) == list(new.execute(acct, (d,))) for d in dates)
    daily = "SELECT * FROM TB_INOUT WHERE DT = ? ORDER BY SEQ"
    same_daily = all(list(old.execute(daily, (d,))) == list(new.execute(daily, (d,))) for d in dates)
    q = lambda s: [list(x) for x in new.execute(s)]  # noqa: E731
    return {
        "확인 대기 품목": orphan_items, "확인 대기 거래처": orphan_parties,
        "품목": q("SELECT COUNT(*) FROM item")[0][0], "가격 행": q("SELECT COUNT(*) FROM item_price")[0][0],
        "재고 행": q("SELECT COUNT(*) FROM stock")[0][0], "입출고 행": q("SELECT COUNT(*) FROM stock_move")[0][0],
        "대체 품목": q("SELECT * FROM item_replacement"),
        "회계 질의 결과가 날짜마다 같음": same, "검사한 날짜 수": len(dates),
        "일보 질의(SELECT *) 결과가 같음": same_daily,
        "회계 질의 2026-10-02": [list(r) for r in new.execute(acct, ("20261002",))],
    }


if __name__ == "__main__":
    print(json.dumps({"sqlite_version": sqlite3.sqlite_version,
                      "P11": p11(), "P12": p12(), "P13": p13(), "P14": p14()}, ensure_ascii=False, indent=2))
