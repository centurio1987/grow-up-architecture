#!/usr/bin/env python3
"""13장의 인구 왕복을 SQLite 에서 실제로 실행합니다.

12장의 PostgreSQL DDL 을 SQLite 에서 돌 수 있게 고친 판입니다.
- 배제 제약(R3, R8) 대신 BEFORE 트리거로 겹침을 막습니다.
- 시각은 'YYYY-MM-DD HH:MM' 문자열(한국 시간)로 둡니다. 같은 꼴이라 문자열 비교가 시간 비교와 같습니다.
- 구간은 [시작, 끝) 입니다. 겹침 조건은 a.시작 < b.끝 AND b.시작 < a.끝 입니다.

    python3 tum_roundtrip.py      # 결과 JSON 을 출력합니다
"""
from __future__ import annotations

import json
import sqlite3

DDL = """
CREATE TABLE grade (
  grade_name TEXT PRIMARY KEY,
  free_minutes INTEGER NOT NULL CHECK (free_minutes >= 0),
  overage_won_per30 INTEGER NOT NULL CHECK (overage_won_per30 >= 0)
);
CREATE TABLE member (
  member_id TEXT PRIMARY KEY,
  name TEXT,
  status TEXT NOT NULL CHECK (status IN ('active','left')),
  CHECK (status = 'left' OR name IS NOT NULL)                      -- R9
);
CREATE TABLE member_grade_period (
  member_id TEXT NOT NULL REFERENCES member(member_id),
  grade_name TEXT NOT NULL REFERENCES grade(grade_name),
  valid_from TEXT NOT NULL,
  valid_to TEXT,
  PRIMARY KEY (member_id, valid_from),
  CHECK (valid_to IS NULL OR valid_to > valid_from)
);
CREATE TRIGGER r8_no_overlap BEFORE INSERT ON member_grade_period
WHEN EXISTS (SELECT 1 FROM member_grade_period p
             WHERE p.member_id = NEW.member_id
               AND p.valid_from < COALESCE(NEW.valid_to, '9999-12-31')
               AND NEW.valid_from < COALESCE(p.valid_to, '9999-12-31'))
BEGIN SELECT RAISE(ABORT, 'R8 등급 기간 겹침'); END;

CREATE TABLE room (
  room_code TEXT PRIMARY KEY,
  capacity INTEGER CHECK (capacity BETWEEN 1 AND 20)
);
CREATE TABLE booking (
  booking_id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL REFERENCES member(member_id),
  room_code TEXT NOT NULL REFERENCES room(room_code),
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('confirmed','cancelled','used','no_show')),
  cancelled_at TEXT,
  CHECK (ends_at > starts_at),                                                        -- R2
  CHECK (CAST(round((julianday(ends_at) - julianday(starts_at)) * 1440) AS INTEGER) <= 240), -- R2
  CHECK (substr(starts_at, 15, 2) IN ('00','30') AND substr(ends_at, 15, 2) IN ('00','30')), -- R2
  CHECK ((status = 'cancelled') = (cancelled_at IS NOT NULL))                          -- R6
);
CREATE TRIGGER r3_no_overlap_ins BEFORE INSERT ON booking
WHEN NEW.status = 'confirmed' AND EXISTS (
  SELECT 1 FROM booking b
  WHERE b.room_code = NEW.room_code AND b.status = 'confirmed'
    AND b.starts_at < NEW.ends_at AND NEW.starts_at < b.ends_at)
BEGIN SELECT RAISE(ABORT, 'R3 확정 예약 겹침'); END;
CREATE TRIGGER r4_transition BEFORE UPDATE OF status ON booking
WHEN OLD.status <> 'confirmed' AND NEW.status <> OLD.status
BEGIN SELECT RAISE(ABORT, 'R4 확정이 아닌 예약의 상태 변경'); END;
"""

POP = """
INSERT INTO grade VALUES ('일반', 120, 3000), ('상주', 600, 3000);
INSERT INTO member VALUES ('M07','김하나','active'), ('M12','박도윤','active'), ('M31','이서준','active');
INSERT INTO member_grade_period VALUES
  ('M07','일반','2026-11-01','2026-11-15'), ('M07','상주','2026-11-15',NULL),
  ('M12','상주','2026-10-01',NULL), ('M31','일반','2026-09-01',NULL);
INSERT INTO room VALUES ('R1', 6), ('R2', 4), ('R3', NULL);
INSERT INTO booking VALUES
  ('B101','M07','R1','2026-11-17 10:00','2026-11-17 11:30','confirmed',NULL),
  ('B102','M12','R1','2026-11-17 11:30','2026-11-17 12:00','confirmed',NULL),
  ('B103','M07','R2','2026-11-17 14:00','2026-11-17 16:00','confirmed',NULL),
  ('B104','M31','R3','2026-11-18 09:00','2026-11-18 10:00','confirmed',NULL),
  ('B105','M31','R1','2026-11-19 13:00','2026-11-19 14:00','confirmed',NULL),
  ('B106','M31','R2','2026-11-20 15:00','2026-11-20 17:00','confirmed',NULL),
  ('B107','M07','R3','2026-11-21 10:00','2026-11-21 12:00','confirmed',NULL);
"""

V2 = """
SELECT b.room_code, substr(b.starts_at, 12, 5), substr(b.ends_at, 12, 5), m.name, r.capacity
FROM booking b JOIN member m ON m.member_id = b.member_id JOIN room r ON r.room_code = b.room_code
WHERE b.status = 'confirmed' AND substr(b.starts_at, 1, 10) = :today
ORDER BY b.room_code, b.starts_at
"""

