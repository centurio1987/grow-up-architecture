/// 점검 항목. 배점이 바뀔 수 있는 값이라, 견본과 복제본이 같은 것을 가리키면 안 된다.
#[derive(Clone)]
struct CheckItem {
    name: String,
    points: i32,
}

impl CheckItem {
    fn new(name: &str, points: i32) -> CheckItem {
        CheckItem { name: name.to_string(), points }
    }
}

/// Prototype — 자기 자신을 복제하는 연산을 선언한다.
/// `Clone` 을 그대로 쓰지 않는 이유는 구현 해설에 적었다.
trait Checklist {
    fn copy(&self) -> Box<dyn Checklist>;
    fn assign_to(&mut self, equipment_id: &str, date: &str);
    fn redefine(&mut self, label: &str, items: Vec<CheckItem>);
    fn adjust(&mut self, item_name: &str, points: i32);
    fn total_points(&self) -> i32;
    fn render(&self) -> String;
}

/// 두 ConcretePrototype 이 함께 쓰는 상태. 파생된 `Clone` 이 깊은 복사를 한다.
#[derive(Clone)]
struct ChecklistBody {
    label: String,
    items: Vec<CheckItem>,
    equipment_id: String,
    date: String,
}

impl ChecklistBody {
    fn new(label: &str, items: Vec<CheckItem>) -> ChecklistBody {
        ChecklistBody {
            label: label.to_string(),
            items,
            equipment_id: "-".to_string(),
            date: "-".to_string(),
        }
    }

    fn assign_to(&mut self, equipment_id: &str, date: &str) {
        self.equipment_id = equipment_id.to_string();
        self.date = date.to_string();
    }

    fn redefine(&mut self, label: &str, items: Vec<CheckItem>) {
        self.label = label.to_string();
        self.items = items;
    }

    fn adjust(&mut self, item_name: &str, points: i32) {
        for item in self.items.iter_mut() {
            if item.name == item_name {
                item.points = points;
            }
        }
    }

    fn item_points(&self) -> i32 {
        self.items.iter().map(|item| item.points).sum()
    }

    fn item_text(&self) -> String {
        self.items
            .iter()
            .map(|item| format!("{} {}", item.name, item.points))
            .collect::<Vec<String>>()
            .join(" · ")
    }

    fn head(&self) -> String {
        format!("{} {}", self.equipment_id, self.date)
    }
}

/// ConcretePrototype — 일상 점검표. 총점은 항목 배점의 합이다.
struct RoutineChecklist {
    body: ChecklistBody,
}

impl RoutineChecklist {
    fn new(label: &str, items: Vec<CheckItem>) -> RoutineChecklist {
        RoutineChecklist { body: ChecklistBody::new(label, items) }
    }
}

impl Checklist for RoutineChecklist {
    fn copy(&self) -> Box<dyn Checklist> {
        Box::new(RoutineChecklist { body: self.body.clone() })
    }

    fn assign_to(&mut self, equipment_id: &str, date: &str) {
        self.body.assign_to(equipment_id, date);
    }

    fn redefine(&mut self, label: &str, items: Vec<CheckItem>) {
        self.body.redefine(label, items);
    }

    fn adjust(&mut self, item_name: &str, points: i32) {
        self.body.adjust(item_name, points);
    }

    fn total_points(&self) -> i32 {
        self.body.item_points()
    }

    fn render(&self) -> String {
        format!(
            "{} [일상] {} {}점 ({})",
            self.body.head(),
            self.body.label,
            self.total_points(),
            self.body.item_text()
        )
    }
}

/// ConcretePrototype — 법정 안전 점검표. 입회 확인 배점이 항상 더해진다.
struct SafetyChecklist {
    body: ChecklistBody,
}

const WITNESS_POINTS: i32 = 20;

impl SafetyChecklist {
    fn new(label: &str, items: Vec<CheckItem>) -> SafetyChecklist {
        SafetyChecklist { body: ChecklistBody::new(label, items) }
    }
}

