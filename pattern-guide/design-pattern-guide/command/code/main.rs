use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;

struct TextDocument {
    buffer: String,
}

impl TextDocument {
    fn new(initial: &str) -> Self {
        Self { buffer: initial.to_string() }
    }

    fn insert(&mut self, at: usize, text: &str) {
        self.buffer.insert_str(at, text);
    }

    fn delete(&mut self, at: usize, length: usize) {
        self.buffer.replace_range(at..at + length, "");
    }

    fn text_at(&self, at: usize, length: usize) -> String {
        self.buffer[at..at + length].to_string()
    }

    fn text(&self) -> String {
        self.buffer.clone()
    }
}

trait EditCommand {
    fn execute(&mut self);

    fn undo(&mut self);
}

struct InsertText {
    document: Rc<RefCell<TextDocument>>,
    at: usize,
    text: String,
}

impl InsertText {
    fn new(document: &Rc<RefCell<TextDocument>>, at: usize, text: &str) -> Self {
        Self { document: Rc::clone(document), at, text: text.to_string() }
    }
}

impl EditCommand for InsertText {
    fn execute(&mut self) {
        self.document.borrow_mut().insert(self.at, &self.text);
    }

    fn undo(&mut self) {
        self.document.borrow_mut().delete(self.at, self.text.len());
    }
}

struct DeleteRange {
    document: Rc<RefCell<TextDocument>>,
    at: usize,
    length: usize,
    removed: String,
}

impl DeleteRange {
    fn new(document: &Rc<RefCell<TextDocument>>, at: usize, length: usize) -> Self {
        Self { document: Rc::clone(document), at, length, removed: String::new() }
    }
}

impl EditCommand for DeleteRange {
    fn execute(&mut self) {
        self.removed = self.document.borrow().text_at(self.at, self.length);
        self.document.borrow_mut().delete(self.at, self.length);
    }

    fn undo(&mut self) {
        self.document.borrow_mut().insert(self.at, &self.removed);
    }
}

struct MacroEdit {
    parts: Vec<Rc<RefCell<dyn EditCommand>>>,
}

impl MacroEdit {
    fn new(parts: Vec<Rc<RefCell<dyn EditCommand>>>) -> Self {
        Self { parts }
    }
}

impl EditCommand for MacroEdit {
    fn execute(&mut self) {
        for part in &self.parts {
            part.borrow_mut().execute();
        }
    }

    fn undo(&mut self) {
        for part in self.parts.iter().rev() {
            part.borrow_mut().undo();
        }
    }
}

struct EditorSession {
    buttons: HashMap<String, Rc<RefCell<dyn EditCommand>>>,
    history: Vec<Rc<RefCell<dyn EditCommand>>>,
}

impl EditorSession {
    fn new() -> Self {
        Self { buttons: HashMap::new(), history: Vec::new() }
    }

    fn bind(&mut self, button: &str, command: Rc<RefCell<dyn EditCommand>>) {
        self.buttons.insert(button.to_string(), command);
    }

    fn press(&mut self, button: &str) {
        let command = match self.buttons.get(button) {
            Some(found) => Rc::clone(found),
            None => panic!("unbound button: {button}"),
        };
        command.borrow_mut().execute();
        self.history.push(command);
    }

    fn undo_last(&mut self) {
        if let Some(command) = self.history.pop() {
            command.borrow_mut().undo();
        }
    }
}

fn show(document: &Rc<RefCell<TextDocument>>, step: usize, label: &str) {
    println!("{:<2} {:<10} [{}]", step, label, document.borrow().text());
}

fn main() {
    let memo = Rc::new(RefCell::new(TextDocument::new("buy milk")));
    let mut session = EditorSession::new();

    session.bind("prefix", Rc::new(RefCell::new(InsertText::new(&memo, 0, "TODO "))));
    session.bind("cut-milk", Rc::new(RefCell::new(DeleteRange::new(&memo, 9, 4))));
    let parts: Vec<Rc<RefCell<dyn EditCommand>>> = vec![
        Rc::new(RefCell::new(DeleteRange::new(&memo, 9, 4))),
        Rc::new(RefCell::new(InsertText::new(&memo, 9, "bread"))),
    ];
    session.bind("swap-bread", Rc::new(RefCell::new(MacroEdit::new(parts))));

    session.press("prefix");
    show(&memo, 1, "prefix");
    session.press("cut-milk");
    show(&memo, 2, "cut-milk");
    session.undo_last();
    show(&memo, 3, "undo");
    session.undo_last();
    show(&memo, 4, "undo");

    session.press("prefix");
    show(&memo, 5, "prefix");
    session.press("swap-bread");
    show(&memo, 6, "swap-bread");
    session.press("swap-bread");
    show(&memo, 7, "swap-bread");
    session.undo_last();
    show(&memo, 8, "undo");
    session.undo_last();
    show(&memo, 9, "undo");
    session.undo_last();
    show(&memo, 10, "undo");
}
