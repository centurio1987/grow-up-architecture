use std::cmp::Reverse;
use std::collections::BinaryHeap;

#[derive(PartialEq, Eq, PartialOrd, Ord, Clone, Copy)] enum Kind { Tick, App, Arrive, Retry, Release, Checkpoint, Stop, Restart }
#[derive(PartialEq, Eq, Clone, Copy, Default)] enum Mode { #[default] Guide, ByAd, NoDedup, ProcessingTime, NoTransaction, AtLeastOnce }
#[derive(PartialEq, Eq, PartialOrd, Ord)] struct Ev { at: i64, seq: u64, kind: Kind, a: usize, b: usize }
#[derive(Clone, Copy)] struct Rec { id: usize, ad: usize, time: i64, written_at: i64 }
#[derive(Clone, Copy)] struct Out { cell: usize, value: i32, late: bool }

#[derive(Default)]
struct VirtualClock { queue: BinaryHeap<Reverse<Ev>>, seq: u64 }

impl VirtualClock {
    fn schedule(&mut self, at: i64, kind: Kind, a: usize, b: usize) {
        self.queue.push(Reverse(Ev { at, seq: self.seq, kind, a, b }));
        self.seq += 1;
    }
    fn next(&mut self) -> Option<Ev> { self.queue.pop().map(|Reverse(e)| e) }
}

const PARTS: usize = 8;
const ADS: usize = 1_002;
const MINUTES: usize = 16;
const CELLS: usize = MINUTES * ADS;
const CAP: usize = 2;
const HOT: usize = 7;
const NEW_AD: usize = 1_001;
const POS: usize = 0;
const MAXT: usize = PARTS;
const FIRE: usize = 2 * PARTS;
const COUNT: usize = FIRE + 1;
const PART: usize = COUNT + 1;
const MINUTE: i64 = 60_000;
const BOUND: i64 = 5_000;
const LATENESS: i64 = 600_000;
const EVERY: i64 = 10_000;
const DOWN: i64 = 30_000;
const APP_NET: i64 = 50;
const PEAK_FROM: i64 = 120_000;
const PEAK_TO: i64 = 180_000;
const B_AT: i64 = 300_000;
const C_AT: i64 = 842_000;
const STOP_AT: i64 = 847_000;

fn cell(time: i64, ad: usize) -> usize { (time / MINUTE) as usize * ADS + ad }
fn partition(key: usize) -> usize { ((key as u64 * 2_654_435_761) % 4_294_967_296 >> 29) as usize }
fn part(k: usize, c: usize) -> usize { PART + k * CELLS + c }
fn sum(a: &[i32], w: usize) -> i64 { a[w * ADS..(w + 1) * ADS].iter().map(|&x| x as i64).sum() }

#[derive(Default)]
struct AdClickAggregation {
    mode: Mode, dedup: bool, transaction: bool, overwrite: bool, lateness: i64, clock: VirtualClock,
    parts: Vec<Vec<Rec>>, held: Vec<Vec<Rec>>, open: Vec<Out>, notes: Vec<Vec<String>>,
    seen_at: Vec<i32>, table: Vec<i32>, truth: Vec<i32>, late_table: Vec<i32>, late_truth: Vec<i32>,
    peak_writes: Vec<i32>, barrier: Vec<usize>, visible_at: Vec<i64>, job: Vec<i32>, saved: Vec<i32>,
    seed: i64, dropped: i64, resent: i64, replayed: i64, before_b: i64,
    last_id: usize, follow: usize, hot_partials: usize, hot_first: i32, running: bool, pending: bool,
}

impl AdClickAggregation {
    fn new(mode: Mode) -> Self {
        let mut s = AdClickAggregation {
            mode, dedup: mode != Mode::NoDedup && mode != Mode::AtLeastOnce, transaction: mode != Mode::NoTransaction && mode != Mode::AtLeastOnce,
            overwrite: mode != Mode::AtLeastOnce, lateness: if mode == Mode::AtLeastOnce { 0 } else { LATENESS },
            parts: vec![Vec::new(); PARTS], held: vec![Vec::new(); 2], notes: vec![Vec::new(); 3], seen_at: vec![0; 1_500_000],
            table: vec![0; CELLS], truth: vec![0; CELLS], late_table: vec![0; ADS], late_truth: vec![0; ADS], peak_writes: vec![0; PARTS],
            barrier: vec![0; PARTS], visible_at: vec![0; MINUTES], job: vec![0; PART + PARTS * CELLS], seed: 2_026, running: true, ..Default::default()
        };
        let start = [(30_000, Kind::App, 0), (30_000 + APP_NET, Kind::Arrive, 0), (B_AT, Kind::Release, 0), (C_AT, Kind::Release, 1)];
        let rest = [(STOP_AT, Kind::Stop, 0), (STOP_AT + DOWN, Kind::Restart, 0), (EVERY, Kind::Checkpoint, 0), (0, Kind::Tick, 0)];
        for (at, kind, a) in start.into_iter().chain(rest) { s.clock.schedule(at, kind, a, 0); }
        s
    }

