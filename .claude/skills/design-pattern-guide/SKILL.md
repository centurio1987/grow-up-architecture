---
name: design-pattern-guide
description: 디자인 패턴 가이드 1편을 authoring-kit 명세(gof-guide · analysis-guide)로 집필·재집필하는 진입 스킬. 사전 확인 → 리서치 노트 → authoring-write 위임 → 기계 검사·외부 검토·품질 게이트 → 발행·게이트 기록까지 끌고 간다. 트리거 — "디자인 패턴 가이드", "Singleton/Strategy/Observer/... 패턴 가이드 작성/재집필", "분석 패턴 가이드", "Account/Quantity/Transaction 패턴 가이드", "design pattern guide", "패턴 가이드 문서". 여러 패턴을 요청하면 패턴마다 1편씩 따로 돈다. 이미 있는 코드가 패턴에 맞는지 판정하는 일은 design-pattern-analyzer 가 맡는다.
argument-hint: <pattern-kebab-name>
---

# design-pattern-guide 스킬 (패턴 가이드 집필 진입점)

`$ARGUMENTS` 패턴의 가이드 1편을 `<대상 트리>/$ARGUMENTS-pattern.md` 에 쓴다.
재집필이면 **같은 경로에 덮어쓴다** — 파일명이 analyzer 와 인덱스의 키다.

> **집필 규칙은 이 파일에 없다.** 골격·작성법·최소 조건의 판정 원칙은 명세(spec)
> `gof-guide` · `analysis-guide` 에, 문체는 퍼소나(voice) `ppangtolab-teacher` 에 산다.
> 이 스킬은 **어느 명세로 쓸지 고르고, 넘기고, 게이트와 발행을 끌고 가는 일**만 한다.
> 플러그인이 없으면 명확히 실패한다.

## 어느 명세를 쓰는가

| 대상 (`paths.json` 키) | spec | 캔버스 (`paths.json` `templates` 키) |
| --- | --- | --- |
| `pattern-guide/design-pattern-guide/<패턴>/` (`dirs.content` · `dirs.tracks`) | `gof-guide` | `gof-guide-canvas` |
| `pattern-guide/ddd-analysis-pattern-guide/<패턴>/` (`dirs.content` · `dirs.tracks`) | `analysis-guide` | `analysis-guide-canvas` |

voice 는 둘 다 `ppangtolab-teacher` 다.

대상 트리는 `$ARGUMENTS-pattern.md` 가 이미 있는 쪽이다. 두 트리 어디에도 없는 새 패턴이면
`dirs.research` 의 `candidates.md` 「결정」 절에 기록된 spec 을 따른다. 거기에도 없으면 멈추고
어느 트리에 둘지 묻는다 — 채택 결정 없이 새 패턴을 만들지 않는다.

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
python3 "$PLUGIN/scripts/authoring.py" resolve --voice ppangtolab-teacher --spec <gof-guide|analysis-guide> --profile main --frozen
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

- **회계 계열(Account · Transaction · Posting Rule)** 은 `accounting-context.md` 를 반드시 읽는다.
  상황 설정의 배경은 그 확정안에서 가져오고, 이 자리에서 새로 정하지 않는다.
- 노트에 없는 사실이 필요하면 조사한다(`web-research:research` 위임 가능). **출처를 달고**, 결과를
  노트의 「미해결 질문」 또는 해당 패턴 절에 되먹인다. 다음 편이 같은 조사를 되풀이하지 않게 하려는 것이다.
- **구 가이드**(같은 경로의 기존 파일)는 최소 조건의 취지와 참고 자료를 확인하는 데만 읽는다.
  문장을 복사하지 않는다 — voice 가 바뀌어 전부 다시 쓴다.
- **재사용 자산 확인** — 같은 주제의 기존 가이드 폴더(`diagrams/` 의 도식 컴포넌트, `code/` 의 예시)에 쓸 것이 있으면 가져다 쓴다. 새로 만들지 않는다.
  가져온 것도 검사 면제가 아니다 — 도식 검사와 실행 대조를 그대로 지난다.
