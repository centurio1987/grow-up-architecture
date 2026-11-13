#!/usr/bin/env python3
"""render-guides.py — 패턴 가이드 md(정본)를 자립형 HTML(파생물)로 그린다.

사용:
  python3 scripts/render-guides.py <md…> [--out-dir DIR] [--force]
  python3 scripts/render-guides.py --all [--out-dir DIR] [--force]
  python3 scripts/render-guides.py --check (--all | <md…>) [--out-dir DIR]

- 출력 경로는 pattern-guide/ 아래 하위 디렉토리를 미러링한다:
  pattern-guide/<track>/<slug>/<slug>-guide_v1.0.0.md → 같은 폴더의 <slug>-guide_v1.0.0.html
  참고 문서 pattern-guide/reference/<slug>/<slug>-ref_v1.0.0.md 도 같은 규칙(같은 폴더에 .html)
  (--out-dir 를 주면 그 아래에 계열·패턴 폴더를 미러링한다)
- `### 구현` 절에서 연속한 java · typescript(ts) · rust 펜스(`no-compile` 없음)를 탭 위젯 하나로 묶는다.
- 도식은 viz 컴포넌트를 렌더한 이미지를 본문이 가리키고, 렌더러가 그것을 data URI 로 박는다.
  이미지가 없으면 그 문서는 쓰지 않고 비-0 으로 끝난다(조용한 폴백 없음).
- CSS·JS 는 scripts/assets/ 에서 읽어 인라인한다. 외부 요청 0.
- HTML 앞 2KB 안에 `<!-- guide-fp:<hex> -->` 지문을 박는다. 지문 입력은 fingerprint() 참고.
  다른 스크립트가 importlib 로 fingerprint()·output_path()·read_embedded_fingerprint() 를 불러 쓴다
  — 모듈 import 에 부작용이 없어야 한다.
- 결과는 stdout 에 JSON 한 줄. 렌더: {"written","fresh","errors"} / --check: {"fresh","stale","missing","errors"}.
  종료코드: 렌더 오류 1 · --check 에서 stale/missing/오류 1 · 인자 오류 2.

마크다운 변환은 표준 라이브러리만 쓴다(외부 파서 없음). 지원: ATX 헤딩(앵커 id), 문단, 목록(중첩·loose/tight),
파이프 표(코드 스팬 안의 `|` 는 셀 경계가 아님), 인용, 코드 펜스, 인라인 코드·굵게·기울임·취소선·링크, 수평선.
HTML 주석은 출력하지 않는다(코드 펜스·코드 스팬 안은 보존). 원시 HTML 은 이스케이프해 글자로 보인다.
"""
from __future__ import annotations

import argparse
import concurrent.futures
import base64
import hashlib
import html
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path
from urllib.parse import quote, unquote

# ── 경로 ─────────────────────────────────────────────────────────────
SCRIPTS_DIR = Path(os.path.abspath(__file__)).parent
ROOT = SCRIPTS_DIR.parent
GUIDE_ROOT = ROOT / "pattern-guide"
DEFAULT_OUT_DIR = GUIDE_ROOT / "html"
TARGET_DIRS = ("design-pattern-guide", "ddd-analysis-pattern-guide", "reference")
TARGET_SUFFIX = ".md"
# 한 편 = 폴더 하나, 파일명에 semver. 가이드는 -guide_v, 참고 문서(reference/)는 -ref_v.
GUIDE_RE = re.compile(r"^[a-z0-9-]+-(?:guide|ref)_v\d+\.\d+\.\d+\.md$")

RENDERER = Path(os.path.abspath(__file__))
ASSET_CSS = SCRIPTS_DIR / "assets" / "guide.css"
ASSET_JS = SCRIPTS_DIR / "assets" / "guide-tabs.js"
PUPPETEER_CONFIG = SCRIPTS_DIR / "puppeteer-config.json"
NODE_MODULES = SCRIPTS_DIR / "node_modules"

FP_RE = re.compile(r"<!-- guide-fp:([0-9a-f]{64}) -->")
FP_SCAN_BYTES = 2048

TAB_LANGS = {"java": "java", "typescript": "typescript", "ts": "typescript", "rust": "rust"}
TAB_LABELS = {"java": "Java", "typescript": "TypeScript", "rust": "Rust"}
IMPL_HEADING = "구현"
NO_COMPILE = "no-compile"

MERMAID_ARGS = ("-t", "neutral", "-b", "transparent")
MERMAID_ID_PLACEHOLDER = "mmdph0svg"
MERMAID_TIMEOUT_SEC = 180


class RenderError(Exception):
    """렌더 실패 — 해당 문서는 쓰지 않는다."""


# ── 지문 · 경로 계약(검사기와 공유) ───────────────────────────────────
IMG_RE = re.compile(r"!\[[^\]]*\]\(([^)\s]+)\)")


def referenced_images(md_path) -> list[Path]:
    """md 가 가리키는 **로컬 이미지**. HTML 에 data URI 로 박히므로 지문 입력이기도 하다."""
    md = Path(md_path)
    try:
        text = md.read_text(encoding="utf-8")
    except OSError:
        return []
    out = []
    for dest in IMG_RE.findall(text):
        if dest.startswith(("http://", "https://", "data:")):
            continue
        out.append((md.parent / dest).resolve())
    return sorted(set(out))


def fingerprint_inputs(md_path) -> list[tuple[str, Path]]:
    """지문 입력 목록. md + 렌더러 + CSS + 탭 JS + 본문이 가리키는 도식 이미지."""
    base = [
        ("md", Path(md_path)),
        ("renderer", RENDERER),
        ("css", ASSET_CSS),
        ("js", ASSET_JS),
    ]
    return base + [(f"img:{p.name}", p) for p in referenced_images(md_path)]


