use std::cmp::Reverse;
use std::collections::{BTreeMap, BTreeSet, BinaryHeap, HashMap};

#[derive(PartialEq, Clone, Copy)] enum Mode { Guide, Lock }
#[derive(PartialEq, Eq, PartialOrd, Ord)] enum Kind { Update, Ask, Look, Offer, Reply, Timeout, Down, Failover }
#[derive(PartialEq, Eq, PartialOrd, Ord)] struct Ev { at: i64, seq: u64, kind: Kind, a: usize, b: usize }
#[derive(Clone)] struct Ask { at: i64, who: Option<&'static str>, key: String, x: i64, y: i64 }
#[derive(Default)] struct VirtualClock { queue: BinaryHeap<Reverse<Ev>>, seq: u64 }
impl VirtualClock {
    fn schedule(&mut self, at: i64, kind: Kind, a: usize, b: usize) {
        self.queue.push(Reverse(Ev { at, seq: self.seq, kind, a, b }));
        self.seq += 1;
    }
    fn next(&mut self) -> Option<Ev> { self.queue.pop().map(|Reverse(e)| e) }
}
struct Req { id: usize, ask: Ask, end_at: i64, near: i64, tried: Vec<usize>, drivers: Vec<usize>, cands: Vec<usize> }
impl Req {
    fn received(&self) -> i64 { self.ask.at }
    fn loud(&self) -> bool { self.ask.who.map_or(false, |w| w != "seoyun") }
}

const IDLE: usize = 0;
const OFFERED: usize = 1;
const ON_TRIP: usize = 2;
const NODES: usize = 3;
const POINTS: usize = 8;
const SIDE: i64 = 8_000;
const CELL: i64 = 1_000;
const RADIUS: i64 = 1_000;
const RING: i64 = (RADIUS + CELL - 1) / CELL;
const EVERY: i64 = 5_000;
const STALE: i64 = 30_000;
const ACCEPT: i64 = 15_000;
const MATCH: i64 = 60_000;
const LAST_OFFER: i64 = MATCH - ACCEPT;
const AGAIN: i64 = 5_000;
const FAILOVER_AT: i64 = 101_050;
const LOST: i64 = 1_000;
const DOWN_AT: i64 = 230_000;
const UNTIL: i64 = 260_000;
const NAME: [&str; 20] = ["d01", "d02", "s01", "s02", "s03", "s04", "s05", "s06", "s07", "s08", "s09", "s10",
    "s11", "s12", "o01", "d20", "d21", "d22", "d23", "d24"];
const DRIVER: [[i64; 4]; 20] = [ // x, y, answers this many ms after an offer comes (-1 never), the app sends until
    [3900, 2950, 3000, UNTIL], [2950, 2500, 3000, UNTIL], [5650, 5500, 2000, UNTIL], [5300, 5650, 2250, UNTIL],
    [5500, 5180, 2500, UNTIL], [5880, 5800, 2750, UNTIL], [4900, 5450, 2000, UNTIL], [5450, 6100, 2250, UNTIL],
    [6150, 5350, 2500, UNTIL], [5100, 4950, 2750, UNTIL], [4800, 6000, 2000, UNTIL], [6200, 6000, 2250, UNTIL],
    [6250, 4900, 2500, UNTIL], [4750, 4850, 2750, UNTIL], [1800, 6200, 2000, UNTIL], [6700, 1600, 16_000, UNTIL],
    [6200, 1100, 3000, UNTIL], [6450, 1450, 3000, 170_000], [2700, 800, 2000, UNTIL], [2100, 200, 2000, UNTIL]];

struct RideHailingDispatch { mode: Mode, clock: VirtualClock, asks: Vec<Ask>, reqs: Vec<Req>, keys: HashMap<String, usize>, locks: HashMap<usize, [i64; 3]>,
    nodes: Vec<BTreeMap<i64, BTreeMap<usize, i64>>>, stopped: usize, state: [usize; 20], req: [i64; 20], screen: [i64; 20], rides: [usize; 20],
    until: [i64; 20], reads: [i64; NODES], writes: [i64; NODES], twice: BTreeSet<usize>, notes: [Vec<String>; 3] }

