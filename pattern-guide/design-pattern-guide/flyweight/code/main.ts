interface ItemSpec {
  weightGrams(quantity: number): number;
  describe(location: string, quantity: number): string;
}

const census = { created: 0 };

class SharedItemSpec implements ItemSpec {
  private readonly code: string;
  private readonly unitGrams: number;

  constructor(code: string, unitGrams: number) {
    this.code = code;
    this.unitGrams = unitGrams;
    census.created += 1;
  }

  weightGrams(quantity: number): number {
    return this.unitGrams * quantity;
  }

  describe(location: string, quantity: number): string {
    return `${location} ${this.code} x${quantity} ${this.weightGrams(quantity)}g`;
  }
}

class MixedPallet implements ItemSpec {
  private readonly parts: ItemSpec[] = [];

  add(part: ItemSpec): void {
    this.parts.push(part);
  }

  weightGrams(quantity: number): number {
    let onePallet = 0;
    for (const part of this.parts) {
      onePallet += part.weightGrams(1);
    }
    return onePallet * quantity;
  }

  describe(location: string, quantity: number): string {
    return `${location} MIXED x${quantity} ${this.weightGrams(quantity)}g`;
  }
}

const CODES = ["SKU-101", "SKU-204", "SKU-330", "SKU-457"];
const UNIT_GRAMS = [300, 850, 40, 120];

function unitGramsOf(code: string): number {
  for (let i = 0; i < CODES.length; i++) {
    if (CODES[i] === code) {
      return UNIT_GRAMS[i]!;
    }
  }
  throw new Error(`unknown code: ${code}`);
}

function codeAt(index: number): string {
  return CODES[index % CODES.length]!;
}

class ItemSpecPool {
  private readonly pool = new Map<string, SharedItemSpec>();

  spec(code: string): ItemSpec {
    let found = this.pool.get(code);
    if (found === undefined) {
      found = new SharedItemSpec(code, unitGramsOf(code));
      this.pool.set(code, found);
    }
    return found;
  }
}

class Slot {
  private readonly location: string;
  private readonly quantity: number;
  readonly spec: ItemSpec;

  constructor(location: string, quantity: number, spec: ItemSpec) {
    this.location = location;
    this.quantity = quantity;
    this.spec = spec;
  }

  weightGrams(): number {
    return this.spec.weightGrams(this.quantity);
  }

  describe(): string {
    return this.spec.describe(this.location, this.quantity);
  }
}

function totalGrams(sheet: Slot[]): number {
  let sum = 0;
  for (const slot of sheet) {
    sum += slot.weightGrams();
  }
  return sum;
}

function locationAt(index: number): string {
  return `D-${Math.floor(index / 24) + 1}-${(index % 24) + 1}`;
}

function countDirect(slots: number): string {
  const before = census.created;
  const sheet: Slot[] = [];
  for (let i = 0; i < slots; i++) {
    const code = codeAt(i);
    const own = new SharedItemSpec(code, unitGramsOf(code));
    sheet.push(new Slot(locationAt(i), (i % 9) + 1, own));
  }
  return `direct: slots=${sheet.length} spec-objects=${census.created - before}`
    + ` total=${totalGrams(sheet)}g`;
}

function countPooled(slots: number): string {
  const before = census.created;
  const pool = new ItemSpecPool();
  const sheet: Slot[] = [];
  for (let i = 0; i < slots; i++) {
    sheet.push(new Slot(locationAt(i), (i % 9) + 1, pool.spec(codeAt(i))));
  }
  return `pooled: slots=${sheet.length} spec-objects=${census.created - before}`
    + ` total=${totalGrams(sheet)}g`;
}

const pool = new ItemSpecPool();
const first = new Slot("A-01-1", 12, pool.spec("SKU-101"));
const second = new Slot("A-01-2", 5, pool.spec("SKU-101"));
const third = new Slot("B-03-4", 2, pool.spec("SKU-204"));
console.log(first.describe());
console.log(second.describe());
console.log(third.describe());
console.log(`same-spec A-01-1,A-01-2 = ${first.spec === second.spec}`);
console.log(`same-spec A-01-1,B-03-4 = ${first.spec === third.spec}`);

const pallet = new MixedPallet();
pallet.add(pool.spec("SKU-330"));
pallet.add(pool.spec("SKU-457"));
console.log(new Slot("C-09-2", 7, pallet).describe());

console.log(countDirect(1200));
console.log(countPooled(1200));
