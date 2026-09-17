#!/usr/bin/env bash
# 이해 게이트 (comprehension gate) — 디자인 패턴 가이드용
#
# 원본: ~/code_test/.claude/skills/guide-for-problem/scripts/comprehension-gate.sh (ORD-005, 알고리즘 가이드용)
# 개작: KAN-001.2-4NWK0T S4 — 인프라·판정·종료코드는 그대로 두고 **질문 5개와 FAIL 판정 문구를 함께**
#       디자인 패턴 전제로 교체했다. 원본의 Q1(수치 대조)·Q3(항상 옳은가 논증)·Q5(잘못된 값을
#       본문이 보였는가)는 패턴 가이드에서 구조적으로 FAIL 한다 — 패턴 글에는 수치도 정당성 증명도
#       실행값도 없다. 대신 "코드 변화·구체 상황·반례 코드·경계 이동"을 유도의 증거로 요구한다.
#
# 가이드가 "이미 아는 사람의 요약문"인지 "모르는 사람을 이해시키는 글"인지 판정한다.
# 외부 검토(review-external.sh)와 같은 인프라(codex / agy 병렬 호출)를 쓰지만 목적이 다르다:
#   review-external.sh    = 전문가 검토 (정의 정확성·비교 타당성·구현 일치·DDD 일관성)
#   comprehension-gate.sh = 폐쇄형 독해 시험 (본문만으로 이해에 도달하는가)
#
# 설계 요점 — LLM은 이미 Singleton도 Strategy도 Account도 안다. 그래서 "모르는 척"에 기대지 않고
# **본문 인용 강제 + 본문 외 지식 금지**로 무지를 대신한다. 답을 못 쓰는 게 아니라
# "본문 어디에 근거가 있는지 못 대는 것"이 실패 신호다. 이게 존재 검사(인용 가능?)와
# 충분성 검사(그 인용이 유도를 담고 있나?)를 가르는 지점이다.
#
# 질문 5개는 **유형이 고정**이고(동기 · 핵심 통찰 · 정당성 · 반례 · 구현), 패턴별 구체화는 채점
# 모델이 한다(집필자가 자기에게 유리한 쉬운 질문을 내는 경로를 차단). 질문을 쉽게 만들어 통과시키지
# 않는다 — 요구하는 것은 "답이 본문에 있는 상태"가 아니라 "답에 이르는 유도가 본문에 있는 상태"다.
#
# 가이드 종류:
#   gof      = GoF 계열 가이드 (기본)
#   analysis = 분석 패턴 가이드 — 경로에 `ddd-analysis-pattern-guide` 가 있으면 자동 선택.
#              정당성(Q3)·구현(Q5)을 "불변식이 어느 경계에 있고, 그 경계를 바꾸면 무엇이 깨지는가"로 바꾼다.
#   GUIDE_KIND=gof|analysis 로 강제할 수 있다.
#
# Usage:
#   comprehension-gate.sh <guide-file>
#
# Exit codes:
#   0 = 이해 게이트 통과 (두 모델 모두 응답했고 모두 VERDICT: PASS)
#   1 = 사용법 오류 (파일 없음·빈 파일·GUIDE_KIND 오값)
#   2 = 게이트 미완료 — 한 모델이라도 응답하지 않았고 응답한 쪽에 FAIL 이 없음 (통과로 간주 금지)
#   3 = 이해 게이트 미통과 (응답한 모델 중 하나라도 VERDICT: FAIL, 또는 VERDICT 줄 없음)
#
# 개정(KAN-001.3 S4): 예전에는 한 모델만 응답해도 그 모델이 PASS 면 0 이었다. 파일럿 회고 실험에서
# codex 사용량 한도로 agy 단독 PASS 가 0 으로 나온 것을 확인하고, 두 모델 판정이 모두 있어야 0 이 되게 바꿨다.
#
# 모델 선택: 각 CLI 기본 모델. CODEX_MODEL / AGY_MODEL로 오버라이드.
# 호출 제한 시간: COMPREHENSION_GATE_TIMEOUT(초, 기본 420) — timeout/gtimeout 이 있을 때만 걸린다.

set -u

CODEX_MODEL="${CODEX_MODEL:-}"
AGY_MODEL="${AGY_MODEL:-}"
CALL_TIMEOUT="${COMPREHENSION_GATE_TIMEOUT:-420}"

