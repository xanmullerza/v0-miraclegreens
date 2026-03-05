-- Update all NULL base_ingredient values with sensible defaults
-- For most ingredients, base_ingredient = item (since they're already in base form)

-- UPDATE strategy:
-- If item doesn't specify a preparation (e.g., "Black Beans" not "Black Beans, Cooked"),
-- then base_ingredient = item

UPDATE public.ingredients 
SET base_ingredient = item
WHERE base_ingredient IS NULL;

-- Special cases might need manual adjustment later:
-- For example, if you later add "Chicken Breast, Grilled", 
-- you'd manually set its base_ingredient to "Chicken Breast"

-- Verify the update
SELECT recipe_id, item, base_ingredient, amount 
FROM public.ingredients 
ORDER BY recipe_id, item;
