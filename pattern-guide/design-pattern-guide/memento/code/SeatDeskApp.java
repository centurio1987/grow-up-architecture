import java.util.ArrayList;
import java.util.List;

/** 좁은 인터페이스 — 메멘토를 받아 드는 쪽에는 연산이 하나도 없다. */
interface SeatMemento {
}

final class SeatChart {
    private static final char OPEN = '.';

    private final char[] seats;
    private int remaining;
    private char nextCode;

    SeatChart(String layout) {
        this.seats = layout.toCharArray();
        this.remaining = countOpen(this.seats);
        this.nextCode = 'A';
    }

    /** 넓은 인터페이스 — 필드가 SeatChart 본문 안에서만 보인다. */
    private static final class Snapshot implements SeatMemento {
        private final String seats;
        private final int remaining;
        private final char nextCode;

        private Snapshot(String seats, int remaining, char nextCode) {
            this.seats = seats;
            this.remaining = remaining;
            this.nextCode = nextCode;
        }
    }

    SeatMemento save() {
        return new Snapshot(new String(seats), remaining, nextCode);
    }

    void restore(SeatMemento memento) {
        Snapshot snapshot = (Snapshot) memento;
        char[] saved = snapshot.seats.toCharArray();
        System.arraycopy(saved, 0, seats, 0, seats.length);
        remaining = snapshot.remaining;
        nextCode = snapshot.nextCode;
    }

    boolean reserve(int count) {
        if (count <= 0 || count > remaining) {
            return false;
        }
        for (int index : pick(count)) {
            seats[index] = nextCode;
        }
        remaining -= count;
        nextCode++;
        return true;
    }

    String describe() {
        return new String(seats) + " rem=" + remaining + " next=" + nextCode;
    }

    private int[] pick(int count) {
        int run = 0;
        for (int i = 0; i < seats.length; i++) {
            run = seats[i] == OPEN ? run + 1 : 0;
            if (run == count) {
                int[] block = new int[count];
                for (int k = 0; k < count; k++) {
                    block[k] = i - count + 1 + k;
                }
                return block;
            }
        }
        int[] scattered = new int[count];
        int filled = 0;
        for (int i = 0; i < seats.length && filled < count; i++) {
            if (seats[i] == OPEN) {
                scattered[filled++] = i;
            }
        }
        return scattered;
    }

    private static int countOpen(char[] row) {
        int open = 0;
        for (char seat : row) {
            if (seat == OPEN) {
                open++;
            }
        }
        return open;
    }
}

final class ReservationDesk {
    private final List<SeatMemento> history = new ArrayList<>();

    void checkpoint(SeatChart chart) {
        history.add(chart.save());
    }

    boolean undo(SeatChart chart) {
        if (history.isEmpty()) {
            return false;
        }
        chart.restore(history.remove(history.size() - 1));
        return true;
    }

    int depth() {
        return history.size();
    }
}

public final class SeatDeskApp {
    public static void main(String[] args) {
        SeatChart chart = new SeatChart("...#....");
        ReservationDesk desk = new ReservationDesk();
        line(0, "init", chart, desk);

        desk.checkpoint(chart);
        chart.reserve(2);
        line(1, "reserve(2)", chart, desk);

        desk.checkpoint(chart);
        chart.reserve(3);
        line(2, "reserve(3)", chart, desk);

        desk.undo(chart);
        line(3, "undo", chart, desk);

        desk.checkpoint(chart);
        chart.reserve(5);
        line(4, "reserve(5)", chart, desk);

        desk.undo(chart);
        line(5, "undo", chart, desk);

        desk.undo(chart);
        line(6, "undo", chart, desk);
    }

    private static void line(int step, String action, SeatChart chart, ReservationDesk desk) {
        System.out.printf("%d %-10s %s history=%d%n", step, action, chart.describe(), desk.depth());
    }
}
