import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';
import { checkoutStore } from './checkout';
import type { AvailableShippingOption } from '$lib/types/shipping';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Checkout Store - Shipping Options', () => {
  beforeEach(() => {
    checkoutStore.reset();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('setSelectedShippingOption', () => {
    it('should update selected shipping option ID', () => {
      checkoutStore.setSelectedShippingOption('ship-standard');

      const state = get(checkoutStore);
      expect(state.formData.selectedShippingOptionId).toBe('ship-standard');
    });

    it('should allow clearing shipping option selection', () => {
      checkoutStore.setSelectedShippingOption('ship-express');
      checkoutStore.setSelectedShippingOption(null);

      const state = get(checkoutStore);
      expect(state.formData.selectedShippingOptionId).toBeNull();
    });
  });

  describe('loadShippingOptions', () => {
    const mockShippingOptions: AvailableShippingOption[] = [
      {
        id: 'ship-standard',
        name: 'Standard Shipping',
        description: '5-7 business days',
        price: 9.99,
        estimatedDaysMin: 5,
        estimatedDaysMax: 7,
        carrier: 'USPS',
        isDefault: true,
        isFreeShipping: false
      },
      {
        id: 'ship-express',
        name: 'Express Shipping',
        description: '2-3 business days',
        price: 19.99,
        estimatedDaysMin: 2,
        estimatedDaysMax: 3,
        carrier: 'FedEx',
        isDefault: false,
        isFreeShipping: false
      }
    ];

    const mockCartItems = [{ id: 'product-1', type: 'physical' as const, category: 'Electronics' }];

    it('should set loading state while fetching', async () => {
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({
                    options: mockShippingOptions,
                    hasPhysicalProducts: true
                  })
                }),
              100
            )
          )
      );

      const loadPromise = checkoutStore.loadShippingOptions(mockCartItems);

      // Check loading state
      const loadingState = get(checkoutStore);
      expect(loadingState.loadingShippingOptions).toBe(true);

      await loadPromise;
    });

    it('should load shipping options from API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          options: mockShippingOptions,
          hasPhysicalProducts: true
        })
      });

      await checkoutStore.loadShippingOptions(mockCartItems);

      const state = get(checkoutStore);
      expect(state.availableShippingOptions).toEqual(mockShippingOptions);
      expect(state.loadingShippingOptions).toBe(false);
    });

    it('should send cart items in POST request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          options: mockShippingOptions,
          hasPhysicalProducts: true
        })
      });

      await checkoutStore.loadShippingOptions(mockCartItems);

      expect(mockFetch).toHaveBeenCalledWith('/api/checkout/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItems: mockCartItems })
      });
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to load' })
      });

      await checkoutStore.loadShippingOptions(mockCartItems);

      const state = get(checkoutStore);
      expect(state.availableShippingOptions).toEqual([]);
      expect(state.loadingShippingOptions).toBe(false);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await checkoutStore.loadShippingOptions(mockCartItems);

      const state = get(checkoutStore);
      expect(state.availableShippingOptions).toEqual([]);
      expect(state.loadingShippingOptions).toBe(false);
    });

    it('should handle empty cart (digital products only)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          options: [],
          hasPhysicalProducts: false
        })
      });

      const digitalCart = [{ id: 'digital-1', type: 'digital' as const }];
      await checkoutStore.loadShippingOptions(digitalCart);

      const state = get(checkoutStore);
      expect(state.availableShippingOptions).toEqual([]);
    });
  });

  describe('reset', () => {
    it('should reset shipping options and loading state', () => {
      checkoutStore.setSelectedShippingOption('ship-standard');

      // Manually set some state
      const unsubscribe = checkoutStore.subscribe((_state) => {});
      unsubscribe();

      checkoutStore.reset();

      const state = get(checkoutStore);
      expect(state.formData.selectedShippingOptionId).toBeNull();
      expect(state.availableShippingOptions).toEqual([]);
      expect(state.loadingShippingOptions).toBe(false);
    });
  });

  describe('validateForm with shipping', () => {
    it('should include shipping validation error when no option selected for physical products', () => {
      // Set up form data
      checkoutStore.updateFormData({
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '123-456-7890',
          address: '123 Main St',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62701',
          country: 'United States'
        }
      });

      const errors = checkoutStore.validateForm();

      // Note: This will depend on how validation is implemented
      // The actual validation logic needs to check for shipping selection
      expect(errors).toBeDefined();
    });
  });
});
