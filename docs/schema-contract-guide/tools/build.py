#!/usr/bin/env python3
"""원고를 한 파일(guide.md)로 모으고 publish-report 로 index.html 을 굽습니다.

    python3 tools/build.py            # 모으기 + 글자 검사 + 굽기
    python3 tools/build.py --no-html  # 모으기 + 글자 검사만

순서: chapters/ (파일 이름순) → problems/00-guide.md → problems/P*.md → appendix/ (파일 이름순).
정본은 chapters/·problems/·appendix/ 의 원고이고, guide.md 와 index.html 은 이 스크립트가 만드는 파생물입니다.
파생물을 손으로 고치지 않습니다.
"""
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENGINE = Path.home() / ".claude/skills/publish-report"

FRONT = """---
title: 세 층 스키마와 계약
eyebrow: 외부 스키마 · 개념 스키마 · 내부 스키마 · 계약
date: 2026-11-17
author: grow-up-architecture
toc: side
---
"""


def sources() -> list[Path]:
    ch = sorted((ROOT / "chapters").glob("*.md"))
    guide = [ROOT / "problems" / "00-guide.md"]
    probs = sorted((ROOT / "problems").glob("P*.md"))
    app = sorted((ROOT / "appendix").glob("*.md"))
    return [p for p in ch + guide + probs + app if p.exists()]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-html", action="store_true")
    a = ap.parse_args()

    files = sources()
    rel = [str(p.relative_to(ROOT)) for p in files]
    glyph = subprocess.run([sys.executable, str(ROOT / "tools/check_glyphs.py"), *rel],
                           cwd=ROOT, capture_output=True, text=True)
    print(glyph.stdout.strip().splitlines()[-1])
    if glyph.returncode != 0:
        print(glyph.stdout)
        sys.exit("굽기 가드에 걸리는 글자가 있습니다. 원고를 고친 뒤 다시 실행하세요.")

    body = "\n\n".join(p.read_text(encoding="utf-8").strip() for p in files)
    out = ROOT / "guide.md"
    out.write_text(FRONT + "\n" + body + "\n", encoding="utf-8")
    print(f"모음: {len(files)}개 파일 → {out.relative_to(ROOT)} ({out.stat().st_size // 1024}KB)")

    if a.no_html:
        return
    html = ROOT / "index.html"
    r = subprocess.run(["bun", "engine/publish.ts", str(out), "--out", str(html)],
                       cwd=ENGINE, capture_output=True, text=True)
    log = (r.stdout + r.stderr).strip()
    (ROOT / "verification" / "build-log.txt").write_text(log + f"\n종료 코드 {r.returncode}\n", encoding="utf-8")
    print(log)
    if r.returncode != 0:
        sys.exit(f"굽기 실패(종료 코드 {r.returncode}). verification/build-log.txt 를 보세요.")


if __name__ == "__main__":
    main()
