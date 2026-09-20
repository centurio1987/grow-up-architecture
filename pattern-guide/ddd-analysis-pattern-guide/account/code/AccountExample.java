import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;

record AccountId(String value) {}
record AccountTypeId(String value) {}
record TransactionId(String value) {}

// VO: 식별자 없이 값으로 같음을 판단. 금액은 정수 최소 단위(KRW 는 원)
record Money(long minor, String currency) {
    static Money zero(String currency) { return new Money(0, currency); }
    Money plus(Money other) {
        if (!currency.equals(other.currency)) throw new IllegalArgumentException("통화가 다른 금액은 더할 수 없습니다");
        return new Money(Math.addExact(minor, other.minor), currency);
    }
    Money negate() { return new Money(Math.negateExact(minor), currency); }
    @Override public String toString() { return minor + " " + currency; }
}

// VO: 계정 id 와 금액 한 쌍 — 거래를 만들 때의 입력이자 이벤트에 담는 값
record AccountAmount(AccountId accountId, Money amount) {}

// aggregate root: Entry 목록도 잔액 필드도 없다
final class Account {
    private final AccountId id;
    private final String name;
    private final AccountTypeId accountTypeId;
    private final String currency;
    private boolean closed = false;
    Account(AccountId id, String name, AccountTypeId accountTypeId, String currency) {
        this.id = id; this.name = name; this.accountTypeId = accountTypeId; this.currency = currency;
    }
    void close() { closed = true; }

    // 이 계정이 이 금액의 Entry 를 받을 수 있는가 — 열림/닫힘과 통화는 Account 만 안다
    void checkPostable(Money amount) {
        if (closed) throw new IllegalStateException(name + " 계정은 닫혀 있습니다");
        if (!currency.equals(amount.currency())) throw new IllegalArgumentException(name + " 계정의 통화는 " + currency + " 입니다");
    }
    AccountId id() { return id; }
    String name() { return name; }
    AccountTypeId accountTypeId() { return accountTypeId; }
    String currency() { return currency; }
}

// Transaction 안의 불변 child entity: 같은 거래 안에서만 seq 로 비교한다(값이 같아도 seq 가 다르면 다른 사실)
final class Entry {
    final int seq;
    final AccountAmount line;
    Entry(int seq, AccountAmount line) { this.seq = seq; this.line = line; }
    @Override public boolean equals(Object o) { return o instanceof Entry other && seq == other.seq; }
    @Override public int hashCode() { return Integer.hashCode(seq); }
}

// aggregate root: 만들 때 균형을 검사하고, 만든 뒤에는 바꾸는 메서드가 없다
final class Transaction {
    private final TransactionId id;
    private final LocalDate date;
    private final TransactionId reverses;
    private final List<Entry> entries;
    private Transaction(TransactionId id, LocalDate date, TransactionId reverses, List<Entry> entries) {
        this.id = id; this.date = date; this.reverses = reverses; this.entries = entries;
    }
    static Transaction create(TransactionId id, LocalDate date, List<AccountAmount> lines) {
        return build(id, date, null, lines);
    }

    // 역분개: 원 거래를 고치지 않고, 부호를 뒤집은 거래를 새로 만든다
    Transaction reverse(TransactionId newId, LocalDate newDate) {
        List<AccountAmount> negated = new ArrayList<>();
        for (Entry e : entries) negated.add(new AccountAmount(e.line.accountId(), e.line.amount().negate()));
        return build(newId, newDate, id, negated);
    }
    private static Transaction build(TransactionId id, LocalDate date, TransactionId reverses, List<AccountAmount> lines) {
        if (lines.size() < 2) throw new IllegalArgumentException("Entry 는 2개 이상이어야 합니다");
        Map<String, Long> sums = new TreeMap<>();
        List<Entry> entries = new ArrayList<>();
        for (AccountAmount line : lines) {
            sums.merge(line.amount().currency(), line.amount().minor(), Math::addExact);
            entries.add(new Entry(entries.size() + 1, line));
        }
        sums.forEach((currency, sum) -> {
            if (sum != 0) throw new IllegalArgumentException(currency + " 합이 0 이 아닙니다: " + sum);
        });
        return new Transaction(id, date, reverses, List.copyOf(entries));
    }
    TransactionId id() { return id; }
    LocalDate date() { return date; }
    Optional<TransactionId> reverses() { return Optional.ofNullable(reverses); }
    // Entry 객체는 내보내지 않고 값(AccountAmount)의 수정 불가 목록만 내보낸다
    List<AccountAmount> lines() { return entries.stream().map(e -> e.line).toList(); }
}

