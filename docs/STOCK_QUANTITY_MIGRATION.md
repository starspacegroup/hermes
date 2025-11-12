# Stock Quantity Migration to Fulfillment Options

## Overview

Successfully moved stock quantity tracking from the `products` table to the
`product_fulfillment_options` table. Stock is now tracked per fulfillment option
rather than per product, allowing different fulfillment providers to maintain
their own inventory levels.

## Changes Made

### 1. Database Migration (0016_move_stock_to_fulfillment.sql)

- Added `stock_quantity` column to `product_fulfillment_options` table
- Migrated existing stock data from `products` table to
  `product_fulfillment_options`
- The `products.stock` column is retained for backward compatibility but should
  be considered deprecated

### 2. TypeScript Types (src/lib/types/fulfillment.ts)

Updated interfaces to include stock quantity:

```typescript
export interface ProductFulfillmentOption {
  providerId: string;
  providerName: string;
  cost: number;
  stockQuantity: number; // NEW
}

export interface DBProductFulfillmentOption {
  // ... existing fields
  stock_quantity: number; // NEW
}

export interface CreateProductFulfillmentOptionData {
  productId: string;
  providerId: string;
  cost: number;
  stockQuantity?: number; // NEW (optional, defaults to 0)
}
```

### 3. Database Functions (src/lib/server/db/fulfillment-providers.ts)

**getProductFulfillmentOptions():**

- Now returns `stockQuantity` field for each option
- Defaults to 0 if not set

**setProductFulfillmentOptions():**

- Now accepts `stockQuantity` in options array
- Inserts stock quantity when creating new fulfillment options
- Defaults to 0 if not provided

### 4. API Endpoints (src/routes/api/products/+server.ts)

Updated POST and PUT handlers to accept `stockQuantity` in `fulfillmentOptions`:

```typescript
fulfillmentOptions?: Array<{
  providerId: string;
  cost: number;
  stockQuantity?: number; // NEW
}>
```

### 5. Tests Updated

**src/routes/api/products/server.fulfillment.test.ts:**

- Added `stockQuantity` to test data
- Added assertions to verify stock quantity is saved and retrieved correctly

**src/lib/server/db/fulfillment-providers.test.ts:**

- Updated mock data to include `stock_quantity` field
- Added assertions to verify stock quantity in test cases

## Usage Example

### Creating a product with fulfillment options:

```typescript
const productData = {
  name: 'Test Product',
  description: 'Product description',
  price: 99.99,
  // ... other fields
  fulfillmentOptions: [
    { providerId: 'provider-1', cost: 5.99, stockQuantity: 100 },
    { providerId: 'provider-2', cost: 10.99, stockQuantity: 50 }
  ]
};

// POST /api/products
const response = await fetch('/api/products', {
  method: 'POST',
  body: JSON.stringify(productData)
});
```

### Updating fulfillment options:

```typescript
const updateData = {
  id: 'product-123',
  fulfillmentOptions: [{ providerId: 'provider-1', cost: 5.99, stockQuantity: 75 }]
};

// PUT /api/products
const response = await fetch('/api/products', {
  method: 'PUT',
  body: JSON.stringify(updateData)
});
```

## Migration Status

- ✅ Database schema updated
- ✅ TypeScript types updated
- ✅ Database functions updated
- ✅ API endpoints updated
- ✅ Tests updated and passing
- ✅ Local database migrated

## Next Steps

1. **Update UI Components:** Frontend components that display or manage product
   stock should be updated to show stock per fulfillment option
2. **Inventory Management:** Consider adding UI for managing stock quantities
   per fulfillment provider
3. **Stock Alerts:** Implement low stock alerts per fulfillment option
4. **Deprecation Plan:** Eventually remove the `products.stock` column once all
   code is updated

## Backward Compatibility

The `products.stock` field is still present in the database for backward
compatibility. Any existing code reading this field will continue to work, but
should be updated to use fulfillment option stock quantities instead.

## Testing

All 688 tests pass successfully, including:

- 4 tests in `server.fulfillment.test.ts` for product API with fulfillment
  options
- 15 tests in `fulfillment-providers.test.ts` for database operations
- All other existing tests remain passing
