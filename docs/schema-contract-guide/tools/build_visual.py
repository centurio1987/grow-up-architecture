#!/usr/bin/env python3
"""도해판(visual.html) 굽기.

원본은 visual/ 폴더에 있습니다.
  page.html    뼈대. <!--@STYLE--> 와 <!--@SCRIPT--> 자리에 아래 것들이 들어갑니다.
  style.css    모양
  data-*.js    내용(원고에서 옮긴 표·예·질문). 부마다 한 파일이고 이름순으로 붙습니다.
               원고가 바뀌면 이 파일들을 고칩니다.
  app.js       공통 도구와 시작 순서. /*@SECTIONS*/ 자리에 sec-*.js 가 이름순으로 들어갑니다.
  sec-*.js     장마다 그림을 그리고 손으로 만지는 동작

서체는 index.html 과 같은 규칙을 따릅니다. 원본에 쓰인 글자만 남겨(subset) data URI 로 넣으므로
바깥 요청이 0건이고 오프라인에서 열립니다. subset 은 publish-report 스킬에 동봉된 서체 파일과
`uvx --from fonttools --with brotli pyftsubset` 으로 합니다.

  python3 tools/build_visual.py            (docs/schema-contract-guide 에서)
"""
from __future__ import annotations

import hashlib
import re
import subprocess
import sys
import tempfile
from base64 import b64encode
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "visual"
OUT = ROOT / "visual.html"
FONT_DIR = Path.home() / ".claude/skills/publish-report/assets/fonts"
CACHE = ROOT / "visual" / ".font-cache"

FACES = [
    ("Pretendard", 400, "pretendard-400-normal.woff2", False),
    ("Pretendard", 500, "pretendard-500-normal.woff2", False),
    ("Pretendard", 700, "pretendard-700-normal.woff2", False),
    ("IBM Plex Mono", 400, "ibm-plex-mono-latin-400-normal.woff2", True),
    ("IBM Plex Mono", 500, "ibm-plex-mono-latin-500-normal.woff2", True),
]

# 굽기 가드: 바깥으로 나가는 요청을 만드는 꼴. 본문 링크(<a href>)는 요청이 아니라서 보지 않습니다.
EXTERNAL = re.compile(r"""(<script[^>]+src=|<link[^>]+href=|url\(\s*['"]?https?:|@import|fetch\()""", re.I)


def subset(face: tuple, text: str) -> str:
    family, weight, file, latin_only = face
    if latin_only:
        text = "".join(c for c in text if ord(c) < 0x2500)
    key = hashlib.sha1((file + text).encode("utf-8")).hexdigest()[:16]
    CACHE.mkdir(exist_ok=True)
    cached = CACHE / f"{file}.{key}.woff2"
    if not cached.exists():
        for old in CACHE.glob(f"{file}.*.woff2"):
            old.unlink()
        with tempfile.TemporaryDirectory() as work:
            txt = Path(work) / "chars.txt"
            txt.write_text(text, encoding="utf-8")
            cmd = [
                "uvx", "--quiet", "--from", "fonttools", "--with", "brotli", "pyftsubset",
                str(FONT_DIR / file), f"--text-file={txt}", "--flavor=woff2",
                f"--output-file={cached}", "--layout-features=*",
            ]
            subprocess.run(cmd, check=True, timeout=180)
    data = b64encode(cached.read_bytes()).decode("ascii")
    return (
        f"@font-face{{font-family:'{family}';font-style:normal;font-weight:{weight};"
        f"font-display:block;src:url('data:font/woff2;base64,{data}') format('woff2')}}"
    )


def main() -> int:
    page = (SRC / "page.html").read_text(encoding="utf-8")
    style = (SRC / "style.css").read_text(encoding="utf-8")
    data_files = sorted(SRC.glob("data-*.js"))
    sec_files = sorted(SRC.glob("sec-*.js"))
    data = "var D = {};\n" + "\n".join(f.read_text(encoding="utf-8") for f in data_files)
    secs = "\n".join(f.read_text(encoding="utf-8") for f in sec_files)
    app = (SRC / "app.js").read_text(encoding="utf-8").replace("/*@SECTIONS*/", secs)

    problems = []
    named = [("page.html", page), ("style.css", style), ("app.js", app)]
    named += [(f.name, f.read_text(encoding="utf-8")) for f in data_files + sec_files]
    for name, body in named:
        for m in EXTERNAL.finditer(body):
            problems.append(f"{name}: 바깥 요청이 될 수 있는 꼴 `{m.group(0)}`")
    if problems:
        print("\n".join(problems), file=sys.stderr)
        return 2

    chars = set(page + style + data + app)
    chars.update(" 0123456789.,:;!?()[]{}-–—/·%+=<>\"'…→←↔▼▶")
    for c in list(chars):
        if c.isascii() and c.isalpha():
            chars.add(c.upper())
            chars.add(c.lower())
    text = "".join(sorted(c for c in chars if c.strip() or c == " "))
    fonts = "\n".join(subset(f, text) for f in FACES)

    html = page.replace("<!--@STYLE-->", f"<style>\n{fonts}\n{style}\n</style>")
    html = html.replace("<!--@SCRIPT-->", f"<script>\n{data}\n{app}\n</script>")
    OUT.write_text(html, encoding="utf-8")
    print(f"{OUT.relative_to(ROOT)} {OUT.stat().st_size:,} 바이트, 글자 {len(text):,}종")
    return 0


if __name__ == "__main__":
    sys.exit(main())