TRANSITIONS = """
UPDATE booking SET status = 'used' WHERE booking_id IN ('B101','B102','B103','B107');
UPDATE booking SET status = 'cancelled', cancelled_at = '2026-11-18 08:30' WHERE booking_id = 'B104';
UPDATE booking SET status = 'cancelled', cancelled_at = '2026-11-18 20:00' WHERE booking_id = 'B105';
UPDATE booking SET status = 'no_show' WHERE booking_id = 'B106';
"""

# D1: 이용완료·노쇼 + 시작 1시간 전보다 늦게 취소한 예약의 길이 합 (R5, 1시간 전까지는 무료)
# 등급은 q4 의 답 (가) "월말 기준" 을 따른다고 가정
V3 = """
WITH counted AS (
  SELECT member_id,
         CAST(round((julianday(ends_at) - julianday(starts_at)) * 1440) AS INTEGER) AS minutes
  FROM booking
  WHERE substr(starts_at, 1, 7) = :month
    AND (status IN ('used','no_show')
         OR (status = 'cancelled' AND cancelled_at > datetime(starts_at, '-60 minutes')))
), usage AS (
  SELECT member_id, SUM(minutes) AS used_minutes FROM counted GROUP BY member_id
), grade_at_end AS (
  SELECT p.member_id, g.grade_name, g.free_minutes, g.overage_won_per30
  FROM member_grade_period p JOIN grade g ON g.grade_name = p.grade_name
  WHERE p.valid_from <= :month_end AND (p.valid_to IS NULL OR p.valid_to > :month_end)
)
SELECT m.name, e.grade_name, u.used_minutes, e.free_minutes,
       MAX(0, u.used_minutes - e.free_minutes) AS over_minutes,
       ((MAX(0, u.used_minutes - e.free_minutes) + 29) / 30) * e.overage_won_per30 AS fee
FROM usage u JOIN member m ON m.member_id = u.member_id JOIN grade_at_end e ON e.member_id = u.member_id
ORDER BY m.name
"""

COUNTER = [
    ("R3 겹치는 확정 예약", "INSERT INTO booking VALUES ('X1','M12','R1','2026-11-17 11:00','2026-11-17 12:00','confirmed',NULL)", False),
    ("R3 이어지는 예약(끝=다음 시작)", "INSERT INTO booking VALUES ('X2','M31','R1','2026-11-17 12:00','2026-11-17 12:30','confirmed',NULL)", True),
    ("R3 취소된 예약은 겹쳐도 됨", "INSERT INTO booking VALUES ('X3','M31','R1','2026-11-17 10:00','2026-11-17 11:00','cancelled','2026-11-16 09:00')", True),
    ("R2 15분 경계", "INSERT INTO booking VALUES ('X4','M31','R3','2026-11-22 10:15','2026-11-22 11:00','confirmed',NULL)", False),
    ("R2 4시간 30분", "INSERT INTO booking VALUES ('X5','M31','R3','2026-11-22 09:00','2026-11-22 13:30','confirmed',NULL)", False),
    ("R6 취소 시각 없는 취소", "INSERT INTO booking VALUES ('X6','M31','R3','2026-11-23 09:00','2026-11-23 10:00','cancelled',NULL)", False),
    ("R8 겹치는 등급 기간", "INSERT INTO member_grade_period VALUES ('M07','일반','2026-11-20',NULL)", False),
    ("R9 이름 없는 활동 회원", "INSERT INTO member VALUES ('M99', NULL, 'active')", False),
    ("외래 키: 없는 회원의 예약", "INSERT INTO booking VALUES ('X7','M99','R3','2026-11-24 09:00','2026-11-24 10:00','confirmed',NULL)", False),
]


def run():
    con = sqlite3.connect(":memory:")
    con.execute("PRAGMA foreign_keys = ON")   # SQLite 는 외래 키 검사가 기본으로 꺼져 있음
    con.executescript(DDL)
    con.executescript(POP)
    out = {"sqlite_version": sqlite3.sqlite_version, "foreign_keys": con.execute("PRAGMA foreign_keys").fetchone()[0],
           "V2_2026-11-17": [list(r) for r in con.execute(V2, {"today": "2026-11-17"})]}

    tests = []
    for name, sql, should_pass in COUNTER:
        con.execute("SAVEPOINT t")
        try:
            con.execute(sql)
            ok, msg = True, "받아들임"
        except sqlite3.DatabaseError as e:
            ok, msg = False, str(e)
        con.execute("ROLLBACK TO t")
        con.execute("RELEASE t")
        tests.append({"사례": name, "기대": "받아들임" if should_pass else "거부",
                      "결과": msg, "맞음": ok == should_pass})
    out["반례 시험"] = tests

    con.executescript(TRANSITIONS)
    con.execute("SAVEPOINT t")
    try:
        con.execute("UPDATE booking SET status = 'confirmed' WHERE booking_id = 'B101'")
        r4 = "받아들임"
    except sqlite3.DatabaseError as e:
        r4 = str(e)
    con.execute("ROLLBACK TO t")
    out["R4 이용완료 → 확정"] = r4
    out["V3_2026-11"] = [list(r) for r in con.execute(V3, {"month": "2026-11", "month_end": "2026-11-30"})]
    return out


if __name__ == "__main__":
    print(json.dumps(run(), ensure_ascii=False, indent=2))
