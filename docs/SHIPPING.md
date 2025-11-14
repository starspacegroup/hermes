# Shipping Options System

## Overview

The Shipping Options system allows store owners to configure flexible shipping methods that customers can choose during checkout. This is separate from the fulfillment system:

- **Fulfillment** = Who/where the product ships from (warehouse, 3PL, etc.)
- **Shipping** = How the customer receives the product (Standard, Express, Overnight, etc.)

## Features

### Global Shipping Options
- Create, edit, and delete shipping methods site-wide
- Configure name, price, estimated delivery time, carrier
- Set free shipping thresholds
- Enable/disable shipping options

### Product-Level Configuration
- Assign specific shipping options to individual products
- Set a default shipping option
- Override price and free shipping threshold per product
- Automatic exclusion for digital/downloadable products

### Category-Level Defaults (Database Support)
- Database schema supports category-level shipping defaults
- Products inherit category shipping options when not overridden
- UI implementation can be added in future

### Checkout Integration
- Calculate available shipping based on cart contents
- Show union of shipping options for all products
- Display only options common to all physical items
- Auto-exclude shipping for digital-only carts
- Apply free shipping thresholds based on cart total

## Database Schema

### Tables

#### `shipping_options`
Global shipping methods available site-wide.

```sql
CREATE TABLE shipping_options (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL DEFAULT 0,
  estimated_days_min INTEGER,
  estimated_days_max INTEGER,
  carrier TEXT,
  free_shipping_threshold REAL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);
```

#### `product_shipping_options`
Many-to-many junction table linking products to shipping options.

```sql
CREATE TABLE product_shipping_options (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  shipping_option_id TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  price_override REAL,
  threshold_override REAL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (shipping_option_id) REFERENCES shipping_options(id) ON DELETE CASCADE,
  UNIQUE(product_id, shipping_option_id)
);
```

#### `category_shipping_options`
Many-to-many junction table for category-level defaults.

```sql
CREATE TABLE category_shipping_options (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  category TEXT NOT NULL,
  shipping_option_id TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  FOREIGN KEY (shipping_option_id) REFERENCES shipping_options(id) ON DELETE CASCADE,
  UNIQUE(category, shipping_option_id)
);
```

## API Endpoints

### Admin Shipping Management

#### `GET /api/admin/shipping`
List all shipping options for the site.

**Response:**
```json
[
  {
    "id": "ship-1",
    "siteId": "default-site",
    "name": "Standard Shipping",
    "description": "5-7 business days",
    "price": 9.99,
    "estimatedDaysMin": 5,
    "estimatedDaysMax": 7,
    "carrier": "USPS",
    "freeShippingThreshold": 50.00,
    "isActive": true,
    "createdAt": 1234567890,
    "updatedAt": 1234567890
  }
]
```

#### `POST /api/admin/shipping`
Create a new shipping option.

**Request Body:**
```json
{
  "name": "Express Shipping",
  "description": "2-3 business days",
  "price": 19.99,
  "estimatedDaysMin": 2,
  "estimatedDaysMax": 3,
  "carrier": "FedEx",
  "freeShippingThreshold": 100.00,
  "isActive": true
}
```

#### `PUT /api/admin/shipping`
Update an existing shipping option.

**Request Body:**
```json
{
  "id": "ship-1",
  "price": 12.99,
  "freeShippingThreshold": 75.00
}
```

#### `DELETE /api/admin/shipping`
Delete a shipping option.

**Request Body:**
```json
{
  "id": "ship-1"
}
```

### Product Shipping Assignment

Shipping options are managed through the products API:

#### `GET /api/products`
Includes `shippingOptions` array in product data.

#### `POST /api/products` and `PUT /api/products`
Include `shippingOptions` in request body:

```json
{
  "name": "Premium Headphones",
  "type": "physical",
  "shippingOptions": [
    {
      "shippingOptionId": "ship-standard",
      "isDefault": true,
      "priceOverride": null,
      "thresholdOverride": null
    },
    {
      "shippingOptionId": "ship-express",
      "isDefault": false,
      "priceOverride": 15.99,
      "thresholdOverride": null
    }
  ]
}
```

### Checkout Shipping Calculation

#### `POST /api/checkout/shipping`
Calculate available shipping options for cart items.

**Request Body:**
```json
{
  "cartItems": [
    {
      "id": "product-1",
      "type": "physical",
      "category": "Electronics",
      "price": 99.99,
      "quantity": 1
    }
  ]
}
```

**Response:**
```json
{
  "options": [
    {
      "id": "ship-standard",
      "name": "Standard Shipping",
      "description": "5-7 business days",
      "price": 9.99,
      "estimatedDaysMin": 5,
      "estimatedDaysMax": 7,
      "carrier": "USPS",
      "isDefault": true,
      "isFreeShipping": false
    }
  ],
  "hasPhysicalProducts": true
}
```

