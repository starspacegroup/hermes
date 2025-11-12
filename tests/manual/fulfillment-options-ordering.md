# Manual Testing Guide: Fulfillment Options Drag-and-Drop Ordering

## Prerequisites

1. Start the dev server: `npm run dev`
2. Navigate to admin dashboard
3. Go to Products section

## Test Scenarios

### Scenario 1: Create New Product with Multiple Fulfillment Options

**Steps:**

1. Click "Create New Product"
2. Fill in basic product details (name, description, price)
3. Scroll to "Fulfillment Options & Stock"
4. Select multiple fulfillment providers (e.g., Self, Provider A, Provider B)
5. Observe the initial order of providers
6. Click and hold the drag handle (⋮⋮) on one provider
7. Drag it to a different position
8. Release to drop
9. Set cost and stock for each provider
10. Save the product

**Expected Results:**

- ✅ Drag handle is visible on each provider option
- ✅ Provider option highlights/shows feedback when hovering
- ✅ During drag, the item appears slightly transparent
- ✅ Other items shift position as you drag over them
- ✅ Order is maintained after saving
- ✅ Upon reopening the product, the order is preserved

### Scenario 2: Edit Existing Product and Reorder

**Steps:**

1. Open an existing product with multiple fulfillment options
2. Observe the current order of fulfillment options
3. Drag the bottom provider to the top position
4. Drag the top provider to the bottom position
5. Save the product
6. Refresh the page or navigate away and back
7. Verify the new order is maintained

**Expected Results:**

- ✅ Existing order is displayed correctly when opening
- ✅ Drag-and-drop works smoothly
- ✅ New order is saved to database
- ✅ Order persists across page loads

### Scenario 3: Add New Provider and Position It

**Steps:**

1. Open a product with some fulfillment options already selected
2. Select a new provider that wasn't previously selected
3. Observe where it appears in the list (should be at bottom)
4. Drag it to the desired position (e.g., second position)
5. Save the product
6. Verify the position is maintained

**Expected Results:**

- ✅ New provider appears at the bottom of the list
- ✅ Can be dragged to any position
- ✅ Position is saved correctly

### Scenario 4: Deselect and Reselect Provider

**Steps:**

1. Open a product with multiple fulfillment options
2. Uncheck one of the middle providers
3. Recheck the same provider
4. Observe where it reappears in the list
5. Save without changing order
6. Verify behavior

**Expected Results:**

- ✅ Unchecking removes the cost/stock inputs
- ✅ Rechecking restores them
- ✅ Provider maintains its position in the list
- ✅ Order is preserved

### Scenario 5: Single Provider (No Reordering Needed)

**Steps:**

1. Create or edit a product
2. Select only one fulfillment provider
3. Observe the drag handle is still visible
4. Try to drag (should work but have no visual effect)
5. Save the product

**Expected Results:**

- ✅ Drag handle is present
- ✅ Dragging doesn't cause errors
- ✅ Single provider saves correctly

### Scenario 6: Database Verification

**Steps:**

1. Create/edit a product with 3 providers in specific order:
   - Position 0: Provider B
   - Position 1: Self
   - Position 2: Provider A
2. Save the product
3. Check database directly:
   ```bash
   npm run wrangler d1 execute DB --local --command "SELECT product_id, provider_id, sort_order FROM product_fulfillment_options WHERE product_id = 'YOUR_PRODUCT_ID' ORDER BY sort_order"
   ```

**Expected Results:**

- ✅ `sort_order` column contains: 0, 1, 2
- ✅ `provider_id` values match the order set in UI
- ✅ Sequential numbering with no gaps

### Scenario 7: Visual Feedback Testing

**Steps:**

1. Open product edit page
2. Hover over a fulfillment option (not dragging)
3. Click and hold the drag handle
4. While holding, move mouse up and down
5. Release the drag

**Expected Results:**

- ✅ Hover shows subtle border/shadow effect
- ✅ Drag handle cursor changes to grab/grabbing
- ✅ During drag, item becomes semi-transparent
- ✅ Items reorder smoothly as you drag over them
- ✅ No flickering or visual glitches

## Edge Cases to Test

### Edge Case 1: Many Providers (10+)

- Create a product with many fulfillment providers
- Test drag-and-drop performance
- Verify scrolling works if list is long

### Edge Case 2: Rapid Clicking/Dragging

- Quickly click and drag multiple times
- Verify no race conditions or state issues

### Edge Case 3: Cancel Without Saving

- Reorder providers
- Click Cancel instead of Save
- Reopen the product
- Verify original order is maintained

### Edge Case 4: Browser Compatibility

- Test in Chrome, Firefox, Safari, Edge
- Verify drag-and-drop works in all browsers

## Accessibility Testing

### Keyboard Navigation

- Tab through the form
- Verify drag handle is focusable
- Note: Keyboard drag-and-drop may require future enhancement

### Screen Reader

- Use screen reader (NVDA/JAWS)
- Verify list and listitem roles are announced
- Verify form fields are properly labeled

## Performance Testing

1. Create product with 20+ providers
2. Drag items up and down the list
3. Monitor for lag or frame drops
4. Verify smooth 60fps animation

## Validation

After all tests, verify:

- [ ] Drag-and-drop works smoothly
- [ ] Order is saved to database correctly
- [ ] Order is retrieved and displayed correctly
- [ ] Visual feedback is appropriate
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Tests pass: `npm test`

## Troubleshooting

### Issue: Drag doesn't work

- Check browser console for errors
- Verify `draggable="true"` is set
- Check if drag event handlers are attached

### Issue: Order not saved

- Check network tab for API request
- Verify `sortOrder` is included in request payload
- Check server logs for errors

### Issue: Order not retrieved correctly

- Verify database migration ran successfully
- Check if `sort_order` column exists
- Verify SQL ORDER BY includes `sort_order`

## Success Criteria

All scenarios pass ✅ and:

1. Drag-and-drop is intuitive and smooth
2. Order is persisted correctly
3. No regressions in existing functionality
4. Visual design is consistent with app theme
5. Accessibility requirements met
