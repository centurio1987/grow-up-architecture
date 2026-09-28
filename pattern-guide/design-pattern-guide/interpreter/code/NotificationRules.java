import java.util.List;

// 문법 (이 트리가 나타내는 언어)
//   rule ::= term | "not" rule | rule "and" rule | rule "or" rule
//   term ::= "level>=" n | "team=" word
interface Expression {
    boolean interpret(Context ctx);

    String render();
}

final class Context {
    private final int level;
    private final String team;
    private int checked = 0;

    Context(int level, String team) {
        this.level = level;
        this.team = team;
    }

    int level() {
        return level;
    }

    String team() {
        return team;
    }

    void markChecked() {
        checked++;
    }

    int checked() {
        return checked;
    }
}

final class TeamIs implements Expression {
    private final String name;

    TeamIs(String name) {
        this.name = name;
    }

    @Override
    public boolean interpret(Context ctx) {
        ctx.markChecked();
        return ctx.team().equals(name);
    }

    @Override
    public String render() {
        return "team=" + name;
    }
}

final class LevelAtLeast implements Expression {
    private final int min;

    LevelAtLeast(int min) {
        this.min = min;
    }

    @Override
    public boolean interpret(Context ctx) {
        ctx.markChecked();
        return ctx.level() >= min;
    }

    @Override
    public String render() {
        return "level>=" + min;
    }
}

final class Not implements Expression {
    private final Expression inner;

    Not(Expression inner) {
        this.inner = inner;
    }

    @Override
    public boolean interpret(Context ctx) {
        return !inner.interpret(ctx);
    }

    @Override
    public String render() {
        return "(not " + inner.render() + ")";
    }
}

final class And implements Expression {
    private final Expression left;
    private final Expression right;

    And(Expression left, Expression right) {
        this.left = left;
        this.right = right;
    }

    @Override
    public boolean interpret(Context ctx) {
        return left.interpret(ctx) && right.interpret(ctx);
    }

    @Override
    public String render() {
        return "(" + left.render() + " and " + right.render() + ")";
    }
}

final class Or implements Expression {
    private final Expression left;
    private final Expression right;

    Or(Expression left, Expression right) {
        this.left = left;
        this.right = right;
    }

    @Override
    public boolean interpret(Context ctx) {
        return left.interpret(ctx) || right.interpret(ctx);
    }

    @Override
    public String render() {
        return "(" + left.render() + " or " + right.render() + ")";
    }
}

public final class NotificationRules {

    record Alert(int level, String team) {
    }

    static void run(String label, Expression rule, List<Alert> alerts) {
        System.out.println("rule " + label + " = " + rule.render());
        for (Alert e : alerts) {
            Context ctx = new Context(e.level(), e.team());
            boolean send = rule.interpret(ctx);
            System.out.printf("  level=%d team=%-7s -> %-4s checked=%d%n",
                    e.level(), e.team(), send ? "send" : "skip", ctx.checked());
        }
    }

    public static void main(String[] args) {
        List<Alert> two = List.of(new Alert(4, "infra"), new Alert(5, "billing"));
        List<Alert> three = List.of(new Alert(4, "infra"), new Alert(5, "billing"), new Alert(2, "infra"));

        Expression a = new And(new TeamIs("infra"), new LevelAtLeast(3));
        Expression b = new Or(new TeamIs("infra"), new LevelAtLeast(5));
        Expression c = new Or(new And(new TeamIs("infra"), new LevelAtLeast(3)),
                new Not(new TeamIs("billing")));

        System.out.println("grammar rule ::= term | not rule | rule and rule | rule or rule");
        System.out.println("        term ::= level>=n | team=word");
        run("A", a, two);
        run("B", b, two);
        run("C", c, three);
    }
}
