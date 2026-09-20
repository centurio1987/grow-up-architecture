type AccountId = string & { readonly __brand: "AccountId" };
type AccountTypeId = string & { readonly __brand: "AccountTypeId" };
type TransactionId = string & { readonly __brand: "TransactionId" };

// VO: 식별자 없이 값으로 같음을 판단. 금액은 정수 최소 단위(KRW 는 원)
class Money {
  constructor(readonly minor: number, readonly currency: string) {
    if (!Number.isSafeInteger(minor)) throw new Error(`금액이 안전한 정수 범위를 벗어났습니다: ${minor}`);
    Object.freeze(this);
  }
  static zero(currency: string): Money { return new Money(0, currency); }
  plus(other: Money): Money {
    if (this.currency !== other.currency) throw new Error("통화가 다른 금액은 더할 수 없습니다");
    return new Money(this.minor + other.minor, this.currency);
  }
  negate(): Money { return new Money(-this.minor, this.currency); }
  equals(other: Money): boolean { return this.minor === other.minor && this.currency === other.currency; }
  toString(): string { return `${this.minor} ${this.currency}`; }
}

// VO: 계정 id 와 금액 한 쌍 — 거래를 만들 때의 입력이자 이벤트에 담는 값
class AccountAmount {
  constructor(readonly accountId: AccountId, readonly amount: Money) { Object.freeze(this); }
  equals(other: AccountAmount): boolean { return this.accountId === other.accountId && this.amount.equals(other.amount); }
}

// aggregate root: Entry 목록도 잔액 필드도 없다
class Account {
  private closed = false;
  constructor(
    readonly id: AccountId,
    readonly name: string,
    readonly accountTypeId: AccountTypeId,
    readonly currency: string,
  ) {}
  close(): void { this.closed = true; }

  // 이 계정이 이 금액의 Entry 를 받을 수 있는가 — 열림/닫힘과 통화는 Account 만 안다
  checkPostable(amount: Money): void {
    if (this.closed) throw new Error(`${this.name} 계정은 닫혀 있습니다`);
    if (this.currency !== amount.currency) throw new Error(`${this.name} 계정의 통화는 ${this.currency} 입니다`);
  }
}

// Transaction 안의 불변 child entity: 같은 거래 안에서만 seq 로 비교한다(값이 같아도 seq 가 다르면 다른 사실)
class Entry {
  constructor(readonly seq: number, readonly line: AccountAmount) { Object.freeze(this); }
  sameAs(other: Entry): boolean { return this.seq === other.seq; }
}

// aggregate root: 만들 때 균형을 검사하고, 만든 뒤에는 바꾸는 메서드가 없다
class Transaction {
  private constructor(
    readonly id: TransactionId,
    readonly date: string, // YYYY-MM-DD 형식을 전제로 문자열 비교가 날짜 순서와 같다
    readonly reverses: TransactionId | undefined,
    private readonly entries: readonly Entry[],
  ) {
    Object.freeze(this);
  }
  static create(id: TransactionId, date: string, lines: readonly AccountAmount[]): Transaction {
    return Transaction.build(id, date, undefined, lines);
  }

  // 역분개: 원 거래를 고치지 않고, 부호를 뒤집은 거래를 새로 만든다
  reverse(newId: TransactionId, newDate: string): Transaction {
    const negated = this.entries.map((e) => new AccountAmount(e.line.accountId, e.line.amount.negate()));
    return Transaction.build(newId, newDate, this.id, negated);
  }
  private static build(id: TransactionId, date: string, reverses: TransactionId | undefined, lines: readonly AccountAmount[]): Transaction {
    if (lines.length < 2) throw new Error("Entry 는 2개 이상이어야 합니다");
    const sums = new Map<string, Money>();
    const entries = lines.map((line, i) => {
      const currency = line.amount.currency;
      sums.set(currency, (sums.get(currency) ?? Money.zero(currency)).plus(line.amount));
      return new Entry(i + 1, line);
    });
    for (const sum of sums.values()) {
      if (sum.minor !== 0) throw new Error(`${sum.currency} 합이 0 이 아닙니다: ${sum.minor}`);
    }
    return new Transaction(id, date, reverses, Object.freeze(entries));
  }

  // Entry 객체는 내보내지 않고 값(AccountAmount)의 읽기 전용 목록만 내보낸다
  lines(): readonly AccountAmount[] { return this.entries.map((e) => e.line); }
}

// 도메인 이벤트: Entry 객체가 아니라 값만 담는다
interface TransactionPosted {
  readonly position: number;
  readonly lines: readonly AccountAmount[];
}

// 읽기 모델(aggregate 아님): 전기 순번 lastAppliedSeq 까지 반영한 잔액(날짜와 무관). 이벤트가 순서대로 온다는 전제
class AccountBalance {
  private lastAppliedSeq = 0;
  constructor(readonly accountId: AccountId, private current: Money) {}
  apply(event: TransactionPosted): void {
    if (event.position <= this.lastAppliedSeq) return; // 이미 반영한 이벤트는 건너뛴다
    let next = this.current;
    for (const line of event.lines) if (line.accountId === this.accountId) next = next.plus(line.amount);
    this.current = next; // 합을 다 구한 뒤에 잔액과 반영 위치를 함께 바꾼다
    this.lastAppliedSeq = event.position;
  }
  get balance(): Money { return this.current; }
}