    fn total(&self, c: usize) -> i32 { (0..PARTS).map(|k| self.job[part(k, c)]).sum() }
    fn watermark(&self, k: usize, now: i64) -> i64 { if self.mode == Mode::ProcessingTime { now } else { self.job[MAXT + k] as i64 - BOUND } }
    fn note(&mut self, s: usize, at: i64, what: String) { if self.mode == Mode::Guide { self.notes[s].push(format!("t={}ms {}", at, what)); } }

    fn below(&mut self, n: i64) -> i64 {
        self.seed = self.seed * 48_271 % 2_147_483_647;
        self.seed % n
    }

    fn run(mode: Mode, until: i64) -> Self {
        let mut s = AdClickAggregation::new(mode);
        while let Some(e) = s.clock.next().filter(|e| e.at <= until) { s.handle(e); }
        s
    }

    fn handle(&mut self, e: Ev) {
        let t = e.at;
        match e.kind {
            Kind::Tick => self.tick(t),
            Kind::App => self.note(0, t, format!("A app: clicks ad {} and sends the signed impression id that came with the ad", NEW_AD)),
            Kind::Arrive => self.arrive(t),
            Kind::Retry => self.write(e.a, e.b, t, t),
            Kind::Release => self.release(t, e.a),
            Kind::Checkpoint => self.trigger(),
            Kind::Stop => self.stop(t),
            Kind::Restart => self.restart(t),
        }
    }

    fn tick(&mut self, t: i64) {
        let peak = t >= PEAK_FROM && t < PEAK_TO;
        for _ in 0..(if peak { 10 } else { 1 }) { self.generate(t, peak); }
        if self.running {
            for k in 0..PARTS { self.read(k, t); }
            self.emit(t);
            if self.pending && self.reached() { self.commit(t); }
        }
        self.clock.schedule(t + 1, Kind::Tick, 0, 0);
    }

    fn generate(&mut self, t: i64, peak: bool) {
        self.last_id += 1;
        let id = self.last_id;
        let ad = if peak && self.below(10) < 3 { HOT } else { 1 + self.below(1_000) as usize };
        if t >= PEAK_FROM && t < PEAK_FROM + 5_000 && (id % 10 == 1 || id % 10 == 2) {
            self.held[id % 10 - 1].push(Rec { id, ad, time: t, written_at: 0 });
            return;
        }
        self.truth[cell(t, ad)] += 1;
        self.write(id, ad, t, t);
        if peak && id % 100 == 0 { self.clock.schedule(t + 1_000, Kind::Retry, id, ad); }
    }

    fn write(&mut self, id: usize, ad: usize, time: i64, now: i64) {
        let k = partition(if self.mode == Mode::ByAd { ad } else { id });
        self.parts[k].push(Rec { id, ad, time, written_at: now });
        if now >= PEAK_FROM && now < PEAK_TO { self.peak_writes[k] += 1; }
    }

    fn arrive(&mut self, t: i64) {
        self.last_id += 1;
        self.follow = self.last_id;
        self.truth[cell(t, NEW_AD)] += 1;
        self.write(self.follow, NEW_AD, t, t);
        self.note(0, t, format!("ad server: signature ok, click id={}, click time={}, writes it to partition {}", self.follow, t, partition(self.follow)));
    }

    fn release(&mut self, t: i64, which: usize) {
        if which == 0 { self.before_b = sum(&self.table, 2); }
        for i in 0..self.held[which].len() {
            let r = self.held[which][i];
            if t - (r.time / MINUTE + 1) * MINUTE > LATENESS { self.late_truth[r.ad] += 1; } else { self.truth[cell(r.time, r.ad)] += 1; }
            self.write(r.id, r.ad, r.time, t);
        }
        self.note(1, t, format!("ad server {}: writes {} clicks held since minute 2, {}ms after it ended", ["b", "c"][which], self.held[which].len(), t - PEAK_TO));
    }

    fn read(&mut self, k: usize, t: i64) {
        let limit = if self.pending { self.barrier[k] } else { self.parts[k].len() };
        for _ in 0..CAP {
            let at = self.job[POS + k] as usize;
            if at >= limit || self.parts[k][at].written_at >= t { break; }
            self.job[POS + k] += 1;
            self.process(k, at, t);
        }
    }