def fingerprint(md_path) -> str:
    """md 하나의 파생 HTML 지문(sha256 hex 64자). 입력 파일이 하나라도 없으면 FileNotFoundError."""
    h = hashlib.sha256(b"guide-fp/v1\0")
    for label, path in fingerprint_inputs(md_path):
        data = Path(path).read_bytes()
        h.update(label.encode("ascii") + b"\0" + str(len(data)).encode("ascii") + b"\0")
        h.update(data)
    return h.hexdigest()


def read_embedded_fingerprint(html_path) -> str | None:
    """HTML 앞 2KB 안의 `<!-- guide-fp:<hex> -->` 값. 파일이 없거나 표식이 없으면 None."""
    try:
        with open(html_path, "rb") as fh:
            head = fh.read(FP_SCAN_BYTES)
    except (FileNotFoundError, IsADirectoryError):
        return None
    m = FP_RE.search(head.decode("utf-8", errors="replace"))
    return m.group(1) if m else None


def _abs(p) -> Path:
    return Path(os.path.abspath(os.fspath(p)))


def _real(p) -> Path:
    return Path(os.path.realpath(os.fspath(p)))


def is_render_target(md_path) -> bool:
    """pattern-guide/<track>/<slug>/<slug>-guide_v<semver>.md 또는 reference/<slug>/<slug>-ref_v<semver>.md 인가(존재 여부 무관)."""
    p = _real(md_path)
    return (
        bool(GUIDE_RE.match(p.name))
        and p.parent.parent.name in TARGET_DIRS
        and p.parent.parent.parent == _real(GUIDE_ROOT)
    )


def _versions(folder: Path) -> list[Path]:
    return sorted((f for f in folder.glob("*_v*.md") if GUIDE_RE.match(f.name)),
                  key=lambda f: tuple(int(x) for x in f.stem.split("_v")[-1].split(".")))


def discover_targets() -> list[Path]:
    """폴더마다 최신 한 편. 구본(status: legacy)은 건너뛴다."""
    found: list[Path] = []
    for sub in TARGET_DIRS:
        base = GUIDE_ROOT / sub
        if not base.is_dir():
            continue
        for folder in sorted(x for x in base.iterdir() if x.is_dir()):
            vs = _versions(folder)
            if not vs:
                continue
            head = vs[-1].read_text(encoding="utf-8")[:400]
            if "\nstatus: legacy" in head:
                continue
            found.append(vs[-1])
    return found


def output_path(md_path, out_dir=None) -> Path:
    """md 의 HTML 출력 경로. 기본은 **md 와 같은 폴더**(가이드 한 편 = 폴더 하나). --out-dir 를 주면 그 아래."""
    real_md = _real(md_path)
    if out_dir is None:
        return real_md.with_suffix(".html")
    out = _abs(out_dir)
    real_root = _real(GUIDE_ROOT)
    try:
        rel = real_md.relative_to(real_root)
    except ValueError:
        return out / (real_md.stem + ".html")
    return out / rel.with_suffix(".html")


# ── 블록 파서 ─────────────────────────────────────────────────────────
FENCE_OPEN_RE = re.compile(r"^( {0,3})(`{3,}|~{3,})[ \t]*(.*?)[ \t]*$")
ATX_RE = re.compile(r"^ {0,3}(#{1,6})(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*$")
HR_RE = re.compile(r"^ {0,3}(?:(?:\*[ \t]*){3,}|(?:-[ \t]*){3,}|(?:_[ \t]*){3,})$")
QUOTE_RE = re.compile(r"^ {0,3}> ?(.*)$")
LIST_ITEM_RE = re.compile(r"^( *)([-*+]|\d{1,9}[.)])(?:([ \t]+)(.*))?$")
DELIM_ROW_RE = re.compile(r"^ {0,3}\|?[ \t]*:?-+:?[ \t]*(?:\|[ \t]*:?-+:?[ \t]*)*\|?[ \t]*$")
COMMENT_START_RE = re.compile(r"^ {0,3}<!--")


def _is_blank(line: str) -> bool:
    return not line.strip()


def _indent_of(line: str) -> int:
    return len(line) - len(line.lstrip(" "))


def _fence_open(line: str):
    m = FENCE_OPEN_RE.match(line)
    if not m:
        return None
    fence, info = m.group(2), m.group(3)
    if fence[0] == "`" and "`" in info:
        return None
    return m


def _fence_closer(fence: str) -> re.Pattern:
    return re.compile(r"^ {0,3}" + re.escape(fence[0]) + "{" + str(len(fence)) + r",}[ \t]*$")


def _list_marker(line: str, max_indent: int | None = None):
    m = LIST_ITEM_RE.match(line)
    if not m or HR_RE.match(line):
        return None
    ind = len(m.group(1))
    if max_indent is not None and ind > max_indent:
        return None
    marker = m.group(2)
    spaces = m.group(3) or ""
    rest = m.group(4) or ""
    ordered = marker[-1] in ".)"
    if not rest.strip():
        content_indent = ind + len(marker) + 1
        rest = ""
    elif len(spaces) > 4:
        content_indent = ind + len(marker) + 1
        rest = " " * (len(spaces) - 1) + rest
    else:
        content_indent = ind + len(marker) + len(spaces)
    return {
        "indent": ind,
        "kind": ("ol", marker[-1]) if ordered else ("ul", marker),
        "ordered": ordered,
        "start": int(marker[:-1]) if ordered else 1,
        "content_indent": content_indent,
        "rest": rest,
    }


