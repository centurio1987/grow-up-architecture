import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

record AccountId(String value) {}
record PostingRuleId(String value) {}
record TransactionId(String value) {}   // 거래 식별자
record SourceRef(String value) {}   // 다른 컨텍스트가 준 원천 사건 식별자 — 이 컨텍스트에서는 값이다
record EventKind(String value) {}   // 사건 종류

// VO: 금액은 정수 최소 단위(KRW 는 원)이고 부호가 방향이다
record Money(long minor, String currency) {
    static Money zero(String currency) { return new Money(0, currency); }
    Money plus(Money other) {
        if (!currency.equals(other.currency)) throw new IllegalArgumentException("통화가 다른 금액은 더할 수 없습니다");
        return new Money(Math.addExact(minor, other.minor), currency);
    }
    Money times(long factor) { return new Money(Math.multiplyExact(minor, factor), currency); }
    Money permille(long rate) { return new Money(Math.multiplyExact(minor, rate) / 1000, currency); }
    Money negate() { return new Money(Math.negateExact(minor), currency); }
    @Override public String toString() { return (minor < 0 ? "" : "+") + minor + " " + currency; }
}

// VO: 계정 id 와 금액 한 쌍 — 규칙이 내놓는 한 다리이자 거래를 만들 때의 입력
record AccountAmount(AccountId accountId, Money amount) {
    @Override public String toString() { return accountId.value() + " " + amount; }
}

// VO: 양 끝을 포함하는 날짜 구간. 날짜가 YYYY-MM-DD 라 문자열 비교가 날짜 순서와 같다
record DateRange(String from, String to) {
    boolean contains(String date) { return from.compareTo(date) <= 0 && date.compareTo(to) <= 0; }
    boolean overlaps(DateRange other) { return from.compareTo(other.to) <= 0 && other.from.compareTo(to) <= 0; }
}

// VO: 다른 컨텍스트에서 넘어온 사실. 이 컨텍스트는 사건을 고치지 않는다
record AccountingEvent(SourceRef sourceRef, EventKind kind, String occurredOn, String noticedOn,
                       long quantity, Money amount) {}

// 규칙이 쥐는 계산. 규칙마다 자기 계산을 갖는다
sealed interface Calculation permits PerUnitRate, Percentage {
    Money amountFor(AccountingEvent event);
}
record PerUnitRate(Money rate) implements Calculation {
    @Override public Money amountFor(AccountingEvent event) { return rate.times(event.quantity()); }
}
record Percentage(long permille) implements Calculation {
    @Override public Money amountFor(AccountingEvent event) { return event.amount().permille(permille); }
}

// 규칙이 한 번 실행해 내놓는 것: 거래가 될 다리 목록과, 이어서 처리할 파생 사건(없으면 null)
record RuleOutput(List<AccountAmount> lines, AccountingEvent derived) {}
// aggregate root, 지식 층위: 무엇에 반응해 · 얼마를 · 어디에 셋을 한 인스턴스가 쥔다
final class PostingRule {
    private final PostingRuleId id;
    private final EventKind eventKind;
    private final DateRange effectivity;
    private final Calculation calculation;
    private final AccountId debitAccountId;    // 다른 aggregate 는 id 로만 가리킨다
    private final AccountId creditAccountId;
    private final EventKind derives;           // 이 규칙이 내보내는 파생 사건 종류. 없으면 null

    PostingRule(PostingRuleId id, EventKind eventKind, DateRange effectivity, Calculation calculation,
                AccountId debitAccountId, AccountId creditAccountId, EventKind derives) {
        this.id = id; this.eventKind = eventKind; this.effectivity = effectivity; this.calculation = calculation;
        this.debitAccountId = debitAccountId; this.creditAccountId = creditAccountId; this.derives = derives;
    }
    PostingRuleId id() { return id; }
    EventKind eventKind() { return eventKind; }
    DateRange effectivity() { return effectivity; }

    // 사건의 발생 시점이 유효 기간 안일 때만 맡는다 — 접수 시점이 아니다
    boolean appliesTo(AccountingEvent event) {
        return eventKind.equals(event.kind()) && effectivity.contains(event.occurredOn());
    }
    RuleOutput apply(AccountingEvent event) {
        if (!appliesTo(event)) throw new IllegalStateException("이 규칙이 맡는 사건이 아닙니다: " + id.value());
        Money amount = calculation.amountFor(event);
        List<AccountAmount> lines = List.of(new AccountAmount(debitAccountId, amount),
                                            new AccountAmount(creditAccountId, amount.negate()));
        AccountingEvent next = derives == null ? null
                : new AccountingEvent(event.sourceRef(), derives, event.occurredOn(), event.noticedOn(), 0, amount);
        return new RuleOutput(lines, next);
    }
}

