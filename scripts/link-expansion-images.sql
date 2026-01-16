-- Link 5 New Budget Recipe Images
-- Run this in Supabase SQL Editor

-- 1. Peanut Power Oats
UPDATE public.recipes 
SET image = 'https://qvbfdqxrvrbjorwiaksn.supabase.co/storage/v1/object/public/recipes/peanut_oats.jpg'
WHERE id = 'peanut-power-oats';

-- 2. Bean & Potato Stew
UPDATE public.recipes 
SET image = 'https://qvbfdqxrvrbjorwiaksn.supabase.co/storage/v1/object/public/recipes/beans_potato.jpg'
WHERE id = 'bean-potato-stew';

-- 3. Pilchard Power Bowl
UPDATE public.recipes 
SET image = 'https://qvbfdqxrvrbjorwiaksn.supabase.co/storage/v1/object/public/recipes/pilchards_rice.jpg'
WHERE id = 'pilchard-power-bowl';

-- 4. Curried Beans & Rice
UPDATE public.recipes 
SET image = 'https://qvbfdqxrvrbjorwiaksn.supabase.co/storage/v1/object/public/recipes/beans_rice.jpg'
WHERE id = 'curried-beans-rice';

-- 5. Cabbage & Potato Hash
UPDATE public.recipes 
SET image = 'https://qvbfdqxrvrbjorwiaksn.supabase.co/storage/v1/object/public/recipes/cabbage_potato.jpg'
WHERE id = 'cabbage-potato-hash';

-- Verify All Images
SELECT id, title, image FROM public.recipes ORDER BY type;
