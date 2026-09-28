import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.StringJoiner;
import java.util.TreeMap;
import java.util.function.Supplier;

record AccountId(String value) {}
record TransactionId(String value) {}
record PostingRuleId(String value) {}
// 다른 컨텍스트의 원천 사건 식별자 — 이 컨텍스트에서는 값이다
record SourceRef(String value) {}

// VO: 식별자 없이 값으로 같음을 판단. 금액은 정수 최소 단위(KRW 는 1원)
record Money(long minor, String currency) {
    Money plus(Money other) {
        if (!currency.equals(other.currency)) throw new IllegalArgumentException("통화가 다른 금액은 더할 수 없습니다");
        return new Money(Math.addExact(minor, other.minor), currency);
    }
    Money negate() { return new Money(Math.negateExact(minor), currency); }
    @Override public String toString() { return minor + " " + currency; }
}

// VO: 계정 id 와 금액 한 쌍 — 거래를 만들 때 넘기는 다리 하나의 입력
record AccountAmount(AccountId accountId, Money amount) {}

// VO: 확정된 거래가 밖으로 내보내는 다리 한 줄. Entry 객체 대신 그 값만 담는다
record PostedLine(int seq, AccountId accountId, Money amount) {}

// 별도 aggregate root. 이 편의 코드는 전기 판정에 쓰이는 것만 든다
final class Account {
    private final AccountId id;
    private final String name;
    private final String currency;
    private boolean closed = false;
    Account(AccountId id, String name, String currency) {
        this.id = id; this.name = name; this.currency = currency;
    }
    void close() { closed = true; }

    // 계정이 열려 있는지와 계정 통화는 Account 만 아는 사실이다
    void checkPostable(Money amount) {
        if (closed) throw new IllegalStateException(name + " 계정은 닫혀 있습니다");
        if (!currency.equals(amount.currency())) throw new IllegalArgumentException(name + " 계정의 통화는 " + currency + " 입니다");
    }
    AccountId id() { return id; }
    String name() { return name; }
}

// Transaction 안의 불변 child entity: 식별자는 거래 id + 순번 seq
final class Entry {
    final int seq;
    final AccountAmount line;
    Entry(int seq, AccountAmount line) { this.seq = seq; this.line = line; }
}

// aggregate root: 만들 때 다리 수와 통화별 합을 검사하고, 만든 뒤에는 바꾸는 메서드가 없다
final class Transaction {
    private final TransactionId id;
    private final LocalDate date;
    private final SourceRef sourceRef;
    private final PostingRuleId postingRuleId;
    private final TransactionId reverses;
    private final List<Entry> entries;
    private Transaction(TransactionId id, LocalDate date, SourceRef sourceRef,
                        PostingRuleId postingRuleId, TransactionId reverses, List<Entry> entries) {
        this.id = id; this.date = date; this.sourceRef = sourceRef;
        this.postingRuleId = postingRuleId; this.reverses = reverses; this.entries = entries;
    }
    static Transaction create(TransactionId id, LocalDate date, SourceRef sourceRef,
                              PostingRuleId postingRuleId, List<AccountAmount> lines) {
        return build(id, date, sourceRef, postingRuleId, null, lines);
    }

