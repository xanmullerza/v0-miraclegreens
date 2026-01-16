-- Simplify Hard Boiled Egg Instructions
-- Run this in Supabase SQL Editor

-- 1. Clear existing instructions
DELETE FROM public.instructions WHERE recipe_id = 'hard-boiled-egg';

-- 2. Add simplified instructions
INSERT INTO public.instructions (recipe_id, step_order, step_text)
VALUES
('hard-boiled-egg', 1, 'Place eggs in a small pot and cover with water.'),
('hard-boiled-egg', 2, 'Bring to a boil and cook for 9 minutes for a perfect hard boil.'),
('hard-boiled-egg', 3, 'Drain the hot water and rinse with cold water to stop the cooking.'),
('hard-boiled-egg', 4, 'Peel and enjoy immediately or store for later.');

-- 3. Update prep time to be more realistic (from 20 down to 12 mins)
UPDATE public.recipes SET prep_time = 12 WHERE id = 'hard-boiled-egg';
