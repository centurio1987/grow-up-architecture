// 구조적 타이핑이라 string 별칭만으로는 id 가 서로 섞인다. 브랜드를 붙여 타입으로 가른다
type AccountId = string & { readonly __brand: "AccountId" };
type TransactionId = string & { readonly __brand: "TransactionId" };
type PostingRuleId = string & { readonly __brand: "PostingRuleId" };
// 다른 컨텍스트의 원천 사건 식별자 — 이 컨텍스트에서는 값이다
type SourceRef = string & { readonly __brand: "SourceRef" };

const accountId = (v: string): AccountId => v as AccountId;
const transactionId = (v: string): TransactionId => v as TransactionId;
const postingRuleId = (v: string): PostingRuleId => v as PostingRuleId;
const sourceRef = (v: string): SourceRef => v as SourceRef;

// VO: 식별자 없이 값으로 같음을 판단. 금액은 정수 최소 단위(KRW 는 1원)
class Money {
  constructor(readonly minor: number, readonly currency: string) {
    if (!Number.isSafeInteger(minor)) throw new Error(`금액이 안전한 정수 범위를 벗어났습니다: ${minor}`);
    Object.freeze(this);
  }
  plus(other: Money): Money {
    if (this.currency !== other.currency) throw new Error("통화가 다른 금액은 더할 수 없습니다");
    return new Money(this.minor + other.minor, this.currency);
  }
  negate(): Money { return new Money(-this.minor, this.currency); }
  toString(): string { return `${this.minor} ${this.currency}`; }
}

// VO: 계정 id 와 금액 한 쌍 — 거래를 만들 때 넘기는 다리 하나의 입력
class AccountAmount {
  constructor(readonly accountId: AccountId, readonly amount: Money) { Object.freeze(this); }
}

// VO: 확정된 거래가 밖으로 내보내는 다리 한 줄. Entry 객체 대신 그 값만 담는다
class PostedLine {
  constructor(readonly seq: number, readonly accountId: AccountId, readonly amount: Money) { Object.freeze(this); }
}

// 별도 aggregate root. 이 편의 코드는 전기 판정에 쓰이는 것만 든다
class Account {
  private closed = false;
  constructor(readonly id: AccountId, readonly name: string, readonly currency: string) {}
  close(): void { this.closed = true; }

  // 계정이 열려 있는지와 계정 통화는 Account 만 아는 사실이다
  checkPostable(amount: Money): void {
    if (this.closed) throw new Error(`${this.name} 계정은 닫혀 있습니다`);
    if (this.currency !== amount.currency) throw new Error(`${this.name} 계정의 통화는 ${this.currency} 입니다`);
  }
}

// Transaction 안의 불변 child entity: 식별자는 거래 id + 순번 seq
class Entry {
  constructor(readonly seq: number, readonly line: AccountAmount) { Object.freeze(this); }
}

// aggregate root: 만들 때 다리 수와 통화별 합을 검사하고, 만든 뒤에는 바꾸는 메서드가 없다
class Transaction {
  private constructor(
    readonly id: TransactionId,
    readonly date: string, // YYYY-MM-DD 형식을 전제로 문자열 비교가 날짜 순서와 같다
    private readonly sourceRef: SourceRef,
    private readonly postingRuleId: PostingRuleId,
    readonly reverses: TransactionId | undefined,
    private readonly entries: readonly Entry[],
  ) {
    Object.freeze(this);
  }
  static create(id: TransactionId, date: string, src: SourceRef, rule: PostingRuleId,
                lines: readonly AccountAmount[]): Transaction {
    return Transaction.build(id, date, src, rule, undefined, lines);
  }

  // 역분개: 원 거래를 고치지 않고 다리 전부의 부호를 뒤집은 거래를 새로 만든다
  reverse(newId: TransactionId, newDate: string, newRule: PostingRuleId): Transaction {
    const negated = this.entries.map((e) => new AccountAmount(e.line.accountId, e.line.amount.negate()));
    return Transaction.build(newId, newDate, this.sourceRef, newRule, this.id, negated);
  }
  private static build(id: TransactionId, date: string, src: SourceRef, rule: PostingRuleId,
                       reverses: TransactionId | undefined, lines: readonly AccountAmount[]): Transaction {
    if (lines.length < 2) throw new Error("Entry 는 2개 이상이어야 합니다");
    const entries = lines.map((line, i) => new Entry(i + 1, line));
    for (const [currency, sum] of Transaction.totalsOf(entries)) {
      if (sum !== 0) throw new Error(`${currency} 합이 0 이 아닙니다: ${sum}`);
    }
    return new Transaction(id, date, src, rule, reverses, Object.freeze(entries));
  }
  // 통화별로 갈라서 더한다 — 통화가 다른 금액은 서로 상쇄되지 않는다
  private static totalsOf(entries: readonly Entry[]): ReadonlyArray<readonly [string, number]> {
    const sums = new Map<string, number>();
    for (const e of entries) sums.set(e.line.amount.currency, (sums.get(e.line.amount.currency) ?? 0) + e.line.amount.minor);
    return [...sums.entries()].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  }
  currencyTotals(): ReadonlyArray<readonly [string, number]> { return Transaction.totalsOf(this.entries); }
  // 전기 키: 어떤 원천 사건을 어떤 규칙으로 전기했는가
  postingKey(): string { return `${this.sourceRef} + ${this.postingRuleId}`; }
  // Entry 객체는 내보내지 않고 값(PostedLine)의 읽기 전용 목록만 내보낸다
  lines(): readonly PostedLine[] { return this.entries.map((e) => new PostedLine(e.seq, e.line.accountId, e.line.amount)); }
}

