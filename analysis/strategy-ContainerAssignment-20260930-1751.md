# Strategy 패턴 부합도 분석 (고친 계약 재시험)

| 항목 | 값 |
| --- | --- |
| 분석 대상 | `pattern-guide/design-pattern-guide/specification/code/ContainerAssignment.java` |
| 언어 | Java |
| 분석 일시 | 2026-09-30 17:51 |
| 평가 기준 출처 | `pattern-guide/design-pattern-guide/strategy/strategy-guide_v1.1.0.md` (status: published, date: 2026-09-21, 같은 폴더의 v1.0.0 보다 높은 버전) |
| 코드 라인 수 | 143 |
| 비고 | 2026-09-30 에 고친 SKILL.md 로 다시 돌린 재시험. 고치기 전 기록은 `analysis/strategy-ContainerAssignment-20260930-1735.md` 에 남아 있다. |

## 종합 판정

**동시 통과 — 둘 다 맞음 (Strategy · Specification · 의존성 주입)**

Strategy `[필수]` 1·2·3 번이 모두 ✅ 이고 「해당 없음」은 없다. 5단계 경쟁 후보 대조에서 **후보 열 편**을 세워 채점했고, 그 가운데 넷이 `[필수]` 를 전부 통과했다(Specification · Bridge · Decorator · 의존성 주입).

- **Bridge · Decorator** 는 후보 쪽 비교 절이 **Strategy 를 답으로 지정**해 이름이 갈렸다.
- **Specification · 의존성 주입** 은 후보 쪽 비교 절이 **둘 다 맞다**고 적는다. 그래서 보류가 아니라 「동시 통과 — 둘 다 맞음」이다.

**고치기 전 계약과 달라진 점**: 이전 실행에서는 후보 셋(State·Template Method·Command)이 전부 탈락해 「정통 패턴(Strategy)」으로 끝났다. 고친 계약은 **동시 통과 표와 발행 순서 규칙** 두 경로로 Specification 을 후보로 데려왔고, **후보 쪽 비교 절** 규칙으로 가르는 문장을 찾았으며, **「둘 다 맞음」** 어휘로 정답을 「못 갈랐다」로 적지 않았다. 세 고침이 모두 실제로 작동했다.

---

## 경쟁 후보 대조

### 1) 후보를 세운 경로 (SKILL.md 5단계 1))

계약이 정한 네 경로를 모두 밟았다.

| 경로 | 계약 문면 | 내놓은 후보 |
| --- | --- | --- |
| **A. 기준 문서의 비교 절** | 「그 절이 이름을 대는 것 가운데 **채점할 최소 조건 절을 가진 발행된 편**」 | State · Template Method · Command |
| **B. 동시 통과가 확인된 쌍 표** | 「표에 있는 상대는 비교 절이 이름을 안 대도 반드시 본다」 | State · **Specification** |
| **C. 발행 순서 규칙** | 「사용자가 댄 패턴보다 늦게 발행된 편 가운데 그 패턴을 비교 절에서 다루는 것」 | Bridge · Command · Decorator · 의존성 주입 · Flyweight · Null Object · **Specification** · State · Template Method · Visitor |
| **D. 채점 순서 문단** | 「다만 필수 셋을 다 갖췄다고 판정이 끝나는 것은 아니에요 … **State** 쪽인지 함께 봅니다」(Strategy 편 299 줄) | State |

- **경로 A 의 제외**: Strategy 편 비교 절의 넷째 갈래 「분기를 메서드로 뽑은 코드」는 열어 채점할 문서가 없으므로 후보에서 뺐다. **「GoF 패턴」이 아니라 「채점할 최소 조건 절을 가진 발행된 편」이 기준이라서**, 제외 사유(열어 채점할 문서가 없음)가 이 갈래에 실제로 참이다. 고치기 전에는 같은 자리에서 Specification(비GoF·발행본)이 함께 걸려 나갔다.
- **경로 C 를 실제로 돌린 방법**: `pattern-guide/design-pattern-guide/` 의 편 26 개를 훑어 ① 머리말 `date` 가 2026-09-21(Strategy v1.1.0 발행일)보다 늦고 ② 비교 절 안에 `**Strategy 와의 …**` 꼴의 굵은 갈래 머리가 있는 편을 뽑았다. 열 편이 걸렸다.

