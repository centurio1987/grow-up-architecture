import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

final class TextDocument {
    private final StringBuilder buffer;

    TextDocument(String initial) {
        this.buffer = new StringBuilder(initial);
    }

    void insert(int at, String text) {
        buffer.insert(at, text);
    }

    void delete(int at, int length) {
        buffer.delete(at, at + length);
    }

    String textAt(int at, int length) {
        return buffer.substring(at, at + length);
    }

    String text() {
        return buffer.toString();
    }
}

interface EditCommand {
    void execute();

    void undo();
}

final class InsertText implements EditCommand {
    private final TextDocument document;
    private final int at;
    private final String text;

    InsertText(TextDocument document, int at, String text) {
        this.document = document;
        this.at = at;
        this.text = text;
    }

    @Override
    public void execute() {
        document.insert(at, text);
    }

    @Override
    public void undo() {
        document.delete(at, text.length());
    }
}

final class DeleteRange implements EditCommand {
    private final TextDocument document;
    private final int at;
    private final int length;
    private String removed = "";

    DeleteRange(TextDocument document, int at, int length) {
        this.document = document;
        this.at = at;
        this.length = length;
    }

    @Override
    public void execute() {
        removed = document.textAt(at, length);
        document.delete(at, length);
    }

    @Override
    public void undo() {
        document.insert(at, removed);
    }
}

final class MacroEdit implements EditCommand {
    private final List<EditCommand> parts;

    MacroEdit(List<EditCommand> parts) {
        this.parts = List.copyOf(parts);
    }

    @Override
    public void execute() {
        for (EditCommand part : parts) {
            part.execute();
        }
    }

    @Override
    public void undo() {
        for (int i = parts.size() - 1; i >= 0; i--) {
            parts.get(i).undo();
        }
    }
}

final class EditorSession {
    private final Map<String, EditCommand> buttons = new HashMap<>();
    private final List<EditCommand> history = new ArrayList<>();

    void bind(String button, EditCommand command) {
        buttons.put(button, command);
    }

    void press(String button) {
        EditCommand command = buttons.get(button);
        if (command == null) {
            throw new IllegalArgumentException("unbound button: " + button);
        }
        command.execute();
        history.add(command);
    }

    void undoLast() {
        if (history.isEmpty()) {
            return;
        }
        history.remove(history.size() - 1).undo();
    }
}

public final class MemoEditorApp {
    private static void show(TextDocument document, int step, String label) {
        System.out.printf("%-2d %-10s [%s]%n", step, label, document.text());
    }

    public static void main(String[] args) {
        TextDocument memo = new TextDocument("buy milk");
        EditorSession session = new EditorSession();

        session.bind("prefix", new InsertText(memo, 0, "TODO "));
        session.bind("cut-milk", new DeleteRange(memo, 9, 4));
        session.bind("swap-bread", new MacroEdit(List.of(
                new DeleteRange(memo, 9, 4),
                new InsertText(memo, 9, "bread"))));

        session.press("prefix");
        show(memo, 1, "prefix");
        session.press("cut-milk");
        show(memo, 2, "cut-milk");
        session.undoLast();
        show(memo, 3, "undo");
        session.undoLast();
        show(memo, 4, "undo");

        session.press("prefix");
        show(memo, 5, "prefix");
        session.press("swap-bread");
        show(memo, 6, "swap-bread");
        session.press("swap-bread");
        show(memo, 7, "swap-bread");
        session.undoLast();
        show(memo, 8, "undo");
        session.undoLast();
        show(memo, 9, "undo");
        session.undoLast();
        show(memo, 10, "undo");
    }
}
