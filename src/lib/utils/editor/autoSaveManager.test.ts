import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AutoSaveManager } from './autoSaveManager';

describe('AutoSaveManager', () => {
  let autoSaveManager: AutoSaveManager;
  let onSaveCallback: ReturnType<typeof vi.fn>;
  let shouldSaveCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    onSaveCallback = vi.fn().mockResolvedValue(undefined);
    shouldSaveCallback = vi.fn().mockReturnValue(true);
    autoSaveManager = new AutoSaveManager(onSaveCallback, shouldSaveCallback);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('initialization', () => {
    it('should create instance with callbacks', () => {
      expect(autoSaveManager).toBeDefined();
      expect(autoSaveManager.isSaving()).toBe(false);
      expect(autoSaveManager.getLastSaved()).toBeNull();
    });
  });

  describe('start', () => {
    it('should start auto-save interval', () => {
      autoSaveManager.start();

      expect(shouldSaveCallback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(30000);

      expect(shouldSaveCallback).toHaveBeenCalled();
    });

    it('should not start multiple intervals', () => {
      autoSaveManager.start();
      autoSaveManager.start();
      autoSaveManager.start();

      vi.advanceTimersByTime(30000);

      // Should only be called once
      expect(shouldSaveCallback).toHaveBeenCalledTimes(1);
    });

    it('should trigger auto-save at regular intervals', async () => {
      autoSaveManager.start();

      await vi.advanceTimersByTimeAsync(30000);
      expect(onSaveCallback).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(30000);
      expect(onSaveCallback).toHaveBeenCalledTimes(2);

      await vi.advanceTimersByTimeAsync(30000);
      expect(onSaveCallback).toHaveBeenCalledTimes(3);
    });
  });

  describe('stop', () => {
    it('should stop auto-save interval', async () => {
      autoSaveManager.start();

      await vi.advanceTimersByTimeAsync(30000);
      expect(onSaveCallback).toHaveBeenCalledTimes(1);

      autoSaveManager.stop();

      await vi.advanceTimersByTimeAsync(30000);
      expect(onSaveCallback).toHaveBeenCalledTimes(1);
    });

    it('should handle stop when not started', () => {
      expect(() => autoSaveManager.stop()).not.toThrow();
    });

    it('should allow restart after stop', async () => {
      autoSaveManager.start();
      await vi.advanceTimersByTimeAsync(30000);
      expect(onSaveCallback).toHaveBeenCalledTimes(1);

      autoSaveManager.stop();
      autoSaveManager.start();

      await vi.advanceTimersByTimeAsync(30000);
      expect(onSaveCallback).toHaveBeenCalledTimes(2);
    });
  });

  describe('autoSave', () => {
    it('should save when shouldSave returns true', async () => {
      await autoSaveManager.autoSave();

      expect(shouldSaveCallback).toHaveBeenCalled();
      expect(onSaveCallback).toHaveBeenCalled();
      expect(autoSaveManager.getLastSaved()).not.toBeNull();
    });

    it('should not save when shouldSave returns false', async () => {
      shouldSaveCallback.mockReturnValue(false);

      await autoSaveManager.autoSave();

      expect(shouldSaveCallback).toHaveBeenCalled();
      expect(onSaveCallback).not.toHaveBeenCalled();
    });

    it('should not save when already saving', async () => {
      let resolveCallback: () => void;
      onSaveCallback.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveCallback = resolve as () => void;
          })
      );

      const promise1 = autoSaveManager.autoSave();
      const promise2 = autoSaveManager.autoSave();

      expect(autoSaveManager.isSaving()).toBe(true);

      // Resolve the first save
      resolveCallback!();
      await promise1;
      await promise2;

      expect(onSaveCallback).toHaveBeenCalledTimes(1);
    });

    it('should handle save errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const saveError = new Error('Save failed');
      onSaveCallback.mockRejectedValue(saveError);

      await autoSaveManager.autoSave();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Auto-save failed:', saveError);
      expect(autoSaveManager.isSaving()).toBe(false);

      consoleErrorSpy.mockRestore();
    });

    it('should update lastSaved timestamp on success', async () => {
      const beforeSave = new Date();

      await autoSaveManager.autoSave();

      const lastSaved = autoSaveManager.getLastSaved();
      expect(lastSaved).not.toBeNull();
      expect(lastSaved!.getTime()).toBeGreaterThanOrEqual(beforeSave.getTime());
    });

    it('should not update lastSaved on error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      onSaveCallback.mockRejectedValue(new Error('Save failed'));

      await autoSaveManager.autoSave();

      expect(autoSaveManager.getLastSaved()).toBeNull();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('forceSave', () => {
    it('should force save immediately', async () => {
      await autoSaveManager.forceSave();

      expect(onSaveCallback).toHaveBeenCalled();
      expect(autoSaveManager.getLastSaved()).not.toBeNull();
    });

    it('should not force save when already saving', async () => {
      let resolveCallback: () => void;
      onSaveCallback.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveCallback = resolve as () => void;
          })
      );

      const promise1 = autoSaveManager.forceSave();
      const promise2 = autoSaveManager.forceSave();

      // Resolve the first save
      resolveCallback!();
      await promise1;
      await promise2;

      expect(onSaveCallback).toHaveBeenCalledTimes(1);
    });

    it('should save even if shouldSave returns false', async () => {
      shouldSaveCallback.mockReturnValue(false);

      await autoSaveManager.forceSave();

      expect(onSaveCallback).toHaveBeenCalled();
      expect(shouldSaveCallback).not.toHaveBeenCalled();
    });

    it('should reset isSaving flag even on error', async () => {
      onSaveCallback.mockRejectedValue(new Error('Save failed'));

      await expect(autoSaveManager.forceSave()).rejects.toThrow('Save failed');
      expect(autoSaveManager.isSaving()).toBe(false);
    });
  });

  describe('isSaving', () => {
    it('should return false initially', () => {
      expect(autoSaveManager.isSaving()).toBe(false);
    });

    it('should return true during save', async () => {
      let resolveCallback: () => void;
      onSaveCallback.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveCallback = resolve as () => void;
          })
      );

      const savePromise = autoSaveManager.autoSave();
      expect(autoSaveManager.isSaving()).toBe(true);

      resolveCallback!();
      await savePromise;
      expect(autoSaveManager.isSaving()).toBe(false);
    });
  });

  describe('getLastSaved and setLastSaved', () => {
    it('should get and set lastSaved date', () => {
      expect(autoSaveManager.getLastSaved()).toBeNull();

      const testDate = new Date('2024-01-01');
      autoSaveManager.setLastSaved(testDate);

      expect(autoSaveManager.getLastSaved()).toBe(testDate);
    });

    it('should update lastSaved after successful save', async () => {
      await autoSaveManager.autoSave();

      const lastSaved = autoSaveManager.getLastSaved();
      expect(lastSaved).toBeInstanceOf(Date);
    });
  });
});
