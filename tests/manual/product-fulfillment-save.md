# Manual Test: Product Fulfillment Options Save Functionality

## Test Overview

Verify that fulfillment options are correctly saved when creating or updating a
product.

## Prerequisites

- Development server running (`npm run dev`)
- At least one fulfillment provider created in the system
- Admin/platform engineer access

## Test Steps

### Test 1: Create Product with Fulfillment Options

1. **Navigate to Products**
   - Go to `/admin/products`
   - Click "Add Product" button

2. **Fill Product Details**
   - Name: "Test Product - Fulfillment"
   - Description: "Testing fulfillment options"
   - Price: 99.99
   - Category: "Electronics"
   - Stock: 10
   - Type: Physical Product

3. **Select Fulfillment Options**
   - Check one or more fulfillment providers
   - Enter cost for each selected provider (e.g., 5.99, 10.99)

4. **Save Product**
   - Click "Save Product" button
   - Verify success toast message appears
   - Verify redirect to products list

5. **Verify Save**
   - Click on the newly created product to edit
   - Verify fulfillment options are checked
   - Verify costs match what was entered

### Test 2: Update Product Fulfillment Options

1. **Edit Existing Product**
   - Navigate to `/admin/products`
   - Click on an existing product

2. **Modify Fulfillment Options**
   - Check additional providers
   - Uncheck some existing providers
   - Change costs for existing providers

3. **Save Changes**
   - Click "Save Product" button
   - Verify success toast message

4. **Verify Update**
   - Re-open the product for editing
   - Verify new providers are checked
   - Verify unchecked providers are not saved
   - Verify updated costs are correct

### Test 3: Clear All Fulfillment Options

1. **Edit Product**
   - Open product with fulfillment options

2. **Uncheck All Providers**
   - Uncheck all fulfillment provider checkboxes

3. **Save**
   - Click "Save Product"

4. **Verify**
   - Re-open product
   - Verify no providers are selected

### Test 4: API Verification

1. **Open Browser DevTools**
   - Navigate to Network tab

2. **Save Product with Fulfillment Options**
   - Edit any product
   - Select fulfillment options
   - Click Save

3. **Inspect Network Request**
   - Find the PUT request to `/api/products`
   - Check Request Payload - verify `fulfillmentOptions` array is present
   - Example:
     ```json
     {
       "id": "product-123",
       "name": "Test Product",
       "fulfillmentOptions": [
         { "providerId": "provider-1", "cost": 5.99 },
         { "providerId": "provider-2", "cost": 10.99 }
       ]
     }
     ```

4. **Check Response**
   - Verify response includes `fulfillmentOptions` in returned product
   - Verify status is 200

### Test 5: Database Verification

1. **Open D1 Console**
   - Run:
     `npm run wrangler d1 execute DB --local --command "SELECT * FROM product_fulfillment_options WHERE product_id = 'YOUR_PRODUCT_ID'"`

2. **Verify Records**
   - Check that records exist for selected providers
   - Verify `cost` values match what was entered
   - Verify `site_id` is correct

## Expected Results

✅ **Create Product**: Fulfillment options are saved correctly ✅ **Update
Product**: Changes to fulfillment options are persisted ✅ **Clear Options**:
Removing all options works correctly ✅ **API Request**: Request payload
includes fulfillmentOptions ✅ **API Response**: Response includes saved
fulfillmentOptions ✅ **Database**: Records in `product_fulfillment_options`
table match selections

## Known Issues

- None currently identified

## Implementation Details

### Backend

- **Endpoint**: `PUT /api/products` (src/routes/api/products/+server.ts)
- **Handler**: Lines 169-171 handle fulfillment options update
- **Database Function**: `setProductFulfillmentOptions` in
  `src/lib/server/db/fulfillment-providers.ts`

### Frontend

- **Component**: `ProductForm.svelte`
- **Lines 90-95**: Builds fulfillment options array
- **Line 108**: Includes in productData sent to API
- **Lines 268-305**: UI for selecting providers and entering costs

### Database

- **Table**: `product_fulfillment_options`
- **Migration**: `0015_fulfillment_providers.sql`

## Troubleshooting

### Issue: Fulfillment options not saving

1. Check browser console for errors
2. Check network tab - verify request includes fulfillmentOptions
3. Check server logs for database errors
4. Verify fulfillment providers exist in database

### Issue: Options disappear after save

1. Verify API response includes fulfillmentOptions
2. Check database for records in product_fulfillment_options
3. Verify site_id matches between product and options

### Issue: Cost values incorrect

1. Ensure input type="number" is used
2. Verify Number() conversion in backend
3. Check for floating-point precision issues
