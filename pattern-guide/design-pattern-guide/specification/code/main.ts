// ── 후보 객체 ──────────────────────────────────────────────────────────────
interface Container {
  readonly id: string;
  readonly lowestTempC: number;
  readonly foodSafe: boolean;
  readonly humidityPercent: number;
  readonly sealed: boolean;
}

// ── 명세 공통 타입 ─────────────────────────────────────────────────────────
interface ContainerSpec {
  isSatisfiedBy(candidate: Container): boolean;
}

// ── 잎 명세 ────────────────────────────────────────────────────────────────
class TempAtMost implements ContainerSpec {
  constructor(private readonly limitC: number) {}

  isSatisfiedBy(candidate: Container): boolean {
    return candidate.lowestTempC <= this.limitC;
  }
}

class HumidityAtMost implements ContainerSpec {
  constructor(private readonly limitPercent: number) {}

  isSatisfiedBy(candidate: Container): boolean {
    return candidate.humidityPercent <= this.limitPercent;
  }
}

class FoodSafe implements ContainerSpec {
  isSatisfiedBy(candidate: Container): boolean {
    return candidate.foodSafe;
  }
}

class Sealed implements ContainerSpec {
  isSatisfiedBy(candidate: Container): boolean {
    return candidate.sealed;
  }
}

// ── 조합 명세 ──────────────────────────────────────────────────────────────
class AndSpec implements ContainerSpec {
  constructor(private readonly left: ContainerSpec, private readonly right: ContainerSpec) {}

  isSatisfiedBy(candidate: Container): boolean {
    return this.left.isSatisfiedBy(candidate) && this.right.isSatisfiedBy(candidate);
  }
}

class OrSpec implements ContainerSpec {
  constructor(private readonly left: ContainerSpec, private readonly right: ContainerSpec) {}

  isSatisfiedBy(candidate: Container): boolean {
    return this.left.isSatisfiedBy(candidate) || this.right.isSatisfiedBy(candidate);
  }
}

class NotSpec implements ContainerSpec {
  constructor(private readonly inner: ContainerSpec) {}

  isSatisfiedBy(candidate: Container): boolean {
    return !this.inner.isSatisfiedBy(candidate);
  }
}

function and(left: ContainerSpec, right: ContainerSpec): ContainerSpec {
  return new AndSpec(left, right);
}

function or(left: ContainerSpec, right: ContainerSpec): ContainerSpec {
  return new OrSpec(left, right);
}

function not(inner: ContainerSpec): ContainerSpec {
  return new NotSpec(inner);
}

// ── 명세를 보유한 도메인 객체 ──────────────────────────────────────────────
class Cargo {
  constructor(
    readonly id: string,
    readonly goods: string,
    readonly storageSpec: ContainerSpec,
  ) {}

  fits(candidate: Container): boolean {
    return this.storageSpec.isSatisfiedBy(candidate);
  }
}

// ── 명세로 후보를 거르는 쪽 ────────────────────────────────────────────────
class ContainerYard {
  constructor(readonly containers: readonly Container[]) {}

  matching(spec: ContainerSpec): Container[] {
    const found: Container[] = [];
    for (const candidate of this.containers) {
      if (spec.isSatisfiedBy(candidate)) {
        found.push(candidate);
      }
    }
    return found;
  }
}

function ids(containers: readonly Container[]): string {
  if (containers.length === 0) {
    return "none";
  }
  const names: string[] = [];
  for (const candidate of containers) {
    names.push(candidate.id);
  }
  return names.join(", ");
}

// ── Client ─────────────────────────────────────────────────────────────────
const yard = new ContainerYard([
  { id: "REEFER-01", lowestTempC: -18, foodSafe: true, humidityPercent: 55, sealed: false },
  { id: "REEFER-02", lowestTempC: -18, foodSafe: false, humidityPercent: 60, sealed: false },
  { id: "DRYBOX-11", lowestTempC: 4, foodSafe: true, humidityPercent: 70, sealed: true },
  { id: "REEFER-03", lowestTempC: -20, foodSafe: true, humidityPercent: 72, sealed: false },
]);

const meat = new Cargo("CG-5521", "frozen meat", and(new TempAtMost(-4), new FoodSafe()));

let line = 1;
for (const candidate of yard.containers) {
  const verdict = meat.fits(candidate) ? "accepted" : "rejected";
  console.log(`${line++}) validate ${meat.id} -> ${candidate.id} : ${verdict}`);
}
console.log(`${line++}) select ${meat.id} : ${ids(yard.matching(meat.storageSpec))}`);

const meatV2 = new Cargo(meat.id, meat.goods, and(meat.storageSpec, new HumidityAtMost(60)));
console.log(`${line++}) select ${meatV2.id} with humidity rule : ${ids(yard.matching(meatV2.storageSpec))}`);

const flowers = new Cargo("CG-7702", "fresh flowers", and(new TempAtMost(8), not(new Sealed())));
console.log(`${line++}) select ${flowers.id} : ${ids(yard.matching(flowers.storageSpec))}`);

const driedFood = new Cargo("CG-9033", "dried food", or(new HumidityAtMost(60), new Sealed()));
console.log(`${line++}) select ${driedFood.id} : ${ids(yard.matching(driedFood.storageSpec))}`);
