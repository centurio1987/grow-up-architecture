// 조직·권한 관리 컨텍스트 — 두 Party 사이의 책임 관계가 자기 자리를 갖는다.
#![allow(dead_code)]

use std::collections::HashMap;

#[derive(Clone, PartialEq, Eq)]
struct PartyId(String);
#[derive(Clone, PartialEq, Eq)]
struct AccountabilityTypeId(String);
#[derive(Clone, PartialEq, Eq)]
struct AccountabilityId(String);

fn party_id(value: &str) -> PartyId { PartyId(value.to_string()) }
fn type_id(value: &str) -> AccountabilityTypeId { AccountabilityTypeId(value.to_string()) }
fn link_id(value: &str) -> AccountabilityId { AccountabilityId(value.to_string()) }

/// 유효 기간 — 끝이 비어 있으면 아직 열려 있다. ISO 문자열이라 사전순 비교가 곧 시간순이다.
struct TimePeriod { start: String, end: Option<String> }

impl TimePeriod {
    fn covers(&self, date: &str) -> bool {
        self.start.as_str() <= date && self.end.as_deref().map_or(true, |end| date <= end)
    }
}

/// 행위 주체 — 이 컨텍스트는 식별자와 이름만 본다.
struct Party { id: PartyId, name: String }

/// 관계의 종류 — 계통을 하나 더 쓰는 일은 이 타입의 인스턴스를 하나 더 만드는 일이다.
struct AccountabilityType { id: AccountabilityTypeId, name: String }

/// 두 Party 사이의 책임 관계. 양 끝과 종류는 만든 뒤 바뀌지 않고, 기간의 끝만 닫힌다.
struct Accountability {
    id: AccountabilityId,
    commissioner_id: PartyId,
    responsible_id: PartyId,
    type_id: AccountabilityTypeId,
    period: TimePeriod,
}

impl Accountability {
    /// 두 끝이 서로 다른 Party 인지 여기서 본다 — 만든 뒤엔 바꿀 수 없으니 만들 때가 유일한 자리다.
    fn start(id: AccountabilityId, commissioner_id: PartyId, responsible_id: PartyId,
             type_id: AccountabilityTypeId, start_date: &str) -> Result<Accountability, String> {
        if commissioner_id == responsible_id {
            return Err("both ends must be different parties".to_string());
        }
        let period = TimePeriod { start: start_date.to_string(), end: None };
        Ok(Accountability { id, commissioner_id, responsible_id, type_id, period })
    }

    fn close(&mut self, end_date: &str) -> Result<(), String> {
        if end_date < self.period.start.as_str() {
            return Err(format!("period end {} is before start {}", end_date, self.period.start));
        }
        self.period.end = Some(end_date.to_string());
        Ok(())
    }

    fn is_active_on(&self, date: &str) -> bool { self.period.covers(date) }
}

/// 이 아래 넷은 구현 전용이다 — 저장소 셋과, 그 셋을 id 로 엮는 도메인 서비스.
#[derive(Default)]
struct PartyRegistry { by_id: HashMap<String, Party> }

impl PartyRegistry {
    fn save(&mut self, party: Party) { self.by_id.insert(party.id.0.clone(), party); }

    fn require(&self, id: &PartyId) -> Result<&Party, String> {
        self.by_id.get(&id.0).ok_or_else(|| format!("no party registered as {}", id.0))
    }
}

#[derive(Default)]
struct AccountabilityTypeRegistry { by_id: HashMap<String, AccountabilityType> }

impl AccountabilityTypeRegistry {
    fn save(&mut self, kind: AccountabilityType) { self.by_id.insert(kind.id.0.clone(), kind); }

    fn require(&self, id: &AccountabilityTypeId) -> Result<&AccountabilityType, String> {
        self.by_id.get(&id.0)
            .ok_or_else(|| format!("no accountability type registered as {}", id.0))
    }
}

#[derive(Default)]
struct AccountabilityRegistry { links: Vec<Accountability> }