fn hash(v: u32) -> u32 {
    let h = (v ^ (v >> 16)).wrapping_mul(0x85eb_ca6b);
    let h = (h ^ (h >> 13)).wrapping_mul(0xc2b2_ae35);
    h ^ (h >> 16)
}
fn rush(t: i64) -> bool { t >= 100_000 && t < 150_000 }

impl RideHailingDispatch {
    fn new(mode: Mode) -> Self {
        let notes = [
            vec!["-- scenario 1: minji asks for a ride at 60000ms, nothing else is going on --".to_string()],
            vec!["-- scenario 2: a concert ends, 20 requests from the stadium in 1800ms, 12 free drivers around it --".to_string()],
            vec!["-- scenario 3: d20 does not answer, d22's app went quiet, index node 1 stops, junho's app sends one request twice --".to_string()]];
        let mut s = RideHailingDispatch { mode, clock: VirtualClock::default(), asks: Vec::new(), reqs: Vec::new(), keys: HashMap::new(), locks: HashMap::new(),
            nodes: vec![BTreeMap::new(), BTreeMap::new(), BTreeMap::new()], stopped: usize::MAX, state: [IDLE; 20], req: [-1; 20], screen: [-1; 20], rides: [0; 20],
            until: [0; 20], reads: [0; NODES], writes: [0; NODES], twice: BTreeSet::new(), notes };
        let ask = |at: i64, who: Option<&'static str>, key: String, x: i64, y: i64| Ask { at, who, key, x, y };
        s.asks.push(ask(60_000, Some("minji"), "k-minji".to_string(), 3400, 2500));
        for i in 0..20 { s.asks.push(ask(100_000 + 100 * (i - 1).max(0), None, format!("k-s{}", i), 5500, 5500)); }
        s.asks.push(ask(101_900, Some("seoyun"), "k-seoyun".to_string(), 1500, 6500));
        s.asks.push(ask(205_000, Some("dana"), "k-dana".to_string(), 6500, 1500));
        s.asks.push(ask(231_000, Some("junho"), "k-junho".to_string(), 2500, 500));
        s.asks.push(ask(231_500, Some("junho"), "k-junho".to_string(), 2500, 500));
        for d in 0..DRIVER.len() { s.clock.schedule(250 * d as i64, Kind::Update, d, 0); }
        for i in 0..s.asks.len() { s.clock.schedule(s.asks[i].at, Kind::Ask, i, 0); }
        s.clock.schedule(FAILOVER_AT, Kind::Failover, 0, 0);
        s.clock.schedule(DOWN_AT, Kind::Down, 1, 0);
        s
    }

    fn owner(&self, cell: i64, skip: usize) -> usize {
        let (mut best, mut node) = (u64::MAX, usize::MAX);
        for k in 0..NODES * POINTS {
            let gap = hash((10_000 + k / POINTS * 100 + k % POINTS) as u32).wrapping_sub(hash(cell as u32)) as u64;
            if k / POINTS == skip || k / POINTS == self.stopped || gap >= best { continue; }
            best = gap;
            node = k / POINTS;
        }
        node
    }

    fn dist2(&self, q: usize, d: usize) -> i64 { (DRIVER[d][0] - self.reqs[q].ask.x).pow(2) + (DRIVER[d][1] - self.reqs[q].ask.y).pow(2) }
    fn away(&self, q: usize, d: usize) -> String { format!("{} {}m in cell {}:{}", NAME[d], (self.dist2(q, d) as f64).sqrt() as i64, DRIVER[d][0] / CELL, DRIVER[d][1] / CELL) }
    fn note(&mut self, t: i64, what: String) { self.notes[if t < 100_000 { 0 } else if t < 200_000 { 1 } else { 2 }].push(format!("t={}ms {}", t, what)); }

    fn free(&self, d: usize, t: i64) -> bool {
        let l = self.locks.get(&d);
        if self.mode == Mode::Lock { return self.state[d] != ON_TRIP && l.map_or(true, |l| l[1] <= t); }
        self.state[d] == IDLE || self.state[d] == OFFERED && self.until[d] <= t
    }

