/** 값 — 수치와 단위를 한 값으로 묶는다. 단위끼리의 환산과 산술은 Quantity 패턴의 몫이다. */
class Quantity {
  constructor(readonly amount: number, readonly unit: string) {
    Object.freeze(this);
  }
  toString(): string {
    return `${this.amount} ${this.unit}`;
  }
}

/** 값 — ISO yyyy-mm-dd 하루. 이 표기는 문자열 순서가 날짜 순서와 같다. */
class TimePoint {
  private constructor(readonly iso: string) {
    Object.freeze(this);
  }
  static of(iso: string): TimePoint {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) throw new Error(`날짜 꼴이 아닙니다: ${iso}`);
    return new TimePoint(iso);
  }
  compareTo(other: TimePoint): number {
    return this.iso < other.iso ? -1 : this.iso > other.iso ? 1 : 0;
  }
  toString(): string {
    return this.iso;
  }
}

class SubjectId {
  constructor(readonly value: string) {
    Object.freeze(this);
  }
}
class PhenomenonTypeId {
  constructor(readonly value: string) {
    Object.freeze(this);
  }
}
class MeasurementId {
  constructor(readonly value: string) {
    Object.freeze(this);
  }
}

/** 값 — 거부 표시. 값을 지우는 대신 이것이 붙는다. */
class Rejection {
  constructor(readonly reason: string, readonly rejectedOn: TimePoint) {
    Object.freeze(this);
  }
}

/** 지식 층위 aggregate root — 무엇을 재는가. 새 항목은 인스턴스 하나이지 타입 하나가 아니다. */
class PhenomenonType {
  private constructor(readonly name: string, readonly allowedUnit: string) {
    Object.freeze(this);
  }
  static of(name: string, allowedUnit: string): PhenomenonType {
    if (name.trim() === '' || allowedUnit.trim() === '') {
      throw new Error('항목은 이름과 허용 단위를 하나씩 가집니다');
    }
    return new PhenomenonType(name, allowedUnit);
  }
  allows(q: Quantity): boolean {
    return this.allowedUnit === q.unit;
  }
}

/** 운영 층위 aggregate root — 대상 하나 · 항목 하나 · 값 하나를 묶은 기록 한 건. */
class Measurement {
  private rejectionMark: Rejection | null = null;

  constructor(
    readonly id: MeasurementId,
    readonly subjectId: SubjectId,
    readonly typeId: PhenomenonTypeId,
    readonly quantity: Quantity,
    readonly takenOn: TimePoint,
    readonly recordedOn: TimePoint,
  ) {
    if (takenOn.compareTo(recordedOn) > 0) {
      throw new Error(`잰 날 ${takenOn} 는 적은 날 ${recordedOn} 보다 뒤입니다`);
    }
  }

  get rejection(): Rejection | null {
    return this.rejectionMark;
  }

  reject(reason: string, on: TimePoint): void {
    if (this.rejectionMark !== null) throw new Error(`${this.id.value} 은 이미 거부된 기록입니다`);
    if (on.compareTo(this.recordedOn) < 0 || reason.trim() === '') {
      throw new Error('거부는 사유를 달고, 적은 날보다 앞선 날짜로는 남기지 않습니다');
    }
    this.rejectionMark = new Rejection(reason, on);
  }

  /** asOf 시점에 이 기록이 유효한 것으로 읽혔는가 — 적은 날이 지났고, 아직 거부되지 않았는가. */
  validAsOf(asOf: TimePoint): boolean {
    if (this.recordedOn.compareTo(asOf) > 0) return false;
    return this.rejectionMark === null || this.rejectionMark.rejectedOn.compareTo(asOf) > 0;
  }
}

/** aggregate 가 아니다 — 두 aggregate 를 id 로 찾아 조립하고 조회에 답하는 자리. */
class MeasurementDesk {
  private readonly types = new Map<string, PhenomenonType>();
  private readonly book: Measurement[] = [];

  addType(id: PhenomenonTypeId, type: PhenomenonType): void {
    this.types.set(id.value, type);
  }

  record(id: string, subjectId: SubjectId, typeId: PhenomenonTypeId,
         quantity: Quantity, takenOn: string, recordedOn: string): number {
    const type = this.types.get(typeId.value);
    if (type === undefined) throw new Error(`등록되지 않은 항목입니다: ${typeId.value}`);
    if (!type.allows(quantity)) {
      throw new Error(
        `항목 ${type.name} 의 허용 단위는 ${type.allowedUnit} 인데 값의 단위는 ${quantity.unit} 입니다`,
      );
    }
    this.book.push(new Measurement(new MeasurementId(id), subjectId, typeId, quantity,
      TimePoint.of(takenOn), TimePoint.of(recordedOn)));
    return this.book.length - 1;
  }