| 편 | 발행일 | 비교 절의 갈래 머리 |
| --- | --- | --- |
| bridge | 2026-09-27 | `**Strategy 와의 차이.**` |
| decorator | 2026-09-27 | `**Strategy 와의 차이.**` |
| command | 2026-09-28 | `**Strategy 와의 차이.**` |
| flyweight | 2026-09-28 | `**Strategy · State 와 겹쳐 서는 자리.**` |
| state | 2026-09-28 | `**Strategy 와의 차이.**` |
| template-method | 2026-09-28 | `**Strategy 와의 차이.**` |
| visitor | 2026-09-28 | `**Strategy 와의 차이.**` |
| dependency-injection | 2026-09-30 | `**Strategy 와의 관계.**` |
| null-object | 2026-09-30 | `**Strategy 와의 관계.**` |
| specification | 2026-09-30 | `**Strategy 와의 관계.**` |

**네 경로의 합집합 = 후보 열 편**입니다: Bridge · Command · Decorator · 의존성 주입 · Flyweight · Null Object · Specification · State · Template Method · Visitor.

**Specification 은 경로 B 와 C 두 갈래로 들어왔다.** 표가 없었어도 경로 C 가, 경로 C 가 없었어도 표가 데려온다. 고친 계약의 이중 안전장치가 실제로 겹쳐서 걸렸다.

### 2) 후보의 `[필수]` 채점 결과

표에 오른 상대(Specification · State)부터 보았다.

| 후보 패턴 | 후보의 `[필수]` 결과 | 판정 |
| --- | --- | --- |
| **Specification** (`specification-guide_v1.0.0.md`) | ✅ 1·2·3·4 (전부) | **동시 통과** |
| **State** (`state-guide_v1.0.0.md`) | ✅ 1·2 / ❌ 3 | 탈락 |
| **Bridge** (`bridge-guide_v1.0.0.md`) | ✅ 1·2·3 (전부) | **동시 통과** |
| **Decorator** (`decorator-guide_v1.0.0.md`) | ✅ 1·2·3·4·5 (전부) | **동시 통과** |
| **의존성 주입** (`dependency-injection-guide_v1.0.0.md`) | ✅ 1·2·3 (전부) | **동시 통과** |
| **Flyweight** (`flyweight-guide_v1.0.0.md`) | ✅ 1·2 / ❌ 3 | 탈락 |
| **Null Object** (`null-object-guide_v1.0.0.md`) | ✅ 1 / ❌ 2 | 탈락 |
| **Template Method** (`template-method-guide_v1.0.0.md`) | ❌ 1 | 탈락 |
| **Command** (`command-guide_v1.0.0.md`) | ✅ 1 / ❌ 2 | 탈락 |
| **Visitor** (`visitor-guide_v1.0.0.md`) | ❌ 1 | 탈락 |

**통과한 넷의 근거**

