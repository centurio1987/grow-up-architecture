trait Heading {
    fn render(&self) -> String;
}

trait Table {
    fn render(&self) -> String;
}

trait ReportKit {
    fn create_heading(&self, text: &str) -> Box<dyn Heading>;
    fn create_table(&self, headers: &[String], rows: &[Vec<String>]) -> Box<dyn Table>;
}

struct MarkdownHeading {
    text: String,
}

impl Heading for MarkdownHeading {
    fn render(&self) -> String {
        format!("## {}", self.text)
    }
}

struct MarkdownTable {
    headers: Vec<String>,
    rows: Vec<Vec<String>>,
}

impl Table for MarkdownTable {
    fn render(&self) -> String {
        let mut lines = vec![
            format!("| {} |", self.headers.join(" | ")),
            format!("| {} |", vec!["---"; self.headers.len()].join(" | ")),
        ];
        for row in &self.rows {
            lines.push(format!("| {} |", row.join(" | ")));
        }
        lines.join("\n")
    }
}

struct HtmlHeading {
    text: String,
}

impl Heading for HtmlHeading {
    fn render(&self) -> String {
        format!("<h2>{}</h2>", self.text)
    }
}

struct HtmlTable {
    headers: Vec<String>,
    rows: Vec<Vec<String>>,
}

impl Table for HtmlTable {
    fn render(&self) -> String {
        let cells: Vec<String> = self.headers.iter().map(|h| format!("<th>{}</th>", h)).collect();
        let mut lines = vec![String::from("<table>"), format!("<tr>{}</tr>", cells.concat())];
        for row in &self.rows {
            let cells: Vec<String> = row.iter().map(|c| format!("<td>{}</td>", c)).collect();
            lines.push(format!("<tr>{}</tr>", cells.concat()));
        }
        lines.push(String::from("</table>"));
        lines.join("\n")
    }
}

struct TextHeading {
    text: String,
}

impl Heading for TextHeading {
    fn render(&self) -> String {
        format!("== {} ==", self.text)
    }
}

struct TextTable {
    headers: Vec<String>,
    rows: Vec<Vec<String>>,
}

impl Table for TextTable {
    fn render(&self) -> String {
        let mut lines = vec![format!("- {}", self.headers.join(" / "))];
        for row in &self.rows {
            lines.push(format!("- {}", row.join(" / ")));
        }
        lines.join("\n")
    }
}

struct MarkdownKit;

impl ReportKit for MarkdownKit {
    fn create_heading(&self, text: &str) -> Box<dyn Heading> {
        Box::new(MarkdownHeading { text: text.to_string() })
    }

    fn create_table(&self, headers: &[String], rows: &[Vec<String>]) -> Box<dyn Table> {
        Box::new(MarkdownTable { headers: headers.to_vec(), rows: rows.to_vec() })
    }
}

struct HtmlKit;

impl ReportKit for HtmlKit {
    fn create_heading(&self, text: &str) -> Box<dyn Heading> {
        Box::new(HtmlHeading { text: text.to_string() })
    }

    fn create_table(&self, headers: &[String], rows: &[Vec<String>]) -> Box<dyn Table> {
        Box::new(HtmlTable { headers: headers.to_vec(), rows: rows.to_vec() })
    }
}

struct TextKit;

impl ReportKit for TextKit {
    fn create_heading(&self, text: &str) -> Box<dyn Heading> {
        Box::new(TextHeading { text: text.to_string() })
    }

    fn create_table(&self, headers: &[String], rows: &[Vec<String>]) -> Box<dyn Table> {
        Box::new(TextTable { headers: headers.to_vec(), rows: rows.to_vec() })
    }
}

struct ReportWriter {
    kit: Box<dyn ReportKit>,
}

impl ReportWriter {
    fn new(kit: Box<dyn ReportKit>) -> Self {
        ReportWriter { kit }
    }

    fn write(&self, title: &str, headers: &[String], rows: &[Vec<String>]) -> String {
        let heading = self.kit.create_heading(title);
        let table = self.kit.create_table(headers, rows);
        format!("{}\n{}", heading.render(), table.render())
    }
}

fn choose_kit(format: &str) -> Box<dyn ReportKit> {
    match format {
        "markdown" => Box::new(MarkdownKit),
        "html" => Box::new(HtmlKit),
        "text" => Box::new(TextKit),
        other => panic!("unknown format: {}", other),
    }
}

fn main() {
    let title = "2026년 3월 매출 요약";
    let headers: Vec<String> = ["상품", "수량", "매출"].iter().map(|s| s.to_string()).collect();
    let rows: Vec<Vec<String>> = [["공책", "120", "360000"], ["연필", "300", "150000"]]
        .iter()
        .map(|row| row.iter().map(|s| s.to_string()).collect())
        .collect();

    for format in ["markdown", "html", "text"] {
        let writer = ReportWriter::new(choose_kit(format));
        println!("--- {} ---", format);
        println!("{}", writer.write(title, &headers, &rows));
    }
}
