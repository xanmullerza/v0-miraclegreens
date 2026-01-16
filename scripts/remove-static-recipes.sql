-- Remove Static (Non-Dynamic) Recipes
-- These have no food_item_id links, so nutrition cannot be calculated dynamically
-- Run this in Supabase SQL Editor

DELETE FROM public.recipes WHERE id IN (
  SELECT r.id 
  FROM public.recipes r
  LEFT JOIN public.ingredients i ON r.id = i.recipe_id AND i.food_item_id IS NOT NULL
  GROUP BY r.id
  HAVING COUNT(i.food_item_id) = 0
);

-- Verify remaining dynamic recipes
SELECT r.id, r.title, r.type, COUNT(i.food_item_id) as linked_ingredients
FROM public.recipes r
LEFT JOIN public.ingredients i ON r.id = i.recipe_id
GROUP BY r.id, r.title, r.type
ORDER BY r.type, r.title;
