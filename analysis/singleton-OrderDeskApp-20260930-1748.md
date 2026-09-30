# Singleton 패턴 부합도 분석

| 항목 | 값 |
| --- | --- |
| 분석 대상 | `pattern-guide/design-pattern-guide/singleton/code/OrderDeskApp.java` |
| 언어 | Java |
| 분석 일시 | 2026-09-30 17:48 |
| 평가 기준 출처 | `pattern-guide/design-pattern-guide/singleton/singleton-guide_v1.0.0.md` (status: published, 같은 폴더의 v0.1.0 보다 높은 버전) |
| 코드 라인 수 | 77 |

## 종합 판정

**정통 패턴 (선택 조건 보강 권장)**

`[필수]` 1·2·3 번이 모두 ✅ 이고 「해당 없음」이 하나도 없다. 5단계 경쟁 후보 대조를 밟았고, 후보 둘 모두 `[필수]` 에서 떨어져 동시 통과가 아니다. `[선택]` 6·7 번이 ❌ 지만 SKILL.md 6단계에 따라 종합 판정을 깎지 않고 권장 조치로만 올린다.

결정타는 세 조건이 각각 다른 자리에서 서로 다른 것을 재고 셋 다 만족했다는 점이다 — 생성자의 공개 범위(22 줄), 보관 자리의 소속(17 줄), 접근점의 반환값(27~32 줄).

---

## 경쟁 후보 대조

후보를 세운 근거(SKILL.md 5단계 1)):

1. **채점 순서 문단** — Singleton 편의 문단은 「`[필수]` 는 하나만 빠져도 판정이 끝나므로 1번부터 차례로 봅니다 …」로 시작해 유일성의 범위 표로 이어지고, 「필수를 다 갖췄다고 판정이 끝나는 것은 아니다」를 **적지 않는다.** 이 경로로는 5단계가 강제되지 않는다.
2. **비교 절** — 굵은 머리 넷: 「전역 변수」 · 「정적 유틸리티 클래스」 · 「의존성 주입 컨테이너의 단일 스코프」 · 「Flyweight」. 절 머리글이 「앞의 둘은 패턴이 아니라 코드 모양이고, 나머지 둘은 프레임워크가 주는 기능과 GoF 패턴이에요」라고 스스로 갈라 준다. GoF 패턴은 **Flyweight** 하나다.
3. **동시 통과가 확인된 쌍 표** — Singleton 은 표의 여덟 쌍 어디에도 없다. 표에서 오는 후보는 없다.

| 후보 패턴 | 후보의 `[필수]` 결과 | 판정 |
| --- | --- | --- |
| Flyweight (`flyweight/flyweight-guide_v1.0.0.md`) | ✅ 1 / ❌ 3 | **탈락** |
| 의존성 주입 (`dependency-injection/dependency-injection-guide_v1.0.0.md`) — 계약상 후보 자격이 애매해 추가로 채점 | ❌ 1 / ❌ 2 | **탈락** |

**Flyweight 를 떨어뜨린 조건**: 3번 「공유 대상은 팩토리 역할의 연산으로만 얻고, 같은 키에는 같은 객체가 돌아옵니다 — … **키를 받는 연산 하나가** 보관 자리를 확인해 있으면 그대로 돌려주고 없으면 만들어 넣습니다.」

```java
    static synchronized OrderNumberIssuer instance() {   // 27 — 매개변수가 없다
        if (uniqueInstance == null) {
            uniqueInstance = new OrderNumberIssuer();
        }
        return uniqueInstance;
    }
```

`instance()` 는 인자를 하나도 받지 않아 키가 없다. 보관 자리도 맵이 아니라 단일 필드다(17 줄). 그래서 「같은 키에는 같은 객체」를 잴 수가 없고, 키별 공유가 성립하지 않는다. ❌.

- Flyweight 1번은 ✅ 였다 — `OrderNumberIssuer` 의 필드 `prefix`·`issued` 는 어느 창구가 부르든 같은 값이고, 부르는 자리를 가리키는 값(위치·소유자·인덱스)이 없다. 창구별 값 `channel` 은 `OrderDesk` 쪽에 있다(47 줄).
- Flyweight 2번은 **잴 대상이 없었다** — 1번대로 자리마다 달라지는 값이 아예 없으므로 그것을 인자로 넘길 일이 없다(`next()` 도 인자가 없다). 3번이 이미 ❌ 라 판정이 끝났으므로 이 칸은 판정에 쓰지 않았다. **다만 SKILL.md 5단계에는 「후보의 `[필수]` 에 「해당 없음」이 섞였을 때」를 다루는 규칙이 없다**(3) 은 「후보도 전부 ✅ 면」, 4) 는 「후보가 하나라도 ❌ 면」만 다룬다). 이 코드에서는 3번의 ❌ 가 그 빈틈을 덮었다.

