-- Cleanup Duplicate Recipes
-- Run this in Supabase SQL Editor

-- Delete orphan recipes created by failed TS script
DELETE FROM public.recipes WHERE id = 'daily-maize-porridge-power-pap';
DELETE FROM public.recipes WHERE id = 'rice-lentil-recovery' AND id NOT IN (SELECT DISTINCT recipe_id FROM public.ingredients);
DELETE FROM public.recipes WHERE id = 'iron-spinach-stir-fry' AND id NOT IN (SELECT DISTINCT recipe_id FROM public.ingredients);

-- Verify remaining
SELECT id, title FROM public.recipes WHERE title LIKE '%Pap%' OR title LIKE '%Rice%' OR title LIKE '%Spinach%';
