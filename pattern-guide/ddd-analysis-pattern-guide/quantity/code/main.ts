const Unit = { G: "g", KG: "kg", L: "L" } as const;
type Unit = (typeof Unit)[keyof typeof Unit];

// from 1 = to factor. 방향이 있다: from → to 는 곱하고, to → from 은 나눈다.
class ConversionRatio {
  static readonly ALL: readonly ConversionRatio[] = Object.freeze([new ConversionRatio(Unit.KG, Unit.G, 1000n)]);

  private constructor(
    readonly from: Unit,
    readonly to: Unit,
    readonly factor: bigint,
  ) {
    Object.freeze(this);
  }

  equals(other: ConversionRatio): boolean {
    return this.from === other.from && this.to === other.to && this.factor === other.factor;
  }

  static between(a: Unit, b: Unit): ConversionRatio | undefined {
    return ConversionRatio.ALL.find((r) => (r.from === a && r.to === b) || (r.from === b && r.to === a));
  }
}

// 배열을 얼리면 원소 교체만 막힌다. 클래스까지 얼려야 ConversionRatio.ALL = [] 같은 정적 필드 재대입이 막힌다.
Object.freeze(ConversionRatio);

const ONE = 1000n; // 소수점 아래 세 자리

class Quantity {
  // scaled = 수치 × 1000. number(2진 부동소수점) 대신 bigint 정수로 들어 자릿수 규칙이 표현에 담긴다.
  private constructor(
    private readonly scaled: bigint,
    readonly unit: Unit,
  ) {
    Object.freeze(this);
  }

  static of(text: string, unit: Unit): Quantity {
    const m = /^(-?)(\d+)(?:\.(\d*?)0*)?$/.exec(text);
    if (m === null) throw new Error(`수치 형식이 아닙니다: ${text}`);
    const [, sign = "", whole = "0", fraction = ""] = m;
    if (fraction.length > 3) throw new Error(`소수점 아래 세 자리까지만 기록합니다: ${text} ${unit}`);
    const scaled = BigInt(whole) * ONE + BigInt(fraction.padEnd(3, "0"));
    return new Quantity(sign === "-" ? -scaled : scaled, unit);
  }

  plus(other: Quantity): Quantity {
    const common = this.commonUnit(other);
    return new Quantity(this.convertTo(common).scaled + other.convertTo(common).scaled, common);
  }

  minus(other: Quantity): Quantity {
    const common = this.commonUnit(other);
    return new Quantity(this.convertTo(common).scaled - other.convertTo(common).scaled, common);
  }

  times(n: bigint): Quantity {
    return new Quantity(this.scaled * n, this.unit);
  }

  equals(other: Quantity): boolean {
    return this.scaled === other.scaled && this.unit === other.unit;
  }

  // 크기 비교: 단위를 맞춘 뒤 비교한다. equals 는 수치와 단위가 둘 다 같아야 참이다.
  compareTo(other: Quantity): number {
    const common = this.commonUnit(other);
    const diff = this.convertTo(common).scaled - other.convertTo(common).scaled;
    return diff === 0n ? 0 : diff < 0n ? -1 : 1;
  }

  isPositive(): boolean { return this.scaled > 0n; }

  isNegative(): boolean { return this.scaled < 0n; }

  convertTo(target: Unit): Quantity {
    if (this.unit === target) return this;
    const ratio = ConversionRatio.between(this.unit, target);
    if (ratio === undefined) throw noRatio(this.unit, target);
    if (ratio.from === this.unit) return new Quantity(this.scaled * ratio.factor, target); // 정방향: 곱셈
    if (this.scaled % ratio.factor !== 0n) {
      throw new Error(`${target} 로 옮기면 소수점 아래 세 자리를 넘습니다: ${this}`);
    }
    return new Quantity(this.scaled / ratio.factor, target); // 역방향: 나눗셈
  }

