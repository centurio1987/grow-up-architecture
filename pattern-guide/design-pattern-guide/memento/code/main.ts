const SEAT_MEMENTO = Symbol('seat-memento');

/** 좁은 인터페이스 — 메멘토를 받아 드는 쪽에는 상태를 여는 연산이 없다. */
interface SeatMemento {
  readonly [SEAT_MEMENTO]: true;
}

/** 넓은 인터페이스 — SeatChart 의 비공개 금고 안에서만 보인다. */
interface Snapshot {
  readonly seats: string;
  readonly remaining: number;
  readonly nextCode: string;
}

const OPEN = '.';

class SeatChart {
  static #vault = new WeakMap<SeatMemento, Snapshot>();

  #seats: string[];
  #remaining: number;
  #nextCode: string;

  constructor(layout: string) {
    this.#seats = [...layout];
    this.#remaining = this.#seats.filter((seat) => seat === OPEN).length;
    this.#nextCode = 'A';
  }

  save(): SeatMemento {
    const token: SeatMemento = { [SEAT_MEMENTO]: true };
    SeatChart.#vault.set(token, {
      seats: this.#seats.join(''),
      remaining: this.#remaining,
      nextCode: this.#nextCode,
    });
    return token;
  }

  restore(memento: SeatMemento): void {
    const snapshot = SeatChart.#vault.get(memento);
    if (snapshot === undefined) {
      throw new Error('SeatChart 가 만든 메멘토가 아닙니다');
    }
    this.#seats = [...snapshot.seats];
    this.#remaining = snapshot.remaining;
    this.#nextCode = snapshot.nextCode;
  }

  reserve(count: number): boolean {
    if (count <= 0 || count > this.#remaining) {
      return false;
    }
    for (const index of this.#pick(count)) {
      this.#seats[index] = this.#nextCode;
    }
    this.#remaining -= count;
    this.#nextCode = String.fromCharCode(this.#nextCode.charCodeAt(0) + 1);
    return true;
  }

  describe(): string {
    return `${this.#seats.join('')} rem=${this.#remaining} next=${this.#nextCode}`;
  }

  #pick(count: number): number[] {
    let run = 0;
    for (let i = 0; i < this.#seats.length; i++) {
      run = this.#seats[i] === OPEN ? run + 1 : 0;
      if (run === count) {
        return Array.from({ length: count }, (_unused, k) => i - count + 1 + k);
      }
    }
    const scattered: number[] = [];
    for (let i = 0; i < this.#seats.length && scattered.length < count; i++) {
      if (this.#seats[i] === OPEN) {
        scattered.push(i);
      }
    }
    return scattered;
  }
}

class ReservationDesk {
  readonly #history: SeatMemento[] = [];

  checkpoint(chart: SeatChart): void {
    this.#history.push(chart.save());
  }

  undo(chart: SeatChart): boolean {
    const memento = this.#history.pop();
    if (memento === undefined) {
      return false;
    }
    chart.restore(memento);
    return true;
  }

  depth(): number {
    return this.#history.length;
  }
}

function line(step: number, action: string, chart: SeatChart, desk: ReservationDesk): void {
  console.log(`${step} ${action.padEnd(10)} ${chart.describe()} history=${desk.depth()}`);
}

const chart = new SeatChart('...#....');
const desk = new ReservationDesk();
line(0, 'init', chart, desk);

desk.checkpoint(chart);
chart.reserve(2);
line(1, 'reserve(2)', chart, desk);

desk.checkpoint(chart);
chart.reserve(3);
line(2, 'reserve(3)', chart, desk);

desk.undo(chart);
line(3, 'undo', chart, desk);

desk.checkpoint(chart);
chart.reserve(5);
line(4, 'reserve(5)', chart, desk);

desk.undo(chart);
line(5, 'undo', chart, desk);

desk.undo(chart);
line(6, 'undo', chart, desk);
