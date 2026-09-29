// 크기 비교가 되는 값. Range 의 끝점 타입은 이것만 요구한다.
interface Ordered<T> {
  compareTo(other: T): number;
  toString(): string;
}

const Unit = { G: { grams: 1, symbol: "g" }, KG: { grams: 1000, symbol: "kg" } } as const;
type Unit = (typeof Unit)[keyof typeof Unit];

// 무게 하나. g 로 정규화해 담으므로 2 kg 과 2000 g 은 같은 값이고 크기 비교가 필드 하나로 끝난다.
class Quantity implements Ordered<Quantity> {
  private constructor(readonly grams: number) {}

  static of(amount: number, unit: Unit): Quantity {
    return new Quantity(amount * unit.grams);
  }

  compareTo(other: Quantity): number {
    return this.grams - other.grams;
  }

  toString(): string {
    return this.grams !== 0 && this.grams % Unit.KG.grams === 0
      ? `${this.grams / Unit.KG.grams} ${Unit.KG.symbol}`
      : `${this.grams} ${Unit.G.symbol}`;
  }
}

// 두 끝과 각 끝을 포함하는지를 한 값으로 든 구간. 끝점 타입은 크기 비교가 되면 무엇이든 된다.
class Range<T extends Ordered<T>> {
  constructor(
    readonly lower: T,
    readonly upper: T,
    readonly lowerInclusive: boolean,
    readonly upperInclusive: boolean,
  ) {
    if (lower.compareTo(upper) > 0) {
      throw new Error(`하한이 상한보다 큽니다: ${lower} .. ${upper}`);
    }
  }

  includes(value: T): boolean {
    const lo = this.lower.compareTo(value);
    const hi = value.compareTo(this.upper);
    return (lo < 0 || (lo === 0 && this.lowerInclusive)) && (hi < 0 || (hi === 0 && this.upperInclusive));
  }

  overlaps(other: Range<T>): boolean {
    return this.reaches(other) && other.reaches(this);
  }

  // 맞닿음 — 한쪽 상한과 다른 쪽 하한이 같은 값이고, 그 자리를 정확히 한쪽만 포함한다.
  abuts(other: Range<T>): boolean {
    return (
      (this.upper.compareTo(other.lower) === 0 && this.upperInclusive !== other.lowerInclusive) ||
      (other.upper.compareTo(this.lower) === 0 && other.upperInclusive !== this.lowerInclusive)
    );
  }

  // 이 구간의 아래 끝이 상대의 위 끝까지 닿는가. 같은 값이면 양쪽이 그 자리를 포함해야 닿는다.
  private reaches(other: Range<T>): boolean {
    const c = this.lower.compareTo(other.upper);
    return c < 0 || (c === 0 && this.lowerInclusive && other.upperInclusive);
  }

  sameEdgeAsLower(value: T, inclusive: boolean): boolean {
    return this.lower.compareTo(value) === 0 && this.lowerInclusive === inclusive;
  }

  sameEdgeAsUpper(value: T, inclusive: boolean): boolean {
    return this.upper.compareTo(value) === 0 && this.upperInclusive === inclusive;
  }

  toString(): string {
    const lo = this.lowerInclusive ? " <= x " : " < x ";
    const hi = this.upperInclusive ? "<= " : "< ";
    return `${this.lower}${lo}${hi}${this.upper}`;
  }
}

class Fee {
  constructor(readonly won: number) {}

  toString(): string {
    return `${this.won}원`;
  }
}

class BandId {
  constructor(readonly value: string) {}
}

class RateTableId {
  constructor(readonly value: string) {}
}

class ProductId {
  constructor(readonly value: string) {}
}

// 요금 구간 — 무게 구간 하나와 그 구간의 요금. 표 안에서 BandId 로 지목된다.
class RateBand {
  constructor(
    readonly id: BandId,
    readonly weights: Range<Quantity>,
    readonly fee: Fee,
  ) {}

  toString(): string {
    return `구간 ${this.id.value} · ${this.weights} · ${this.fee}`;
  }
}

class RateTable {
  private currentSpan!: Range<Quantity>;
  private currentBands!: readonly RateBand[];

  constructor(
    readonly id: RateTableId,
    readonly productId: ProductId, // 배송 상품 aggregate 는 id 로만 가리킨다
    span: Range<Quantity>,
    bands: readonly RateBand[],
  ) {
    this.redefine(span, bands);
  }

