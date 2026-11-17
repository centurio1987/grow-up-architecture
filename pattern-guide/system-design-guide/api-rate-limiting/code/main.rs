use std::cmp::Reverse;
use std::collections::{BTreeMap, BinaryHeap, VecDeque};

#[derive(PartialEq, Eq, PartialOrd, Ord, Clone, Copy)]
enum Kind { Arrive, Redis, Reply, Timeout, Stop, Restart }

#[derive(PartialEq, Eq, Clone, Copy)]
enum Algo { Fixed, Sliding, TwoStep }

#[derive(PartialEq, Eq, Clone, Copy)]
enum Mode { Open, Closed, Local }

#[derive(PartialEq, Eq, PartialOrd, Ord)]
struct Ev { at: i64, seq: u64, kind: Kind, arg: usize }

#[derive(Default)]
struct VirtualClock { queue: BinaryHeap<Reverse<Ev>>, seq: u64 }

impl VirtualClock {
    fn schedule(&mut self, at: i64, kind: Kind, arg: usize) {
        self.queue.push(Reverse(Ev { at, seq: self.seq, kind, arg }));
        self.seq += 1;
    }

    fn next(&mut self) -> Option<Ev> { self.queue.pop().map(|Reverse(e)| e) }
}

const WINDOW_US: i64 = 60_000_000;
const NET_US: i64 = 250;
const TIMEOUT_US: i64 = 5_000;
const LIMIT: i64 = 600;
const CAP: i64 = 10;
const NEVER: i64 = i64::MAX / 4;
const SERVERS: usize = 4;
const CMD_US: i64 = 10;
const ALGO: [&str; 3] = ["fixed-window", "sliding-lua", "two-step"];
const MODE: [&str; 3] = ["open", "closed", "local"];

fn fits(prev: i64, cur: i64, e: i64, limit: i64) -> bool {
    prev * (WINDOW_US - e) + (cur + 1) * WINDOW_US <= limit * WINDOW_US
}

struct Redis { data: BTreeMap<String, i64>, busy_until: i64, calls: i64, up: bool, script_loaded: bool }

impl Redis {
    fn new() -> Self { Redis { data: BTreeMap::new(), busy_until: 0, calls: 0, up: true, script_loaded: true } }

    fn run(&mut self, now: i64) -> i64 {
        self.busy_until = now.max(self.busy_until) + CMD_US;
        self.calls += 1;
        self.busy_until
    }

    fn get(&self, key: &str) -> i64 { *self.data.get(key).unwrap_or(&0) }

    fn incr(&mut self, key: &str) -> i64 { *self.data.entry(key.to_string()).and_modify(|v| *v += 1).or_insert(1) }

    fn read(&self, key: usize, now: i64) -> [i64; 3] {
        let w = now / WINDOW_US;
        [0, self.get(&format!("{}:{}", key, w - 1)), self.get(&format!("{}:{}", key, w))]
    }

    fn lua(&mut self, key: usize, now: i64, limit: i64, fixed: bool) -> [i64; 3] {
        let mut r = self.read(key, now);
        if fixed { r[1] = 0; }
        if !fits(r[1], r[2], now % WINDOW_US, limit) { return r; }
        [1, r[1], self.incr(&format!("{}:{}", key, now / WINDOW_US))]
    }
}

fn arrivals(streams: &[[i64; 5]]) -> Vec<i64> {
    let mut codes: Vec<i64> = streams.iter().flat_map(|s| (0..s[3]).map(move |j| (s[1] + j / s[4] * s[2]) * 8 + s[0])).collect();
    codes.sort();
    codes
}

fn wait_us(prev: i64, cur: i64, e: i64) -> i64 {
    let first = if prev == 0 { WINDOW_US } else { WINDOW_US - (LIMIT - cur - 1) * WINDOW_US / prev };
    if cur + 1 <= LIMIT && first < WINDOW_US { return first - e; }
    let next = if cur == 0 { 0 } else { 0.max(WINDOW_US - (LIMIT - 1) * WINDOW_US / cur) };
    WINDOW_US - e + next
}

