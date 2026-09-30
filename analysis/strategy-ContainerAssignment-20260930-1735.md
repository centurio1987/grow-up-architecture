# Strategy 패턴 부합도 분석

| 항목 | 값 |
| --- | --- |
| 분석 대상 | `pattern-guide/design-pattern-guide/specification/code/ContainerAssignment.java` |
| 언어 | Java |
| 분석 일시 | 2026-09-30 17:35 |
| 평가 기준 출처 | `pattern-guide/design-pattern-guide/strategy/strategy-guide_v1.1.0.md` (status: published, 같은 폴더의 v1.0.0 보다 높은 버전) |
| 코드 라인 수 | 143 |

## 종합 판정

**동시 통과 — 판정 보류**

Strategy `[필수]` 1·2·3 번이 모두 ✅ 다. 그러나 같은 코드가 Specification `[필수]` 넷도 모두 ✅ 여서 동시 통과다. Strategy 편의 비교 절은 State · Template Method · Command · 「분기를 메서드로 뽑은 코드」 넷만 다루고 **Specification 을 다루지 않으므로 가를 근거가 없다** — SKILL.md 5단계 3) 의 「비교 절이 못 가르거나 그 후보를 안 다루면 동시 통과 — 판정 보류」에 해당한다.

**주의 — 이 판정은 계약의 절차를 그대로 밟아서는 나오지 않았다.** 계약이 세운 세 경로(채점 순서 문단 · 비교 절 · 동시 통과 표)가 모두 Specification 을 후보로 내놓지 못한다. 아래 「경쟁 후보 대조」의 B 절에 그 사실과 근거를 적었다.

---

## 경쟁 후보 대조

### A. 계약이 세운 후보 (SKILL.md 5단계 1))

후보를 세운 근거 셋을 모두 적용했다.

1. **채점 순서 문단** — Strategy 편 최소 조건 절 끝: 「다만 필수 셋을 다 갖췄다고 판정이 끝나는 것은 아니에요. 구현 객체들이 같은 계산의 대안이 아니라 도메인의 상태를 나타낸다면 비교 절의 기준으로 **State** 쪽인지 함께 봅니다.」 → 5단계 강제, State 투입.
2. **비교 절** — 굵은 머리에서 뽑은 이름: **State** · **Template Method** · **Command**. 넷째 갈래 「분기를 메서드로 뽑은 코드」는 패턴이 아니라 오해받는 코드이므로 후보에서 뺐다(5단계 「패턴이 아닌 갈래는 후보가 아니다」).
3. **동시 통과가 확인된 쌍 표** — `Strategy ↔ State` 한 줄. 상대는 State.

| 후보 패턴 | 후보의 `[필수]` 결과 | 판정 |
| --- | --- | --- |
| State (`state/state-guide_v1.0.0.md`) | ✅ 1·2 / ❌ 3 | **탈락** |
| Template Method (`template-method/template-method-guide_v1.0.0.md`) | ❌ 1 | **탈락** |
| Command (`command/command-guide_v1.0.0.md`) | ✅ 1 / ❌ 2 | **탈락** |

- **State 를 떨어뜨린 조건**: 3번 「Context 가 들고 있는 상태 객체가 만든 뒤에 바뀝니다 — 상태 참조에 새 값을 넣는 코드가 Context 를 만드는 자리 밖에 있고」. `Cargo` 는 `record` 라 `storageSpec` 이 `final` 이고, 코드 어디에도 그 필드에 새 값을 넣는 문장이 없다. 130~131 줄은 필드를 바꾸는 것이 아니라 `new Cargo(...)` 로 **다른 객체를 새로 만든다**. 같은 `Cargo` 객체가 살아 있는 동안 서로 다른 명세를 가리키는 일이 없으므로 ❌.
- **Template Method 를 떨어뜨린 조건**: 1번 「상위 타입에 단계들의 호출 차례를 고정한 연산이 있습니다 — 그 연산의 본문이 상위 타입 안에 완성돼 있고」. `ContainerSpec` 은 본문 있는 연산이 하나도 없는 인터페이스다(11~13 줄). `AndSpec.isSatisfiedBy` 가 둘을 차례로 부르기는 하지만 `AndSpec` 은 `left`·`right` 의 상위 타입이 아니라 **필드로 든 별개 객체**라서 「상위 타입의 골격」이 아니다. ❌.
- **Command 를 떨어뜨린 조건**: 2번 「ConcreteCommand 가 받을 대상과 인자를 자기 안에 묶고, **실행 연산의 매개변수 목록에 그것들이 없으며**」. `isSatisfiedBy(Container candidate)` 는 받을 대상을 매개변수로 받는다(12 줄). 명세 객체 안에 `Container` 를 묶어 둔 필드가 없다. ❌.

