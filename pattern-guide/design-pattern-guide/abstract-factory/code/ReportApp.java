import java.util.List;

interface Heading {
    String render();
}

interface Table {
    String render();
}

interface ReportKit {
    Heading createHeading(String text);

    Table createTable(List<String> headers, List<List<String>> rows);
}

final class MarkdownHeading implements Heading {
    private final String text;

    MarkdownHeading(String text) {
        this.text = text;
    }

    @Override
    public String render() {
        return "## " + text;
    }
}

final class MarkdownTable implements Table {
    private final List<String> headers;
    private final List<List<String>> rows;

    MarkdownTable(List<String> headers, List<List<String>> rows) {
        this.headers = headers;
        this.rows = rows;
    }

    @Override
    public String render() {
        StringBuilder out = new StringBuilder("| " + String.join(" | ", headers) + " |\n|");
        for (int i = 0; i < headers.size(); i++) {
            out.append(" --- |");
        }
        for (List<String> row : rows) {
            out.append("\n| ").append(String.join(" | ", row)).append(" |");
        }
        return out.toString();
    }
}

final class HtmlHeading implements Heading {
    private final String text;

    HtmlHeading(String text) {
        this.text = text;
    }

    @Override
    public String render() {
        return "<h2>" + text + "</h2>";
    }
}

final class HtmlTable implements Table {
    private final List<String> headers;
    private final List<List<String>> rows;

    HtmlTable(List<String> headers, List<List<String>> rows) {
        this.headers = headers;
        this.rows = rows;
    }

    @Override
    public String render() {
        StringBuilder out = new StringBuilder("<table>\n<tr>");
        for (String header : headers) {
            out.append("<th>").append(header).append("</th>");
        }
        out.append("</tr>");
        for (List<String> row : rows) {
            out.append("\n<tr>");
            for (String cell : row) {
                out.append("<td>").append(cell).append("</td>");
            }
            out.append("</tr>");
        }
        return out.append("\n</table>").toString();
    }
}

final class TextHeading implements Heading {
    private final String text;

    TextHeading(String text) {
        this.text = text;
    }

    @Override
    public String render() {
        return "== " + text + " ==";
    }
}

final class TextTable implements Table {
    private final List<String> headers;
    private final List<List<String>> rows;

    TextTable(List<String> headers, List<List<String>> rows) {
        this.headers = headers;
        this.rows = rows;
    }

    @Override
    public String render() {
        StringBuilder out = new StringBuilder("- " + String.join(" / ", headers));
        for (List<String> row : rows) {
            out.append("\n- ").append(String.join(" / ", row));
        }
        return out.toString();
    }
}

final class MarkdownKit implements ReportKit {
    @Override
    public Heading createHeading(String text) {
        return new MarkdownHeading(text);
    }

    @Override
    public Table createTable(List<String> headers, List<List<String>> rows) {
        return new MarkdownTable(headers, rows);
    }
}

final class HtmlKit implements ReportKit {
    @Override
    public Heading createHeading(String text) {
        return new HtmlHeading(text);
    }

    @Override
    public Table createTable(List<String> headers, List<List<String>> rows) {
        return new HtmlTable(headers, rows);
    }
}

final class TextKit implements ReportKit {
    @Override
    public Heading createHeading(String text) {
        return new TextHeading(text);
    }

    @Override
    public Table createTable(List<String> headers, List<List<String>> rows) {
        return new TextTable(headers, rows);
    }
}

final class ReportWriter {
    private final ReportKit kit;

    ReportWriter(ReportKit kit) {
        this.kit = kit;
    }

    String write(String title, List<String> headers, List<List<String>> rows) {
        Heading heading = kit.createHeading(title);
        Table table = kit.createTable(headers, rows);
        return heading.render() + "\n" + table.render();
    }
}

public class ReportApp {
    static ReportKit chooseKit(String format) {
        return switch (format) {
            case "markdown" -> new MarkdownKit();
            case "html" -> new HtmlKit();
            case "text" -> new TextKit();
            default -> throw new IllegalArgumentException("unknown format: " + format);
        };
    }

    public static void main(String[] args) {
        String title = "2026년 3월 매출 요약";
        List<String> headers = List.of("상품", "수량", "매출");
        List<List<String>> rows = List.of(
                List.of("공책", "120", "360000"),
                List.of("연필", "300", "150000"));

        for (String format : List.of("markdown", "html", "text")) {
            ReportWriter writer = new ReportWriter(chooseKit(format));
            System.out.println("--- " + format + " ---");
            System.out.println(writer.write(title, headers, rows));
        }
    }
}
