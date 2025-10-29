export interface KeyboardShortcutHandlers {
  undo?: () => void;
  redo?: () => void;
  delete?: () => void;
  duplicate?: () => void;
  save?: () => void;
}

export class KeyboardShortcutManager {
  private handlers: KeyboardShortcutHandlers;
  private handleKeyDown: (e: KeyboardEvent) => void;

  constructor(handlers: KeyboardShortcutHandlers) {
    this.handlers = handlers;
    this.handleKeyDown = this.createHandler();
  }

  private createHandler(): (e: KeyboardEvent) => void {
    return (e: KeyboardEvent) => {
      // Undo: Ctrl+Z
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey && this.handlers.undo) {
        e.preventDefault();
        this.handlers.undo();
      }
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      else if (
        e.ctrlKey &&
        (e.key === 'y' || (e.shiftKey && e.key === 'z')) &&
        this.handlers.redo
      ) {
        e.preventDefault();
        this.handlers.redo();
      }
      // Delete
      else if (e.key === 'Delete' && this.handlers.delete) {
        e.preventDefault();
        this.handlers.delete();
      }
      // Duplicate: Ctrl+D
      else if (e.ctrlKey && e.key === 'd' && this.handlers.duplicate) {
        e.preventDefault();
        this.handlers.duplicate();
      }
      // Save: Ctrl+S
      else if (e.ctrlKey && e.key === 's' && this.handlers.save) {
        e.preventDefault();
        this.handlers.save();
      }
    };
  }

  attach(): void {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  detach(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  updateHandlers(handlers: Partial<KeyboardShortcutHandlers>): void {
    this.handlers = { ...this.handlers, ...handlers };
  }
}