fn dec3(v: i64) -> String { format!("{}.{:03}", v / 1000, v % 1000) }

fn ms(us: i64) -> String { format!("{}ms", dec3(us)) }

struct RateLimit {
    algo: Algo, mode: Mode, trace: u8,
    at: Vec<i64>, key: Vec<usize>, step: Vec<u8>, state: Vec<u8>, res: Vec<[i64; 3]>,
    clock: VirtualClock, redis: Redis, blocked: [[i64; 5]; SERVERS], buckets: BTreeMap<String, [i64; 2]>,
    sent: [i64; 5], allowed: [i64; 5], local429: i64, noscript: i64, fallbacks: i64, max_judge: i64,
}

impl RateLimit {
    fn new(algo: Algo, mode: Mode, trace: u8, codes: &[i64]) -> Self {
        let n = codes.len();
        RateLimit {
            algo, mode, trace,
            at: codes.iter().map(|c| c / 8).collect(), key: codes.iter().map(|c| (c % 8) as usize).collect(),
            step: vec![0; n], state: vec![0; n], res: vec![[0; 3]; n],
            clock: VirtualClock::default(), redis: Redis::new(), blocked: [[0; 5]; SERVERS], buckets: BTreeMap::new(),
            sent: [0; 5], allowed: [0; 5], local429: 0, noscript: 0, fallbacks: 0, max_judge: 0,
        }
    }

    fn note(&self, i: usize, now: i64, what: &str) {
        let picked = self.trace == 1 && [0, 599, 600, 604].contains(&i) || self.trace == 2 && i == usize::MAX;
        let who = if i == usize::MAX { String::new() } else { format!(" K{} #{}", self.key[i], i + 1) };
        if picked { println!("t={}{} {}", ms(now), who, what); }
    }

    fn finish(&mut self, i: usize, now: i64, allow: bool, what: &str) {
        self.state[i] = if allow { 2 } else { 1 };
        if allow { self.allowed[self.key[i]] += 1; }
        self.max_judge = self.max_judge.max(now - self.at[i]);
        self.note(i, now, what);
    }

    fn arrive(&mut self, i: usize, now: i64) {
        if i + 1 < self.at.len() { self.clock.schedule(self.at[i + 1], Kind::Arrive, i + 1); }
        let (s, k) = (i % SERVERS, self.key[i]);
        self.sent[k] += 1;
        if self.blocked[s][k] > now {
            self.local429 += 1;
            self.finish(i, now, false, &format!("api-{}: 429 from local block, no redis call", s + 1));
            return;
        }
        self.note(i, now, &format!("lb -> api-{}, EVALSHA sent", s + 1));
        self.clock.schedule(now + NET_US, Kind::Redis, i);
        self.clock.schedule(now + TIMEOUT_US, Kind::Timeout, i);
    }

    fn at_redis(&mut self, i: usize, now: i64) {
        if !self.redis.up { return; }
        let end = self.redis.run(now);
        let (k, t) = (self.key[i], self.at[i]);
        if self.step[i] == 2 { self.redis.script_loaded = true; }
        self.res[i] = if self.algo != Algo::TwoStep && !self.redis.script_loaded { [-1, 0, 0] }
            else if self.step[i] == 1 { [1, self.res[i][1], self.redis.incr(&format!("{}:{}", k, t / WINDOW_US))] }
            else if self.algo == Algo::TwoStep { self.redis.read(k, t) }
            else { self.redis.lua(k, t, LIMIT, self.algo == Algo::Fixed) };
        let r = self.res[i];
        let verdict = if r[0] == 1 { "allow" } else { "reject" };
        if r[0] >= 0 { self.note(i, end, &format!("redis lua -> {} prev={} cur={}", verdict, r[1], r[2])); }
        self.clock.schedule(end + NET_US, Kind::Reply, i);
    }

