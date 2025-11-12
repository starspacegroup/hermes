import { describe, it, expect } from 'vitest';
import { calculateTotalStock } from './stock';
import type { ProductFulfillmentOption } from '$lib/types/fulfillment';

describe('calculateTotalStock', () => {
  it('returns 0 for empty fulfillment options array', () => {
    expect(calculateTotalStock([])).toBe(0);
  });

  it('returns 0 when fulfillment options is undefined', () => {
    expect(calculateTotalStock(undefined)).toBe(0);
  });

  it('sums stock quantities from single fulfillment option', () => {
    const options: ProductFulfillmentOption[] = [
      {
        providerId: 'provider-1',
        providerName: 'Warehouse A',
        cost: 5.0,
        stockQuantity: 10,
        sortOrder: 0
      }
    ];
    expect(calculateTotalStock(options)).toBe(10);
  });

  it('sums stock quantities from multiple fulfillment options', () => {
    const options: ProductFulfillmentOption[] = [
      {
        providerId: 'provider-1',
        providerName: 'Warehouse A',
        cost: 5.0,
        stockQuantity: 10,
        sortOrder: 0
      },
      {
        providerId: 'provider-2',
        providerName: 'Warehouse B',
        cost: 3.5,
        stockQuantity: 15,
        sortOrder: 1
      },
      {
        providerId: 'provider-3',
        providerName: 'Warehouse C',
        cost: 4.0,
        stockQuantity: 25,
        sortOrder: 2
      }
    ];
    expect(calculateTotalStock(options)).toBe(50);
  });

  it('handles zero stock quantities correctly', () => {
    const options: ProductFulfillmentOption[] = [
      {
        providerId: 'provider-1',
        providerName: 'Warehouse A',
        cost: 5.0,
        stockQuantity: 0,
        sortOrder: 0
      },
      {
        providerId: 'provider-2',
        providerName: 'Warehouse B',
        cost: 3.5,
        stockQuantity: 5,
        sortOrder: 1
      }
    ];
    expect(calculateTotalStock(options)).toBe(5);
  });

  it('returns 0 when all stock quantities are zero', () => {
    const options: ProductFulfillmentOption[] = [
      {
        providerId: 'provider-1',
        providerName: 'Warehouse A',
        cost: 5.0,
        stockQuantity: 0,
        sortOrder: 0
      },
      {
        providerId: 'provider-2',
        providerName: 'Warehouse B',
        cost: 3.5,
        stockQuantity: 0,
        sortOrder: 1
      }
    ];
    expect(calculateTotalStock(options)).toBe(0);
  });
});
