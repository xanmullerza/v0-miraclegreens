-- Add Hard Boiled Egg Recipe
-- Run this in Supabase SQL Editor

-- 1. Create the Recipe
INSERT INTO public.recipes (id, title, type, calories, protein, carbs, fat, diet, prep_time, image)
VALUES (
    'hard-boiled-egg',
    'Hard Boiled Egg',
    'breakfast',
    78, 6, 1, 5,  -- Approximate values for 1 large egg (50g)
    '{anything,vegetarian}',
    20,  -- Total time: 5 prep + 15 cook
    'https://images.unsplash.com/photo-1482049016530-d79f7d2c911a?auto=format&fit=crop&q=80'
)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, image = EXCLUDED.image;

-- 2. Add Ingredient (1 Large Egg = 50g)
DELETE FROM public.ingredients WHERE recipe_id = 'hard-boiled-egg';
INSERT INTO public.ingredients (recipe_id, food_item_id, item, amount, quantity, measure_label, weight_g, base_ingredient)
VALUES (
    'hard-boiled-egg',
    (SELECT id FROM public.food_items WHERE name = 'Egg, Raw' LIMIT 1),
    '1 Large Egg',
    '1 large (50g)',
    1,
    'large',
    50,
    'Egg'
);

-- 3. Add Instructions
DELETE FROM public.instructions WHERE recipe_id = 'hard-boiled-egg';
INSERT INTO public.instructions (recipe_id, step_order, step_text)
VALUES
('hard-boiled-egg', 1, 'Place eggs in a pot and cover with cold water by at least an inch. Cover with a lid.'),
('hard-boiled-egg', 2, 'Turn the stove to high heat and bring the water to a rolling boil.'),
('hard-boiled-egg', 3, 'Once boiling, turn off the heat and move the pot to a cool burner. Let sit with the lid on for 15 minutes.'),
('hard-boiled-egg', 4, 'Fill a large bowl halfway with cold water.'),
('hard-boiled-egg', 5, 'After 15 minutes, transfer the eggs to the bowl of cold water. Replace cold water as needed until eggs are cooled.'),
('hard-boiled-egg', 6, 'Once cooled, chill the eggs in the refrigerator for at least 2 hours before peeling.');

-- 4. Verification
SELECT r.title, i.item, i.amount, i.weight_g, f.energy_kj, f.protein_g
FROM public.recipes r
JOIN public.ingredients i ON r.id = i.recipe_id
JOIN public.food_items f ON i.food_item_id = f.id
WHERE r.id = 'hard-boiled-egg';
