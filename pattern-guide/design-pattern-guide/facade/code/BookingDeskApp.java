import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

// 서브시스템 바깥의 옛 메일 시스템 — 자기 어휘로만 말한다
final class LegacyMailer {
    private final List<String> sent = new ArrayList<>();

    void push(String to, String subject, String body) {
        sent.add(to + " | " + subject + " | " + body);
    }

    int count() {
        return sent.size();
    }

    String first() {
        return sent.isEmpty() ? "" : sent.get(0);
    }
}

// 서브시스템 클래스 넷 — 서로도 모르고 BookingDesk 도 모른다
interface NoticeSender {
    void send(String requester, String text);
}

final class MailNotice implements NoticeSender {
    private final LegacyMailer mailer;

    MailNotice(LegacyMailer mailer) {
        this.mailer = mailer;
    }

    @Override
    public void send(String requester, String text) {
        mailer.push(requester + "@corp.example", "booking confirmed", text);
    }
}

final class RoomCatalog {
    private final Map<String, Integer> capacity = new LinkedHashMap<>();

    RoomCatalog() {
        capacity.put("R1", 4);
        capacity.put("R2", 8);
        capacity.put("R3", 8);
        capacity.put("R4", 20);
    }

    List<String> roomsFor(int people) {
        List<String> got = new ArrayList<>();
        for (Map.Entry<String, Integer> e : capacity.entrySet()) {
            if (e.getValue() >= people) {
                got.add(e.getKey());
            }
        }
        return got;
    }
}

final class ScheduleBook {
    private final List<String> held = new ArrayList<>();

    boolean isFree(String room, int startHour, int hours) {
        for (int h = startHour; h < startHour + hours; h++) {
            if (held.contains(room + "@" + h)) {
                return false;
            }
        }
        return true;
    }

    void hold(String room, int startHour, int hours) {
        for (int h = startHour; h < startHour + hours; h++) {
            held.add(room + "@" + h);
        }
    }
}

final class EquipmentPool {
    private final int total;
    private final Map<Integer, Integer> used = new LinkedHashMap<>();

    EquipmentPool(int total) {
        this.total = total;
    }

    int freeAt(int startHour, int hours) {
        int least = total;
        for (int h = startHour; h < startHour + hours; h++) {
            least = Math.min(least, total - used.getOrDefault(h, 0));
        }
        return least;
    }

    void assign(int count, int startHour, int hours) {
        for (int h = startHour; h < startHour + hours; h++) {
            used.put(h, used.getOrDefault(h, 0) + count);
        }
    }
}

// Facade — 네 서브시스템 객체를 알고, 호출 순서만 안다
final class BookingDesk {
    private final RoomCatalog catalog;
    private final ScheduleBook schedule;
    private final EquipmentPool projectors;
    private final NoticeSender notice;

    BookingDesk(RoomCatalog catalog, ScheduleBook schedule, EquipmentPool projectors, NoticeSender notice) {
        this.catalog = catalog;
        this.schedule = schedule;
        this.projectors = projectors;
        this.notice = notice;
    }

    String reserve(String requester, int people, int startHour, int hours, int projectorCount) {
        String room = null;
        for (String candidate : catalog.roomsFor(people)) {
            if (schedule.isFree(candidate, startHour, hours)) {
                room = candidate;
                break;
            }
        }
        if (room == null) {
            return "rejected no room for " + people;
        }
        int free = projectors.freeAt(startHour, hours);
        if (free < projectorCount) {
            return "rejected projector short need " + projectorCount + " free " + free;
        }
        schedule.hold(room, startHour, hours);
        projectors.assign(projectorCount, startHour, hours);
        String slot = room + " " + startHour + "-" + (startHour + hours);
        notice.send(requester, slot);
        return "confirmed " + slot + " projector " + projectorCount;
    }
}

public final class BookingDeskApp {
    public static void main(String[] args) {
        LegacyMailer mailer = new LegacyMailer();
        RoomCatalog catalog = new RoomCatalog();
        ScheduleBook schedule = new ScheduleBook();
        EquipmentPool projectors = new EquipmentPool(2);
        BookingDesk desk = new BookingDesk(catalog, schedule, projectors, new MailNotice(mailer));

        System.out.println("1) alice: " + desk.reserve("alice", 8, 14, 1, 1));
        System.out.println("2) bob: " + desk.reserve("bob", 8, 14, 1, 1));
        System.out.println("3) carol: " + desk.reserve("carol", 8, 14, 1, 1));
        System.out.println("4) dave: " + desk.reserve("dave", 20, 16, 2, 0));

        // 총무팀은 방을 지정해야 해서 서브시스템을 직접 쓴다 — Facade 는 그것을 막지 않는다
        schedule.hold("R1", 14, 1);
        System.out.println("5) admin direct hold R1 14-15, mail sent " + mailer.count());
        System.out.println("6) first mail: " + mailer.first());
    }
}
