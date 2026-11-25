# 인수인계 — KAN-002.3 1차 12편 집필 (브랜치 `KAN-002-4FZX1V`)

- 기준 시각: 2026-11-25 23:55 KST
- 브랜치: `KAN-002-4FZX1V` (기본 브랜치 `main`에 아직 병합하지 않았습니다)
- 이 머신의 작업 트리: `/Users/centurio/grow-up-architecture/.work/KAN-002-4FZX1V`
  - 이 트리는 `main` 쪽 작업 트리(`/Users/centurio/grow-up-architecture`) 안의 `.work/`에 있습니다. `.work/`는 `.gitignore`에 들어 있습니다.

이 파일 하나만 읽고 이어 갈 수 있게 썼습니다. 더 자세한 근거는 카드 실행 문서 `KANBAN/cards/KAN-002.3-8DTJ6W.md`의 「수행 내역」에 있습니다.

## 1. 목표

카드 두 장이 위아래로 걸려 있습니다.

- 루트 카드 `KAN-002-4FZX1V` 「시스템 설계 사례 가이드」: system-design-guide 명세가 서고, 파일럿 두 편과 1차 12편이 게이트(품질 채점)를 통과해 발행되면 끝납니다. 요청 원문은 `KANBAN.md`의 이 카드 「원문」 칸에 있습니다. 첫 줄은 다음과 같습니다.
  > 문제가 주어졌을 때, 그 문제를 최적으로 해결할 수 있는 시스템 아키텍처를 설계하는 가이드를 작성하려고 한다.
- 하위 카드 `KAN-002.3-8DTJ6W` 「1차 12편 집필」: 12편이 게이트 PASS로 발행되고 인덱스(`pattern-guide/system-design-guide/README.md`)에 이 계열이 서면 끝납니다. 단계는 S1~S28이고, 지금 S21을 하는 중입니다.

## 2. 지금 상태

### 끝난 것

- S1~S20을 마쳤습니다. 발행한 편은 IN-01, CT-05, CT-03, RT-03, AG-03, RD-01, RT-08, AI-01입니다. 마지막 발행은 `33cf135`(AI-01 v1.0.0, S19)이고, 마지막으로 끝낸 단계는 `0c93b27`(GE-02 리서치 노트, S20)입니다.
- 단계마다 로컬 태그 `kan/KAN-002.3-8DTJ6W/S<번호>`와 `.../batch<번호>`를 달았습니다(S20·batch10까지). **이 태그는 원격에 올리지 않았습니다.** 2절 「이 머신에만 있는 것」을 봅니다.

### 하다 만 것: S21 GE-02 「승차 공유 배차 매칭」 집필·발행

- 초안: `pattern-guide/system-design-guide/ride-hailing-dispatch/ride-hailing-dispatch-guide_v1.0.0.md`. 머리말은 `status: draft`이고 아직 발행하지 않았습니다. 세 언어 코드(`code/`)와 도식(`diagrams/`)이 함께 있습니다.
- 커밋: `cb6c5f0`(초안과 게이트 FAIL 줄), `d514a69`(카드 진행 표시와 멈춤 기록, 보드 HTML).
- 게이트는 1~3라운드 모두 FAIL이었습니다. MUST(꼭 지켜야 하는 채점 항목)는 41 → 41 → 45/48개를 통과했습니다. 3라운드 FAIL 줄은 `pattern-guide/gate-results.jsonl` 끝에 있습니다.
- 3라운드에서 남은 미흡 셋은 이미 고쳤습니다. 고친 뒤 검사기, 세 언어 컴파일·실행, 도식 검사가 통과했고, 문체는 A, 누적 수정률은 12%입니다.
  - V2(voice 금지 어휘): 스스로 점검하기 2번 풀이의 「그 가정이 깨질 때」를 「맞지 않을 때」로 바꿨습니다.
  - SD43(변형 실행 표시): 「시나리오 2 에서 읽기가 2.8배」에 변형 실행 V3 표시와 계산식(2300 ÷ 828)을 붙였습니다.
  - SD40(계산 표시): 출력에 없는 계산값 열 곳 남짓에 「계산」 표시를 붙였습니다.
