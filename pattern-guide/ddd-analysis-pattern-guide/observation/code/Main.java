import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** 값 — 수치와 단위를 한 값으로 묶는다. 환산과 산술은 Quantity 패턴의 몫이다. */
record Quantity(long amount, String unit) {
    @Override public String toString() { return amount + " " + unit; }
}

/** 값 — ISO yyyy-mm-dd 하루. 이 표기는 문자열 순서가 날짜 순서와 같다. */
record TimePoint(String iso) implements Comparable<TimePoint> {
    @Override public int compareTo(TimePoint other) { return iso.compareTo(other.iso); }
    @Override public String toString() { return iso; }
}

record SubjectId(String value) {}
record PhenomenonTypeId(String value) {}
record PhenomenonId(String value) {}
record ObservationId(String value) {}

/** 값 — 거부 표시. 값을 지우는 대신 이것이 붙는다. */
record Rejection(String reason, TimePoint rejectedOn) {}

/** 값 — 관측의 값 자리. 크기가 오면 수치 관측이고 범주가 오면 범주형 관측이다. */
sealed interface ObservedValue permits Magnitude, Category {}
record Magnitude(Quantity quantity) implements ObservedValue {}
record Category(PhenomenonId phenomenonId) implements ObservedValue {}

/** entity — 항목이 든 통제된 범주 값 하나. 항목 aggregate 안에 산다. */
record Phenomenon(PhenomenonId id, String label) {}

/** 값 — 항목이 정하는 값의 종류. 크기 항목은 허용 단위를, 범주 항목은 범주 목록을 든다. */
sealed interface ItemKind permits MagnitudeItem, CategoryItem {}
record MagnitudeItem(String allowedUnit) implements ItemKind {}
record CategoryItem(List<Phenomenon> phenomena) implements ItemKind {}

/** 지식 층위 aggregate root — 무엇에 대한 사실인가. 새 항목은 인스턴스 하나이지 타입 하나가 아니다. */
final class PhenomenonType {
    private final PhenomenonTypeId id;
    private final String name;
    private final ItemKind kind;

    static PhenomenonType magnitude(String id, String name, String allowedUnit) {
        if (allowedUnit.isBlank()) throw new IllegalArgumentException("크기 항목은 허용 단위를 하나 가집니다");
        return new PhenomenonType(id, name, new MagnitudeItem(allowedUnit));
    }

    static PhenomenonType category(String id, String name, String... labels) {
        if (labels.length == 0) throw new IllegalArgumentException("범주 항목은 범주를 하나 이상 가집니다");
        List<Phenomenon> ps = new ArrayList<>();
        for (String label : labels) ps.add(new Phenomenon(new PhenomenonId("ph-" + label), label));
        return new PhenomenonType(id, name, new CategoryItem(List.copyOf(ps)));
    }

    private PhenomenonType(String id, String name, ItemKind kind) {
        if (name.isBlank()) throw new IllegalArgumentException("항목은 이름을 가집니다");
        this.id = new PhenomenonTypeId(id);
        this.name = name; this.kind = kind;
    }

    PhenomenonTypeId id() { return id; }
    String name() { return name; }

    /** 값이 이 항목이 정한 종류·단위·범주에 맞는가. 어긋나면 왜 어긋나는지를 돌려준다. */
    Optional<String> check(ObservedValue value) {
        if (kind instanceof MagnitudeItem m) {
            if (value instanceof Magnitude q) {
                return m.allowedUnit().equals(q.quantity().unit()) ? Optional.empty()
                        : Optional.of("항목 " + name + " 의 허용 단위는 " + m.allowedUnit()
                                + " 인데 값의 단위는 " + q.quantity().unit() + " 입니다");
            }
            return Optional.of("크기 항목 " + name + " 에 범주 값을 넣었습니다");
        }
        if (!(value instanceof Category cat)) return Optional.of("범주 항목 " + name + " 에 크기 값을 넣었습니다");
        return labelOf(cat.phenomenonId()).isPresent() ? Optional.empty()
                : Optional.of("범주 " + cat.phenomenonId().value() + " 는 항목 " + name + " 의 범주가 아닙니다");
    }

    Optional<String> labelOf(PhenomenonId pid) {
        if (!(kind instanceof CategoryItem c)) return Optional.empty();
        return c.phenomena().stream().filter(p -> p.id().equals(pid)).map(Phenomenon::label).findFirst();
    }

    String describe() {
        if (kind instanceof MagnitudeItem m) return "항목 " + name + " — 크기 항목 · 허용 단위 " + m.allowedUnit();
        List<String> labels = ((CategoryItem) kind).phenomena().stream().map(Phenomenon::label).toList();
        return "항목 " + name + " — 범주 항목 · 범주 " + String.join(" · ", labels);
    }
}

