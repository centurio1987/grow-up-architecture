# Factory Method 패턴 부합도 분석

| 항목 | 값 |
| --- | --- |
| 분석 대상 | `pattern-guide/design-pattern-guide/abstract-factory/code/ReportApp.java` |
| 언어 | Java |
| 분석 일시 | 2026-09-30 17:42 |
| 평가 기준 출처 | `pattern-guide/design-pattern-guide/factory-method/factory-method-guide_v1.0.0.md` (status: published, 같은 폴더의 v0.1.0 보다 높은 버전) |
| 코드 라인 수 | 197 |

## 종합 판정

**Factory Method 아님 — 비교 절의 기준으로 Abstract Factory**

`[필수]` 1·2·4 번은 ✅ 지만 **3·5 번은 ✅ 가 아니라 「해당 없음」**이다. 두 조건이 재는 「Creator 의 제품을 쓰는 상위 로직」이 이 코드의 Creator(`ReportKit` 계층)에 아예 없어서 위반할 자리 자체가 없다. SKILL.md 3단계가 정한 대로 「위반 사례가 없다」를 ✅ 로 읽지 않았고, 그래서 5단계 경쟁 후보 대조를 밟았다. 대조 결과 Abstract Factory 가 `[필수]` 다섯을 전부 통과했고, Factory Method 편의 비교 절이 이 자리를 직접 갈라 준다.

> 그래서 이 코드가 둘 중 무엇이냐고 물을 때는 무엇을 보고 있는지를 밝히면 됩니다. **제품 하나를 만드는 연산 한 개를 보면 팩토리 메서드이고, 그 연산들을 묶어 한 계열을 책임지는 객체 전체를 보면 Abstract Factory 예요.**
> — `factory-method/factory-method-guide_v1.0.0.md` 320 줄, 비교 절 「Abstract Factory 와의 차이」

사용자가 댄 대상은 연산 하나가 아니라 파일 전체, 곧 「그 연산들을 묶어 한 계열을 책임지는 객체」(`ReportKit`·`MarkdownKit`·`HtmlKit`·`TextKit`)이므로 **Abstract Factory** 쪽이다.

---

## 경쟁 후보 대조

후보를 세운 근거(SKILL.md 5단계 1)):

1. **채점 순서 문단** — Factory Method 편의 문단은 「1번과 2번을 앞에 둔 데는 이유가 있습니다 …」로 끝나고 「필수를 다 갖췄다고 판정이 끝나는 것은 아니다」를 적지 않는다. **이 경로로는 5단계가 강제되지 않는다.**
2. **비교 절** — 굵은 머리에서 뽑은 이름: **Abstract Factory** · **Template Method** · **Prototype**. 「Simple Factory·정적 생성 메서드」는 GoF 패턴이 아니라 관용구이므로 후보에서 뺐다(5단계 「패턴이 아닌 갈래는 후보가 아니다」) — 대신 해설에 쓴다.
3. **동시 통과가 확인된 쌍 표** — `Factory Method ↔ Abstract Factory` 양방향, 「서는 모양 ①」이 **정확히 이 코드**다(「정통 AF — 구체 팩토리에 제품을 쓰는 상위 로직이 없어 FM 3·5번이 잴 대상 없이 참」). 표에 오른 상대부터 보라는 지시에 따라 Abstract Factory 를 먼저 채점했다.
4. **3단계의 「해당 없음」 규칙** — `[필수]` 에 「해당 없음」이 있으므로 5단계가 **강제**된다. 실제로 이 경로가 5단계를 부른 유일한 경로다.

| 후보 패턴 | 후보의 `[필수]` 결과 | 판정 |
| --- | --- | --- |
| Abstract Factory (`abstract-factory/abstract-factory-guide_v1.0.0.md`) | ✅ 1·2·3·4·5 (전부) | **동시 통과** |
| Template Method (`template-method/template-method-guide_v1.0.0.md`) | ❌ 1 | 탈락 |
| Prototype (`prototype/prototype-guide_v1.0.0.md`) | ❌ 1 | 탈락 |

**Abstract Factory 채점 근거** (참여자 고정: AbstractFactory=`ReportKit`, ConcreteFactory=`MarkdownKit`·`HtmlKit`·`TextKit`, AbstractProduct=`Heading`·`Table`, 제품을 쓰는 쪽=`ReportWriter`)