def _split_row(line: str) -> list[str]:
    """파이프 표 한 줄을 셀로 나눈다. `\\|` 와 코드 스팬 안의 `|` 는 경계가 아니다."""
    s = line.strip()
    cells: list[str] = []
    buf: list[str] = []
    i, n = 0, len(s)
    ended_with_boundary = False
    while i < n:
        c = s[i]
        ended_with_boundary = False
        if c == "\\" and i + 1 < n and s[i + 1] == "|":
            buf.append("\\|")
            i += 2
            continue
        if c == "`":
            j = i
            while j < n and s[j] == "`":
                j += 1
            run = j - i
            close = _find_backtick_run(s, j, run)
            if close >= 0:
                # GFM 호환: 코드 스팬 안의 \| 는 | 로 읽는다
                buf.append(s[i : close + run].replace("\\|", "|"))
                i = close + run
            else:
                buf.append(s[i:j])
                i = j
            continue
        if c == "|":
            cells.append("".join(buf))
            buf = []
            i += 1
            ended_with_boundary = True
            continue
        buf.append(c)
        i += 1
    last = "".join(buf)
    if not (ended_with_boundary and not last.strip()):
        cells.append(last)
    if s.startswith("|") and cells:
        cells = cells[1:]
    return [c.strip() for c in cells]


def _find_backtick_run(s: str, start: int, run: int) -> int:
    """start 이후에서 길이가 정확히 run 인 백틱 연속열의 시작 위치. 없으면 -1."""
    k = start
    n = len(s)
    ticks = "`" * run
    while True:
        k = s.find(ticks, k)
        if k < 0:
            return -1
        e = k + run
        if e < n and s[e] == "`":
            while e < n and s[e] == "`":
                e += 1
            k = e
            continue
        return k


def _is_table_start(lines: list[str], i: int) -> bool:
    if i + 1 >= len(lines):
        return False
    head, delim = lines[i], lines[i + 1]
    if "|" not in head or not DELIM_ROW_RE.match(delim):
        return False
    if "|" not in delim and not head.strip().startswith("|"):
        return False
    return len(_split_row(head)) == len(_split_row(delim))


def _starts_block(lines: list[str], i: int, *, allow_list: bool = True) -> bool:
    """문단을 끊는 블록 시작인가(빈 줄 제외)."""
    line = lines[i]
    if ATX_RE.match(line) or HR_RE.match(line) or QUOTE_RE.match(line):
        return True
    if _fence_open(line) or COMMENT_START_RE.match(line) or _is_table_start(lines, i):
        return True
    if allow_list:
        mk = _list_marker(line, 3)
        if mk and mk["rest"] and (not mk["ordered"] or mk["start"] == 1):
            return True
    return False


def parse_blocks(lines: list[str]) -> list[dict]:
    return _parse_blocks(lines)[0]


def _parse_blocks(lines: list[str]) -> tuple[list[dict], bool]:
    """블록 목록과 '두 블록 사이에 빈 줄이 있었는가'(목록 loose 판정용)를 돌려준다."""
    lines = list(lines)
    blocks: list[dict] = []
    gap = False
    blank_pending = False
    i, n = 0, len(lines)
    while i < n:
        line = lines[i]
        if _is_blank(line):
            if blocks:
                blank_pending = True
            i += 1
            continue

        start_count = len(blocks)

        fm = _fence_open(line)
        if fm:
            indent, fence, info = len(fm.group(1)), fm.group(2), fm.group(3)
            closer = _fence_closer(fence)
            body: list[str] = []
            i += 1
            while i < n:
                if closer.match(lines[i]):
                    i += 1
                    break
                raw = lines[i]
                strip = min(indent, _indent_of(raw))
                body.append(raw[strip:])
                i += 1
            words = info.split()
            blocks.append(
                {
                    "t": "code",
                    "lang": words[0].lower() if words else "",
                    "flags": {w.lower() for w in words[1:]},
                    "code": "\n".join(body),
                }
            )
        elif COMMENT_START_RE.match(line):
            # HTML 주석 블록은 출력하지 않는다. `-->` 뒤에 글이 남으면 그 줄을 다시 읽는다.
            j = i
            pos = line.find("<!--") + 4
            while j < n:
                end = lines[j].find("-->", pos if j == i else 0)
                if end >= 0:
                    rest = lines[j][end + 3 :]
                    if rest.strip():
                        lines[j] = rest
                        i = j
                    else:
                        i = j + 1
                    break
                j += 1
            else:
                i = n
            continue
        elif ATX_RE.match(line):
            m = ATX_RE.match(line)
            blocks.append({"t": "heading", "level": len(m.group(1)), "text": (m.group(2) or "").strip()})
            i += 1
        elif HR_RE.match(line):
            blocks.append({"t": "hr"})
            i += 1
        elif QUOTE_RE.match(line):
            inner: list[str] = []
            while i < n:
                qm = QUOTE_RE.match(lines[i])
                if qm:
                    inner.append(qm.group(1))
                elif not _is_blank(lines[i]) and inner and inner[-1].strip() and not _starts_block(lines, i):
                    inner.append(lines[i])  # 게으른 연속 줄
                else:
                    break
                i += 1
            blocks.append({"t": "quote", "children": parse_blocks(inner)})
        elif _is_table_start(lines, i):
            head = _split_row(lines[i])
            align = []
            for cell in _split_row(lines[i + 1]):
                left, right = cell.startswith(":"), cell.endswith(":")
                align.append("center" if left and right else "right" if right else "left" if left else None)
            rows = []
            i += 2
            while i < n and not _is_blank(lines[i]) and "|" in lines[i]:
                if ATX_RE.match(lines[i]) or _fence_open(lines[i]) or QUOTE_RE.match(lines[i]):
                    break
                cells = _split_row(lines[i])
                cells = (cells + [""] * len(head))[: len(head)]
                rows.append(cells)
                i += 1
            blocks.append({"t": "table", "align": align, "head": head, "rows": rows})
        elif _list_marker(line, 3):
            block, i = _parse_list(lines, i)
            blocks.append(block)
        else:
            para = [line.lstrip(" ")]
            i += 1
            while i < n and not _is_blank(lines[i]) and not _starts_block(lines, i):
                para.append(lines[i].lstrip(" "))
                i += 1
            text = "\n".join(para).rstrip()
            blocks.append({"t": "para", "text": text})

        if len(blocks) > start_count and start_count > 0 and blank_pending:
            gap = True
        if len(blocks) > start_count:
            blank_pending = False
    return blocks, gap


