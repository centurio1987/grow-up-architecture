use std::collections::BTreeMap;

/// Target — 주문 데스크가 재고에 묻는 연산 모양.
trait StockSource {
    fn available(&self, sku: &str) -> i64;

    fn total_available(&self, skus: &[&str]) -> i64;
}

/// Adaptee — 이미 있는 창고 시스템. 우리 타입을 모르고 한 줄 문자열로 답한다.
struct LegacyWarehouseApi {
    rows: BTreeMap<String, (i64, i64)>,
}

impl LegacyWarehouseApi {
    fn new() -> Self {
        let mut rows = BTreeMap::new();
        rows.insert("BOOK_042".to_string(), (37, 5));
        rows.insert("PEN_007".to_string(), (12, 4));
        Self { rows }
    }

    fn query(&self, item_code: &str) -> String {
        match self.rows.get(item_code) {
            None => "NOT_FOUND".to_string(),
            Some((on_hand, reserved)) => {
                format!("{item_code}|ON_HAND={on_hand}|RESERVED={reserved}")
            }
        }
    }
}

/// Adapter — 창고 시스템의 한 줄 문자열을 StockSource 계약으로 옮긴다.
struct LegacyWarehouseStock<'a> {
    api: &'a LegacyWarehouseApi,
}

impl<'a> LegacyWarehouseStock<'a> {
    fn new(api: &'a LegacyWarehouseApi) -> Self {
        Self { api }
    }

    fn to_item_code(sku: &str) -> String {
        sku.replace('-', "_")
    }

    fn field(line: &str, name: &str) -> i64 {
        for part in line.split('|') {
            if let Some(rest) = part.strip_prefix(&format!("{name}=")) {
                return rest.parse().unwrap_or(0);
            }
        }
        0
    }
}

impl StockSource for LegacyWarehouseStock<'_> {
    fn available(&self, sku: &str) -> i64 {
        let line = self.api.query(&Self::to_item_code(sku));
        if line == "NOT_FOUND" {
            return 0;
        }
        Self::field(&line, "ON_HAND") - Self::field(&line, "RESERVED")
    }

    fn total_available(&self, skus: &[&str]) -> i64 {
        let mut sum = 0;
        for sku in skus {
            sum += self.available(sku);
        }
        sum
    }
}

/// Adaptee 2 — 다른 창고사. 가용 수량을 이미 빼서 주고 sku 를 그대로 쓴다.
struct PartnerWarehouseApi {
    free: BTreeMap<String, i64>,
}

impl PartnerWarehouseApi {
    fn new() -> Self {
        let mut free = BTreeMap::new();
        free.insert("BOOK-042".to_string(), 12);
        Self { free }
    }

    fn lookup(&self, code: &str) -> String {
        format!("sku={code};free={}", self.free.get(code).copied().unwrap_or(0))
    }
}

/// Adapter 2 — 같은 StockSource 계약, 다른 Adaptee.
struct PartnerWarehouseStock<'a> {
    api: &'a PartnerWarehouseApi,
}

impl<'a> PartnerWarehouseStock<'a> {
    fn new(api: &'a PartnerWarehouseApi) -> Self {
        Self { api }
    }
}

impl StockSource for PartnerWarehouseStock<'_> {
    fn available(&self, sku: &str) -> i64 {
        for part in self.api.lookup(sku).split(';') {
            if let Some(rest) = part.strip_prefix("free=") {
                return rest.parse().unwrap_or(0);
            }
        }
        0
    }

    fn total_available(&self, skus: &[&str]) -> i64 {
        let mut sum = 0;
        for sku in skus {
            sum += self.available(sku);
        }
        sum
    }
}

/// Decorator — 인터페이스는 그대로 두고 호출 횟수만 덧붙인다. Adapter 위에 겹쳐 쓴다.
struct CountingStock<'a> {
    inner: &'a dyn StockSource,
    count: std::cell::Cell<i64>,
}

impl<'a> CountingStock<'a> {
    fn new(inner: &'a dyn StockSource) -> Self {
        Self { inner, count: std::cell::Cell::new(0) }
    }

    fn calls(&self) -> i64 {
        self.count.get()
    }
}

impl StockSource for CountingStock<'_> {
    fn available(&self, sku: &str) -> i64 {
        self.count.set(self.count.get() + 1);
        self.inner.available(sku)
    }

    fn total_available(&self, skus: &[&str]) -> i64 {
        self.count.set(self.count.get() + 1);
        self.inner.total_available(skus)
    }
}

/// Client — StockSource 만 알고 창고 시스템의 타입은 모른다.
struct OrderDesk<'a> {
    stock: &'a dyn StockSource,
}

impl<'a> OrderDesk<'a> {
    fn new(stock: &'a dyn StockSource) -> Self {
        Self { stock }
    }

    fn decide(&self, sku: &str, qty: i64) -> String {
        let have = self.stock.available(sku);
        if have >= qty {
            "accepted".to_string()
        } else {
            format!("rejected (short by {})", qty - have)
        }
    }
}

fn main() {
    let legacy_api = LegacyWarehouseApi::new();
    let legacy = LegacyWarehouseStock::new(&legacy_api);
    let desk = OrderDesk::new(&legacy);
    let basket = ["BOOK-042", "PEN-007"];

    println!(
        "1) legacy BOOK-042: {} -> available {}",
        legacy_api.query("BOOK_042"),
        legacy.available("BOOK-042")
    );
    println!("2) order BOOK-042 x 30 -> {}", desk.decide("BOOK-042", 30));
    println!("3) order BOOK-042 x 40 -> {}", desk.decide("BOOK-042", 40));
    println!(
        "4) legacy total [BOOK-042, PEN-007] = {} + {} = {}",
        legacy.available("BOOK-042"),
        legacy.available("PEN-007"),
        legacy.total_available(&basket)
    );

    let partner_api = PartnerWarehouseApi::new();
    let partner = PartnerWarehouseStock::new(&partner_api);
    println!("5) partner BOOK-042 -> available {}", partner.available("BOOK-042"));

    let inner = LegacyWarehouseStock::new(&legacy_api);
    let counted = CountingStock::new(&inner);
    println!(
        "6) counting over legacy: available {}, total {}, calls {}",
        counted.available("BOOK-042"),
        counted.total_available(&basket),
        counted.calls()
    );

    println!("7) unknown CHAIR-900 -> available {}", legacy.available("CHAIR-900"));

    let raw = legacy_api.query("BOOK_042");
    let on_hand = raw.split('|').nth(1).unwrap_or("").trim_start_matches("ON_HAND=");
    println!("8) adaptee read without adapter: {on_hand} (RESERVED 5 not subtracted)");
}
