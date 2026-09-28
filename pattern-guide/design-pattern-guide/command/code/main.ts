class TextDocument {
  private buffer: string;

  constructor(initial: string) {
    this.buffer = initial;
  }

  insert(at: number, text: string): void {
    this.buffer = this.buffer.slice(0, at) + text + this.buffer.slice(at);
  }

  delete(at: number, length: number): void {
    this.buffer = this.buffer.slice(0, at) + this.buffer.slice(at + length);
  }

  textAt(at: number, length: number): string {
    return this.buffer.slice(at, at + length);
  }

  text(): string {
    return this.buffer;
  }
}

interface EditCommand {
  execute(): void;
  undo(): void;
}

class InsertText implements EditCommand {
  constructor(
    private readonly document: TextDocument,
    private readonly at: number,
    private readonly text: string,
  ) {}

  execute(): void {
    this.document.insert(this.at, this.text);
  }

  undo(): void {
    this.document.delete(this.at, this.text.length);
  }
}

class DeleteRange implements EditCommand {
  private removed = "";

  constructor(
    private readonly document: TextDocument,
    private readonly at: number,
    private readonly length: number,
  ) {}

  execute(): void {
    this.removed = this.document.textAt(this.at, this.length);
    this.document.delete(this.at, this.length);
  }

  undo(): void {
    this.document.insert(this.at, this.removed);
  }
}

class MacroEdit implements EditCommand {
  private readonly parts: readonly EditCommand[];

  constructor(parts: readonly EditCommand[]) {
    this.parts = [...parts];
  }

  execute(): void {
    for (const part of this.parts) {
      part.execute();
    }
  }

  undo(): void {
    for (let i = this.parts.length - 1; i >= 0; i--) {
      this.parts[i]!.undo();
    }
  }
}

class EditorSession {
  private readonly buttons = new Map<string, EditCommand>();
  private readonly history: EditCommand[] = [];

  bind(button: string, command: EditCommand): void {
    this.buttons.set(button, command);
  }

  press(button: string): void {
    const command = this.buttons.get(button);
    if (command === undefined) {
      throw new Error(`unbound button: ${button}`);
    }
    command.execute();
    this.history.push(command);
  }

  undoLast(): void {
    const command = this.history.pop();
    if (command === undefined) {
      return;
    }
    command.undo();
  }
}

function show(document: TextDocument, step: number, label: string): void {
  console.log(`${String(step).padEnd(2)} ${label.padEnd(10)} [${document.text()}]`);
}

const memo = new TextDocument("buy milk");
const session = new EditorSession();

session.bind("prefix", new InsertText(memo, 0, "TODO "));
session.bind("cut-milk", new DeleteRange(memo, 9, 4));
session.bind("swap-bread", new MacroEdit([
  new DeleteRange(memo, 9, 4),
  new InsertText(memo, 9, "bread"),
]));

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
