interface ScanRecord {
  readonly id: string;
  readonly count: number;
}

interface ScanCursor {
  hasNext(): boolean;
  next(): ScanRecord;
}

abstract class ScanArchive {
  abstract oldestFirst(): ScanCursor;

  totalCount(): number {
    let sum = 0;
    const cursor = this.oldestFirst();
    while (cursor.hasNext()) {
      sum += cursor.next().count;
    }
    return sum;
  }
}

class RingScanLog extends ScanArchive {
  private readonly slots: (ScanRecord | undefined)[];
  private written = 0;

  constructor(capacity: number) {
    super();
    this.slots = new Array<ScanRecord | undefined>(capacity).fill(undefined);
  }

  add(record: ScanRecord): void {
    this.slots[this.written % this.slots.length] = record;
    this.written += 1;
  }

  size(): number {
    return Math.min(this.written, this.slots.length);
  }

  at(logical: number): ScanRecord {
    const start = this.written <= this.slots.length ? 0 : this.written % this.slots.length;
    const record = this.slots[(start + logical) % this.slots.length];
    if (record === undefined) {
      throw new Error("empty slot");
    }
    return record;
  }

  oldestFirst(): ScanCursor {
    return new OldestFirst(this);
  }

  newestFirst(): ScanCursor {
    return new NewestFirst(this);
  }
}

class OldestFirst implements ScanCursor {
  private step = 0;

  constructor(private readonly log: RingScanLog) {}

  hasNext(): boolean {
    return this.step < this.log.size();
  }

  next(): ScanRecord {
    return this.log.at(this.step++);
  }
}

class NewestFirst implements ScanCursor {
  private step = 0;

  constructor(private readonly log: RingScanLog) {}

  hasNext(): boolean {
    return this.step < this.log.size();
  }

  next(): ScanRecord {
    return this.log.at(this.log.size() - 1 - this.step++);
  }
}

class ChainNode {
  next: ChainNode | undefined = undefined;

  constructor(readonly record: ScanRecord) {}
}

class ChainScanLog extends ScanArchive {
  private head: ChainNode | undefined = undefined;

  add(record: ScanRecord): void {
    const node = new ChainNode(record);
    if (this.head === undefined) {
      this.head = node;
      return;
    }
    let last = this.head;
    while (last.next !== undefined) {
      last = last.next;
    }
    last.next = node;
  }

  firstNode(): ChainNode | undefined {
    return this.head;
  }

  oldestFirst(): ScanCursor {
    return new FromHead(this);
  }
}

class FromHead implements ScanCursor {
  private at: ChainNode | undefined;

  constructor(log: ChainScanLog) {
    this.at = log.firstNode();
  }

  hasNext(): boolean {
    return this.at !== undefined;
  }

  next(): ScanRecord {
    if (this.at === undefined) {
      throw new Error("no node");
    }
    const record = this.at.record;
    this.at = this.at.next;
    return record;
  }
}

function walk(cursor: ScanCursor): string {
  const ids: string[] = [];
  while (cursor.hasNext()) {
    ids.push(cursor.next().id);
  }
  return ids.join(" ");
}

function pair(left: ScanCursor, right: ScanCursor): string {
  const pairs: string[] = [];
  while (left.hasNext() && right.hasNext()) {
    pairs.push(`${left.next().id}/${right.next().id}`);
  }
  return pairs.join(" ");
}

const feed: ScanRecord[] = [
  { id: "SCN-01", count: 12 },
  { id: "SCN-02", count: 30 },
  { id: "SCN-03", count: 7 },
  { id: "SCN-04", count: 21 },
  { id: "SCN-05", count: 9 },
  { id: "SCN-06", count: 15 },
  { id: "SCN-07", count: 4 },
];

const ring = new RingScanLog(5);
const chain = new ChainScanLog();
for (const record of feed) {
  ring.add(record);
  chain.add(record);
}

console.log(`ring oldest-first: ${walk(ring.oldestFirst())}`);
console.log(`ring newest-first: ${walk(ring.newestFirst())}`);
console.log(`ring paired: ${pair(ring.oldestFirst(), ring.newestFirst())}`);
console.log(`chain oldest-first: ${walk(chain.oldestFirst())}`);
console.log(`total: ring=${ring.totalCount()} chain=${chain.totalCount()}`);
