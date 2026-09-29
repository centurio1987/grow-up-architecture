import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** 값 — 수치와 단위를 한 값으로 묶는다. 단위끼리의 환산과 산술은 Quantity 패턴의 몫이다. */
record Quantity(long amount, String unit) {
    @Override public String toString() { return amount + " " + unit; }
}

/** 값 — ISO yyyy-mm-dd 하루. 이 표기는 문자열 순서가 날짜 순서와 같다. */
record TimePoint(String iso) implements Comparable<TimePoint> {
    static TimePoint of(String iso) {
        if (iso == null || !iso.matches("\\d{4}-\\d{2}-\\d{2}")) {
            throw new IllegalArgumentException("날짜 꼴이 아닙니다: " + iso);
        }
        return new TimePoint(iso);
    }

    @Override public int compareTo(TimePoint other) { return iso.compareTo(other.iso); }
    @Override public String toString() { return iso; }
}

record SubjectId(String value) {}
record PhenomenonTypeId(String value) {}
record MeasurementId(String value) {}

/** 값 — 거부 표시. 값을 지우는 대신 이것이 붙는다. */
record Rejection(String reason, TimePoint rejectedOn) {}

/** 지식 층위 aggregate root — 무엇을 재는가. 새 항목은 인스턴스 하나이지 타입 하나가 아니다. */
final class PhenomenonType {
    private final String name;
    private final String allowedUnit;

    static PhenomenonType of(String name, String allowedUnit) {
        if (name == null || name.isBlank() || allowedUnit == null || allowedUnit.isBlank()) {
            throw new IllegalArgumentException("항목은 이름과 허용 단위를 하나씩 가집니다");
        }
        return new PhenomenonType(name, allowedUnit);
    }

    private PhenomenonType(String name, String allowedUnit) {
        this.name = name;
        this.allowedUnit = allowedUnit;
    }

    String name() { return name; }
    String allowedUnit() { return allowedUnit; }
    boolean allows(Quantity q) { return allowedUnit.equals(q.unit()); }
}

/** 운영 층위 aggregate root — 대상 하나 · 항목 하나 · 값 하나를 묶은 기록 한 건. */
final class Measurement {
    private final MeasurementId id;
    private final SubjectId subjectId;
    private final PhenomenonTypeId typeId;
    private final Quantity quantity;
    private final TimePoint takenOn;
    private final TimePoint recordedOn;
    private Rejection rejection;

    Measurement(MeasurementId id, SubjectId subjectId, PhenomenonTypeId typeId, Quantity quantity,
                TimePoint takenOn, TimePoint recordedOn) {
        if (id == null || subjectId == null || typeId == null || quantity == null) {
            throw new IllegalArgumentException("기록은 대상 하나 · 항목 하나 · 값 하나를 모두 가집니다");
        }
        if (takenOn.compareTo(recordedOn) > 0) {
            throw new IllegalArgumentException("잰 날 " + takenOn + " 는 적은 날 " + recordedOn + " 보다 뒤입니다");
        }
        this.id = id;
        this.subjectId = subjectId;
        this.typeId = typeId;
        this.quantity = quantity;
        this.takenOn = takenOn;
        this.recordedOn = recordedOn;
    }

    MeasurementId id() { return id; }
    SubjectId subjectId() { return subjectId; }
    PhenomenonTypeId typeId() { return typeId; }
    Quantity quantity() { return quantity; }
    TimePoint takenOn() { return takenOn; }
    TimePoint recordedOn() { return recordedOn; }
    Optional<Rejection> rejection() { return Optional.ofNullable(rejection); }

    void reject(String reason, TimePoint on) {
        if (rejection != null) throw new IllegalStateException(id.value() + " 은 이미 거부된 기록입니다");
        if (on.compareTo(recordedOn) < 0 || reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("거부는 사유를 달고, 적은 날보다 앞선 날짜로는 남기지 않습니다");
        }
        this.rejection = new Rejection(reason, on);
    }

    /** asOf 시점에 이 기록이 유효한 것으로 읽혔는가 — 적은 날이 지났고, 아직 거부되지 않았는가. */
    boolean validAsOf(TimePoint asOf) {
        if (recordedOn.compareTo(asOf) > 0) return false;
        return rejection == null || rejection.rejectedOn().compareTo(asOf) > 0;
    }
}

/** aggregate 가 아니다 — 두 aggregate 를 id 로 찾아 조립하고 조회에 답하는 자리. */
final class MeasurementDesk {
    private final Map<String, PhenomenonType> types = new HashMap<>();
    private final List<Measurement> book = new ArrayList<>();

    void addType(PhenomenonTypeId id, PhenomenonType type) { types.put(id.value(), type); }