- **Specification** — 1번 ✅ `ContainerSpec.isSatisfiedBy(Container) : boolean` 이 후보 하나를 받아 불리언만 돌려주고, 잎 넷(16~42)과 조합 셋(45~64) **모두**가 그 연산으로 판정을 끝낸다(`grep` 으로 구현 목록 전수 확인). 2번 ✅ 후보 타입 `Container`(7)와 그것이 구현·상속한 타입 어디에도 판정 연산이 없고, 판정을 선언한 타입과 후보 타입이 다르다. 3번 ✅ `Cargo.fits`(80~82)가 필드로 든 명세에, `ContainerYard.matching`(87~95)이 인자로 받은 명세에 넘기며 어느 쪽도 조건식을 다시 적지 않는다. 4번 ✅ 명세 타입의 공개 연산이 판정 연산 하나와 record 접근자뿐이고, `and`·`or`·`not`(66~76)은 명세끼리 결합해 같은 타입을 돌려주는 연산이라 4번이 허용하는 갈래다. 후보가 질 업무 연산은 없다.
- **Bridge** — Abstraction 을 `Cargo` 로 고정했다(구현 쪽 타입을 참조로 들되 물려받지 않는 쪽). 1번 ✅ `Cargo` 가 `ContainerSpec` 필드를 들고 값이 생성자로 밖에서 들어오며, `Cargo` 는 `ContainerSpec` 을 구현하지 않는다. 2번 ✅ `fits` 가 구현 쪽 연산 호출로만 수행되고 구체 구현자 타입 검사가 없다. 3번 ✅ 명세 구현부(11~76)에 `Cargo` 라는 이름이 **0 건**이다(`grep` 확인) — 의존이 한 방향이다.
- **Decorator** — 층을 `NotSpec` 으로 고정했다(3단계 「감싸는 패턴은 Client 의 요청을 실제로 수행하는 대상 하나를 고른다」: `NotSpec.isSatisfiedBy` 의 반환값이 `inner.isSatisfiedBy` 에서 나온다). 1번 ✅ `ContainerSpec` 의 연산 하나를 빠짐없이 내민다. 2번 ✅ 참조를 **하나** 들고 그 타입이 `ContainerSpec` 자체다(59). 3번 ✅ `!inner.isSatisfiedBy(candidate)`(62)라 어떤 호출도 대상에 닿지 않고 끝나지 않는다. 4번 ✅ 감쌀 대상을 생성자로 받는다. 5번 ✅ 장식 결과와 감싼 대상이 다른 객체이고 Client 가 `==` 로 비교하지 않는다.
  - 참고: `AndSpec`·`OrSpec` 은 참조를 **둘** 들어 2번에서 갈리고, `OrSpec` 은 단락 평가라 오른쪽이 안 불릴 수 있어 3번에서도 갈린다(55). 그래서 층은 `NotSpec` 하나로 고정했다.
- **의존성 주입** — 의존 객체를 `Cargo` 로 고정했다. 1번 ✅ 든 협력 객체가 `storageSpec` 하나이고 타입이 인터페이스 `ContainerSpec` 이다(`id`·`goods` 는 값이지 협력 객체가 아니다). 2번 ✅ 협력 객체가 생성자 인자로 들어오고 `Cargo` 안에 명세를 만드는 생성 호출도 등록소·전역 접근점 호출도 없다. 3번 ✅ 구현을 골라 넣는 코드가 `main`(113~142)에 있고, `Cargo` 의 필드·인자·호출 어디에도 그 단위의 타입 이름이 없다.

**탈락한 여섯의 근거**

- **State** ❌ 3번 「Context 가 들고 있는 상태 객체가 만든 뒤에 바뀝니다 — 상태 참조에 새 값을 넣는 코드가 Context 를 만드는 자리 밖에 있고」. `Cargo` 가 `record` 라 `storageSpec` 이 `final` 이고, 130~131 줄은 필드를 바꾸는 것이 아니라 `new Cargo(...)` 로 다른 객체를 만든다.
- **Flyweight** ❌ 3번 「공유 대상은 팩토리 역할의 연산으로만 얻고, 같은 키에는 같은 객체가 돌아옵니다 — 부르는 쪽 코드에 그 타입의 생성 호출이 없고, 키를 받는 연산 하나가 보관 자리를 확인해 …」. `main` 이 `new TempAtMost(-4)` 처럼 직접 만들고(121), 보관 자리(맵·캐시)가 코드에 **없다**(`grep` 으로 `Map<`·`cache`·`computeIfAbsent` 0 건). `and`·`or`·`not` 은 늘 새 객체를 만들어 돌려주는 조합 연산이지 캐시가 아니다.
- **Null Object** ❌ 2번 「연산 전부를 중립 동작으로 채운 구현이 하나 이상 — 값을 돌려주는 연산이면 받은 인자와 상관없이 늘 같은 중립값을 돌려줍니다」. 일곱 구현 모두 판정이 `candidate` 에 달려 있다(`return true;`·`return false;` 꼴이 코드에 0 건). 늘 참이거나 늘 거짓인 명세가 없다.
- **Template Method** ❌ 1번 「상위 타입에 단계들의 호출 차례를 고정한 연산이 있습니다 — 그 연산의 본문이 상위 타입 안에 완성돼 있고」. `ContainerSpec` 은 본문 있는 연산이 없는 인터페이스다(11~13). `AndSpec.isSatisfiedBy` 가 둘을 차례로 부르지만 `AndSpec` 은 `left`·`right` 의 상위 타입이 아니라 필드로 든 별개 객체다.
- **Command** ❌ 2번 「ConcreteCommand 가 받을 대상과 인자를 자기 안에 묶고, **실행 연산의 매개변수 목록에 그것들이 없으며**」. `isSatisfiedBy(Container candidate)` 는 받을 대상을 매개변수로 받는다(12). 명세 안에 `Container` 를 묶어 둔 필드가 없다.
- **Visitor** ❌ 1번 「방문 대상 구체 타입이 **둘 이상**이고, 방문자 타입에 그 타입마다 방문 연산이 하나씩」. 방문 대상이 될 구체 타입은 `Container`(7) 하나뿐이고, 방문 연산도 `isSatisfiedBy` 하나뿐이다.

