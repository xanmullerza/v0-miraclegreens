-- Migration to add difficulty and tags fields to recipes table
ALTER TABLE public.recipes 
ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'Medium',
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::text[];

COMMENT ON COLUMN public.recipes.difficulty IS 'Recipe difficulty level (Easy, Medium, Hard)';
COMMENT ON COLUMN public.recipes.tags IS 'Array of tags for categorization (e.g., #Quick, #Budget, etc.)';
