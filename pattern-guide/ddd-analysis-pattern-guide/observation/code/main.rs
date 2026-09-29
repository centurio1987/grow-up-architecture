use std::fmt;

/// 값 — 수치와 단위를 한 값으로 묶는다. 환산과 산술은 Quantity 패턴의 몫이다.
#[derive(Clone, PartialEq, Eq)]
struct Quantity { amount: i64, unit: String }

impl Quantity {
    fn new(amount: i64, unit: &str) -> Quantity { Quantity { amount, unit: unit.to_string() } }
}

impl fmt::Display for Quantity {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result { write!(f, "{} {}", self.amount, self.unit) }
}

/// 값 — ISO yyyy-mm-dd 하루. 이 표기는 문자열 순서가 날짜 순서와 같다.
#[derive(Clone, PartialEq, Eq, PartialOrd, Ord)]
struct TimePoint(String);

impl TimePoint {
    fn new(iso: &str) -> TimePoint { TimePoint(iso.to_string()) }
}

impl fmt::Display for TimePoint {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result { write!(f, "{}", self.0) }
}

#[derive(Clone, PartialEq, Eq)]
struct SubjectId(String);
#[derive(Clone, PartialEq, Eq)]
struct PhenomenonTypeId(String);
#[derive(Clone, PartialEq, Eq)]
struct PhenomenonId(String);
#[derive(Clone, PartialEq, Eq)]
struct ObservationId(String);

/// 값 — 거부 표시. 값을 지우는 대신 이것이 붙는다.
#[derive(Clone)]
struct Rejection { reason: String, rejected_on: TimePoint }

/// 값 — 관측의 값 자리. 크기가 오면 수치 관측이고 범주가 오면 범주형 관측이다.
#[derive(Clone)]
enum ObservedValue { Magnitude(Quantity), Category(PhenomenonId) }

/// entity — 항목이 든 통제된 범주 값 하나. 항목 aggregate 안에 산다.
struct Phenomenon { id: PhenomenonId, label: String }

/// 값 — 항목이 정하는 값의 종류. 크기 항목은 허용 단위를, 범주 항목은 범주 목록을 든다.
enum ItemKind { Magnitude { allowed_unit: String }, Category { phenomena: Vec<Phenomenon> } }

/// 지식 층위 aggregate root — 무엇에 대한 사실인가. 새 항목은 인스턴스 하나이지 타입 하나가 아니다.
struct PhenomenonType { id: PhenomenonTypeId, name: String, kind: ItemKind }

impl PhenomenonType {
    fn magnitude(id: &str, name: &str, allowed_unit: &str) -> PhenomenonType {
        assert!(!allowed_unit.is_empty(), "크기 항목은 허용 단위를 하나 가집니다");
        PhenomenonType::new(id, name, ItemKind::Magnitude { allowed_unit: allowed_unit.to_string() })
    }

    fn category(id: &str, name: &str, labels: &[&str]) -> PhenomenonType {
        assert!(!labels.is_empty(), "범주 항목은 범주를 하나 이상 가집니다");
        let phenomena = labels.iter()
            .map(|l| Phenomenon { id: PhenomenonId(format!("ph-{}", l)), label: l.to_string() })
            .collect();
        PhenomenonType::new(id, name, ItemKind::Category { phenomena })
    }

    fn new(id: &str, name: &str, kind: ItemKind) -> PhenomenonType {
        assert!(!name.is_empty(), "항목은 이름을 가집니다");
        PhenomenonType { id: PhenomenonTypeId(id.to_string()), name: name.to_string(), kind }
    }

    /// 값이 이 항목이 정한 종류·단위·범주에 맞는가. 어긋나면 왜 어긋나는지를 돌려준다.
    fn check(&self, value: &ObservedValue) -> Option<String> {
        match (&self.kind, value) {
            (ItemKind::Magnitude { allowed_unit }, ObservedValue::Magnitude(q)) => (allowed_unit != &q.unit).then(
                || format!("항목 {} 의 허용 단위는 {} 인데 값의 단위는 {} 입니다", self.name, allowed_unit, q.unit)),
            (ItemKind::Category { .. }, ObservedValue::Category(pid)) => self.label_of(pid).is_none().then(
                || format!("범주 {} 는 항목 {} 의 범주가 아닙니다", pid.0, self.name)),
            (ItemKind::Magnitude { .. }, _) => Some(format!("크기 항목 {} 에 범주 값을 넣었습니다", self.name)),
            (ItemKind::Category { .. }, _) => Some(format!("범주 항목 {} 에 크기 값을 넣었습니다", self.name)),
        }
    }

    fn label_of(&self, pid: &PhenomenonId) -> Option<&str> {
        match &self.kind {
            ItemKind::Category { phenomena } => phenomena.iter().find(|p| &p.id == pid).map(|p| p.label.as_str()),
            ItemKind::Magnitude { .. } => None,
        }
    }

