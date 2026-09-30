// 인사·급여 — 사원의 일당과 소속을 시간 속성으로 두고, 사건 시각과 기록 시각 두 축으로 조회한다.

/** 시점. 달력 날짜 타입을 쓰지 않고 세 언어가 같은 자체 값으로 둔다. */
class TimePoint {
  constructor(readonly year: number, readonly month: number, readonly day: number) {}

  /** 1970-01-01 을 0 으로 세는 일 번호. 크기 비교와 일수 계산이 전부 이 값 위에 선다. */
  ordinal(): number {
    const y = this.year - (this.month <= 2 ? 1 : 0);
    const era = Math.floor(y / 400);
    const yoe = y - era * 400;
    const doy = Math.floor((153 * (this.month + (this.month > 2 ? -3 : 9)) + 2) / 5) + this.day - 1;
    return era * 146097 + yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy - 719468;
  }

  toString(): string {
    const pad = (n: number, width: number): string => String(n).padStart(width, "0");
    return `${pad(this.year, 4)}-${pad(this.month, 2)}-${pad(this.day, 2)}`;
  }
}

/** 구간. 두 끝이 모두 포함이고, 위 끝이 없으면 「추후 통지까지」다. */
class DateRange {
  constructor(readonly from: TimePoint, readonly to: TimePoint | null) {
    if (to !== null && from.ordinal() > to.ordinal()) {
      throw new Error(`유효 시작이 유효 끝보다 늦습니다: ${from}..${to}`);
    }
  }

  static openEnded(from: TimePoint): DateRange { return new DateRange(from, null); }

  includes(t: TimePoint): boolean {
    return this.from.ordinal() <= t.ordinal() && (this.to === null || t.ordinal() <= this.to.ordinal());
  }

  overlaps(other: DateRange): boolean {
    return (this.to === null || other.from.ordinal() <= this.to.ordinal())
      && (other.to === null || this.from.ordinal() <= other.to.ordinal());
  }

  lengthInDays(): number {
    if (this.to === null) {
      throw new Error(`끝이 없는 구간은 일수를 셀 수 없습니다: ${this}`);
    }
    return this.to.ordinal() - this.from.ordinal() + 1;
  }

  toString(): string { return `${this.from}..${this.to === null ? "" : this.to.toString()}`; }
}

class Money {
  constructor(readonly won: number) {}

  minus(other: Money): Money { return new Money(this.won - other.won); }

  times(count: number): Money { return new Money(this.won * count); }

  toString(): string { return `${this.won}원`; }
}

class EmployeeId {
  constructor(readonly value: string) {}

  toString(): string { return this.value; }
}

class DepartmentId {
  constructor(readonly value: string) {}

  toString(): string { return this.value; }
}

/** 유효 기간이 붙은 값 하나. recordedOn 은 우리가 그 값을 알게 된 날이다. */
class Effectivity<V> {
  constructor(readonly period: DateRange, readonly recordedOn: TimePoint, readonly value: V) {}
}

/** 시간 속성 — 값들의 이력을 쥐고, 시점을 받아 값 하나로 답한다. */
class TemporalProperty<V> {
  private readonly history: readonly Effectivity<V>[];

  private constructor(readonly name: string, history: readonly Effectivity<V>[]) {
    this.history = [...history];
  }

  static startingWith<V>(name: string, from: TimePoint, on: TimePoint, value: V): TemporalProperty<V> {
    return new TemporalProperty(name, [new Effectivity(DateRange.openEnded(from), on, value)]);
  }

  asserting(period: DateRange, on: TimePoint, value: V): TemporalProperty<V> {
    const latest = this.latestRecord();
    if (on.ordinal() < latest.ordinal()) {
      throw new Error(`기록일이 앞선 기록보다 이릅니다: ${on} < ${latest}`);
    }
    for (const e of this.history) {
      if (e.recordedOn.ordinal() === on.ordinal() && e.period.overlaps(period)) {
        throw new Error(`같은 기록일에 유효 구간이 겹칩니다: ${e.period} 와 ${period}`);
      }
    }
    return new TemporalProperty(this.name, [...this.history, new Effectivity(period, on, value)]);
  }

  /** 기록 기준 asKnownOn 에서 본 when 의 값. 그 시점을 덮는 값 가운데 가장 늦게 안 것이 답이다. */
  valueOn(when: TimePoint, asKnownOn?: TimePoint): V {
    const limit = asKnownOn ?? this.latestRecord();
    let best: Effectivity<V> | null = null;
    for (const e of this.history) {
      if (e.recordedOn.ordinal() > limit.ordinal() || !e.period.includes(when)) {
        continue;
      }
      if (best === null || e.recordedOn.ordinal() > best.recordedOn.ordinal()) {
        best = e;
      }
    }
    if (best === null) {
      throw new Error(`그 기록 시점에는 아는 값이 없습니다: ${when} 의 ${this.name} · 기록 기준 ${limit}`);
    }
    return best.value;
  }

  latestRecord(): TimePoint {
    let latest: TimePoint | null = null;
    for (const e of this.history) {
      if (latest === null || e.recordedOn.ordinal() > latest.ordinal()) {
        latest = e.recordedOn;
      }
    }
    if (latest === null) {
      throw new Error(`이력이 비어 있습니다: ${this.name}`);
    }
    return latest;
  }
}

