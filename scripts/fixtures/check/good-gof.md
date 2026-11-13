# 전략 패턴 — 계산 방법을 갈아 끼우는 부품으로 떼어 내기

## 한눈에 보는 개요

주문 금액에 할인을 매기는 코드를 떠올려 봅시다. 할인 방식이 늘어날 때마다 `if` 분기를 덧붙이면 결제 클래스가 모든 할인 규칙을 알게 돼요. 전략 패턴은 할인 계산을 인터페이스 뒤의 부품으로 떼어 내고, 결제 클래스는 그 부품을 받아 호출만 하게 만듭니다.

![예시 도식 — 구조 한 장](diagrams/sample.png)

분류는 행위 패턴이고, 전략 객체를 고르는 쪽에서 팩토리 메서드와 자주 함께 쓰여요.

## 패턴 자세히 들여다보기

### 시나리오 1 — 정액 할인 하나로 결제하기

1. 호출자가 `Checkout` 을 만들 때 `FixedDiscount(1000)` 을 넘깁니다. 생성 시점에 받으면 결제 도중 전략이 비어 있는 순간이 사라져요.
2. `pay(5000)` 이 불리면 `Checkout` 은 금액을 전략에 그대로 넘깁니다. 규칙을 직접 읽지 않으니 새 규칙이 생겨도 이 메서드는 그대로예요.
3. 전략이 돌려준 1000 을 빼서 4000 을 만듭니다. `Checkout` 이 아는 것은 "할인액을 돌려주는 부품" 뿐이에요.

### 시나리오 2 — 정률 할인으로 갈아 끼우기

1. 마케팅이 10% 할인을 추가해 달라고 합니다. `RateDiscount` 클래스를 새로 만들고 `Checkout` 은 한 줄도 손대지 않아요.
2. 호출자가 이번에는 `RateDiscount(10)` 을 넘겨 `Checkout` 을 만듭니다. 부품을 고르는 일은 호출자 몫이에요.
3. `pay(5000)` 은 같은 코드로 500 을 빼 4500 을 돌려줍니다. 결제 흐름은 시나리오 1 과 한 글자도 다르지 않아요.

### 개념 정리

- **Context**: 전략을 필드로 가지고 있다가 계산이 필요할 때 위임하는 쪽이에요. 두 시나리오의 `Checkout` 입니다.
- **Strategy**: 계산 방법이 지켜야 할 약속이에요. 예시의 `DiscountPolicy` 인터페이스가 맡아요.
- **ConcreteStrategy**: 약속을 실제로 구현한 계산 방법이고, 시나리오 1 의 `FixedDiscount` 와 시나리오 2 의 `RateDiscount` 가 있어요.

![예시 도식 — 구조 한 장](diagrams/sample.png)

## 사용 목적

같은 입력에 계산 방법만 다른 분기가 한 클래스에 쌓이기 시작할 때 꺼냅니다. 분기가 두 개뿐이고 늘어날 일이 없다면 조건문 한 번이 더 읽기 쉬워요.

## 패턴의 경계

### 디자인 패턴을 충족하는 최소 조건

- [필수] Context 는 구체 전략 클래스가 아니라 Strategy 타입에만 의존합니다. 시나리오 2 의 1단계에서 `Checkout` 을 손대지 않을 수 있었던 이유예요. (근거: GoF Strategy 참여자·협력)
- **[필수]** 전략은 Context 바깥에서 골라 넣습니다. 시나리오 1 의 1단계가 그 자리입니다.
  빠지면 Context 안의 분기문이 됩니다. (근거: GoF Strategy 협력 — 클라이언트가 전략을 만들어 넘긴다)
- [선택] 실행 중에 전략을 바꾸는 setter 를 둡니다. 시나리오 2 처럼 새 `Checkout` 을 만들어도 되지만, 같은 객체를 계속 써야 할 때 편해요.

### 비슷한 패턴·안티패턴과의 차이

