use std::fmt;

#[derive(Clone, Copy)]
struct Unit { grams: i64, symbol: &'static str }

const G: Unit = Unit { grams: 1, symbol: "g" };
const KG: Unit = Unit { grams: 1000, symbol: "kg" };

// 무게 하나. g 로 정규화해 담으므로 2 kg 과 2000 g 은 같은 값이고 크기 비교가 필드 하나로 끝난다.
#[derive(Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
struct Quantity { grams: i64 }

impl Quantity {
    fn of(amount: i64, unit: Unit) -> Self { Self { grams: amount * unit.grams } }
}

impl fmt::Display for Quantity {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        if self.grams != 0 && self.grams % KG.grams == 0 {
            write!(f, "{} {}", self.grams / KG.grams, KG.symbol)
        } else {
            write!(f, "{} {}", self.grams, G.symbol)
        }
    }
}

// 두 끝과 각 끝을 포함하는지를 한 값으로 든 구간. 끝점 타입은 크기 비교가 되면 무엇이든 된다.
#[derive(Clone)]
struct Range<T: Ord> { lower: T, upper: T, lower_inclusive: bool, upper_inclusive: bool }

impl<T: Ord + fmt::Display> Range<T> {
    fn new(lower: T, upper: T, lower_inclusive: bool, upper_inclusive: bool) -> Result<Self, String> {
        if lower > upper {
            return Err(format!("하한이 상한보다 큽니다: {} .. {}", lower, upper));
        }
        Ok(Self { lower, upper, lower_inclusive, upper_inclusive })
    }

    fn includes(&self, value: &T) -> bool {
        (self.lower < *value || (self.lower == *value && self.lower_inclusive))
            && (*value < self.upper || (*value == self.upper && self.upper_inclusive))
    }

    fn overlaps(&self, other: &Self) -> bool { self.reaches(other) && other.reaches(self) }

    // 맞닿음 — 한쪽 상한과 다른 쪽 하한이 같은 값이고, 그 자리를 정확히 한쪽만 포함한다.
    fn abuts(&self, other: &Self) -> bool {
        (self.upper == other.lower && self.upper_inclusive != other.lower_inclusive)
            || (other.upper == self.lower && other.upper_inclusive != self.lower_inclusive)
    }

    // 이 구간의 아래 끝이 상대의 위 끝까지 닿는가. 같은 값이면 양쪽이 그 자리를 포함해야 닿는다.
    fn reaches(&self, other: &Self) -> bool {
        self.lower < other.upper
            || (self.lower == other.upper && self.lower_inclusive && other.upper_inclusive)
    }

    fn same_edge_as_lower(&self, v: &T, inc: bool) -> bool { self.lower == *v && self.lower_inclusive == inc }

    fn same_edge_as_upper(&self, v: &T, inc: bool) -> bool { self.upper == *v && self.upper_inclusive == inc }
}

impl<T: Ord + fmt::Display> fmt::Display for Range<T> {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        let lo = if self.lower_inclusive { " <= x " } else { " < x " };
        let hi = if self.upper_inclusive { "<= " } else { "< " };
        write!(f, "{}{}{}{}", self.lower, lo, hi, self.upper)
    }
}

struct Fee { won: i64 }

impl fmt::Display for Fee {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result { write!(f, "{}원", self.won) }
}

struct BandId(String);

struct RateTableId(String);

struct ProductId(String);

// 요금 구간 — 무게 구간 하나와 그 구간의 요금. 표 안에서 BandId 로 지목된다.
struct RateBand { id: BandId, weights: Range<Quantity>, fee: Fee }

impl fmt::Display for RateBand {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "구간 {} · {} · {}", self.id.0, self.weights, self.fee)
    }
}

struct RateTable {
    id: RateTableId,
    product_id: ProductId, // 배송 상품 aggregate 는 id 로만 가리킨다
    span: Range<Quantity>,
    bands: Vec<RateBand>,
}

impl RateTable {
    fn new(id: RateTableId, product_id: ProductId, span: Range<Quantity>, bands: Vec<RateBand>)
        -> Result<Self, String> {
        let mut table = Self { id, product_id, span: span.clone(), bands: Vec::new() };
        table.redefine(span, bands)?;
        Ok(table)
    }

