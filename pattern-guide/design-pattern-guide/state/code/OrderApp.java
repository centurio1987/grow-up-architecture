interface OrderState {
    String name();

    OrderState pay(Order order, long amount);

    OrderState ship(Order order);

    OrderState cancel(Order order);
}

final class AwaitingPayment implements OrderState {
    @Override
    public String name() {
        return "awaiting-payment";
    }

    @Override
    public OrderState pay(Order order, long amount) {
        order.addPayment(amount);
        order.note("pay " + amount + " (paid " + order.paid() + "/" + order.total() + ")");
        return order.paid() >= order.total() ? new Paid() : new PartiallyPaid();
    }

    @Override
    public OrderState ship(Order order) {
        order.note("ship rejected(not paid yet)");
        return this;
    }

    @Override
    public OrderState cancel(Order order) {
        order.note("cancel before payment");
        return new Cancelled();
    }
}

final class PartiallyPaid implements OrderState {
    @Override
    public String name() {
        return "partially-paid";
    }

    @Override
    public OrderState pay(Order order, long amount) {
        order.addPayment(amount);
        order.note("pay " + amount + " (paid " + order.paid() + "/" + order.total() + ")");
        return order.paid() >= order.total() ? new Paid() : this;
    }

    @Override
    public OrderState ship(Order order) {
        order.note("ship rejected(not fully paid)");
        return this;
    }

    @Override
    public OrderState cancel(Order order) {
        long refunded = order.paid();
        order.refundAll();
        order.note("cancel refund " + refunded);
        return new Cancelled();
    }
}

final class Paid implements OrderState {
    @Override
    public String name() {
        return "paid";
    }

    @Override
    public OrderState pay(Order order, long amount) {
        order.note("pay rejected(already paid)");
        return this;
    }

    @Override
    public OrderState ship(Order order) {
        order.note("ship invoice issued");
        return new Shipped();
    }

    @Override
    public OrderState cancel(Order order) {
        long refunded = order.paid();
        order.refundAll();
        order.note("cancel refund " + refunded);
        return new Cancelled();
    }
}

final class Shipped implements OrderState {
    @Override
    public String name() {
        return "shipped";
    }

    @Override
    public OrderState pay(Order order, long amount) {
        order.note("pay rejected(already paid)");
        return this;
    }

    @Override
    public OrderState ship(Order order) {
        order.note("ship rejected(already shipped)");
        return this;
    }

    @Override
    public OrderState cancel(Order order) {
        order.note("cancel rejected(already shipped)");
        return this;
    }
}

final class Cancelled implements OrderState {
    @Override
    public String name() {
        return "cancelled";
    }

    @Override
    public OrderState pay(Order order, long amount) {
        order.note("pay rejected(order cancelled)");
        return this;
    }

    @Override
    public OrderState ship(Order order) {
        order.note("ship rejected(order cancelled)");
        return this;
    }

    @Override
    public OrderState cancel(Order order) {
        order.note("cancel rejected(order cancelled)");
        return this;
    }
}

final class Order {
    private final String id;
    private final long total;
    private long paid;
    private String lastNote = "";
    private OrderState state;

    Order(String id, long total, OrderState initial) {
        this.id = id;
        this.total = total;
        this.state = initial;
    }

    void pay(long amount) {
        OrderState before = state;
        state = state.pay(this, amount);
        print(before);
    }

    void ship() {
        OrderState before = state;
        state = state.ship(this);
        print(before);
    }

    void cancel() {
        OrderState before = state;
        state = state.cancel(this);
        print(before);
    }

    long total() {
        return total;
    }

    long paid() {
        return paid;
    }

    void addPayment(long amount) {
        paid += amount;
    }

    void refundAll() {
        paid = 0;
    }

    void note(String message) {
        lastNote = message;
    }

    private void print(OrderState before) {
        System.out.println(id + " " + before.name() + " " + lastNote + " -> " + state.name());
    }
}

public class OrderApp {
    public static void main(String[] args) {
        Order a = new Order("A", 48_000, new AwaitingPayment());
        a.ship();
        a.pay(48_000);
        a.ship();
        a.cancel();

        Order b = new Order("B", 30_000, new AwaitingPayment());
        b.pay(12_000);
        b.pay(18_000);
        b.cancel();
        b.pay(5_000);
    }
}
