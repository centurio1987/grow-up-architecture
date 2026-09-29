/** 값 — 식별자. 브랜드가 달려 있어 대상 id 를 항목 id 자리에 넣으면 컴파일이 막힌다. */
type Id<K extends string> = { readonly brand: K; readonly value: string };
const makeId = <K extends string>(brand: K, value: string): Id<K> => ({ brand, value });
type SubjectId = Id<'subject'>;
type PhenomenonTypeId = Id<'phenomenonType'>;
type PhenomenonId = Id<'phenomenon'>;
type ObservationId = Id<'observation'>;

/** 값 — 수치와 단위를 한 값으로 묶는다. 환산과 산술은 Quantity 패턴의 몫이다. */
type Quantity = { readonly amount: number; readonly unit: string };
const quantity = (amount: number, unit: string): Quantity => ({ amount, unit });
const showQuantity = (q: Quantity): string => `${q.amount} ${q.unit}`;

/** 값 — ISO yyyy-mm-dd 하루. 이 표기는 문자열 순서가 날짜 순서와 같다. */
type TimePoint = { readonly iso: string };
const day = (iso: string): TimePoint => ({ iso });

/** 값 — 거부 표시. 값을 지우는 대신 이것이 붙는다. */
type Rejection = { readonly reason: string; readonly rejectedOn: TimePoint };

/** 값 — 관측의 값 자리. 크기가 오면 수치 관측이고 범주가 오면 범주형 관측이다. */
type ObservedValue =
  | { readonly kind: 'magnitude'; readonly quantity: Quantity }
  | { readonly kind: 'category'; readonly phenomenonId: PhenomenonId };
const magnitude = (q: Quantity): ObservedValue => ({ kind: 'magnitude', quantity: q });
const category = (label: string): ObservedValue =>
  ({ kind: 'category', phenomenonId: makeId('phenomenon', `ph-${label}`) });

/** entity — 항목이 든 통제된 범주 값 하나. 항목 aggregate 안에 산다. */
type Phenomenon = { readonly id: PhenomenonId; readonly label: string };

/** 값 — 항목이 정하는 값의 종류. 크기 항목은 허용 단위를, 범주 항목은 범주 목록을 든다. */
type ItemKind =
  | { readonly kind: 'magnitude'; readonly allowedUnit: string }
  | { readonly kind: 'category'; readonly phenomena: readonly Phenomenon[] };

/** 지식 층위 aggregate root — 무엇에 대한 사실인가. 새 항목은 인스턴스 하나이지 타입 하나가 아니다. */
class PhenomenonType {
  private constructor(
    readonly id: PhenomenonTypeId,
    readonly name: string,
    private readonly itemKind: ItemKind,
  ) {
    if (name.trim() === '') throw new Error('항목은 이름을 가집니다');
  }

  static magnitude(id: string, name: string, allowedUnit: string): PhenomenonType {
    if (allowedUnit.trim() === '') throw new Error('크기 항목은 허용 단위를 하나 가집니다');
    return new PhenomenonType(makeId('phenomenonType', id), name, { kind: 'magnitude', allowedUnit });
  }

  static category(id: string, name: string, ...labels: string[]): PhenomenonType {
    if (labels.length === 0) throw new Error('범주 항목은 범주를 하나 이상 가집니다');
    const phenomena = labels.map((label) => ({ id: makeId('phenomenon', `ph-${label}`), label }));
    return new PhenomenonType(makeId('phenomenonType', id), name, { kind: 'category', phenomena });
  }

  /** 값이 이 항목이 정한 종류·단위·범주에 맞는가. 어긋나면 왜 어긋나는지를 돌려준다. */
  check(value: ObservedValue): string | null {
    if (this.itemKind.kind === 'magnitude') {
      if (value.kind !== 'magnitude') return `크기 항목 ${this.name} 에 범주 값을 넣었습니다`;
      return this.itemKind.allowedUnit === value.quantity.unit
        ? null
        : `항목 ${this.name} 의 허용 단위는 ${this.itemKind.allowedUnit} 인데 값의 단위는 ${value.quantity.unit} 입니다`;
    }
    if (value.kind !== 'category') return `범주 항목 ${this.name} 에 크기 값을 넣었습니다`;
    return this.labelOf(value.phenomenonId) !== null
      ? null
      : `범주 ${value.phenomenonId.value} 는 항목 ${this.name} 의 범주가 아닙니다`;
  }

