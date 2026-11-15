use std::cmp::Reverse;
use std::collections::{BTreeMap, BinaryHeap};

#[derive(Default)]
struct Rng { x: u32 }

impl Rng {
    fn below(&mut self, n: u32) -> u32 {
        self.x ^= self.x << 13;
        self.x ^= self.x >> 17;
        self.x ^= self.x << 5;
        self.x % n
    }
}

#[derive(PartialEq, Eq, PartialOrd, Ord)]
enum Kind { Join, Beat, Close, Pause, Report, Tick, Stop, Reconnect }

#[derive(PartialEq, Eq, PartialOrd, Ord)]
struct Ev { at: i64, seq: u64, kind: Kind, arg: usize }

#[derive(Default)]
struct VirtualClock { queue: BinaryHeap<Reverse<Ev>>, seq: u64 }

impl VirtualClock {
    fn schedule(&mut self, at: i64, kind: Kind, arg: usize) {
        self.queue.push(Reverse(Ev { at, seq: self.seq, kind, arg }));
        self.seq += 1;
    }

    fn next_before(&mut self, limit: i64) -> Option<Ev> {
        let ready = self.queue.peek().is_some_and(|Reverse(e)| e.at < limit);
        if ready { self.queue.pop().map(|Reverse(e)| e) } else { None }
    }
}

const TTL_MS: i64 = 45_000;
const STALE_MS: i64 = 3_000;
const NEVER: i64 = i64::MIN / 2;
const HEARTBEAT_MS: i64 = 20_000;
const RETRY_MAX_MS: u32 = 8_000;
const VIEWERS: usize = 4_201;

struct EdgeServer { name: &'static str, last_signal: BTreeMap<usize, i64>, alive: bool, shown: i64 }

impl EdgeServer {
    fn new(name: &'static str) -> Self {
        EdgeServer { name, last_signal: BTreeMap::new(), alive: true, shown: 0 }
    }

    fn open(&mut self, conn: usize) {
        self.last_signal.insert(conn, NEVER);
    }

    fn signal(&mut self, conn: usize, now: i64) {
        if let Some(t) = self.last_signal.get_mut(&conn) { *t = now; }
    }

    fn close(&mut self, conn: usize) {
        self.last_signal.remove(&conn);
    }

    fn active_count(&self, now: i64) -> i64 {
        self.last_signal.values().filter(|&&t| now - t <= TTL_MS).count() as i64
    }

    fn push(&mut self, total: i64) -> i64 {
        self.shown = total;
        self.last_signal.len() as i64
    }

    fn stop(&mut self) -> Vec<usize> {
        self.alive = false;
        let dropped: Vec<usize> = self.last_signal.keys().copied().collect();
        self.last_signal.clear();
        dropped
    }
}

#[derive(Default)]
struct Aggregator { count: Vec<i64>, reported_at: Vec<i64> }

impl Aggregator {
    fn report(&mut self, edge: usize, n: i64, now: i64) {
        self.count[edge] = n;
        self.reported_at[edge] = now;
    }

    fn fresh(&self, edge: usize, now: i64) -> bool {
        now - self.reported_at[edge] <= STALE_MS
    }

    fn total(&self, now: i64) -> i64 {
        (0..self.count.len()).filter(|&e| self.fresh(e, now)).map(|e| self.count[e]).sum()
    }
}

struct PubSub;

impl PubSub {
    fn publish(&self, total: i64, subscribers: &mut [EdgeServer]) -> i64 {
        subscribers.iter_mut().filter(|edge| edge.alive).map(|edge| edge.push(total)).sum()
    }
}

fn t(ms: i64) -> String {
    format!("{}.{}s", ms / 1000, ms % 1000 / 100)
}

#[derive(Default)]
struct Load { joins: i64, reports: i64, publishes: i64, sse_writes: i64, naive: i64 }

#[derive(Default)]
struct LiveViewerCount {
    clock: VirtualClock,
    rng: Rng,
    edges: Vec<EdgeServer>,
    aggregator: Aggregator,
    edge_of: Vec<Option<usize>>,
    retry_of: Vec<u32>,
    playing: Vec<bool>,
    mode: usize,
    next_edge: usize,
    actual: i64,
    load: Load,
    last: (i64, i64, i64),
}

impl LiveViewerCount {
    fn connect(&mut self, conn: usize, now: i64) {
        while !self.edges[self.next_edge].alive { self.next_edge = (self.next_edge + 1) % self.edges.len(); }
        let e = self.next_edge;
        self.edge_of[conn] = Some(e);
        self.next_edge = (self.next_edge + 1) % self.edges.len();
        self.edges[e].open(conn);
        self.retry_of[conn] = self.rng.below(RETRY_MAX_MS);
        if self.playing[conn] { self.edges[e].signal(conn, now); }
    }

