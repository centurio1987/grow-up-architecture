/** Target — 주문 데스크가 재고에 묻는 연산 모양. */
interface StockSource {
  available(sku: string): number;
  totalAvailable(skus: readonly string[]): number;
}

/** Adaptee — 이미 있는 창고 시스템. 우리 타입을 모르고 한 줄 문자열로 답한다. */
class LegacyWarehouseApi {
  private readonly rows = new Map<string, readonly [number, number]>([
    ["BOOK_042", [37, 5]],
    ["PEN_007", [12, 4]],
  ]);

  query(itemCode: string): string {
    const row = this.rows.get(itemCode);
    if (row === undefined) {
      return "NOT_FOUND";
    }
    return `${itemCode}|ON_HAND=${row[0]}|RESERVED=${row[1]}`;
  }
}

/** Adapter — 창고 시스템의 한 줄 문자열을 StockSource 계약으로 옮긴다. */
class LegacyWarehouseStock implements StockSource {
  constructor(private readonly api: LegacyWarehouseApi) {}

  available(sku: string): number {
    const line = this.api.query(LegacyWarehouseStock.toItemCode(sku));
    if (line === "NOT_FOUND") {
      return 0;
    }
    return LegacyWarehouseStock.field(line, "ON_HAND") - LegacyWarehouseStock.field(line, "RESERVED");
  }

  totalAvailable(skus: readonly string[]): number {
    let sum = 0;
    for (const sku of skus) {
      sum += this.available(sku);
    }
    return sum;
  }

  private static toItemCode(sku: string): string {
    return sku.replaceAll("-", "_");
  }

  private static field(line: string, name: string): number {
    for (const part of line.split("|")) {
      if (part.startsWith(`${name}=`)) {
        return Number(part.slice(name.length + 1));
      }
    }
    return 0;
  }
}

/** Adaptee 2 — 다른 창고사. 가용 수량을 이미 빼서 주고 sku 를 그대로 쓴다. */
class PartnerWarehouseApi {
  private readonly free = new Map<string, number>([["BOOK-042", 12]]);

  lookup(code: string): string {
    return `sku=${code};free=${this.free.get(code) ?? 0}`;
  }
}

/** Adapter 2 — 같은 StockSource 계약, 다른 Adaptee. */
class PartnerWarehouseStock implements StockSource {
  constructor(private readonly api: PartnerWarehouseApi) {}

  available(sku: string): number {
    for (const part of this.api.lookup(sku).split(";")) {
      if (part.startsWith("free=")) {
        return Number(part.slice("free=".length));
      }
    }
    return 0;
  }

  totalAvailable(skus: readonly string[]): number {
    let sum = 0;
    for (const sku of skus) {
      sum += this.available(sku);
    }
    return sum;
  }
}

/** Decorator — 인터페이스는 그대로 두고 호출 횟수만 덧붙인다. Adapter 위에 겹쳐 쓴다. */
class CountingStock implements StockSource {
  private count = 0;

  constructor(private readonly inner: StockSource) {}

  available(sku: string): number {
    this.count += 1;
    return this.inner.available(sku);
  }

  totalAvailable(skus: readonly string[]): number {
    this.count += 1;
    return this.inner.totalAvailable(skus);
  }

  calls(): number {
    return this.count;
  }
}

/** Client — StockSource 만 알고 창고 시스템의 타입은 모른다. */
class OrderDesk {
  constructor(private readonly stock: StockSource) {}

  decide(sku: string, qty: number): string {
    const have = this.stock.available(sku);
    return have >= qty ? "accepted" : `rejected (short by ${qty - have})`;
  }
}

const legacyApi = new LegacyWarehouseApi();
const legacy: StockSource = new LegacyWarehouseStock(legacyApi);
const desk = new OrderDesk(legacy);
const basket: readonly string[] = ["BOOK-042", "PEN-007"];

console.log(`1) legacy BOOK-042: ${legacyApi.query("BOOK_042")} -> available ${legacy.available("BOOK-042")}`);
console.log(`2) order BOOK-042 x 30 -> ${desk.decide("BOOK-042", 30)}`);
console.log(`3) order BOOK-042 x 40 -> ${desk.decide("BOOK-042", 40)}`);
console.log(
  `4) legacy total [BOOK-042, PEN-007] = ${legacy.available("BOOK-042")} + ${legacy.available("PEN-007")}` +
    ` = ${legacy.totalAvailable(basket)}`,
);

const partner: StockSource = new PartnerWarehouseStock(new PartnerWarehouseApi());
console.log(`5) partner BOOK-042 -> available ${partner.available("BOOK-042")}`);

const counted = new CountingStock(new LegacyWarehouseStock(legacyApi));
console.log(
  `6) counting over legacy: available ${counted.available("BOOK-042")}` +
    `, total ${counted.totalAvailable(basket)}, calls ${counted.calls()}`,
);

console.log(`7) unknown CHAIR-900 -> available ${legacy.available("CHAIR-900")}`);

const raw = legacyApi.query("BOOK_042");
const onHand = (raw.split("|")[1] ?? "").slice("ON_HAND=".length);
console.log(`8) adaptee read without adapter: ${onHand} (RESERVED 5 not subtracted)`);
