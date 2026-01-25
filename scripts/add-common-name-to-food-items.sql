-- Add common_name column to food_items table
-- This allows users to save "Friendly Names" (e.g., "Skirt Steak") 
-- for verbose USDA items (e.g., "Beef, plate, inside skirt steak...").
ALTER TABLE public.food_items ADD COLUMN common_name TEXT;

-- Create an index on common_name for faster searching
CREATE INDEX IF NOT EXISTS idx_food_items_common_name ON public.food_items USING gin (common_name gin_trgm_ops) WHERE common_name IS NOT NULL;
-- Note: gin_trgm_ops requires pg_trgm extension. If not available, use dynamic fallback:
-- CREATE INDEX IF NOT EXISTS idx_food_items_common_name ON public.food_items (common_name) WHERE common_name IS NOT NULL;