/** 운영 층위 aggregate root — 대상에 대한 사실 한 건. 값의 종류를 모르는 층이 여기다. */
final class Observation {
    private final ObservationId id;
    private final SubjectId subjectId;
    private final PhenomenonTypeId typeId;
    private final ObservedValue value;
    private final TimePoint takenOn;
    private final TimePoint recordedOn;
    private Rejection rejection;

    Observation(ObservationId id, SubjectId subjectId, PhenomenonTypeId typeId, ObservedValue value,
                TimePoint takenOn, TimePoint recordedOn) {
        if (id == null || subjectId == null || typeId == null || value == null) {
            throw new IllegalArgumentException("관측은 대상 하나 · 항목 하나 · 값 하나를 모두 가집니다");
        }
        if (takenOn.compareTo(recordedOn) > 0) {
            throw new IllegalArgumentException("잰 날 " + takenOn + " 는 적은 날 " + recordedOn + " 보다 뒤입니다");
        }
        this.id = id; this.subjectId = subjectId; this.typeId = typeId;
        this.value = value; this.takenOn = takenOn; this.recordedOn = recordedOn;
    }

    ObservationId id() { return id; }
    SubjectId subjectId() { return subjectId; }
    PhenomenonTypeId typeId() { return typeId; }
    ObservedValue value() { return value; }
    TimePoint takenOn() { return takenOn; }
    TimePoint recordedOn() { return recordedOn; }
    Optional<Rejection> rejection() { return Optional.ofNullable(rejection); }

    /** 거부는 표시를 더하는 일이다 — 값 자리도 두 시각도 건드리지 않는다. */
    void reject(String reason, TimePoint on) {
        if (rejection != null) throw new IllegalStateException(id.value() + " 는 이미 거부된 관측입니다");
        if (reason.isBlank() || on.compareTo(recordedOn) < 0) {
            throw new IllegalArgumentException("거부는 사유를 달고, 적은 날보다 앞선 날짜로는 남기지 않습니다");
        }
        this.rejection = new Rejection(reason, on);
    }

    /** asOf 시점에 이 사실이 유효한 것으로 읽혔는가 — 적은 날이 지났고, 아직 거부되지 않았는가. */
    boolean validAsOf(TimePoint asOf) {
        if (recordedOn.compareTo(asOf) > 0) return false;
        return rejection == null || rejection.rejectedOn().compareTo(asOf) > 0;
    }
}

/** aggregate 가 아니다 — 두 aggregate 를 id 로 찾아 조립하고 조회에 답하는 자리. */
final class ObservationDesk {
    private final List<PhenomenonType> types = new ArrayList<>();
    private final List<Observation> book = new ArrayList<>();

    PhenomenonType register(PhenomenonType type) { types.add(type); return type; }

    private PhenomenonType type(PhenomenonTypeId id) {
        return types.stream().filter(t -> t.id().equals(id)).findFirst()
                .orElseThrow(() -> new IllegalArgumentException("없는 항목입니다: " + id.value()));
    }

    Observation find(ObservationId id) {
        return book.stream().filter(o -> o.id().equals(id)).findFirst()
                .orElseThrow(() -> new IllegalArgumentException("없는 관측입니다: " + id.value()));
    }

    ObservationId record(String obsId, SubjectId subject, PhenomenonTypeId typeId, ObservedValue value,
                         TimePoint takenOn, TimePoint recordedOn) {
        Optional<String> bad = type(typeId).check(value);
        if (bad.isPresent()) throw new IllegalArgumentException(bad.get());
        Observation o = new Observation(new ObservationId(obsId), subject, typeId, value, takenOn, recordedOn);
        book.add(o);
        return o.id();
    }

    void reject(ObservationId id, String reason, TimePoint on) { find(id).reject(reason, on); }

    /** 그 날 기준으로 알던 사실 — 적은 날이 지났고 아직 거부되지 않은 것 중 가장 나중에 잰 것. */
    Optional<Observation> knownOn(TimePoint asOf, SubjectId subject, PhenomenonTypeId typeId) {
        Observation best = null;
        for (Observation o : book) {
            if (!o.subjectId().equals(subject) || !o.typeId().equals(typeId) || !o.validAsOf(asOf)) continue;
            if (best == null || o.takenOn().compareTo(best.takenOn()) >= 0) best = o;
        }
        return Optional.ofNullable(best);
    }

    String knownLabel(TimePoint asOf, SubjectId subject, PhenomenonTypeId typeId) {
        return knownOn(asOf, subject, typeId).map(o -> show(o.value())).orElse("없음");
    }

    /** 대상에 대해 그 날 알던 사실 전부 — 값의 종류로 갈라 묻지 않는다. */
    String allKnownOn(TimePoint asOf, SubjectId subject) {
        List<String> out = new ArrayList<>();
        for (PhenomenonType t : types) knownOn(asOf, subject, t.id()).ifPresent(o -> out.add(t.name() + " " + show(o.value())));
        return asOf + " 에 알던 " + subject.value() + " 의 사실 " + out.size() + "건 — " + String.join(" · ", out);
    }

