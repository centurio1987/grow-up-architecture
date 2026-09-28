import java.util.ArrayList;
import java.util.List;

record ScanRecord(String id, long count) {}

interface ScanCursor {
    boolean hasNext();

    ScanRecord next();
}

interface ScanArchive {
    ScanCursor oldestFirst();

    default long totalCount() {
        long sum = 0;
        ScanCursor cursor = oldestFirst();
        while (cursor.hasNext()) {
            sum += cursor.next().count();
        }
        return sum;
    }
}

final class RingScanLog implements ScanArchive {
    private final ScanRecord[] slots;
    private int written = 0;

    RingScanLog(int capacity) {
        this.slots = new ScanRecord[capacity];
    }

    void add(ScanRecord record) {
        slots[written % slots.length] = record;
        written++;
    }

    private int size() {
        return Math.min(written, slots.length);
    }

    private ScanRecord at(int logical) {
        int start = written <= slots.length ? 0 : written % slots.length;
        return slots[(start + logical) % slots.length];
    }

    @Override
    public ScanCursor oldestFirst() {
        return new OldestFirst();
    }

    ScanCursor newestFirst() {
        return new NewestFirst();
    }

    private final class OldestFirst implements ScanCursor {
        private int step = 0;

        @Override
        public boolean hasNext() {
            return step < size();
        }

        @Override
        public ScanRecord next() {
            return at(step++);
        }
    }

    private final class NewestFirst implements ScanCursor {
        private int step = 0;

        @Override
        public boolean hasNext() {
            return step < size();
        }

        @Override
        public ScanRecord next() {
            return at(size() - 1 - step++);
        }
    }
}

final class ChainScanLog implements ScanArchive {
    private Node head = null;

    private static final class Node {
        private final ScanRecord record;
        private Node next = null;

        Node(ScanRecord record) {
            this.record = record;
        }
    }

    void add(ScanRecord record) {
        Node node = new Node(record);
        if (head == null) {
            head = node;
            return;
        }
        Node last = head;
        while (last.next != null) {
            last = last.next;
        }
        last.next = node;
    }

    @Override
    public ScanCursor oldestFirst() {
        return new FromHead();
    }

    private final class FromHead implements ScanCursor {
        private Node at = head;

        @Override
        public boolean hasNext() {
            return at != null;
        }

        @Override
        public ScanRecord next() {
            ScanRecord record = at.record;
            at = at.next;
            return record;
        }
    }
}

public final class ScanLogApp {
    private static String walk(ScanCursor cursor) {
        List<String> ids = new ArrayList<>();
        while (cursor.hasNext()) {
            ids.add(cursor.next().id());
        }
        return String.join(" ", ids);
    }

    private static String pair(ScanCursor left, ScanCursor right) {
        List<String> pairs = new ArrayList<>();
        while (left.hasNext() && right.hasNext()) {
            pairs.add(left.next().id() + "/" + right.next().id());
        }
        return String.join(" ", pairs);
    }

    public static void main(String[] args) {
        ScanRecord[] feed = {
            new ScanRecord("SCN-01", 12),
            new ScanRecord("SCN-02", 30),
            new ScanRecord("SCN-03", 7),
            new ScanRecord("SCN-04", 21),
            new ScanRecord("SCN-05", 9),
            new ScanRecord("SCN-06", 15),
            new ScanRecord("SCN-07", 4),
        };

        RingScanLog ring = new RingScanLog(5);
        ChainScanLog chain = new ChainScanLog();
        for (ScanRecord record : feed) {
            ring.add(record);
            chain.add(record);
        }

        System.out.println("ring oldest-first: " + walk(ring.oldestFirst()));
        System.out.println("ring newest-first: " + walk(ring.newestFirst()));
        System.out.println("ring paired: " + pair(ring.oldestFirst(), ring.newestFirst()));
        System.out.println("chain oldest-first: " + walk(chain.oldestFirst()));
        System.out.println("total: ring=" + ring.totalCount() + " chain=" + chain.totalCount());
    }
}
