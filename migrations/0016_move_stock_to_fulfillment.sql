-- Migration: 0016_move_stock_to_fulfillment
-- Description: Move stock quantity from products table to product_fulfillment_options table
--              Stock should be tracked per fulfillment option, not per product
-- Rollback: ALTER TABLE product_fulfillment_options DROP COLUMN stock_quantity;

-- Add stock_quantity column to product_fulfillment_options
ALTER TABLE product_fulfillment_options 
ADD COLUMN stock_quantity INTEGER NOT NULL DEFAULT 0;

-- Migrate existing stock data from products to product_fulfillment_options
-- For products with fulfillment options, copy stock to each option
UPDATE product_fulfillment_options
SET stock_quantity = (
  SELECT stock 
  FROM products 
  WHERE products.id = product_fulfillment_options.product_id
)
WHERE EXISTS (
  SELECT 1 
  FROM products 
  WHERE products.id = product_fulfillment_options.product_id
);

-- Note: The products.stock column is kept for backward compatibility
-- but should be considered deprecated. New code should use 
-- product_fulfillment_options.stock_quantity instead.
