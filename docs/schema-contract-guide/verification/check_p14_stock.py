#!/usr/bin/env python3
"""P14: 지금 재고(TB_STOCK)에서 기간 내 입출고 순증감을 빼서 기간 시작 재고를 거꾸로 계산합니다.

순증감은 I·R 은 더하고 O 는 빼고 A 는 부호 그대로 더한다고 가정합니다(R 의 방향은 q).
기간 시작 재고가 음수로 나오면, 재고 표와 입출고 기록이 서로 맞지 않는다는 관찰입니다.
"""
import json
import sqlite3
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "problems" / "data"
con = sqlite3.connect(":memory:")
con.executescript((DATA / "p14-hardware-store.sql").read_text(encoding="utf-8"))
rows = con.execute("""
WITH net AS (
  SELECT ITEM_CD, WH_CD,
         SUM(CASE IO_GB WHEN 'O' THEN -QTY ELSE QTY END) AS net
  FROM TB_INOUT GROUP BY ITEM_CD, WH_CD
)
SELECT s.ITEM_CD, s.WH_CD, s.QTY, COALESCE(n.net, 0), s.QTY - COALESCE(n.net, 0)
FROM TB_STOCK s LEFT JOIN net n ON n.ITEM_CD = s.ITEM_CD AND n.WH_CD = s.WH_CD
ORDER BY s.ITEM_CD, s.WH_CD""").fetchall()
out = [{"품목": a, "창고": b, "지금 재고": q, "기간 순증감": n, "기간 시작 재고(역산)": o} for a, b, q, n, o in rows]
print(json.dumps({"행": out, "역산이 음수인 행": [x for x in out if x["기간 시작 재고(역산)"] < 0]},
                 ensure_ascii=False, indent=2))
