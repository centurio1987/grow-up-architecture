/** 점검 항목. 배점이 바뀔 수 있는 가변 객체라, 견본과 복제본이 같은 것을 가리키면 안 된다. */
class CheckItem {
  constructor(
    readonly name: string,
    public points: number,
  ) {}

  copy(): CheckItem {
    return new CheckItem(this.name, this.points);
  }
}

/** Prototype — 자기 자신을 복제하는 연산을 선언한다. */
interface Checklist {
  copy(): Checklist;
  assignTo(equipmentId: string, date: string): void;
  redefine(label: string, items: CheckItem[]): void;
  adjust(itemName: string, points: number): void;
  totalPoints(): number;
  render(): string;
}

/** 두 ConcretePrototype 이 함께 쓰는 상태와 깊은 복사 규칙. */
abstract class AbstractChecklist implements Checklist {
  protected label: string;
  protected items: CheckItem[] = [];
  protected equipmentId = '-';
  protected date = '-';

  protected constructor(label: string, items: CheckItem[]) {
    this.label = label;
    this.replaceItems(items);
  }

  abstract copy(): Checklist;

  abstract totalPoints(): number;

  abstract render(): string;

  /** 복제본이 견본과 아무것도 공유하지 않도록 항목까지 새로 만든다. */
  protected copyStateFrom(source: AbstractChecklist): void {
    this.label = source.label;
    this.equipmentId = source.equipmentId;
    this.date = source.date;
    this.replaceItems(source.items);
  }

  private replaceItems(source: CheckItem[]): void {
    this.items = source.map((item) => item.copy());
  }

  assignTo(equipmentId: string, date: string): void {
    this.equipmentId = equipmentId;
    this.date = date;
  }

  redefine(label: string, items: CheckItem[]): void {
    this.label = label;
    this.replaceItems(items);
  }

  adjust(itemName: string, points: number): void {
    for (const item of this.items) {
      if (item.name === itemName) {
        item.points = points;
      }
    }
  }

  protected itemPoints(): number {
    return this.items.reduce((sum, item) => sum + item.points, 0);
  }

  protected itemText(): string {
    return this.items.map((item) => `${item.name} ${item.points}`).join(' · ');
  }

  protected head(): string {
    return `${this.equipmentId} ${this.date}`;
  }
}

/** ConcretePrototype — 일상 점검표. 총점은 항목 배점의 합이다. */
class RoutineChecklist extends AbstractChecklist {
  constructor(label: string, items: CheckItem[]) {
    super(label, items);
  }

  override copy(): Checklist {
    const clone = new RoutineChecklist(this.label, []);
    clone.copyStateFrom(this);
    return clone;
  }

  override totalPoints(): number {
    return this.itemPoints();
  }

  override render(): string {
    return `${this.head()} [일상] ${this.label} ${this.totalPoints()}점 (${this.itemText()})`;
  }
}

/** ConcretePrototype — 법정 안전 점검표. 입회 확인 배점이 항상 더해진다. */
class SafetyChecklist extends AbstractChecklist {
  private static readonly WITNESS_POINTS = 20;

  constructor(label: string, items: CheckItem[]) {
    super(label, items);
  }

  override copy(): Checklist {
    const clone = new SafetyChecklist(this.label, []);
    clone.copyStateFrom(this);
    return clone;
  }

  override totalPoints(): number {
    return this.itemPoints() + SafetyChecklist.WITNESS_POINTS;
  }

  override render(): string {
    return `${this.head()} [법정] ${this.label} ${this.totalPoints()}점 (${this.itemText()})`
      + ` + 입회 확인 ${SafetyChecklist.WITNESS_POINTS}`;
  }
}

/** PrototypeManager — 키로 견본을 등록·조회하고, 요청이 오면 그 견본의 복제본을 낸다. */
class ChecklistCatalog {
  private readonly prototypes = new Map<string, Checklist>();

  register(key: string, prototype: Checklist): void {
    this.prototypes.set(key, prototype);
  }

  unregister(key: string): void {
    this.prototypes.delete(key);
  }

  create(key: string): Checklist {
    const prototype = this.prototypes.get(key);
    if (prototype === undefined) {
      throw new Error(`등록되지 않은 견본: ${key}`);
    }
    return prototype.copy();
  }

  keys(): string[] {
    return [...this.prototypes.keys()];
  }
}

// Client — 견본을 등록하고, 복제해 오늘 자 점검표로 초기화한다.
const catalog = new ChecklistCatalog();
catalog.register('pump-routine', new RoutineChecklist('펌프 일상 점검', [
  new CheckItem('윤활유 상태', 30),
  new CheckItem('진동 측정', 40),
  new CheckItem('누유 확인', 30),
]));
catalog.register('pump-safety', new SafetyChecklist('펌프 법정 안전 점검', [
  new CheckItem('압력 밸브', 40),
  new CheckItem('접지 저항', 30),
]));

const today = catalog.create('pump-routine');
today.assignTo('P-12', '2026-03-11');
console.log(`오늘 점검표 : ${today.render()}`);

const safety = catalog.create('pump-safety');
safety.assignTo('P-12', '2026-03-11');
console.log(`오늘 점검표 : ${safety.render()}`);

today.adjust('진동 측정', 50);
console.log(`복제본 조정 : ${today.render()}`);
console.log(`견본 재복제 : ${catalog.create('pump-routine').render()}`);

const compressor = catalog.create('pump-routine');
compressor.redefine('압축기 일상 점검', [
  new CheckItem('필터 차압', 50),
  new CheckItem('토출 온도', 30),
]);
catalog.register('compressor-routine', compressor);
console.log(`새 견본 등록 : compressor-routine (${catalog.keys().join(', ')})`);

const todayCompressor = catalog.create('compressor-routine');
todayCompressor.assignTo('C-07', '2026-03-11');
console.log(`오늘 점검표 : ${todayCompressor.render()}`);
console.log(`견본 재복제 : ${catalog.create('pump-routine').render()}`);

catalog.unregister('pump-safety');
console.log(`견본 해제 : pump-safety (${catalog.keys().join(', ')})`);
