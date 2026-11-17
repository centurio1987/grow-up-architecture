#!/usr/bin/env python3
"""P15(농산물 꾸러미 정기 배송) 풀이에 쓴 수치를 계산하고, SQLite 판 내부 스키마로 인구 왕복과 반례 시험을 합니다.

    python3 check_p15.py      # 결과 JSON 을 출력합니다

계산 규칙(콘셉트 문서를 그대로 읽은 기준, 풀이의 "기준 해석 B0"):
- 꾸러미 가격: 소 18,000 · 중 25,000 · 대 32,000원. 그달 받은 꾸러미 수 × 가격.
- 배송일은 매주 목요일. 격주는 ISO 주차의 홀·짝 가운데 하나(가정 a1).
  '(짝)'·'(홀)' 표시가 있으면 그것을, 없으면 시작일 뒤 첫 목요일의 주차를 따른다(가정 a2).
- 건너뛴 회차와 배송에 실패한 회차는 받지 않은 것으로 센다.
- 크기·주기의 표기 흔들림은 아래 표로 맞춘다(풀이의 맞추기 결정).
"""
from __future__ import annotations

import csv
import datetime as dt
import json
import re
import sqlite3
from collections import Counter
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "problems" / "data" / "p15-orders.csv"
PRICE = {"소": 18000, "중": 25000, "대": 32000}
SIZE_MAP = {"소": "소", "중": "중", "M": "중", "중간": "중", "대": "대", "L": "대"}
PERIOD_MAP = {"매주": "매주", "격주": "격주", "2주": "격주", "격주(짝)": "격주"}
AREA = {"동구", "서구", "남구"}
NOV_THU = [dt.date(2026, 11, d) for d in range(1, 31) if dt.date(2026, 11, d).weekday() == 3]


def parse_date(s: str):
    s = s.strip()
    if not s:
        return None, "비어 있음"
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", s):
        return dt.date.fromisoformat(s), "YYYY-MM-DD"
    if re.fullmatch(r"\d{4}\.\d{2}\.\d{2}", s):
        return dt.date.fromisoformat(s.replace(".", "-")), "YYYY.MM.DD"
    m = re.fullmatch(r"(\d{1,2})/(\d{1,2})", s)
    if m:
        return dt.date(2026, int(m.group(1)), int(m.group(2))), "M/D(연도 없음)"
    return None, "알 수 없음"


def first_thu_on_or_after(d: dt.date) -> dt.date:
    return d + dt.timedelta(days=(3 - d.weekday()) % 7)


