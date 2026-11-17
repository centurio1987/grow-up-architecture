use std::cmp::Reverse;
use std::collections::{BTreeMap, BTreeSet, BinaryHeap};

#[derive(PartialEq, Eq, PartialOrd, Ord, Clone, Copy)]
enum Kind { Begin, Pg, Commit, Reply, Relay, Confirm, Reconcile }

#[derive(PartialEq, Eq, Clone, Copy, Default)]
enum Mode { #[default] Keyed, NoKey, Lock, TimeoutFails, NewPgKey, NoCutoff }

#[derive(PartialEq, Eq, Clone, Copy)]
enum St { Processing, Unknown, Succeeded, Failed }

#[derive(PartialEq, Eq, PartialOrd, Ord)]
struct Ev { at: i64, seq: u64, kind: Kind, arg: i64 }

#[derive(Clone)]
struct Reply { code: i64, body: String }

#[derive(Clone)]
struct Req { key: i64, order: i64, amount: i64, body: String, tries: usize, retries: bool, lose: bool }

struct Pay { key: i64, order: i64, amount: i64, started: i64 }
struct Call { pay: usize, req: i64 }

#[derive(Default)]
struct VirtualClock { queue: BinaryHeap<Reverse<Ev>>, seq: u64 }

impl VirtualClock {
    fn schedule(&mut self, at: i64, kind: Kind, arg: i64) {
        self.queue.push(Reverse(Ev { at, seq: self.seq, kind, arg }));
        self.seq += 1;
    }

    fn next(&mut self) -> Option<Ev> { self.queue.pop().map(|Reverse(e)| e) }
}

const APP_NET: i64 = 50;
const DB_NET: i64 = 1;
const PG_NET: i64 = 150;
const PG_TIMEOUT: i64 = 10_000;
const LOCK_TTL: i64 = 3_000;
const RELAY_EVERY: i64 = 1_000;
const CONFIRM_EVERY: i64 = 60_000;
const CONFIRM_FOR: i64 = 3_600_000;
const PG_KEEP: i64 = 10_800_000;
const RECONCILE_AT: i64 = 100_800_000;
const DOWN_FROM: i64 = 100_250;
const DOWN_TO: i64 = DOWN_FROM + 14_400_000;
const BACKOFF: [i64; 3] = [1_000, 2_000, 4_000];
const NAMES: [&str; 4] = ["processing", "unknown", "succeeded", "failed"];

#[derive(Default)]
struct PaymentIdempotency {
    mode: Mode, loud: bool, traced: i64, clock: VirtualClock,
    reqs: Vec<Req>, replies: Vec<Option<Reply>>, pays: Vec<Pay>, states: Vec<St>, calls: Vec<Call>, outbox: Vec<usize>, pg_log: Vec<usize>,
    waiting: BTreeSet<usize>, lost: BTreeSet<i64>, idem: BTreeMap<i64, (i64, usize)>, saved: BTreeMap<i64, Reply>,
    locks: BTreeMap<i64, i64>, pg_seen: BTreeMap<i64, i64>,
    db_tx: i64, next_key: i64, relayed: usize, conflicts: i64, replayed: i64, busy: i64, asks: i64, anomalies: i64,
}

fn fingerprint(body: &str) -> i64 {
    let mut h: i64 = 0;
    for ch in body.bytes() { h = (h * 31 + ch as i64) % 1_000_000_007; }
    h
}

impl PaymentIdempotency {
    fn new(mode: Mode, loud: bool, traced: i64) -> Self {
        PaymentIdempotency { mode, loud, traced, lost: [3, 4, 5].into(), ..Default::default() }
    }

    fn say(&self, at: i64, r: usize, what: &str) {
        if self.reqs[r].key == self.traced { println!("t={}ms K{} req={} {}", at, self.traced, r, what); }
    }

    fn note(&self, at: i64, p: usize, what: &str) { if self.loud { println!("t={}ms K{} {}", at, self.pays[p].key, what); } }

    fn send(&mut self, at: i64, key: i64, order: i64, amount: i64, tries: usize, retries: bool, lose: bool) {
        self.next_key = self.next_key.max(key + 1);
        self.reqs.push(Req { key, order, amount, body: format!("order=O{}&amount={}", order, amount), tries, retries, lose });
        self.replies.push(None);
        self.clock.schedule(at + APP_NET + DB_NET, Kind::Begin, self.reqs.len() as i64 - 1);
    }

