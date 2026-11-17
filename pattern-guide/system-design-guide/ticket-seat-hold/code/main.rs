use std::cmp::Reverse;
use std::collections::{BTreeMap, BinaryHeap};

#[derive(PartialEq, Eq, PartialOrd, Ord, Clone, Copy)]
enum Kind { Refresh, Admit, Map, Hold, Write, Pay, Confirm }

#[derive(PartialEq, Eq, Clone, Copy, Default)]
enum Mode { #[default] Guide, ForUpdate, Split, Optimistic, InsertOnly, NoUnique }

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

#[derive(Clone, Default)]
struct Seat { status: i64, holder: usize, no: i64, sales: i64, shown: i64, until: i64, lock: i64 }

#[derive(Clone)]
struct User { want: usize, no: i64, read: i64, entry: i64, first: i64 }

const APP_NET: i64 = 50;
const DB_NET: i64 = 1;
const PICK: i64 = 20_000;
const ENTRY: i64 = 280_000;
const PAY_RTT: i64 = 2_000;
const HOLD_TTL: i64 = 600_000;
const TICK: i64 = 1_000;
const SPAN: i64 = 60_000;
const PRICE: i64 = 110_000;
const RATE: i64 = 10;
const WINDOW: i64 = 100;
const FREE: i64 = 0;
const HELD: i64 = 1;
const SOLD: i64 = 2;
const SHOWN: [&str; 3] = ["free", "held", "sold"];

#[derive(Default)]
struct TicketSeatHold {
    mode: Mode, room: bool, traced_user: i64, traced_seat: i64, seat: Vec<Seat>, user: Vec<User>, clock: VirtualClock,
    per_second: BTreeMap<i64, i64>, sold_to: String, names: Vec<&'static str>,
    seed: i64, down_from: i64, down_to: i64, map_at: i64, last_sale: i64, wait_max: i64, sold_out_at: i64,
    admitted: usize, choosing: i64, inside: i64, inside_max: i64, map_free: i64, map_sold: usize,
    tries: i64, statements: i64, ok: i64, refused: i64, twice: i64, conflicts: i64, refunds: i64,
}

impl TicketSeatHold {
    fn new(mode: Mode, seats: usize, people: usize, room: bool, traced_user: i64, traced_seat: i64) -> Self {
        let user = User { want: 0, no: 0, read: 0, entry: ENTRY, first: -1 };
        let mut s = TicketSeatHold { mode, room, traced_user, traced_seat, seat: vec![Seat::default(); seats], user: vec![user; people], seed: 2026, down_from: -1, down_to: -1, ..Default::default() };
        if room { s.clock.schedule(0, Kind::Refresh, 0); }
        if room { s.clock.schedule(0, Kind::Admit, 0); }
        s
    }

    fn name(&self, u: usize) -> String { if self.names.is_empty() { format!("U{}", u + 1) } else { self.names[u].to_string() } }
    fn arrive(&self, u: usize) -> i64 { u as i64 * SPAN / self.user.len() as i64 }
    fn busy(&self) -> bool { self.inside > 0 || (self.room && self.sold_out_at == 0 && self.admitted < self.user.len()) }
    fn count(&mut self, now: i64) { *self.per_second.entry(now / TICK).or_insert(0) += 1; }

    fn below(&mut self, n: i64) -> i64 {
        self.seed = self.seed * 48_271 % 2_147_483_647;
        self.seed % n
    }

    fn shown(x: &Seat, now: i64) -> i64 { if x.status == SOLD { SOLD } else if x.status == HELD && x.until > now { HELD } else { FREE } }
    fn free(&self, x: &Seat, now: i64) -> bool { if self.mode == Mode::ForUpdate { x.status != SOLD && x.lock < now } else { Self::shown(x, now) == FREE } }
    fn state(&self, x: &Seat, now: i64) -> String { if Self::shown(x, now) == SOLD { "sold".to_string() } else { format!("held by {} until {}ms", self.name(x.holder), x.until) } }
    fn approval(&self, pay_at: i64) -> i64 { (if pay_at >= self.down_from && pay_at < self.down_to { self.down_to } else { pay_at }) + PAY_RTT }

