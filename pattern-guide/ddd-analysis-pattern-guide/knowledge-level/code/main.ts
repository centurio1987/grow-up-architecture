// 브랜드 타입: 구조적 타이핑이라 그냥 string 이면 id 네 종류가 서로 섞인다
type EquipmentTypeId = string & { readonly __brand: "EquipmentTypeId" };
type InspectionTypeId = string & { readonly __brand: "InspectionTypeId" };
type EquipmentId = string & { readonly __brand: "EquipmentId" };
type InspectionId = string & { readonly __brand: "InspectionId" };

const equipmentTypeId = (value: string): EquipmentTypeId => value as EquipmentTypeId;
const inspectionTypeId = (value: string): InspectionTypeId => value as InspectionTypeId;
const equipmentId = (value: string): EquipmentId => value as EquipmentId;
const inspectionId = (value: string): InspectionId => value as InspectionId;

// VO: 정상으로 보는 수치 구간. 양 끝을 포함한다
class NormalRange {
  constructor(readonly low: number, readonly high: number) {}
  contains(amount: number): boolean { return this.low <= amount && amount <= this.high; }
  toString(): string { return `${this.low}..${this.high}`; }
}

// VO: 수치와 단위를 묶은 측정값 — 단위를 들고 오는 이유는 대조할 상대가 지식 층위에 있기 때문이다
class Reading {
  constructor(readonly amount: number, readonly unit: string) {}
  toString(): string { return `${this.amount} ${this.unit}`; }
}

// VO: 기록 시점에 적용한 범위와 그 결과. 한 번 정해지면 바뀌지 않는다
class Verdict {
  constructor(readonly label: string, readonly applied: NormalRange) {}
  toString(): string { return `${this.label} (적용 범위 ${this.applied})`; }
}

// VO: 점검 종류가 내놓는 규칙 한 벌 — 운영 층위가 지식 객체에서 받는 것은 이 값뿐이다
class InspectionRule {
  constructor(
    readonly typeId: InspectionTypeId,
    readonly unit: string,
    readonly range: NormalRange,
    readonly allowed: readonly EquipmentTypeId[],
  ) {}
  allows(typeId: EquipmentTypeId): boolean { return this.allowed.includes(typeId); }
  judge(reading: Reading): Verdict {
    return new Verdict(this.range.contains(reading.amount) ? '정상' : '이상', this.range);
  }
}

// aggregate root, 지식 층위: 설비를 가르는 분류
class EquipmentType {
  constructor(readonly id: EquipmentTypeId, readonly name: string) {}
}

// aggregate root, 지식 층위: 무엇을 재고 · 어디에 쓸 수 있고 · 어디까지가 정상인지 셋을 한 인스턴스가 쥔다
class InspectionType {
  private range: NormalRange;
  private readonly allowed: EquipmentTypeId[];

  constructor(
    readonly id: InspectionTypeId,
    private readonly name: string,
    private readonly item: string,
    private readonly unit: string,
    range: NormalRange,
    allowed: readonly EquipmentTypeId[],
  ) {
    if (allowed.length === 0) {
      throw new Error(`점검 종류 ${id} 의 허용 설비 종류가 비어 있습니다`);
    }
    this.range = range;
    this.allowed = [...allowed];
  }

  rule(): InspectionRule {
    return new InspectionRule(this.id, this.unit, this.range, [...this.allowed]);
  }

  allow(typeId: EquipmentTypeId): void {
    if (!this.allowed.includes(typeId)) this.allowed.push(typeId);
  }

  currentRange(): NormalRange { return this.range; }
  narrowTo(narrower: NormalRange): void { this.range = narrower; }
  allowedTypes(): readonly EquipmentTypeId[] { return [...this.allowed]; }

  describe(): string {
    return `점검 종류 ${this.id} ${this.name}: ${this.item} ${this.range} ${this.unit}`
      + `, 허용 설비 종류 ${labels(this.allowed)}`;
  }
}

function labels(ids: readonly EquipmentTypeId[]): string {
  return `[${ids.join(', ')}]`;
}

