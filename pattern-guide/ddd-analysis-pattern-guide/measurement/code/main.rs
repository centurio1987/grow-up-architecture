use std::collections::HashMap;
use std::fmt;

/// 값 — 수치와 단위를 한 값으로 묶는다. 단위끼리의 환산과 산술은 Quantity 패턴의 몫이다.
#[derive(Clone, PartialEq, Eq)]
struct Quantity {
    amount: i64,
    unit: String,
}

impl Quantity {
    fn new(amount: i64, unit: &str) -> Quantity {
        Quantity { amount, unit: unit.to_string() }
    }
}

impl fmt::Display for Quantity {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{} {}", self.amount, self.unit)
    }
}

/// 값 — ISO yyyy-mm-dd 하루. 이 표기는 문자열 순서가 날짜 순서와 같다.
#[derive(Clone, PartialEq, Eq, PartialOrd, Ord)]
struct TimePoint(String);

impl TimePoint {
    fn of(iso: &str) -> Result<TimePoint, String> {
        let b = iso.as_bytes();
        let shaped = b.len() == 10
            && b[4] == b'-'
            && b[7] == b'-'
            && (0..10).all(|i| i == 4 || i == 7 || b[i].is_ascii_digit());
        if !shaped {
            return Err(format!("날짜 꼴이 아닙니다: {}", iso));
        }
        Ok(TimePoint(iso.to_string()))
    }
}

impl fmt::Display for TimePoint {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

#[derive(Clone, PartialEq, Eq)]
struct SubjectId(String);
#[derive(Clone, PartialEq, Eq)]
struct PhenomenonTypeId(String);
#[derive(Clone, PartialEq, Eq)]
struct MeasurementId(String);

/// 값 — 거부 표시. 값을 지우는 대신 이것이 붙는다.
#[derive(Clone)]
struct Rejection {
    reason: String,
    rejected_on: TimePoint,
}

/// 지식 층위 aggregate root — 무엇을 재는가. 새 항목은 인스턴스 하나이지 타입 하나가 아니다.
struct PhenomenonType {
    name: String,
    allowed_unit: String,
}

impl PhenomenonType {
    fn of(name: &str, allowed_unit: &str) -> Result<PhenomenonType, String> {
        if name.trim().is_empty() || allowed_unit.trim().is_empty() {
            return Err("항목은 이름과 허용 단위를 하나씩 가집니다".to_string());
        }
        Ok(PhenomenonType { name: name.to_string(), allowed_unit: allowed_unit.to_string() })
    }

    fn allows(&self, q: &Quantity) -> bool {
        self.allowed_unit == q.unit
    }
}

/// 운영 층위 aggregate root — 대상 하나 · 항목 하나 · 값 하나를 묶은 기록 한 건.
struct Measurement {
    id: MeasurementId,
    subject_id: SubjectId,
    type_id: PhenomenonTypeId,
    quantity: Quantity,
    taken_on: TimePoint,
    recorded_on: TimePoint,
    rejection: Option<Rejection>,
}

impl Measurement {
    fn of(id: MeasurementId, subject_id: SubjectId, type_id: PhenomenonTypeId, quantity: Quantity,
          taken_on: TimePoint, recorded_on: TimePoint) -> Result<Measurement, String> {
        if taken_on > recorded_on {
            return Err(format!("잰 날 {} 는 적은 날 {} 보다 뒤입니다", taken_on, recorded_on));
        }
        Ok(Measurement { id, subject_id, type_id, quantity, taken_on, recorded_on, rejection: None })
    }

    fn is_rejected(&self) -> bool {
        self.rejection.is_some()
    }

    fn reject(&mut self, reason: &str, on: TimePoint) -> Result<(), String> {
        if self.rejection.is_some() {
            return Err(format!("{} 은 이미 거부된 기록입니다", self.id.0));
        }
        if on < self.recorded_on || reason.trim().is_empty() {
            return Err("거부는 사유를 달고, 적은 날보다 앞선 날짜로는 남기지 않습니다".to_string());
        }
        self.rejection = Some(Rejection { reason: reason.to_string(), rejected_on: on });
        Ok(())
    }

    /// as_of 시점에 이 기록이 유효한 것으로 읽혔는가 — 적은 날이 지났고, 아직 거부되지 않았는가.
    fn valid_as_of(&self, as_of: &TimePoint) -> bool {
        if self.recorded_on > *as_of {
            return false;
        }
        match &self.rejection {
            None => true,
            Some(r) => r.rejected_on > *as_of,
        }
    }
}

/// aggregate 가 아니다 — 두 aggregate 를 id 로 찾아 조립하고 조회에 답하는 자리.
struct MeasurementDesk {
    types: HashMap<String, PhenomenonType>,
    book: Vec<Measurement>,
}

impl MeasurementDesk {
    fn new() -> MeasurementDesk {
        MeasurementDesk { types: HashMap::new(), book: Vec::new() }
    }

    fn add_type(&mut self, id: &PhenomenonTypeId, type_of: PhenomenonType) {
        self.types.insert(id.0.clone(), type_of);
    }

