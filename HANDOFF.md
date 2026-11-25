# 인수인계 — 세 층 스키마와 계약 도해판 (브랜치 `docs/schema-contract-visual`)

- 기준 시각: 2026-11-25 23:55 KST
- 브랜치: `docs/schema-contract-visual` (기본 브랜치 `main`에 아직 병합하지 않았습니다)
- 이 머신의 작업 트리: `/Users/centurio/grow-up-architecture`
  - 같은 저장소의 다른 작업 트리 `.work/KAN-002-4FZX1V`가 이 폴더 안에 있습니다. `.work/`는 `.gitignore`에 들어 있어 이 브랜치에는 담기지 않습니다.

이 파일 하나만 읽고 이어 갈 수 있게 썼습니다.

## 1. 목표

이 브랜치에서 한 일은 세 가지이고, 셋 다 작업 자체는 끝났습니다. 남은 것은 `main`에 합칠지 정하는 일입니다.

- 장편 가이드 「세 층 스키마와 계약」(`docs/schema-contract-guide/`)과 그 도해판(`visual.html`). 도해판은 장마다 정의·표·예를 그림과 손으로 만지는 장치로 옮긴 동반 판입니다.
- 도해판 정리. 마지막 요청 원문은 다음과 같습니다.
  > 인지부하를 개선하고 레이아웃 어긋난 부분들 전부 잡아 줘
- 단독 HTML 문서 「헥사고날 포트와 어댑터 구분」(`docs/hexagonal-ports-adapters-guide/index.html`). claude.ai 아티팩트를 받아 적절한 곳에 저장하라는 요청으로 넣었습니다.

## 2. 지금 상태

`origin/main` 위에 이 브랜치가 더한 커밋은 여섯 개입니다.

| 커밋 | 날짜 | 내용 |
| --- | --- | --- |
| `d945095` | 2026-11-17 | guide: Knowledge Level · Null Object v1.1.1 발행 |
| `0182371` | 2026-11-18 | docs: 세 층 스키마와 계약 장편 가이드 |
| `e1cc408` | 2026-11-18 | fix: 1장·12장 계산 오기 정정, 본문 계산 예 검사를 굽기에 넣음 |
| `01bf6d0` | 2026-11-18 | docs: 도해판 `visual.html` |
| `6240ac9` | 2026-11-25 커밋 | docs: 도해판 인지 부하 개선과 배치 정리(작업은 2026-11-18) |
| `a18f5e1` | 2026-11-25 | docs: 헥사고날 포트와 어댑터 구분 단독 HTML |

- 처음 두 커밋(`d945095`, `0182371`)은 이 머신의 로컬 `main`에도 있지만 `origin/main`에는 아직 없습니다. 로컬 `main`이 `origin/main`보다 두 커밋 앞서 있고, 이번 인수인계에서는 `main`을 올리지 않았습니다.
- 도해판 정리(`6240ac9`)의 확인 결과(2026-11-18 세션 보고): 자동 배치 검사가 데스크톱 밝은·어두운 주제와 휴대폰에서 모두 0건입니다. 버튼과 그림 요소 782개를 눌러 실행 오류가 없었고, 계산값(반례 시험 10/10, 김하나 월말 0원·월초 21,000원, 오차 0.1667, M44)은 바뀌지 않았습니다. 결과 파일은 `docs/schema-contract-guide/verification/visual/report.json`과 확인 화면 12장입니다.
- 남겨 둔 것 하나: 「견주다」를 쓴 곳 가운데 부록 A 용어집을 원문 그대로 옮긴 칸 하나는 원고와 맞추려고 그대로 두었습니다.
- 헥사고날 문서는 받은 파일을 고치지 않았습니다(26,596바이트). 글꼴을 Google Fonts에서 불러오므로 오프라인에서는 다른 글꼴로 보입니다.

## 3. 다음 할 일

1. 주인에게 이 브랜치를 `main`에 합칠지 묻습니다. 2026-11-18 세션이 같은 질문을 했지만 답을 받지 못해 합치지 않았습니다.
2. 합치기로 하면 이 브랜치를 `main`에 병합하고 올립니다. 로컬 `main`의 두 커밋은 이 브랜치에도 들어 있으므로, 병합하면 함께 올라갑니다.

   ```sh
   git fetch
   git switch main && git merge --ff-only origin/main   # 다른 머신이면 origin/main 에서 시작
   git merge docs/schema-contract-visual
   git push
   ```

