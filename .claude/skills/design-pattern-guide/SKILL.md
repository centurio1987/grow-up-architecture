---
name: design-pattern-guide
description: 디자인 패턴 가이드 1편(gof-guide · analysis-guide)과 시스템 설계 사례 가이드 1편(system-design-guide)을 authoring-kit 명세로 집필·재집필하는 진입 스킬. 사전 확인 → 리서치 노트·사전 지식 점검(참고 문서 reference-note) → authoring-write 위임 → 기계 검사·품질 게이트 → 발행·게이트 기록까지 끌고 간다. 트리거 — "디자인 패턴 가이드", "Singleton/Strategy/Observer/... 패턴 가이드 작성/재집필", "분석 패턴 가이드", "Account/Quantity/Transaction 패턴 가이드", "design pattern guide", "패턴 가이드 문서", "시스템 설계 가이드", "시스템 설계 사례 가이드", "system design guide". 여러 패턴을 요청하면 패턴마다 1편씩 따로 돈다. 이미 있는 코드가 패턴에 맞는지 판정하는 일은 design-pattern-analyzer 가 맡는다.
argument-hint: <pattern-kebab-name>
---

# design-pattern-guide 스킬 (패턴 가이드 집필 진입점)

`$ARGUMENTS` 패턴의 가이드 1편을 `<대상 트리>/$ARGUMENTS/$ARGUMENTS-guide_v<semver>.md` 에 쓴다(가이드 한 편 = 폴더 하나).
재집필이면 **새 버전 파일**을 같은 폴더에 만들고 이전 판본은 남긴다 — 인덱스·기준 예시·분석 스킬은 최신 파일명을 가리킨다.

> **집필 규칙은 이 파일에 없다.** 골격·작성법·최소 조건의 판정 원칙은 명세(spec)
> `gof-guide` · `analysis-guide` 에, 문체는 퍼소나(voice) `ppangtolab-teacher` 에 산다.
> 시스템 설계 사례 가이드는 명세 `system-design-guide` 가 정한다.
> 이 스킬은 **어느 명세로 쓸지 고르고, 넘기고, 게이트와 발행을 끌고 가는 일**만 한다.
> 플러그인이 없으면 명확히 실패한다.

## 어느 명세를 쓰는가

| 대상 (`paths.json` 키) | spec | 캔버스 (`paths.json` `templates` 키) |
| --- | --- | --- |
| `pattern-guide/design-pattern-guide/<패턴>/` (`dirs.content` · `dirs.tracks`) | `gof-guide` | `gof-guide-canvas` |
| `pattern-guide/ddd-analysis-pattern-guide/<패턴>/` (`dirs.content` · `dirs.tracks`) | `analysis-guide` | `analysis-guide-canvas` |
| `pattern-guide/reference/<슬러그>/` (`dirs.reference`) — 가이드가 기대는 주제 밖 사전 지식 | `reference-note` | `reference-note-canvas` |
| `pattern-guide/system-design-guide/<슬러그>/` (`dirs.content` · `dirs.tracks`) — 문제 하나 = 한 편 | `system-design-guide` | `system-design-guide-canvas` |

voice 는 넷 다 `ppangtolab-teacher` 다. 참고 문서는 패턴이 아니라 **개념군** 단위이고, 가이드 집필 도중 사전 지식 점검(1단계)이 없다고 판정할 때 먼저 쓴다.

대상 트리는 `$ARGUMENTS-pattern.md` 가 이미 있는 쪽이다. 두 트리 어디에도 없는 새 패턴이면
`dirs.research` 의 `candidates.md` 「결정」 절에 기록된 spec 을 따른다. 거기에도 없으면 멈추고
어느 트리에 둘지 묻는다 — 채택 결정 없이 새 패턴을 만들지 않는다.

### 시스템 설계 트랙에서 달라지는 점

골격과 작성법은 명세가 정하므로 여기에는 이 스킬의 진행에서 달라지는 것만 적는다.

- **무엇을 쓸지는 칸반 카드가 정한다.** 후보는 사례 목록 `pattern-guide/research/system-design-cases-2026-11-13.md` 의 ID(`RT-01` 등)이고,
  슬러그는 패턴 이름이 아니라 문제 이름이다(`live-viewer-count`). `candidates.md` 「결정」 절은 이 트랙을 다루지 않는다. 머리말 `case` 키에 후보 ID 를 적는다.
