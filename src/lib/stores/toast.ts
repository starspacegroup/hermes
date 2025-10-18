import { writable } from 'svelte/store';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export interface ToastStore {
  subscribe: typeof toasts.subscribe;
  show: (message: string, type?: Toast['type'], duration?: number) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const toasts = writable<Toast[]>([]);

let toastId = 0;

export const toastStore: ToastStore = {
  subscribe: toasts.subscribe,

  show: (message: string, type: Toast['type'] = 'info', duration: number = 3000): void => {
    const id = `toast-${++toastId}`;
    const toast: Toast = { id, message, type, duration };

    toasts.update((items) => [...items, toast]);

    if (duration > 0) {
      setTimeout(() => {
        toastStore.remove(id);
      }, duration);
    }
  },

  remove: (id: string): void => {
    toasts.update((items) => items.filter((toast) => toast.id !== id));
  },

  clear: (): void => {
    toasts.set([]);
  }
};