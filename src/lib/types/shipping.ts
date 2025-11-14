/**
 * Shipping options types
 */

export interface ShippingOption {
  id: string;
  siteId: string;
  name: string;
  description: string | null;
  price: number;
  estimatedDaysMin: number | null;
  estimatedDaysMax: number | null;
  carrier: string | null;
  freeShippingThreshold: number | null;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ProductShippingOption {
  id: string;
  siteId: string;
  productId: string;
  shippingOptionId: string;
  isDefault: boolean;
  priceOverride: number | null;
  thresholdOverride: number | null;
  createdAt: number;
  updatedAt: number;
  // Joined fields
  optionName?: string;
  optionPrice?: number;
  optionEstimatedDaysMin?: number | null;
  optionEstimatedDaysMax?: number | null;
  optionCarrier?: string | null;
  optionFreeShippingThreshold?: number | null;
}

export interface CategoryShippingOption {
  id: string;
  siteId: string;
  category: string;
  shippingOptionId: string;
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
  // Joined fields
  optionName?: string;
  optionPrice?: number;
  optionEstimatedDaysMin?: number | null;
  optionEstimatedDaysMax?: number | null;
  optionCarrier?: string | null;
}

export interface CreateShippingOptionData {
  name: string;
  description?: string;
  price: number;
  estimatedDaysMin?: number;
  estimatedDaysMax?: number;
  carrier?: string;
  freeShippingThreshold?: number;
  isActive?: boolean;
}

export interface UpdateShippingOptionData {
  name?: string;
  description?: string;
  price?: number;
  estimatedDaysMin?: number;
  estimatedDaysMax?: number;
  carrier?: string;
  freeShippingThreshold?: number;
  isActive?: boolean;
}

export interface ProductShippingAssignment {
  shippingOptionId: string;
  isDefault: boolean;
  priceOverride?: number;
  thresholdOverride?: number;
}

export interface CategoryShippingAssignment {
  shippingOptionId: string;
  isDefault: boolean;
}

export interface AvailableShippingOption {
  id: string;
  name: string;
  description: string | null;
  price: number;
  estimatedDaysMin: number | null;
  estimatedDaysMax: number | null;
  carrier: string | null;
  isDefault: boolean;
  isFreeShipping: boolean;
}
