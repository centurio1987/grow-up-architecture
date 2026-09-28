interface StockObserver {
    updated(item: StockItem): void;
}

interface Entry {
    id: number;
    observer: StockObserver;
}

class Subject {
    private entries: Entry[] = [];
    private nextId = 1;

    attach(observer: StockObserver): number {
        const id = this.nextId;
        this.nextId = this.nextId + 1;
        this.entries.push({ id, observer });
        return id;
    }

    detach(id: number): boolean {
        const before = this.entries.length;
        this.entries = this.entries.filter((entry) => entry.id !== id);
        return this.entries.length !== before;
    }

    notifyObservers(item: StockItem): void {
        for (const entry of [...this.entries]) {
            entry.observer.updated(item);
        }
    }
}

class StockItem {
    private readonly subject = new Subject();

    constructor(
        private readonly skuValue: string,
        private quantityValue: number,
    ) {}

    sku(): string {
        return this.skuValue;
    }

    quantity(): number {
        return this.quantityValue;
    }

    attach(observer: StockObserver): number {
        return this.subject.attach(observer);
    }

    detach(id: number): boolean {
        return this.subject.detach(id);
    }

    receive(amount: number): void {
        this.quantityValue = this.quantityValue + amount;
        this.subject.notifyObservers(this);
    }

    ship(amount: number): void {
        this.quantityValue = this.quantityValue - amount;
        this.subject.notifyObservers(this);
    }
}

class Dashboard implements StockObserver {
    constructor(private shown: number) {}

    updated(item: StockItem): void {
        const now = item.quantity();
        console.log("  dashboard: " + this.shown + " -> " + now);
        this.shown = now;
    }
}

class LowStockAlert implements StockObserver {
    private alerting = false;

    constructor(private readonly threshold: number) {}

    updated(item: StockItem): void {
        const now = item.quantity();
        if (now < this.threshold && !this.alerting) {
            this.alerting = true;
            console.log("  alert: ON (" + now + " < " + this.threshold + ")");
        } else if (now >= this.threshold && this.alerting) {
            this.alerting = false;
            console.log("  alert: OFF (" + now + " >= " + this.threshold + ")");
        }
    }
}

class AuditLog implements StockObserver {
    private lines = 0;

    updated(item: StockItem): void {
        this.lines = this.lines + 1;
        console.log("  audit: line " + this.lines + " (" + item.sku() + " = " + item.quantity() + ")");
    }
}

class Reorder implements StockObserver {
    constructor(private readonly target: number) {}

    updated(item: StockItem): void {
        const now = item.quantity();
        if (now < this.target) {
            console.log("  reorder: order " + (this.target - now) + " (" + now + " -> " + this.target + ")");
        }
    }
}

const item = new StockItem("SKU-100", 12);
item.attach(new Dashboard(12));
const alertId = item.attach(new LowStockAlert(5));
item.attach(new AuditLog());
console.log("attach: dashboard, alert(5), audit");

console.log("ship 9");
item.ship(9);

console.log("receive 4");
item.receive(4);

item.attach(new Reorder(10));
item.detach(alertId);
console.log("attach: reorder(10) / detach: alert");

console.log("ship 5");
item.ship(5);
