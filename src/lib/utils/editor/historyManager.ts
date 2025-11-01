import type { PageWidget } from '$lib/types/pages';

const MAX_HISTORY = 9001;

export interface HistoryEntry {
  widgets: PageWidget[];
  timestamp: number;
  description?: string;
}

export class HistoryManager {
  private history: HistoryEntry[] = [];
  private historyIndex = -1;

  constructor(initialState: PageWidget[]) {
    this.saveState(initialState);
  }

  saveState(widgets: PageWidget[], description?: string): void {
    // Remove any history after current index
    this.history = this.history.slice(0, this.historyIndex + 1);

    // Add current state
    this.history.push({
      widgets: JSON.parse(JSON.stringify(widgets)),
      timestamp: Date.now(),
      description
    });

    // Limit history size
    if (this.history.length > MAX_HISTORY) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
  }

  undo(): PageWidget[] | null {
    if (this.canUndo()) {
      this.historyIndex--;
      return JSON.parse(JSON.stringify(this.history[this.historyIndex].widgets));
    }
    return null;
  }

  redo(): PageWidget[] | null {
    if (this.canRedo()) {
      this.historyIndex++;
      return JSON.parse(JSON.stringify(this.history[this.historyIndex].widgets));
    }
    return null;
  }

  jumpToState(index: number): PageWidget[] | null {
    if (index >= 0 && index < this.history.length) {
      this.historyIndex = index;
      return JSON.parse(JSON.stringify(this.history[this.historyIndex].widgets));
    }
    return null;
  }

  canUndo(): boolean {
    return this.historyIndex > 0;
  }

  canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  getHistory(): HistoryEntry[] {
    return this.history;
  }

  getCurrentIndex(): number {
    return this.historyIndex;
  }

  getUndoHistory(): HistoryEntry[] {
    return this.history.slice(0, this.historyIndex + 1).reverse();
  }

  getRedoHistory(): HistoryEntry[] {
    return this.history.slice(this.historyIndex + 1);
  }

  reset(newState: PageWidget[]): void {
    this.history = [
      {
        widgets: JSON.parse(JSON.stringify(newState)),
        timestamp: Date.now()
      }
    ];
    this.historyIndex = 0;
  }
}
