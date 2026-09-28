// 문법 (이 트리가 나타내는 언어)
//   rule ::= term | "not" rule | rule "and" rule | rule "or" rule
//   term ::= "level>=" n | "team=" word
interface Expression {
  interpret(ctx: Context): boolean;
  render(): string;
}

class Context {
  private checkedCount = 0;

  constructor(
    private readonly levelValue: number,
    private readonly teamValue: string,
  ) {}

  level(): number {
    return this.levelValue;
  }

  team(): string {
    return this.teamValue;
  }

  markChecked(): void {
    this.checkedCount += 1;
  }

  checked(): number {
    return this.checkedCount;
  }
}

class TeamIs implements Expression {
  constructor(private readonly name: string) {}

  interpret(ctx: Context): boolean {
    ctx.markChecked();
    return ctx.team() === this.name;
  }

  render(): string {
    return `team=${this.name}`;
  }
}

class LevelAtLeast implements Expression {
  constructor(private readonly min: number) {}

  interpret(ctx: Context): boolean {
    ctx.markChecked();
    return ctx.level() >= this.min;
  }

  render(): string {
    return `level>=${this.min}`;
  }
}

class Not implements Expression {
  constructor(private readonly inner: Expression) {}

  interpret(ctx: Context): boolean {
    return !this.inner.interpret(ctx);
  }

  render(): string {
    return `(not ${this.inner.render()})`;
  }
}

class And implements Expression {
  constructor(
    private readonly left: Expression,
    private readonly right: Expression,
  ) {}

  interpret(ctx: Context): boolean {
    return this.left.interpret(ctx) && this.right.interpret(ctx);
  }

  render(): string {
    return `(${this.left.render()} and ${this.right.render()})`;
  }
}

class Or implements Expression {
  constructor(
    private readonly left: Expression,
    private readonly right: Expression,
  ) {}

  interpret(ctx: Context): boolean {
    return this.left.interpret(ctx) || this.right.interpret(ctx);
  }

  render(): string {
    return `(${this.left.render()} or ${this.right.render()})`;
  }
}

interface Alert {
  level: number;
  team: string;
}

function run(label: string, rule: Expression, alerts: readonly Alert[]): void {
  console.log(`rule ${label} = ${rule.render()}`);
  for (const e of alerts) {
    const ctx = new Context(e.level, e.team);
    const send = rule.interpret(ctx);
    const team = `team=${e.team}`.padEnd(12, " ");
    console.log(`  level=${e.level} ${team} -> ${send ? "send" : "skip"} checked=${ctx.checked()}`);
  }
}

const two: readonly Alert[] = [
  { level: 4, team: "infra" },
  { level: 5, team: "billing" },
];
const three: readonly Alert[] = [
  { level: 4, team: "infra" },
  { level: 5, team: "billing" },
  { level: 2, team: "infra" },
];

const a: Expression = new And(new TeamIs("infra"), new LevelAtLeast(3));
const b: Expression = new Or(new TeamIs("infra"), new LevelAtLeast(5));
const c: Expression = new Or(
  new And(new TeamIs("infra"), new LevelAtLeast(3)),
  new Not(new TeamIs("billing")),
);

console.log("grammar rule ::= term | not rule | rule and rule | rule or rule");
console.log("        term ::= level>=n | team=word");
run("A", a, two);
run("B", b, two);
run("C", c, three);