    fn record(&mut self, id: &str, subject_id: &SubjectId, type_id: &PhenomenonTypeId,
              quantity: Quantity, taken_on: &str, recorded_on: &str) -> Result<usize, String> {
        let type_of = self.types.get(&type_id.0).ok_or(format!("등록되지 않은 항목입니다: {}", type_id.0))?;
        if !type_of.allows(&quantity) {
            return Err(format!(
                "항목 {} 의 허용 단위는 {} 인데 값의 단위는 {} 입니다",
                type_of.name, type_of.allowed_unit, quantity.unit
            ));
        }
        self.book.push(Measurement::of(
            MeasurementId(id.to_string()), subject_id.clone(), type_id.clone(), quantity,
            TimePoint::of(taken_on)?, TimePoint::of(recorded_on)?,
        )?);
        Ok(self.book.len() - 1)
    }

    fn index_of(&self, id: &str) -> Result<usize, String> {
        self.book.iter().position(|m| m.id.0 == id).ok_or(format!("없는 기록입니다: {}", id))
    }

    fn reject(&mut self, id: &str, reason: &str, on: &str) -> Result<(), String> {
        let at = self.index_of(id)?;
        let on = TimePoint::of(on)?;
        self.book[at].reject(reason, on)
    }

    fn type_name(&self, type_id: &PhenomenonTypeId) -> String {
        self.types.get(&type_id.0).map_or(String::new(), |t| t.name.clone())
    }

    fn rows(&self, subject_id: &SubjectId, type_id: &PhenomenonTypeId) -> Vec<&Measurement> {
        self.book.iter().filter(|m| m.subject_id == *subject_id && m.type_id == *type_id).collect()
    }

    /// 그 날 기준으로 알고 있던 값 — 두 시각을 따로 두면 이 질문 하나로 과거와 현재를 함께 답한다.
    fn known_on(&self, as_of: &str, subject_id: &SubjectId, type_id: &PhenomenonTypeId) -> Option<&Measurement> {
        let day = TimePoint::of(as_of).ok()?;
        self.rows(subject_id, type_id)
            .into_iter()
            .filter(|m| m.valid_as_of(&day))
            .fold(None, |best: Option<&Measurement>, m| match best {
                Some(b) if b.taken_on > m.taken_on => Some(b),
                _ => Some(m),
            })
    }
}

fn show(desk: &MeasurementDesk, at: usize) {
    let m = &desk.book[at];
    println!(
        "기록 {} — 환자 {} · {} · {} · 잰 날 {} · 적은 날 {}",
        m.id.0, m.subject_id.0, desk.type_name(&m.type_id), m.quantity, m.taken_on, m.recorded_on
    );
}

fn attempt<T>(outcome: Result<T, String>) {
    if let Err(message) = outcome {
        println!("거부 — {}", message);
    }
}

fn main() -> Result<(), String> {
    let mut desk = MeasurementDesk::new();
    let patient = SubjectId("p-7".to_string());
    let systolic = PhenomenonTypeId("pt-1".to_string());
    desk.add_type(&systolic, PhenomenonType::of("systolic", "mmHg")?);
    println!("항목 systolic — 허용 단위 mmHg");

    let at = desk.record("m-1", &patient, &systolic, Quantity::new(118, "mmHg"), "2026-09-01", "2026-09-01")?;
    show(&desk, at);
    attempt(desk.record("m-x", &patient, &systolic, Quantity::new(72, "bpm"), "2026-09-01", "2026-09-01"));

    let pulse = PhenomenonTypeId("pt-2".to_string());
    desk.add_type(&pulse, PhenomenonType::of("pulse", "bpm")?);
    println!("항목 추가 pulse — 허용 단위 bpm (고친 코드 없음)");
    let at = desk.record("m-2", &patient, &pulse, Quantity::new(72, "bpm"), "2026-09-01", "2026-09-03")?;
    show(&desk, at);
    for day in ["2026-09-02", "2026-09-04"] {
        let seen = desk.known_on(day, &patient, &pulse);
        let text = seen.map_or("없음".to_string(), |m| m.quantity.to_string());
        println!("{} 에 알던 p-7 의 pulse — {}", day, text);
    }

    let at = desk.record("m-3", &patient, &systolic, Quantity::new(1200, "mmHg"), "2026-09-03", "2026-09-03")?;
    show(&desk, at);
    desk.reject("m-3", "오기", "2026-09-04")?;
    let wrong = &desk.book[desk.index_of("m-3")?];
    let mark = wrong.rejection.clone().ok_or("거부 표시가 없습니다")?;
    println!("m-3 거부 — 사유 {} · 거부한 날 {}", mark.reason, mark.rejected_on);
    println!("m-3 의 값은 그대로 {}", wrong.quantity);
    let at = desk.record("m-4", &patient, &systolic, Quantity::new(120, "mmHg"), "2026-09-03", "2026-09-04")?;
    show(&desk, at);

    let rows = desk.rows(&patient, &systolic);
    let total = rows.len();
    let rejected = rows.iter().filter(|m| m.is_rejected()).count();
    let latest = desk.known_on("2026-09-30", &patient, &systolic).ok_or("유효한 기록이 없습니다")?;
    println!(
        "2026-09-30 에 알던 p-7 의 systolic — {} (잰 날 {}) · 전체 {}건 중 거부 {}건 제외",
        latest.quantity, latest.taken_on, total, rejected
    );
    attempt(desk.reject("m-3", "또 오기", "2026-09-05"));
    attempt(desk.record("m-5", &patient, &systolic, Quantity::new(119, "mmHg"), "2026-09-05", "2026-09-04"));
    Ok(())
}
