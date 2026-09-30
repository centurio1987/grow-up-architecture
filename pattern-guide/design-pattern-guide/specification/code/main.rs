use std::rc::Rc;

// ── 후보 객체 ────────────────────────────────────────────────────────────────
struct Container {
    id: String,
    lowest_temp_c: i32,
    food_safe: bool,
    humidity_percent: i32,
    sealed: bool,
}

impl Container {
    fn new(id: &str, lowest_temp_c: i32, food_safe: bool, humidity_percent: i32, sealed: bool) -> Container {
        Container {
            id: id.to_string(),
            lowest_temp_c,
            food_safe,
            humidity_percent,
            sealed,
        }
    }
}

// ── 명세 공통 타입 ───────────────────────────────────────────────────────────
trait ContainerSpec {
    fn is_satisfied_by(&self, candidate: &Container) -> bool;
}

type Spec = Rc<dyn ContainerSpec>;

// ── 잎 명세 ──────────────────────────────────────────────────────────────────
struct TempAtMost {
    limit_c: i32,
}

impl ContainerSpec for TempAtMost {
    fn is_satisfied_by(&self, candidate: &Container) -> bool {
        candidate.lowest_temp_c <= self.limit_c
    }
}

struct HumidityAtMost {
    limit_percent: i32,
}

impl ContainerSpec for HumidityAtMost {
    fn is_satisfied_by(&self, candidate: &Container) -> bool {
        candidate.humidity_percent <= self.limit_percent
    }
}

struct FoodSafe;

impl ContainerSpec for FoodSafe {
    fn is_satisfied_by(&self, candidate: &Container) -> bool {
        candidate.food_safe
    }
}

struct Sealed;

impl ContainerSpec for Sealed {
    fn is_satisfied_by(&self, candidate: &Container) -> bool {
        candidate.sealed
    }
}

// ── 조합 명세 ────────────────────────────────────────────────────────────────
struct AndSpec {
    left: Spec,
    right: Spec,
}

impl ContainerSpec for AndSpec {
    fn is_satisfied_by(&self, candidate: &Container) -> bool {
        self.left.is_satisfied_by(candidate) && self.right.is_satisfied_by(candidate)
    }
}

struct OrSpec {
    left: Spec,
    right: Spec,
}

impl ContainerSpec for OrSpec {
    fn is_satisfied_by(&self, candidate: &Container) -> bool {
        self.left.is_satisfied_by(candidate) || self.right.is_satisfied_by(candidate)
    }
}

struct NotSpec {
    inner: Spec,
}

impl ContainerSpec for NotSpec {
    fn is_satisfied_by(&self, candidate: &Container) -> bool {
        !self.inner.is_satisfied_by(candidate)
    }
}

fn and(left: Spec, right: Spec) -> Spec {
    Rc::new(AndSpec { left, right })
}

fn or(left: Spec, right: Spec) -> Spec {
    Rc::new(OrSpec { left, right })
}

fn not(inner: Spec) -> Spec {
    Rc::new(NotSpec { inner })
}

// ── 명세를 보유한 도메인 객체 ────────────────────────────────────────────────
struct Cargo {
    id: String,
    goods: String,
    storage_spec: Spec,
}

impl Cargo {
    fn new(id: &str, goods: &str, storage_spec: Spec) -> Cargo {
        Cargo {
            id: id.to_string(),
            goods: goods.to_string(),
            storage_spec,
        }
    }

    fn fits(&self, candidate: &Container) -> bool {
        self.storage_spec.is_satisfied_by(candidate)
    }
}

// ── 명세로 후보를 거르는 쪽 ──────────────────────────────────────────────────
struct ContainerYard {
    containers: Vec<Container>,
}

impl ContainerYard {
    fn matching(&self, spec: &Spec) -> Vec<&Container> {
        let mut found: Vec<&Container> = Vec::new();
        for candidate in &self.containers {
            if spec.is_satisfied_by(candidate) {
                found.push(candidate);
            }
        }
        found
    }
}

fn ids(containers: &[&Container]) -> String {
    if containers.is_empty() {
        return "none".to_string();
    }
    let mut names: Vec<String> = Vec::new();
    for candidate in containers {
        names.push(candidate.id.clone());
    }
    names.join(", ")
}

// ── Client ───────────────────────────────────────────────────────────────────
fn main() {
    let yard = ContainerYard {
        containers: vec![
            Container::new("REEFER-01", -18, true, 55, false),
            Container::new("REEFER-02", -18, false, 60, false),
            Container::new("DRYBOX-11", 4, true, 70, true),
            Container::new("REEFER-03", -20, true, 72, false),
        ],
    };

    let meat = Cargo::new(
        "CG-5521",
        "frozen meat",
        and(Rc::new(TempAtMost { limit_c: -4 }), Rc::new(FoodSafe)),
    );

    let mut line = 1;
    for candidate in &yard.containers {
        let verdict = if meat.fits(candidate) { "accepted" } else { "rejected" };
        println!("{}) validate {} -> {} : {}", line, meat.id, candidate.id, verdict);
        line += 1;
    }
    println!("{}) select {} : {}", line, meat.id, ids(&yard.matching(&meat.storage_spec)));
    line += 1;

    let meat_v2 = Cargo::new(
        &meat.id,
        &meat.goods,
        and(Rc::clone(&meat.storage_spec), Rc::new(HumidityAtMost { limit_percent: 60 })),
    );
    println!(
        "{}) select {} with humidity rule : {}",
        line,
        meat_v2.id,
        ids(&yard.matching(&meat_v2.storage_spec))
    );
    line += 1;

    let flowers = Cargo::new(
        "CG-7702",
        "fresh flowers",
        and(Rc::new(TempAtMost { limit_c: 8 }), not(Rc::new(Sealed))),
    );
    println!("{}) select {} : {}", line, flowers.id, ids(&yard.matching(&flowers.storage_spec)));
    line += 1;

    let dried_food = Cargo::new(
        "CG-9033",
        "dried food",
        or(Rc::new(HumidityAtMost { limit_percent: 60 }), Rc::new(Sealed)),
    );
    println!("{}) select {} : {}", line, dried_food.id, ids(&yard.matching(&dried_food.storage_spec)));
}
