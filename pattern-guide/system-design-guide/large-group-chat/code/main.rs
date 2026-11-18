use std::cmp::Reverse;
use std::collections::{BTreeMap, BinaryHeap, HashMap};

#[derive(PartialEq, Eq, PartialOrd, Ord, Clone, Copy)]
enum Kind { Forward, Room, Relay, Open, Resume, ReadDone, Stop }
#[derive(PartialEq, Eq, Clone, Copy, Default)]
enum Mode { #[default] Guide, AllWatching, Direct, RelayOrder, NoJitter, PubsubOnly }
#[derive(PartialEq, Eq, PartialOrd, Ord)]
struct Ev { at: i64, seq: u64, kind: Kind, a: usize, b: i64 }

#[derive(Default)]
struct VirtualClock { queue: BinaryHeap<Reverse<Ev>>, seq: u64 }

impl VirtualClock {
    fn schedule(&mut self, at: i64, kind: Kind, a: usize, b: i64) {
        self.queue.push(Reverse(Ev { at, seq: self.seq, kind, a, b }));
        self.seq += 1;
    }
    fn next(&mut self) -> Option<Ev> { self.queue.pop().map(|Reverse(e)| e) }
}

#[derive(Default)]
struct RoomLog { written_at: Vec<i64> }

impl RoomLog {
    fn append(&mut self, at: i64) { self.written_at.push(at); }
    fn last_written(&self, now: i64) -> i64 {
        let mut i = self.written_at.len();
        while i > 0 && self.written_at[i - 1] > now { i -= 1; }
        i as i64
    }
}

#[derive(Default, Clone, Copy)]
struct Catchup { upto: i64, newest: i64, recovering: bool }

const ONLINE: usize = 1_000_000;
const SIZE: usize = 15_000;
const RELAYS: usize = 67;
const PER_MS: i64 = 100;
const MAXLEN: i64 = 100_000;
const PASSIVE: u8 = 0;
const WATCHING: u8 = 1;
const AWAY_WATCHING: u8 = 2;
const LABEL: [&str; 6] = ["guide", "all-watching", "direct", "relay-order", "no-jitter", "pubsub-only"];
const APP_NET: i64 = 50;
const DC_NET: i64 = 1;
const GAP: i64 = 50;
const JITTER: i64 = 5_000;

#[derive(Default)]
struct LargeGroupChat {
    mode: Mode, every: usize, follow: usize, trace: bool,
    relay_of: Vec<usize>, last: Vec<i64>, state: Vec<u8>, catching: Vec<bool>,
    watchers: Vec<i64>, members: Vec<i64>, down: Vec<bool>, relay_busy: Vec<i64>, joiners: Vec<Vec<usize>>,
    catchups: HashMap<usize, Catchup>, names: HashMap<usize, String>, seen: HashMap<usize, String>,
    sent_at: Vec<i64>, message_of_seq: Vec<i64>, sender_of: Vec<usize>,
    resumes_per_second: BTreeMap<i64, i64>, reads_per_second: BTreeMap<i64, i64>, clock: VirtualClock, log: RoomLog,
    seed: i64, seq: i64, room_busy: i64, since: i64, delay_first: i64, delay_max: i64,
    room_sends: i64, relay_sends: i64, skipped: i64, dropped: i64, filled: i64, trimmed: i64,
    log_reads: i64, resumes: i64, lost: i64, gap_sessions: i64, recovered_max: i64,
}

impl LargeGroupChat {
    fn new(mode: Mode, follow: usize, name: &str) -> Self {
        let every = if mode == Mode::AllWatching { 1 } else { 10 };
        let mut c = LargeGroupChat { mode, every, follow, relay_of: vec![0; ONLINE], last: vec![0; ONLINE], state: vec![PASSIVE; ONLINE], catching: vec![false; ONLINE], watchers: vec![0; RELAYS], members: vec![0; RELAYS], down: vec![false; RELAYS], relay_busy: vec![0; RELAYS], joiners: vec![Vec::new(); RELAYS], seed: 2026, ..Default::default() };
        c.names.insert(follow, name.to_string());
        for s in 0..ONLINE {
            c.relay_of[s] = s / SIZE;
            c.members[s / SIZE] += 1;
            if s % every == 0 { c.state[s] = WATCHING; }
            if s % every == 0 { c.watchers[s / SIZE] += 1; }
        }
        c
    }

