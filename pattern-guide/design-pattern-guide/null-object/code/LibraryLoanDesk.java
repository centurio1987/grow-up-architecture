public final class LibraryLoanDesk {

    // ── 대출 기록 ────────────────────────────────────────────────────────────
    record Loan(String id, String memberId, String title, int dueDay) {
    }

    // ── 협력자 공통 타입 ─────────────────────────────────────────────────────
    interface BorrowNotifier {
        void send(Loan loan);

        int sentCount();
    }

    // ── 실제 동작을 하는 협력자 ──────────────────────────────────────────────
    static final class EmailNotifier implements BorrowNotifier {
        private int sent = 0;

        @Override
        public void send(Loan loan) {
            System.out.println("mail -> " + loan.memberId() + " : \"" + loan.title()
                    + "\" due day " + loan.dueDay());
            sent++;
        }

        @Override
        public int sentCount() {
            return sent;
        }
    }

    static final class SmsNotifier implements BorrowNotifier {
        private int sent = 0;

        @Override
        public void send(Loan loan) {
            System.out.println("sms -> " + loan.memberId() + " : \"" + loan.title()
                    + "\" due day " + loan.dueDay());
            sent++;
        }

        @Override
        public int sentCount() {
            return sent;
        }
    }

    // ── 아무 일도 하지 않는 협력자 ───────────────────────────────────────────
    static final class SilentNotifier implements BorrowNotifier {
        @Override
        public void send(Loan loan) {
            // 알림을 끈 회원이다. 보낼 곳이 없으므로 아무 일도 하지 않는다.
        }

        @Override
        public int sentCount() {
            return 0;   // 한 건도 보내지 않았으니 0 이 참값이다
        }
    }

    // ── 협력자를 들고 다니는 도메인 객체 ─────────────────────────────────────
    record Member(String id, BorrowNotifier notifier) {
    }

    // ── Client ───────────────────────────────────────────────────────────────
    static final class LoanDesk {
        private final int today;
        private final int period;
        private int nextNo;

        LoanDesk(int today, int period, int firstNo) {
            this.today = today;
            this.period = period;
            this.nextNo = firstNo;
        }

        Loan borrow(Member member, String title) {
            Loan loan = new Loan("L-" + nextNo++, member.id(), title, today + period);
            System.out.println("loan " + loan.id() + " " + loan.memberId() + " \"" + loan.title()
                    + "\" due day " + loan.dueDay());
            member.notifier().send(loan);
            return loan;
        }
    }

    public static void main(String[] args) {
        EmailNotifier mail = new EmailNotifier();
        SmsNotifier sms = new SmsNotifier();
        BorrowNotifier silent = new SilentNotifier();   // 인스턴스 하나를 나눠 쓴다

        Member m01 = new Member("M-01", mail);
        Member m02 = new Member("M-02", silent);
        Member m03 = new Member("M-03", sms);
        Member m04 = new Member("M-04", silent);

        LoanDesk desk = new LoanDesk(100, 14, 1001);
        desk.borrow(m01, "Cosmos");
        desk.borrow(m02, "The Selfish Gene");
        desk.borrow(m03, "Guns, Germs, and Steel");
        desk.borrow(m04, "Sapiens");

        System.out.println("-- closing --");
        System.out.println("mail sent " + mail.sentCount());
        System.out.println("sms sent " + sms.sentCount());
        System.out.println("silent sent " + silent.sentCount());
    }
}