// 저장소(Repository)와 전기 서비스(도메인 서비스)를 메모리에서 흉내 낸 것
class GeneralLedger {
  private readonly accounts = new Map<AccountId, Account>();
  private readonly transactions: Transaction[] = [];
  private readonly events: TransactionPosted[] = [];
  private readonly balances = new Map<AccountId, AccountBalance>();
  add(account: Account): void {
    if (this.accounts.has(account.id)) throw new Error("이미 있는 계정입니다");
    this.accounts.set(account.id, account);
  }
  closeAccount(id: AccountId): void { this.account(id).close(); }
  account(id: AccountId): Account {
    const account = this.accounts.get(id);
    if (account === undefined) throw new Error(`없는 계정입니다: ${id}`);
    return account;
  }
  transaction(id: TransactionId): Transaction {
    const tx = this.transactions.find((t) => t.id === id);
    if (tx === undefined) throw new Error(`없는 거래입니다: ${id}`);
    return tx;
  }
  post(tx: Transaction): void {
    if (this.transactions.some((t) => t.id === tx.id)) throw new Error("이미 있는 거래 id 입니다");
    for (const line of tx.lines()) this.account(line.accountId).checkPostable(line.amount); // 저장 전에, 동기로
    this.transactions.push(tx);
    this.events.push(Object.freeze({ position: this.events.length + 1, lines: Object.freeze([...tx.lines()]) }));
  }

  // 단순한 배달자: 전달 위치를 기억하지 않아 이미 보낸 이벤트도 다시 보낸다. 이벤트 하나를 계정마다 한 번씩 전한다
  deliverEvents(): void {
    for (const event of this.events) {
      const touched = new Map<AccountId, string>();
      for (const line of event.lines) if (!touched.has(line.accountId)) touched.set(line.accountId, line.amount.currency);
      for (const [id, currency] of touched) {
        const b = this.balances.get(id) ?? new AccountBalance(id, Money.zero(currency));
        this.balances.set(id, b);
        b.apply(event);
      }
    }
  }
  // 읽기 모델은 원천이 아니므로 버리고 이벤트에서 다시 만들 수 있다
  rebuildBalance(id: AccountId): void {
    this.balances.delete(id);
    this.deliverEvents();
  }
  balance(id: AccountId): Money {
    return this.balances.get(id)?.balance ?? Money.zero(this.account(id).currency);
  }

  // 정의 그대로: date 까지의 Entry 중 이 계정에 속한 것의 합
  balanceAsOf(id: AccountId, date: string): Money {
    let sum = Money.zero(this.account(id).currency);
    for (const tx of this.transactions) {
      if (tx.date > date) continue;
      for (const line of tx.lines()) if (line.accountId === id) sum = sum.plus(line.amount);
    }
    return sum;
  }
}

const KRW = "KRW";
const line = (accountId: AccountId, minor: number): AccountAmount => new AccountAmount(accountId, new Money(minor, KRW));
const tid = (value: string) => value as TransactionId;

function rejection(action: () => unknown): string {
  try { action(); return "통과(예상과 다름)"; } catch (e) { return e instanceof Error ? e.message : String(e); }
}

function main(): void {
  const ledger = new GeneralLedger();
  const cash = "1010" as AccountId, suspense = "2990" as AccountId;
  const sales = "4010" as AccountId, rent = "5010" as AccountId;
  ledger.add(new Account(cash, "현금", "자산" as AccountTypeId, KRW));
  ledger.add(new Account(suspense, "가수금", "부채" as AccountTypeId, KRW));
  ledger.add(new Account(sales, "매출", "수익" as AccountTypeId, KRW));
  ledger.add(new Account(rent, "임대료", "비용" as AccountTypeId, KRW));

  ledger.post(Transaction.create(tid("T1"), "2026-04-01", [line(cash, 100_000), line(sales, -100_000)]));
  console.log(`T1 전기 직후 현금: 읽기 모델 ${ledger.balance(cash)} / Entry 합 ${ledger.balanceAsOf(cash, "2026-04-01")}`);
  ledger.deliverEvents();
  console.log(`이벤트 전달 후 현금: 읽기 모델 ${ledger.balance(cash)}`);

  ledger.post(Transaction.create(tid("T2"), "2026-04-05", [line(rent, 30_000), line(cash, -30_000)]));
  const t3 = ledger.transaction(tid("T2")).reverse(tid("T3"), "2026-04-06");
  ledger.post(t3);
  ledger.post(Transaction.create(tid("T4"), "2026-04-06", [line(rent, 25_000), line(cash, -25_000)]));
  ledger.deliverEvents();

  console.log(`T3 이 되돌리는 거래: ${t3.reverses ?? "없음"}`);
  console.log(`현금 4/5 기준 Entry 합: ${ledger.balanceAsOf(cash, "2026-04-05")}`);
  console.log(`현금 4/6 기준 Entry 합: ${ledger.balanceAsOf(cash, "2026-04-06")}`);
  const same = ledger.balance(cash).equals(ledger.balanceAsOf(cash, "2026-04-06"));
  console.log(`현금 읽기 모델: ${ledger.balance(cash)} (Entry 합과 같음: ${same})`);
  const salesAccount = ledger.account(sales);
  console.log(`${salesAccount.name}(${salesAccount.accountTypeId}) 읽기 모델: ${ledger.balance(sales)}`);

  ledger.closeAccount(suspense);
  console.log(`거절(불균형): ${rejection(() => Transaction.create(tid("T5"), "2026-04-06", [line(cash, 100_000), line(sales, -90_000)]))}`);
  console.log(`거절(닫힌 계정): ${rejection(() => ledger.post(Transaction.create(tid("T6"), "2026-04-06", [line(cash, 50_000), line(suspense, -50_000)])))}`);
  ledger.rebuildBalance(cash);
  console.log(`현금 읽기 모델을 이벤트로 다시 만든 값: ${ledger.balance(cash)}`);
}

main();
