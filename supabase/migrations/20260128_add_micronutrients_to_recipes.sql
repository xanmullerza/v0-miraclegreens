
-- Add micronutrients column to recipes table
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS micronutrients JSONB DEFAULT '{}'::jsonb;
