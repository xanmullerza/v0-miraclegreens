-- EMERGENCY RESET AND RE-CATEGORIZE
-- Run this whole block at once in your Supabase SQL Editor

-- 1. Reset everything to General
UPDATE food_items SET category = 'General';

-- 2. Categorize Legumes
UPDATE food_items 
SET category = 'Legumes'
WHERE (name ~* '\y(pea|peas|bean|beans|lentil|lentils|chickpea|chickpeas|soy|peanut|peanuts)\y' 
   OR common_name ~* '\y(pea|peas|bean|beans|lentil|lentils|chickpea|chickpeas|soy|peanut|peanuts)\y');

-- 3. Categorize Grains
UPDATE food_items 
SET category = 'Grains'
WHERE category = 'General'
AND (name ~* '\y(rice|wheat|oat|oats|barley|quinoa|corn|maize|millet|sorghum|rye)\y'
   OR common_name ~* '\y(rice|wheat|oat|oats|barley|quinoa|corn|maize|millet|sorghum|rye)\y');

-- 4. Categorize Fruit
UPDATE food_items 
SET category = 'Fruit'
WHERE category = 'General'
AND (name ~* '\y(apple|apple|banana|orange|grape|berry|berries|mango|pineapple|melon|peach|pear|plum|cherry|lemon|lime|kiwi|avocado|coconut|date|fig)\y'
   OR common_name ~* '\y(apple|banana|orange|grape|berry|berries|mango|pineapple|melon|peach|pear|plum|cherry|lemon|lime|kiwi|avocado|coconut|date|fig)\y');

-- 5. Categorize Proteins
UPDATE food_items 
SET category = 'Proteins'
WHERE category = 'General'
AND (name ~* '\y(beef|chicken|pork|turkey|fish|egg|eggs|milk|cheese|yogurt|whey|salmon|tuna|shrimp|tofu|lamb|meat)\y'
   OR common_name ~* '\y(beef|chicken|pork|turkey|fish|egg|eggs|milk|cheese|yogurt|whey|salmon|tuna|shrimp|tofu|lamb|meat)\y');

-- 6. Categorize Vegetables
UPDATE food_items 
SET category = 'Vegetables'
WHERE category = 'General'
AND (name ~* '\y(cabbage|broccoli|carrot|spinach|kale|lettuce|tomato|potato|onion|garlic|pepper|cucumber|zucchini|eggplant|cauliflower|asparagus|celery|radish|beet)\y'
   OR common_name ~* '\y(cabbage|broccoli|carrot|spinach|kale|lettuce|tomato|potato|onion|garlic|pepper|cucumber|zucchini|eggplant|cauliflower|asparagus|celery|radish|beet)\y');
