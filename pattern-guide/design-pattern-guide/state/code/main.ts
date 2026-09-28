interface OrderState {
  name(): string;
  pay(order: Order, amount: number): OrderState;
  ship(order: Order): OrderState;
  cancel(order: Order): OrderState;
}

class AwaitingPayment implements OrderState {
  name(): string {
    return "awaiting-payment";
  }

  pay(order: Order, amount: number): OrderState {
    order.addPayment(amount);
    order.note(`pay ${amount} (paid ${order.paid()}/${order.total()})`);
    return order.paid() >= order.total() ? new Paid() : new PartiallyPaid();
  }

  ship(order: Order): OrderState {
    order.note("ship rejected(not paid yet)");
    return this;
  }

  cancel(order: Order): OrderState {
    order.note("cancel before payment");
    return new Cancelled();
  }
}

class PartiallyPaid implements OrderState {
  name(): string {
    return "partially-paid";
  }

  pay(order: Order, amount: number): OrderState {
    order.addPayment(amount);
    order.note(`pay ${amount} (paid ${order.paid()}/${order.total()})`);
    return order.paid() >= order.total() ? new Paid() : this;
  }

  ship(order: Order): OrderState {
    order.note("ship rejected(not fully paid)");
    return this;
  }

  cancel(order: Order): OrderState {
    const refunded = order.paid();
    order.refundAll();
    order.note(`cancel refund ${refunded}`);
    return new Cancelled();
  }
}

class Paid implements OrderState {
  name(): string {
    return "paid";
  }

  pay(order: Order, amount: number): OrderState {
    order.note("pay rejected(already paid)");
    return this;
  }

  ship(order: Order): OrderState {
    order.note("ship invoice issued");
    return new Shipped();
  }

  cancel(order: Order): OrderState {
    const refunded = order.paid();
    order.refundAll();
    order.note(`cancel refund ${refunded}`);
    return new Cancelled();
  }
}

class Shipped implements OrderState {
  name(): string {
    return "shipped";
  }

  pay(order: Order, amount: number): OrderState {
    order.note("pay rejected(already paid)");
    return this;
  }

  ship(order: Order): OrderState {
    order.note("ship rejected(already shipped)");
    return this;
  }

  cancel(order: Order): OrderState {
    order.note("cancel rejected(already shipped)");
    return this;
  }
}

class Cancelled implements OrderState {
  name(): string {
    return "cancelled";
  }

  pay(order: Order, amount: number): OrderState {
    order.note("pay rejected(order cancelled)");
    return this;
  }

  ship(order: Order): OrderState {
    order.note("ship rejected(order cancelled)");
    return this;
  }

  cancel(order: Order): OrderState {
    order.note("cancel rejected(order cancelled)");
    return this;
  }
}

class Order {
  private paidAmount = 0;
  private lastNote = "";
  private state: OrderState;

  constructor(
    private readonly id: string,
    private readonly totalAmount: number,
    initial: OrderState,
  ) {
    this.state = initial;
  }

  pay(amount: number): void {
    const before = this.state;
    this.state = this.state.pay(this, amount);
    this.print(before);
  }

  ship(): void {
    const before = this.state;
    this.state = this.state.ship(this);
    this.print(before);
  }

  cancel(): void {
    const before = this.state;
    this.state = this.state.cancel(this);
    this.print(before);
  }

  total(): number {
    return this.totalAmount;
  }

  paid(): number {
    return this.paidAmount;
  }

  addPayment(amount: number): void {
    this.paidAmount += amount;
  }

  refundAll(): void {
    this.paidAmount = 0;
  }

  note(message: string): void {
    this.lastNote = message;
  }

  private print(before: OrderState): void {
    console.log(`${this.id} ${before.name()} ${this.lastNote} -> ${this.state.name()}`);
  }
}

const a = new Order("A", 48_000, new AwaitingPayment());
a.ship();
a.pay(48_000);
a.ship();
a.cancel();

const b = new Order("B", 30_000, new AwaitingPayment());
b.pay(12_000);
b.pay(18_000);
b.cancel();
b.pay(5_000);
