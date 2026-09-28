#[derive(Clone, Copy)]
struct ScanRecord {
    id: &'static str,
    count: u64,
}

trait ScanCursor {
    fn has_next(&self) -> bool;
    fn next(&mut self) -> ScanRecord;
}

trait ScanArchive {
    fn oldest_first(&self) -> Box<dyn ScanCursor + '_>;

    fn total_count(&self) -> u64 {
        let mut sum = 0;
        let mut cursor = self.oldest_first();
        while cursor.has_next() {
            sum += cursor.next().count;
        }
        sum
    }
}

struct RingScanLog {
    slots: Vec<Option<ScanRecord>>,
    written: usize,
}

impl RingScanLog {
    fn new(capacity: usize) -> Self {
        RingScanLog { slots: vec![None; capacity], written: 0 }
    }

    fn add(&mut self, record: ScanRecord) {
        let at = self.written % self.slots.len();
        self.slots[at] = Some(record);
        self.written += 1;
    }

    fn size(&self) -> usize {
        self.written.min(self.slots.len())
    }

    fn at(&self, logical: usize) -> ScanRecord {
        let start = if self.written <= self.slots.len() {
            0
        } else {
            self.written % self.slots.len()
        };
        self.slots[(start + logical) % self.slots.len()].expect("empty slot")
    }

    fn newest_first(&self) -> Box<dyn ScanCursor + '_> {
        Box::new(NewestFirst { log: self, step: 0 })
    }
}

impl ScanArchive for RingScanLog {
    fn oldest_first(&self) -> Box<dyn ScanCursor + '_> {
        Box::new(OldestFirst { log: self, step: 0 })
    }
}

struct OldestFirst<'a> {
    log: &'a RingScanLog,
    step: usize,
}

impl ScanCursor for OldestFirst<'_> {
    fn has_next(&self) -> bool {
        self.step < self.log.size()
    }

    fn next(&mut self) -> ScanRecord {
        let record = self.log.at(self.step);
        self.step += 1;
        record
    }
}

struct NewestFirst<'a> {
    log: &'a RingScanLog,
    step: usize,
}

impl ScanCursor for NewestFirst<'_> {
    fn has_next(&self) -> bool {
        self.step < self.log.size()
    }

    fn next(&mut self) -> ScanRecord {
        let record = self.log.at(self.log.size() - 1 - self.step);
        self.step += 1;
        record
    }
}

struct ChainNode {
    record: ScanRecord,
    next: Option<Box<ChainNode>>,
}

impl ChainNode {
    fn append(&mut self, record: ScanRecord) {
        match &mut self.next {
            Some(next) => next.append(record),
            None => self.next = Some(Box::new(ChainNode { record, next: None })),
        }
    }
}

struct ChainScanLog {
    head: Option<Box<ChainNode>>,
}

impl ChainScanLog {
    fn new() -> Self {
        ChainScanLog { head: None }
    }

    fn add(&mut self, record: ScanRecord) {
        match &mut self.head {
            Some(head) => head.append(record),
            None => self.head = Some(Box::new(ChainNode { record, next: None })),
        }
    }
}

impl ScanArchive for ChainScanLog {
    fn oldest_first(&self) -> Box<dyn ScanCursor + '_> {
        Box::new(FromHead { at: self.head.as_deref() })
    }
}

struct FromHead<'a> {
    at: Option<&'a ChainNode>,
}

impl ScanCursor for FromHead<'_> {
    fn has_next(&self) -> bool {
        self.at.is_some()
    }

    fn next(&mut self) -> ScanRecord {
        let node = self.at.expect("no node");
        self.at = node.next.as_deref();
        node.record
    }
}

fn walk(cursor: &mut dyn ScanCursor) -> String {
    let mut ids: Vec<&str> = Vec::new();
    while cursor.has_next() {
        ids.push(cursor.next().id);
    }
    ids.join(" ")
}

fn pair(left: &mut dyn ScanCursor, right: &mut dyn ScanCursor) -> String {
    let mut pairs: Vec<String> = Vec::new();
    while left.has_next() && right.has_next() {
        pairs.push(format!("{}/{}", left.next().id, right.next().id));
    }
    pairs.join(" ")
}

fn main() {
    let feed = [
        ScanRecord { id: "SCN-01", count: 12 },
        ScanRecord { id: "SCN-02", count: 30 },
        ScanRecord { id: "SCN-03", count: 7 },
        ScanRecord { id: "SCN-04", count: 21 },
        ScanRecord { id: "SCN-05", count: 9 },
        ScanRecord { id: "SCN-06", count: 15 },
        ScanRecord { id: "SCN-07", count: 4 },
    ];

    let mut ring = RingScanLog::new(5);
    let mut chain = ChainScanLog::new();
    for record in feed {
        ring.add(record);
        chain.add(record);
    }

    println!("ring oldest-first: {}", walk(&mut *ring.oldest_first()));
    println!("ring newest-first: {}", walk(&mut *ring.newest_first()));
    println!("ring paired: {}", pair(&mut *ring.oldest_first(), &mut *ring.newest_first()));
    println!("chain oldest-first: {}", walk(&mut *chain.oldest_first()));
    println!("total: ring={} chain={}", ring.total_count(), chain.total_count());
}
