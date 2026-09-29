import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

enum Unit {
    G(1, "g"), KG(1000, "kg");

    final long grams;
    final String symbol;

    Unit(long grams, String symbol) { this.grams = grams; this.symbol = symbol; }
}

// 무게 하나. g 로 정규화해 담으므로 2 kg 과 2000 g 은 같은 값이고 크기 비교가 필드 하나로 끝난다.
record Quantity(long grams) implements Comparable<Quantity> {
    static Quantity of(long amount, Unit unit) { return new Quantity(amount * unit.grams); }

    @Override
    public int compareTo(Quantity other) { return Long.compare(grams, other.grams); }

    @Override
    public String toString() {
        return grams != 0 && grams % Unit.KG.grams == 0
                ? (grams / Unit.KG.grams) + " " + Unit.KG.symbol
                : grams + " " + Unit.G.symbol;
    }
}

// 두 끝과 각 끝을 포함하는지를 한 값으로 든 구간. 끝점 타입은 크기 비교가 되면 무엇이든 된다.
record Range<T extends Comparable<T>>(T lower, T upper, boolean lowerInclusive, boolean upperInclusive) {
    Range {
        if (lower.compareTo(upper) > 0) {
            throw new IllegalArgumentException("하한이 상한보다 큽니다: " + lower + " .. " + upper);
        }
    }

    boolean includes(T value) {
        int lo = lower.compareTo(value);
        int hi = value.compareTo(upper);
        return (lo < 0 || (lo == 0 && lowerInclusive)) && (hi < 0 || (hi == 0 && upperInclusive));
    }

    boolean overlaps(Range<T> other) { return reaches(other) && other.reaches(this); }

    // 맞닿음 — 한쪽 상한과 다른 쪽 하한이 같은 값이고, 그 자리를 정확히 한쪽만 포함한다.
    boolean abuts(Range<T> other) {
        return (upper.compareTo(other.lower) == 0 && upperInclusive != other.lowerInclusive)
                || (other.upper.compareTo(lower) == 0 && other.upperInclusive != lowerInclusive);
    }

    // 이 구간의 아래 끝이 상대의 위 끝까지 닿는가. 같은 값이면 양쪽이 그 자리를 포함해야 닿는다.
    private boolean reaches(Range<T> other) {
        int c = lower.compareTo(other.upper);
        return c < 0 || (c == 0 && lowerInclusive && other.upperInclusive);
    }

    boolean sameEdgeAsLower(T value, boolean inclusive) {
        return lower.compareTo(value) == 0 && lowerInclusive == inclusive;
    }

    boolean sameEdgeAsUpper(T value, boolean inclusive) {
        return upper.compareTo(value) == 0 && upperInclusive == inclusive;
    }

    @Override
    public String toString() {
        return lower + (lowerInclusive ? " <= x " : " < x ") + (upperInclusive ? "<= " : "< ") + upper;
    }
}

record Fee(long won) {
    @Override
    public String toString() { return won + "원"; }
}

record BandId(String value) {}

record RateTableId(String value) {}

record ProductId(String value) {}

// 요금 구간 — 무게 구간 하나와 그 구간의 요금. 표 안에서 BandId 로 지목된다.
record RateBand(BandId id, Range<Quantity> weights, Fee fee) {
    @Override
    public String toString() { return "구간 " + id.value() + " · " + weights + " · " + fee; }
}

final class RateTable {
    private final RateTableId id;
    private final ProductId productId;   // 배송 상품 aggregate 는 id 로만 가리킨다
    private Range<Quantity> span;
    private List<RateBand> bands;

    RateTable(RateTableId id, ProductId productId, Range<Quantity> span, List<RateBand> bands) {
        this.id = id;
        this.productId = productId;
        redefine(span, bands);
    }

    // 구간 목록을 바꾸는 유일한 길. 비중첩과 전 구간 덮음을 여기서 검사하고, 통과한 뒤에 교체한다.
    void redefine(Range<Quantity> span, List<RateBand> bands) {
        List<RateBand> sorted = new ArrayList<>(bands);
        sorted.sort(Comparator.comparing((RateBand b) -> b.weights().lower()));
        if (sorted.isEmpty()) {
            throw new IllegalArgumentException("구간이 하나도 없습니다: " + span);
        }
        for (int i = 0; i < sorted.size(); i++) {
            for (int j = i + 1; j < sorted.size(); j++) {
                RateBand a = sorted.get(i);
                RateBand b = sorted.get(j);
                if (a.weights().overlaps(b.weights())) {
                    throw new IllegalArgumentException("구간이 겹칩니다: " + a.id().value() + "(" + a.weights()
                            + ") 와 " + b.id().value() + "(" + b.weights() + ")");
                }
            }
        }
        RateBand first = sorted.get(0);
        RateBand last = sorted.get(sorted.size() - 1);
        if (!first.weights().sameEdgeAsLower(span.lower(), span.lowerInclusive())
                || !last.weights().sameEdgeAsUpper(span.upper(), span.upperInclusive())) {
            throw new IllegalArgumentException("구간이 적용 구간의 양 끝을 덮지 않습니다: " + span);
        }
        for (int i = 1; i < sorted.size(); i++) {
            Range<Quantity> prev = sorted.get(i - 1).weights();
            Range<Quantity> next = sorted.get(i).weights();
            if (!prev.abuts(next)) {
                throw new IllegalArgumentException("구간 사이에 틈이 있습니다: " + prev
                        + " 다음 구간이 " + next.lower() + " 부터입니다");
            }
        }
        this.span = span;
        this.bands = List.copyOf(sorted);
    }