err() { printf '%s\n' "$*" >&2; }

TIMEOUT_CMD=""
if command -v timeout >/dev/null 2>&1; then
  TIMEOUT_CMD="timeout"
elif command -v gtimeout >/dev/null 2>&1; then
  TIMEOUT_CMD="gtimeout"
fi
run_limited() {
  if [ -n "$TIMEOUT_CMD" ]; then
    "$TIMEOUT_CMD" "$CALL_TIMEOUT" "$@"
  else
    "$@"
  fi
}

GUIDE_FILE="${1:-}"
if [ -z "$GUIDE_FILE" ]; then
  err "사용법: comprehension-gate.sh <guide-file>"
  exit 1
fi
if [ ! -r "$GUIDE_FILE" ]; then
  err "가이드 파일을 읽을 수 없습니다: $GUIDE_FILE"
  exit 1
fi
if [ ! -s "$GUIDE_FILE" ]; then
  err "가이드 파일이 비어 있습니다: $GUIDE_FILE"
  exit 1
fi

GUIDE_KIND="${GUIDE_KIND:-}"
if [ -z "$GUIDE_KIND" ]; then
  case "$GUIDE_FILE" in
    *ddd-analysis-pattern-guide*) GUIDE_KIND="analysis" ;;
    *) GUIDE_KIND="gof" ;;
  esac
fi
case "$GUIDE_KIND" in
  gof|analysis) ;;
  *) err "GUIDE_KIND 는 gof 또는 analysis 여야 합니다: $GUIDE_KIND"; exit 1 ;;
esac

GUIDE_BODY="$(cat "$GUIDE_FILE")"

SYSTEM_PROMPT='너는 이 패턴을 처음 배우는 학습자 역할로 폐쇄형 독해 시험을 치른다. 동시에 그 시험을 채점하는 감독관이기도 하다. 한국어로 답한다.'

RULES='아래 === GUIDE === 이후의 디자인 패턴 가이드 본문을 읽고, 다음 5개 질문에 답해라.

## 절대 규칙 (어기면 이 시험은 무효다)

1. **본문 안에 적힌 것만 근거로 삼는다.** 너는 이 패턴을 이미 알고 있겠지만(GoF 원전, Fowler, DDD 서적,
   각종 튜토리얼), 그 지식을 답에 섞으면 안 된다. 이 시험이 재는 것은 네 지식이 아니라 **본문의 설명력**이다.
2. **각 답마다 근거가 된 본문 구절을 그대로 인용한다.** 인용은 요약이 아니라 원문 복사다.
   코드를 근거로 삼으면 코드 줄을 그대로 옮긴다.
3. **본문에 근거가 없으면 답을 지어내지 말고 정확히 `근거 없음`이라고 쓴다.**
   네가 아는 정답을 적어 넣는 것이 이 시험의 유일한 실패 방식이다.
4. **인용은 했지만 그 인용이 결론만 말하고 이유를 말하지 않으면 `결론만 있음`이라고 쓴다.**
   예: "생성자를 private으로 막으므로 인스턴스가 하나임이 보장됩니다"는 결론이다 — 생성자가 열려 있으면
   어느 코드가 두 번째 인스턴스를 만들고 그래서 **무엇이 구체적으로 갈라지는지**가 본문에 없으면 `결론만 있음`이다.
   예: "인터페이스에 의존하므로 결합도가 낮아지고 확장에 유리합니다"도 결론이다 — 변형을 하나 더할 때
   **어느 코드가 바뀌고 어느 코드는 안 바뀌는지**가 본문에 없으면 `결론만 있음`이다.
   예: "Transaction이 aggregate root이므로 균형이 보장됩니다"도 결론이다 — Entry를 root 밖에서 바꿀 수 있으면
   **어떤 동작에서 어떤 합이 어긋나는지**가 본문에 없으면 `결론만 있음`이다.
   "유연하다 · 결합도가 낮다 · 유지보수가 쉽다 · 재사용성이 높다 · 응집도가 높다" 같은 형용사는 근거가 아니다.
   그 형용사를 **코드 변화나 구체 상황**으로 풀어 놓은 구절만 근거로 친다.
