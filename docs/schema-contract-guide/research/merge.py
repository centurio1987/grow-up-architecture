#!/usr/bin/env python3
"""리서치 조각(parts/)을 하나의 문서로 합치고 소스 번호를 전역 번호로 바꿉니다.

조각마다 소스 번호에 접두어(A-S1, B-S1 …)를 붙여 두었으므로, 합칠 때 소스 목록의 등장 순서대로
S1…SN 을 매기고 본문의 표기를 한꺼번에 바꿉니다. 같은 주소를 가리키는 소스는 하나로 묶습니다.

    python3 merge.py   # research/2026-11-17-three-schema-and-contract.md 를 씁니다
"""
from __future__ import annotations

import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
PARTS = ["A-three-schema.md", "B-method.md", "C-contract.md", "D-seeds.md"]
SRC_LINE = re.compile(r"^- ([A-D]-S\d+)\. (.*)$")
TOKEN = re.compile(r"\b([A-D]-S\d+)\b")
URL = re.compile(r"https?://\S+")


def norm(url: str) -> str:
    u = url.rstrip(",)").replace("http://", "https://").replace("://www.", "://")
    return u.rstrip("/")


def main():
    bodies, sources = [], []  # sources: (old_id, text)
    oq = []
    for name in PARTS:
        text = (HERE / "parts" / name).read_text(encoding="utf-8")
        keep, mode = [], "body"
        for line in text.splitlines():
            if re.match(r"^### \d+\.y 소스", line):
                mode = "src"
                continue
            if re.match(r"^### \d+\.x ", line):
                mode = "oq"
                continue
            if mode == "src":
                m = SRC_LINE.match(line)
                if m:
                    sources.append((m.group(1), m.group(2)))
                continue
            if mode == "oq":
                if line.startswith("### ") or line.startswith("## "):
                    mode = "body"
                else:
                    if line.strip():
                        oq.append(line)
                    continue
            keep.append(line)
        bodies.append("\n".join(keep).strip())

    mapping, out_sources, seen = {}, [], {}
    for old, rest in sources:
        urls = URL.findall(rest)
        key = norm(urls[0]) if urls else rest
        if key in seen:
            mapping[old] = seen[key]
            continue
        new = f"S{len(out_sources) + 1}"
        seen[key] = new
        mapping[old] = new
        out_sources.append(f"- {new}. {rest}")

    # 조각마다 절 번호를 따로 매겼으므로 합친 순서대로 다시 매깁니다
    h2 = h3 = 0
    renum = []
    for line in "\n\n".join(bodies).splitlines():
        m2 = re.match(r"^## \d+\. (.*)$", line)
        m3 = re.match(r"^### \d+\.\d+ (.*)$", line)
        if m2:
            h2, h3 = h2 + 1, 0
            line = f"## {h2}. {m2.group(1)}"
        elif m3:
            h3 += 1
            line = f"### {h2}.{h3} {m3.group(1)}"
        renum.append(line)
    bodies = ["\n".join(renum)]

    head = (HERE / "parts" / "00-head.md").read_text(encoding="utf-8")
    tail = (HERE / "parts" / "90-tail.md").read_text(encoding="utf-8")
    doc = head.replace("{{COUNT}}", str(len(out_sources))) + "\n" + "\n\n".join(bodies) + "\n\n" + tail
    doc += "\n\n## 소스 목록\n\n" + "\n".join(out_sources) + "\n"

    missing = sorted({t for t in TOKEN.findall(doc) if t not in mapping})
    doc = TOKEN.sub(lambda m: mapping.get(m.group(1), m.group(1)), doc)
    out = HERE / "2026-11-17-three-schema-and-contract.md"
    out.write_text(doc, encoding="utf-8")
    print(f"소스 {len(sources)}개 → 중복을 묶어 {len(out_sources)}개, 출력 {out.name}")
    if missing:
        print("목록에 없는 소스 번호:", ", ".join(missing))
    print(f"조각별 open questions {len(oq)}줄은 꼬리의 통합 목록으로 대신했습니다.")


if __name__ == "__main__":
    main()
