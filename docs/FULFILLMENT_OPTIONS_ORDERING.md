# Fulfillment Options Drag-and-Drop Ordering

## Overview

Implemented drag-and-drop ordering for fulfillment options on products, allowing
administrators to set the priority of fulfillment providers for each product.
This feature enables the system to determine which fulfillment option to use for
each product based on the user-defined order.

## Changes Made

### 1. Database Migration (`migrations/0017_add_fulfillment_options_sort_order.sql`)

- Added `sort_order` INTEGER column to `product_fulfillment_options` table
- Automatically migrated existing records with sequential sort_order values
- Created index for better query performance:
  `idx_product_fulfillment_options_sort`

### 2. Type Definitions

#### `src/lib/types/fulfillment.ts`

- Added `sortOrder: number` to `ProductFulfillmentOption` interface
- Added `sort_order: number` to `DBProductFulfillmentOption` interface
- Added optional `sortOrder?: number` to `CreateProductFulfillmentOptionData`
  interface

#### `src/lib/types/index.ts`

- Added `sortOrder: number` to fulfillmentOptions array in `Product` interface

### 3. Database Operations (`src/lib/server/db/fulfillment-providers.ts`)

#### `getProductFulfillmentOptions()`

- Updated to fetch and return `sortOrder` field
- Modified ORDER BY clause to prioritize `sort_order ASC` first, then existing
  criteria

#### `setProductFulfillmentOptions()`

- Updated to accept optional `sortOrder` parameter in options array
- Automatically assigns sequential sort_order based on array index if not
  provided
- Includes `sort_order` in INSERT statement

### 4. UI Component (`src/lib/components/admin/ProductForm.svelte`)

#### New Features

- **Drag-and-Drop Reordering**: Fulfillment options can be dragged to change
  their priority order
- **Visual Feedback**:
  - Drag handle (⋮⋮) indicator on each option
  - Dragging state with opacity and scale animation
  - Hover effects on provider options
- **Ordered Display**: Options displayed in user-defined order, not
  alphabetically

#### Implementation Details

- Added `orderedProviderIds: string[]` array to track provider order
- Implemented drag-and-drop event handlers:
  - `handleDragStart()` - Initiates drag operation
  - `handleDragOver()` - Handles reordering during drag
  - `handleDragEnd()` - Cleans up after drag
  - `handleDrop()` - Finalizes the drop operation
- Updated submit handler to include `sortOrder` based on array position
- Added accessibility attributes: `role="list"` and `role="listitem"`

#### CSS Enhancements

- `.provider-option`: Enhanced with padding, border-radius, and hover effects
- `.dragging`: Visual feedback during drag operation
- `.provider-header`: Contains drag handle and checkbox
- `.drag-handle`: Styled grip indicator with grab cursor

### 5. Tests (`src/lib/server/db/fulfillment-providers.test.ts`)

Added new test cases:

- ✅ Verifies `sortOrder` is returned in `getProductFulfillmentOptions()`
- ✅ Confirms query includes `ORDER BY sort_order`
- ✅ Tests explicit sort order assignment in `setProductFulfillmentOptions()`
- ✅ Validates automatic sort order assignment based on array index
- ✅ All existing tests updated to include `sort_order` in mock data

## Usage

### For Administrators

1. Navigate to product edit page
2. Scroll to "Fulfillment Options & Stock" section
3. Select fulfillment providers with checkboxes
4. **Drag providers** up or down using the ⋮⋮ handle to set priority
5. Set cost and stock for each provider
6. Save product

### Priority Logic

The system will use fulfillment options in the order specified:

- **Position 0**: First priority (top of list)
- **Position 1**: Second priority
- **Position 2**: Third priority, etc.

When processing orders, the system can now check fulfillment options in the
user-defined order, allowing logic like:

- Try first provider if stock available
- Fall back to second provider if first is out of stock
- Continue down the list until a suitable provider is found

## Technical Details

### Sort Order Assignment

- **Explicit**: When `sortOrder` is provided in the options array, it is used
  directly
- **Automatic**: When `sortOrder` is not provided, it defaults to the array
  index (0, 1, 2, ...)
- **Persistence**: Sort order is stored in the database and maintained across
  edits

### Drag-and-Drop Behavior

- Uses native HTML5 drag-and-drop API
- Reorders array in real-time during drag operation
- Preserves order when saving to database
- Works seamlessly with existing checkbox/input interactions

### Accessibility

- ARIA roles added for screen reader support
- Keyboard-friendly drag handle
- Visual indicators for drag state

## Future Enhancements

Potential improvements for future iterations:

- Touch device support for mobile drag-and-drop
- Keyboard shortcuts for reordering (Arrow keys)
- Visual indicators showing which provider will be used first
- Bulk reordering interface for products with many options
- Order presets or templates

## Migration Notes

### Backward Compatibility

- Existing products without sort_order will be automatically assigned sequential
  values
- Default ordering maintains current behavior (default provider first, then
  alphabetically)
- No breaking changes to existing API endpoints

### Rollback

To rollback this feature:

```sql
ALTER TABLE product_fulfillment_options DROP COLUMN sort_order;
DROP INDEX IF EXISTS idx_product_fulfillment_options_sort;
```

## Related Files

- `migrations/0017_add_fulfillment_options_sort_order.sql`
- `src/lib/types/fulfillment.ts`
- `src/lib/types/index.ts`
- `src/lib/server/db/fulfillment-providers.ts`
- `src/lib/server/db/fulfillment-providers.test.ts`
- `src/lib/components/admin/ProductForm.svelte`
