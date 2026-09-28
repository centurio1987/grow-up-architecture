use std::cell::RefCell;
use std::rc::{Rc, Weak};

#[derive(Clone, Copy, PartialEq)]
enum FormEvent { CabinSelected, SeatTyped, MileageToggled, IssueClicked }

trait SeatFormMediator {
    fn changed(&self, event: FormEvent);
}

type MediatorRef = Weak<dyn SeatFormMediator>;

struct CabinList {
    mediator: MediatorRef,
    selected: String,
}

impl CabinList {
    fn new(mediator: MediatorRef) -> CabinList {
        CabinList { mediator, selected: String::new() }
    }

    fn select(cell: &Rc<RefCell<CabinList>>, cabin: &str) {
        let mediator = {
            let mut me = cell.borrow_mut();
            if !["business", "economy"].contains(&cabin) || me.selected == cabin {
                return;
            }
            me.selected = cabin.to_string();
            me.mediator.upgrade()
        };
        if let Some(form) = mediator {
            form.changed(FormEvent::CabinSelected);
        }
    }
}

struct SeatField {
    mediator: MediatorRef,
    text: String,
}

impl SeatField {
    fn new(mediator: MediatorRef) -> SeatField {
        SeatField { mediator, text: String::new() }
    }

    fn fill(&mut self, seat: &str) {
        self.text = seat.to_string();
    }

    fn type_in(cell: &Rc<RefCell<SeatField>>, seat: &str) {
        let mediator = {
            let mut me = cell.borrow_mut();
            me.text = seat.to_string();
            me.mediator.upgrade()
        };
        if let Some(form) = mediator {
            form.changed(FormEvent::SeatTyped);
        }
    }
}

struct MileageToggle {
    mediator: MediatorRef,
    enabled: bool,
    on: bool,
}

impl MileageToggle {
    fn new(mediator: MediatorRef) -> MileageToggle {
        MileageToggle { mediator, enabled: false, on: false }
    }

    fn enable(&mut self, value: bool) {
        self.enabled = value;
        if !value {
            self.on = false;
        }
    }

    fn toggle(cell: &Rc<RefCell<MileageToggle>>) {
        let mediator = {
            let mut me = cell.borrow_mut();
            if !me.enabled {
                return;
            }
            me.on = !me.on;
            me.mediator.upgrade()
        };
        if let Some(form) = mediator {
            form.changed(FormEvent::MileageToggled);
        }
    }
}

struct IssueButton {
    mediator: MediatorRef,
    enabled: bool,
}

impl IssueButton {
    fn new(mediator: MediatorRef) -> IssueButton {
        IssueButton { mediator, enabled: false }
    }

    fn enable(&mut self, value: bool) {
        self.enabled = value;
    }

    fn click(cell: &Rc<RefCell<IssueButton>>) {
        let mediator = {
            let me = cell.borrow();
            if !me.enabled {
                return;
            }
            me.mediator.upgrade()
        };
        if let Some(form) = mediator {
            form.changed(FormEvent::IssueClicked);
        }
    }
}

const BUSINESS: [&str; 4] = ["1A", "1B", "2A", "2B"];
const ECONOMY: [&str; 4] = ["10A", "10B", "11A", "11B"];
const SOLD: [&str; 2] = ["1A", "10A"];

fn free(cabin: &str) -> Vec<&'static str> {
    let all: &[&'static str] = match cabin {
        "business" => &BUSINESS,
        "economy" => &ECONOMY,
        _ => &[],
    };
    all.iter().copied().filter(|seat| !SOLD.contains(seat)).collect()
}

fn first_free(cabin: &str) -> String {
    free(cabin).first().map(|seat| seat.to_string()).unwrap_or_default()
}

fn blank(value: &str) -> String {
    if value.is_empty() { "-".to_string() } else { value.to_string() }
}

struct SeatForm {
    record: String,
    cabin_list: Rc<RefCell<CabinList>>,
    seat_field: Rc<RefCell<SeatField>>,
    mileage_toggle: Rc<RefCell<MileageToggle>>,
    issue_button: Rc<RefCell<IssueButton>>,
    result: RefCell<String>,
}