  // 구간 목록을 바꾸는 유일한 길. 비중첩과 전 구간 덮음을 여기서 검사하고, 통과한 뒤에 교체한다.
  redefine(span: Range<Quantity>, bands: readonly RateBand[]): void {
    const sorted = [...bands].sort((a, b) => a.weights.lower.compareTo(b.weights.lower));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    if (first === undefined || last === undefined) {
      throw new Error(`구간이 하나도 없습니다: ${span}`);
    }
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i]!;
        const b = sorted[j]!;
        if (a.weights.overlaps(b.weights)) {
          throw new Error(`구간이 겹칩니다: ${a.id.value}(${a.weights}) 와 ${b.id.value}(${b.weights})`);
        }
      }
    }
    if (
      !first.weights.sameEdgeAsLower(span.lower, span.lowerInclusive) ||
      !last.weights.sameEdgeAsUpper(span.upper, span.upperInclusive)
    ) {
      throw new Error(`구간이 적용 구간의 양 끝을 덮지 않습니다: ${span}`);
    }
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1]!.weights;
      const next = sorted[i]!.weights;
      if (!prev.abuts(next)) {
        throw new Error(`구간 사이에 틈이 있습니다: ${prev} 다음 구간이 ${next.lower} 부터입니다`);
      }
    }
    this.currentSpan = span;
    this.currentBands = Object.freeze(sorted);
  }

  bandFor(weight: Quantity): RateBand {
    if (!this.currentSpan.includes(weight)) {
      throw new Error(`적용 구간을 벗어납니다: ${weight}`);
    }
    const found = this.currentBands.find((b) => b.weights.includes(weight));
    if (found === undefined) {
      throw new Error(`어느 구간에도 들지 않습니다: ${weight}`);
    }
    return found;
  }

  get span(): Range<Quantity> {
    return this.currentSpan;
  }

  get bands(): readonly RateBand[] {
    return this.currentBands;
  }
}

// 하한 미포함 · 상한 포함
function upTo(id: string, lower: Quantity, upper: Quantity, won: number): RateBand {
  return new RateBand(new BandId(id), new Range(lower, upper, false, true), new Fee(won));
}

// 하한 포함 · 상한 미포함
function from(id: string, lower: Quantity, upper: Quantity, won: number): RateBand {
  return new RateBand(new BandId(id), new Range(lower, upper, true, false), new Fee(won));
}

function quote(table: RateTable, weight: Quantity): void {
  try {
    const band = table.bandFor(weight);
    console.log(`${weight} 소포 → ${band.id.value} · ${band.fee}`);
  } catch (e) {
    console.log(`거부 — ${(e as Error).message}`);
  }
}

function attempt(action: () => void): void {
  try {
    action();
  } catch (e) {
    console.log(`거부 — ${(e as Error).message}`);
  }
}

const zero = Quantity.of(0, Unit.G);
const kg2 = Quantity.of(2, Unit.KG);
const kg5 = Quantity.of(5, Unit.KG);
const kg20 = Quantity.of(20, Unit.KG);
const span = new Range(zero, kg20, false, true);
const bands = [upTo("band-1", zero, kg2, 4000), upTo("band-2", kg2, kg5, 5500), upTo("band-3", kg5, kg20, 8000)];
const table = new RateTable(new RateTableId("rate-1"), new ProductId("standard-parcel"), span, bands);
console.log(`요금표 ${table.id.value} · 상품 ${table.productId.value} · 적용 ${table.span}`);
for (const band of table.bands) console.log(`${band}`);

quote(table, kg2);
quote(table, Quantity.of(2001, Unit.G));
quote(table, kg20);
quote(table, Quantity.of(20001, Unit.G));

const kg30 = Quantity.of(30, Unit.KG);
table.redefine(new Range(zero, kg30, false, true), [...bands, upTo("band-4", kg20, kg30, 11000)]);
console.log(`대형 구간을 더해 적용 ${table.span} 으로 다시 정의`);
quote(table, Quantity.of(25, Unit.KG));

attempt(() => new Range(kg5, kg2, false, true));
attempt(() =>
  table.redefine(span, [...bands, upTo("band-9", Quantity.of(4, Unit.KG), Quantity.of(9, Unit.KG), 7000)]),
);
attempt(() =>
  table.redefine(span, [
    upTo("band-1", zero, kg2, 4000),
    upTo("band-5", Quantity.of(3, Unit.KG), kg5, 5500),
    upTo("band-3", kg5, kg20, 8000),
  ]),
);

const flipped = new RateTable(new RateTableId("rate-2"), new ProductId("standard-parcel"),
  new Range(zero, kg20, true, false),
  [from("band-1", zero, kg2, 4000), from("band-2", kg2, kg5, 5500), from("band-3", kg5, kg20, 8000)]);
process.stdout.write("경계 포함을 뒤집은 표에서 ");
quote(flipped, kg2);