**A 절만 밟으면 후보 셋이 모두 탈락하므로 종합 판정은 「정통 패턴(Strategy)」으로 끝난다.**

### B. 계약 밖에서 확인한 후보 — Specification

A 절의 결과가 틀렸다는 것을 이 편의 예시 코드가 실린 가이드가 직접 적어 둔다.

> **이 가이드의 예시 코드는 발행된 Strategy 편의 필수 조건 셋을 전부 만족합니다.** 직접 대조해 봤어요.
> — `specification/specification-guide_v1.0.0.md` 208 줄, 비교 절 「Strategy 와의 관계」

그래서 계약의 후보 세우기 규칙을 벗어나 Specification `[필수]` 넷을 같은 방법으로 채점했다.

| 후보 패턴 | 후보의 `[필수]` 결과 | 판정 |
| --- | --- | --- |
| Specification (`specification/specification-guide_v1.0.0.md`) | ✅ 1·2·3·4 (전부) | **동시 통과** |

- 1번 — `ContainerSpec.isSatisfiedBy(Container) : boolean` 이 후보 하나를 받아 불리언만 돌려주고(11~13), 잎 넷(16~42)과 조합 셋(45~64) **모두**가 그 연산으로 판정을 끝낸다. ✅
- 2번 — 후보 타입은 1번이 정한 `Container`(7 줄). `Container` 와 그것이 구현·상속한 타입(`java.lang.Record`) 어디에도 `isSatisfiedBy` 가 없고, 판정을 선언한 `ContainerSpec` 과 후보 타입이 서로 다르다. ✅
- 3번 — `Cargo.fits` 가 필드로 든 명세에 넘기고(79~83), `ContainerYard.matching` 이 인자로 받은 명세에 넘긴다(86~96). 어느 쪽도 조건식을 자기 코드로 다시 적지 않는다. ✅
- 4번 — `ContainerSpec` 과 모든 구현체의 공개 연산이 판정 연산 하나와 record 접근자(속성 읽기)뿐이고, 후보가 질 업무 연산이 명세 타입에 없다. `and`·`or`·`not`(66~76)은 명세끼리 결합해 같은 타입을 돌려주는 연산이라 4번이 허용하는 갈래다. ✅

**가르는 근거**: 「비교 절이 이 후보를 다루지 않음」. Strategy 편 v1.1.0 에는 `Specification` 도 `명세` 도 한 번도 나오지 않는다(전문 grep 으로 확인, 0 건). Strategy 편은 2026-09-21 에, Specification 편은 2026-09-30 에 발행되어 **앞 편이 뒤 편을 이름 댈 수 없었다.**

**가른 결과**: **보류**. 다만 반대편 가이드(Specification 편)의 비교 절은 이 관계를 이미 갈라 두었다.

> **판정은 조건으로 하고, 이름은 그 객체가 도메인에서 무엇으로 불리는가로 고릅니다.** 담당자가 이 화물의 보관 요건이라고 부르고 그 기준을 저장하거나 다른 화물에 다시 적용한다면 Specification 이라고 부르는 편이 읽는 사람에게 더 알려 줘요.
> — `specification/specification-guide_v1.0.0.md` 224 줄

이 기준을 코드에 대면 `Cargo.storageSpec` 은 화물의 보관 요건이라는 이름을 달고 있고, 128 줄과 133 줄에서 같은 객체가 검증(`meat.fits`)과 선택(`yard.matching`)에 나눠 쓰인다. 그러므로 **도메인 이름으로는 Specification 이고, Strategy 라는 이름도 함께 맞다** — 같은 절 210 줄이 「원전이 명세를 코드 조각으로 박아 구현하는 방식을 **Strategy 의 적용**이라고 직접 부르고 … 두 이름이 같은 코드에 붙는 것은 정상」이라고 적는다.

**그런데 SKILL.md 5단계 3) 은 「사용자가 댄 패턴의 비교 절」에서만 가르는 근거를 가져오라고 적는다.** 후보 쪽 가이드의 비교 절은 근거로 쓸 수 없다. 그 문면을 그대로 지키면 위 인용을 쓸 수 없고 판정은 보류로 남는다.

**무엇을 더 알아야 가릴 수 있는가**: 이 파일 안에서는 더 가릴 것이 없다. 두 이름이 모두 맞는 코드이고, 어느 이름으로 부를지는 이 팀이 `storageSpec` 을 도메인에서 무엇이라 부르는지(보관 요건인지, 배정 계산 방법인지)에 달렸다. 코드 밖의 사실이다.

