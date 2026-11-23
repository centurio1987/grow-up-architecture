use std::cmp::Reverse;
use std::collections::{BinaryHeap, HashMap, HashSet, VecDeque};

#[derive(PartialEq, Eq, PartialOrd, Ord, Clone, Copy)] enum Kind { Tick, Post, Read, Crash, Retry }
#[derive(PartialEq, Eq, Clone, Copy, Default)] enum Mode { #[default] Guide, FanOutAll, List }
#[derive(PartialEq, Eq, PartialOrd, Ord)] struct Ev { at: i64, seq: u64, kind: Kind, a: usize, b: i64 }

#[derive(Default)]
struct VirtualClock { queue: BinaryHeap<Reverse<Ev>>, seq: u64 }

impl VirtualClock {
    fn schedule(&mut self, at: i64, kind: Kind, a: usize, b: i64) {
        self.queue.push(Reverse(Ev { at, seq: self.seq, kind, a, b }));
        self.seq += 1;
    }
    fn next(&mut self) -> Option<Ev> { self.queue.pop().map(|Reverse(e)| e) }
}

const USERS: usize = 200_000;
const STAR: usize = 0;
const STAR_FOLLOWERS: usize = 100_000;
const FOLLOWS: usize = 200;
const STRIDE: usize = 997;
const HISTORY: usize = 60;
const ALICE: usize = 49_999;
const BOB: usize = 50_000;
const DAVE: usize = 50_997;
const CAROL: usize = 51_994;
const BIG: usize = 2_000;
const KEEP: usize = 800;
const PAGE: usize = 20;
const CAP: i32 = 1;
const LISTS_PER_MS: i64 = 20;
const BACKGROUND: i64 = 6;
const DAY: i64 = 86_400_000;
const ACTIVE: i64 = 30 * DAY;
const NET: i64 = 50;
const CACHE_RT: i64 = 1;
const STORE_RT: i64 = 2;
const RETRY_AFTER: i64 = 1_000;
const VISIBLE: i64 = 5_000;
const CRASH_AT: i64 = 120_030;
const UNTIL: i64 = 240_000;
const NAMED: [(i64, usize, i64); 4] = [(70_000, ALICE, 0), (90_500, STAR, 1), (91_000, ALICE, 1), (120_000, ALICE, 2)];
const READS: [(i64, usize, i64); 7] = [(75_000, BOB, 0), (90_000, BOB, 10), (96_000, BOB, 11), (97_000, BOB, 12), (125_000, CAROL, 20), (126_000, DAVE, 20), (127_000, BOB, 20)];

fn follower(a: usize, j: usize) -> usize { if a == STAR { j + 1 } else { (a + 1 + j * STRIDE) % USERS } }
fn followee(u: usize, j: usize) -> usize { (u as i64 - 1 - (j * STRIDE) as i64).rem_euclid(USERS as i64) as usize }
fn follower_count(a: usize) -> usize { if a == STAR { STAR_FOLLOWERS } else { FOLLOWS } }
fn follows_star(u: usize) -> bool { u >= 1 && u <= STAR_FOLLOWERS }
fn node(u: usize) -> usize { ((u as u64 * 2_654_435_761 % 4_294_967_296) >> 30) as usize }
fn who(u: usize) -> String { match u { ALICE => "alice".into(), BOB => "bob".into(), CAROL => "carol".into(), DAVE => "dave".into(), STAR => "star".into(), _ => format!("user {}", u) } }
fn desc(mut c: Vec<i64>) -> Vec<i64> {
    c.sort_by(|x, y| y.cmp(x));
    c
}
fn top(all: &[i64]) -> &[i64] { &all[..all.len().min(PAGE)] }
fn count(got: &[i64], keep: impl Fn(i64) -> bool) -> usize { got.iter().filter(|&&x| keep(x)).count() }

fn missing(t: i64, got: &[i64], all: &[i64]) -> usize {
    let in_page: HashSet<i64> = got.iter().copied().collect();
    top(all).iter().filter(|&&x| (x >> 22) <= t - VISIBLE && !in_page.contains(&x)).count()
}

fn repeated(got: &[i64], before: &[i64]) -> usize {
    let mut seen: HashSet<i64> = before.iter().copied().collect();
    got.iter().filter(|&&x| !seen.insert(x)).count()
}

