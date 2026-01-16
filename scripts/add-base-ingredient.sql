-- Add base_ingredient column to ingredients table
-- This separates what you see in recipes (e.g., "Egg, Scrambled") 
-- from what you buy (e.g., "Egg")

ALTER TABLE public.ingredients 
ADD COLUMN base_ingredient TEXT;

-- Update existing ingredients to have base_ingredient
UPDATE public.ingredients 
SET base_ingredient = 'Egg'
WHERE item = 'Egg, Raw';

UPDATE public.ingredients 
SET base_ingredient = 'Kale'
WHERE item = 'Kale, Raw';

-- Example: Future updates would look like:
-- For scrambled eggs recipe:
-- INSERT INTO ingredients (recipe_id, item, base_ingredient, food_item_id, ...)
-- VALUES ('scrambled-eggs', 'Egg, Scrambled', 'Egg', 'egg-scrambled-id', ...);

-- Verify
SELECT recipe_id, item, base_ingredient, amount 
FROM public.ingredients 
ORDER BY recipe_id;
