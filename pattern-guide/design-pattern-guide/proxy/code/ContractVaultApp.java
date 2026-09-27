import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

/** Subject — 계약서 한 건에 물을 수 있는 연산 모양. Client 는 이 타입으로만 계약서를 다룬다. */
interface Contract {
    String id();

    String title();

    int pageCount();

    String page(int n);

    String digest();
}

/** RealSubject — 스캔 원본. 만들어지는 순간 원본을 전부 읽으므로 만드는 일 자체에 품이 많이 든다. */
final class ScannedContract implements Contract {
    private final String id;
    private final String title;
    private final List<String> pages = new ArrayList<>();

    ScannedContract(String id, String title, int pageCount, String body, List<String> loadLog) {
        this.id = id;
        this.title = title;
        for (int n = 1; n <= pageCount; n++) {
            pages.add("[" + id + " p" + n + "] " + body);
        }
        loadLog.add(id);
    }

    @Override
    public String id() {
        return id;
    }

    @Override
    public String title() {
        return title;
    }

    @Override
    public int pageCount() {
        return pages.size();
    }

    @Override
    public String page(int n) {
        return pages.get(n - 1);
    }

    @Override
    public String digest() {
        String first = this.page(1);          // 자기 호출 — 바깥의 프록시를 거치지 않는다
        return first.substring(0, 26) + "...";
    }
}

/** Proxy(지연 생성) — 목록 메타데이터로 버티다가 본문이 필요할 때 RealSubject 를 만든다. */
final class LazyContract implements Contract {
    private final String id;
    private final String title;
    private final int pageCount;
    private final Supplier<Contract> factory;
    private Contract real;

    LazyContract(String id, String title, int pageCount, Supplier<Contract> factory) {
        this.id = id;
        this.title = title;
        this.pageCount = pageCount;
        this.factory = factory;
    }

    private Contract real() {
        if (real == null) {
            real = factory.get();
        }
        return real;
    }

    @Override
    public String id() {
        return id;
    }

    @Override
    public String title() {
        return title;
    }

    @Override
    public int pageCount() {
        return pageCount;
    }

    @Override
    public String page(int n) {
        return real().page(n);
    }

    @Override
    public String digest() {
        return real().digest();
    }
}

/** Proxy(권한 검사) — 열람 등급이 모자라면 본문 요청을 전달하지 않는다. */
final class GuardedContract implements Contract {
    private final Contract inner;
    private final int required;
    private final int clearance;

    GuardedContract(Contract inner, int required, int clearance) {
        this.inner = inner;
        this.required = required;
        this.clearance = clearance;
    }

    @Override
    public String id() {
        return inner.id();
    }

    @Override
    public String title() {
        return inner.title();
    }

    @Override
    public int pageCount() {
        return inner.pageCount();
    }

    @Override
    public String page(int n) {
        if (clearance < required) {
            return "[denied] " + inner.id() + " p" + n + " needs clearance " + required;
        }
        return inner.page(n);
    }

    @Override
    public String digest() {
        return inner.digest();
    }
}

/** Client — 선반에 꽂힌 것이 대리자인지 원본인지 모른 채 Subject 연산만 부른다. */
final class ContractDesk {
    private final List<Contract> shelf;

    ContractDesk(List<Contract> shelf) {
        this.shelf = shelf;
    }

    String listing() {
        List<String> parts = new ArrayList<>();
        for (Contract c : shelf) {
            parts.add(c.id() + " " + c.title() + " " + c.pageCount() + "p");
        }
        return String.join(" · ", parts);
    }

    private Contract find(String id) {
        for (Contract c : shelf) {
            if (c.id().equals(id)) {
                return c;
            }
        }
        throw new IllegalArgumentException("no such contract: " + id);
    }

    String open(String id, int n) {
        return find(id).page(n);
    }

    String digestOf(String id) {
        return find(id).digest();
    }
}

public final class ContractVaultApp {
    private static final String NDA_BODY = "비밀정보는 서면으로 표시한 것에 한정한다";
    private static final String MNA_BODY = "양수인은 잔금일에 지분 전부를 인수한다";

    private static List<Contract> shelfFor(int clearance, Map<String, Contract> vault) {
        return List.of(new GuardedContract(vault.get("NDA-2031"), 1, clearance),
                       new GuardedContract(vault.get("MNA-0079"), 3, clearance));
    }

    public static void main(String[] args) {
        List<String> loadLog = new ArrayList<>();
        Map<String, Contract> vault = new LinkedHashMap<>();
        vault.put("NDA-2031", new LazyContract("NDA-2031", "비밀유지계약", 4,
                () -> new ScannedContract("NDA-2031", "비밀유지계약", 4, NDA_BODY, loadLog)));
        vault.put("MNA-0079", new LazyContract("MNA-0079", "지분양수도계약", 12,
                () -> new ScannedContract("MNA-0079", "지분양수도계약", 12, MNA_BODY, loadLog)));

        ContractDesk legal = new ContractDesk(shelfFor(3, vault));
        ContractDesk intern = new ContractDesk(shelfFor(1, vault));

        System.out.println("1) shelf: " + legal.listing() + " | scans loaded " + loadLog.size());
        System.out.println("2) legal opens NDA-2031 p2: " + legal.open("NDA-2031", 2)
                + " | scans loaded " + loadLog.size());
        System.out.println("3) legal opens NDA-2031 p3: " + legal.open("NDA-2031", 3)
                + " | scans loaded " + loadLog.size());
        System.out.println("4) intern opens MNA-0079 p2: " + intern.open("MNA-0079", 2)
                + " | scans loaded " + loadLog.size());
        System.out.println("5) intern reads MNA-0079 digest: " + intern.digestOf("MNA-0079")
                + " | scans loaded " + loadLog.size());
        System.out.println("6) legal opens MNA-0079 p2: " + legal.open("MNA-0079", 2)
                + " | scans loaded " + loadLog.size());

        List<String> directLog = new ArrayList<>();
        ContractDesk noProxy = new ContractDesk(List.of(
                new ScannedContract("NDA-2031", "비밀유지계약", 4, NDA_BODY, directLog),
                new ScannedContract("MNA-0079", "지분양수도계약", 12, MNA_BODY, directLog)));
        System.out.println("7) no proxy, listing only: " + noProxy.listing()
                + " | scans loaded " + directLog.size());
    }
}