    fn name(&self, s: usize) -> String { self.names.get(&s).cloned().unwrap_or(format!("U{}", s)) }
    fn cost(n: i64) -> i64 { (n + PER_MS - 1) / PER_MS }
    fn say(at: i64, what: &str) { println!("t={}ms {}", at, what); }
    fn bump(per: &mut BTreeMap<i64, i64>, now: i64) { *per.entry(now / 1_000).or_insert(0) += 1; }
    fn peak(per: &BTreeMap<i64, i64>) -> i64 { per.values().copied().max().unwrap_or(0) }

    fn below(&mut self, n: i64) -> i64 {
        self.seed = self.seed * 48_271 % 2_147_483_647;
        self.seed % n
    }

    fn post(&mut self, at: i64, sender: usize) {
        if self.trace { Self::say(at, &format!("{} app: sends a message on its WebSocket", self.name(sender))); }
        self.sender_of.push(sender);
        self.sent_at.push(at);
        self.clock.schedule(at + APP_NET, Kind::Forward, self.relay_of[sender], self.sender_of.len() as i64 - 1);
    }

    fn traffic(&mut self, count: i64) {
        for k in 0..count {
            let sender = SIZE + 10 * self.below(((ONLINE - SIZE) / 10) as i64) as usize;
            self.post(k * GAP, sender);
        }
    }

    fn forward(&mut self, now: i64, r: usize, k: i64) {
        if self.mode == Mode::RelayOrder {
            for o in 0..RELAYS { self.clock.schedule(if o == r { now } else { now + DC_NET }, Kind::Relay, o, k); }
            return;
        }
        if self.trace { Self::say(now, &format!("relay {}: passes {}'s message to the room process", r + 1, self.name(self.sender_of[k as usize]))); }
        self.clock.schedule(now + DC_NET, Kind::Room, 0, k);
    }

    fn room(&mut self, now: i64, k: i64) {
        let start = now.max(self.room_busy);
        self.seq += 1;
        self.message_of_seq.push(k);
        if self.mode == Mode::Direct {
            self.room_busy = start + Self::cost(ONLINE as i64);
            self.room_sends += ONLINE as i64;
            self.arrived(k, self.room_busy + DC_NET + APP_NET);
            return;
        }
        self.log.append(start + DC_NET);
        self.room_busy = start + 2 * DC_NET + Self::cost(RELAYS as i64);
        self.room_sends += RELAYS as i64;
        if self.trace { Self::say(start, &format!("room: gives it seq={} and appends it to the room log", self.seq)); }
        if self.trace { Self::say(start + 2 * DC_NET, &format!("room: the log has seq={}, sends seq={} to {} relays", self.seq, self.seq, RELAYS)); }
        for r in 0..RELAYS { self.clock.schedule(self.room_busy + DC_NET, Kind::Relay, r, self.seq); }
    }

    fn arrived(&mut self, k: i64, at: i64) {
        let d = at - self.sent_at[k as usize];
        if k == 0 { self.delay_first = self.delay_first.max(d); }
        self.delay_max = self.delay_max.max(d);
    }

    fn relay(&mut self, now: i64, r: usize, x: i64) {
        if self.down[r] { return; }
        let w = self.watchers[r];
        self.relay_busy[r] = now.max(self.relay_busy[r]) + Self::cost(w);
        self.relay_sends += w;
        self.skipped += self.members[r] - w;
        let k = if self.mode == Mode::RelayOrder { x } else { self.message_of_seq[x as usize - 1] };
        let at = self.relay_busy[r] + APP_NET;
        if w > 0 { self.arrived(k, at); }
        if self.trace && r == 1 { Self::say(now, &format!("relay 2: seq={} to {} watching sessions, {} not watching are skipped, done at {}ms", x, w, self.members[r] - w, self.relay_busy[r])); }
        for s in (r * SIZE..(r * SIZE + SIZE).min(ONLINE)).step_by(self.every) { if self.relay_of[s] == r && self.state[s] == WATCHING { self.receive(s, x, k, at); } }
        for s in self.joiners[r].clone() { if self.relay_of[s] == r && self.state[s] == WATCHING { self.receive(s, x, k, at); } }
    }

