-- Migration: 0017_add_fulfillment_options_sort_order
-- Description: Add sort_order column to product_fulfillment_options table for drag-and-drop ordering
-- Rollback: ALTER TABLE product_fulfillment_options DROP COLUMN sort_order;

-- Add sort_order column to product_fulfillment_options
ALTER TABLE product_fulfillment_options 
ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;

-- Update existing records with sequential sort_order based on current ordering
-- This ensures existing fulfillment options maintain their current order
UPDATE product_fulfillment_options
SET sort_order = (
  SELECT COUNT(*)
  FROM product_fulfillment_options pfo2
  WHERE pfo2.product_id = product_fulfillment_options.product_id
    AND pfo2.site_id = product_fulfillment_options.site_id
    AND pfo2.id <= product_fulfillment_options.id
) - 1;

-- Create index for better query performance when ordering
CREATE INDEX IF NOT EXISTS idx_product_fulfillment_options_sort ON product_fulfillment_options(product_id, sort_order);
