use std::fmt;

// 뉴타입 id — 다른 aggregate 는 객체가 아니라 이 값으로만 가리킨다
#[derive(Clone, PartialEq, Eq)] struct EquipmentTypeId(String);
#[derive(Clone, PartialEq, Eq)] struct InspectionTypeId(String);
#[derive(Clone, PartialEq, Eq)] struct EquipmentId(String);
#[derive(Clone, PartialEq, Eq)] struct InspectionId(String);

fn text(value: &str) -> String { value.to_string() }

// VO: 정상으로 보는 수치 구간. 양 끝을 포함한다
#[derive(Clone, PartialEq, Eq)] struct NormalRange { low: i64, high: i64 }

impl NormalRange {
    fn new(low: i64, high: i64) -> Self { NormalRange { low, high } }
    fn contains(&self, amount: i64) -> bool { self.low <= amount && amount <= self.high }
}
impl fmt::Display for NormalRange {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result { write!(f, "{}..{}", self.low, self.high) }
}

// VO: 수치와 단위를 묶은 측정값 — 단위를 들고 오는 이유는 대조할 상대가 지식 층위에 있기 때문이다
#[derive(Clone)] struct Reading { amount: i64, unit: String }

impl Reading {
    fn new(amount: i64, unit: &str) -> Self { Reading { amount, unit: text(unit) } }
}
impl fmt::Display for Reading {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result { write!(f, "{} {}", self.amount, self.unit) }
}

// VO: 기록 시점에 적용한 범위와 그 결과. 한 번 정해지면 바뀌지 않는다
#[derive(Clone)] struct Verdict { label: String, applied: NormalRange }

impl fmt::Display for Verdict {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{} (적용 범위 {})", self.label, self.applied)
    }
}

// VO: 점검 종류가 내놓는 규칙 한 벌 — 운영 층위가 지식 객체에서 받는 것은 이 값뿐이다
#[derive(Clone)]
struct InspectionRule {
    type_id: InspectionTypeId,
    unit: String,
    range: NormalRange,
    allowed: Vec<EquipmentTypeId>,
}

impl InspectionRule {
    fn allows(&self, type_id: &EquipmentTypeId) -> bool { self.allowed.contains(type_id) }
    fn judge(&self, reading: &Reading) -> Verdict {
        let label = if self.range.contains(reading.amount) { "정상" } else { "이상" };
        Verdict { label: text(label), applied: self.range.clone() }
    }
}

// aggregate root, 지식 층위: 설비를 가르는 분류
struct EquipmentType { id: EquipmentTypeId, name: String }

impl EquipmentType {
    fn describe(&self) -> String { format!("{} {}", self.id.0, self.name) }
}

// aggregate root, 지식 층위: 무엇을 재고 · 어디에 쓸 수 있고 · 어디까지가 정상인지 셋을 한 인스턴스가 쥔다
struct InspectionType {
    id: InspectionTypeId,
    name: String,
    item: String,
    unit: String,
    range: NormalRange,
    allowed: Vec<EquipmentTypeId>,
}

impl InspectionType {
    fn new(key: &str, name: &str, item: &str, unit: &str, range: NormalRange,
           allowed: Vec<EquipmentTypeId>) -> Result<Self, String> {
        if allowed.is_empty() {
            return Err(format!("점검 종류 {} 의 허용 설비 종류가 비어 있습니다", key));
        }
        Ok(InspectionType { id: InspectionTypeId(text(key)), name: text(name), item: text(item),
                            unit: text(unit), range, allowed })
    }
    fn rule(&self) -> InspectionRule {
        InspectionRule { type_id: self.id.clone(), unit: self.unit.clone(),
                         range: self.range.clone(), allowed: self.allowed.clone() }
    }
    fn allow(&mut self, type_id: EquipmentTypeId) {
        if !self.allowed.contains(&type_id) { self.allowed.push(type_id); }
    }
    fn narrow_to(&mut self, narrower: NormalRange) { self.range = narrower; }
    fn describe(&self) -> String {
        format!("점검 종류 {} {}: {} {} {}, 허용 설비 종류 {}", self.id.0, self.name, self.item,
                self.range, self.unit, labels(&self.allowed))
    }
}

