mod seating {
    const OPEN: u8 = b'.';

    /// 좁은 인터페이스 — 이 모듈 밖에서는 필드가 보이지 않는다.
    pub struct SeatMemento {
        seats: Vec<u8>,
        remaining: usize,
        next_code: u8,
    }

    pub struct SeatChart {
        seats: Vec<u8>,
        remaining: usize,
        next_code: u8,
    }

    impl SeatChart {
        pub fn new(layout: &str) -> SeatChart {
            let seats = layout.as_bytes().to_vec();
            let remaining = seats.iter().filter(|&&seat| seat == OPEN).count();
            SeatChart { seats, remaining, next_code: b'A' }
        }

        pub fn save(&self) -> SeatMemento {
            SeatMemento {
                seats: self.seats.clone(),
                remaining: self.remaining,
                next_code: self.next_code,
            }
        }

        pub fn restore(&mut self, memento: SeatMemento) {
            self.seats = memento.seats;
            self.remaining = memento.remaining;
            self.next_code = memento.next_code;
        }

        pub fn reserve(&mut self, count: usize) -> bool {
            if count == 0 || count > self.remaining {
                return false;
            }
            for index in self.pick(count) {
                self.seats[index] = self.next_code;
            }
            self.remaining -= count;
            self.next_code += 1;
            true
        }

        pub fn describe(&self) -> String {
            format!(
                "{} rem={} next={}",
                String::from_utf8_lossy(&self.seats),
                self.remaining,
                self.next_code as char
            )
        }

        fn pick(&self, count: usize) -> Vec<usize> {
            let mut run = 0;
            for i in 0..self.seats.len() {
                run = if self.seats[i] == OPEN { run + 1 } else { 0 };
                if run == count {
                    return (i + 1 - count..=i).collect();
                }
            }
            self.seats
                .iter()
                .enumerate()
                .filter(|(_, &seat)| seat == OPEN)
                .map(|(i, _)| i)
                .take(count)
                .collect()
        }
    }
}

use seating::{SeatChart, SeatMemento};

struct ReservationDesk {
    history: Vec<SeatMemento>,
}

impl ReservationDesk {
    fn new() -> ReservationDesk {
        ReservationDesk { history: Vec::new() }
    }

    fn checkpoint(&mut self, chart: &SeatChart) {
        self.history.push(chart.save());
    }

    fn undo(&mut self, chart: &mut SeatChart) -> bool {
        match self.history.pop() {
            Some(memento) => {
                chart.restore(memento);
                true
            }
            None => false,
        }
    }

    fn depth(&self) -> usize {
        self.history.len()
    }
}

fn line(step: usize, action: &str, chart: &SeatChart, desk: &ReservationDesk) {
    println!("{} {:<10} {} history={}", step, action, chart.describe(), desk.depth());
}

fn main() {
    let mut chart = SeatChart::new("...#....");
    let mut desk = ReservationDesk::new();
    line(0, "init", &chart, &desk);

    desk.checkpoint(&chart);
    chart.reserve(2);
    line(1, "reserve(2)", &chart, &desk);

    desk.checkpoint(&chart);
    chart.reserve(3);
    line(2, "reserve(3)", &chart, &desk);

    desk.undo(&mut chart);
    line(3, "undo", &chart, &desk);

    desk.checkpoint(&chart);
    chart.reserve(5);
    line(4, "reserve(5)", &chart, &desk);

    desk.undo(&mut chart);
    line(5, "undo", &chart, &desk);

    desk.undo(&mut chart);
    line(6, "undo", &chart, &desk);
}