// aggregate root, 운영 층위: 현장에 있는 설비 한 대
class Equipment {
  constructor(readonly id: EquipmentId, readonly name: string, readonly typeId: EquipmentTypeId) {}
}

// aggregate root, 운영 층위: 점검 한 건의 사실. 규칙은 하나도 들고 있지 않다
class Inspection {
  private constructor(
    readonly id: InspectionId,
    private readonly equipmentId: EquipmentId,
    private readonly typeId: InspectionTypeId,
    private readonly date: string,
    private readonly reading: Reading,
    readonly verdict: Verdict,
  ) {}

  static record(
    id: InspectionId,
    equipmentId: EquipmentId,
    equipmentTypeId: EquipmentTypeId,
    date: string,
    reading: Reading,
    rule: InspectionRule,
  ): Inspection {
    if (!rule.allows(equipmentTypeId)) {
      throw new Error(`점검 종류 ${rule.typeId} 은 설비 종류 ${equipmentTypeId} 을 허용하지 않습니다`);
    }
    if (rule.unit !== reading.unit) {
      throw new Error(`점검 종류 ${rule.typeId} 는 ${rule.unit} 을 요구하는데 측정값이 ${reading.unit} 입니다`);
    }
    return new Inspection(id, equipmentId, rule.typeId, date, reading, rule.judge(reading));
  }

  line(): string {
    return `${this.id} ${this.date} ${this.equipmentId} 을 ${this.typeId} 로 -> `
      + `${this.reading}, 판정 ${this.verdict}`;
  }
}

// 지식 층위 등록부 — 등록 서비스이자 저장소 (aggregate 아님)
class TypeCatalog {
  private readonly equipmentTypes = new Map<string, EquipmentType>();
  private readonly inspectionTypes = new Map<string, InspectionType>();

  registerEquipmentType(type: EquipmentType): void { this.equipmentTypes.set(type.id, type); }
  registerInspectionType(type: InspectionType): void { this.inspectionTypes.set(type.id, type); }

  inspectionType(id: InspectionTypeId): InspectionType {
    const found = this.inspectionTypes.get(id);
    if (found === undefined) throw new Error(`점검 종류 ${id} 가 없습니다`);
    return found;
  }

  ruleOf(id: InspectionTypeId): InspectionRule { return this.inspectionType(id).rule(); }
  equipmentTypeCount(): number { return this.equipmentTypes.size; }
  inspectionTypeCount(): number { return this.inspectionTypes.size; }
}

// 운영 층위 장부 — 기록 서비스이자 저장소 (aggregate 아님)
class SiteLog {
  private readonly equipments = new Map<string, Equipment>();
  private readonly inspections: Inspection[] = [];

  add(equipment: Equipment): void { this.equipments.set(equipment.id, equipment); }

  record(
    catalog: TypeCatalog,
    id: InspectionId,
    target: EquipmentId,
    typeId: InspectionTypeId,
    date: string,
    reading: Reading,
  ): Inspection {
    const equipment = this.equipments.get(target);
    if (equipment === undefined) throw new Error(`설비 ${target} 가 없습니다`);
    const inspection = Inspection.record(
      id, target, equipment.typeId, date, reading, catalog.ruleOf(typeId),
    );
    this.inspections.push(inspection);
    return inspection;
  }

  equipmentCount(): number { return this.equipments.size; }
  inspectionCount(): number { return this.inspections.length; }
}

const EV = equipmentTypeId('ET-EV');
const BL = equipmentTypeId('ET-BL');
const FS = equipmentTypeId('ET-FS');
const IT1 = inspectionTypeId('IT-1');
const IT2 = inspectionTypeId('IT-2');
const IT3 = inspectionTypeId('IT-3');
const IT4 = inspectionTypeId('IT-4');
const EV01 = equipmentId('EV-01');
const BL01 = equipmentId('BL-01');
const FS01 = equipmentId('FS-01');

function reject(what: string, body: () => void): void {
  try { body(); } catch (caught) {
    console.log(`거절(${what}): ${(caught as Error).message}`);
  }
}