**「판정할 수 없음」으로 넘긴 후보**: 없다. 열 후보 가운데 `[필수]` 에 「해당 없음」이 섞인 것은 하나도 없었다(5단계 2)의 새 규칙을 쓸 자리가 이번에는 나오지 않았다).

### 3) 동시 통과를 가른 근거

사용자가 댄 Strategy 편(2026-09-21 발행)의 비교 절은 State · Template Method · Command · 「분기를 메서드로 뽑은 코드」 넷만 다룬다. **통과한 후보 넷을 하나도 다루지 않는다** — `Specification` 도 `명세` 도 전문에 0 건이고, Bridge · Decorator · 의존성 주입도 갈래로 없다. 그래서 5단계 3)의 **「거기서 못 찾으면 후보 쪽 비교 절도 본다」** 를 적용했다. 아래는 모두 **후보 쪽 편의 비교 절**에서 가져온 문장이다.

#### Bridge → **Strategy 쪽으로 갈림**

출처: `bridge/bridge-guide_v1.0.0.md` 비교 절 「Strategy 와의 차이」. 이 절은 갈림 셋을 순서대로 적용하라고 적는다.

> 갈림 1 — 위임하는 쪽에도 하위 타입이 자라는가?
> 갈림 2 — 여러 구현 중 하나를 고르는 분기를 안쪽에 두어도 되는가?
> ├─ 두어도 된다 ──▶ Bridge  └─ 두면 안 된다 ──▶ Strategy
> 갈림 3 — 두 쪽의 연산이 1:1로 맞물리는가? Bridge : 1:N / Strategy : 대체로 1:1

**그 자리를 실제로 읽었다.** 갈림 1 — 위임하는 쪽 `Cargo` 는 하위 타입이 없는 record 하나이고, 자라는 것은 위임받는 `ContainerSpec` 쪽뿐이다 → 갈림 2 로 내려간다. 갈림 2 — `Cargo` 안에 여러 명세 중 하나를 고르는 분기가 없고(조건 3번의 ✅ 와 같은 자리), 넣으면 Strategy 3번에 걸린다 → **Strategy**. 갈림 3(보조) — `Cargo.fits` 한 요청이 `isSatisfiedBy` 한 번으로 끝나는 1:1 이다 → **Strategy**. 셋이 같은 답을 낸다. 같은 절이 「갈림 2 가 가장 날카롭습니다」라고 적는데, 그 갈림이 Strategy 를 가리킨다.

#### Decorator → **Strategy 쪽으로 갈림**

출처: `decorator/decorator-guide_v1.0.0.md` 비교 절 「Strategy 와의 차이」.

> 구분 기준은 바꾸는 것이 대상의 겉인지, 대상 안에서 도는 계산인지입니다 … 코드에서는 화살표 방향으로 보입니다. 데코레이터는 대상을 밖에서 감싸고, 스트래티지는 대상이 안에서 들고 있어요.
>
> ```
> Decorator : Client ──▶ [ 층 ] ──▶ [ 대상 ]        층이 대상을 감싼다. 대상은 층을 모른다
> Strategy  : Client ──▶ [ 대상 ( 전략 ) ]          대상이 전략을 들고 있다. 대상이 부른다
> ```

**그 자리를 실제로 읽었다.** 사용자가 물은 자리에서 Client(`main`)가 부르는 것은 `meat.fits(candidate)`(125)와 `yard.matching(...)`(128)이고, 대상인 `Cargo` 가 명세를 **안에서 들고 부른다**(80~82). 화살표가 아래쪽 모양이다 → **Strategy**.