- **최소 조건 절이 없다.** 그 자리를 `## 요구 충족 확인` 이 맡는다. 아래 「주의」의 analyzer 계약 문구와 2단계의 패턴 골격 설명은 이 트랙에 걸리지 않는다.
- **인덱스 등록(4단계의 3)을 하지 않는다.** 이 계열의 인덱스는 카드 `KAN-002.3` 에서 세운다. 포인터 점검(4단계의 4)은 그대로 돈다 —
  인덱스에 없는 편은 오류가 아니고, 낡은 판을 가리키는 것만 오류다.
- **사전 지식 점검은 원서 대신 기술 개념으로 한다.** 본문이 기대는 바깥 기술(저장소 자료구조 · 메시지 브로커의 보장 · 프로토콜)을 뽑아
  본문에서 풀지, 참고 문서로 잇을지를 정한다.
- **출처 수치는 집필 전에 원문과 대조한다**(명세 SD40). 리서치 노트의 수치 가운데 본문에 실을 것을 골라 원문을 다시 열어 보고, 어긋나면 노트를 먼저 고친다.
  대조는 수치 문자열만 보지 않는다 — 같은 글 안의 다른 값, 원문 문장의 대상, 동사의 강도(가능 · 계획 · 결과)를 함께 본다(파일럿 회고 R9).
- **집필 워커에게 처음부터 넘길 주의**(파일럿 회고 `pattern-guide/research/system-design-pilot-retro-2026-11-15.md` 2절 · 7절).
  파일럿 2 는 이 주의를 받고 첫 초안의 출처 과장이 다섯에서 하나로 줄었다.
  - 원문보다 넓거나 강하게 쓰지 않는다(대상 · 동사 · 같은 글의 다른 값). 제품 동작을 단정하면 그 자리에 공식 문서.
  - 코드를 바꿔 실행한 결과는 바꾼 것을 정확히 적고 실제로 실행해 얻은 값만(SD43). 그림 라벨의 숫자 · 단위도 실행 출력과 맞춘다.
  - 약어 · 명령(규모 추정 식에 들어가는 것 포함)은 처음 나오는 자리에서 푼다(SD12).
  - `### 구현` 해설 안에는 펜스를 두지 않는다. 실행 출력 펜스는 `### 상황 설정` 끝에 둔다.
  - 문체 스캐너가 천 단위 쉼표(`1,111`)를 문장의 쉼표로 센다. 숫자가 많은 문장은 나눈다.
  - C4 템플릿은 children 방식으로 그려 화살표마다 통신 방식을 단다.
- **명세 · 캔버스 · 리서치 노트를 고친 뒤에는 voice 금지 어휘를 스캔한다.** 검사기 `lexicon` 은 가이드 본문만 보므로, 명세 문장에 든 금지 어휘는 워커가 옮겨 쓸 때에야 걸린다(1.0.x 명세에 6곳이 있었고, 1.1.0 개정 중에도 같은 낱말 하나가 명세 · 캔버스 · 회고의 일곱 자리에 새로 들어갔다).
  `python3 ~/.claude/plugins/cache/centurio87-plugins/authoring-kit/0.4.2/scripts/scan_lexicon.py <파일> --voice ppangtolab-teacher` (표 칸은 세지 않으므로 표 문장은 눈으로 본다)

## 동작

아래 `$PLUGIN` 은 authoring-kit 플러그인 루트다. 플러그인 스킬 안에서는 `${CLAUDE_PLUGIN_ROOT}` 이고,
이 프로젝트 스킬에서는 그 변수가 비어 있을 수 있으므로 lock 에 고정된 버전의 설치 경로를 쓴다.

```bash
PLUGIN="${CLAUDE_PLUGIN_ROOT:-$HOME/.claude/plugins/cache/centurio87-plugins/authoring-kit/$(python3 -c 'import json;print(json.load(open(".claude/authoring.lock.json"))["plugin"]["version"])')}"
test -f "$PLUGIN/scripts/authoring.py" || echo "authoring-kit 없음 — 여기서 멈춘다"
```

### 0. 사전 확인

