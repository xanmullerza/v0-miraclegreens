-- Seed Budget Expansion: Ingredients & Recipes
-- Adds 6 New Budget Staples and 5 New Dynamic Recipes
-- Run in Supabase SQL Editor

-- -----------------------------------------------------
-- 1. INSERT FOOD ITEMS (Staples)
-- -----------------------------------------------------

-- Oats, Cooked
INSERT INTO public.food_items (name, energy_kcal, energy_kj, protein_g, carbs_g, fat_g, micronutrients)
VALUES ('Oats, Cooked', 67.88, 284.20, 2.42, 12.30, 1.06, '{
    "fiber_g": 1.86,
    "sugars_g": 0.18,
    "calcium_mg": 10.82,
    "iron_mg": 0.78,
    "magnesium_mg": 23.40,
    "potassium_mg": 62.69,
    "sodium_mg": 71.22,
    "zinc_mg": 0.50,
    "vitamin_b1_mg": 0.07,
    "vitamin_b3_mg": 0.18,
    "folate_ug": 5.73
}'::jsonb);

-- Peanut Butter (Salted)
INSERT INTO public.food_items (name, energy_kcal, energy_kj, protein_g, carbs_g, fat_g, micronutrients)
VALUES ('Peanut Butter', 589.00, 2466.03, 23.99, 22.70, 49.43, '{
    "fiber_g": 6.32,
    "sugars_g": 10.49,
    "calcium_mg": 50.00,
    "iron_mg": 1.85,
    "magnesium_mg": 193.00,
    "potassium_mg": 654.00,
    "sodium_mg": 426.00,
    "zinc_mg": 3.06,
    "vitamin_e_mg": 5.41,
    "vitamin_b3_mg": 17.20,
    "folate_ug": 97.00
}'::jsonb);

-- Baked Beans (Tinned)
INSERT INTO public.food_items (name, energy_kcal, energy_kj, protein_g, carbs_g, fat_g, micronutrients)
VALUES ('baked beans', 94.00, 393.56, 4.75, 21.14, 0.37, '{
    "fiber_g": 4.10,
    "sugars_g": 7.96,
    "calcium_mg": 34.00,
    "iron_mg": 1.19,
    "magnesium_mg": 27.00,
    "potassium_mg": 224.00,
    "sodium_mg": 343.00,
    "zinc_mg": 2.28,
    "vitamin_a_ug": 5.42,
    "folate_ug": 12.00
}'::jsonb);

-- Potato, Boiled
INSERT INTO public.food_items (name, energy_kcal, energy_kj, protein_g, carbs_g, fat_g, micronutrients)
VALUES ('Potato, Boiled', 76.00, 318.20, 1.60, 17.90, 0.10, '{
    "fiber_g": 2.40,
    "sugars_g": 0.98,
    "calcium_mg": 21.00,
    "iron_mg": 1.65,
    "magnesium_mg": 30.00,
    "potassium_mg": 564.00,
    "sodium_mg": 6.00,
    "vitamin_c_mg": 12.00,
    "vitamin_b6_mg": 0.29
}'::jsonb);

-- Cabbage, Cooked
INSERT INTO public.food_items (name, energy_kcal, energy_kj, protein_g, carbs_g, fat_g, micronutrients)
VALUES ('Cabbage, Cooked', 23.00, 96.30, 1.27, 5.51, 0.06, '{
    "fiber_g": 1.90,
    "sugars_g": 2.79,
    "calcium_mg": 48.00,
    "iron_mg": 0.17,
    "magnesium_mg": 15.00,
    "potassium_mg": 196.00,
    "sodium_mg": 8.00,
    "vitamin_c_mg": 37.50,
    "vitamin_k_ug": 108.70,
    "folate_ug": 30.00
}'::jsonb);

-- Pilchards (Canned)
INSERT INTO public.food_items (name, energy_kcal, energy_kj, protein_g, carbs_g, fat_g, micronutrients)
VALUES ('Pilchards', 134.00, 561.03, 21.01, 0.00, 4.86, '{
    "omega_3_g": 0.75,
    "calcium_mg": 106.00,
    "iron_mg": 1.44,
    "magnesium_mg": 41.00,
    "potassium_mg": 542.00,
    "sodium_mg": 95.00,
    "vitamin_a_ug": 10.00,
    "vitamin_d_iu": 175.92,
    "vitamin_b12_ug": 9.62
}'::jsonb);


-- -----------------------------------------------------
-- 2. INSERT RECIPES (Dynamic)
-- -----------------------------------------------------

