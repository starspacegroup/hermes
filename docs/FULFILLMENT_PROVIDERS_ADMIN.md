# Fulfillment Providers Admin Panel

## Overview

The Fulfillment Providers admin panel allows administrators to manage
fulfillment options for products. This includes creating, reading, updating, and
deleting fulfillment providers that can be assigned to products with associated
costs.

## Location

- **Admin Panel URL**: `/admin/providers`
- **API Endpoints**: `/api/admin/providers`
- **Database Tables**: `fulfillment_providers`, `product_fulfillment_options`

## Features

### 1. List Providers

- View all fulfillment providers for the current site
- Sorted by default status (default first) and then alphabetically by name
- Shows provider name, description, status badges (Default, Inactive)
- Empty state displayed when no providers exist

### 2. Create Provider

- Click "Add Provider" button to open creation modal
- Required fields:
  - **Name**: Provider name (required)
- Optional fields:
  - **Description**: Provider description
  - **Active**: Toggle to enable/disable provider (default: enabled)

### 3. Edit Provider

- Click "Edit" button on any provider card
- Update name, description, or active status
- Changes saved immediately with toast notification

### 4. Delete Provider

- Click "Delete" button on any provider card (not available for default
  provider)
- Confirmation modal prevents accidental deletion
- Provider and associated product options are removed

## Technical Details

### Frontend Components

**Location**: `src/routes/admin/providers/+page.svelte`

- Full CRUD interface with modals
- Responsive design (mobile-friendly)
- Toast notifications for user feedback
- Form validation (client and server-side)

### Server-Side Load Function

**Location**: `src/routes/admin/providers/+page.server.ts`

```typescript
export const load: PageServerLoad = async ({ platform, locals }) => {
  const db = getDB(platform);
  const siteId = locals.siteId || 'default-site';
  const dbProviders = await getAllFulfillmentProviders(db, siteId);

  return { providers };
};
```

### API Endpoints

**Location**: `src/routes/api/admin/providers/+server.ts`

#### GET `/api/admin/providers`

- Fetches all providers for the current site
- Returns: Array of `FulfillmentProvider` objects
- Status: 200 OK

#### POST `/api/admin/providers`

- Creates a new provider
- Body: `{ name: string, description?: string, isActive?: boolean }`
- Returns: Created `FulfillmentProvider` object
- Status: 201 Created

#### PUT `/api/admin/providers`

- Updates an existing provider
- Body:
  `{ id: string, name?: string, description?: string, isActive?: boolean }`
- Returns: Updated `FulfillmentProvider` object
- Status: 200 OK

#### DELETE `/api/admin/providers`

- Deletes a provider
- Body: `{ id: string }`
- Returns: `{ success: true }`
- Status: 200 OK

### Database Functions

**Location**: `src/lib/server/db/fulfillment-providers.ts`

- `getAllFulfillmentProviders(db, siteId)` - List all providers
- `getFulfillmentProviderById(db, siteId, providerId)` - Get single provider
- `createFulfillmentProvider(db, siteId, data)` - Create provider
- `updateFulfillmentProvider(db, siteId, providerId, data)` - Update provider
- `deleteFulfillmentProvider(db, siteId, providerId)` - Delete provider
- `getProductFulfillmentOptions(db, siteId, productId)` - Get product options
- `setProductFulfillmentOptions(db, siteId, productId, options)` - Set product
  options

All functions are multi-tenant aware and scoped by `site_id`.

### Type Definitions

**Location**: `src/lib/types/fulfillment.ts`

```typescript
export interface FulfillmentProvider {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  isActive: boolean;
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
```

## Navigation

The Providers link is added to the admin sidebar navigation between "Products"
and "Pages".

**Location**: `src/routes/admin/+layout.svelte`

```svelte
<a
  href="/admin/providers"
  class:active={currentPath.startsWith('/admin/providers')}
  on:click={closeSidebar}
>
  <svg><!-- Icon --></svg>
  Providers
</a>
```

## Default Provider

The system includes a default "Self" provider created during migration:

```sql
INSERT OR IGNORE INTO fulfillment_providers (id, site_id, name, description, is_default, is_active)
VALUES ('provider-self-default', 'default-site', 'Self', 'Self-fulfilled by store', 1, 1);
```

- Cannot be deleted (Delete button hidden)
- Always appears first in the list
- Marked with "Default" badge

## Multi-Tenant Support

All operations are scoped by `site_id`:

- Providers are isolated per site
- Each site has its own default provider
- Queries include `site_id` in WHERE clauses
- Foreign key relationships maintain data integrity

## Security

- **Authentication**: Requires admin role to access panel
- **Authorization**: All API endpoints check user permissions
- **Validation**: Server-side validation for all inputs
- **Multi-tenant isolation**: Prevents cross-site data access

## Testing

**Location**: `src/routes/api/admin/providers/+server.test.ts`

Comprehensive test suite covering:

- ✅ GET: Fetch all providers
- ✅ POST: Create provider with validation
- ✅ PUT: Update provider with validation
- ✅ DELETE: Delete provider with validation
- ✅ Error handling: Database unavailable scenarios
- ✅ Edge cases: Empty names, missing IDs, not found

Run tests:

```bash
npm test -- src/routes/api/admin/providers/+server.test.ts
```

## Usage Example

### Creating a Provider via UI

1. Navigate to `/admin/providers`
2. Click "Add Provider" button
3. Enter provider details:
   - Name: "Amazon FBA"
   - Description: "Fulfilled by Amazon"
   - Active: ✓ (checked)
4. Click "Create"
5. Provider is created and appears in the list

### Assigning to Products

Providers are assigned to products through the product edit interface. Each
product can have multiple fulfillment options with associated costs.

## Future Enhancements

Potential improvements:

- **Provider Settings**: Additional configuration fields (API keys, webhooks)
- **Cost Calculator**: Automated cost calculation based on product
  weight/dimensions
- **Integration**: Direct integration with third-party fulfillment services
- **Analytics**: Track fulfillment performance by provider
- **Bulk Operations**: Assign providers to multiple products at once

## Related Documentation

- [Multi-Tenant Architecture](./MULTI_TENANT.md)
- [Database Management](./DATABASE_MANAGEMENT.md)
- [Product Media](./PRODUCT_MEDIA.md)
