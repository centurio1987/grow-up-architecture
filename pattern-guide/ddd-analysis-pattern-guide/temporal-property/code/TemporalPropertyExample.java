import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** 인사·급여 — 사원의 일당과 소속을 시간 속성으로 두고, 사건 시각과 기록 시각 두 축으로 조회한다. */
public final class TemporalPropertyExample {

    /** 시점. 달력 날짜 타입을 쓰지 않고 세 언어가 같은 자체 값으로 둔다. */
    record TimePoint(long year, long month, long day) {
        /** 1970-01-01 을 0 으로 세는 일 번호. 크기 비교와 일수 계산이 전부 이 값 위에 선다. */
        long ordinal() {
            long y = year - (month <= 2 ? 1 : 0);
            long era = Math.floorDiv(y, 400);
            long yoe = y - era * 400;
            long doy = (153 * (month + (month > 2 ? -3 : 9)) + 2) / 5 + day - 1;
            return era * 146097 + yoe * 365 + yoe / 4 - yoe / 100 + doy - 719468;
        }

        @Override public String toString() { return String.format("%04d-%02d-%02d", year, month, day); }
    }

    /** 구간. 두 끝이 모두 포함이고, 위 끝이 없으면 「추후 통지까지」다. */
    record DateRange(TimePoint from, TimePoint to) {
        DateRange {
            if (to != null && from.ordinal() > to.ordinal()) {
                throw new IllegalArgumentException("유효 시작이 유효 끝보다 늦습니다: " + from + ".." + to);
            }
        }

        static DateRange openEnded(TimePoint from) { return new DateRange(from, null); }

        boolean includes(TimePoint t) {
            return from.ordinal() <= t.ordinal() && (to == null || t.ordinal() <= to.ordinal());
        }

        boolean overlaps(DateRange other) {
            return (to == null || other.from.ordinal() <= to.ordinal())
                    && (other.to == null || from.ordinal() <= other.to.ordinal());
        }

        long lengthInDays() {
            if (to == null) {
                throw new IllegalStateException("끝이 없는 구간은 일수를 셀 수 없습니다: " + this);
            }
            return to.ordinal() - from.ordinal() + 1;
        }

        @Override public String toString() { return from + ".." + (to == null ? "" : to.toString()); }
    }

    record Money(long won) {
        Money minus(Money other) { return new Money(won - other.won); }

        Money times(long count) { return new Money(won * count); }

        @Override public String toString() { return won + "원"; }
    }

    record EmployeeId(String value) {
        @Override public String toString() { return value; }
    }

    record DepartmentId(String value) {
        @Override public String toString() { return value; }
    }

    /** 유효 기간이 붙은 값 하나. recordedOn 은 우리가 그 값을 알게 된 날이다. */
    record Effectivity<V>(DateRange period, TimePoint recordedOn, V value) {
    }

    /** 시간 속성 — 값들의 이력을 쥐고, 시점을 받아 값 하나로 답한다. */
    record TemporalProperty<V>(String name, List<Effectivity<V>> history) {
        TemporalProperty {
            history = List.copyOf(history);
        }

        static <V> TemporalProperty<V> startingWith(String name, TimePoint from, TimePoint on, V value) {
            return new TemporalProperty<>(name, List.of(new Effectivity<>(DateRange.openEnded(from), on, value)));
        }

        TemporalProperty<V> asserting(DateRange period, TimePoint on, V value) {
            TimePoint latest = latestRecord();
            if (on.ordinal() < latest.ordinal()) {
                throw new IllegalArgumentException("기록일이 앞선 기록보다 이릅니다: " + on + " < " + latest);
            }
            for (Effectivity<V> e : history) {
                if (e.recordedOn().ordinal() == on.ordinal() && e.period().overlaps(period)) {
                    throw new IllegalArgumentException(
                            "같은 기록일에 유효 구간이 겹칩니다: " + e.period() + " 와 " + period);
                }
            }
            List<Effectivity<V>> next = new ArrayList<>(history);
            next.add(new Effectivity<>(period, on, value));
            return new TemporalProperty<>(name, next);
        }

        /** 기록 기준 asKnownOn 에서 본 when 의 값. 그 시점을 덮는 값 가운데 가장 늦게 안 것이 답이다. */
        V valueOn(TimePoint when, TimePoint asKnownOn) {
            Effectivity<V> best = null;
            for (Effectivity<V> e : history) {
                if (e.recordedOn().ordinal() > asKnownOn.ordinal() || !e.period().includes(when)) {
                    continue;
                }
                if (best == null || e.recordedOn().ordinal() > best.recordedOn().ordinal()) {
                    best = e;
                }
            }
            if (best == null) {
                throw new IllegalStateException(
                        "그 기록 시점에는 아는 값이 없습니다: " + when + " 의 " + name + " · 기록 기준 " + asKnownOn);
            }
            return best.value();
        }

        V valueOn(TimePoint when) { return valueOn(when, latestRecord()); }

        TimePoint latestRecord() {
            TimePoint latest = history.get(0).recordedOn();
            for (Effectivity<V> e : history) {
                if (e.recordedOn().ordinal() > latest.ordinal()) {
                    latest = e.recordedOn();
                }
            }
            return latest;
        }
    }

    /** aggregate root. 두 시간 속성을 품고 이력의 불변식을 진다. */
    static final class Employee {
        private final EmployeeId id;
        private final TimePoint hiredOn;
        private TemporalProperty<Money> payRate;
        private TemporalProperty<DepartmentId> assignment;