def _parse_list(lines: list[str], i: int) -> tuple[dict, int]:
    first = _list_marker(lines[i], 3)
    kind = first["kind"]
    n = len(lines)
    raw_items: list[list[str]] = []
    loose = False
    while i < n:
        mk = _list_marker(lines[i])
        if not mk or mk["kind"] != kind:
            break
        marker_indent, content_indent = mk["indent"], mk["content_indent"]
        item = [mk["rest"]]
        fence_closer = None
        fo = _fence_open(mk["rest"])
        if fo:
            fence_closer = _fence_closer(fo.group(2))
        i += 1
        while i < n:
            line = lines[i]
            if _is_blank(line):
                j = i
                while j < n and _is_blank(lines[j]):
                    j += 1
                if j < n and (
                    fence_closer is not None
                    or _indent_of(lines[j]) >= content_indent
                    or (_indent_of(lines[j]) > marker_indent and _list_marker(lines[j]))
                ):
                    item.extend([""] * (j - i))
                    i = j
                    continue
                break
            ind = _indent_of(line)
            if ind >= content_indent:
                piece = line[content_indent:]
            elif fence_closer is not None:
                break
            elif ind > marker_indent and _list_marker(line):
                piece = line[ind:]  # 들여쓰기가 얕은 하위 목록도 이 항목의 자식으로 받는다
            elif _list_marker(line):
                break
            elif _starts_block(lines, i, allow_list=False):
                break
            elif item and item[-1].strip():
                piece = line.lstrip(" ")  # 게으른 연속 줄
            else:
                break
            item.append(piece)
            if fence_closer is not None:
                if fence_closer.match(piece):
                    fence_closer = None
            else:
                fo = _fence_open(piece)
                if fo:
                    fence_closer = _fence_closer(fo.group(2))
            i += 1
        raw_items.append(item)
        if i < n and _is_blank(lines[i]):
            j = i
            while j < n and _is_blank(lines[j]):
                j += 1
            nxt = _list_marker(lines[j]) if j < n else None
            if nxt and nxt["kind"] == kind:
                loose = True
                i = j
                continue
            break
    items = []
    for raw in raw_items:
        blocks, gap = _parse_blocks(raw)
        loose = loose or gap
        items.append(blocks)
    return (
        {"t": "list", "ordered": first["ordered"], "start": first["start"], "loose": loose, "items": items},
        i,
    )


def _tab_lang(block: dict) -> str | None:
    if block["t"] != "code" or NO_COMPILE in block["flags"]:
        return None
    return TAB_LANGS.get(block["lang"])


def group_impl_tabs(blocks: list[dict]) -> list[dict]:
    """`### 구현` 절 안에서 빈 줄만 사이에 둔 java/typescript/rust 펜스(서로 다른 언어 2개 이상)를 탭으로 묶는다."""
    out: list[dict] = []
    in_impl = False
    i = 0
    while i < len(blocks):
        b = blocks[i]
        if b["t"] == "heading":
            if b["level"] <= 3:
                in_impl = b["level"] == 3 and plain_text(render_inline_plain(b["text"])) == IMPL_HEADING
            out.append(b)
            i += 1
            continue
        lang = _tab_lang(b) if in_impl else None
        if lang:
            run, seen = [b], {lang}
            j = i + 1
            while j < len(blocks):
                nl = _tab_lang(blocks[j])
                if not nl or nl in seen:
                    break
                run.append(blocks[j])
                seen.add(nl)
                j += 1
            if len(run) >= 2:
                out.append({"t": "tabs", "items": run})
                i = j
                continue
        out.append(b)
        i += 1
    return out


def parse_document(text: str) -> list[dict]:
    text = text.lstrip("\ufeff").replace("\r\n", "\n").replace("\r", "\n")
    # \uba38\ub9ac\ub9d0(frontmatter)\uc740 \ub3c5\uc790\uc6a9 \ubcf8\ubb38\uc774 \uc544\ub2c8\ub2e4. \uc608\uc804\uc5d0\ub294 `pattern: \u2026 status: \u2026` \uac00 hr \ubc11 \ubb38\ub2e8\uc73c\ub85c \uadf8\ub300\ub85c \ubcf4\uc600\ub2e4(2026-11-13 \ubc1c\uacac).
    text = re.sub(r"\A---\n.*?\n---\n", "", text, count=1, flags=re.S)
    lines = [_expand_leading_tabs(line) for line in text.split("\n")]
    return group_impl_tabs(parse_blocks(lines))


def _expand_leading_tabs(line: str) -> str:
    m = re.match(r"^[ \t]+", line)
    if not m or "\t" not in m.group(0):
        return line
    return m.group(0).expandtabs(4) + line[m.end() :]


