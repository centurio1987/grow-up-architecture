// 다른 aggregate 를 가리키는 id 는 브랜드 타입이다 — 구조적 타이핑이라 그냥 string 이면 서로 섞인다
type AccountId = string & { readonly __brand: "AccountId" };
type PostingRuleId = string & { readonly __brand: "PostingRuleId" };
type TransactionId = string & { readonly __brand: "TransactionId" };
type SourceRef = string & { readonly __brand: "SourceRef" };
type EventKind = string & { readonly __brand: "EventKind" };

// VO: 금액은 정수 최소 단위(KRW 는 원)이고 부호가 방향이다
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
  times(factor: number): Money { return new Money(this.minor * factor, this.currency); }
  permille(rate: number): Money { return new Money(Math.trunc((this.minor * rate) / 1000), this.currency); }
  negate(): Money { return new Money(-this.minor, this.currency); }
  toString(): string { return `${this.minor < 0 ? "" : "+"}${this.minor} ${this.currency}`; }
}

// VO: 계정 id 와 금액 한 쌍 — 규칙이 내놓는 한 다리이자 거래를 만들 때의 입력
class AccountAmount {
  constructor(readonly accountId: AccountId, readonly amount: Money) { Object.freeze(this); }
  toString(): string { return `${this.accountId} ${this.amount}`; }
}

// VO: 양 끝을 포함하는 날짜 구간. 날짜가 YYYY-MM-DD 라 문자열 비교가 날짜 순서와 같다
class DateRange {
  constructor(readonly from: string, readonly to: string) { Object.freeze(this); }
  contains(date: string): boolean { return this.from <= date && date <= this.to; }
  overlaps(other: DateRange): boolean { return this.from <= other.to && other.from <= this.to; }
}

// VO: 다른 컨텍스트에서 넘어온 사실. 이 컨텍스트는 사건을 고치지 않는다
class AccountingEvent {
  constructor(
    readonly sourceRef: SourceRef,
    readonly kind: EventKind,
    readonly occurredOn: string,
    readonly noticedOn: string,
    readonly quantity: number,
    readonly amount: Money,
  ) { Object.freeze(this); }
}

// 규칙이 쥐는 계산. 규칙마다 자기 계산을 갖는다
interface Calculation {
  amountFor(event: AccountingEvent): Money;
}
class PerUnitRate implements Calculation {
  constructor(private readonly rate: Money) {}
  amountFor(event: AccountingEvent): Money { return this.rate.times(event.quantity); }
}
class Percentage implements Calculation {
  constructor(private readonly rate: number) {}
  amountFor(event: AccountingEvent): Money { return event.amount.permille(this.rate); }
}

// 규칙이 한 번 실행해 내놓는 것: 거래가 될 다리 목록과, 이어서 처리할 파생 사건(없으면 undefined)
interface RuleOutput {
  readonly lines: readonly AccountAmount[];
  readonly derived: AccountingEvent | undefined;
}

// aggregate root, 지식 층위: 무엇에 반응해 · 얼마를 · 어디에 셋을 한 인스턴스가 쥔다
class PostingRule {
  constructor(
    readonly id: PostingRuleId,
    readonly eventKind: EventKind,
    readonly effectivity: DateRange,
    private readonly calculation: Calculation,
    private readonly debitAccountId: AccountId,    // 다른 aggregate 는 id 로만 가리킨다
    private readonly creditAccountId: AccountId,
    private readonly derives: EventKind | undefined, // 이 규칙이 내보내는 파생 사건 종류
  ) {}

  // 사건의 발생 시점이 유효 기간 안일 때만 맡는다 — 접수 시점이 아니다
  appliesTo(event: AccountingEvent): boolean {
    return this.eventKind === event.kind && this.effectivity.contains(event.occurredOn);
  }
  apply(event: AccountingEvent): RuleOutput {
    if (!this.appliesTo(event)) throw new Error(`이 규칙이 맡는 사건이 아닙니다: ${this.id}`);
    const amount = this.calculation.amountFor(event);
    const lines = [new AccountAmount(this.debitAccountId, amount),
                   new AccountAmount(this.creditAccountId, amount.negate())];
    const derived = this.derives === undefined ? undefined
      : new AccountingEvent(event.sourceRef, this.derives, event.occurredOn, event.noticedOn, 0, amount);
    return { lines: Object.freeze(lines), derived };
  }
}

