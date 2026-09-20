interface ShippingPolicy {
  fee(subtotal: number, weightGrams: number): number;
}

class FlatRate implements ShippingPolicy {
  constructor(private readonly amount: number) {}

  fee(subtotal: number, weightGrams: number): number {
    return this.amount;
  }
}

class FreeOverThreshold implements ShippingPolicy {
  constructor(
    private readonly threshold: number,
    private readonly amount: number,
  ) {}

  fee(subtotal: number, weightGrams: number): number {
    return subtotal >= this.threshold ? 0 : this.amount;
  }
}

class ByWeight implements ShippingPolicy {
  constructor(private readonly perKg: number) {}

  fee(subtotal: number, weightGrams: number): number {
    return Math.ceil(weightGrams / 1_000) * this.perKg;
  }
}

interface Order {
  readonly id: string;
  readonly subtotal: number;
  readonly weightGrams: number;
}

class Checkout {
  constructor(private policy: ShippingPolicy) {}

  changePolicy(policy: ShippingPolicy): void {
    this.policy = policy;
  }

  total(order: Order): number {
    return order.subtotal + this.policy.fee(order.subtotal, order.weightGrams);
  }
}

type Plan = "flat" | "free-over" | "weight";

function choosePolicy(plan: Plan): ShippingPolicy {
  switch (plan) {
    case "flat":
      return new FlatRate(3_000);
    case "free-over":
      return new FreeOverThreshold(50_000, 3_000);
    case "weight":
      return new ByWeight(1_500);
  }
}

function printTotals(plan: Plan, checkout: Checkout, orders: readonly Order[]): void {
  const line = orders.map((order) => `${order.id}=${checkout.total(order)}`).join(" ");
  console.log(`${plan}: ${line}`);
}

const orders: readonly Order[] = [
  { id: "A", subtotal: 32_000, weightGrams: 2_300 },
  { id: "B", subtotal: 58_000, weightGrams: 5_100 },
];

const checkout = new Checkout(choosePolicy("flat"));
printTotals("flat", checkout, orders);

checkout.changePolicy(choosePolicy("free-over"));
printTotals("free-over", checkout, orders);

checkout.changePolicy(choosePolicy("weight"));
printTotals("weight", checkout, orders);