- 1번 ✅ — `ReportWriter` 의 필드·생성자 인자가 `ReportKit`(161·163 줄)이고, 제품은 `kit.createHeading` · `kit.createTable` 호출로만 얻는다(168~169).
- 2번 ✅ — `ReportKit` 이 서로 다른 추상 제품 타입을 반환하는 생성 연산 둘을 선언한다(`Heading` 12 줄, `Table` 14 줄).
- 3번 ✅ — 두 생성 연산의 반환 타입 자리에 구체 제품 클래스 이름이 없다.
- 4번 ✅ — 계열마다 구체 팩토리가 따로 있고(124·136·148), 각 구체 팩토리 안에 계열을 고르는 분기가 없으며 `new` 하는 구체 클래스가 한 계열로 묶인다(`MarkdownKit` → `MarkdownHeading`·`MarkdownTable`).
- 5번 ✅ — `ReportWriter` 에 `new ConcreteProduct` 와 구체 제품 타입 변수 선언이 없다. 구체 팩토리를 만드는 문장은 `ReportApp.chooseKit`(175~182), 곧 고르는 자리 한 곳에만 있다 — 5번이 명시적으로 허용하는 모양이다.

**Template Method 를 떨어뜨린 조건**: 1번 「상위 타입에 단계들의 호출 차례를 고정한 연산이 있습니다 — 그 연산의 본문이 상위 타입 안에 완성돼 있고」. `ReportKit` 은 본문 있는 연산이 없는 인터페이스다(11~15). `ReportWriter.write`(167~171)가 차례를 담고 있지만 `ReportWriter` 는 `final` 이고 단계를 채우는 하위 타입이 없어 상위 타입이 아니다. ❌.

**Prototype 을 떨어뜨린 조건**: 1번 「복제 연산이 추상 타입 수준에 선언되고, 그 반환 타입도 그 추상 타입입니다」. 코드 어디에도 자기와 같은 타입을 돌려주는 복제 연산이 없다(`createHeading` 은 `ReportKit` 이 아니라 `Heading` 을 돌려준다). ❌.

**가르는 근거**: 위 종합 판정에 인용한 문장. 같은 절이 코드에서 볼 자리도 지정한다 — 「코드에서는 생성 연산이 `this` 의 메서드인지 필드로 들고 있는 다른 객체의 메서드인지를 보면 돼요.」 그 자리를 실제로 읽었다.

```java
final class ReportWriter {
    private final ReportKit kit;                       // 161 — 필드로 들고 있는 다른 객체
...
        Heading heading = kit.createHeading(title);     // 168 — kit. 이 앞에 붙는다
        Table table = kit.createTable(headers, rows);   // 169
```

`createHeading` 앞에 `kit.` 이 있다. 가이드의 Factory Method 쪽 예시(`PaySlip slip = createSlip(...)`)에는 앞에 아무것도 없다. 게다가 제품 종류가 `Heading`·`Table` 둘이라 비교 표의 「제품 종류: 1종 ↔ 2종 이상」 행도 Abstract Factory 를 가리킨다.

**가른 결과**: **Abstract Factory**.

---

## 조건별 평가

참여자 고정(SKILL.md 3단계) — 조건을 채점하기 전에 Factory Method 의 참여자를 다음으로 정하고, 다섯 조건 모두를 이 집합에 대해 읽었다.

| 참여자 | 코드의 대상 |
| --- | --- |
| Product (추상) | `Heading`(3~5) · `Table`(7~9) |
| ConcreteProduct | `MarkdownHeading`·`MarkdownTable`·`HtmlHeading`·`HtmlTable`·`TextHeading`·`TextTable` |
| Creator | `ReportKit`(11~15) — 생성 연산을 선언한 타입 |
| ConcreteCreator | `MarkdownKit`(124) · `HtmlKit`(136) · `TextKit`(148) |
| Creator 의 「제품을 쓰는 상위 로직」 | **없음** — 아래 조건 3·5 의 「해당 없음」 사유 |