    fn receive(&mut self, s: usize, x: i64, k: i64, at: i64) {
        let who = if self.seen.contains_key(&s) || (self.trace && s == self.follow) { self.name(self.sender_of[k as usize]) } else { String::new() };
        if let Some(v) = self.seen.get_mut(&s) { v.push_str(&format!(" {}", who)); }
        if self.mode == Mode::RelayOrder { return; }
        if x == self.last[s] + 1 && !self.catching[s] {
            self.last[s] = x;
            if self.trace && s == self.follow { Self::say(at, &format!("{} app: got {}'s message seq={}, last={}", self.name(s), who, x, self.last[s])); }
        } else if self.mode == Mode::PubsubOnly && x > self.last[s] {
            self.lost += x - self.last[s] - 1;
            self.gap_sessions += 1;
            self.last[s] = x;
        } else {
            self.dropped += 1;
            if !self.catching[s] && x > self.last[s] + 1 { self.catch_up(at - APP_NET, s); }
            if self.catching[s] { self.catchups.get_mut(&s).unwrap().newest = self.catchups[&s].newest.max(x); }
        }
    }

    fn catch_up(&mut self, now: i64, s: usize) {
        self.catching[s] = true;
        self.catchups.entry(s).or_default();
        self.read(now, s);
    }

    fn read(&mut self, now: i64, s: usize) {
        let first = (self.log.last_written(now + DC_NET) - MAXLEN + 1).max(1);
        self.trimmed += (first - self.last[s] - 1).max(0);
        self.last[s] = self.last[s].max(first - 1);
        self.catchups.get_mut(&s).unwrap().upto = self.log.last_written(now + DC_NET);
        self.log_reads += 1;
        Self::bump(&mut self.reads_per_second, now);
        self.clock.schedule(now + 2 * DC_NET, Kind::ReadDone, s, 0);
    }

    fn read_done(&mut self, now: i64, s: usize) {
        let c = self.catchups[&s];
        if s == self.follow { Self::say(now, &format!("relay {}: {} gets seq {}..{} from the room log", self.relay_of[s] + 1, self.name(s), self.last[s] + 1, c.upto)); }
        self.filled += (c.upto - self.last[s]).max(0);
        self.last[s] = self.last[s].max(c.upto);
        if c.newest > self.last[s] {
            self.read(now, s);
            return;
        }
        self.catchups.remove(&s);
        self.catching[s] = false;
        if c.recovering { self.recovered_max = self.recovered_max.max(now + APP_NET - self.since); }
        if s == self.follow { Self::say(now + APP_NET, &format!("{} app: last={}, caught up {}ms after {}", self.name(s), self.last[s], now + APP_NET - self.since, if c.recovering { "relay 1 stopped" } else { "opening the room" })); }
    }

    fn open(&mut self, now: i64, s: usize) {
        Self::say(now, &format!("{} app: opens the room it was not watching, last={}", self.name(s), self.last[s]));
        self.since = now;
        self.members[self.relay_of[s]] -= 1;
        self.state[s] = AWAY_WATCHING;
        self.clock.schedule(now + APP_NET, Kind::Resume, s, 0);
    }

    fn resume(&mut self, now: i64, s: usize) {
        let r = self.relay_of[s];
        let watch = self.state[s] == AWAY_WATCHING;
        self.state[s] = if watch { WATCHING } else { PASSIVE };
        self.members[r] += 1;
        self.resumes += 1;
        Self::bump(&mut self.resumes_per_second, now);
        if !watch { return; }
        self.watchers[r] += 1;
        self.joiners[r].push(s);
        if self.mode == Mode::PubsubOnly { return; }
        if s == self.follow { Self::say(now, &format!("relay {}: {} is watching, reads the room log after seq {}", r + 1, self.name(s), self.last[s])); }
        self.catch_up(now, s);
    }

    fn stop(&mut self, now: i64, r: usize) {
        self.down[r] = true;
        self.since = now;
        for s in r * SIZE..(r * SIZE + SIZE).min(ONLINE) {
            let watch = self.state[s] == WATCHING;
            let wait = if self.mode == Mode::NoJitter { 0 } else { self.below(JITTER) };
            self.state[s] = if watch { AWAY_WATCHING } else { PASSIVE };
            self.relay_of[s] = (r + 1 + s % (RELAYS - 1)) % RELAYS;
            if s == self.follow { Self::say(now, &format!("relay {}: stops, {} connections close, {} had last={} and waits {}ms to reconnect", r + 1, self.members[r], self.name(s), self.last[s], wait)); }
            if watch && self.mode != Mode::PubsubOnly { self.catchups.entry(s).or_default().recovering = true; }
            self.clock.schedule(now + wait + APP_NET, Kind::Resume, s, 0);
        }
    }

