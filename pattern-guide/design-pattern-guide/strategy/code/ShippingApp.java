import java.util.List;
import java.util.stream.Collectors;

interface ShippingPolicy {
    long fee(long subtotal, long weightGrams);
}

final class FlatRate implements ShippingPolicy {
    private final long amount;

    FlatRate(long amount) {
        this.amount = amount;
    }

    @Override
    public long fee(long subtotal, long weightGrams) {
        return amount;
    }
}

final class FreeOverThreshold implements ShippingPolicy {
    private final long threshold;
    private final long amount;

    FreeOverThreshold(long threshold, long amount) {
        this.threshold = threshold;
        this.amount = amount;
    }

    @Override
    public long fee(long subtotal, long weightGrams) {
        return subtotal >= threshold ? 0 : amount;
    }
}

final class ByWeight implements ShippingPolicy {
    private final long perKg;

    ByWeight(long perKg) {
        this.perKg = perKg;
    }

    @Override
    public long fee(long subtotal, long weightGrams) {
        return Math.ceilDiv(weightGrams, 1_000) * perKg;
    }
}

record Order(String id, long subtotal, long weightGrams) {
}

final class Checkout {
    private ShippingPolicy policy;

    Checkout(ShippingPolicy policy) {
        this.policy = policy;
    }

    void changePolicy(ShippingPolicy policy) {
        this.policy = policy;
    }

    long total(Order order) {
        return order.subtotal() + policy.fee(order.subtotal(), order.weightGrams());
    }
}

public class ShippingApp {
    static ShippingPolicy choosePolicy(String plan) {
        return switch (plan) {
            case "flat" -> new FlatRate(3_000);
            case "free-over" -> new FreeOverThreshold(50_000, 3_000);
            case "weight" -> new ByWeight(1_500);
            default -> throw new IllegalArgumentException("unknown plan: " + plan);
        };
    }

    static void printTotals(String plan, Checkout checkout, List<Order> orders) {
        String line = orders.stream()
                .map(order -> order.id() + "=" + checkout.total(order))
                .collect(Collectors.joining(" "));
        System.out.println(plan + ": " + line);
    }

    public static void main(String[] args) {
        List<Order> orders = List.of(
                new Order("A", 32_000, 2_300),
                new Order("B", 58_000, 5_100));

        Checkout checkout = new Checkout(choosePolicy("flat"));
        printTotals("flat", checkout, orders);

        checkout.changePolicy(choosePolicy("free-over"));
        printTotals("free-over", checkout, orders);

        checkout.changePolicy(choosePolicy("weight"));
        printTotals("weight", checkout, orders);
    }
}