    fn process(&mut self, k: usize, at: usize, t: i64) {
        let r = self.parts[k][at];
        if self.dedup && self.seen_at[r.id] != 0 {
            self.dropped += 1;
            return;
        }
        self.job[COUNT] += 1;
        if self.dedup { self.seen_at[r.id] = self.job[COUNT]; }
        let time = if self.mode == Mode::ProcessingTime { t } else { r.time };
        let w = (time / MINUTE) as usize;
        let wm = self.watermark(k, t);
        self.job[MAXT + k] = self.job[MAXT + k].max(time as i32);
        if k == partition(self.follow) && wm < MINUTE && self.watermark(k, t) >= MINUTE { self.note(0, t, format!("task {}: watermark {} passed the end of minute 0, its partials for minute 0 are ready", k, self.watermark(k, t))); }
        if wm >= (w as i64 + 1) * MINUTE + self.lateness {
            if self.lateness > 0 { self.output(t, r.ad, 1, true); }
            return;
        }
        let c = cell(time, r.ad);
        self.job[part(k, c)] += 1;
        if r.id == self.follow { self.note(0, t, format!("task {}: click id={} is new, partial (ad {}, minute {})={}", k, r.id, r.ad, w, self.job[part(k, c)])); }
        if w >= self.job[FIRE] as usize { return; }
        self.resent += 1;
        self.output(t, c, self.total(c), false);
    }

    fn emit(&mut self, t: i64) {
        let low = (0..PARTS).map(|k| self.watermark(k, t)).min().unwrap_or(i64::MAX);
        while (self.job[FIRE] as usize) < MINUTES && (self.job[FIRE] as i64 + 1) * MINUTE <= low {
            self.job[FIRE] += 1;
            self.fire(t, self.job[FIRE] as usize - 1);
        }
    }

    fn fire(&mut self, t: i64, w: usize) {
        let mut rows = 0;
        let hot = cell(PEAK_FROM, HOT);
        for c in w * ADS..(w + 1) * ADS {
            let sum = self.total(c);
            if c == hot { self.hot_partials = (0..PARTS).filter(|&k| self.job[part(k, hot)] > 0).count(); }
            if c == hot { self.hot_first = sum; }
            if sum == 0 { continue; }
            self.output(t, c, sum, false);
            rows += 1;
        }
        if w == 0 { self.note(0, t, format!("sum: every task passed minute 0, (ad {}, minute 0)={} goes into the open transaction", NEW_AD, self.total(cell(0, NEW_AD)))); }
        if w == 13 { self.note(2, t, format!("sum: minute 13 fires, {} results go into the open transaction", rows)); }
    }

    fn output(&mut self, t: i64, c: usize, value: i32, late: bool) {
        if self.transaction { self.open.push(Out { cell: c, value, late }); } else { self.apply(t + 1, Out { cell: c, value, late }); }
    }

    fn apply(&mut self, at: i64, o: Out) {
        if o.late { self.late_table[o.cell] += o.value; } else { self.table[o.cell] = if self.overwrite { o.value } else { self.table[o.cell] + o.value }; }
        let w = o.cell / ADS;
        if o.late { return; }
        if o.cell == cell(0, NEW_AD) { self.note(0, at, format!("result table: (ad {}, minute 0)={} is visible, {}ms after minute 0 ended", NEW_AD, o.value, at - MINUTE)); }
        if self.visible_at[w] != 0 { return; }
        self.visible_at[w] = at;
        if w == 13 { self.note(2, at, format!("result table: minute 13 is visible, {}ms after it ended and {}ms after the restart", self.after(13), at - STOP_AT - DOWN)); }
    }

    fn trigger(&mut self) {
        for k in 0..PARTS { self.barrier[k] = self.parts[k].len(); }
        self.pending = self.running;
    }

    fn reached(&self) -> bool { (0..PARTS).all(|k| self.job[POS + k] as usize >= self.barrier[k]) }

    fn commit(&mut self, t: i64) {
        self.pending = false;
        self.saved = self.job.clone();
        let s = if t == 70_000 { 0 } else if t == 840_000 || (t > STOP_AT && t < STOP_AT + DOWN + EVERY) { 2 } else { 9 };
        if s < 9 { self.note(s, t, format!("checkpoint: all {} tasks reached the barrier, state and offsets saved, {} outputs committed", PARTS, self.open.len())); }
        if t > B_AT && t < B_AT + EVERY { self.note(1, t + 1, format!("result table: minute 2 with b's clicks is visible, {}ms after b wrote them", t + 1 - B_AT)); }
        for o in std::mem::take(&mut self.open) { self.apply(t + 1, o); }
        self.clock.schedule((t / EVERY + 1) * EVERY, Kind::Checkpoint, 0, 0);
    }