- **4라운드는 유저 승인이 있어야 엽니다.** 카드 규칙상 3라운드까지만 묻지 않고 돌리고, 그 뒤로는 멈추고 묻습니다. 그래서 여기서 멈춰 있습니다. 앞 편들(IN-01, CT-05, RT-03, AG-03, RD-01, RT-08, AI-01)도 같은 자리에서 유저가 「N라운드 열어 발행」이라고 답한 뒤 이어 갔습니다.

## 3. 다음 할 일

1. 유저에게 S21 4라운드를 열지 묻습니다. 근거는 2절의 「하다 만 것」을 그대로 보여 주면 됩니다. 답이 「4라운드 열어 발행」이면 2번으로 갑니다.
2. 다른 머신이라면 먼저 4절의 준비를 합니다. 그다음 검사가 지금도 통과하는지 확인합니다.

   ```sh
   cd <작업 트리>
   python3 scripts/check-guides.py --all --compile --run
   ```

3. `design-pattern-guide` 스킬 절차로 4라운드 채점을 맡깁니다. 채점자에게 줄 「앞 라운드 뒤 고친 내용」 메모는 6절에 옮겨 두었습니다.
4. PASS면 머리말 `status`를 `published`로 바꾸고(앞 편 `llm-chat-streaming`과 같은 값), 인덱스 `pattern-guide/system-design-guide/README.md`에 GE-02 줄을 넣고, `gate-results.jsonl`에 PASS 줄을 남깁니다. 그 뒤 `python3 scripts/check-guides.py --gates --pointers --derived`를 통과시키고 커밋한 다음 태그 `S21`·`batch11`을 답니다.
   - FAIL이면 FAIL 줄을 남기고 다시 멈춘 뒤 묻습니다.
5. 남은 단계는 S22~S28입니다. SY-01 실시간 공동 편집(S22·S23), MD-01 동영상 업로드와 인코딩(S24·S25), AI-02 RAG(S26·S27) 순서로 리서치 노트와 집필·발행을 하고, S28에서 1차 묶음을 정리합니다. 묶음별 계획은 `KANBAN/batches/KAN-002.3-8DTJ6W.batch12.md`부터 봅니다.

## 4. 이미 정한 것과 물어야 할 것

이미 정한 것(카드 실행 문서 「정할 것」, 2026-11-16 승인):

- 명세 `system-design-guide`는 1.1.2로 고정합니다. 쓰다가 나온 명세 문제는 고치지 않고 S28 노트에 근거와 함께 쌓습니다.
- 한 세션(단일 에이전트)으로 묶음을 차례로 합니다.
- 게이트 3라운드에도 MUST가 남으면 멈추고 사람에게 넘깁니다. 자동 통과는 없습니다.

물어야 할 것:

- S21 4라운드를 열지(3절 1번).
- 지난 세션이 따로 알린 것: voice 설정 파일 `~/.claude/authoring/voices/ppangtolab-teacher/style.json`의 금지 패턴이 「깨질」 꼴을 잡지 못합니다. `~/.claude` 아래 공용 설정이라 요청 전에는 고치지 않았습니다. 고칠지 물어야 합니다.
- 로컬 태그 105개(`kan/...`)를 원격에 올릴지. 이번 인수인계에서는 브랜치만 올렸습니다.

## 5. 다른 머신에서 이어 가는 법

```sh
git clone https://github.com/centurio1987/grow-up-architecture.git   # 처음이면
cd grow-up-architecture
git fetch && git switch KAN-002-4FZX1V
```

이 머신처럼 `main` 트리 안의 `.work/`에 따로 작업 트리를 두려면 `git worktree add .work/KAN-002-4FZX1V KAN-002-4FZX1V`를 씁니다. 그렇게 하지 않고 위처럼 바로 `switch`해도 됩니다.

필요한 설치:

