import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Target — 주문 데스크가 재고에 묻는 연산 모양. */
interface StockSource {
    long available(String sku);

    long totalAvailable(List<String> skus);
}

/** Adaptee — 이미 있는 창고 시스템. 우리 타입을 모르고 한 줄 문자열로 답한다. */
final class LegacyWarehouseApi {
    private final Map<String, int[]> rows = new LinkedHashMap<>();

    LegacyWarehouseApi() {
        rows.put("BOOK_042", new int[] {37, 5});
        rows.put("PEN_007", new int[] {12, 4});
    }

    String query(String itemCode) {
        int[] row = rows.get(itemCode);
        if (row == null) {
            return "NOT_FOUND";
        }
        return itemCode + "|ON_HAND=" + row[0] + "|RESERVED=" + row[1];
    }
}

/** Adapter — 창고 시스템의 한 줄 문자열을 StockSource 계약으로 옮긴다. */
final class LegacyWarehouseStock implements StockSource {
    private final LegacyWarehouseApi api;

    LegacyWarehouseStock(LegacyWarehouseApi api) {
        this.api = api;
    }

    @Override
    public long available(String sku) {
        String line = api.query(toItemCode(sku));
        if (line.equals("NOT_FOUND")) {
            return 0;
        }
        return field(line, "ON_HAND") - field(line, "RESERVED");
    }

    @Override
    public long totalAvailable(List<String> skus) {
        long sum = 0;
        for (String sku : skus) {
            sum += available(sku);
        }
        return sum;
    }

    private static String toItemCode(String sku) {
        return sku.replace('-', '_');
    }

    private static long field(String line, String name) {
        for (String part : line.split("\\|")) {
            if (part.startsWith(name + "=")) {
                return Long.parseLong(part.substring(name.length() + 1));
            }
        }
        return 0;
    }
}

/** Adaptee 2 — 다른 창고사. 가용 수량을 이미 빼서 주고 sku 를 그대로 쓴다. */
final class PartnerWarehouseApi {
    private final Map<String, Integer> free = new LinkedHashMap<>();

    PartnerWarehouseApi() {
        free.put("BOOK-042", 12);
    }

    String lookup(String code) {
        Integer n = free.get(code);
        return "sku=" + code + ";free=" + (n == null ? 0 : n);
    }
}

/** Adapter 2 — 같은 StockSource 계약, 다른 Adaptee. */
final class PartnerWarehouseStock implements StockSource {
    private final PartnerWarehouseApi api;

    PartnerWarehouseStock(PartnerWarehouseApi api) {
        this.api = api;
    }

    @Override
    public long available(String sku) {
        for (String part : api.lookup(sku).split(";")) {
            if (part.startsWith("free=")) {
                return Long.parseLong(part.substring("free=".length()));
            }
        }
        return 0;
    }

    @Override
    public long totalAvailable(List<String> skus) {
        long sum = 0;
        for (String sku : skus) {
            sum += available(sku);
        }
        return sum;
    }
}

/** Decorator — 인터페이스는 그대로 두고 호출 횟수만 덧붙인다. Adapter 위에 겹쳐 쓴다. */
final class CountingStock implements StockSource {
    private final StockSource inner;
    private int calls;

    CountingStock(StockSource inner) {
        this.inner = inner;
    }

    @Override
    public long available(String sku) {
        calls++;
        return inner.available(sku);
    }

    @Override
    public long totalAvailable(List<String> skus) {
        calls++;
        return inner.totalAvailable(skus);
    }

    int calls() {
        return calls;
    }
}

/** Client — StockSource 만 알고 창고 시스템의 타입은 모른다. */
final class OrderDesk {
    private final StockSource stock;

    OrderDesk(StockSource stock) {
        this.stock = stock;
    }

    String decide(String sku, long qty) {
        long have = stock.available(sku);
        return have >= qty ? "accepted" : "rejected (short by " + (qty - have) + ")";
    }
}

public final class WarehouseDeskApp {
    public static void main(String[] args) {
        LegacyWarehouseApi legacyApi = new LegacyWarehouseApi();
        StockSource legacy = new LegacyWarehouseStock(legacyApi);
        OrderDesk desk = new OrderDesk(legacy);
        List<String> basket = List.of("BOOK-042", "PEN-007");

        System.out.println("1) legacy BOOK-042: " + legacyApi.query("BOOK_042")
                + " -> available " + legacy.available("BOOK-042"));
        System.out.println("2) order BOOK-042 x 30 -> " + desk.decide("BOOK-042", 30));
        System.out.println("3) order BOOK-042 x 40 -> " + desk.decide("BOOK-042", 40));
        System.out.println("4) legacy total [BOOK-042, PEN-007] = "
                + legacy.available("BOOK-042") + " + " + legacy.available("PEN-007")
                + " = " + legacy.totalAvailable(basket));

        StockSource partner = new PartnerWarehouseStock(new PartnerWarehouseApi());
        System.out.println("5) partner BOOK-042 -> available " + partner.available("BOOK-042"));

        CountingStock counted = new CountingStock(new LegacyWarehouseStock(legacyApi));
        System.out.println("6) counting over legacy: available " + counted.available("BOOK-042")
                + ", total " + counted.totalAvailable(basket) + ", calls " + counted.calls());

        System.out.println("7) unknown CHAIR-900 -> available " + legacy.available("CHAIR-900"));

        String raw = legacyApi.query("BOOK_042");
        String onHand = raw.split("\\|")[1].substring("ON_HAND=".length());
        System.out.println("8) adaptee read without adapter: " + onHand + " (RESERVED 5 not subtracted)");
    }
}
