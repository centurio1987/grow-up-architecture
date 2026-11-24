use std::cmp::Reverse;
use std::collections::{BinaryHeap, HashMap, VecDeque};
#[derive(PartialEq, Clone, Copy, Default)] enum Mode { #[default] Guide, OneQueue, NoShare }
#[derive(PartialEq, Eq, PartialOrd, Ord)] enum Kind { Tick, Req, Enq, Write, Ready, Resend, Crash, Visible }
#[derive(PartialEq, Eq, PartialOrd, Ord)] struct Ev { at: i64, seq: u64, kind: Kind, a: usize }
struct Req { at: i64, service: &'static str, user: i64, count: i64, ch: usize, prio: usize, key: String, lost_reply: bool }
struct Notice { id: usize, user: i64, ch: usize, prio: usize, key: String, received: i64 }
struct Batch { worker: usize, taken_at: i64, items: Vec<[usize; 3]> }
#[derive(Default)] struct VirtualClock { queue: BinaryHeap<Reverse<Ev>>, seq: u64 }
impl VirtualClock {
    fn schedule(&mut self, at: i64, kind: Kind, a: usize) {
        self.queue.push(Reverse(Ev { at, seq: self.seq, kind, a }));
        self.seq += 1;
    }
    fn next(&mut self) -> Option<Ev> { self.queue.pop().map(|Reverse(e)| e) }
}
const WINDOW: usize = 10;
const MIN_CALLS: usize = 5;
const FAIL_PERCENT: usize = 50;
const TRIALS: usize = 3;
const OPEN_FOR: i64 = 10_000;
#[derive(PartialEq, Default)] enum Circuit { #[default] Closed, Open, HalfOpen }
#[derive(Default)] struct Breaker { recent: VecDeque<bool>, state: Circuit, allowed: usize, judged: usize, failed: usize, opened_at: i64 }
impl Breaker {
    fn allow(&mut self, t: i64) -> bool {
        if self.state == Circuit::Open && t - self.opened_at >= OPEN_FOR { self.state = Circuit::HalfOpen; }
        if self.state == Circuit::HalfOpen && self.allowed < TRIALS {
            self.allowed += 1;
            return true;
        }
        self.state == Circuit::Closed
    }

    fn record(&mut self, ok: bool, t: i64) -> Option<String> {
        if self.state == Circuit::Open { return None; }
        if self.state == Circuit::HalfOpen {
            self.judged += 1;
            self.failed += if ok { 0 } else { 1 };
            if self.judged < TRIALS { return None; }
            if self.failed * 100 >= FAIL_PERCENT * TRIALS { return Some(self.open(t, format!("half-open, {} of {} test calls failed, the breaker opens again", self.failed, TRIALS))); }
            self.state = Circuit::Closed;
            return Some(format!("half-open, {} test calls passed, the breaker closes and sms go to A again", TRIALS));
        }
        self.recent.push_back(ok);
        if self.recent.len() > WINDOW { self.recent.pop_front(); }
        let bad = self.recent.iter().filter(|b| !**b).count();
        if self.recent.len() < MIN_CALLS || bad * 100 < FAIL_PERCENT * self.recent.len() { return None; }
        Some(self.open(t, format!("{} of the last {} calls failed, the breaker opens and sms go to B", bad, self.recent.len())))
    }

