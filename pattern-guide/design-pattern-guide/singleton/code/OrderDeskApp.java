final class ShopConfig {
    private static String branchCode = "";

    private ShopConfig() {
    }

    static void setBranchCode(String code) {
        branchCode = code;
    }

    static String branchCode() {
        return branchCode;
    }
}

final class OrderNumberIssuer {
    private static OrderNumberIssuer uniqueInstance;

    private final String prefix;
    private long issued;

    private OrderNumberIssuer() {
        this.prefix = ShopConfig.branchCode();
        this.issued = 0;
    }

    static synchronized OrderNumberIssuer instance() {
        if (uniqueInstance == null) {
            uniqueInstance = new OrderNumberIssuer();
        }
        return uniqueInstance;
    }

    synchronized String next() {
        this.issued += 1;
        return String.format("%s-%04d", this.prefix, this.issued);
    }

    synchronized long issuedCount() {
        return this.issued;
    }
}

final class OrderDesk {
    final OrderNumberIssuer issuer;

    private final String channel;

    OrderDesk(String channel) {
        this.channel = channel;
        this.issuer = OrderNumberIssuer.instance();
    }

    String accept() {
        return this.channel + " " + this.issuer.next();
    }
}

public final class OrderDeskApp {
    private OrderDeskApp() {
    }

    public static void main(String[] args) {
        ShopConfig.setBranchCode("B");
        System.out.println("branch=" + ShopConfig.branchCode());

        OrderDesk web = new OrderDesk("web");
        OrderDesk phone = new OrderDesk("phone");
        OrderDesk mobile = new OrderDesk("mobile");

        System.out.println("same-instance=" + (web.issuer == phone.issuer));
        System.out.println(web.accept());
        System.out.println(phone.accept());
        System.out.println(mobile.accept());
        System.out.println("issued=" + OrderNumberIssuer.instance().issuedCount());
    }
}
