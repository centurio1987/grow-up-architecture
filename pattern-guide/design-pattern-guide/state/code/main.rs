trait OrderState {
    fn name(&self) -> &'static str;
    fn pay(&self, order: &mut Order, amount: u64) -> Box<dyn OrderState>;
    fn ship(&self, order: &mut Order) -> Box<dyn OrderState>;
    fn cancel(&self, order: &mut Order) -> Box<dyn OrderState>;
}

struct AwaitingPayment;

impl OrderState for AwaitingPayment {
    fn name(&self) -> &'static str {
        "awaiting-payment"
    }

    fn pay(&self, order: &mut Order, amount: u64) -> Box<dyn OrderState> {
        order.add_payment(amount);
        let note = format!("pay {} (paid {}/{})", amount, order.paid(), order.total());
        order.note(&note);
        if order.paid() >= order.total() {
            Box::new(Paid)
        } else {
            Box::new(PartiallyPaid)
        }
    }

    fn ship(&self, order: &mut Order) -> Box<dyn OrderState> {
        order.note("ship rejected(not paid yet)");
        Box::new(AwaitingPayment)
    }

    fn cancel(&self, order: &mut Order) -> Box<dyn OrderState> {
        order.note("cancel before payment");
        Box::new(Cancelled)
    }
}

struct PartiallyPaid;

impl OrderState for PartiallyPaid {
    fn name(&self) -> &'static str {
        "partially-paid"
    }

    fn pay(&self, order: &mut Order, amount: u64) -> Box<dyn OrderState> {
        order.add_payment(amount);
        let note = format!("pay {} (paid {}/{})", amount, order.paid(), order.total());
        order.note(&note);
        if order.paid() >= order.total() {
            Box::new(Paid)
        } else {
            Box::new(PartiallyPaid)
        }
    }

    fn ship(&self, order: &mut Order) -> Box<dyn OrderState> {
        order.note("ship rejected(not fully paid)");
        Box::new(PartiallyPaid)
    }

    fn cancel(&self, order: &mut Order) -> Box<dyn OrderState> {
        let refunded = order.paid();
        order.refund_all();
        order.note(&format!("cancel refund {refunded}"));
        Box::new(Cancelled)
    }
}

struct Paid;

impl OrderState for Paid {
    fn name(&self) -> &'static str {
        "paid"
    }

    fn pay(&self, order: &mut Order, _amount: u64) -> Box<dyn OrderState> {
        order.note("pay rejected(already paid)");
        Box::new(Paid)
    }

    fn ship(&self, order: &mut Order) -> Box<dyn OrderState> {
        order.note("ship invoice issued");
        Box::new(Shipped)
    }

    fn cancel(&self, order: &mut Order) -> Box<dyn OrderState> {
        let refunded = order.paid();
        order.refund_all();
        order.note(&format!("cancel refund {refunded}"));
        Box::new(Cancelled)
    }
}

struct Shipped;

impl OrderState for Shipped {
    fn name(&self) -> &'static str {
        "shipped"
    }

    fn pay(&self, order: &mut Order, _amount: u64) -> Box<dyn OrderState> {
        order.note("pay rejected(already paid)");
        Box::new(Shipped)
    }

    fn ship(&self, order: &mut Order) -> Box<dyn OrderState> {
        order.note("ship rejected(already shipped)");
        Box::new(Shipped)
    }

    fn cancel(&self, order: &mut Order) -> Box<dyn OrderState> {
        order.note("cancel rejected(already shipped)");
        Box::new(Shipped)
    }
}

struct Cancelled;

impl OrderState for Cancelled {
    fn name(&self) -> &'static str {
        "cancelled"
    }

    fn pay(&self, order: &mut Order, _amount: u64) -> Box<dyn OrderState> {
        order.note("pay rejected(order cancelled)");
        Box::new(Cancelled)
    }

    fn ship(&self, order: &mut Order) -> Box<dyn OrderState> {
        order.note("ship rejected(order cancelled)");
        Box::new(Cancelled)
    }

    fn cancel(&self, order: &mut Order) -> Box<dyn OrderState> {
        order.note("cancel rejected(order cancelled)");
        Box::new(Cancelled)
    }
}

struct Order {
    id: &'static str,
    total: u64,
    paid: u64,
    last_note: String,
    state: Option<Box<dyn OrderState>>,
}

impl Order {
    fn new(id: &'static str, total: u64, initial: Box<dyn OrderState>) -> Order {
        Order { id, total, paid: 0, last_note: String::new(), state: Some(initial) }
    }

    fn pay(&mut self, amount: u64) {
        let current = self.state.take().expect("order always has a state");
        let next = current.pay(self, amount);
        self.print(current.name(), next);
    }

    fn ship(&mut self) {
        let current = self.state.take().expect("order always has a state");
        let next = current.ship(self);
        self.print(current.name(), next);
    }

    fn cancel(&mut self) {
        let current = self.state.take().expect("order always has a state");
        let next = current.cancel(self);
        self.print(current.name(), next);
    }

    fn total(&self) -> u64 {
        self.total
    }

    fn paid(&self) -> u64 {
        self.paid
    }

    fn add_payment(&mut self, amount: u64) {
        self.paid += amount;
    }

    fn refund_all(&mut self) {
        self.paid = 0;
    }

    fn note(&mut self, message: &str) {
        self.last_note = message.to_string();
    }

    fn print(&mut self, before: &'static str, next: Box<dyn OrderState>) {
        println!("{} {} {} -> {}", self.id, before, self.last_note, next.name());
        self.state = Some(next);
    }
}

fn main() {
    let mut a = Order::new("A", 48_000, Box::new(AwaitingPayment));
    a.ship();
    a.pay(48_000);
    a.ship();
    a.cancel();

    let mut b = Order::new("B", 30_000, Box::new(AwaitingPayment));
    b.pay(12_000);
    b.pay(18_000);
    b.cancel();
    b.pay(5_000);
}
