trait PaySlip {
    fn gross(&self) -> u64;
    fn tax(&self) -> u64;
    fn net(&self) -> u64;
    fn basis(&self) -> String;
}

#[derive(Clone)]
struct Employee {
    id: String,
    rate: u64,
    units: u64,
}

impl Employee {
    fn new(id: &str, rate: u64, units: u64) -> Self {
        Employee { id: id.to_string(), rate, units }
    }
}

struct MonthlySlip {
    employee: Employee,
}

impl MonthlySlip {
    const DEDUCTION_PER_MILLE: u64 = 90;
}

impl PaySlip for MonthlySlip {
    fn gross(&self) -> u64 {
        self.employee.rate * self.employee.units
    }

    fn tax(&self) -> u64 {
        self.gross() * Self::DEDUCTION_PER_MILLE / 1_000
    }

    fn net(&self) -> u64 {
        self.gross() - self.tax()
    }

    fn basis(&self) -> String {
        format!("monthly {}", self.employee.rate)
    }
}

struct HourlySlip {
    employee: Employee,
}

impl HourlySlip {
    const DEDUCTION_PER_MILLE: u64 = 45;
}

impl PaySlip for HourlySlip {
    fn gross(&self) -> u64 {
        self.employee.rate * self.employee.units
    }

    fn tax(&self) -> u64 {
        self.gross() * Self::DEDUCTION_PER_MILLE / 1_000
    }

    fn net(&self) -> u64 {
        self.gross() - self.tax()
    }

    fn basis(&self) -> String {
        format!("hourly {}x{}", self.employee.rate, self.employee.units)
    }
}

struct ProjectSlip {
    employee: Employee,
}

impl ProjectSlip {
    const DEDUCTION_PER_MILLE: u64 = 55;
}

impl PaySlip for ProjectSlip {
    fn gross(&self) -> u64 {
        self.employee.rate * self.employee.units
    }

    fn tax(&self) -> u64 {
        self.gross() * Self::DEDUCTION_PER_MILLE / 1_000
    }

    fn net(&self) -> u64 {
        self.gross() - self.tax()
    }

    fn basis(&self) -> String {
        format!("project {}x{}", self.employee.rate, self.employee.units)
    }
}

trait PayrollRun {
    fn label(&self) -> &str;

    fn create_slip(&self, employee: &Employee) -> Box<dyn PaySlip>;

    fn run(&self, staff: &[Employee]) {
        let mut total = 0;
        for employee in staff {
            let slip = self.create_slip(employee);
            total += slip.net();
            println!(
                "[{}] {} {} -> gross {} tax {} net {}",
                self.label(),
                employee.id,
                slip.basis(),
                slip.gross(),
                slip.tax(),
                slip.net()
            );
        }
        println!("[{}] net total {}", self.label(), total);
    }
}

struct HeadOfficeRun;

impl PayrollRun for HeadOfficeRun {
    fn label(&self) -> &str {
        "head-office"
    }

    fn create_slip(&self, employee: &Employee) -> Box<dyn PaySlip> {
        Box::new(MonthlySlip { employee: employee.clone() })
    }
}

struct FulfillmentRun;

impl PayrollRun for FulfillmentRun {
    fn label(&self) -> &str {
        "fulfillment"
    }

    fn create_slip(&self, employee: &Employee) -> Box<dyn PaySlip> {
        Box::new(HourlySlip { employee: employee.clone() })
    }
}

struct StudioRun;

impl PayrollRun for StudioRun {
    fn label(&self) -> &str {
        "studio"
    }

    fn create_slip(&self, employee: &Employee) -> Box<dyn PaySlip> {
        Box::new(ProjectSlip { employee: employee.clone() })
    }
}

fn main() {
    HeadOfficeRun.run(&[
        Employee::new("E1", 3_200_000, 1),
        Employee::new("E2", 2_750_000, 1),
    ]);
    FulfillmentRun.run(&[
        Employee::new("E3", 12_000, 160),
        Employee::new("E4", 11_450, 93),
    ]);
    StudioRun.run(&[Employee::new("E5", 450_000, 3)]);
}