5. **답이 본문에 적혀 있는 것으로는 부족하다. 답에 이르는 유도가 본문에 있어야 한다.**
   정의 한 문장을 인용해 답을 채울 수 있어도, 그 정의가 왜 필요한지 본문이 보이지 않으면 `결론만 있음`이다.
6. **질문을 쉬운 쪽으로 구체화하지 마라.** "하나를 골라라"는 질문에서는 본문 설명이 **가장 얇은** 대상을 고른다.
   설명이 두꺼운 대상만 골라 PASS를 주는 것은 채점 부정이다.

## 질문 (유형 고정 — 이 패턴에 맞게 네가 구체화해서 답하라)
'

Q_GOF='
- **Q1 (동기 — 두 층위를 모두 답해야 한다)** 아래 (a)와 (b)는 다른 질문이다. **하나라도 본문에 근거가 없으면
  Q1 전체가 `근거 없음`**이고, 근거는 있는데 코드 변화나 구체 상황 없이 형용사뿐이면 `결론만 있음`이다.
  - **(a) 출발점**: 이 패턴을 모르는 사람이 같은 문제를 만나면 가장 먼저 짜게 되는 코드·설계는 무엇인가?
    (예: 조건문 분기로 종류마다 처리, 전역 변수 하나, 구체 클래스를 직접 new, 상속으로 변형마다 하위 클래스.)
    본문이 그 "패턴 없는 해법"을 **코드나 구체 구조로** 제시하는지 인용하라.
  - **(b) 무너지는 지점**: 그 해법은 **어떤 변화나 상황**(요구 하나 추가, 구현 교체, 동시 접근, 객체 수 증가,
    테스트 격리 등)에서 **무엇이 어떻게** 무너지는가? 고쳐야 할 코드가 어디로 번지는지, 어떤 잘못된 동작·상태가
    생기는지를 본문이 구체로 보였는지 인용하라.
    **(a)의 인용을 (b)에 재사용하지 마라** — (a)는 "무엇에서 출발하는가", (b)는 "그것이 왜 무너지는가"다.
    둘이 같은 인용으로 채워지면 (b)는 `근거 없음`이다.
- **Q2 (핵심 통찰)** 이 패턴이 문제를 푸는 **결정적 구조 한 가지**는 무엇이고, 어느 participant(패턴의 참여 역할)가
  그 구조를 지는가? 구조를 **한 문장**으로 말하고, (i) 그 participant를 정의한 본문 구절과 (ii) 그 구조가 Q1(b)의
  무너짐을 막는 이유를 말한 본문 구절을 **각각** 인용하라. participant 정의가 본문에 없으면 `근거 없음`,
  본문이 participant를 나열만 하고 그중 무엇이 결정적인지 가리지 않으면 `결론만 있음`이다.
- **Q3 (정당성)** 본문의 "디자인 패턴을 충족하는 최소 조건"에서 `[필수]` 조건 하나를 골라라(규칙 6 — 본문 설명이
  가장 얇은 조건). 그 조건을 빼면 **어떤 코드(또는 구조)가 나머지 조건을 전부 만족하면서도 이 패턴이 아닌 채로
  통과해 버리는가?** 그 코드에서 무엇이 깨지는가? 본문이 그 반례 코드·상황으로 유도하지 못하고 조건만 선언하면
  `결론만 있음`이다. `[필수]` 표기가 없으면 본문이 빠뜨리면 안 된다고 밝힌 조건을 고르고, 최소 조건 자체가 본문에
  없으면 `근거 없음`이다.
- **Q4 (반례)** 이 패턴을 **쓰면 안 되는 상황** 또는 **비슷한 패턴·안티패턴과 헷갈리는 구체 사례** 하나를 본문에서
  골라라(규칙 6). 그 사례가 코드나 구체 상황으로 제시돼 있는가, 그리고 둘을 가르는 **구분 기준**이 코드·구조에서
  확인할 수 있는 형태(예: "누가 X를 생성하는가", "Y를 실행 중에 바꿀 수 있는가", "호출자가 구체 타입을 아는가")로
  적혀 있는가? 사례가 없으면 `근거 없음`, 사례는 있는데 "남용하지 말라"뿐이거나 기준이 "의도가 다르다"뿐이면
  `결론만 있음`이다.