    fn handle(&mut self, e: Ev) {
        let t = e.at;
        match e.kind {
            Kind::Update => self.update(e.a, t),
            Kind::Ask => self.ask(e.a, t),
            Kind::Look => self.look(e.a, t),
            Kind::Offer => self.offer(e.a, t),
            Kind::Reply => self.reply(e.a, e.b, t),
            Kind::Timeout => self.timeout(e.a, e.b, t),
            Kind::Down => self.down(e.a, t),
            Kind::Failover => if self.mode == Mode::Lock { self.locks.retain(|_, l| l[2] < t - LOST) },
        }
    }

    fn update(&mut self, d: usize, t: i64) {
        let cell = DRIVER[d][0] / CELL * 100 + DRIVER[d][1] / CELL;
        let node = self.owner(cell, usize::MAX);
        self.nodes[node].entry(cell).or_default().insert(d, t);
        if rush(t) && d >= 2 && d < 14 { self.writes[node] += 1; }
        if t + EVERY < DRIVER[d][3] { self.clock.schedule(t + EVERY, Kind::Update, d, 0); }
    }

    fn ask(&mut self, i: usize, t: i64) {
        let a = self.asks[i].clone();
        if let Some(&seen) = self.keys.get(&a.key) {
            self.note(t, format!("{}: the app sends key {} again, the request record returns r{}, no second request", a.who.unwrap(), a.key, seen));
            return;
        }
        let q = self.reqs.len();
        self.keys.insert(a.key.clone(), q);
        self.reqs.push(Req { id: q, ask: a, end_at: 0, near: -1, tried: Vec::new(), drivers: Vec::new(), cands: Vec::new() });
        self.look(q, t);
    }

    fn look(&mut self, q: usize, t: i64) {
        let (cx, cy, who) = (self.reqs[q].ask.x / CELL, self.reqs[q].ask.y / CELL, self.reqs[q].ask.who);
        let (mut found, mut quiet) = (Vec::new(), String::new());
        for i in cx - RING..=cx + RING {
            for j in cy - RING..=cy + RING {
                if i < 0 || j < 0 || i >= SIDE / CELL || j >= SIDE / CELL { continue; }
                let node = self.owner(i * 100 + j, usize::MAX);
                if rush(t) && who.is_none() { self.reads[node] += 1; }
                let held: Vec<(usize, i64)> = self.nodes[node].get(&(i * 100 + j)).map_or(Vec::new(), |m| m.iter().map(|(&d, &at)| (d, at)).collect());
                for (d, at) in held {
                    if t - at <= STALE { found.push(d); }
                    else { quiet += &format!("; {} is left out, its last location is {}ms old", self.away(q, d), t - at); }
                }
            }
        }
        found.retain(|&d| !self.reqs[q].tried.contains(&d) && self.free(d, t));
        found.sort_by_key(|&d| (self.dist2(q, d), d));
        let again = found.is_empty() && t + AGAIN - self.reqs[q].received() <= LAST_OFFER;
        let head = if t == self.reqs[q].received() { format!("request r{} is recorded in cell {}:{}, ", q, cx, cy) } else { String::new() };
        let list = if found.is_empty() { String::new() } else { format!(" ({})", found.iter().map(|&d| self.away(q, d)).collect::<Vec<_>>().join(", ")) };
        let tail = if again { format!(", looks again at {}ms", t + AGAIN) } else { String::new() };
        if self.reqs[q].loud() { self.note(t, format!("{}: {}free drivers in the cells around: {}{}{}{}", who.unwrap(), head, found.len(), list, quiet, tail)); }
        let any = !found.is_empty();
        self.reqs[q].cands = found;
        if any { self.clock.schedule(t, Kind::Offer, q, 0); }
        else if again { self.clock.schedule(t + AGAIN, Kind::Look, q, 0); }
        else { self.fail(q, t); }
    }