def iter_blocks(blocks: list[dict]):
    for b in blocks:
        yield b
        if b["t"] == "quote":
            yield from iter_blocks(b["children"])
        elif b["t"] == "list":
            for item in b["items"]:
                yield from iter_blocks(item)
        elif b["t"] == "tabs":
            yield from b["items"]


# ── 인라인 ───────────────────────────────────────────────────────────
PH_OPEN, PH_CLOSE = "\ue000", "\ue001"
PH_RE = re.compile(PH_OPEN + r"(\d+)" + PH_CLOSE)
COMMENT_RE = re.compile(r"<!--.*?-->", re.S)
ESCAPABLE_RE = re.compile(r"\\([!-/:-@\[-`{-~])")
ENTITY_RE = re.compile(r"&(?:[A-Za-z][A-Za-z0-9]{1,31}|#\d{1,7}|#[xX][0-9A-Fa-f]{1,6});")
AUTOLINK_RE = re.compile(r"<((?:https?|mailto|ftp):[^\s<>]+)>")
SCHEME_RE = re.compile(r"^[A-Za-z][A-Za-z0-9+.-]*:")
EMPHASIS_RULES = [
    (re.compile(r"\*\*(?=\S)(.+?)(?<=\S)\*\*", re.S), r"<strong>\1</strong>"),
    (re.compile(r"(?<!\w)__(?=\S)(.+?)(?<=\S)__(?!\w)", re.S), r"<strong>\1</strong>"),
    (re.compile(r"(?<!\*)\*(?=[^\s*])(.+?)(?<=[^\s*])\*(?!\*)", re.S), r"<em>\1</em>"),
    (re.compile(r"(?<!\w)_(?=[^\s_])(.+?)(?<=[^\s_])_(?!\w)", re.S), r"<em>\1</em>"),
    (re.compile(r"~~(?=\S)(.+?)(?<=\S)~~", re.S), r"<del>\1</del>"),
]


def _esc(s: str) -> str:
    return html.escape(s, quote=False)


def _attr(s: str) -> str:
    return html.escape(s, quote=True)


class Inline:
    """인라인 마크다운 → HTML. href 는 rewrite(href) 로 바꾼다."""

    def __init__(self, rewrite=None, image=None):
        self.rewrite = rewrite or (lambda href: href)
        self.image = image or (lambda dest, alt, title: f'<a href="{_attr(dest)}">{_attr(alt)}</a>')

    def render(self, text: str) -> str:
        store: list[str] = []

        def ph(fragment: str) -> str:
            store.append(fragment)
            return f"{PH_OPEN}{len(store) - 1}{PH_CLOSE}"

        text = self._code_spans(text, ph)
        text = COMMENT_RE.sub("", text)
        text = re.sub(r"\\\n", lambda m: ph("<br>\n"), text)
        text = re.sub(r" {2,}\n", lambda m: ph("<br>\n"), text)
        text = ESCAPABLE_RE.sub(lambda m: ph(_esc(m.group(1))), text)
        text = ENTITY_RE.sub(lambda m: ph(m.group(0)), text)
        text = AUTOLINK_RE.sub(lambda m: ph(f'<a href="{_attr(m.group(1))}">{_esc(m.group(1))}</a>'), text)
        text = self._links(text, ph)
        text = self._fragment(text)
        while PH_OPEN in text:
            text = PH_RE.sub(lambda m: store[int(m.group(1))], text)
        return text

    @staticmethod
    def _fragment(text: str) -> str:
        text = _esc(text)
        for rx, repl in EMPHASIS_RULES:
            text = rx.sub(repl, text)
        return text

    @staticmethod
    def _code_spans(text: str, ph) -> str:
        out: list[str] = []
        i, n = 0, len(text)
        while i < n:
            c = text[i]
            if c == "\\" and i + 1 < n and text[i + 1] == "`":
                out.append(text[i : i + 2])
                i += 2
                continue
            if c != "`":
                out.append(c)
                i += 1
                continue
            j = i
            while j < n and text[j] == "`":
                j += 1
            run = j - i
            close = _find_backtick_run(text, j, run)
            if close < 0:
                out.append(text[i:j])
                i = j
                continue
            content = text[j:close].replace("\n", " ")
            if len(content) >= 2 and content[0] == " " and content[-1] == " " and content.strip():
                content = content[1:-1]
            out.append(ph(f"<code>{_esc(content)}</code>"))
            i = close + run
        return "".join(out)

    def _links(self, text: str, ph) -> str:
        out: list[str] = []
        i, n = 0, len(text)
        while i < n:
            c = text[i]
            is_image = c == "!" and i + 1 < n and text[i + 1] == "["
            if c == "[" or is_image:
                open_at = i + 1 if is_image else i
                close = _match_bracket(text, open_at)
                if close >= 0 and close + 1 < n and text[close + 1] == "(":
                    parsed = _parse_destination(text, close + 2)
                    if parsed:
                        dest, title, end = parsed
                        label = self._fragment(text[open_at + 1 : close])
                        href = _attr(self.rewrite(dest))
                        title_attr = f' title="{_attr(title)}"' if title else ""
                        if is_image:
                            # 도식은 data URI 로 박는다 — 외부·파일 요청 0 을 지키면서 그림을 보인다.
                            out.append(ph(self.image(dest, text[open_at + 1 : close], title)))
                        else:
                            out.append(ph(f'<a href="{href}"{title_attr}>{label}</a>'))
                        i = end
                        continue
            out.append(c)
            i += 1
        return "".join(out)


