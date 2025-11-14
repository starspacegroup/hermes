-- Migration: 0019_add_shipping_details
-- Description: Add shipping_details JSON field to orders table to store package groups and shipping options
-- Rollback: ALTER TABLE orders DROP COLUMN shipping_details;

-- Add shipping_details column to orders table
-- This will store information about shipping groups and selected options per group
ALTER TABLE orders ADD COLUMN shipping_details TEXT;

-- The shipping_details field will store a JSON object with this structure:
-- {
--   "groups": [
--     {
--       "id": "group-0",
--       "shippingOptionId": "ship-standard-default",
--       "shippingOptionName": "Standard Shipping",
--       "shippingCost": 9.99,
--       "products": [
--         {
--           "id": "product-id",
--           "name": "Product Name",
--           "quantity": 1
--         }
--       ]
--     }
--   ]
-- }