상태 패턴도 구조는 닮았어요. 갈리는 지점은 누가 다음 객체를 고르느냐입니다. 시나리오 1 의 1단계처럼 호출자가 부품을 고르면 전략 패턴이고, 아래처럼 부품이 스스로 다음 부품을 정하면 상태 패턴이에요.

```java no-compile
state = state.next(event);
```

`Checkout` 안에 `if (kind == FIXED)` 분기를 두는 설계도 결과 숫자는 같아요. 시나리오 2 의 1단계에서 갈립니다 — 분기 설계는 새 할인이 생길 때마다 `Checkout` 을 고쳐야 해요.

분석 패턴 쪽 예시는 [분석 패턴 픽스처](good-analysis.md)에 있어요.

## 구현 예시

### 상황 설정

온라인 상점 결제 화면이 정액 할인과 정률 할인을 함께 지원해야 합니다. 금액은 원 단위 정수로 다뤄요.

### 구현

```java
interface DiscountPolicy {
    long discount(long amount);
}

final class FixedDiscount implements DiscountPolicy {
    private final long off;

    FixedDiscount(long off) {
        this.off = off;
    }

    public long discount(long amount) {
        return Math.min(off, amount);
    }
}

final class RateDiscount implements DiscountPolicy {
    private final long percent;

    RateDiscount(long percent) {
        this.percent = percent;
    }

    public long discount(long amount) {
        return amount * percent / 100;
    }
}

public final class Checkout {
    private final DiscountPolicy policy;

    public Checkout(DiscountPolicy policy) {
        this.policy = policy;
    }

    public long pay(long amount) {
        return amount - policy.discount(amount);
    }

    public static void main(String[] args) {
        System.out.println(new Checkout(new FixedDiscount(1000)).pay(5000));
        System.out.println(new Checkout(new RateDiscount(10)).pay(5000));
    }
}
```

```typescript
interface DiscountPolicy {
  discount(amount: number): number;
}

class FixedDiscount implements DiscountPolicy {
  constructor(private readonly off: number) {}

  discount(amount: number): number {
    return Math.min(this.off, amount);
  }
}

class RateDiscount implements DiscountPolicy {
  constructor(private readonly percent: number) {}

  discount(amount: number): number {
    return Math.floor((amount * this.percent) / 100);
  }
}

class Checkout {
  constructor(private readonly policy: DiscountPolicy) {}

  pay(amount: number): number {
    return amount - this.policy.discount(amount);
  }
}

console.log(new Checkout(new FixedDiscount(1000)).pay(5000));
console.log(new Checkout(new RateDiscount(10)).pay(5000));
```

```rust
trait DiscountPolicy {
    fn discount(&self, amount: u64) -> u64;
}

struct FixedDiscount {
    off: u64,
}

impl DiscountPolicy for FixedDiscount {
    fn discount(&self, amount: u64) -> u64 {
        self.off.min(amount)
    }
}

struct RateDiscount {
    percent: u64,
}

impl DiscountPolicy for RateDiscount {
    fn discount(&self, amount: u64) -> u64 {
        amount * self.percent / 100
    }
}

struct Checkout {
    policy: Box<dyn DiscountPolicy>,
}

impl Checkout {
    fn new(policy: Box<dyn DiscountPolicy>) -> Self {
        Self { policy }
    }

    fn pay(&self, amount: u64) -> u64 {
        amount - self.policy.discount(amount)
    }
}

fn main() {
    println!("{}", Checkout::new(Box::new(FixedDiscount { off: 1000 })).pay(5000));
    println!("{}", Checkout::new(Box::new(RateDiscount { percent: 10 })).pay(5000));
}
```

## 스스로 점검하기

`Checkout` 이 생성자 안에서 `RateDiscount` 를 직접 만들면 어느 최소 조건이 깨질까요? 답을 정했다면 위 조건 목록과 대조해 보세요.

## 참고 자료

- Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides, *Design Patterns*, Addison-Wesley, 1994 — Strategy 장.
