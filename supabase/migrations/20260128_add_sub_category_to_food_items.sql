-- Add sub_category column to food_items
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS sub_category text;
