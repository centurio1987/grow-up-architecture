# design-pattern-analyzer 회귀 픽스처

`.claude/skills/design-pattern-analyzer/SKILL.md` 의 평가 기준 계약이 바뀐 뒤(카드 `KAN-001.2-4NWK0T` S5)
그 계약이 지켜지는지 확인하는 네 경우다. 바뀐 계약은 셋이다.

- 가이드 경로: 프로젝트 루트 → `pattern-guide/design-pattern-guide/<pattern>-pattern.md`
- 헤딩: `## 디자인 패턴을 충족하는 최소 조건` 고정 → 레벨 무관(`##`/`###`) 문자열 매칭
- 필수/선택: "첫 3개 필수" → 조건 앞 `[필수]`/`[선택]` 표기(표기가 하나도 없는 문서에만 옛 규칙 fallback)

analyzer 는 스킬 실행이라 사람이(또는 에이전트가) 돌린다. 아래 「결정론적 사전 확인」만 명령으로 판정된다.

## 파일

- `guide-strategy.md` — 작은 Strategy 가이드. 최소 조건 절만 제대로 있다(`###` 헤딩, `[필수]` 3 · `[선택]` 1). 개요 본문의 헤딩 문자열 언급과, 비교 절의 `[필수]` 미끼 줄은 절 경계 확인용이다
- `case2-optional-missing.ts` — `[선택]` 조건 4(실행 중 교체)만 미충족
- `case3-required-missing.ts` — `[필수]` 조건 3(Context 의 위임)만 미충족
- `case4-no-guide.ts` — 가이드가 없는 패턴명(Monostate)으로 부르는 코드

## 실행 방법 (공통)

- 리포트는 레포 `analysis/` 가 아니라 `/tmp/analyzer-regression/` 에 쓰게 한다.
- case 2·3 은 기준 문서로 `scripts/fixtures/analyzer/guide-strategy.md` 를 **명시 지정**한다. 기본 경로
  `pattern-guide/design-pattern-guide/strategy-pattern.md` 가 있어도 SKILL.md 2단계의 우선순위 2(사용자 지정)가 앞선다.
- 요청 예: "`scripts/fixtures/analyzer/case2-optional-missing.ts` 가 Strategy 패턴 맞는지 `scripts/fixtures/analyzer/guide-strategy.md` 를 기준으로 분석해줘. 리포트는 /tmp/analyzer-regression/ 에."

## 경우별 입력 · 기대 결과 · 확인 방법

### case 1 — 새 헤딩과 표기에서 기준 추출

- **입력**: `guide-strategy.md`
- **기대 결과**: 평가 기준이 조건 4개로 추출된다 — 1·2·3 `[필수]`, 4 `[선택]`. 개요 절 목록, 비교 절 목록(미끼 `[필수]` 줄 포함)은 들어가지 않는다.
- **확인 방법**: case 2·3 리포트의 메타 「평가 기준 출처」 가 이 파일 `(사용자 지정)` 이고, 「조건별 평가」 가 정확히 조건 1~4이며 각 제목에 `[필수]`/`[선택]` 이 원문대로 붙어 있다. 아래 사전 확인 1의 출력과 같아야 한다.

### case 2 — `[선택]` 미충족은 종합 판정을 깎지 않는다

- **입력**: `case2-optional-missing.ts` + 패턴 Strategy + 기준 `guide-strategy.md`
- **기대 결과**: 조건 1·2·3 ✅, 조건 4 ❌ → 종합 판정 **정통 패턴 (선택 조건 보강 권장)**. 채팅 요약의 「선택 조건 미충족」 줄에 조건 4, 권장 조치에 교체 경로 추가.
- **확인 방법**: 종합 판정이 "변형 패턴"·"패턴 아님" 이 아니다.

### case 3 — `[필수]` 미충족은 ❌

- **입력**: `case3-required-missing.ts` + 패턴 Strategy + 기준 `guide-strategy.md`
- **기대 결과**: 조건 3 ❌(`instanceof MemberDiscount` 분기, `policy.apply` 미호출), 조건 1·2·4 ✅ → 종합 판정 **패턴 아님**.
- **확인 방법**: 조건 3 판정이 ⚠️ 가 아니라 ❌ 이고, 근거가 `total` 의 분기 라인을 가리킨다.

### case 4 — 가이드가 없는 패턴은 checklist fallback

