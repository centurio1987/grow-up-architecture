// ── 자료 ──────────────────────────────────────────────────────────────────
interface Loan {
  readonly memberId: string;
  readonly title: string;
  readonly dueDay: number;
}

interface NoticeRun {
  readonly today: number;
  readonly sent: number;
}

// ── 협력 타입 — 의존 객체는 협력 객체를 이 타입으로만 안다 ─────────────────
interface LoanRepository {
  allLoans(): readonly Loan[];
}

interface Clock {
  today(): number;
}

interface NoticeSender {
  send(memberId: string, title: string, daysLate: number): void;
}

// ── 의존 객체 — 만들지도 찾지도 않고, 받아서 쓴다 ──────────────────────────
class OverdueNotifier {
  private readonly loans: LoanRepository;
  private readonly clock: Clock;
  private readonly sender: NoticeSender;

  constructor(loans: LoanRepository, clock: Clock, sender: NoticeSender) {
    this.loans = loans;
    this.clock = clock;
    this.sender = sender;
  }

  notifyOverdue(): NoticeRun {
    const today = this.clock.today();
    let sent = 0;
    for (const loan of this.loans.allLoans()) {
      const daysLate = today - loan.dueDay;
      if (daysLate <= 0) {
        continue;
      }
      this.sender.send(loan.memberId, loan.title, daysLate);
      sent += 1;
    }
    return { today, sent };
  }
}

// ── 협력 구현 ──────────────────────────────────────────────────────────────
class InMemoryLoanRepository implements LoanRepository {
  private readonly rows: readonly Loan[];

  constructor(rows: readonly Loan[]) {
    this.rows = [...rows];
  }

  allLoans(): readonly Loan[] {
    return this.rows;
  }
}

class FixedClock implements Clock {
  private readonly day: number;

  constructor(day: number) {
    this.day = day;
  }

  today(): number {
    return this.day;
  }
}

class ConsoleNoticeSender implements NoticeSender {
  private readonly tag: string;

  constructor(tag: string) {
    this.tag = tag;
  }

  send(memberId: string, title: string, daysLate: number): void {
    console.log(`${this.tag}: notice ${line(memberId, title, daysLate)}`);
  }
}

class RecordingNoticeSender implements NoticeSender {
  private readonly lines: string[] = [];

  send(memberId: string, title: string, daysLate: number): void {
    this.lines.push(line(memberId, title, daysLate));
  }

  recorded(): readonly string[] {
    return [...this.lines];
  }
}

function line(memberId: string, title: string, daysLate: number): string {
  return `${memberId} "${title}" ${daysLate} days late`;
}

// ── 조립자 — 어느 구현을 쓸지 여기서만 정한다 ──────────────────────────────
interface TestRig {
  readonly notifier: OverdueNotifier;
  readonly recorder: RecordingNoticeSender;
}

function loanRows(): readonly Loan[] {
  return [
    { memberId: "M-101", title: "Data Structures", dueDay: 118 },
    { memberId: "M-204", title: "Operating Systems", dueDay: 120 },
    { memberId: "M-101", title: "Compiler Design", dueDay: 125 },
    { memberId: "M-337", title: "Discrete Math", dueDay: 113 },
  ];
}

function assembleForOperations(): OverdueNotifier {
  return new OverdueNotifier(
    new InMemoryLoanRepository(loanRows()),
    new FixedClock(120),
    new ConsoleNoticeSender("ops"),
  );
}

function assembleForTest(): TestRig {
  const recorder = new RecordingNoticeSender();
  const notifier = new OverdueNotifier(
    new InMemoryLoanRepository(loanRows()),
    new FixedClock(127),
    recorder,
  );
  return { notifier, recorder };
}

// ── 쓰는 쪽 — 조립된 것을 받아 일을 시킨다 ─────────────────────────────────
const operations = assembleForOperations();
const opsRun = operations.notifyOverdue();
console.log(`ops: today=${opsRun.today} sent=${opsRun.sent}`);

const rig = assembleForTest();
const testRun = rig.notifier.notifyOverdue();
console.log(`test: today=${testRun.today} sent=${testRun.sent}`);

const recorded = rig.recorder.recorded();
console.log(`test: recorded ${recorded.length}`);
for (const entry of recorded) {
  console.log(`test: log ${entry}`);
}