    fn describe(&self) -> String {
        match &self.kind {
            ItemKind::Magnitude { allowed_unit } => format!("항목 {} — 크기 항목 · 허용 단위 {}", self.name, allowed_unit),
            ItemKind::Category { phenomena } => {
                let labels: Vec<&str> = phenomena.iter().map(|p| p.label.as_str()).collect();
                format!("항목 {} — 범주 항목 · 범주 {}", self.name, labels.join(" · "))
            }
        }
    }
}

/// 운영 층위 aggregate root — 대상에 대한 사실 한 건. 값의 종류를 모르는 층이 여기다.
struct Observation {
    id: ObservationId, subject_id: SubjectId, type_id: PhenomenonTypeId, value: ObservedValue,
    taken_on: TimePoint, recorded_on: TimePoint, rejection: Option<Rejection>,
}

impl Observation {
    fn new(id: &str, subject_id: SubjectId, type_id: PhenomenonTypeId, value: ObservedValue,
           taken_on: TimePoint, recorded_on: TimePoint) -> Result<Observation, String> {
        if taken_on > recorded_on { return Err(format!("잰 날 {} 는 적은 날 {} 보다 뒤입니다", taken_on, recorded_on)); }
        Ok(Observation { id: ObservationId(id.to_string()), subject_id, type_id, value,
                         taken_on, recorded_on, rejection: None })
    }

    /// 거부는 표시를 더하는 일이다 — 값 자리도 두 시각도 건드리지 않는다.
    fn reject(&mut self, reason: &str, on: TimePoint) -> Result<(), String> {
        if self.rejection.is_some() { return Err(format!("{} 는 이미 거부된 관측입니다", self.id.0)); }
        if reason.is_empty() || on < self.recorded_on {
            return Err("거부는 사유를 달고, 적은 날보다 앞선 날짜로는 남기지 않습니다".to_string());
        }
        self.rejection = Some(Rejection { reason: reason.to_string(), rejected_on: on });
        Ok(())
    }

    /// as_of 시점에 이 사실이 유효한 것으로 읽혔는가 — 적은 날이 지났고, 아직 거부되지 않았는가.
    fn valid_as_of(&self, as_of: &TimePoint) -> bool {
        if &self.recorded_on > as_of { return false; }
        self.rejection.as_ref().map_or(true, |r| &r.rejected_on > as_of)
    }
}

/// aggregate 가 아니다 — 두 aggregate 를 id 로 찾아 조립하고 조회에 답하는 자리.
struct ObservationDesk { types: Vec<PhenomenonType>, book: Vec<Observation> }

impl ObservationDesk {
    fn new() -> ObservationDesk { ObservationDesk { types: Vec::new(), book: Vec::new() } }

    fn register(&mut self, t: PhenomenonType) -> &PhenomenonType { self.types.push(t); self.types.last().expect("방금") }

    fn type_of(&self, id: &PhenomenonTypeId) -> &PhenomenonType {
        self.types.iter().find(|t| &t.id == id).expect("없는 항목입니다")
    }

    fn find(&self, id: &ObservationId) -> &Observation {
        self.book.iter().find(|o| &o.id == id).expect("없는 관측입니다")
    }

    fn record(&mut self, obs_id: &str, subject: &SubjectId, type_id: &PhenomenonTypeId, value: ObservedValue,
              taken_on: TimePoint, recorded_on: TimePoint) -> Result<(), String> {
        if let Some(bad) = self.type_of(type_id).check(&value) { return Err(bad); }
        self.book.push(Observation::new(obs_id, subject.clone(), type_id.clone(), value, taken_on, recorded_on)?);
        Ok(())
    }

    fn reject(&mut self, id: &ObservationId, reason: &str, on: TimePoint) -> Result<(), String> {
        self.book.iter_mut().find(|o| &o.id == id).expect("없는 관측입니다").reject(reason, on)
    }

    /// 그 날 기준으로 알던 사실 — 적은 날이 지났고 아직 거부되지 않은 것 중 가장 나중에 잰 것.
    fn known_on(&self, as_of: &TimePoint, subject: &SubjectId, type_id: &PhenomenonTypeId) -> Option<&Observation> {
        let mut best: Option<&Observation> = None;
        for o in &self.book {
            if &o.subject_id != subject || &o.type_id != type_id || !o.valid_as_of(as_of) { continue; }
            if best.is_none() || o.taken_on >= best.expect("검사함").taken_on { best = Some(o); }
        }
        best
    }

    fn known_label(&self, as_of: &TimePoint, subject: &SubjectId, type_id: &PhenomenonTypeId) -> String {
        self.known_on(as_of, subject, type_id).map_or("없음".to_string(), |o| self.show(&o.value))
    }

