import java.util.ArrayList;
import java.util.List;

public final class OverdueNotice {

    // ── 자료 ────────────────────────────────────────────────────────────────
    record Loan(String memberId, String title, int dueDay) {
    }

    record NoticeRun(int today, int sent) {
    }

    // ── 협력 타입 — 의존 객체는 협력 객체를 이 타입으로만 안다 ──────────────
    interface LoanRepository {
        List<Loan> allLoans();
    }

    interface Clock {
        int today();
    }

    interface NoticeSender {
        void send(String memberId, String title, int daysLate);
    }

    // ── 의존 객체 — 만들지도 찾지도 않고, 받아서 쓴다 ───────────────────────
    static final class OverdueNotifier {
        private final LoanRepository loans;
        private final Clock clock;
        private final NoticeSender sender;

        OverdueNotifier(LoanRepository loans, Clock clock, NoticeSender sender) {
            this.loans = loans;
            this.clock = clock;
            this.sender = sender;
        }

        NoticeRun notifyOverdue() {
            int today = clock.today();
            int sent = 0;
            for (Loan loan : loans.allLoans()) {
                int daysLate = today - loan.dueDay();
                if (daysLate <= 0) {
                    continue;
                }
                sender.send(loan.memberId(), loan.title(), daysLate);
                sent += 1;
            }
            return new NoticeRun(today, sent);
        }
    }

    // ── 협력 구현 ───────────────────────────────────────────────────────────
    static final class InMemoryLoanRepository implements LoanRepository {
        private final List<Loan> rows;

        InMemoryLoanRepository(List<Loan> rows) {
            this.rows = List.copyOf(rows);
        }

        @Override
        public List<Loan> allLoans() {
            return rows;
        }
    }

    static final class FixedClock implements Clock {
        private final int day;

        FixedClock(int day) {
            this.day = day;
        }

        @Override
        public int today() {
            return day;
        }
    }

    static final class ConsoleNoticeSender implements NoticeSender {
        private final String tag;

        ConsoleNoticeSender(String tag) {
            this.tag = tag;
        }

        @Override
        public void send(String memberId, String title, int daysLate) {
            System.out.println(tag + ": notice " + line(memberId, title, daysLate));
        }
    }

    static final class RecordingNoticeSender implements NoticeSender {
        private final List<String> lines = new ArrayList<>();

        @Override
        public void send(String memberId, String title, int daysLate) {
            lines.add(line(memberId, title, daysLate));
        }

        List<String> recorded() {
            return List.copyOf(lines);
        }
    }

    static String line(String memberId, String title, int daysLate) {
        return memberId + " \"" + title + "\" " + daysLate + " days late";
    }

    // ── 조립자 — 어느 구현을 쓸지 여기서만 정한다 ───────────────────────────
    record TestRig(OverdueNotifier notifier, RecordingNoticeSender recorder) {
    }

    static List<Loan> loanRows() {
        return List.of(
                new Loan("M-101", "Data Structures", 118),
                new Loan("M-204", "Operating Systems", 120),
                new Loan("M-101", "Compiler Design", 125),
                new Loan("M-337", "Discrete Math", 113));
    }

    static OverdueNotifier assembleForOperations() {
        return new OverdueNotifier(
                new InMemoryLoanRepository(loanRows()),
                new FixedClock(120),
                new ConsoleNoticeSender("ops"));
    }

    static TestRig assembleForTest() {
        RecordingNoticeSender recorder = new RecordingNoticeSender();
        OverdueNotifier notifier = new OverdueNotifier(
                new InMemoryLoanRepository(loanRows()),
                new FixedClock(127),
                recorder);
        return new TestRig(notifier, recorder);
    }

    // ── 쓰는 쪽 — 조립된 것을 받아 일을 시킨다 ──────────────────────────────
    public static void main(String[] args) {
        OverdueNotifier operations = assembleForOperations();
        NoticeRun opsRun = operations.notifyOverdue();
        System.out.println("ops: today=" + opsRun.today() + " sent=" + opsRun.sent());

        TestRig rig = assembleForTest();
        NoticeRun testRun = rig.notifier().notifyOverdue();
        System.out.println("test: today=" + testRun.today() + " sent=" + testRun.sent());

        List<String> recorded = rig.recorder().recorded();
        System.out.println("test: recorded " + recorded.size());
        for (String entry : recorded) {
            System.out.println("test: log " + entry);
        }
    }
}