// 도메인 이벤트: Entry 객체가 아니라 값만 담는다
record TransactionPosted(long position, List<AccountAmount> lines) {
    TransactionPosted { lines = List.copyOf(lines); }
}

// 읽기 모델(aggregate 아님): 전기 순번 lastAppliedSeq 까지 반영한 잔액(날짜와 무관). 이벤트가 순서대로 온다는 전제
final class AccountBalance {
    private final AccountId accountId;
    private Money balance;
    private long lastAppliedSeq = 0;
    AccountBalance(AccountId accountId, String currency) { this.accountId = accountId; this.balance = Money.zero(currency); }
    void apply(TransactionPosted event) {
        if (event.position() <= lastAppliedSeq) return; // 이미 반영한 이벤트는 건너뛴다
        Money next = balance;
        for (AccountAmount line : event.lines()) if (line.accountId().equals(accountId)) next = next.plus(line.amount());
        balance = next; // 합을 다 구한 뒤에 잔액과 반영 위치를 함께 바꾼다
        lastAppliedSeq = event.position();
    }
    Money balance() { return balance; }
}

// 저장소(Repository)와 전기 서비스(도메인 서비스)를 메모리에서 흉내 낸 것
final class GeneralLedger {
    private final Map<AccountId, Account> accounts = new HashMap<>();
    private final List<Transaction> transactions = new ArrayList<>();
    private final List<TransactionPosted> events = new ArrayList<>();
    private final Map<AccountId, AccountBalance> balances = new HashMap<>();
    void add(Account account) {
        if (accounts.putIfAbsent(account.id(), account) != null) throw new IllegalArgumentException("이미 있는 계정입니다");
    }
    void closeAccount(AccountId id) { account(id).close(); }
    Account account(AccountId id) {
        Account account = accounts.get(id);
        if (account == null) throw new IllegalArgumentException("없는 계정입니다: " + id.value());
        return account;
    }
    Transaction transaction(TransactionId id) {
        for (Transaction t : transactions) if (t.id().equals(id)) return t;
        throw new IllegalArgumentException("없는 거래입니다: " + id.value());
    }
    void post(Transaction tx) {
        for (Transaction t : transactions) if (t.id().equals(tx.id())) throw new IllegalArgumentException("이미 있는 거래 id 입니다");
        for (AccountAmount line : tx.lines()) account(line.accountId()).checkPostable(line.amount()); // 저장 전에, 동기로
        transactions.add(tx);
        events.add(new TransactionPosted(events.size() + 1, tx.lines()));
    }

    // 단순한 배달자: 전달 위치를 기억하지 않아 이미 보낸 이벤트도 다시 보낸다. 이벤트 하나를 계정마다 한 번씩 전한다
    void deliverEvents() {
        for (TransactionPosted event : events) {
            Map<AccountId, String> touched = new LinkedHashMap<>();
            for (AccountAmount line : event.lines()) touched.putIfAbsent(line.accountId(), line.amount().currency());
            touched.forEach((id, currency) -> balances.computeIfAbsent(id, k -> new AccountBalance(k, currency)).apply(event));
        }
    }
    // 읽기 모델은 원천이 아니므로 버리고 이벤트에서 다시 만들 수 있다
    void rebuildBalance(AccountId id) {
        balances.remove(id);
        deliverEvents();
    }
    Money balance(AccountId id) {
        AccountBalance b = balances.get(id);
        return b != null ? b.balance() : Money.zero(account(id).currency());
    }