- Python 3, Node.js(TypeScript 컴파일과 도식 렌더), JDK 21(`javac`), Rust(`rustc`). `check-guides.py --compile --run`이 세 언어를 모두 돌리고, 셋 가운데 하나라도 없으면 오류를 냅니다.
- authoring-kit 플러그인 0.3.0(`.claude/authoring.lock.json`에 고정한 판). 이 머신의 경로는 `~/.claude/plugins/cache/centurio87-plugins/authoring-kit/0.3.0`입니다. 진입 스킬은 lock에 적힌 판만 씁니다.
- `~/.claude/authoring/principles`(공통 원칙, lock에 원격 `my-claude-env` 저장소의 리비전이 적혀 있음)와 voice `ppangtolab-teacher`.
- manage-kanban 스킬(`~/.claude/skills/manage-kanban`). 보드 다시 굽기와 묶음 상태 확인에 씁니다.
- `node_modules` 두 개: 이 머신에서는 작업 트리 루트의 `node_modules`와 `typescript/node_modules`가 `main` 트리의 같은 폴더를 가리키는 심볼릭 링크입니다. 링크라서 `.gitignore`의 `node_modules/`에 걸리지 않아 커밋하지 않았습니다. 다른 머신에서는 그 자리에 설치하거나 링크를 다시 겁니다. 들어 있는 것은 `typescript`·`tsx`·`esbuild`(typescript/), `react`·`react-dom`·`playwright`(루트)입니다.

환경 변수: 따로 필요한 것은 없습니다. `CLAUDE_PLUGIN_ROOT`가 다른 판(0.4.x)을 가리키면 검사기(`scripts/check-guides.py:274`)가 그 판을 먼저 쓰므로, 비워 두거나 0.3.0을 가리키게 합니다.

이 머신에만 있고 원격에 없는 것:

- 로컬 태그 105개(`kan/KAN-001*`, `kan/KAN-002*`). 되돌리기(롤백) 지점이라 이어 가는 데는 없어도 되지만, 되돌릴 일이 생기면 필요합니다.
- 지난 세션의 임시 폴더 `/private/tmp/claude-501/-Users-centurio-grow-up-architecture/298c14ef-8601-4e90-a821-3141c4a78539/scratchpad/kan3/`. 여기에는 다음이 있습니다.
  - `s21/` 아래 본문 조각(`part1.md`~`part4.md`)과 조립 스크립트(`assemble.py`, `build.sh`), 라운드별 수정 스크립트(`fix1.py`~`fix9.py`), 변형 실행 폴더 `variants/`. 커밋한 초안은 이 조각을 조립한 결과입니다. 다른 머신에서는 초안 파일을 바로 고쳐도 됩니다.
  - `resolve-sdg-worker-112.md`: 명세 1.1.2·voice·공통 원칙을 한 벌로 풀어 둔 파일입니다. `authoring.py resolve --voice ppangtolab-teacher --spec system-design-guide --profile main --frozen`으로 다시 만들 수 있습니다.
  - `s21_r3_fixed.md`: 4라운드 채점자에게 줄 메모입니다. 내용은 6절에 그대로 옮겼습니다.
  - 보조 검사 `forbid_scan.py` 등. 「깨질」 꼴을 잡도록 고친 판은 이 폴더에만 있습니다.
- 세션 기록 `~/.claude/projects/-Users-centurio-grow-up-architecture--work-KAN-002-4FZX1V/`와 `~/.claude/projects/-Users-centurio-grow-up-architecture/298c14ef-8601-4e90-a821-3141c4a78539.jsonl`.

## 6. 4라운드 채점 메모(이 머신의 `s21_r3_fixed.md`를 그대로 옮김)