  // 이 예제의 선택: 단위가 다르면 비율의 to 쪽(kg→g 이므로 g)으로 맞춰 곱셈만 일어나게 한다.
  private commonUnit(other: Quantity): Unit {
    if (this.unit === other.unit) return this.unit;
    const ratio = ConversionRatio.between(this.unit, other.unit);
    if (ratio === undefined) throw noRatio(this.unit, other.unit);
    return ratio.to;
  }

  toString(): string {
    const abs = this.scaled < 0n ? -this.scaled : this.scaled;
    const fraction = (abs % ONE).toString().padStart(3, "0").replace(/0+$/, "");
    return `${this.scaled < 0n ? "-" : ""}${abs / ONE}${fraction && "." + fraction} ${this.unit}`;
  }
}

function noRatio(a: Unit, b: Unit): Error {
  return new Error(`환산 비율이 없습니다: ${a} ↔ ${b}`);
}

class StockId {
  private readonly brand = "StockId"; // IngredientId 와 섞이지 않게 하는 표식
  constructor(readonly value: string) {
    Object.freeze(this);
  }

  equals(other: StockId): boolean { return this.value === other.value; }
}

class IngredientId {
  private readonly brand = "IngredientId";
  constructor(readonly value: string) {
    Object.freeze(this);
  }

  equals(other: IngredientId): boolean { return this.value === other.value; }
}

class IngredientStock {
  private onHandValue: Quantity;

  constructor(
    readonly id: StockId,
    readonly ingredientId: IngredientId, // 재료 카탈로그 aggregate 는 id 로만 가리킨다
    unit: Unit,
  ) {
    this.onHandValue = Quantity.of("0", unit);
  }

  receive(received: Quantity): void {
    requirePositive(received);
    this.onHandValue = this.onHandValue.plus(received);
  }

  consume(used: Quantity): void {
    requirePositive(used);
    const after = this.onHandValue.minus(used);
    if (after.isNegative()) {
      throw new Error(`재고가 모자랍니다: 보유 ${this.onHandValue}, 요청 ${used}`);
    }
    this.onHandValue = after;
  }

  onHand(): Quantity { return this.onHandValue; }
}

function requirePositive(q: Quantity): void {
  if (!q.isPositive()) throw new Error(`입고·사용량은 0보다 커야 합니다: ${q}`);
}

function attempt(action: () => void): void {
  try {
    action();
  } catch (e) {
    console.log(`거부 — ${e instanceof Error ? e.message : String(e)}`);
  }
}

const stock = new IngredientStock(new StockId("stock-1"), new IngredientId("yeast"), Unit.KG);
console.log(`재고 ${stock.id.value} · 재료 ${stock.ingredientId.value}`);

stock.receive(Quantity.of("0.3", Unit.KG));
console.log(`입고 0.3 kg → 보유 ${stock.onHand()}`);
stock.consume(Quantity.of("50", Unit.G).times(2n));
console.log(`사용 50 g × 2 → 보유 ${stock.onHand()}`);
console.log(`보유량을 kg 로 → ${stock.onHand().convertTo(Unit.KG)}`);
stock.consume(Quantity.of("0.2", Unit.KG));
console.log(`사용 0.2 kg → 보유 ${stock.onHand()}`);

attempt(() => stock.consume(Quantity.of("1", Unit.G)));
attempt(() => stock.receive(Quantity.of("1", Unit.L)));
attempt(() => Quantity.of("0.5", Unit.G).convertTo(Unit.KG));

const kg = Quantity.of("2.5", Unit.KG);
console.log(`같은 값인가 2.50 kg / 2.5 kg: ${Quantity.of("2.50", Unit.KG).equals(kg)}`);
console.log(`같은 값인가 2.5 kg / 2500 g: ${kg.equals(Quantity.of("2500", Unit.G))}`);
console.log(`같은 양인가 2.5 kg / 2500 g: ${kg.compareTo(Quantity.of("2500", Unit.G)) === 0}`);
