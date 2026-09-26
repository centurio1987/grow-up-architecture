# Strategy 패턴 부합도 분석

| 항목 | 값 |
| --- | --- |
| 분석 대상 | `pattern-guide/design-pattern-guide/strategy/code/ShippingApp.java` |
| 언어 | Java |
| 분석 일시 | 2026-09-26 23:25 |
| 평가 기준 출처 | `pattern-guide/design-pattern-guide/strategy/strategy-guide_v1.1.0.md` |
| 코드 라인 수 | 99 |

> **이 분석의 목적은 코드 판정이 아니라 스팟체크다.** KAN-001.3 검토 항목 15 가 청구한 것은
> 「가이드 배치가 폴더·버전 구조로 바뀐 뒤에도 analyzer 가 평가 기준을 새 경로에서 제대로 찾는가」다.
> 대상 코드를 가이드 자신의 예제로 잡았으므로 조건 충족은 당연하고, 읽을 값은 **기준 해소 경로**와
> 아래 「스팟체크 결과」다.

## 종합 판정

**정통 패턴**

필수 조건 3개가 모두 ✅ 이고 선택 조건 3개도 모두 ✅ 다. 결정타는 조건 3 — 요금제를 고르는 `switch` 가
`Checkout`(Context) 밖의 `ShippingApp.choosePolicy` 에 있고, `Checkout` 은 생성자와 `changePolicy` 로
전략을 받기만 한다. Context 가 구체 전략 타입을 아는 자리가 한 곳도 없다.

---

## 조건별 평가

### 조건 1. [필수] 교체할 알고리즘들이 같은 연산 모양을 따르고 계산 방법마다 따로 구현된다
**판정**: ✅ 충족

**근거**: `ShippingApp.java:4-6`, `:8-19`, `:21-34`, `:36-47`

```java
interface ShippingPolicy {
    long fee(long subtotal, long weightGrams);
}
```

**해설**: `fee(long, long) -> long` 한 모양을 `FlatRate` · `FreeOverThreshold` · `ByWeight` 셋이 각각
구현한다. 이름·매개변수·반환 형태가 모두 같고, 계산 방법은 셋이 서로 다르다.

---

### 조건 2. [필수] Context 는 전략을 그 연산 모양으로만 보유하고 호출한다
**판정**: ✅ 충족

**근거**: `ShippingApp.java:52-66`

```java
final class Checkout {
    private ShippingPolicy policy;
    Checkout(ShippingPolicy policy) { this.policy = policy; }
    void changePolicy(ShippingPolicy policy) { this.policy = policy; }
    long total(Order order) {
        return order.subtotal() + policy.fee(order.subtotal(), order.weightGrams());
    }
}
```

**해설**: 필드(`:53`)·생성자 인자(`:55`)·`changePolicy` 인자(`:59`)가 전부 인터페이스 타입이고,
`total` 은 `policy.fee(...)` 만 부른다. 구체 타입을 보거나 `instanceof` 로 가르는 자리가 없다.

---

### 조건 3. [필수] 전략을 고르는 분기가 Context 안에 없고, Context 는 전략을 받는 경로를 가진다
**판정**: ✅ 충족

**근거**: `ShippingApp.java:69-76` (분기) · `:55`·`:59` (받는 경로)

```java
static ShippingPolicy choosePolicy(String plan) {
    return switch (plan) {
        case "flat" -> new FlatRate(3_000);
        case "free-over" -> new FreeOverThreshold(50_000, 3_000);
        case "weight" -> new ByWeight(1_500);
        default -> throw new IllegalArgumentException("unknown plan: " + plan);
    };
}
```

**해설**: 요금제 문자열을 보고 전략을 고르는 `switch` 가 `Checkout` 밖 `ShippingApp` 에 있다.
`Checkout` 안에는 분기가 한 줄도 없고 생성자·`changePolicy` 두 경로로 전략을 받는다.

---

### 조건 4. [선택] ConcreteStrategy 를 만드는 코드가 Context 밖에 있다
**판정**: ✅ 충족

**근거**: `ShippingApp.java:71-73`

**해설**: `new FlatRate(...)` · `new FreeOverThreshold(...)` · `new ByWeight(...)` 세 생성이 모두
`choosePolicy` 안에 있다. `Checkout` 은 전략을 만들지 않는다.