  indexOf(id: string): number {
    const at = this.book.findIndex((m) => m.id.value === id);
    if (at < 0) throw new Error(`없는 기록입니다: ${id}`);
    return at;
  }

  reject(id: string, reason: string, on: string): void {
    this.at(this.indexOf(id)).reject(reason, TimePoint.of(on));
  }

  at(index: number): Measurement {
    const found = this.book[index];
    if (found === undefined) throw new Error(`없는 자리입니다: ${index}`);
    return found;
  }

  typeName(typeId: PhenomenonTypeId): string {
    return this.types.get(typeId.value)?.name ?? '';
  }

  rows(subjectId: SubjectId, typeId: PhenomenonTypeId): Measurement[] {
    return this.book.filter((m) => m.subjectId.value === subjectId.value && m.typeId.value === typeId.value);
  }

  /** 그 날 기준으로 알고 있던 값 — 두 시각을 따로 두면 이 질문 하나로 과거와 현재를 함께 답한다. */
  knownOn(asOf: string, subjectId: SubjectId, typeId: PhenomenonTypeId): Measurement | null {
    const day = TimePoint.of(asOf);
    return this.rows(subjectId, typeId)
      .filter((m) => m.validAsOf(day))
      .reduce<Measurement | null>(
        (best, m) => (best !== null && best.takenOn.compareTo(m.takenOn) > 0 ? best : m),
        null,
      );
  }
}

function show(desk: MeasurementDesk, at: number): void {
  const m = desk.at(at);
  console.log(
    `기록 ${m.id.value} — 환자 ${m.subjectId.value} · ${desk.typeName(m.typeId)} · ${m.quantity}` +
      ` · 잰 날 ${m.takenOn} · 적은 날 ${m.recordedOn}`,
  );
}

function attempt(action: () => void): void {
  try {
    action();
  } catch (thrown) {
    console.log(`거부 — ${thrown instanceof Error ? thrown.message : String(thrown)}`);
  }
}

const desk = new MeasurementDesk();
const patient = new SubjectId('p-7');
const systolic = new PhenomenonTypeId('pt-1');
desk.addType(systolic, PhenomenonType.of('systolic', 'mmHg'));
console.log('항목 systolic — 허용 단위 mmHg');

show(desk, desk.record('m-1', patient, systolic, new Quantity(118, 'mmHg'), '2026-09-01', '2026-09-01'));
attempt(() => desk.record('m-x', patient, systolic, new Quantity(72, 'bpm'), '2026-09-01', '2026-09-01'));

const pulse = new PhenomenonTypeId('pt-2');
desk.addType(pulse, PhenomenonType.of('pulse', 'bpm'));
console.log('항목 추가 pulse — 허용 단위 bpm (고친 코드 없음)');
show(desk, desk.record('m-2', patient, pulse, new Quantity(72, 'bpm'), '2026-09-01', '2026-09-03'));
for (const day of ['2026-09-02', '2026-09-04']) {
  const seen = desk.knownOn(day, patient, pulse);
  console.log(`${day} 에 알던 p-7 의 pulse — ${seen === null ? '없음' : seen.quantity.toString()}`);
}

show(desk, desk.record('m-3', patient, systolic, new Quantity(1200, 'mmHg'), '2026-09-03', '2026-09-03'));
desk.reject('m-3', '오기', '2026-09-04');
const wrong = desk.at(desk.indexOf('m-3'));
const mark = wrong.rejection;
if (mark === null) throw new Error('거부 표시가 없습니다');
console.log(`m-3 거부 — 사유 ${mark.reason} · 거부한 날 ${mark.rejectedOn}`);
console.log(`m-3 의 값은 그대로 ${wrong.quantity}`);
show(desk, desk.record('m-4', patient, systolic, new Quantity(120, 'mmHg'), '2026-09-03', '2026-09-04'));

const rows = desk.rows(patient, systolic);
const rejected = rows.filter((m) => m.rejection !== null).length;
const latest = desk.knownOn('2026-09-30', patient, systolic);
if (latest === null) throw new Error('유효한 기록이 없습니다');
console.log(
  `2026-09-30 에 알던 p-7 의 systolic — ${latest.quantity} (잰 날 ${latest.takenOn})` +
    ` · 전체 ${rows.length}건 중 거부 ${rejected}건 제외`,
);
attempt(() => desk.reject('m-3', '또 오기', '2026-09-05'));
attempt(() => desk.record('m-5', patient, systolic, new Quantity(119, 'mmHg'), '2026-09-05', '2026-09-04'));