    fn reply(&self, p: usize) -> Reply {
        let st = self.states[p];
        let code = if st == St::Succeeded { 201 } else if st == St::Failed { 402 } else { 202 };
        Reply { code, body: format!("{{\"payment\":\"P{}\",\"status\":\"{}\"}}", self.pays[p].key, NAMES[st as usize]) }
    }

    fn call(&mut self, now: i64, p: usize, r: i64) {
        self.calls.push(Call { pay: p, req: r });
        self.waiting.insert(self.calls.len() - 1);
        self.clock.schedule(now + DB_NET + PG_NET, Kind::Pg, self.calls.len() as i64 - 1);
        self.clock.schedule(now + DB_NET + PG_TIMEOUT + DB_NET, Kind::Commit, -(self.calls.len() as i64));
    }

    fn answer(&mut self, now: i64, r: usize, reply: Reply) {
        self.replies[r] = Some(reply);
        self.clock.schedule(now + DB_NET + APP_NET, Kind::Reply, r as i64);
    }

    fn settle(&mut self, now: i64, p: usize, st: St) {
        self.states[p] = st;
        if st != St::Unknown && self.idem.contains_key(&self.pays[p].key) { self.saved.insert(self.pays[p].key, self.reply(p)); }
        if st != St::Succeeded { return; }
        self.outbox.push(p);
        self.clock.schedule((now / RELAY_EVERY + 1) * RELAY_EVERY, Kind::Relay, 0);
    }

    fn begin(&mut self, now: i64, r: usize) {
        self.db_tx += 1;
        let q = self.reqs[r].clone();
        if self.loud { self.say(now - DB_NET, r, &format!("lb -> api-{} POST /payments {}", r % 2 + 1, q.body)); }
        let row = self.idem.get(&q.key).copied();
        let f = fingerprint(&q.body);
        let (fp, pay) = row.unwrap_or((f, 0));
        if self.mode == Mode::Lock && *self.locks.get(&q.key).unwrap_or(&0) > now {
            self.busy += 1;
            self.answer(now, r, Reply { code: 409, body: "{\"error\":\"locked\"}".to_string() });
        } else if self.mode == Mode::Lock || row.is_none() {
            self.pays.push(Pay { key: q.key, order: q.order, amount: q.amount, started: now });
            self.states.push(St::Processing);
            if self.mode == Mode::Lock { self.locks.insert(q.key, now + LOCK_TTL); } else { self.idem.insert(q.key, (f, self.pays.len() - 1)); }
            self.say(now, r, &format!("db: INSERT idempotency row + payment P{} (processing), commit", q.key));
            self.say(now + DB_NET, r, &format!("api -> pg approve, idempotency key P{}", q.key));
            self.call(now, self.pays.len() - 1, r as i64);
        } else if fp != f {
            println!("t={}ms K{} req={} db: same key, fingerprint {} != {} -> 422", now, q.key, r, f, fp);
            self.answer(now, r, Reply { code: 422, body: "{\"error\":\"different request body\"}".to_string() });
        } else if let Some(s) = self.saved.get(&q.key).cloned() {
            self.replayed += 1;
            self.say(now, r, "db: duplicate key, response saved -> replay it with Idempotent-Replayed: true");
            self.answer(now, r, s);
        } else if self.states[pay] == St::Processing {
            self.conflicts += 1;
            self.say(now, r, &format!("db: duplicate key, payment P{} processing -> 409", q.key));
            self.answer(now, r, Reply { code: 409, body: "{\"error\":\"in progress\"}".to_string() });
        } else {
            self.say(now, r, &format!("db: duplicate key, payment P{} unknown -> ask pg again with key P{}", q.key, q.key));
            self.call(now, pay, r as i64);
        }
    }