const catalog = new TypeCatalog();
const log = new SiteLog();

catalog.registerEquipmentType(new EquipmentType(EV, '승강기'));
catalog.registerEquipmentType(new EquipmentType(BL, '보일러'));
console.log('[지식] 설비 종류 ET-EV 승강기 · ET-BL 보일러');
catalog.registerInspectionType(new InspectionType(
  IT1, '승강기 정기점검', '제동거리', 'mm', new NormalRange(0, 60), [EV]));
catalog.registerInspectionType(new InspectionType(
  IT2, '보일러 연소점검', '배기CO', 'ppm', new NormalRange(0, 400), [BL]));
console.log(`[지식] ${catalog.inspectionType(IT1).describe()}`);
console.log(`[지식] ${catalog.inspectionType(IT2).describe()}`);

log.add(new Equipment(EV01, '승강기', EV));
log.add(new Equipment(BL01, '보일러', BL));
console.log('[운영] 설비 EV-01 승강기 (ET-EV) · BL-01 보일러 (ET-BL)');

const first = log.record(catalog, inspectionId('INS-1'), EV01, IT1, '2026-03-05', new Reading(48, 'mm'));
console.log(first.line());
console.log(log.record(catalog, inspectionId('INS-2'), BL01, IT2, '2026-03-06', new Reading(520, 'ppm')).line());

reject('허용 조합 아님', () =>
  log.record(catalog, inspectionId('INS-X'), BL01, IT1, '2026-03-06', new Reading(0, 'mm')));
reject('단위 다름', () =>
  log.record(catalog, inspectionId('INS-X'), BL01, IT2, '2026-03-06', new Reading(48, 'mm')));
reject('허용 설비 종류 없음', () => new InspectionType(
  inspectionTypeId('IT-9'), '미정 점검', '미정', '회', new NormalRange(0, 1), []));

catalog.registerInspectionType(new InspectionType(
  IT3, '승강기 비상통화', '응답시간', 's', new NormalRange(0, 10), [EV]));
catalog.registerInspectionType(new InspectionType(
  IT4, '안전표지', '훼손개수', '개', new NormalRange(0, 0), [EV, BL]));
console.log(`[지식] ${catalog.inspectionType(IT3).describe()}`);
console.log(`[지식] ${catalog.inspectionType(IT4).describe()}`);

catalog.registerEquipmentType(new EquipmentType(FS, '소방설비'));
catalog.inspectionType(IT4).allow(FS);
console.log('[지식] 설비 종류 ET-FS 소방설비 · 점검 종류 IT-4 의 허용 설비 종류에 ET-FS 를 더함 -> '
  + labels(catalog.inspectionType(IT4).allowedTypes()));
log.add(new Equipment(FS01, '소방설비', FS));
console.log('[운영] 설비 FS-01 소방설비 (ET-FS)');

console.log(log.record(catalog, inspectionId('INS-3'), EV01, IT3, '2026-04-02', new Reading(7, 's')).line());
console.log(log.record(catalog, inspectionId('INS-4'), BL01, IT4, '2026-04-02', new Reading(1, '개')).line());
console.log(log.record(catalog, inspectionId('INS-5'), FS01, IT4, '2026-04-02', new Reading(0, '개')).line());

const before = catalog.inspectionType(IT1).currentRange();
catalog.inspectionType(IT1).narrowTo(new NormalRange(0, 40));
console.log(`[지식] 점검 종류 IT-1 의 정상 범위를 ${before} 에서 ${catalog.inspectionType(IT1).currentRange()} 으로 좁힘`);
console.log(`INS-1 판정 그대로: ${first.verdict}`);
console.log(log.record(catalog, inspectionId('INS-6'), EV01, IT1, '2026-04-03', new Reading(48, 'mm')).line());

console.log(`점검 ${log.inspectionCount()}건 · 점검 종류 ${catalog.inspectionTypeCount()}개 · `
  + `설비 종류 ${catalog.equipmentTypeCount()}개 · 설비 ${log.equipmentCount()}대`);