- **겹침을 숨기지 않는다**: `NotSpec` 한 자리만 떼어 보면 층이 대상을 밖에서 감싸는 위쪽 모양이 맞고, 그래서 `[필수]` 다섯이 통과했다. 이것은 Specification 편이 이미 적어 둔 겹침(조합 명세가 Composite · Interpreter 와 겹친다)과 같은 자리다 — 한 패턴의 조건을 두 번 만족한 것이 아니라 **코드의 다른 층위에 다른 패턴이 겹쳐 서 있는 것**이다(3단계 3항).

#### Specification → **둘 다 맞음**

출처: `specification/specification-guide_v1.0.0.md` 비교 절 「Strategy 와의 관계」.

> **이 가이드의 예시 코드는 발행된 Strategy 편의 필수 조건 셋을 전부 만족합니다.** 직접 대조해 봤어요. (208 줄)

> **필수 조건 넷을 전부 만족하면서 동시에 다른 패턴이기도 한 코드가 있고, 그것은 이 조건들의 결함이 아닙니다.** 오히려 원전이 그렇게 적어요 — 명세를 코드 조각으로 박아 구현하는 방식을 두 저자가 직접 Strategy 의 적용이라고 부르고 … (193 줄)

> **판정은 조건으로 하고, 이름은 그 객체가 도메인에서 무엇으로 불리는가로 고릅니다.** 담당자가 이 화물의 보관 요건이라고 부르고 그 기준을 저장하거나 다른 화물에 다시 적용한다면 Specification 이라고 부르는 편이 읽는 사람에게 더 알려 줘요. (224 줄)

**그 자리를 실제로 읽었다.** `Cargo.storageSpec` 은 화물의 보관 요건이라는 이름을 달고 있고, 128 줄(검증 `meat.fits`)과 133 줄(선택 `yard.matching`)에서 **같은 객체가 두 자리에 나눠 쓰인다.** 130~131 줄에서는 그 기준을 다른 기준과 합쳐 새 화물에 다시 적용한다. 인용문이 든 조건이 코드에 그대로 서 있다.

#### 의존성 주입 → **둘 다 맞음**

출처: `dependency-injection/dependency-injection-guide_v1.0.0.md` 비교 절 「Strategy 와의 관계」.

> 그러니 두 이름의 관계는 포개짐입니다. **협력 타입이 하나이고 그 구현들이 같은 계산의 대안이면 두 이름이 다 맞고**, 갈아 끼울 것이 아예 없는 자리이거나 협력 타입이 여럿이면 의존성 주입이라는 이름만 남아요.

> **판정은 조건으로 하고, 이름은 그 코드를 읽는 사람이 무엇을 더 알게 되는가로 고릅니다.**

**그 자리를 실제로 읽었다.** `Cargo` 가 든 협력 타입은 `ContainerSpec` **하나**이고, 그 구현 일곱은 같은 판정의 다른 방법이다. 인용문의 왼쪽 갈래 그대로라 **두 이름이 다 맞다**.

### 4) 종합

`[필수]` 전부 ✅ + 후보도 전부 ✅ + 후보 쪽 비교 절이 **둘 다 맞다고 적음** → 6단계 판정 표의 **「동시 통과 — 둘 다 맞음」** 행이다. **보류가 아니다.** 어느 이름을 쓸지는 도메인이 고르는 일이므로 사용자에게 넘긴다.

- **Strategy** 로 부르면: 무엇이 갈아 끼워지는지가 이름에 실린다.
- **Specification** 으로 부르면: 그 객체를 저장하고 조합하고 검증·선택 두 자리에 나눠 쓴다는 것까지 알려 준다. 이 코드는 그 셋을 실제로 한다(130·128·133 줄).
- **의존성 주입** 으로 부르면: 협력 객체가 밖에서 들어온다는 사실만 말한다. 협력 타입이 하나뿐이라 이 이름은 가장 적게 알려 준다.

