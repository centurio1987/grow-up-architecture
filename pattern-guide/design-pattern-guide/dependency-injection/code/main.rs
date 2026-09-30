use std::cell::RefCell;
use std::rc::Rc;

// ── 자료 ──────────────────────────────────────────────────────────────────
#[derive(Clone)]
struct Loan {
    member_id: String,
    title: String,
    due_day: i32,
}

struct NoticeRun {
    today: i32,
    sent: i32,
}

// ── 협력 타입 — 의존 객체는 협력 객체를 이 타입으로만 안다 ─────────────────
trait LoanRepository {
    fn all_loans(&self) -> Vec<Loan>;
}

trait Clock {
    fn today(&self) -> i32;
}

trait NoticeSender {
    fn send(&self, member_id: &str, title: &str, days_late: i32);
}

// ── 의존 객체 — 만들지도 찾지도 않고, 받아서 쓴다 ──────────────────────────
struct OverdueNotifier {
    loans: Rc<dyn LoanRepository>,
    clock: Rc<dyn Clock>,
    sender: Rc<dyn NoticeSender>,
}

impl OverdueNotifier {
    fn new(
        loans: Rc<dyn LoanRepository>,
        clock: Rc<dyn Clock>,
        sender: Rc<dyn NoticeSender>,
    ) -> OverdueNotifier {
        OverdueNotifier { loans, clock, sender }
    }

    fn notify_overdue(&self) -> NoticeRun {
        let today = self.clock.today();
        let mut sent = 0;
        for loan in self.loans.all_loans() {
            let days_late = today - loan.due_day;
            if days_late <= 0 {
                continue;
            }
            self.sender.send(&loan.member_id, &loan.title, days_late);
            sent += 1;
        }
        NoticeRun { today, sent }
    }
}

// ── 협력 구현 ──────────────────────────────────────────────────────────────
struct InMemoryLoanRepository {
    rows: Vec<Loan>,
}

impl LoanRepository for InMemoryLoanRepository {
    fn all_loans(&self) -> Vec<Loan> {
        self.rows.clone()
    }
}

struct FixedClock {
    day: i32,
}

impl Clock for FixedClock {
    fn today(&self) -> i32 {
        self.day
    }
}

struct ConsoleNoticeSender {
    tag: String,
}

impl NoticeSender for ConsoleNoticeSender {
    fn send(&self, member_id: &str, title: &str, days_late: i32) {
        println!("{}: notice {}", self.tag, line(member_id, title, days_late));
    }
}

struct RecordingNoticeSender {
    lines: RefCell<Vec<String>>,
}

impl RecordingNoticeSender {
    fn new() -> RecordingNoticeSender {
        RecordingNoticeSender { lines: RefCell::new(Vec::new()) }
    }

    fn recorded(&self) -> Vec<String> {
        self.lines.borrow().clone()
    }
}

impl NoticeSender for RecordingNoticeSender {
    fn send(&self, member_id: &str, title: &str, days_late: i32) {
        self.lines.borrow_mut().push(line(member_id, title, days_late));
    }
}

fn line(member_id: &str, title: &str, days_late: i32) -> String {
    format!("{} \"{}\" {} days late", member_id, title, days_late)
}

// ── 조립자 — 어느 구현을 쓸지 여기서만 정한다 ──────────────────────────────
struct TestRig {
    notifier: OverdueNotifier,
    recorder: Rc<RecordingNoticeSender>,
}

fn loan_rows() -> Vec<Loan> {
    vec![
        Loan { member_id: "M-101".to_string(), title: "Data Structures".to_string(), due_day: 118 },
        Loan { member_id: "M-204".to_string(), title: "Operating Systems".to_string(), due_day: 120 },
        Loan { member_id: "M-101".to_string(), title: "Compiler Design".to_string(), due_day: 125 },
        Loan { member_id: "M-337".to_string(), title: "Discrete Math".to_string(), due_day: 113 },
    ]
}

fn assemble_for_operations() -> OverdueNotifier {
    OverdueNotifier::new(
        Rc::new(InMemoryLoanRepository { rows: loan_rows() }),
        Rc::new(FixedClock { day: 120 }),
        Rc::new(ConsoleNoticeSender { tag: "ops".to_string() }),
    )
}

fn assemble_for_test() -> TestRig {
    let recorder = Rc::new(RecordingNoticeSender::new());
    let sender: Rc<dyn NoticeSender> = recorder.clone();
    let notifier = OverdueNotifier::new(
        Rc::new(InMemoryLoanRepository { rows: loan_rows() }),
        Rc::new(FixedClock { day: 127 }),
        sender,
    );
    TestRig { notifier, recorder }
}

// ── 쓰는 쪽 — 조립된 것을 받아 일을 시킨다 ─────────────────────────────────
fn main() {
    let operations = assemble_for_operations();
    let ops_run = operations.notify_overdue();
    println!("ops: today={} sent={}", ops_run.today, ops_run.sent);

    let rig = assemble_for_test();
    let test_run = rig.notifier.notify_overdue();
    println!("test: today={} sent={}", test_run.today, test_run.sent);

    let recorded = rig.recorder.recorded();
    println!("test: recorded {}", recorded.len());
    for entry in &recorded {
        println!("test: log {}", entry);
    }
}