```bash
python3 "$PLUGIN/scripts/authoring.py" status
python3 "$PLUGIN/scripts/authoring.py" lock          # 검사만. --update 는 규약 개정 때만
python3 "$PLUGIN/scripts/authoring.py" resolve --voice ppangtolab-teacher --spec <gof-guide|analysis-guide|system-design-guide> --profile main --frozen
```

- **플러그인이 없으면 여기서 멈춘다.** 구 경로(옛 `template.md`·옛 SKILL.md 산문 규칙)로 조용히
  돌아가지 않는다 — 그러면 어떤 규칙으로 쓰였는지 알 수 없다. 구 자산은 git 이력에만 있다.
- `status` 의 `specs` 에 대상 spec 이 없으면 멈춘다(규약 정착이 끝나지 않은 상태다).
- `lock` 이 비-0 이면 규칙이 바뀐 것이다. 무엇이 바뀌었는지 보이고 멈춘다.
  `lock --update` 는 규약 개정 시점에 사유와 함께 커밋하는 일이지, 집필을 시작하려고 올리는 일이 아니다.
- `resolve --frozen` 이 **비-0 이면 멈춘다.** lock 과 어긋난 규칙이나 `CONFLICT` 가 남은 규칙으로 쓰지 않는다.
- 세 언어 툴체인(`javac` · 로컬 `tsc` · `rustc`)은 3단계 `commands.compile` 이 버전을 확인하고
  없으면 비-0 으로 끝낸다. 집필이 끝난 뒤에 알게 되는 것이 아까우면 착수 전에
  `python3 scripts/check-guides.py --compile --self-test` 를 한 번 돌린다.

### 1. 리서치

`paths.json` `dirs.research` 의 노트에서 **해당 패턴 절**을 읽는다.

| 패턴 계열 | 노트 |
| --- | --- |
| GoF 생성·구조 | `gof-creational-structural.md` |
| GoF 행위 | `gof-behavioral.md` |
| 분석 패턴 | `analysis-patterns.md` |
| 시스템 설계 사례 | 문제마다 한 장 — `live-viewer-count-2026-11-13.md` · `coupon-issuance-2026-11-15.md`. 후보 목록은 `system-design-cases-2026-11-13.md` |

- **회계 계열(Account · Transaction · Posting Rule)** 은 `accounting-context.md` 를 반드시 읽는다.
  상황 설정의 배경은 그 확정안에서 가져오고, 이 자리에서 새로 정하지 않는다.
- 노트에 없는 사실이 필요하면 조사한다(`web-research:research` 위임 가능). **출처를 달고**, 결과를
  노트의 「미해결 질문」 또는 해당 패턴 절에 되먹인다. 다음 편이 같은 조사를 되풀이하지 않게 하려는 것이다.
- **구 가이드**(같은 경로의 기존 파일)는 최소 조건의 취지와 참고 자료를 확인하는 데만 읽는다.
  문장을 복사하지 않는다 — voice 가 바뀌어 전부 다시 쓴다.
- **재사용 자산 확인** — 같은 주제의 기존 가이드 폴더(`diagrams/` 의 도식 컴포넌트, `code/` 의 예시)에 쓸 것이 있으면 가져다 쓴다. 새로 만들지 않는다.
  가져온 것도 검사 면제가 아니다 — 도식 검사와 실행 대조를 그대로 지난다.
- **본문에 실을 수치는 실행에서 확정한다** — `code/` 의 세 언어를 돌려 나온 출력이 정본이고, 손으로 적은 값은 쓰지 않는다.
- **사전 지식 점검** — 본문이 기대게 될 원서 개념을 목록으로 뽑는다(원서의 그림·절·구현 쟁점, 다른 패턴의 개념, DDD 전술 용어, 회계 기초 등).
  항목마다 둘 중 하나로 표시한다: **주제 안**이면 본문에서 풀 것으로(원서 위치 지시자 없이 설명한다), **주제 밖**이면 `dirs.reference` 에 참고 문서가 있는지 확인하고
  링크할 파일명(최신 판본)을 적는다. **없으면 `reference-note` 로 먼저 집필한다** — 가이드가 없는 문서를 링크하면 검사가 막힌다.
  원서는 링크로만 존재하는 외부 레퍼런스라 본문이 원서를 펴야 읽히면 미흡이다(PG30·PG31).