읽는 사람이 가장 많이 알게 되는 이름은 **Specification** 이지만, **그 선택은 이 파일 밖의 사실**(팀이 `storageSpec` 을 도메인에서 무엇이라 부르는가)에 달렸으므로 분석기가 정하지 않는다.

---

## 조건별 평가

참여자 고정(SKILL.md 3단계) — 조건을 채점하기 전에 Strategy 의 참여자를 다음으로 정하고, 세 조건 모두를 이 집합에 대해 읽었다.

| 참여자 | 코드의 대상 |
| --- | --- |
| Strategy (공통 타입) | `ContainerSpec`(11~13) |
| ConcreteStrategy | `TempAtMost` · `HumidityAtMost` · `FoodSafe` · `Sealed` · `AndSpec` · `OrSpec` · `NotSpec`(16~64) |
| Context | `Cargo`(79~83) — 전략을 필드로 들고 호출하는 쪽 |
| Client | `main`(113~142) |

- **부차 참조**: `ContainerYard`(86~96)도 `ContainerSpec` 을 **메서드 인자**로 받아 부른다. 조건 2번이 「필드·생성자 인자·메서드 인자」를 나란히 인정하므로 Context 자격이 있지만, 조건마다 편한 쪽을 갈아 끼우지 않기 위해 Context 는 `Cargo` 하나로 고정했다. `ContainerYard` 를 Context 로 잡아도 1·2·3 번의 결과는 같다.
- **부차 참조**: `AndSpec`·`OrSpec`·`NotSpec` 이 `ContainerSpec` 을 필드로 든다. 전략이 전략을 드는 재귀 합성이고, **안쪽에 다른 패턴(Composite · Interpreter · Decorator)이 겹쳐 있다는 신호**다(3단계 3항). 겹친 사실을 그대로 적는다 — 한 패턴의 조건을 두 번 만족한 것으로 세지 않았다.

### 조건 1. [필수] 교체할 알고리즘들이 같은 연산 모양을 따르고 계산 방법마다 따로 구현됩니다
**판정**: ✅ 충족

**근거**: `ContainerAssignment.java:11-28` 라인

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

**선언 뒤 가리키는 대상 확인**(3단계): `storageSpec` 에 들어가는 값을 따라가면 `main` 에서 만든 별개의 명세 객체들이고(121·131·136·140), `this` 나 `Cargo` 자신이 들어가는 자리는 없다.

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

**해설**: `Cargo` 의 record 생성자가 전략을 밖에서 받는 경로이고(120~121 줄에서 Client 가 조립해 넘긴다), `Cargo` 안에 어느 명세를 쓸지 가르는 분기가 없다.

**「해당 없음」 검사**(3단계): 이 조건은 「~분기가 없고」 꼴이라 공허한 참 검사를 적용했다. **`Cargo` 에는 생성자와 `fits` 라는 본문이 있어 고르는 분기를 넣을 자리가 실제로 있다** — 가이드 시나리오 3 의 `Checkout(String plan)` 이 바로 그 모양이다. 자리가 있는데 위반이 없으므로 ✅ 이지 「해당 없음」이 아니다.

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

**근거**: `ContainerAssignment.java:79`, `130-131` 라인

```java
    record Cargo(String id, String goods, ContainerSpec storageSpec) {
...
        Cargo meatV2 = new Cargo(meat.id(), meat.goods(),
                and(meat.storageSpec(), new HumidityAtMost(60)));
```

**해설**: `Cargo` 가 record 라 `storageSpec` 이 `final` 이고 setter 가 없다. 규칙을 더할 때도 새 `Cargo` 를 만든다. 가이드가 「이 연산이 없어도 1~3번을 만족하면 Strategy 입니다」라고 명시하므로 종합 판정에 반영하지 않는다. **다만 이 ❌ 가 State 후보를 떨어뜨린 근거와 같은 자리다**(State 3번은 이것을 `[필수]` 로 요구한다).

---

### 조건 6. [선택] 여러 Context 가 공유하는 전략 객체는 호출 사이에 값을 남기지 않습니다
**판정**: ✅ 충족

**근거**: `ContainerAssignment.java:16-21` 라인

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

Java 16 이후의 `record` 가 이 구조와 잘 맞는다. 전략(명세) 객체를 record 로 두면 조건 6번(공유 전략의 무상태)이 언어 수준에서 보장되고, `equals`/`hashCode` 가 값 기준으로 생겨 같은 규칙을 만든 두 객체를 비교할 수 있다.

