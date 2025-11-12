import type { ProductFulfillmentOption } from '$lib/types/fulfillment';

/**
 * Calculate total stock quantity from fulfillment options
 * @param fulfillmentOptions - Array of fulfillment options for a product
 * @returns Total stock quantity across all fulfillment providers
 */
export function calculateTotalStock(fulfillmentOptions?: ProductFulfillmentOption[]): number {
  if (!fulfillmentOptions || fulfillmentOptions.length === 0) {
    return 0;
  }

  return fulfillmentOptions.reduce((total, option) => {
    return total + (option.stockQuantity || 0);
  }, 0);
}