---

## 조건별 평가

참여자 고정(SKILL.md 3단계) — Strategy 의 참여자를 조건을 채점하기 전에 다음으로 정하고, 세 조건 모두를 이 집합에 대해 읽었다.

| 참여자 | 코드의 대상 |
| --- | --- |
| Strategy (공통 타입) | `ContainerSpec` (11~13) |
| ConcreteStrategy | `TempAtMost` · `HumidityAtMost` · `FoodSafe` · `Sealed` · `AndSpec` · `OrSpec` · `NotSpec` (16~64) |
| Context | `Cargo` (79~83) — 전략을 필드로 들고 호출하는 쪽 |
| Client | `main` (113~142) |

- **부차 참조**: `ContainerYard`(86~96)도 `ContainerSpec` 을 **메서드 인자**로 받아 부른다. 조건 2번이 「필드·생성자 인자·메서드 인자」를 나란히 인정하므로 Context 자격이 있지만, 조건마다 편한 쪽을 갈아 끼우지 않기 위해 Context 는 `Cargo` 하나로 고정했다. `ContainerYard` 를 Context 로 잡아도 1·2·3 번의 결과는 같다(둘 다 타입 검사·다운캐스트·고르는 분기가 없다).
- **부차 참조**: `AndSpec`·`OrSpec`·`NotSpec` 이 `ContainerSpec` 을 필드로 든다. 이것은 전략이 전략을 드는 재귀 합성으로, **안쪽에 Composite/Interpreter 계열이 겹쳐 있다는 신호**다(3단계 3항). 겹친 사실을 그대로 적어 둔다 — 한 패턴의 조건을 두 번 만족한 것으로 세지 않았다.

### 조건 1. [필수] 교체할 알고리즘들이 같은 연산 모양을 따르고 계산 방법마다 따로 구현됩니다
**판정**: ✅ 충족

**근거**: `ContainerAssignment.java:11-28`, `44-57` 라인

```java
    interface ContainerSpec {
        boolean isSatisfiedBy(Container candidate);
    }

    record TempAtMost(int limitC) implements ContainerSpec {
        @Override
        public boolean isSatisfiedBy(Container candidate) {
            return candidate.lowestTempC() <= limitC;
        }
    }
```

**해설**: 연산 모양(`boolean isSatisfiedBy(Container)`)이 인터페이스 선언으로 코드에 드러나 있고, 계산 방법마다 별도 record 가 그 연산을 구현한다. 어느 구현체의 연산 안에도 계산 방법을 고르는 `switch`·`if` 가 없다(가이드의 반례 `AnyPlan` 과 다른 자리). `TempAtMost(-4)` 와 `TempAtMost(8)` 처럼 필드 값만 다른 객체 둘은 가이드가 「한 계산 방법을 매개변수로 나눈 것」으로 명시해 허용한다.

**이름 의존 조건**: 아니오.

---

### 조건 2. [필수] Context 는 전략을 그 연산 모양으로만 보유하고 호출합니다
**판정**: ✅ 충족

**근거**: `ContainerAssignment.java:79-83` 라인

```java
    record Cargo(String id, String goods, ContainerSpec storageSpec) {
        boolean fits(Container candidate) {
            return storageSpec.isSatisfiedBy(candidate);
        }
    }
```

**해설**: `Cargo` 의 필드이자 생성자 인자인 `storageSpec` 의 타입이 조건 1번의 공통 타입 `ContainerSpec` 이고, 요청을 처리하는 `fits` 가 그 연산만 호출해 계산을 넘긴다. `instanceof` 나 캐스트, 구체 전략 타입에 따라 갈라지는 코드가 `Cargo` 에 없다. 가이드의 반례(「필드가 `ByWeight` 처럼 구체 타입」)에 해당하지 않는다.

**이름 의존 조건**: 아니오.

---

### 조건 3. [필수] 여러 전략 중 하나를 고르는 분기가 Context 안에 없고, Context 는 전략을 받는 경로를 가집니다
**판정**: ✅ 충족 (「해당 없음」 아님 — 아래 해설)

**근거**: `ContainerAssignment.java:79-83`, `120-121` 라인

```java
    record Cargo(String id, String goods, ContainerSpec storageSpec) {
        boolean fits(Container candidate) {
            return storageSpec.isSatisfiedBy(candidate);
        }
    }
...
        Cargo meat = new Cargo("CG-5521", "frozen meat",
                and(new TempAtMost(-4), new FoodSafe()));
```

