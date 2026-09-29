import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** 조직·권한 관리 컨텍스트 — 두 Party 사이의 책임 관계가 자기 자리를 갖는다. */
public final class AccountabilityExample {

    record PartyId(String value) {}
    record AccountabilityTypeId(String value) {}
    record AccountabilityId(String value) {}

    /** 유효 기간 — 끝이 비어 있으면 아직 열려 있다. ISO 문자열이라 사전순 비교가 곧 시간순이다. */
    record TimePeriod(String start, String end) {
        boolean covers(String date) {
            return start.compareTo(date) <= 0 && (end == null || date.compareTo(end) <= 0);
        }
    }

    /** 행위 주체 — 이 컨텍스트는 식별자와 이름만 본다. */
    record Party(PartyId id, String name) {}

    /** 관계의 종류 — 계통을 하나 더 쓰는 일은 이 타입의 인스턴스를 하나 더 만드는 일이다. */
    record AccountabilityType(AccountabilityTypeId id, String name) {}

    /** 두 Party 사이의 책임 관계. 양 끝과 종류는 만든 뒤 바뀌지 않고, 기간의 끝만 닫힌다. */
    static final class Accountability {
        final AccountabilityId id;
        final PartyId commissionerId;
        final PartyId responsibleId;
        final AccountabilityTypeId typeId;
        private TimePeriod period;

        private Accountability(AccountabilityId id, PartyId commissionerId, PartyId responsibleId,
                               AccountabilityTypeId typeId, TimePeriod period) {
            this.id = id;
            this.commissionerId = commissionerId;
            this.responsibleId = responsibleId;
            this.typeId = typeId;
            this.period = period;
        }

        /** 두 끝이 서로 다른 Party 인지 여기서 본다 — 만든 뒤엔 바꿀 수 없으니 만들 때가 유일한 자리다. */
        static Accountability start(AccountabilityId id, PartyId commissionerId, PartyId responsibleId,
                                    AccountabilityTypeId typeId, String startDate) {
            if (commissionerId.equals(responsibleId)) {
                throw new IllegalArgumentException("both ends must be different parties");
            }
            return new Accountability(id, commissionerId, responsibleId, typeId,
                    new TimePeriod(startDate, null));
        }

        void close(String endDate) {
            if (endDate.compareTo(period.start()) < 0) {
                throw new IllegalArgumentException("period end " + endDate + " is before start " + period.start());
            }
            this.period = new TimePeriod(period.start(), endDate);
        }

        boolean isActiveOn(String date) { return period.covers(date); }
    }

    /** 이 아래 넷은 구현 전용이다 — 저장소 셋과, 그 셋을 id 로 엮는 도메인 서비스. */
    static final class PartyRegistry {
        private final Map<String, Party> byId = new HashMap<>();

        void save(Party party) { byId.put(party.id().value(), party); }

        Party require(PartyId id) {
            Party found = byId.get(id.value());
            if (found == null) throw new IllegalArgumentException("no party registered as " + id.value());
            return found;
        }
    }

    static final class AccountabilityTypeRegistry {
        private final Map<String, AccountabilityType> byId = new HashMap<>();

        void save(AccountabilityType kind) { byId.put(kind.id().value(), kind); }

        AccountabilityType require(AccountabilityTypeId id) {
            AccountabilityType found = byId.get(id.value());
            if (found == null) {
                throw new IllegalArgumentException("no accountability type registered as " + id.value());
            }
            return found;
        }
    }

    static final class AccountabilityRegistry {
        private final List<Accountability> links = new ArrayList<>();

        void save(Accountability link) { links.add(link); }

        List<Accountability> all() { return List.copyOf(links); }
    }

    /** 세 저장소를 id 로 엮는 자리 — 순환 금지처럼 관계 하나로는 지킬 수 없는 규칙이 여기 산다. */
    static final class OrganizationStructure {
        private final PartyRegistry parties;
        private final AccountabilityTypeRegistry types;
        private final AccountabilityRegistry links;

        OrganizationStructure(PartyRegistry parties, AccountabilityTypeRegistry types,
                              AccountabilityRegistry links) {
            this.parties = parties;
            this.types = types;
            this.links = links;
        }

        Accountability register(AccountabilityId id, PartyId commissionerId, PartyId responsibleId,
                                AccountabilityTypeId typeId, String startDate) {
            parties.require(commissionerId);
            parties.require(responsibleId);
            types.require(typeId);
            if (ancestorsInclude(commissionerId, responsibleId, typeId)) {
                throw new IllegalArgumentException(parties.require(responsibleId).name()
                        + " is already an ancestor of " + parties.require(commissionerId).name()
                        + " under " + types.require(typeId).name());
            }
            Accountability link = Accountability.start(id, commissionerId, responsibleId, typeId, startDate);
            links.save(link);
            return link;
        }

        void close(AccountabilityId id, String endDate) {
            for (Accountability link : links.all()) {
                if (link.id.equals(id)) { link.close(endDate); return; }
            }
            throw new IllegalArgumentException("no accountability registered as " + id.value());
        }

        private boolean ancestorsInclude(PartyId party, PartyId candidate, AccountabilityTypeId typeId) {
            for (PartyId above : commissionersOf(party, typeId)) {
                if (above.equals(candidate) || ancestorsInclude(above, candidate, typeId)) return true;
            }
            return false;
        }

        private List<PartyId> commissionersOf(PartyId responsibleId, AccountabilityTypeId typeId) {
            List<PartyId> found = new ArrayList<>();
            for (Accountability link : links.all()) {
                if (link.typeId.equals(typeId) && link.responsibleId.equals(responsibleId)) {
                    found.add(link.commissionerId);
                }
            }
            return found;
        }

