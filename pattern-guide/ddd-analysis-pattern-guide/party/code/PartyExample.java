import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** 거래처 관리 컨텍스트 — Party 하나가 사람과 조직 단위를 함께 담는다. */
public final class PartyExample {

    /* ── 값 객체 ────────────────────────────────────────────────── */

    record PartyId(String value) {
        PartyId {
            if (value == null || value.isBlank()) throw new IllegalArgumentException("party id is empty");
        }
        @Override public String toString() { return value; }
    }

    record PurchaseOrderId(String value) {
        PurchaseOrderId {
            if (value == null || value.isBlank()) throw new IllegalArgumentException("order id is empty");
        }
        @Override public String toString() { return value; }
    }

    record PostalAddress(String text) {}

    record PhoneNumber(String digits) {}

    record EmailAddress(String value) {}

    record ContactMeans(PostalAddress address, PhoneNumber phone, EmailAddress email) {}

    /** 종류별 속성만 담는 불변 값 — 식별자가 없고 Party 안에서만 산다. */
    sealed interface PartyKind permits Individual, OrganizationUnit {
        String label();
    }

    record Individual(int birthYear) implements PartyKind {
        @Override public String label() { return "individual"; }
    }

    record OrganizationUnit(boolean tradingPartner, String registrationNumber) implements PartyKind {
        @Override public String label() { return "organization"; }
    }

    /* ── aggregate root ────────────────────────────────────────── */

    static final class Party {
        private final PartyId id;
        private final String name;
        private final PartyKind kind;
        private ContactMeans contact;

        private Party(PartyId id, String name, PartyKind kind, ContactMeans contact) {
            this.id = id;
            this.name = name;
            this.kind = kind;
            this.contact = contact;
        }

        static Party individual(PartyId id, String name, int birthYear, ContactMeans contact) {
            requireName(name);
            requireContact(contact);
            return new Party(id, name, new Individual(birthYear), contact);
        }

        static Party organization(PartyId id, String name, boolean tradingPartner,
                                  String registrationNumber, ContactMeans contact) {
            requireName(name);
            requireContact(contact);
            if (tradingPartner && !registrationNumber.matches("\\d{10}")) {
                throw new IllegalArgumentException("trading organization needs a 10-digit registration number");
            }
            if (!tradingPartner && !registrationNumber.isEmpty()) {
                throw new IllegalArgumentException("internal unit must not carry a registration number");
            }
            return new Party(id, name, new OrganizationUnit(tradingPartner, registrationNumber), contact);
        }

        private static void requireName(String name) {
            if (name == null || name.isBlank()) throw new IllegalArgumentException("party name is empty");
        }

        /** 연락 수단 검사는 종류와 무관하게 이 한 자리에서만 돈다. */
        private static void requireContact(ContactMeans contact) {
            String email = contact.email().value();
            if (email.chars().filter(c -> c == '@').count() != 1) {
                throw new IllegalArgumentException("email must contain one @: " + email);
            }
            if (!contact.phone().digits().matches("[0-9-]{9,13}")) {
                throw new IllegalArgumentException("phone has an unexpected shape: " + contact.phone().digits());
            }
            if (contact.address().text().isBlank()) {
                throw new IllegalArgumentException("postal address is empty");
            }
        }

        void changeContact(ContactMeans next) {
            requireContact(next);
            this.contact = next;
        }

        PartyId id() { return id; }

        String name() { return name; }

        String kindLabel() { return kind.label(); }

        PostalAddress address() { return contact.address(); }

        String registrationNumber() {
            if (kind instanceof OrganizationUnit unit && unit.tradingPartner()) return unit.registrationNumber();
            return "none";
        }
    }

    /** 발주서 — 별도 aggregate root. Party 를 객체가 아니라 PartyId 로만 가리킨다. */
    record PurchaseOrder(PurchaseOrderId id, PartyId supplierId, PartyId requesterId,
                         long amount, String currency, String issuedOn) {
        PurchaseOrder {
            if (amount <= 0) throw new IllegalArgumentException("order amount must be positive");
        }
    }

    /* ── 저장소와 도메인 서비스 (구현 전용) ────────────────────── */

    static final class PartyRegistry {
        private final Map<String, Party> byId = new HashMap<>();

        void save(Party party) { byId.put(party.id().value(), party); }

        Party require(PartyId id) {
            Party found = byId.get(id.value());
            if (found == null) throw new IllegalArgumentException("no party registered as " + id);
            return found;
        }
    }

    static final class PurchasingService {
        private final PartyRegistry registry;
        private final List<PurchaseOrder> orders = new ArrayList<>();

        PurchasingService(PartyRegistry registry) { this.registry = registry; }