    fn trace(&self, at: i64, u: usize, s: i64, what: &str) {
        if u as i64 == self.traced_user || (s >= 0 && s == self.traced_seat) { println!("t={}ms {} {}", at, self.name(u), what); }
    }

    fn refresh(&mut self, now: i64) {
        self.map_at = now;
        self.map_free = 0;
        self.map_sold = 0;
        for s in 0..self.seat.len() {
            let was = self.seat[s].shown;
            self.seat[s].shown = Self::shown(&self.seat[s], now);
            if self.seat[s].shown == FREE { self.map_free += 1; }
            if self.seat[s].shown == SOLD { self.map_sold += 1; }
            if s as i64 == self.traced_seat && self.seat[s].shown != was { println!("t={}ms map: seat {} shows {}", now, s + 1, SHOWN[self.seat[s].shown as usize]); }
        }
        if self.busy() { self.clock.schedule(now + TICK, Kind::Refresh, 0); }
    }

    fn admit(&mut self, now: i64) {
        if self.map_sold == self.seat.len() && self.sold_out_at == 0 { self.sold_out_at = now; }
        let mut n = 0;
        while self.sold_out_at == 0 && self.admitted < self.user.len() && self.arrive(self.admitted) <= now && n < RATE && self.choosing < self.map_free {
            let u = self.admitted;
            self.admitted += 1;
            self.choosing += 1;
            self.inside += 1;
            self.inside_max = self.inside_max.max(self.inside);
            self.trace(now, u, -1, &format!("room: arrived at {}ms, admitted with a token", self.arrive(u)));
            self.clock.schedule(now + APP_NET, Kind::Map, u);
            n += 1;
        }
        if self.busy() { self.clock.schedule(now + TICK, Kind::Admit, 0); }
    }

    fn open_map(&mut self, now: i64, u: usize) {
        self.count(now);
        if self.map_free == 0 {
            self.choosing -= 1;
            self.inside -= 1;
            self.trace(now, u, -1, "api: no free seat on the map, leaves");
            return;
        }
        let r = self.below(self.map_free.min(WINDOW)) as usize;
        let s = (0..self.seat.len()).filter(|&i| self.seat[i].shown == FREE).nth(r).unwrap();
        self.user[u].want = s;
        if u as i64 == self.traced_user { self.traced_seat = s as i64; }
        self.trace(now, u, s as i64, &format!("api: seat map refreshed at {}ms, free={}, picks seat {}", self.map_at, self.map_free, s + 1));
        self.clock.schedule(now + APP_NET + PICK + APP_NET + DB_NET, Kind::Hold, u);
    }

    fn hold(&mut self, now: i64, u: usize) {
        let w = self.user[u].want;
        if self.user[u].first < 0 {
            self.user[u].first = now;
            self.tries += 1;
            self.statements += 1;
            self.count(now);
        }
        let two_step = self.mode == Mode::Split || self.mode == Mode::Optimistic;
        let x = self.seat[w].clone();
        if self.mode == Mode::ForUpdate && x.status != SOLD && x.lock >= now {
            self.trace(now, u, w as i64, &format!("db: SELECT seat {} FOR UPDATE -> waits for {}'s lock until {}ms", w + 1, self.name(x.holder), x.lock));
            self.clock.schedule(x.lock, Kind::Hold, u);
        } else if !self.free(&x, now) {
            self.refuse(now, u, &format!("db: {} seat {} -> {}{}", if two_step { "SELECT" } else { "UPDATE" }, w + 1, if two_step { "" } else { "0 rows, " }, self.state(&x, now)));
        } else if two_step {
            self.user[u].read = x.no;
            self.trace(now, u, w as i64, &format!("db: SELECT seat {} -> free, hold_no={}", w + 1, x.no));
            self.clock.schedule(now + 2 * DB_NET, Kind::Write, u);
        } else { self.grant(now, u); }
    }

