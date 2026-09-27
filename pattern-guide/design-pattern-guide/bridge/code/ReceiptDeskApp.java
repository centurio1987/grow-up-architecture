import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/** Implementor — 영수증을 실제 매체에 얹는 원시 연산 넷과 비우기. */
interface Medium {
    void emphasis(String text);

    void rule();

    void row(String label, String amount);

    void text(String text);

    String flush();
}

/** ConcreteImplementor — 32칸 감열 프린터. */
final class ThermalPrinter implements Medium {
    private static final int WIDTH = 32;
    private final List<String> buffer = new ArrayList<>();

    @Override
    public void emphasis(String text) {
        String upper = text.toUpperCase(Locale.ROOT);
        int pad = Math.max(0, (WIDTH - upper.length()) / 2);
        buffer.add(" ".repeat(pad) + upper);
    }

    @Override
    public void rule() {
        buffer.add("-".repeat(WIDTH));
    }

    @Override
    public void row(String label, String amount) {
        buffer.add(padRight(label, 22) + padLeft(amount, 10));
    }

    @Override
    public void text(String text) {
        buffer.add(text);
    }

    @Override
    public String flush() {
        String out = String.join("\n", buffer);
        buffer.clear();
        return out;
    }

    private static String padRight(String s, int width) {
        return s.length() >= width ? s : s + " ".repeat(width - s.length());
    }

    private static String padLeft(String s, int width) {
        return s.length() >= width ? s : " ".repeat(width - s.length()) + s;
    }
}

/** ConcreteImplementor — HTML 페이지. */
final class HtmlPage implements Medium {
    private final List<String> buffer = new ArrayList<>();

    @Override
    public void emphasis(String text) {
        buffer.add("<h1>" + text + "</h1>");
    }

    @Override
    public void rule() {
        buffer.add("<hr>");
    }

    @Override
    public void row(String label, String amount) {
        buffer.add("<p>" + label + "<b>" + amount + "</b></p>");
    }

    @Override
    public void text(String text) {
        buffer.add("<p>" + text + "</p>");
    }

    @Override
    public String flush() {
        String out = String.join("\n", buffer);
        buffer.clear();
        return out;
    }
}

/** 외부 라벨 장비의 SDK. 우리가 고칠 수 없고 Medium 이라는 타입을 모른다. */
final class LegacyLabelPrinter {
    private final List<String> tape = new ArrayList<>();

    void esc(int code, String payload) {
        tape.add("<" + code + ">" + payload);
    }

    String takeTape() {
        String out = String.join("\n", tape);
        tape.clear();
        return out;
    }
}

/** ConcreteImplementor 이면서 Adapter — 라벨 장비의 연산 하나에 Medium 의 네 연산을 얹는다. */
final class LabelPrinterMedium implements Medium {
    private final LegacyLabelPrinter device;

    LabelPrinterMedium(LegacyLabelPrinter device) {
        this.device = device;
    }

    @Override
    public void emphasis(String text) {
        device.esc(1, text);
    }

    @Override
    public void rule() {
        device.esc(2, "");
    }

    @Override
    public void row(String label, String amount) {
        device.esc(3, label + ";" + amount);
    }

    @Override
    public void text(String text) {
        device.esc(4, text);
    }

    @Override
    public String flush() {
        return device.takeTape();
    }
}

record OrderLine(String name, long amount) {
}

record Order(String storeName, String id, List<OrderLine> lines) {
    long total() {
        long sum = 0;
        for (OrderLine line : lines) {
            sum += line.amount();
        }
        return sum;
    }
}

/** Abstraction — 영수증 한 장의 고수준 연산. 매체를 참조로 들고 원시 연산으로 수행한다. */
class Receipt {
    protected final Medium medium;

    Receipt(Medium medium) {
        this.medium = medium;
    }

    String render(Order order) {
        medium.emphasis(order.storeName());
        medium.rule();
        for (OrderLine line : order.lines()) {
            medium.row(line.name(), won(line.amount()));
        }
        medium.rule();
        medium.row("TOTAL", won(order.total()));
        medium.text("no " + order.id());
        return medium.flush();
    }

    static String won(long amount) {
        String digits = Long.toString(amount);
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < digits.length(); i++) {
            if (i > 0 && (digits.length() - i) % 3 == 0) {
                out.append(',');
            }
            out.append(digits.charAt(i));
        }
        return out.toString();
    }
}

/** RefinedAbstraction — 금액을 감추고, 카드 한 장을 더 찍는 연산을 보탠 영수증. */
final class GiftReceipt extends Receipt {
    private final String message;

    GiftReceipt(Medium medium, String message) {
        super(medium);
        this.message = message;
    }

    @Override
    String render(Order order) {
        medium.emphasis(order.storeName());
        medium.rule();
        for (OrderLine line : order.lines()) {
            medium.row(line.name(), "GIFT");
        }
        medium.rule();
        medium.text("no " + order.id());
        return medium.flush();
    }

    String renderCard() {
        medium.emphasis("gift card");
        medium.rule();
        medium.text(message);
        return medium.flush();
    }
}

public final class ReceiptDeskApp {
    public static void main(String[] args) {
        Order order = new Order("BBANGTO STORE", "ORD-7781",
                List.of(new OrderLine("Coffee Beans 200g", 18_000),
                        new OrderLine("Paper Filter x2", 7_000)));
        String message = "Happy birthday, Jiwon!";

        System.out.println("1) thermal x Receipt");
        System.out.println(new Receipt(new ThermalPrinter()).render(order));

        System.out.println("2) html x Receipt");
        System.out.println(new Receipt(new HtmlPage()).render(order));

        System.out.println("3) thermal x GiftReceipt");
        System.out.println(new GiftReceipt(new ThermalPrinter(), message).render(order));

        System.out.println("4) label x Receipt");
        System.out.println(new Receipt(new LabelPrinterMedium(new LegacyLabelPrinter())).render(order));

        System.out.println("5) html x GiftReceipt.renderCard");
        System.out.println(new GiftReceipt(new HtmlPage(), message).renderCard());

        List<String> abstractions = List.of("Receipt", "GiftReceipt");
        List<String> media = List.of("ThermalPrinter", "HtmlPage", "LabelPrinterMedium");
        System.out.println("6) combined " + abstractions.size() + " x " + media.size() + " = "
                + (abstractions.size() * media.size()) + " classes, separated "
                + abstractions.size() + " + " + media.size() + " = "
                + (abstractions.size() + media.size()) + " classes");
    }
}
