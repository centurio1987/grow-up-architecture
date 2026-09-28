const TEMP_MIN: i32 = -600;
const TEMP_MAX: i32 = 600;
const HUM_MIN: i32 = 0;
const HUM_MAX: i32 = 100;

struct Reading {
    station: String,
    temp_tenths: i32,
    humidity: i32,
}

trait ObservationIngest {
    fn label(&self) -> &str;

    fn is_header(&self, line: &str) -> bool;

    fn parse_line(&self, line: &str) -> Reading;

    fn dropped_note(&self, _dropped: i32) -> String {
        String::new()
    }

    fn ingest(&self, lines: &[&str]) {
        let mut rows = 0;
        let mut kept = 0;
        let mut dropped = 0;
        let mut sum = 0;
        let mut max = 0;
        let mut station = String::from("-");
        for line in lines {
            if self.is_header(line) {
                continue;
            }
            rows += 1;
            let reading = self.parse_line(line);
            if reading.temp_tenths < TEMP_MIN
                || reading.temp_tenths > TEMP_MAX
                || reading.humidity < HUM_MIN
                || reading.humidity > HUM_MAX
            {
                dropped += 1;
                continue;
            }
            if kept == 0 {
                station = reading.station.clone();
                max = reading.temp_tenths;
            }
            kept += 1;
            sum += reading.temp_tenths;
            if reading.temp_tenths > max {
                max = reading.temp_tenths;
            }
        }
        let avg = if kept == 0 { 0 } else { sum / kept };
        println!(
            "[{}] {} rows {} kept {} dropped {} avg {} max {}",
            self.label(),
            station,
            rows,
            kept,
            dropped,
            avg,
            max
        );
        let note = self.dropped_note(dropped);
        if !note.is_empty() {
            println!("[{}] warn dropped {} - {}", self.label(), dropped, note);
        }
    }
}

struct CsvIngest;

impl ObservationIngest for CsvIngest {
    fn label(&self) -> &str {
        "csv"
    }

    fn is_header(&self, line: &str) -> bool {
        line.starts_with("date,")
    }

    fn parse_line(&self, line: &str) -> Reading {
        let field: Vec<&str> = line.split(',').collect();
        Reading {
            station: field[1].to_string(),
            temp_tenths: field[2].parse().unwrap(),
            humidity: field[3].parse().unwrap(),
        }
    }
}

struct FixedWidthIngest;

impl ObservationIngest for FixedWidthIngest {
    fn label(&self) -> &str {
        "fixed"
    }

    fn is_header(&self, line: &str) -> bool {
        line.starts_with("DATE")
    }

    fn parse_line(&self, line: &str) -> Reading {
        Reading {
            station: line[8..13].trim().to_string(),
            temp_tenths: line[13..17].trim().parse().unwrap(),
            humidity: line[17..20].trim().parse().unwrap(),
        }
    }

    fn dropped_note(&self, dropped: i32) -> String {
        if dropped == 0 {
            String::new()
        } else {
            String::from("check column offsets")
        }
    }
}

struct KeyValueIngest;

impl ObservationIngest for KeyValueIngest {
    fn label(&self) -> &str {
        "kv"
    }

    fn is_header(&self, _line: &str) -> bool {
        false
    }

    fn parse_line(&self, line: &str) -> Reading {
        let mut station = String::from("-");
        let mut temp = 0;
        let mut humidity = 0;
        for pair in line.split(';') {
            let eq = pair.find('=').unwrap();
            let key = &pair[..eq];
            let value = &pair[eq + 1..];
            match key {
                "station" => station = value.to_string(),
                "temp" => temp = value.parse().unwrap(),
                "hum" => humidity = value.parse().unwrap(),
                _ => {}
            }
        }
        Reading {
            station,
            temp_tenths: temp,
            humidity,
        }
    }
}

fn main() {
    CsvIngest.ingest(&[
        "date,station,temp,humidity",
        "2026-09-21,ST-01,184,63",
        "2026-09-21,ST-01,171,66",
        "2026-09-21,ST-01,999,70",
        "2026-09-21,ST-01,203,58",
    ]);
    FixedWidthIngest.ingest(&[
        "DATE    STATNTEMPHUM",
        "20260921ST-01 179061",
        "20260921ST-01 168064",
        "20260921ST-01 182140",
    ]);
    KeyValueIngest.ingest(&[
        "date=2026-09-21;station=ST-02;temp=201;hum=58",
        "date=2026-09-21;station=ST-02;temp=214;hum=55",
        "date=2026-09-21;station=ST-02;temp=171;hum=61",
    ]);
}
