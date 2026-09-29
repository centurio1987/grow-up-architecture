// 조직·권한 관리 컨텍스트 — 두 Party 사이의 책임 관계가 자기 자리를 갖는다.

type PartyId = string & { readonly __brand: 'PartyId' };
type AccountabilityTypeId = string & { readonly __brand: 'AccountabilityTypeId' };
type AccountabilityId = string & { readonly __brand: 'AccountabilityId' };

const partyId = (value: string): PartyId => value as PartyId;
const typeId = (value: string): AccountabilityTypeId => value as AccountabilityTypeId;
const linkId = (value: string): AccountabilityId => value as AccountabilityId;

/** 유효 기간 — 끝이 비어 있으면 아직 열려 있다. ISO 문자열이라 사전순 비교가 곧 시간순이다. */
class TimePeriod {
  constructor(readonly start: string, readonly end: string | null) {}

  covers(date: string): boolean {
    return this.start <= date && (this.end === null || date <= this.end);
  }
}

/** 행위 주체 — 이 컨텍스트는 식별자와 이름만 본다. */
class Party {
  constructor(readonly id: PartyId, readonly name: string) {}
}

/** 관계의 종류 — 계통을 하나 더 쓰는 일은 이 타입의 인스턴스를 하나 더 만드는 일이다. */
class AccountabilityType {
  constructor(readonly id: AccountabilityTypeId, readonly name: string) {}
}

/** 두 Party 사이의 책임 관계. 양 끝과 종류는 만든 뒤 바뀌지 않고, 기간의 끝만 닫힌다. */
class Accountability {
  private period: TimePeriod;

  private constructor(
    readonly id: AccountabilityId,
    readonly commissionerId: PartyId,
    readonly responsibleId: PartyId,
    readonly typeId: AccountabilityTypeId,
    period: TimePeriod,
  ) {
    this.period = period;
  }

  /** 두 끝이 서로 다른 Party 인지 여기서 본다 — 만든 뒤엔 바꿀 수 없으니 만들 때가 유일한 자리다. */
  static start(id: AccountabilityId, commissionerId: PartyId, responsibleId: PartyId,
               kindId: AccountabilityTypeId, startDate: string): Accountability {
    if (commissionerId === responsibleId) throw new Error('both ends must be different parties');
    return new Accountability(id, commissionerId, responsibleId, kindId, new TimePeriod(startDate, null));
  }

  close(endDate: string): void {
    if (endDate < this.period.start) {
      throw new Error(`period end ${endDate} is before start ${this.period.start}`);
    }
    this.period = new TimePeriod(this.period.start, endDate);
  }

  isActiveOn(date: string): boolean {
    return this.period.covers(date);
  }
}

/** 이 아래 넷은 구현 전용이다 — 저장소 셋과, 그 셋을 id 로 엮는 도메인 서비스. */
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

class AccountabilityTypeRegistry {
  private readonly byId = new Map<string, AccountabilityType>();

  save(kind: AccountabilityType): void {
    this.byId.set(kind.id, kind);
  }

  require(id: AccountabilityTypeId): AccountabilityType {
    const found = this.byId.get(id);
    if (found === undefined) throw new Error(`no accountability type registered as ${id}`);
    return found;
  }
}

class AccountabilityRegistry {
  private readonly links: Accountability[] = [];

  save(link: Accountability): void {
    this.links.push(link);
  }

  all(): readonly Accountability[] {
    return this.links.slice();
  }

  require(id: AccountabilityId): Accountability {
    const found = this.links.find((link) => link.id === id);
    if (found === undefined) throw new Error(`no accountability registered as ${id}`);
    return found;
  }
}

/** 순환 금지처럼 관계 하나로는 지킬 수 없는 규칙이 여기 산다. */
class OrganizationStructure {
  constructor(
    private readonly parties: PartyRegistry,
    private readonly types: AccountabilityTypeRegistry,
    private readonly links: AccountabilityRegistry,
  ) {}

  register(id: AccountabilityId, commissionerId: PartyId, responsibleId: PartyId,
           kindId: AccountabilityTypeId, startDate: string): Accountability {
    this.parties.require(commissionerId);
    this.parties.require(responsibleId);
    this.types.require(kindId);
    if (this.ancestorsInclude(commissionerId, responsibleId, kindId)) {
      throw new Error(`${this.parties.require(responsibleId).name} is already an ancestor of `
        + `${this.parties.require(commissionerId).name} under ${this.types.require(kindId).name}`);
    }
    const link = Accountability.start(id, commissionerId, responsibleId, kindId, startDate);
    this.links.save(link);
    return link;
  }

  close(id: AccountabilityId, endDate: string): void {
    this.links.require(id).close(endDate);
  }

  private ancestorsInclude(party: PartyId, candidate: PartyId, kindId: AccountabilityTypeId): boolean {
    return this.commissionersOf(party, kindId)
      .some((above) => above === candidate || this.ancestorsInclude(above, candidate, kindId));
  }

