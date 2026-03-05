-- Update Recipe Images with High-Quality Unsplash Matches
-- Run this in Supabase SQL Editor

-- 1. Power Pap (Maize Porridge)
UPDATE public.recipes 
SET image = 'https://images.unsplash.com/photo-1517244683847-745431f47f29?auto=format&fit=crop&q=80&w=800'
WHERE id = 'daily-maize-porridge';

-- 2. Rice & Lentil Recovery
UPDATE public.recipes 
SET image = 'https://images.unsplash.com/photo-1598514983318-2f64f8f4796c?auto=format&fit=crop&q=80&w=800'
WHERE id = 'rice-lentil-recovery';

-- 3. Iron Spinach Stir-fry
UPDATE public.recipes 
SET image = 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80&w=800'
WHERE id = 'iron-spinach-stir-fry';

-- 4. Hard Boiled Egg
UPDATE public.recipes 
SET image = 'https://images.unsplash.com/photo-1482049016530-d79f7d2c911a?auto=format&fit=crop&q=80&w=800'
WHERE id = 'hard-boiled-egg';

-- Verify
SELECT id, title, image FROM public.recipes;