impl SeatFormMediator for SeatForm {
    fn changed(&self, event: FormEvent) {
        match event {
            FormEvent::CabinSelected => {
                let cabin = self.cabin_list.borrow().selected.clone();
                self.seat_field.borrow_mut().fill(&first_free(&cabin));
                self.mileage_toggle.borrow_mut().enable(cabin == "economy");
                self.refresh_issue();
            }
            FormEvent::SeatTyped | FormEvent::MileageToggled => self.refresh_issue(),
            FormEvent::IssueClicked => *self.result.borrow_mut() = self.ticket(),
        }
    }
}

impl SeatForm {
    fn new(record: &str) -> Rc<SeatForm> {
        Rc::new_cyclic(|weak: &Weak<SeatForm>| {
            let mediator: MediatorRef = weak.clone();
            SeatForm {
                record: record.to_string(),
                cabin_list: Rc::new(RefCell::new(CabinList::new(mediator.clone()))),
                seat_field: Rc::new(RefCell::new(SeatField::new(mediator.clone()))),
                mileage_toggle: Rc::new(RefCell::new(MileageToggle::new(mediator.clone()))),
                issue_button: Rc::new(RefCell::new(IssueButton::new(mediator))),
                result: RefCell::new(String::new()),
            }
        })
    }

    fn refresh_issue(&self) {
        let cabin = self.cabin_list.borrow().selected.clone();
        let seat = self.seat_field.borrow().text.clone();
        let open = free(&cabin).contains(&seat.as_str());
        self.issue_button.borrow_mut().enable(open);
    }

    fn ticket(&self) -> String {
        let cabin = self.cabin_list.borrow().selected.clone();
        let fare: u64 = if cabin == "business" { 480_000 } else { 180_000 };
        let discount: u64 = if self.mileage_toggle.borrow().on { 30_000 } else { 0 };
        let seat = self.seat_field.borrow().text.clone();
        let pay = fare - discount;
        format!("ticket {} {cabin} {seat} fare={fare} discount={discount} pay={pay}", self.record)
    }

    fn state(&self) -> String {
        let mileage = self.mileage_toggle.borrow();
        let on = if mileage.on { "on" } else { "off" };
        let lock = if mileage.enabled { "free" } else { "locked" };
        let issue = if self.issue_button.borrow().enabled { "on" } else { "off" };
        let cabin = blank(&self.cabin_list.borrow().selected);
        let seat = blank(&self.seat_field.borrow().text);
        format!("cabin={cabin} seat={seat} mileage={on}/{lock} issue={issue}")
    }

    fn take_result(&self) -> String {
        self.result.replace(String::new())
    }
}

fn print(step: u32, action: &str, form: &Rc<SeatForm>) {
    let result = form.take_result();
    let tail = if result.is_empty() { String::new() } else { format!(" | {}", result) };
    println!("{}) {:<15} | {}{}", step, action, form.state(), tail);
}

fn main() {
    let form = SeatForm::new("QR4821");
    let cabin = form.cabin_list.clone();
    let seat = form.seat_field.clone();
    let mileage = form.mileage_toggle.clone();
    let issue = form.issue_button.clone();

    CabinList::select(&cabin, "economy");
    print(1, "select economy", &form);
    SeatField::type_in(&seat, "11A");
    print(2, "type 11A", &form);
    IssueButton::click(&issue);
    print(3, "click issue", &form);
    MileageToggle::toggle(&mileage);
    print(4, "toggle mileage", &form);
    IssueButton::click(&issue);
    print(5, "click issue", &form);
    CabinList::select(&cabin, "business");
    print(6, "select business", &form);
    IssueButton::click(&issue);
    print(7, "click issue", &form);
    SeatField::type_in(&seat, "1A");
    print(8, "type 1A", &form);
    IssueButton::click(&issue);
    print(9, "click issue", &form);
}
