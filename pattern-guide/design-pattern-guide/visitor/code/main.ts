interface ParcelVisitor {
  visitItem(item: Item): void;
  visitGiftCard(card: GiftCard): void;
  visitGiftBox(box: GiftBox): void;
  visitChilledWrap(wrap: ChilledWrap): void;
}

interface Parcel {
  accept(visitor: ParcelVisitor): void;
}

class Item implements Parcel {
  constructor(
    readonly name: string,
    readonly grams: number,
  ) {}

  accept(visitor: ParcelVisitor): void {
    visitor.visitItem(this);
  }
}

class GiftCard implements Parcel {
  constructor(
    readonly message: string,
    readonly grams: number,
  ) {}

  accept(visitor: ParcelVisitor): void {
    visitor.visitGiftCard(this);
  }
}

class GiftBox implements Parcel {
  private readonly children: Parcel[] = [];

  constructor(
    readonly label: string,
    readonly wrapGrams: number,
  ) {}

  add(child: Parcel): void {
    this.children.push(child);
  }

  accept(visitor: ParcelVisitor): void {
    visitor.visitGiftBox(this);
    for (const child of this.children) {
      child.accept(visitor);
    }
  }
}

class ChilledWrap implements Parcel {
  constructor(
    readonly coolantGrams: number,
    private readonly inner: Parcel,
  ) {}

  accept(visitor: ParcelVisitor): void {
    visitor.visitChilledWrap(this);
    this.inner.accept(visitor);
  }
}

class ShippingDesk {
  private readonly parcels: Parcel[] = [];

  add(parcel: Parcel): void {
    this.parcels.push(parcel);
  }

  accept(visitor: ParcelVisitor): void {
    for (const parcel of this.parcels) {
      parcel.accept(visitor);
    }
  }
}

class WeighVisitor implements ParcelVisitor {
  private total = 0;

  grams(): number {
    return this.total;
  }

  visitItem(item: Item): void {
    this.total += item.grams;
  }

  visitGiftCard(card: GiftCard): void {
    this.total += card.grams;
  }

  visitGiftBox(box: GiftBox): void {
    this.total += box.wrapGrams;
  }

  visitChilledWrap(wrap: ChilledWrap): void {
    this.total += wrap.coolantGrams;
  }
}

class ListVisitor implements ParcelVisitor {
  private readonly collected: string[] = [];

  lines(): string[] {
    return this.collected;
  }

  visitItem(item: Item): void {
    this.collected.push(`[item] ${item.name} ${item.grams} g`);
  }

  visitGiftCard(card: GiftCard): void {
    this.collected.push(`[card] ${card.message} ${card.grams} g`);
  }

  visitGiftBox(box: GiftBox): void {
    this.collected.push(`[box] ${box.label} wrap ${box.wrapGrams} g`);
  }

  visitChilledWrap(wrap: ChilledWrap): void {
    this.collected.push(`[cold] coolant ${wrap.coolantGrams} g`);
  }
}

class CountVisitor implements ParcelVisitor {
  private total = 0;

  items(): number {
    return this.total;
  }

  visitItem(_item: Item): void {
    this.total += 1;
  }

  visitGiftCard(_card: GiftCard): void {
    this.total += 1;
  }

  visitGiftBox(_box: GiftBox): void {}

  visitChilledWrap(_wrap: ChilledWrap): void {}
}

const extras = new GiftBox("extras", 45);
extras.add(new Item("tea bags", 60));
extras.add(new Item("postcard", 15));

const gift = new GiftBox("GIFT-301", 120);
gift.add(new Item("mug", 320));
gift.add(extras);
gift.add(new GiftCard("thank-you", 5));
gift.add(new ChilledWrap(250, new Item("chocolate", 180)));

const desk = new ShippingDesk();
desk.add(gift);

const weigh = new WeighVisitor();
desk.accept(weigh);
console.log(`1) total weight: ${weigh.grams()} g`);

const list = new ListVisitor();
desk.accept(list);
console.log("2) contents list:");
for (const line of list.lines()) {
  console.log(line);
}

const count = new CountVisitor();
desk.accept(count);
console.log(`3) contents count: ${count.items()}`);

desk.add(new Item("mug", 320));
const bothWeigh = new WeighVisitor();
const bothCount = new CountVisitor();
desk.accept(bothWeigh);
desk.accept(bothCount);
console.log(`4) desk with two parcels: ${bothWeigh.grams()} g, count ${bothCount.items()}`);
