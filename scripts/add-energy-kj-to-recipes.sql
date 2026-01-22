-- Add energy_kj column to recipes table for total nutrition tracking
ALTER TABLE public.recipes 
ADD COLUMN energy_kj numeric;

-- Backfill energy_kj based on calories if needed (approximate: 1 kcal = 4.184 kJ)
-- UPDATE public.recipes SET energy_kj = calories * 4.184 WHERE energy_kj IS NULL;

-- Verify
SELECT id, title, calories, energy_kj FROM public.recipes LIMIT 5;