- 본문에 실을 사실·수치·출처와, 조건부 절을 쓸지(출처가 확인된 사용처가 있는지 등)를 여기서 확정한다.

### 2. 집필 — `authoring-write` 에 위임

```
Skill(authoring-kit:authoring-write) --spec <gof-guide|analysis-guide|system-design-guide>
```

넘길 것: **대상 경로** · 1단계에서 읽은 **리서치 노트의 절**(경로와 절 제목, 회계 계열이면
`accounting-context.md` 포함) · **캔버스**(`paths.json` `templates` 의 해당 키) · 1단계에서 확정한 사실과 출처.

- 플러그인 스킬이 세션에 없으면 `$PLUGIN/skills/authoring-write/SKILL.md` 의 절차를 그대로 수행한다.
  집필 서브에이전트 프롬프트에는 `authoring.py resolve --voice ppangtolab-teacher --spec <id> --profile worker`
  출력 **전문**을 넘긴다. 요약해서 넘기지 않는다.
- **이 스킬이 본문을 직접 쓰지 않는다.**
- 산출물은 본문 하나가 아니다 — 가이드 폴더에 `code/`(공개 클래스 이름의 `.java` · `main.ts` · `main.rs` · `expected-output.txt`)와
  `diagrams/`(도식 컴포넌트 `.tsx` 와 렌더한 이미지)가 함께 선다. 본문 펜스는 `code/` 에서 가져오고, 도식은 이미지로 싣는다.
- **골격의 중심은 시나리오다**(명세 1.4.0, PG32~PG35). `## 패턴 자세히 들여다보기` 아래에 `### 시나리오 n — 제목` 이 2개 이상(기본 흐름 필수, 변화가 들어올 때·경계를 넘을 때 중 하나 이상),
  그 뒤 `### 개념 정리`. 최소 조건·비교는 "시나리오 n 의 k단계" 로 시나리오를 가리키고, 구현 해설은 시나리오 단계 ↔ 코드 줄 대응이며, 시나리오와 구현은 한 도메인이다.
  워커에게 1단계의 사전 지식 목록(주제 안/밖 판정과 링크할 참고 문서 파일명)을 함께 넘긴다 — 본문에 원서 위치 지시자를 두지 않는다(PG30).
- `authoring-write` 의 품질 게이트 단계는 아래 3단계 순서로 돈다. 기계 검사가 그 앞에 온다. 플러그인이 외부 검토를 부르면 건너뛴다 — 이 프로젝트는 쓰지 않는다.

### 3. 게이트 — 순서 고정

`{file}` 은 대상 경로다. 명령은 `paths.json` `commands` 에서 읽는다. 스킬에 명령을 새로 박지 않는다.

> **게이트에는 정성 판정을 두지 않는다**(2026-09-20 유저 결정). 통과 여부는 기계가 재현할 수 있는 검사와 품질 루브릭으로만 가른다.
> 외부 모델에게 초안을 읽히고 비평을 받는 단계(옛 이해 게이트·외부 검토)는 파이프라인에서 빠졌다 —
> 계승 원본(`~/code_test`)도 그 둘의 경로 바인딩과 축 파일이 없어 실행하지 않는다.

1. **기계 검사** — `commands.check` → `commands.compile` → `commands.run`. 비-0 이면 고치고 다시 돈다.
   `compile` 의 도구 버전과 `run` 의 출력 대조 결과는 완료 보고에 옮긴다.
2. **품질 게이트** — `Skill(authoring-kit:authoring-gate) <file> --spec <id>`.
   **최대 3라운드, 자동 통과 금지.** 3라운드에도 MUST 가 남으면 멈추고 사람에게 넘긴다.
   **본문이 코드·원전·실행 결과에 대해 단정한 자리는 채점이 직접 돌려 보거나 원문과 대조해 판정한다** — 사실 검증은 이 자리에 있다.

게이트에서 본문이나 예시 코드가 바뀌면 1 을 다시 돈다.

### 4. 발행 — 3단계를 전부 통과한 뒤에만

