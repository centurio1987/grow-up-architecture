import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** 점검 항목. 배점이 바뀔 수 있는 가변 객체라, 견본과 복제본이 같은 것을 가리키면 안 된다. */
final class CheckItem {
    private final String name;
    private int points;

    CheckItem(String name, int points) {
        this.name = name;
        this.points = points;
    }

    CheckItem copy() {
        return new CheckItem(name, points);
    }

    String name() {
        return name;
    }

    int points() {
        return points;
    }

    void setPoints(int points) {
        this.points = points;
    }
}

/** Prototype — 자기 자신을 복제하는 연산을 선언한다. */
interface Checklist {
    Checklist copy();

    void assignTo(String equipmentId, String date);

    void redefine(String label, List<CheckItem> items);

    void adjust(String itemName, int points);

    int totalPoints();

    String render();
}

/** 두 ConcretePrototype 이 함께 쓰는 상태와 깊은 복사 규칙. */
abstract class AbstractChecklist implements Checklist {
    protected String label;
    protected final List<CheckItem> items = new ArrayList<>();
    protected String equipmentId = "-";
    protected String date = "-";

    protected AbstractChecklist(String label, List<CheckItem> items) {
        this.label = label;
        replaceItems(items);
    }

    /** 복사 생성자. 하위 클래스의 copy() 가 이 자리를 지나며 항목까지 새로 만든다. */
    protected AbstractChecklist(AbstractChecklist source) {
        this.label = source.label;
        this.equipmentId = source.equipmentId;
        this.date = source.date;
        replaceItems(source.items);
    }

    private void replaceItems(List<CheckItem> source) {
        items.clear();
        for (CheckItem item : source) {
            items.add(item.copy());
        }
    }

    @Override
    public void assignTo(String equipmentId, String date) {
        this.equipmentId = equipmentId;
        this.date = date;
    }

    @Override
    public void redefine(String label, List<CheckItem> items) {
        this.label = label;
        replaceItems(items);
    }

    @Override
    public void adjust(String itemName, int points) {
        for (CheckItem item : items) {
            if (item.name().equals(itemName)) {
                item.setPoints(points);
            }
        }
    }

    protected int itemPoints() {
        int sum = 0;
        for (CheckItem item : items) {
            sum += item.points();
        }
        return sum;
    }

    protected String itemText() {
        List<String> parts = new ArrayList<>();
        for (CheckItem item : items) {
            parts.add(item.name() + " " + item.points());
        }
        return String.join(" · ", parts);
    }

    protected String head() {
        return equipmentId + " " + date;
    }
}

/** ConcretePrototype — 일상 점검표. 총점은 항목 배점의 합이다. */
final class RoutineChecklist extends AbstractChecklist {
    RoutineChecklist(String label, List<CheckItem> items) {
        super(label, items);
    }

    private RoutineChecklist(RoutineChecklist source) {
        super(source);
    }

    @Override
    public Checklist copy() {
        return new RoutineChecklist(this);
    }

    @Override
    public int totalPoints() {
        return itemPoints();
    }

    @Override
    public String render() {
        return head() + " [일상] " + label + " " + totalPoints() + "점 (" + itemText() + ")";
    }
}

/** ConcretePrototype — 법정 안전 점검표. 입회 확인 배점이 항상 더해진다. */
final class SafetyChecklist extends AbstractChecklist {
    private static final int WITNESS_POINTS = 20;

    SafetyChecklist(String label, List<CheckItem> items) {
        super(label, items);
    }

    private SafetyChecklist(SafetyChecklist source) {
        super(source);
    }

    @Override
    public Checklist copy() {
        return new SafetyChecklist(this);
    }

    @Override
    public int totalPoints() {
        return itemPoints() + WITNESS_POINTS;
    }

    @Override
    public String render() {
        return head() + " [법정] " + label + " " + totalPoints() + "점 (" + itemText()
                + ") + 입회 확인 " + WITNESS_POINTS;
    }
}

/** PrototypeManager — 키로 견본을 등록·조회하고, 요청이 오면 그 견본의 복제본을 낸다. */
final class ChecklistCatalog {
    private final Map<String, Checklist> prototypes = new LinkedHashMap<>();

    void register(String key, Checklist prototype) {
        prototypes.put(key, prototype);
    }

    void unregister(String key) {
        prototypes.remove(key);
    }

    Checklist create(String key) {
        Checklist prototype = prototypes.get(key);
        if (prototype == null) {
            throw new IllegalArgumentException("등록되지 않은 견본: " + key);
        }
        return prototype.copy();
    }

    List<String> keys() {
        return new ArrayList<>(prototypes.keySet());
    }
}

/** Client — 견본을 등록하고, 복제해 오늘 자 점검표로 초기화한다. */
public final class ChecklistApp {
    public static void main(String[] args) {
        ChecklistCatalog catalog = new ChecklistCatalog();
        catalog.register("pump-routine", new RoutineChecklist("펌프 일상 점검",
                List.of(new CheckItem("윤활유 상태", 30), new CheckItem("진동 측정", 40),
                        new CheckItem("누유 확인", 30))));
        catalog.register("pump-safety", new SafetyChecklist("펌프 법정 안전 점검",
                List.of(new CheckItem("압력 밸브", 40), new CheckItem("접지 저항", 30))));

        Checklist today = catalog.create("pump-routine");
        today.assignTo("P-12", "2026-03-11");
        System.out.println("오늘 점검표 : " + today.render());

        Checklist safety = catalog.create("pump-safety");
        safety.assignTo("P-12", "2026-03-11");
        System.out.println("오늘 점검표 : " + safety.render());

        today.adjust("진동 측정", 50);
        System.out.println("복제본 조정 : " + today.render());
        System.out.println("견본 재복제 : " + catalog.create("pump-routine").render());

        Checklist compressor = catalog.create("pump-routine");
        compressor.redefine("압축기 일상 점검",
                List.of(new CheckItem("필터 차압", 50), new CheckItem("토출 온도", 30)));
        catalog.register("compressor-routine", compressor);
        System.out.println("새 견본 등록 : compressor-routine (" + String.join(", ", catalog.keys()) + ")");

        Checklist todayCompressor = catalog.create("compressor-routine");
        todayCompressor.assignTo("C-07", "2026-03-11");
        System.out.println("오늘 점검표 : " + todayCompressor.render());
        System.out.println("견본 재복제 : " + catalog.create("pump-routine").render());

        catalog.unregister("pump-safety");
        System.out.println("견본 해제 : pump-safety (" + String.join(", ", catalog.keys()) + ")");
    }
}
