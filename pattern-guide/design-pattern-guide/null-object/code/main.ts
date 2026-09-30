// ── 대출 기록 ────────────────────────────────────────────────────────────────
interface Loan {
  readonly id: string;
  readonly memberId: string;
  readonly title: string;
  readonly dueDay: number;
}

// ── 협력자 공통 타입 ─────────────────────────────────────────────────────────
interface BorrowNotifier {
  send(loan: Loan): void;
  sentCount(): number;
}

// ── 실제 동작을 하는 협력자 ──────────────────────────────────────────────────
class EmailNotifier implements BorrowNotifier {
  private sent = 0;

  send(loan: Loan): void {
    console.log(`mail -> ${loan.memberId} : "${loan.title}" due day ${loan.dueDay}`);
    this.sent++;
  }

  sentCount(): number {
    return this.sent;
  }
}

class SmsNotifier implements BorrowNotifier {
  private sent = 0;

  send(loan: Loan): void {
    console.log(`sms -> ${loan.memberId} : "${loan.title}" due day ${loan.dueDay}`);
    this.sent++;
  }

  sentCount(): number {
    return this.sent;
  }
}

// ── 아무 일도 하지 않는 협력자 ───────────────────────────────────────────────
class SilentNotifier implements BorrowNotifier {
  send(loan: Loan): void {
    // 알림을 끈 회원이다. 보낼 곳이 없으므로 아무 일도 하지 않는다.
  }

  sentCount(): number {
    return 0; // 한 건도 보내지 않았으니 0 이 참값이다
  }
}

// ── 협력자를 들고 다니는 도메인 객체 ─────────────────────────────────────────
class Member {
  constructor(
    readonly id: string,
    readonly notifier: BorrowNotifier,
  ) {}
}

// ── Client ───────────────────────────────────────────────────────────────────
class LoanDesk {
  private nextNo: number;

  constructor(
    private readonly today: number,
    private readonly period: number,
    firstNo: number,
  ) {
    this.nextNo = firstNo;
  }

  borrow(member: Member, title: string): Loan {
    const loan: Loan = {
      id: `L-${this.nextNo++}`,
      memberId: member.id,
      title,
      dueDay: this.today + this.period,
    };
    console.log(`loan ${loan.id} ${loan.memberId} "${loan.title}" due day ${loan.dueDay}`);
    member.notifier.send(loan);
    return loan;
  }
}

const mail = new EmailNotifier();
const sms = new SmsNotifier();
const silent: BorrowNotifier = new SilentNotifier(); // 인스턴스 하나를 나눠 쓴다

const m01 = new Member("M-01", mail);
const m02 = new Member("M-02", silent);
const m03 = new Member("M-03", sms);
const m04 = new Member("M-04", silent);

const desk = new LoanDesk(100, 14, 1001);
desk.borrow(m01, "Cosmos");
desk.borrow(m02, "The Selfish Gene");
desk.borrow(m03, "Guns, Germs, and Steel");
desk.borrow(m04, "Sapiens");

console.log("-- closing --");
console.log(`mail sent ${mail.sentCount()}`);
console.log(`sms sent ${sms.sentCount()}`);
console.log(`silent sent ${silent.sentCount()}`);