- **본문에 실을 수치는 실행에서 확정한다** — `code/` 의 세 언어를 돌려 나온 출력이 정본이고, 손으로 적은 값은 쓰지 않는다.
- 본문에 실을 사실·수치·출처와, 조건부 절을 쓸지(출처가 확인된 사용처가 있는지 등)를 여기서 확정한다.

### 2. 집필 — `authoring-write` 에 위임

```
Skill(authoring-kit:authoring-write) --spec <gof-guide|analysis-guide>
```

넘길 것: **대상 경로** · 1단계에서 읽은 **리서치 노트의 절**(경로와 절 제목, 회계 계열이면
`accounting-context.md` 포함) · **캔버스**(`paths.json` `templates` 의 해당 키) · 1단계에서 확정한 사실과 출처.

- 플러그인 스킬이 세션에 없으면 `$PLUGIN/skills/authoring-write/SKILL.md` 의 절차를 그대로 수행한다.
  집필 서브에이전트 프롬프트에는 `authoring.py resolve --voice ppangtolab-teacher --spec <id> --profile worker`
  출력 **전문**을 넘긴다. 요약해서 넘기지 않는다.
- **이 스킬이 본문을 직접 쓰지 않는다.**
- 산출물은 본문 하나가 아니다 — 가이드 폴더에 `code/`(공개 클래스 이름의 `.java` · `main.ts` · `main.rs` · `expected-output.txt`)와
  `diagrams/`(도식 컴포넌트 `.tsx` 와 렌더한 이미지)가 함께 선다. 본문 펜스는 `code/` 에서 가져오고, 도식은 이미지로 싣는다.
- `authoring-write` 의 외부 검토·품질 게이트 단계는 아래 3단계 순서로 돈다. 기계 검사가 그 앞에 온다.

### 3. 게이트 — 순서 고정

`{file}` 은 대상 경로다. 명령은 `paths.json` `commands` 에서 읽는다. 스킬에 명령을 새로 박지 않는다.

> **게이트에는 정성 판정을 두지 않는다**(2026-09-20 유저 결정). 통과 여부는 기계가 재현할 수 있는 검사로만 가른다.
> 외부 모델이 내는 말(외부 검토)은 **집필 라운드의 입력**이지 통과 조건이 아니다 — 게이트가 보는 것은 "검토가 실행됐는가"뿐이다.
> 옛 이해 게이트(외부 모델 둘이 본문만 읽고 다섯 질문에 답하던 시험)는 이 결정으로 파이프라인에서 빠졌다.

1. **기계 검사** — `commands.check` → `commands.compile` → `commands.run`. 비-0 이면 고치고 다시 돈다.
   `compile` 의 도구 버전과 `run` 의 출력 대조 결과는 완료 보고에 옮긴다.
2. **외부 검토** — `commands.external_review` (`CLAUDE_PLUGIN_ROOT="$PLUGIN"` 을 붙여 실행).
   두 도구가 모두 응답하지 못하면 검토를 받지 못한 것이므로 완성으로 보지 않는다. 한쪽만 응답했으면 빠진 쪽을 보고에 남긴다.
   응답 내용은 다음 라운드의 보완 지시이고, 그 지적을 반영했는지는 품질 게이트가 판정한다.
3. **품질 게이트** — `Skill(authoring-kit:authoring-gate) <file> --spec <id>`.
   **최대 3라운드, 자동 통과 금지.** 3라운드에도 MUST 가 남으면 멈추고 사람에게 넘긴다.
   **마지막 라운드의 외부 검토는 채점 입력이다** — 채점이 먼저 끝나도 그 지적을 확인하기 전에는 닫지 않는다.

게이트에서 본문이나 예시 코드가 바뀌면 1 을 다시 돈다.

### 4. 발행 — 3단계를 전부 통과한 뒤에만

1. **도식** — 바뀐 도식이 있으면 `bun run scripts/render-viz.ts --module <diagrams/X.tsx> --out <diagrams/x.png>` 로 다시 굽고
   `bun run scripts/lint-diagrams.ts` 를 돌린다.