    // 역분개: 원 거래를 고치지 않고 다리 전부의 부호를 뒤집은 거래를 새로 만든다
    Transaction reverse(TransactionId newId, LocalDate newDate, PostingRuleId newRuleId) {
        List<AccountAmount> negated = new ArrayList<>();
        for (Entry e : entries) negated.add(new AccountAmount(e.line.accountId(), e.line.amount().negate()));
        return build(newId, newDate, sourceRef, newRuleId, id, negated);
    }
    private static Transaction build(TransactionId id, LocalDate date, SourceRef sourceRef,
                                     PostingRuleId postingRuleId, TransactionId reverses, List<AccountAmount> lines) {
        if (lines.size() < 2) throw new IllegalArgumentException("Entry 는 2개 이상이어야 합니다");
        List<Entry> entries = new ArrayList<>();
        for (AccountAmount line : lines) entries.add(new Entry(entries.size() + 1, line));
        for (Map.Entry<String, Long> t : totalsOf(entries).entrySet()) {
            if (t.getValue() != 0L) throw new IllegalArgumentException(t.getKey() + " 합이 0 이 아닙니다: " + t.getValue());
        }
        return new Transaction(id, date, sourceRef, postingRuleId, reverses, List.copyOf(entries));
    }
    // 통화별로 갈라서 더한다 — 통화가 다른 금액은 서로 상쇄되지 않는다
    private static Map<String, Long> totalsOf(List<Entry> entries) {
        Map<String, Long> sums = new TreeMap<>();
        for (Entry e : entries) sums.merge(e.line.amount().currency(), e.line.amount().minor(), Math::addExact);
        return sums;
    }
    Map<String, Long> currencyTotals() { return totalsOf(entries); }
    TransactionId id() { return id; }
    LocalDate date() { return date; }
    Optional<TransactionId> reverses() { return Optional.ofNullable(reverses); }
    // 전기 키: 어떤 원천 사건을 어떤 규칙으로 전기했는가
    String postingKey() { return sourceRef.value() + " + " + postingRuleId.value(); }
    // Entry 객체는 내보내지 않고 값(PostedLine)의 수정 불가 목록만 내보낸다
    List<PostedLine> lines() { return entries.stream().map(e -> new PostedLine(e.seq, e.line.accountId(), e.line.amount())).toList(); }
}

// 저장소(Repository)와 전기 서비스(도메인 서비스)를 메모리에서 흉내 낸 것
final class GeneralLedger {
    private final Map<AccountId, Account> accounts = new HashMap<>();
    private final List<Transaction> transactions = new ArrayList<>();
    private final Map<String, Transaction> byPostingKey = new HashMap<>();
    void add(Account account) {
        if (accounts.putIfAbsent(account.id(), account) != null) throw new IllegalArgumentException("이미 있는 계정입니다");
    }
    void closeAccount(AccountId id) { account(id).close(); }
    Account account(AccountId id) {
        Account account = accounts.get(id);
        if (account == null) throw new IllegalArgumentException("없는 계정입니다: " + id.value());
        return account;
    }

    // 전기: 같은 전기 키가 이미 있으면 새로 저장하지 않고, 없으면 계정을 확인한 뒤 저장한다
    Transaction post(Transaction tx) {
        Transaction already = byPostingKey.get(tx.postingKey());
        if (already != null) return already;
        for (PostedLine line : tx.lines()) account(line.accountId()).checkPostable(line.amount());
        transactions.add(tx);
        byPostingKey.put(tx.postingKey(), tx);
        return tx;
    }
    int postedCount() { return transactions.size(); }
    Money entrySumAsOf(AccountId accountId, LocalDate asOf, String currency) {
        Money sum = new Money(0, currency);
        for (Transaction tx : transactions) {
            if (tx.date().isAfter(asOf)) continue;
            for (PostedLine line : tx.lines()) {
                if (line.accountId().equals(accountId)) sum = sum.plus(line.amount());
            }
        }
        return sum;
    }
    String describe(Transaction tx) {
        StringJoiner sj = new StringJoiner(" / ");
        for (PostedLine line : tx.lines()) sj.add("#" + line.seq() + " " + account(line.accountId()).name() + " " + line.amount());
        return sj.toString();
    }
}