    fn reply(&mut self, i: usize, now: i64) {
        if self.state[i] != 0 { return; }
        let r = self.res[i];
        let (s, k, e) = (i % SERVERS, self.key[i], self.at[i] % WINDOW_US);
        if r[0] == -1 { self.noscript += 1; }
        if r[0] == -1 && self.noscript == 1 { self.note(usize::MAX, now, &format!("api-{}: EVALSHA -> NOSCRIPT, resend the script with EVAL", s + 1)); }
        if r[0] == -1 || (self.algo == Algo::TwoStep && self.step[i] == 0 && fits(r[1], r[2], e, LIMIT)) {
            self.step[i] = if r[0] == -1 { 2 } else { 1 };
            self.clock.schedule(now + NET_US, Kind::Redis, i);
            return;
        }
        if r[0] == 1 {
            let left = 0.max(((LIMIT - r[2]) * WINDOW_US - r[1] * (WINDOW_US - e)) / WINDOW_US);
            self.finish(i, now, true, &format!("api-{}: 200 remaining={}, forward to backend", s + 1, left));
            return;
        }
        let wait = if self.algo == Algo::Fixed { WINDOW_US - e } else { wait_us(r[1], r[2], e) };
        self.blocked[s][k] = self.at[i] + wait;
        let retry = format!("429 retry-after={}s", (wait + 999_999) / 1_000_000);
        self.finish(i, now, false, &format!("api-{}: {}, block K{} here until {}", s + 1, retry, k, ms(self.at[i] + wait)));
    }

    fn take(&mut self, s: usize, k: usize, now: i64) -> bool {
        let b = self.buckets.entry(format!("{}:{}", s, k)).or_insert([CAP * WINDOW_US, now]);
        b[0] = (CAP * WINDOW_US).min(b[0] + (now - b[1]) * LIMIT / SERVERS as i64);
        b[1] = now;
        if b[0] < WINDOW_US { return false; }
        b[0] -= WINDOW_US;
        true
    }

    fn handle(&mut self, ev: Ev) {
        let (now, i) = (ev.at, ev.arg);
        match ev.kind {
            Kind::Arrive => self.arrive(i, now),
            Kind::Redis => self.at_redis(i, now),
            Kind::Reply => self.reply(i, now),
            Kind::Timeout => {
                if self.state[i] != 0 { return; }
                self.fallbacks += 1;
                let allow = self.mode == Mode::Open || self.mode == Mode::Local && self.take(i % SERVERS, self.key[i], now);
                self.finish(i, now, allow, "fallback");
            }
            Kind::Stop => {
                self.redis.up = false;
                self.note(usize::MAX, now, "redis stops responding");
            }
            Kind::Restart => {
                self.redis.up = true;
                self.redis.data.clear();
                self.redis.script_loaded = false;
                self.note(usize::MAX, now, "redis restarts with no counters and an empty script cache");
            }
        }
    }

    fn run(mut self, stop_at: i64, restart_at: i64) -> Self {
        self.clock.schedule(self.at[0], Kind::Arrive, 0);
        self.clock.schedule(stop_at, Kind::Stop, 0);
        self.clock.schedule(restart_at, Kind::Restart, 0);
        while let Some(ev) = self.clock.next() { self.handle(ev); }
        self
    }

    fn count(&self, k: usize, from: i64, until: i64) -> usize {
        (0..self.at.len()).filter(|&i| self.state[i] == 2 && self.key[i] == k && self.at[i] >= from && self.at[i] < until).count()
    }

    fn calls(&self) -> String { format!("redis-calls={} api-local-429={} max-judge={}", self.redis.calls, self.local429, ms(self.max_judge)) }

