/// Implementor — 영수증을 실제 매체에 얹는 원시 연산 넷과 비우기.
trait Medium {
    fn emphasis(&mut self, text: &str);
    fn rule(&mut self);
    fn row(&mut self, label: &str, amount: &str);
    fn text(&mut self, text: &str);
    fn flush(&mut self) -> String;
}

const WIDTH: usize = 32;

/// ConcreteImplementor — 32칸 감열 프린터.
#[derive(Default)]
struct ThermalPrinter {
    buffer: Vec<String>,
}

impl Medium for ThermalPrinter {
    fn emphasis(&mut self, text: &str) {
        let upper = text.to_uppercase();
        let pad = if WIDTH > upper.len() {
            (WIDTH - upper.len()) / 2
        } else {
            0
        };
        self.buffer.push(format!("{}{}", " ".repeat(pad), upper));
    }

    fn rule(&mut self) {
        self.buffer.push("-".repeat(WIDTH));
    }

    fn row(&mut self, label: &str, amount: &str) {
        self.buffer.push(format!("{:<22}{:>10}", label, amount));
    }

    fn text(&mut self, text: &str) {
        self.buffer.push(text.to_string());
    }

    fn flush(&mut self) -> String {
        let out = self.buffer.join("\n");
        self.buffer.clear();
        out
    }
}

/// ConcreteImplementor — HTML 페이지.
#[derive(Default)]
struct HtmlPage {
    buffer: Vec<String>,
}

impl Medium for HtmlPage {
    fn emphasis(&mut self, text: &str) {
        self.buffer.push(format!("<h1>{}</h1>", text));
    }

    fn rule(&mut self) {
        self.buffer.push("<hr>".to_string());
    }

    fn row(&mut self, label: &str, amount: &str) {
        self.buffer.push(format!("<p>{}<b>{}</b></p>", label, amount));
    }

    fn text(&mut self, text: &str) {
        self.buffer.push(format!("<p>{}</p>", text));
    }

    fn flush(&mut self) -> String {
        let out = self.buffer.join("\n");
        self.buffer.clear();
        out
    }
}

/// 외부 라벨 장비의 SDK. 우리가 고칠 수 없고 Medium 이라는 타입을 모른다.
#[derive(Default)]
struct LegacyLabelPrinter {
    tape: Vec<String>,
}

impl LegacyLabelPrinter {
    fn esc(&mut self, code: u8, payload: &str) {
        self.tape.push(format!("<{}>{}", code, payload));
    }

    fn take_tape(&mut self) -> String {
        let out = self.tape.join("\n");
        self.tape.clear();
        out
    }
}

/// ConcreteImplementor 이면서 Adapter — 라벨 장비의 연산 하나에 Medium 의 네 연산을 얹는다.
#[derive(Default)]
struct LabelPrinterMedium {
    device: LegacyLabelPrinter,
}

impl Medium for LabelPrinterMedium {
    fn emphasis(&mut self, text: &str) {
        self.device.esc(1, text);
    }

    fn rule(&mut self) {
        self.device.esc(2, "");
    }

    fn row(&mut self, label: &str, amount: &str) {
        self.device.esc(3, &format!("{};{}", label, amount));
    }

    fn text(&mut self, text: &str) {
        self.device.esc(4, text);
    }

    fn flush(&mut self) -> String {
        self.device.take_tape()
    }
}

struct OrderLine {
    name: String,
    amount: u64,
}

struct Order {
    store_name: String,
    id: String,
    lines: Vec<OrderLine>,
}

impl Order {
    fn total(&self) -> u64 {
        self.lines.iter().map(|line| line.amount).sum()
    }
}

fn won(amount: u64) -> String {
    let digits = amount.to_string();
    let len = digits.len();
    let mut out = String::new();
    for (i, ch) in digits.chars().enumerate() {
        if i > 0 && (len - i) % 3 == 0 {
            out.push(',');
        }
        out.push(ch);
    }
    out
}

/// Abstraction — 영수증 한 장의 고수준 연산. 매체를 참조로 들고 원시 연산으로 수행한다.
struct Receipt {
    medium: Box<dyn Medium>,
}

impl Receipt {
    fn new(medium: Box<dyn Medium>) -> Self {
        Receipt { medium }
    }

    fn render(&mut self, order: &Order) -> String {
        self.medium.emphasis(&order.store_name);
        self.medium.rule();
        for line in &order.lines {
            self.medium.row(&line.name, &won(line.amount));
        }
        self.medium.rule();
        self.medium.row("TOTAL", &won(order.total()));
        self.medium.text(&format!("no {}", order.id));
        self.medium.flush()
    }
}

/// RefinedAbstraction — 금액을 감추고, 카드 한 장을 더 찍는 연산을 보탠 영수증.
struct GiftReceipt {
    base: Receipt,
    message: String,
}

impl GiftReceipt {
    fn new(medium: Box<dyn Medium>, message: &str) -> Self {
        GiftReceipt {
            base: Receipt::new(medium),
            message: message.to_string(),
        }
    }

    fn render(&mut self, order: &Order) -> String {
        let medium = &mut self.base.medium;
        medium.emphasis(&order.store_name);
        medium.rule();
        for line in &order.lines {
            medium.row(&line.name, "GIFT");
        }
        medium.rule();
        medium.text(&format!("no {}", order.id));
        medium.flush()
    }

    fn render_card(&mut self) -> String {
        let medium = &mut self.base.medium;
        medium.emphasis("gift card");
        medium.rule();
        medium.text(&self.message);
        medium.flush()
    }
}

fn main() {
    let order = Order {
        store_name: "BBANGTO STORE".to_string(),
        id: "ORD-7781".to_string(),
        lines: vec![
            OrderLine {
                name: "Coffee Beans 200g".to_string(),
                amount: 18_000,
            },
            OrderLine {
                name: "Paper Filter x2".to_string(),
                amount: 7_000,
            },
        ],
    };
    let message = "Happy birthday, Jiwon!";

    println!("1) thermal x Receipt");
    println!("{}", Receipt::new(Box::new(ThermalPrinter::default())).render(&order));

    println!("2) html x Receipt");
    println!("{}", Receipt::new(Box::new(HtmlPage::default())).render(&order));

    println!("3) thermal x GiftReceipt");
    println!("{}", GiftReceipt::new(Box::new(ThermalPrinter::default()), message).render(&order));

    println!("4) label x Receipt");
    println!("{}", Receipt::new(Box::new(LabelPrinterMedium::default())).render(&order));

    println!("5) html x GiftReceipt.renderCard");
    println!("{}", GiftReceipt::new(Box::new(HtmlPage::default()), message).render_card());

    let abstractions = ["Receipt", "GiftReceipt"];
    let media = ["ThermalPrinter", "HtmlPage", "LabelPrinterMedium"];
    let (a, m) = (abstractions.len(), media.len());
    println!("6) combined {a} x {m} = {} classes, separated {a} + {m} = {} classes", a * m, a + m);
}