> 3라운드는 FAIL(MUST 45/48 — V2 · SD40 · SD43 미흡)이었고, 아래를 고쳤습니다. 이번이 4라운드입니다(유저 승인으로 연 라운드).
> - V2: 스스로 점검하기 2번 풀이의 「그 가정이 깨질 때」 → 「그 가정이 맞지 않을 때」. 보조 스캐너(forbid_scan.py)에 「깨질 · 깨졌 · 깨져」 꼴을 더해 옛 판에서 잡히는 것을 확인했습니다.
> - SD43: 「시나리오 2 에서 읽기가 2.8배가 됐습니다」 → 「변형 실행 V3(바꾼 것: …)에서 시나리오 2 의 읽기가 2.8배(계산 — 2300 ÷ 828)가 됐습니다」.
> - SD40: 출력에 없는 계산값에 계산 표시를 붙였습니다 — r3 ~ r12 의 도착 100100 ~ 101000ms, 다음 찾기 받은 뒤 50000ms, 229500 · 229750ms(시나리오 3 의 6단계 · 요구 충족 표 2행), 234500 · 234750ms(8단계), 8배, 기술 상세 그림의 55250 · 50250 · 30000(= 60000 − 30000). 시나리오 2 · 3 그림의 아래 칸 이름을 「실행 출력과 계산」으로 바꾸고 계산 줄(시나리오 2: 요청 도착 시각 · 120건 / 시나리오 3: 169250 · 234500 · 234750 의 식)을 더했습니다.
> - 권고 반영: 시나리오 2 · 3 그림의 기사 기록 화살표에 읽기를 넣고 시나리오 3 은 223000 · 236000 · 238000ms 사건과 위치 인덱스 220000ms 다시 읽기를 더함, 남는 한계 ④ 의 목록 자리를 「시나리오 3 끝에 모은 목록」으로, C4 모델 · CONTAINERS · C4 DYNAMIC 풀이(개념도 아래 문단), GEOADD · High Scalability 를 링크 이름보다 앞에서 풂, Lyft 50 클러스터는 「그 장이 속한 절의 제목」으로, 「기사 약 1천만 명」, 「동시에 진행되는 처리」, 「제안한 뒤」의 정의를 서버가 제안한 시각부터로 맞춤, 2 · 7행과 결정의 7행 괄호를 「기사 앱이 위치 갱신을 보내지 않아 앱이 꺼졌다고 보는 기사는 뺌」으로, 스스로 점검하기의 「같은 변형 실행 V7」 · 「그 변형 실행 V4」.
> - 고치지 않은 권고: 대역 표에 실제 규모 값(상황 설정 절이 축소와 그 이유를 다룸), 내부 화살표 이름을 Redis 명령 · SQL 로 바꾸는 것(개념도 아래에서 그 명령을 풀 자리가 없어 첫 등장 규칙과 부딪힘).
> - 검사: check-guides(--all --compile --run) 통과, 도식 lint 통과, 문체 A, 인용 75개 중 74개 글자 그대로 · 1개 공백 차, 금지 활용형 0, 누적 수정률 12%.

## 7. 마지막 세션 요약

- 세션 `298c14ef`(이 카드를 2026-11-16부터 이어 온 세션). 카드 실행 표시가 켜져 있어 단계마다 멈추지 않고 이어 가다가, 게이트에서만 멈췄습니다.
- 마지막 요청: 사람이 직접 보낸 마지막 말은 2026-11-25 11:44 KST의 「5라운드 열어 발행」(AI-01)입니다. 그 뒤 S20·S21은 실행 표시에 따라 이어 갔습니다.
- 마지막 답(2026-11-25 21:26 KST, 줄임): 「GE-02 3라운드 채점은 FAIL(MUST 48개 중 45개 통과)이었습니다. 규칙대로 FAIL 행을 남기고 카드 실행을 멈춘 뒤, 남은 미흡 셋을 모두 고치고 다시 확인했습니다. 4라운드는 승인을 받아야 열 수 있어서 지금 멈춰 있습니다.」 이어서 4라운드를 열면 메모로 채점을 바로 시작하고, PASS면 발행·README 줄·PASS 기록·커밋·태그(S21·batch11)까지 간다고 적었습니다.

## 8. 같은 저장소의 다른 진행 중 브랜치

- `docs/schema-contract-visual`: 세 층 스키마와 계약 도해판(`docs/schema-contract-guide/visual.html`) 정리. 작업은 끝났고 `main`에 합칠지만 남았습니다. 그 브랜치의 `HANDOFF.md`를 봅니다.
