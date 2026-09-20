trait ShippingPolicy {
    fn fee(&self, subtotal: u64, weight_grams: u64) -> u64;
}

struct FlatRate {
    amount: u64,
}

impl ShippingPolicy for FlatRate {
    fn fee(&self, _subtotal: u64, _weight_grams: u64) -> u64 {
        self.amount
    }
}

struct FreeOverThreshold {
    threshold: u64,
    amount: u64,
}

impl ShippingPolicy for FreeOverThreshold {
    fn fee(&self, subtotal: u64, _weight_grams: u64) -> u64 {
        if subtotal >= self.threshold {
            0
        } else {
            self.amount
        }
    }
}

struct ByWeight {
    per_kg: u64,
}

impl ShippingPolicy for ByWeight {
    fn fee(&self, _subtotal: u64, weight_grams: u64) -> u64 {
        weight_grams.div_ceil(1_000) * self.per_kg
    }
}

struct Order {
    id: &'static str,
    subtotal: u64,
    weight_grams: u64,
}

struct Checkout {
    policy: Box<dyn ShippingPolicy>,
}

impl Checkout {
    fn new(policy: Box<dyn ShippingPolicy>) -> Self {
        Checkout { policy }
    }

    fn change_policy(&mut self, policy: Box<dyn ShippingPolicy>) {
        self.policy = policy;
    }

    fn total(&self, order: &Order) -> u64 {
        order.subtotal + self.policy.fee(order.subtotal, order.weight_grams)
    }
}

fn choose_policy(plan: &str) -> Box<dyn ShippingPolicy> {
    match plan {
        "flat" => Box::new(FlatRate { amount: 3_000 }),
        "free-over" => Box::new(FreeOverThreshold {
            threshold: 50_000,
            amount: 3_000,
        }),
        "weight" => Box::new(ByWeight { per_kg: 1_500 }),
        other => panic!("unknown plan: {other}"),
    }
}

fn print_totals(plan: &str, checkout: &Checkout, orders: &[Order]) {
    let line: Vec<String> = orders
        .iter()
        .map(|order| format!("{}={}", order.id, checkout.total(order)))
        .collect();
    println!("{plan}: {}", line.join(" "));
}

fn main() {
    let orders = [
        Order { id: "A", subtotal: 32_000, weight_grams: 2_300 },
        Order { id: "B", subtotal: 58_000, weight_grams: 5_100 },
    ];

    let mut checkout = Checkout::new(choose_policy("flat"));
    print_totals("flat", &checkout, &orders);

    checkout.change_policy(choose_policy("free-over"));
    print_totals("free-over", &checkout, &orders);

    checkout.change_policy(choose_policy("weight"));
    print_totals("weight", &checkout, &orders);
}
