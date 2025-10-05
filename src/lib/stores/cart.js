import { writable } from 'svelte/store';

export const cartItems = writable([]);

export const cartStore = {
  subscribe: cartItems.subscribe,

  addItem: (product, quantity = 1) => {
    cartItems.update((items) => {
      const existingItem = items.find((item) => item.id === product.id);

      if (existingItem) {
        existingItem.quantity += quantity;
        return items;
      } else {
        return [...items, { ...product, quantity }];
      }
    });
  },

  removeItem: (productId) => {
    cartItems.update((items) => items.filter((item) => item.id !== productId));
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      cartStore.removeItem(productId);
      return;
    }

    cartItems.update((items) => {
      const item = items.find((item) => item.id === productId);
      if (item) {
        item.quantity = quantity;
      }
      return items;
    });
  },

  clear: () => {
    cartItems.set([]);
  },

  getTotalItems: (items) => {
    return items.reduce((total, item) => total + item.quantity, 0);
  },

  getTotalPrice: (items) => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  }
};
