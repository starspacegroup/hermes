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
 * Items with no shipping options get their own "free" group.
 */
export function groupCartItemsByShipping(
  cartItems: CartItem[],
  productShippingMap: Map<string, AvailableShippingOption[]>
): ShippingGroup[] {
  const physicalProducts = cartItems.filter((item) => item.type === 'physical');

  if (physicalProducts.length === 0) {
    return [];
  }

  // Group products by their shipping options signature
  const groupsMap = new Map<string, CartItem[]>();

  for (const product of physicalProducts) {
    const shippingOptions = productShippingMap.get(product.id) || [];

    // Create a signature from the shipping option IDs (sorted for consistency)
    const signature =
      shippingOptions.length === 0
        ? 'FREE'
        : shippingOptions
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

  for (const [signature, products] of groupsMap.entries()) {
    const isFree = signature === 'FREE';
    const shippingOptions = isFree ? [] : productShippingMap.get(products[0].id) || [];

    groups.push({
      id: `group-${groupIndex++}`,
      products,
      shippingOptions,
      isFree
    });
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
