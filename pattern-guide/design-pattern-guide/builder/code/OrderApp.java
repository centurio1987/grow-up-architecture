import java.util.ArrayList;
import java.util.List;

/** 주문 한 줄. 예시의 입력 데이터이고 패턴의 역할은 아니다. */
final class OrderLine {
    final String name;
    final int quantity;
    final int unitPrice;

    OrderLine(String name, int quantity, int unitPrice) {
        this.name = name;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
    }
}

/** 주문 한 건. 예시의 입력 데이터이고 패턴의 역할은 아니다. */
final class Order {
    final String id;
    final List<OrderLine> lines;
    final int shippingFee;

    Order(String id, List<OrderLine> lines, int shippingFee) {
        this.id = id;
        this.lines = lines;
        this.shippingFee = shippingFee;
    }
}

/** Builder — 부분을 받는 연산만 선언한다. 제품을 꺼내는 연산은 여기 없다. */
interface OrderBuilder {
    void begin(String orderId);

    void addLine(String name, int quantity, int unitPrice);

    void addShipping(int fee);

    void end();
}

/** Product 1 — 영수증 여러 줄. */
final class Receipt {
    private final List<String> lines;

    Receipt(List<String> lines) {
        this.lines = List.copyOf(lines);
    }

    String text() {
        return String.join("\n", lines);
    }
}

/** Product 2 — 집계 한 줄. Receipt 와 공통 부모가 없다. */
final class OrderTotals {
    private final String orderId;
    private final int lineCount;
    private final int itemCount;
    private final int goodsAmount;
    private final int shippingFee;

    OrderTotals(String orderId, int lineCount, int itemCount, int goodsAmount, int shippingFee) {
        this.orderId = orderId;
        this.lineCount = lineCount;
        this.itemCount = itemCount;
        this.goodsAmount = goodsAmount;
        this.shippingFee = shippingFee;
    }

    String summary() {
        return "주문 " + orderId + " · 품목 " + lineCount + "종 · 수량 " + itemCount
                + "개 · 상품 " + goodsAmount + "원 · 배송 " + shippingFee
                + "원 · 합계 " + (goodsAmount + shippingFee) + "원";
    }
}

/** ConcreteBuilder 1 — 영수증 표현을 정의하고 추적한다. */
final class ReceiptBuilder implements OrderBuilder {
    private final List<String> lines = new ArrayList<>();
    private int amount;
    private Receipt product;

    @Override
    public void begin(String orderId) {
        lines.clear();
        amount = 0;
        product = null;
        lines.add("주문 " + orderId);
    }

    @Override
    public void addLine(String name, int quantity, int unitPrice) {
        int sum = quantity * unitPrice;
        amount += sum;
        lines.add(name + " x" + quantity + " @" + unitPrice + " = " + sum);
    }

    @Override
    public void addShipping(int fee) {
        amount += fee;
        lines.add("배송비 " + fee);
    }

    @Override
    public void end() {
        lines.add("합계 " + amount);
        product = new Receipt(lines);
    }

    Receipt getReceipt() {
        if (product == null) {
            throw new IllegalStateException("end() 전에는 영수증을 꺼낼 수 없습니다");
        }
        return product;
    }
}

/** ConcreteBuilder 2 — 집계 표현을 정의하고 추적한다. */
final class TotalsBuilder implements OrderBuilder {
    private String orderId = "";
    private int lineCount;
    private int itemCount;
    private int goodsAmount;
    private int shippingFee;
    private OrderTotals product;

    @Override
    public void begin(String orderId) {
        this.orderId = orderId;
        lineCount = 0;
        itemCount = 0;
        goodsAmount = 0;
        shippingFee = 0;
        product = null;
    }

    @Override
    public void addLine(String name, int quantity, int unitPrice) {
        lineCount += 1;
        itemCount += quantity;
        goodsAmount += quantity * unitPrice;
    }

    @Override
    public void addShipping(int fee) {
        shippingFee += fee;
    }

    @Override
    public void end() {
        product = new OrderTotals(orderId, lineCount, itemCount, goodsAmount, shippingFee);
    }

    OrderTotals getTotals() {
        if (product == null) {
            throw new IllegalStateException("end() 전에는 집계를 꺼낼 수 없습니다");
        }
        return product;
    }
}

/** Director — 추상 빌더 타입만 참조한다. */
final class OrderReader {
    private final OrderBuilder builder;

    OrderReader(OrderBuilder builder) {
        this.builder = builder;
    }

    void read(Order order) {
        builder.begin(order.id);
        for (OrderLine line : order.lines) {
            builder.addLine(line.name, line.quantity, line.unitPrice);
        }
        if (order.shippingFee > 0) {
            builder.addShipping(order.shippingFee);
        }
        builder.end();
    }
}

public final class OrderApp {
    public static void main(String[] args) {
        Order order = new Order("ORD-4417", List.of(
                new OrderLine("공책", 3, 3000),
                new OrderLine("연필", 12, 500),
                new OrderLine("지우개", 2, 800)), 3000);

        ReceiptBuilder receiptBuilder = new ReceiptBuilder();
        new OrderReader(receiptBuilder).read(order);
        System.out.println("--- receipt ---");
        System.out.println(receiptBuilder.getReceipt().text());

        TotalsBuilder totalsBuilder = new TotalsBuilder();
        new OrderReader(totalsBuilder).read(order);
        System.out.println("--- totals ---");
        System.out.println(totalsBuilder.getTotals().summary());

        ReceiptBuilder halfway = new ReceiptBuilder();
        halfway.begin(order.id);
        halfway.addLine("공책", 3, 3000);
        System.out.println("--- before end ---");
        try {
            halfway.getReceipt();
            System.out.println("꺼냈음");
        } catch (IllegalStateException e) {
            System.out.println("거부됨");
        }
    }
}