    RateBand bandFor(Quantity weight) {
        if (!span.includes(weight)) {
            throw new IllegalArgumentException("적용 구간을 벗어납니다: " + weight);
        }
        return bands.stream().filter(b -> b.weights().includes(weight)).findFirst()
                .orElseThrow(() -> new IllegalStateException("어느 구간에도 들지 않습니다: " + weight));
    }

    RateTableId id() { return id; }

    ProductId productId() { return productId; }

    Range<Quantity> span() { return span; }

    List<RateBand> bands() { return bands; }
}

public class Main {
    public static void main(String[] args) {
        Quantity zero = Quantity.of(0, Unit.G);
        Quantity kg2 = Quantity.of(2, Unit.KG);
        Quantity kg5 = Quantity.of(5, Unit.KG);
        Quantity kg20 = Quantity.of(20, Unit.KG);
        Range<Quantity> span = new Range<>(zero, kg20, false, true);
        List<RateBand> bands = List.of(upTo("band-1", zero, kg2, 4000),
                upTo("band-2", kg2, kg5, 5500), upTo("band-3", kg5, kg20, 8000));
        RateTable table = new RateTable(new RateTableId("rate-1"), new ProductId("standard-parcel"), span, bands);
        System.out.println("요금표 " + table.id().value() + " · 상품 " + table.productId().value()
                + " · 적용 " + table.span());
        table.bands().forEach(System.out::println);

        quote(table, kg2);
        quote(table, Quantity.of(2001, Unit.G));
        quote(table, kg20);
        quote(table, Quantity.of(20001, Unit.G));

        Quantity kg30 = Quantity.of(30, Unit.KG);
        Range<Quantity> wider = new Range<>(zero, kg30, false, true);
        List<RateBand> withBig = new ArrayList<>(bands);
        withBig.add(upTo("band-4", kg20, kg30, 11000));
        table.redefine(wider, withBig);
        System.out.println("대형 구간을 더해 적용 " + table.span() + " 으로 다시 정의");
        quote(table, Quantity.of(25, Unit.KG));

        attempt(() -> new Range<>(kg5, kg2, false, true));
        List<RateBand> overlapping = new ArrayList<>(bands);
        overlapping.add(upTo("band-9", Quantity.of(4, Unit.KG), Quantity.of(9, Unit.KG), 7000));
        attempt(() -> table.redefine(span, overlapping));
        attempt(() -> table.redefine(span, List.of(upTo("band-1", zero, kg2, 4000),
                upTo("band-5", Quantity.of(3, Unit.KG), kg5, 5500), upTo("band-3", kg5, kg20, 8000))));

        RateTable flipped = new RateTable(new RateTableId("rate-2"), new ProductId("standard-parcel"),
                new Range<>(zero, kg20, true, false),
                List.of(from("band-1", zero, kg2, 4000), from("band-2", kg2, kg5, 5500),
                        from("band-3", kg5, kg20, 8000)));
        System.out.print("경계 포함을 뒤집은 표에서 ");
        quote(flipped, kg2);
    }

    // 하한 미포함 · 상한 포함
    static RateBand upTo(String id, Quantity lower, Quantity upper, long won) {
        return new RateBand(new BandId(id), new Range<>(lower, upper, false, true), new Fee(won));
    }

    // 하한 포함 · 상한 미포함
    static RateBand from(String id, Quantity lower, Quantity upper, long won) {
        return new RateBand(new BandId(id), new Range<>(lower, upper, true, false), new Fee(won));
    }

    static void quote(RateTable table, Quantity weight) {
        try {
            RateBand band = table.bandFor(weight);
            System.out.println(weight + " 소포 → " + band.id().value() + " · " + band.fee());
        } catch (RuntimeException e) {
            System.out.println("거부 — " + e.getMessage());
        }
    }

    static void attempt(Runnable action) {
        try {
            action.run();
        } catch (RuntimeException e) {
            System.out.println("거부 — " + e.getMessage());
        }
    }
}