public class TransactionExample {
    static String attempt(Supplier<Object> action) {
        try { action.get(); return "성공"; } catch (RuntimeException e) { return e.getMessage(); }
    }
    static String totalsText(Transaction tx) {
        StringJoiner sj = new StringJoiner(" / ");
        for (Map.Entry<String, Long> t : tx.currencyTotals().entrySet()) sj.add(t.getKey() + " " + t.getValue());
        return sj.toString();
    }
    public static void main(String[] args) {
        AccountId cash = new AccountId("1010");
        AccountId fx = new AccountId("1020");
        AccountId withheld = new AccountId("2010");
        AccountId suspense = new AccountId("2990");
        AccountId sales = new AccountId("4010");
        AccountId payroll = new AccountId("5020");
        GeneralLedger ledger = new GeneralLedger();
        ledger.add(new Account(cash, "현금", "KRW"));
        ledger.add(new Account(fx, "외화예금", "USD"));
        ledger.add(new Account(withheld, "예수금", "KRW"));
        ledger.add(new Account(suspense, "가수금", "KRW"));
        ledger.add(new Account(sales, "매출", "KRW"));
        ledger.add(new Account(payroll, "급여", "KRW"));
        LocalDate apr1 = LocalDate.of(2026, 4, 1);
        LocalDate apr10 = LocalDate.of(2026, 4, 10);
        LocalDate apr12 = LocalDate.of(2026, 4, 12);
        LocalDate apr13 = LocalDate.of(2026, 4, 13);
        SourceRef pay = new SourceRef("PAY-0410");
        PostingRuleId payrollRule = new PostingRuleId("PR-PAYROLL");

        ledger.post(Transaction.create(new TransactionId("T1"), apr1, new SourceRef("INV-0401"),
                new PostingRuleId("PR-SALES"),
                List.of(new AccountAmount(cash, new Money(100000, "KRW")),
                        new AccountAmount(sales, new Money(-100000, "KRW")))));

        Transaction t2 = Transaction.create(new TransactionId("T2"), apr10, pay, payrollRule,
                List.of(new AccountAmount(payroll, new Money(500000, "KRW")),
                        new AccountAmount(withheld, new Money(-50000, "KRW")),
                        new AccountAmount(cash, new Money(-450000, "KRW"))));
        ledger.post(t2);
        System.out.println("T2 다리 셋: " + ledger.describe(t2));
        System.out.println("T2 통화별 합: " + totalsText(t2));
        System.out.println("T2 전기 키: " + t2.postingKey());

        System.out.println("거절(다리 하나): " + attempt(() -> Transaction.create(new TransactionId("T5"), apr10, pay,
                payrollRule, List.of(new AccountAmount(payroll, new Money(500000, "KRW"))))));
        System.out.println("거절(합 0 아님): " + attempt(() -> Transaction.create(new TransactionId("T6"), apr10, pay,
                payrollRule, List.of(new AccountAmount(payroll, new Money(500000, "KRW")),
                        new AccountAmount(cash, new Money(-450000, "KRW"))))));
        System.out.println("거절(통화 섞임): " + attempt(() -> Transaction.create(new TransactionId("T7"), apr10, pay,
                payrollRule, List.of(new AccountAmount(cash, new Money(-100, "KRW")),
                        new AccountAmount(fx, new Money(100, "USD"))))));

        Transaction t3 = t2.reverse(new TransactionId("T3"), apr12, new PostingRuleId("PR-PAYROLL-REV"));
        ledger.post(t3);
        System.out.println("T3 이 되돌리는 거래: " + t3.reverses().orElseThrow().value());
        System.out.println("T3 다리 셋: " + ledger.describe(t3));
        ledger.post(Transaction.create(new TransactionId("T4"), apr12, pay, new PostingRuleId("PR-PAYROLL-FIX"),
                List.of(new AccountAmount(payroll, new Money(500000, "KRW")),
                        new AccountAmount(withheld, new Money(-40000, "KRW")),
                        new AccountAmount(cash, new Money(-460000, "KRW")))));
        System.out.println("예수금 4/12 기준 Entry 합: " + ledger.entrySumAsOf(withheld, apr12, "KRW"));
        System.out.println("전기된 거래 수: " + ledger.postedCount());

        Transaction retry = Transaction.create(new TransactionId("T9"), apr10, pay, payrollRule,
                List.of(new AccountAmount(payroll, new Money(500000, "KRW")),
                        new AccountAmount(withheld, new Money(-50000, "KRW")),
                        new AccountAmount(cash, new Money(-450000, "KRW"))));
        Transaction kept = ledger.post(retry);
        System.out.println("같은 원천 사건 재전기: 이미 전기된 거래 " + kept.id().value()
                + " 를 돌려줌 (전기된 거래 수: " + ledger.postedCount() + ")");

        ledger.closeAccount(suspense);
        System.out.println("거절(닫힌 계정): " + attempt(() -> ledger.post(Transaction.create(new TransactionId("T8"),
                apr13, new SourceRef("ADJ-0413"), new PostingRuleId("PR-SUSPENSE"),
                List.of(new AccountAmount(cash, new Money(50000, "KRW")),
                        new AccountAmount(suspense, new Money(-50000, "KRW")))))));
    }
}