    fn hold(&mut self, d: usize, r: usize, t: i64) -> i64 {
        let l = self.locks.get(&d).copied();
        if self.mode == Mode::Lock && l.map_or(false, |l| l[1] > t) { return 0; }
        if self.mode == Mode::Lock { self.locks.insert(d, [r as i64, t + ACCEPT, t]); }
        if self.mode == Mode::Lock { return 1; }
        if self.state[d] != IDLE && !(self.state[d] == OFFERED && self.until[d] <= t) { return 0; }
        self.state[d] = OFFERED;
        self.req[d] = r as i64;
        self.until[d] = t + ACCEPT;
        1
    }

    fn accept(&mut self, d: usize, r: usize, t: i64) -> i64 {
        if self.mode == Mode::Guide && !(self.state[d] == OFFERED && self.req[d] == r as i64 && self.until[d] > t) { return 0; }
        self.state[d] = ON_TRIP;
        self.req[d] = r as i64;
        1
    }

    fn withdraw(&mut self, d: usize, r: usize) -> i64 {
        if self.mode == Mode::Lock && self.locks.get(&d).map_or(false, |l| l[0] == r as i64) { self.locks.remove(&d); }
        if self.mode == Mode::Lock || self.state[d] != OFFERED || self.req[d] != r as i64 { return 0; }
        self.state[d] = IDLE;
        self.req[d] = -1;
        1
    }

    fn offer(&mut self, q: usize, t: i64) {
        let mut raced = String::new();
        for d in self.reqs[q].cands.clone() {
            let changed = self.hold(d, q, t);
            if changed == 0 { raced = format!("r{} and r{} both read {} as free, r{}'s write changed 1 row, r{}'s write changed 0 rows, ", self.req[d], q, NAME[d], self.req[d], q); }
            if changed == 0 { continue; }
            if self.screen[d] >= 0 && d >= 2 && d < 14 { self.twice.insert(d); }
            self.screen[d] = q as i64;
            self.reqs[q].tried.push(d);
            if DRIVER[d][2] >= 0 && t < DRIVER[d][3] { self.clock.schedule(t + DRIVER[d][2], Kind::Reply, d, q); }
            self.clock.schedule(t + ACCEPT, Kind::Timeout, q, d);
            if self.reqs[q].loud() || !raced.is_empty() { self.note(t, format!("dispatch: {}offers r{} to {}, the write changed 1 row (free -> offered until {}ms)", raced, q, NAME[d], t + ACCEPT)); }
            return;
        }
        self.look(q, t);
    }

    fn reply(&mut self, d: usize, q: usize, t: i64) {
        if self.screen[d] == q as i64 { self.screen[d] = -1; }
        let changed = self.accept(d, q, t);
        if changed == 0 && self.reqs[q].loud() { self.note(t, format!("{}: accepts r{} late, the write changed 0 rows ({} is no longer offered r{}), no ride", NAME[d], q, NAME[d], q)); }
        if changed == 0 { return; }
        self.reqs[q].drivers.push(d);
        self.rides[d] += 1;
        if self.reqs[q].drivers.len() == 1 { self.reqs[q].end_at = t; }
        let after = t - self.reqs[q].received();
        if self.reqs[q].loud() { self.note(t, format!("{}: accepts r{}, the write changed 1 row (offered -> on a trip), assigned {}ms after the request was received", NAME[d], q, after)); }
    }

    fn timeout(&mut self, q: usize, d: usize, t: i64) {
        if self.screen[d] == q as i64 { self.screen[d] = -1; }
        if !self.reqs[q].drivers.is_empty() { return; }
        let changed = self.withdraw(d, q);
        if self.reqs[q].loud() { self.note(t, format!("dispatch: {} did not answer in {}ms, withdrawing the offer of r{} changed {} row (offered -> free)", NAME[d], ACCEPT, q, changed)); }
        if t - self.reqs[q].received() > LAST_OFFER { self.fail(q, t); }
        else { self.look(q, t); }
    }

