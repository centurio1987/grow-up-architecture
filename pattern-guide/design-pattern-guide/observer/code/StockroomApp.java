import java.util.ArrayList;
import java.util.List;

interface StockObserver {
    void updated(StockItem item);
}

final class Subject {
    private record Entry(int id, StockObserver observer) {
    }

    private final List<Entry> entries = new ArrayList<>();
    private int nextId = 1;

    int attach(StockObserver observer) {
        int id = nextId;
        nextId = nextId + 1;
        entries.add(new Entry(id, observer));
        return id;
    }

    boolean detach(int id) {
        return entries.removeIf(entry -> entry.id() == id);
    }

    void notifyObservers(StockItem item) {
        for (Entry entry : List.copyOf(entries)) {
            entry.observer().updated(item);
        }
    }
}

final class StockItem {
    private final String sku;
    private final Subject subject = new Subject();
    private long quantity;

    StockItem(String sku, long quantity) {
        this.sku = sku;
        this.quantity = quantity;
    }

    String sku() {
        return sku;
    }

    long quantity() {
        return quantity;
    }

    int attach(StockObserver observer) {
        return subject.attach(observer);
    }

    boolean detach(int id) {
        return subject.detach(id);
    }

    void receive(long amount) {
        quantity = quantity + amount;
        subject.notifyObservers(this);
    }

    void ship(long amount) {
        quantity = quantity - amount;
        subject.notifyObservers(this);
    }
}

final class Dashboard implements StockObserver {
    private long shown;

    Dashboard(long shown) {
        this.shown = shown;
    }

    @Override
    public void updated(StockItem item) {
        long now = item.quantity();
        System.out.println("  dashboard: " + shown + " -> " + now);
        shown = now;
    }
}

final class LowStockAlert implements StockObserver {
    private final long threshold;
    private boolean alerting;

    LowStockAlert(long threshold) {
        this.threshold = threshold;
        this.alerting = false;
    }

    @Override
    public void updated(StockItem item) {
        long now = item.quantity();
        if (now < threshold && !alerting) {
            alerting = true;
            System.out.println("  alert: ON (" + now + " < " + threshold + ")");
        } else if (now >= threshold && alerting) {
            alerting = false;
            System.out.println("  alert: OFF (" + now + " >= " + threshold + ")");
        }
    }
}

final class AuditLog implements StockObserver {
    private int lines;

    @Override
    public void updated(StockItem item) {
        lines = lines + 1;
        System.out.println("  audit: line " + lines + " (" + item.sku() + " = " + item.quantity() + ")");
    }
}

final class Reorder implements StockObserver {
    private final long target;

    Reorder(long target) {
        this.target = target;
    }

    @Override
    public void updated(StockItem item) {
        long now = item.quantity();
        if (now < target) {
            System.out.println("  reorder: order " + (target - now) + " (" + now + " -> " + target + ")");
        }
    }
}

public final class StockroomApp {
    public static void main(String[] args) {
        StockItem item = new StockItem("SKU-100", 12);
        item.attach(new Dashboard(12));
        int alertId = item.attach(new LowStockAlert(5));
        item.attach(new AuditLog());
        System.out.println("attach: dashboard, alert(5), audit");

        System.out.println("ship 9");
        item.ship(9);

        System.out.println("receive 4");
        item.receive(4);

        item.attach(new Reorder(10));
        item.detach(alertId);
        System.out.println("attach: reorder(10) / detach: alert");

        System.out.println("ship 5");
        item.ship(5);
    }
}