2. **HTML** — `commands.render` → `commands.derived`(낡은 HTML 이 없어야 한다). 출력은 md 와 같은 폴더다.
3. **인덱스 등록** — `paths.json` 의 `dirs.index`(`PATTERNS.md`)에 이 편을 **손으로 끼워 넣는다.** 분류·비교 페어 구조가 뜻을 담고 있으므로
   **인덱스 전체를 알파벳순으로 다시 만드는 것은 금지**다. 새 버전을 냈으면 인덱스가 가리키는 파일명도 그 자리에서 고친다.
   분석 패턴은 `pattern-guide/ddd-analysis-pattern-guide/README.md` 가 인덱스다.
4. **포인터 점검** — `commands.pointers`. 인덱스·기준 예시가 최신본을 가리키는지 본다.
5. **게이트 기록** — `paths.json` `dirs.gate_results`(jsonl) 에 work 하나당 한 줄을 덧붙인다.

```bash
RESOLVE_HASH=$(python3 scripts/check-guides.py --resolve-hash <spec>)
python3 - "$RESOLVE_HASH" <<'PY'
import json, sys
row = {
  "file": "<대상 경로>", "spec": "<spec>", "version": "<가이드 버전>", "work": "<카드id/S번호, 카드 밖이면 ->",
  "resolve_hash": sys.argv[1], "rounds": 1,
  "external": "<응답한 도구, 예: codex+agy>", "verdict": "PASS", "date": "YYYY-MM-DD",
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
- 게이트 판정 — 기계 검사 결과와 도구 버전 · 예시 코드 실행 대조 · 외부 검토(응답한 도구, 빠진 도구) · 품질 게이트 PASS/FAIL 과 라운드 N/3
- **생략한 조건부 절과 사유**
- 리서치 노트에 되먹인 내용(있으면)

## 참조 파일

- `gof-guide-canvas.md` · `analysis-guide-canvas.md` (이 폴더) — 캔버스. `paths.json` `templates` 가 가리킨다. 헤딩 문구·순서를 바꾸지 않는다
- `../../authoring/specs/{gof-guide,analysis-guide}/` — 항목 구성 · 항목별 작성법 · 판정 원칙
- `~/.claude/authoring/voices/ppangtolab-teacher/` — voice (전역, 여러 프로젝트가 함께 쓴다)
- `../../authoring/paths.json` — 경로(`dirs`) · 캔버스(`templates`) · 명령(`commands`)
- `../../authoring.lock.json` — 이 프로젝트가 서 있는 규칙 조합
- `scripts/review-axes-pattern.md` — 외부 검토 축
- `../design-pattern-analyzer/` — 최소 조건 절을 평가 기준으로 읽는 쪽
- `KANBAN/cards/KAN-001-YXTC2C.md` 「전략」 — 이 체계를 고른 결정 기록

## 주의

- **골격·작성법·판정 원칙을 이 파일에 다시 쓰지 않는다.** 바꾸려면 spec 이나 voice 를 고친다.
- `디자인 패턴을 충족하는 최소 조건` **헤딩 문자열은 analyzer 계약이라 바꾸지 않는다.**
  analyzer 가 이 문자열과 조건 앞 `[필수]`/`[선택]` 표기로 평가 기준을 읽는다.
- 조건부 절은 해당 없으면 **절 자체를 지우고**, 생략 사유는 **게이트 보고에만** 남긴다.
  독자용 문서에 "해당 없음" 을 남기지 않는다.
- 본문에 싣는 수치·경로·실행 결과는 **실제로 확인한 것만** 쓴다.
- **자동 통과 금지** — 품질 게이트 3라운드 소진, 외부 검토 도구 둘 다 실패, 기계 검사 비-0 은 모두 "완성"이 아니다.
- 재집필 지시가 없는 구 가이드는 건드리지 않는다. 구 골격이 남아 있는 것 자체는 위반이 아니다.
