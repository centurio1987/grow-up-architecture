mod inventory {
    use std::cmp::Ordering;
    use std::fmt;

    #[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
    pub enum Unit { G, Kg, L }

    impl Unit {
        pub fn symbol(self) -> &'static str {
            match self { Unit::G => "g", Unit::Kg => "kg", Unit::L => "L" }
        }
    }

    // from 1 = to factor. 방향이 있다: from → to 는 곱하고, to → from 은 나눈다.
    #[derive(Clone, Copy, Debug, PartialEq, Eq)]
    pub struct ConversionRatio {
        from: Unit,
        to: Unit,
        factor: i64,
    }

    impl ConversionRatio {
        const ALL: [ConversionRatio; 1] = [ConversionRatio { from: Unit::Kg, to: Unit::G, factor: 1000 }];

        pub fn between(a: Unit, b: Unit) -> Option<ConversionRatio> {
            Self::ALL.iter().copied().find(|r| (r.from == a && r.to == b) || (r.from == b && r.to == a))
        }
    }

    const ONE: i64 = 1000; // 소수점 아래 세 자리

    // scaled = 수치 × 1000. f64 는 Eq 를 구현하지 않으므로 i64 정수로 든다.
    #[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
    pub struct Quantity {
        scaled: i64,
        unit: Unit,
    }

    fn overflow() -> String {
        "수치가 표현 범위를 넘었습니다".to_string()
    }

    fn no_ratio(a: Unit, b: Unit) -> String {
        format!("환산 비율이 없습니다: {} ↔ {}", a.symbol(), b.symbol())
    }

    impl Quantity {
        pub fn of(text: &str, unit: Unit) -> Result<Quantity, String> {
            let (whole, fraction) = text.split_once('.').unwrap_or((text, ""));
            let fraction = fraction.trim_end_matches('0');
            let whole_value: i64 = whole.parse().map_err(|_| format!("수치 형식이 아닙니다: {text}"))?;
            if !fraction.bytes().all(|b| b.is_ascii_digit()) {
                return Err(format!("수치 형식이 아닙니다: {text}"));
            }
            if fraction.len() > 3 {
                return Err(format!("소수점 아래 세 자리까지만 기록합니다: {text} {}", unit.symbol()));
            }
            let fraction_value: i64 = format!("{fraction:0<3}").parse().map_err(|_| overflow())?;
            let magnitude = whole_value.checked_abs().and_then(|w| w.checked_mul(ONE)?.checked_add(fraction_value));
            let scaled = magnitude.ok_or_else(overflow)?;
            Ok(Quantity { scaled: if whole.starts_with('-') { -scaled } else { scaled }, unit })
        }

        pub fn plus(self, other: Quantity) -> Result<Quantity, String> {
            let common = self.common_unit(other)?;
            let sum = self.convert_to(common)?.scaled.checked_add(other.convert_to(common)?.scaled);
            Ok(Quantity { scaled: sum.ok_or_else(overflow)?, unit: common })
        }

        pub fn minus(self, other: Quantity) -> Result<Quantity, String> {
            let common = self.common_unit(other)?;
            let diff = self.convert_to(common)?.scaled.checked_sub(other.convert_to(common)?.scaled);
            Ok(Quantity { scaled: diff.ok_or_else(overflow)?, unit: common })
        }

        pub fn times(self, n: i64) -> Result<Quantity, String> {
            Ok(Quantity { scaled: self.scaled.checked_mul(n).ok_or_else(overflow)?, unit: self.unit })
        }

        // 크기 비교: 단위를 맞춘 뒤 비교한다. == 는 수치와 단위가 둘 다 같아야 참이다.
        pub fn compare_to(self, other: Quantity) -> Result<Ordering, String> {
            let common = self.common_unit(other)?;
            Ok(self.convert_to(common)?.scaled.cmp(&other.convert_to(common)?.scaled))
        }

        pub fn is_positive(self) -> bool { self.scaled > 0 }

        pub fn is_negative(self) -> bool { self.scaled < 0 }

        pub fn convert_to(self, target: Unit) -> Result<Quantity, String> {
            if self.unit == target {
                return Ok(self);
            }
            let ratio = ConversionRatio::between(self.unit, target).ok_or_else(|| no_ratio(self.unit, target))?;
            if ratio.from == self.unit {
                let scaled = self.scaled.checked_mul(ratio.factor).ok_or_else(overflow)?; // 정방향: 곱셈
                return Ok(Quantity { scaled, unit: target });
            }
            if self.scaled % ratio.factor != 0 {
                return Err(format!("{} 로 옮기면 소수점 아래 세 자리를 넘습니다: {self}", target.symbol()));
            }
            Ok(Quantity { scaled: self.scaled / ratio.factor, unit: target }) // 역방향: 나눗셈
        }

        // 이 예제의 선택: 단위가 다르면 비율의 to 쪽(kg→g 이므로 g)으로 맞춰 곱셈만 일어나게 한다.
        fn common_unit(self, other: Quantity) -> Result<Unit, String> {
            if self.unit == other.unit {
                return Ok(self.unit);
            }
            ConversionRatio::between(self.unit, other.unit).map(|r| r.to).ok_or_else(|| no_ratio(self.unit, other.unit))
        }
    }

    impl fmt::Display for Quantity {
        fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
            let abs = self.scaled.unsigned_abs();
            let fraction = format!("{:03}", abs % ONE as u64);
            let fraction = fraction.trim_end_matches('0');
            let sign = if self.scaled < 0 { "-" } else { "" };
            let dot = if fraction.is_empty() { "" } else { "." };
            write!(f, "{sign}{}{dot}{fraction} {}", abs / ONE as u64, self.unit.symbol())
        }
    }

    #[derive(Clone, Debug, PartialEq, Eq, Hash)]
    pub struct StockId(pub String);

    #[derive(Clone, Debug, PartialEq, Eq, Hash)]
    pub struct IngredientId(pub String);

    pub struct IngredientStock {
        id: StockId,
        ingredient_id: IngredientId, // 재료 카탈로그 aggregate 는 id 로만 가리킨다
        on_hand: Quantity,
    }

    fn require_positive(q: Quantity) -> Result<(), String> {
        if q.is_positive() { Ok(()) } else { Err(format!("입고·사용량은 0보다 커야 합니다: {q}")) }
    }

    impl IngredientStock {
        pub fn new(id: StockId, ingredient_id: IngredientId, unit: Unit) -> Result<IngredientStock, String> {
            Ok(IngredientStock { id, ingredient_id, on_hand: Quantity::of("0", unit)? })
        }

        pub fn receive(&mut self, received: Quantity) -> Result<(), String> {
            require_positive(received)?;
            self.on_hand = self.on_hand.plus(received)?;
            Ok(())
        }

        pub fn consume(&mut self, used: Quantity) -> Result<(), String> {
            require_positive(used)?;
            let after = self.on_hand.minus(used)?;
            if after.is_negative() {
                return Err(format!("재고가 모자랍니다: 보유 {}, 요청 {used}", self.on_hand));
            }
            self.on_hand = after;
            Ok(())
        }

        pub fn id(&self) -> &StockId { &self.id }

        pub fn ingredient_id(&self) -> &IngredientId { &self.ingredient_id }

        pub fn on_hand(&self) -> Quantity { self.on_hand }
    }
}

