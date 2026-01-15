-- Update recipes table to allow decimal values for precise nutrition
ALTER TABLE public.recipes 
  ALTER COLUMN protein TYPE numeric,
  ALTER COLUMN carbs TYPE numeric,
  ALTER COLUMN fat TYPE numeric,
  ALTER COLUMN calories TYPE numeric;

-- Verify the change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'recipes' 
  AND column_name IN ('protein', 'carbs', 'fat', 'calories');