/** aggregate root. 두 시간 속성을 품고 이력의 불변식을 진다. */
class Employee {
  private payRate: TemporalProperty<Money>;
  private assignment: TemporalProperty<DepartmentId>;

  constructor(readonly id: EmployeeId, readonly hiredOn: TimePoint, rate: Money, department: DepartmentId) {
    this.payRate = TemporalProperty.startingWith("일당", hiredOn, hiredOn, rate);
    this.assignment = TemporalProperty.startingWith("소속", hiredOn, hiredOn, department);
  }

  recordPayRate(period: DateRange, on: TimePoint, rate: Money): void {
    this.payRate = this.payRate.asserting(period, on, rate);
  }

  recordAssignment(period: DateRange, on: TimePoint, department: DepartmentId): void {
    this.assignment = this.assignment.asserting(period, on, department);
  }

  payRateOn(when: TimePoint, asKnownOn?: TimePoint): Money { return this.payRate.valueOn(when, asKnownOn); }

  assignmentOn(when: TimePoint, asKnownOn?: TimePoint): DepartmentId {
    return this.assignment.valueOn(when, asKnownOn);
  }
}

/** aggregate 밖에서 부서 aggregate 를 id 로 찾아 오는 자리. */
const DIRECTORY = new Map<string, string>([["DEP-SALES", "영업부"], ["DEP-PLAN", "기획부"]]);

function nameOf(id: DepartmentId): string { return DIRECTORY.get(id.value) ?? "미등록"; }

/** 이미 지급한 기준과 지금 아는 기준의 차이를 그 구간의 일수만큼 정산한다. */
function retroDifference(e: Employee, stretch: DateRange, paidOn: TimePoint, knownOn: TimePoint): Money {
  const paid = e.payRateOn(stretch.from, paidOn);
  const current = e.payRateOn(stretch.from, knownOn);
  return current.minus(paid).times(stretch.lengthInDays());
}

function attempt(action: () => void): void {
  try {
    action();
  } catch (e) {
    console.log(`거부 — ${(e as Error).message}`);
  }
}

const hire = new TimePoint(2026, 1, 1);
const employee = new Employee(new EmployeeId("EMP-1042"), hire, new Money(200000), new DepartmentId("DEP-SALES"));
const first = employee.assignmentOn(hire);
console.log(`사원 ${employee.id} · 입사 ${employee.hiredOn} · 첫 일당 ${employee.payRateOn(hire)}`
  + ` · 첫 소속 ${first} ${nameOf(first)}`);

const raiseFrom = new TimePoint(2026, 2, 15);
const noticedOn = new TimePoint(2026, 3, 15);
employee.recordPayRate(DateRange.openEnded(raiseFrom), noticedOn, new Money(240000));
console.log(`[기록] ${noticedOn} — ${raiseFrom} 부터 일당 ${new Money(240000)}`);

const correctedOn = new TimePoint(2026, 4, 4);
employee.recordPayRate(DateRange.openEnded(raiseFrom), correctedOn, new Money(260000));
console.log(`[기록] ${correctedOn} — ${raiseFrom} 부터 일당 ${new Money(260000)}`);

const moveFrom = new TimePoint(2026, 4, 1);
const movedOn = new TimePoint(2026, 5, 2);
employee.recordAssignment(DateRange.openEnded(moveFrom), movedOn, new DepartmentId("DEP-PLAN"));
console.log(`[기록] ${movedOn} — ${moveFrom} 부터 소속 DEP-PLAN`);

const january = new TimePoint(2026, 1, 20);
const february = new TimePoint(2026, 2, 25);
console.log(`[한 축] ${january} 의 일당 ${employee.payRateOn(january)}`);
console.log(`[한 축] ${february} 의 일당 ${employee.payRateOn(february)}`);

const payday = new TimePoint(2026, 2, 28);
for (const asKnownOn of [payday, noticedOn, correctedOn]) {
  console.log(`[두 축] ${february} 의 일당 · 기록 기준 ${asKnownOn} → ${employee.payRateOn(february, asKnownOn)}`);
}

const stretch = new DateRange(raiseFrom, payday);
const gap = employee.payRateOn(february, noticedOn).minus(employee.payRateOn(february, payday));
console.log(`2월 소급 차액 — ${stretch} ${stretch.lengthInDays()}일 × ${gap}`
  + ` = ${retroDifference(employee, stretch, payday, noticedOn)}`);

for (const when of [new TimePoint(2026, 3, 20), new TimePoint(2026, 4, 10)]) {
  const at = employee.assignmentOn(when);
  console.log(`[한 축] ${when} 의 소속 ${at} ${nameOf(at)}`);
}

attempt(() => new DateRange(new TimePoint(2026, 3, 31), new TimePoint(2026, 2, 1)));
attempt(() => employee.recordPayRate(
  new DateRange(new TimePoint(2026, 2, 1), new TimePoint(2026, 3, 31)), correctedOn, new Money(210000)));
attempt(() => employee.recordAssignment(
  DateRange.openEnded(new TimePoint(2026, 3, 1)), new TimePoint(2026, 3, 1), new DepartmentId("DEP-SALES")));
attempt(() => employee.payRateOn(february, new TimePoint(2025, 12, 31)));