**의존성 주입을 떨어뜨린 조건**: 1번과 2번 둘 다.

```java
final class OrderDesk {
    final OrderNumberIssuer issuer;          // 45 — 구현 타입으로 들었다 (1번 빠짐)
...
    OrderDesk(String channel) {
        this.channel = channel;
        this.issuer = OrderNumberIssuer.instance();   // 51 — 전역 접근점을 불러 찾아온다 (2번 빠짐)
    }
```

의존 객체를 `OrderDesk` 로 잡으면 협력 객체를 `final class OrderNumberIssuer` 라는 구체 구현 타입으로 들어 1번이 빠지고, 생성자 안에서 전역 접근점을 불러 찾아오므로 2번이 빠진다. Singleton 편 비교 절의 기준(「유일성을 누가 지키는가. 코드에서는 그 클래스의 생성자가 열려 있는지를 봄」)과 같은 방향이다 — 여기서는 생성자가 닫혀 있으므로 컨테이너 스코프가 아니라 Singleton 이다.

**계약상 애매한 자리**: SKILL.md 5단계 1)은 「비교 절이 이름을 대는 **GoF 패턴**이 후보다」라고 적고, 패턴이 아닌 갈래를 빼는 이유로 「그것들은 채점할 최소 조건 절을 갖지 않으므로」를 든다. 의존성 주입은 GoF 가 아니지만 **발행된 가이드에 채점할 최소 조건 절이 있다**(`dependency-injection-guide_v1.0.0.md`, status: published). 규칙과 그 이유가 서로 다른 답을 내므로 양쪽 다 밟아 두었고, 결과는 어느 읽기로도 같다(탈락).

**동시 통과 없음** — 후보가 전부 `[필수]` 에서 떨어졌으므로 「가르는 근거」 칸은 채우지 않는다. 사용자가 댄 Singleton 이 그대로 종합 판정이다.

---

## 조건별 평가

참여자 고정(SKILL.md 3단계) — 조건을 채점하기 전에 다음으로 정하고, 세 조건 모두를 이 대상에 대해 읽었다.

| 참여자 | 코드의 대상 |
| --- | --- |
| Singleton | `OrderNumberIssuer`(16~42) |
| 접근점 | `OrderNumberIssuer.instance()`(27~32) |
| 보관 자리 | `private static OrderNumberIssuer uniqueInstance`(17) |
| Client | `OrderDesk`(44~57) · `OrderDeskApp.main`(63~76) |

- **부차 참조**: `ShopConfig`(1~14)는 생성자가 닫혀 있지만 인스턴스를 보관하지도 돌려주지도 않는 정적 유틸리티다. 최소 조건 절 끝의 반례 `OrderNumbers` 와 같은 모양이고, 비교 절 「정적 유틸리티 클래스와의 차이」가 다루는 자리다. **Singleton 후보로 세지 않았다** — 조건 2·3 이 요구하는 것이 값이 아니라 객체이기 때문이다. `OrderNumberIssuer` 가 생성자에서 이것을 읽는 것(23 줄)은 초기화 입력일 뿐이다.
- **부차 참조**: `OrderDeskApp` 자신도 `private` 생성자를 가진 `final` 클래스다(59~61). 인스턴스를 보관·반환하지 않으므로 진입점이지 Singleton 이 아니다.

### 조건 1. [필수] 바깥에서 그 타입의 인스턴스를 새로 만들 수 없습니다
**판정**: ✅ 충족

**근거**: `OrderDeskApp.java:16-25` 라인

```java
final class OrderNumberIssuer {
    private static OrderNumberIssuer uniqueInstance;

    private final String prefix;
    private long issued;

    private OrderNumberIssuer() {
        this.prefix = ShopConfig.branchCode();
        this.issued = 0;
    }
```

**해설**: 생성자가 `private` 이라 `OrderNumberIssuer` 클래스 바깥에서 `new OrderNumberIssuer()` 를 쓸 수 없다. 가이드가 인정하는 다섯 수단 가운데 첫째(「생성자를 비공개나 하위 타입 전용으로 두는 것」)에 해당한다. 클래스가 `final` 이라 하위 타입을 통한 우회도 없다.