#[derive(Default)]
struct HomeTimeline {
    mode: Mode, clock: VirtualClock, last_seen: Vec<i64>, built: Vec<bool>,
    timeline: HashMap<usize, Vec<i64>>, by_author: HashMap<usize, Vec<i64>>,
    id: Vec<i64>, at: Vec<i64>, done: Vec<i64>, to_bob: Vec<i64>, author: Vec<usize>, scene: Vec<i64>, jobs: VecDeque<usize>,
    notes: Vec<Vec<String>>, first: Vec<i64>, seed: i64, last_ms: i64, seq_in_ms: i64, slowest: i64,
    cur: Option<usize>, next: usize, again: usize, lost_node: usize, missed: usize, repeats: usize, jobs_done: usize, broken: bool,
}

impl HomeTimeline {
    fn new(mode: Mode) -> Self {
        let last_seen = (0..USERS).map(|u| if u % 2 == 0 { 0 } else { -40 * DAY }).collect();
        let mut s = HomeTimeline { mode, last_seen, built: (0..USERS).map(|u| u % 2 == 0).collect(), notes: vec![Vec::new(); 4], seed: 2_026, last_ms: -1, lost_node: usize::MAX, ..Default::default() };
        for i in 0..HISTORY { s.clock.schedule(500 + 1_000 * i as i64, Kind::Post, followee(BOB, i), -1); }
        for (at, a, scene) in NAMED { s.clock.schedule(at, Kind::Post, a, scene); }
        for i in 1..4 { s.clock.schedule(91_000 + 1_000 * i as i64, Kind::Post, followee(BOB, i), -1); }
        for (at, u, what) in READS { s.clock.schedule(at, Kind::Read, u, what); }
        if mode != Mode::FanOutAll { s.clock.schedule(CRASH_AT, Kind::Crash, 0, 0); }
        s.clock.schedule(0, Kind::Tick, 0, 0);
        s
    }

    fn active(&self, u: usize, t: i64) -> bool { t - self.last_seen[u] <= ACTIVE }
    fn big(&self, a: usize) -> bool { follower_count(a) > BIG && self.mode != Mode::FanOutAll }
    fn size(&self, u: usize) -> usize { self.timeline.get(&u).map_or(0, |v| v.len()) }
    fn list(&self, a: usize) -> &[i64] { self.by_author.get(&a).map_or(&[], |v| v.as_slice()) }
    fn note(&mut self, s: usize, t: i64, what: String) { self.notes[s].push(if t < 0 { what } else { format!("t={}ms {}", t, what) }); }

    fn below(&mut self, n: i64) -> i64 {
        self.seed = self.seed * 48_271 % 2_147_483_647;
        self.seed % n
    }

    fn run(mode: Mode) -> Self {
        let mut s = HomeTimeline::new(mode);
        while let Some(e) = s.clock.next() { s.handle(e); }
        s
    }

    fn handle(&mut self, e: Ev) {
        let t = e.at;
        match e.kind {
            Kind::Tick => self.tick(t),
            Kind::Post => self.post(t, e.a, e.b),
            Kind::Read => self.read(t, e.a, (e.b / 10) as usize, e.b % 10),
            Kind::Crash => self.crash(t),
            Kind::Retry => self.jobs.push_back(e.a),
        }
    }

    fn tick(&mut self, t: i64) {
        if let Some(a) = (self.below(1_000) < BACKGROUND).then(|| 1 + self.below(USERS as i64 - 1) as usize) { self.post(t, a, -1); }
        self.work(t);
        if t < UNTIL { self.clock.schedule(t + 1, Kind::Tick, 0, 0); }
    }

    fn post(&mut self, t: i64, a: usize, s: i64) {
        if t != self.last_ms { self.seq_in_ms = 0; }
        self.last_ms = t;
        let p = self.id.len();
        self.id.push(t << 22 | 1 << 12 | self.seq_in_ms);
        self.seq_in_ms += 1;
        self.at.push(t);
        self.author.push(a);
        self.scene.push(s);
        self.done.push(-1);
        self.to_bob.push(-1);
        self.by_author.entry(a).or_default().push(self.id[p]);
        self.jobs.push_back(p);
        let why = if self.big(a) { format!(" is above {}, the worker will skip it and followers read it from star's own list", BIG) } else { format!(" is not above {}, the worker will fan it out", BIG) };
        if s >= 0 { self.note(s as usize, t, format!("{}: posts id={}, {} followers{}", who(a), self.id[p], follower_count(a), why)); }
    }

    fn work(&mut self, t: i64) {
        let mut budget = CAP;
        while self.cur.is_some() || !self.jobs.is_empty() {
            if self.cur.is_none() {
                self.cur = self.jobs.pop_front();
                self.next = 0;
            }
            let p = self.cur.unwrap();
            if self.next == follower_count(self.author[p]) || self.big(self.author[p]) {
                self.finish(t);
                continue;
            }
            let u = follower(self.author[p], self.next);
            if !self.active(u, t) {
                self.next += 1;
                continue;
            }
            if budget == 0 { return; }
            budget -= 1;
            if !self.write(t, u) { return; }
            self.next += 1;
        }
    }