    fn pg(&mut self, now: i64, id: usize) {
        let (cp, creq) = (self.calls[id].pay, self.calls[id].req);
        let (key, order, amount) = (self.pays[cp].key, self.pays[cp].order, self.pays[cp].amount);
        if now >= DOWN_FROM && now < DOWN_TO {
            if creq >= 0 { self.note(now, cp, &format!("pg: down, approve request for P{} never arrives", key)); }
            return;
        }
        let pg_key = if self.mode == Mode::NewPgKey { 1_000_000 + id as i64 } else { cp as i64 };
        let fresh = self.pg_seen.get(&pg_key).map_or(true, |&seen| now - seen >= PG_KEEP);
        if fresh {
            self.pg_seen.insert(pg_key, now);
            self.pg_log.push(cp);
        }
        let drop = self.lost.remove(&order);
        let what = if fresh { format!("pg: approve P{} amount={}", key, amount) } else { format!("pg: key P{} seen, replay its approval", key) };
        let n = self.pg_log.iter().filter(|&&x| x == cp).count();
        self.note(now, cp, &format!("{} (approvals of P{}: {}){}", what, key, n, if drop { ", response lost" } else { "" }));
        if !drop { self.clock.schedule(now + PG_NET + DB_NET, Kind::Commit, id as i64 + 1); }
    }

    fn commit(&mut self, now: i64, id: usize, ok: bool) {
        if !self.waiting.remove(&id) { return; }
        self.db_tx += 1;
        let (cp, creq) = (self.calls[id].pay, self.calls[id].req);
        let st = self.states[cp];
        let next = if ok { St::Succeeded } else if self.mode == Mode::TimeoutFails { St::Failed } else { St::Unknown };
        if st == St::Processing || (st == St::Unknown && next != St::Unknown) {
            self.settle(now, cp, next);
            let why = if ok { ", save response 201 + outbox row, commit" } else { " after pg read timeout, commit" };
            let who = if creq < 0 { " (confirm job)" } else { "" };
            self.note(now, cp, &format!("db: payment P{} {}{}{}", self.pays[cp].key, NAMES[next as usize], why, who));
        }
        if creq >= 0 { self.answer(now, creq as usize, self.reply(cp)); }
    }

    fn receive(&mut self, now: i64, r: usize) {
        let q = self.reqs[r].clone();
        let a = self.replies[r].clone().unwrap();
        self.say(now, r, &if q.lose { "app: connection dropped, response lost".to_string() } else { format!("app: {} {}", a.code, a.body) });
        let again = q.lose || a.code == 409 || (a.code == 202 && q.retries);
        let anew = !q.lose && a.code == 402 && q.retries;
        let key = if anew || self.mode == Mode::NoKey { self.next_key } else { q.key };
        if again || anew { self.send(now + BACKOFF[q.tries.min(2)], key, q.order, q.amount, q.tries + 1, q.retries && !anew, false); }
    }

    fn relay(&mut self, now: i64) {
        while self.relayed < self.outbox.len() {
            let p = self.outbox[self.relayed];
            self.note(now, p, &format!("relay: outbox P{} -> order service, O{} paid", self.pays[p].key, self.pays[p].order));
            self.relayed += 1;
        }
    }

    fn confirm(&mut self, now: i64) {
        for p in 0..self.pays.len() {
            let young = now - self.pays[p].started < CONFIRM_FOR || self.mode == Mode::NoCutoff;
            if self.states[p] == St::Unknown && young {
                self.asks += 1;
                self.call(now, p, -1);
            }
        }
        if now + CONFIRM_EVERY < RECONCILE_AT { self.clock.schedule(now + CONFIRM_EVERY, Kind::Confirm, 0); }
    }

    fn reconcile(&mut self, now: i64) {
        let mut got = vec![0usize; self.pays.len()];
        for &p in &self.pg_log { got[p] += 1; }
        let (mut matched, mut succeeded, mut failed) = (0, 0, 0);
        for p in 0..self.pays.len() {
            let st = self.states[p];
            if st == St::Unknown && got[p] < 2 {
                self.settle(now, p, if got[p] == 1 { St::Succeeded } else { St::Failed });
                succeeded += got[p];
                failed += 1 - got[p];
            } else if (if st == St::Succeeded { 1 } else { 0 }) == got[p] { matched += 1; }
            else { self.anomalies += 1; }
        }
        if self.loud {
            println!("t={}ms reconcile with pg records: matched={} unknown->succeeded={} unknown->failed={} anomalies={} (confirm job asked pg again {} times before)",
                now, matched, succeeded, failed, self.anomalies, self.asks);
        }
    }

