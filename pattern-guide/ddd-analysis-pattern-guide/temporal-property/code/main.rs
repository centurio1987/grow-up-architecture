// 인사·급여 — 사원의 일당과 소속을 시간 속성으로 두고, 사건 시각과 기록 시각 두 축으로 조회한다.

use std::fmt;

/// 시점. 표준 라이브러리에 달력 날짜 타입이 없어 세 언어가 같은 자체 값으로 둔다.
#[derive(Clone, Copy)]
struct TimePoint { year: i64, month: i64, day: i64 }

impl TimePoint {
    fn of(year: i64, month: i64, day: i64) -> TimePoint { TimePoint { year, month, day } }
    /// 1970-01-01 을 0 으로 세는 일 번호. 크기 비교와 일수 계산이 전부 이 값 위에 선다.
    fn ordinal(&self) -> i64 {
        let y = self.year - if self.month <= 2 { 1 } else { 0 };
        let era = y.div_euclid(400);
        let yoe = y - era * 400;
        let doy = (153 * (self.month + if self.month > 2 { -3 } else { 9 }) + 2) / 5 + self.day - 1;
        era * 146097 + yoe * 365 + yoe / 4 - yoe / 100 + doy - 719468
    }
}

impl fmt::Display for TimePoint {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:04}-{:02}-{:02}", self.year, self.month, self.day)
    }
}

/// 구간. 두 끝이 모두 포함이고, 위 끝이 없으면 「추후 통지까지」다.
#[derive(Clone, Copy)]
struct DateRange { from: TimePoint, to: Option<TimePoint> }

impl DateRange {
    fn new(from: TimePoint, to: TimePoint) -> Result<DateRange, String> {
        if from.ordinal() > to.ordinal() {
            return Err(format!("유효 시작이 유효 끝보다 늦습니다: {}..{}", from, to));
        }
        Ok(DateRange { from, to: Some(to) })
    }
    fn open_ended(from: TimePoint) -> DateRange { DateRange { from, to: None } }
    fn includes(&self, t: TimePoint) -> bool {
        self.from.ordinal() <= t.ordinal() && self.to.map_or(true, |e| t.ordinal() <= e.ordinal())
    }
    fn overlaps(&self, other: &DateRange) -> bool {
        self.to.map_or(true, |e| other.from.ordinal() <= e.ordinal())
            && other.to.map_or(true, |e| self.from.ordinal() <= e.ordinal())
    }
    fn length_in_days(&self) -> Result<i64, String> {
        match self.to {
            None => Err(format!("끝이 없는 구간은 일수를 셀 수 없습니다: {}", self)),
            Some(end) => Ok(end.ordinal() - self.from.ordinal() + 1),
        }
    }
}

impl fmt::Display for DateRange {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self.to {
            None => write!(f, "{}..", self.from),
            Some(end) => write!(f, "{}..{}", self.from, end),
        }
    }
}

#[derive(Clone, Copy)]
struct Money(i64);

impl Money {
    fn minus(&self, other: Money) -> Money { Money(self.0 - other.0) }
    fn times(&self, count: i64) -> Money { Money(self.0 * count) }
}

impl fmt::Display for Money {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result { write!(f, "{}원", self.0) }
}

#[derive(Clone)]
struct EmployeeId(String);

impl fmt::Display for EmployeeId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result { write!(f, "{}", self.0) }
}

#[derive(Clone)]
struct DepartmentId(String);

impl fmt::Display for DepartmentId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result { write!(f, "{}", self.0) }
}

/// 유효 기간이 붙은 값 하나. recorded_on 은 우리가 그 값을 알게 된 날이다.
#[derive(Clone)]
struct Effectivity<V> { period: DateRange, recorded_on: TimePoint, value: V }

/// 시간 속성 — 값들의 이력을 쥐고, 시점을 받아 값 하나로 답한다.
#[derive(Clone)]
struct TemporalProperty<V> { name: String, history: Vec<Effectivity<V>> }

