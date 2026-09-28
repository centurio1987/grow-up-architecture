import java.util.List;

record Reading(String station, int tempTenths, int humidity) {
}

abstract class ObservationIngest {
    private static final int TEMP_MIN = -600;
    private static final int TEMP_MAX = 600;
    private static final int HUM_MIN = 0;
    private static final int HUM_MAX = 100;

    private final String label;

    protected ObservationIngest(String label) {
        this.label = label;
    }

    final void ingest(List<String> lines) {
        int rows = 0;
        int kept = 0;
        int dropped = 0;
        int sum = 0;
        int max = 0;
        String station = "-";
        for (String line : lines) {
            if (isHeader(line)) {
                continue;
            }
            rows++;
            Reading reading = parseLine(line);
            if (reading.tempTenths() < TEMP_MIN || reading.tempTenths() > TEMP_MAX
                    || reading.humidity() < HUM_MIN || reading.humidity() > HUM_MAX) {
                dropped++;
                continue;
            }
            if (kept == 0) {
                station = reading.station();
                max = reading.tempTenths();
            }
            kept++;
            sum += reading.tempTenths();
            if (reading.tempTenths() > max) {
                max = reading.tempTenths();
            }
        }
        int avg = kept == 0 ? 0 : sum / kept;
        System.out.println("[" + label + "] " + station + " rows " + rows + " kept " + kept
                + " dropped " + dropped + " avg " + avg + " max " + max);
        String note = droppedNote(dropped);
        if (!note.isEmpty()) {
            System.out.println("[" + label + "] warn dropped " + dropped + " - " + note);
        }
    }

    protected abstract boolean isHeader(String line);

    protected abstract Reading parseLine(String line);

    protected String droppedNote(int dropped) {
        return "";
    }
}

final class CsvIngest extends ObservationIngest {
    CsvIngest() {
        super("csv");
    }

    @Override
    protected boolean isHeader(String line) {
        return line.startsWith("date,");
    }

    @Override
    protected Reading parseLine(String line) {
        String[] field = line.split(",");
        return new Reading(field[1], Integer.parseInt(field[2]), Integer.parseInt(field[3]));
    }
}

final class FixedWidthIngest extends ObservationIngest {
    FixedWidthIngest() {
        super("fixed");
    }

    @Override
    protected boolean isHeader(String line) {
        return line.startsWith("DATE");
    }

    @Override
    protected Reading parseLine(String line) {
        return new Reading(line.substring(8, 13).trim(),
                Integer.parseInt(line.substring(13, 17).trim()),
                Integer.parseInt(line.substring(17, 20).trim()));
    }

    @Override
    protected String droppedNote(int dropped) {
        return dropped == 0 ? "" : "check column offsets";
    }
}

final class KeyValueIngest extends ObservationIngest {
    KeyValueIngest() {
        super("kv");
    }

    @Override
    protected boolean isHeader(String line) {
        return false;
    }

    @Override
    protected Reading parseLine(String line) {
        String station = "-";
        int temp = 0;
        int humidity = 0;
        for (String pair : line.split(";")) {
            int eq = pair.indexOf('=');
            String key = pair.substring(0, eq);
            String value = pair.substring(eq + 1);
            switch (key) {
                case "station" -> station = value;
                case "temp" -> temp = Integer.parseInt(value);
                case "hum" -> humidity = Integer.parseInt(value);
                default -> {
                }
            }
        }
        return new Reading(station, temp, humidity);
    }
}

public final class ObservationApp {
    public static void main(String[] args) {
        new CsvIngest().ingest(List.of(
                "date,station,temp,humidity",
                "2026-09-21,ST-01,184,63",
                "2026-09-21,ST-01,171,66",
                "2026-09-21,ST-01,999,70",
                "2026-09-21,ST-01,203,58"));
        new FixedWidthIngest().ingest(List.of(
                "DATE    STATNTEMPHUM",
                "20260921ST-01 179061",
                "20260921ST-01 168064",
                "20260921ST-01 182140"));
        new KeyValueIngest().ingest(List.of(
                "date=2026-09-21;station=ST-02;temp=201;hum=58",
                "date=2026-09-21;station=ST-02;temp=214;hum=55",
                "date=2026-09-21;station=ST-02;temp=171;hum=61"));
    }
}
