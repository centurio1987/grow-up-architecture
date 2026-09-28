import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

final class SpecCensus {
    static int created;

    private SpecCensus() {
    }
}

interface ItemSpec {
    int weightGrams(int quantity);

    String describe(String location, int quantity);
}

final class SharedItemSpec implements ItemSpec {
    private final String code;
    private final int unitGrams;

    SharedItemSpec(String code, int unitGrams) {
        this.code = code;
        this.unitGrams = unitGrams;
        SpecCensus.created += 1;
    }

    @Override
    public int weightGrams(int quantity) {
        return unitGrams * quantity;
    }

    @Override
    public String describe(String location, int quantity) {
        return location + " " + code + " x" + quantity + " " + weightGrams(quantity) + "g";
    }
}

final class MixedPallet implements ItemSpec {
    private final List<ItemSpec> parts = new ArrayList<>();

    void add(ItemSpec part) {
        parts.add(part);
    }

    @Override
    public int weightGrams(int quantity) {
        int onePallet = 0;
        for (ItemSpec part : parts) {
            onePallet += part.weightGrams(1);
        }
        return onePallet * quantity;
    }

    @Override
    public String describe(String location, int quantity) {
        return location + " MIXED x" + quantity + " " + weightGrams(quantity) + "g";
    }
}

final class ItemSpecPool {
    static final String[] CODES = {"SKU-101", "SKU-204", "SKU-330", "SKU-457"};
    static final int[] UNIT_GRAMS = {300, 850, 40, 120};

    private final Map<String, SharedItemSpec> pool = new HashMap<>();

    ItemSpec spec(String code) {
        SharedItemSpec found = pool.get(code);
        if (found == null) {
            found = new SharedItemSpec(code, unitGramsOf(code));
            pool.put(code, found);
        }
        return found;
    }

    static int unitGramsOf(String code) {
        for (int i = 0; i < CODES.length; i++) {
            if (CODES[i].equals(code)) {
                return UNIT_GRAMS[i];
            }
        }
        throw new IllegalArgumentException("unknown code: " + code);
    }

    static String codeAt(int index) {
        return CODES[index % CODES.length];
    }
}

final class Slot {
    private final String location;
    private final int quantity;
    private final ItemSpec spec;

    Slot(String location, int quantity, ItemSpec spec) {
        this.location = location;
        this.quantity = quantity;
        this.spec = spec;
    }

    ItemSpec spec() {
        return spec;
    }

    int weightGrams() {
        return spec.weightGrams(quantity);
    }

    String describe() {
        return spec.describe(location, quantity);
    }
}

public final class StockCountApp {
    public static void main(String[] args) {
        ItemSpecPool pool = new ItemSpecPool();
        Slot first = new Slot("A-01-1", 12, pool.spec("SKU-101"));
        Slot second = new Slot("A-01-2", 5, pool.spec("SKU-101"));
        Slot third = new Slot("B-03-4", 2, pool.spec("SKU-204"));
        System.out.println(first.describe());
        System.out.println(second.describe());
        System.out.println(third.describe());
        System.out.println("same-spec A-01-1,A-01-2 = " + (first.spec() == second.spec()));
        System.out.println("same-spec A-01-1,B-03-4 = " + (first.spec() == third.spec()));

        MixedPallet pallet = new MixedPallet();
        pallet.add(pool.spec("SKU-330"));
        pallet.add(pool.spec("SKU-457"));
        System.out.println(new Slot("C-09-2", 7, pallet).describe());

        System.out.println(countDirect(1200));
        System.out.println(countPooled(1200));
    }

    static String countDirect(int slots) {
        int before = SpecCensus.created;
        List<Slot> sheet = new ArrayList<>();
        for (int i = 0; i < slots; i++) {
            String code = ItemSpecPool.codeAt(i);
            ItemSpec own = new SharedItemSpec(code, ItemSpecPool.unitGramsOf(code));
            sheet.add(new Slot(locationAt(i), i % 9 + 1, own));
        }
        return "direct: slots=" + sheet.size() + " spec-objects=" + (SpecCensus.created - before)
                + " total=" + totalGrams(sheet) + "g";
    }

    static String countPooled(int slots) {
        int before = SpecCensus.created;
        ItemSpecPool pool = new ItemSpecPool();
        List<Slot> sheet = new ArrayList<>();
        for (int i = 0; i < slots; i++) {
            sheet.add(new Slot(locationAt(i), i % 9 + 1, pool.spec(ItemSpecPool.codeAt(i))));
        }
        return "pooled: slots=" + sheet.size() + " spec-objects=" + (SpecCensus.created - before)
                + " total=" + totalGrams(sheet) + "g";
    }

    static int totalGrams(List<Slot> sheet) {
        int sum = 0;
        for (Slot slot : sheet) {
            sum += slot.weightGrams();
        }
        return sum;
    }

    static String locationAt(int index) {
        return "D-" + (index / 24 + 1) + "-" + (index % 24 + 1);
    }
}
