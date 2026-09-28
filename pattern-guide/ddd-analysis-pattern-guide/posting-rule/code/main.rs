// 이 모듈 하나가 총계정원장 전기 컨텍스트의 경계다
mod ledger {
    use std::{collections::HashSet, fmt};
    // 다른 aggregate 와 다른 컨텍스트는 id 로만 가리킨다
    #[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)] pub struct AccountId(pub &'static str);
    #[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)] pub struct PostingRuleId(pub &'static str);
    #[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)] pub struct TransactionId(pub &'static str);
    #[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)] pub struct SourceRef(pub &'static str);
    #[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)] pub struct EventKind(pub &'static str);
    // VO: 금액은 정수 최소 단위(KRW 는 원)이고 부호가 방향이다
    #[derive(Clone, Copy, Debug, PartialEq, Eq)]
    pub struct Money { minor: i64, currency: &'static str }
    impl Money {
        pub fn new(minor: i64, currency: &'static str) -> Money { Money { minor, currency } }
        pub fn zero(currency: &'static str) -> Money { Money::new(0, currency) }
        pub fn minor(self) -> i64 { self.minor }
        pub fn currency(self) -> &'static str { self.currency }
        pub fn plus(self, other: Money) -> Result<Money, String> {
            if self.currency != other.currency { return Err("통화가 다른 금액은 더할 수 없습니다".into()); }
            Ok(Money::new(self.minor.checked_add(other.minor).expect("금액 오버플로"), self.currency))
        }
        pub fn times(self, n: i64) -> Money { Money::new(self.minor.checked_mul(n).expect("오버플로"), self.currency) }
        pub fn permille(self, r: i64) -> Money { Money::new(self.minor * r / 1000, self.currency) }
        pub fn negate(self) -> Money { Money::new(-self.minor, self.currency) }
    }
    impl fmt::Display for Money {
        fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
            write!(f, "{}{} {}", if self.minor < 0 { "" } else { "+" }, self.minor, self.currency)
        }
    }
    // VO: 계정 id 와 금액 한 쌍 — 규칙이 내놓는 한 다리이자 거래를 만들 때의 입력
    #[derive(Clone, Copy, Debug, PartialEq, Eq)]
    pub struct AccountAmount { pub account_id: AccountId, pub amount: Money }
    impl fmt::Display for AccountAmount {
        fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result { write!(f, "{} {}", self.account_id.0, self.amount) }
    }
    // VO: 양 끝을 포함하는 날짜 구간. 날짜가 YYYY-MM-DD 라 문자열 비교가 날짜 순서와 같다
    #[derive(Clone, Copy, Debug)]
    pub struct DateRange { from: &'static str, to: &'static str }
    impl DateRange {
        pub fn new(from: &'static str, to: &'static str) -> DateRange { DateRange { from, to } }
        pub fn contains(&self, date: &str) -> bool { self.from <= date && date <= self.to }
        pub fn overlaps(&self, other: &DateRange) -> bool { self.from <= other.to && other.from <= self.to }
    }
    // VO: 다른 컨텍스트에서 넘어온 사실. 이 컨텍스트는 사건을 고치지 않는다
    #[derive(Clone, Copy, Debug)]
    pub struct AccountingEvent {
        pub source_ref: SourceRef, pub kind: EventKind,
        pub occurred_on: &'static str, pub noticed_on: &'static str,
        pub quantity: i64, pub amount: Money,
    }
    // 규칙이 쥐는 계산. 규칙마다 자기 계산을 갖는다
    pub trait Calculation { fn amount_for(&self, event: &AccountingEvent) -> Money; }
    pub struct PerUnitRate { pub rate: Money }
    impl Calculation for PerUnitRate {
        fn amount_for(&self, event: &AccountingEvent) -> Money { self.rate.times(event.quantity) }
    }
    pub struct Percentage { pub rate: i64 }
    impl Calculation for Percentage {
        fn amount_for(&self, event: &AccountingEvent) -> Money { event.amount.permille(self.rate) }
    }
    // 규칙이 한 번 실행해 내놓는 것: 거래가 될 다리 목록과, 이어서 처리할 파생 사건
    pub struct RuleOutput { pub lines: Vec<AccountAmount>, pub derived: Option<AccountingEvent> }
    // aggregate root, 지식 층위: 무엇에 반응해 · 얼마를 · 어디에 셋을 한 인스턴스가 쥔다
    pub struct PostingRule {
        pub id: PostingRuleId, pub event_kind: EventKind, pub effectivity: DateRange,
        pub calculation: Box<dyn Calculation>,
        pub debit_account_id: AccountId, pub credit_account_id: AccountId,
        pub derives: Option<EventKind>,   // 이 규칙이 내보내는 파생 사건 종류
    }
    impl PostingRule {
        // 사건의 발생 시점이 유효 기간 안일 때만 맡는다 — 접수 시점이 아니다
        pub fn applies_to(&self, event: &AccountingEvent) -> bool {
            self.event_kind == event.kind && self.effectivity.contains(event.occurred_on)
        }
        pub fn apply(&self, event: &AccountingEvent) -> Result<RuleOutput, String> {
            if !self.applies_to(event) { return Err(format!("이 규칙이 맡는 사건이 아닙니다: {}", self.id.0)); }
            let amount = self.calculation.amount_for(event);
            let lines = vec![
                AccountAmount { account_id: self.debit_account_id, amount },
                AccountAmount { account_id: self.credit_account_id, amount: amount.negate() },
            ];
            let derived = self.derives.map(|kind| AccountingEvent {
                source_ref: event.source_ref, kind, occurred_on: event.occurred_on,
                noticed_on: event.noticed_on, quantity: 0, amount,
            });
            Ok(RuleOutput { lines, derived })
        }
    }
    // 규칙 등록 서비스이자 저장소: 같은 사건 종류에 기간이 겹치는 규칙이 둘 이상 생기지 않게 막는다
    pub struct PostingRuleBook { rules: Vec<PostingRule> }
    impl PostingRuleBook {
        pub fn new() -> PostingRuleBook { PostingRuleBook { rules: Vec::new() } }
        pub fn register(&mut self, rule: PostingRule) -> Result<(), String> {
            for other in &self.rules {
                if other.event_kind == rule.event_kind && other.effectivity.overlaps(&rule.effectivity) {
                    return Err(format!("{} 사건 종류에 유효 기간이 겹치는 규칙이 있습니다: {}",
                                       rule.event_kind.0, other.id.0));
                }
            }
            self.rules.push(rule);
            Ok(())
        }
        // 사건 종류와 시점이 주어지면 규칙이 하나로 정해진다. 없으면 오류다
        pub fn rule_for(&self, kind: EventKind, date: &str) -> Result<&PostingRule, String> {
            for rule in &self.rules {
                if rule.event_kind == kind && rule.effectivity.contains(date) { return Ok(rule); }
            }
            Err(format!("적용할 규칙이 없습니다: {} {}", kind.0, date))
        }
    }
    // Transaction 안의 불변 child entity: 식별자는 거래 id + 순번이다
    #[derive(Clone, Copy, Debug)]
    pub struct Entry { pub seq: usize, pub line: AccountAmount }
    // aggregate root: 만들 때 균형을 검사하고, 만든 뒤에는 바꾸는 메서드가 없다
    #[derive(Clone, Debug)]
    pub struct Transaction {
        id: TransactionId, date: &'static str, source_ref: SourceRef,
        posting_rule_id: PostingRuleId, entries: Vec<Entry>,
    }
    impl Transaction {
        pub fn create(id: TransactionId, date: &'static str, source_ref: SourceRef,
                      posting_rule_id: PostingRuleId, lines: &[AccountAmount]) -> Result<Transaction, String> {
            if lines.len() < 2 { return Err("Entry 는 2개 이상이어야 합니다".into()); }
            let mut sums: Vec<Money> = Vec::new();
            let mut entries: Vec<Entry> = Vec::new();
            for line in lines {
                match sums.iter().position(|sum| sum.currency() == line.amount.currency()) {
                    Some(at) => sums[at] = sums[at].plus(line.amount)?,
                    None => sums.push(line.amount),
                }
                entries.push(Entry { seq: entries.len() + 1, line: *line });
            }
            for sum in &sums {
                if sum.minor() != 0 { return Err(format!("{} 합이 0 이 아닙니다: {}", sum.currency(), sum.minor())); }
            }
            Ok(Transaction { id, date, source_ref, posting_rule_id, entries })
        }
        pub fn id(&self) -> TransactionId { self.id }
        pub fn date(&self) -> &'static str { self.date }
        pub fn source_ref(&self) -> SourceRef { self.source_ref }
        // 전기 키는 거래가 스스로 답한다 — 원천 사건과 규칙의 쌍이다
        pub fn posting_key(&self) -> (SourceRef, PostingRuleId) { (self.source_ref, self.posting_rule_id) }
        // Entry 는 내보내지 않고 순번이 붙은 글자만 내보낸다
        pub fn entry_text(&self) -> String {
            self.entries.iter().map(|e| format!("#{} {}", e.seq, e.line)).collect::<Vec<String>>().join(" / ")
        }
    }
    // 저장소이자 전기 서비스: 전기 키 (원천 사건, 규칙) 의 유일성이 중복 전기를 막는다
    pub struct GeneralLedger { posted: Vec<Transaction>, next: usize }
    impl GeneralLedger {
        pub fn new() -> GeneralLedger { GeneralLedger { posted: Vec::new(), next: 1 } }
        pub fn post(&mut self, source_ref: SourceRef, rule_id: PostingRuleId, date: &'static str,
                    lines: &[AccountAmount]) -> Result<Transaction, String> {
            let key = (source_ref, rule_id);
            // 멱등: 이미 전기된 거래를 돌려준다
            if let Some(done) = self.posted.iter().find(|p| p.posting_key() == key) { return Ok(done.clone()); }
            let made = Transaction::create(TransactionId(ID_POOL[self.next - 1]), date, source_ref, rule_id, lines)?;
            self.posted.push(made.clone());
            self.next += 1;
            Ok(made)
        }
        pub fn size(&self) -> usize { self.posted.len() }
        pub fn distinct_sources(&self) -> usize {
            self.posted.iter().map(|posted| posted.source_ref().0).collect::<HashSet<&'static str>>().len()
        }
    }
    const ID_POOL: [&str; 8] = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8"];
}

use ledger::*;

const KRW: &str = "KRW";
const RECEIVABLE: AccountId = AccountId("1200");
const USAGE_REVENUE: AccountId = AccountId("4100");
const TAX_PAYABLE: AccountId = AccountId("2200");
const USAGE: EventKind = EventKind("USAGE");
const TAX: EventKind = EventKind("TAX");

fn rule(id: &'static str, kind: EventKind, from: &'static str, to: &'static str,
        calculation: Box<dyn Calculation>, credit: AccountId, derives: Option<EventKind>) -> PostingRule {
    PostingRule { id: PostingRuleId(id), event_kind: kind, effectivity: DateRange::new(from, to),
                  calculation, debit_account_id: RECEIVABLE, credit_account_id: credit, derives }
}
fn join(lines: &[AccountAmount]) -> String {
    lines.iter().map(|l| l.to_string()).collect::<Vec<String>>().join(" / ")
}
fn rejection<T>(r: Result<T, String>) -> String {
    match r { Ok(_) => "통과(예상과 다름)".to_string(), Err(message) => message }
}
fn usage(source: &'static str, occurred_on: &'static str, noticed_on: &'static str, kwh: i64) -> AccountingEvent {
    AccountingEvent { source_ref: SourceRef(source), kind: USAGE, occurred_on, noticed_on,
                      quantity: kwh, amount: Money::zero(KRW) }
}

fn main() -> Result<(), String> {
    let mut book = PostingRuleBook::new();
    book.register(rule("R1", USAGE, "2026-03-01", "2026-03-13",
        Box::new(PerUnitRate { rate: Money::new(15, KRW) }), USAGE_REVENUE, None))?;
    book.register(rule("R2", USAGE, "2026-03-14", "9999-12-31",
        Box::new(PerUnitRate { rate: Money::new(18, KRW) }), USAGE_REVENUE, Some(TAX)))?;
    book.register(rule("R3", TAX, "2026-03-14", "9999-12-31",
        Box::new(Percentage { rate: 100 }), TAX_PAYABLE, None))?;

    let mut ledger = GeneralLedger::new();
    let mut queue = vec![
        usage("U-7731", "2026-03-07", "2026-03-09", 120),
        usage("U-7732", "2026-03-20", "2026-03-21", 120),
        usage("U-7733", "2026-03-07", "2026-03-22", 120),
    ];
    let mut i = 0;
    while i < queue.len() {
        let event = queue[i];
        let chosen = book.rule_for(event.kind, event.occurred_on)?;   // 발생 시점으로 고른다
        let (rule_id, out) = (chosen.id, chosen.apply(&event)?);
        let posted = ledger.post(event.source_ref, rule_id, event.noticed_on, &out.lines)?;
        if let Some(derived) = out.derived { queue.insert(i + 1, derived); }
        println!("{} {} 발생 {} 접수 {} -> 규칙 {} -> {}", event.source_ref.0, event.kind.0,
                 event.occurred_on, event.noticed_on, rule_id.0, posted.id().0);
        println!("{} (거래일 {}) 항목: {}", posted.id().0, posted.date(), posted.entry_text());
        i += 1;
    }
    println!("전기된 거래 {}건, 원천 사건 식별자로만 세면 {}건", ledger.size(), ledger.distinct_sources());

    let retry = usage("U-7733", "2026-03-07", "2026-03-22", 120);
    let retry_rule = book.rule_for(retry.kind, retry.occurred_on)?;
    let (retry_id, retry_lines) = (retry_rule.id, retry_rule.apply(&retry)?.lines);
    let again = ledger.post(retry.source_ref, retry_id, retry.noticed_on, &retry_lines)?;
    println!("같은 사건·같은 규칙 재시도: 새 거래 없이 {} 를 돌려줌 (거래 수 {})", again.id().0, ledger.size());

    let stray = usage("U-7735", "2026-03-07", "2026-03-23", 120);
    let full = book.rule_for(stray.kind, stray.occurred_on)?.apply(&stray)?.lines;
    println!("거절(규칙이 Entry 를 하나만 냄): {}",
             rejection(ledger.post(stray.source_ref, PostingRuleId("R1"), stray.noticed_on, &[full[0]])));
    let mismatched = [full[0], AccountAmount { account_id: USAGE_REVENUE, amount: Money::new(-1_440, KRW) }];
    println!("거절(두 다리의 금액이 어긋남): {}",
             rejection(ledger.post(stray.source_ref, PostingRuleId("R1"), stray.noticed_on, &mismatched)));
    println!("거절(유효 기간 겹침): {}", rejection(book.register(rule("R9", USAGE, "2026-03-20", "9999-12-31",
             Box::new(PerUnitRate { rate: Money::new(20, KRW) }), USAGE_REVENUE, None))));

    let probe = usage("U-7733", "2026-03-22", "2026-03-22", 120);   // 접수 시점을 발생 시점처럼 쓴 사건
    let wrong_rule = book.rule_for(probe.kind, probe.occurred_on)?;
    let (wrong_id, wrong) = (wrong_rule.id, wrong_rule.apply(&probe)?);
    let derived = wrong.derived.ok_or("파생 사건이 없습니다")?;
    let wrong_tax = book.rule_for(derived.kind, derived.occurred_on)?.apply(&derived)?;
    println!("접수 시점으로 골랐다면: 규칙 {} -> {}, 세금 {} 까지 붙음",
             wrong_id.0, join(&wrong.lines), wrong_tax.lines[0].amount);
    Ok(())
}