  private commissionersOf(responsibleId: PartyId, kindId: AccountabilityTypeId): PartyId[] {
    return this.links.all()
      .filter((link) => link.typeId === kindId && link.responsibleId === responsibleId)
      .map((link) => link.commissionerId);
  }

  /** 계통을 함께 묻는다 — 종류를 빼면 상위가 여럿 나와 답이 하나로 정해지지 않는다. */
  parentName(responsibleId: PartyId, kindId: AccountabilityTypeId, date: string): string {
    for (const link of this.links.all()) {
      if (link.typeId === kindId && link.responsibleId === responsibleId && link.isActiveOn(date)) {
        return this.parties.require(link.commissionerId).name;
      }
    }
    return 'none';
  }

  linesWhereResponsible(responsibleId: PartyId, date: string): string {
    const names = this.links.all()
      .filter((link) => link.responsibleId === responsibleId && link.isActiveOn(date))
      .map((link) => this.types.require(link.typeId).name);
    return names.length === 0 ? 'none' : names.join(', ');
  }
}

const division = partyId('P-2001');
const office = partyId('P-2002');
const team = partyId('P-2003');
const jiwoo = partyId('P-1001');
const minseo = partyId('P-2004');
const auditOffice = partyId('P-2005');
const parties = new PartyRegistry();
parties.save(new Party(division, 'Purchasing Division'));
parties.save(new Party(office, 'Busan Office'));
parties.save(new Party(team, 'Busan Purchasing Team'));
parties.save(new Party(jiwoo, 'Han Jiwoo'));
parties.save(new Party(minseo, 'Choi Minseo'));
parties.save(new Party(auditOffice, 'Audit Office'));

const functional = typeId('AT-1');
const regional = typeId('AT-2');
const supervision = typeId('AT-3');
const audit = typeId('AT-4');
const mentoring = typeId('AT-5');
const types = new AccountabilityTypeRegistry();
types.save(new AccountabilityType(functional, 'functional'));
types.save(new AccountabilityType(regional, 'regional'));
types.save(new AccountabilityType(supervision, 'supervision'));
types.save(new AccountabilityType(audit, 'audit'));
types.save(new AccountabilityType(mentoring, 'mentoring'));

const structure = new OrganizationStructure(parties, types, new AccountabilityRegistry());
structure.register(linkId('A-1'), division, team, functional, '2026-04-01');
structure.register(linkId('A-2'), office, team, regional, '2026-04-01');
structure.register(linkId('A-3'), team, jiwoo, supervision, '2026-04-01');
structure.register(linkId('A-4'), team, minseo, supervision, '2026-04-01');
structure.register(linkId('A-5'), minseo, jiwoo, mentoring, '2026-04-01');
structure.register(linkId('A-6'), auditOffice, jiwoo, audit, '2026-06-01');
structure.register(linkId('A-7'), jiwoo, minseo, audit, '2026-06-01');
structure.close(linkId('A-3'), '2026-06-30');

console.log('functional parent of Busan Purchasing Team on 2026-05-01: '
  + structure.parentName(team, functional, '2026-05-01'));
console.log('regional parent of Busan Purchasing Team on 2026-05-01: '
  + structure.parentName(team, regional, '2026-05-01'));
console.log('supervision parent of Han Jiwoo on 2026-05-01: '
  + structure.parentName(jiwoo, supervision, '2026-05-01'));
console.log('supervision parent of Han Jiwoo on 2026-08-01: '
  + structure.parentName(jiwoo, supervision, '2026-08-01'));
console.log('audit parent of Han Jiwoo on 2026-08-01: '
  + structure.parentName(jiwoo, audit, '2026-08-01'));
console.log('lines where Han Jiwoo is responsible on 2026-08-01: '
  + structure.linesWhereResponsible(jiwoo, '2026-08-01'));
console.log('mentoring parent of Han Jiwoo on 2026-08-01: '
  + structure.parentName(jiwoo, mentoring, '2026-08-01'));
console.log('audit parent of Choi Minseo on 2026-08-01: '
  + structure.parentName(minseo, audit, '2026-08-01'));

try {
  structure.register(linkId('A-8'), jiwoo, jiwoo, supervision, '2026-08-01');
} catch (caught) {
  console.log(`rejected (same party on both ends): ${(caught as { message: string }).message}`);
}
try {
  structure.register(linkId('A-9'), minseo, auditOffice, audit, '2026-08-01');
} catch (caught) {
  console.log(`rejected (cycle): ${(caught as { message: string }).message}`);
}
try {
  structure.register(linkId('A-10'), partyId('P-9999'), team, functional, '2026-08-01');
} catch (caught) {
  console.log(`rejected (unknown party): ${(caught as { message: string }).message}`);
}
try {
  structure.register(linkId('A-11'), office, team, typeId('AT-9'), '2026-08-01');
} catch (caught) {
  console.log(`rejected (unknown accountability type): ${(caught as { message: string }).message}`);
}