// 규칙 등록 서비스이자 저장소: 같은 사건 종류에 기간이 겹치는 규칙이 둘 이상 생기지 않게 막는다
final class PostingRuleBook {
    private final List<PostingRule> rules = new ArrayList<>();
    void register(PostingRule rule) {
        for (PostingRule other : rules) {
            if (other.eventKind().equals(rule.eventKind()) && other.effectivity().overlaps(rule.effectivity())) {
                throw new IllegalArgumentException(rule.eventKind().value()
                        + " 사건 종류에 유효 기간이 겹치는 규칙이 있습니다: " + other.id().value());
            }
        }
        rules.add(rule);
    }
    // 사건 종류와 시점이 주어지면 규칙이 하나로 정해진다. 없으면 오류다
    PostingRule ruleFor(EventKind kind, String date) {
        for (PostingRule rule : rules) {
            if (rule.eventKind().equals(kind) && rule.effectivity().contains(date)) return rule;
        }
        throw new IllegalStateException("적용할 규칙이 없습니다: " + kind.value() + " " + date);
    }
}

// Transaction 안의 불변 child entity: 식별자는 거래 id + 순번이다
record Entry(int seq, AccountAmount line) {}
// aggregate root: 만들 때 균형을 검사하고, 만든 뒤에는 바꾸는 메서드가 없다
final class Transaction {
    private final TransactionId id;
    private final String date;
    private final SourceRef sourceRef;
    private final PostingRuleId postingRuleId;
    private final List<Entry> entries;

    private Transaction(TransactionId id, String date, SourceRef sourceRef, PostingRuleId postingRuleId,
                        List<Entry> entries) {
        this.id = id; this.date = date; this.sourceRef = sourceRef;
        this.postingRuleId = postingRuleId; this.entries = entries;
    }
    static Transaction create(TransactionId id, String date, SourceRef sourceRef, PostingRuleId postingRuleId,
                              List<AccountAmount> lines) {
        if (lines.size() < 2) throw new IllegalArgumentException("Entry 는 2개 이상이어야 합니다");
        Map<String, Money> sums = new LinkedHashMap<>();
        List<Entry> made = new ArrayList<>();
        for (AccountAmount line : lines) {
            sums.merge(line.amount().currency(), line.amount(), Money::plus);
            made.add(new Entry(made.size() + 1, line));
        }
        for (Money sum : sums.values()) {
            if (sum.minor() != 0) throw new IllegalArgumentException(sum.currency() + " 합이 0 이 아닙니다: " + sum.minor());
        }
        return new Transaction(id, date, sourceRef, postingRuleId, List.copyOf(made));
    }
    TransactionId id() { return id; }
    String date() { return date; }
    SourceRef sourceRef() { return sourceRef; }
    // 전기 키는 거래가 스스로 답한다 — 원천 사건과 규칙의 쌍이다
    String postingKey() { return sourceRef.value() + " / " + postingRuleId.value(); }
    // Entry 객체는 내보내지 않고 순번이 붙은 글자만 내보낸다
    String entryText() {
        List<String> parts = new ArrayList<>();
        for (Entry entry : entries) parts.add("#" + entry.seq() + " " + entry.line());
        return String.join(" / ", parts);
    }
}

// 저장소이자 전기 서비스: 전기 키 (원천 사건, 규칙) 의 유일성이 중복 전기를 막는다
final class GeneralLedger {
    private final List<Transaction> posted = new ArrayList<>();
    private int next = 1;
    Transaction post(SourceRef sourceRef, PostingRuleId ruleId, String date, List<AccountAmount> lines) {
        String key = sourceRef.value() + " / " + ruleId.value();
        for (Transaction already : posted) {
            if (already.postingKey().equals(key)) return already;   // 멱등: 이미 전기된 거래를 돌려준다
        }
        Transaction made = Transaction.create(new TransactionId("T" + next), date, sourceRef, ruleId, lines);
        posted.add(made);
        next++;
        return made;
    }
    int size() { return posted.size(); }
    int distinctSources() {
        Set<String> refs = new LinkedHashSet<>();
        for (Transaction transaction : posted) refs.add(transaction.sourceRef().value());
        return refs.size();
    }
}

public class PostingRuleExample {
    static final String KRW = "KRW";
    static final AccountId RECEIVABLE = new AccountId("1200");
    static final AccountId USAGE_REVENUE = new AccountId("4100");
    static final AccountId TAX_PAYABLE = new AccountId("2200");
    static final EventKind USAGE = new EventKind("USAGE");
    static final EventKind TAX = new EventKind("TAX");

    static String join(List<AccountAmount> lines) {
        List<String> parts = new ArrayList<>();
        for (AccountAmount line : lines) parts.add(line.toString());
        return String.join(" / ", parts);
    }
    static String rejection(Runnable action) {
        try { action.run(); return "통과(예상과 다름)"; } catch (RuntimeException e) { return e.getMessage(); }
    }
    static AccountingEvent usage(String ref, String occurredOn, String noticedOn, long kwh) {
        return new AccountingEvent(new SourceRef(ref), USAGE, occurredOn, noticedOn, kwh, Money.zero(KRW));
    }

