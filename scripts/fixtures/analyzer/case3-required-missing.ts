// analyzer 회귀 픽스처 case3. 기대 결과는 README.md

interface DiscountPolicy {
  apply(amount: number): number;
}

class NoDiscount implements DiscountPolicy {
  apply(amount: number): number {
    return amount;
  }
}

class MemberDiscount implements DiscountPolicy {
  constructor(readonly rate: number) {}

  apply(amount: number): number {
    return Math.round(amount * (1 - this.rate));
  }
}

class Checkout {
  constructor(private policy: DiscountPolicy) {}

  setPolicy(policy: DiscountPolicy): void {
    this.policy = policy;
  }

  total(amount: number): number {
    if (this.policy instanceof MemberDiscount) {
      return Math.round(amount * (1 - this.policy.rate));
    }
    return amount;
  }
}

const checkout = new Checkout(new NoDiscount());
console.log(checkout.total(10000));
checkout.setPolicy(new MemberDiscount(0.1));
console.log(checkout.total(10000));

export {};
