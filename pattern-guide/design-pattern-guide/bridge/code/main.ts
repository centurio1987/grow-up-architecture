/** Implementor — 영수증을 실제 매체에 얹는 원시 연산 넷과 비우기. */
interface Medium {
  emphasis(text: string): void;
  rule(): void;
  row(label: string, amount: string): void;
  text(text: string): void;
  flush(): string;
}

/** ConcreteImplementor — 32칸 감열 프린터. */
class ThermalPrinter implements Medium {
  private static readonly WIDTH = 32;
  private readonly buffer: string[] = [];

  emphasis(text: string): void {
    const upper = text.toUpperCase();
    const pad = Math.max(0, Math.floor((ThermalPrinter.WIDTH - upper.length) / 2));
    this.buffer.push(" ".repeat(pad) + upper);
  }

  rule(): void {
    this.buffer.push("-".repeat(ThermalPrinter.WIDTH));
  }

  row(label: string, amount: string): void {
    this.buffer.push(label.padEnd(22) + amount.padStart(10));
  }

  text(text: string): void {
    this.buffer.push(text);
  }

  flush(): string {
    const out = this.buffer.join("\n");
    this.buffer.length = 0;
    return out;
  }
}

/** ConcreteImplementor — HTML 페이지. */
class HtmlPage implements Medium {
  private readonly buffer: string[] = [];

  emphasis(text: string): void {
    this.buffer.push(`<h1>${text}</h1>`);
  }

  rule(): void {
    this.buffer.push("<hr>");
  }

  row(label: string, amount: string): void {
    this.buffer.push(`<p>${label}<b>${amount}</b></p>`);
  }

  text(text: string): void {
    this.buffer.push(`<p>${text}</p>`);
  }

  flush(): string {
    const out = this.buffer.join("\n");
    this.buffer.length = 0;
    return out;
  }
}

/** 외부 라벨 장비의 SDK. 우리가 고칠 수 없고 Medium 이라는 타입을 모른다. */
class LegacyLabelPrinter {
  private readonly tape: string[] = [];

  esc(code: number, payload: string): void {
    this.tape.push(`<${code}>${payload}`);
  }

  takeTape(): string {
    const out = this.tape.join("\n");
    this.tape.length = 0;
    return out;
  }
}

/** ConcreteImplementor 이면서 Adapter — 라벨 장비의 연산 하나에 Medium 의 네 연산을 얹는다. */
class LabelPrinterMedium implements Medium {
  constructor(private readonly device: LegacyLabelPrinter) {}

  emphasis(text: string): void {
    this.device.esc(1, text);
  }

  rule(): void {
    this.device.esc(2, "");
  }

  row(label: string, amount: string): void {
    this.device.esc(3, `${label};${amount}`);
  }

  text(text: string): void {
    this.device.esc(4, text);
  }

  flush(): string {
    return this.device.takeTape();
  }
}

interface OrderLine {
  readonly name: string;
  readonly amount: number;
}

class Order {
  constructor(
    readonly storeName: string,
    readonly id: string,
    readonly lines: readonly OrderLine[],
  ) {}

  total(): number {
    let sum = 0;
    for (const line of this.lines) {
      sum += line.amount;
    }
    return sum;
  }
}

function won(amount: number): string {
  const digits = String(amount);
  let out = "";
  for (let i = 0; i < digits.length; i += 1) {
    if (i > 0 && (digits.length - i) % 3 === 0) {
      out += ",";
    }
    out += digits.charAt(i);
  }
  return out;
}

/** Abstraction — 영수증 한 장의 고수준 연산. 매체를 참조로 들고 원시 연산으로 수행한다. */
class Receipt {
  constructor(protected readonly medium: Medium) {}

  render(order: Order): string {
    this.medium.emphasis(order.storeName);
    this.medium.rule();
    for (const line of order.lines) {
      this.medium.row(line.name, won(line.amount));
    }
    this.medium.rule();
    this.medium.row("TOTAL", won(order.total()));
    this.medium.text(`no ${order.id}`);
    return this.medium.flush();
  }
}

/** RefinedAbstraction — 금액을 감추고, 카드 한 장을 더 찍는 연산을 보탠 영수증. */
class GiftReceipt extends Receipt {
  constructor(medium: Medium, private readonly message: string) {
    super(medium);
  }

  override render(order: Order): string {
    this.medium.emphasis(order.storeName);
    this.medium.rule();
    for (const line of order.lines) {
      this.medium.row(line.name, "GIFT");
    }
    this.medium.rule();
    this.medium.text(`no ${order.id}`);
    return this.medium.flush();
  }

  renderCard(): string {
    this.medium.emphasis("gift card");
    this.medium.rule();
    this.medium.text(this.message);
    return this.medium.flush();
  }
}

const order = new Order("BBANGTO STORE", "ORD-7781", [
  { name: "Coffee Beans 200g", amount: 18000 },
  { name: "Paper Filter x2", amount: 7000 },
]);
const message = "Happy birthday, Jiwon!";

console.log("1) thermal x Receipt");
console.log(new Receipt(new ThermalPrinter()).render(order));

console.log("2) html x Receipt");
console.log(new Receipt(new HtmlPage()).render(order));

console.log("3) thermal x GiftReceipt");
console.log(new GiftReceipt(new ThermalPrinter(), message).render(order));

console.log("4) label x Receipt");
console.log(new Receipt(new LabelPrinterMedium(new LegacyLabelPrinter())).render(order));

console.log("5) html x GiftReceipt.renderCard");
console.log(new GiftReceipt(new HtmlPage(), message).renderCard());

const abstractions = ["Receipt", "GiftReceipt"];
const media = ["ThermalPrinter", "HtmlPage", "LabelPrinterMedium"];
console.log(
  `6) combined ${abstractions.length} x ${media.length} = ${abstractions.length * media.length}` +
    ` classes, separated ${abstractions.length} + ${media.length} = ${abstractions.length + media.length} classes`,
);
