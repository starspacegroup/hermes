import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { cartStore, cartItems } from './cart';
import type { Product } from '../types/index';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock
});

const mockProduct: Product = {
  id: '1',
  name: 'Test Product',
  description: 'A test product',
  price: 99.99,
  image: 'test.jpg',
  category: 'Test',
  stock: 10
};

const mockProduct2: Product = {
  id: '2',
  name: 'Test Product 2',
  description: 'Another test product',
  price: 49.99,
  image: 'test2.jpg',
  category: 'Test',
  stock: 5
};

describe('Cart Store', () => {
  beforeEach(() => {
    cartStore.clear();
    localStorage.clear();
  });

  describe('addItem', () => {
    it('should add a new item to the cart', () => {
      cartStore.addItem(mockProduct);
      const items = get(cartItems);

      expect(items).toHaveLength(1);
      expect(items[0].id).toBe(mockProduct.id);
      expect(items[0].quantity).toBe(1);
    });

    it('should add item with specified quantity', () => {
      cartStore.addItem(mockProduct, 3);
      const items = get(cartItems);

      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(3);
    });

    it('should increment quantity if item already exists', () => {
      cartStore.addItem(mockProduct, 2);
      cartStore.addItem(mockProduct, 3);
      const items = get(cartItems);

      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(5);
    });

    it('should add multiple different items', () => {
      cartStore.addItem(mockProduct);
      cartStore.addItem(mockProduct2);
      const items = get(cartItems);

      expect(items).toHaveLength(2);
      expect(items[0].id).toBe(mockProduct.id);
      expect(items[1].id).toBe(mockProduct2.id);
    });
  });

  describe('removeItem', () => {
    it('should remove an item from the cart', () => {
      cartStore.addItem(mockProduct);
      cartStore.addItem(mockProduct2);
      cartStore.removeItem(mockProduct.id);
      const items = get(cartItems);

      expect(items).toHaveLength(1);
      expect(items[0].id).toBe(mockProduct2.id);
    });

    it('should do nothing if item does not exist', () => {
      cartStore.addItem(mockProduct);
      cartStore.removeItem('non-existent');
      const items = get(cartItems);

      expect(items).toHaveLength(1);
    });
  });

  describe('updateQuantity', () => {
    it('should update the quantity of an item', () => {
      cartStore.addItem(mockProduct, 2);
      cartStore.updateQuantity(mockProduct.id, 5);
      const items = get(cartItems);

      expect(items[0].quantity).toBe(5);
    });

    it('should remove item when quantity is 0', () => {
      cartStore.addItem(mockProduct);
      cartStore.updateQuantity(mockProduct.id, 0);
      const items = get(cartItems);

      expect(items).toHaveLength(0);
    });

    it('should remove item when quantity is negative', () => {
      cartStore.addItem(mockProduct);
      cartStore.updateQuantity(mockProduct.id, -1);
      const items = get(cartItems);

      expect(items).toHaveLength(0);
    });

    it('should do nothing if item does not exist', () => {
      cartStore.addItem(mockProduct);
      cartStore.updateQuantity('non-existent', 5);
      const items = get(cartItems);

      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(1);
    });
  });

  describe('clear', () => {
    it('should clear all items from the cart', () => {
      cartStore.addItem(mockProduct);
      cartStore.addItem(mockProduct2);
      cartStore.clear();
      const items = get(cartItems);

      expect(items).toHaveLength(0);
    });
  });

  describe('getTotalItems', () => {
    it('should return 0 for empty cart', () => {
      const total = cartStore.getTotalItems([]);
      expect(total).toBe(0);
    });

    it('should return correct total for single item', () => {
      const items = [{ ...mockProduct, quantity: 3 }];
      const total = cartStore.getTotalItems(items);
      expect(total).toBe(3);
    });

    it('should return correct total for multiple items', () => {
      const items = [
        { ...mockProduct, quantity: 3 },
        { ...mockProduct2, quantity: 2 }
      ];
      const total = cartStore.getTotalItems(items);
      expect(total).toBe(5);
    });
  });

  describe('getTotalPrice', () => {
    it('should return 0 for empty cart', () => {
      const total = cartStore.getTotalPrice([]);
      expect(total).toBe(0);
    });

    it('should return correct total for single item', () => {
      const items = [{ ...mockProduct, quantity: 2 }];
      const total = cartStore.getTotalPrice(items);
      expect(total).toBe(199.98);
    });

    it('should return correct total for multiple items', () => {
      const items = [
        { ...mockProduct, quantity: 2 },
        { ...mockProduct2, quantity: 3 }
      ];
      const total = cartStore.getTotalPrice(items);
      expect(total).toBe(349.95);
    });
  });
});