- **Q5 (구현)** 본문의 구현 코드에서 패턴을 지는 **한 줄(또는 참조 방식 하나)**을 골라라(규칙 6 — 본문이 가장 적게
  설명한 줄). 세 언어 구현이 있으면 한 언어를 골라도 된다. 그 줄을 바꾸면 이 패턴이 아니게 되는가, 다른 패턴이
  되는가, 무엇이 되는가? 본문이 (i) 그 줄이 어느 최소 조건을 지는지 코드와 연결해 보였는지, (ii) 바꾼 결과(어떤
  패턴·안티패턴이 되는지, 어떤 잘못된 동작이 가능해지는지)를 보였는지 인용하라. 코드와 조건의 연결이 본문에 없으면
  `근거 없음`, 연결은 있는데 바꾼 결과가 없으면 `결론만 있음`이다.
'

Q_ANALYSIS='
- **Q1 (동기 — 두 층위를 모두 답해야 한다)** 아래 (a)와 (b)는 다른 질문이다. **하나라도 본문에 근거가 없으면
  Q1 전체가 `근거 없음`**이고, 근거는 있는데 코드 변화나 구체 상황 없이 형용사뿐이면 `결론만 있음`이다.
  - **(a) 출발점**: 이 분석 패턴을 모르는 사람이 같은 도메인을 만나면 가장 먼저 만드는 모델·코드는 무엇인가?
    (예: 잔액을 숫자 필드 하나로 둔다, 수량을 원시 숫자로 둔다, 관계를 문자열 필드로 둔다.)
    본문이 그 "패턴 없는 모델"을 **코드나 구체 구조로** 제시하는지 인용하라.
  - **(b) 무너지는 지점**: 그 모델은 **어떤 도메인 요구나 상황**(취소·정정, 이력 추적, 단위 혼용, 동시 처리,
    규칙 변경 등)에서 **무엇이 어떻게** 무너지는가? 어떤 잘못된 값·상태가 생기는지, 고칠 곳이 어디로 번지는지를
    본문이 구체로 보였는지 인용하라.
    **(a)의 인용을 (b)에 재사용하지 마라** — 둘이 같은 인용으로 채워지면 (b)는 `근거 없음`이다.
- **Q2 (핵심 통찰)** 이 패턴이 문제를 푸는 **결정적 구조 한 가지**는 무엇이고, 어느 개념(분석 층위의 개념)이 그 구조를
  지는가? 구조를 **한 문장**으로 말하고, (i) 그 개념을 정의한 본문 구절과 (ii) 그 구조가 Q1(b)의 무너짐을 막는
  이유를 말한 본문 구절을 **각각** 인용하라. 개념 정의가 본문에 없으면 `근거 없음`, 본문이 개념을 나열만 하고
  그중 무엇이 결정적인지 가리지 않으면 `결론만 있음`이다.
- **Q3 (정당성 — 불변식과 경계)** 본문(상황 설정·최소 조건)이 내세운 **불변식 하나**를 골라라(규칙 6 — 본문 설명이
  가장 얇은 불변식). 그 불변식은 **어느 aggregate 경계 안에서** 지켜지는가? 그 경계를 바꾸면(예: child를 별도
  aggregate로 떼어 냄, 소유 위치를 다른 root로 옮김, 두 aggregate를 하나로 합침) **어떤 동작에서 무엇이** 깨지는가
  (어떤 불변식이 한 번의 변경 단위 안에서 보장되지 않게 되는가, 또는 무엇이 과하게 잠기는가)? 불변식이나 그 위치가
  본문에 없으면 `근거 없음`, 위치는 있는데 경계를 바꾼 경우로 유도하지 못하면 `결론만 있음`이다.
- **Q4 (반례)** 이 패턴을 **쓰면 안 되는 상황** 또는 **비슷한 패턴·안티패턴과 헷갈리는 구체 사례** 하나를 본문에서
  골라라(규칙 6). 그 사례가 모델·코드나 구체 상황으로 제시돼 있는가, 그리고 둘을 가르는 **구분 기준**이 모델에서
  확인할 수 있는 형태(예: "값이 식별자를 갖는가", "누가 이 불변식을 검사하는가", "다른 aggregate를 id로 참조하는가")로
  적혀 있는가? 사례가 없으면 `근거 없음`, 사례는 있는데 기준이 "관점이 다르다"뿐이면 `결론만 있음`이다.