-- Recipe 1: Peanut Power Oats (Breakfast)
INSERT INTO public.recipes (id, title, type, calories, protein, carbs, fat, diet, prep_time, image)
VALUES ('peanut-power-oats', 'Peanut Power Oats', 'breakfast', 250, 8, 30, 12, '{anything,vegetarian,vegan}', 10, 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=800&q=80')
ON CONFLICT (id) DO NOTHING;

-- Ingredients for Oats
INSERT INTO public.ingredients (recipe_id, food_item_id, item, amount, quantity, measure_label, weight_g, base_ingredient)
SELECT 'peanut-power-oats', id, 'Cooked Oats', '1 Bowl (250g)', 1, 'bowl', 250, 'Oats' FROM public.food_items WHERE name = 'Oats, Cooked';

INSERT INTO public.ingredients (recipe_id, food_item_id, item, amount, quantity, measure_label, weight_g, base_ingredient)
SELECT 'peanut-power-oats', id, 'Peanut Butter', '1 tbsp (16g)', 1, 'tbsp', 16, 'Peanut Butter' FROM public.food_items WHERE name = 'Peanut Butter';

-- Recipe 2: Bean & Potato Stew (Lunch)
INSERT INTO public.recipes (id, title, type, calories, protein, carbs, fat, diet, prep_time, image)
VALUES ('bean-potato-stew', 'Bean & Potato Stew', 'lunch', 350, 12, 60, 2, '{anything,vegetarian,vegan}', 30, 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&q=80')
ON CONFLICT (id) DO NOTHING;

-- Ingredients for Bean Stew
INSERT INTO public.ingredients (recipe_id, food_item_id, item, amount, quantity, measure_label, weight_g, base_ingredient)
SELECT 'bean-potato-stew', id, 'Baked Beans', '1 Cup (260g)', 1, 'cup', 260, 'Beans' FROM public.food_items WHERE name = 'baked beans';

INSERT INTO public.ingredients (recipe_id, food_item_id, item, amount, quantity, measure_label, weight_g, base_ingredient)
SELECT 'bean-potato-stew', id, 'Boiled Potato', '2 Medium (300g)', 2, 'medium', 300, 'Potato' FROM public.food_items WHERE name = 'Potato, Boiled';

-- Recipe 3: Pilchard Power Bowl (Lunch)
INSERT INTO public.recipes (id, title, type, calories, protein, carbs, fat, diet, prep_time, image)
VALUES ('pilchard-power-bowl', 'Pilchard Power Bowl', 'lunch', 400, 30, 40, 15, '{anything,pescatarian}', 15, 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80')
ON CONFLICT (id) DO NOTHING;

-- Ingredients for Pilchards
INSERT INTO public.ingredients (recipe_id, food_item_id, item, amount, quantity, measure_label, weight_g, base_ingredient)
SELECT 'pilchard-power-bowl', id, 'Pilchards', '1/2 Tin (150g)', 0.5, 'tin', 150, 'Fish' FROM public.food_items WHERE name = 'Pilchards';

INSERT INTO public.ingredients (recipe_id, food_item_id, item, amount, quantity, measure_label, weight_g, base_ingredient)
SELECT 'pilchard-power-bowl', id, 'White Rice (Cooked)', '1 Cup (158g)', 1, 'cup', 158, 'Rice' FROM public.food_items WHERE name = 'Rice, White, Cooked';

-- Recipe 4: Curried Beans & Rice (Dinner)
INSERT INTO public.recipes (id, title, type, calories, protein, carbs, fat, diet, prep_time, image)
VALUES ('curried-beans-rice', 'Curried Beans & Rice', 'dinner', 450, 15, 80, 2, '{anything,vegetarian,vegan}', 20, 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=800&q=80')
ON CONFLICT (id) DO NOTHING;

-- Ingredients for Curried Beans
INSERT INTO public.ingredients (recipe_id, food_item_id, item, amount, quantity, measure_label, weight_g, base_ingredient)
SELECT 'curried-beans-rice', id, 'Baked Beans', '1 Cup (260g)', 1, 'cup', 260, 'Beans' FROM public.food_items WHERE name = 'baked beans';

INSERT INTO public.ingredients (recipe_id, food_item_id, item, amount, quantity, measure_label, weight_g, base_ingredient)
SELECT 'curried-beans-rice', id, 'White Rice (Cooked)', '1.5 Cups (237g)', 1.5, 'cup', 237, 'Rice' FROM public.food_items WHERE name = 'Rice, White, Cooked';

-- Recipe 5: Cabbage & Potato Hash (Dinner)
INSERT INTO public.recipes (id, title, type, calories, protein, carbs, fat, diet, prep_time, image)
VALUES ('cabbage-potato-hash', 'Cabbage & Potato Hash', 'dinner', 200, 6, 40, 1, '{anything,vegetarian,vegan}', 25, 'https://images.unsplash.com/photo-1625938145744-e38051539994?auto=format&fit=crop&w=800&q=80')
ON CONFLICT (id) DO NOTHING;

-- Ingredients for Cabbage Hash
INSERT INTO public.ingredients (recipe_id, food_item_id, item, amount, quantity, measure_label, weight_g, base_ingredient)
SELECT 'cabbage-potato-hash', id, 'Cooked Cabbage', '2 Cups (300g)', 2, 'cup', 300, 'Cabbage' FROM public.food_items WHERE name = 'Cabbage, Cooked';

INSERT INTO public.ingredients (recipe_id, food_item_id, item, amount, quantity, measure_label, weight_g, base_ingredient)
SELECT 'cabbage-potato-hash', id, 'Boiled Potato', '2 Medium (300g)', 2, 'medium', 300, 'Potato' FROM public.food_items WHERE name = 'Potato, Boiled';

-- 3. INSERT INSTRUCTIONS (Simple)
INSERT INTO public.instructions (recipe_id, step_order, step_text) VALUES
('peanut-power-oats', 1, 'Prepare oats with hot water. Stir in peanut butter until melted.'),
('peanut-power-oats', 2, 'Top with Moringa for a green energy boost.'),
('bean-potato-stew', 1, 'Boil potatoes until soft. Mix in baked beans and heat through.'),
('bean-potato-stew', 2, 'Season with salt and pepper.'),
('pilchard-power-bowl', 1, 'Serve pilchards in tomato sauce over warm rice.'),
('pilchard-power-bowl', 2, 'Mash slightly to mix flavors.'),
('curried-beans-rice', 1, 'Heat baked beans with a teaspoon of curry powder.'),
('curried-beans-rice', 2, 'Serve over fluffy white rice.'),
('cabbage-potato-hash', 1, 'Roughly chop boiled potatoes and mix with cooked cabbage.'),
('cabbage-potato-hash', 2, 'Pan fry briefly if possible, or serve as a warm warm salad.')
ON CONFLICT DO NOTHING;
