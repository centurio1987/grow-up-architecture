struct ExpenseRequest {
    id: &'static str,
    amount: u64,
    has_receipt: bool,
    trail: Vec<&'static str>,
}

impl ExpenseRequest {
    fn new(id: &'static str, amount: u64, has_receipt: bool) -> ExpenseRequest {
        ExpenseRequest {
            id,
            amount,
            has_receipt,
            trail: Vec::new(),
        }
    }

    fn visited(&mut self, who: &'static str) {
        self.trail.push(who);
    }

    fn trail_text(&self) -> String {
        self.trail.join(">")
    }
}

trait ApprovalHandler {
    fn handle(&self, request: &mut ExpenseRequest) -> String;
}

fn pass_to_next(next: &Option<Box<dyn ApprovalHandler>>, request: &mut ExpenseRequest) -> String {
    match next {
        Some(handler) => handler.handle(request),
        None => String::from("unhandled"),
    }
}

struct ReceiptCheck {
    next: Option<Box<dyn ApprovalHandler>>,
}

impl ApprovalHandler for ReceiptCheck {
    fn handle(&self, request: &mut ExpenseRequest) -> String {
        request.visited("ReceiptCheck");
        if !request.has_receipt {
            return String::from("rejected(no-receipt)");
        }
        pass_to_next(&self.next, request)
    }
}

struct LimitApprover {
    title: &'static str,
    limit: u64,
    next: Option<Box<dyn ApprovalHandler>>,
}

impl ApprovalHandler for LimitApprover {
    fn handle(&self, request: &mut ExpenseRequest) -> String {
        request.visited(self.title);
        if request.amount <= self.limit {
            return format!("{} approved", self.title);
        }
        pass_to_next(&self.next, request)
    }
}

fn build_chain() -> Box<dyn ApprovalHandler> {
    Box::new(ReceiptCheck {
        next: Some(Box::new(LimitApprover {
            title: "TeamLead",
            limit: 100_000,
            next: Some(Box::new(LimitApprover {
                title: "DeptHead",
                limit: 1_000_000,
                next: Some(Box::new(LimitApprover {
                    title: "Finance",
                    limit: 10_000_000,
                    next: None,
                })),
            })),
        })),
    })
}

fn submit(head: &dyn ApprovalHandler, request: &mut ExpenseRequest) {
    let verdict = head.handle(request);
    println!(
        "{} {} seen={} -> {}",
        request.id,
        request.amount,
        request.trail_text(),
        verdict
    );
}

fn main() {
    let head = build_chain();
    submit(head.as_ref(), &mut ExpenseRequest::new("R1", 80_000, true));
    submit(head.as_ref(), &mut ExpenseRequest::new("R2", 700_000, true));
    submit(head.as_ref(), &mut ExpenseRequest::new("R3", 5_000_000, true));
    submit(head.as_ref(), &mut ExpenseRequest::new("R4", 30_000_000, true));
    submit(head.as_ref(), &mut ExpenseRequest::new("R5", 80_000, false));
}
