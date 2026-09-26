interface Heading {
  render(): string;
}

interface Table {
  render(): string;
}

interface ReportKit {
  createHeading(text: string): Heading;
  createTable(headers: string[], rows: string[][]): Table;
}

class MarkdownHeading implements Heading {
  constructor(private readonly text: string) {}

  render(): string {
    return `## ${this.text}`;
  }
}

class MarkdownTable implements Table {
  constructor(
    private readonly headers: string[],
    private readonly rows: string[][],
  ) {}

  render(): string {
    const head = `| ${this.headers.join(" | ")} |`;
    const rule = `| ${this.headers.map(() => "---").join(" | ")} |`;
    const body = this.rows.map((row) => `| ${row.join(" | ")} |`);
    return [head, rule, ...body].join("\n");
  }
}

class HtmlHeading implements Heading {
  constructor(private readonly text: string) {}

  render(): string {
    return `<h2>${this.text}</h2>`;
  }
}

class HtmlTable implements Table {
  constructor(
    private readonly headers: string[],
    private readonly rows: string[][],
  ) {}

  render(): string {
    const head = `<tr>${this.headers.map((header) => `<th>${header}</th>`).join("")}</tr>`;
    const body = this.rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`);
    return ["<table>", head, ...body, "</table>"].join("\n");
  }
}

class TextHeading implements Heading {
  constructor(private readonly text: string) {}

  render(): string {
    return `== ${this.text} ==`;
  }
}

class TextTable implements Table {
  constructor(
    private readonly headers: string[],
    private readonly rows: string[][],
  ) {}

  render(): string {
    const head = `- ${this.headers.join(" / ")}`;
    const body = this.rows.map((row) => `- ${row.join(" / ")}`);
    return [head, ...body].join("\n");
  }
}

class MarkdownKit implements ReportKit {
  createHeading(text: string): Heading {
    return new MarkdownHeading(text);
  }

  createTable(headers: string[], rows: string[][]): Table {
    return new MarkdownTable(headers, rows);
  }
}

class HtmlKit implements ReportKit {
  createHeading(text: string): Heading {
    return new HtmlHeading(text);
  }

  createTable(headers: string[], rows: string[][]): Table {
    return new HtmlTable(headers, rows);
  }
}

class TextKit implements ReportKit {
  createHeading(text: string): Heading {
    return new TextHeading(text);
  }

  createTable(headers: string[], rows: string[][]): Table {
    return new TextTable(headers, rows);
  }
}

class ReportWriter {
  constructor(private readonly kit: ReportKit) {}

  write(title: string, headers: string[], rows: string[][]): string {
    const heading = this.kit.createHeading(title);
    const table = this.kit.createTable(headers, rows);
    return `${heading.render()}\n${table.render()}`;
  }
}

function chooseKit(format: string): ReportKit {
  switch (format) {
    case "markdown":
      return new MarkdownKit();
    case "html":
      return new HtmlKit();
    case "text":
      return new TextKit();
    default:
      throw new Error(`unknown format: ${format}`);
  }
}

const title = "2026년 3월 매출 요약";
const headers = ["상품", "수량", "매출"];
const rows = [
  ["공책", "120", "360000"],
  ["연필", "300", "150000"],
];

for (const format of ["markdown", "html", "text"]) {
  const writer = new ReportWriter(chooseKit(format));
  console.log(`--- ${format} ---`);
  console.log(writer.write(title, headers, rows));
}