impl AccountabilityRegistry {
    fn save(&mut self, link: Accountability) { self.links.push(link); }

    fn all(&self) -> &[Accountability] { &self.links }

    fn require_mut(&mut self, id: &AccountabilityId) -> Result<&mut Accountability, String> {
        self.links.iter_mut().find(|link| &link.id == id)
            .ok_or_else(|| format!("no accountability registered as {}", id.0))
    }
}

/// 순환 금지처럼 관계 하나로는 지킬 수 없는 규칙이 여기 산다.
#[derive(Default)]
struct OrganizationStructure {
    parties: PartyRegistry,
    types: AccountabilityTypeRegistry,
    links: AccountabilityRegistry,
}

impl OrganizationStructure {
    fn register(&mut self, id: AccountabilityId, commissioner_id: &PartyId, responsible_id: &PartyId,
                type_id: &AccountabilityTypeId, start_date: &str) -> Result<(), String> {
        self.parties.require(commissioner_id)?;
        self.parties.require(responsible_id)?;
        self.types.require(type_id)?;
        if self.ancestors_include(commissioner_id, responsible_id, type_id) {
            return Err(format!("{} is already an ancestor of {} under {}",
                self.parties.require(responsible_id)?.name,
                self.parties.require(commissioner_id)?.name,
                self.types.require(type_id)?.name));
        }
        let link = Accountability::start(id, commissioner_id.clone(), responsible_id.clone(),
                                         type_id.clone(), start_date)?;
        self.links.save(link);
        Ok(())
    }

    fn close(&mut self, id: &AccountabilityId, end_date: &str) -> Result<(), String> {
        self.links.require_mut(id)?.close(end_date)
    }

    fn ancestors_include(&self, party: &PartyId, candidate: &PartyId,
                         type_id: &AccountabilityTypeId) -> bool {
        self.commissioners_of(party, type_id).iter()
            .any(|above| above == candidate || self.ancestors_include(above, candidate, type_id))
    }

    fn commissioners_of(&self, responsible_id: &PartyId,
                        type_id: &AccountabilityTypeId) -> Vec<PartyId> {
        self.links.all().iter()
            .filter(|link| &link.type_id == type_id && &link.responsible_id == responsible_id)
            .map(|link| link.commissioner_id.clone())
            .collect()
    }

    /// 계통을 함께 묻는다 — 종류를 빼면 상위가 여럿 나와 답이 하나로 정해지지 않는다.
    fn parent_name(&self, responsible_id: &PartyId, type_id: &AccountabilityTypeId,
                   date: &str) -> String {
        for link in self.links.all() {
            if &link.type_id == type_id && &link.responsible_id == responsible_id
                && link.is_active_on(date) {
                if let Ok(party) = self.parties.require(&link.commissioner_id) {
                    return party.name.clone();
                }
            }
        }
        "none".to_string()
    }

    fn lines_where_responsible(&self, responsible_id: &PartyId, date: &str) -> String {
        let names: Vec<String> = self.links.all().iter()
            .filter(|link| &link.responsible_id == responsible_id && link.is_active_on(date))
            .filter_map(|link| self.types.require(&link.type_id).ok().map(|k| k.name.clone()))
            .collect();
        if names.is_empty() { "none".to_string() } else { names.join(", ") }
    }
}

