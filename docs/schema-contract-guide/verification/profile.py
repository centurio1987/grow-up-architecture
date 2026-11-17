#!/usr/bin/env python3
"""실습 자료(CSV)의 프로파일을 계산합니다.

풀이에 적은 유일 열 조합·함수 종속·포함 종속 값이 손으로 짐작한 값이 아니라
실제 계산 결과인지 확인하려고 만든 스크립트입니다. 표준 라이브러리만 씁니다.

    python3 profile.py <표.csv> [--max-lhs 2] [--max-ucc 3] [--json]
    python3 profile.py --ind <A.csv>:<열> <B.csv>:<열>

- 빈 칸은 결측(null)으로 세되, 유일성·종속 계산에서는 빈 문자열 값 하나로 취급합니다.
- 함수 종속은 왼쪽이 이미 유일 열 조합(슈퍼키)인 것은 뺍니다. 그런 종속은 늘 성립하므로
  알려 주는 것이 없습니다.
- 근사 종속의 오차는 g3(종속을 성립시키려면 지워야 하는 최소 행 수 / 전체 행 수)입니다.
"""
from __future__ import annotations

import argparse
import csv
import itertools
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path


def load(path: str) -> tuple[list[str], list[dict[str, str]]]:
    with open(path, newline="", encoding="utf-8") as f:
        r = csv.DictReader(f)
        rows = [dict(x) for x in r]
        return list(r.fieldnames or []), rows


def is_unique(rows, cols) -> bool:
    seen = set()
    for row in rows:
        k = tuple(row[c] for c in cols)
        if k in seen:
            return False
        seen.add(k)
    return True


def minimal_uccs(cols, rows, max_size):
    found: list[tuple[str, ...]] = []
    for size in range(1, max_size + 1):
        for combo in itertools.combinations(cols, size):
            if any(set(f) <= set(combo) for f in found):
                continue
            if is_unique(rows, combo):
                found.append(combo)
    return found


def g3_error(rows, lhs, rhs) -> tuple[int, list[tuple]]:
    """종속 lhs -> rhs 를 성립시키려면 지워야 하는 최소 행 수와 어긋난 왼쪽 값들."""
    groups: dict[tuple, Counter] = defaultdict(Counter)
    for row in rows:
        groups[tuple(row[c] for c in lhs)][row[rhs]] += 1
    remove = 0
    broken = []
    for k, cnt in groups.items():
        if len(cnt) > 1:
            remove += sum(cnt.values()) - max(cnt.values())
            broken.append((k, dict(cnt)))
    return remove, broken


def minimal_fds(cols, rows, uccs, max_lhs):
    supers = [set(u) for u in uccs]
    exact: list[tuple[tuple[str, ...], str]] = []
    for size in range(1, max_lhs + 1):
        for lhs in itertools.combinations(cols, size):
            if any(s <= set(lhs) for s in supers):
                continue
            for rhs in cols:
                if rhs in lhs:
                    continue
                # 더 작은 왼쪽으로 이미 성립하면 최소가 아님
                if any(set(l) < set(lhs) and r == rhs for l, r in exact):
                    continue
                if g3_error(rows, lhs, rhs)[0] == 0:
                    exact.append((lhs, rhs))
    return exact


def column_stats(cols, rows):
    out = {}
    for c in cols:
        vals = [r[c] for r in rows]
        out[c] = {
            "distinct": len(set(vals)),
            "null": sum(1 for v in vals if v == ""),
            "top": Counter(vals).most_common(2),
        }
    return out


def profile(path, max_lhs, max_ucc):
    cols, rows = load(path)
    uccs = minimal_uccs(cols, rows, max_ucc)
    fds = minimal_fds(cols, rows, uccs, max_lhs)
    return {
        "file": Path(path).name,
        "rows": len(rows),
        "columns": column_stats(cols, rows),
        "minimal_uccs": [list(u) for u in uccs],
        "minimal_fds": [{"lhs": list(l), "rhs": r} for l, r in fds],
    }


def approx(path, lhs, rhs):
    cols, rows = load(path)
    remove, broken = g3_error(rows, lhs, rhs)
    return {"lhs": lhs, "rhs": rhs, "remove_rows": remove, "rows": len(rows),
            "g3": round(remove / len(rows), 4), "broken": [[list(k), v] for k, v in broken]}


def ind(a: str, b: str):
    fa, ca = a.rsplit(":", 1)
    fb, cb = b.rsplit(":", 1)
    _, ra = load(fa)
    _, rb = load(fb)
    va = {r[ca] for r in ra if r[ca] != ""}
    vb = {r[cb] for r in rb if r[cb] != ""}
    return {"dependent": a, "referenced": b, "holds": va <= vb, "missing": sorted(va - vb)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("file", nargs="?")
    ap.add_argument("--max-lhs", type=int, default=2)
    ap.add_argument("--max-ucc", type=int, default=3)
    ap.add_argument("--approx", nargs=2, metavar=("LHS", "RHS"), help="쉼표로 왼쪽 열, 오른쪽 열 하나")
    ap.add_argument("--ind", nargs=2, metavar=("A:col", "B:col"))
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()
    if a.ind:
        res = ind(*a.ind)
    elif a.approx:
        res = approx(a.file, a.approx[0].split(","), a.approx[1])
    else:
        res = profile(a.file, a.max_lhs, a.max_ucc)
    json.dump(res, sys.stdout, ensure_ascii=False, indent=2)
    print()


if __name__ == "__main__":
    main()
