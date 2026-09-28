mod ledger {
    use std::collections::{BTreeMap, HashMap};
    use std::fmt;

    #[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
    pub struct AccountId(pub &'static str);
    #[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
    pub struct TransactionId(pub &'static str);
    #[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
    pub struct PostingRuleId(pub &'static str);
    // 다른 컨텍스트의 원천 사건 식별자 — 이 컨텍스트에서는 값이다
    #[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
    pub struct SourceRef(pub &'static str);

    // VO: 식별자 없이 값으로 같음을 판단. 금액은 정수 최소 단위(KRW 는 1원)
    #[derive(Clone, Copy, Debug, PartialEq, Eq)]
    pub struct Money { minor: i64, currency: &'static str }

    impl Money {
        pub fn new(minor: i64, currency: &'static str) -> Money { Money { minor, currency } }
        pub fn minor(self) -> i64 { self.minor }
        pub fn currency(self) -> &'static str { self.currency }
        pub fn plus(self, other: Money) -> Result<Money, String> {
            if self.currency != other.currency { return Err("통화가 다른 금액은 더할 수 없습니다".into()); }
            Ok(Money::new(self.minor.checked_add(other.minor).ok_or("금액 오버플로")?, self.currency))
        }
        pub fn negate(self) -> Result<Money, String> {
            Ok(Money::new(self.minor.checked_neg().ok_or("금액 오버플로")?, self.currency))
        }
    }

    impl fmt::Display for Money {
        fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result { write!(f, "{} {}", self.minor, self.currency) }
    }

    // VO: 거래를 만들 때 넘기는 다리 하나의 입력(계정 id + 금액)과, 확정된 거래가 내보내는 다리 한 줄
    #[derive(Clone, Copy, Debug)]
    pub struct AccountAmount { pub account_id: AccountId, pub amount: Money }
    #[derive(Clone, Copy, Debug)]
    pub struct PostedLine { pub seq: u32, pub account_id: AccountId, pub amount: Money }

    // 별도 aggregate root. 이 편의 코드는 전기 판정에 쓰이는 것만 든다
    pub struct Account { id: AccountId, name: &'static str, currency: &'static str, closed: bool }

    impl Account {
        pub fn new(id: AccountId, name: &'static str, currency: &'static str) -> Account {
            Account { id, name, currency, closed: false }
        }
        pub fn close(&mut self) { self.closed = true; }

        // 계정이 열려 있는지와 계정 통화는 Account 만 아는 사실이다
        pub fn check_postable(&self, amount: Money) -> Result<(), String> {
            if self.closed { return Err(format!("{} 계정은 닫혀 있습니다", self.name)); }
            if self.currency != amount.currency() { return Err(format!("{} 계정의 통화는 {} 입니다", self.name, self.currency)); }
            Ok(())
        }
        pub fn id(&self) -> AccountId { self.id }
        pub fn name(&self) -> &'static str { self.name }
    }

    // Transaction 안의 불변 child entity: 식별자는 거래 id + 순번 seq
    struct Entry { seq: u32, line: AccountAmount }

    // aggregate root: 만들 때 다리 수와 통화별 합을 검사하고, 만든 뒤에는 바꾸는 메서드가 없다
    pub struct Transaction {
        id: TransactionId,
        date: &'static str, // YYYY-MM-DD 형식을 전제로 문자열 비교가 날짜 순서와 같다
        source_ref: SourceRef,
        posting_rule_id: PostingRuleId,
        reverses: Option<TransactionId>,
        entries: Vec<Entry>,
    }

    impl Transaction {
        pub fn create(id: TransactionId, date: &'static str, src: SourceRef, rule: PostingRuleId,
                      lines: &[AccountAmount]) -> Result<Transaction, String> {
            Transaction::build(id, date, src, rule, None, lines)
        }

        // 역분개: 원 거래를 고치지 않고 다리 전부의 부호를 뒤집은 거래를 새로 만든다
        pub fn reverse(&self, new_id: TransactionId, new_date: &'static str,
                       new_rule: PostingRuleId) -> Result<Transaction, String> {
            let mut negated = Vec::new();
            for e in &self.entries { negated.push(AccountAmount { account_id: e.line.account_id, amount: e.line.amount.negate()? }); }
            Transaction::build(new_id, new_date, self.source_ref, new_rule, Some(self.id), &negated)
        }
        fn build(id: TransactionId, date: &'static str, src: SourceRef, rule: PostingRuleId,
                 reverses: Option<TransactionId>, lines: &[AccountAmount]) -> Result<Transaction, String> {
            if lines.len() < 2 { return Err("Entry 는 2개 이상이어야 합니다".into()); }
            let mut entries = Vec::new();
            for (i, line) in lines.iter().enumerate() { entries.push(Entry { seq: (i + 1) as u32, line: *line }); }
            for (currency, sum) in Transaction::totals_of(&entries)? {
                if sum != 0 { return Err(format!("{} 합이 0 이 아닙니다: {}", currency, sum)); }
            }
            Ok(Transaction { id, date, source_ref: src, posting_rule_id: rule, reverses, entries })
        }
        // 통화별로 갈라서 더한다 — 통화가 다른 금액은 서로 상쇄되지 않는다
        fn totals_of(entries: &[Entry]) -> Result<Vec<(&'static str, i64)>, String> {
            let mut sums: BTreeMap<&'static str, i64> = BTreeMap::new();
            for e in entries {
                let slot = sums.entry(e.line.amount.currency()).or_insert(0);
                *slot = slot.checked_add(e.line.amount.minor()).ok_or("금액 오버플로")?;
            }
            Ok(sums.into_iter().collect())
        }
        pub fn currency_totals(&self) -> Result<Vec<(&'static str, i64)>, String> { Transaction::totals_of(&self.entries) }
        pub fn id(&self) -> TransactionId { self.id }
        pub fn date(&self) -> &'static str { self.date }
        pub fn reverses(&self) -> Option<TransactionId> { self.reverses }
        // 전기 키: 어떤 원천 사건을 어떤 규칙으로 전기했는가
        pub fn posting_key(&self) -> String { format!("{} + {}", self.source_ref.0, self.posting_rule_id.0) }
        // Entry 객체는 내보내지 않고 값(PostedLine)의 목록만 내보낸다
        pub fn lines(&self) -> Vec<PostedLine> {
            self.entries.iter().map(|e| PostedLine { seq: e.seq, account_id: e.line.account_id, amount: e.line.amount }).collect()
        }
    }

    // 저장소(Repository)와 전기 서비스(도메인 서비스)를 메모리에서 흉내 낸 것
    pub struct GeneralLedger {
        accounts: HashMap<AccountId, Account>,
        transactions: Vec<Transaction>,
        by_posting_key: HashMap<String, TransactionId>,
    }

    impl GeneralLedger {
        pub fn new() -> GeneralLedger {
            GeneralLedger { accounts: HashMap::new(), transactions: Vec::new(), by_posting_key: HashMap::new() }
        }
        pub fn add(&mut self, account: Account) -> Result<(), String> {
            if self.accounts.contains_key(&account.id()) { return Err("이미 있는 계정입니다".into()); }
            self.accounts.insert(account.id(), account);
            Ok(())
        }
        pub fn close_account(&mut self, id: AccountId) -> Result<(), String> {
            self.accounts.get_mut(&id).ok_or(format!("없는 계정입니다: {}", id.0))?.close();
            Ok(())
        }
        pub fn account(&self, id: AccountId) -> Result<&Account, String> {
            self.accounts.get(&id).ok_or_else(|| format!("없는 계정입니다: {}", id.0))
        }

        // 전기: 같은 전기 키가 이미 있으면 새로 저장하지 않고, 없으면 계정을 확인한 뒤 저장한다
        pub fn post(&mut self, tx: Transaction) -> Result<TransactionId, String> {
            if let Some(already) = self.by_posting_key.get(&tx.posting_key()) { return Ok(*already); }
            for line in tx.lines() { self.account(line.account_id)?.check_postable(line.amount)?; }
            let (key, id) = (tx.posting_key(), tx.id());
            self.transactions.push(tx);
            self.by_posting_key.insert(key, id);
            Ok(id)
        }
        pub fn posted_count(&self) -> usize { self.transactions.len() }
        pub fn transaction(&self, id: TransactionId) -> Result<&Transaction, String> {
            self.transactions.iter().find(|t| t.id() == id).ok_or_else(|| format!("없는 거래입니다: {}", id.0))
        }
        pub fn entry_sum_as_of(&self, id: AccountId, as_of: &str, currency: &'static str) -> Result<Money, String> {
            let mut sum = Money::new(0, currency);
            for tx in &self.transactions {
                if tx.date() > as_of { continue; }
                for line in tx.lines() { if line.account_id == id { sum = sum.plus(line.amount)?; } }
            }
            Ok(sum)
        }
        pub fn describe(&self, tx: &Transaction) -> Result<String, String> {
            let mut parts = Vec::new();
            for line in tx.lines() { parts.push(format!("#{} {} {}", line.seq, self.account(line.account_id)?.name(), line.amount)); }
            Ok(parts.join(" / "))
        }
    }
}

use ledger::{Account, AccountAmount, AccountId, GeneralLedger, Money, PostingRuleId, SourceRef, Transaction, TransactionId};

fn attempt<T>(result: Result<T, String>) -> String {
    match result { Ok(_) => "성공".to_string(), Err(message) => message }
}

fn totals_text(tx: &Transaction) -> Result<String, String> {
    let parts: Vec<String> = tx.currency_totals()?.iter().map(|(c, s)| format!("{} {}", c, s)).collect();
    Ok(parts.join(" / "))
}

fn main() -> Result<(), String> {
    let cash = AccountId("1010");
    let fx = AccountId("1020");
    let withheld = AccountId("2010");
    let suspense = AccountId("2990");
    let sales = AccountId("4010");
    let payroll = AccountId("5020");
    let mut ledger = GeneralLedger::new();
    ledger.add(Account::new(cash, "현금", "KRW"))?;
    ledger.add(Account::new(fx, "외화예금", "USD"))?;
    ledger.add(Account::new(withheld, "예수금", "KRW"))?;
    ledger.add(Account::new(suspense, "가수금", "KRW"))?;
    ledger.add(Account::new(sales, "매출", "KRW"))?;
    ledger.add(Account::new(payroll, "급여", "KRW"))?;
    let pay = SourceRef("PAY-0410");
    let payroll_rule = PostingRuleId("PR-PAYROLL");

    ledger.post(Transaction::create(TransactionId("T1"), "2026-04-01", SourceRef("INV-0401"), PostingRuleId("PR-SALES"),
        &[AccountAmount { account_id: cash, amount: Money::new(100000, "KRW") },
          AccountAmount { account_id: sales, amount: Money::new(-100000, "KRW") }])?)?;

    let t2 = Transaction::create(TransactionId("T2"), "2026-04-10", pay, payroll_rule,
        &[AccountAmount { account_id: payroll, amount: Money::new(500000, "KRW") },
          AccountAmount { account_id: withheld, amount: Money::new(-50000, "KRW") },
          AccountAmount { account_id: cash, amount: Money::new(-450000, "KRW") }])?;
    println!("T2 다리 셋: {}", ledger.describe(&t2)?);
    println!("T2 통화별 합: {}", totals_text(&t2)?);
    println!("T2 전기 키: {}", t2.posting_key());
    ledger.post(t2)?;

    println!("거절(다리 하나): {}", attempt(Transaction::create(TransactionId("T5"), "2026-04-10", pay, payroll_rule,
        &[AccountAmount { account_id: payroll, amount: Money::new(500000, "KRW") }])));
    println!("거절(합 0 아님): {}", attempt(Transaction::create(TransactionId("T6"), "2026-04-10", pay, payroll_rule,
        &[AccountAmount { account_id: payroll, amount: Money::new(500000, "KRW") },
          AccountAmount { account_id: cash, amount: Money::new(-450000, "KRW") }])));
    println!("거절(통화 섞임): {}", attempt(Transaction::create(TransactionId("T7"), "2026-04-10", pay, payroll_rule,
        &[AccountAmount { account_id: cash, amount: Money::new(-100, "KRW") },
          AccountAmount { account_id: fx, amount: Money::new(100, "USD") }])));

    let t3 = ledger.transaction(TransactionId("T2"))?
        .reverse(TransactionId("T3"), "2026-04-12", PostingRuleId("PR-PAYROLL-REV"))?;
    println!("T3 이 되돌리는 거래: {}", t3.reverses().map(|r| r.0).unwrap_or("없음"));
    println!("T3 다리 셋: {}", ledger.describe(&t3)?);
    ledger.post(t3)?;
    ledger.post(Transaction::create(TransactionId("T4"), "2026-04-12", pay, PostingRuleId("PR-PAYROLL-FIX"),
        &[AccountAmount { account_id: payroll, amount: Money::new(500000, "KRW") },
          AccountAmount { account_id: withheld, amount: Money::new(-40000, "KRW") },
          AccountAmount { account_id: cash, amount: Money::new(-460000, "KRW") }])?)?;
    println!("예수금 4/12 기준 Entry 합: {}", ledger.entry_sum_as_of(withheld, "2026-04-12", "KRW")?);
    println!("전기된 거래 수: {}", ledger.posted_count());

    let retry = Transaction::create(TransactionId("T9"), "2026-04-10", pay, payroll_rule,
        &[AccountAmount { account_id: payroll, amount: Money::new(500000, "KRW") },
          AccountAmount { account_id: withheld, amount: Money::new(-50000, "KRW") },
          AccountAmount { account_id: cash, amount: Money::new(-450000, "KRW") }])?;
    let kept = ledger.post(retry)?;
    println!("같은 원천 사건 재전기: 이미 전기된 거래 {} 를 돌려줌 (전기된 거래 수: {})", kept.0, ledger.posted_count());

    ledger.close_account(suspense)?;
    let t8 = Transaction::create(TransactionId("T8"), "2026-04-13", SourceRef("ADJ-0413"), PostingRuleId("PR-SUSPENSE"),
        &[AccountAmount { account_id: cash, amount: Money::new(50000, "KRW") },
          AccountAmount { account_id: suspense, amount: Money::new(-50000, "KRW") }])?;
    println!("거절(닫힌 계정): {}", attempt(ledger.post(t8)));
    Ok(())
}