fn main() -> Result<(), String> {
    let division = party_id("P-2001");
    let office = party_id("P-2002");
    let team = party_id("P-2003");
    let jiwoo = party_id("P-1001");
    let minseo = party_id("P-2004");
    let audit_office = party_id("P-2005");
    let mut parties = PartyRegistry::default();
    parties.save(Party { id: division.clone(), name: "Purchasing Division".to_string() });
    parties.save(Party { id: office.clone(), name: "Busan Office".to_string() });
    parties.save(Party { id: team.clone(), name: "Busan Purchasing Team".to_string() });
    parties.save(Party { id: jiwoo.clone(), name: "Han Jiwoo".to_string() });
    parties.save(Party { id: minseo.clone(), name: "Choi Minseo".to_string() });
    parties.save(Party { id: audit_office.clone(), name: "Audit Office".to_string() });

    let functional = type_id("AT-1");
    let regional = type_id("AT-2");
    let supervision = type_id("AT-3");
    let audit = type_id("AT-4");
    let mentoring = type_id("AT-5");
    let mut types = AccountabilityTypeRegistry::default();
    types.save(AccountabilityType { id: functional.clone(), name: "functional".to_string() });
    types.save(AccountabilityType { id: regional.clone(), name: "regional".to_string() });
    types.save(AccountabilityType { id: supervision.clone(), name: "supervision".to_string() });
    types.save(AccountabilityType { id: audit.clone(), name: "audit".to_string() });
    types.save(AccountabilityType { id: mentoring.clone(), name: "mentoring".to_string() });

    let mut structure = OrganizationStructure {
        parties, types, links: AccountabilityRegistry::default() };
    structure.register(link_id("A-1"), &division, &team, &functional, "2026-04-01")?;
    structure.register(link_id("A-2"), &office, &team, &regional, "2026-04-01")?;
    structure.register(link_id("A-3"), &team, &jiwoo, &supervision, "2026-04-01")?;
    structure.register(link_id("A-4"), &team, &minseo, &supervision, "2026-04-01")?;
    structure.register(link_id("A-5"), &minseo, &jiwoo, &mentoring, "2026-04-01")?;
    structure.register(link_id("A-6"), &audit_office, &jiwoo, &audit, "2026-06-01")?;
    structure.register(link_id("A-7"), &jiwoo, &minseo, &audit, "2026-06-01")?;
    structure.close(&link_id("A-3"), "2026-06-30")?;

    println!("functional parent of Busan Purchasing Team on 2026-05-01: {}",
             structure.parent_name(&team, &functional, "2026-05-01"));
    println!("regional parent of Busan Purchasing Team on 2026-05-01: {}",
             structure.parent_name(&team, &regional, "2026-05-01"));
    println!("supervision parent of Han Jiwoo on 2026-05-01: {}",
             structure.parent_name(&jiwoo, &supervision, "2026-05-01"));
    println!("supervision parent of Han Jiwoo on 2026-08-01: {}",
             structure.parent_name(&jiwoo, &supervision, "2026-08-01"));
    println!("audit parent of Han Jiwoo on 2026-08-01: {}",
             structure.parent_name(&jiwoo, &audit, "2026-08-01"));
    println!("lines where Han Jiwoo is responsible on 2026-08-01: {}",
             structure.lines_where_responsible(&jiwoo, "2026-08-01"));
    println!("mentoring parent of Han Jiwoo on 2026-08-01: {}",
             structure.parent_name(&jiwoo, &mentoring, "2026-08-01"));
    println!("audit parent of Choi Minseo on 2026-08-01: {}",
             structure.parent_name(&minseo, &audit, "2026-08-01"));

    match structure.register(link_id("A-8"), &jiwoo, &jiwoo, &supervision, "2026-08-01") {
        Ok(()) => println!("rejected (same party on both ends): not rejected"),
        Err(message) => println!("rejected (same party on both ends): {message}"),
    }
    match structure.register(link_id("A-9"), &minseo, &audit_office, &audit, "2026-08-01") {
        Ok(()) => println!("rejected (cycle): not rejected"),
        Err(message) => println!("rejected (cycle): {message}"),
    }
    match structure.register(link_id("A-10"), &party_id("P-9999"), &team, &functional, "2026-08-01") {
        Ok(()) => println!("rejected (unknown party): not rejected"),
        Err(message) => println!("rejected (unknown party): {message}"),
    }
    match structure.register(link_id("A-11"), &office, &team, &type_id("AT-9"), "2026-08-01") {
        Ok(()) => println!("rejected (unknown accountability type): not rejected"),
        Err(message) => println!("rejected (unknown accountability type): {message}"),
    }
    Ok(())
}