  labelOf(pid: PhenomenonId): string | null {
    if (this.itemKind.kind !== 'category') return null;
    return this.itemKind.phenomena.find((p) => p.id.value === pid.value)?.label ?? null;
  }

  describe(): string {
    if (this.itemKind.kind === 'magnitude') {
      return `항목 ${this.name} — 크기 항목 · 허용 단위 ${this.itemKind.allowedUnit}`;
    }
    return `항목 ${this.name} — 범주 항목 · 범주 ${this.itemKind.phenomena.map((p) => p.label).join(' · ')}`;
  }
}

/** 운영 층위 aggregate root — 대상에 대한 사실 한 건. 값의 종류를 모르는 층이 여기다. */
class Observation {
  private mark: Rejection | null = null;

  constructor(
    readonly id: ObservationId,
    readonly subjectId: SubjectId,
    readonly typeId: PhenomenonTypeId,
    readonly value: ObservedValue,
    readonly takenOn: TimePoint,
    readonly recordedOn: TimePoint,
  ) {
    if (takenOn.iso > recordedOn.iso) {
      throw new Error(`잰 날 ${takenOn.iso} 는 적은 날 ${recordedOn.iso} 보다 뒤입니다`);
    }
  }

  get rejection(): Rejection | null {
    return this.mark;
  }

  /** 거부는 표시를 더하는 일이다 — 값 자리도 두 시각도 건드리지 않는다. */
  reject(reason: string, on: TimePoint): void {
    if (this.mark !== null) throw new Error(`${this.id.value} 는 이미 거부된 관측입니다`);
    if (reason.trim() === '' || on.iso < this.recordedOn.iso) {
      throw new Error('거부는 사유를 달고, 적은 날보다 앞선 날짜로는 남기지 않습니다');
    }
    this.mark = { reason, rejectedOn: on };
  }

  /** asOf 시점에 이 사실이 유효한 것으로 읽혔는가 — 적은 날이 지났고, 아직 거부되지 않았는가. */
  validAsOf(asOf: TimePoint): boolean {
    if (this.recordedOn.iso > asOf.iso) return false;
    return this.mark === null || this.mark.rejectedOn.iso > asOf.iso;
  }
}

/** aggregate 가 아니다 — 두 aggregate 를 id 로 찾아 조립하고 조회에 답하는 자리. */
class ObservationDesk {
  private readonly types: PhenomenonType[] = [];
  private readonly book: Observation[] = [];

  register(type: PhenomenonType): PhenomenonType {
    this.types.push(type);
    return type;
  }

  private type(id: PhenomenonTypeId): PhenomenonType {
    const found = this.types.find((t) => t.id.value === id.value);
    if (found === undefined) throw new Error(`없는 항목입니다: ${id.value}`);
    return found;
  }

  find(id: ObservationId): Observation {
    const found = this.book.find((o) => o.id.value === id.value);
    if (found === undefined) throw new Error(`없는 관측입니다: ${id.value}`);
    return found;
  }

  record(obsId: string, subject: SubjectId, typeId: PhenomenonTypeId, value: ObservedValue,
         takenOn: TimePoint, recordedOn: TimePoint): ObservationId {
    const bad = this.type(typeId).check(value);
    if (bad !== null) throw new Error(bad);
    const o = new Observation(makeId('observation', obsId), subject, typeId, value, takenOn, recordedOn);
    this.book.push(o);
    return o.id;
  }

  reject(id: ObservationId, reason: string, on: TimePoint): void {
    this.find(id).reject(reason, on);
  }

  /** 그 날 기준으로 알던 사실 — 적은 날이 지났고 아직 거부되지 않은 것 중 가장 나중에 잰 것. */
  knownOn(asOf: TimePoint, subject: SubjectId, typeId: PhenomenonTypeId): Observation | null {
    let best: Observation | null = null;
    for (const o of this.book) {
      if (o.subjectId.value !== subject.value || o.typeId.value !== typeId.value || !o.validAsOf(asOf)) continue;
      if (best === null || o.takenOn.iso >= best.takenOn.iso) best = o;
    }
    return best;
  }

  knownLabel(asOf: TimePoint, subject: SubjectId, typeId: PhenomenonTypeId): string {
    const found = this.knownOn(asOf, subject, typeId);
    return found === null ? '없음' : this.show(found.value);
  }

  /** 대상에 대해 그 날 알던 사실 전부 — 값의 종류로 갈라 묻지 않는다. */
  allKnownOn(asOf: TimePoint, subject: SubjectId): string {
    const out: string[] = [];
    for (const t of this.types) {
      const o = this.knownOn(asOf, subject, t.id);
      if (o !== null) out.push(`${t.name} ${this.show(o.value)}`);
    }
    return `${asOf.iso} 에 알던 ${subject.value} 의 사실 ${out.length}건 — ${out.join(' · ')}`;
  }