- **부차 참조**: `ReportWriter`(160~172)가 제품을 쓰는 상위 로직을 들고 있다. 그러나 `ReportWriter` 는 생성 연산을 선언하지도 재정의하지도 않고 `ReportKit` 을 **필드로 받아 든 별개 객체**다. 그래서 Creator 로 고르지 않았다. 이 분리가 곧 이 코드가 Factory Method 가 아니라는 신호다.
- **참여자 고정의 애매함(계약 문제)**: Factory Method 의 Creator 는 ① 생성 연산을 선언하고 ② 제품을 쓰는 상위 로직을 담는 **두 일을 한 타입이** 한다는 전제로 조건이 쓰여 있다. 이 코드에서는 ①이 `ReportKit`, ②가 `ReportWriter` 로 갈라져 있고, **SKILL.md 3단계에는 생성 패턴의 참여자를 고르는 방법이 없다.** `ReportWriter` 를 Creator 로 잡으면 2·4번이 ❌ 라 「패턴 아님」으로 즉시 끝나고, `ReportKit` 을 잡으면 3·5번이 「해당 없음」이 되어 5단계로 간다. 두 읽기의 경로가 다르다 — 이 리포트는 「생성 연산을 선언한 타입」쪽을 Creator 로 고정했다.

### 조건 1. [필수] 생성 연산의 반환 타입이 추상 Product 입니다
**판정**: ✅ 충족

**근거**: `ReportApp.java:3-15` 라인

```java
interface Heading {
    String render();
}

interface Table {
    String render();
}

interface ReportKit {
    Heading createHeading(String text);

    Table createTable(List<String> headers, List<List<String>> rows);
}
```

**해설**: 두 생성 연산의 선언된 반환 타입이 인터페이스 `Heading`·`Table` 이고, 각각을 구현한 클래스가 셋씩 있다(17·30·52·65·92·105 줄). 구체 클래스 이름이 반환 타입 자리에 없다.

**이름 의존 조건**: 아니오 — 연산 이름 `create*` 가 아니라 선언된 반환 타입으로 판정했다.

---

### 조건 2. [필수] 생성 연산이 Creator 의 재정의할 수 있는 인스턴스 연산입니다
**판정**: ✅ 충족

**근거**: `ReportApp.java:11-15`, `124-134` 라인

```java
interface ReportKit {
    Heading createHeading(String text);
    Table createTable(List<String> headers, List<List<String>> rows);
}
...
final class MarkdownKit implements ReportKit {
    @Override
    public Heading createHeading(String text) {
        return new MarkdownHeading(text);
    }
```

**해설**: 두 연산 모두 `static` 이 아닌 객체에 매인 연산이고 인터페이스의 추상 메서드라 봉인이 없다. 가이드가 조건 2번에서 「Rust 에서는 trait 의 필수 메서드입니다」라고 적으므로 Java 인터페이스의 추상 메서드가 같은 자리다. 실제로 `@Override` 로 재정의된 구현이 셋 있다.

**이름 의존 조건**: 아니오.

---

### 조건 3. [필수] Creator 의 상위 로직은 제품을 그 생성 연산으로만 얻습니다
**판정**: **해당 없음** (✅ 아님 — 잴 대상이 없어서 참이 된 조건)

**근거**: `ReportApp.java:124-158` 라인 — Creator 계층 전체

```java
final class MarkdownKit implements ReportKit {
    @Override
    public Heading createHeading(String text) {
        return new MarkdownHeading(text);
    }

    @Override
    public Table createTable(List<String> headers, List<List<String>> rows) {
        return new MarkdownTable(headers, rows);
    }
}
```

**왜 잴 대상이 없는가**: `ReportKit` 과 세 구체 팩토리에는 **제품을 쓰는 메서드가 하나도 없다.** 생성 연산 둘이 전부이고, 그 본문은 만들어 돌려주기만 한다. `render()` 를 부르는 코드는 Creator 가 아니라 `ReportWriter.write`(170 줄)에 있다. 조건이 금지하는 코드(「제품을 쓰는 메서드 안의 `new ConcreteProduct`」)를 이 클래스들에 넣을 자리 자체가 없으므로 공허한 참이다.

**가이드가 같은 자리를 짚는다**: 「다만 3번은 이 자리에서 잴 것이 없습니다. 팩토리 객체는 제품을 만들어 넘길 뿐, 시나리오 1 의 2단계에서 `run` 이 하던 것처럼 제품을 쓰는 상위 로직을 자기 안에 두지는 않거든요.」(`factory-method-guide_v1.0.0.md` 320 줄)

**이름 의존 조건**: 아니오.

---

### 조건 4. [필수] 제품 클래스를 고르는 결정이 Creator 의 서브클래스 쪽에 있습니다
**판정**: ✅ 충족

**근거**: `ReportApp.java:124-158` 라인

```java
final class HtmlKit implements ReportKit {
    @Override
    public Heading createHeading(String text) {
        return new HtmlHeading(text);
    }
...
final class TextKit implements ReportKit {
    @Override
    public Heading createHeading(String text) {
        return new TextHeading(text);
    }
```

