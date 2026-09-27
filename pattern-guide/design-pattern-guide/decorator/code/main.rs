use std::cell::Cell;

/// Component — 알림을 내보내는 연산 모양. 돌려주는 값은 발송 영수증이다.
trait Notifier {
    fn send(&self, body: &str) -> String;
}

/// ConcreteComponent — 실제로 내보내는 쪽. 외부 발송망 대신 메모리 안 보관함을 쓴다.
struct SmsNotifier {
    outbox: Cell<usize>,
}

impl SmsNotifier {
    fn new() -> Self {
        Self { outbox: Cell::new(0) }
    }

    fn delivered(&self) -> usize {
        self.outbox.get()
    }
}

impl Notifier for SmsNotifier {
    fn send(&self, body: &str) -> String {
        self.outbox.set(self.outbox.get() + 1);
        format!("sent[{body}]")
    }
}

const SIGNATURE: &str = " -- Bbangto Store CS 010-1234-5678";

/// ConcreteDecorator — 전달하기 전에 서명을 덧붙인다.
/// Rust 에는 추상 클래스가 없어 전달 기본 구현을 물려줄 자리가 없다. 각 데코레이터가 직접 전달한다.
struct SignatureNotifier<'a> {
    inner: &'a dyn Notifier,
}

impl<'a> SignatureNotifier<'a> {
    fn new(inner: &'a dyn Notifier) -> Self {
        Self { inner }
    }
}

impl Notifier for SignatureNotifier<'_> {
    fn send(&self, body: &str) -> String {
        self.inner.send(&format!("{body}{SIGNATURE}"))
    }
}

/// ConcreteDecorator — 전달하기 전에 네 자리 이상 이어진 숫자를 가린다.
struct MaskingNotifier<'a> {
    inner: &'a dyn Notifier,
}

impl<'a> MaskingNotifier<'a> {
    fn new(inner: &'a dyn Notifier) -> Self {
        Self { inner }
    }

    fn mask(text: &str) -> String {
        let chars: Vec<char> = text.chars().collect();
        let mut out = String::new();
        let mut i = 0;
        while i < chars.len() {
            if !chars[i].is_ascii_digit() {
                out.push(chars[i]);
                i += 1;
                continue;
            }
            let mut j = i;
            while j < chars.len() && chars[j].is_ascii_digit() {
                j += 1;
            }
            if j - i >= 4 {
                out.push_str(&"*".repeat(j - i));
            } else {
                out.extend(&chars[i..j]);
            }
            i = j;
        }
        out
    }
}

impl Notifier for MaskingNotifier<'_> {
    fn send(&self, body: &str) -> String {
        self.inner.send(&MaskingNotifier::mask(body))
    }
}

/// ConcreteDecorator — 전달한 뒤 영수증에 감사 번호를 붙이고, 받은 횟수를 센다.
struct AuditNotifier<'a> {
    inner: &'a dyn Notifier,
    calls: Cell<u32>,
}

impl<'a> AuditNotifier<'a> {
    fn new(inner: &'a dyn Notifier) -> Self {
        Self { inner, calls: Cell::new(0) }
    }

    /// Component 에 없는 추가 연산 — 이것을 부르는 쪽은 AuditNotifier 라는 구체 타입을 알아야 한다.
    fn count(&self) -> u32 {
        self.calls.get()
    }
}

impl Notifier for AuditNotifier<'_> {
    fn send(&self, body: &str) -> String {
        self.calls.set(self.calls.get() + 1);
        format!("{}+audit#{}", self.inner.send(body), self.calls.get())
    }
}

/// Client — Notifier 만 알고, 몇 겹이 감겨 있는지 모른다.
struct ShipmentDesk<'a> {
    notifier: &'a dyn Notifier,
}

impl<'a> ShipmentDesk<'a> {
    fn new(notifier: &'a dyn Notifier) -> Self {
        Self { notifier }
    }

    fn ship(&self, sku: &str) -> String {
        self.notifier.send(&format!("order {sku} shipped today"))
    }
}

fn main() {
    let sms = SmsNotifier::new();

    println!("1) plain desk: {}", ShipmentDesk::new(&sms).ship("BOOK-042"));

    let signed = SignatureNotifier::new(&sms);
    let audited = AuditNotifier::new(&signed);
    let audited_desk = ShipmentDesk::new(&audited);
    println!("2) audited desk, 1st: {}", audited_desk.ship("BOOK-042"));
    println!("3) audited desk, 2nd: {}", audited_desk.ship("PEN-007"));
    println!("4) audit count {}, sms deliveries {}", audited.count(), sms.delivered());

    let masked = MaskingNotifier::new(&sms);
    let sign_outside = SignatureNotifier::new(&masked);
    println!(
        "5) signature outside masking: {}",
        ShipmentDesk::new(&sign_outside).ship("BOOK-042")
    );

    let mask_outside = MaskingNotifier::new(&signed);
    println!(
        "6) masking outside signature: {}",
        ShipmentDesk::new(&mask_outside).ship("BOOK-042")
    );

    let twice = SignatureNotifier::new(&signed);
    println!("7) signature twice: {}", ShipmentDesk::new(&twice).ship("BOOK-042"));

    let decorated = AuditNotifier::new(&sms);
    let same = std::ptr::eq(
        (&decorated as *const AuditNotifier).cast::<u8>(),
        (&sms as *const SmsNotifier).cast::<u8>(),
    );
    println!("8) decorated is the same object as the sms notifier? {same}");
}