    fn open(&mut self, t: i64, why: String) -> String {
        *self = Breaker { state: Circuit::Open, opened_at: t, ..Default::default() };
        why
    }
}
const PUSH: usize = 0;
const SMS: usize = 1;
const URGENT: usize = 0;
const NORMAL: usize = 1;
const CAMPAIGN: usize = 2;
const FCM: usize = 0;
const SMS_A: usize = 1;
const SMS_B: usize = 2;
const HANDED: usize = 1;
const TOKEN_REMOVED: usize = 2;
const FAILURE_QUEUE: usize = 3;
const SENDING: usize = 4;
const MAX: usize = 11_000;
const MINSU: i64 = 1;
const SORA: i64 = 3;
const JISU: i64 = 4;
const DORA: i64 = 8;
const YUNA: i64 = 10;
const FANS: i64 = 10_000;
const OTP_USERS: i64 = 20_000;
const PER_TICK: usize = 5;
const QUOTA: usize = 100;
const SHARE: usize = 20;
const MAX_ATTEMPTS: usize = 5;
const STEP: i64 = 50;
const RT: i64 = 20;
const WRITE_AFTER: i64 = 25;
const STORE_RT: i64 = 2;
const VISIBILITY: i64 = 12_000;
const REGION_DOWN: (i64, i64) = (30_000, 50_000);
const BACKOFF: [i64; 2] = [10_000, 1_000];
const A_DOWN: (i64, i64) = (220_000, 240_000);
const CRASH_AT: i64 = 300_022;
const UNTIL: i64 = 330_000;
const STATE: [&str; 5] = ["waiting", "handed over", "token removed", "failure queue", "sending"];
const VENDOR: [&str; 3] = ["fcm", "sms A", "sms B"];
const PRIO: [&str; 3] = ["urgent", "normal", "campaign"];
fn who(u: i64) -> String { match u { MINSU => "minsu".to_string(), SORA => "sora".to_string(), JISU => "jisu".to_string(), DORA => "dora".to_string(), YUNA => "yuna".to_string(), _ => format!("user {}", u) } }
fn kind(n: &Notice) -> String { format!("{}{}", PRIO[n.prio], if n.ch == PUSH { " push" } else { " sms" }) }
fn req(at: i64, service: &'static str, user: i64, count: i64, ch: usize, prio: usize, key: &str, lost_reply: bool) -> Req { Req { at, service, user, count, ch, prio, key: key.to_string(), lost_reply } }
#[derive(Default)] struct Sim {
    mode: Mode, clock: VirtualClock, reqs: Vec<Req>, notices: Vec<Notice>, keys: HashMap<String, usize>, batches: Vec<Batch>,
    notes: [Vec<String>; 3], breakers: [Breaker; 2], dead: [bool; 2], attempts: Vec<usize>, deliveries: Vec<usize>, state: Vec<usize>, shown: Vec<usize>,
    handed: Vec<i64>, fresh: Vec<VecDeque<usize>>, ready: Vec<VecDeque<usize>>, seed: i64, window: i64, fcm_window: i64, first429: i64,
    last429: i64, used: usize, retry_used: usize, fcm_count: usize, got429: usize, new429: usize, max_retry_share: usize, sent_to: [usize; 3], maybe_twice: usize,
}
impl Sim {
    fn new(mode: Mode) -> Sim {
        let mut s = Sim { mode, seed: 2_026, window: -1, fcm_window: -1, first429: -1, last429: -1, ..Default::default() };
        (s.attempts, s.deliveries, s.state, s.shown, s.handed) = (vec![0; MAX], vec![0; MAX], vec![0; MAX], vec![0; MAX], vec![-1; MAX]);
        (s.fresh, s.ready) = (vec![VecDeque::new(); 6], vec![VecDeque::new(); 6]);
        s.reqs.push(req(1_000, "login", MINSU, 1, SMS, URGENT, "login-minsu-1", false));
        s.reqs.push(req(10_000, "marketing", 1_000, FANS, PUSH, CAMPAIGN, "sale", false));
        s.reqs.push(req(11_000, "login", SORA, 1, PUSH, URGENT, "approve-sora-1", false));
        s.reqs.push(req(11_000, "order", SORA, 1, PUSH, NORMAL, "order-sora-1", false));
        s.reqs.push(req(35_000, "login", YUNA, 1, PUSH, URGENT, "approve-yuna-1", false));
        for i in 0..=800 { s.reqs.push(req(200_000 + 100 * i, "login", OTP_USERS + i, 1, SMS, URGENT, &format!("otp-{}", i), false)); }
        s.reqs.push(req(250_000, "login", MINSU, 1, SMS, URGENT, "login-minsu-2", true));
        s.reqs.push(req(251_000, "login", MINSU, 1, SMS, URGENT, "login-minsu-2", false));
        s.reqs.push(req(260_000, "order", DORA, 1, PUSH, NORMAL, "order-dora-1", false));
        s.reqs.push(req(299_990, "order", JISU, 1, PUSH, NORMAL, "order-jisu-5521", false));
        s.reqs.push(req(299_990, "order", JISU, 1, SMS, NORMAL, "order-jisu-5521-sms", false));
        for i in 0..s.reqs.len() { s.clock.schedule(s.reqs[i].at, Kind::Req, i); }
        s.clock.schedule(CRASH_AT, Kind::Crash, 0);
        s.clock.schedule(0, Kind::Tick, 0);
        s
    }
    fn put(&mut self, id: usize, retry: bool, front: bool) {
        let l = self.notices[id].ch * 3 + if self.mode == Mode::OneQueue { 0 } else { self.notices[id].prio };
        let q = if retry { &mut self.ready[l] } else { &mut self.fresh[l] };
        if front { q.push_front(id) } else { q.push_back(id) }
    }
    fn note(&mut self, t: i64, what: String) { self.notes[if t < 10_000 { 0 } else if t < 200_000 { 1 } else { 2 }].push(format!("t={}ms {}", t, what)); }
    fn count(&self, p: impl Fn(&Notice) -> bool) -> usize { self.notices.iter().filter(|n| p(n)).count() }
    fn slowest(&self, p: impl Fn(&Notice) -> bool) -> i64 { self.notices.iter().filter(|n| p(n)).map(|n| self.handed[n.id] - n.received).max().unwrap_or(-1) }
    fn named(&self, user: i64, ch: usize, prio: usize) -> usize { self.notices.iter().position(|n| n.user == user && n.ch == ch && n.prio == prio).unwrap() }
    fn below(&mut self, n: i64) -> i64 {
        self.seed = self.seed * 48_271 % 2_147_483_647;
        self.seed % n
    }
    fn run(mode: Mode) -> Sim {
        let mut s = Sim::new(mode);
        while let Some(e) = s.clock.next().filter(|e| e.at <= UNTIL) { s.handle(e); }
        s
    }
    fn handle(&mut self, e: Ev) {
        let t = e.at;
        match e.kind {
            Kind::Tick => self.tick(t),
            Kind::Req => self.request(e.a, t),
            Kind::Enq => self.put(e.a, false, false),
            Kind::Write => self.write(e.a),
            Kind::Ready => self.put(e.a, true, false),
            Kind::Resend => {
                let code = self.send(e.a, t, FCM);
                self.settle(e.a, code, FCM, t + RT);
            }
            Kind::Crash => self.crash(t),
            Kind::Visible => self.put(e.a, false, true),
        }
    }