**`record` 선택이 후보 둘을 갈랐다.** 필드가 `final` 이라 Strategy 조건 5번(설치 연산)을 쓸 수 없고, 그 결과로 State `[필수]` 3번이 자동으로 막힌다. `Cargo` 를 가변 클래스로 바꾸고 `setStorageSpec` 을 더하면 State 셋이 모두 ✅ 가 되어 동시 통과가 넷에서 다섯으로 는다.

`sealed interface ContainerSpec permits ...` 로 바꾸면 구현체 목록이 닫히는데, 그렇게 하면 쓰는 쪽에서 패턴 매칭으로 종류를 가를 수 있게 되어 조건 2번의 「타입 검사·다운캐스트 금지」를 어기기 쉬워진다.

## 테스트 / 동작 검증

**정적 분석만 수행.** SKILL.md 4단계의 안전한 실행 조건 넷 가운데 셋째가 안 맞는다 — 대상 파일이 가이드 폴더(`pattern-guide/design-pattern-guide/specification/code/`)에 있어 `Makefile` 에 대응 타깃이 없다(「분석 대상이 가이드 폴더의 파일이면 Makefile 타깃이 없으므로 실행 단계를 생략한다」). 진입점(`public static void main`, 113 줄)은 있고 네트워크·파일시스템 변경·외부 명령도 없다. 같은 폴더의 `expected-output.txt` 는 읽지 않았고 근거로 쓰지 않았다.

## 권장 조치 (우선순위 순)

1. **부르는 이름을 팀이 정한다 — 코드는 고칠 것이 없다.** 세 이름이 다 맞으므로 「무엇으로 부를까」만 남는다. 두 가이드가 같은 기준을 준다 — Specification 편은 「그 객체가 도메인에서 무엇으로 불리는가」, 의존성 주입 편은 「그 코드를 읽는 사람이 무엇을 더 알게 되는가」다.

   ```java
   // before — 부르는 이름이 정해지지 않은 상태
   record Cargo(String id, String goods, ContainerSpec storageSpec) { ... }

   // after — 이름을 도메인 어휘로 고정 (구조 변경 없음)
   /** storageSpec 은 이 화물의 보관 요건(Specification)이다.
    *  같은 객체를 검증(fits)과 선택(ContainerYard.matching) 양쪽에 넘기고,
    *  다른 기준과 합쳐 새 화물에 다시 적용한다.
    *  구조상 Strategy 이기도 하고 의존성 주입이기도 하다 — 원전이 그 겹침을 인정한다. */
   record Cargo(String id, String goods, ContainerSpec storageSpec) { ... }
   ```

2. **Strategy 로만 읽히길 원한다면 반환을 판정이 아닌 값으로 바꾼다** — Specification `[필수]` 1번이 「판정 자리에 계산값·정렬 키·변환 결과가 오면 이 조건이 아니에요」라고 적으므로, 이것이 두 이름을 가르는 유일한 구조 조작이다. 다만 그러면 `AndSpec`·`OrSpec`·`NotSpec` 이 뜻을 잃는다(Specification 편 시나리오 3 의 1단계가 세 언어 모두 컴파일 실패로 확인한 자리).

   ```java
   // before
   interface ContainerSpec { boolean isSatisfiedBy(Container candidate); }

   // after — Strategy 로만 읽히지만 논리곱·논리합·부정이 무너진다
   interface ContainerScorer { int scoreFor(Container candidate); }
   ```

3. **조치 없음도 정답이다** — 이 코드는 어느 조건도 어기지 않았다. 위 둘은 이름을 고르는 선택지이지 결함 수정이 아니다.

## 추가 코멘트

### 고친 계약이 작동한 자리

