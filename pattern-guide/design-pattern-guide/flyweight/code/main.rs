use std::collections::HashMap;
use std::rc::Rc;
use std::sync::atomic::{AtomicUsize, Ordering};

static SPECS_CREATED: AtomicUsize = AtomicUsize::new(0);

fn created() -> usize {
    SPECS_CREATED.load(Ordering::Relaxed)
}

trait ItemSpec {
    fn weight_grams(&self, quantity: u32) -> u32;

    fn describe(&self, location: &str, quantity: u32) -> String;
}

struct SharedItemSpec {
    code: String,
    unit_grams: u32,
}

impl SharedItemSpec {
    fn new(code: &str, unit_grams: u32) -> SharedItemSpec {
        SPECS_CREATED.fetch_add(1, Ordering::Relaxed);
        SharedItemSpec { code: code.to_string(), unit_grams }
    }
}

impl ItemSpec for SharedItemSpec {
    fn weight_grams(&self, quantity: u32) -> u32 {
        self.unit_grams * quantity
    }

    fn describe(&self, location: &str, quantity: u32) -> String {
        format!("{} {} x{} {}g", location, self.code, quantity, self.weight_grams(quantity))
    }
}

struct MixedPallet {
    parts: Vec<Rc<dyn ItemSpec>>,
}

impl MixedPallet {
    fn new() -> MixedPallet {
        MixedPallet { parts: Vec::new() }
    }

    fn add(&mut self, part: Rc<dyn ItemSpec>) {
        self.parts.push(part);
    }
}

impl ItemSpec for MixedPallet {
    fn weight_grams(&self, quantity: u32) -> u32 {
        let one_pallet: u32 = self.parts.iter().map(|part| part.weight_grams(1)).sum();
        one_pallet * quantity
    }

    fn describe(&self, location: &str, quantity: u32) -> String {
        format!("{} MIXED x{} {}g", location, quantity, self.weight_grams(quantity))
    }
}

const CODES: [&str; 4] = ["SKU-101", "SKU-204", "SKU-330", "SKU-457"];
const UNIT_GRAMS: [u32; 4] = [300, 850, 40, 120];

fn unit_grams_of(code: &str) -> u32 {
    for i in 0..CODES.len() {
        if CODES[i] == code {
            return UNIT_GRAMS[i];
        }
    }
    panic!("unknown code: {}", code);
}

fn code_at(index: usize) -> &'static str {
    CODES[index % CODES.len()]
}

struct ItemSpecPool {
    pool: HashMap<String, Rc<dyn ItemSpec>>,
}

impl ItemSpecPool {
    fn new() -> ItemSpecPool {
        ItemSpecPool { pool: HashMap::new() }
    }

    fn spec(&mut self, code: &str) -> Rc<dyn ItemSpec> {
        if let Some(found) = self.pool.get(code) {
            return Rc::clone(found);
        }
        let made: Rc<dyn ItemSpec> = Rc::new(SharedItemSpec::new(code, unit_grams_of(code)));
        self.pool.insert(code.to_string(), Rc::clone(&made));
        made
    }
}

struct Slot {
    location: String,
    quantity: u32,
    spec: Rc<dyn ItemSpec>,
}

impl Slot {
    fn new(location: &str, quantity: u32, spec: Rc<dyn ItemSpec>) -> Slot {
        Slot { location: location.to_string(), quantity, spec }
    }

    fn weight_grams(&self) -> u32 {
        self.spec.weight_grams(self.quantity)
    }

    fn describe(&self) -> String {
        self.spec.describe(&self.location, self.quantity)
    }
}

fn total_grams(sheet: &[Slot]) -> u32 {
    sheet.iter().map(|slot| slot.weight_grams()).sum()
}

fn location_at(index: usize) -> String {
    format!("D-{}-{}", index / 24 + 1, index % 24 + 1)
}

fn count_direct(slots: usize) -> String {
    let before = created();
    let mut sheet: Vec<Slot> = Vec::new();
    for i in 0..slots {
        let code = code_at(i);
        let own: Rc<dyn ItemSpec> = Rc::new(SharedItemSpec::new(code, unit_grams_of(code)));
        sheet.push(Slot::new(&location_at(i), (i % 9) as u32 + 1, own));
    }
    format!(
        "direct: slots={} spec-objects={} total={}g",
        sheet.len(),
        created() - before,
        total_grams(&sheet)
    )
}

fn count_pooled(slots: usize) -> String {
    let before = created();
    let mut pool = ItemSpecPool::new();
    let mut sheet: Vec<Slot> = Vec::new();
    for i in 0..slots {
        let spec = pool.spec(code_at(i));
        sheet.push(Slot::new(&location_at(i), (i % 9) as u32 + 1, spec));
    }
    format!(
        "pooled: slots={} spec-objects={} total={}g",
        sheet.len(),
        created() - before,
        total_grams(&sheet)
    )
}

fn main() {
    let mut pool = ItemSpecPool::new();
    let first = Slot::new("A-01-1", 12, pool.spec("SKU-101"));
    let second = Slot::new("A-01-2", 5, pool.spec("SKU-101"));
    let third = Slot::new("B-03-4", 2, pool.spec("SKU-204"));
    println!("{}", first.describe());
    println!("{}", second.describe());
    println!("{}", third.describe());
    println!("same-spec A-01-1,A-01-2 = {}", Rc::ptr_eq(&first.spec, &second.spec));
    println!("same-spec A-01-1,B-03-4 = {}", Rc::ptr_eq(&first.spec, &third.spec));

    let mut pallet = MixedPallet::new();
    pallet.add(pool.spec("SKU-330"));
    pallet.add(pool.spec("SKU-457"));
    println!("{}", Slot::new("C-09-2", 7, Rc::new(pallet)).describe());

    println!("{}", count_direct(1200));
    println!("{}", count_pooled(1200));
}
