import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { get } from 'svelte/store';
import { toastStore } from './toast';

describe('Toast Store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    toastStore.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('show', () => {
    it('should add a toast with default type info', () => {
      const unsubscribe = toastStore.subscribe((toasts) => {
        if (toasts.length > 0) {
          expect(toasts).toHaveLength(1);
          expect(toasts[0].message).toBe('Test message');
          expect(toasts[0].type).toBe('info');
          expect(toasts[0].duration).toBe(3000);
        }
      });
      
      toastStore.show('Test message');
      unsubscribe();
    });

    it('should add a toast with custom type', () => {
      const unsubscribe = toastStore.subscribe((toasts) => {
        if (toasts.length > 0) {
          expect(toasts[0].type).toBe('success');
        }
      });
      
      toastStore.show('Success message', 'success');
      unsubscribe();
    });

    it('should add a toast with custom duration', () => {
      const unsubscribe = toastStore.subscribe((toasts) => {
        if (toasts.length > 0) {
          expect(toasts[0].duration).toBe(5000);
        }
      });
      
      toastStore.show('Test message', 'info', 5000);
      unsubscribe();
    });

    it('should auto-remove toast after duration', () => {
      toastStore.show('Test message', 'info', 3000);
      
      let toasts: any[] = [];
      const unsubscribe = toastStore.subscribe((t) => {
        toasts = t;
      });
      
      expect(toasts).toHaveLength(1);
      
      vi.advanceTimersByTime(3000);
      expect(toasts).toHaveLength(0);
      
      unsubscribe();
    });

    it('should not auto-remove toast when duration is 0', () => {
      toastStore.show('Test message', 'info', 0);
      
      let toasts: any[] = [];
      const unsubscribe = toastStore.subscribe((t) => {
        toasts = t;
      });
      
      expect(toasts).toHaveLength(1);
      
      vi.advanceTimersByTime(5000);
      expect(toasts).toHaveLength(1);
      
      unsubscribe();
    });

    it('should generate unique IDs for toasts', () => {
      toastStore.show('Message 1');
      toastStore.show('Message 2');
      
      let toasts: any[] = [];
      const unsubscribe = toastStore.subscribe((t) => {
        toasts = t;
      });
      
      expect(toasts).toHaveLength(2);
      expect(toasts[0].id).not.toBe(toasts[1].id);
      
      unsubscribe();
    });
  });

  describe('success', () => {
    it('should add a success toast', () => {
      const unsubscribe = toastStore.subscribe((toasts) => {
        if (toasts.length > 0) {
          expect(toasts[0].type).toBe('success');
          expect(toasts[0].message).toBe('Success!');
        }
      });
      
      toastStore.success('Success!');
      unsubscribe();
    });

    it('should respect custom duration', () => {
      const unsubscribe = toastStore.subscribe((toasts) => {
        if (toasts.length > 0) {
          expect(toasts[0].duration).toBe(5000);
        }
      });
      
      toastStore.success('Success!', 5000);
      unsubscribe();
    });
  });

  describe('error', () => {
    it('should add an error toast', () => {
      const unsubscribe = toastStore.subscribe((toasts) => {
        if (toasts.length > 0) {
          expect(toasts[0].type).toBe('error');
          expect(toasts[0].message).toBe('Error!');
        }
      });
      
      toastStore.error('Error!');
      unsubscribe();
    });

    it('should respect custom duration', () => {
      const unsubscribe = toastStore.subscribe((toasts) => {
        if (toasts.length > 0) {
          expect(toasts[0].duration).toBe(5000);
        }
      });
      
      toastStore.error('Error!', 5000);
      unsubscribe();
    });
  });

  describe('warning', () => {
    it('should add a warning toast', () => {
      const unsubscribe = toastStore.subscribe((toasts) => {
        if (toasts.length > 0) {
          expect(toasts[0].type).toBe('warning');
          expect(toasts[0].message).toBe('Warning!');
        }
      });
      
      toastStore.warning('Warning!');
      unsubscribe();
    });

    it('should respect custom duration', () => {
      const unsubscribe = toastStore.subscribe((toasts) => {
        if (toasts.length > 0) {
          expect(toasts[0].duration).toBe(5000);
        }
      });
      
      toastStore.warning('Warning!', 5000);
      unsubscribe();
    });
  });

  describe('info', () => {
    it('should add an info toast', () => {
      const unsubscribe = toastStore.subscribe((toasts) => {
        if (toasts.length > 0) {
          expect(toasts[0].type).toBe('info');
          expect(toasts[0].message).toBe('Info!');
        }
      });
      
      toastStore.info('Info!');
      unsubscribe();
    });

    it('should respect custom duration', () => {
      const unsubscribe = toastStore.subscribe((toasts) => {
        if (toasts.length > 0) {
          expect(toasts[0].duration).toBe(5000);
        }
      });
      
      toastStore.info('Info!', 5000);
      unsubscribe();
    });
  });

  describe('remove', () => {
    it('should remove a specific toast by ID', () => {
      let toasts: any[] = [];
      const unsubscribe = toastStore.subscribe((t) => {
        toasts = t;
      });
      
      toastStore.show('Message 1', 'info', 0);
      toastStore.show('Message 2', 'info', 0);
      
      expect(toasts).toHaveLength(2);
      const firstId = toasts[0].id;
      
      toastStore.remove(firstId);
      expect(toasts).toHaveLength(1);
      expect(toasts[0].message).toBe('Message 2');
      
      unsubscribe();
    });

    it('should do nothing when removing non-existent ID', () => {
      let toasts: any[] = [];
      const unsubscribe = toastStore.subscribe((t) => {
        toasts = t;
      });
      
      toastStore.show('Message 1', 'info', 0);
      expect(toasts).toHaveLength(1);
      
      toastStore.remove('non-existent-id');
      expect(toasts).toHaveLength(1);
      
      unsubscribe();
    });
  });

  describe('clear', () => {
    it('should remove all toasts', () => {
      let toasts: any[] = [];
      const unsubscribe = toastStore.subscribe((t) => {
        toasts = t;
      });
      
      toastStore.show('Message 1', 'info', 0);
      toastStore.show('Message 2', 'info', 0);
      toastStore.show('Message 3', 'info', 0);
      
      expect(toasts).toHaveLength(3);
      
      toastStore.clear();
      expect(toasts).toHaveLength(0);
      
      unsubscribe();
    });
  });
});
