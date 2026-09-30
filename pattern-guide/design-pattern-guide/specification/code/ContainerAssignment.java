import java.util.ArrayList;
import java.util.List;

public final class ContainerAssignment {

    // ── 후보 객체 ────────────────────────────────────────────────────────────
    record Container(String id, int lowestTempC, boolean foodSafe, int humidityPercent, boolean sealed) {
    }

    // ── 명세 공통 타입 ───────────────────────────────────────────────────────
    interface ContainerSpec {
        boolean isSatisfiedBy(Container candidate);
    }

    // ── 잎 명세 ──────────────────────────────────────────────────────────────
    record TempAtMost(int limitC) implements ContainerSpec {
        @Override
        public boolean isSatisfiedBy(Container candidate) {
            return candidate.lowestTempC() <= limitC;
        }
    }

    record HumidityAtMost(int limitPercent) implements ContainerSpec {
        @Override
        public boolean isSatisfiedBy(Container candidate) {
            return candidate.humidityPercent() <= limitPercent;
        }
    }

    record FoodSafe() implements ContainerSpec {
        @Override
        public boolean isSatisfiedBy(Container candidate) {
            return candidate.foodSafe();
        }
    }

    record Sealed() implements ContainerSpec {
        @Override
        public boolean isSatisfiedBy(Container candidate) {
            return candidate.sealed();
        }
    }

    // ── 조합 명세 ────────────────────────────────────────────────────────────
    record AndSpec(ContainerSpec left, ContainerSpec right) implements ContainerSpec {
        @Override
        public boolean isSatisfiedBy(Container candidate) {
            return left.isSatisfiedBy(candidate) && right.isSatisfiedBy(candidate);
        }
    }

    record OrSpec(ContainerSpec left, ContainerSpec right) implements ContainerSpec {
        @Override
        public boolean isSatisfiedBy(Container candidate) {
            return left.isSatisfiedBy(candidate) || right.isSatisfiedBy(candidate);
        }
    }

    record NotSpec(ContainerSpec inner) implements ContainerSpec {
        @Override
        public boolean isSatisfiedBy(Container candidate) {
            return !inner.isSatisfiedBy(candidate);
        }
    }

    static ContainerSpec and(ContainerSpec left, ContainerSpec right) {
        return new AndSpec(left, right);
    }

    static ContainerSpec or(ContainerSpec left, ContainerSpec right) {
        return new OrSpec(left, right);
    }

    static ContainerSpec not(ContainerSpec inner) {
        return new NotSpec(inner);
    }

    // ── 명세를 보유한 도메인 객체 ────────────────────────────────────────────
    record Cargo(String id, String goods, ContainerSpec storageSpec) {
        boolean fits(Container candidate) {
            return storageSpec.isSatisfiedBy(candidate);
        }
    }

    // ── 명세로 후보를 거르는 쪽 ──────────────────────────────────────────────
    record ContainerYard(List<Container> containers) {
        List<Container> matching(ContainerSpec spec) {
            List<Container> found = new ArrayList<>();
            for (Container candidate : containers) {
                if (spec.isSatisfiedBy(candidate)) {
                    found.add(candidate);
                }
            }
            return found;
        }
    }

    static String ids(List<Container> containers) {
        if (containers.isEmpty()) {
            return "none";
        }
        StringBuilder out = new StringBuilder();
        for (Container candidate : containers) {
            if (out.length() > 0) {
                out.append(", ");
            }
            out.append(candidate.id());
        }
        return out.toString();
    }

    // ── Client ───────────────────────────────────────────────────────────────
    public static void main(String[] args) {
        ContainerYard yard = new ContainerYard(List.of(
                new Container("REEFER-01", -18, true, 55, false),
                new Container("REEFER-02", -18, false, 60, false),
                new Container("DRYBOX-11", 4, true, 70, true),
                new Container("REEFER-03", -20, true, 72, false)));

        Cargo meat = new Cargo("CG-5521", "frozen meat",
                and(new TempAtMost(-4), new FoodSafe()));

        int line = 1;
        for (Container candidate : yard.containers()) {
            String verdict = meat.fits(candidate) ? "accepted" : "rejected";
            System.out.println(line++ + ") validate " + meat.id() + " -> " + candidate.id() + " : " + verdict);
        }
        System.out.println(line++ + ") select " + meat.id() + " : " + ids(yard.matching(meat.storageSpec())));

        Cargo meatV2 = new Cargo(meat.id(), meat.goods(),
                and(meat.storageSpec(), new HumidityAtMost(60)));
        System.out.println(line++ + ") select " + meatV2.id() + " with humidity rule : "
                + ids(yard.matching(meatV2.storageSpec())));

        Cargo flowers = new Cargo("CG-7702", "fresh flowers",
                and(new TempAtMost(8), not(new Sealed())));
        System.out.println(line++ + ") select " + flowers.id() + " : " + ids(yard.matching(flowers.storageSpec())));

        Cargo driedFood = new Cargo("CG-9033", "dried food",
                or(new HumidityAtMost(60), new Sealed()));
        System.out.println(line++ + ") select " + driedFood.id() + " : " + ids(yard.matching(driedFood.storageSpec())));
    }
}