- **입력**: `case4-no-guide.ts` + 패턴 Monostate(기준 문서 지정 없음)
- **전제**: `pattern-guide/design-pattern-guide/monostate-pattern.md` 가 없어야 한다. 그 가이드가 생기면 가이드도 checklist 항목도 없는 다른 패턴명으로 바꾼다.
- **기대 결과**: 메타 「평가 기준 출처」 = 내장 `checklist.md`. checklist 에 Monostate 항목이 없으므로 「그 외 패턴에 대한 일반 원칙」 4문항으로 판정하고, 표기가 없어 fallback 규칙(첫 3개 필수)을 썼다는 사실이 메타에 있다.
- **확인 방법**: 리포트 메타의 출처 칸. 분석 패턴 트리(`pattern-guide/ddd-analysis-pattern-guide/`)에도 없는 이름이라 "판정 대상 아님" 으로 멈추지 않아야 한다.

## 결정론적 사전 확인

1. 최소 조건 절 추출 — SKILL.md 「최소 조건 절 찾기」 규칙(레벨 무관 매칭 · 같거나 높은 레벨 헤딩에서 종료 · 하위 헤딩 아래 목록 제외)을 그대로 옮긴 것이다.

   ```bash
   awk '
     /^#+ / { lvl = length($1) }
     on && /^#+ / && lvl <= start { on = 0 }
     on && /^#+ / { inner = 1 }
     on && !inner && /^([0-9]+\.|-) / { print }
     /^###? 디자인 패턴을 충족하는 최소 조건[[:space:]]*$/ { on = 1; start = lvl; inner = 0 }
   ' scripts/fixtures/analyzer/guide-strategy.md
   ```

   기대: 4줄, `[필수]` 3 · `[선택]` 1, 미끼 줄 없음. 같은 명령을 구 골격 `pattern-guide/design-pattern-guide/strategy-pattern.md` 에 돌리면 번호 조건 4줄이 나오고 `### 흔히 오해하는 지점` 목록은 빠져야 한다.

2. 픽스처 코드가 타입 검사를 통과하는지(판정이 문법 오류에 흔들리지 않게)

   ```bash
   typescript/node_modules/.bin/tsc --noEmit --strict --target ES2022 --lib ES2022 \
     --module ESNext --moduleResolution Bundler \
     --typeRoots typescript/node_modules/@types --types node \
     scripts/fixtures/analyzer/case*.ts
   ```

## 실측

2026-09-17, 새 SKILL.md 절차를 그대로 따라 수행. 리포트는 `/tmp/analyzer-regression/` (레포 밖, 보존 안 됨).

- **사전 확인 1**: `guide-strategy.md` → 4줄(`[필수]` 3 · `[선택]` 1), 미끼 줄 없음. 구 골격 `strategy-pattern.md` → 번호 조건 4줄, 「흔히 오해하는 지점」 목록 제외.
- **사전 확인 2**: `tsc` 5.9.3 종료코드 0. `tsx` 실행 출력 — case2 `10000 9000`, case3 `10000` / `9000`, case4 `false ap-northeast-2`.
- **case 1**: 통과 — 두 리포트 모두 출처 `scripts/fixtures/analyzer/guide-strategy.md (사용자 지정)`, 조건 1~4 원문 인용(`[필수]` 3 · `[선택]` 1), 기본 경로 `strategy-pattern.md`(구 골격)는 우선순위 2에 밀려 쓰이지 않음.
- **case 2**: 통과 — 조건 1·2·3 ✅, 조건 4 ❌(`private readonly policy`, setter 없음) → **정통 패턴 (선택 조건 보강 권장)**. 요약 `✅ 3 / ⚠️ 0 / ❌ 1 / ❓ 0`, 선택 조건 미충족: 조건 4. 리포트 `strategy-case2-optional-missing-20260917-1449.md`.
- **case 3**: 통과 — 조건 3 ❌(28-33행 `instanceof MemberDiscount` 분기, `apply` 호출 0), 조건 1·2·4 ✅ → **패턴 아님**. 요약 `✅ 3 / ⚠️ 0 / ❌ 1 / ❓ 0`, 선택 조건 미충족: 없음. 리포트 `strategy-case3-required-missing-20260917-1449.md`.
- **case 4**: 통과 — `monostate-pattern.md` 없음 · 지정 문서 없음 · checklist 에 Monostate 항목 없음 → 출처 내장 `checklist.md` 「그 외 패턴에 대한 일반 원칙」, fallback(첫 3개 필수) 명시. 판정 1·2·3 ✅, 4(결합도) ⚠️ → **정통 패턴 (선택 조건 보강 권장)**. 리포트 `monostate-case4-no-guide-20260917-1449.md`.
- **실행 검증**: 세 경우 모두 생략(정적 분석만). `make ts` 는 `typescript/src/<PATTERN>.ts` 만 실행해 픽스처에 대응하는 타깃이 없다.
- **한계**: 픽스처 작성자와 분석 수행자가 같은 에이전트라 판정이 기대 결과를 알고 내려졌다. 독립 재현은 이 README 를 모르는 세션이 기대 결과 절을 가린 채 돌려야 한다.
