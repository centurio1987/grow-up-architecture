import java.util.ArrayList;
import java.util.List;

/** Component — 알림을 내보내는 연산 모양. 돌려주는 값은 발송 영수증이다. */
interface Notifier {
    String send(String body);
}

/** ConcreteComponent — 실제로 내보내는 쪽. 외부 발송망 대신 메모리 안 보관함을 쓴다. */
final class SmsNotifier implements Notifier {
    private final List<String> outbox = new ArrayList<>();

    @Override
    public String send(String body) {
        outbox.add(body);
        return "sent[" + body + "]";
    }

    int delivered() {
        return outbox.size();
    }
}

/** Decorator — Component 참조를 들고 받은 요청을 그대로 전달한다. */
abstract class NotifierDecorator implements Notifier {
    protected final Notifier inner;

    protected NotifierDecorator(Notifier inner) {
        this.inner = inner;
    }

    @Override
    public String send(String body) {
        return inner.send(body);
    }
}

/** ConcreteDecorator — 전달하기 전에 서명을 덧붙인다. */
final class SignatureNotifier extends NotifierDecorator {
    static final String SIGNATURE = " -- Bbangto Store CS 010-1234-5678";

    SignatureNotifier(Notifier inner) {
        super(inner);
    }

    @Override
    public String send(String body) {
        return inner.send(body + SIGNATURE);
    }
}

/** ConcreteDecorator — 전달하기 전에 네 자리 이상 이어진 숫자를 가린다. */
final class MaskingNotifier extends NotifierDecorator {
    MaskingNotifier(Notifier inner) {
        super(inner);
    }

    @Override
    public String send(String body) {
        return inner.send(mask(body));
    }

    private static String mask(String text) {
        StringBuilder out = new StringBuilder();
        int i = 0;
        while (i < text.length()) {
            if (!Character.isDigit(text.charAt(i))) {
                out.append(text.charAt(i));
                i++;
                continue;
            }
            int j = i;
            while (j < text.length() && Character.isDigit(text.charAt(j))) {
                j++;
            }
            String run = text.substring(i, j);
            out.append(run.length() >= 4 ? "*".repeat(run.length()) : run);
            i = j;
        }
        return out.toString();
    }
}

/** ConcreteDecorator — 전달한 뒤 영수증에 감사 번호를 붙이고, 받은 횟수를 센다. */
final class AuditNotifier extends NotifierDecorator {
    private int calls;

    AuditNotifier(Notifier inner) {
        super(inner);
    }

    @Override
    public String send(String body) {
        calls++;
        return inner.send(body) + "+audit#" + calls;
    }

    /** Component 에 없는 추가 연산 — 이것을 부르는 쪽은 AuditNotifier 라는 구체 타입을 알아야 한다. */
    int count() {
        return calls;
    }
}

/** Client — Notifier 만 알고, 몇 겹이 감겨 있는지 모른다. */
final class ShipmentDesk {
    private final Notifier notifier;

    ShipmentDesk(Notifier notifier) {
        this.notifier = notifier;
    }

    String ship(String sku) {
        return notifier.send("order " + sku + " shipped today");
    }
}

public class ShipmentNoticeApp {
    public static void main(String[] args) {
        SmsNotifier sms = new SmsNotifier();

        System.out.println("1) plain desk: " + new ShipmentDesk(sms).ship("BOOK-042"));

        AuditNotifier audited = new AuditNotifier(new SignatureNotifier(sms));
        ShipmentDesk auditedDesk = new ShipmentDesk(audited);
        System.out.println("2) audited desk, 1st: " + auditedDesk.ship("BOOK-042"));
        System.out.println("3) audited desk, 2nd: " + auditedDesk.ship("PEN-007"));
        System.out.println("4) audit count " + audited.count() + ", sms deliveries " + sms.delivered());

        Notifier signOutside = new SignatureNotifier(new MaskingNotifier(sms));
        System.out.println("5) signature outside masking: " + new ShipmentDesk(signOutside).ship("BOOK-042"));

        Notifier maskOutside = new MaskingNotifier(new SignatureNotifier(sms));
        System.out.println("6) masking outside signature: " + new ShipmentDesk(maskOutside).ship("BOOK-042"));

        Notifier twice = new SignatureNotifier(new SignatureNotifier(sms));
        System.out.println("7) signature twice: " + new ShipmentDesk(twice).ship("BOOK-042"));

        Notifier decorated = new AuditNotifier(sms);
        System.out.println("8) decorated is the same object as the sms notifier? " + (decorated == sms));
    }
}