3. 도해판을 더 고칠 일이 생기면 `visual/`의 원본을 고친 뒤 다시 굽고 검사합니다. `visual.html`은 파생물이라 손으로 고치지 않습니다.

   ```sh
   cd docs/schema-contract-guide
   python3 tools/build_visual.py
   node tools/check_visual.mjs map c13 c24
   ```

## 4. 이미 정한 것과 물어야 할 것

이미 정한 것:

- 도해판의 색 규칙: 청·적·녹·황은 네 산출물을 가리킬 때만 씁니다. 장의 순서는 「할 수 있게 되는 것 → 핵심 한 줄 → 그림 → 「자세히」 접기」입니다. 이 규칙은 `docs/schema-contract-guide/visual/style.css` 머리 주석과 README에 적혀 있습니다.
- 헥사고날 문서는 패턴 가이드 연재에 들지 않는 단독 HTML이라, 이 저장소의 관례대로 `docs/<주제>-guide/index.html`에 두었습니다.

물어야 할 것:

- 이 브랜치를 `main`에 합칠지(3절 1번).
- 헥사고날 문서를 이 브랜치에 둔 채 함께 합칠지, 따로 다룰지. 지금은 같은 브랜치의 별도 커밋(`a18f5e1`)입니다.

## 5. 다른 머신에서 이어 가는 법

```sh
git clone https://github.com/centurio1987/grow-up-architecture.git   # 처음이면
cd grow-up-architecture
git fetch && git switch docs/schema-contract-visual
```

필요한 설치:

- Python 3, Node.js.
- 굽기와 화면 확인은 `~/.claude/skills/publish-report` 스킬(bun, Playwright)을 씁니다. 다른 컴퓨터에서는 `docs/schema-contract-guide/tools/screenshot.mjs`의 경로를 바꿉니다(README 「다시 만들기」 절).
- PostgreSQL은 없어도 됩니다. 4·12장 DDL은 이 머신에서도 실행하지 않았습니다.

환경 변수: 따로 필요한 것은 없습니다.

이 머신에만 있고 원격에 없는 것:

- 커밋하지 않은 파일은 없습니다(이 HANDOFF.md 를 올린 뒤 기준).
- 로컬 `main`의 두 커밋(`d945095`, `0182371`)은 원격 `main`에는 없고, 이 브랜치를 통해서만 원격에 있습니다.
- 세션 기록 `~/.claude/projects/-Users-centurio-grow-up-architecture/`의 `3b5b1cda-64c1-4162-ac02-76c91646e84d.jsonl`(도해판 작업, 2026-11-18)과 `ebe706c8-c35e-43db-a78e-21e57d43282c.jsonl`(헥사고날 문서 저장, 2026-11-25).

## 6. 마지막 세션 요약

- 도해판 세션(2026-11-18): 마지막 요청은 「인지부하를 개선하고 레이아웃 어긋난 부분들 전부 잡아 줘」였습니다. 마지막 답은 다음과 같이 끝났습니다(줄임).
  > 도해판의 인지 부하를 줄이고 어긋난 배치를 모두 고쳤습니다. 자동 배치 검사는 데스크톱(밝은·어두운 주제)과 휴대폰에서 모두 0건입니다. … 작업은 `docs/schema-contract-visual` 브랜치에 있고 아직 커밋하지 않았습니다. 이전 질문(main에 합칠지)은 답을 받지 않아 합치지 않았습니다.
- 헥사고날 문서 세션(2026-11-25 15:21 KST): 아티팩트를 받아 저장하라는 요청에 `docs/hexagonal-ports-adapters-guide/index.html`로 저장하고 원본과 같은지 확인했다고 답했습니다. 커밋은 하지 않았고, 2026-11-25 인수인계 때 `a18f5e1`로 커밋했습니다.

## 7. 같은 저장소의 다른 진행 중 브랜치

- `KAN-002-4FZX1V`: 칸반 카드 KAN-002.3 「시스템 설계 사례 가이드 1차 12편 집필」. S21(GE-02 승차 공유 배차 매칭)이 게이트 3라운드 FAIL 뒤 4라운드 승인을 기다리며 멈춰 있습니다. 그 브랜치의 `HANDOFF.md`를 봅니다.
