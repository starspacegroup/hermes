import { describe, it, expect, beforeEach } from 'vitest';
import { HistoryManager } from './historyManager';
import type { PageWidget } from '$lib/types/pages';

describe('HistoryManager', () => {
  let historyManager: HistoryManager;
  const initialWidget: PageWidget = {
    id: 'widget-1',
    page_id: 'page-1',
    type: 'hero',
    position: 0,
    config: { title: 'Initial' },
    created_at: Date.now(),
    updated_at: Date.now()
  };

  beforeEach(() => {
    historyManager = new HistoryManager([initialWidget]);
  });

  describe('initialization', () => {
    it('should initialize with initial state', () => {
      expect(historyManager.getCurrentIndex()).toBe(0);
      expect(historyManager.getHistory().length).toBe(1);
      expect(historyManager.canUndo()).toBe(false);
      expect(historyManager.canRedo()).toBe(false);
    });
  });

  describe('saveState', () => {
    it('should save a new state', () => {
      const newWidget: PageWidget = {
        id: 'widget-2',
        page_id: 'page-1',
        type: 'text',
        position: 1,
        config: { text: 'New' },
        created_at: Date.now(),
        updated_at: Date.now()
      };

      historyManager.saveState([newWidget], 'Added text widget');

      expect(historyManager.getCurrentIndex()).toBe(1);
      expect(historyManager.getHistory().length).toBe(2);
      expect(historyManager.canUndo()).toBe(true);
      expect(historyManager.canRedo()).toBe(false);
    });

    it('should remove redo history when saving after undo', () => {
      const widget2: PageWidget = { ...initialWidget, id: 'widget-2' };
      const widget3: PageWidget = { ...initialWidget, id: 'widget-3' };

      historyManager.saveState([widget2]);
      historyManager.saveState([widget3]);

      expect(historyManager.getHistory().length).toBe(3);

      historyManager.undo();
      expect(historyManager.getCurrentIndex()).toBe(1);

      const widget4: PageWidget = { ...initialWidget, id: 'widget-4' };
      historyManager.saveState([widget4]);

      expect(historyManager.getHistory().length).toBe(3);
      expect(historyManager.getCurrentIndex()).toBe(2);
      expect(historyManager.canRedo()).toBe(false);
    });

    it('should limit history size to MAX_HISTORY', () => {
      // Save 9002 states (initial + 9001 more)
      for (let i = 1; i <= 9001; i++) {
        historyManager.saveState([{ ...initialWidget, id: `widget-${i}` }]);
      }

      expect(historyManager.getHistory().length).toBe(9001);
    });

    it('should deep clone widgets to prevent mutation', () => {
      const widget: PageWidget = {
        id: 'widget-1',
        page_id: 'page-1',
        type: 'hero',
        position: 0,
        config: { title: 'Original' },
        created_at: Date.now(),
        updated_at: Date.now()
      };

      historyManager.saveState([widget]);
      widget.config.title = 'Modified';

      const history = historyManager.getHistory();
      expect(history[history.length - 1].widgets[0].config.title).toBe('Original');
    });
  });

  describe('undo', () => {
    it('should undo to previous state', () => {
      const widget2: PageWidget = { ...initialWidget, id: 'widget-2' };
      historyManager.saveState([widget2]);

      const undoneState = historyManager.undo();

      expect(undoneState).not.toBeNull();
      expect(undoneState![0].id).toBe('widget-1');
      expect(historyManager.getCurrentIndex()).toBe(0);
      expect(historyManager.canUndo()).toBe(false);
      expect(historyManager.canRedo()).toBe(true);
    });

    it('should return null when cannot undo', () => {
      const result = historyManager.undo();
      expect(result).toBeNull();
    });

    it('should return deep cloned state', () => {
      const widget2: PageWidget = {
        id: 'widget-2',
        page_id: 'page-1',
        type: 'text',
        position: 0,
        config: { text: 'Test' },
        created_at: Date.now(),
        updated_at: Date.now()
      };
      historyManager.saveState([widget2]);

      const undoneState = historyManager.undo();
      undoneState![0].config.text = 'Modified';

      expect(historyManager.getHistory()[0].widgets[0].config.title).toBe('Initial');
    });
  });

  describe('redo', () => {
    it('should redo to next state', () => {
      const widget2: PageWidget = { ...initialWidget, id: 'widget-2' };
      historyManager.saveState([widget2]);
      historyManager.undo();

      const redoneState = historyManager.redo();

      expect(redoneState).not.toBeNull();
      expect(redoneState![0].id).toBe('widget-2');
      expect(historyManager.getCurrentIndex()).toBe(1);
      expect(historyManager.canUndo()).toBe(true);
      expect(historyManager.canRedo()).toBe(false);
    });

    it('should return null when cannot redo', () => {
      const result = historyManager.redo();
      expect(result).toBeNull();
    });

    it('should return deep cloned state', () => {
      const widget2: PageWidget = {
        id: 'widget-2',
        page_id: 'page-1',
        type: 'text',
        position: 0,
        config: { text: 'Test' },
        created_at: Date.now(),
        updated_at: Date.now()
      };
      historyManager.saveState([widget2]);
      historyManager.undo();

      const redoneState = historyManager.redo();
      redoneState![0].config.text = 'Modified';

      expect(historyManager.getHistory()[1].widgets[0].config.text).toBe('Test');
    });
  });

  describe('jumpToState', () => {
    beforeEach(() => {
      historyManager.saveState([{ ...initialWidget, id: 'widget-2' }]);
      historyManager.saveState([{ ...initialWidget, id: 'widget-3' }]);
      historyManager.saveState([{ ...initialWidget, id: 'widget-4' }]);
    });

    it('should jump to specific state by index', () => {
      const state = historyManager.jumpToState(1);

      expect(state).not.toBeNull();
      expect(state![0].id).toBe('widget-2');
      expect(historyManager.getCurrentIndex()).toBe(1);
    });

    it('should return null for invalid index', () => {
      expect(historyManager.jumpToState(-1)).toBeNull();
      expect(historyManager.jumpToState(100)).toBeNull();
    });

    it('should allow jumping forward and backward', () => {
      historyManager.jumpToState(3);
      expect(historyManager.getCurrentIndex()).toBe(3);

      historyManager.jumpToState(0);
      expect(historyManager.getCurrentIndex()).toBe(0);
    });
  });

  describe('canUndo and canRedo', () => {
    it('should correctly report undo/redo availability', () => {
      expect(historyManager.canUndo()).toBe(false);
      expect(historyManager.canRedo()).toBe(false);

      historyManager.saveState([{ ...initialWidget, id: 'widget-2' }]);
      expect(historyManager.canUndo()).toBe(true);
      expect(historyManager.canRedo()).toBe(false);

      historyManager.undo();
      expect(historyManager.canUndo()).toBe(false);
      expect(historyManager.canRedo()).toBe(true);
    });
  });

  describe('getHistory', () => {
    it('should return full history array', () => {
      historyManager.saveState([{ ...initialWidget, id: 'widget-2' }]);
      historyManager.saveState([{ ...initialWidget, id: 'widget-3' }]);

      const history = historyManager.getHistory();
      expect(history.length).toBe(3);
      expect(history[0].widgets[0].id).toBe('widget-1');
      expect(history[1].widgets[0].id).toBe('widget-2');
      expect(history[2].widgets[0].id).toBe('widget-3');
    });

    it('should include timestamps and descriptions', () => {
      historyManager.saveState([{ ...initialWidget, id: 'widget-2' }], 'Added widget');

      const history = historyManager.getHistory();
      expect(history[1].timestamp).toBeGreaterThan(0);
      expect(history[1].description).toBe('Added widget');
    });
  });

  describe('getUndoHistory', () => {
    it('should return history up to current index in reverse', () => {
      historyManager.saveState([{ ...initialWidget, id: 'widget-2' }]);
      historyManager.saveState([{ ...initialWidget, id: 'widget-3' }]);

      const undoHistory = historyManager.getUndoHistory();
      expect(undoHistory.length).toBe(3);
      expect(undoHistory[0].widgets[0].id).toBe('widget-3');
      expect(undoHistory[1].widgets[0].id).toBe('widget-2');
      expect(undoHistory[2].widgets[0].id).toBe('widget-1');
    });

    it('should update after undo', () => {
      historyManager.saveState([{ ...initialWidget, id: 'widget-2' }]);
      historyManager.saveState([{ ...initialWidget, id: 'widget-3' }]);
      historyManager.undo();

      const undoHistory = historyManager.getUndoHistory();
      expect(undoHistory.length).toBe(2);
      expect(undoHistory[0].widgets[0].id).toBe('widget-2');
    });
  });

  describe('getRedoHistory', () => {
    it('should return empty array when at latest state', () => {
      historyManager.saveState([{ ...initialWidget, id: 'widget-2' }]);

      const redoHistory = historyManager.getRedoHistory();
      expect(redoHistory.length).toBe(0);
    });

    it('should return available redo states', () => {
      historyManager.saveState([{ ...initialWidget, id: 'widget-2' }]);
      historyManager.saveState([{ ...initialWidget, id: 'widget-3' }]);
      historyManager.undo();
      historyManager.undo();

      const redoHistory = historyManager.getRedoHistory();
      expect(redoHistory.length).toBe(2);
      expect(redoHistory[0].widgets[0].id).toBe('widget-2');
      expect(redoHistory[1].widgets[0].id).toBe('widget-3');
    });
  });

  describe('reset', () => {
    it('should reset history with new state', () => {
      historyManager.saveState([{ ...initialWidget, id: 'widget-2' }]);
      historyManager.saveState([{ ...initialWidget, id: 'widget-3' }]);

      const newWidget: PageWidget = { ...initialWidget, id: 'reset-widget' };
      historyManager.reset([newWidget]);

      expect(historyManager.getHistory().length).toBe(1);
      expect(historyManager.getCurrentIndex()).toBe(0);
      expect(historyManager.getHistory()[0].widgets[0].id).toBe('reset-widget');
      expect(historyManager.canUndo()).toBe(false);
      expect(historyManager.canRedo()).toBe(false);
    });

    it('should deep clone reset state', () => {
      const widget: PageWidget = {
        id: 'widget-1',
        page_id: 'page-1',
        type: 'hero',
        position: 0,
        config: { title: 'Original' },
        created_at: Date.now(),
        updated_at: Date.now()
      };

      historyManager.reset([widget]);
      widget.config.title = 'Modified';

      expect(historyManager.getHistory()[0].widgets[0].config.title).toBe('Original');
    });
  });
});