**「해당 없음」 검사**: 이 조건은 「~할 수 없습니다」 꼴이지만 잴 대상이 있다 — 생성자가 실제로 존재하고 그 공개 범위가 코드에 적혀 있다. 조건을 어길 수 있는 코드(생성자를 `public` 으로 여는 것)를 이 클래스에 넣을 수 있으므로 공허한 참이 아니라 ✅ 다.

**이름 의존 조건**: 아니오.

---

### 조건 2. [필수] 유일 인스턴스를 그 타입 자신이 보관합니다
**판정**: ✅ 충족

**근거**: `OrderDeskApp.java:17`, `27-32` 라인

```java
    private static OrderNumberIssuer uniqueInstance;
...
    static synchronized OrderNumberIssuer instance() {
        if (uniqueInstance == null) {
            uniqueInstance = new OrderNumberIssuer();
        }
        return uniqueInstance;
    }
```

**해설**: 보관 자리가 `OrderNumberIssuer` 클래스의 정적 필드이고, 그 자리를 채우는 문장(29 줄)도 같은 클래스 안에 있다. 조립 코드나 컨테이너가 바깥에서 들고 다니는 모양이 아니다 — `OrderDesk` 는 보관하지 않고 접근점에서 받아 쓴다(51 줄).

**선언 뒤 가리키는 대상 확인**(SKILL.md 3단계): `uniqueInstance` 에 들어가는 값을 따라가면 29 줄의 `new OrderNumberIssuer()` 하나뿐이고, 그 필드에 대입하는 문장은 코드 전체에서 그 한 줄이다(`grep` 으로 확인). 다른 곳에서 덮어쓰지 않는다.

**이름 의존 조건**: 아니오 — 필드 이름 `uniqueInstance` 가 아니라 선언의 소속(`static`, 클래스 안)과 대입 지점으로 판정했다.

---

### 조건 3. [필수] 잘 알려진 연산 하나가 언제 불러도 같은 인스턴스를 돌려줍니다
**판정**: ✅ 충족

**근거**: `OrderDeskApp.java:27-32`, `49-52`, `71` 라인

```java
    static synchronized OrderNumberIssuer instance() {
        if (uniqueInstance == null) {
            uniqueInstance = new OrderNumberIssuer();
        }
        return uniqueInstance;
    }
...
    OrderDesk(String channel) {
        this.channel = channel;
        this.issuer = OrderNumberIssuer.instance();
    }
...
        System.out.println("same-instance=" + (web.issuer == phone.issuer));
```

**해설**: `instance()` 는 클래스에 속한 공개 연산이고 매개변수가 없어 호출자·호출 시점과 무관하게 같은 `uniqueInstance` 를 돌려준다. 첫 호출에서만 채우고 이후에는 같은 참조를 반환한다. 창구 셋이 각각 이 연산으로 참조를 받고(51 줄), 71 줄이 참조 동일성을 직접 비교한다.

**범위 명시**: 가이드가 「코드가 그 범위를 밝혀야 해요」라고 요구하므로 적는다 — Java 의 정적 필드이므로 유일성의 범위는 **이 클래스를 읽어 들인 클래스 로더(ClassLoader) 하나**다. 같은 클래스를 로더 둘이 읽어 들이면 `uniqueInstance` 도 둘이 된다(가이드의 범위 표).

**이름 의존 조건**: 아니오 — 연산 이름이 `instance` 인 것이 아니라 매개변수가 없고 반환값이 보관된 같은 객체인 것으로 판정했다. 가이드도 「호출할 때마다 새 객체를 만들어 주는 연산은 이름이 `instance` 여도 그냥 생성 메서드입니다」라고 적는다.

---

### 조건 4. [선택] 동시에 접근점에 들어와도 두 번째 인스턴스가 생기지 않습니다
**판정**: ✅ 충족

**근거**: `OrderDeskApp.java:27`, `34`, `39` 라인

```java
    static synchronized OrderNumberIssuer instance() {
...
    synchronized String next() {
...
    synchronized long issuedCount() {
```

**해설**: 확인하고 채우는 구간(28~30)이 `synchronized` 로 묶여 있어 한 번에 한 흐름만 지나간다. 번호를 올리는 `next()` 와 세는 `issuedCount()` 에도 같은 잠금이 걸려 있어, 조건 3 이 실행 중에도 유지된다.

---

### 조건 5. [선택] 유일 인스턴스를 첫 접근 때 만듭니다
**판정**: ✅ 충족

