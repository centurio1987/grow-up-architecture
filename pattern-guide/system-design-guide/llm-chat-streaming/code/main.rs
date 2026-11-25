use std::cmp::Reverse;
use std::collections::{BTreeSet, BinaryHeap, HashMap, VecDeque};

#[derive(PartialEq, Clone, Copy)] enum Mode { Guide, OneQueue }
#[derive(PartialEq, Eq, PartialOrd, Ord)] enum Kind { Ask, Enq, Step, Check, Drop, Reconnect, Restart, Hang, Recover, Stop }
#[derive(PartialEq, Eq, PartialOrd, Ord)] struct Ev { at: i64, seq: u64, kind: Kind, a: usize }
#[derive(Default)] struct VirtualClock { queue: BinaryHeap<Reverse<Ev>>, seq: u64 }
impl VirtualClock {
    fn schedule(&mut self, at: i64, kind: Kind, a: usize) {
        self.queue.push(Reverse(Ev { at, seq: self.seq, kind, a }));
        self.seq += 1;
    }
    fn next(&mut self) -> Option<Ev> { self.queue.pop().map(|Reverse(e)| e) }
}
struct Conn { gateway: usize, last: usize, open: bool, end: &'static str, got: Vec<usize> }
impl Conn {
    fn receive(&mut self, seq: usize) {
        self.got.push(seq);
        self.last = seq;
    }
}
struct Run { id: usize, who: Option<&'static str>, tier: usize, received: i64, state: usize, worker: usize, made: usize, seq: usize, taken_at: i64, last_at: i64, first_at: i64, end_at: i64, trial: bool, conn: Option<Conn> }
const PAID: usize = 0;
const FREE: usize = 1;
const QUEUED: usize = 0;
const RUNNING: usize = 1;
const DONE: usize = 2;
const FAILED: usize = 3;
const CANCELED: usize = 4;
const REFUSED: usize = 5;
const CLOSED: usize = 0;
const OPEN: usize = 1;
const HALF_OPEN: usize = 2;
const WORKERS: usize = 2;
const SLOTS: usize = 48;
const TOKENS: usize = 290;
const CHUNK: usize = 5;
const FREE_EVERY: usize = 4;
const FAILS_TO_OPEN: usize = 3;
const LIMIT: [usize; 2] = [12, 32];
const RETRY_AFTER: [usize; 2] = [1, 8];
const STEP: i64 = 20;
const PREFILL: i64 = 220;
const STORE_RT: i64 = 2;
const TIMEOUT: i64 = 3_000;
const CHECK_EVERY: i64 = 1_000;
const OPEN_FOR: i64 = 30_000;
const RETRY: i64 = 1_000;
const UNTIL: i64 = 280_000;
const STATE: [&str; 6] = ["queued", "running", "finished", "failed", "stopped", "refused"];
const EVENT: [&str; 6] = ["", "", "done", "error", "stopped", ""];
const TIER: [&str; 2] = ["paid", "free"];

struct LlmChatStreaming { mode: Mode, clock: VirtualClock, runs: Vec<Run>, lanes: [VecDeque<usize>; 2], slots: [Vec<usize>; 2], notes: [Vec<String>; 3], kept: HashMap<usize, usize>, hung: [bool; 2], breaker: [usize; 2], fails: [usize; 2], longest: [usize; 2], opened_at: [i64; 2], takes: usize }
impl LlmChatStreaming {
    fn new(mode: Mode) -> Self {
        let notes = [
            vec!["-- scenario 1: minsu asks one question while nothing else is running --".to_string()],
            vec!["-- scenario 2: 20 questions a second for 60 seconds (every 5th paid), the gpus fit 16 runs a second --".to_string()],
            vec!["-- scenario 3: jisu's connection drops, gateway 1 restarts, gpu worker 1 stops making tokens, yuna presses stop --".to_string()]];
        let mut s = LlmChatStreaming { mode, clock: VirtualClock::default(), runs: vec![], lanes: Default::default(), slots: Default::default(), notes, kept: HashMap::new(), hung: [false; 2], breaker: [CLOSED; 2], fails: [0; 2], longest: [0; 2], opened_at: [0; 2], takes: 0 };
        s.ask(1_000, Some("minsu"), FREE);
        for i in 0..1_200 { s.ask(20_000 + 50 * i as i64, None, if i % 5 == 0 { PAID } else { FREE }); }
        let jisu = s.ask(200_000, Some("jisu"), PAID);
        s.ask(210_000, Some("sora"), FREE);
        for i in 0..3 { s.ask(228_000 + 40 * i, if i == 0 { Some("doyun") } else { None }, if i == 2 { PAID } else { FREE }); }
        s.ask(235_000, Some("dora"), PAID);
        let yuna = s.ask(270_000, Some("yuna"), FREE);
        s.clock.schedule(204_250, Kind::Drop, jisu);
        s.clock.schedule(209_250, Kind::Reconnect, jisu);
        s.clock.schedule(213_000, Kind::Restart, 1);
        s.clock.schedule(230_000, Kind::Hang, 1);
        s.clock.schedule(250_000, Kind::Recover, 1);
        s.clock.schedule(273_220, Kind::Stop, yuna);
        s.clock.schedule(273_720, Kind::Stop, yuna);
        for w in 0..WORKERS { s.clock.schedule(10 * w as i64, Kind::Step, w); }
        s.clock.schedule(CHECK_EVERY, Kind::Check, 0);
        s
    }
    fn ask(&mut self, at: i64, who: Option<&'static str>, tier: usize) -> usize {
        let id = self.runs.len();
        self.runs.push(Run { id, who, tier, received: at, state: QUEUED, worker: 0, made: 0, seq: 0, taken_at: 0, last_at: 0, first_at: 0, end_at: 0, trial: false, conn: None });
        self.clock.schedule(at, Kind::Ask, id);
        id
    }
    fn basic(r: &Run) -> bool { r.received < 20_000 }
    fn lane(&self, id: usize) -> usize { if self.mode == Mode::OneQueue { PAID } else { self.runs[id].tier } }
    fn note(&mut self, t: i64, what: String) { self.notes[if t < 20_000 { 0 } else if t < 200_000 { 1 } else { 2 }].push(format!("t={}ms {}", t, what)); }
    fn who(&self, id: usize) -> &'static str { self.runs[id].who.unwrap_or("someone") }
    fn handle(&mut self, e: Ev) {
        let t = e.at;
        match e.kind {
            Kind::Ask => self.request(e.a, t),
            Kind::Enq => self.enqueue(e.a, t),
            Kind::Step => self.step(e.a, t),
            Kind::Check => self.check(t),
            Kind::Drop | Kind::Reconnect => self.link(e.a, e.kind == Kind::Reconnect, t),
            Kind::Restart => self.restart(e.a, t),
            Kind::Hang | Kind::Recover => self.hang(e.a, e.kind == Kind::Hang, t),
            Kind::Stop => self.stop(e.a, t),
        }
    }
    fn request(&mut self, id: usize, t: i64) {
        let l = self.lane(id);
        if self.mode == Mode::Guide && self.lanes[l].len() >= LIMIT[l] {
            self.runs[id].state = REFUSED;
        } else {
            self.clock.schedule(t + STORE_RT, Kind::Enq, id);
        }
    }
    fn enqueue(&mut self, id: usize, t: i64) {
        let l = self.lane(id);
        self.lanes[l].push_back(id);
        self.longest[l] = self.longest[l].max(self.lanes[l].len());
        let Some(who) = self.runs[id].who else { return };
        self.runs[id].conn = Some(Conn { gateway: if who == "sora" { 1 } else { 0 }, last: 0, open: true, end: "no end", got: vec![] });
        let r = &self.runs[id];
        if Self::basic(r) { self.note(r.received, format!("{} ({}): the question is written to the conversation store, run {} is queued at {}ms and the run id goes back", who, TIER[r.tier], id, t)); }
    }
    fn take(&mut self, w: usize, t: i64) -> Option<usize> {
        let pick = if self.lanes[PAID].is_empty() || (self.takes % FREE_EVERY == FREE_EVERY - 1 && !self.lanes[FREE].is_empty()) { FREE } else { PAID };
        let trial = self.breaker[w] == OPEN && t - self.opened_at[w] >= OPEN_FOR;
        if self.lanes[pick].is_empty() || (self.breaker[w] != CLOSED && !trial) { return None; }
        self.takes += 1;
        let id = self.lanes[pick].pop_front()?;
        let r = &mut self.runs[id];
        r.state = RUNNING;
        r.worker = w;
        r.taken_at = t;
        r.last_at = t;
        r.trial = trial;
        if trial { self.breaker[w] = HALF_OPEN; }
        if trial { self.note(t, format!("queue: gpu worker {} is half-open, {}'s run is its test run", w, self.who(id))); }
        Some(id)
    }
    fn step(&mut self, w: usize, t: i64) {
        let mut keep = vec![];
        for id in std::mem::take(&mut self.slots[w]) {
            let r = &mut self.runs[id];
            if r.state != RUNNING {
                if r.state == CANCELED { self.note(t, format!("gpu worker {}: drops {}'s stopped run, the slot is free {}ms after the stop and {} tokens are not made", w, self.who(id), t - self.runs[id].end_at, TOKENS - self.runs[id].made)); }
                continue;
            }
            keep.push(id);
            if self.hung[w] || t < r.taken_at + PREFILL { continue; }
            r.made += 1;
            if r.made % CHUNK == 0 || r.made == TOKENS { self.write(id, t); }
            if self.runs[id].made < TOKENS { continue; }
            self.end(id, t, DONE);
            keep.pop();
        }
        self.slots[w] = keep;
        while self.slots[w].len() < SLOTS {
            let Some(id) = self.take(w, t) else { break };
            self.slots[w].push(id);
        }
        if t + STEP <= UNTIL { self.clock.schedule(t + STEP, Kind::Step, w); }
    }
    fn write(&mut self, id: usize, t: i64) {
        let r = &mut self.runs[id];
        r.seq += 1;
        r.last_at = t;
        if r.seq == 1 { r.first_at = t; }
        let seq = r.seq;
        if let Some(c) = r.conn.as_mut().filter(|c| c.open) { c.receive(seq); }
        let r = &self.runs[id];
        if seq == 1 && Self::basic(r) { self.note(r.taken_at, format!("gpu worker {}: takes run {}, prefill until {}ms, id 1 is written to the token record at {}ms and the gateway sends it to {} over sse", r.worker, id, r.taken_at + PREFILL, t, self.who(id))); }
    }
    fn end(&mut self, id: usize, t: i64, state: usize) {
        let r = &mut self.runs[id];
        r.state = state;
        r.end_at = t;
        let seq = r.seq;
        if let Some(c) = r.conn.as_mut().filter(|c| c.open) { c.end = EVENT[state]; }
        self.kept.insert(id, seq);
        let r = &self.runs[id];
        if state == DONE && Self::basic(r) { self.note(t, format!("gpu worker {}: writes id {}, the answer goes to the conversation store and the stream ends {}ms after the question was received", r.worker, seq, t - r.received)); }
    }
    fn check(&mut self, t: i64) {
        for w in 0..WORKERS {
            let (mut failed, mut named, mut opened) = (0, String::new(), String::new());
            for id in self.slots[w].clone() {
                let r = &self.runs[id];
                if r.state != RUNNING { continue; }
                let ok = t - r.last_at < TIMEOUT;
                if ok && (r.seq == 0 || r.first_at <= t - CHECK_EVERY) { continue; }
                if !ok { failed += 1; }
                if !ok { self.end(id, t, FAILED); }
                if !ok && self.runs[id].who.is_some() { named = format!(" ({} after id {})", self.who(id), self.runs[id].seq); }
                if self.breaker[w] == OPEN || (self.breaker[w] == HALF_OPEN && !self.runs[id].trial) { continue; }
                if ok { self.fails[w] = 0; }
                if ok && self.breaker[w] == HALF_OPEN { self.note(t, format!("queue: the test run on gpu worker {} wrote id 1, its breaker closes", w)); }
                if ok { self.breaker[w] = CLOSED; }
                if !ok && self.breaker[w] == CLOSED { self.fails[w] += 1; }
                if ok || (self.breaker[w] == CLOSED && self.fails[w] < FAILS_TO_OPEN) { continue; }
                self.breaker[w] = OPEN;
                self.opened_at[w] = t;
                self.fails[w] = 0;
                opened = format!(", gpu worker {}'s breaker opens until {}ms", w, t + OPEN_FOR);
            }
            if failed > 0 { self.note(t, format!("queue: {} runs on gpu worker {} wrote nothing for {}ms or more, they fail with an error event{}{}", failed, w, TIMEOUT, named, opened)); }
        }
        if t + CHECK_EVERY <= UNTIL { self.clock.schedule(t + CHECK_EVERY, Kind::Check, 0); }
    }
    fn hang(&mut self, w: usize, stops: bool, t: i64) {
        self.hung[w] = stops;
        if stops { self.note(t, format!("gpu worker {}: stops making tokens with {} runs on it, it still asks the queue for runs", w, self.slots[w].len())); }
    }
    fn link(&mut self, id: usize, up: bool, t: i64) {
        let (seq, state, end_at) = (self.runs[id].seq, self.runs[id].state, self.runs[id].end_at);
        let (last, from) = (self.runs[id].conn.as_ref().unwrap().last, self.runs[id].conn.as_ref().unwrap().last);
        self.runs[id].conn.as_mut().unwrap().open = up;
        if !up { self.note(t, format!("{}: the connection drops after id {}, the run goes on", self.who(id), last)); }
        if !up { return; }
        let c = self.runs[id].conn.as_mut().unwrap();
        c.gateway = 0;
        for s in from + 1..=seq { c.receive(s); }
        if state >= DONE { c.end = EVENT[state]; }
        let rest = if state >= DONE { format!(", the run finished at {}ms", end_at) } else { ", the rest follow as they are written".to_string() };
        self.note(t, format!("{}: reconnects to gateway 0 with Last-Event-ID {}, {} ids were written while away and {} come at once{}", self.who(id), last, seq - last, seq - from, rest));
    }
    fn restart(&mut self, g: usize, t: i64) {
        for id in 0..self.runs.len() {
            let Some(c) = self.runs[id].conn.as_mut().filter(|c| c.open && c.gateway == g) else { continue };
            c.open = false;
            let last = c.last;
            self.clock.schedule(t + RETRY, Kind::Reconnect, id);
            self.note(t, format!("gateway {}: restarts, {}'s connection closes after id {}, the browser reconnects after retry {}ms", g, self.who(id), last, RETRY));
        }
    }
    fn stop(&mut self, id: usize, t: i64) {
        let (state, seq) = (self.runs[id].state, self.runs[id].seq);
        if state >= DONE { self.note(t, format!("{}: presses stop again, the api answers {} after id {} and changes nothing", self.who(id), STATE[state], seq)); }
        if state >= DONE { return; }
        let l = self.lane(id);
        if state == QUEUED { self.lanes[l].retain(|&x| x != id); }
        self.end(id, t, CANCELED);
        self.note(t, format!("{}: presses stop after id {}, the queue marks the run stopped in the token record and the api answers stopped after id {}", self.who(id), seq, seq));
    }
    fn user_line(&self, r: &Run) -> String {
        let c = r.conn.as_ref().unwrap();
        let once = c.got.iter().collect::<BTreeSet<_>>().len();
        let in_order = c.got.iter().enumerate().take_while(|&(i, &s)| s == i + 1).count();
        let more = if in_order < c.got.len() { format!(" and {} more", c.got.len() - in_order) } else { String::new() };
        format!("{}: run {} on gpu worker {}, first id {}ms after the question was received, got ids 1-{} in order{} then the {} event (missing {}, twice {}), the conversation store keeps the {} answer with {} ids", self.who(r.id), r.id, r.worker, r.first_at - r.received, in_order, more, c.end, r.seq - once, c.got.len() - once, STATE[r.state], self.kept[&r.id])
    }
    fn load_line(&self, label: &str) -> String {
        let mut line = format!("{}:", label);
        for tier in 0..2 {
            let load: Vec<&Run> = self.runs.iter().filter(|r| r.tier == tier && r.received >= 20_000 && r.received < 80_000).collect();
            let refused = load.iter().filter(|r| r.state == REFUSED).count();
            let worst = load.iter().filter(|r| r.state != REFUSED).map(|r| r.first_at - r.received).max().unwrap_or(0);
            let why = if refused > 0 { format!(" with 429 and Retry-After {}", RETRY_AFTER[tier]) } else { String::new() };
            line += &format!(" {} {} asked, {} answered with the first id at most {}ms after the question was received, {} refused{};", TIER[tier], load.len(), load.len() - refused, worst, refused, why);
        }
        let held = if self.mode == Mode::Guide { format!(" the paid lane held at most {} and the free lane {}", self.longest[PAID], self.longest[FREE]) } else { format!(" the one queue held at most {}", self.longest[PAID]) };
        line + &held
    }
    fn run(mode: Mode) -> Self {
        let mut s = LlmChatStreaming::new(mode);
        while let Some(e) = s.clock.next().filter(|e| e.at <= UNTIL) { s.handle(e); }
        s
    }
}
fn main() {
    let mut g = LlmChatStreaming::run(Mode::Guide);
    let lines = [g.load_line("guide"), LlmChatStreaming::run(Mode::OneQueue).load_line("one-queue")];
    g.notes[1].extend(lines);
    for id in 0..g.runs.len() {
        if g.runs[id].who.is_none() { continue; }
        let line = g.user_line(&g.runs[id]);
        g.notes[if LlmChatStreaming::basic(&g.runs[id]) { 0 } else { 2 }].push(line);
    }
    for line in g.notes.iter().flatten() { println!("{}", line); }
}