        /** 계통을 함께 묻는다 — 종류를 빼면 상위가 여럿 나와 답이 하나로 정해지지 않는다. */
        String parentName(PartyId responsibleId, AccountabilityTypeId typeId, String date) {
            for (Accountability link : links.all()) {
                if (link.typeId.equals(typeId) && link.responsibleId.equals(responsibleId)
                        && link.isActiveOn(date)) {
                    return parties.require(link.commissionerId).name();
                }
            }
            return "none";
        }

        String linesWhereResponsible(PartyId responsibleId, String date) {
            List<String> names = new ArrayList<>();
            for (Accountability link : links.all()) {
                if (link.responsibleId.equals(responsibleId) && link.isActiveOn(date)) {
                    names.add(types.require(link.typeId).name());
                }
            }
            return names.isEmpty() ? "none" : String.join(", ", names);
        }
    }

    public static void main(String[] args) {
        PartyId division = new PartyId("P-2001");
        PartyId office = new PartyId("P-2002");
        PartyId team = new PartyId("P-2003");
        PartyId jiwoo = new PartyId("P-1001");
        PartyId minseo = new PartyId("P-2004");
        PartyId auditOffice = new PartyId("P-2005");
        PartyRegistry parties = new PartyRegistry();
        parties.save(new Party(division, "Purchasing Division"));
        parties.save(new Party(office, "Busan Office"));
        parties.save(new Party(team, "Busan Purchasing Team"));
        parties.save(new Party(jiwoo, "Han Jiwoo"));
        parties.save(new Party(minseo, "Choi Minseo"));
        parties.save(new Party(auditOffice, "Audit Office"));

        AccountabilityTypeId functional = new AccountabilityTypeId("AT-1");
        AccountabilityTypeId regional = new AccountabilityTypeId("AT-2");
        AccountabilityTypeId supervision = new AccountabilityTypeId("AT-3");
        AccountabilityTypeId audit = new AccountabilityTypeId("AT-4");
        AccountabilityTypeId mentoring = new AccountabilityTypeId("AT-5");
        AccountabilityTypeRegistry types = new AccountabilityTypeRegistry();
        types.save(new AccountabilityType(functional, "functional"));
        types.save(new AccountabilityType(regional, "regional"));
        types.save(new AccountabilityType(supervision, "supervision"));
        types.save(new AccountabilityType(audit, "audit"));
        types.save(new AccountabilityType(mentoring, "mentoring"));

        var structure = new OrganizationStructure(parties, types, new AccountabilityRegistry());
        structure.register(new AccountabilityId("A-1"), division, team, functional, "2026-04-01");
        structure.register(new AccountabilityId("A-2"), office, team, regional, "2026-04-01");
        structure.register(new AccountabilityId("A-3"), team, jiwoo, supervision, "2026-04-01");
        structure.register(new AccountabilityId("A-4"), team, minseo, supervision, "2026-04-01");
        structure.register(new AccountabilityId("A-5"), minseo, jiwoo, mentoring, "2026-04-01");
        structure.register(new AccountabilityId("A-6"), auditOffice, jiwoo, audit, "2026-06-01");
        structure.register(new AccountabilityId("A-7"), jiwoo, minseo, audit, "2026-06-01");
        structure.close(new AccountabilityId("A-3"), "2026-06-30");

        System.out.println("functional parent of Busan Purchasing Team on 2026-05-01: "
                + structure.parentName(team, functional, "2026-05-01"));
        System.out.println("regional parent of Busan Purchasing Team on 2026-05-01: "
                + structure.parentName(team, regional, "2026-05-01"));
        System.out.println("supervision parent of Han Jiwoo on 2026-05-01: "
                + structure.parentName(jiwoo, supervision, "2026-05-01"));
        System.out.println("supervision parent of Han Jiwoo on 2026-08-01: "
                + structure.parentName(jiwoo, supervision, "2026-08-01"));
        System.out.println("audit parent of Han Jiwoo on 2026-08-01: "
                + structure.parentName(jiwoo, audit, "2026-08-01"));
        System.out.println("lines where Han Jiwoo is responsible on 2026-08-01: "
                + structure.linesWhereResponsible(jiwoo, "2026-08-01"));
        System.out.println("mentoring parent of Han Jiwoo on 2026-08-01: "
                + structure.parentName(jiwoo, mentoring, "2026-08-01"));
        System.out.println("audit parent of Choi Minseo on 2026-08-01: "
                + structure.parentName(minseo, audit, "2026-08-01"));

        try {
            structure.register(new AccountabilityId("A-8"), jiwoo, jiwoo, supervision, "2026-08-01");
        } catch (IllegalArgumentException e) {
            System.out.println("rejected (same party on both ends): " + e.getMessage());
        }
        try {
            structure.register(new AccountabilityId("A-9"), minseo, auditOffice, audit, "2026-08-01");
        } catch (IllegalArgumentException e) {
            System.out.println("rejected (cycle): " + e.getMessage());
        }
        try {
            structure.register(new AccountabilityId("A-10"), new PartyId("P-9999"), team,
                    functional, "2026-08-01");
        } catch (IllegalArgumentException e) {
            System.out.println("rejected (unknown party): " + e.getMessage());
        }
        try {
            structure.register(new AccountabilityId("A-11"), office, team,
                    new AccountabilityTypeId("AT-9"), "2026-08-01");
        } catch (IllegalArgumentException e) {
            System.out.println("rejected (unknown accountability type): " + e.getMessage());
        }
    }
}