    fn handle(&mut self, ev: Ev) {
        let (now, x) = (ev.at, ev.arg);
        match ev.kind {
            Kind::Join => {
                self.load.naive += self.edges.iter().filter(|e| e.alive).map(|e| e.last_signal.len() as i64).sum::<i64>();
                self.load.joins += 1;
                self.actual += 1;
                self.playing[x] = true;
                self.connect(x, now);
                self.clock.schedule(now + HEARTBEAT_MS, Kind::Beat, x);
                let name = self.edges[self.edge_of[x].unwrap()].name;
                if self.mode == 1 { println!("t={} join conn={} edge={}", t(now), x, name); }
            }
            Kind::Beat => {
                if !self.playing[x] { return; }
                if let Some(e) = self.edge_of[x] { self.edges[e].signal(x, now); }
                self.clock.schedule(now + HEARTBEAT_MS, Kind::Beat, x);
            }
            Kind::Close => {
                let edge = &mut self.edges[self.edge_of[x].unwrap()];
                self.playing[x] = false;
                self.actual -= 1;
                edge.close(x);
                println!("t={} close conn={} edge={}", t(now), x, edge.name);
            }
            Kind::Pause => {
                let edge = &self.edges[self.edge_of[x].unwrap()];
                self.playing[x] = false;
                self.actual -= 1;
                println!("t={} pause conn={} edge={} last-signal={}", t(now), x, edge.name, t(edge.last_signal[&x]));
            }
            Kind::Report => {
                if !self.edges[x].alive { return; }
                self.aggregator.report(x, self.edges[x].active_count(now), now);
                self.load.reports += 1;
                self.clock.schedule(now + 1_000, Kind::Report, x);
            }
            Kind::Tick => {
                let total = self.aggregator.total(now);
                self.load.publishes += 1;
                self.load.sse_writes += PubSub.publish(total, &mut self.edges);
                if now >= 0 && (total != self.last.0 || self.actual != self.last.1) { self.print(now, total); }
                self.load = Load::default();
                self.clock.schedule(now + 1_000, Kind::Tick, 0);
            }
            Kind::Stop => {
                let dropped = self.edges[x].stop();
                for &conn in &dropped {
                    self.edge_of[conn] = None;
                    self.clock.schedule(now + self.retry_of[conn] as i64, Kind::Reconnect, conn);
                }
                let (name, shown) = (self.edges[x].name, self.edges[x].shown);
                println!("t={} stop edge={} dropped={} screens-frozen-at={}", t(now), name, dropped.len(), shown);
            }
            Kind::Reconnect => {
                self.connect(x, now);
                self.last.2 = now;
            }
        }
    }

    fn print(&mut self, now: i64, total: i64) {
        let mut line = format!("t={} total={} actual={}", t(now), total, self.actual);
        let l = &self.load;
        if self.mode == 2 {
            line += &format!(" joins={} reports={} publishes={}", l.joins, l.reports, l.publishes);
            line += &format!(" sse-writes={} naive={}", l.sse_writes, l.naive);
        }
        for (e, edge) in self.edges.iter().enumerate().filter(|_| self.mode == 3) {
            let shown = if self.aggregator.fresh(e, now) { self.aggregator.count[e].to_string() } else { "-".into() };
            line += &format!(" {}={}", edge.name, shown);
        }
        println!("{}", line);
        self.last = (total, self.actual, self.last.2);
    }

    fn run_until(&mut self, limit: i64) {
        while let Some(ev) = self.clock.next_before(limit) { self.handle(ev); }
    }
}

fn main() {
    let mut sim = LiveViewerCount {
        rng: Rng { x: 2026 },
        edges: vec![EdgeServer::new("a"), EdgeServer::new("b"), EdgeServer::new("c")],
        aggregator: Aggregator { count: vec![0; 3], reported_at: vec![NEVER; 3] },
        edge_of: vec![None; VIEWERS + 1],
        retry_of: vec![0; VIEWERS + 1],
        playing: vec![false; VIEWERS + 1],
        ..Default::default()
    };
    for id in 1..=1_200 { sim.clock.schedule(-20_000 + (id as i64 - 1) * 16, Kind::Join, id); }
    sim.clock.schedule(2_300, Kind::Join, 1_201);
    sim.clock.schedule(10_200, Kind::Close, 1_201);
    sim.clock.schedule(12_500, Kind::Pause, 751);
    for id in 1_202..=VIEWERS { sim.clock.schedule(60_000 + sim.rng.below(5_000) as i64, Kind::Join, id); }
    sim.clock.schedule(80_000, Kind::Stop, 2);
    for e in 0..sim.edges.len() { sim.clock.schedule(-20_000, Kind::Report, e); }
    sim.clock.schedule(-19_500, Kind::Tick, 0);

    sim.run_until(0);
    let titles = ["one join, one close, one pause", "3000 joins in 5 seconds", "edge c stops"];
    let ends = [60_000, 80_000, 95_000];
    for mode in 1..=3 {
        sim.mode = mode;
        println!("-- scenario {}: {} --", mode, titles[mode - 1]);
        sim.run_until(ends[mode - 1]);
    }
    println!("last-reconnect={}", t(sim.last.2));
}
