-- Migration to support Mixes feature
-- 1. Add is_mix column to recipes
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS is_mix boolean DEFAULT false;

-- 2. Add source and recipe_id columns to food_items
-- source: 'usda', 'manual', 'mix'
ALTER TABLE public.food_items ADD COLUMN IF NOT EXISTS source text DEFAULT 'usda'; 
ALTER TABLE public.food_items ADD COLUMN IF NOT EXISTS recipe_id text UNIQUE REFERENCES public.recipes(id) ON DELETE CASCADE;

-- 3. Update existing data if needed (default to usda/manual)
UPDATE public.food_items SET source = 'manual' WHERE source IS NULL;
