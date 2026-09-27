/** Component — 알림을 내보내는 연산 모양. 돌려주는 값은 발송 영수증이다. */
interface Notifier {
  send(body: string): string;
}

/** ConcreteComponent — 실제로 내보내는 쪽. 외부 발송망 대신 메모리 안 보관함을 쓴다. */
class SmsNotifier implements Notifier {
  private readonly outbox: string[] = [];

  send(body: string): string {
    this.outbox.push(body);
    return `sent[${body}]`;
  }

  delivered(): number {
    return this.outbox.length;
  }
}

/** Decorator — Component 참조를 들고 받은 요청을 그대로 전달한다. */
abstract class NotifierDecorator implements Notifier {
  protected constructor(protected readonly inner: Notifier) {}

  send(body: string): string {
    return this.inner.send(body);
  }
}

/** ConcreteDecorator — 전달하기 전에 서명을 덧붙인다. */
class SignatureNotifier extends NotifierDecorator {
  static readonly SIGNATURE = " -- Bbangto Store CS 010-1234-5678";

  constructor(inner: Notifier) {
    super(inner);
  }

  override send(body: string): string {
    return this.inner.send(body + SignatureNotifier.SIGNATURE);
  }
}

/** ConcreteDecorator — 전달하기 전에 네 자리 이상 이어진 숫자를 가린다. */
class MaskingNotifier extends NotifierDecorator {
  constructor(inner: Notifier) {
    super(inner);
  }

  override send(body: string): string {
    return this.inner.send(MaskingNotifier.mask(body));
  }

  private static mask(text: string): string {
    let out = "";
    let i = 0;
    while (i < text.length) {
      const ch = text.charAt(i);
      if (ch < "0" || ch > "9") {
        out += ch;
        i++;
        continue;
      }
      let j = i;
      while (j < text.length && text.charAt(j) >= "0" && text.charAt(j) <= "9") {
        j++;
      }
      const run = text.slice(i, j);
      out += run.length >= 4 ? "*".repeat(run.length) : run;
      i = j;
    }
    return out;
  }
}

/** ConcreteDecorator — 전달한 뒤 영수증에 감사 번호를 붙이고, 받은 횟수를 센다. */
class AuditNotifier extends NotifierDecorator {
  private calls = 0;

  constructor(inner: Notifier) {
    super(inner);
  }

  override send(body: string): string {
    this.calls++;
    return `${this.inner.send(body)}+audit#${this.calls}`;
  }

  /** Component 에 없는 추가 연산 — 이것을 부르는 쪽은 AuditNotifier 라는 구체 타입을 알아야 한다. */
  count(): number {
    return this.calls;
  }
}

/** Client — Notifier 만 알고, 몇 겹이 감겨 있는지 모른다. */
class ShipmentDesk {
  constructor(private readonly notifier: Notifier) {}

  ship(sku: string): string {
    return this.notifier.send(`order ${sku} shipped today`);
  }
}

const sms = new SmsNotifier();

console.log("1) plain desk: " + new ShipmentDesk(sms).ship("BOOK-042"));

const audited = new AuditNotifier(new SignatureNotifier(sms));
const auditedDesk = new ShipmentDesk(audited);
console.log("2) audited desk, 1st: " + auditedDesk.ship("BOOK-042"));
console.log("3) audited desk, 2nd: " + auditedDesk.ship("PEN-007"));
console.log(`4) audit count ${audited.count()}, sms deliveries ${sms.delivered()}`);

const signOutside: Notifier = new SignatureNotifier(new MaskingNotifier(sms));
console.log("5) signature outside masking: " + new ShipmentDesk(signOutside).ship("BOOK-042"));

const maskOutside: Notifier = new MaskingNotifier(new SignatureNotifier(sms));
console.log("6) masking outside signature: " + new ShipmentDesk(maskOutside).ship("BOOK-042"));

const twice: Notifier = new SignatureNotifier(new SignatureNotifier(sms));
console.log("7) signature twice: " + new ShipmentDesk(twice).ship("BOOK-042"));

const decorated: Notifier = new AuditNotifier(sms);
console.log(`8) decorated is the same object as the sms notifier? ${decorated === sms}`);
