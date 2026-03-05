
-- Seed Malnutrition Series Recipes
-- Run this in Supabase SQL Editor

-- 1. Daily Maize Porridge (Power Pap)
INSERT INTO public.recipes (id, title, type, calories, protein, carbs, fat, diet, prep_time, image)
VALUES (
    'daily-maize-porridge', 
    'Daily Maize Porridge (Power Pap)', 
    'breakfast', 
    240, 5, 56, 4, 
    '{anything,vegetarian,vegan}', 
    20, 
    'https://images.unsplash.com/photo-1621855646273-038c47b5ae17?auto=format&fit=crop&q=80'
)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, image = EXCLUDED.image;

DELETE FROM public.ingredients WHERE recipe_id = 'daily-maize-porridge';
INSERT INTO public.ingredients (recipe_id, food_item_id, item, amount, quantity, measure_label, weight_g, base_ingredient)
VALUES (
    'daily-maize-porridge',
    (SELECT id FROM public.food_items WHERE name = 'Maize Meal (Cooked Pap)' LIMIT 1),
    '1 bowl Cooked Pap', -- Display Text
    '1 serving',        -- Amount Text
    1,                  -- Quantity
    'serving',          -- Measure Label (must match food_measure)
    300,                -- Weight in Grams
    'Maize Meal'        -- Base Ingredient Name
);

DELETE FROM public.instructions WHERE recipe_id = 'daily-maize-porridge';
INSERT INTO public.instructions (recipe_id, step_order, step_text)
VALUES
('daily-maize-porridge', 1, 'Mix maize meal with cold water to form a smooth paste.'),
('daily-maize-porridge', 2, 'Stir into boiling water and cook for 20 mins.'),
('daily-maize-porridge', 3, 'Serve hot. Add Moringa Powder to boost the empty calories into a super-meal.');


-- 2. Rice & Lentil Recovery
INSERT INTO public.recipes (id, title, type, calories, protein, carbs, fat, diet, prep_time, image)
VALUES (
    'rice-lentil-recovery', 
    'Rice & Lentil Recovery', 
    'lunch', 
    246, 12, 48, 1, 
    '{anything,vegetarian,vegan}', 
    25, 
    'https://images.unsplash.com/photo-1511914678378-2906b1f69dcf?auto=format&fit=crop&q=80'
)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, image = EXCLUDED.image;

DELETE FROM public.ingredients WHERE recipe_id = 'rice-lentil-recovery';
INSERT INTO public.ingredients (recipe_id, food_item_id, item, amount, quantity, measure_label, weight_g, base_ingredient)
VALUES
(
    'rice-lentil-recovery',
    (SELECT id FROM public.food_items WHERE name = 'Rice, White, Cooked' LIMIT 1),
    '1 serving White Rice',
    '1 serving',
    1,
    'serving',
    100,
    'Rice'
),
(
    'rice-lentil-recovery',
    (SELECT id FROM public.food_items WHERE name = 'Lentils, Cooked' LIMIT 1),
    '1 serving Lentils',
    '1 serving',
    1,
    'serving',
    100,
    'Lentils'
);

DELETE FROM public.instructions WHERE recipe_id = 'rice-lentil-recovery';
INSERT INTO public.instructions (recipe_id, step_order, step_text)
VALUES
('rice-lentil-recovery', 1, 'Combine cooked rice and lentils.'),
('rice-lentil-recovery', 2, 'Season with salt.'),
('rice-lentil-recovery', 3, 'Add Moringa Powder to provide the missing vitamins.');


-- 3. Iron Spinach Stir-fry
INSERT INTO public.recipes (id, title, type, calories, protein, carbs, fat, diet, prep_time, image)
VALUES (
    'iron-spinach-stir-fry', 
    'Iron Spinach Stir-fry', 
    'dinner', 
    46, 6, 8, 1, 
    '{anything,vegetarian,vegan}', 
    10, 
    'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80'
)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, image = EXCLUDED.image;

DELETE FROM public.ingredients WHERE recipe_id = 'iron-spinach-stir-fry';
INSERT INTO public.ingredients (recipe_id, food_item_id, item, amount, quantity, measure_label, weight_g, base_ingredient)
VALUES (
    'iron-spinach-stir-fry',
    (SELECT id FROM public.food_items WHERE name = 'Spinach, Cooked' LIMIT 1),
    '2 servings Cooked Spinach',
    '2 servings',
    2,
    'serving',
    200,
    'Spinach'
);

DELETE FROM public.instructions WHERE recipe_id = 'iron-spinach-stir-fry';
INSERT INTO public.instructions (recipe_id, step_order, step_text)
VALUES
('iron-spinach-stir-fry', 1, 'Sauté spinach until wilted.'),
('iron-spinach-stir-fry', 2, 'Sprinkle with Moringa Powder to maximize iron absorption.');