  show(value: ObservedValue): string {
    if (value.kind === 'magnitude') return showQuantity(value.quantity);
    for (const t of this.types) {
      const label = t.labelOf(value.phenomenonId);
      if (label !== null) return label;
    }
    return value.phenomenonId.value;
  }

  describe(id: ObservationId): string {
    const o = this.find(id);
    return `관측 ${id.value} — ${o.subjectId.value} · ${this.type(o.typeId).name} · ${this.show(o.value)}`
      + ` · 잰 날 ${o.takenOn.iso} · 적은 날 ${o.recordedOn.iso}`;
  }
}

const attempt = (fn: () => void): void => {
  try {
    fn();
  } catch (thrown) {
    console.log(`거부 — ${thrown instanceof Error ? thrown.message : String(thrown)}`);
  }
};

const desk = new ObservationDesk();
const p7 = makeId('subject', 'p-7');
const abo = makeId('phenomenonType', 'pt-abo');
const sbp = makeId('phenomenonType', 'pt-systolic');
const smk = makeId('phenomenonType', 'pt-smoking');
const o4 = makeId('observation', 'o-4');

console.log(desk.register(PhenomenonType.category('pt-abo', 'abo', 'A', 'B', 'O', 'AB')).describe());
console.log(desk.register(PhenomenonType.magnitude('pt-systolic', 'systolic', 'mmHg')).describe());
desk.record('o-1', p7, sbp, magnitude(quantity(118, 'mmHg')), day('2026-09-01'), day('2026-09-01'));
console.log(desk.describe(makeId('observation', 'o-1')));
desk.record('o-2', p7, abo, category('A'), day('2026-09-01'), day('2026-09-01'));
console.log(desk.describe(makeId('observation', 'o-2')));
console.log(desk.allKnownOn(day('2026-09-01'), p7));

console.log(`${desk.register(PhenomenonType.category('pt-smoking', 'smoking', 'smoker', 'non-smoker'))
  .describe()} (고친 타입 없음)`);
desk.record('o-3', p7, smk, category('non-smoker'), day('2026-09-01'), day('2026-09-03'));
console.log(desk.describe(makeId('observation', 'o-3')));
console.log(`2026-09-02 에 알던 p-7 의 smoking — ${desk.knownLabel(day('2026-09-02'), p7, smk)}`);
console.log(`2026-09-04 에 알던 p-7 의 smoking — ${desk.knownLabel(day('2026-09-04'), p7, smk)}`);

desk.record('o-4', p7, abo, category('B'), day('2026-09-03'), day('2026-09-03'));
console.log(desk.describe(o4));
desk.reject(o4, '오기', day('2026-09-04'));
const mark = desk.find(o4).rejection;
console.log(`o-4 거부 — 사유 ${mark?.reason ?? ''} · 거부한 날 ${mark?.rejectedOn.iso ?? ''}`);
console.log(`o-4 의 값은 그대로 ${desk.show(desk.find(o4).value)}`);
desk.record('o-5', p7, abo, category('A'), day('2026-09-03'), day('2026-09-04'));
console.log(desk.describe(makeId('observation', 'o-5')));
console.log(`2026-09-03 에 알던 p-7 의 abo — ${desk.knownLabel(day('2026-09-03'), p7, abo)}`);
console.log(`2026-09-30 에 알던 p-7 의 abo — ${desk.knownLabel(day('2026-09-30'), p7, abo)}`);
console.log(desk.allKnownOn(day('2026-09-30'), p7));

attempt(() => desk.record('x-1', p7, abo, magnitude(quantity(1, 'code')), day('2026-09-05'), day('2026-09-05')));
attempt(() => desk.record('x-2', p7, abo, category('smoker'), day('2026-09-05'), day('2026-09-05')));
attempt(() => desk.record('x-3', p7, sbp, category('A'), day('2026-09-05'), day('2026-09-05')));
attempt(() => desk.record('x-4', p7, sbp, magnitude(quantity(72, 'bpm')), day('2026-09-05'), day('2026-09-05')));
attempt(() => desk.reject(o4, '중복', day('2026-09-05')));
attempt(() => desk.record('x-5', p7, sbp, magnitude(quantity(120, 'mmHg')), day('2026-09-05'), day('2026-09-04')));
