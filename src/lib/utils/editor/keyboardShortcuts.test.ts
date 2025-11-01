import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { KeyboardShortcutManager } from './keyboardShortcuts';

describe('KeyboardShortcutManager', () => {
  let manager: KeyboardShortcutManager;
  let undoHandler: ReturnType<typeof vi.fn>;
  let redoHandler: ReturnType<typeof vi.fn>;
  let deleteHandler: ReturnType<typeof vi.fn>;
  let duplicateHandler: ReturnType<typeof vi.fn>;
  let saveHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    undoHandler = vi.fn();
    redoHandler = vi.fn();
    deleteHandler = vi.fn();
    duplicateHandler = vi.fn();
    saveHandler = vi.fn();

    manager = new KeyboardShortcutManager({
      undo: undoHandler,
      redo: redoHandler,
      delete: deleteHandler,
      duplicate: duplicateHandler,
      save: saveHandler
    });
  });

  afterEach(() => {
    manager.detach();
  });

  describe('initialization', () => {
    it('should create instance with handlers', () => {
      expect(manager).toBeDefined();
    });

    it('should work with partial handlers', () => {
      const partialManager = new KeyboardShortcutManager({
        undo: undoHandler
      });
      expect(partialManager).toBeDefined();
    });
  });

  describe('undo shortcut (Ctrl+Z)', () => {
    it('should call undo handler on Ctrl+Z', () => {
      manager.attach();

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        shiftKey: false
      });
      document.dispatchEvent(event);

      expect(undoHandler).toHaveBeenCalledTimes(1);
    });

    it('should prevent default on Ctrl+Z', () => {
      manager.attach();

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        bubbles: true,
        cancelable: true
      });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      document.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should not call undo without Ctrl key', () => {
      manager.attach();

      const event = new KeyboardEvent('keydown', { key: 'z' });
      document.dispatchEvent(event);

      expect(undoHandler).not.toHaveBeenCalled();
    });

    it('should not call undo when handler is not provided', () => {
      const noUndoManager = new KeyboardShortcutManager({
        redo: redoHandler
      });
      noUndoManager.attach();

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true
      });

      expect(() => document.dispatchEvent(event)).not.toThrow();

      noUndoManager.detach();
    });
  });

  describe('redo shortcuts (Ctrl+Y and Ctrl+Shift+Z)', () => {
    it('should call redo handler on Ctrl+Y', () => {
      manager.attach();

      const event = new KeyboardEvent('keydown', {
        key: 'y',
        ctrlKey: true
      });
      document.dispatchEvent(event);

      expect(redoHandler).toHaveBeenCalledTimes(1);
    });

    it('should call redo handler on Ctrl+Shift+Z', () => {
      manager.attach();

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        shiftKey: true
      });
      document.dispatchEvent(event);

      expect(redoHandler).toHaveBeenCalledTimes(1);
    });

    it('should prevent default on redo shortcuts', () => {
      manager.attach();

      const event1 = new KeyboardEvent('keydown', {
        key: 'y',
        ctrlKey: true,
        bubbles: true,
        cancelable: true
      });
      const preventDefaultSpy1 = vi.spyOn(event1, 'preventDefault');
      document.dispatchEvent(event1);

      expect(preventDefaultSpy1).toHaveBeenCalled();

      const event2 = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
        cancelable: true
      });
      const preventDefaultSpy2 = vi.spyOn(event2, 'preventDefault');
      document.dispatchEvent(event2);

      expect(preventDefaultSpy2).toHaveBeenCalled();
    });

    it('should not trigger undo with Ctrl+Shift+Z', () => {
      manager.attach();

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        shiftKey: true
      });
      document.dispatchEvent(event);

      expect(undoHandler).not.toHaveBeenCalled();
      expect(redoHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('delete shortcut (Delete key)', () => {
    it('should call delete handler on Delete key', () => {
      manager.attach();

      const event = new KeyboardEvent('keydown', { key: 'Delete' });
      document.dispatchEvent(event);

      expect(deleteHandler).toHaveBeenCalledTimes(1);
    });

    it('should prevent default on Delete', () => {
      manager.attach();

      const event = new KeyboardEvent('keydown', {
        key: 'Delete',
        bubbles: true,
        cancelable: true
      });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      document.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('duplicate shortcut (Ctrl+D)', () => {
    it('should call duplicate handler on Ctrl+D', () => {
      manager.attach();

      const event = new KeyboardEvent('keydown', {
        key: 'd',
        ctrlKey: true
      });
      document.dispatchEvent(event);

      expect(duplicateHandler).toHaveBeenCalledTimes(1);
    });

    it('should prevent default on Ctrl+D', () => {
      manager.attach();

      const event = new KeyboardEvent('keydown', {
        key: 'd',
        ctrlKey: true,
        bubbles: true,
        cancelable: true
      });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      document.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('save shortcut (Ctrl+S)', () => {
    it('should call save handler on Ctrl+S', () => {
      manager.attach();

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true
      });
      document.dispatchEvent(event);

      expect(saveHandler).toHaveBeenCalledTimes(1);
    });

    it('should prevent default on Ctrl+S', () => {
      manager.attach();

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
        cancelable: true
      });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      document.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('attach and detach', () => {
    it('should not trigger handlers before attach', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true
      });
      document.dispatchEvent(event);

      expect(undoHandler).not.toHaveBeenCalled();
    });

    it('should trigger handlers after attach', () => {
      manager.attach();

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true
      });
      document.dispatchEvent(event);

      expect(undoHandler).toHaveBeenCalledTimes(1);
    });

    it('should not trigger handlers after detach', () => {
      manager.attach();
      manager.detach();

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true
      });
      document.dispatchEvent(event);

      expect(undoHandler).not.toHaveBeenCalled();
    });

    it('should allow re-attach after detach', () => {
      manager.attach();
      manager.detach();
      manager.attach();

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true
      });
      document.dispatchEvent(event);

      expect(undoHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateHandlers', () => {
    it('should update specific handlers', () => {
      manager.attach();

      const newUndoHandler = vi.fn();
      manager.updateHandlers({ undo: newUndoHandler });

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true
      });
      document.dispatchEvent(event);

      expect(newUndoHandler).toHaveBeenCalledTimes(1);
      expect(undoHandler).not.toHaveBeenCalled();
    });

    it('should preserve other handlers when updating', () => {
      manager.attach();

      const newUndoHandler = vi.fn();
      manager.updateHandlers({ undo: newUndoHandler });

      const redoEvent = new KeyboardEvent('keydown', {
        key: 'y',
        ctrlKey: true
      });
      document.dispatchEvent(redoEvent);

      expect(redoHandler).toHaveBeenCalledTimes(1);
    });

    it('should update multiple handlers at once', () => {
      manager.attach();

      const newUndoHandler = vi.fn();
      const newRedoHandler = vi.fn();
      manager.updateHandlers({
        undo: newUndoHandler,
        redo: newRedoHandler
      });

      const undoEvent = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true
      });
      document.dispatchEvent(undoEvent);

      const redoEvent = new KeyboardEvent('keydown', {
        key: 'y',
        ctrlKey: true
      });
      document.dispatchEvent(redoEvent);

      expect(newUndoHandler).toHaveBeenCalledTimes(1);
      expect(newRedoHandler).toHaveBeenCalledTimes(1);
      expect(undoHandler).not.toHaveBeenCalled();
      expect(redoHandler).not.toHaveBeenCalled();
    });
  });

  describe('multiple shortcuts', () => {
    it('should handle different shortcuts in sequence', () => {
      manager.attach();

      const undoEvent = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true
      });
      document.dispatchEvent(undoEvent);

      const redoEvent = new KeyboardEvent('keydown', {
        key: 'y',
        ctrlKey: true
      });
      document.dispatchEvent(redoEvent);

      const saveEvent = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true
      });
      document.dispatchEvent(saveEvent);

      expect(undoHandler).toHaveBeenCalledTimes(1);
      expect(redoHandler).toHaveBeenCalledTimes(1);
      expect(saveHandler).toHaveBeenCalledTimes(1);
    });

    it('should not interfere with unrelated key presses', () => {
      manager.attach();

      // Random keys that shouldn't trigger shortcuts
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(undoHandler).not.toHaveBeenCalled();
      expect(redoHandler).not.toHaveBeenCalled();
      expect(deleteHandler).not.toHaveBeenCalled();
      expect(duplicateHandler).not.toHaveBeenCalled();
      expect(saveHandler).not.toHaveBeenCalled();
    });
  });
});