1. **도식** — 바뀐 도식이 있으면 `bun run scripts/render-viz.ts --module <diagrams/X.tsx> --out <diagrams/x.png>` 로 다시 굽고
   `bun run scripts/lint-diagrams.ts` 를 돌린다. 렌더러는 SVG 고유 폭에 캡처 폭을 자동으로 맞추고, 내용이 캡처 상자를 벗어나면
   **종료 코드 6 `[잘림]`** 으로 멈추며 넘친 요소를 찍는다 — 잘림은 캔버스 높이·배치를 고쳐서 푼다(2026-09-21: 참고 문서 3편과
   Strategy 구조 도식이 잘린 채 lint 를 통과했던 것을 이 가드로 막았다). 렌더한 PNG 는 그래도 열어 본다 — 가드는 잘림만 본다.
2. **HTML** — `commands.render` → `commands.derived`(낡은 HTML 이 없어야 한다). 출력은 md 와 같은 폴더다.
   이 편이 링크한 **참고 문서**도 같은 명령으로 렌더 상태를 확인한다 — 가이드는 fresh 인데 참고 문서 HTML 이 낡아 있으면 독자가 두 판본을 본다.
3. **인덱스 등록** — `paths.json` 의 `dirs.index`(`PATTERNS.md`)에 이 편을 **손으로 끼워 넣는다.** 분류·비교 페어 구조가 뜻을 담고 있으므로
   **인덱스 전체를 알파벳순으로 다시 만드는 것은 금지**다. 새 버전을 냈으면 인덱스가 가리키는 파일명도 그 자리에서 고친다.
   분석 패턴은 `pattern-guide/ddd-analysis-pattern-guide/README.md` 가 인덱스다.
4. **포인터 점검** — `commands.pointers`. 인덱스·기준 예시·**참고 문서 링크**가 최신 발행본을 가리키는지 본다.
   기준은 **발행본**이다 — 초안이 더 높은 버전으로 있어도 포인터는 발행본을 가리킨다(집필 중에 포인터가 전부 빨개지지 않게 하려는 것).

   > **상호 참조하는 문서는 같은 시점에 함께 발행한다.** 가이드가 참고 문서를 링크하고 참고 문서가 그 가이드를 링크하면,
   > 한쪽만 올릴 때마다 상대의 링크가 낡아 판올림이 서로를 튕긴다(A v1.1.0 → B patch → A 링크 낡음 → A patch → …).
   > 그래서 **둘 다 `draft` 인 동안 서로를 가리키게 맞춘 뒤 한 번에 `published` 로 올린다.**

   > **새 편이 기존 참고 문서를 링크하면 그 문서의 `serves` 를 제자리에서 고친다** (2026-09-30 규칙).
   > `check-guides.py` 의 `_serves_reverse` 가 「이 참고 문서를 링크하는 최신본의 slug 가 `serves` 에 다 있는가」를
   > 역방향으로 대조하는데, `latest_docs()` 는 `status: legacy` 만 빼고 **`draft` 를 센다.** 그래서 집필 중인 초안이
   > 링크를 거는 순간 **그 참고 문서 쪽이** `--all` 에서 실패한다 — 새 편이 아니라 참고 문서가 빨개지므로 원인을 오해하기 쉽다.
   > 이것은 검사의 결함이 아니라 설계다. 발행 시점에 터지는 것보다 집필 중에 걸리는 쪽이 낫다.
   >
   > **처리는 셋이다.** ① 집필 워커에게 **이 실패가 예상된 것임을 미리 알린다** — 알리지 않으면 워커가 링크를 빼서
   > 검사를 통과시키고, 그러면 AG4(참고 문서 링크 요구)가 조용히 깨진다. ② 참고 문서 파일은 **워커가 아니라 메인이**
   > 고친다(워커 폴더 밖이다). ③ `serves` 에 새 slug 를 넣는 것은 **제자리 수정이고 semver 를 올리지 않는다.**
   > 판올림하면 그 참고 문서를 가리키는 모든 자리가 한꺼번에 낡는다 — 2026-09-29 에 Account 를 v1.1.1 로 올렸다가
   > `--pointers` 실패가 3건에서 15건으로 번진 실측이 있다. **산문을 새로 쓰면 그때 올리고, 링크 문자열과
   > `serves` 항목은 제자리에서 고친다.**
   >
   > 참고 문서의 **산문까지 바뀌어야 하면** 그때는 patch 판본을 초안으로 새로 만들어(링크·`serves`·「가이드로 돌아가기」 갱신)
   > 이쪽 초안이 그 새 판본을 가리키게 하고 둘을 같은 커밋에서 발행한다. 절 이름이 바뀌었으면 앵커도 그때 고친다.