def _match_bracket(text: str, open_at: int) -> int:
    depth = 0
    for k in range(open_at, len(text)):
        ch = text[k]
        if ch == "[":
            depth += 1
        elif ch == "]":
            depth -= 1
            if depth == 0:
                return k
    return -1


def _parse_destination(text: str, k: int):
    n = len(text)
    while k < n and text[k] in " \t\n":
        k += 1
    if k < n and text[k] == "<":
        end = text.find(">", k + 1)
        if end < 0 or "\n" in text[k + 1 : end]:
            return None
        dest = text[k + 1 : end]
        k = end + 1
    else:
        start, depth = k, 0
        while k < n:
            ch = text[k]
            if ch in " \t\n":
                break
            if ch == "(":
                depth += 1
            elif ch == ")":
                if depth == 0:
                    break
                depth -= 1
            k += 1
        dest = text[start:k]
    while k < n and text[k] in " \t\n":
        k += 1
    title = ""
    if k < n and text[k] in "\"'(":
        closer = ")" if text[k] == "(" else text[k]
        end = text.find(closer, k + 1)
        if end < 0:
            return None
        title = text[k + 1 : end]
        k = end + 1
        while k < n and text[k] in " \t\n":
            k += 1
    if k >= n or text[k] != ")":
        return None
    return dest, title, k + 1


def render_inline_plain(text: str) -> str:
    return Inline().render(text)


def plain_text(fragment_html: str) -> str:
    return html.unescape(re.sub(r"<[^>]+>", "", fragment_html)).strip()


def github_slug(text: str) -> str:
    s = text.strip().lower()
    s = re.sub(r"[^\w\- ]", "", s)
    return s.replace(" ", "-")


