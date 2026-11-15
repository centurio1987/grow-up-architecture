use std::cmp::Reverse;
use std::collections::{BTreeMap, BTreeSet, BinaryHeap, VecDeque};

struct Rng { x: u32 }

impl Rng {
    fn below(&mut self, n: u32) -> u32 {
        self.x ^= self.x << 13;
        self.x ^= self.x >> 17;
        self.x ^= self.x << 5;
        self.x % n
    }
}

#[derive(PartialEq, Eq, PartialOrd, Ord, Clone, Copy)]
enum Kind { Arrive, Redis, Reply, Work, Replicate, Stop, Promote }

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

const CMD_US: i64 = 5;

#[derive(Default)]
struct Redis { count: i64, busy_until: i64, commands: i64, users: BTreeSet<usize>, replica: (i64, BTreeSet<usize>), down: bool }

impl Redis {
    fn run(&mut self, now: i64) -> i64 {
        self.busy_until = now.max(self.busy_until) + CMD_US;
        self.commands += 1;
        self.busy_until
    }

    fn sadd(&mut self, user: usize) -> i64 { self.users.insert(user) as i64 }

    fn incr(&mut self) -> i64 {
        self.count += 1;
        self.count
    }

    fn replicate(&mut self) {
        self.replica = (self.count, self.users.clone());
    }

    fn promote(&mut self) {
        (self.count, self.users) = std::mem::take(&mut self.replica);
        self.down = false;
    }
}

#[derive(Default)]
struct CouponDb { by_seq: BTreeMap<i64, usize>, users: BTreeSet<usize> }

impl CouponDb {
    fn insert(&mut self, user: usize, seq: i64) -> bool {
        if self.users.contains(&user) || self.by_seq.contains_key(&seq) { return false; }
        self.users.insert(user);
        self.by_seq.insert(seq, user);
        true
    }
}

struct Arrivals { at: Vec<i64>, user: Vec<usize>, users: usize }

const NET_US: i64 = 250;
const WORK_US: i64 = 10_000;
const LAG_US: i64 = 5_000;
const FAILOVER_US: i64 = 1_000_000;
const LIMIT: i64 = 1_000;
const WORK_BATCH: usize = 5;

fn ms(us: i64) -> String { format!("{}.{:03}ms", us / 1000, us % 1000) }

#[derive(Default)]
struct Counts { stop_count: i64, success: i64, gone: i64, already: i64, retry: i64, local: i64, rejected: i64, max_wait: i64, last_row: i64 }

struct CouponIssue<'a> {
    atomic: bool, recount: bool, trace: bool,
    at: &'a [i64], user: &'a [usize],
    reply: Vec<i64>, seq: Vec<i64>, step: Vec<u8>, wins: Vec<u32>,
    clock: VirtualClock, redis: Redis, queue: VecDeque<usize>, db: CouponDb,
    sold_out: [bool; 2], paused: bool, n: Counts,
}

impl<'a> CouponIssue<'a> {
    fn new(atomic: bool, recount: bool, trace: bool, a: &'a Arrivals) -> Self {
        let len = a.at.len();
        CouponIssue {
            atomic, recount, trace, at: &a.at, user: &a.user,
            reply: vec![0; len], seq: vec![0; len], step: vec![0; len], wins: vec![0; a.users + 1],
            clock: VirtualClock::default(), redis: Redis::default(), queue: VecDeque::new(), db: CouponDb::default(),
            sold_out: [false; 2], paused: false, n: Counts::default(),
        }
    }

    fn note(&self, now: i64, i: usize, what: &str) {
        if self.trace && self.user[i] == 1 { println!("t={} req={} user=1 {}", ms(now), i, what); }
    }

    fn finish(&mut self, i: usize, now: i64, what: &str) {
        self.n.max_wait = self.n.max_wait.max(now - self.at[i]);
        self.note(now, i, what);
    }

    fn send(&mut self, i: usize, now: i64, next: u8) {
        self.step[i] = next;
        self.clock.schedule(now + NET_US, Kind::Redis, i);
    }