    fn stats(&self) -> String {
        let mut charged: BTreeMap<i64, i64> = BTreeMap::new();
        for &p in &self.pg_log { *charged.entry(self.pays[p].order).or_insert(0) += 1; }
        let twice = charged.values().filter(|&&n| n > 1).count();
        let succeeded = self.states.iter().filter(|&&s| s == St::Succeeded).count();
        format!("requests={} pg-approvals={} orders-charged-twice={} payments-succeeded={} order-notices={}",
            self.reqs.len(), self.pg_log.len(), twice, succeeded, self.relayed)
    }

    fn run(&mut self) -> &mut Self {
        while let Some(ev) = self.clock.next() {
            let (now, a) = (ev.at, ev.arg);
            match ev.kind {
                Kind::Begin => self.begin(now, a as usize),
                Kind::Pg => self.pg(now, a as usize),
                Kind::Commit => self.commit(now, (if a > 0 { a - 1 } else { -a - 1 }) as usize, a > 0),
                Kind::Reply => self.receive(now, a as usize),
                Kind::Relay => self.relay(now),
                Kind::Confirm => self.confirm(now),
                Kind::Reconcile => self.reconcile(now),
            }
        }
        self
    }
}

fn main() {
    println!("-- scenario 1: K1 pays 30000 for O1, one request and no failure --");
    let mut one = PaymentIdempotency::new(Mode::Keyed, true, 1);
    one.send(0, 1, 1, 30_000, 0, true, false);
    println!("one payment: {}", one.run().stats());
    println!("-- scenario 2: 580 attempts in the peak second, every 10th pressed twice 30ms apart, K104 resent with another amount --");
    for m in [Mode::Keyed, Mode::Lock] {
        let mut s = PaymentIdempotency::new(m, false, if m == Mode::Keyed { 109 } else { 0 });
        for i in 0..580 { s.send(i * 1000 / 580, 100 + i, 100 + i, 20_000, 0, true, false); }
        for i in (9..580).step_by(10) { s.send(i * 1000 / 580 + 30, 100 + i, 100 + i, 20_000, 0, true, false); }
        s.send(4 * 1000 / 580 + 30, 104, 104, 21_000, 0, true, false);
        s.run();
        let extra = if m == Mode::Keyed { format!(" 409={} replayed={}", s.conflicts, s.replayed) } else { format!(" lock-busy={}", s.busy) };
        let name = if m == Mode::Keyed { "idempotency-table" } else { "redis-lock-3s" };
        println!("{}: {} db-tx={}{}", name, s.stats(), s.db_tx, extra);
    }
    println!("-- scenario 3: first the response to K2 is lost on its way to the app --");
    let mut lost_reply = PaymentIdempotency::new(Mode::Keyed, true, 2);
    lost_reply.send(0, 2, 2, 30_000, 0, true, true);
    println!("with-key: {}", lost_reply.run().stats());
    let mut bare = PaymentIdempotency::new(Mode::NoKey, false, 0);
    bare.send(0, 2, 2, 30_000, 0, true, true);
    println!("no-key: {}", bare.run().stats());
    println!("-- then pg loses the approval responses for P3 P4 P5 and stops answering from 100250ms for 4 hours --");
    for m in [Mode::Keyed, Mode::TimeoutFails, Mode::NewPgKey, Mode::NoCutoff] {
        let mut s = PaymentIdempotency::new(m, m == Mode::Keyed, if m == Mode::Keyed { 3 } else { 0 });
        s.send(0, 3, 3, 50_000, 0, true, false);
        s.send(1_000, 4, 4, 40_000, 0, false, false);
        s.send(100_000, 5, 5, 70_000, 0, false, false);
        s.send(110_000, 6, 6, 15_000, 0, false, false);
        s.clock.schedule(CONFIRM_EVERY, Kind::Confirm, 0);
        s.clock.schedule(RECONCILE_AT, Kind::Reconcile, 0);
        let name = match m { Mode::Keyed => "this guide", Mode::TimeoutFails => "timeout-as-failure", Mode::NewPgKey => "new-pg-key-per-retry", _ => "no-confirm-cutoff" };
        let stats = s.run().stats();
        println!("{}: {} anomalies={}", name, stats, s.anomalies);
    }
}
