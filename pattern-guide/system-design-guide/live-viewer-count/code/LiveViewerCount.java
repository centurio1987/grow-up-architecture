import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.PriorityQueue;
import java.util.TreeMap;

final class Rng {
    private int x;

    Rng(int seed) {
        x = seed;
    }

    int below(int n) {
        x ^= x << 13;
        x ^= x >>> 17;
        x ^= x << 5;
        return (int) (Integer.toUnsignedLong(x) % n);
    }
}

enum Kind { JOIN, BEAT, CLOSE, PAUSE, REPORT, TICK, STOP, RECONNECT }

record Ev(long at, long seq, Kind kind, int arg) {}

final class VirtualClock {
    private final PriorityQueue<Ev> queue =
            new PriorityQueue<>(Comparator.comparingLong(Ev::at).thenComparingLong(Ev::seq));
    private long seq = 0;

    void schedule(long at, Kind kind, int arg) {
        queue.add(new Ev(at, seq++, kind, arg));
    }

    Ev nextBefore(long limit) {
        Ev e = queue.peek();
        return e == null || e.at() >= limit ? null : queue.poll();
    }
}

final class EdgeServer {
    static final long TTL_MS = 45_000;
    static final long NEVER = Long.MIN_VALUE / 2;
    final String name;
    final TreeMap<Integer, Long> lastSignal = new TreeMap<>();
    boolean alive = true;
    long shown = 0;

    EdgeServer(String name) {
        this.name = name;
    }

    void open(int conn) {
        lastSignal.put(conn, NEVER);
    }

    void signal(int conn, long now) {
        if (lastSignal.containsKey(conn)) lastSignal.put(conn, now);
    }

    void close(int conn) {
        lastSignal.remove(conn);
    }

    long activeCount(long now) {
        return lastSignal.values().stream().filter(t -> now - t <= TTL_MS).count();
    }

    long push(long total) {
        shown = total;
        return lastSignal.size();
    }

    List<Integer> stop() {
        alive = false;
        List<Integer> dropped = new ArrayList<>(lastSignal.keySet());
        lastSignal.clear();
        return dropped;
    }
}

final class Aggregator {
    static final long STALE_MS = 3_000;
    final long[] count;
    private final long[] reportedAt;

    Aggregator(int edges) {
        count = new long[edges];
        reportedAt = new long[edges];
        Arrays.fill(reportedAt, EdgeServer.NEVER);
    }

    void report(int edge, long n, long now) {
        count[edge] = n;
        reportedAt[edge] = now;
    }

    boolean fresh(int edge, long now) {
        return now - reportedAt[edge] <= STALE_MS;
    }

    long total(long now) {
        long sum = 0;
        for (int e = 0; e < count.length; e++) if (fresh(e, now)) sum += count[e];
        return sum;
    }
}

final class PubSub {
    long publish(long total, List<EdgeServer> subscribers) {
        long writes = 0;
        for (EdgeServer edge : subscribers) if (edge.alive) writes += edge.push(total);
        return writes;
    }
}

public final class LiveViewerCount {
    static final long HEARTBEAT_MS = 20_000;
    static final int RETRY_MAX_MS = 8_000;
    static final int VIEWERS = 4_201;

    final VirtualClock clock = new VirtualClock();
    final Rng rng = new Rng(2026);
    final List<EdgeServer> edges = List.of(new EdgeServer("a"), new EdgeServer("b"), new EdgeServer("c"));
    final Aggregator aggregator = new Aggregator(edges.size());
    final PubSub pubsub = new PubSub();
    final int[] edgeOf = new int[VIEWERS + 1];
    final int[] retryOf = new int[VIEWERS + 1];
    final boolean[] playing = new boolean[VIEWERS + 1];
    int mode = 0, nextEdge = 0;
    long actual, joins, reports, publishes, sseWrites, naive, lastTotal, lastActual, lastReconnect;

    static String t(long ms) {
        return ms / 1000 + "." + ms % 1000 / 100 + "s";
    }

    void connect(int conn, long now) {
        while (!edges.get(nextEdge).alive) nextEdge = (nextEdge + 1) % edges.size();
        edgeOf[conn] = nextEdge;
        nextEdge = (nextEdge + 1) % edges.size();
        EdgeServer edge = edges.get(edgeOf[conn]);
        edge.open(conn);
        retryOf[conn] = rng.below(RETRY_MAX_MS);
        if (playing[conn]) edge.signal(conn, now);
    }