**해설**: `Cargo` 의 record 생성자가 전략을 밖에서 받는 경로이고(120~121 줄에서 Client 가 조립해 넘긴다), `Cargo` 안에 어느 명세를 쓸지 가르는 분기가 없다. 이 조건은 「~하는 코드가 없습니다」 꼴이라 3단계의 공허한 참 검사를 적용했는데, **`Cargo` 에는 생성자와 `fits` 라는 본문이 있어 고르는 분기를 넣을 자리가 실제로 있다**(시나리오 3 의 `Checkout(String plan)` 이 바로 그 모양이다). 자리가 있는데 위반이 없으므로 ✅ 이지 「해당 없음」이 아니다.

**이름 의존 조건**: 아니오.

---

### 조건 4. [선택] ConcreteStrategy 를 만드는 코드가 Context 밖에 있습니다
**판정**: ✅ 충족

**근거**: `ContainerAssignment.java:120-141` 라인

```java
        Cargo meat = new Cargo("CG-5521", "frozen meat",
                and(new TempAtMost(-4), new FoodSafe()));
...
        Cargo flowers = new Cargo("CG-7702", "fresh flowers",
                and(new TempAtMost(8), not(new Sealed())));
```

**해설**: 명세 객체를 만드는 자리가 전부 `main`(Client) 안에 있고 `Cargo` 는 만들어진 것을 받기만 한다.

---

### 조건 5. [선택] Context 에 전략을 다시 설치하는 연산이 있습니다
**판정**: ❌ 미충족

**근거**: `ContainerAssignment.java:79-83`, `130-131` 라인

```java
    record Cargo(String id, String goods, ContainerSpec storageSpec) {
...
        Cargo meatV2 = new Cargo(meat.id(), meat.goods(),
                and(meat.storageSpec(), new HumidityAtMost(60)));
```

**해설**: `Cargo` 가 record 라 `storageSpec` 이 `final` 이고 setter 가 없다. 규칙을 더할 때도 새 `Cargo` 를 만든다. 가이드가 「이 연산이 없어도 1~3번을 만족하면 Strategy 입니다」라고 명시하므로 종합 판정에는 반영하지 않는다. **다만 이 ❌ 가 State 후보를 떨어뜨린 근거와 같은 자리다**(State 3번은 이것을 `[필수]` 로 요구한다).

---

### 조건 6. [선택] 여러 Context 가 공유하는 전략 객체는 호출 사이에 값을 남기지 않습니다
**판정**: ✅ 충족

**근거**: `ContainerAssignment.java:16-21`, `45-50` 라인

```java
    record TempAtMost(int limitC) implements ContainerSpec {
        @Override
        public boolean isSatisfiedBy(Container candidate) {
            return candidate.lowestTempC() <= limitC;
        }
    }
```

**해설**: 모든 명세가 record 라 필드가 생성 뒤 바뀌지 않고, 판정 연산이 자기 필드에 값을 쓰지 않는다. 130 줄에서 `meat.storageSpec()` 을 `meatV2` 의 명세 안에 다시 넣어 같은 객체를 두 `Cargo` 가 공유하는데도 판정 결과가 서로 섞이지 않는다.

---

## 언어 관용구 측면

Java 16 이후의 `record` 가 이 구조와 잘 맞는다. 전략(명세) 객체를 record 로 두면 조건 6번(공유 전략의 무상태)이 언어 수준에서 보장되고, `equals`/`hashCode` 가 값 기준으로 생겨 같은 규칙을 만든 두 객체를 비교할 수 있다. 다만 record 는 필드가 `final` 이라 Strategy 조건 5번(설치 연산)을 쓸 수 없고, 그 결과로 State 의 `[필수]` 3번도 자동으로 막힌다 — 이 코드에서 Strategy/State 를 가른 것이 사실상 `record` 선택이다.

`sealed interface ContainerSpec permits ...` 로 바꾸면 구현체 목록이 닫히는데, 그렇게 하면 쓰는 쪽에서 패턴 매칭으로 종류를 가를 수 있게 되어 조건 2번의 「타입 검사·다운캐스트 금지」를 어기기 쉬워진다.

## 테스트 / 동작 검증

**정적 분석만 수행.** 대상 파일이 가이드 폴더(`pattern-guide/design-pattern-guide/specification/code/`)에 있어 `Makefile` 에 대응 타깃이 없다(SKILL.md 4단계: 「분석 대상이 가이드 폴더의 파일이면 Makefile 타깃이 없으므로 실행 단계를 생략한다」). 같은 폴더의 `expected-output.txt` 는 참고로만 보았고 실행하지 않았다.