## Admin UI

### Global Shipping Settings

Navigate to **Admin → Settings → Shipping** to manage shipping options.

**Features:**
- View all shipping options in card layout
- Create new shipping option (modal dialog)
- Edit existing shipping option
- Delete shipping option
- Toggle active/inactive status
- Responsive design with dark mode support

### Product Shipping Tab

When editing a product, the shipping options appear after fulfillment options (physical products only).

**Features:**
- Multi-select shipping options with checkboxes
- Radio button to set default shipping
- Optional price override per product
- Optional free shipping threshold override
- Automatically hidden for digital products

## Business Logic

### Inheritance Priority

1. **Product-specific** shipping options (highest priority)
2. **Category-level** defaults (if no product-specific options)
3. **No shipping** if neither configured

### Cart Shipping Calculation

When calculating available shipping for a checkout:

1. Get all physical products in cart
2. For each product, get its shipping options (or category defaults)
3. Find **intersection** of all product shipping options
4. Only options available for ALL products are shown
5. Apply free shipping thresholds based on cart total
6. Return empty array for digital-only carts

**Example:**
- Product A: Standard, Express
- Product B: Express, Overnight
- Cart Result: **Express** (only common option)

### Digital Products

- Automatically exclude all shipping options
- No shipping section shown in product form
- Zero shipping cost at checkout
- Mixed cart (physical + digital) shows shipping for physical items only

## TypeScript Types

### ShippingOption
```typescript
interface ShippingOption {
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
```

### ProductShippingOption
```typescript
interface ProductShippingOption {
  id: string;
  siteId: string;
  productId: string;
  shippingOptionId: string;
  isDefault: boolean;
  priceOverride: number | null;
  thresholdOverride: number | null;
  createdAt: number;
  updatedAt: number;
}
```

### AvailableShippingOption
```typescript
interface AvailableShippingOption {
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
```

## Testing

### Unit Tests

Database functions are tested in `src/lib/server/db/shipping-options.test.ts`:
- CRUD operations for shipping options
- Product shipping assignment
- Category shipping assignment
- Cart shipping calculation logic

Run tests:
```bash
npm test -- shipping-options.test.ts
```

### Integration Testing

To test the complete flow:

1. Create shipping options via Admin UI
2. Assign to products
3. Add products to cart
4. Verify correct options at checkout

## Migration Notes

### Running the Migration

```bash
# Local database
npm run db:migrate:local

# Preview/staging
npm run db:migrate:preview

# Production
npm run db:migrate
```

### Default Data

Migration `0018_shipping_options.sql` creates three default options:
- Standard Shipping ($9.99, 5-7 days)
- Express Shipping ($19.99, 2-3 days)
- Overnight Shipping ($29.99, 1 day)

### Rollback

```sql
DROP TABLE IF EXISTS product_shipping_options;
DROP TABLE IF EXISTS category_shipping_options;
DROP TABLE IF EXISTS shipping_options;
```

## Future Enhancements

### Not Implemented (Scope)
- Real-time carrier rate shopping (UPS, FedEx, USPS APIs)
- Geographic shipping zones or restrictions
- Weight-based shipping calculations
- Local pickup options
- Tax calculation on shipping
- Category UI for shipping defaults

### Possible Extensions
- Volume/dimensional weight pricing
- Multiple warehouse support with location-based shipping
- International shipping with customs support
- Shipping insurance options
- Customer shipping address validation
- Estimated delivery date calculator

## Troubleshooting

### No shipping options show at checkout

**Possible causes:**
1. Cart contains only digital products (expected behavior)
2. No shipping options assigned to products
3. Products have different shipping options with no common intersection
4. All shipping options are inactive

**Solution:**
- Verify products have type="physical"
- Check product shipping assignments
- Ensure at least one common shipping option across all cart products
- Check shipping option active status

### Free shipping not applied

**Check:**
1. Cart total meets or exceeds threshold
2. Threshold set correctly in shipping option
3. No product-level threshold override conflicting

### Price overrides not working

**Verify:**
1. Override value is set in product shipping options
2. Product API is saving overrides correctly
3. Checkout API is reading overrides from product_shipping_options table

## Related Documentation

- [Multi-Tenant Architecture](./MULTI_TENANT.md)
- [Fulfillment Providers](./FULFILLMENT_PROVIDERS_ADMIN.md)
- [Database Management](./DATABASE_MANAGEMENT.md)
- [Checkout and Orders](./CHECKOUT_AND_ORDERS.md)