    fn run(&mut self) -> &mut Self {
        while let Some(e) = self.clock.next() {
            match e.kind {
                Kind::Forward => self.forward(e.at, e.a, e.b),
                Kind::Room => self.room(e.at, e.b),
                Kind::Relay => self.relay(e.at, e.a, e.b),
                Kind::Open => self.open(e.at, e.a),
                Kind::Resume => self.resume(e.at, e.a),
                Kind::ReadDone => self.read_done(e.at, e.a),
                Kind::Stop => self.stop(e.at, e.a),
            }
        }
        self
    }

    fn flow(&self) -> String {
        let behind = (0..ONLINE).filter(|&s| self.state[s] == WATCHING && self.last[s] < self.seq).count();
        let passive_got = (0..ONLINE).filter(|&s| self.state[s] == PASSIVE && self.last[s] > 0).count();
        let tail = if self.mode == Mode::Direct { String::new() } else { format!(" watching-behind={} not-watching-got={}", behind, passive_got) };
        format!("messages={} room-sends={} relay-sends={} skipped={} delay-first={}ms delay-max={}ms{}", self.seq, self.room_sends, self.relay_sends, self.skipped, self.delay_first, self.delay_max, tail)
    }

    fn recovery(&self) -> String {
        if self.mode == Mode::PubsubOnly { return format!("reconnected={} log-reads=0 lost={} sessions-with-gap={}", self.resumes, self.lost, self.gap_sessions); }
        format!("reconnected={} log-reads={} filled-from-log={} live-dropped={} trimmed={} gaps-left={} recovered-max={}ms reconnects-per-second-max={} log-reads-per-second-max={}",
            self.resumes, self.log_reads, self.filled, self.dropped, self.trimmed, self.catchups.len(), self.recovered_max, Self::peak(&self.resumes_per_second), Self::peak(&self.reads_per_second))
    }
}

fn main() {
    println!("-- scenario 1: A sends one message to a room with 1000000 online on 67 relays, 1 in 10 watching it --");
    let mut one = LargeGroupChat::new(Mode::Guide, 15_010, "V");
    one.trace = true;
    one.names.insert(0, "A".to_string());
    one.post(0, 0);
    println!("one message: {}", one.run().flow());
    println!("-- scenario 2: 20 messages per second for 5s, P opens the room at 2500ms --");
    for m in [Mode::Guide, Mode::AllWatching, Mode::Direct] {
        let mut c = LargeGroupChat::new(m, if m == Mode::Guide { 15_011 } else { usize::MAX }, "P");
        c.traffic(100);
        if m == Mode::Guide { c.clock.schedule(2_500, Kind::Open, 15_011, 0); }
        println!("{}: {}", LABEL[m as usize], c.run().flow());
    }
    println!("two senders press at the same ms, X on relay 1 and Y on relay 2:");
    for m in [Mode::Guide, Mode::RelayOrder] {
        let mut c = LargeGroupChat::new(m, 10, "V1");
        for (s, n) in [(0, "X"), (15_000, "Y"), (15_010, "V2")] { c.names.insert(s, n.to_string()); }
        for s in [10, 15_010] { c.seen.insert(s, String::new()); }
        c.post(0, 0);
        c.post(0, 15_000);
        c.run();
        println!("{}: V1 sees{}, V2 sees{}", LABEL[m as usize], c.seen[&10], c.seen[&15_010]);
    }
    println!("-- scenario 3: relay 1 stops at 2000ms while 20 messages per second go on, its 15000 sessions reconnect --");
    for m in [Mode::Guide, Mode::NoJitter, Mode::PubsubOnly] {
        let mut c = LargeGroupChat::new(m, if m == Mode::Guide { 0 } else { usize::MAX }, "R");
        c.traffic(200);
        c.clock.schedule(2_000, Kind::Stop, 0, 0);
        println!("{}: {}", LABEL[m as usize], c.run().recovery());
    }
}
