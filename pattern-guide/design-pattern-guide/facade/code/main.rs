use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;

// 서브시스템 바깥의 옛 메일 시스템 — 자기 어휘로만 말한다
struct LegacyMailer {
    sent: Vec<String>,
}

impl LegacyMailer {
    fn new() -> Self {
        LegacyMailer { sent: Vec::new() }
    }

    fn push(&mut self, to: &str, subject: &str, body: &str) {
        self.sent.push(format!("{to} | {subject} | {body}"));
    }

    fn count(&self) -> usize {
        self.sent.len()
    }

    fn first(&self) -> String {
        self.sent.first().cloned().unwrap_or_default()
    }
}

// 서브시스템 클래스 넷 — 서로도 모르고 BookingDesk 도 모른다
trait NoticeSender {
    fn send(&self, requester: &str, text: &str);
}

struct MailNotice {
    mailer: Rc<RefCell<LegacyMailer>>,
}

impl NoticeSender for MailNotice {
    fn send(&self, requester: &str, text: &str) {
        self.mailer
            .borrow_mut()
            .push(&format!("{requester}@corp.example"), "booking confirmed", text);
    }
}

struct RoomCatalog {
    capacity: Vec<(String, u32)>,
}

impl RoomCatalog {
    fn new() -> Self {
        RoomCatalog {
            capacity: vec![
                ("R1".to_string(), 4),
                ("R2".to_string(), 8),
                ("R3".to_string(), 8),
                ("R4".to_string(), 20),
            ],
        }
    }

    fn rooms_for(&self, people: u32) -> Vec<String> {
        self.capacity
            .iter()
            .filter(|(_, seats)| *seats >= people)
            .map(|(room, _)| room.clone())
            .collect()
    }
}

struct ScheduleBook {
    held: Vec<String>,
}

impl ScheduleBook {
    fn new() -> Self {
        ScheduleBook { held: Vec::new() }
    }

    fn is_free(&self, room: &str, start_hour: u32, hours: u32) -> bool {
        (start_hour..start_hour + hours).all(|h| !self.held.contains(&format!("{room}@{h}")))
    }

    fn hold(&mut self, room: &str, start_hour: u32, hours: u32) {
        for h in start_hour..start_hour + hours {
            self.held.push(format!("{room}@{h}"));
        }
    }
}

struct EquipmentPool {
    total: u32,
    used: HashMap<u32, u32>,
}

impl EquipmentPool {
    fn new(total: u32) -> Self {
        EquipmentPool {
            total,
            used: HashMap::new(),
        }
    }

    fn free_at(&self, start_hour: u32, hours: u32) -> u32 {
        (start_hour..start_hour + hours)
            .map(|h| self.total - self.used.get(&h).copied().unwrap_or(0))
            .min()
            .unwrap_or(self.total)
    }

    fn assign(&mut self, count: u32, start_hour: u32, hours: u32) {
        for h in start_hour..start_hour + hours {
            *self.used.entry(h).or_insert(0) += count;
        }
    }
}

// Facade — 네 서브시스템 객체를 알고, 호출 순서만 안다
struct BookingDesk {
    catalog: Rc<RoomCatalog>,
    schedule: Rc<RefCell<ScheduleBook>>,
    projectors: Rc<RefCell<EquipmentPool>>,
    notice: Box<dyn NoticeSender>,
}

impl BookingDesk {
    fn reserve(
        &self,
        requester: &str,
        people: u32,
        start_hour: u32,
        hours: u32,
        projector_count: u32,
    ) -> String {
        let candidates = self.catalog.rooms_for(people);
        let picked = candidates
            .iter()
            .find(|candidate| self.schedule.borrow().is_free(candidate, start_hour, hours));
        let Some(room) = picked else {
            return format!("rejected no room for {people}");
        };
        let free = self.projectors.borrow().free_at(start_hour, hours);
        if free < projector_count {
            return format!("rejected projector short need {projector_count} free {free}");
        }
        self.schedule.borrow_mut().hold(room, start_hour, hours);
        self.projectors
            .borrow_mut()
            .assign(projector_count, start_hour, hours);
        let slot = format!("{room} {start_hour}-{}", start_hour + hours);
        self.notice.send(requester, &slot);
        format!("confirmed {slot} projector {projector_count}")
    }
}

fn main() {
    let mailer = Rc::new(RefCell::new(LegacyMailer::new()));
    let catalog = Rc::new(RoomCatalog::new());
    let schedule = Rc::new(RefCell::new(ScheduleBook::new()));
    let projectors = Rc::new(RefCell::new(EquipmentPool::new(2)));
    let desk = BookingDesk {
        catalog: Rc::clone(&catalog),
        schedule: Rc::clone(&schedule),
        projectors: Rc::clone(&projectors),
        notice: Box::new(MailNotice {
            mailer: Rc::clone(&mailer),
        }),
    };

    println!("1) alice: {}", desk.reserve("alice", 8, 14, 1, 1));
    println!("2) bob: {}", desk.reserve("bob", 8, 14, 1, 1));
    println!("3) carol: {}", desk.reserve("carol", 8, 14, 1, 1));
    println!("4) dave: {}", desk.reserve("dave", 20, 16, 2, 0));

    // 총무팀은 방을 지정해야 해서 서브시스템을 직접 쓴다 — Facade 는 그것을 막지 않는다
    schedule.borrow_mut().hold("R1", 14, 1);
    println!(
        "5) admin direct hold R1 14-15, mail sent {}",
        mailer.borrow().count()
    );
    println!("6) first mail: {}", mailer.borrow().first());
}
