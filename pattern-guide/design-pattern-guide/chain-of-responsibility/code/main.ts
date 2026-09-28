class ExpenseRequest {
    private readonly trail: string[] = [];

    constructor(
        readonly id: string,
        readonly amount: number,
        readonly hasReceipt: boolean,
    ) {}

    visited(who: string): void {
        this.trail.push(who);
    }

    trailText(): string {
        return this.trail.join(">");
    }
}

interface ApprovalHandler {
    handle(request: ExpenseRequest): string;
}

abstract class BaseHandler implements ApprovalHandler {
    constructor(private readonly next: ApprovalHandler | null) {}

    abstract handle(request: ExpenseRequest): string;

    protected passToNext(request: ExpenseRequest): string {
        if (this.next === null) {
            return "unhandled";
        }
        return this.next.handle(request);
    }
}

class ReceiptCheck extends BaseHandler {
    constructor(next: ApprovalHandler | null) {
        super(next);
    }

    handle(request: ExpenseRequest): string {
        request.visited("ReceiptCheck");
        if (!request.hasReceipt) {
            return "rejected(no-receipt)";
        }
        return this.passToNext(request);
    }
}

class LimitApprover extends BaseHandler {
    constructor(
        private readonly title: string,
        private readonly limit: number,
        next: ApprovalHandler | null,
    ) {
        super(next);
    }

    handle(request: ExpenseRequest): string {
        request.visited(this.title);
        if (request.amount <= this.limit) {
            return `${this.title} approved`;
        }
        return this.passToNext(request);
    }
}

function buildChain(): ApprovalHandler {
    return new ReceiptCheck(
        new LimitApprover("TeamLead", 100_000,
            new LimitApprover("DeptHead", 1_000_000,
                new LimitApprover("Finance", 10_000_000, null))));
}

function submit(head: ApprovalHandler, request: ExpenseRequest): void {
    const verdict = head.handle(request);
    console.log(`${request.id} ${request.amount} seen=${request.trailText()} -> ${verdict}`);
}

const head = buildChain();
submit(head, new ExpenseRequest("R1", 80_000, true));
submit(head, new ExpenseRequest("R2", 700_000, true));
submit(head, new ExpenseRequest("R3", 5_000_000, true));
submit(head, new ExpenseRequest("R4", 30_000_000, true));
submit(head, new ExpenseRequest("R5", 80_000, false));
