interface PaySlip {
  gross(): number;
  tax(): number;
  net(): number;
  basis(): string;
}

interface Employee {
  readonly id: string;
  readonly rate: number;
  readonly units: number;
}

class MonthlySlip implements PaySlip {
  private static readonly DEDUCTION_PER_MILLE = 90;

  constructor(private readonly employee: Employee) {}

  gross(): number {
    return this.employee.rate * this.employee.units;
  }

  tax(): number {
    return Math.floor((this.gross() * MonthlySlip.DEDUCTION_PER_MILLE) / 1_000);
  }

  net(): number {
    return this.gross() - this.tax();
  }

  basis(): string {
    return `monthly ${this.employee.rate}`;
  }
}

class HourlySlip implements PaySlip {
  private static readonly DEDUCTION_PER_MILLE = 45;

  constructor(private readonly employee: Employee) {}

  gross(): number {
    return this.employee.rate * this.employee.units;
  }

  tax(): number {
    return Math.floor((this.gross() * HourlySlip.DEDUCTION_PER_MILLE) / 1_000);
  }

  net(): number {
    return this.gross() - this.tax();
  }

  basis(): string {
    return `hourly ${this.employee.rate}x${this.employee.units}`;
  }
}

class ProjectSlip implements PaySlip {
  private static readonly DEDUCTION_PER_MILLE = 55;

  constructor(private readonly employee: Employee) {}

  gross(): number {
    return this.employee.rate * this.employee.units;
  }

  tax(): number {
    return Math.floor((this.gross() * ProjectSlip.DEDUCTION_PER_MILLE) / 1_000);
  }

  net(): number {
    return this.gross() - this.tax();
  }

  basis(): string {
    return `project ${this.employee.rate}x${this.employee.units}`;
  }
}

abstract class PayrollRun {
  constructor(private readonly label: string) {}

  run(staff: readonly Employee[]): void {
    let total = 0;
    for (const employee of staff) {
      const slip = this.createSlip(employee);
      total += slip.net();
      console.log(
        `[${this.label}] ${employee.id} ${slip.basis()}` +
          ` -> gross ${slip.gross()} tax ${slip.tax()} net ${slip.net()}`,
      );
    }
    console.log(`[${this.label}] net total ${total}`);
  }

  protected abstract createSlip(employee: Employee): PaySlip;
}

class HeadOfficeRun extends PayrollRun {
  constructor() {
    super("head-office");
  }

  protected createSlip(employee: Employee): PaySlip {
    return new MonthlySlip(employee);
  }
}

class FulfillmentRun extends PayrollRun {
  constructor() {
    super("fulfillment");
  }

  protected createSlip(employee: Employee): PaySlip {
    return new HourlySlip(employee);
  }
}

class StudioRun extends PayrollRun {
  constructor() {
    super("studio");
  }

  protected createSlip(employee: Employee): PaySlip {
    return new ProjectSlip(employee);
  }
}

new HeadOfficeRun().run([
  { id: "E1", rate: 3_200_000, units: 1 },
  { id: "E2", rate: 2_750_000, units: 1 },
]);
new FulfillmentRun().run([
  { id: "E3", rate: 12_000, units: 160 },
  { id: "E4", rate: 11_450, units: 93 },
]);
new StudioRun().run([{ id: "E5", rate: 450_000, units: 3 }]);
