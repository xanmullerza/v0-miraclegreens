-- Link Uploaded Custom Images to Recipes
-- Run this in Supabase SQL Editor

-- 1. Power Pap
UPDATE public.recipes 
SET image = 'https://qvbfdqxrvrbjorwiaksn.supabase.co/storage/v1/object/public/recipes/power_pap.jpg'
WHERE id = 'daily-maize-porridge';

-- 2. Rice & Lentils
UPDATE public.recipes 
SET image = 'https://qvbfdqxrvrbjorwiaksn.supabase.co/storage/v1/object/public/recipes/rice_lentils.jpg'
WHERE id = 'rice-lentil-recovery';

-- 3. Iron Spinach
UPDATE public.recipes 
SET image = 'https://qvbfdqxrvrbjorwiaksn.supabase.co/storage/v1/object/public/recipes/iron_spinach.jpg'
WHERE id = 'iron-spinach-stir-fry';

-- 4. Hard Boiled Egg
UPDATE public.recipes 
SET image = 'https://qvbfdqxrvrbjorwiaksn.supabase.co/storage/v1/object/public/recipes/boiled_egg.jpg'
WHERE id = 'hard-boiled-egg';

-- Verify
SELECT id, title, image FROM public.recipes;