use inventory::{IngredientId, IngredientStock, Quantity, StockId, Unit};
use std::cmp::Ordering;

fn attempt<T>(result: Result<T, String>) {
    if let Err(message) = result {
        println!("거부 — {message}");
    }
}

fn main() -> Result<(), String> {
    let mut stock = IngredientStock::new(StockId("stock-1".into()), IngredientId("yeast".into()), Unit::Kg)?;
    println!("재고 {} · 재료 {}", stock.id().0, stock.ingredient_id().0);

    stock.receive(Quantity::of("0.3", Unit::Kg)?)?;
    println!("입고 0.3 kg → 보유 {}", stock.on_hand());
    stock.consume(Quantity::of("50", Unit::G)?.times(2)?)?;
    println!("사용 50 g × 2 → 보유 {}", stock.on_hand());
    println!("보유량을 kg 로 → {}", stock.on_hand().convert_to(Unit::Kg)?);
    stock.consume(Quantity::of("0.2", Unit::Kg)?)?;
    println!("사용 0.2 kg → 보유 {}", stock.on_hand());

    attempt(stock.consume(Quantity::of("1", Unit::G)?));
    attempt(stock.receive(Quantity::of("1", Unit::L)?));
    attempt(Quantity::of("0.5", Unit::G)?.convert_to(Unit::Kg));

    let kg = Quantity::of("2.5", Unit::Kg)?;
    println!("같은 값인가 2.50 kg / 2.5 kg: {}", Quantity::of("2.50", Unit::Kg)? == kg);
    println!("같은 값인가 2.5 kg / 2500 g: {}", kg == Quantity::of("2500", Unit::G)?);
    println!("같은 양인가 2.5 kg / 2500 g: {}", kg.compare_to(Quantity::of("2500", Unit::G)?)? == Ordering::Equal);
    Ok(())
}