**근거**: `OrderDeskApp.java:28-30` 라인

```java
        if (uniqueInstance == null) {
            uniqueInstance = new OrderNumberIssuer();
        }
```

**해설**: 보관 자리가 비었는지 보고 비었을 때만 만드는 지연 초기화다. 이 미룸이 실제로 일을 한다 — 64 줄에서 `ShopConfig.setBranchCode("B")` 가 먼저 실행된 뒤 67 줄의 첫 창구가 생길 때 생성자가 돌아서, `prefix` 가 빈 문자열이 아니라 `"B"` 로 잡힌다.

---

### 조건 6. [선택] 유일 인스턴스의 구체 타입을 접근점이 고릅니다
**판정**: ❌ 미충족

**근거**: `OrderDeskApp.java:16`, `27-32` 라인

```java
final class OrderNumberIssuer {
...
    static synchronized OrderNumberIssuer instance() {
        if (uniqueInstance == null) {
            uniqueInstance = new OrderNumberIssuer();
        }
```

**해설**: 클래스가 `final` 이고 접근점이 설정이나 이름표를 보지 않고 항상 `OrderNumberIssuer` 자신을 세운다. 하위 타입을 고를 자리도 등록부도 없다. 종합 판정에 반영하지 않는다(SKILL.md 6단계).

---

### 조건 7. [선택] 언어가 제공하는 우회 경로로도 두 번째 인스턴스가 생기지 않습니다
**판정**: ❌ 미충족

**근거**: `OrderDeskApp.java:16-32` 라인 전체 — 해당 방어 코드가 없음

**해설**: 클래스가 `final` 이고 `Serializable` 을 구현하지 않으므로 하위 타입과 직렬화 경로는 닫혀 있다. 그러나 반영(reflection)으로 `private` 생성자에 `setAccessible(true)` 를 걸면 두 번째 인스턴스가 생긴다 — 생성자 안에 「이미 만들어졌으면 예외」를 두는 방어가 없다. 종합 판정에 반영하지 않는다.

---

## 언어 관용구 측면

Java 에서 이 모양(비공개 생성자 + 정적 필드 + `synchronized` 접근점)은 가장 읽기 쉬운 판이지만, 매 호출마다 잠금을 지나므로 호출이 잦으면 비용이 붙는다. 같은 조건 1~3 을 지키면서 잠금 없이 세우는 두 관용구가 있다.

- **Initialization-on-demand holder** — 중첩 정적 클래스에 `static final` 필드를 두면 JVM 의 클래스 초기화 보장이 조건 4 를 대신한다. 조건 5(지연 초기화)도 유지된다.
- **`enum` 싱글턴** — 언어가 인스턴스 수를 고정해 주므로 조건 1 이 자동이고, 조건 7(반영·직렬화 우회 차단)까지 언어가 막아 준다. 이 코드의 남은 `[선택]` ❌ 둘 가운데 7 번을 한 번에 해결하는 길이다. 다만 `enum` 은 하위 타입을 세울 수 없어 조건 6 은 여전히 닫힌다.

`ShopConfig`(1~14)는 정적 유틸리티로 두는 것이 맞다 — 담아 둘 객체가 없고 값만 오가므로, 인스턴스를 만들면 보관 자리와 초기화 분기만 늘어난다(가이드 비교 절 「정적 유틸리티 클래스와의 차이」).

## 테스트 / 동작 검증

**정적 분석만 수행.** SKILL.md 4단계의 안전한 실행 조건 넷 가운데 셋째가 안 맞는다.

- 자기-완결적 진입점: **있음** (`public static void main`, 63 줄).
- 네트워크·파일시스템 변경·외부 명령: **없음** (표준 출력만 쓴다).
- `Makefile` 에 대응 타깃: **없음.** `make java PATTERN=<ClassName>` 은 `java/src/main/java/patterns/` 의 클래스를 부르고, 거기에는 `patterns.Singleton` 만 있다(`find` 로 확인). 분석 대상인 가이드 폴더의 `OrderDeskApp` 에 대응하는 타깃이 없다 — SKILL.md 4단계가 「분석 대상이 가이드 폴더의 파일이면 Makefile 타깃이 없으므로 실행 단계를 생략한다」고 적은 자리다.