// 저장소(Repository)와 전기 서비스(도메인 서비스)를 메모리에서 흉내 낸 것
class GeneralLedger {
  private readonly accounts = new Map<AccountId, Account>();
  private readonly transactions: Transaction[] = [];
  private readonly byPostingKey = new Map<string, Transaction>();
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

  // 전기: 같은 전기 키가 이미 있으면 새로 저장하지 않고, 없으면 계정을 확인한 뒤 저장한다
  post(tx: Transaction): Transaction {
    const already = this.byPostingKey.get(tx.postingKey());
    if (already !== undefined) return already;
    for (const line of tx.lines()) this.account(line.accountId).checkPostable(line.amount);
    this.transactions.push(tx);
    this.byPostingKey.set(tx.postingKey(), tx);
    return tx;
  }
  postedCount(): number { return this.transactions.length; }
  entrySumAsOf(id: AccountId, asOf: string, currency: string): Money {
    let sum = new Money(0, currency);
    for (const tx of this.transactions) {
      if (tx.date > asOf) continue;
      for (const line of tx.lines()) if (line.accountId === id) sum = sum.plus(line.amount);
    }
    return sum;
  }
  describe(tx: Transaction): string {
    return tx.lines().map((line) => `#${line.seq} ${this.account(line.accountId).name} ${line.amount}`).join(" / ");
  }
}

function attempt(action: () => unknown): string {
  try { action(); return "성공"; } catch (e) { return e instanceof Error ? e.message : String(e); }
}
function totalsText(tx: Transaction): string {
  return tx.currencyTotals().map(([currency, sum]) => `${currency} ${sum}`).join(" / ");
}

const cash = accountId("1010");
const fx = accountId("1020");
const withheld = accountId("2010");
const suspense = accountId("2990");
const sales = accountId("4010");
const payroll = accountId("5020");
const ledger = new GeneralLedger();
ledger.add(new Account(cash, "현금", "KRW"));
ledger.add(new Account(fx, "외화예금", "USD"));
ledger.add(new Account(withheld, "예수금", "KRW"));
ledger.add(new Account(suspense, "가수금", "KRW"));
ledger.add(new Account(sales, "매출", "KRW"));
ledger.add(new Account(payroll, "급여", "KRW"));
const pay = sourceRef("PAY-0410");
const payrollRule = postingRuleId("PR-PAYROLL");

ledger.post(Transaction.create(transactionId("T1"), "2026-04-01", sourceRef("INV-0401"), postingRuleId("PR-SALES"), [
  new AccountAmount(cash, new Money(100000, "KRW")),
  new AccountAmount(sales, new Money(-100000, "KRW")),
]));

const t2 = Transaction.create(transactionId("T2"), "2026-04-10", pay, payrollRule, [
  new AccountAmount(payroll, new Money(500000, "KRW")),
  new AccountAmount(withheld, new Money(-50000, "KRW")),
  new AccountAmount(cash, new Money(-450000, "KRW")),
]);
ledger.post(t2);
console.log(`T2 다리 셋: ${ledger.describe(t2)}`);
console.log(`T2 통화별 합: ${totalsText(t2)}`);
console.log(`T2 전기 키: ${t2.postingKey()}`);

console.log(`거절(다리 하나): ${attempt(() => Transaction.create(transactionId("T5"), "2026-04-10", pay, payrollRule, [
  new AccountAmount(payroll, new Money(500000, "KRW")),
]))}`);
console.log(`거절(합 0 아님): ${attempt(() => Transaction.create(transactionId("T6"), "2026-04-10", pay, payrollRule, [
  new AccountAmount(payroll, new Money(500000, "KRW")),
  new AccountAmount(cash, new Money(-450000, "KRW")),
]))}`);
console.log(`거절(통화 섞임): ${attempt(() => Transaction.create(transactionId("T7"), "2026-04-10", pay, payrollRule, [
  new AccountAmount(cash, new Money(-100, "KRW")),
  new AccountAmount(fx, new Money(100, "USD")),
]))}`);

const t3 = t2.reverse(transactionId("T3"), "2026-04-12", postingRuleId("PR-PAYROLL-REV"));
ledger.post(t3);
console.log(`T3 이 되돌리는 거래: ${t3.reverses ?? "없음"}`);
console.log(`T3 다리 셋: ${ledger.describe(t3)}`);
ledger.post(Transaction.create(transactionId("T4"), "2026-04-12", pay, postingRuleId("PR-PAYROLL-FIX"), [
  new AccountAmount(payroll, new Money(500000, "KRW")),
  new AccountAmount(withheld, new Money(-40000, "KRW")),
  new AccountAmount(cash, new Money(-460000, "KRW")),
]));
console.log(`예수금 4/12 기준 Entry 합: ${ledger.entrySumAsOf(withheld, "2026-04-12", "KRW")}`);
console.log(`전기된 거래 수: ${ledger.postedCount()}`);

const retry = Transaction.create(transactionId("T9"), "2026-04-10", pay, payrollRule, [
  new AccountAmount(payroll, new Money(500000, "KRW")),
  new AccountAmount(withheld, new Money(-50000, "KRW")),
  new AccountAmount(cash, new Money(-450000, "KRW")),
]);
const kept = ledger.post(retry);
console.log(`같은 원천 사건 재전기: 이미 전기된 거래 ${kept.id} 를 돌려줌 (전기된 거래 수: ${ledger.postedCount()})`);

ledger.closeAccount(suspense);
console.log(`거절(닫힌 계정): ${attempt(() => ledger.post(Transaction.create(transactionId("T8"), "2026-04-13",
  sourceRef("ADJ-0413"), postingRuleId("PR-SUSPENSE"), [
    new AccountAmount(cash, new Money(50000, "KRW")),
    new AccountAmount(suspense, new Money(-50000, "KRW")),
  ])))}`);