impl Checklist for SafetyChecklist {
    fn copy(&self) -> Box<dyn Checklist> {
        Box::new(SafetyChecklist { body: self.body.clone() })
    }

    fn assign_to(&mut self, equipment_id: &str, date: &str) {
        self.body.assign_to(equipment_id, date);
    }

    fn redefine(&mut self, label: &str, items: Vec<CheckItem>) {
        self.body.redefine(label, items);
    }

    fn adjust(&mut self, item_name: &str, points: i32) {
        self.body.adjust(item_name, points);
    }

    fn total_points(&self) -> i32 {
        self.body.item_points() + WITNESS_POINTS
    }

    fn render(&self) -> String {
        format!(
            "{} [법정] {} {}점 ({}) + 입회 확인 {}",
            self.body.head(),
            self.body.label,
            self.total_points(),
            self.body.item_text(),
            WITNESS_POINTS
        )
    }
}

/// PrototypeManager — 키로 견본을 등록·조회하고, 요청이 오면 그 견본의 복제본을 낸다.
struct ChecklistCatalog {
    entries: Vec<(String, Box<dyn Checklist>)>,
}

impl ChecklistCatalog {
    fn new() -> ChecklistCatalog {
        ChecklistCatalog { entries: Vec::new() }
    }

    fn register(&mut self, key: &str, prototype: Box<dyn Checklist>) {
        match self.entries.iter_mut().find(|entry| entry.0 == key) {
            Some(entry) => entry.1 = prototype,
            None => self.entries.push((key.to_string(), prototype)),
        }
    }

    fn unregister(&mut self, key: &str) {
        self.entries.retain(|entry| entry.0 != key);
    }

    fn create(&self, key: &str) -> Box<dyn Checklist> {
        match self.entries.iter().find(|entry| entry.0 == key) {
            Some(entry) => entry.1.copy(),
            None => panic!("등록되지 않은 견본: {}", key),
        }
    }

    fn keys(&self) -> Vec<String> {
        self.entries.iter().map(|entry| entry.0.clone()).collect()
    }
}

// Client — 견본을 등록하고, 복제해 오늘 자 점검표로 초기화한다.
fn main() {
    let mut catalog = ChecklistCatalog::new();
    catalog.register(
        "pump-routine",
        Box::new(RoutineChecklist::new(
            "펌프 일상 점검",
            vec![
                CheckItem::new("윤활유 상태", 30),
                CheckItem::new("진동 측정", 40),
                CheckItem::new("누유 확인", 30),
            ],
        )),
    );
    catalog.register(
        "pump-safety",
        Box::new(SafetyChecklist::new(
            "펌프 법정 안전 점검",
            vec![CheckItem::new("압력 밸브", 40), CheckItem::new("접지 저항", 30)],
        )),
    );

    let mut today = catalog.create("pump-routine");
    today.assign_to("P-12", "2026-03-11");
    println!("오늘 점검표 : {}", today.render());

    let mut safety = catalog.create("pump-safety");
    safety.assign_to("P-12", "2026-03-11");
    println!("오늘 점검표 : {}", safety.render());

    today.adjust("진동 측정", 50);
    println!("복제본 조정 : {}", today.render());
    println!("견본 재복제 : {}", catalog.create("pump-routine").render());

    let mut compressor = catalog.create("pump-routine");
    compressor.redefine(
        "압축기 일상 점검",
        vec![CheckItem::new("필터 차압", 50), CheckItem::new("토출 온도", 30)],
    );
    catalog.register("compressor-routine", compressor);
    println!("새 견본 등록 : compressor-routine ({})", catalog.keys().join(", "));

    let mut today_compressor = catalog.create("compressor-routine");
    today_compressor.assign_to("C-07", "2026-03-11");
    println!("오늘 점검표 : {}", today_compressor.render());
    println!("견본 재복제 : {}", catalog.create("pump-routine").render());

    catalog.unregister("pump-safety");
    println!("견본 해제 : pump-safety ({})", catalog.keys().join(", "));
}
