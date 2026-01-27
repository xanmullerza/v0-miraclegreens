-- Add category column to food_items
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS category text DEFAULT 'General';