    fn write(&mut self, t: i64, u: usize) -> bool {
        let p = self.cur.unwrap();
        if self.broken && node(u) == self.lost_node {
            self.broken = false;
            self.note(2, t, format!("fan-out: writing id={} to user {} on node {} fails, the job goes back to the queue at {}ms to start again from its first follower", self.id[p], u, self.lost_node, t + RETRY_AFTER));
            self.clock.schedule(t + RETRY_AFTER, Kind::Retry, p, 0);
            self.cur = None;
            return false;
        }
        let (pid, list_mode) = (self.id[p], self.mode == Mode::List);
        let tl = self.timeline.entry(u).or_default();
        let k = tl.iter().take_while(|&&x| x > pid).count();
        let dup = k < tl.len() && tl[k] == pid;
        if !dup || list_mode { tl.insert(k, pid); }
        if tl.len() > KEEP { tl.pop(); }
        if dup { self.again += 1; }
        if u == BOB && self.to_bob[p] < 0 { self.to_bob[p] = t; }
        true
    }

    fn finish(&mut self, t: i64) {
        let p = self.cur.unwrap();
        let a = self.author[p];
        self.done[p] = t;
        self.jobs_done += 1;
        self.slowest = self.slowest.max(t - self.at[p]);
        let skipped = (0..follower_count(a)).filter(|&j| !self.active(follower(a, j), t)).count();
        let reach = format!(" is in the timelines of {} followers seen in the last 30 days", follower_count(a) - skipped);
        if self.scene[p] == 0 { self.note(0, t, format!("fan-out: id={}{} (bob's at {}ms), {} others skipped (dave last seen 40 days ago)", self.id[p], reach, self.to_bob[p], skipped)); }
        if self.scene[p] == 2 { self.note(2, t, format!("fan-out: id={}{}, the retry wrote it again to {} that already had it and each kept one copy", self.id[p], reach, self.again)); }
        self.cur = None;
    }

    fn crash(&mut self, t: i64) {
        self.lost_node = node(CAROL);
        let lost: Vec<usize> = (0..USERS).filter(|&u| node(u) == self.lost_node).collect();
        let gone = lost.iter().filter(|&&u| self.built[u]).count();
        for &u in &lost {
            self.built[u] = false;
            self.timeline.remove(&u);
        }
        self.broken = true;
        self.note(2, t, format!("cache node {}: stops, its {} built timelines are gone, an empty node takes its place", self.lost_node, gone));
    }

    fn read(&mut self, t: i64, u: usize, s: usize, what: i64) {
        if self.mode == Mode::FanOutAll { return; }
        let mut wait = NET + CACHE_RT + if follows_star(u) { STORE_RT } else { 0 } + STORE_RT + NET;
        let mut how = String::new();
        if !self.built[u] || !self.active(u, t) {
            let as_is = self.page(u, i64::MAX, 0, 0);
            if self.size(u) > 0 { self.note(s, t, format!("no-marker: {}'s page 1 from the timeline as it is (ids={}) = {} posts, missing={}", who(u), self.size(u), as_is.len(), missing(t, &as_is, &self.truth(u, i64::MAX, 0)))); }
            how = format!("{}, rebuilt from {} author lists to ids=", if self.size(u) == 0 { "no timeline, last seen 40 days ago" } else if self.built[u] { "last seen over 30 days ago" } else { "no built mark" }, FOLLOWS);
            self.rebuild(u);
            how += &format!("{}, then ", self.size(u));
            wait += STORE_RT + FOLLOWS as i64 / LISTS_PER_MS + CACHE_RT;
        }
        self.last_seen[u] = t;
        let (max, since) = (if what == 1 { self.first[self.first.len() - 1] } else { i64::MAX }, if what == 2 { self.first[0] } else { 0 });
        let got = self.page(u, max, since, 0);
        let all = self.truth(u, max, since);
        let before: &[i64] = if what == 1 { &self.first } else { &[] };
        let (miss, rep) = (missing(t, &got, &all), repeated(&got, before));
        self.missed += miss;
        self.repeats += rep;
        let asked = ["page 1".to_string(), format!("page 2 by max_id={}", max), format!("newer by since_id={}", since)];
        let (from_star, p2) = (count(&got, |x| self.author_of(x) == STAR), self.id[self.last(ALICE)]);
        let mut line = format!("{}: {}{} = {} posts, newest id={} by {}, oldest id={}, from star's list {}", who(u), how, asked[what as usize], got.len(), got[0], who(self.author_of(got[0])), got[got.len() - 1], from_star);
        if s == 2 { line += &format!(", alice's id={} x{}", p2, count(&got, |x| x == p2)); }
        self.note(s, t, format!("{}, answered {}ms later, repeated={} missing={}", line, wait, rep, miss));
        if what == 0 && s == 1 { self.note(s, -1, format!("read-all: {} page 1 from {} author lists instead of 1 timeline and 1 list", if top(&all) == got.as_slice() { "the same" } else { "other" }, FOLLOWS + 1)); }
        let off = self.page(u, i64::MAX, 0, PAGE);
        if what == 1 { self.note(s, -1, format!("offset: page 2 by offset={} = {} posts, repeated={}", PAGE, off.len(), repeated(&off, &self.first))); }
        if s == 2 && u == BOB { self.note(3, t, format!("list: bob's page 1 has alice's id={} x{}, repeated={}", p2, count(&got, |x| x == p2), rep)); }
        if what == 0 { self.first = got; }
    }

