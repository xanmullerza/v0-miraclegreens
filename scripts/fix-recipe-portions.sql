-- Fix Malnutrition Recipe Portions & Clarity
-- Run this in Supabase SQL Editor

-- 1. Power Pap Updates
UPDATE public.ingredients
SET 
  item = 'Cooked Pap (from ~75g dry meal)',
  amount = '1 Large Bowl (300g)'
WHERE 
  recipe_id = 'daily-maize-porridge' AND item LIKE '%Pap%';

UPDATE public.instructions
SET step_text = 'Mix 75g (1/2 cup) maize meal with a little cold water to form a smooth paste.'
WHERE recipe_id = 'daily-maize-porridge' AND step_order = 1;


-- 2. Rice & Lentils Updates
UPDATE public.ingredients
SET 
  item = 'White Rice (Cooked)',
  amount = '1 Cup (158g)'
WHERE 
  recipe_id = 'rice-lentil-recovery' AND item LIKE '%Rice%';

UPDATE public.ingredients
SET 
  item = 'Lentils (Cooked)',
  amount = '1/2 Cup (100g)'
WHERE 
  recipe_id = 'rice-lentil-recovery' AND item LIKE '%Lentils%';

-- 3. Spinach Updates
UPDATE public.ingredients
SET 
  item = 'Cooked Spinach',
  amount = '1 Cup (180g)'
WHERE 
  recipe_id = 'iron-spinach-stir-fry' AND item LIKE '%Spinach%';

UPDATE public.instructions
SET step_text = 'Wash 200g fresh spinach leaves (reduces to ~180g cooked) thoroughly.'
WHERE recipe_id = 'iron-spinach-stir-fry' AND step_order = 1;

-- Verification
SELECT r.title, i.item, i.amount
FROM public.recipes r
JOIN public.ingredients i ON r.id = i.recipe_id
WHERE r.id IN ('daily-maize-porridge', 'rice-lentil-recovery', 'iron-spinach-stir-fry');
