// 거래처 관리 컨텍스트 — Party 하나가 사람과 조직 단위를 함께 담는다.
#![allow(dead_code)]

use std::collections::HashMap;
use std::fmt;

/* ── 값 객체 ────────────────────────────────────────────────── */
// newtype — PartyId 자리에 다른 id 가 들어가면 컴파일이 막는다.
#[derive(Clone, PartialEq, Eq, Hash, Debug)]
struct PartyId(String);
#[derive(Clone, PartialEq, Eq, Hash, Debug)]
struct PurchaseOrderId(String);

impl PartyId {
    fn new(value: &str) -> Result<Self, String> {
        if value.trim().is_empty() { return Err("party id is empty".to_string()); }
        Ok(PartyId(value.to_string()))
    }
}

impl PurchaseOrderId {
    fn new(value: &str) -> Result<Self, String> {
        if value.trim().is_empty() { return Err("order id is empty".to_string()); }
        Ok(PurchaseOrderId(value.to_string()))
    }
}

impl fmt::Display for PartyId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result { write!(f, "{}", self.0) }
}

#[derive(Clone)]
struct PostalAddress { text: String }
#[derive(Clone)]
struct PhoneNumber { digits: String }
#[derive(Clone)]
struct EmailAddress { value: String }
#[derive(Clone)]
struct ContactMeans { address: PostalAddress, phone: PhoneNumber, email: EmailAddress }

fn contact_means(address: &str, digits: &str, email: &str) -> ContactMeans {
    ContactMeans {
        address: PostalAddress { text: address.to_string() },
        phone: PhoneNumber { digits: digits.to_string() },
        email: EmailAddress { value: email.to_string() },
    }
}

// 종류별 속성만 담는 불변 값 — 식별자가 없고 Party 안에서만 산다.
#[derive(Clone)]
struct Individual { birth_year: u16 }
#[derive(Clone)]
struct OrganizationUnit { trading_partner: bool, registration_number: String }
#[derive(Clone)]
enum PartyKind { Person(Individual), Organization(OrganizationUnit) }

impl PartyKind {
    fn label(&self) -> &'static str {
        match self {
            PartyKind::Person(_) => "individual",
            PartyKind::Organization(_) => "organization",
        }
    }
}

/* ── aggregate root ────────────────────────────────────────── */
struct Party { id: PartyId, name: String, kind: PartyKind, contact: ContactMeans }

impl Party {
    fn individual(id: PartyId, name: &str, birth_year: u16, contact: ContactMeans) -> Result<Self, String> {
        Party::require_name(name)?;
        Party::require_contact(&contact)?;
        let kind = PartyKind::Person(Individual { birth_year });
        Ok(Party { id, name: name.to_string(), kind, contact })
    }

    fn organization(id: PartyId, name: &str, trading_partner: bool, registration_number: &str,
                    contact: ContactMeans) -> Result<Self, String> {
        Party::require_name(name)?;
        Party::require_contact(&contact)?;
        let digits_only = registration_number.chars().all(|c| c.is_ascii_digit());
        if trading_partner && !(registration_number.len() == 10 && digits_only) {
            return Err("trading organization needs a 10-digit registration number".to_string());
        }
        if !trading_partner && !registration_number.is_empty() {
            return Err("internal unit must not carry a registration number".to_string());
        }
        let registration_number = registration_number.to_string();
        let kind = PartyKind::Organization(OrganizationUnit { trading_partner, registration_number });
        Ok(Party { id, name: name.to_string(), kind, contact })
    }

    fn require_name(name: &str) -> Result<(), String> {
        if name.trim().is_empty() { return Err("party name is empty".to_string()); }
        Ok(())
    }

    // 연락 수단 검사는 종류와 무관하게 이 한 자리에서만 돈다.
    fn require_contact(contact: &ContactMeans) -> Result<(), String> {
        let email = &contact.email.value;
        if email.matches('@').count() != 1 {
            return Err(format!("email must contain one @: {email}"));
        }
        let digits = &contact.phone.digits;
        let shaped = (9..=13).contains(&digits.len())
            && digits.chars().all(|c| c.is_ascii_digit() || c == '-');
        if !shaped { return Err(format!("phone has an unexpected shape: {digits}")); }
        if contact.address.text.trim().is_empty() {
            return Err("postal address is empty".to_string());
        }
        Ok(())
    }

    fn change_contact(&mut self, next: ContactMeans) -> Result<(), String> {
        Party::require_contact(&next)?;
        self.contact = next;
        Ok(())
    }

    fn address(&self) -> &PostalAddress { &self.contact.address }
    fn registration_number(&self) -> &str {
        match &self.kind {
            PartyKind::Organization(unit) if unit.trading_partner => &unit.registration_number,
            _ => "none",
        }
    }
}

// 발주서 — 별도 aggregate root. Party 를 객체가 아니라 PartyId 로만 가리킨다.
struct PurchaseOrder {
    id: PurchaseOrderId, supplier_id: PartyId, requester_id: PartyId,
    amount: i64, currency: String, issued_on: String,
}

impl PurchaseOrder {
    fn issue(id: PurchaseOrderId, supplier_id: PartyId, requester_id: PartyId, amount: i64,
             currency: &str, issued_on: &str) -> Result<Self, String> {
        if amount <= 0 { return Err("order amount must be positive".to_string()); }
        let (currency, issued_on) = (currency.to_string(), issued_on.to_string());
        Ok(PurchaseOrder { id, supplier_id, requester_id, amount, currency, issued_on })
    }
}

/* ── 저장소와 도메인 서비스 (구현 전용) ────────────────────── */
struct PartyRegistry { by_id: HashMap<PartyId, Party> }

