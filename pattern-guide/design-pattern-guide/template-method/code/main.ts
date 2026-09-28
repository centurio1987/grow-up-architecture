interface Reading {
  readonly station: string;
  readonly tempTenths: number;
  readonly humidity: number;
}

abstract class ObservationIngest {
  private static readonly TEMP_MIN = -600;
  private static readonly TEMP_MAX = 600;
  private static readonly HUM_MIN = 0;
  private static readonly HUM_MAX = 100;

  protected constructor(private readonly label: string) {}

  ingest(lines: readonly string[]): void {
    let rows = 0;
    let kept = 0;
    let dropped = 0;
    let sum = 0;
    let max = 0;
    let station = "-";
    for (const line of lines) {
      if (this.isHeader(line)) {
        continue;
      }
      rows += 1;
      const reading = this.parseLine(line);
      if (
        reading.tempTenths < ObservationIngest.TEMP_MIN ||
        reading.tempTenths > ObservationIngest.TEMP_MAX ||
        reading.humidity < ObservationIngest.HUM_MIN ||
        reading.humidity > ObservationIngest.HUM_MAX
      ) {
        dropped += 1;
        continue;
      }
      if (kept === 0) {
        station = reading.station;
        max = reading.tempTenths;
      }
      kept += 1;
      sum += reading.tempTenths;
      if (reading.tempTenths > max) {
        max = reading.tempTenths;
      }
    }
    const avg = kept === 0 ? 0 : Math.trunc(sum / kept);
    console.log(
      `[${this.label}] ${station} rows ${rows} kept ${kept} dropped ${dropped} avg ${avg} max ${max}`,
    );
    const note = this.droppedNote(dropped);
    if (note !== "") {
      console.log(`[${this.label}] warn dropped ${dropped} - ${note}`);
    }
  }

  protected abstract isHeader(line: string): boolean;

  protected abstract parseLine(line: string): Reading;

  protected droppedNote(dropped: number): string {
    return "";
  }
}

class CsvIngest extends ObservationIngest {
  constructor() {
    super("csv");
  }

  protected isHeader(line: string): boolean {
    return line.startsWith("date,");
  }

  protected parseLine(line: string): Reading {
    const field = line.split(",");
    return {
      station: field[1] ?? "-",
      tempTenths: Number.parseInt(field[2] ?? "0", 10),
      humidity: Number.parseInt(field[3] ?? "0", 10),
    };
  }
}

class FixedWidthIngest extends ObservationIngest {
  constructor() {
    super("fixed");
  }

  protected isHeader(line: string): boolean {
    return line.startsWith("DATE");
  }

  protected parseLine(line: string): Reading {
    return {
      station: line.substring(8, 13).trim(),
      tempTenths: Number.parseInt(line.substring(13, 17).trim(), 10),
      humidity: Number.parseInt(line.substring(17, 20).trim(), 10),
    };
  }

  protected override droppedNote(dropped: number): string {
    return dropped === 0 ? "" : "check column offsets";
  }
}

class KeyValueIngest extends ObservationIngest {
  constructor() {
    super("kv");
  }

  protected isHeader(_line: string): boolean {
    return false;
  }

  protected parseLine(line: string): Reading {
    let station = "-";
    let temp = 0;
    let humidity = 0;
    for (const pair of line.split(";")) {
      const eq = pair.indexOf("=");
      const key = pair.substring(0, eq);
      const value = pair.substring(eq + 1);
      if (key === "station") {
        station = value;
      } else if (key === "temp") {
        temp = Number.parseInt(value, 10);
      } else if (key === "hum") {
        humidity = Number.parseInt(value, 10);
      }
    }
    return { station, tempTenths: temp, humidity };
  }
}

new CsvIngest().ingest([
  "date,station,temp,humidity",
  "2026-09-21,ST-01,184,63",
  "2026-09-21,ST-01,171,66",
  "2026-09-21,ST-01,999,70",
  "2026-09-21,ST-01,203,58",
]);
new FixedWidthIngest().ingest([
  "DATE    STATNTEMPHUM",
  "20260921ST-01 179061",
  "20260921ST-01 168064",
  "20260921ST-01 182140",
]);
new KeyValueIngest().ingest([
  "date=2026-09-21;station=ST-02;temp=201;hum=58",
  "date=2026-09-21;station=ST-02;temp=214;hum=55",
  "date=2026-09-21;station=ST-02;temp=171;hum=61",
]);
