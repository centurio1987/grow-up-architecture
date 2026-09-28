// 문법 (이 트리가 나타내는 언어)
//   rule ::= term | "not" rule | rule "and" rule | rule "or" rule
//   term ::= "level>=" n | "team=" word
trait Expression {
    fn interpret(&self, ctx: &mut Context) -> bool;

    fn render(&self) -> String;
}

struct Context {
    level: i32,
    team: String,
    checked: u32,
}

impl Context {
    fn new(level: i32, team: &str) -> Context {
        Context { level, team: team.to_string(), checked: 0 }
    }

    fn level(&self) -> i32 {
        self.level
    }

    fn team(&self) -> &str {
        &self.team
    }

    fn mark_checked(&mut self) {
        self.checked += 1;
    }

    fn checked(&self) -> u32 {
        self.checked
    }
}

struct TeamIs {
    name: String,
}

impl Expression for TeamIs {
    fn interpret(&self, ctx: &mut Context) -> bool {
        ctx.mark_checked();
        ctx.team() == self.name
    }

    fn render(&self) -> String {
        format!("team={}", self.name)
    }
}

struct LevelAtLeast {
    min: i32,
}

impl Expression for LevelAtLeast {
    fn interpret(&self, ctx: &mut Context) -> bool {
        ctx.mark_checked();
        ctx.level() >= self.min
    }

    fn render(&self) -> String {
        format!("level>={}", self.min)
    }
}

struct Not {
    inner: Box<dyn Expression>,
}

impl Expression for Not {
    fn interpret(&self, ctx: &mut Context) -> bool {
        !self.inner.interpret(ctx)
    }

    fn render(&self) -> String {
        format!("(not {})", self.inner.render())
    }
}

struct And {
    left: Box<dyn Expression>,
    right: Box<dyn Expression>,
}

impl Expression for And {
    fn interpret(&self, ctx: &mut Context) -> bool {
        self.left.interpret(ctx) && self.right.interpret(ctx)
    }

    fn render(&self) -> String {
        format!("({} and {})", self.left.render(), self.right.render())
    }
}

struct Or {
    left: Box<dyn Expression>,
    right: Box<dyn Expression>,
}

impl Expression for Or {
    fn interpret(&self, ctx: &mut Context) -> bool {
        self.left.interpret(ctx) || self.right.interpret(ctx)
    }

    fn render(&self) -> String {
        format!("({} or {})", self.left.render(), self.right.render())
    }
}

struct Alert {
    level: i32,
    team: &'static str,
}

fn run(label: &str, rule: &dyn Expression, alerts: &[Alert]) {
    println!("rule {} = {}", label, rule.render());
    for e in alerts {
        let mut ctx = Context::new(e.level, e.team);
        let send = rule.interpret(&mut ctx);
        let team = format!("team={}", e.team);
        println!(
            "  level={} {:<12} -> {} checked={}",
            e.level,
            team,
            if send { "send" } else { "skip" },
            ctx.checked()
        );
    }
}

fn main() {
    let two = [Alert { level: 4, team: "infra" }, Alert { level: 5, team: "billing" }];
    let three = [
        Alert { level: 4, team: "infra" },
        Alert { level: 5, team: "billing" },
        Alert { level: 2, team: "infra" },
    ];

    let a: Box<dyn Expression> = Box::new(And {
        left: Box::new(TeamIs { name: "infra".to_string() }),
        right: Box::new(LevelAtLeast { min: 3 }),
    });
    let b: Box<dyn Expression> = Box::new(Or {
        left: Box::new(TeamIs { name: "infra".to_string() }),
        right: Box::new(LevelAtLeast { min: 5 }),
    });
    let c: Box<dyn Expression> = Box::new(Or {
        left: Box::new(And {
            left: Box::new(TeamIs { name: "infra".to_string() }),
            right: Box::new(LevelAtLeast { min: 3 }),
        }),
        right: Box::new(Not { inner: Box::new(TeamIs { name: "billing".to_string() }) }),
    });

    println!("grammar rule ::= term | not rule | rule and rule | rule or rule");
    println!("        term ::= level>=n | team=word");
    run("A", a.as_ref(), &two);
    run("B", b.as_ref(), &two);
    run("C", c.as_ref(), &three);
}
