#!/usr/bin/env python3
"""publish-report 동봉 서체에 없어 굽기 가드(서체 오염)에 걸리는 글자를 찾습니다.

2026-11-17 에 글자마다 한 번씩 구워 확인한 결과로 목록을 만들었습니다.
걸리는 것: 상자 선 문자(U+2500~U+257F), ⊆ ∪ ⊂ ⋈ ∧ ∨ ∈ ∉, 한자(CJK 통합 한자)
통과한 것: → ← ↔ ▼ ▶ ▲ ◀ ≤ ≥ ≠ ∅ π σ ¬ ⇒ · … — – ★ ● ○ ✓ × ± °

    python3 tools/check_glyphs.py chapters/*.md problems/*.md appendix/*.md
"""
import sys
from pathlib import Path

BAD = (set("⊆∪⊂⋈∧∨∈∉") | {chr(c) for c in range(0x2500, 0x2580)}
       | {chr(c) for c in range(0x3400, 0x4DC0)} | {chr(c) for c in range(0x4E00, 0xA000)}
       | {chr(c) for c in range(0xF900, 0xFB00)})   # 한자: 동봉 서체에 없음 (2026-11-17 굽기에서 확인)
bad_total = 0
for f in sys.argv[1:]:
    for n, line in enumerate(Path(f).read_text(encoding="utf-8").splitlines(), 1):
        hits = sorted({ch for ch in line if ch in BAD})
        if hits:
            bad_total += 1
            print(f"{f}:{n}: {' '.join(hits)}  {line.strip()[:60]}")
print(f"걸린 줄 {bad_total}개")
sys.exit(1 if bad_total else 0)
