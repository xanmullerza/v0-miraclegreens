-- Update egg recipe with precise calculated values
UPDATE public.recipes 
SET 
  calories = 77.5,
  protein = 6.29,
  carbs = 0.56,
  fat = 5.305
WHERE id = 'egg-raw-1';

-- Verify the update
SELECT id, title, calories, protein, carbs, fat 
FROM public.recipes 
WHERE id = 'egg-raw-1';
