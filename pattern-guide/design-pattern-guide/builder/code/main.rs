/// 주문 한 줄. 예시의 입력 데이터이고 패턴의 역할은 아니다.
struct OrderLine {
    name: &'static str,
    quantity: u32,
    unit_price: u32,
}

/// 주문 한 건. 예시의 입력 데이터이고 패턴의 역할은 아니다.
struct Order {
    id: &'static str,
    lines: Vec<OrderLine>,
    shipping_fee: u32,
}

/// Builder — 부분을 받는 연산만 선언한다. 제품을 꺼내는 연산은 여기 없다.
trait OrderBuilder {
    fn begin(&mut self, order_id: &str);
    fn add_line(&mut self, name: &str, quantity: u32, unit_price: u32);
    fn add_shipping(&mut self, fee: u32);
    fn end(&mut self);
}

/// Product 1 — 영수증 여러 줄.
struct Receipt {
    lines: Vec<String>,
}

impl Receipt {
    fn new(lines: &[String]) -> Receipt {
        Receipt { lines: lines.to_vec() }
    }

    fn text(&self) -> String {
        self.lines.join("\n")
    }
}

/// Product 2 — 집계 한 줄. Receipt 와 공통 부모가 없다.
struct OrderTotals {
    order_id: String,
    line_count: u32,
    item_count: u32,
    goods_amount: u32,
    shipping_fee: u32,
}

impl OrderTotals {
    fn summary(&self) -> String {
        format!(
            "주문 {} · 품목 {}종 · 수량 {}개 · 상품 {}원 · 배송 {}원 · 합계 {}원",
            self.order_id,
            self.line_count,
            self.item_count,
            self.goods_amount,
            self.shipping_fee,
            self.goods_amount + self.shipping_fee
        )
    }
}

/// ConcreteBuilder 1 — 영수증 표현을 정의하고 추적한다.
struct ReceiptBuilder {
    lines: Vec<String>,
    amount: u32,
    product: Option<Receipt>,
}

impl ReceiptBuilder {
    fn new() -> ReceiptBuilder {
        ReceiptBuilder { lines: Vec::new(), amount: 0, product: None }
    }

    fn receipt(&self) -> Option<&Receipt> {
        self.product.as_ref()
    }
}

impl OrderBuilder for ReceiptBuilder {
    fn begin(&mut self, order_id: &str) {
        self.lines.clear();
        self.amount = 0;
        self.product = None;
        self.lines.push(format!("주문 {}", order_id));
    }

    fn add_line(&mut self, name: &str, quantity: u32, unit_price: u32) {
        let sum = quantity * unit_price;
        self.amount += sum;
        self.lines.push(format!("{} x{} @{} = {}", name, quantity, unit_price, sum));
    }

    fn add_shipping(&mut self, fee: u32) {
        self.amount += fee;
        self.lines.push(format!("배송비 {}", fee));
    }

    fn end(&mut self) {
        self.lines.push(format!("합계 {}", self.amount));
        self.product = Some(Receipt::new(&self.lines));
    }
}

/// ConcreteBuilder 2 — 집계 표현을 정의하고 추적한다.
struct TotalsBuilder {
    order_id: String,
    line_count: u32,
    item_count: u32,
    goods_amount: u32,
    shipping_fee: u32,
    product: Option<OrderTotals>,
}

impl TotalsBuilder {
    fn new() -> TotalsBuilder {
        TotalsBuilder {
            order_id: String::new(),
            line_count: 0,
            item_count: 0,
            goods_amount: 0,
            shipping_fee: 0,
            product: None,
        }
    }

    fn totals(&self) -> Option<&OrderTotals> {
        self.product.as_ref()
    }
}

impl OrderBuilder for TotalsBuilder {
    fn begin(&mut self, order_id: &str) {
        self.order_id = order_id.to_string();
        self.line_count = 0;
        self.item_count = 0;
        self.goods_amount = 0;
        self.shipping_fee = 0;
        self.product = None;
    }

    fn add_line(&mut self, _name: &str, quantity: u32, unit_price: u32) {
        self.line_count += 1;
        self.item_count += quantity;
        self.goods_amount += quantity * unit_price;
    }

    fn add_shipping(&mut self, fee: u32) {
        self.shipping_fee += fee;
    }

    fn end(&mut self) {
        self.product = Some(OrderTotals {
            order_id: self.order_id.clone(),
            line_count: self.line_count,
            item_count: self.item_count,
            goods_amount: self.goods_amount,
            shipping_fee: self.shipping_fee,
        });
    }
}

/// Director — 추상 빌더 타입만 참조한다.
struct OrderReader<'a> {
    builder: &'a mut dyn OrderBuilder,
}

impl<'a> OrderReader<'a> {
    fn new(builder: &'a mut dyn OrderBuilder) -> OrderReader<'a> {
        OrderReader { builder }
    }

    fn read(&mut self, order: &Order) {
        self.builder.begin(order.id);
        for line in &order.lines {
            self.builder.add_line(line.name, line.quantity, line.unit_price);
        }
        if order.shipping_fee > 0 {
            self.builder.add_shipping(order.shipping_fee);
        }
        self.builder.end();
    }
}

fn main() {
    let order = Order {
        id: "ORD-4417",
        lines: vec![
            OrderLine { name: "공책", quantity: 3, unit_price: 3000 },
            OrderLine { name: "연필", quantity: 12, unit_price: 500 },
            OrderLine { name: "지우개", quantity: 2, unit_price: 800 },
        ],
        shipping_fee: 3000,
    };

    let mut receipt_builder = ReceiptBuilder::new();
    OrderReader::new(&mut receipt_builder).read(&order);
    println!("--- receipt ---");
    println!("{}", receipt_builder.receipt().expect("end() 가 끝났으므로 제품이 있다").text());

    let mut totals_builder = TotalsBuilder::new();
    OrderReader::new(&mut totals_builder).read(&order);
    println!("--- totals ---");
    println!("{}", totals_builder.totals().expect("end() 가 끝났으므로 제품이 있다").summary());

    let mut halfway = ReceiptBuilder::new();
    halfway.begin(order.id);
    halfway.add_line("공책", 3, 3000);
    println!("--- before end ---");
    match halfway.receipt() {
        Some(_) => println!("꺼냈음"),
        None => println!("거부됨"),
    }
}