    /// 대상에 대해 그 날 알던 사실 전부 — 값의 종류로 갈라 묻지 않는다.
    fn all_known_on(&self, as_of: &TimePoint, subject: &SubjectId) -> String {
        let mut out: Vec<String> = Vec::new();
        for t in &self.types {
            if let Some(o) = self.known_on(as_of, subject, &t.id) {
                out.push(format!("{} {}", t.name, self.show(&o.value)));
            }
        }
        format!("{} 에 알던 {} 의 사실 {}건 — {}", as_of, subject.0, out.len(), out.join(" · "))
    }

    fn show(&self, value: &ObservedValue) -> String {
        match value {
            ObservedValue::Magnitude(q) => q.to_string(),
            ObservedValue::Category(pid) => self.types.iter().find_map(|t| t.label_of(pid)).unwrap_or(&pid.0).to_string(),
        }
    }

    fn describe(&self, id: &ObservationId) -> String {
        let o = self.find(id);
        format!("관측 {} — {} · {} · {} · 잰 날 {} · 적은 날 {}", id.0, o.subject_id.0,
                self.type_of(&o.type_id).name, self.show(&o.value), o.taken_on, o.recorded_on)
    }
}

fn attempt(result: Result<(), String>) {
    if let Err(message) = result { println!("거부 — {}", message); }
}

fn main() {
    let mut desk = ObservationDesk::new();
    let p7 = SubjectId("p-7".to_string());
    let abo = PhenomenonTypeId("pt-abo".to_string());
    let sbp = PhenomenonTypeId("pt-systolic".to_string());
    let smk = PhenomenonTypeId("pt-smoking".to_string());
    let o4 = ObservationId("o-4".to_string());
    let obs = |id: &str| ObservationId(id.to_string());
    let d = TimePoint::new;
    let mag = |amount: i64, unit: &str| ObservedValue::Magnitude(Quantity::new(amount, unit));
    let cat = |label: &str| ObservedValue::Category(PhenomenonId(format!("ph-{}", label)));

    println!("{}", desk.register(PhenomenonType::category("pt-abo", "abo", &["A", "B", "O", "AB"])).describe());
    println!("{}", desk.register(PhenomenonType::magnitude("pt-systolic", "systolic", "mmHg")).describe());
    desk.record("o-1", &p7, &sbp, mag(118, "mmHg"), d("2026-09-01"), d("2026-09-01")).expect("통과");
    println!("{}", desk.describe(&obs("o-1")));
    desk.record("o-2", &p7, &abo, cat("A"), d("2026-09-01"), d("2026-09-01")).expect("통과");
    println!("{}", desk.describe(&obs("o-2")));
    println!("{}", desk.all_known_on(&d("2026-09-01"), &p7));

    println!("{} (고친 타입 없음)", desk
        .register(PhenomenonType::category("pt-smoking", "smoking", &["smoker", "non-smoker"])).describe());
    desk.record("o-3", &p7, &smk, cat("non-smoker"), d("2026-09-01"), d("2026-09-03")).expect("통과");
    println!("{}", desk.describe(&obs("o-3")));
    println!("2026-09-02 에 알던 p-7 의 smoking — {}", desk.known_label(&d("2026-09-02"), &p7, &smk));
    println!("2026-09-04 에 알던 p-7 의 smoking — {}", desk.known_label(&d("2026-09-04"), &p7, &smk));

    desk.record("o-4", &p7, &abo, cat("B"), d("2026-09-03"), d("2026-09-03")).expect("통과");
    println!("{}", desk.describe(&o4));
    desk.reject(&o4, "오기", d("2026-09-04")).expect("통과");
    let mark = desk.find(&o4).rejection.clone().expect("거부함");
    println!("o-4 거부 — 사유 {} · 거부한 날 {}", mark.reason, mark.rejected_on);
    println!("o-4 의 값은 그대로 {}", desk.show(&desk.find(&o4).value));
    desk.record("o-5", &p7, &abo, cat("A"), d("2026-09-03"), d("2026-09-04")).expect("통과");
    println!("{}", desk.describe(&obs("o-5")));
    println!("2026-09-03 에 알던 p-7 의 abo — {}", desk.known_label(&d("2026-09-03"), &p7, &abo));
    println!("2026-09-30 에 알던 p-7 의 abo — {}", desk.known_label(&d("2026-09-30"), &p7, &abo));
    println!("{}", desk.all_known_on(&d("2026-09-30"), &p7));

    attempt(desk.record("x-1", &p7, &abo, mag(1, "code"), d("2026-09-05"), d("2026-09-05")));
    attempt(desk.record("x-2", &p7, &abo, cat("smoker"), d("2026-09-05"), d("2026-09-05")));
    attempt(desk.record("x-3", &p7, &sbp, cat("A"), d("2026-09-05"), d("2026-09-05")));
    attempt(desk.record("x-4", &p7, &sbp, mag(72, "bpm"), d("2026-09-05"), d("2026-09-05")));
    attempt(desk.reject(&o4, "중복", d("2026-09-05")));
    attempt(desk.record("x-5", &p7, &sbp, mag(120, "mmHg"), d("2026-09-05"), d("2026-09-04")));
}
