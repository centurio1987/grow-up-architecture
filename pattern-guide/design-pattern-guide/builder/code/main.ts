/** 주문 한 줄. 예시의 입력 데이터이고 패턴의 역할은 아니다. */
interface OrderLine {
  readonly name: string;
  readonly quantity: number;
  readonly unitPrice: number;
}

/** 주문 한 건. 예시의 입력 데이터이고 패턴의 역할은 아니다. */
interface Order {
  readonly id: string;
  readonly lines: readonly OrderLine[];
  readonly shippingFee: number;
}

/** Builder — 부분을 받는 연산만 선언한다. 제품을 꺼내는 연산은 여기 없다. */
interface OrderBuilder {
  begin(orderId: string): void;
  addLine(name: string, quantity: number, unitPrice: number): void;
  addShipping(fee: number): void;
  end(): void;
}

/** Product 1 — 영수증 여러 줄. */
class Receipt {
  private readonly lines: readonly string[];

  constructor(lines: readonly string[]) {
    this.lines = [...lines];
  }

  text(): string {
    return this.lines.join("\n");
  }
}

/** Product 2 — 집계 한 줄. Receipt 와 공통 부모가 없다. */
class OrderTotals {
  constructor(
    private readonly orderId: string,
    private readonly lineCount: number,
    private readonly itemCount: number,
    private readonly goodsAmount: number,
    private readonly shippingFee: number,
  ) {}

  summary(): string {
    const total = this.goodsAmount + this.shippingFee;
    return `주문 ${this.orderId} · 품목 ${this.lineCount}종 · 수량 ${this.itemCount}개`
      + ` · 상품 ${this.goodsAmount}원 · 배송 ${this.shippingFee}원 · 합계 ${total}원`;
  }
}

/** ConcreteBuilder 1 — 영수증 표현을 정의하고 추적한다. */
class ReceiptBuilder implements OrderBuilder {
  private lines: string[] = [];
  private amount = 0;
  private product: Receipt | null = null;

  begin(orderId: string): void {
    this.lines = [];
    this.amount = 0;
    this.product = null;
    this.lines.push(`주문 ${orderId}`);
  }

  addLine(name: string, quantity: number, unitPrice: number): void {
    const sum = quantity * unitPrice;
    this.amount += sum;
    this.lines.push(`${name} x${quantity} @${unitPrice} = ${sum}`);
  }

  addShipping(fee: number): void {
    this.amount += fee;
    this.lines.push(`배송비 ${fee}`);
  }

  end(): void {
    this.lines.push(`합계 ${this.amount}`);
    this.product = new Receipt(this.lines);
  }

  getReceipt(): Receipt {
    if (this.product === null) {
      throw new Error("end() 전에는 영수증을 꺼낼 수 없습니다");
    }
    return this.product;
  }
}

/** ConcreteBuilder 2 — 집계 표현을 정의하고 추적한다. */
class TotalsBuilder implements OrderBuilder {
  private orderId = "";
  private lineCount = 0;
  private itemCount = 0;
  private goodsAmount = 0;
  private shippingFee = 0;
  private product: OrderTotals | null = null;

  begin(orderId: string): void {
    this.orderId = orderId;
    this.lineCount = 0;
    this.itemCount = 0;
    this.goodsAmount = 0;
    this.shippingFee = 0;
    this.product = null;
  }

  addLine(name: string, quantity: number, unitPrice: number): void {
    this.lineCount += 1;
    this.itemCount += quantity;
    this.goodsAmount += quantity * unitPrice;
  }

  addShipping(fee: number): void {
    this.shippingFee += fee;
  }

  end(): void {
    this.product = new OrderTotals(
      this.orderId, this.lineCount, this.itemCount, this.goodsAmount, this.shippingFee);
  }

  getTotals(): OrderTotals {
    if (this.product === null) {
      throw new Error("end() 전에는 집계를 꺼낼 수 없습니다");
    }
    return this.product;
  }
}

/** Director — 추상 빌더 타입만 참조한다. */
class OrderReader {
  constructor(private readonly builder: OrderBuilder) {}

  read(order: Order): void {
    this.builder.begin(order.id);
    for (const line of order.lines) {
      this.builder.addLine(line.name, line.quantity, line.unitPrice);
    }
    if (order.shippingFee > 0) {
      this.builder.addShipping(order.shippingFee);
    }
    this.builder.end();
  }
}

const order: Order = {
  id: "ORD-4417",
  lines: [
    { name: "공책", quantity: 3, unitPrice: 3000 },
    { name: "연필", quantity: 12, unitPrice: 500 },
    { name: "지우개", quantity: 2, unitPrice: 800 },
  ],
  shippingFee: 3000,
};

const receiptBuilder = new ReceiptBuilder();
new OrderReader(receiptBuilder).read(order);
console.log("--- receipt ---");
console.log(receiptBuilder.getReceipt().text());

const totalsBuilder = new TotalsBuilder();
new OrderReader(totalsBuilder).read(order);
console.log("--- totals ---");
console.log(totalsBuilder.getTotals().summary());

const halfway = new ReceiptBuilder();
halfway.begin(order.id);
halfway.addLine("공책", 3, 3000);
console.log("--- before end ---");
try {
  halfway.getReceipt();
  console.log("꺼냈음");
} catch {
  console.log("거부됨");
}