        Employee(EmployeeId id, TimePoint hiredOn, Money rate, DepartmentId department) {
            this.id = id;
            this.hiredOn = hiredOn;
            this.payRate = TemporalProperty.startingWith("일당", hiredOn, hiredOn, rate);
            this.assignment = TemporalProperty.startingWith("소속", hiredOn, hiredOn, department);
        }

        EmployeeId id() { return id; }

        TimePoint hiredOn() { return hiredOn; }

        void recordPayRate(DateRange period, TimePoint on, Money rate) {
            payRate = payRate.asserting(period, on, rate);
        }

        void recordAssignment(DateRange period, TimePoint on, DepartmentId department) {
            assignment = assignment.asserting(period, on, department);
        }

        Money payRateOn(TimePoint when) { return payRate.valueOn(when); }

        Money payRateOn(TimePoint when, TimePoint asKnownOn) { return payRate.valueOn(when, asKnownOn); }

        DepartmentId assignmentOn(TimePoint when) { return assignment.valueOn(when); }
    }

    /** aggregate 밖에서 부서 aggregate 를 id 로 찾아 오는 자리. */
    static final Map<String, String> DIRECTORY = Map.of("DEP-SALES", "영업부", "DEP-PLAN", "기획부");

    static String nameOf(DepartmentId id) { return DIRECTORY.getOrDefault(id.value(), "미등록"); }

    /** 이미 지급한 기준과 지금 아는 기준의 차이를 그 구간의 일수만큼 정산한다. */
    static Money retroDifference(Employee e, DateRange stretch, TimePoint paidOn, TimePoint knownOn) {
        Money paid = e.payRateOn(stretch.from(), paidOn);
        Money current = e.payRateOn(stretch.from(), knownOn);
        return current.minus(paid).times(stretch.lengthInDays());
    }

    static void attempt(Runnable action) {
        try {
            action.run();
        } catch (RuntimeException e) {
            System.out.println("거부 — " + e.getMessage());
        }
    }

    public static void main(String[] args) {
        TimePoint hire = new TimePoint(2026, 1, 1);
        Employee employee = new Employee(
                new EmployeeId("EMP-1042"), hire, new Money(200000), new DepartmentId("DEP-SALES"));
        DepartmentId first = employee.assignmentOn(hire);
        System.out.println("사원 " + employee.id() + " · 입사 " + employee.hiredOn()
                + " · 첫 일당 " + employee.payRateOn(hire)
                + " · 첫 소속 " + first + " " + nameOf(first));

        TimePoint raiseFrom = new TimePoint(2026, 2, 15);
        TimePoint noticedOn = new TimePoint(2026, 3, 15);
        employee.recordPayRate(DateRange.openEnded(raiseFrom), noticedOn, new Money(240000));
        System.out.println("[기록] " + noticedOn + " — " + raiseFrom + " 부터 일당 " + new Money(240000));

        TimePoint correctedOn = new TimePoint(2026, 4, 4);
        employee.recordPayRate(DateRange.openEnded(raiseFrom), correctedOn, new Money(260000));
        System.out.println("[기록] " + correctedOn + " — " + raiseFrom + " 부터 일당 " + new Money(260000));

        TimePoint moveFrom = new TimePoint(2026, 4, 1);
        TimePoint movedOn = new TimePoint(2026, 5, 2);
        employee.recordAssignment(DateRange.openEnded(moveFrom), movedOn, new DepartmentId("DEP-PLAN"));
        System.out.println("[기록] " + movedOn + " — " + moveFrom + " 부터 소속 DEP-PLAN");

        TimePoint january = new TimePoint(2026, 1, 20);
        TimePoint february = new TimePoint(2026, 2, 25);
        System.out.println("[한 축] " + january + " 의 일당 " + employee.payRateOn(january));
        System.out.println("[한 축] " + february + " 의 일당 " + employee.payRateOn(february));

        TimePoint payday = new TimePoint(2026, 2, 28);
        for (TimePoint asKnownOn : List.of(payday, noticedOn, correctedOn)) {
            System.out.println("[두 축] " + february + " 의 일당 · 기록 기준 " + asKnownOn
                    + " → " + employee.payRateOn(february, asKnownOn));
        }

        DateRange stretch = new DateRange(raiseFrom, payday);
        Money gap = employee.payRateOn(february, noticedOn).minus(employee.payRateOn(february, payday));
        System.out.println("2월 소급 차액 — " + stretch + " " + stretch.lengthInDays() + "일 × " + gap
                + " = " + retroDifference(employee, stretch, payday, noticedOn));

        for (TimePoint when : List.of(new TimePoint(2026, 3, 20), new TimePoint(2026, 4, 10))) {
            DepartmentId at = employee.assignmentOn(when);
            System.out.println("[한 축] " + when + " 의 소속 " + at + " " + nameOf(at));
        }

        attempt(() -> new DateRange(new TimePoint(2026, 3, 31), new TimePoint(2026, 2, 1)));
        attempt(() -> employee.recordPayRate(
                new DateRange(new TimePoint(2026, 2, 1), new TimePoint(2026, 3, 31)),
                correctedOn, new Money(210000)));
        attempt(() -> employee.recordAssignment(DateRange.openEnded(new TimePoint(2026, 3, 1)),
                new TimePoint(2026, 3, 1), new DepartmentId("DEP-SALES")));
        attempt(() -> employee.payRateOn(february, new TimePoint(2025, 12, 31)));
    }
}
