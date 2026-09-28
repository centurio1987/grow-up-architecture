use std::cell::Cell;

trait StockObserver {
    fn updated(&self, item: &StockItem);
}

struct Entry {
    id: i32,
    observer: Box<dyn StockObserver>,
}

struct Subject {
    entries: Vec<Entry>,
    next_id: i32,
}

impl Subject {
    fn new() -> Subject {
        Subject {
            entries: Vec::new(),
            next_id: 1,
        }
    }

    fn attach(&mut self, observer: Box<dyn StockObserver>) -> i32 {
        let id = self.next_id;
        self.next_id = self.next_id + 1;
        self.entries.push(Entry { id, observer });
        id
    }

    fn detach(&mut self, id: i32) -> bool {
        let before = self.entries.len();
        self.entries.retain(|entry| entry.id != id);
        self.entries.len() != before
    }

    fn notify_observers(&self, item: &StockItem) {
        for entry in &self.entries {
            entry.observer.updated(item);
        }
    }
}

struct StockItem {
    sku: String,
    quantity: i64,
    subject: Subject,
}

impl StockItem {
    fn new(sku: &str, quantity: i64) -> StockItem {
        StockItem {
            sku: sku.to_string(),
            quantity,
            subject: Subject::new(),
        }
    }

    fn sku(&self) -> &str {
        &self.sku
    }

    fn quantity(&self) -> i64 {
        self.quantity
    }

    fn attach(&mut self, observer: Box<dyn StockObserver>) -> i32 {
        self.subject.attach(observer)
    }

    fn detach(&mut self, id: i32) -> bool {
        self.subject.detach(id)
    }

    fn receive(&mut self, amount: i64) {
        self.quantity = self.quantity + amount;
        self.subject.notify_observers(self);
    }

    fn ship(&mut self, amount: i64) {
        self.quantity = self.quantity - amount;
        self.subject.notify_observers(self);
    }
}

struct Dashboard {
    shown: Cell<i64>,
}

impl StockObserver for Dashboard {
    fn updated(&self, item: &StockItem) {
        let now = item.quantity();
        println!("  dashboard: {} -> {}", self.shown.get(), now);
        self.shown.set(now);
    }
}

struct LowStockAlert {
    threshold: i64,
    alerting: Cell<bool>,
}

impl StockObserver for LowStockAlert {
    fn updated(&self, item: &StockItem) {
        let now = item.quantity();
        if now < self.threshold && !self.alerting.get() {
            self.alerting.set(true);
            println!("  alert: ON ({} < {})", now, self.threshold);
        } else if now >= self.threshold && self.alerting.get() {
            self.alerting.set(false);
            println!("  alert: OFF ({} >= {})", now, self.threshold);
        }
    }
}

struct AuditLog {
    lines: Cell<i32>,
}

impl StockObserver for AuditLog {
    fn updated(&self, item: &StockItem) {
        self.lines.set(self.lines.get() + 1);
        println!(
            "  audit: line {} ({} = {})",
            self.lines.get(),
            item.sku(),
            item.quantity()
        );
    }
}

struct Reorder {
    target: i64,
}

impl StockObserver for Reorder {
    fn updated(&self, item: &StockItem) {
        let now = item.quantity();
        if now < self.target {
            println!(
                "  reorder: order {} ({} -> {})",
                self.target - now,
                now,
                self.target
            );
        }
    }
}

fn main() {
    let mut item = StockItem::new("SKU-100", 12);
    item.attach(Box::new(Dashboard {
        shown: Cell::new(12),
    }));
    let alert_id = item.attach(Box::new(LowStockAlert {
        threshold: 5,
        alerting: Cell::new(false),
    }));
    item.attach(Box::new(AuditLog {
        lines: Cell::new(0),
    }));
    println!("attach: dashboard, alert(5), audit");

    println!("ship 9");
    item.ship(9);

    println!("receive 4");
    item.receive(4);

    item.attach(Box::new(Reorder { target: 10 }));
    item.detach(alert_id);
    println!("attach: reorder(10) / detach: alert");

    println!("ship 5");
    item.ship(5);
}
