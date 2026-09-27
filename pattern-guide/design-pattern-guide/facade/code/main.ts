// 서브시스템 바깥의 옛 메일 시스템 — 자기 어휘로만 말한다
class LegacyMailer {
  private readonly sent: string[] = [];

  push(to: string, subject: string, body: string): void {
    this.sent.push(`${to} | ${subject} | ${body}`);
  }

  count(): number {
    return this.sent.length;
  }

  first(): string {
    return this.sent[0] ?? "";
  }
}

// 서브시스템 클래스 넷 — 서로도 모르고 BookingDesk 도 모른다
interface NoticeSender {
  send(requester: string, text: string): void;
}

class MailNotice implements NoticeSender {
  constructor(private readonly mailer: LegacyMailer) {}

  send(requester: string, text: string): void {
    this.mailer.push(`${requester}@corp.example`, "booking confirmed", text);
  }
}

class RoomCatalog {
  private readonly capacity: ReadonlyArray<readonly [string, number]> = [
    ["R1", 4],
    ["R2", 8],
    ["R3", 8],
    ["R4", 20],
  ];

  roomsFor(people: number): string[] {
    return this.capacity.filter(([, seats]) => seats >= people).map(([room]) => room);
  }
}

class ScheduleBook {
  private readonly held: string[] = [];

  isFree(room: string, startHour: number, hours: number): boolean {
    for (let h = startHour; h < startHour + hours; h++) {
      if (this.held.includes(`${room}@${h}`)) {
        return false;
      }
    }
    return true;
  }

  hold(room: string, startHour: number, hours: number): void {
    for (let h = startHour; h < startHour + hours; h++) {
      this.held.push(`${room}@${h}`);
    }
  }
}

class EquipmentPool {
  private readonly used = new Map<number, number>();

  constructor(private readonly total: number) {}

  freeAt(startHour: number, hours: number): number {
    let least = this.total;
    for (let h = startHour; h < startHour + hours; h++) {
      least = Math.min(least, this.total - (this.used.get(h) ?? 0));
    }
    return least;
  }

  assign(count: number, startHour: number, hours: number): void {
    for (let h = startHour; h < startHour + hours; h++) {
      this.used.set(h, (this.used.get(h) ?? 0) + count);
    }
  }
}

// Facade — 네 서브시스템 객체를 알고, 호출 순서만 안다
class BookingDesk {
  constructor(
    private readonly catalog: RoomCatalog,
    private readonly schedule: ScheduleBook,
    private readonly projectors: EquipmentPool,
    private readonly notice: NoticeSender,
  ) {}

  reserve(
    requester: string,
    people: number,
    startHour: number,
    hours: number,
    projectorCount: number,
  ): string {
    let room: string | null = null;
    for (const candidate of this.catalog.roomsFor(people)) {
      if (this.schedule.isFree(candidate, startHour, hours)) {
        room = candidate;
        break;
      }
    }
    if (room === null) {
      return `rejected no room for ${people}`;
    }
    const free = this.projectors.freeAt(startHour, hours);
    if (free < projectorCount) {
      return `rejected projector short need ${projectorCount} free ${free}`;
    }
    this.schedule.hold(room, startHour, hours);
    this.projectors.assign(projectorCount, startHour, hours);
    const slot = `${room} ${startHour}-${startHour + hours}`;
    this.notice.send(requester, slot);
    return `confirmed ${slot} projector ${projectorCount}`;
  }
}

const mailer = new LegacyMailer();
const catalog = new RoomCatalog();
const schedule = new ScheduleBook();
const projectors = new EquipmentPool(2);
const desk = new BookingDesk(catalog, schedule, projectors, new MailNotice(mailer));

console.log(`1) alice: ${desk.reserve("alice", 8, 14, 1, 1)}`);
console.log(`2) bob: ${desk.reserve("bob", 8, 14, 1, 1)}`);
console.log(`3) carol: ${desk.reserve("carol", 8, 14, 1, 1)}`);
console.log(`4) dave: ${desk.reserve("dave", 20, 16, 2, 0)}`);

// 총무팀은 방을 지정해야 해서 서브시스템을 직접 쓴다 — Facade 는 그것을 막지 않는다
schedule.hold("R1", 14, 1);
console.log(`5) admin direct hold R1 14-15, mail sent ${mailer.count()}`);
console.log(`6) first mail: ${mailer.first()}`);