// 규칙 등록 서비스이자 저장소: 같은 사건 종류에 기간이 겹치는 규칙이 둘 이상 생기지 않게 막는다
class PostingRuleBook {
  private readonly rules: PostingRule[] = [];
  register(rule: PostingRule): void {
    for (const other of this.rules) {
      if (other.eventKind === rule.eventKind && other.effectivity.overlaps(rule.effectivity)) {
        throw new Error(`${rule.eventKind} 사건 종류에 유효 기간이 겹치는 규칙이 있습니다: ${other.id}`);
      }
    }
    this.rules.push(rule);
  }
  // 사건 종류와 시점이 주어지면 규칙이 하나로 정해진다. 없으면 오류다
  ruleFor(kind: EventKind, date: string): PostingRule {
    for (const rule of this.rules) {
      if (rule.eventKind === kind && rule.effectivity.contains(date)) return rule;
    }
    throw new Error(`적용할 규칙이 없습니다: ${kind} ${date}`);
  }
}

// Transaction 안의 불변 child entity: 식별자는 거래 id + 순번이다
class Entry {
  constructor(readonly seq: number, readonly line: AccountAmount) { Object.freeze(this); }
}

// aggregate root: 만들 때 균형을 검사하고, 만든 뒤에는 바꾸는 메서드가 없다
class Transaction {
  private constructor(
    readonly id: TransactionId,
    readonly date: string,
    readonly sourceRef: SourceRef,
    readonly postingRuleId: PostingRuleId,
    private readonly entries: readonly Entry[],
  ) { Object.freeze(this); }

  static create(id: TransactionId, date: string, sourceRef: SourceRef, postingRuleId: PostingRuleId,
                lines: readonly AccountAmount[]): Transaction {
    if (lines.length < 2) throw new Error("Entry 는 2개 이상이어야 합니다");
    const sums = new Map<string, Money>();
    const entries = lines.map((line, index) => {
      const currency = line.amount.currency;
      sums.set(currency, (sums.get(currency) ?? Money.zero(currency)).plus(line.amount));
      return new Entry(index + 1, line);
    });
    for (const sum of sums.values()) {
      if (sum.minor !== 0) throw new Error(`${sum.currency} 합이 0 이 아닙니다: ${sum.minor}`);
    }
    return new Transaction(id, date, sourceRef, postingRuleId, Object.freeze(entries));
  }
  // 전기 키는 거래가 스스로 답한다 — 원천 사건과 규칙의 쌍이다
  get postingKey(): string { return `${this.sourceRef} / ${this.postingRuleId}`; }
  // Entry 객체는 내보내지 않고 순번이 붙은 글자만 내보낸다
  entryText(): string {
    return this.entries.map((entry) => `#${entry.seq} ${entry.line}`).join(" / ");
  }
}

// 저장소이자 전기 서비스: 전기 키 (원천 사건, 규칙) 의 유일성이 중복 전기를 막는다
class GeneralLedger {
  private readonly posted: Transaction[] = [];
  private next = 1;
  post(sourceRef: SourceRef, ruleId: PostingRuleId, date: string, lines: readonly AccountAmount[]): Transaction {
    const key = `${sourceRef} / ${ruleId}`;
    const already = this.posted.find((transaction) => transaction.postingKey === key);
    if (already !== undefined) return already;   // 멱등: 이미 전기된 거래를 돌려준다
    const made = Transaction.create(`T${this.next}` as TransactionId, date, sourceRef, ruleId, lines);
    this.posted.push(made);
    this.next += 1;
    return made;
  }
  get size(): number { return this.posted.length; }
  distinctSources(): number {
    const refs = new Set<string>();
    for (const transaction of this.posted) refs.add(transaction.sourceRef);
    return refs.size;
  }
}

const KRW = "KRW";
const RECEIVABLE = "1200" as AccountId;
const USAGE_REVENUE = "4100" as AccountId;
const TAX_PAYABLE = "2200" as AccountId;
const USAGE = "USAGE" as EventKind;
const TAX = "TAX" as EventKind;
const ruleId = (value: string) => value as PostingRuleId;

