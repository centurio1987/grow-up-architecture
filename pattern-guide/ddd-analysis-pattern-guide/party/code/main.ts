// 거래처 관리 컨텍스트 — Party 하나가 사람과 조직 단위를 함께 담는다.

/* ── 값 객체 ────────────────────────────────────────────────── */

// 브랜드 타입 — 구조적 타이핑에서 PartyId 자리에 다른 id 문자열이 들어가는 것을 막는다.
type PartyId = string & { readonly __brand: "PartyId" };
type PurchaseOrderId = string & { readonly __brand: "PurchaseOrderId" };

function partyId(value: string): PartyId {
  if (value.trim() === "") throw new Error("party id is empty");
  return value as PartyId;
}

function purchaseOrderId(value: string): PurchaseOrderId {
  if (value.trim() === "") throw new Error("order id is empty");
  return value as PurchaseOrderId;
}

interface PostalAddress { readonly text: string }

interface PhoneNumber { readonly digits: string }

interface EmailAddress { readonly value: string }

interface ContactMeans {
  readonly address: PostalAddress;
  readonly phone: PhoneNumber;
  readonly email: EmailAddress;
}

function contactMeans(address: string, digits: string, email: string): ContactMeans {
  return { address: { text: address }, phone: { digits }, email: { value: email } };
}

// 종류별 속성만 담는 불변 값 — 식별자가 없고 Party 안에서만 산다.
interface Individual {
  readonly label: "individual";
  readonly birthYear: number;
}

interface OrganizationUnit {
  readonly label: "organization";
  readonly tradingPartner: boolean;
  readonly registrationNumber: string;
}

type PartyKind = Individual | OrganizationUnit;

/* ── aggregate root ────────────────────────────────────────── */

class Party {
  private constructor(
    readonly id: PartyId,
    readonly name: string,
    private readonly kind: PartyKind,
    private contact: ContactMeans,
  ) {}

  static individual(id: PartyId, name: string, birthYear: number, contact: ContactMeans): Party {
    Party.requireName(name);
    Party.requireContact(contact);
    return new Party(id, name, { label: "individual", birthYear }, contact);
  }

  static organization(id: PartyId, name: string, tradingPartner: boolean,
                      registrationNumber: string, contact: ContactMeans): Party {
    Party.requireName(name);
    Party.requireContact(contact);
    if (tradingPartner && !/^\d{10}$/.test(registrationNumber)) {
      throw new Error("trading organization needs a 10-digit registration number");
    }
    if (!tradingPartner && registrationNumber !== "") {
      throw new Error("internal unit must not carry a registration number");
    }
    return new Party(id, name, { label: "organization", tradingPartner, registrationNumber }, contact);
  }

  private static requireName(name: string): void {
    if (name.trim() === "") throw new Error("party name is empty");
  }

  // 연락 수단 검사는 종류와 무관하게 이 한 자리에서만 돈다.
  private static requireContact(contact: ContactMeans): void {
    const email = contact.email.value;
    if (email.split("@").length !== 2) {
      throw new Error(`email must contain one @: ${email}`);
    }
    if (!/^[0-9-]{9,13}$/.test(contact.phone.digits)) {
      throw new Error(`phone has an unexpected shape: ${contact.phone.digits}`);
    }
    if (contact.address.text.trim() === "") {
      throw new Error("postal address is empty");
    }
  }

  changeContact(next: ContactMeans): void {
    Party.requireContact(next);
    this.contact = next;
  }

  kindLabel(): string {
    return this.kind.label;
  }

  address(): PostalAddress {
    return this.contact.address;
  }

  registrationNumber(): string {
    if (this.kind.label === "organization" && this.kind.tradingPartner) {
      return this.kind.registrationNumber;
    }
    return "none";
  }
}

// 발주서 — 별도 aggregate root. Party 를 객체가 아니라 PartyId 로만 가리킨다.
class PurchaseOrder {
  constructor(
    readonly id: PurchaseOrderId,
    readonly supplierId: PartyId,
    readonly requesterId: PartyId,
    readonly amount: number,
    readonly currency: string,
    readonly issuedOn: string,
  ) {
    if (amount <= 0) throw new Error("order amount must be positive");
  }
}

/* ── 저장소와 도메인 서비스 (구현 전용) ────────────────────── */

class PartyRegistry {
  private readonly byId = new Map<string, Party>();

  save(party: Party): void {
    this.byId.set(party.id, party);
  }