impl<V: Clone> TemporalProperty<V> {
    fn starting_with(name: &str, from: TimePoint, recorded_on: TimePoint, value: V) -> TemporalProperty<V> {
        let first = Effectivity { period: DateRange::open_ended(from), recorded_on, value };
        TemporalProperty { name: name.to_string(), history: vec![first] }
    }
    fn asserting(&self, period: DateRange, on: TimePoint, value: V) -> Result<TemporalProperty<V>, String> {
        let latest = self.latest_record();
        if on.ordinal() < latest.ordinal() {
            return Err(format!("기록일이 앞선 기록보다 이릅니다: {} < {}", on, latest));
        }
        for e in &self.history {
            if e.recorded_on.ordinal() == on.ordinal() && e.period.overlaps(&period) {
                return Err(format!("같은 기록일에 유효 구간이 겹칩니다: {} 와 {}", e.period, period));
            }
        }
        let mut next = self.history.clone();
        next.push(Effectivity { period, recorded_on: on, value });
        Ok(TemporalProperty { name: self.name.clone(), history: next })
    }
    /// 기록 기준 as_known_on 에서 본 when 의 값. 그 시점을 덮는 값 가운데 가장 늦게 안 것이 답이다.
    fn value_on(&self, when: TimePoint, as_known_on: Option<TimePoint>) -> Result<V, String> {
        let limit = as_known_on.unwrap_or_else(|| self.latest_record());
        let mut best: Option<&Effectivity<V>> = None;
        for e in &self.history {
            if e.recorded_on.ordinal() > limit.ordinal() || !e.period.includes(when) {
                continue;
            }
            if best.map_or(true, |b| e.recorded_on.ordinal() > b.recorded_on.ordinal()) {
                best = Some(e);
            }
        }
        match best {
            None => Err(format!("그 기록 시점에는 아는 값이 없습니다: {} 의 {} · 기록 기준 {}", when, self.name, limit)),
            Some(e) => Ok(e.value.clone()),
        }
    }
    fn latest_record(&self) -> TimePoint {
        let mut latest = self.history[0].recorded_on;
        for e in &self.history {
            if e.recorded_on.ordinal() > latest.ordinal() { latest = e.recorded_on; }
        }
        latest
    }
}

/// aggregate root. 두 시간 속성을 품고 이력의 불변식을 진다.
struct Employee {
    id: EmployeeId,
    hired_on: TimePoint,
    pay_rate: TemporalProperty<Money>,
    assignment: TemporalProperty<DepartmentId>,
}

impl Employee {
    fn hire(id: EmployeeId, hired_on: TimePoint, rate: Money, department: DepartmentId) -> Employee {
        let pay_rate = TemporalProperty::starting_with("일당", hired_on, hired_on, rate);
        let assignment = TemporalProperty::starting_with("소속", hired_on, hired_on, department);
        Employee { id, hired_on, pay_rate, assignment }
    }
    fn record_pay_rate(&mut self, p: DateRange, on: TimePoint, rate: Money) -> Result<(), String> {
        self.pay_rate = self.pay_rate.asserting(p, on, rate)?;
        Ok(())
    }
    fn record_assignment(&mut self, p: DateRange, on: TimePoint, dept: DepartmentId) -> Result<(), String> {
        self.assignment = self.assignment.asserting(p, on, dept)?;
        Ok(())
    }
    fn pay_rate_on(&self, when: TimePoint, as_known_on: Option<TimePoint>) -> Result<Money, String> {
        self.pay_rate.value_on(when, as_known_on)
    }
    fn assignment_on(&self, when: TimePoint, as_known_on: Option<TimePoint>) -> Result<DepartmentId, String> {
        self.assignment.value_on(when, as_known_on)
    }
}

/// aggregate 밖에서 부서 aggregate 를 id 로 찾아 오는 자리.
fn name_of(id: &DepartmentId) -> String {
    let directory = [("DEP-SALES", "영업부"), ("DEP-PLAN", "기획부")];
    let found = directory.iter().find(|(key, _)| *key == id.0);
    found.map_or("미등록".to_string(), |(_, name)| name.to_string())
}

