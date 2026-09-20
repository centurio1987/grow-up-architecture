mod ledger {
    use std::collections::{BTreeMap, HashMap};
    use std::fmt;

    #[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
    pub struct AccountId(pub &'static str);
    #[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
    pub struct AccountTypeId(pub &'static str);
    #[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
    pub struct TransactionId(pub &'static str);

    // VO: 식별자 없이 값으로 같음을 판단. 금액은 정수 최소 단위(KRW 는 원)
    #[derive(Clone, Copy, Debug, PartialEq, Eq)]
    pub struct Money { minor: i64, currency: &'static str }

    impl Money {
        pub fn new(minor: i64, currency: &'static str) -> Money { Money { minor, currency } }
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

    // VO: 계정 id 와 금액 한 쌍 — 거래를 만들 때의 입력이자 이벤트에 담는 값
    #[derive(Clone, Copy, Debug, PartialEq, Eq)]
    pub struct AccountAmount { pub account_id: AccountId, pub amount: Money }

    // aggregate root: Entry 목록도 잔액 필드도 없다
    pub struct Account {
        id: AccountId,
        name: &'static str,
        account_type_id: AccountTypeId,
        currency: &'static str,
        closed: bool,
    }

    impl Account {
        pub fn new(id: AccountId, name: &'static str, account_type_id: AccountTypeId, currency: &'static str) -> Account {
            Account { id, name, account_type_id, currency, closed: false }
        }
        pub fn close(&mut self) { self.closed = true; }
        // 이 계정이 이 금액의 Entry 를 받을 수 있는가 — 열림/닫힘과 통화는 Account 만 안다
        pub fn check_postable(&self, amount: Money) -> Result<(), String> {
            if self.closed { return Err(format!("{} 계정은 닫혀 있습니다", self.name)); }
            if self.currency != amount.currency { return Err(format!("{} 계정의 통화는 {} 입니다", self.name, self.currency)); }
            Ok(())
        }
        pub fn name(&self) -> &'static str { self.name }
        pub fn account_type_id(&self) -> AccountTypeId { self.account_type_id }
    }

    // Transaction 안의 불변 child entity: 같은 거래 안에서만 seq 로 비교한다(값이 같아도 seq 가 다르면 다른 사실)
    struct Entry { seq: u32, line: AccountAmount }
    impl PartialEq for Entry {
        fn eq(&self, other: &Entry) -> bool { self.seq == other.seq }
    }

    // aggregate root: 만들 때 균형을 검사하고, 만든 뒤에는 바꾸는 메서드가 없다
    pub struct Transaction {
        id: TransactionId,
        date: &'static str, // YYYY-MM-DD 형식을 전제로 문자열 비교가 날짜 순서와 같다
        reverses: Option<TransactionId>,
        entries: Vec<Entry>,
    }

    impl Transaction {
        pub fn create(id: TransactionId, date: &'static str, lines: &[AccountAmount]) -> Result<Transaction, String> {
            Transaction::build(id, date, None, lines)
        }

        // 역분개: 원 거래를 고치지 않고, 부호를 뒤집은 거래를 새로 만든다
        pub fn reverse(&self, new_id: TransactionId, new_date: &'static str) -> Result<Transaction, String> {
            let mut negated = Vec::new();
            for e in &self.entries {
                negated.push(AccountAmount { account_id: e.line.account_id, amount: e.line.amount.negate()? });
            }
            Transaction::build(new_id, new_date, Some(self.id), &negated)
        }
        fn build(id: TransactionId, date: &'static str, reverses: Option<TransactionId>, lines: &[AccountAmount]) -> Result<Transaction, String> {
            if lines.len() < 2 { return Err("Entry 는 2개 이상이어야 합니다".into()); }
            let mut sums: BTreeMap<&'static str, i64> = BTreeMap::new();
            let mut entries = Vec::new();
            for (i, line) in lines.iter().enumerate() {
                let sum = sums.entry(line.amount.currency).or_insert(0);
                *sum = sum.checked_add(line.amount.minor).ok_or("금액 오버플로")?;
                entries.push(Entry { seq: i as u32 + 1, line: *line });
            }
            for (currency, sum) in &sums {
                if *sum != 0 { return Err(format!("{} 합이 0 이 아닙니다: {}", currency, sum)); }
            }
            Ok(Transaction { id, date, reverses, entries })
        }
        pub fn reverses(&self) -> Option<TransactionId> { self.reverses }
        // Entry 는 내보내지 않고 값(AccountAmount)의 사본만 내보낸다
        pub fn lines(&self) -> Vec<AccountAmount> { self.entries.iter().map(|e| e.line).collect() }
    }

    // 도메인 이벤트: Entry 객체가 아니라 값만 담는다
    pub struct TransactionPosted { position: u64, lines: Vec<AccountAmount> }

    // 읽기 모델(aggregate 아님): 전기 순번 last_applied_seq 까지 반영한 잔액(날짜와 무관). 이벤트가 순서대로 온다는 전제
    pub struct AccountBalance { account_id: AccountId, balance: Money, last_applied_seq: u64 }

    impl AccountBalance {
        fn apply(&mut self, event: &TransactionPosted) -> Result<(), String> {
            if event.position <= self.last_applied_seq { return Ok(()); } // 이미 반영한 이벤트는 건너뛴다
            let mut next = self.balance;
            for line in event.lines.iter().filter(|l| l.account_id == self.account_id) {
                next = next.plus(line.amount)?;
            }
            self.balance = next; // 합을 다 구한 뒤에 잔액과 반영 위치를 함께 바꾼다
            self.last_applied_seq = event.position;
            Ok(())
        }
    }

    // 저장소(Repository)와 전기 서비스(도메인 서비스)를 메모리에서 흉내 낸 것
    #[derive(Default)]
    pub struct GeneralLedger {
        accounts: HashMap<AccountId, Account>,
        transactions: Vec<Transaction>,
        events: Vec<TransactionPosted>,
        balances: HashMap<AccountId, AccountBalance>,
    }

    impl GeneralLedger {
        pub fn add(&mut self, account: Account) -> Result<(), String> {
            if self.accounts.contains_key(&account.id) { return Err("이미 있는 계정입니다".into()); }
            self.accounts.insert(account.id, account);
            Ok(())
        }
        pub fn account(&self, id: AccountId) -> Result<&Account, String> {
            self.accounts.get(&id).ok_or(format!("없는 계정입니다: {}", id.0))
        }
        pub fn close_account(&mut self, id: AccountId) -> Result<(), String> {
            self.accounts.get_mut(&id).ok_or(format!("없는 계정입니다: {}", id.0))?.close();
            Ok(())
        }
        pub fn transaction(&self, id: TransactionId) -> Result<&Transaction, String> {
            self.transactions.iter().find(|t| t.id == id).ok_or(format!("없는 거래입니다: {}", id.0))
        }
        pub fn post(&mut self, tx: Transaction) -> Result<(), String> {
            if self.transactions.iter().any(|t| t.id == tx.id) { return Err("이미 있는 거래 id 입니다".into()); }
            for line in tx.lines() { self.account(line.account_id)?.check_postable(line.amount)?; } // 저장 전에, 동기로
            let lines = tx.lines();
            self.transactions.push(tx);
            self.events.push(TransactionPosted { position: self.events.len() as u64 + 1, lines });
            Ok(())
        }

        // 단순한 배달자: 전달 위치를 기억하지 않아 이미 보낸 이벤트도 다시 보낸다
        pub fn deliver_events(&mut self) -> Result<(), String> {
            for event in &self.events {
                let mut touched: Vec<(AccountId, &'static str)> = Vec::new();
                for line in &event.lines {
                    if !touched.iter().any(|(id, _)| *id == line.account_id) { touched.push((line.account_id, line.amount.currency)); }
                }
                for (id, currency) in touched {
                    let b = self.balances.entry(id).or_insert(AccountBalance { account_id: id, balance: Money::new(0, currency), last_applied_seq: 0 });
                    b.apply(event)?;
                }
            }
            Ok(())
        }
        // 읽기 모델은 원천이 아니므로 버리고 이벤트에서 다시 만들 수 있다
        pub fn rebuild_balance(&mut self, id: AccountId) -> Result<(), String> {
            self.balances.remove(&id);
            self.deliver_events()
        }
        pub fn balance(&self, id: AccountId) -> Result<Money, String> {
            match self.balances.get(&id) {
                Some(b) => Ok(b.balance),
                None => Ok(Money::new(0, self.account(id)?.currency)),
            }
        }

        // 정의 그대로: date 까지의 Entry 중 이 계정에 속한 것의 합
        pub fn balance_as_of(&self, id: AccountId, date: &str) -> Result<Money, String> {
            let mut sum = Money::new(0, self.account(id)?.currency);
            for tx in self.transactions.iter().filter(|t| t.date <= date) {
                for line in tx.lines().iter().filter(|l| l.account_id == id) {
                    sum = sum.plus(line.amount)?;
                }
            }
            Ok(sum)
        }
    }
}

use ledger::{Account, AccountAmount, AccountId, AccountTypeId, GeneralLedger, Money, Transaction, TransactionId};

const KRW: &str = "KRW";

fn line(account_id: AccountId, minor: i64) -> AccountAmount {
    AccountAmount { account_id, amount: Money::new(minor, KRW) }
}

fn main() -> Result<(), String> {
    let mut ledger = GeneralLedger::default();
    let (cash, suspense, sales, rent) = (AccountId("1010"), AccountId("2990"), AccountId("4010"), AccountId("5010"));
    ledger.add(Account::new(cash, "현금", AccountTypeId("자산"), KRW))?;
    ledger.add(Account::new(suspense, "가수금", AccountTypeId("부채"), KRW))?;
    ledger.add(Account::new(sales, "매출", AccountTypeId("수익"), KRW))?;
    ledger.add(Account::new(rent, "임대료", AccountTypeId("비용"), KRW))?;

    ledger.post(Transaction::create(TransactionId("T1"), "2026-04-01", &[line(cash, 100_000), line(sales, -100_000)])?)?;
    println!("T1 전기 직후 현금: 읽기 모델 {} / Entry 합 {}", ledger.balance(cash)?, ledger.balance_as_of(cash, "2026-04-01")?);
    ledger.deliver_events()?;
    println!("이벤트 전달 후 현금: 읽기 모델 {}", ledger.balance(cash)?);

    ledger.post(Transaction::create(TransactionId("T2"), "2026-04-05", &[line(rent, 30_000), line(cash, -30_000)])?)?;
    let t3 = ledger.transaction(TransactionId("T2"))?.reverse(TransactionId("T3"), "2026-04-06")?;
    let reversed = t3.reverses().map_or("없음", |id| id.0);
    ledger.post(t3)?;
    ledger.post(Transaction::create(TransactionId("T4"), "2026-04-06", &[line(rent, 25_000), line(cash, -25_000)])?)?;
    ledger.deliver_events()?;

    println!("T3 이 되돌리는 거래: {}", reversed);
    println!("현금 4/5 기준 Entry 합: {}", ledger.balance_as_of(cash, "2026-04-05")?);
    println!("현금 4/6 기준 Entry 합: {}", ledger.balance_as_of(cash, "2026-04-06")?);
    let same = ledger.balance(cash)? == ledger.balance_as_of(cash, "2026-04-06")?;
    println!("현금 읽기 모델: {} (Entry 합과 같음: {})", ledger.balance(cash)?, same);
    let sales_account = ledger.account(sales)?;
    println!("{}({}) 읽기 모델: {}", sales_account.name(), sales_account.account_type_id().0, ledger.balance(sales)?);

    ledger.close_account(suspense)?;
    let unbalanced = Transaction::create(TransactionId("T5"), "2026-04-06", &[line(cash, 100_000), line(sales, -90_000)]);
    println!("거절(불균형): {}", unbalanced.err().unwrap_or_default());
    let to_closed = Transaction::create(TransactionId("T6"), "2026-04-06", &[line(cash, 50_000), line(suspense, -50_000)])?;
    println!("거절(닫힌 계정): {}", ledger.post(to_closed).err().unwrap_or_default());
    ledger.rebuild_balance(cash)?;
    println!("현금 읽기 모델을 이벤트로 다시 만든 값: {}", ledger.balance(cash)?);
    Ok(())
}