    fn write(&mut self, now: i64, u: usize) {
        let w = self.user[u].want;
        self.statements += 1;
        if self.mode == Mode::Optimistic && self.seat[w].no != self.user[u].read {
            self.conflicts += 1;
            self.refuse(now, u, &format!("db: UPDATE seat {} WHERE hold_no={} -> 0 rows, version changed", w + 1, self.user[u].read));
        } else { self.grant(now, u); }
    }

    fn grant(&mut self, now: i64, u: usize) {
        let w = self.user[u].want;
        let other = self.seat[w].status == HELD && self.seat[w].until > now;
        let before = if other { format!(", but {} was told held too", self.name(self.seat[w].holder)) } else { String::new() };
        if other { self.twice += 1; }
        if self.mode != Mode::ForUpdate { self.seat[w].status = HELD; }
        self.seat[w].holder = u;
        self.seat[w].no += 1;
        self.seat[w].until = now + HOLD_TTL;
        self.user[u].no = self.seat[w].no;
        self.ok += 1;
        self.choosing -= 1;
        self.wait_max = self.wait_max.max(now - self.user[u].first);
        self.user[u].first = -1;
        let pay_at = now + DB_NET + APP_NET + self.user[u].entry + APP_NET;
        if self.mode == Mode::ForUpdate { self.seat[w].lock = self.approval(pay_at) + DB_NET; }
        let x = &self.seat[w];
        let how = if self.mode == Mode::ForUpdate { format!("FOR UPDATE -> locked until {}ms", x.lock) } else { format!("-> 1 row, hold_no={} until={}ms", x.no, x.until) };
        self.trace(now, u, w as i64, &format!("db: {} seat {} {}{}", if self.mode == Mode::ForUpdate { "SELECT" } else { "UPDATE" }, w + 1, how, before));
        self.clock.schedule(pay_at, Kind::Pay, u);
    }

    fn refuse(&mut self, now: i64, u: usize, what: &str) {
        self.refused += 1;
        self.wait_max = self.wait_max.max(now - self.user[u].first);
        self.user[u].first = -1;
        self.trace(now, u, self.user[u].want as i64, what);
        if self.room { self.clock.schedule(now + DB_NET + APP_NET + APP_NET, Kind::Map, u); }
    }

    fn pay(&mut self, now: i64, u: usize) {
        self.count(now);
        let down = now >= self.down_from && now < self.down_to;
        self.trace(now, u, self.user[u].want as i64, &format!("api: pay {} won -> payment service{}", PRICE, if down { format!(", which is down until {}ms", self.down_to) } else { String::new() }));
        self.clock.schedule(self.approval(now) + DB_NET, Kind::Confirm, u);
    }

    fn confirm(&mut self, now: i64, u: usize) {
        let (w, no) = (self.user[u].want, self.user[u].no);
        self.count(now);
        self.inside -= 1;
        let row_check = self.mode != Mode::InsertOnly && self.mode != Mode::NoUnique;
        let x = &self.seat[w];
        let mine = self.mode == Mode::ForUpdate || (x.status == HELD && x.no == no && x.until > now);
        let update = format!("confirm UPDATE seat {} hold_no={} -> ", w + 1, no);
        if row_check && !mine { self.refund(now, u, &format!("{}0 rows (seat hold_no={}), rollback, no INSERT", update, x.no)); }
        else if self.mode != Mode::NoUnique && x.sales > 0 { self.refund(now, u, &format!("INSERT sale seat {} -> 23505 unique_violation, rollback", w + 1)); }
        else {
            if row_check { self.seat[w].status = SOLD; }
            self.seat[w].sales += 1;
            self.last_sale = now;
            self.sold_to = format!("{} {}", self.sold_to, self.name(u));
            let head = if row_check { format!("{}1 row, INSERT sale", update) } else { format!("INSERT sale seat {}", w + 1) };
            self.result(now, u, &format!("db: payment approved, {} -> 1 row, commit", head));
            if u as i64 == self.traced_user { println!("t={}ms {} app: ticket for seat {}", now + DB_NET + APP_NET, self.name(u), w + 1); }
        }
    }

    fn refund(&mut self, now: i64, u: usize, what: &str) {
        self.refunds += 1;
        self.result(now, u, &format!("db: payment approved, {}, refund {} won", what, PRICE));
    }