- **Q5 (구현 — 경계와 참조 방식)** 본문의 구현 코드에서 **경계나 참조 방식 한 곳**(id 참조 ↔ 객체 참조, child를
  소유하는 root, 불변식을 검사하는 메서드의 위치 등)을 골라라(규칙 6). 그것을 바꾸면 본문 상황 설정의 **어느 행**과
  어긋나고, 어떤 불변식이 깨지거나 어떤 잘못된 변경이 가능해지는가? 본문이 (i) 그 코드를 상황 설정의 행(bounded
  context · 불변식의 위치 · root/entity/VO 배정 · 참조 방식)과 연결해 보였는지, (ii) 바꾼 결과를 보였는지 인용하라.
  코드와 상황 설정의 연결이 본문에 없으면 `근거 없음`, 연결은 있는데 바꾼 결과가 없으면 `결론만 있음`이다.
'

OUTPUT_SPEC='
## 출력 형식

각 질문마다 아래 3줄을 쓴다.

```
[Q1] 답변: <본문만으로 재구성한 답, 또는 "근거 없음" / "결론만 있음">
[Q1] 인용: "<본문 원문 그대로>"
[Q1] 판정: PASS | FAIL(근거 없음) | FAIL(결론만 있음)
```

5개를 모두 마친 뒤, **마지막 줄에 반드시** 아래 형식의 한 줄을 단독으로 출력한다.
FAIL이 하나라도 있으면 전체는 FAIL이다.

```
VERDICT: PASS
```
또는
```
VERDICT: FAIL
```

VERDICT 줄 앞에, FAIL인 항목마다 "무엇이 본문에 없어서 답할 수 없었는지"를 한 줄씩 적어라.
이것이 집필자에게 돌아갈 보완 지시가 된다.

=== GUIDE ==='

if [ "$GUIDE_KIND" = "analysis" ]; then
  QUESTIONS="$Q_ANALYSIS"
else
  QUESTIONS="$Q_GOF"
fi

USER_PROMPT_HEAD="${RULES}${QUESTIONS}${OUTPUT_SPEC}"

USER_PROMPT="${USER_PROMPT_HEAD}
${GUIDE_BODY}"

COMBINED_PROMPT="${SYSTEM_PROMPT}

${USER_PROMPT}"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

CODEX_LAST="$TMP_DIR/codex.last"
CODEX_LOG="$TMP_DIR/codex.log"
CODEX_ERR="$TMP_DIR/codex.err"
AGY_OUT="$TMP_DIR/agy.out"
AGY_ERR="$TMP_DIR/agy.err"

call_codex() {
  if ! command -v codex >/dev/null 2>&1; then
    printf 'codex CLI 미설치 — ChatGPT 독해 시험을 건너뜁니다.\n' >"$CODEX_ERR"
    return 0
  fi
  local model_args=()
  [ -n "$CODEX_MODEL" ] && model_args=(-m "$CODEX_MODEL")
  # API 키 미사용 — codex가 ChatGPT 로그인만 쓰도록 이 서브셸 한정으로 제거.
  unset OPENAI_API_KEY
  # read-only 샌드박스 + 작업 루트를 임시 디렉토리로 고정해 로컬 파일을 못 건드리게.
  if ! printf '%s' "$COMBINED_PROMPT" | run_limited codex exec \
        --skip-git-repo-check -s read-only --color never \
        -C "$TMP_DIR" -o "$CODEX_LAST" "${model_args[@]+"${model_args[@]}"}" - \
        >"$CODEX_LOG" 2>&1; then
    {
      if grep -aqiE 'usage limit' "$CODEX_LOG" 2>/dev/null; then
        printf 'codex 사용량 한도 — 한도가 풀린 뒤 다시 실행하세요(인증 문제가 아닙니다).\n'
      else
        printf 'codex 실행 실패 — 인증 만료(세션 종료)일 수 있습니다. `codex login` 후 다시 시도하세요.\n'
      fi
      grep -aiE 'ERROR:|unauthorized|log in again|invalidated|session has ended' "$CODEX_LOG" 2>/dev/null \
        | awk '!seen[$0]++' | tail -n 4
    } >"$CODEX_ERR"
    : >"$CODEX_LAST"
  fi
}

