import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

record EquipmentTypeId(String value) {}
record InspectionTypeId(String value) {}
record EquipmentId(String value) {}
record InspectionId(String value) {}

// VO: 정상으로 보는 수치 구간. 양 끝을 포함한다
record NormalRange(long low, long high) {
    boolean contains(long amount) { return low <= amount && amount <= high; }
    @Override public String toString() { return low + ".." + high; }
}

// VO: 수치와 단위를 묶은 측정값 — 단위를 들고 오는 이유는 대조할 상대가 지식 층위에 있기 때문이다
record Reading(long amount, String unit) {
    @Override public String toString() { return amount + " " + unit; }
}

// VO: 기록 시점에 적용한 범위와 그 결과. 한 번 정해지면 바뀌지 않는다
record Verdict(String label, NormalRange applied) {
    @Override public String toString() { return label + " (적용 범위 " + applied + ")"; }
}

// VO: 점검 종류가 내놓는 규칙 한 벌 — 운영 층위가 지식 객체에서 받는 것은 이 값뿐이다
record InspectionRule(InspectionTypeId typeId, String unit, NormalRange range,
                      List<EquipmentTypeId> allowed) {
    boolean allows(EquipmentTypeId typeId) { return allowed.contains(typeId); }
    Verdict judge(Reading reading) {
        return new Verdict(range.contains(reading.amount()) ? "정상" : "이상", range);
    }
}

// aggregate root, 지식 층위: 설비를 가르는 분류
final class EquipmentType {
    private final EquipmentTypeId id;
    private final String name;
    EquipmentType(EquipmentTypeId id, String name) { this.id = id; this.name = name; }
    EquipmentTypeId id() { return id; }
    String name() { return name; }
}

// aggregate root, 지식 층위: 무엇을 재고 · 어디에 쓸 수 있고 · 어디까지가 정상인지 셋을 한 인스턴스가 쥔다
final class InspectionType {
    private final InspectionTypeId id;
    private final String name;
    private final String item;
    private final String unit;
    private NormalRange range;
    private final List<EquipmentTypeId> allowed = new ArrayList<>();

    InspectionType(InspectionTypeId id, String name, String item, String unit,
                   NormalRange range, List<EquipmentTypeId> allowed) {
        if (allowed.isEmpty())
            throw new IllegalArgumentException(
                    "점검 종류 " + id.value() + " 의 허용 설비 종류가 비어 있습니다");
        this.id = id; this.name = name; this.item = item; this.unit = unit; this.range = range;
        this.allowed.addAll(allowed);
    }

    InspectionTypeId id() { return id; }
    InspectionRule rule() { return new InspectionRule(id, unit, range, List.copyOf(allowed)); }
    void allow(EquipmentTypeId typeId) { if (!allowed.contains(typeId)) allowed.add(typeId); }
    NormalRange range() { return range; }
    void narrowTo(NormalRange narrower) { this.range = narrower; }

    String describe() {
        return "점검 종류 " + id.value() + " " + name + ": " + item + " " + range + " " + unit
                + ", 허용 설비 종류 " + labels(allowed);
    }

    static String labels(List<EquipmentTypeId> ids) {
        List<String> out = new ArrayList<>();
        for (EquipmentTypeId each : ids) out.add(each.value());
        return out.toString();
    }

    List<EquipmentTypeId> allowedTypes() { return List.copyOf(allowed); }
}

// aggregate root, 운영 층위: 현장에 있는 설비 한 대
final class Equipment {
    private final EquipmentId id;
    private final String name;
    private final EquipmentTypeId typeId;
    Equipment(EquipmentId id, String name, EquipmentTypeId typeId) {
        this.id = id; this.name = name; this.typeId = typeId;
    }
    EquipmentId id() { return id; }
    String name() { return name; }
    EquipmentTypeId typeId() { return typeId; }
}

// aggregate root, 운영 층위: 점검 한 건의 사실. 규칙은 하나도 들고 있지 않다
final class Inspection {
    private final InspectionId id;
    private final EquipmentId equipmentId;
    private final InspectionTypeId typeId;
    private final String date;
    private final Reading reading;
    private final Verdict verdict;

