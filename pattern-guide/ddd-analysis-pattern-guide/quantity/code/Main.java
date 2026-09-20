import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

enum Unit {
    G("g"), KG("kg"), L("L");

    final String symbol;

    Unit(String symbol) { this.symbol = symbol; }
}

// from 1 = to factor. 방향이 있다: from → to 는 곱하고, to → from 은 나눈다.
record ConversionRatio(Unit from, Unit to, long factor) {
    static final List<ConversionRatio> ALL = List.of(new ConversionRatio(Unit.KG, Unit.G, 1000));

    static Optional<ConversionRatio> between(Unit a, Unit b) {
        return ALL.stream()
                .filter(r -> (r.from == a && r.to == b) || (r.from == b && r.to == a))
                .findFirst();
    }
}

record Quantity(BigDecimal amount, Unit unit) {
    static final int MAX_SCALE = 3;

    Quantity {
        Objects.requireNonNull(amount, "수치가 없습니다");
        Objects.requireNonNull(unit, "단위가 없습니다");
        amount = amount.stripTrailingZeros(); // 2.50 과 2.5 를 같은 표현으로 맞춘다
        if (amount.scale() > MAX_SCALE) {
            throw new IllegalArgumentException(
                    "소수점 아래 세 자리까지만 기록합니다: " + amount.toPlainString() + " " + unit.symbol);
        }
    }

    static Quantity of(String amount, Unit unit) {
        return new Quantity(new BigDecimal(amount), unit);
    }

    Quantity plus(Quantity other) {
        Unit common = commonUnit(other);
        return new Quantity(convertTo(common).amount.add(other.convertTo(common).amount), common);
    }

    Quantity minus(Quantity other) {
        Unit common = commonUnit(other);
        return new Quantity(convertTo(common).amount.subtract(other.convertTo(common).amount), common);
    }

    Quantity times(long n) {
        return new Quantity(amount.multiply(BigDecimal.valueOf(n)), unit);
    }

    // 크기 비교: 단위를 맞춘 뒤 비교한다. equals 는 수치와 단위가 둘 다 같아야 참이다.
    int compareTo(Quantity other) {
        Unit common = commonUnit(other);
        return convertTo(common).amount.compareTo(other.convertTo(common).amount);
    }

    boolean isPositive() { return amount.signum() > 0; }

    boolean isNegative() { return amount.signum() < 0; }

    Quantity convertTo(Unit target) {
        if (unit == target) {
            return this;
        }
        ConversionRatio ratio = ConversionRatio.between(unit, target).orElseThrow(() -> noRatio(unit, target));
        BigDecimal factor = BigDecimal.valueOf(ratio.factor());
        if (ratio.from() == unit) {
            return new Quantity(amount.multiply(factor), target); // 정방향: 곱셈
        }
        BigDecimal divided = amount.divide(factor); // 역방향: 나눗셈
        if (divided.stripTrailingZeros().scale() > MAX_SCALE) {
            throw new IllegalArgumentException(target.symbol + " 로 옮기면 소수점 아래 세 자리를 넘습니다: " + this);
        }
        return new Quantity(divided, target);
    }

    // 이 예제의 선택: 단위가 다르면 비율의 to 쪽(kg→g 이므로 g)으로 맞춰 곱셈만 일어나게 한다.
    private Unit commonUnit(Quantity other) {
        if (unit == other.unit) {
            return unit;
        }
        return ConversionRatio.between(unit, other.unit)
                .map(ConversionRatio::to)
                .orElseThrow(() -> noRatio(unit, other.unit));
    }

    private static IllegalArgumentException noRatio(Unit a, Unit b) {
        return new IllegalArgumentException("환산 비율이 없습니다: " + a.symbol + " ↔ " + b.symbol);
    }

    @Override
    public String toString() {
        return amount.toPlainString() + " " + unit.symbol;
    }
}

record StockId(String value) {}

record IngredientId(String value) {}

final class IngredientStock {
    private final StockId id;
    private final IngredientId ingredientId; // 재료 카탈로그 aggregate 는 id 로만 가리킨다
    private Quantity onHand;

    IngredientStock(StockId id, IngredientId ingredientId, Unit unit) {
        this.id = id;
        this.ingredientId = ingredientId;
        this.onHand = Quantity.of("0", unit);
    }

    void receive(Quantity received) {
        requirePositive(received);
        onHand = onHand.plus(received);
    }

    void consume(Quantity used) {
        requirePositive(used);
        Quantity after = onHand.minus(used);
        if (after.isNegative()) {
            throw new IllegalStateException("재고가 모자랍니다: 보유 " + onHand + ", 요청 " + used);
        }
        onHand = after;
    }

    private static void requirePositive(Quantity q) {
        if (!q.isPositive()) {
            throw new IllegalArgumentException("입고·사용량은 0보다 커야 합니다: " + q);
        }
    }

    StockId id() { return id; }

    IngredientId ingredientId() { return ingredientId; }

    Quantity onHand() { return onHand; }
}

public class Main {
    public static void main(String[] args) {
        IngredientStock stock = new IngredientStock(new StockId("stock-1"), new IngredientId("yeast"), Unit.KG);
        System.out.println("재고 " + stock.id().value() + " · 재료 " + stock.ingredientId().value());

        stock.receive(Quantity.of("0.3", Unit.KG));
        System.out.println("입고 0.3 kg → 보유 " + stock.onHand());
        stock.consume(Quantity.of("50", Unit.G).times(2));
        System.out.println("사용 50 g × 2 → 보유 " + stock.onHand());
        System.out.println("보유량을 kg 로 → " + stock.onHand().convertTo(Unit.KG));
        stock.consume(Quantity.of("0.2", Unit.KG));
        System.out.println("사용 0.2 kg → 보유 " + stock.onHand());

        attempt(() -> stock.consume(Quantity.of("1", Unit.G)));
        attempt(() -> stock.receive(Quantity.of("1", Unit.L)));
        attempt(() -> Quantity.of("0.5", Unit.G).convertTo(Unit.KG));

        Quantity kg = Quantity.of("2.5", Unit.KG);
        System.out.println("같은 값인가 2.50 kg / 2.5 kg: " + Quantity.of("2.50", Unit.KG).equals(kg));
        System.out.println("같은 값인가 2.5 kg / 2500 g: " + kg.equals(Quantity.of("2500", Unit.G)));
        System.out.println("같은 양인가 2.5 kg / 2500 g: " + (kg.compareTo(Quantity.of("2500", Unit.G)) == 0));
    }

    static void attempt(Runnable action) {
        try {
            action.run();
        } catch (RuntimeException e) {
            System.out.println("거부 — " + e.getMessage());
        }
    }
}