        PurchaseOrder issue(PurchaseOrderId id, PartyId supplierId, PartyId requesterId,
                            long amount, String currency, String issuedOn) {
            registry.require(supplierId);
            registry.require(requesterId);
            PurchaseOrder order = new PurchaseOrder(id, supplierId, requesterId, amount, currency, issuedOn);
            orders.add(order);
            return order;
        }

        /** 종류를 묻지 않는다 — PartyId 로 찾아 공통 속성만 읽는다. */
        String shipsTo(PartyId partyId) {
            Party party = registry.require(partyId);
            return party.name() + " (" + party.kindLabel() + ") ships to " + party.address().text();
        }
    }

    public static void main(String[] args) {
        PartyRegistry registry = new PartyRegistry();

        ContactMeans jiwooContact = new ContactMeans(new PostalAddress("Seoul Mapo-gu Yanghwa-ro 12"),
                new PhoneNumber("02-300-1001"), new EmailAddress("jiwoo@example.com"));
        Party hanJiwoo = Party.individual(new PartyId("P-1001"), "Han Jiwoo", 1988, jiwooContact);
        registry.save(hanJiwoo);

        ContactMeans steelContact = new ContactMeans(new PostalAddress("Incheon Namdong-gu Namdong-ro 77"),
                new PhoneNumber("032-500-2002"), new EmailAddress("sales@daehansteel.example"));
        Party daehanSteel = Party.organization(new PartyId("P-1002"), "Daehan Steel", true, "1234567890",
                steelContact);
        registry.save(daehanSteel);

        ContactMeans teamContact = new ContactMeans(new PostalAddress("Seoul Mapo-gu Yanghwa-ro 12"),
                new PhoneNumber("02-300-9000"), new EmailAddress("purchasing@example.com"));
        Party purchasingTeam = Party.organization(new PartyId("P-1003"), "Purchasing Team", false, "",
                teamContact);
        registry.save(purchasingTeam);

        ContactMeans namesakeContact = new ContactMeans(new PostalAddress("Busan Haeundae-gu Haeun-daero 30"),
                new PhoneNumber("051-700-1004"), new EmailAddress("jiwoo.han@example.net"));
        Party namesake = Party.individual(new PartyId("P-1004"), "Han Jiwoo", 1995, namesakeContact);
        registry.save(namesake);

        PurchasingService purchasing = new PurchasingService(registry);
        PurchaseOrder po1001 = purchasing.issue(new PurchaseOrderId("PO-1001"), hanJiwoo.id(),
                purchasingTeam.id(), 4_800_000L, "KRW", "2026-03-03");
        PurchaseOrder po1002 = purchasing.issue(new PurchaseOrderId("PO-1002"), daehanSteel.id(),
                purchasingTeam.id(), 5_200_000L, "KRW", "2026-03-05");

        System.out.println("PO-1001 supplier " + purchasing.shipsTo(po1001.supplierId()));
        System.out.println("PO-1002 supplier " + purchasing.shipsTo(po1002.supplierId()));
        System.out.println("PO-1002 requester " + purchasing.shipsTo(po1002.requesterId()));
        System.out.println("same name, different party: " + hanJiwoo.id() + " vs " + namesake.id()
                + " -> " + !hanJiwoo.id().equals(namesake.id()));
        System.out.println("Daehan Steel registration number: " + daehanSteel.registrationNumber());
        System.out.println("Han Jiwoo registration number: " + hanJiwoo.registrationNumber());
        System.out.println("Purchasing Team registration number: " + purchasingTeam.registrationNumber());

        try {
            Party.individual(new PartyId("P-9001"), "Bad Contact", 1990,
                    new ContactMeans(new PostalAddress("Seoul Jung-gu Sejong-daero 1"),
                            new PhoneNumber("02-000-0001"), new EmailAddress("jiwoo(at)example.com")));
        } catch (IllegalArgumentException e) {
            System.out.println("rejected (bad email): " + e.getMessage());
        }
        try {
            Party.organization(new PartyId("P-9002"), "Nowhere Trading", true, "12345", teamContact);
        } catch (IllegalArgumentException e) {
            System.out.println("rejected (missing registration number): " + e.getMessage());
        }
        try {
            purchasing.issue(new PurchaseOrderId("PO-1003"), new PartyId("P-9999"), purchasingTeam.id(),
                    1_000_000L, "KRW", "2026-03-06");
        } catch (IllegalArgumentException e) {
            System.out.println("rejected (unknown supplier): " + e.getMessage());
        }

        hanJiwoo.changeContact(new ContactMeans(new PostalAddress("Seoul Yeongdeungpo-gu Yeouido-ro 5"),
                new PhoneNumber("02-300-1001"), new EmailAddress("jiwoo@example.com")));
        System.out.println("after contact change PO-1001 " + purchasing.shipsTo(po1001.supplierId()));
    }
}
