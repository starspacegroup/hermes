/**
 * Fulfillment provider types
 */

export interface FulfillmentProvider {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  isActive: boolean;
}

export interface DBFulfillmentProvider {
  id: string;
  site_id: string;
  name: string;
  description: string | null;
  is_default: number;
  is_active: number;
  created_at: number;
  updated_at: number;
}

export interface CreateFulfillmentProviderData {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateFulfillmentProviderData {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface ProductFulfillmentOption {
  providerId: string;
  providerName: string;
  cost: number;
  stockQuantity: number;
}

export interface DBProductFulfillmentOption {
  id: string;
  site_id: string;
  product_id: string;
  provider_id: string;
  cost: number;
  stock_quantity: number;
  created_at: number;
  updated_at: number;
}

export interface CreateProductFulfillmentOptionData {
  productId: string;
  providerId: string;
  cost: number;
  stockQuantity?: number;
}