    // 정의 그대로: date 까지의 Entry 중 이 계정에 속한 것의 합
    Money balanceAsOf(AccountId id, LocalDate date) {
        Money sum = Money.zero(account(id).currency());
        for (Transaction tx : transactions) {
            if (tx.date().isAfter(date)) continue;
            for (AccountAmount line : tx.lines()) if (line.accountId().equals(id)) sum = sum.plus(line.amount());
        }
        return sum;
    }
}

public class AccountExample {
    static final String KRW = "KRW";
    static AccountAmount line(AccountId id, long minor) { return new AccountAmount(id, new Money(minor, KRW)); }
    static String rejection(Runnable action) {
        try { action.run(); return "통과(예상과 다름)"; } catch (RuntimeException e) { return e.getMessage(); }
    }
    public static void main(String[] args) {
        GeneralLedger ledger = new GeneralLedger();
        AccountId cash = new AccountId("1010"), suspense = new AccountId("2990");
        AccountId sales = new AccountId("4010"), rent = new AccountId("5010");
        ledger.add(new Account(cash, "현금", new AccountTypeId("자산"), KRW));
        ledger.add(new Account(suspense, "가수금", new AccountTypeId("부채"), KRW));
        ledger.add(new Account(sales, "매출", new AccountTypeId("수익"), KRW));
        ledger.add(new Account(rent, "임대료", new AccountTypeId("비용"), KRW));
        LocalDate apr1 = LocalDate.of(2026, 4, 1), apr5 = LocalDate.of(2026, 4, 5), apr6 = LocalDate.of(2026, 4, 6);

        ledger.post(Transaction.create(new TransactionId("T1"), apr1, List.of(line(cash, 100_000), line(sales, -100_000))));
        System.out.println("T1 전기 직후 현금: 읽기 모델 " + ledger.balance(cash) + " / Entry 합 " + ledger.balanceAsOf(cash, apr1));
        ledger.deliverEvents();
        System.out.println("이벤트 전달 후 현금: 읽기 모델 " + ledger.balance(cash));

        ledger.post(Transaction.create(new TransactionId("T2"), apr5, List.of(line(rent, 30_000), line(cash, -30_000))));
        Transaction t3 = ledger.transaction(new TransactionId("T2")).reverse(new TransactionId("T3"), apr6);
        ledger.post(t3);
        ledger.post(Transaction.create(new TransactionId("T4"), apr6, List.of(line(rent, 25_000), line(cash, -25_000))));
        ledger.deliverEvents();

        System.out.println("T3 이 되돌리는 거래: " + t3.reverses().map(TransactionId::value).orElse("없음"));
        System.out.println("현금 4/5 기준 Entry 합: " + ledger.balanceAsOf(cash, apr5));
        System.out.println("현금 4/6 기준 Entry 합: " + ledger.balanceAsOf(cash, apr6));
        boolean same = ledger.balance(cash).equals(ledger.balanceAsOf(cash, apr6));
        System.out.println("현금 읽기 모델: " + ledger.balance(cash) + " (Entry 합과 같음: " + same + ")");
        Account salesAccount = ledger.account(sales);
        System.out.println(salesAccount.name() + "(" + salesAccount.accountTypeId().value() + ") 읽기 모델: " + ledger.balance(sales));

        ledger.closeAccount(suspense);
        System.out.println("거절(불균형): " + rejection(() -> Transaction.create(new TransactionId("T5"), apr6, List.of(line(cash, 100_000), line(sales, -90_000)))));
        System.out.println("거절(닫힌 계정): " + rejection(() -> ledger.post(Transaction.create(new TransactionId("T6"), apr6, List.of(line(cash, 50_000), line(suspense, -50_000))))));
        ledger.rebuildBalance(cash);
        System.out.println("현금 읽기 모델을 이벤트로 다시 만든 값: " + ledger.balance(cash));
    }
}