    void handle(Ev ev) {
        long now = ev.at();
        int x = ev.arg();
        switch (ev.kind()) {
            case JOIN -> {
                for (EdgeServer edge : edges) if (edge.alive) naive += edge.lastSignal.size();
                joins++;
                actual++;
                playing[x] = true;
                connect(x, now);
                clock.schedule(now + HEARTBEAT_MS, Kind.BEAT, x);
                if (mode == 1) System.out.println("t=" + t(now) + " join conn=" + x + " edge=" + edges.get(edgeOf[x]).name);
            }
            case BEAT -> {
                if (!playing[x]) return;
                if (edgeOf[x] >= 0) edges.get(edgeOf[x]).signal(x, now);
                clock.schedule(now + HEARTBEAT_MS, Kind.BEAT, x);
            }
            case CLOSE -> {
                playing[x] = false;
                actual--;
                edges.get(edgeOf[x]).close(x);
                System.out.println("t=" + t(now) + " close conn=" + x + " edge=" + edges.get(edgeOf[x]).name);
            }
            case PAUSE -> {
                EdgeServer edge = edges.get(edgeOf[x]);
                playing[x] = false;
                actual--;
                System.out.println("t=" + t(now) + " pause conn=" + x + " edge=" + edge.name
                        + " last-signal=" + t(edge.lastSignal.get(x)));
            }
            case REPORT -> {
                EdgeServer edge = edges.get(x);
                if (!edge.alive) return;
                aggregator.report(x, edge.activeCount(now), now);
                reports++;
                clock.schedule(now + 1_000, Kind.REPORT, x);
            }
            case TICK -> {
                long total = aggregator.total(now);
                publishes++;
                sseWrites += pubsub.publish(total, edges);
                if (now >= 0 && (total != lastTotal || actual != lastActual)) print(now, total);
                joins = reports = publishes = sseWrites = naive = 0;
                clock.schedule(now + 1_000, Kind.TICK, 0);
            }
            case STOP -> {
                EdgeServer edge = edges.get(x);
                List<Integer> dropped = edge.stop();
                for (int conn : dropped) {
                    edgeOf[conn] = -1;
                    clock.schedule(now + retryOf[conn], Kind.RECONNECT, conn);
                }
                System.out.println("t=" + t(now) + " stop edge=" + edge.name + " dropped=" + dropped.size()
                        + " screens-frozen-at=" + edge.shown);
            }
            case RECONNECT -> {
                connect(x, now);
                lastReconnect = now;
            }
        }
    }

    void print(long now, long total) {
        StringBuilder line = new StringBuilder("t=" + t(now) + " total=" + total + " actual=" + actual);
        if (mode == 2) {
            line.append(" joins=").append(joins).append(" reports=").append(reports).append(" publishes=").append(publishes)
                    .append(" sse-writes=").append(sseWrites).append(" naive=").append(naive);
        }
        for (int e = 0; mode == 3 && e < edges.size(); e++) {
            line.append(' ').append(edges.get(e).name).append('=')
                    .append(aggregator.fresh(e, now) ? String.valueOf(aggregator.count[e]) : "-");
        }
        System.out.println(line);
        lastTotal = total;
        lastActual = actual;
    }

    void runUntil(long limit) {
        for (Ev ev = clock.nextBefore(limit); ev != null; ev = clock.nextBefore(limit)) handle(ev);
    }

    public static void main(String[] args) {
        LiveViewerCount sim = new LiveViewerCount();
        for (int id = 1; id <= 1_200; id++) sim.clock.schedule(-20_000 + (id - 1) * 16L, Kind.JOIN, id);
        sim.clock.schedule(2_300, Kind.JOIN, 1_201);
        sim.clock.schedule(10_200, Kind.CLOSE, 1_201);
        sim.clock.schedule(12_500, Kind.PAUSE, 751);
        for (int id = 1_202; id <= VIEWERS; id++) sim.clock.schedule(60_000 + sim.rng.below(5_000), Kind.JOIN, id);
        sim.clock.schedule(80_000, Kind.STOP, 2);
        for (int e = 0; e < sim.edges.size(); e++) sim.clock.schedule(-20_000, Kind.REPORT, e);
        sim.clock.schedule(-19_500, Kind.TICK, 0);

        sim.runUntil(0);
        String[] titles = {"one join, one close, one pause", "3000 joins in 5 seconds", "edge c stops"};
        long[] ends = {60_000, 80_000, 95_000};
        for (sim.mode = 1; sim.mode <= 3; sim.mode++) {
            System.out.println("-- scenario " + sim.mode + ": " + titles[sim.mode - 1] + " --");
            sim.runUntil(ends[sim.mode - 1]);
        }
        System.out.println("last-reconnect=" + t(sim.lastReconnect));
    }
}