    int record(String id, SubjectId subjectId, PhenomenonTypeId typeId,
               Quantity quantity, String takenOn, String recordedOn) {
        PhenomenonType type = types.get(typeId.value());
        if (type == null) throw new IllegalArgumentException("등록되지 않은 항목입니다: " + typeId.value());
        if (!type.allows(quantity)) {
            throw new IllegalArgumentException("항목 " + type.name() + " 의 허용 단위는 " + type.allowedUnit()
                    + " 인데 값의 단위는 " + quantity.unit() + " 입니다");
        }
        book.add(new Measurement(new MeasurementId(id), subjectId, typeId, quantity,
                TimePoint.of(takenOn), TimePoint.of(recordedOn)));
        return book.size() - 1;
    }

    int indexOf(String id) {
        for (int i = 0; i < book.size(); i++) {
            if (book.get(i).id().value().equals(id)) return i;
        }
        throw new IllegalArgumentException("없는 기록입니다: " + id);
    }

    void reject(String id, String reason, String on) { book.get(indexOf(id)).reject(reason, TimePoint.of(on)); }

    Measurement at(int index) { return book.get(index); }

    String typeName(PhenomenonTypeId typeId) {
        PhenomenonType type = types.get(typeId.value());
        return type == null ? "" : type.name();
    }

    List<Measurement> rows(SubjectId subjectId, PhenomenonTypeId typeId) {
        return book.stream()
                .filter(m -> m.subjectId().equals(subjectId) && m.typeId().equals(typeId)).toList();
    }

    /** 그 날 기준으로 알고 있던 값 — 두 시각을 따로 두면 이 질문 하나로 과거와 현재를 함께 답한다. */
    Optional<Measurement> knownOn(String asOf, SubjectId subjectId, PhenomenonTypeId typeId) {
        TimePoint day = TimePoint.of(asOf);
        return rows(subjectId, typeId).stream().filter(m -> m.validAsOf(day))
                .reduce((best, m) -> best.takenOn().compareTo(m.takenOn()) > 0 ? best : m);
    }
}

public class Main {
    static void show(MeasurementDesk desk, int at) {
        Measurement m = desk.at(at);
        System.out.println("기록 " + m.id().value() + " — 환자 " + m.subjectId().value() + " · "
                + desk.typeName(m.typeId()) + " · " + m.quantity()
                + " · 잰 날 " + m.takenOn() + " · 적은 날 " + m.recordedOn());
    }

    static void attempt(Runnable action) {
        try {
            action.run();
        } catch (RuntimeException e) {
            System.out.println("거부 — " + e.getMessage());
        }
    }

    public static void main(String[] args) {
        MeasurementDesk desk = new MeasurementDesk();
        SubjectId patient = new SubjectId("p-7");
        PhenomenonTypeId systolic = new PhenomenonTypeId("pt-1");
        desk.addType(systolic, PhenomenonType.of("systolic", "mmHg"));
        System.out.println("항목 systolic — 허용 단위 mmHg");

        show(desk, desk.record("m-1", patient, systolic, new Quantity(118, "mmHg"), "2026-09-01", "2026-09-01"));
        attempt(() -> desk.record("m-x", patient, systolic, new Quantity(72, "bpm"), "2026-09-01", "2026-09-01"));

        PhenomenonTypeId pulse = new PhenomenonTypeId("pt-2");
        desk.addType(pulse, PhenomenonType.of("pulse", "bpm"));
        System.out.println("항목 추가 pulse — 허용 단위 bpm (고친 코드 없음)");
        show(desk, desk.record("m-2", patient, pulse, new Quantity(72, "bpm"), "2026-09-01", "2026-09-03"));
        for (String day : List.of("2026-09-02", "2026-09-04")) {
            Optional<Measurement> seen = desk.knownOn(day, patient, pulse);
            System.out.println(day + " 에 알던 p-7 의 pulse — "
                    + seen.map(m -> m.quantity().toString()).orElse("없음"));
        }

        show(desk, desk.record("m-3", patient, systolic, new Quantity(1200, "mmHg"), "2026-09-03", "2026-09-03"));
        desk.reject("m-3", "오기", "2026-09-04");
        Measurement wrong = desk.at(desk.indexOf("m-3"));
        Rejection mark = wrong.rejection().orElseThrow();
        System.out.println("m-3 거부 — 사유 " + mark.reason() + " · 거부한 날 " + mark.rejectedOn());
        System.out.println("m-3 의 값은 그대로 " + wrong.quantity());
        show(desk, desk.record("m-4", patient, systolic, new Quantity(120, "mmHg"), "2026-09-03", "2026-09-04"));

        List<Measurement> rows = desk.rows(patient, systolic);
        long rejected = rows.stream().filter(m -> m.rejection().isPresent()).count();
        Measurement latest = desk.knownOn("2026-09-30", patient, systolic).orElseThrow();
        System.out.println("2026-09-30 에 알던 p-7 의 systolic — " + latest.quantity()
                + " (잰 날 " + latest.takenOn() + ") · 전체 " + rows.size() + "건 중 거부 " + rejected + "건 제외");
        attempt(() -> desk.reject("m-3", "또 오기", "2026-09-05"));
        attempt(() -> desk.record("m-5", patient, systolic, new Quantity(119, "mmHg"), "2026-09-05", "2026-09-04"));
    }
}
