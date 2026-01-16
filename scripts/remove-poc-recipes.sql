-- Remove Proof-of-Concept Recipes
-- Keep food_items (Kale, Egg, etc.) for future recipes
-- Run this in Supabase SQL Editor

DELETE FROM public.recipes WHERE id = 'kale-egg-smoothie';
DELETE FROM public.recipes WHERE id = 'egg-raw-1';

-- Verify remaining recipes
SELECT id, title, type FROM public.recipes ORDER BY type;
