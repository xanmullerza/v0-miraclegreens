-- Pluralize countable food common_names
-- Run this in the Supabase SQL editor

-- Fruits
UPDATE food_items SET common_name = 'Apples' WHERE common_name = 'Apple';
UPDATE food_items SET common_name = 'Apricots' WHERE common_name = 'Apricot';
UPDATE food_items SET common_name = 'Bananas' WHERE common_name = 'Banana';
UPDATE food_items SET common_name = 'Bay Leaves' WHERE common_name = 'Bay Leaf';
UPDATE food_items SET common_name = 'Beetroots' WHERE common_name = 'Beetroot';
UPDATE food_items SET common_name = 'Butternuts' WHERE common_name = 'Butternut';
UPDATE food_items SET common_name = 'Cucumbers' WHERE common_name = 'Cucumber';
UPDATE food_items SET common_name = 'Grapes' WHERE common_name = 'Grape';
UPDATE food_items SET common_name = 'Lemons' WHERE common_name = 'Lemon';
UPDATE food_items SET common_name = 'Naartjies' WHERE common_name = 'Naartjie';
UPDATE food_items SET common_name = 'Onions' WHERE common_name = 'Onion';
UPDATE food_items SET common_name = 'Oranges' WHERE common_name = 'Orange';
UPDATE food_items SET common_name = 'Peaches' WHERE common_name = 'Peach';
UPDATE food_items SET common_name = 'Pears' WHERE common_name = 'Pear';
UPDATE food_items SET common_name = 'Plums' WHERE common_name = 'Plum';
UPDATE food_items SET common_name = 'Potatoes' WHERE common_name = 'Potato';
UPDATE food_items SET common_name = 'Tomatoes' WHERE common_name = 'Tomato';

-- Vegetables
UPDATE food_items SET common_name = 'Baby Marrows' WHERE common_name = 'Baby Marrow';
UPDATE food_items SET common_name = 'Baby Marrows (Cooked)' WHERE common_name = 'Baby Marrow (Cooked)';
UPDATE food_items SET common_name = 'Carrots' WHERE common_name = 'Carrot';
UPDATE food_items SET common_name = 'Sweet Potatoes' WHERE common_name = 'Sweet Potato';
UPDATE food_items SET common_name = 'Sweet Potatoes (Cooked)' WHERE common_name = 'Sweet Potato (Cooked)';

-- Meat & protein
UPDATE food_items SET common_name = 'Beef Livers' WHERE common_name = 'Beef Liver';
UPDATE food_items SET common_name = 'Chicken Breasts' WHERE common_name = 'Chicken Breast';
UPDATE food_items SET common_name = 'Chicken Livers' WHERE common_name = 'Chicken Liver';
UPDATE food_items SET common_name = 'Lamb Kidneys' WHERE common_name = 'Lamb Kidney';

-- Nuts & seeds
UPDATE food_items SET common_name = 'Almonds' WHERE common_name = 'Almond';
UPDATE food_items SET common_name = 'Brazil Nuts' WHERE common_name = 'Brazil Nut';
UPDATE food_items SET common_name = 'Cashews' WHERE common_name = 'Cashew';
UPDATE food_items SET common_name = 'Hazelnuts' WHERE common_name = 'Hazelnut';
UPDATE food_items SET common_name = 'Macadamia Nuts' WHERE common_name = 'Macadamia Nut';
UPDATE food_items SET common_name = 'Pecans' WHERE common_name = 'Pecan';
UPDATE food_items SET common_name = 'Walnuts' WHERE common_name = 'Walnut';

-- Seeds
UPDATE food_items SET common_name = 'Chia Seeds' WHERE common_name = 'Chia Seed';
UPDATE food_items SET common_name = 'Coriander Seeds' WHERE common_name = 'Coriander Seed';
UPDATE food_items SET common_name = 'Fennel Seeds' WHERE common_name = 'Fennel Seed';
UPDATE food_items SET common_name = 'Flax Seeds' WHERE common_name = 'Flax Seed';
UPDATE food_items SET common_name = 'Sesame Seeds' WHERE common_name = 'Sesame Seed';
UPDATE food_items SET common_name = 'Sunflower Seeds' WHERE common_name = 'Sunflower Seed';

-- Beans & legumes
UPDATE food_items SET common_name = 'Baked Beans' WHERE common_name = 'Baked Bean';
UPDATE food_items SET common_name = 'Lentil Sprouts' WHERE common_name = 'Lentil Sprout';
UPDATE food_items SET common_name = 'Peas (Cooked)' WHERE common_name = 'Pea (Cooked)';
UPDATE food_items SET common_name = 'Split Peas' WHERE common_name = 'Split Pea';

-- Berries (may already be plural in DB)
UPDATE food_items SET common_name = 'Blackberries' WHERE common_name = 'Blackberry';
UPDATE food_items SET common_name = 'Raspberries' WHERE common_name = 'Raspberry';
UPDATE food_items SET common_name = 'Strawberries' WHERE common_name = 'Strawberry';

-- Peppers
UPDATE food_items SET common_name = 'Green Bell Peppers' WHERE common_name = 'Green Bell Pepper';
UPDATE food_items SET common_name = 'Red Bell Peppers' WHERE common_name = 'Red Bell Pepper';
UPDATE food_items SET common_name = 'Yellow Bell Peppers' WHERE common_name = 'Yellow Bell Pepper';

-- Eggs
UPDATE food_items SET common_name = 'Eggs' WHERE common_name = 'Egg';