  require(id: PartyId): Party {
    const found = this.byId.get(id);
    if (found === undefined) throw new Error(`no party registered as ${id}`);
    return found;
  }
}

class PurchasingService {
  private readonly orders: PurchaseOrder[] = [];

  constructor(private readonly registry: PartyRegistry) {}

  issue(id: PurchaseOrderId, supplierId: PartyId, requesterId: PartyId,
        amount: number, currency: string, issuedOn: string): PurchaseOrder {
    this.registry.require(supplierId);
    this.registry.require(requesterId);
    const order = new PurchaseOrder(id, supplierId, requesterId, amount, currency, issuedOn);
    this.orders.push(order);
    return order;
  }

  // 종류를 묻지 않는다 — PartyId 로 찾아 공통 속성만 읽는다.
  shipsTo(id: PartyId): string {
    const party = this.registry.require(id);
    return `${party.name} (${party.kindLabel()}) ships to ${party.address().text}`;
  }
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function main(): void {
  const registry = new PartyRegistry();

  const hanJiwoo = Party.individual(
    partyId("P-1001"),
    "Han Jiwoo",
    1988,
    contactMeans("Seoul Mapo-gu Yanghwa-ro 12", "02-300-1001", "jiwoo@example.com"),
  );
  registry.save(hanJiwoo);

  const daehanSteel = Party.organization(
    partyId("P-1002"),
    "Daehan Steel",
    true,
    "1234567890",
    contactMeans("Incheon Namdong-gu Namdong-ro 77", "032-500-2002", "sales@daehansteel.example"),
  );
  registry.save(daehanSteel);

  const teamContact = contactMeans("Seoul Mapo-gu Yanghwa-ro 12", "02-300-9000", "purchasing@example.com");
  const purchasingTeam = Party.organization(partyId("P-1003"), "Purchasing Team", false, "", teamContact);
  registry.save(purchasingTeam);

  const namesake = Party.individual(
    partyId("P-1004"),
    "Han Jiwoo",
    1995,
    contactMeans("Busan Haeundae-gu Haeun-daero 30", "051-700-1004", "jiwoo.han@example.net"),
  );
  registry.save(namesake);

  const purchasing = new PurchasingService(registry);
  const po1001 = purchasing.issue(
    purchaseOrderId("PO-1001"), hanJiwoo.id, purchasingTeam.id, 4_800_000, "KRW", "2026-03-03");
  const po1002 = purchasing.issue(
    purchaseOrderId("PO-1002"), daehanSteel.id, purchasingTeam.id, 5_200_000, "KRW", "2026-03-05");

  console.log(`PO-1001 supplier ${purchasing.shipsTo(po1001.supplierId)}`);
  console.log(`PO-1002 supplier ${purchasing.shipsTo(po1002.supplierId)}`);
  console.log(`PO-1002 requester ${purchasing.shipsTo(po1002.requesterId)}`);
  console.log(
    `same name, different party: ${hanJiwoo.id} vs ${namesake.id} -> ${hanJiwoo.id !== namesake.id}`);
  console.log(`Daehan Steel registration number: ${daehanSteel.registrationNumber()}`);
  console.log(`Han Jiwoo registration number: ${hanJiwoo.registrationNumber()}`);
  console.log(`Purchasing Team registration number: ${purchasingTeam.registrationNumber()}`);

  try {
    Party.individual(partyId("P-9001"), "Bad Contact", 1990,
      contactMeans("Seoul Jung-gu Sejong-daero 1", "02-000-0001", "jiwoo(at)example.com"));
  } catch (error) {
    console.log(`rejected (bad email): ${message(error)}`);
  }
  try {
    Party.organization(partyId("P-9002"), "Nowhere Trading", true, "12345", teamContact);
  } catch (error) {
    console.log(`rejected (missing registration number): ${message(error)}`);
  }
  try {
    purchasing.issue(
      purchaseOrderId("PO-1003"), partyId("P-9999"), purchasingTeam.id, 1_000_000, "KRW", "2026-03-06");
  } catch (error) {
    console.log(`rejected (unknown supplier): ${message(error)}`);
  }

  hanJiwoo.changeContact(
    contactMeans("Seoul Yeongdeungpo-gu Yeouido-ro 5", "02-300-1001", "jiwoo@example.com"));
  console.log(`after contact change PO-1001 ${purchasing.shipsTo(po1001.supplierId)}`);
}

main();