def load():
    with open(DATA, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def analyse(rows):
    raw_size = Counter(r["크기"] for r in rows)
    raw_period = Counter(r["주기"] for r in rows)
    fmt = Counter(parse_date(r["시작일"])[1] for r in rows)
    phones = Counter(r["연락처"] for r in rows)
    out = []
    for r in rows:
        size = SIZE_MAP.get(r["크기"])
        period = PERIOD_MAP.get(r["주기"])
        start, _ = parse_date(r["시작일"])
        skips, bad_skips = set(), []
        for part in [p.strip() for p in r["건너뛰기"].split(",") if p.strip()]:
            d, _ = parse_date(part)
            if d and d.weekday() == 3:
                skips.add(d)
            else:
                bad_skips.append(part)
        failed = set()
        m = re.search(r"(\d{1,2}/\d{1,2}) 배송 실패", r["비고"])
        if m:
            failed.add(parse_date(m.group(1))[0])
        row = {"번호": int(r["번호"]), "이름": r["이름"], "기록 결제": int(r["11월결제"]),
               "크기(맞춘 뒤)": size, "주기(맞춘 뒤)": period}
        if start is None:
            row.update({"계산": "불가(시작일 없음)"})
            out.append(row)
            continue
        if period == "격주":
            if "짝" in r["주기"]:
                parity = 0
            elif "홀" in r["주기"]:
                parity = 1
            else:
                parity = first_thu_on_or_after(start).isocalendar()[1] % 2
            row["배송 주차"] = "짝" if parity == 0 else "홀"
        sched = [d for d in NOV_THU if d >= start and (period == "매주" or d.isocalendar()[1] % 2 == parity)]
        got = [d for d in sched if d not in skips and d not in failed]
        fee = len(got) * PRICE[size]
        row.update({"예정 회차": [d.isoformat() for d in sched],
                    "받은 회차": [d.isoformat() for d in got],
                    "계산 결제": fee, "차이(기록-계산)": int(r["11월결제"]) - fee})
        if bad_skips:
            row["배송일이 아닌 건너뛰기"] = bad_skips
        out.append(row)
    return {
        "11월 목요일과 ISO 주차": [[d.isoformat(), d.isocalendar()[1]] for d in NOV_THU],
        "행 수": len(rows),
        "크기 원본 값": dict(raw_size),
        "주기 원본 값": dict(raw_period),
        "시작일 꼴": dict(fmt),
        "연락처가 겹치는 행": {k: [int(r["번호"]) for r in rows if r["연락처"] == k] for k, v in phones.items() if v > 1},
        "배송 지역 밖": [[int(r["번호"]), r["구"]] for r in rows if r["구"] not in AREA],
        "비고가 있는 행": [[int(r["번호"]), r["비고"]] for r in rows if r["비고"]],
        "행별 계산": out,
        "차이가 있는 행": [[x["번호"], x["이름"], x["기록 결제"], x.get("계산 결제"), x.get("차이(기록-계산)")]
                       for x in out if x.get("차이(기록-계산)", 0) != 0 or "계산" in x],
        "기록 결제 합계": sum(int(r["11월결제"]) for r in rows),
    }


# ---------------------------------------------------------------- SQLite 판 내부 스키마
DDL = """
CREATE TABLE box_size (size TEXT PRIMARY KEY, price_won INTEGER NOT NULL CHECK (price_won > 0));
CREATE TABLE subscriber (
  subscriber_id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL UNIQUE);
CREATE TABLE subscriber_address (               -- 주소 이력 (이사 = 새 기간)
  subscriber_id TEXT NOT NULL REFERENCES subscriber(subscriber_id),
  valid_from TEXT NOT NULL, valid_to TEXT, address TEXT NOT NULL,
  district TEXT NOT NULL CHECK (district IN ('동구','서구','남구')),
  PRIMARY KEY (subscriber_id, valid_from));
CREATE TABLE subscription (
  subscription_id TEXT PRIMARY KEY,
  subscriber_id TEXT NOT NULL REFERENCES subscriber(subscriber_id),
  payer_id TEXT NOT NULL REFERENCES subscriber(subscriber_id),   -- 받는 사람과 내는 사람이 다를 수 있음
  size TEXT NOT NULL REFERENCES box_size(size),
  period TEXT NOT NULL CHECK (period IN ('매주','격주')),
  parity TEXT CHECK (parity IN ('홀','짝')),
  start_date TEXT NOT NULL, end_date TEXT,
  CHECK ((period = '격주') = (parity IS NOT NULL)),
  CHECK (end_date IS NULL OR end_date > start_date));
CREATE TRIGGER one_active_subscription BEFORE INSERT ON subscription
WHEN EXISTS (SELECT 1 FROM subscription s WHERE s.subscriber_id = NEW.subscriber_id
             AND s.start_date < COALESCE(NEW.end_date,'9999-12-31')
             AND NEW.start_date < COALESCE(s.end_date,'9999-12-31'))
BEGIN SELECT RAISE(ABORT, '한 구독자에게 겹치는 구독'); END;
CREATE TABLE delivery_day (delivery_date TEXT PRIMARY KEY CHECK (strftime('%w', delivery_date) = '4'),
                           iso_week INTEGER NOT NULL);
CREATE TABLE skip (
  subscription_id TEXT NOT NULL REFERENCES subscription(subscription_id),
  delivery_date TEXT NOT NULL REFERENCES delivery_day(delivery_date),
  requested_at TEXT NOT NULL,
  PRIMARY KEY (subscription_id, delivery_date),
  CHECK (julianday(requested_at) < julianday(delivery_date, '-3 days')));  -- 가정 a3: 직전 일요일 24:00 = 월요일 00:00
  -- 처음에는 requested_at < datetime(...) 로 썼다가 '2026-11-16 00:00' < '2026-11-16 00:00:00' 이
  -- 참이 되어(짧은 문자열이 앞섬) 마감 뒤 요청을 받아들였다. 꼴이 다른 시각 문자열은 julianday 로 견준다.
CREATE TABLE delivery_failure (
  subscription_id TEXT NOT NULL REFERENCES subscription(subscription_id),
  delivery_date TEXT NOT NULL REFERENCES delivery_day(delivery_date),
  reason TEXT NOT NULL, PRIMARY KEY (subscription_id, delivery_date));
"""

BILL = """
SELECT sb.name, s.subscription_id, COUNT(*) AS boxes, COUNT(*) * z.price_won AS fee
FROM subscription s
JOIN subscriber sb ON sb.subscriber_id = s.payer_id
JOIN box_size z ON z.size = s.size
JOIN delivery_day d ON d.delivery_date >= s.start_date
                   AND (s.end_date IS NULL OR d.delivery_date < s.end_date)
                   AND (s.period = '매주' OR d.iso_week % 2 = CASE s.parity WHEN '홀' THEN 1 ELSE 0 END)
LEFT JOIN skip k ON k.subscription_id = s.subscription_id AND k.delivery_date = d.delivery_date
LEFT JOIN delivery_failure f ON f.subscription_id = s.subscription_id AND f.delivery_date = d.delivery_date
WHERE d.delivery_date BETWEEN '2026-11-01' AND '2026-11-30' AND k.delivery_date IS NULL AND f.delivery_date IS NULL
GROUP BY s.subscription_id ORDER BY s.subscription_id
"""


def build_db(rows, analysed):
    """풀이의 맞추기 결정대로 넣는다.
    - 10·11번은 같은 구독자(연락처 같음)의 이사: 구독 하나 + 주소 기간 둘
    - 9번(북구)은 배송 지역 밖이라 넣지 않음(q 로 남김)
    - 27번(시작일 없음)은 넣지 않음(q 로 남김)
    - 7번의 '11/13' 건너뛰기는 배송일이 아니라 넣지 않음(q 로 남김)
    - 23번은 받는 사람 이수빈, 내는 사람 이수진(새 구독자 P99)
    - 건너뛰기 요청 시각은 기록이 없어 마감 직전 하루 전(배송일 -4일 12:00)으로 둠(가정)
    """
    con = sqlite3.connect(":memory:")
    con.execute("PRAGMA foreign_keys = ON")   # SQLite 는 외래 키 검사가 기본으로 꺼져 있다
    con.executescript(DDL)
    con.executemany("INSERT INTO box_size VALUES (?,?)", PRICE.items())
    con.executemany("INSERT INTO delivery_day VALUES (?,?)",
                    [(d.isoformat(), d.isocalendar()[1]) for d in NOV_THU])
    calc = {x["번호"]: x for x in analysed["행별 계산"]}
    skipped_rows = {9, 11, 27}
    for r in rows:
        n = int(r["번호"])
        if n in skipped_rows:
            continue
        sid = f"S{n:02d}"
        con.execute("INSERT INTO subscriber VALUES (?,?,?)", (sid, r["이름"], r["연락처"]))
        start, _ = parse_date(r["시작일"])
        con.execute("INSERT INTO subscriber_address VALUES (?,?,?,?,?)",
                    (sid, start.isoformat(), "2026-11-15" if n == 10 else None, r["주소"], r["구"]))
        if n == 10:
            con.execute("INSERT INTO subscriber_address VALUES (?,?,?,?,?)",
                        (sid, "2026-11-15", None, rows[10]["주소"], rows[10]["구"]))
        payer = sid
        if n == 23:
            con.execute("INSERT INTO subscriber VALUES ('P99','이수진','010-1000-0099')")
            payer = "P99"
        c = calc[n]
        con.execute("INSERT INTO subscription VALUES (?,?,?,?,?,?,?,NULL)",
                    (f"U{n:02d}", sid, payer, c["크기(맞춘 뒤)"], c["주기(맞춘 뒤)"], c.get("배송 주차"),
                     start.isoformat()))
        for part in [p.strip() for p in r["건너뛰기"].split(",") if p.strip()]:
            d, _ = parse_date(part)
            if d.weekday() == 3:
                con.execute("INSERT INTO skip VALUES (?,?,?)",
                            (f"U{n:02d}", d.isoformat(), (d - dt.timedelta(days=4)).isoformat() + " 12:00"))
        m = re.search(r"(\d{1,2}/\d{1,2}) 배송 실패", r["비고"])
        if m:
            con.execute("INSERT INTO delivery_failure VALUES (?,?,?)",
                        (f"U{n:02d}", parse_date(m.group(1))[0].isoformat(), "부재"))
    con.execute("INSERT INTO subscriber VALUES ('S98','시험용','010-0000-0098')")  # 구독이 없는 시험용 구독자
    return con


COUNTER = [
    ("마감 전 건너뛰기(일요일 23:59)", "INSERT INTO skip VALUES ('U01','2026-11-12','2026-11-08 23:59')", True),
    ("마감 뒤 건너뛰기(월요일 00:00)", "INSERT INTO skip VALUES ('U01','2026-11-19','2026-11-16 00:00')", False),
    ("배송일이 아닌 날(금요일) 건너뛰기", "INSERT INTO skip VALUES ('U01','2026-11-13','2026-11-08 10:00')", False),
    ("같은 회차 건너뛰기 두 번(멱등)", "INSERT OR IGNORE INTO skip VALUES ('U15','2026-11-05','2026-11-01 09:00')", True),
    ("표에 없는 크기 '중간'", "INSERT INTO subscription VALUES ('X1','S01','S01','중간','매주',NULL,'2026-12-01',NULL)".replace("'S01','S01'", "'S98','S98'"), False),
    ("격주인데 주차 없음", "INSERT INTO subscription VALUES ('X2','S01','S01','소','격주',NULL,'2026-12-01',NULL)".replace("'S01','S01'", "'S98','S98'"), False),
    ("한 구독자에게 겹치는 두 번째 구독", "INSERT INTO subscription VALUES ('X3','S01','S01','대','매주',NULL,'2026-12-01',NULL)", False),
    ("배송 지역 밖 주소", "INSERT INTO subscriber_address VALUES ('S01','2026-12-01',NULL,'북구 산마루길 4','북구')", False),
]


def sqlite_part(rows, analysed):
    con = build_db(rows, analysed)
    bill = [list(r) for r in con.execute(BILL)]
    calc = {f"U{x['번호']:02d}": x for x in analysed["행별 계산"] if "계산 결제" in x}
    diff = []
    for name, sub, boxes, fee in bill:
        py = calc[sub]
        # 7번은 SQL 쪽에서 11/13 건너뛰기를 넣지 않았으므로 파이썬 계산(무시)과 같아야 함
        if fee != py["계산 결제"]:
            diff.append([sub, fee, py["계산 결제"]])
    tests = []
    for label, sql, expect in COUNTER:
        con.execute("SAVEPOINT t")
        try:
            cur = con.execute(sql)
            ok, msg = True, f"받아들임(바뀐 행 {cur.rowcount})"
        except sqlite3.DatabaseError as e:
            ok, msg = False, str(e)
        con.execute("ROLLBACK TO t")
        con.execute("RELEASE t")
        tests.append({"사례": label, "기대": "받아들임" if expect else "거부", "결과": msg, "맞음": ok == expect})
    by_payer = {}
    for name, sub, boxes, fee in bill:
        by_payer[name] = by_payer.get(name, 0) + fee
    # V2 농부용 "11-26 필요량": 그 회차에 받을 꾸러미를 크기별로 세고, 농부 메모의 양(진술, 불확실)을 곱함
    need = con.execute("""
        SELECT s.size, COUNT(*),
               SUM(CASE WHEN s.subscription_id IN ('U10','U29') THEN 1 ELSE 0 END)
        FROM subscription s JOIN delivery_day d ON d.delivery_date = '2026-11-26'
         AND d.delivery_date >= s.start_date
         AND (s.period = '매주' OR d.iso_week % 2 = CASE s.parity WHEN '홀' THEN 1 ELSE 0 END)
        LEFT JOIN skip k ON k.subscription_id = s.subscription_id AND k.delivery_date = d.delivery_date
        WHERE k.delivery_date IS NULL GROUP BY s.size ORDER BY s.size""").fetchall()
    tomato_g = {"소": 300, "중": 600, "대": 1000}
    eggs = {"소": 6, "중": 10, "대": 15}
    v2 = {"크기별 꾸러미 수(달걀 알레르기 수)": {z: [n, a] for z, n, a in need},
          "토마토 g": sum(tomato_g[z] * n for z, n, a in need),
          "달걀 구": sum(eggs[z] * (n - a) for z, n, a in need),
          "두부 모(달걀 대신)": sum(a for z, n, a in need)}
    return {"V2 2026-11-26 필요량": v2, "SQLite 청구 행 수": len(bill), "SQLite 청구": bill, "파이썬 계산과 다른 행": diff,
            "SQLite 청구 합계": sum(r[3] for r in bill), "반례 시험": tests,
            "박서준 청구(이사 반영)": by_payer.get("박서준")}


if __name__ == "__main__":
    rows = load()
    a = analyse(rows)
    a["SQLite"] = sqlite_part(rows, a)
    a["sqlite_version"] = sqlite3.sqlite_version
    print(json.dumps(a, ensure_ascii=False, indent=2))