    fn author_of(&self, x: i64) -> usize { self.id.iter().rposition(|&y| y == x).map_or(usize::MAX, |p| self.author[p]) }
    fn last(&self, a: usize) -> usize { self.author.iter().rposition(|&y| y == a).unwrap_or(0) }

    fn rebuild(&mut self, u: usize) {
        let mut all = self.timeline.get(&u).cloned().unwrap_or_default();
        for j in 0..FOLLOWS { all.extend_from_slice(self.list(followee(u, j))); }
        let mut tl = desc(all);
        tl.dedup();
        tl.truncate(KEEP);
        self.timeline.insert(u, tl);
        self.built[u] = true;
    }

    fn page(&self, u: usize, max: i64, since: i64, skip: usize) -> Vec<i64> {
        let mut c: Vec<i64> = self.timeline.get(&u).map_or(&[][..], |v| v.as_slice()).iter().copied().filter(|&x| x < max && x > since).collect();
        if follows_star(u) && self.mode != Mode::FanOutAll { c.extend(self.list(STAR).iter().copied().filter(|&x| x < max && x > since)); }
        desc(c).into_iter().skip(skip).take(PAGE).collect()
    }

    fn truth(&self, u: usize, max: i64, since: i64) -> Vec<i64> {
        let mut c = Vec::new();
        for j in 0..=FOLLOWS {
            if j == FOLLOWS && !follows_star(u) { break; }
            c.extend(self.list(if j < FOLLOWS { followee(u, j) } else { STAR }).iter().copied().filter(|&x| x < max && x > since));
        }
        desc(c)
    }

    fn fan_out_all(&self) -> String {
        let star = self.last(STAR);
        let q = (0..self.id.len()).find(|&p| self.author[p] == ALICE && self.scene[p] == 1).unwrap_or(0);
        let late = (0..self.id.len()).filter(|&p| self.done[p] >= 0 && self.done[p] - self.at[p] > VISIBLE).count();
        format!("fan-out-all: star's post was in all {} active followers' timelines {}ms after it was written (bob's after {}ms), alice's post written at {}ms was in bob's after {}ms, {} of {} posts took over {}ms",
            STAR_FOLLOWERS / 2, self.done[star] - self.at[star], self.to_bob[star] - self.at[star], self.at[q], self.to_bob[q] - self.at[q], late, self.jobs_done, VISIBLE)
    }
}

fn main() {
    let (g, f, l) = (HomeTimeline::run(Mode::Guide), HomeTimeline::run(Mode::FanOutAll), HomeTimeline::run(Mode::List));
    let head = [
        "-- scenario 1: alice posts once, bob opens his home timeline 5000ms later --".to_string(),
        "-- scenario 2: star (100000 followers) posts between bob's page 1 and page 2, 4 more posts come in --".to_string(),
        format!("-- scenario 3: cache node {} stops while alice's post at 120000ms fans out, then carol on that node and dave (away 40 days) read --", node(CAROL)),
    ];
    for s in 0..3 {
        println!("{}", head[s]);
        for line in &g.notes[s] { println!("{}", line); }
        if s == 1 { println!("{}", f.fan_out_all()); }
    }
    for line in &l.notes[3] { println!("{}", line); }
    println!("guide: {} fan-out jobs done, the slowest was in all active followers' timelines {}ms after it was written, reads missing={} repeated={}", g.jobs_done, g.slowest, g.missed, g.repeats);
}