    public static void main(String[] args) {
        PostingRuleBook book = new PostingRuleBook();
        book.register(new PostingRule(new PostingRuleId("R1"), USAGE, new DateRange("2026-03-01", "2026-03-13"),
                new PerUnitRate(new Money(15, KRW)), RECEIVABLE, USAGE_REVENUE, null));
        book.register(new PostingRule(new PostingRuleId("R2"), USAGE, new DateRange("2026-03-14", "9999-12-31"),
                new PerUnitRate(new Money(18, KRW)), RECEIVABLE, USAGE_REVENUE, TAX));
        book.register(new PostingRule(new PostingRuleId("R3"), TAX, new DateRange("2026-03-14", "9999-12-31"),
                new Percentage(100), RECEIVABLE, TAX_PAYABLE, null));

        GeneralLedger ledger = new GeneralLedger();
        List<AccountingEvent> queue = new ArrayList<>();
        queue.add(usage("U-7731", "2026-03-07", "2026-03-09", 120));
        queue.add(usage("U-7732", "2026-03-20", "2026-03-21", 120));
        queue.add(usage("U-7733", "2026-03-07", "2026-03-22", 120));

        for (int i = 0; i < queue.size(); i++) {
            AccountingEvent event = queue.get(i);
            PostingRule rule = book.ruleFor(event.kind(), event.occurredOn());   // 발생 시점으로 고른다
            RuleOutput out = rule.apply(event);
            Transaction posted = ledger.post(event.sourceRef(), rule.id(), event.noticedOn(), out.lines());
            if (out.derived() != null) queue.add(i + 1, out.derived());
            System.out.println(event.sourceRef().value() + " " + event.kind().value()
                    + " 발생 " + event.occurredOn() + " 접수 " + event.noticedOn()
                    + " -> 규칙 " + rule.id().value() + " -> " + posted.id().value());
            System.out.println(posted.id().value() + " (거래일 " + posted.date() + ") 항목: " + posted.entryText());
        }
        System.out.println("전기된 거래 " + ledger.size() + "건, 원천 사건 식별자로만 세면 " + ledger.distinctSources() + "건");

        AccountingEvent retry = usage("U-7733", "2026-03-07", "2026-03-22", 120);
        PostingRule retryRule = book.ruleFor(retry.kind(), retry.occurredOn());
        Transaction again = ledger.post(retry.sourceRef(), retryRule.id(), retry.noticedOn(),
                retryRule.apply(retry).lines());
        System.out.println("같은 사건·같은 규칙 재시도: 새 거래 없이 " + again.id().value()
                + " 를 돌려줌 (거래 수 " + ledger.size() + ")");

        AccountingEvent stray = usage("U-7735", "2026-03-07", "2026-03-23", 120);
        List<AccountAmount> full = book.ruleFor(stray.kind(), stray.occurredOn()).apply(stray).lines();
        List<AccountAmount> oneLeg = List.of(full.get(0));
        System.out.println("거절(규칙이 Entry 를 하나만 냄): " + rejection(() ->
                ledger.post(stray.sourceRef(), new PostingRuleId("R1"), stray.noticedOn(), oneLeg)));
        List<AccountAmount> mismatched = List.of(full.get(0),
                new AccountAmount(USAGE_REVENUE, new Money(-1_440, KRW)));
        System.out.println("거절(두 다리의 금액이 어긋남): " + rejection(() ->
                ledger.post(stray.sourceRef(), new PostingRuleId("R1"), stray.noticedOn(), mismatched)));
        System.out.println("거절(유효 기간 겹침): " + rejection(() ->
                book.register(new PostingRule(new PostingRuleId("R9"), USAGE, new DateRange("2026-03-20", "9999-12-31"),
                        new PerUnitRate(new Money(20, KRW)), RECEIVABLE, USAGE_REVENUE, null))));

        AccountingEvent probe = usage("U-7733", "2026-03-22", "2026-03-22", 120);   // 접수 시점을 발생 시점처럼 쓴 사건
        RuleOutput wrong = book.ruleFor(probe.kind(), probe.occurredOn()).apply(probe);
        RuleOutput wrongTax = book.ruleFor(wrong.derived().kind(), wrong.derived().occurredOn()).apply(wrong.derived());
        System.out.println("접수 시점으로 골랐다면: 규칙 "
                + book.ruleFor(probe.kind(), probe.occurredOn()).id().value() + " -> " + join(wrong.lines())
                + ", 세금 " + wrongTax.lines().get(0).amount() + " 까지 붙음");
    }
}