const join = (lines: readonly AccountAmount[]): string => lines.map((line) => line.toString()).join(" / ");
function rejection(action: () => unknown): string {
  try { action(); return "통과(예상과 다름)"; } catch (e) { return e instanceof Error ? e.message : String(e); }
}
const usage = (ref: string, occurredOn: string, noticedOn: string, kwh: number): AccountingEvent =>
  new AccountingEvent(ref as SourceRef, USAGE, occurredOn, noticedOn, kwh, Money.zero(KRW));

function main(): void {
  const book = new PostingRuleBook();
  book.register(new PostingRule(ruleId("R1"), USAGE, new DateRange("2026-03-01", "2026-03-13"),
    new PerUnitRate(new Money(15, KRW)), RECEIVABLE, USAGE_REVENUE, undefined));
  book.register(new PostingRule(ruleId("R2"), USAGE, new DateRange("2026-03-14", "9999-12-31"),
    new PerUnitRate(new Money(18, KRW)), RECEIVABLE, USAGE_REVENUE, TAX));
  book.register(new PostingRule(ruleId("R3"), TAX, new DateRange("2026-03-14", "9999-12-31"),
    new Percentage(100), RECEIVABLE, TAX_PAYABLE, undefined));

  const ledger = new GeneralLedger();
  const queue: AccountingEvent[] = [
    usage("U-7731", "2026-03-07", "2026-03-09", 120),
    usage("U-7732", "2026-03-20", "2026-03-21", 120),
    usage("U-7733", "2026-03-07", "2026-03-22", 120),
  ];
  for (let i = 0; i < queue.length; i += 1) {
    const event = queue[i]!;
    const rule = book.ruleFor(event.kind, event.occurredOn);   // 발생 시점으로 고른다
    const out = rule.apply(event);
    const posted = ledger.post(event.sourceRef, rule.id, event.noticedOn, out.lines);
    if (out.derived !== undefined) queue.splice(i + 1, 0, out.derived);
    console.log(`${event.sourceRef} ${event.kind} 발생 ${event.occurredOn} 접수 ${event.noticedOn}`
      + ` -> 규칙 ${rule.id} -> ${posted.id}`);
    console.log(`${posted.id} (거래일 ${posted.date}) 항목: ${posted.entryText()}`);
  }
  console.log(`전기된 거래 ${ledger.size}건, 원천 사건 식별자로만 세면 ${ledger.distinctSources()}건`);

  const retry = usage("U-7733", "2026-03-07", "2026-03-22", 120);
  const retryRule = book.ruleFor(retry.kind, retry.occurredOn);
  const again = ledger.post(retry.sourceRef, retryRule.id, retry.noticedOn, retryRule.apply(retry).lines);
  console.log(`같은 사건·같은 규칙 재시도: 새 거래 없이 ${again.id} 를 돌려줌 (거래 수 ${ledger.size})`);

  const stray = usage("U-7735", "2026-03-07", "2026-03-23", 120);
  const full = book.ruleFor(stray.kind, stray.occurredOn).apply(stray).lines;
  const oneLeg = [full[0]!];
  console.log(`거절(규칙이 Entry 를 하나만 냄): ${rejection(() =>
    ledger.post(stray.sourceRef, ruleId("R1"), stray.noticedOn, oneLeg))}`);
  const mismatched = [full[0]!, new AccountAmount(USAGE_REVENUE, new Money(-1_440, KRW))];
  console.log(`거절(두 다리의 금액이 어긋남): ${rejection(() =>
    ledger.post(stray.sourceRef, ruleId("R1"), stray.noticedOn, mismatched))}`);
  console.log(`거절(유효 기간 겹침): ${rejection(() =>
    book.register(new PostingRule(ruleId("R9"), USAGE, new DateRange("2026-03-20", "9999-12-31"),
      new PerUnitRate(new Money(20, KRW)), RECEIVABLE, USAGE_REVENUE, undefined)))}`);

  const probe = usage("U-7733", "2026-03-22", "2026-03-22", 120);   // 접수 시점을 발생 시점처럼 쓴 사건
  const wrongRule = book.ruleFor(probe.kind, probe.occurredOn);
  const wrong = wrongRule.apply(probe);
  const derived = wrong.derived!;
  const wrongTax = book.ruleFor(derived.kind, derived.occurredOn).apply(derived);
  console.log(`접수 시점으로 골랐다면: 규칙 ${wrongRule.id} -> ${join(wrong.lines)}`
    + `, 세금 ${wrongTax.lines[0]!.amount} 까지 붙음`);
}

main();