# ── HTML 생성 ─────────────────────────────────────────────────────────
class DocumentRenderer:
    def __init__(self, md_path: Path, out_html: Path, svgs: dict[str, str]):
        self.md_dir = _abs(md_path).parent
        self.out_dir = _abs(out_html).parent
        self.out_root = None  # 링크 대상 HTML 경로 계산용 — render_file 이 채운다
        self.svgs = svgs
        self.doc_id = re.sub(r"[^a-z0-9]+", "-", _abs(md_path).stem.lower()).strip("-") or "guide"
        self.inline = Inline(self.rewrite_href, self.image_tag)
        self.used_ids: set[str] = set()
        self.tab_count = 0
        self.title: str | None = None
        self.toc: list[tuple[int, str, str]] = []  # (레벨, id, 인라인 HTML) — h2~h4, 머리 차례용

    # 도식 이미지 — 로컬 파일을 data URI 로 박는다(외부·파일 요청 0). 없으면 렌더 실패.
    def image_tag(self, dest: str, alt: str, title: str | None) -> str:
        if dest.startswith(("http://", "https://")):
            raise RenderError(f"외부 이미지는 싣지 않는다: {dest}")
        if dest.startswith("data:"):
            src = dest
        else:
            path = Path(os.path.normpath(os.path.join(self.md_dir, unquote(dest.partition("#")[0]))))
            if not path.exists():
                raise RenderError(f"도식 이미지가 없다: {dest} (기대 경로 {path})")
            mime = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
                    ".svg": "image/svg+xml", ".webp": "image/webp"}.get(path.suffix.lower())
            if mime is None:
                raise RenderError(f"이미지 형식을 모른다: {path.name}")
            src = f"data:{mime};base64," + base64.b64encode(path.read_bytes()).decode("ascii")
        cap = f"<figcaption>{_attr(title or alt)}</figcaption>" if (title or alt) else ""
        return f'<figure class="diagram-figure"><img src="{src}" alt="{_attr(alt)}" />{cap}</figure>'

    # 링크
    def rewrite_href(self, href: str) -> str:
        href = href.strip()
        if not href or href.startswith(("#", "/", "?")) or SCHEME_RE.match(href):
            return href
        path, hash_sep, frag = href.partition("#")
        path, query_sep, query = path.partition("?")
        if not path:
            return href
        target = Path(os.path.normpath(os.path.join(self.md_dir, unquote(path))))
        if is_render_target(target):
            target = output_path(target, self.out_root)
        rel = os.path.relpath(target, self.out_dir).replace(os.sep, "/")
        new = quote(rel, safe="/-._~!$&'()*+,;=@")
        if query_sep:
            new += "?" + query
        if hash_sep:
            new += "#" + frag
        return new

    def unique_id(self, base: str) -> str:
        base = base or "section"
        candidate, k = base, 0
        while candidate in self.used_ids:
            k += 1
            candidate = f"{base}-{k}"
        self.used_ids.add(candidate)
        return candidate

    def blocks(self, blocks: list[dict]) -> str:
        return "".join(self.block(b) for b in blocks)

    def block(self, b: dict) -> str:
        t = b["t"]
        if t == "heading":
            inner = self.inline.render(b["text"])
            text = plain_text(inner)
            if b["level"] == 1 and self.title is None:
                self.title = text
            hid = self.unique_id(github_slug(text))
            if 2 <= b["level"] <= 4:
                self.toc.append((b["level"], hid, inner))
            return f'<h{b["level"]} id="{_attr(hid)}">{inner}</h{b["level"]}>\n'
        if t == "para":
            return f"<p>{self.inline.render(b['text'])}</p>\n"
        if t == "hr":
            return "<hr>\n"
        if t == "quote":
            inner = self.blocks(b["children"])
            # 명세 1.5.0 PG36 — 점검 문제의 `> 풀이 —` 블록은 접어 둔다. 먼저 풀어 볼 기회를 남기려는 것이다(JS 없이 <details>).
            first = b["children"][0] if b["children"] else None
            if first and first["t"] == "para" and re.match(r"^\s*풀이\s*—", first["text"]):
                return f'<details class="answer">\n<summary>풀이 보기</summary>\n<blockquote>\n{inner}</blockquote>\n</details>\n'
            return f"<blockquote>\n{inner}</blockquote>\n"
        if t == "code":
            if b["lang"] == "mermaid":
                raise RenderError(
                    "mermaid 는 이 저장소에서 쓰지 않는다 — 도식은 viz 컴포넌트로 저작하고 "
                    "렌더한 이미지를 ![](diagrams/….png) 로 싣는다")
            return self.code(b)
        if t == "tabs":
            return self.tabs(b["items"])
        if t == "table":
            return self.table(b)
        if t == "list":
            return self.list(b)
        raise RenderError(f"알 수 없는 블록 {t}")

    def code(self, b: dict, *, focusable: bool = True) -> str:
        lang = TAB_LANGS.get(b["lang"], b["lang"])
        classes = []
        if lang:
            classes.append(f"language-{lang}")
        cls = f' class="{_attr(" ".join(classes))}"' if classes else ""
        pre_cls = ' class="code-block--no-compile"' if NO_COMPILE in b["flags"] else ""
        tab = ' tabindex="0"' if focusable else ""
        return f"<pre{pre_cls}{tab}><code{cls}>{_esc(b['code'])}</code></pre>\n"

    def tabs(self, items: list[dict]) -> str:
        self.tab_count += 1
        wid = self.unique_id(f"{self.doc_id}-tabs{self.tab_count}")
        entries = []
        for b in items:
            lang = TAB_LANGS[b["lang"]]
            entries.append((lang, TAB_LABELS[lang], f"{wid}-tab-{lang}", f"{wid}-panel-{lang}", b))
        for _, _, tid, pid, _ in entries:
            self.used_ids.update((tid, pid))
        out = [
            f'<div class="code-tabs" id="{wid}">\n',
            '<div class="code-tabs__list" role="tablist" aria-label="구현 예시 언어">\n',
        ]
        for k, (lang, label, tid, pid, _) in enumerate(entries):
            selected = k == 0
            out.append(
                f'<button type="button" class="code-tabs__tab" role="tab" id="{tid}" aria-controls="{pid}" '
                f'aria-selected="{"true" if selected else "false"}" tabindex="{"0" if selected else "-1"}" '
                f'data-lang="{lang}">{label}</button>\n'
            )
        out.append("</div>\n")
        for lang, label, tid, pid, b in entries:
            out.append(
                f'<div class="code-tabs__panel" role="tabpanel" id="{pid}" aria-labelledby="{tid}">\n'
                f'<p class="code-tabs__label" aria-hidden="true">{label}</p>\n'
                f"{self.code(b)}</div>\n"
            )
        out.append("</div>\n")
        return "".join(out)

    def table(self, b: dict) -> str:
        def cell(tag: str, text: str, align) -> str:
            style = f' style="text-align:{align}"' if align else ""
            return f"<{tag}{style}>{self.inline.render(text)}</{tag}>"

        align = b["align"]
        head = "".join(cell("th", c, align[k] if k < len(align) else None) for k, c in enumerate(b["head"]))
        out = ['<div class="table-wrap" tabindex="0">\n<table>\n', f"<thead>\n<tr>{head}</tr>\n</thead>\n"]
        if b["rows"]:
            out.append("<tbody>\n")
            for row in b["rows"]:
                tds = "".join(cell("td", c, align[k] if k < len(align) else None) for k, c in enumerate(row))
                out.append(f"<tr>{tds}</tr>\n")
            out.append("</tbody>\n")
        out.append("</table>\n</div>\n")
        return "".join(out)

    def list(self, b: dict) -> str:
        tag = "ol" if b["ordered"] else "ul"
        start = f' start="{b["start"]}"' if b["ordered"] and b["start"] != 1 else ""
        out = [f"<{tag}{start}>\n"]
        for item in b["items"]:
            if b["loose"]:
                inner = "\n" + self.blocks(item) if item else ""
            else:
                parts = []
                for child in item:
                    if child["t"] == "para":
                        parts.append(self.inline.render(child["text"]))
                    else:
                        parts.append(("\n" if parts else "") + self.block(child))
                inner = "".join(parts)
            out.append(f"<li>{inner}</li>\n")
        out.append(f"</{tag}>\n")
        return "".join(out)


def toc_html(entries: list[tuple[int, str, str]]) -> str:
    """h2~h4 를 레벨대로 들여 쓴 차례. JS 없이 접고 펴도록 <details open> 으로 감싼다. 헤딩이 둘 미만이면 비운다."""
    if len(entries) < 2:
        return ""
    top = min(lv for lv, _, _ in entries)
    out = ['<details class="guide-toc" open>\n<summary>차례</summary>\n<ol>\n']
    depth = top
    first = True
    for lv, hid, inner in entries:
        lv = max(lv, top)
        if first:
            first = False
        elif lv > depth:
            out.append("\n<ol>\n" * (lv - depth))
        else:
            out.append("</li>\n")
            out.append("</ol>\n</li>\n" * (depth - lv))
        depth = lv
        out.append(f'<li><a href="#{_attr(hid)}">{inner}</a>')
    out.append("</li>\n")
    out.append("</ol>\n</li>\n" * (depth - top))
    out.append("</ol>\n</details>\n")
    return "".join(out)


def _load_asset(path: Path, closing_tag: str) -> str:
    text = path.read_text(encoding="utf-8")
    if closing_tag in text.lower():
        raise RenderError(f"{path.name} 안에 {closing_tag} 가 있어 인라인할 수 없다")
    return text if text.endswith("\n") else text + "\n"