    fn result(&self, at: i64, u: usize, what: &str) {
        if !self.names.is_empty() && self.traced_seat < 0 { println!("t={}ms {} {}", at, self.name(u), what); }
        else { self.trace(at, u, self.user[u].want as i64, what); }
    }

    fn run(&mut self) -> &mut Self {
        while let Some(ev) = self.clock.next() {
            match ev.kind {
                Kind::Refresh => self.refresh(ev.at),
                Kind::Admit => self.admit(ev.at),
                Kind::Map => self.open_map(ev.at, ev.arg),
                Kind::Hold => self.hold(ev.at, ev.arg),
                Kind::Write => self.write(ev.at, ev.arg),
                Kind::Pay => self.pay(ev.at, ev.arg),
                Kind::Confirm => self.confirm(ev.at, ev.arg),
            }
        }
        self
    }

    fn stats(&self) -> String {
        let sold: i64 = self.seat.iter().map(|x| x.sales).sum();
        let twice_sold = self.seat.iter().filter(|x| x.sales > 1).count();
        format!("tries={} hold-statements={} held={} refused={} told-held-twice={} refunds={} sales={} double-sold={} hold-reply-max={}ms",
            self.tries, self.statements, self.ok, self.refused, self.twice, self.refunds, sold, twice_sold, self.wait_max + 2 * (APP_NET + DB_NET))
    }

    fn room_stats(&self) -> String {
        format!("admitted={} last-admitted-arrived={}ms on-booking-path-max={} booking-requests-per-second-max={} last-sale={}ms sold-out-notice={}ms in-line={}",
            self.admitted, self.arrive(self.admitted - 1), self.inside_max, self.per_second.values().max().unwrap(), self.last_sale, self.sold_out_at, self.user.len() - self.admitted)
    }
}

fn arrivals_peak(people: i64) -> i64 {
    let mut per: BTreeMap<i64, i64> = BTreeMap::new();
    for u in 0..people { *per.entry(u * SPAN / people / TICK).or_insert(0) += 1; }
    *per.values().max().unwrap()
}

fn main() {
    println!("-- scenario 1: U1 is first in line and buys one of 500 seats, no load and no failure --");
    let mut one = TicketSeatHold::new(Mode::Guide, 500, 1, true, 0, -1);
    println!("one booking: {}", one.run().stats());
    println!("-- scenario 2: 20000 people arrive within 60s for 500 seats, the room admits up to 10 per second --");
    let modes = [Mode::Guide, Mode::ForUpdate, Mode::Split, Mode::Optimistic];
    let labels = ["guide", "for-update", "split-select-update", "optimistic-version"];
    for i in 0..modes.len() {
        let mut s = TicketSeatHold::new(modes[i], 500, 20_000, true, -1, if i % 2 == 0 { 22 } else { -1 });
        println!("{}: {}{}", labels[i], s.run().stats(), if modes[i] == Mode::Optimistic { format!(" version-conflicts={}", s.conflicts) } else { String::new() });
        if i < 2 { println!("{} room: {}", labels[i], s.room_stats()); }
    }
    println!("no room: every arrival opens the seat map at once, booking-requests-per-second-max={} on-booking-path-max=20000", arrivals_peak(20_000));
    println!("-- scenario 3: A holds the last seat, the payment service stops 594000~606000ms while A pays, B presses every 60s from 300000ms --");
    let late = [Mode::Guide, Mode::InsertOnly, Mode::NoUnique];
    let late_labels = ["guide", "insert-only", "insert-only-no-unique"];
    for i in 0..late.len() {
        let mut s = TicketSeatHold::new(late[i], 1, 2, false, -1, if i == 0 { 0 } else { -1 });
        s.names = vec!["A", "B"];
        s.down_from = 594_000;
        s.down_to = 606_000;
        s.user[0].entry = 594_899;
        s.clock.schedule(0, Kind::Hold, 0);
        for t in (300_000..=600_000).step_by(60_000) { s.clock.schedule(t, Kind::Hold, 1); }
        println!("{}: {} seat 1 sold to{}", late_labels[i], s.run().stats(), s.sold_to);
    }
}