5. **게이트 기록** — `paths.json` `dirs.gate_results`(jsonl) 에 work 하나당 한 줄을 덧붙인다.

```bash
RESOLVE_HASH=$(python3 scripts/check-guides.py --resolve-hash <spec>)
python3 - "$RESOLVE_HASH" <<'PY'
import json, sys
row = {
  "file": "<대상 경로>", "spec": "<spec>", "version": "<가이드 버전>", "work": "<카드id/S번호, 카드 밖이면 ->",
  "resolve_hash": sys.argv[1], "rounds": 1,
  "verdict": "PASS", "date": "YYYY-MM-DD",
}
with open("pattern-guide/gate-results.jsonl", "a", encoding="utf-8") as f:
    f.write(json.dumps(row, ensure_ascii=False) + "\n")
PY
```

- `rounds` = 품질 게이트 라운드 수 · `verdict` = `PASS` | `FAIL` · `version` = 이 판본의 semver.
- 기록 경로는 `dirs.gate_results` 값을 쓴다(위 예시는 현재 값이다).
- 3라운드 미통과로 멈출 때도 `verdict: "FAIL"` 로 한 줄 남긴다. 낡은 PASS 와 구분하려는 것이다.

### 5. 완료 보고

- 산출 경로(md · HTML · `code/` · `diagrams/`, 건너뛴 것이 있으면 사유)
- **인덱스 삽입 위치**(어느 절·어느 줄에 넣었는가)
- 가이드 버전과 앞 판본(`supersedes`)
- spec · voice · **resolve 해시**
- 게이트 판정 — 기계 검사 결과와 도구 버전 · 예시 코드 실행 대조 · 품질 게이트 PASS/FAIL 과 라운드 N/3
- **생략한 조건부 절과 사유**
- 리서치 노트에 되먹인 내용(있으면)

## 참조 파일

- `gof-guide-canvas.md` · `analysis-guide-canvas.md` · `reference-note-canvas.md` · `system-design-guide-canvas.md` (이 폴더) — 캔버스. `paths.json` `templates` 가 가리킨다. 헤딩 문구·순서를 바꾸지 않는다
- `../../authoring/specs/{gof-guide,analysis-guide,reference-note,system-design-guide}/` — 항목 구성 · 항목별 작성법 · 판정 원칙
- `~/.claude/authoring/voices/ppangtolab-teacher/` — voice (전역, 여러 프로젝트가 함께 쓴다)
- `../../authoring/paths.json` — 경로(`dirs`) · 캔버스(`templates`) · 명령(`commands`)
- `../../authoring.lock.json` — 이 프로젝트가 서 있는 규칙 조합
- `../design-pattern-analyzer/` — 최소 조건 절을 평가 기준으로 읽는 쪽
- `KANBAN/cards/KAN-001-YXTC2C.md` 「전략」 — 이 체계를 고른 결정 기록

## 주의

- **골격·작성법·판정 원칙을 이 파일에 다시 쓰지 않는다.** 바꾸려면 spec 이나 voice 를 고친다.
- `디자인 패턴을 충족하는 최소 조건` **헤딩 문자열은 analyzer 계약이라 바꾸지 않는다.**
  analyzer 가 이 문자열과 조건 앞 `[필수]`/`[선택]` 표기로 평가 기준을 읽는다.
- 조건부 절은 해당 없으면 **절 자체를 지우고**, 생략 사유는 **게이트 보고에만** 남긴다.
  독자용 문서에 "해당 없음" 을 남기지 않는다.
- 본문에 싣는 수치·경로·실행 결과는 **실제로 확인한 것만** 쓴다.
- **원서는 링크로만 존재한다.** 본문에 `그림 n.n` · `§n.n` · `구현 쟁점 n` 같은 위치 지시자를 두지 않는다(근거 괄호·참고 자료만 예외).
  주제 밖 사전 지식은 참고 문서(`reference-note`)를 링크하고, 없으면 먼저 쓴다.
- **자동 통과 금지** — 품질 게이트 3라운드 소진과 기계 검사 비-0 은 "완성"이 아니다.
- 재집필 지시가 없는 구 가이드는 건드리지 않는다. 구 골격이 남아 있는 것 자체는 위반이 아니다.