def display_path(p) -> str:
    p = _abs(p)
    try:
        return p.relative_to(_abs(ROOT)).as_posix()
    except ValueError:
        return p.as_posix()


def render_html(md_path: Path, blocks: list[dict], out_html: Path, out_root: Path, fp: str, svgs: dict[str, str]) -> str:
    doc = DocumentRenderer(md_path, out_html, svgs)
    doc.out_root = out_root
    body = doc.blocks(blocks)
    # 머리 차례 — 700~1,300행 문서라 절을 바로 찾아갈 길이 필요하다(2026-11-13 구성 검토 1-2). h1 바로 뒤에 둔다.
    toc = toc_html(doc.toc)
    if toc:
        body = re.sub(r"(</h1>\n)", lambda m: m.group(1) + toc, body, count=1) if "</h1>\n" in body else toc + body
    title = doc.title or _abs(md_path).stem
    css = _load_asset(ASSET_CSS, "</style")
    js = _load_asset(ASSET_JS, "</script")
    source = display_path(md_path)
    return (
        "<!doctype html>\n"
        f"<!-- guide-fp:{fp} -->\n"
        '<html lang="ko">\n'
        "<head>\n"
        '<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        '<meta name="color-scheme" content="light dark">\n'
        '<meta name="generator" content="scripts/render-guides.py">\n'
        f"<title>{_esc(title)}</title>\n"
        f"<style>\n{css}</style>\n"
        "</head>\n"
        "<body>\n"
        '<div class="guide">\n'
        f"<main>\n{body}</main>\n"
        '<footer class="guide-footer">\n'
        f"<p>원본은 <code>{_esc(source)}</code>입니다. 이 HTML 은 원본 md 에서 생성한 파생물이라, "
        "고칠 곳이 있으면 md 를 고친 뒤 다시 렌더합니다.</p>\n"
        "</footer>\n"
        "</div>\n"
        f"<script>\n{js}</script>\n"
        "</body>\n"
        "</html>\n"
    )


# ── CLI ──────────────────────────────────────────────────────────────
def _write_atomic(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + f".{os.getpid()}.tmp")
    tmp.write_text(text, encoding="utf-8")
    os.replace(tmp, path)


def _collect(args, parser) -> list[Path]:
    files = [_abs(f) for f in args.files]
    if args.all:
        files.extend(_abs(p) for p in discover_targets())
    if not files:
        parser.error("렌더할 md 경로를 주거나 --all 을 쓰세요")
    return list(dict.fromkeys(files))


def run_check(files: list[Path], out_dir: Path | None) -> int:
    result = {"fresh": [], "stale": [], "missing": [], "errors": []}
    for md in files:
        out = output_path(md, out_dir)
        try:
            expected = fingerprint(md)
        except OSError as exc:
            result["errors"].append({"file": display_path(md), "error": str(exc)})
            continue
        if not out.is_file():
            result["missing"].append(display_path(out))
        elif read_embedded_fingerprint(out) == expected:
            result["fresh"].append(display_path(out))
        else:
            result["stale"].append(display_path(out))
    print(json.dumps(result, ensure_ascii=False))
    return 1 if result["stale"] or result["missing"] or result["errors"] else 0


def run_render(files: list[Path], out_dir: Path | None, force: bool, jobs: int) -> int:
    result = {"written": [], "fresh": [], "errors": []}
    pending = []
    for md in files:
        out = output_path(md, out_dir)
        try:
            fp = fingerprint(md)
            if not force and read_embedded_fingerprint(out) == fp:
                result["fresh"].append(display_path(out))
                continue
            blocks = parse_document(md.read_text(encoding="utf-8"))
        except (OSError, UnicodeDecodeError, RenderError) as exc:
            result["errors"].append({"file": display_path(md), "error": str(exc)})
            continue
        pending.append((md, out, fp, blocks))

    svgs: dict[str, str] = {}

    for md, out, fp, blocks in pending:
        try:
            page = render_html(md, blocks, out, out_dir or out.parent, fp, svgs)
            _write_atomic(out, page)
        except (OSError, RenderError) as exc:
            result["errors"].append({"file": display_path(md), "error": str(exc)})
            continue
        result["written"].append(display_path(out))

    print(json.dumps(result, ensure_ascii=False))
    for err in result["errors"]:
        print(f"render-guides: {err['file']}: {err['error']}", file=sys.stderr)
    return 1 if result["errors"] else 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="render-guides.py",
        description="패턴 가이드 md → 자립형 HTML(세 언어 탭 · 도식 data URI · 지문)",
    )
    parser.add_argument("files", nargs="*", help="렌더할 가이드 md")
    parser.add_argument("--all", action="store_true",
                        help="pattern-guide/{design-pattern-guide,ddd-analysis-pattern-guide,reference}/<slug>/ 의 최신본 전부")
    parser.add_argument("--out-dir", default=None, help="출력 루트(기본: md 와 같은 폴더)")
    parser.add_argument("--check", action="store_true", help="쓰지 않고 fresh/stale/missing 만 보고")
    parser.add_argument("--force", action="store_true", help="지문이 같아도 다시 쓴다")
    parser.add_argument("--jobs", type=int, default=4, help="문서 병렬 처리 수(기본 4)")
    args = parser.parse_args(argv)
    files = _collect(args, parser)
    out_dir = _abs(args.out_dir) if args.out_dir else None   # 기본은 md 와 같은 폴더
    if args.check:
        return run_check(files, out_dir)
    return run_render(files, out_dir, args.force, args.jobs)


if __name__ == "__main__":
    sys.exit(main())
