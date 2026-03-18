-- Migration to add equipment field to recipes table
ALTER TABLE public.recipes 
ADD COLUMN IF NOT EXISTS equipment TEXT[] DEFAULT '{}'::text[];

COMMENT ON COLUMN public.recipes.equipment IS 'Array of equipment types needed for the recipe (e.g., blender, wok, oven, etc.)';