    fn request(&mut self, ri: usize, t: i64) {
        let (service, user, count, ch, prio, lost) = (self.reqs[ri].service, self.reqs[ri].user, self.reqs[ri].count, self.reqs[ri].ch, self.reqs[ri].prio, self.reqs[ri].lost_reply);
        let key = self.reqs[ri].key.clone();
        if let Some(&old) = self.keys.get(&key) {
            let same = self.count(|n| n.key == key);
            self.note(t, format!("{}: sends key={} again, the api answers with n={} ({}) and adds nothing, notifications for that key {}", service, key, old, STATE[self.state[old]], same));
            return;
        }
        for u in user..user + count {
            let k = if count > 1 { format!("{}-{}", key, u) } else { key.clone() };
            self.keys.insert(k.clone(), self.notices.len());
            self.clock.schedule(t + STORE_RT, Kind::Enq, self.notices.len());
            self.notices.push(Notice { id: self.notices.len(), user: u, ch, prio, key: k, received: t });
        }
        let n = &self.notices[self.notices.len() - 1];
        let what = if count > 1 { format!("a campaign for {} users is stored", count) } else { format!("{} for {} key={} is stored as n={}", kind(n), who(n.user), key, n.id) };
        if user < OTP_USERS { self.note(t, format!("{}: {} and queued at {}ms, {}", service, what, t + STORE_RT, if lost { "the reply is lost" } else { "the reply goes back" })); }
    }
    fn tick(&mut self, t: i64) {
        if t + STEP <= UNTIL { self.clock.schedule(t + STEP, Kind::Tick, 0); }
        let w = (t / STEP % 2) as usize;
        if self.dead[w] { return; }
        if t / 1_000 != self.window { (self.window, self.used, self.retry_used) = (t / 1_000, 0, 0); }
        let mut items = Vec::new();
        for _ in 0..PER_TICK {
            if self.used >= QUOTA { break; }
            let Some(id) = self.take(PUSH) else { break };
            self.used += 1;
            items.push([id, FCM, self.send(id, t, FCM)]);
        }
        if self.fresh[0].len() + self.fresh[1].len() + self.fresh[2].len() > 0 { self.max_retry_share = self.max_retry_share.max(self.retry_used); }
        for _ in 0..PER_TICK {
            let Some(id) = self.take(SMS) else { break };
            let v = if self.breakers[0].allow(t) { SMS_A } else if self.breakers[1].allow(t) { SMS_B } else { SMS_A };
            items.push([id, v, self.send(id, t, v)]);
        }
        if items.is_empty() { return; }
        self.batches.push(Batch { worker: w, taken_at: t, items });
        self.clock.schedule(t + WRITE_AFTER, Kind::Write, self.batches.len() - 1);
    }
    fn take(&mut self, ch: usize) -> Option<usize> {
        for pass in 0..2 {
            for c in ch * 3..ch * 3 + 3 {
                if !self.ready[c].is_empty() && (pass == 1 || ch == SMS || self.retry_used < SHARE) {
                    self.retry_used += if ch == PUSH { 1 } else { 0 };
                    return self.ready[c].pop_front();
                }
                if pass == 0 && !self.fresh[c].is_empty() { return self.fresh[c].pop_front(); }
            }
        }
        None
    }