    String show(ObservedValue value) {
        if (value instanceof Magnitude m) return m.quantity().toString();
        PhenomenonId pid = ((Category) value).phenomenonId();
        return types.stream().flatMap(t -> t.labelOf(pid).stream()).findFirst().orElse(pid.value());
    }

    String describe(ObservationId id) {
        Observation o = find(id);
        return "관측 " + id.value() + " — " + o.subjectId().value() + " · " + type(o.typeId()).name()
                + " · " + show(o.value()) + " · 잰 날 " + o.takenOn() + " · 적은 날 " + o.recordedOn();
    }
}

public class Main {
    static TimePoint d(String iso) { return new TimePoint(iso); }

    static void attempt(Runnable r) {
        try { r.run(); } catch (RuntimeException e) { System.out.println("거부 — " + e.getMessage()); }
    }

    public static void main(String[] args) {
        ObservationDesk desk = new ObservationDesk();
        SubjectId p7 = new SubjectId("p-7");
        PhenomenonTypeId abo = new PhenomenonTypeId("pt-abo");
        PhenomenonTypeId sbp = new PhenomenonTypeId("pt-systolic");
        PhenomenonTypeId smk = new PhenomenonTypeId("pt-smoking");
        ObservationId o4 = new ObservationId("o-4");

        System.out.println(desk.register(PhenomenonType.category("pt-abo", "abo", "A", "B", "O", "AB")).describe());
        System.out.println(desk.register(PhenomenonType.magnitude("pt-systolic", "systolic", "mmHg")).describe());
        desk.record("o-1", p7, sbp, new Magnitude(new Quantity(118, "mmHg")), d("2026-09-01"), d("2026-09-01"));
        System.out.println(desk.describe(new ObservationId("o-1")));
        desk.record("o-2", p7, abo, new Category(new PhenomenonId("ph-A")), d("2026-09-01"), d("2026-09-01"));
        System.out.println(desk.describe(new ObservationId("o-2")));
        System.out.println(desk.allKnownOn(d("2026-09-01"), p7));

        System.out.println(desk.register(PhenomenonType.category("pt-smoking", "smoking", "smoker", "non-smoker"))
                .describe() + " (고친 타입 없음)");
        desk.record("o-3", p7, smk, new Category(new PhenomenonId("ph-non-smoker")), d("2026-09-01"), d("2026-09-03"));
        System.out.println(desk.describe(new ObservationId("o-3")));
        System.out.println("2026-09-02 에 알던 p-7 의 smoking — " + desk.knownLabel(d("2026-09-02"), p7, smk));
        System.out.println("2026-09-04 에 알던 p-7 의 smoking — " + desk.knownLabel(d("2026-09-04"), p7, smk));

        desk.record("o-4", p7, abo, new Category(new PhenomenonId("ph-B")), d("2026-09-03"), d("2026-09-03"));
        System.out.println(desk.describe(o4));
        desk.reject(o4, "오기", d("2026-09-04"));
        Rejection r = desk.find(o4).rejection().orElseThrow();
        System.out.println("o-4 거부 — 사유 " + r.reason() + " · 거부한 날 " + r.rejectedOn());
        System.out.println("o-4 의 값은 그대로 " + desk.show(desk.find(o4).value()));
        desk.record("o-5", p7, abo, new Category(new PhenomenonId("ph-A")), d("2026-09-03"), d("2026-09-04"));
        System.out.println(desk.describe(new ObservationId("o-5")));
        System.out.println("2026-09-03 에 알던 p-7 의 abo — " + desk.knownLabel(d("2026-09-03"), p7, abo));
        System.out.println("2026-09-30 에 알던 p-7 의 abo — " + desk.knownLabel(d("2026-09-30"), p7, abo));
        System.out.println(desk.allKnownOn(d("2026-09-30"), p7));

        attempt(() -> desk.record("x-1", p7, abo, new Magnitude(new Quantity(1, "code")), d("2026-09-05"), d("2026-09-05")));
        attempt(() -> desk.record("x-2", p7, abo, new Category(new PhenomenonId("ph-smoker")), d("2026-09-05"), d("2026-09-05")));
        attempt(() -> desk.record("x-3", p7, sbp, new Category(new PhenomenonId("ph-A")), d("2026-09-05"), d("2026-09-05")));
        attempt(() -> desk.record("x-4", p7, sbp, new Magnitude(new Quantity(72, "bpm")), d("2026-09-05"), d("2026-09-05")));
        attempt(() -> desk.reject(o4, "중복", d("2026-09-05")));
        attempt(() -> desk.record("x-5", p7, sbp, new Magnitude(new Quantity(120, "mmHg")), d("2026-09-05"), d("2026-09-04")));
    }
}
