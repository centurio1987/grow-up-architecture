use std::cell::Cell;
use std::rc::Rc;

// ── 대출 기록 ────────────────────────────────────────────────────────────────
struct Loan {
    id: String,
    member_id: String,
    title: String,
    due_day: u32,
}

// ── 협력자 공통 타입 ─────────────────────────────────────────────────────────
trait BorrowNotifier {
    fn send(&self, loan: &Loan);
    fn sent_count(&self) -> u32;
}

// ── 실제 동작을 하는 협력자 ──────────────────────────────────────────────────
struct EmailNotifier {
    sent: Cell<u32>,
}

impl BorrowNotifier for EmailNotifier {
    fn send(&self, loan: &Loan) {
        println!(
            "mail -> {} : \"{}\" due day {}",
            loan.member_id, loan.title, loan.due_day
        );
        self.sent.set(self.sent.get() + 1);
    }

    fn sent_count(&self) -> u32 {
        self.sent.get()
    }
}

struct SmsNotifier {
    sent: Cell<u32>,
}

impl BorrowNotifier for SmsNotifier {
    fn send(&self, loan: &Loan) {
        println!(
            "sms -> {} : \"{}\" due day {}",
            loan.member_id, loan.title, loan.due_day
        );
        self.sent.set(self.sent.get() + 1);
    }

    fn sent_count(&self) -> u32 {
        self.sent.get()
    }
}

// ── 아무 일도 하지 않는 협력자 ───────────────────────────────────────────────
struct SilentNotifier;

impl BorrowNotifier for SilentNotifier {
    fn send(&self, _loan: &Loan) {
        // 알림을 끈 회원이다. 보낼 곳이 없으므로 아무 일도 하지 않는다.
    }

    fn sent_count(&self) -> u32 {
        0 // 한 건도 보내지 않았으니 0 이 참값이다
    }
}

// ── 협력자를 들고 다니는 도메인 객체 ─────────────────────────────────────────
struct Member {
    id: String,
    notifier: Rc<dyn BorrowNotifier>,
}

impl Member {
    fn new(id: &str, notifier: Rc<dyn BorrowNotifier>) -> Member {
        Member {
            id: id.to_string(),
            notifier,
        }
    }
}

// ── Client ───────────────────────────────────────────────────────────────────
struct LoanDesk {
    today: u32,
    period: u32,
    next_no: Cell<u32>,
}

impl LoanDesk {
    fn new(today: u32, period: u32, first_no: u32) -> LoanDesk {
        LoanDesk {
            today,
            period,
            next_no: Cell::new(first_no),
        }
    }

    fn borrow(&self, member: &Member, title: &str) -> Loan {
        let loan = Loan {
            id: format!("L-{}", self.next_no.get()),
            member_id: member.id.clone(),
            title: title.to_string(),
            due_day: self.today + self.period,
        };
        self.next_no.set(self.next_no.get() + 1);
        println!(
            "loan {} {} \"{}\" due day {}",
            loan.id, loan.member_id, loan.title, loan.due_day
        );
        member.notifier.send(&loan);
        loan
    }
}

fn main() {
    let mail: Rc<dyn BorrowNotifier> = Rc::new(EmailNotifier { sent: Cell::new(0) });
    let sms: Rc<dyn BorrowNotifier> = Rc::new(SmsNotifier { sent: Cell::new(0) });
    let silent: Rc<dyn BorrowNotifier> = Rc::new(SilentNotifier); // 인스턴스 하나를 나눠 쓴다

    let m01 = Member::new("M-01", Rc::clone(&mail));
    let m02 = Member::new("M-02", Rc::clone(&silent));
    let m03 = Member::new("M-03", Rc::clone(&sms));
    let m04 = Member::new("M-04", Rc::clone(&silent));

    let desk = LoanDesk::new(100, 14, 1001);
    desk.borrow(&m01, "Cosmos");
    desk.borrow(&m02, "The Selfish Gene");
    desk.borrow(&m03, "Guns, Germs, and Steel");
    desk.borrow(&m04, "Sapiens");

    println!("-- closing --");
    println!("mail sent {}", mail.sent_count());
    println!("sms sent {}", sms.sent_count());
    println!("silent sent {}", silent.sent_count());
}