같은 폴더의 `expected-output.txt` 는 **읽기만** 했고 실행하지 않았다. 문서가 기록한 두 번째 줄이 `same-instance=true` 이고 마지막 줄이 `issued=3` 인데, 이것은 조건 3(같은 인스턴스)과 조건 5(첫 접근 때 생성 → `prefix` 가 `"B"`)가 실행에서 어떻게 드러나는지를 보여 준다. **다만 이 리포트가 직접 실행해 확인한 값이 아니므로 근거로는 쓰지 않았다.**

## 권장 조치 (우선순위 순)

1. **반영(reflection) 우회를 막는다 (`[선택]` 7번)** — 지금은 `setAccessible(true)` 한 줄로 두 번째 인스턴스가 생긴다. 생성자에 보관 자리 검사를 넣으면 막힌다.

   ```java
   // before
   private OrderNumberIssuer() {
       this.prefix = ShopConfig.branchCode();
       this.issued = 0;
   }

   // after
   private OrderNumberIssuer() {
       if (uniqueInstance != null) {
           throw new IllegalStateException("OrderNumberIssuer already created");
       }
       this.prefix = ShopConfig.branchCode();
       this.issued = 0;
   }
   ```

2. **접근점의 잠금을 클래스 초기화 보장으로 바꾼다 (`[선택]` 4번의 비용 절감)** — 조건 4·5 를 그대로 지키면서 호출마다 걸리는 잠금을 없앤다. 조건 1~3 은 변하지 않는다.

   ```java
   // before
   private static OrderNumberIssuer uniqueInstance;

   static synchronized OrderNumberIssuer instance() {
       if (uniqueInstance == null) {
           uniqueInstance = new OrderNumberIssuer();
       }
       return uniqueInstance;
   }

   // after — holder 가 처음 참조될 때 JVM 이 한 번만 초기화한다
   private static final class Holder {
       static final OrderNumberIssuer INSTANCE = new OrderNumberIssuer();
   }

   static OrderNumberIssuer instance() {
       return Holder.INSTANCE;
   }
   ```
   `next()`·`issuedCount()` 의 `synchronized` 는 그대로 두어야 한다 — `issued` 를 올리는 구간은 여전히 여러 흐름이 겹칠 수 있다.

3. **`[선택]` 6번은 손대지 않아도 된다** — 하위 타입을 고를 필요가 없는 코드에 등록부를 넣으면 유일성을 지키는 자리가 늘어난다. 지점마다 다른 발급 규칙이 실제로 생길 때 열면 된다.

## 추가 코멘트

- **대조군으로서의 결과**: 5단계를 밟았지만 후보가 깨끗하게 떨어졌고, 종합 판정이 사용자가 댄 패턴 그대로 남았다. 새로 넣은 5단계가 멀쩡한 판정을 보류로 끌어내리지 않았다.
- **Singleton 이 동시 통과 표에 없는 이유가 코드로 보인다**: 이 패턴을 가르는 세 조건이 **생성 문법의 공개 범위 · 보관 자리의 소속 · 접근점의 반환값**이라 서로 다른 종류의 사실을 재고, 다른 패턴이 이 셋을 우연히 함께 만족하기 어렵다. Flyweight 는 접근점이 키를 받는 순간 3번에서, 의존성 주입은 생성자가 열려 있어야 하므로 1번에서 갈린다.
- **`ShopConfig` 의 가변 정적 상태**: `setBranchCode`(7~9)가 언제든 불릴 수 있고 `OrderNumberIssuer` 의 `prefix` 는 첫 접근 때 한 번만 읽는다. 64 줄보다 늦게 창구가 생기면 `prefix` 가 다른 값이 된다. 패턴 조건과는 무관하지만 초기화 순서에 의존하는 자리이므로 적어 둔다.
- **`OrderDesk.issuer` 의 가시성**: 45 줄이 `final OrderNumberIssuer issuer` 로 패키지 공개다. 71 줄의 동일성 비교를 보이려고 열어 둔 것으로 읽히며, 조건 1~3 에는 영향이 없다(보관 자리는 여전히 `OrderNumberIssuer` 안이고, 이 필드에 대입하는 곳은 생성자 한 줄뿐이다).

---

## 참고

- 평가 기준 원문: `pattern-guide/design-pattern-guide/singleton/singleton-guide_v1.0.0.md` (최소 조건 절 185~236 줄 · 비교 절 237~280 줄)
- 후보 기준 원문: `pattern-guide/design-pattern-guide/flyweight/flyweight-guide_v1.0.0.md` · `.../dependency-injection/dependency-injection-guide_v1.0.0.md`
- 분석 skill: `.claude/skills/design-pattern-analyzer/`