    fn exact(&self) {
        let mut log: VecDeque<i64> = VecDeque::new();
        let mut wrong = [0i64; 2];
        for i in 0..self.at.len() {
            while log.front().is_some_and(|&t| t <= self.at[i] - WINDOW_US) { log.pop_front(); }
            let fit = log.len() as i64 + 1 <= LIMIT;
            if fit { log.push_back(self.at[i]); }
            if (self.state[i] == 2) != fit { wrong[fit as usize] += 1; }
        }
        let sum = wrong[0] + wrong[1];
        println!("exact-log: allowed={}; sliding-lua differs on {} of {} (wrongly allowed {}, wrongly rejected {}) = {}%",
            self.allowed[2] - wrong[0] + wrong[1], sum, self.at.len(), wrong[0], wrong[1], dec3(sum * 100_000 / self.at.len() as i64));
    }
}

fn candidates() {
    let names = ["per-region-full", "split-in-three", "central-redis"];
    for c in 0..3 {
        let mut regions = [Redis::new(), Redis::new(), Redis::new()];
        let mut got = [0i64; 5];
        let limit = if c == 1 { LIMIT / 3 } else { LIMIT };
        for t in (0..WINDOW_US).step_by(100_000) {
            got[1] += regions[0].lua(1, t, limit, false)[0];
            for r in 0..3 { got[4] += regions[if c == 2 { 0 } else { r }].lua(4, t, limit, false)[0]; }
        }
        let cross = if c == 2 { 2 * WINDOW_US / 100_000 } else { 0 };
        println!("{}: K1 allowed={}/600 K4 allowed={}/1800 cross-region-calls={}", names[c], got[1], got[4], cross);
    }
}

fn main() {
    println!("-- formula: cloudflare example, prev=42 cur=18 at 15s of a 60s window --");
    println!("estimate={}", dec3(42 * (WINDOW_US - 15_000_000) * 1000 / WINDOW_US + 18 * 1000));
    println!("-- scenario 1: K1 sends one request every 80ms to region A --");
    let one = RateLimit::new(Algo::Sliding, Mode::Local, 1, &arrivals(&[[1, 0, 80_000, 750, 1]])).run(NEVER, NEVER);
    println!("K1: sent={} allowed={} rejected={} {}", one.sent[1], one.allowed[1], one.sent[1] - one.allowed[1], one.calls());
    println!("-- scenario 2: K2 sends 4 at a time, 600 in 59s-60s and 600 in 60s-61s --");
    let burst = arrivals(&[[2, 59_000_000, 6_666, 600, 4], [2, 60_000_000, 6_666, 600, 4]]);
    for (n, a) in [Algo::Fixed, Algo::Sliding, Algo::TwoStep].into_iter().enumerate() {
        let r = RateLimit::new(a, Mode::Local, 0, &burst).run(NEVER, NEVER);
        println!("{}: allowed={} window0={} window1={} {}", ALGO[n], r.allowed[2], r.count(2, 0, WINDOW_US), r.count(2, WINDOW_US, 2 * WINDOW_US), r.calls());
        if a == Algo::Sliding { r.exact(); }
    }
    println!("-- candidates: K1 sends 600 to region A, K4 sends 1800 across regions A B C, in one minute --");
    candidates();
    println!("-- scenario 3: region A redis stops at 15s and restarts empty at 35s, K3 floods from 16s --");
    let flood = arrivals(&[[1, 0, 125_000, 480, 1], [3, 16_000_000, 10_000, 4_400, 1]]);
    for (n, m) in [Mode::Open, Mode::Closed, Mode::Local].into_iter().enumerate() {
        let r = RateLimit::new(Algo::Sliding, m, if m == Mode::Local { 2 } else { 0 }, &flood).run(15_000_000, 35_000_000);
        println!("{}: K1 allowed={}/{} K3 allowed={}/{} K3-during-outage={} fallbacks={} {}", MODE[n], r.allowed[1], r.sent[1], r.allowed[3], r.sent[3],
            r.count(3, 15_000_000, 35_000_000), r.fallbacks, r.calls());
        if m == Mode::Local { println!("local: redis counts K3 at {} for window 0, K3 actually got {}", r.redis.get("3:0"), r.allowed[3]); }
    }
}
