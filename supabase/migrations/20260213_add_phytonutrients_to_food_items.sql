-- Add phytonutrients column to food_items table
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS phytonutrients JSONB DEFAULT '{}'::jsonb;

-- Comment on column
COMMENT ON COLUMN food_items.phytonutrients IS 'Stores phytonutrient data as a JSONB object where keys are names and values are descriptions.';