fn labels(ids: &[EquipmentTypeId]) -> String {
    format!("[{}]", ids.iter().map(|each| each.0.clone()).collect::<Vec<String>>().join(", "))
}

// aggregate root, 운영 층위: 현장에 있는 설비 한 대
struct Equipment { id: EquipmentId, name: String, type_id: EquipmentTypeId }

impl Equipment {
    fn describe(&self) -> String { format!("{} {} ({})", self.id.0, self.name, self.type_id.0) }
}

// aggregate root, 운영 층위: 점검 한 건의 사실. 규칙은 하나도 들고 있지 않다
struct Inspection {
    id: InspectionId,
    equipment_id: EquipmentId,
    type_id: InspectionTypeId,
    date: String,
    reading: Reading,
    verdict: Verdict,
}

impl Inspection {
    fn record(key: &str, equipment_id: EquipmentId, equipment_type_id: &EquipmentTypeId,
              date: &str, reading: Reading, rule: &InspectionRule) -> Result<Self, String> {
        if !rule.allows(equipment_type_id) {
            return Err(format!("점검 종류 {} 은 설비 종류 {} 을 허용하지 않습니다",
                               rule.type_id.0, equipment_type_id.0));
        }
        if rule.unit != reading.unit {
            return Err(format!("점검 종류 {} 는 {} 을 요구하는데 측정값이 {} 입니다",
                               rule.type_id.0, rule.unit, reading.unit));
        }
        let verdict = rule.judge(&reading);
        Ok(Inspection { id: InspectionId(text(key)), equipment_id, type_id: rule.type_id.clone(),
                        date: text(date), reading, verdict })
    }
    fn line(&self) -> String {
        format!("{} {} {} 을 {} 로 -> {}, 판정 {}", self.id.0, self.date, self.equipment_id.0,
                self.type_id.0, self.reading, self.verdict)
    }
}

// 지식 층위 등록부 — 등록 서비스이자 저장소 (aggregate 아님)
#[derive(Default)] struct TypeCatalog { equipment_types: Vec<EquipmentType>, inspection_types: Vec<InspectionType> }

impl TypeCatalog {
    fn add_equipment_type(&mut self, key: &str, name: &str) -> EquipmentTypeId {
        let type_id = EquipmentTypeId(text(key));
        self.equipment_types.push(EquipmentType { id: type_id.clone(), name: text(name) });
        type_id
    }
    fn add_inspection_type(&mut self, kind: InspectionType) { self.inspection_types.push(kind); }
    fn get(&self, key: &str) -> &InspectionType {
        self.inspection_types.iter().find(|each| each.id.0 == key).expect("등록된 점검 종류")
    }
    fn get_mut(&mut self, key: &str) -> &mut InspectionType {
        self.inspection_types.iter_mut().find(|each| each.id.0 == key).expect("등록된 점검 종류")
    }
}

// 운영 층위 장부 — 기록 서비스이자 저장소 (aggregate 아님)
#[derive(Default)] struct SiteLog { equipments: Vec<Equipment>, inspections: Vec<Inspection> }

impl SiteLog {
    fn add(&mut self, key: &str, name: &str, type_id: &EquipmentTypeId) -> String {
        let equipment = Equipment { id: EquipmentId(text(key)), name: text(name), type_id: type_id.clone() };
        let line = equipment.describe();
        self.equipments.push(equipment);
        line
    }
    fn record(&mut self, catalog: &TypeCatalog, key: &str, target: &str, type_key: &str,
              date: &str, reading: Reading) -> Result<String, String> {
        let found = self.equipments.iter().find(|each| each.id.0 == target)
            .map(|each| (each.id.clone(), each.type_id.clone()))
            .ok_or_else(|| format!("설비 {} 가 없습니다", target))?;
        let inspection = Inspection::record(key, found.0, &found.1, date, reading,
                                            &catalog.get(type_key).rule())?;
        let line = inspection.line();
        self.inspections.push(inspection);
        Ok(line)
    }
    fn verdict_of(&self, key: &str) -> String {
        self.inspections.iter().find(|each| each.id.0 == key).expect("기록된 점검").verdict.to_string()
    }
}

fn reject<T>(what: &str, result: Result<T, String>) {
    if let Err(message) = result { println!("거절({}): {}", what, message); }
}