    private Inspection(InspectionId id, EquipmentId equipmentId, InspectionTypeId typeId,
                       String date, Reading reading, Verdict verdict) {
        this.id = id; this.equipmentId = equipmentId; this.typeId = typeId;
        this.date = date; this.reading = reading; this.verdict = verdict;
    }

    static Inspection record(InspectionId id, EquipmentId equipmentId, EquipmentTypeId equipmentTypeId,
                             String date, Reading reading, InspectionRule rule) {
        if (!rule.allows(equipmentTypeId))
            throw new IllegalArgumentException("점검 종류 " + rule.typeId().value()
                    + " 은 설비 종류 " + equipmentTypeId.value() + " 을 허용하지 않습니다");
        if (!rule.unit().equals(reading.unit()))
            throw new IllegalArgumentException("점검 종류 " + rule.typeId().value()
                    + " 는 " + rule.unit() + " 을 요구하는데 측정값이 " + reading.unit() + " 입니다");
        return new Inspection(id, equipmentId, rule.typeId(), date, reading, rule.judge(reading));
    }

    Verdict verdict() { return verdict; }

    String line() {
        return id.value() + " " + date + " " + equipmentId.value() + " 을 " + typeId.value()
                + " 로 -> " + reading + ", 판정 " + verdict;
    }
}

// 지식 층위 등록부 — 등록 서비스이자 저장소 (aggregate 아님)
final class TypeCatalog {
    private final Map<String, EquipmentType> equipmentTypes = new LinkedHashMap<>();
    private final Map<String, InspectionType> inspectionTypes = new LinkedHashMap<>();

    void register(EquipmentType type) { equipmentTypes.put(type.id().value(), type); }
    void register(InspectionType type) { inspectionTypes.put(type.id().value(), type); }
    InspectionType inspectionType(InspectionTypeId id) { return inspectionTypes.get(id.value()); }
    InspectionRule ruleOf(InspectionTypeId id) { return inspectionTypes.get(id.value()).rule(); }
    int equipmentTypeCount() { return equipmentTypes.size(); }
    int inspectionTypeCount() { return inspectionTypes.size(); }
}

// 운영 층위 장부 — 기록 서비스이자 저장소 (aggregate 아님)
final class SiteLog {
    private final Map<String, Equipment> equipments = new LinkedHashMap<>();
    private final List<Inspection> inspections = new ArrayList<>();

    void add(Equipment equipment) { equipments.put(equipment.id().value(), equipment); }

    Inspection record(TypeCatalog catalog, InspectionId id, EquipmentId equipmentId,
                      InspectionTypeId typeId, String date, Reading reading) {
        Equipment equipment = equipments.get(equipmentId.value());
        Inspection inspection = Inspection.record(
                id, equipmentId, equipment.typeId(), date, reading, catalog.ruleOf(typeId));
        inspections.add(inspection);
        return inspection;
    }

    int equipmentCount() { return equipments.size(); }
    int inspectionCount() { return inspections.size(); }
}

public class KnowledgeLevelExample {
    static final EquipmentTypeId EV = new EquipmentTypeId("ET-EV");
    static final EquipmentTypeId BL = new EquipmentTypeId("ET-BL");
    static final EquipmentTypeId FS = new EquipmentTypeId("ET-FS");
    static final InspectionTypeId IT1 = new InspectionTypeId("IT-1");
    static final InspectionTypeId IT2 = new InspectionTypeId("IT-2");
    static final InspectionTypeId IT3 = new InspectionTypeId("IT-3");
    static final InspectionTypeId IT4 = new InspectionTypeId("IT-4");
    static final EquipmentId EV01 = new EquipmentId("EV-01");
    static final EquipmentId BL01 = new EquipmentId("BL-01");
    static final EquipmentId FS01 = new EquipmentId("FS-01");

    static void reject(String what, Runnable body) {
        try { body.run(); } catch (RuntimeException e) {
            System.out.println("거절(" + what + "): " + e.getMessage());
        }
    }