    fn handle(&mut self, ev: Ev) {
        let (now, i) = (ev.at, ev.arg);
        match ev.kind {
            Kind::Arrive => {
                if i + 1 < self.at.len() { self.clock.schedule(self.at[i + 1], Kind::Arrive, i + 1); }
                self.note(now, i, &format!("presses, api-{}", i % 2 + 1));
                if self.paused { self.n.retry += 1; }
                else if self.sold_out[i % 2] {
                    self.n.gone += 1;
                    self.n.local += 1;
                } else { self.send(i, now, 0); }
            }
            Kind::Redis => {
                self.reply[i] = -1;
                let (mut done, step, u) = (now, self.step[i], self.user[i]);
                if !self.redis.down && !self.paused {
                    done = self.redis.run(now);
                    if !self.atomic { done = self.redis.run(now); }
                    if step == 1 && !self.atomic { self.redis.sadd(u); }
                    if step == 0 {
                        self.reply[i] = if self.atomic { self.redis.sadd(u) }
                            else if self.redis.users.contains(&u) { -2 } else { self.redis.count };
                    } else if step == 1 { self.reply[i] = self.redis.incr(); }
                    else { self.redis.users.remove(&u); }
                    let cmd = if step == 0 { "SADD" } else { "INCR" };
                    if step < 2 { self.note(done, i, &format!("redis {} -> {}", cmd, self.reply[i])); }
                }
                if step != 2 { self.clock.schedule(done + NET_US, Kind::Reply, i); }
            }
            Kind::Reply => {
                let (r, step) = (self.reply[i], self.step[i]);
                if r == -1 {
                    self.n.retry += 1;
                    self.finish(i, now, "api: retry later");
                } else if step == 0 && (if self.atomic { r == 0 } else { r == -2 }) {
                    self.n.already += 1;
                    self.finish(i, now, "api: already issued");
                } else if step == 0 && (self.atomic || r < LIMIT) { self.send(i, now, 1); }
                else if step == 1 && (r <= LIMIT || !self.atomic) {
                    self.seq[i] = r;
                    self.queue.push_back(i);
                    self.wins[self.user[i]] += 1;
                    self.n.success += 1;
                    self.finish(i, now, &format!("api: enqueue seq={}, answer success", r));
                } else {
                    self.sold_out[i % 2] = true;
                    self.n.gone += 1;
                    self.finish(i, now, "api: sold out");
                    if self.atomic { self.send(i, now, 2); }
                }
            }
            Kind::Work => {
                for _ in 0..WORK_BATCH {
                    let Some(j) = self.queue.pop_front() else { break };
                    let ok = self.db.insert(self.user[j], self.seq[j]);
                    if ok { self.n.last_row = now; } else { self.n.rejected += 1; }
                    self.note(now, j, &format!("worker INSERT seq={}{}", self.seq[j], if ok { " -> 1 row" } else { " -> 0 rows" }));
                }
                if self.paused && self.queue.is_empty() {
                    self.redis.count = self.db.by_seq.keys().next_back().copied().unwrap_or(0);
                    self.redis.users = self.db.users.clone();
                    self.paused = false;
                    println!("t={} queue empty, rebuild from db: count={}, resume", ms(now), self.redis.count);
                }
                self.clock.schedule(now + WORK_US, Kind::Work, 0);
            }
            Kind::Replicate => self.redis.replicate(),
            Kind::Stop => {
                self.redis.down = true;
                self.n.stop_count = self.redis.count;
                println!("t={} redis primary stops, count={}", ms(now), self.redis.count);
            }
            Kind::Promote => {
                self.redis.promote();
                self.paused = self.recount;
                println!("t={} replica promoted, count={} (lost {} INCR){}", ms(now), self.redis.count,
                    self.n.stop_count - self.redis.count, if self.recount { ", pause" } else { "" });
            }
        }
    }

    fn run(mut self, until: i64, stop_at: i64) -> Self {
        self.clock.schedule(0, Kind::Arrive, 0);
        self.clock.schedule(0, Kind::Work, 0);
        self.clock.schedule(stop_at - LAG_US, Kind::Replicate, 0);
        self.clock.schedule(stop_at, Kind::Stop, 0);
        self.clock.schedule(stop_at + FAILOVER_US, Kind::Promote, 0);
        while let Some(ev) = self.clock.next_before(until) { self.handle(ev); }
        self
    }

    fn report(&self, name: &str) {
        let n = &self.n;
        let doubles = self.wins.iter().filter(|&&w| w > 1).count();
        println!("{}: requests={} success={} over={} double={} already={} sold-out={} retry={}", name, self.at.len(),
            n.success, (n.success - LIMIT).max(0), doubles, n.already, n.gone, n.retry);
        println!("{}: redis-commands={} api-local-sold-out={} max-wait={} db-rows={} db-rejected={} last-row={}", name,
            self.redis.commands, n.local, ms(n.max_wait), self.db.by_seq.len(), n.rejected, ms(n.last_row));
    }
}

fn arrivals(rng: &mut Rng, count: usize, max_gap: u32) -> Arrivals {
    let (mut at, mut user, mut users) = (Vec::with_capacity(count), Vec::with_capacity(count), 0);
    for i in 0..count {
        let again = i == 1 || (i > 1 && rng.below(10) == 0);
        if !again { users += 1; }
        user.push(if again { user[i - 1] } else { users });
        at.push(if i == 0 { 0 } else { at[i - 1] + rng.below(max_gap + 1) as i64 });
    }
    Arrivals { at, user, users }
}

fn main() {
    let mut rng = Rng { x: 2026 };
    let burst = arrivals(&mut rng, 30_000, 6);
    let steady = arrivals(&mut rng, 9_000, 600);
    let never = 20_000_000;
    println!("-- scenario 1: user 1 presses twice at 0ms --");
    let first = CouponIssue::new(true, false, true, &burst).run(2_100_000, never);
    println!("-- scenario 2: {} requests in {} for {} coupons --", burst.at.len(), ms(burst.at[29_999]), LIMIT);
    first.report("atomic");
    CouponIssue::new(false, false, false, &burst).run(10_000_000, never).report("check-then-act");
    println!("-- scenario 3: redis primary stops at 300ms, {} requests --", steady.at.len());
    CouponIssue::new(true, false, false, &steady).run(4_000_000, 300_000).report("as-is");
    CouponIssue::new(true, true, false, &steady).run(4_000_000, 300_000).report("recount");
}