    fn send(&mut self, id: usize, t: i64, v: usize) -> usize {
        self.maybe_twice += if self.state[id] == SENDING { 1 } else { 0 };
        self.state[id] = SENDING;
        if v == FCM { (self.fcm_count, self.fcm_window) = (if t / 1_000 == self.fcm_window { self.fcm_count + 1 } else { 1 }, t / 1_000); }
        let user = self.notices[id].user;
        let down = (v == FCM && t >= REGION_DOWN.0 && t < REGION_DOWN.1 && user % 5 < 3) || (v == SMS_A && t >= A_DOWN.0 && t < A_DOWN.1);
        let code = if v == FCM && self.fcm_count > QUOTA { 429 } else if v == FCM && user == DORA { 404 } else if down { 500 } else { 200 };
        if code == 429 && self.first429 < 0 { self.first429 = t; }
        if code == 429 { self.last429 = t; }
        self.got429 += if code == 429 { 1 } else { 0 };
        self.new429 += if code == 429 && self.attempts[id] == 0 { 1 } else { 0 };
        self.sent_to[v] += 1;
        self.deliveries[id] += if code == 200 { 1 } else { 0 };
        if code == 200 && (self.notices[id].ch == SMS || self.deliveries[id] == 1) { self.shown[id] += 1; }
        if code == 200 && self.handed[id] < 0 { self.handed[id] = t + RT; }
        code
    }
    fn write(&mut self, bi: usize) {
        let (w, taken) = (self.batches[bi].worker, self.batches[bi].taken_at);
        if self.dead[w] { return; }
        for k in 0..self.batches[bi].items.len() {
            let [id, v, code] = self.batches[bi].items[k];
            self.settle(id, code, v, taken + RT);
            if self.notices[id].user == MINSU && self.notices[id].received < 10_000 { self.note(taken, format!("worker {}: takes n={} first from the urgent sms queue, {} answers {} at {}ms, recorded at {}ms, handed over {}ms after it was received", w, id, VENDOR[v], code, taken + RT, taken + WRITE_AFTER, self.handed[id] - self.notices[id].received)); }
        }
    }
    fn settle(&mut self, id: usize, code: usize, v: usize, at: i64) {
        let change = if v == FCM { None } else { self.breakers[v - 1].record(code == 200, at) };
        if let Some(c) = change { self.note(at, format!("{}: {}", VENDOR[v], c)); }
        if code == 404 { self.note(at, format!("fcm: 404 UNREGISTERED for {}'s push n={}, the token is removed and the push is not retried", who(self.notices[id].user), id)); }
        self.state[id] = if code == 200 { HANDED } else if code == 404 { TOKEN_REMOVED } else { 0 };
        if code == 200 || code == 404 { return; }
        self.attempts[id] += 1;
        if self.attempts[id] >= MAX_ATTEMPTS { self.state[id] = FAILURE_QUEUE; }
        if self.attempts[id] >= MAX_ATTEMPTS { return; }
        let d = BACKOFF[self.notices[id].ch] << (self.attempts[id] - 1);
        let wait = d + self.below(d);
        self.clock.schedule(at + wait, if self.mode == Mode::NoShare && self.notices[id].ch == PUSH { Kind::Resend } else { Kind::Ready }, id);
    }