- **경로 B·C 가 겹쳐서 Specification 을 데려왔다.** 표 한 줄이 빠져도 발행 순서 규칙이 잡고, 발행 순서 규칙이 없어도 표가 잡는다. 고치기 전에는 세 경로 모두 놓쳤다.
- **「GoF 패턴」 한정을 걷은 것이 결정적이다.** 이 재시험에서 `[필수]` 를 전부 통과한 넷 가운데 **둘(Specification · 의존성 주입)이 GoF 23편 밖**이다. 옛 문면이었다면 둘 다 후보 자격에서 빠져 동시 통과가 절반으로 줄었다.
- **후보 쪽 비교 절 규칙이 가르는 문장을 찾아 주었다.** 통과한 후보 넷의 가르는 문장이 **전부 후보 쪽에만** 있었다 — Strategy 편은 넷 가운데 하나도 이름을 대지 않는다.
- **「둘 다 맞음」 어휘가 정답을 「못 갈랐다」로 적지 않게 했다.** 옛 어휘로는 「동시 통과 — 판정 보류」밖에 없어, 두 가이드가 「모순이 아니라 정답」이라 적은 것을 분석기가 실패로 적게 됐다.

### 재시험이 새로 드러낸 것

- **후보 부채질(fan-out)이 크다.** 후보가 셋에서 **열**로 늘었다. 경로 C 는 「Strategy 를 비교 절에서 다루는 늦게 나온 편」을 전부 데려오는데, 이 저장소에서는 그것이 열 편이다. Strategy 처럼 다른 편들이 자주 대조 상대로 삼는 패턴일수록 후보가 많아진다. 계약이 틀린 것은 아니지만 한 번 묻는 데 드는 품이 눈에 띄게 늘었다.
- **경로 C 의 「다루는」이 문면에 정의돼 있지 않다.** 단순히 이름이 나오는 편을 세면 열한 편이고(`Interpreter` 편이 본문에서만 Strategy 를 언급한다), 비교 절의 **굵은 갈래 머리**(`**Strategy 와의 …**`)로 세면 열 편이다. 이 리포트는 5단계 1)이 경로 A 에서 쓰는 방법(「그 굵은 머리에서 이름을 뽑고」)을 경로 C 에도 그대로 적용했다. **문면에 그렇게 하라고 적혀 있지는 않다** — 한 줄 덧붙이면 읽기가 갈리지 않는다.
- **동시 통과가 넷이면 비교 절 대조도 넷이다.** 6단계 판정 표는 후보 **하나**를 전제로 쓰여 있어(「경쟁 후보도 필수 모두 ✅ + 비교 절이 …」), 후보 넷이 **서로 다른 답**을 줄 때(둘은 Strategy 지정, 둘은 둘 다 맞음) 어떻게 묶는지는 적혀 있지 않다. 이 리포트는 「Strategy 를 지정한 후보는 이름 후보에서 빠지고, 둘 다 맞다고 적은 후보는 이름 후보로 남는다」로 묶었다. 합리적이지만 **문면이 정해 준 것이 아니라 이 리포트가 정한 것**이다.
- **동시 통과 표에 줄 셋이 더 설 수 있다.** `Strategy ↔ Bridge` · `Strategy ↔ Decorator` · `Strategy ↔ 의존성 주입` 이다. 셋 다 등록 조건(「컴파일되고 실행되는 코드를 실제로 지어야 한 줄이 선다」)을 이 파일이 이미 충족한다. 다만 **줄을 더할지는 사람이 정할 일**이라 이 리포트는 사실만 적고 표를 고치지 않았다(스킬 파일은 읽기만 했다).

---

## 참고

- 평가 기준 원문: `pattern-guide/design-pattern-guide/strategy/strategy-guide_v1.1.0.md` (최소 조건 절 239~299 줄 · 비교 절 300~413 줄)
- 후보 기준 원문 (열 편): `specification/specification-guide_v1.0.0.md` · `state/state-guide_v1.0.0.md` · `bridge/bridge-guide_v1.0.0.md` · `decorator/decorator-guide_v1.0.0.md` · `dependency-injection/dependency-injection-guide_v1.0.0.md` · `flyweight/flyweight-guide_v1.0.0.md` · `null-object/null-object-guide_v1.0.0.md` · `template-method/template-method-guide_v1.0.0.md` · `command/command-guide_v1.0.0.md` · `visitor/visitor-guide_v1.0.0.md`
- 고치기 전 기록: `analysis/strategy-ContainerAssignment-20260930-1735.md`
- 분석 skill: `.claude/skills/design-pattern-analyzer/`