**해설**: 생성 연산을 재정의한 ConcreteCreator 가 셋 있고, 어느 구체 제품을 만들지가 그 재정의 안에서만 정해진다. 조건 문면 그대로는 충족이다.

**주의**: 이 ✅ 는 Abstract Factory 의 구체 팩토리에도 그대로 선다. SKILL.md 5단계의 동시 통과 표가 「Abstract Factory 의 생성 연산 하나하나가 흔히 팩토리 메서드로 구현된다」를 든 자리이고, 이 조건 하나로 두 패턴을 가를 수 없다.

**이름 의존 조건**: 아니오.

---

### 조건 5. [필수] 상위 로직이 제품의 구체 타입으로 갈라지지 않습니다
**판정**: **해당 없음** (✅ 아님 — 잴 대상이 없어서 참이 된 조건)

**근거**: `ReportApp.java:124-158` 라인 — 조건 3과 같은 자리

**왜 잴 대상이 없는가**: 이 조건이 재는 것은 「상위 로직에 타입 검사나 다운캐스트가 없는가」인데, Creator 계층에 상위 로직이 없어서 `instanceof` 나 캐스트를 넣을 자리가 없다. 세 구체 팩토리의 본문은 `return new ...;` 한 줄씩뿐이다.

**참고**: 상위 로직이 있는 `ReportWriter.write`(167~171)를 대신 재면 그 메서드에도 타입 검사·다운캐스트가 없어 ✅ 다. 그러나 `ReportWriter` 는 고정한 Creator 가 아니므로 **조건마다 참여자를 갈아 끼우지 말라는 3단계 규칙에 따라 그 결과를 이 칸에 쓰지 않았다.** 갈아 끼우면 이 코드가 Factory Method `[필수]` 다섯을 전부 ✅ 로 통과한다 — 3단계가 막으려는 것이 바로 이 경로다.

**이름 의존 조건**: 아니오.

---

### 조건 6. [선택] Creator 가 생성 연산에 기본 구현을 둡니다
**판정**: ❌ 미충족 — `ReportKit` 의 두 연산 모두 본문 없는 추상 선언이다(11~15). 종합 판정에 반영하지 않는다.

### 조건 7. [선택] 생성 연산이 만들 제품을 식별하는 인자를 받습니다
**판정**: ❌ 미충족 — `createHeading(String text)` 의 인자는 제품 종류가 아니라 제품에 담을 내용이다. 종류는 연산 이름으로 갈린다.

### 조건 8. [선택] 생성 연산이 Creator 의 template method 안에서 불립니다
**판정**: ❌ 미충족 — 생성 연산이 불리는 자리는 Creator 밖의 `ReportWriter.write`(168~169)이고, 그 메서드는 순서가 상위 클래스에 고정된 연산이 아니다(`ReportWriter` 는 `final` 이고 상위 타입이 없다).

---

## 언어 관용구 측면

Java 에서 이 모양은 인터페이스 하나와 구현 셋으로 서는 표준 구성이다. `ReportKit` 을 `sealed interface ReportKit permits MarkdownKit, HtmlKit, TextKit` 으로 닫으면 계열 목록이 타입 수준에서 보장되지만, 그 순간 Factory Method 조건 2번(재정의가 막혀 있지 않을 것)이 밖에서는 깨진다 — 두 패턴이 요구하는 개방성의 방향이 반대라는 것을 언어가 드러내는 자리다.

제품 종류가 하나뿐이었다면 `ReportKit` 인터페이스와 `ReportWriter` 의 주입 경로가 없어도 되고, `ReportWriter` 를 추상 클래스로 두어 `createHeading` 만 하위에서 채우는 진짜 Factory Method 가 된다.

## 테스트 / 동작 검증

**정적 분석만 수행.** 대상 파일이 가이드 폴더(`pattern-guide/design-pattern-guide/abstract-factory/code/`)에 있어 `Makefile` 에 대응 타깃이 없다(SKILL.md 4단계). `public static void main` 은 있으나 실행 조건 셋째(Makefile 타깃 존재)를 못 맞춘다.

## 권장 조치 (우선순위 순)

