import type { PageWidget } from '$lib/types/pages';

const MAX_HISTORY = 50;

export class HistoryManager {
  private history: PageWidget[][] = [];
  private historyIndex = -1;

  constructor(initialState: PageWidget[]) {
    this.saveState(initialState);
  }

  saveState(widgets: PageWidget[]): void {
    // Remove any history after current index
    this.history = this.history.slice(0, this.historyIndex + 1);

    // Add current state
    this.history.push(JSON.parse(JSON.stringify(widgets)));

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
      return JSON.parse(JSON.stringify(this.history[this.historyIndex]));
    }
    return null;
  }

  redo(): PageWidget[] | null {
    if (this.canRedo()) {
      this.historyIndex++;
      return JSON.parse(JSON.stringify(this.history[this.historyIndex]));
    }
    return null;
  }

  canUndo(): boolean {
    return this.historyIndex > 0;
  }

  canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  reset(newState: PageWidget[]): void {
    this.history = [JSON.parse(JSON.stringify(newState))];
    this.historyIndex = 0;
  }
}