impl PartyRegistry {
    fn new() -> Self { PartyRegistry { by_id: HashMap::new() } }
    fn save(&mut self, party: Party) { self.by_id.insert(party.id.clone(), party); }

    fn require(&self, id: &PartyId) -> Result<&Party, String> {
        self.by_id.get(id).ok_or_else(|| format!("no party registered as {id}"))
    }

    fn require_mut(&mut self, id: &PartyId) -> Result<&mut Party, String> {
        self.by_id.get_mut(id).ok_or_else(|| format!("no party registered as {id}"))
    }
}

struct PurchasingService { orders: Vec<PurchaseOrder> }

impl PurchasingService {
    fn new() -> Self { PurchasingService { orders: Vec::new() } }
    fn issue(&mut self, registry: &PartyRegistry, id: PurchaseOrderId, supplier_id: PartyId,
             requester_id: PartyId, amount: i64, currency: &str, issued_on: &str) -> Result<usize, String> {
        registry.require(&supplier_id)?;
        registry.require(&requester_id)?;
        let order = PurchaseOrder::issue(id, supplier_id, requester_id, amount, currency, issued_on)?;
        self.orders.push(order);
        Ok(self.orders.len() - 1)
    }

    // 종류를 묻지 않는다 — PartyId 로 찾아 공통 속성만 읽는다.
    fn ships_to(&self, registry: &PartyRegistry, id: &PartyId) -> Result<String, String> {
        let party = registry.require(id)?;
        Ok(format!("{} ({}) ships to {}", party.name, party.kind.label(), party.address().text))
    }
}

fn main() -> Result<(), String> {
    let mut registry = PartyRegistry::new();

    let jiwoo = PartyId::new("P-1001")?;
    let jiwoo_contact =
        contact_means("Seoul Mapo-gu Yanghwa-ro 12", "02-300-1001", "jiwoo@example.com");
    registry.save(Party::individual(jiwoo.clone(), "Han Jiwoo", 1988, jiwoo_contact)?);

    let steel = PartyId::new("P-1002")?;
    let steel_contact = contact_means(
        "Incheon Namdong-gu Namdong-ro 77", "032-500-2002", "sales@daehansteel.example");
    registry.save(Party::organization(
        steel.clone(), "Daehan Steel", true, "1234567890", steel_contact)?);

    let team = PartyId::new("P-1003")?;
    let team_contact =
        contact_means("Seoul Mapo-gu Yanghwa-ro 12", "02-300-9000", "purchasing@example.com");
    registry.save(Party::organization(
        team.clone(), "Purchasing Team", false, "", team_contact.clone())?);

    let namesake = PartyId::new("P-1004")?;
    let namesake_contact = contact_means(
        "Busan Haeundae-gu Haeun-daero 30", "051-700-1004", "jiwoo.han@example.net");
    registry.save(Party::individual(namesake.clone(), "Han Jiwoo", 1995, namesake_contact)?);

    let mut purchasing = PurchasingService::new();
    purchasing.issue(&registry, PurchaseOrderId::new("PO-1001")?, jiwoo.clone(), team.clone(),
                     4_800_000, "KRW", "2026-03-03")?;
    purchasing.issue(&registry, PurchaseOrderId::new("PO-1002")?, steel.clone(), team.clone(),
                     5_200_000, "KRW", "2026-03-05")?;

    let po1001_supplier = purchasing.orders[0].supplier_id.clone();
    let po1002_supplier = purchasing.orders[1].supplier_id.clone();
    let po1002_requester = purchasing.orders[1].requester_id.clone();
    println!("PO-1001 supplier {}", purchasing.ships_to(&registry, &po1001_supplier)?);
    println!("PO-1002 supplier {}", purchasing.ships_to(&registry, &po1002_supplier)?);
    println!("PO-1002 requester {}", purchasing.ships_to(&registry, &po1002_requester)?);
    println!("same name, different party: {} vs {} -> {}", jiwoo, namesake, jiwoo != namesake);
    let rn = |id: &PartyId| -> Result<String, String> {
        Ok(registry.require(id)?.registration_number().to_string())
    };
    println!("Daehan Steel registration number: {}", rn(&steel)?);
    println!("Han Jiwoo registration number: {}", rn(&jiwoo)?);
    println!("Purchasing Team registration number: {}", rn(&team)?);

    let bad_contact =
        contact_means("Seoul Jung-gu Sejong-daero 1", "02-000-0001", "jiwoo(at)example.com");
    match Party::individual(PartyId::new("P-9001")?, "Bad Contact", 1990, bad_contact) {
        Ok(_) => println!("rejected (bad email): not rejected"),
        Err(message) => println!("rejected (bad email): {message}"),
    }
    match Party::organization(
        PartyId::new("P-9002")?, "Nowhere Trading", true, "12345", team_contact.clone()) {
        Ok(_) => println!("rejected (missing registration number): not rejected"),
        Err(message) => println!("rejected (missing registration number): {message}"),
    }
    match purchasing.issue(&registry, PurchaseOrderId::new("PO-1003")?, PartyId::new("P-9999")?,
                           team.clone(), 1_000_000, "KRW", "2026-03-06") {
        Ok(_) => println!("rejected (unknown supplier): not rejected"),
        Err(message) => println!("rejected (unknown supplier): {message}"),
    }

    let moved = contact_means(
        "Seoul Yeongdeungpo-gu Yeouido-ro 5", "02-300-1001", "jiwoo@example.com");
    registry.require_mut(&jiwoo)?.change_contact(moved)?;
    println!("after contact change PO-1001 {}", purchasing.ships_to(&registry, &po1001_supplier)?);
    Ok(())
}
