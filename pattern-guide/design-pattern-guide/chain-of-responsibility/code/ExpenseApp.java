import java.util.ArrayList;
import java.util.List;

final class ExpenseRequest {
    private final String id;
    private final long amount;
    private final boolean hasReceipt;
    private final List<String> trail = new ArrayList<>();

    ExpenseRequest(String id, long amount, boolean hasReceipt) {
        this.id = id;
        this.amount = amount;
        this.hasReceipt = hasReceipt;
    }

    String id() {
        return id;
    }

    long amount() {
        return amount;
    }

    boolean hasReceipt() {
        return hasReceipt;
    }

    void visited(String who) {
        trail.add(who);
    }

    String trail() {
        return String.join(">", trail);
    }
}

interface ApprovalHandler {
    String handle(ExpenseRequest request);
}

abstract class BaseHandler implements ApprovalHandler {
    private final ApprovalHandler next;

    BaseHandler(ApprovalHandler next) {
        this.next = next;
    }

    protected String passToNext(ExpenseRequest request) {
        if (next == null) {
            return "unhandled";
        }
        return next.handle(request);
    }
}

final class ReceiptCheck extends BaseHandler {
    ReceiptCheck(ApprovalHandler next) {
        super(next);
    }

    @Override
    public String handle(ExpenseRequest request) {
        request.visited("ReceiptCheck");
        if (!request.hasReceipt()) {
            return "rejected(no-receipt)";
        }
        return passToNext(request);
    }
}

final class LimitApprover extends BaseHandler {
    private final String title;
    private final long limit;

    LimitApprover(String title, long limit, ApprovalHandler next) {
        super(next);
        this.title = title;
        this.limit = limit;
    }

    @Override
    public String handle(ExpenseRequest request) {
        request.visited(title);
        if (request.amount() <= limit) {
            return title + " approved";
        }
        return passToNext(request);
    }
}

public final class ExpenseApp {
    static ApprovalHandler buildChain() {
        return new ReceiptCheck(
                new LimitApprover("TeamLead", 100_000,
                        new LimitApprover("DeptHead", 1_000_000,
                                new LimitApprover("Finance", 10_000_000, null))));
    }

    static void submit(ApprovalHandler head, ExpenseRequest request) {
        String verdict = head.handle(request);
        System.out.println(request.id() + " " + request.amount()
                + " seen=" + request.trail() + " -> " + verdict);
    }

    public static void main(String[] args) {
        ApprovalHandler head = buildChain();
        submit(head, new ExpenseRequest("R1", 80_000, true));
        submit(head, new ExpenseRequest("R2", 700_000, true));
        submit(head, new ExpenseRequest("R3", 5_000_000, true));
        submit(head, new ExpenseRequest("R4", 30_000_000, true));
        submit(head, new ExpenseRequest("R5", 80_000, false));
    }
}
