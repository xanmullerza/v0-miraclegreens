-- Fix Malnutrition Recipe Weights (Math) to match Text
-- Run this in Supabase SQL Editor

-- 1. Rice: Update weight from 100g to 158g (1 Cup)
UPDATE public.ingredients
SET weight_g = 158
WHERE recipe_id = 'rice-lentil-recovery' AND item LIKE '%Rice%';

-- 2. Spinach: Update weight from 200g to 180g (1 Cup)
UPDATE public.ingredients
SET weight_g = 180
WHERE recipe_id = 'iron-spinach-stir-fry' AND item LIKE '%Spinach%';

-- Verification
SELECT recipe_id, item, amount, weight_g
FROM public.ingredients
WHERE recipe_id IN ('rice-lentil-recovery', 'iron-spinach-stir-fry')
ORDER BY recipe_id;
