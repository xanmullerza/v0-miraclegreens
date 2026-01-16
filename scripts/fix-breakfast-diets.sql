-- Remove vegetarian from Miso Moringa Soup
UPDATE public.recipes 
SET diet = ARRAY['vegan', 'anything']::text[]
WHERE id = 'jap1';

-- Set egg to vegetarian ONLY
UPDATE public.recipes 
SET diet = ARRAY['vegetarian']::text[]
WHERE id = 'egg-raw-1';

-- Verify
SELECT id, title, diet 
FROM public.recipes 
WHERE type = 'breakfast'
ORDER BY title;
