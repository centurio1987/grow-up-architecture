#!/usr/bin/env python3
"""check-guides — 디자인 패턴 가이드 결정론 검사기 (KAN-001.2-4NWK0T S4).

사람이나 외부 모델에게 다시 시킬 필요가 없는 판정을 전부 여기서 한다. 표준 라이브러리만 쓴다.

대상 가이드
    pattern-guide/design-pattern-guide/*-pattern.md       → spec `gof-guide`
    pattern-guide/ddd-analysis-pattern-guide/*-pattern.md → spec `analysis-guide`
    (배치는 .claude/authoring/paths.json 의 dirs.content · dirs.tracks 를 읽는다 — 가이드 한 편 = 폴더 하나, 파일명에 semver)

모드 (여러 개 동시 지정 가능 · 실패가 하나라도 있으면 종료코드 1 · --json 이면 기계 판독 출력)
    --all [files]            헤딩(spec sections) · 플레이스홀더 · 문체 A/B · mermaid 펜스 · 상대 링크 ·
                             최소 조건 [필수]/[선택] · (analysis) 상황 설정 표
    --compile [files]        `### 구현` 절 펜스 3개(java → typescript → rust) 컴파일. 도구가 없으면 실패
    --links [files]          상대 링크 해소
    --spec-shared            두 spec.md 의 shared:pattern-guide-common 블록 1쌍씩 · 바이트 동일
    --resolve-hash <spec>    authoring.py resolve(worker) stdout sha256 앞 16자
    --gates [--spec] [--expect N]   gate-results.jsonl 파일별 마지막 기록: PASS · 해시 최신
    --pointers                      인덱스·기준 예시가 폴더의 최신본을 가리키는가(버저닝 규약)
    --derived [--require-html]      가이드 md ↔ HTML 지문(render-guides.py 의 fingerprint) 대조
    --self-test              scripts/fixtures/check/ 로 각 모드가 통과할 것은 통과, 실패할 것은 실패하는지

보조 옵션
    --spec <id>              --all 에서 spec 강제 · --gates 에서 spec 필터
    --spec-file <path>       spec.json 대신 읽을 파일(반복 가능, 파일의 id 로 등록). 대상 파일의 spec 을
                             경로로 정할 수 없고 --spec-file 이 하나면 그것을 쓴다
    --project <dir>          프로젝트 루트(기본: 이 스크립트의 상위 디렉토리)
    --gate-file <path>       gate-results.jsonl 경로 덮어쓰기
플러그인 루트는 환경변수 CLAUDE_PLUGIN_ROOT 우선, 없으면 authoring-kit 0.3.0 캐시 경로.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import importlib.util
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.parse
from pathlib import Path

SCRIPT_PATH = Path(__file__).resolve()
DEFAULT_PROJECT = SCRIPT_PATH.parent.parent
DEFAULT_PLUGIN = Path.home() / ".claude/plugins/cache/centurio87-plugins/authoring-kit/0.3.0"
FIXTURES = SCRIPT_PATH.parent / "fixtures" / "check"
VOICE = "ppangtolab-teacher"

DEFAULT_DIRS = {
    "content": "pattern-guide",
    "gate_results": "pattern-guide/gate-results.jsonl",
    "index": "PATTERNS.md",
}
DEFAULT_TRACKS = {"gof-guide": "design-pattern-guide", "analysis-guide": "ddd-analysis-pattern-guide"}
SPEC_OF_DIRKEY = {"gof": "gof-guide", "analysis": "analysis-guide"}   # 구 배치(평면) 호환
GUIDE_RE = re.compile(r"^(?P<slug>[a-z0-9-]+)-guide_v(?P<ver>\d+\.\d+\.\d+)\.md$")
FRONT_KEYS = ("pattern", "slug", "spec", "version", "status")


def parse_front(text: str) -> dict:
    """가이드 머리말(frontmatter). 없으면 빈 dict."""
    if not text.startswith("---\n"):
        return {}
    end = text.find("\n---", 4)
    if end < 0:
        return {}
    meta = {}
    for line in text[4:end].split("\n"):
        if ":" in line:
            k, v = line.split(":", 1)
            meta[k.strip()] = v.strip()
    return meta


def semver(v: str) -> tuple:
    try:
        return tuple(int(x) for x in v.split("."))
    except ValueError:
        return (0, 0, 0)


def guide_versions(folder: Path) -> list[Path]:
    """폴더 안의 가이드 파일을 버전 오름차순으로."""
    got = [f for f in folder.glob("*-guide_v*.md") if GUIDE_RE.match(f.name)]
    return sorted(got, key=lambda f: semver(GUIDE_RE.match(f.name)["ver"]))

MIN_COND_HEADING = "디자인 패턴을 충족하는 최소 조건"
IMPL_HEADING = "구현"
CONTEXT_HEADING = "상황 설정"
SHARED_OPEN = b"<!-- shared:pattern-guide-common -->"
SHARED_CLOSE = b"<!-- /shared -->"
LANGS = [("java", {"java"}), ("typescript", {"typescript", "ts"}), ("rust", {"rust"})]
CONTEXT_KEYWORDS = [
    ("bounded context", lambda s: "bounded context" in s.lower()),
    ("불변식", lambda s: "불변식" in s),
    ("root 또는 배정", lambda s: "root" in s.lower() or "배정" in s),
    ("참조", lambda s: "참조" in s),
]
# PG27 — [필수] 조건의 근거로 인정하는 원전 표기. 여기 없는 말로 근거를 대면 검사가 막는다.
BASIS_SOURCES = ["GoF", "원서", "원전", "Fowler", "Analysis Patterns", "eaaDev", "apsupp",
                 "martinfowler", "Evans", "Vernon", "DDD Reference"]
# AG3 — 상황 설정 표에서 칸을 채우지 않은 것으로 보는 말들.
BLANK_CELLS = {"-", "—", "–", "해당 없음", "해당없음", "N/A", "n/a", "NA", "없음", "미정", "TBD", "TODO", "?"}
CELL_MIN = 8

GATE_KEYS = ["file", "spec", "version", "work", "resolve_hash", "rounds", "external", "verdict", "date"]
# h_exit(이해 게이트 종료코드)는 2026-09-20 유저 결정으로 파이프라인에서 빠졌다. 옛 기록에 남아 있어도 검사하지 않는다.


class Fatal(Exception):
    """모드를 시작조차 할 수 없는 전제 오류(spec 없음 등)."""


# ─── 출력 ─────────────────────────────────────────────────────────────────────

class Report:
    def __init__(self) -> None:
        self.modes: dict[str, dict] = {}

    def mode(self, name: str) -> dict:
        return self.modes.setdefault(name, {"items": [], "info": {}})

    def add(self, mode: str, check: str, ok: bool, message: str, file: str | None = None) -> None:
        self.mode(mode)["items"].append({"file": file, "check": check, "ok": ok, "message": message})

    def info(self, mode: str, key: str, value) -> None:
        self.mode(mode)["info"][key] = value

    def ok(self) -> bool:
        return all(it["ok"] for m in self.modes.values() for it in m["items"])

    def as_json(self) -> dict:
        out = {"ok": self.ok(), "modes": {}}
        for name, m in self.modes.items():
            out["modes"][name] = {
                "ok": all(it["ok"] for it in m["items"]),
                "failures": sum(1 for it in m["items"] if not it["ok"]),
                "info": m["info"],
                "items": m["items"],
            }
        return out

    def print_human(self) -> None:
        for name, m in self.modes.items():
            fails = [it for it in m["items"] if not it["ok"]]
            print(f"== --{name} ==")
            for k, v in m["info"].items():
                if isinstance(v, (dict, list)):
                    v = json.dumps(v, ensure_ascii=False)
                print(f"  {k}: {v}")
            files: dict[str | None, list] = {}
            for it in m["items"]:
                files.setdefault(it["file"], []).append(it)
            for f, its in files.items():
                bad = [it for it in its if not it["ok"]]
                label = f if f is not None else "(전체)"
                if bad:
                    print(f"FAIL {label}")
                    for it in bad:
                        msg = it["message"].replace("\n", "\n      ")
                        print(f"  [{it['check']}] {msg}")
                else:
                    summary = "; ".join(f"{it['check']}: {it['message']}" for it in its if it["message"])
                    print(f"PASS {label}" + (f"  ({summary})" if summary and len(summary) < 200 else ""))
            print(f"-- 결과: {'통과' if not fails else f'실패 {len(fails)}건'}")
            print()
        print("전체: " + ("통과" if self.ok() else "실패"))


# ─── 프로젝트·경로 ────────────────────────────────────────────────────────────

class Ctx:
    def __init__(self, args) -> None:
        self.project = Path(args.project).resolve() if args.project else DEFAULT_PROJECT
        self.plugin = Path(os.environ.get("CLAUDE_PLUGIN_ROOT") or DEFAULT_PLUGIN)
        self.args = args
        self.dirs = dict(DEFAULT_DIRS)
        self.tracks = dict(DEFAULT_TRACKS)
        pj = self.project / ".claude/authoring/paths.json"
        if pj.exists():
            try:
                _d = json.loads(pj.read_text(encoding="utf-8")).get("dirs", {})
                self.dirs.update({k: v for k, v in _d.items() if isinstance(v, str)})
                if isinstance(_d.get("tracks"), dict):
                    self.tracks = {k: v for k, v in _d["tracks"].items() if isinstance(v, str)}
            except (OSError, json.JSONDecodeError) as e:
                raise Fatal(f"paths.json 을 읽을 수 없습니다: {pj} — {e}")
        self.spec_overrides: dict[str, dict] = {}
        for sf in args.spec_file or []:
            p = Path(sf)
            try:
                data = json.loads(p.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError) as e:
                raise Fatal(f"--spec-file 을 읽을 수 없습니다: {sf} — {e}")
            if not data.get("id"):
                raise Fatal(f"--spec-file 에 id 가 없습니다: {sf}")
            self.spec_overrides[data["id"]] = data
        self._spec_cache: dict[str, dict] = {}
        self._hash_cache: dict[str, tuple[bool, str]] = {}

    def rel(self, p: Path) -> str:
        try:
            return str(p.resolve().relative_to(self.project))
        except ValueError:
            return str(p)

    def targets(self, files: list[str] | None) -> list[Path]:
        if files:
            return [Path(f) if Path(f).is_absolute() else Path.cwd() / f for f in files]
        out: list[Path] = []
        for track in self.tracks.values():
            base = self.project / self.dirs["content"] / track
            if not base.is_dir():
                continue
            for folder in sorted(p for p in base.iterdir() if p.is_dir()):
                vs = guide_versions(folder)
                if not vs:
                    continue
                latest = vs[-1]
                # 구본(status: legacy)은 재집필 대상이라 명세 검사에서 뺀다.
                if parse_front(latest.read_text(encoding="utf-8")).get("status") == "legacy":
                    continue
                out.append(latest)
        return out

    def in_layout(self, path: Path) -> bool:
        """<content>/<track>/<slug>/ 아래의 가이드인가."""
        rp = path.resolve()
        for track in self.tracks.values():
            base = (self.project / self.dirs["content"] / track).resolve()
            if base in rp.parents:
                return True
        return False

    def spec_id_for(self, path: Path) -> str | None:
        if self.args.spec:
            return self.args.spec
        rp = path.resolve()
        # 새 배치: <content>/<track>/<slug>/<slug>-guide_vX.Y.Z.md
        for sid, track in self.tracks.items():
            base = (self.project / self.dirs["content"] / track).resolve()
            if base in rp.parents:
                return sid
        for key, sid in SPEC_OF_DIRKEY.items():
            if key in self.dirs:
                d = (self.project / self.dirs[key]).resolve()
                if rp.parent == d:
                    return sid
        if len(self.spec_overrides) == 1:
            return next(iter(self.spec_overrides))
        return None

    def spec(self, sid: str) -> dict:
        if sid in self.spec_overrides:
            return self.spec_overrides[sid]
        if sid not in self._spec_cache:
            p = self.project / ".claude/authoring/specs" / sid / "spec.json"
            if not p.exists():
                raise Fatal(f"spec `{sid}` 이 없습니다: {p}\n"
                            f"  spec 작성이 끝난 뒤 다시 실행하거나 --spec-file <spec.json> 으로 지정하세요.")
            try:
                self._spec_cache[sid] = json.loads(p.read_text(encoding="utf-8"))
            except json.JSONDecodeError as e:
                raise Fatal(f"spec `{sid}` JSON 오류: {p} — {e}")
        return self._spec_cache[sid]

    def resolve_hash(self, sid: str) -> tuple[bool, str]:
        if sid not in self._hash_cache:
            script = self.plugin / "scripts/authoring.py"
            if not script.exists():
                self._hash_cache[sid] = (False, f"authoring.py 가 없습니다: {script} (CLAUDE_PLUGIN_ROOT 확인)")
            else:
                r = subprocess.run([sys.executable, str(script), "resolve", "--voice", VOICE, "--spec", sid,
                                    "--project", str(self.project), "--profile", "worker"],
                                   capture_output=True)
                if r.returncode != 0:
                    msg = (r.stderr.decode("utf-8", "replace") or r.stdout.decode("utf-8", "replace")).strip()
                    self._hash_cache[sid] = (False, f"resolve 실패(exit {r.returncode}): {msg[:400]}")
                else:
                    self._hash_cache[sid] = (True, hashlib.sha256(r.stdout).hexdigest()[:16])
        return self._hash_cache[sid]


# ─── 마크다운 파싱 ────────────────────────────────────────────────────────────

FENCE_OPEN = re.compile(r"^(\s*)(`{3,}|~{3,})(.*)$")
HEADING = re.compile(r"^ {0,3}(#{1,6})[ \t]+(.*?)[ \t]*$")
LIST_ITEM = re.compile(r"^(\s*)([-*+]|\d+[.)])\s+(.*)$")


class Md:
    def __init__(self, text: str) -> None:
        self.lines = text.split("\n")
        self.headings: list[tuple[int, int, str]] = []   # (line_idx, level, text)
        self.fences: list[dict] = []                      # start, end(None=열린 채), info, lang, body
        self.masked = [False] * len(self.lines)           # 펜스·HTML 주석 안의 줄
        fence = None
        in_comment = False
        for i, line in enumerate(self.lines):
            if fence is not None:
                self.masked[i] = True
                ch, n = fence["marker"][0], len(fence["marker"])
                if re.match(r"^\s*" + re.escape(ch) + "{" + str(n) + r",}\s*$", line):
                    fence["end"] = i
                    self.fences.append(fence)
                    fence = None
                else:
                    fence["body"].append(line)
                continue
            if in_comment:
                self.masked[i] = True
                if "-->" in line:
                    in_comment = False
                continue
            m = FENCE_OPEN.match(line)
            if m and not (m.group(2).startswith("`") and "`" in m.group(3)):
                info = m.group(3).strip()
                fence = {"start": i, "end": None, "marker": m.group(2), "info": info,
                         "lang": (info.split()[0].lower() if info else ""), "body": []}
                self.masked[i] = True
                continue
            stripped = line.strip()
            if stripped.startswith("<!--") and "-->" not in stripped[4:]:
                in_comment = True
                self.masked[i] = True
                continue
            h = HEADING.match(line)
            if h:
                txt = re.sub(r"[ \t]+#+$", "", h.group(2)).strip()
                self.headings.append((i, len(h.group(1)), txt))
        if fence is not None:
            self.fences.append(fence)

    def section(self, level: int, text: str) -> tuple[int, int] | None:
        """헤딩 (level, text) 다음 줄부터 같은 레벨 이상 헤딩 직전까지의 줄 범위 [start, end)."""
        for idx, (ln, lv, tx) in enumerate(self.headings):
            if lv == level and tx == text:
                end = len(self.lines)
                for ln2, lv2, _ in self.headings[idx + 1:]:
                    if lv2 <= level:
                        end = ln2
                        break
                return ln + 1, end
        return None

    def fences_in(self, rng: tuple[int, int]) -> list[dict]:
        return [f for f in self.fences if rng[0] <= f["start"] < rng[1]]


# ─── --all 의 개별 검사 ───────────────────────────────────────────────────────

def _compile_heading(h: str) -> tuple[int, str, re.Pattern, bool]:
    m = re.match(r"^(#{1,6})\s+(.*)$", h.strip())
    if not m:
        raise Fatal(f"spec heading 형식이 `#… 제목` 이 아닙니다: {h!r}")
    level, text = len(m.group(1)), m.group(2).strip()
    parts = re.split(r"(\{[^{}]*\})", text)
    is_pattern = len(parts) > 1
    rx = "".join(".+?" if (p.startswith("{") and p.endswith("}")) else re.escape(p) for p in parts)
    return level, text, re.compile("^" + rx + "$"), is_pattern


def check_headings(md: Md, spec: dict) -> list[str]:
    errors: list[str] = []
    sections = sorted(spec.get("sections", []), key=lambda s: s.get("order", 0))
    no_heading = [s.get("id") for s in sections if not s.get("heading")]
    if no_heading:
        raise Fatal(f"spec `{spec.get('id')}` sections 에 heading 이 없는 항목이 있습니다: {no_heading}")
    comp = []
    for s in sections:
        level, text, rx, pat = _compile_heading(s["heading"])
        comp.append({"id": s["id"], "level": level, "text": text, "rx": rx, "pattern": pat,
                     "order": s.get("order", 0), "required": bool(s.get("required")),
                     "parent": s.get("parent"), "repeat": bool(s.get("repeat")), "heading": s["heading"]})
    by_id = {c["id"]: c for c in comp}

    # h1
    h1s = [h for h in md.headings if h[1] == 1]
    if len(h1s) != 1:
        errors.append(f"h1 이 {len(h1s)}개입니다 — 정확히 1개여야 합니다")
    if h1s:
        ln, _, tx = h1s[0]
        if not re.match(r"^\S.* — \S.*$", tx):
            errors.append(f"L{ln + 1} h1 형식이 `# … — …` 가 아닙니다: '# {tx}'")
        for c in comp:
            if c["level"] == 1 and not c["rx"].match(tx):
                errors.append(f"L{ln + 1} h1 이 spec `{c['id']}` 헤딩 '{c['heading']}' 과 맞지 않습니다: '# {tx}'")
        before = [h for h in md.headings if h[0] < ln and h[1] in (2, 3)]
        if before:
            errors.append(f"L{before[0][0] + 1} h1 보다 앞에 헤딩이 있습니다: '{'#' * before[0][1]} {before[0][2]}'")

    matched: dict[str, int] = {}
    last_order = float("-inf")
    last_heading = None
    current_h2: str | None = None
    for ln, lv, tx in md.headings:
        if lv not in (2, 3):
            continue
        shown = f"L{ln + 1} '{'#' * lv} {tx}'"
        cands = [c for c in comp if c["level"] == lv and c["rx"].match(tx)]
        if not cands:
            errors.append(f"{shown} spec 에 없는 헤딩입니다")
            if lv == 2:
                current_h2 = "?"
            continue
        pool = [c for c in cands if not c["pattern"]] or cands
        pick = (next((c for c in pool if c["id"] not in matched and c["order"] > last_order), None)
                or next((c for c in pool if c["id"] not in matched), None) or pool[0])
        if pick["id"] in matched and not pick["repeat"]:
            errors.append(f"{shown} 헤딩이 중복됩니다(spec `{pick['id']}`)")
        elif pick["order"] < last_order or (pick["order"] == last_order and not pick["repeat"]):
            errors.append(f"{shown} 순서가 틀립니다 — spec 순서상 '{last_heading}' 보다 앞이어야 합니다")
        else:
            last_order, last_heading = pick["order"], pick["heading"]
        matched[pick["id"]] = matched.get(pick["id"], 0) + 1
        if lv == 2:
            current_h2 = pick["id"]
        elif pick["parent"]:
            if current_h2 != pick["parent"]:
                parent = by_id.get(pick["parent"])
                where = "상위 `##` 없음" if current_h2 is None else (
                    "spec 에 없는 `##` 아래" if current_h2 == "?" else f"'{by_id[current_h2]['heading']}' 아래")
                errors.append(f"{shown} 계층이 틀립니다 — '{parent['heading'] if parent else pick['parent']}' "
                              f"아래여야 하는데 {where}에 있습니다")
    for c in comp:
        if c["level"] == 1:
            if c["required"] and not h1s:
                errors.append(f"필수 제목(h1) 누락: '{c['heading']}'")
            continue
        if c["required"] and c["id"] not in matched:
            errors.append(f"필수 절 누락: '{c['heading']}'")
    return errors


def check_placeholders(ctx: Ctx, path: Path, sid: str) -> tuple[bool, str]:
    script = ctx.plugin / "scripts/lint_placeholders.py"
    if not script.exists():
        return False, f"lint_placeholders.py 가 없습니다: {script}"
    r = subprocess.run([sys.executable, str(script), "check", str(path), "--spec", sid,
                        "--project", str(ctx.project), "--stage", "final"], capture_output=True, text=True)
    if r.returncode == 0:
        return True, "final 통과"
    detail = [ln.strip() for ln in (r.stdout + r.stderr).splitlines() if "실패" in ln or "검사 불가" in ln]
    return False, f"lint_placeholders exit {r.returncode}: " + ("; ".join(detail) or r.stdout.strip()[-400:])


def check_style(ctx: Ctx, path: Path) -> tuple[bool, str]:
    script = ctx.plugin / "scripts/scan_ai_style.py"
    if not script.exists():
        return False, f"scan_ai_style.py 가 없습니다: {script}"
    r = subprocess.run([sys.executable, str(script), str(path), "--voice", VOICE, "--json"],
                       capture_output=True, text=True)
    try:
        data = json.loads(r.stdout)
    except json.JSONDecodeError:
        return False, f"scan_ai_style exit {r.returncode}, JSON 아님: {(r.stderr or r.stdout).strip()[:400]}"
    grade = data.get("grade")
    codes = ", ".join(f"{f['code']}×{f['count']}" for f in data.get("findings", []))
    msg = f"등급 {grade} (S1 {data.get('s1')} · S2 {data.get('s2')})" + (f" — {codes}" if codes else "")
    return grade in ("A", "B"), msg


def check_fences(md: Md) -> list[str]:
    errors = []
    for f in md.fences:
        if f["end"] is None:
            errors.append(f"L{f['start'] + 1} 펜스 '{f['marker']}{f['info']}' 가 닫히지 않았습니다")
        elif f["lang"] == "mermaid" and not "".join(f["body"]).strip():
            errors.append(f"L{f['start'] + 1} mermaid 펜스가 비어 있습니다")
    return errors


LINK = re.compile(r"\]\(\s*(<[^>]*>|[^)\s]+)(?:\s+(?:\"[^\"]*\"|'[^']*'))?\s*\)")
INLINE_CODE = re.compile(r"(`+)(?:(?!\1).)+?\1")


def check_links(md: Md, path: Path) -> tuple[int, list[str]]:
    errors, n = [], 0
    for i, line in enumerate(md.lines):
        if md.masked[i]:
            continue
        for m in LINK.finditer(INLINE_CODE.sub("", line)):
            target = m.group(1).strip("<>")
            low = target.lower()
            if low.startswith(("http://", "https://", "#", "mailto:")) or re.match(r"^[a-z][a-z0-9+.-]*:", low):
                continue
            n += 1
            rel = urllib.parse.unquote(target.split("#", 1)[0].split("?", 1)[0])
            if not rel:
                continue
            if not (path.parent / rel).exists():
                errors.append(f"L{i + 1} 상대 링크가 해소되지 않습니다: ({target})")
    return n, errors


def check_min_conditions(md: Md) -> tuple[bool, list[str], int]:
    rng = md.section(3, MIN_COND_HEADING)
    if rng is None:
        return False, [], 0
    items = []
    for i in range(*rng):
        if md.masked[i]:
            continue
        m = LIST_ITEM.match(md.lines[i])
        if m:
            items.append((i, len(m.group(1).expandtabs(4)), m.group(3)))
    if not items:
        return True, [f"'### {MIN_COND_HEADING}' 절에 목록 항목이 없습니다"], 0
    top = min(ind for _, ind, _ in items)
    tops = [i for i, ind, _ in items if ind == top]
    errors = []
    count = 0
    for i, ind, body in items:
        mark = re.match(r"^(\*\*|__)?\[(필수|선택)\]", body.strip())
        if ind != top:
            # PG27 — 표기를 하위 항목으로 내리면 검사에서 빠진다. 그 자체가 오류다.
            if mark:
                errors.append(f"L{i + 1} [{mark.group(2)}] 표기가 하위 항목에 있습니다 — 조건은 최상위 항목이어야 합니다(PG8·PG27)")
            continue
        count += 1
        if not mark:
            errors.append(f"L{i + 1} 최소 조건 항목이 [필수]/[선택] 으로 시작하지 않습니다: '{body.strip()[:60]}'")
            continue
        if mark.group(2) != "필수":
            continue
        # PG27 — 근거는 **그 조건의 본체 줄이나 '빠지면:' 줄**에만 인정한다.
        # 하위 [선택] 항목에 달린 근거를 끌어다 쓰는 우회를 막는다.
        nxt = next((j for j in tops if j > i), rng[1])
        own = []
        for k in range(i, nxt):
            if md.masked[k]:
                continue
            lm = LIST_ITEM.match(md.lines[k])
            if k != i and lm and len(lm.group(1).expandtabs(4)) > top:
                if re.match(r"^(\*\*|__)?빠지면", lm.group(3).strip()):
                    own.append(md.lines[k])
                continue
            own.append(md.lines[k])
        span = "\n".join(own)
        basis = re.search(r"\(근거:\s*([^)]*)\)", span)
        head = body.strip()[:60]
        if not basis:
            errors.append(f"L{i + 1} [필수] 조건에 (근거: …) 괄호가 없습니다(PG27) — 조건 본체나 '빠지면:' 줄에 답니다: '{head}'")
            continue
        text = basis.group(1).strip()
        if not text:
            errors.append(f"L{i + 1} [필수] 조건의 근거가 비어 있습니다(PG27): '{head}'")
        elif re.match(r"^(이|본|우리)\s*(가이드|글|예제|문서)", text) or "가이드의 정책" in text:
            errors.append(f"L{i + 1} [필수] 조건의 근거가 이 가이드의 정책입니다 — [선택] 으로 내립니다(PG27): '{head}'")
        elif not any(tok in text for tok in BASIS_SOURCES):
            errors.append(
                f"L{i + 1} [필수] 조건의 근거가 원전을 가리키지 않습니다(PG27) — 허용: {', '.join(BASIS_SOURCES)}: '{text[:50]}'")
    return True, errors, count


def _cells(row: str) -> list[str]:
    row = row.strip()
    if row.startswith("|"):
        row = row[1:]
    if row.endswith("|"):
        row = row[:-1]
    return [c.strip() for c in re.split(r"(?<!\\)\|", row)]


def check_context_table(md: Md) -> list[str]:
    rng = md.section(3, CONTEXT_HEADING)
    if rng is None:
        return [f"'### {CONTEXT_HEADING}' 절이 없습니다"]
    sep = re.compile(r"^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?$")
    labels: list[str] = []
    rows: list[tuple[str, str]] = []
    found = False
    i = rng[0]
    while i < rng[1]:
        if not md.masked[i] and md.lines[i].strip().startswith("|") and i + 1 < rng[1] \
                and sep.match(md.lines[i + 1].strip()):
            found = True
            j = i + 2
            while j < rng[1] and md.lines[j].strip().startswith("|"):
                cells = _cells(md.lines[j])
                if cells:
                    lb = re.sub(r"[*_`]", "", cells[0])
                    labels.append(lb)
                    rows.append((lb, cells[1] if len(cells) > 1 else ""))
                j += 1
            i = j
            continue
        i += 1
    if not found:
        return [f"'### {CONTEXT_HEADING}' 절에 마크다운 표가 없습니다"]
    missing = [name for name, pred in CONTEXT_KEYWORDS if not any(pred(lb) for lb in labels)]
    if missing:
        return [f"상황 설정 표의 행 라벨에 없는 항목: {missing} (행 라벨: {labels})"]
    # AG3 — 라벨만 보면 칸을 비워도 통과한다. 값 칸이 실제로 채워졌는지 본다.
    errs = []
    for lb, val in rows:
        plain = re.sub(r"[*_`]", "", val).strip()
        if not plain or plain in BLANK_CELLS:
            errs.append(f"상황 설정 표 '{lb}' 칸이 비어 있습니다(AG3): '{val[:30]}'")
        elif len(plain) < CELL_MIN:
            errs.append(f"상황 설정 표 '{lb}' 칸이 너무 짧습니다(AG3, {CELL_MIN}자 이상): '{plain}'")
    return errs


def check_version(ctx: "Ctx", path: Path, sid: str, text: str) -> list[str]:
    """버저닝 규약 — 파일명 semver · 머리말 · spec 판본 · 폴더 안 최신 유일."""
    errs = []
    m = GUIDE_RE.match(path.name)
    if not m:
        return [f"파일명이 <slug>-guide_v<semver>.md 가 아닙니다: {path.name}"]
    meta = parse_front(text)
    if not meta:
        return [f"머리말(frontmatter)이 없습니다 — {', '.join(FRONT_KEYS)} 를 답니다"]
    for k in FRONT_KEYS:
        if not meta.get(k):
            errs.append(f"머리말에 {k} 가 없습니다")
    if meta.get("version") and meta["version"] != m["ver"]:
        errs.append(f"파일명 버전 {m['ver']} ≠ 머리말 version {meta['version']}")
    if meta.get("slug") and meta["slug"] != m["slug"]:
        errs.append(f"파일명 slug {m['slug']} ≠ 머리말 slug {meta['slug']}")
    if path.parent.name != m["slug"]:
        errs.append(f"폴더 이름 {path.parent.name} ≠ 파일 slug {m['slug']}")
    if meta.get("spec") and meta["spec"] != sid:
        errs.append(f"머리말 spec {meta['spec']} ≠ 이 폴더의 명세 {sid}")
    cur = (ctx.spec(sid) or {}).get("version")
    if cur and meta.get("spec_version") and meta["spec_version"] != cur:
        errs.append(f"머리말 spec_version {meta['spec_version']} ≠ 현재 {sid} {cur} — 새 판본으로 다시 쓰거나 버전을 올립니다")
    vs = guide_versions(path.parent)
    if vs and vs[-1] != path:
        errs.append(f"이 폴더의 최신은 {vs[-1].name} 입니다 — 최신본만 검사·발행 대상입니다")
    dup = [f.name for f in vs if GUIDE_RE.match(f.name)["ver"] == m["ver"] and f != path]
    if dup:
        errs.append(f"같은 버전이 둘 이상입니다: {dup}")
    return errs


def mode_all(ctx: Ctx, rep: Report, files: list[Path]) -> None:
    M = "all"
    plan = []
    for p in files:
        sid = ctx.spec_id_for(p)
        if sid is None:
            raise Fatal(f"spec 을 정할 수 없습니다: {p} — 가이드 디렉토리 밖이면 --spec 또는 --spec-file 로 지정하세요")
        plan.append((p, sid, ctx.spec(sid)))
    rep.info(M, "files", len(files))
    rep.info(M, "plugin", str(ctx.plugin))
    for p, sid, spec in plan:
        f = ctx.rel(p)
        if not p.exists():
            rep.add(M, "file", False, "파일이 없습니다", f)
            continue
        raw = p.read_text(encoding="utf-8")
        if ctx.in_layout(p):          # 버저닝 규약은 가이드 배치 안의 파일에만 건다(픽스처·임시 파일 제외)
            verrs = check_version(ctx, p, sid, raw)
            for e in verrs:
                rep.add(M, "version", False, e, f)
            if not verrs:
                rep.add(M, "version", True, f"v{GUIDE_RE.match(p.name)['ver']} · spec {sid}", f)
        md = Md(raw)
        errs = check_headings(md, spec)
        for e in errs:
            rep.add(M, "heading", False, e, f)
        if not errs:
            rep.add(M, "heading", True, f"spec {sid}", f)
        ok, msg = check_placeholders(ctx, p, sid)
        rep.add(M, "placeholder", ok, msg, f)
        ok, msg = check_style(ctx, p)
        rep.add(M, "style", ok, msg, f)
        errs = check_fences(md)
        for e in errs:
            rep.add(M, "mermaid", False, e, f)
        if not errs:
            rep.add(M, "mermaid", True, "", f)
        n, errs = check_links(md, p)
        for e in errs:
            rep.add(M, "links", False, e, f)
        if not errs:
            rep.add(M, "links", True, f"상대 링크 {n}개", f)
        present, errs, count = check_min_conditions(md)
        for e in errs:
            rep.add(M, "min-conditions", False, e, f)
        if present and not errs:
            rep.add(M, "min-conditions", True, f"조건 {count}개", f)
        if sid == "analysis-guide":
            errs = check_context_table(md)
            for e in errs:
                rep.add(M, "context-table", False, e, f)
            if not errs:
                rep.add(M, "context-table", True, "", f)


def mode_links(ctx: Ctx, rep: Report, files: list[Path]) -> None:
    rep.info("links", "files", len(files))
    for p in files:
        f = ctx.rel(p)
        if not p.exists():
            rep.add("links", "file", False, "파일이 없습니다", f)
            continue
        n, errs = check_links(Md(p.read_text(encoding="utf-8")), p)
        for e in errs:
            rep.add("links", "links", False, e, f)
        if not errs:
            rep.add("links", "links", True, f"상대 링크 {n}개", f)


# ─── --compile ────────────────────────────────────────────────────────────────

def _run(cmd: list[str], **kw) -> tuple[int, str]:
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    except FileNotFoundError:
        return 127, f"{cmd[0]}: 명령을 찾을 수 없습니다"
    return r.returncode, (r.stdout + r.stderr).strip()


def _strip_json_comments(s: str) -> str:
    out, i, n, in_str = [], 0, len(s), False
    while i < n:
        c = s[i]
        if in_str:
            out.append(c)
            if c == "\\" and i + 1 < n:
                out.append(s[i + 1])
                i += 1
            elif c == '"':
                in_str = False
        elif c == '"':
            in_str = True
            out.append(c)
        elif s.startswith("//", i):
            while i < n and s[i] != "\n":
                i += 1
            continue
        elif s.startswith("/*", i):
            j = s.find("*/", i + 2)
            i = n if j < 0 else j + 2
            continue
        else:
            out.append(c)
        i += 1
    return re.sub(r",(\s*[}\]])", r"\1", "".join(out))


def toolchain(ctx: Ctx) -> tuple[dict, list[str]]:
    tools: dict = {}
    errors: list[str] = []
    rc, out = _run(["javac", "-version"])
    m = re.search(r"javac\s+(\d+)(?:\.[\w.+-]*)?", out)
    if rc != 0 or not m:
        errors.append(f"javac 을 실행할 수 없습니다(JDK 21 필요): {out[:200]}")
    else:
        tools["javac"] = out.splitlines()[0]
        if m.group(1) != "21":
            errors.append(f"javac 21 이 필요합니다 — 현재 {out.splitlines()[0]}")
    tsc = ctx.project / "typescript/node_modules/.bin/tsc"
    if not tsc.exists():
        errors.append(f"{ctx.rel(tsc)} 가 없습니다 — `npm ci --prefix typescript` 를 먼저 실행하세요")
    else:
        rc, out = _run([str(tsc), "--version"])
        if rc != 0:
            errors.append(f"tsc --version 실패: {out[:200]}")
        else:
            tools["tsc"] = out.splitlines()[0]
    rc, out = _run(["rustc", "--version"])
    if rc != 0:
        errors.append(f"rustc 를 실행할 수 없습니다: {out[:200]}")
    else:
        tools["rustc"] = out.splitlines()[0]
    cargo = ctx.project / "rust/Cargo.toml"
    m = re.search(r'^\s*edition\s*=\s*"(\d{4})"', cargo.read_text(encoding="utf-8"), re.M) if cargo.exists() else None
    if not m:
        errors.append(f"{ctx.rel(cargo)} 에서 edition 을 읽을 수 없습니다")
    else:
        tools["rust_edition"] = m.group(1)
    tsconfig = ctx.project / "typescript/tsconfig.json"
    try:
        tools["_ts_options"] = json.loads(_strip_json_comments(tsconfig.read_text(encoding="utf-8")))["compilerOptions"]
    except (OSError, json.JSONDecodeError, KeyError) as e:
        errors.append(f"{ctx.rel(tsconfig)} 의 compilerOptions 를 읽을 수 없습니다: {e}")
    return tools, errors


JAVA_PUBLIC = re.compile(r"^public\s+(?:(?:final|abstract|sealed|non-sealed|strictfp)\s+)*"
                         r"(?:class|interface|enum|record|@interface)\s+(\w+)", re.M)


def compile_block(ctx: Ctx, tools: dict, lang: str, code: str) -> tuple[bool, str]:
    tmp = Path(tempfile.mkdtemp(prefix=f"check-guides-{lang}-")).resolve()
    try:
        if lang == "java":
            m = JAVA_PUBLIC.search(code)
            src = tmp / f"{m.group(1) if m else 'Main'}.java"
            src.write_text(code, encoding="utf-8")
            rc, out = _run(["javac", "-encoding", "UTF-8", "-d", str(tmp / "out"), str(src)])
        elif lang == "typescript":
            src = tmp / "main.ts"
            body = code
            # import/export 가 없는 파일은 전역 스크립트로 취급돼 @types/node 의 전역(Event 등)과 이름이
            # 부딪친다. 모듈로 만들어 블록 하나를 자기완결 단위로 검사한다(Rust 의 fn main 래핑과 같은 취지).
            if not re.search(r"^\s*(import|export)\b", code, re.M):
                body = code.rstrip("\n") + "\n\nexport {};\n"
            src.write_text(body, encoding="utf-8")
            opts = dict(tools["_ts_options"])
            opts["typeRoots"] = [str(ctx.project / "typescript/node_modules/@types")]
            opts["noEmit"] = True
            (tmp / "tsconfig.json").write_text(json.dumps({"compilerOptions": opts, "include": ["main.ts"]}),
                                               encoding="utf-8")
            rc, out = _run([str(ctx.project / "typescript/node_modules/.bin/tsc"), "--noEmit", "-p",
                            str(tmp / "tsconfig.json")], cwd=str(tmp))
        elif lang == "rust":
            src = tmp / "main.rs"
            body = code if re.search(r"\bfn\s+main\s*\(", code) else code.rstrip("\n") + "\n\nfn main() {}\n"
            src.write_text(body, encoding="utf-8")
            rc, out = _run(["rustc", "--edition", tools["rust_edition"], "--crate-type", "bin",
                            "-o", str(tmp / "a"), str(src)], cwd=str(tmp))
        else:
            return False, f"알 수 없는 언어: {lang}"
        out = out.replace(str(tmp) + os.sep, "")
        if rc == 0:
            warn = sum(1 for ln in out.splitlines() if re.match(r"^\s*warning\b", ln))
            return True, "컴파일 통과" + (f" (경고 {warn})" if warn else "")
        lines = out.splitlines()
        return False, f"컴파일 실패(exit {rc}):\n" + "\n".join(lines[:25]) + ("\n…" if len(lines) > 25 else "")
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def run_block(ctx: Ctx, tools: dict, lang: str, src_path: Path) -> tuple[bool, str]:
    """코드 파일 하나를 컴파일하고 실행해 stdout 을 돌려준다. (ok, 출력 또는 오류)"""
    tmp = Path(tempfile.mkdtemp(prefix=f"check-guides-run-{lang}-")).resolve()
    try:
        code = src_path.read_text(encoding="utf-8")
        if lang == "java":
            m = JAVA_PUBLIC.search(code)
            cls = m.group(1) if m else "Main"
            rc, out = _run(["javac", "-encoding", "UTF-8", "-d", str(tmp / "out"), str(src_path)])
            if rc != 0:
                return False, f"컴파일 실패(exit {rc}):\n{out[:1500]}"
            rc, out = _run(["java", "-Dfile.encoding=UTF-8", "-cp", str(tmp / "out"), cls])
        elif lang == "typescript":
            opts = dict(tools["_ts_options"])
            opts.update({"typeRoots": [str(ctx.project / "typescript/node_modules/@types")],
                         "noEmit": False, "outDir": str(tmp / "js"), "module": "commonjs", "target": "es2022",
                         "moduleResolution": "node", "verbatimModuleSyntax": False})
            (tmp / "tsconfig.json").write_text(
                json.dumps({"compilerOptions": opts, "include": [str(src_path)]}), encoding="utf-8")
            rc, out = _run([str(ctx.project / "typescript/node_modules/.bin/tsc"), "-p", str(tmp / "tsconfig.json")])
            if rc != 0:
                return False, f"컴파일 실패(exit {rc}):\n{out[:1500]}"
            js = next(iter(sorted((tmp / "js").rglob("*.js"))), None)
            if js is None:
                return False, "tsc 가 JavaScript 를 내지 않았습니다"
            rc, out = _run(["node", str(js)])
        elif lang == "rust":
            rc, out = _run(["rustc", "--edition", tools["rust_edition"], "-o", str(tmp / "a"), str(src_path)],
                           cwd=str(tmp))
            if rc != 0:
                return False, f"컴파일 실패(exit {rc}):\n{out[:1500]}"
            rc, out = _run([str(tmp / "a")])
        else:
            return False, f"알 수 없는 언어: {lang}"
        if rc != 0:
            return False, f"실행 실패(exit {rc}):\n{out[:1500]}"
        return True, out
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def mode_run(ctx: Ctx, rep: Report, files: list[Path]) -> None:
    """예시 코드는 본문 밖 실행 파일이 정본이다 — 세 언어가 같은 출력을 내고, 본문 펜스와 기대 출력이 그것과 같아야 한다."""
    M = "run"
    tools, terrs = toolchain(ctx)
    rep.info(M, "tools", {k: v for k, v in tools.items() if not k.startswith("_")})
    rep.info(M, "files", len(files))
    for e in terrs:
        rep.add(M, "toolchain", False, e)
    if terrs:
        return
    for p in files:
        f = ctx.rel(p)
        code = p.parent / "code"
        if not code.is_dir():
            rep.add(M, "code-dir", False, f"예시 코드 폴더가 없습니다: {ctx.rel(code)}", f)
            continue
        javas = sorted(code.glob("*.java"))
        srcs = {"java": javas[0] if len(javas) == 1 else None,
                "typescript": code / "main.ts" if (code / "main.ts").exists() else None,
                "rust": code / "main.rs" if (code / "main.rs").exists() else None}
        missing = [k for k, v in srcs.items() if v is None]
        if missing:
            rep.add(M, "code-dir", False,
                    f"코드 파일이 없거나 여럿입니다: {missing} (java 는 공개 클래스 이름으로 한 개)", f)
            continue
        exp_path = code / "expected-output.txt"
        if not exp_path.exists():
            rep.add(M, "expected", False, f"기대 출력 파일이 없습니다: {ctx.rel(exp_path)}", f)
            continue
        expected = exp_path.read_text(encoding="utf-8")
        rep.add(M, "code-dir", True, f"{javas[0].name} · main.ts · main.rs · expected-output.txt", f)
        # 본문 펜스 = 코드 파일
        md = Md(p.read_text(encoding="utf-8"))
        rng = md.section(3, IMPL_HEADING)
        blocks = [b for b in md.fences_in(rng) if "no-compile" not in b["info"]] if rng else []
        if len(blocks) != 3:
            rep.add(M, "fence-sync", False, f"'### {IMPL_HEADING}' 의 펜스가 3개가 아닙니다 — {len(blocks)}개", f)
        else:
            for (lang, src), b in zip(srcs.items(), blocks):
                fence = "\n".join(b["body"]).rstrip("\n") + "\n"
                if fence != src.read_text(encoding="utf-8").rstrip("\n") + "\n":
                    rep.add(M, "fence-sync", False,
                            f"본문 {lang} 펜스가 {ctx.rel(src)} 와 다릅니다 — 본문은 코드 파일에서 가져옵니다", f)
                else:
                    rep.add(M, "fence-sync", True, f"{lang} 펜스 = {src.name}", f)
        # 실행 대조
        outs = {}
        for lang, src in srcs.items():
            ok, out = run_block(ctx, tools, lang, src)
            if not ok:
                rep.add(M, f"run:{lang}", False, f"{ctx.rel(src)} {out}", f)
                continue
            outs[lang] = out
            if out.rstrip("\n") != expected.rstrip("\n"):
                rep.add(M, f"run:{lang}", False,
                        f"{ctx.rel(src)} 출력이 기대 출력과 다릅니다\n--- 실행\n{out[:800]}\n--- 기대\n{expected[:800]}", f)
            else:
                rep.add(M, f"run:{lang}", True, f"{src.name} 출력 {len(out.splitlines())}줄 일치", f)
        if len(outs) == 3 and len({v.rstrip() for v in outs.values()}) > 1:
            rep.add(M, "same-output", False, "세 언어의 출력이 서로 다릅니다", f)
        # 본문이 그 출력을 싣고 있는가
        body_fences = [b for b in md.fences if b["end"] is not None]
        want = expected.rstrip("\n")
        if any("\n".join(b["body"]).rstrip("\n") == want for b in body_fences):
            rep.add(M, "output-fence", True, "본문에 기대 출력 펜스가 있습니다", f)
        else:
            rep.add(M, "output-fence", False,
                    "본문에 실행 출력을 그대로 담은 펜스가 없습니다 — 수치는 실행에서 가져옵니다", f)


def mode_compile(ctx: Ctx, rep: Report, files: list[Path]) -> None:
    M = "compile"
    tools, terrs = toolchain(ctx)
    rep.info(M, "tools", {k: v for k, v in tools.items() if not k.startswith("_")})
    rep.info(M, "files", len(files))
    for e in terrs:
        rep.add(M, "toolchain", False, e)
    if not terrs:
        rep.add(M, "toolchain", True, " · ".join(f"{k}={v}" for k, v in tools.items() if not k.startswith("_")))
    jobs = []
    for p in files:
        f = ctx.rel(p)
        if not p.exists():
            rep.add(M, "file", False, "파일이 없습니다", f)
            continue
        md = Md(p.read_text(encoding="utf-8"))
        rng = md.section(3, IMPL_HEADING)
        if rng is None:
            rep.add(M, "structure", False, f"'### {IMPL_HEADING}' 절이 없습니다", f)
            continue
        blocks = [b for b in md.fences_in(rng) if "no-compile" not in b["info"]]
        langs = [b["lang"] or "(정보 문자열 없음)" for b in blocks]
        ok_shape = len(blocks) == 3 and all(b["lang"] in LANGS[k][1] for k, b in enumerate(blocks))
        if not ok_shape:
            rep.add(M, "structure", False,
                    f"'### {IMPL_HEADING}' 의 컴파일 대상 펜스는 정확히 3개, java → typescript → rust 순서여야 합니다 "
                    f"— 실제 {len(blocks)}개 {langs}", f)
        else:
            rep.add(M, "structure", True, "java → typescript → rust", f)
        for b in blocks:
            canon = next((name for name, al in LANGS if b["lang"] in al), None)
            if canon is None:
                continue
            if b["end"] is None:
                rep.add(M, f"compile:{canon}", False, f"L{b['start'] + 1} 펜스가 닫히지 않았습니다", f)
                continue
            jobs.append((f, b["start"] + 1, canon, "\n".join(b["body"]) + "\n"))
    if terrs:
        for f, line, canon, _ in jobs:
            rep.add(M, f"compile:{canon}", False, f"L{line} 도구가 준비되지 않아 컴파일하지 못했습니다", f)
        return
    workers = max(1, min(8, os.cpu_count() or 2))
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as ex:
        futs = [ex.submit(compile_block, ctx, tools, canon, code) for _, _, canon, code in jobs]
        for (f, line, canon, _), fut in zip(jobs, futs):
            ok, msg = fut.result()
            rep.add(M, f"compile:{canon}", ok, f"L{line} {msg}", f)


# ─── --spec-shared ────────────────────────────────────────────────────────────

def mode_spec_shared(ctx: Ctx, rep: Report) -> None:
    M = "spec-shared"
    blocks = {}
    for sid in ("gof-guide", "analysis-guide"):
        p = ctx.project / ".claude/authoring/specs" / sid / "spec.md"
        f = ctx.rel(p)
        if not p.exists():
            rep.add(M, "marker", False, "spec.md 가 없습니다", f)
            continue
        data = p.read_bytes()
        no, nc = data.count(SHARED_OPEN), data.count(SHARED_CLOSE)
        if no != 1 or nc != 1:
            rep.add(M, "marker", False, f"공유 블록 마커는 파일당 정확히 1쌍이어야 합니다 — 여는 주석 {no}개 · 닫는 주석 {nc}개", f)
            continue
        a = data.index(SHARED_OPEN) + len(SHARED_OPEN)
        b = data.index(SHARED_CLOSE)
        if b < a:
            rep.add(M, "marker", False, "닫는 주석이 여는 주석보다 앞에 있습니다", f)
            continue
        blocks[sid] = (f, data[a:b])
        rep.add(M, "marker", True, f"공유 블록 {b - a} bytes", f)
    if len(blocks) == 2:
        (fa, ba), (fb, bb) = blocks["gof-guide"], blocks["analysis-guide"]
        if ba == bb:
            rep.add(M, "identical", True, f"sha256 {hashlib.sha256(ba).hexdigest()[:16]}")
        else:
            la, lb = ba.split(b"\n"), bb.split(b"\n")
            k = next((i for i in range(min(len(la), len(lb))) if la[i] != lb[i]), min(len(la), len(lb)))
            rep.add(M, "identical", False,
                    f"두 공유 블록 내용이 다릅니다 — 블록 안 {k + 1}번째 줄부터 다름 "
                    f"({fa}: {la[k][:80].decode('utf-8', 'replace') if k < len(la) else '(끝)'!r} / "
                    f"{fb}: {lb[k][:80].decode('utf-8', 'replace') if k < len(lb) else '(끝)'!r})")


# ─── --resolve-hash · --gates ─────────────────────────────────────────────────

def mode_resolve_hash(ctx: Ctx, rep: Report, sid: str) -> None:
    ok, val = ctx.resolve_hash(sid)
    if ok:
        rep.info("resolve-hash", "spec", sid)
        rep.info("resolve-hash", "hash", val)
        rep.add("resolve-hash", "resolve", True, val)
    else:
        rep.add("resolve-hash", "resolve", False, val)


def mode_pointers(ctx: Ctx, rep: Report) -> None:
    """포인터 신선도 — 인덱스와 기준 예시가 각 폴더의 **최신본**을 가리키는가."""
    M = "pointers"
    idx = ctx.project / ctx.dirs.get("index", "PATTERNS.md")
    text = idx.read_text(encoding="utf-8") if idx.exists() else ""
    if not idx.exists():
        rep.add(M, "index", False, f"인덱스가 없습니다: {ctx.rel(idx)}")
    listed = 0
    for track in ctx.tracks.values():
        base = ctx.project / ctx.dirs["content"] / track
        if not base.is_dir():
            continue
        for folder in sorted(p for p in base.iterdir() if p.is_dir()):
            vs = guide_versions(folder)
            if not vs:
                continue
            latest = vs[-1]
            olds = [f.name for f in vs[:-1] if f.name in text]
            if olds:
                rep.add(M, "index", False, f"인덱스가 낡은 판을 가리킵니다: {olds} (최신 {latest.name})", ctx.rel(idx))
            elif latest.name in text:
                listed += 1
    rep.info(M, "index_latest", listed)
    ex = {}
    pj = ctx.project / ".claude/authoring/paths.json"
    if pj.exists():
        ex = json.loads(pj.read_text(encoding="utf-8")).get("exemplars", {}) or {}
    for sid, rel in ex.items():
        p = ctx.project / rel
        if not p.exists():
            rep.add(M, "exemplar", False, f"{sid} 기준 예시가 없습니다: {rel}")
            continue
        vs = guide_versions(p.parent)
        if vs and vs[-1] != p:
            rep.add(M, "exemplar", False, f"{sid} 기준 예시가 낡았습니다: {rel} (최신 {vs[-1].name})")
        else:
            rep.add(M, "exemplar", True, f"{sid} → {rel}")
    if not ex:
        rep.add(M, "exemplar", False, "paths.json 의 exemplars 가 비어 있습니다 — spec 마다 최신 통과본을 등록합니다")


def mode_gates(ctx: Ctx, rep: Report) -> None:
    M = "gates"
    gp = Path(ctx.args.gate_file) if ctx.args.gate_file else ctx.project / ctx.dirs["gate_results"]
    rep.info(M, "gate_file", str(gp))
    if not gp.exists():
        rep.add(M, "gate-file", False, f"게이트 기록 파일이 없습니다: {gp}")
        return
    last: dict[str, tuple[int, dict]] = {}
    for n, line in enumerate(gp.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        try:
            rec = json.loads(line)
        except json.JSONDecodeError as e:
            rep.add(M, "schema", False, f"L{n} JSON 오류: {e}")
            continue
        if not isinstance(rec, dict):
            rep.add(M, "schema", False, f"L{n} 객체가 아닙니다")
            continue
        missing = [k for k in GATE_KEYS if k not in rec]
        if missing:
            rep.add(M, "schema", False, f"L{n} 키 누락: {missing}")
            continue
        key = str(rec["file"])
        key = key[2:] if key.startswith("./") else key
        last[key] = (n, rec)
    spec_filter = ctx.args.spec
    selected = {k: v for k, v in last.items() if spec_filter is None or v[1]["spec"] == spec_filter}
    rep.info(M, "files", len(selected))
    if spec_filter:
        rep.info(M, "spec", spec_filter)
    for f, (n, rec) in sorted(selected.items()):
        problems = []
        if rec["verdict"] != "PASS":
            problems.append(f"verdict={rec['verdict']!r} (PASS 여야 함)")
        ok, cur = ctx.resolve_hash(str(rec["spec"]))
        if not ok:
            problems.append(f"현재 resolve 해시를 구할 수 없습니다 — {cur}")
        elif str(rec["resolve_hash"])[:16] != cur:
            problems.append(f"낡은 PASS — 기록 해시 {str(rec['resolve_hash'])[:16]} ≠ 현재 {cur} (spec {rec['spec']})")
        if problems:
            rep.add(M, "record", False, f"L{n} " + " · ".join(problems), f)
        else:
            rep.add(M, "record", True, f"L{n} PASS · {rec['date']}", f)
    if ctx.args.expect is not None:
        ok = len(selected) == ctx.args.expect
        what = f"spec {spec_filter}" if spec_filter else "전체"
        rep.add(M, "expect", ok, f"{what} 기록 파일 수 {len(selected)} (기대 {ctx.args.expect})")


# ─── --derived ────────────────────────────────────────────────────────────────

FP_MARK = re.compile(r"<!--\s*guide-fp:([0-9a-fA-F]+)\s*-->")


def mode_derived(ctx: Ctx, rep: Report, files: list[Path]) -> None:
    M = "derived"
    renderer = ctx.project / "scripts/render-guides.py"
    if not renderer.exists():
        rep.add(M, "renderer", False, f"렌더러가 아직 없습니다: {ctx.rel(renderer)} — 지문을 계산할 수 없습니다")
        return
    try:
        spec = importlib.util.spec_from_file_location("render_guides", str(renderer))
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)  # type: ignore[union-attr]
        fingerprint = getattr(mod, "fingerprint")
    except Exception as e:  # noqa: BLE001 — 렌더러 쪽 어떤 오류든 원인 그대로 보고한다
        rep.add(M, "renderer", False, f"render-guides.py 에서 fingerprint 를 불러오지 못했습니다: {type(e).__name__}: {e}")
        return
    counts = {"fresh": 0, "stale": 0, "missing": 0}
    for p in files:
        f = ctx.rel(p)
        if not p.exists():
            rep.add(M, "file", False, "가이드 md 가 없습니다", f)
            continue
        html = p.parent / (p.stem + ".html")
        if not html.exists():
            counts["missing"] += 1
            rep.add(M, "missing", not ctx.args.require_html, f"HTML 없음: {ctx.rel(html)}", f)
            continue
        try:
            want = str(fingerprint(str(p.resolve())))
        except Exception as e:  # noqa: BLE001
            rep.add(M, "fingerprint", False, f"fingerprint() 실패: {type(e).__name__}: {e}", f)
            continue
        with open(html, "rb") as fh:
            head = fh.read(2048).decode("utf-8", "replace")
        m = FP_MARK.search(head)
        if m and m.group(1).lower() == want.lower():
            counts["fresh"] += 1
            rep.add(M, "fresh", True, ctx.rel(html), f)
        else:
            counts["stale"] += 1
            got = m.group(1) if m else "(앞 2KB 에 guide-fp 주석 없음)"
            rep.add(M, "stale", False, f"낡은 HTML: {ctx.rel(html)} — 기록 {got} ≠ 현재 {want}", f)
    rep.info(M, "counts", counts)


# ─── --self-test ──────────────────────────────────────────────────────────────

def _call(args: list[str]) -> tuple[int, dict | None, str]:
    r = subprocess.run([sys.executable, str(SCRIPT_PATH), *args, "--json"], capture_output=True, text=True)
    try:
        data = json.loads(r.stdout)
    except json.JSONDecodeError:
        data = None
    return r.returncode, data, (r.stdout + r.stderr)


def _failed_checks(data: dict | None, mode: str) -> set[str]:
    if not data or mode not in data.get("modes", {}):
        return set()
    return {it["check"] for it in data["modes"][mode]["items"] if not it["ok"]}


def _failed_msgs(data: dict | None, mode: str) -> str:
    if not data or mode not in data.get("modes", {}):
        return ""
    return "\n".join(it["message"] for it in data["modes"][mode]["items"] if not it["ok"])


def self_test(want_modes: set[str], as_json: bool) -> int:
    fx = FIXTURES
    cases = []   # (mode, name, args, expect_rc, predicate(data, out) -> (ok, why))

    def need(checks: set[str], mode: str):
        def pred(data, out):
            got = _failed_checks(data, mode)
            return checks <= got, f"기대 실패 검사 {sorted(checks)} / 실제 {sorted(got)}"
        return pred

    def contains(mode: str, *needles: str):
        def pred(data, out):
            msgs = _failed_msgs(data, mode)
            miss = [n for n in needles if n not in msgs]
            return not miss, f"실패 메시지에 없음: {miss}"
        return pred

    gof_spec = ["--spec-file", str(fx / "spec-gof.json")]
    ana_spec = ["--spec-file", str(fx / "spec-analysis.json")]
    cases += [
        ("all", "good-gof 통과", ["--all", *gof_spec, str(fx / "good-gof.md")], 0, None),
        ("all", "bad-gof 실패(헤딩·최소 조건·링크·mermaid)", ["--all", *gof_spec, str(fx / "bad-gof.md")], 1,
         lambda d, o: (lambda a, b: (a[0] and b[0], a[1] + " · " + b[1]))(
             need({"heading", "min-conditions", "links", "mermaid"}, "all")(d, o),
             contains("all", "필수 절 누락", "순서가 틀립니다", "spec 에 없는 헤딩", "[필수]/[선택]")(d, o))),
        ("all", "min-bypass 실패(근거 우회 4종: 하위 항목 근거 · 빈 근거 · 원전 아닌 근거 · 하위 [필수])",
         ["--all", *gof_spec, str(fx / "min-bypass-gof.md")], 1,
         lambda d, o: (lambda *r: (all(x[0] for x in r), " · ".join(x[1] for x in r)))(
             need({"min-conditions"}, "all")(d, o),
             contains("all", "(근거: …) 괄호가 없습니다", "근거가 비어 있습니다",
                      "근거가 원전을 가리키지 않습니다", "표기가 하위 항목에 있습니다")(d, o))),
        ("all", "context-blank 실패(상황 설정 표 칸이 비거나 짧음)",
         ["--all", *ana_spec, str(fx / "context-blank-analysis.md")], 1,
         lambda d, o: (lambda *r: (all(x[0] for x in r), " · ".join(x[1] for x in r)))(
             need({"context-table"}, "all")(d, o),
             contains("all", "칸이 비어 있습니다")(d, o))),
        ("all", "min-basis 실패([필수] 근거 괄호 없음 · 근거가 가이드 정책)",
         ["--all", *gof_spec, str(fx / "min-basis-gof.md")], 1,
         lambda d, o: (lambda a, b: (a[0] and b[0], a[1] + " · " + b[1]))(
             need({"min-conditions"}, "all")(d, o),
             contains("all", "(근거: …) 괄호가 없습니다", "근거가 이 가이드의 정책입니다")(d, o))),
        ("all", "good-analysis 통과", ["--all", *ana_spec, str(fx / "good-analysis.md")], 0, None),
        ("all", "bad-analysis 실패(상황 설정 표 라벨)", ["--all", *ana_spec, str(fx / "bad-analysis.md")], 1,
         need({"context-table"}, "all")),
        ("all", "spec 없음은 명확한 오류", ["--all", "--project", str(fx), "--spec", "no-such-spec",
                                     str(fx / "good-gof.md")], 1,
         lambda d, o: ("spec `no-such-spec` 이 없습니다" in o, "오류 문구 없음")),
        ("compile", "good-gof 세 블록 컴파일", ["--compile", str(fx / "good-gof.md")], 0,
         lambda d, o: (bool(d) and {"javac", "tsc", "rustc"} <= set(d["modes"]["compile"]["info"]["tools"])
                       and sum(1 for it in d["modes"]["compile"]["items"]
                               if it["check"].startswith("compile:") and it["ok"]) == 3,
                       "도구 버전 3종 기록 + 통과 블록 3개")),
        ("compile", "bad-gof 펜스 순서 실패", ["--compile", str(fx / "bad-gof.md")], 1, need({"structure"}, "compile")),
        ("compile", "compile-error 세 언어 모두 실패", ["--compile", str(fx / "compile-error-gof.md")], 1,
         need({"compile:java", "compile:typescript", "compile:rust"}, "compile")),
        ("links", "good-gof 링크 통과", ["--links", str(fx / "good-gof.md")], 0, None),
        ("links", "bad-gof 링크 실패", ["--links", str(fx / "bad-gof.md")], 1, need({"links"}, "links")),
    ]

    tmp_root = Path(tempfile.mkdtemp(prefix="check-guides-selftest-"))
    try:
        # spec-shared: 임시 프로젝트 3벌
        def shared_project(name: str, a: bytes, b: bytes) -> str:
            root = tmp_root / name
            for sid, content in (("gof-guide", a), ("analysis-guide", b)):
                d = root / ".claude/authoring/specs" / sid
                d.mkdir(parents=True)
                (d / "spec.md").write_bytes(content)
            return str(root)
        same = (fx / "shared-a.md").read_bytes()
        cases += [
            ("spec-shared", "공유 블록 일치", ["--spec-shared", "--project",
                                          shared_project("shared-ok", same, (fx / "shared-b.md").read_bytes())], 0, None),
            ("spec-shared", "공유 블록 내용 불일치", ["--spec-shared", "--project",
                                              shared_project("shared-diff", same, (fx / "shared-b-diff.md").read_bytes())], 1,
             need({"identical"}, "spec-shared")),
            ("spec-shared", "공유 블록 마커 2쌍", ["--spec-shared", "--project",
                                            shared_project("shared-dup", same, same + b"\n" + same)], 1,
             need({"marker"}, "spec-shared")),
        ]

        # gates: 실제 프로젝트의 kanban-report 해시를 기준으로 임시 기록 파일
        ok_hash = None
        if want_modes & {"gates", "resolve-hash"} or not want_modes:
            r = subprocess.run([sys.executable, str(SCRIPT_PATH), "--resolve-hash", "kanban-report", "--json"],
                               capture_output=True, text=True)
            try:
                ok_hash = json.loads(r.stdout)["modes"]["resolve-hash"]["info"]["hash"]
            except (json.JSONDecodeError, KeyError):
                ok_hash = None
            cases.append(("resolve-hash", "kanban-report 해시 16자", ["--resolve-hash", "kanban-report"], 0,
                          lambda d, o: (bool(d) and len(d["modes"]["resolve-hash"]["info"].get("hash", "")) == 16,
                                        "16자 해시 없음")))
        if ok_hash:
            def rec(file, **kw):
                base = {"file": file, "spec": "kanban-report", "version": "1.0.0", "work": "w", "resolve_hash": ok_hash,
                        "rounds": 1, "external": "ok", "verdict": "PASS", "date": "2026-09-17"}
                base.update(kw)
                return json.dumps(base, ensure_ascii=False)
            good = tmp_root / "gates-good.jsonl"
            good.write_text("\n".join([rec("a.md", verdict="FAIL"), rec("a.md"), rec("b.md")]) + "\n",
                            encoding="utf-8")
            bad = tmp_root / "gates-bad.jsonl"
            bad.write_text("\n".join([rec("a.md"), rec("b.md", resolve_hash="0" * 16),
                                      rec("d.md", verdict="FAIL")]) + "\n", encoding="utf-8")
            cases += [
                ("gates", "마지막 기록 기준 통과 + expect 2", ["--gates", "--gate-file", str(good), "--expect", "2"], 0, None),
                ("gates", "expect 불일치", ["--gates", "--gate-file", str(good), "--expect", "3"], 1,
                 need({"expect"}, "gates")),
                ("gates", "낡은 PASS · verdict 실패", ["--gates", "--gate-file", str(bad)], 1,
                 contains("gates", "낡은 PASS", "verdict='FAIL'")),
                ("gates", "기록 파일 없음", ["--gates", "--gate-file", str(tmp_root / "none.jsonl")], 1,
                 need({"gate-file"}, "gates")),
            ]

        # derived: 가짜 렌더러를 둔 임시 프로젝트(새 배치 — 가이드 한 편이 폴더 하나, HTML 은 같은 폴더)
        dp = tmp_root / "derived"
        gdir = dp / "pattern-guide/design-pattern-guide"
        gdir.mkdir(parents=True)
        (dp / "scripts").mkdir()
        (dp / "scripts/render-guides.py").write_text(
            "import hashlib\nfrom pathlib import Path\n"
            "def fingerprint(md_path):\n    return hashlib.sha256(Path(md_path).read_bytes()).hexdigest()[:16]\n",
            encoding="utf-8")
        mds = {}
        for name in ("fresh", "stale", "nohtml"):
            d = gdir / name
            d.mkdir()
            md = d / f"{name}-guide_v1.0.0.md"
            md.write_text(f"# {name}\n", encoding="utf-8")
            mds[name] = md
        fp = hashlib.sha256(b"# fresh\n").hexdigest()[:16]
        mds["fresh"].with_suffix(".html").write_text(f"<!doctype html><!-- guide-fp:{fp} -->\n", encoding="utf-8")
        mds["stale"].with_suffix(".html").write_text("<!doctype html><!-- guide-fp:0000000000000000 -->\n", encoding="utf-8")
        fresh_md = str(mds["fresh"])
        nohtml_md = str(mds["nohtml"])
        cases += [
            ("derived", "stale 은 실패", ["--derived", "--project", str(dp)], 1, need({"stale"}, "derived")),
            ("derived", "fresh + missing 은 통과", ["--derived", "--project", str(dp), fresh_md, nohtml_md], 0, None),
            ("derived", "--require-html 이면 missing 실패",
             ["--derived", "--require-html", "--project", str(dp), fresh_md, nohtml_md], 1, need({"missing"}, "derived")),
            ("derived", "렌더러 없음은 오류", ["--derived", "--project", str(tmp_root / "shared-ok")], 1,
             need({"renderer"}, "derived")),
        ]

        results = []
        selected = [c for c in cases if not want_modes or c[0] in want_modes]
        for mode, name, args, expect_rc, pred in selected:
            rc, data, out = _call(args)
            ok = rc == expect_rc
            why = f"exit {rc} (기대 {expect_rc})"
            if ok and pred is not None:
                pok, pwhy = pred(data, out)
                ok = ok and pok
                if not pok:
                    why += f" · {pwhy}"
            extra = ""
            if mode == "compile" and data and "compile" in data["modes"]:
                extra = json.dumps(data["modes"]["compile"]["info"].get("tools", {}), ensure_ascii=False)
            results.append({"mode": mode, "case": name, "ok": ok, "detail": why, "tools": extra})
            if not ok and not as_json:
                tail = out.strip().splitlines()[-15:]
                results[-1]["output_tail"] = tail
        if as_json:
            print(json.dumps({"ok": all(r["ok"] for r in results), "self_test": results}, ensure_ascii=False, indent=1))
        else:
            print("== --self-test ==")
            shown_tools = False
            for r in results:
                print(f"{'PASS' if r['ok'] else 'FAIL'} [{r['mode']}] {r['case']} — {r['detail']}")
                if r["tools"] and not shown_tools:
                    print(f"  도구: {r['tools']}")
                    shown_tools = True
                for ln in r.get("output_tail", []):
                    print(f"    | {ln}")
            bad = sum(1 for r in results if not r["ok"])
            print(f"-- 결과: {len(results)}건 중 {'전부 기대대로' if not bad else f'{bad}건 기대와 다름'}")
        return 0 if all(r["ok"] for r in results) else 1
    finally:
        shutil.rmtree(tmp_root, ignore_errors=True)


# ─── 진입점 ───────────────────────────────────────────────────────────────────

def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="디자인 패턴 가이드 결정론 검사기",
                                 formatter_class=argparse.RawDescriptionHelpFormatter, epilog=__doc__)
    ap.add_argument("files", nargs="*", help="대상 가이드 md (없으면 가이드 디렉토리 전체)")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--compile", action="store_true")
    ap.add_argument("--links", action="store_true")
    ap.add_argument("--spec-shared", action="store_true")
    ap.add_argument("--resolve-hash", metavar="SPEC_ID")
    ap.add_argument("--run", action="store_true", help="예시 코드 실행·출력 대조")
    ap.add_argument("--gates", action="store_true")
    ap.add_argument("--pointers", action="store_true", help="인덱스·기준 예시가 최신본을 가리키는지")
    ap.add_argument("--derived", action="store_true")
    ap.add_argument("--require-html", action="store_true")
    ap.add_argument("--self-test", action="store_true")
    ap.add_argument("--spec", metavar="SPEC_ID")
    ap.add_argument("--spec-file", action="append", metavar="PATH")
    ap.add_argument("--expect", type=int)
    ap.add_argument("--gate-file")
    ap.add_argument("--project")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args(argv)

    modes = {"all": args.all, "compile": args.compile, "run": args.run, "links": args.links, "spec-shared": args.spec_shared,
             "resolve-hash": bool(args.resolve_hash), "gates": args.gates, "derived": args.derived,
             "pointers": args.pointers}
    if args.self_test:
        return self_test({m for m, on in modes.items() if on}, args.json)
    if not any(modes.values()):
        ap.print_help()
        return 2

    rep = Report()
    try:
        ctx = Ctx(args)
        files = ctx.targets(args.files)
        if args.all:
            mode_all(ctx, rep, files)
        if args.compile:
            mode_compile(ctx, rep, files)
        if args.run:
            mode_run(ctx, rep, files)
        if args.links:
            mode_links(ctx, rep, files)
        if args.spec_shared:
            mode_spec_shared(ctx, rep)
        if args.resolve_hash:
            mode_resolve_hash(ctx, rep, args.resolve_hash)
        if args.gates:
            mode_gates(ctx, rep)
        if args.pointers:
            mode_pointers(ctx, rep)
        if args.derived:
            mode_derived(ctx, rep, files)
    except Fatal as e:
        if args.json:
            print(json.dumps({"ok": False, "fatal": str(e), **rep.as_json()}, ensure_ascii=False, indent=1))
        else:
            if rep.modes:
                rep.print_human()
            print(f"오류: {e}", file=sys.stderr)
        return 1

    if args.json:
        print(json.dumps(rep.as_json(), ensure_ascii=False, indent=1))
    else:
        if args.resolve_hash and len(rep.modes) == 1 and rep.ok():
            print(rep.modes["resolve-hash"]["info"]["hash"])
        else:
            rep.print_human()
    return 0 if rep.ok() else 1


if __name__ == "__main__":
    sys.exit(main())