## 권장 조치 (우선순위 순)

1. **이 코드를 Strategy 라고만 부르지 않는다** — 두 이름이 모두 맞고, 어느 이름이 읽는 사람에게 더 알려 주는지로 고른다. Specification 편 224 줄의 기준(「이름은 그 객체가 도메인에서 무엇으로 불리는가로 고릅니다」)을 그대로 쓰면, `storageSpec` 이 검증과 선택 양쪽에 쓰이므로 Specification 쪽이 더 알려 준다. 코드는 바꿀 것이 없고 부르는 이름과 주석만 정하면 된다.

   ```java
   // before — 부르는 이름이 정해지지 않은 상태
   record Cargo(String id, String goods, ContainerSpec storageSpec) { ... }

   // after — 이름을 도메인 어휘로 고정 (구조 변경 없음)
   /** storageSpec 은 이 화물의 보관 요건(Specification)이다.
    *  같은 객체를 검증(fits)과 선택(ContainerYard.matching) 양쪽에 넘긴다.
    *  구조상 Strategy 이기도 하다 — 원전이 그것을 Strategy 의 적용이라 부른다. */
   record Cargo(String id, String goods, ContainerSpec storageSpec) { ... }
   ```

2. **Strategy 로만 읽히길 원한다면 반환을 판정이 아닌 값으로 바꾼다** — Specification `[필수]` 1번이 「판정 자리에 계산값·정렬 키·변환 결과가 오면 이 조건이 아니에요」라고 적으므로, 이것이 두 이름을 가르는 유일한 구조 조작이다. 다만 그렇게 하면 `AndSpec`·`OrSpec`·`NotSpec` 이 뜻을 잃는다(Specification 편 시나리오 3 의 1단계가 세 언어 모두 컴파일 실패로 확인한 자리).

   ```java
   // before
   interface ContainerSpec { boolean isSatisfiedBy(Container candidate); }

   // after — Strategy 로만 읽히지만 논리곱·논리합·부정이 무너진다
   interface ContainerScorer { int scoreFor(Container candidate); }
   ```

3. **조치 없음도 정답이다** — 이 코드는 어느 조건도 어기지 않았다. 위 둘은 「어느 이름으로 부를까」에 대한 선택지이지 결함 수정이 아니다.

## 추가 코멘트

- **이 리포트가 드러낸 계약의 빈자리**: SKILL.md 5단계가 후보를 세우는 세 경로(① 채점 순서 문단 ② 비교 절의 굵은 머리 ③ 동시 통과 표) 가운데 어느 것도 Specification 을 내놓지 못한다. ①·②는 Strategy 편이 Specification 보다 9 일 먼저 발행되어 이름을 댈 수 없었고, ③은 표에 줄이 없다. 게다가 ②는 문면이 「그 절이 이름을 대는 **GoF 패턴**이 후보다」라서, Specification 편이 스스로 「GoF 의 생성·구조·행위 어느 칸에도 들어가지 않아요」(38 줄)라고 적는 이상 **이름이 적혀 있었어도 후보에서 빠진다.**
- **불변성이 판정을 가른 자리**: `Cargo` 가 record 인 덕분에 State 3번이 ❌ 가 됐다. 만약 `Cargo` 를 가변 클래스로 바꾸고 `setStorageSpec` 을 더하면 State `[필수]` 셋이 모두 ✅ 가 되어 `Strategy ↔ State ↔ Specification` 삼중 통과가 된다. 동시 통과 표의 `Strategy ↔ State` 줄이 든 「서는 모양」(설치 연산을 Context 에 둔 Strategy)이 정확히 그 코드다.
- **겹친 패턴**: 조합 명세(`AndSpec`·`OrSpec`·`NotSpec`)가 같은 공통 타입을 필드로 드는 재귀 구조라, Specification 편 비교 절이 적은 대로 Composite · Interpreter 도 같은 코드에 겹친다. 이 리포트는 사용자가 댄 Strategy 를 기준으로 삼았으므로 그 둘은 채점하지 않았고, 겹친 사실만 적는다.

---

## 참고

- 평가 기준 원문: `pattern-guide/design-pattern-guide/strategy/strategy-guide_v1.1.0.md` (최소 조건 절 239~299 줄 · 비교 절 300~413 줄)
- 후보 기준 원문: `pattern-guide/design-pattern-guide/state/state-guide_v1.0.0.md` · `.../template-method/template-method-guide_v1.0.0.md` · `.../command/command-guide_v1.0.0.md` · `.../specification/specification-guide_v1.0.0.md`
- 분석 skill: `.claude/skills/design-pattern-analyzer/`
