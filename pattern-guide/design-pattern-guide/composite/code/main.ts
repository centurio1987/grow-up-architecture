/** Component — 배송 데스크가 보는 단 하나의 타입. */
interface Parcel {
  weightInGrams(): number;
  lines(indent: string): string[];
}

/** Leaf — 자식을 들지 않는다. 요청이 여기서 끝난다. */
class Item implements Parcel {
  constructor(
    private readonly name: string,
    private readonly grams: number,
  ) {}

  weightInGrams(): number {
    return this.grams;
  }

  lines(indent: string): string[] {
    return [`${indent}- ${this.name} ${this.grams} g`];
  }
}

/** Leaf — 나중에 더해진 새 종류. Parcel 만 구현하면 기존 코드는 그대로다. */
class GiftCard implements Parcel {
  private static readonly GRAMS = 5;

  constructor(private readonly message: string) {}

  weightInGrams(): number {
    return GiftCard.GRAMS;
  }

  lines(indent: string): string[] {
    return [`${indent}- card "${this.message}" ${GiftCard.GRAMS} g`];
  }
}

/** Composite — Parcel 자식을 0개 이상 들고, 자기 몫을 더해 전체를 만든다. */
class GiftBox implements Parcel {
  private readonly children: Parcel[] = [];

  constructor(
    private readonly name: string,
    private readonly wrapGrams: number,
  ) {}

  add(child: Parcel): void {
    this.children.push(child);
  }

  weightInGrams(): number {
    let total = this.wrapGrams;
    for (const child of this.children) {
      total += child.weightInGrams();
    }
    return total;
  }

  lines(indent: string): string[] {
    const out = [`${indent}[box] ${this.name} +${this.wrapGrams} g wrap`];
    for (const child of this.children) {
      out.push(...child.lines(`${indent}  `));
    }
    return out;
  }
}

/** 비교용 데코레이터 — Parcel 하나를 감싼다. 자식 집합이 아니다. */
class ChilledWrap implements Parcel {
  constructor(
    private readonly inner: Parcel,
    private readonly coolantGrams: number,
  ) {}

  weightInGrams(): number {
    return this.inner.weightInGrams() + this.coolantGrams;
  }

  lines(indent: string): string[] {
    return [`${indent}(chilled +${this.coolantGrams} g)`, ...this.inner.lines(`${indent}  `)];
  }
}

/** Client — Parcel 타입만 본다. 낱개인지 묶음인지 묻지 않는다. */
class ShippingDesk {
  quote(parcel: Parcel): string {
    return `${parcel.weightInGrams()} g`;
  }

  manifest(parcel: Parcel): string {
    return parcel.lines("").join("\n");
  }
}

const desk = new ShippingDesk();

const mug = new Item("mug", 320);
console.log(`1) mug alone: ${desk.quote(mug)}`);

const extras = new GiftBox("extras", 45);
extras.add(new Item("tea bags", 60));
extras.add(new Item("postcard", 15));

const giftBox = new GiftBox("GIFT-301", 120);
giftBox.add(mug);
giftBox.add(extras);
console.log(`2) gift box GIFT-301: ${desk.quote(giftBox)}`);

console.log("3) contents of GIFT-301:");
console.log(desk.manifest(giftBox));

const freebie = new GiftBox("freebie", 30);
freebie.add(new Item("sample pouch", 55));
giftBox.add(freebie);
console.log(`4) freebie box added: ${desk.quote(giftBox)}`);

giftBox.add(new GiftCard("thank you"));
console.log(`5) gift card added: ${desk.quote(giftBox)}`);

const chilled = new ChilledWrap(giftBox, 250);
console.log(`6) chilled wrap around GIFT-301: ${desk.quote(chilled)}`);

const cooler = new GiftBox("cooler", 20);
cooler.add(new ChilledWrap(new Item("mug", 320), 250));
console.log(`7) box holding a chilled mug: ${desk.quote(cooler)}`);

console.log(`8) empty box: ${desk.quote(new GiftBox("empty", 10))}`);