1. **이 코드를 Factory Method 라고 부르지 않는다** — 구조를 바꿀 것이 없다. 부르는 이름만 Abstract Factory 로 잡으면 된다. Factory Method 로 읽고 싶다면 제품을 쓰는 상위 로직을 Creator 계층 안으로 들여야 하는데, 그러면 제품군 일관성을 한 객체가 책임지던 지점을 잃는다.

   ```java
   // before — 제품을 쓰는 로직이 팩토리 밖에 있다 (Abstract Factory)
   final class ReportWriter {
       private final ReportKit kit;
       String write(...) {
           Heading heading = kit.createHeading(title);   // kit. 이 앞에 붙는다
           ...
       }
   }

   // after — Factory Method 로 만들려면 상위 로직과 생성 연산이 한 계층에 있어야 한다
   abstract class ReportWriter {
       final String write(String title, ...) {
           Heading heading = createHeading(title);       // this 의 메서드
           return heading.render() + "\n" + createTable(headers, rows).render();
       }
       protected abstract Heading createHeading(String text);
       protected abstract Table createTable(List<String> headers, List<List<String>> rows);
   }
   final class MarkdownWriter extends ReportWriter { /* 두 연산 재정의 */ }
   ```
   다만 이렇게 바꾸면 제품 종류가 둘이라 「같은 계열끼리만 나오게」 강제할 자리가 사라진다 — 하위 클래스가 짝 맞게 재정의해 주기를 바라는 수밖에 없다(가이드 비교 절이 짚는 대가).

2. **`ReportApp.chooseKit` 의 `switch` 를 Simple Factory 로 인정한다** — 175~182 줄은 `static` 이고 종류를 문자열로 가른다. Factory Method 조건 2번에서 빠지는 전형적인 모양이지만, **이것은 결함이 아니다.** Abstract Factory 조건 5번이 「구체 팩토리를 만드는 문장은 그것을 고르는 자리에만 있습니다」로 이 한 곳을 명시적으로 허용한다. 고칠 필요가 없고, 다만 이 메서드만 떼어 보고 Factory Method 라고 부르지는 않는다.

3. **조치 없음** — 조건 3·5 의 「해당 없음」은 이 코드의 결함이 아니라 **다른 패턴의 코드를 Factory Method 자로 잰 결과**다.

## 추가 코멘트

- **이 리포트가 드러낸 계약의 빈자리 (1)**: SKILL.md 3단계에 **생성 패턴의 참여자를 고르는 방법이 없다.** 「감싸는 패턴」과 「가운데 객체 패턴」의 요령만 있고, Creator 처럼 **두 역할(생성 연산 선언 + 제품 사용 로직)이 한 타입에 있다고 전제된 참여자**를 코드가 둘로 쪼개 놓았을 때 어느 쪽을 잡을지는 적혀 있지 않다. `ReportKit` 을 잡으면 5단계로 가고 `ReportWriter` 를 잡으면 「패턴 아님」으로 즉시 끝난다 — 경로가 갈린다.
- **이 리포트가 드러낸 계약의 빈자리 (2)**: 6단계 판정 표에 **「비교 절이 후보 쪽으로 갈랐다」를 담을 칸이 없다.** 표는 「비교 절의 판정을 따름」이라고만 적는데, 그 판정이 「사용자가 댄 패턴이 아니라 후보 패턴이다」일 때 쓸 이름이 종합 판정 어휘({정통 / 변형 / 패턴 아님 / 판정 보류 / 동시 통과 — 판정 보류})에 없다. 「패턴 아님」 행은 「필수 중 ❌ 가 1개 이상」이라 이 경우와 조건이 다르다. 이 리포트는 「Factory Method 아님 — 비교 절의 기준으로 Abstract Factory」로 적었다.
- **3단계 규칙이 실제로 작동한 자리**: 조건 5의 참고 문단이 그 증거다. 참여자를 갈아 끼워 `ReportWriter` 를 상위 로직으로 대면 3·5번이 ✅ 가 되어 이 코드가 Factory Method `[필수]` 다섯을 전부 통과한다. 「조건마다 다른 참여자를 대는 판정은 무효다」가 그 경로를 막았다.

---

## 참고

- 평가 기준 원문: `pattern-guide/design-pattern-guide/factory-method/factory-method-guide_v1.0.0.md` (최소 조건 절 215~264 줄 · 비교 절 265~368 줄)
- 후보 기준 원문: `pattern-guide/design-pattern-guide/abstract-factory/abstract-factory-guide_v1.0.0.md` · `.../template-method/template-method-guide_v1.0.0.md` · `.../prototype/prototype-guide_v1.0.0.md`
- 분석 skill: `.claude/skills/design-pattern-analyzer/`
