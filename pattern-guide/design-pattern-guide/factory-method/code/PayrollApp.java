import java.util.List;

interface PaySlip {
    long gross();

    long tax();

    long net();

    String basis();
}

record Employee(String id, long rate, long units) {
}

final class MonthlySlip implements PaySlip {
    private static final long DEDUCTION_PER_MILLE = 90;

    private final Employee employee;

    MonthlySlip(Employee employee) {
        this.employee = employee;
    }

    @Override
    public long gross() {
        return employee.rate() * employee.units();
    }

    @Override
    public long tax() {
        return gross() * DEDUCTION_PER_MILLE / 1_000;
    }

    @Override
    public long net() {
        return gross() - tax();
    }

    @Override
    public String basis() {
        return "monthly " + employee.rate();
    }
}

final class HourlySlip implements PaySlip {
    private static final long DEDUCTION_PER_MILLE = 45;

    private final Employee employee;

    HourlySlip(Employee employee) {
        this.employee = employee;
    }

    @Override
    public long gross() {
        return employee.rate() * employee.units();
    }

    @Override
    public long tax() {
        return gross() * DEDUCTION_PER_MILLE / 1_000;
    }

    @Override
    public long net() {
        return gross() - tax();
    }

    @Override
    public String basis() {
        return "hourly " + employee.rate() + "x" + employee.units();
    }
}

final class ProjectSlip implements PaySlip {
    private static final long DEDUCTION_PER_MILLE = 55;

    private final Employee employee;

    ProjectSlip(Employee employee) {
        this.employee = employee;
    }

    @Override
    public long gross() {
        return employee.rate() * employee.units();
    }

    @Override
    public long tax() {
        return gross() * DEDUCTION_PER_MILLE / 1_000;
    }

    @Override
    public long net() {
        return gross() - tax();
    }

    @Override
    public String basis() {
        return "project " + employee.rate() + "x" + employee.units();
    }
}

abstract class PayrollRun {
    private final String label;

    protected PayrollRun(String label) {
        this.label = label;
    }

    final void run(List<Employee> staff) {
        long total = 0;
        for (Employee employee : staff) {
            PaySlip slip = createSlip(employee);
            total += slip.net();
            System.out.println("[" + label + "] " + employee.id() + " " + slip.basis()
                    + " -> gross " + slip.gross() + " tax " + slip.tax() + " net " + slip.net());
        }
        System.out.println("[" + label + "] net total " + total);
    }

    protected abstract PaySlip createSlip(Employee employee);
}

final class HeadOfficeRun extends PayrollRun {
    HeadOfficeRun() {
        super("head-office");
    }

    @Override
    protected PaySlip createSlip(Employee employee) {
        return new MonthlySlip(employee);
    }
}

final class FulfillmentRun extends PayrollRun {
    FulfillmentRun() {
        super("fulfillment");
    }

    @Override
    protected PaySlip createSlip(Employee employee) {
        return new HourlySlip(employee);
    }
}

final class StudioRun extends PayrollRun {
    StudioRun() {
        super("studio");
    }

    @Override
    protected PaySlip createSlip(Employee employee) {
        return new ProjectSlip(employee);
    }
}

public final class PayrollApp {
    public static void main(String[] args) {
        new HeadOfficeRun().run(List.of(
                new Employee("E1", 3_200_000L, 1L),
                new Employee("E2", 2_750_000L, 1L)));
        new FulfillmentRun().run(List.of(
                new Employee("E3", 12_000L, 160L),
                new Employee("E4", 11_450L, 93L)));
        new StudioRun().run(List.of(
                new Employee("E5", 450_000L, 3L)));
    }
}