/// 이미 지급한 기준과 지금 아는 기준의 차이를 그 구간의 일수만큼 정산한다.
fn retro_difference(e: &Employee, stretch: DateRange, paid_on: TimePoint, known_on: TimePoint) -> Result<Money, String> {
    let paid = e.pay_rate_on(stretch.from, Some(paid_on))?;
    let current = e.pay_rate_on(stretch.from, Some(known_on))?;
    Ok(current.minus(paid).times(stretch.length_in_days()?))
}

fn attempt<F: FnOnce() -> Result<(), String>>(action: F) {
    if let Err(message) = action() { println!("거부 — {}", message); }
}

fn run() -> Result<(), String> {
    let hire = TimePoint::of(2026, 1, 1);
    let sales = DepartmentId("DEP-SALES".to_string());
    let mut employee = Employee::hire(EmployeeId("EMP-1042".to_string()), hire, Money(200000), sales);
    let first = employee.assignment_on(hire, None)?;
    println!("사원 {} · 입사 {} · 첫 일당 {} · 첫 소속 {} {}",
        employee.id, employee.hired_on, employee.pay_rate_on(hire, None)?, first, name_of(&first));

    let raise_from = TimePoint::of(2026, 2, 15);
    let noticed_on = TimePoint::of(2026, 3, 15);
    employee.record_pay_rate(DateRange::open_ended(raise_from), noticed_on, Money(240000))?;
    println!("[기록] {} — {} 부터 일당 {}", noticed_on, raise_from, Money(240000));

    let corrected_on = TimePoint::of(2026, 4, 4);
    employee.record_pay_rate(DateRange::open_ended(raise_from), corrected_on, Money(260000))?;
    println!("[기록] {} — {} 부터 일당 {}", corrected_on, raise_from, Money(260000));

    let move_from = TimePoint::of(2026, 4, 1);
    let moved_on = TimePoint::of(2026, 5, 2);
    let planning = DepartmentId("DEP-PLAN".to_string());
    employee.record_assignment(DateRange::open_ended(move_from), moved_on, planning)?;
    println!("[기록] {} — {} 부터 소속 DEP-PLAN", moved_on, move_from);

    let january = TimePoint::of(2026, 1, 20);
    let february = TimePoint::of(2026, 2, 25);
    println!("[한 축] {} 의 일당 {}", january, employee.pay_rate_on(january, None)?);
    println!("[한 축] {} 의 일당 {}", february, employee.pay_rate_on(february, None)?);

    let payday = TimePoint::of(2026, 2, 28);
    for as_known_on in [payday, noticed_on, corrected_on] {
        let rate = employee.pay_rate_on(february, Some(as_known_on))?;
        println!("[두 축] {} 의 일당 · 기록 기준 {} → {}", february, as_known_on, rate);
    }

    let stretch = DateRange::new(raise_from, payday)?;
    let gap = employee.pay_rate_on(february, Some(noticed_on))?.minus(employee.pay_rate_on(february, Some(payday))?);
    println!("2월 소급 차액 — {} {}일 × {} = {}", stretch, stretch.length_in_days()?, gap,
        retro_difference(&employee, stretch, payday, noticed_on)?);

    for when in [TimePoint::of(2026, 3, 20), TimePoint::of(2026, 4, 10)] {
        let at = employee.assignment_on(when, None)?;
        println!("[한 축] {} 의 소속 {} {}", when, at, name_of(&at));
    }

    attempt(|| DateRange::new(TimePoint::of(2026, 3, 31), TimePoint::of(2026, 2, 1)).map(|_| ()));
    attempt(|| {
        let period = DateRange::new(TimePoint::of(2026, 2, 1), TimePoint::of(2026, 3, 31))?;
        employee.record_pay_rate(period, corrected_on, Money(210000))
    });
    attempt(|| {
        let back = TimePoint::of(2026, 3, 1);
        employee.record_assignment(DateRange::open_ended(back), back, DepartmentId("DEP-SALES".to_string()))
    });
    attempt(|| employee.pay_rate_on(february, Some(TimePoint::of(2025, 12, 31))).map(|_| ()));
    Ok(())
}

fn main() {
    if let Err(message) = run() { println!("중단 — {}", message); }
}
