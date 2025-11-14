import { describe, it, expect } from 'vitest';
import {
  groupCartItemsByShipping,
  calculateTotalShippingCost,
  validateShippingSelections,
  type ShippingGroup
} from './shippingGroups';
import type { CartItem } from '$lib/types';
import type { AvailableShippingOption } from '$lib/types/shipping';

function createMockCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: '1',
    name: 'Test Product',
    description: 'Test description',
    price: 20,
    quantity: 1,
    type: 'physical',
    image: '',
    category: 'test',
    stock: 100,
    tags: [],
    ...overrides
  };
}

function createMockShippingOption(
  overrides: Partial<AvailableShippingOption> = {}
): AvailableShippingOption {
  return {
    id: 'opt1',
    name: 'Standard Shipping',
    description: null,
    carrier: 'USPS',
    estimatedDaysMin: 3,
    estimatedDaysMax: 7,
    price: 5.99,
    isDefault: false,
    isFreeShipping: false,
    ...overrides
  };
}

describe('shippingGroups', () => {
  describe('groupCartItemsByShipping', () => {
    it('returns empty array when no physical products in cart', () => {
      const cartItems: CartItem[] = [createMockCartItem({ type: 'digital' })];
      const productShippingMap = new Map<string, AvailableShippingOption[]>();
      const groups = groupCartItemsByShipping(cartItems, productShippingMap);
      expect(groups).toEqual([]);
    });

    it('creates single group when all products share same shipping options', () => {
      const shippingOption1 = createMockShippingOption({ id: 'opt1', price: 5.99 });
      const shippingOption2 = createMockShippingOption({
        id: 'opt2',
        name: 'Express Shipping',
        carrier: 'FedEx',
        price: 12.99
      });
      const cartItems: CartItem[] = [
        createMockCartItem({ id: '1', name: 'Product 1' }),
        createMockCartItem({ id: '2', name: 'Product 2', quantity: 2 })
      ];
      const productShippingMap = new Map<string, AvailableShippingOption[]>([
        ['1', [shippingOption1, shippingOption2]],
        ['2', [shippingOption1, shippingOption2]]
      ]);
      const groups = groupCartItemsByShipping(cartItems, productShippingMap);
      expect(groups).toHaveLength(1);
      expect(groups[0].id).toBe('group-0');
      expect(groups[0].products).toHaveLength(2);
      expect(groups[0].shippingOptions).toHaveLength(2);
      expect(groups[0].isFree).toBe(false);
    });

    it('creates separate groups when products have different shipping options', () => {
      const shippingOption1 = createMockShippingOption({ id: 'opt1', price: 5.99 });
      const shippingOption2 = createMockShippingOption({ id: 'opt2', price: 12.99 });
      const cartItems: CartItem[] = [
        createMockCartItem({ id: '1', name: 'Product 1' }),
        createMockCartItem({ id: '2', name: 'Product 2' })
      ];
      const productShippingMap = new Map<string, AvailableShippingOption[]>([
        ['1', [shippingOption1]],
        ['2', [shippingOption2]]
      ]);
      const groups = groupCartItemsByShipping(cartItems, productShippingMap);
      expect(groups).toHaveLength(2);
      expect(groups[0].products).toHaveLength(1);
      expect(groups[0].products[0].id).toBe('1');
      expect(groups[1].products).toHaveLength(1);
      expect(groups[1].products[0].id).toBe('2');
    });

    it('creates free group for products with no shipping options', () => {
      const shippingOption = createMockShippingOption({ id: 'opt1', price: 5.99 });
      const cartItems: CartItem[] = [
        createMockCartItem({ id: '1', name: 'Product 1' }),
        createMockCartItem({ id: '2', name: 'Product 2 (Free Shipping)' })
      ];
      const productShippingMap = new Map<string, AvailableShippingOption[]>([
        ['1', [shippingOption]],
        ['2', []]
      ]);
      const groups = groupCartItemsByShipping(cartItems, productShippingMap);
      expect(groups).toHaveLength(2);
      const freeGroup = groups.find((g) => g.isFree);
      expect(freeGroup).toBeDefined();
      expect(freeGroup!.products).toHaveLength(1);
      expect(freeGroup!.products[0].id).toBe('2');
      expect(freeGroup!.shippingOptions).toHaveLength(0);
    });

    it('handles mixed cart with shared, different, and free shipping', () => {
      const shippingOption1 = createMockShippingOption({ id: 'opt1', price: 5.99 });
      const shippingOption2 = createMockShippingOption({ id: 'opt2', price: 12.99 });
      const cartItems: CartItem[] = [
        createMockCartItem({ id: '1', name: 'Product 1' }),
        createMockCartItem({ id: '2', name: 'Product 2' }),
        createMockCartItem({ id: '3', name: 'Product 3' }),
        createMockCartItem({ id: '4', name: 'Product 4' }),
        createMockCartItem({ id: '5', name: 'Digital', type: 'digital' })
      ];
      const productShippingMap = new Map<string, AvailableShippingOption[]>([
        ['1', [shippingOption1, shippingOption2]],
        ['2', [shippingOption1, shippingOption2]],
        ['3', [shippingOption1]],
        ['4', []]
      ]);
      const groups = groupCartItemsByShipping(cartItems, productShippingMap);
      expect(groups).toHaveLength(3);
      const sharedGroup = groups.find((g) => g.products.length === 2);
      expect(sharedGroup).toBeDefined();
      expect(sharedGroup!.shippingOptions).toHaveLength(2);
      const singleGroup = groups.find((g) => g.products.length === 1 && g.products[0].id === '3');
      expect(singleGroup).toBeDefined();
      expect(singleGroup!.shippingOptions).toHaveLength(1);
      const freeGroup = groups.find((g) => g.isFree);
      expect(freeGroup).toBeDefined();
      expect(freeGroup!.products[0].id).toBe('4');
    });
  });

  describe('calculateTotalShippingCost', () => {
    it('returns 0 when no groups', () => {
      const groups: ShippingGroup[] = [];
      const selectedOptions = {};
      const total = calculateTotalShippingCost(groups, selectedOptions);
      expect(total).toBe(0);
    });

    it('returns 0 when all groups are free', () => {
      const groups: ShippingGroup[] = [
        {
          id: 'group-0',
          products: [createMockCartItem({ id: '1' })],
          shippingOptions: [],
          isFree: true
        }
      ];
      const selectedOptions = {};
      const total = calculateTotalShippingCost(groups, selectedOptions);
      expect(total).toBe(0);
    });

    it('calculates total from single selected option', () => {
      const groups: ShippingGroup[] = [
        {
          id: 'group-0',
          products: [createMockCartItem({ id: '1' })],
          shippingOptions: [createMockShippingOption({ id: 'opt1', price: 5.99 })],
          isFree: false
        }
      ];
      const selectedOptions = { 'group-0': 'opt1' };
      const total = calculateTotalShippingCost(groups, selectedOptions);
      expect(total).toBe(5.99);
    });

    it('calculates total from multiple selected options', () => {
      const groups: ShippingGroup[] = [
        {
          id: 'group-0',
          products: [createMockCartItem({ id: '1' })],
          shippingOptions: [
            createMockShippingOption({ id: 'opt1', price: 5.99 }),
            createMockShippingOption({ id: 'opt2', price: 12.99 })
          ],
          isFree: false
        },
        {
          id: 'group-1',
          products: [createMockCartItem({ id: '2' })],
          shippingOptions: [createMockShippingOption({ id: 'opt3', price: 8.5 })],
          isFree: false
        }
      ];
      const selectedOptions = { 'group-0': 'opt1', 'group-1': 'opt3' };
      const total = calculateTotalShippingCost(groups, selectedOptions);
      expect(total).toBe(14.49);
    });

    it('ignores groups without selection', () => {
      const groups: ShippingGroup[] = [
        {
          id: 'group-0',
          products: [createMockCartItem({ id: '1' })],
          shippingOptions: [createMockShippingOption({ id: 'opt1', price: 5.99 })],
          isFree: false
        },
        {
          id: 'group-1',
          products: [createMockCartItem({ id: '2' })],
          shippingOptions: [createMockShippingOption({ id: 'opt2', price: 12.99 })],
          isFree: false
        }
      ];
      const selectedOptions = { 'group-0': 'opt1' };
      const total = calculateTotalShippingCost(groups, selectedOptions);
      expect(total).toBe(5.99);
    });
  });

  describe('validateShippingSelections', () => {
    it('returns empty errors when all non-free groups have selection', () => {
      const groups: ShippingGroup[] = [
        {
          id: 'group-0',
          products: [createMockCartItem({ id: '1' })],
          shippingOptions: [createMockShippingOption({ id: 'opt1', price: 5.99 })],
          isFree: false
        }
      ];
      const selectedOptions = { 'group-0': 'opt1' };
      const errors = validateShippingSelections(groups, selectedOptions);
      expect(errors).toEqual({});
    });

    it('returns error for group without selection', () => {
      const groups: ShippingGroup[] = [
        {
          id: 'group-0',
          products: [createMockCartItem({ id: '1' })],
          shippingOptions: [createMockShippingOption({ id: 'opt1', price: 5.99 })],
          isFree: false
        }
      ];
      const selectedOptions = {};
      const errors = validateShippingSelections(groups, selectedOptions);
      expect(errors).toEqual({
        'group-0': 'Please select a shipping option for this group'
      });
    });

    it('does not require selection for free groups', () => {
      const groups: ShippingGroup[] = [
        {
          id: 'group-0',
          products: [createMockCartItem({ id: '1' })],
          shippingOptions: [],
          isFree: true
        }
      ];
      const selectedOptions = {};
      const errors = validateShippingSelections(groups, selectedOptions);
      expect(errors).toEqual({});
    });

    it('validates multiple groups independently', () => {
      const groups: ShippingGroup[] = [
        {
          id: 'group-0',
          products: [createMockCartItem({ id: '1' })],
          shippingOptions: [createMockShippingOption({ id: 'opt1', price: 5.99 })],
          isFree: false
        },
        {
          id: 'group-1',
          products: [createMockCartItem({ id: '2' })],
          shippingOptions: [createMockShippingOption({ id: 'opt2', price: 12.99 })],
          isFree: false
        },
        {
          id: 'group-2',
          products: [createMockCartItem({ id: '3' })],
          shippingOptions: [],
          isFree: true
        }
      ];
      const selectedOptions = { 'group-0': 'opt1' };
      const errors = validateShippingSelections(groups, selectedOptions);
      expect(errors).toEqual({
        'group-1': 'Please select a shipping option for this group'
      });
    });
  });
});