---

### 조건 5. [선택] Context 에 전략을 다시 설치하는 연산이 있다
**판정**: ✅ 충족

**근거**: `ShippingApp.java:59-61` (정의) · `:93`·`:96` (실제 교체)

**해설**: `changePolicy` 가 그 연산이고, `main` 이 같은 `Checkout` 인스턴스에 세 전략을 차례로
갈아 끼운다 — 실행 중 교체가 실제로 일어나는 것을 코드에서 확인했다.

---

### 조건 6. [선택] 여러 Context 가 공유하는 전략 객체는 호출 사이에 값을 남기지 않는다
**판정**: ✅ 충족

**근거**: `ShippingApp.java:9`, `:22-23`, `:37`

**해설**: 세 전략의 필드가 모두 `private final` 이고 `fee` 는 인자만으로 계산한다. 정적 가변 필드나
싱글턴도 없다. 다만 이 예제에는 `Checkout` 인스턴스가 하나뿐이라 **공유 상황 자체가 일어나지 않는다** —
조건은 구조상 충족하지만 실행으로 반증할 기회는 없었다.

---

## 언어 관용구 측면

Java 에서 전략이 상태 없는 순수 계산이면 `interface` + 익명/람다(`ShippingPolicy p = (s, w) -> 3000;`)로도
같은 구조가 선다. 이 예제가 `final class` 셋을 둔 것은 전략마다 생성자 인자(요금·임계값·단가)를 갖기
때문이고, 그 값이 있는 한 클래스 쪽이 자연스럽다.

## 테스트 / 동작 검증

**정적 분석만 수행.** `Makefile` 의 `java` 타깃은 `java/src/main/java/patterns/` 아래 클래스를 대상으로 하는데
이 파일은 가이드 폴더의 `code/` 에 있어 타깃이 대응하지 않는다(스킬 4단계 세 번째 조건 불충족).
참고로 이 파일의 실행 출력은 `check-guides.py --run` 이 `code/expected-output.txt` 와 대조해 이미 통과시킨다.

---

## 스팟체크 결과 — 이 분석이 청구된 이유

**1) 기준 해소는 제대로 돈다.** 스킬 2단계를 절차 그대로 밟아 확인했다.

| 단계 | 결과 |
| --- | --- |
| `paths.json` 의 `dirs.content` + `dirs.tracks.gof-guide` 로 폴더 해소 | `pattern-guide/design-pattern-guide/strategy` ✅ |
| 폴더 안 `<slug>-guide_v<semver>.md` 중 최고 버전 선택 | `v1.1.0` > `v1.0.0` ✅ |
| 머리말 `status: legacy` 건너뛰기 | `v1.0.0` 이 legacy 라 건너뛰고 `v1.1.0`(published) 채택 ✅ |
| 최소 조건 절 찾기 (`### 디자인 패턴을 충족하는 최소 조건`) | 줄 239~299, 레벨 3 ✅ |
| 최상위 항목만 조건으로 집계 | 6개 ✅ |
| `[필수]`/`[선택]` 표기 판별 | 필수 3 · 선택 3, 표기 누락 0 ✅ |

legacy 분기도 함께 확인했다 — Singleton 은 폴더에 `v0.1.0`(legacy) 하나뿐이라 쓸 수 있는 가이드가 없고,
스킬 2단계 3번대로 내장 `checklist.md` 로 내려간다(그 파일 존재 확인).

**2) 스킬 문서 두 곳이 배치 변경을 못 따라갔다.** 판정에는 영향이 없지만 다음 사람이 읽는 자리다.

- `report-template.md` 의 「평가 기준 출처」 예시가 `pattern-guide/design-pattern-guide/<pattern>-pattern.md` 로
  적혀 있다 — 지금 배치는 `<pattern>/<pattern>-guide_v<semver>.md` 다.
- `SKILL.md` 4단계의 실행 명령 네 줄이 `cd /Users/centurio/design-pattern-guide` 를 박고 있다.
  그 디렉터리는 지금 없다(저장소가 `grow-up-architecture` 로 옮겨졌다). 실행 검증을 타는 분석에서 걸린다.
