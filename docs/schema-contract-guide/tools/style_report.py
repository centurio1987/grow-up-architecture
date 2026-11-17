#!/usr/bin/env python3
"""원고마다 박자 등급(scan_ai_style)과 어휘 규약(scan_lexicon) 결과를 모아 verification/style-report.json 에 씁니다.

    python3 tools/style_report.py

어휘 검사의 '양태부사' 분류는 명사 '사실'(fact)을 부사로 세는 오탐이 있어서, 그 분류만 남은 경우를
"오탐만 남음"으로 따로 표시합니다(design/writing-rules.md 6절).
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KIT = Path.home() / ".claude/plugins/cache/centurio87-plugins/authoring-kit/0.4.2/scripts"
sys.path.insert(0, str(ROOT / "tools"))
from build import sources  # noqa: E402


def grade(path: Path) -> str:
    r = subprocess.run([sys.executable, str(KIT / "scan_ai_style.py"), str(path)], capture_output=True, text=True)
    m = re.search(r"자연스러움 등급: \*\*(\S+)\*\*", r.stdout)
    return m.group(1) if m else "등급 없음"


def lexicon(path: Path) -> dict:
    r = subprocess.run([sys.executable, str(KIT / "scan_lexicon.py"), str(path), "--voice", "ppangtolab-teacher", "--json"],
                       capture_output=True, text=True)
    d = json.loads(r.stdout)
    cats = sorted({c["label"] for c in d.get("category", [])})
    if d["pass"]:
        state = "통과"
    elif not d["over"] and cats == ["양태부사"]:
        state = "오탐만 남음(양태부사: 명사 '사실')"
    else:
        state = "적발 있음"
    return {"결과": state, "허용량 초과": [x["forms"] for x in d["over"]], "분류": cats}


def main():
    rows = []
    for p in sources():
        rows.append({"파일": str(p.relative_to(ROOT)), "박자 등급": grade(p), **lexicon(p)})
    out = ROOT / "verification" / "style-report.json"
    out.write_text(json.dumps(rows, ensure_ascii=False, indent=1), encoding="utf-8")
    bad = [r for r in rows if r["박자 등급"] not in ("A", "B", "등급 없음") or r["결과"] == "적발 있음"]
    for r in rows:
        print(f"{r['박자 등급']:6} {r['결과']:28} {r['파일']}")
    print(f"\n파일 {len(rows)}개 · 기준 미달 {len(bad)}개 → {out.relative_to(ROOT)}")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