    fn fail(&mut self, q: usize, t: i64) {
        let near = (0..DRIVER.len()).filter(|&d| t < DRIVER[d][3] && self.free(d, t) && self.dist2(q, d) <= RADIUS * RADIUS).count();
        self.reqs[q].end_at = t;
        self.reqs[q].near = near as i64;
        let (who, after) = (self.reqs[q].ask.who, t - self.reqs[q].received());
        if self.reqs[q].loud() { self.note(t, format!("{}: told no driver {}ms after the request was received", who.unwrap(), after)); }
    }

    fn down(&mut self, node: usize, t: i64) {
        let mut to = [0; NODES];
        for c in (0..SIDE / CELL * 100).filter(|&c| c % 100 < SIDE / CELL && self.owner(c, usize::MAX) == node) { to[self.owner(c, node)] += 1; }
        self.stopped = node;
        self.nodes[node].clear();
        let moved = to[0] + to[1] + to[2];
        self.note(t, format!("index node {}: stops and loses what it held, its {} cells move on the ring ({} to node 0, {} to node 2), the other {} cells stay", node, moved, to[0], to[2], SIDE / CELL * (SIDE / CELL) - moved));
    }

    fn rush_line(&self) -> String {
        let (mut asked, mut assigned, mut told, mut near, mut worst, mut told_at) = (0, 0, 0, 0, 0, 0);
        for q in self.reqs.iter().filter(|q| q.ask.who.is_none()) {
            asked += 1;
            if !q.drivers.is_empty() { assigned += 1; }
            if !q.drivers.is_empty() { worst = worst.max(q.end_at - q.received()); }
            if q.near < 0 { continue; }
            told += 1;
            told_at = told_at.max(q.end_at - q.received());
            near = near.max(q.near);
        }
        let two = (2..14).filter(|&d| self.rides[d] >= 2).count();
        let lost = if self.mode == Mode::Lock { format!(" (the lock store fails over at {}ms and loses the locks taken in the last {}ms)", FAILOVER_AT, LOST) } else { String::new() };
        let fails = if told == 0 { String::new() } else { format!(" {}ms after it was received with {} free drivers within {}m", told_at, near, RADIUS) };
        format!("{}{}: {} asked at the stadium, {} assigned at most {}ms after the request was received, {} told no driver{}, {} drivers had two offers at once, {} drivers went to two riders",
            if self.mode == Mode::Guide { "guide" } else { "lock" }, lost, asked, assigned, worst, told, fails, self.twice.len(), two)
    }

    fn who(&self, name: &str) -> &Req { self.reqs.iter().find(|q| q.ask.who == Some(name)).unwrap() }

    fn run(mode: Mode) -> Self {
        let mut s = RideHailingDispatch::new(mode);
        while let Some(e) = s.clock.next().filter(|e| e.at <= UNTIL) { s.handle(e); }
        s
    }
}

fn main() {
    let (mut g, l) = (RideHailingDispatch::run(Mode::Guide), RideHailingDispatch::run(Mode::Lock));
    let (seoyun, dana) = (g.who("seoyun"), l.who("dana"));
    let seoyun_line = format!("seoyun: r{} far from the stadium during the rush, assigned to {} {}ms after the request was received", seoyun.id, NAME[seoyun.drivers[0]], seoyun.end_at - seoyun.received());
    let names = dana.drivers.iter().map(|&d| NAME[d]).collect::<Vec<_>>().join(", ");
    let dana_line = format!("lock: dana's r{} gets {} drivers ({}), d20's late accept is written too", dana.id, dana.drivers.len(), names);
    let index = format!("index: each search reads {} cells, in the rush the stadium searches read node 0 · 1 · 2 {} · {} · {} times and the stadium drivers wrote {} · {} · {} locations to them",
        (2 * RING + 1) * (2 * RING + 1), g.reads[0], g.reads[1], g.reads[2], g.writes[0], g.writes[1], g.writes[2]);
    let lines = [g.rush_line(), index, l.rush_line(), seoyun_line];
    g.notes[1].extend(lines);
    g.notes[2].push(dana_line);
    for line in g.notes.iter().flatten() { println!("{}", line); }
}
