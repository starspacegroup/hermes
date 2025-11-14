import type { CartItem } from '$lib/types';
import type { AvailableShippingOption } from '$lib/types/shipping';

export interface ShippingGroup {
  id: string; // Unique identifier for the group
  products: CartItem[]; // Products in this group
  shippingOptions: AvailableShippingOption[]; // Available shipping options for this group
  isFree: boolean; // True if products have no shipping options (free shipping)
}

/**
 * Groups cart items by their shared shipping options.
 * Items with the same set of shipping options are grouped together.
 * Items with no shipping options (free shipping) are merged into groups with shipping options.
 * If ALL items have no shipping, returns a single free shipping group.
 */
export function groupCartItemsByShipping(
  cartItems: CartItem[],
  productShippingMap: Map<string, AvailableShippingOption[]>
): ShippingGroup[] {
  const physicalProducts = cartItems.filter((item) => item.type === 'physical');

  if (physicalProducts.length === 0) {
    return [];
  }

  // Separate products with shipping options from those without
  const productsWithShipping: CartItem[] = [];
  const productsWithoutShipping: CartItem[] = [];

  for (const product of physicalProducts) {
    const shippingOptions = productShippingMap.get(product.id) || [];
    if (shippingOptions.length > 0) {
      productsWithShipping.push(product);
    } else {
      productsWithoutShipping.push(product);
    }
  }

  // If no products have shipping options, return a single free shipping group
  if (productsWithShipping.length === 0) {
    return [
      {
        id: 'group-0',
        products: productsWithoutShipping,
        shippingOptions: [],
        isFree: true
      }
    ];
  }

  // Group products with shipping options by their signature
  const groupsMap = new Map<string, CartItem[]>();

  for (const product of productsWithShipping) {
    const shippingOptions = productShippingMap.get(product.id) || [];

    // Create a signature from the shipping option IDs (sorted for consistency)
    const signature = shippingOptions
      .map((opt) => opt.id)
      .sort()
      .join(',');

    if (!groupsMap.has(signature)) {
      groupsMap.set(signature, []);
    }
    groupsMap.get(signature)!.push(product);
  }

  // Convert to ShippingGroup array
  const groups: ShippingGroup[] = [];
  let groupIndex = 0;

  for (const [_signature, products] of groupsMap.entries()) {
    const shippingOptions = productShippingMap.get(products[0].id) || [];

    groups.push({
      id: `group-${groupIndex++}`,
      products,
      shippingOptions,
      isFree: false
    });
  }

  // If there are free shipping products and only one group with shipping,
  // merge free products into that group
  if (productsWithoutShipping.length > 0) {
    if (groups.length === 1) {
      // Merge free items into the single shipping group
      groups[0].products.push(...productsWithoutShipping);
    } else {
      // Multiple shipping groups - add free items to the group with cheapest option
      let cheapestGroup = groups[0];
      let cheapestPrice = Math.min(...groups[0].shippingOptions.map((opt) => opt.price));

      for (const group of groups.slice(1)) {
        const minPrice = Math.min(...group.shippingOptions.map((opt) => opt.price));
        if (minPrice < cheapestPrice) {
          cheapestPrice = minPrice;
          cheapestGroup = group;
        }
      }

      // Add free products to cheapest group
      cheapestGroup.products.push(...productsWithoutShipping);
    }
  }

  return groups;
}

/**
 * Calculate total shipping cost from selected options per group
 */
export function calculateTotalShippingCost(
  groups: ShippingGroup[],
  selectedOptions: Record<string, string>
): number {
  let total = 0;

  for (const group of groups) {
    if (group.isFree) {
      continue;
    }

    const selectedOptionId = selectedOptions[group.id];
    if (!selectedOptionId) {
      continue;
    }

    const selectedOption = group.shippingOptions.find((opt) => opt.id === selectedOptionId);
    if (selectedOption) {
      total += selectedOption.price;
    }
  }

  return total;
}

/**
 * Validate that all non-free groups have a shipping option selected
 */
export function validateShippingSelections(
  groups: ShippingGroup[],
  selectedOptions: Record<string, string>
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const group of groups) {
    if (group.isFree) {
      continue; // Free groups don't need selection
    }

    if (!selectedOptions[group.id]) {
      errors[group.id] = 'Please select a shipping option for this group';
    }
  }

  return errors;
}