    public static void main(String[] args) {
        TypeCatalog catalog = new TypeCatalog();
        SiteLog log = new SiteLog();

        catalog.register(new EquipmentType(EV, "승강기"));
        catalog.register(new EquipmentType(BL, "보일러"));
        System.out.println("[지식] 설비 종류 ET-EV 승강기 · ET-BL 보일러");
        catalog.register(new InspectionType(IT1, "승강기 정기점검", "제동거리", "mm",
                new NormalRange(0, 60), List.of(EV)));
        catalog.register(new InspectionType(IT2, "보일러 연소점검", "배기CO", "ppm",
                new NormalRange(0, 400), List.of(BL)));
        System.out.println("[지식] " + catalog.inspectionType(IT1).describe());
        System.out.println("[지식] " + catalog.inspectionType(IT2).describe());

        log.add(new Equipment(EV01, "승강기", EV));
        log.add(new Equipment(BL01, "보일러", BL));
        System.out.println("[운영] 설비 EV-01 승강기 (ET-EV) · BL-01 보일러 (ET-BL)");

        Inspection first = log.record(catalog, new InspectionId("INS-1"), EV01, IT1,
                "2026-03-05", new Reading(48, "mm"));
        System.out.println(first.line());
        System.out.println(log.record(catalog, new InspectionId("INS-2"), BL01, IT2,
                "2026-03-06", new Reading(520, "ppm")).line());

        reject("허용 조합 아님", () -> log.record(catalog, new InspectionId("INS-X"), BL01, IT1,
                "2026-03-06", new Reading(0, "mm")));
        reject("단위 다름", () -> log.record(catalog, new InspectionId("INS-X"), BL01, IT2,
                "2026-03-06", new Reading(48, "mm")));
        reject("허용 설비 종류 없음", () -> new InspectionType(new InspectionTypeId("IT-9"),
                "미정 점검", "미정", "회", new NormalRange(0, 1), List.of()));

        catalog.register(new InspectionType(IT3, "승강기 비상통화", "응답시간", "s",
                new NormalRange(0, 10), List.of(EV)));
        catalog.register(new InspectionType(IT4, "안전표지", "훼손개수", "개",
                new NormalRange(0, 0), List.of(EV, BL)));
        System.out.println("[지식] " + catalog.inspectionType(IT3).describe());
        System.out.println("[지식] " + catalog.inspectionType(IT4).describe());

        catalog.register(new EquipmentType(FS, "소방설비"));
        catalog.inspectionType(IT4).allow(FS);
        System.out.println("[지식] 설비 종류 ET-FS 소방설비 · 점검 종류 IT-4 의 허용 설비 종류에 ET-FS 를 더함 -> "
                + InspectionType.labels(catalog.inspectionType(IT4).allowedTypes()));
        log.add(new Equipment(FS01, "소방설비", FS));
        System.out.println("[운영] 설비 FS-01 소방설비 (ET-FS)");

        System.out.println(log.record(catalog, new InspectionId("INS-3"), EV01, IT3,
                "2026-04-02", new Reading(7, "s")).line());
        System.out.println(log.record(catalog, new InspectionId("INS-4"), BL01, IT4,
                "2026-04-02", new Reading(1, "개")).line());
        System.out.println(log.record(catalog, new InspectionId("INS-5"), FS01, IT4,
                "2026-04-02", new Reading(0, "개")).line());

        NormalRange before = catalog.inspectionType(IT1).range();
        catalog.inspectionType(IT1).narrowTo(new NormalRange(0, 40));
        System.out.println("[지식] 점검 종류 IT-1 의 정상 범위를 " + before + " 에서"
                + " " + catalog.inspectionType(IT1).range() + " 으로 좁힘");
        System.out.println("INS-1 판정 그대로: " + first.verdict());
        System.out.println(log.record(catalog, new InspectionId("INS-6"), EV01, IT1,
                "2026-04-03", new Reading(48, "mm")).line());

        System.out.println("점검 " + log.inspectionCount() + "건 · 점검 종류 "
                + catalog.inspectionTypeCount() + "개 · 설비 종류 "
                + catalog.equipmentTypeCount() + "개 · 설비 " + log.equipmentCount() + "대");
    }
}