call_agy() {
  if ! command -v agy >/dev/null 2>&1; then
    printf 'antigravity CLI(agy) 미설치 — Gemini 독해 시험을 건너뜁니다.\n' >"$AGY_ERR"
    return 0
  fi
  local model_args=()
  [ -n "$AGY_MODEL" ] && model_args=(-m "$AGY_MODEL")
  run_limited agy -p "$COMBINED_PROMPT" "${model_args[@]+"${model_args[@]}"}" \
    </dev/null >"$AGY_OUT" 2>"$AGY_ERR"
  local rc=$?
  if [ "$rc" -ne 0 ] || grep -qiE 'Authentication required|authentication timed out' "$AGY_OUT" 2>/dev/null; then
    cat "$AGY_OUT" >>"$AGY_ERR" 2>/dev/null
    printf '\nagy 인증 필요 — 터미널에서 `agy`를 한 번 실행해 Google 로그인 후 다시 시도하세요.\n' >>"$AGY_ERR"
    : >"$AGY_OUT"
  fi
}

call_codex &
PID_CODEX=$!
call_agy &
PID_AGY=$!
wait "$PID_CODEX" "$PID_AGY"

ANY_OUTPUT=0
ANY_SKIP=0
ANY_FAIL=0
ANY_MISSING_VERDICT=0

# VERDICT 줄을 추출해 판정한다. 줄이 없으면(형식 미준수) 미통과로 본다 — 통과는 명시적이어야 한다.
judge() {
  local file="$1" label="$2" verdict
  verdict="$(grep -aoE '^[[:space:]]*VERDICT:[[:space:]]*(PASS|FAIL)' "$file" 2>/dev/null \
    | tail -n 1 | grep -aoE '(PASS|FAIL)')"
  if [ -z "$verdict" ]; then
    printf '\n[%s] VERDICT 줄을 찾지 못했습니다 — 형식 미준수는 미통과로 처리합니다.\n' "$label"
    ANY_MISSING_VERDICT=1
    return
  fi
  printf '\n[%s] 이해 게이트 판정: %s\n' "$label" "$verdict"
  [ "$verdict" = "FAIL" ] && ANY_FAIL=1
  return 0
}

printf '[가이드 종류] %s — %s\n\n' "$GUIDE_KIND" "$GUIDE_FILE"
printf '=== ChatGPT (codex CLI) — 폐쇄형 독해 시험 ===\n'
if [ -s "$CODEX_LAST" ]; then
  cat "$CODEX_LAST"; printf '\n'; ANY_OUTPUT=1
  judge "$CODEX_LAST" "codex"
elif [ -s "$CODEX_ERR" ]; then
  printf '[skip] %s\n' "$(cat "$CODEX_ERR")"; ANY_SKIP=1
else
  printf '[빈 응답]\n'; ANY_SKIP=1
fi

printf '\n=== Gemini (antigravity CLI) — 폐쇄형 독해 시험 ===\n'
if [ -s "$AGY_OUT" ]; then
  cat "$AGY_OUT"; printf '\n'; ANY_OUTPUT=1
  judge "$AGY_OUT" "agy"
elif [ -s "$AGY_ERR" ]; then
  printf '[skip] %s\n' "$(cat "$AGY_ERR")"; ANY_SKIP=1
else
  printf '[빈 응답]\n'; ANY_SKIP=1
fi

if [ "$ANY_OUTPUT" -eq 0 ]; then
  err ""
  err "두 모델 모두 응답을 받지 못했습니다 — 이해 게이트 미실행. 통과로 간주하지 마세요."
  exit 2
fi

printf '\n----------------------------------------\n'
if [ "$ANY_FAIL" -eq 1 ] || [ "$ANY_MISSING_VERDICT" -eq 1 ]; then
  printf '이해 게이트: FAIL — 위 "근거 없음 / 결론만 있음" 항목이 곧 보완 지시입니다.\n'
  printf '해당 내용을 본문에 채워 넣은 뒤 다시 실행하세요. 기준을 낮춰 통과시키지 마세요.\n'
  exit 3
fi
if [ "$ANY_SKIP" -eq 1 ]; then
  printf '이해 게이트: 미완료 — 한 모델만 응답했습니다. 두 모델 판정이 모두 있어야 통과입니다(위 [skip] 사유 참고).\n'
  exit 2
fi
printf '이해 게이트: PASS — 두 모델이 모두 본문만으로 5개 질문에 답했습니다.\n'
exit 0