fn main() {
    let mut catalog = TypeCatalog::default();
    let mut log = SiteLog::default();

    let ev = catalog.add_equipment_type("ET-EV", "승강기");
    let bl = catalog.add_equipment_type("ET-BL", "보일러");
    println!("[지식] 설비 종류 {} · {}", catalog.equipment_types[0].describe(),
             catalog.equipment_types[1].describe());
    catalog.add_inspection_type(InspectionType::new("IT-1", "승강기 정기점검", "제동거리", "mm",
                                NormalRange::new(0, 60), vec![ev.clone()]).expect("허용 목록 있음"));
    catalog.add_inspection_type(InspectionType::new("IT-2", "보일러 연소점검", "배기CO", "ppm",
                                NormalRange::new(0, 400), vec![bl.clone()]).expect("허용 목록 있음"));
    println!("[지식] {}", catalog.get("IT-1").describe());
    println!("[지식] {}", catalog.get("IT-2").describe());

    let first = log.add("EV-01", "승강기", &ev);
    let second = log.add("BL-01", "보일러", &bl);
    println!("[운영] 설비 {} · {}", first, second);

    println!("{}", log.record(&catalog, "INS-1", "EV-01", "IT-1", "2026-03-05",
                              Reading::new(48, "mm")).expect("기록됨"));
    println!("{}", log.record(&catalog, "INS-2", "BL-01", "IT-2", "2026-03-06",
                              Reading::new(520, "ppm")).expect("기록됨"));

    reject("허용 조합 아님", log.record(&catalog, "INS-X", "BL-01", "IT-1", "2026-03-06",
                                        Reading::new(0, "mm")));
    reject("단위 다름", log.record(&catalog, "INS-X", "BL-01", "IT-2", "2026-03-06",
                                   Reading::new(48, "mm")));
    reject("허용 설비 종류 없음", InspectionType::new("IT-9", "미정 점검", "미정", "회",
                                                      NormalRange::new(0, 1), vec![]));

    catalog.add_inspection_type(InspectionType::new("IT-3", "승강기 비상통화", "응답시간", "s",
                                NormalRange::new(0, 10), vec![ev.clone()]).expect("허용 목록 있음"));
    catalog.add_inspection_type(InspectionType::new("IT-4", "안전표지", "훼손개수", "개",
                                NormalRange::new(0, 0), vec![ev, bl]).expect("허용 목록 있음"));
    println!("[지식] {}", catalog.get("IT-3").describe());
    println!("[지식] {}", catalog.get("IT-4").describe());

    let fs = catalog.add_equipment_type("ET-FS", "소방설비");
    catalog.get_mut("IT-4").allow(fs.clone());
    println!("[지식] 설비 종류 ET-FS 소방설비 · 점검 종류 IT-4 의 허용 설비 종류에 ET-FS 를 더함 -> {}",
             labels(&catalog.get("IT-4").allowed));
    println!("[운영] 설비 {}", log.add("FS-01", "소방설비", &fs));

    println!("{}", log.record(&catalog, "INS-3", "EV-01", "IT-3", "2026-04-02",
                              Reading::new(7, "s")).expect("기록됨"));
    println!("{}", log.record(&catalog, "INS-4", "BL-01", "IT-4", "2026-04-02",
                              Reading::new(1, "개")).expect("기록됨"));
    println!("{}", log.record(&catalog, "INS-5", "FS-01", "IT-4", "2026-04-02",
                              Reading::new(0, "개")).expect("기록됨"));

    let before = catalog.get("IT-1").range.clone();
    catalog.get_mut("IT-1").narrow_to(NormalRange::new(0, 40));
    println!("[지식] 점검 종류 IT-1 의 정상 범위를 {} 에서 {} 으로 좁힘", before, catalog.get("IT-1").range);
    println!("INS-1 판정 그대로: {}", log.verdict_of("INS-1"));
    println!("{}", log.record(&catalog, "INS-6", "EV-01", "IT-1", "2026-04-03",
                              Reading::new(48, "mm")).expect("기록됨"));

    println!("점검 {}건 · 점검 종류 {}개 · 설비 종류 {}개 · 설비 {}대", log.inspections.len(),
             catalog.inspection_types.len(), catalog.equipment_types.len(), log.equipments.len());
}