    fn stop(&mut self, t: i64) {
        self.running = false;
        self.pending = false;
        self.note(2, t, format!("job: stops, {} outputs in the open transaction ({} separate counts) are never committed", self.open.len(), self.open.iter().filter(|o| o.late).count()));
        self.open.clear();
    }

    fn restart(&mut self, t: i64) {
        for k in 0..PARTS { self.replayed += (self.job[POS + k] - self.saved[POS + k]) as i64; }
        for id in 0..self.seen_at.len() { if self.seen_at[id] > self.saved[COUNT] { self.seen_at[id] = 0; } }
        self.job = self.saved.clone();
        self.running = true;
        self.clock.schedule((t / EVERY + 1) * EVERY, Kind::Checkpoint, 0, 0);
        self.note(2, t, format!("job: restarts from the checkpoint at 840000ms, reads {} records again from the saved offsets", self.replayed));
    }

    fn check(&self) -> String {
        let shown = |c: &usize| self.visible_at[c / ADS] != 0;
        let over: i64 = (0..CELLS).filter(shown).map(|c| (self.table[c] - self.truth[c]).max(0) as i64).sum();
        let under: i64 = (0..CELLS).filter(shown).map(|c| (self.truth[c] - self.table[c]).max(0) as i64).sum();
        format!("over={} under={} counted-separately={} of {}", over, under, sum(&self.late_table, 0), sum(&self.late_truth, 0))
    }

    fn minute(&self, w: usize) -> String { format!("minute-{}={} of {}", w, sum(&self.table, w), sum(&self.truth, w)) }
    fn after(&self, w: usize) -> i64 { self.visible_at[w] - (w as i64 + 1) * MINUTE }
    fn busiest(&self) -> i32 { self.peak_writes.iter().copied().max().unwrap_or(0) / 60 }
}

fn main() {
    let g = AdClickAggregation::run(Mode::Guide, 910_010);
    let by_ad = AdClickAggregation::run(Mode::ByAd, 300_000);
    let no_dedup = AdClickAggregation::run(Mode::NoDedup, 260_000);
    let proc = AdClickAggregation::run(Mode::ProcessingTime, 910_010);
    let no_tx = AdClickAggregation::run(Mode::NoTransaction, 910_010);
    let alo = AdClickAggregation::run(Mode::AtLeastOnce, 910_010);
    let worst = (0..MINUTES).filter(|&w| w != 13 && g.visible_at[w] != 0).map(|w| g.after(w)).max().unwrap_or(0);
    println!("-- scenario 1: A clicks ad 1001 at 30000ms while 1000 clicks per second flow into 8 partitions --");
    for line in &g.notes[0] { println!("{}", line); }
    println!("-- scenario 2: 10000 clicks per second in minute 2, 30% on ad 7, 1% sent twice, ad servers b and c hold 5s of clicks --");
    println!("guide: held-by-b-and-c={} dropped-duplicates={} busiest-partition-per-second={} ad-7={} from {} partials minute-2-visible-after={}ms", g.held[0].len() + g.held[1].len(), g.dropped, g.busiest(), g.hot_first, g.hot_partials, g.after(2));
    println!("by-ad: busiest-partition-per-second={} minute-2-visible-after={}ms minute-3-visible-after={}ms", by_ad.busiest(), by_ad.after(2), by_ad.after(3));
    println!("no-dedup: {}", no_dedup.check());
    println!("{}", g.notes[1][0]);
    println!("guide: minute-2 {} -> {} results-sent-again={}", g.before_b, sum(&g.table, 2), g.resent);
    println!("{}", g.notes[1][1]);
    println!("processing-time: {} {}", proc.minute(2), proc.minute(5));
    println!("{}", g.notes[1][2]);
    println!("guide: {} {}", g.minute(2), g.check());
    println!("-- scenario 3: the job stops at 847000ms, 7000ms after the checkpoint at 840000ms, and restarts 30000ms later --");
    for line in &g.notes[2] { println!("{}", line); }
    println!("guide: replayed={} minute-13-visible-after={}ms {}", g.replayed, g.after(13), g.check());
    println!("no-transaction: minute-13-visible-after={}ms {}", no_tx.after(13), no_tx.check());
    println!("at-least-once: {} {} {}", alo.minute(2), alo.minute(13), alo.check());
    println!("all minutes: guide visible-after-max={}ms except minute 13, {}", worst, g.check());
}
