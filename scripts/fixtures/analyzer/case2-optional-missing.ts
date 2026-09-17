// analyzer 회귀 픽스처 case2. 기대 결과는 README.md

interface DiscountPolicy {
  apply(amount: number): number;
}

class NoDiscount implements DiscountPolicy {
  apply(amount: number): number {
    return amount;
  }
}

class MemberDiscount implements DiscountPolicy {
  constructor(private readonly rate: number) {}

  apply(amount: number): number {
    return Math.round(amount * (1 - this.rate));
  }
}

class Checkout {
  constructor(private readonly policy: DiscountPolicy) {}

  total(amount: number): number {
    return this.policy.apply(amount);
  }
}

const guest = new Checkout(new NoDiscount());
const member = new Checkout(new MemberDiscount(0.1));
console.log(guest.total(10000), member.total(10000));

export {};
