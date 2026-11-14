---
card: KAN-002-4FZX1V
title: 시스템 설계 사례 가이드 — 문제 하나마다 그 문제를 가장 잘 푸는 아키텍처 가이드 한 편
created: 2026-11-13
scope: pattern-guide/system-design-guide/**, pattern-guide/research/system-design-*, pattern-guide/research/live-viewer-count-*, pattern-guide/research/coupon-*, .claude/authoring/specs/system-design-guide/**, .claude/authoring/paths.json, .claude/authoring.lock.json, .claude/skills/design-pattern-guide/system-design-guide-canvas.md, .claude/skills/design-pattern-guide/SKILL.md, pattern-guide/gate-results.jsonl
---

# KAN-002-4FZX1V — 시스템 설계 사례 가이드 — 문제 하나마다 그 문제를 가장 잘 푸는 아키텍처 가이드 한 편

## 전략
**출처**: 카드 `원문` 블록(2026-11-13 유저 지시)과 그 뒤에 정한 네 가지. 질문과 답변 원문은 준비안 `pattern-guide/research/system-design-guide-plan-2026-11-13.md` 5절에 있다. 후보 목록은 `system-design-cases-2026-11-13.md`, 파일럿 1 근거는 `live-viewer-count-2026-11-13.md` 다.

**한 편의 단위는 문제 하나다.** 지금 저장소의 37편은 해법(패턴) 하나가 한 편이다. 이 계열은 반대로 요구 하나를 두고 어떤 구조를 왜 고르는지 쓴다. 그래서 기존 명세를 고쳐 쓰지 않고 새 명세 `system-design-guide` 를 세운다. 기존 명세의 몸통인 최소 조건 절과 analyzer 계약은 이 계열에서 판정할 대상이 없다.

**정해진 것 넷**(2026-11-13):

- 구현 코드는 Java · TypeScript · Rust 세 언어가 같은 출력을 내는 기존 규약을 유지한다.
- 위치는 `pattern-guide/system-design-guide/<슬러그>/`, 명세 id 는 `system-design-guide` 다.
- 파일럿은 RT-01 라이브 동시 시청자 수와 CT-01 선착순 쿠폰 발급이다.
- 진행은 이 루트 카드와 하위 카드 셋으로 관리한다.

**순서는 명세 → 파일럿 → 1차 묶음이다.** 파일럿은 명세가 있어야 쓰고, 1차 12편은 파일럿 회고로 고친 명세로 쓴다. `KAN-001` 이 같은 순서(정착 → 파일럿 → 본 집필)로 33편을 썼다.

### 버린 대안

| 대안 | 버린 이유 |
| --- | --- |
| `gof-guide` 명세에 셋째 트랙으로 얹기 | 최소 조건 절과 analyzer 계약이 필수라, 문제 단위 글에서는 판정할 대상이 없다 |
| 11-06 확장 조사의 패턴 단위 트랙(Retry · Circuit Breaker 등)을 먼저 쓰기 | 단위가 다르고 서로 선행 조건이 아니다. 사례 가이드는 패턴 편이 있으면 링크하고 없으면 본문에서 푼다(사례 목록 4절) |
| 1차 묶음까지 파일럿 없이 바로 쓰기 | 명세는 산출물로 검증되기 전에는 추정이다. `KAN-001.3` 파일럿이 명세를 1.1 로 고친 선례가 있다 |

### 만약

| 만약 | 그러면 | 대응 |
| --- | --- | --- |
| 언어당 250줄 상한 안에 시뮬레이션이 안 들어간다 | 파일럿 코드가 검사에서 막힌다 | `KAN-002.2` 에서 재 보고, 시나리오를 줄일지 상한을 바꿀지 유저에게 묻는다 |
| 세 언어 출력이 맵 순서나 실수 형식 때문에 갈린다 | `--run` 이 실패한다 | 준비안 3절의 네 제약을 `KAN-002.1` 에서 명세 규칙으로 넣는다 |
| 리서치 노트의 수치가 원문과 다르다 | 본문 수치가 틀린다 | 집필 전에 원문과 대조하고, 어긋나면 노트의 미해결 질문에 되먹인다 |

## 실행 계획
work 하나가 하위 카드 하나다. 각 하위 카드가 자기 실행 문서와 배치를 갖는다.

- [x] `S1` 명세 등록 — `KAN-002.1-7YT11M`. 완료 기준: 그 카드가 완료되고 `check-guides` 가 새 트랙을 명세대로 검사한다
- [ ] `S2` 파일럿 두 편과 회고 — `KAN-002.2-4E05GD`. 완료 기준: 그 카드가 완료되고 회고를 반영한 명세 개정판이 나온다
- [ ] `S3` 1차 12편 집필 — `KAN-002.3-8DTJ6W`. 완료 기준: 그 카드가 완료되고 인덱스에 이 계열이 선다

## 검증
```
python3 ~/.claude/skills/manage-kanban/scripts/kanban.py tree . --card KAN-002-4FZX1V   # 하위 셋 모두 [완료]
python3 scripts/check-guides.py --all --compile --run                                   # 새 트랙 포함 최신본 전부 0 오류
python3 scripts/check-guides.py --gates --pointers --derived                            # 게이트 PASS · 포인터 최신 · HTML fresh
```
**사람 판정**: 파일럿 회고에서 명세를 고칠 범위와 1차 12편 목록의 확정. 둘 다 `KAN-002.2` 검토에서 정한다.

## 수행 내역
<!-- KANBAN:LOG append-only — 아래로만 덧붙인다. 위를 고치지 않는다. -->
- 2026-11-13T20:35 · s:298c14ef — `전략` 섹션 교체
- 2026-11-13T20:35 · s:298c14ef — `실행 계획` 섹션 교체
- 2026-11-13T20:35 · s:298c14ef — `검증` 섹션 교체
- 2026-11-14T20:30 · s:298c14ef · S1 done — KAN-002.1 완료 — 명세 system-design-guide 1.0.0 등록, 시험 초안이 check-guides --all·--compile·--run 통과, 문서 전체 승인(2026-11-14)