    // 구간 목록을 바꾸는 유일한 길. 비중첩과 전 구간 덮음을 여기서 검사하고, 통과한 뒤에 교체한다.
    fn redefine(&mut self, span: Range<Quantity>, bands: Vec<RateBand>) -> Result<(), String> {
        let mut sorted = bands;
        sorted.sort_by(|a, b| a.weights.lower.cmp(&b.weights.lower));
        if sorted.is_empty() {
            return Err(format!("구간이 하나도 없습니다: {}", span));
        }
        for i in 0..sorted.len() {
            for j in i + 1..sorted.len() {
                let (a, b) = (&sorted[i], &sorted[j]);
                if a.weights.overlaps(&b.weights) {
                    return Err(format!("구간이 겹칩니다: {}({}) 와 {}({})",
                        a.id.0, a.weights, b.id.0, b.weights));
                }
            }
        }
        let (first, last) = (&sorted[0].weights, &sorted[sorted.len() - 1].weights);
        if !first.same_edge_as_lower(&span.lower, span.lower_inclusive)
            || !last.same_edge_as_upper(&span.upper, span.upper_inclusive)
        {
            return Err(format!("구간이 적용 구간의 양 끝을 덮지 않습니다: {}", span));
        }
        for i in 1..sorted.len() {
            let (prev, next) = (&sorted[i - 1].weights, &sorted[i].weights);
            if !prev.abuts(next) {
                return Err(format!("구간 사이에 틈이 있습니다: {} 다음 구간이 {} 부터입니다",
                    prev, next.lower));
            }
        }
        self.span = span;
        self.bands = sorted;
        Ok(())
    }

    fn band_for(&self, weight: &Quantity) -> Result<&RateBand, String> {
        if !self.span.includes(weight) {
            return Err(format!("적용 구간을 벗어납니다: {}", weight));
        }
        self.bands.iter().find(|b| b.weights.includes(weight))
            .ok_or_else(|| format!("어느 구간에도 들지 않습니다: {}", weight))
    }
}

// 하한 미포함 · 상한 포함
fn up_to(id: &str, lower: Quantity, upper: Quantity, won: i64) -> Result<RateBand, String> {
    let weights = Range::new(lower, upper, false, true)?;
    Ok(RateBand { id: BandId(id.to_string()), weights, fee: Fee { won } })
}

// 하한 포함 · 상한 미포함
fn from_lower(id: &str, lower: Quantity, upper: Quantity, won: i64) -> Result<RateBand, String> {
    let weights = Range::new(lower, upper, true, false)?;
    Ok(RateBand { id: BandId(id.to_string()), weights, fee: Fee { won } })
}

fn quote(table: &RateTable, weight: Quantity) {
    match table.band_for(&weight) {
        Ok(band) => println!("{} 소포 → {} · {}", weight, band.id.0, band.fee),
        Err(e) => println!("거부 — {}", e),
    }
}

fn report(result: Result<(), String>) {
    if let Err(e) = result {
        println!("거부 — {}", e);
    }
}

fn base_bands(zero: Quantity, kg2: Quantity, kg5: Quantity, kg20: Quantity) -> Result<Vec<RateBand>, String> {
    Ok(vec![up_to("band-1", zero, kg2, 4000)?, up_to("band-2", kg2, kg5, 5500)?,
        up_to("band-3", kg5, kg20, 8000)?])
}

fn main() -> Result<(), String> {
    let (zero, kg2) = (Quantity::of(0, G), Quantity::of(2, KG));
    let (kg5, kg20) = (Quantity::of(5, KG), Quantity::of(20, KG));
    let span = Range::new(zero, kg20, false, true)?;
    let mut table = RateTable::new(RateTableId("rate-1".to_string()),
        ProductId("standard-parcel".to_string()), span.clone(), base_bands(zero, kg2, kg5, kg20)?)?;
    println!("요금표 {} · 상품 {} · 적용 {}", table.id.0, table.product_id.0, table.span);
    for band in &table.bands {
        println!("{}", band);
    }

    quote(&table, kg2);
    quote(&table, Quantity::of(2001, G));
    quote(&table, kg20);
    quote(&table, Quantity::of(20001, G));

    let kg30 = Quantity::of(30, KG);
    let mut wider = base_bands(zero, kg2, kg5, kg20)?;
    wider.push(up_to("band-4", kg20, kg30, 11000)?);
    table.redefine(Range::new(zero, kg30, false, true)?, wider)?;
    println!("대형 구간을 더해 적용 {} 으로 다시 정의", table.span);
    quote(&table, Quantity::of(25, KG));

    report(Range::new(kg5, kg2, false, true).map(|_| ()));
    let mut overlapping = base_bands(zero, kg2, kg5, kg20)?;
    overlapping.push(up_to("band-9", Quantity::of(4, KG), Quantity::of(9, KG), 7000)?);
    report(table.redefine(span.clone(), overlapping));
    let gapped = vec![up_to("band-1", zero, kg2, 4000)?,
        up_to("band-5", Quantity::of(3, KG), kg5, 5500)?, up_to("band-3", kg5, kg20, 8000)?];
    report(table.redefine(span, gapped));

    let flipped = RateTable::new(RateTableId("rate-2".to_string()),
        ProductId("standard-parcel".to_string()), Range::new(zero, kg20, true, false)?,
        vec![from_lower("band-1", zero, kg2, 4000)?, from_lower("band-2", kg2, kg5, 5500)?,
            from_lower("band-3", kg5, kg20, 8000)?])?;
    print!("경계 포함을 뒤집은 표에서 ");
    quote(&flipped, kg2);
    Ok(())
}