    fn crash(&mut self, t: i64) {
        self.dead[0] = true;
        for bi in 0..self.batches.len() {
            let (w, taken) = (self.batches[bi].worker, self.batches[bi].taken_at);
            if w != 0 || taken + WRITE_AFTER <= t { continue; }
            let items = self.batches[bi].items.clone();
            for it in &items { self.clock.schedule(taken + VISIBILITY, Kind::Visible, it[0]); }
            let what: Vec<String> = items.iter().map(|it| format!("{} n={} to {}", kind(&self.notices[it[0]]), it[0], VENDOR[it[1]])).collect();
            self.note(t, format!("worker 0: stops after the vendors answered 200 at {}ms for {}, before recording at {}ms", taken + RT, what.join(" and "), taken + WRITE_AFTER));
            self.note(taken + VISIBILITY, format!("queue: the same {} become visible again {}ms after worker 0 took them, worker 1 sends them again", items.len(), VISIBILITY));
        }
    }

    fn push_line(&self, label: &str) -> String {
        let (urgent, normal) = (self.handed[self.named(SORA, PUSH, URGENT)] - 11_000, self.handed[self.named(SORA, PUSH, NORMAL)] - 11_000);
        format!("{}: sora's urgent push was handed over {}ms after it was received, her normal push after {}ms, the last of the {} campaign pushes after {}ms", label, urgent, normal, FANS, self.slowest(|n| n.prio == CAMPAIGN))
    }
    fn region_line(&self, label: &str) -> String {
        let first_try = self.count(|n| n.ch == PUSH && self.attempts[n.id] == 0 && self.handed[n.id] >= REGION_DOWN.0 && self.handed[n.id] < REGION_DOWN.1);
        let share = if self.mode == Mode::NoShare { "retries skip the quota check".to_string() } else { format!("retries took at most {} of the {} tokens a second while new pushes waited", self.max_retry_share, QUOTA) };
        let when = if self.got429 == 0 { String::new() } else { format!(" from {}ms to {}ms", self.first429, self.last429) };
        let yuna = self.named(YUNA, PUSH, URGENT);
        format!("{}: fcm region down {}-{}ms, {}, 429 from fcm {}{} ({} on a first try), yuna's urgent push in the failed region after {}ms and {} failures, pushes through on a first try in that time {}, the last campaign push after {}ms, failure queue {}", label, REGION_DOWN.0, REGION_DOWN.1, share, self.got429, when, self.new429, self.handed[yuna] - self.notices[yuna].received, self.attempts[yuna], first_try, self.slowest(|n| n.prio == CAMPAIGN), self.count(|n| self.state[n.id] == FAILURE_QUEUE))
    }
    fn report(&mut self) {
        let otp = |n: &Notice| n.user >= OTP_USERS;
        let sms = format!("sms: {} urgent from 200000ms to 280000ms, sent to A {} times and to B {} times, {} failed at A and went out later, the slowest was handed over {}ms after it was received", self.count(otp), self.sent_to[SMS_A], self.sent_to[SMS_B], self.count(|n| otp(n) && self.attempts[n.id] > 0), self.slowest(otp));
        let (p, s) = (self.named(JISU, PUSH, NORMAL), self.named(JISU, SMS, NORMAL));
        let device = format!("jisu's device: push n={} arrived {} times, on screen {} (the same tag replaces it), sms n={} arrived {} times, on screen {}", p, self.deliveries[p], self.shown[p], s, self.deliveries[s], self.shown[s]);
        let total = format!("guide: {} notifications, handed over {}, token removed {}, failure queue {}, still waiting {}, arrived twice on devices {}, flagged by the platform as maybe sent twice {}", self.notices.len(), self.count(|n| self.state[n.id] == HANDED), self.count(|n| self.state[n.id] == TOKEN_REMOVED), self.count(|n| self.state[n.id] == FAILURE_QUEUE), self.count(|n| self.state[n.id] == 0), self.count(|n| self.deliveries[n.id] > 1), self.maybe_twice);
        self.notes[2].extend([sms, device, total]);
    }
}
const HEADS: [&str; 3] = ["-- scenario 1: login asks for one urgent sms while nothing else is running --", "-- scenario 2: a campaign for 10000 users comes first, urgent and normal pushes 1000ms later, an fcm region fails --", "-- scenario 3: sms A fails 220000-240000ms, a reply is lost, a token is gone, worker 0 stops before recording --"];

fn main() {
    let mut g = Sim::run(Mode::Guide);
    let (one, none) = (Sim::run(Mode::OneQueue), Sim::run(Mode::NoShare));
    g.report();
    let lines = [g.push_line("guide"), one.push_line("one-queue"), g.region_line("guide"), none.region_line("no-share")];
    g.notes[1].extend(lines);
    for (i, head) in HEADS.iter().enumerate() {
        println!("{}", head);
        for line in &g.notes[i] { println!("{}", line); }
    }
}
