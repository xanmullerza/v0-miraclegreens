-- Bulk categorization script for food_items
-- Run this in your Supabase SQL Editor to organize your existing library

-- 1. Categorize Legumes
UPDATE food_items 
SET category = 'Legumes'
WHERE category = 'General' OR category IS NULL
AND (
    name ILIKE '%pea%' OR 
    name ILIKE '%bean%' OR 
    name ILIKE '%lentil%' OR 
    name ILIKE '%chickpea%' OR 
    name ILIKE '%soy%' OR 
    name ILIKE '%peanut%' OR
    common_name ILIKE '%pea%' OR 
    common_name ILIKE '%bean%' OR 
    common_name ILIKE '%lentil%' OR 
    common_name ILIKE '%chickpea%' OR 
    common_name ILIKE '%soy%' OR 
    common_name ILIKE '%peanut%'
);

-- 2. Categorize Grains
UPDATE food_items 
SET category = 'Grains'
WHERE category = 'General' OR category IS NULL
AND (
    name ILIKE '%rice%' OR 
    name ILIKE '%wheat%' OR 
    name ILIKE '%oat%' OR 
    name ILIKE '%barley%' OR 
    name ILIKE '%quinoa%' OR 
    name ILIKE '%corn%' OR 
    name ILIKE '%maize%' OR 
    name ILIKE '%millet%' OR 
    name ILIKE '%sorghum%' OR 
    name ILIKE '%rye%' OR
    common_name ILIKE '%rice%' OR 
    common_name ILIKE '%wheat%' OR 
    common_name ILIKE '%oat%' OR 
    common_name ILIKE '%barley%' OR 
    common_name ILIKE '%quinoa%' OR 
    common_name ILIKE '%corn%' OR 
    common_name ILIKE '%maize%' OR 
    common_name ILIKE '%millet%' OR 
    common_name ILIKE '%sorghum%' OR 
    common_name ILIKE '%rye%'
);

-- 3. Categorize Fruit
UPDATE food_items 
SET category = 'Fruit'
WHERE category = 'General' OR category IS NULL
AND (
    name ILIKE '%apple%' OR 
    name ILIKE '%banana%' OR 
    name ILIKE '%orange%' OR 
    name ILIKE '%grape%' OR 
    name ILIKE '%berry%' OR 
    name ILIKE '%mango%' OR 
    name ILIKE '%pineapple%' OR 
    name ILIKE '%melon%' OR 
    name ILIKE '%peach%' OR 
    name ILIKE '%pear%' OR 
    name ILIKE '%plum%' OR 
    name ILIKE '%cherry%' OR 
    name ILIKE '%lemon%' OR 
    name ILIKE '%lime%' OR 
    name ILIKE '%kiwi%' OR 
    name ILIKE '%avocado%' OR 
    name ILIKE '%coconut%' OR 
    name ILIKE '%date%' OR 
    name ILIKE '%fig%' OR
    common_name ILIKE '%apple%' OR 
    common_name ILIKE '%banana%' OR 
    common_name ILIKE '%orange%' OR 
    common_name ILIKE '%grape%' OR 
    common_name ILIKE '%berry%' OR 
    common_name ILIKE '%mango%' OR 
    common_name ILIKE '%pineapple%' OR 
    common_name ILIKE '%melon%' OR 
    common_name ILIKE '%peach%' OR 
    common_name ILIKE '%pear%' OR 
    common_name ILIKE '%plum%' OR 
    common_name ILIKE '%cherry%' OR 
    common_name ILIKE '%lemon%' OR 
    common_name ILIKE '%lime%' OR 
    common_name ILIKE '%kiwi%' OR 
    common_name ILIKE '%avocado%' OR 
    common_name ILIKE '%coconut%' OR 
    common_name ILIKE '%date%' OR 
    common_name ILIKE '%fig%'
);

-- 4. Categorize Proteins
UPDATE food_items 
SET category = 'Proteins'
WHERE category = 'General' OR category IS NULL
AND (
    name ILIKE '%beef%' OR 
    name ILIKE '%chicken%' OR 
    name ILIKE '%pork%' OR 
    name ILIKE '%turkey%' OR 
    name ILIKE '%fish%' OR 
    name ILIKE '%egg%' OR 
    name ILIKE '%milk%' OR 
    name ILIKE '%cheese%' OR 
    name ILIKE '%yogurt%' OR 
    name ILIKE '%whey%' OR 
    name ILIKE '%salmon%' OR 
    name ILIKE '%tuna%' OR 
    name ILIKE '%shrimp%' OR 
    name ILIKE '%tofu%' OR 
    name ILIKE '%lamb%' OR 
    name ILIKE '%meat%' OR
    common_name ILIKE '%beef%' OR 
    common_name ILIKE '%chicken%' OR 
    common_name ILIKE '%pork%' OR 
    common_name ILIKE '%turkey%' OR 
    common_name ILIKE '%fish%' OR 
    common_name ILIKE '%egg%' OR 
    common_name ILIKE '%milk%' OR 
    common_name ILIKE '%cheese%' OR 
    common_name ILIKE '%yogurt%' OR 
    common_name ILIKE '%whey%' OR 
    common_name ILIKE '%salmon%' OR 
    common_name ILIKE '%tuna%' OR 
    common_name ILIKE '%shrimp%' OR 
    common_name ILIKE '%tofu%' OR 
    common_name ILIKE '%lamb%' OR 
    common_name ILIKE '%meat%'
);

-- 5. Categorize Vegetables (Catch-all for most other green/garden things)
UPDATE food_items 
SET category = 'Vegetables'
WHERE category = 'General' OR category IS NULL
AND (
    name ILIKE '%cabbage%' OR 
    name ILIKE '%broccoli%' OR 
    name ILIKE '%carrot%' OR 
    name ILIKE '%spinach%' OR 
    name ILIKE '%kale%' OR 
    name ILIKE '%lettuce%' OR 
    name ILIKE '%tomato%' OR 
    name ILIKE '%potato%' OR 
    name ILIKE '%onion%' OR 
    name ILIKE '%garlic%' OR 
    name ILIKE '%pepper%' OR 
    name ILIKE '%cucumber%' OR 
    name ILIKE '%zucchini%' OR 
    name ILIKE '%eggplant%' OR 
    name ILIKE '%cauliflower%' OR 
    name ILIKE '%asparagus%' OR 
    name ILIKE '%celery%' OR 
    name ILIKE '%radish%' OR 
    name ILIKE '%beet%' OR
    common_name ILIKE '%cabbage%' OR 
    common_name ILIKE '%broccoli%' OR 
    common_name ILIKE '%carrot%' OR 
    common_name ILIKE '%spinach%' OR 
    common_name ILIKE '%kale%' OR 
    common_name ILIKE '%lettuce%' OR 
    common_name ILIKE '%tomato%' OR 
    common_name ILIKE '%potato%' OR 
    common_name ILIKE '%onion%' OR 
    common_name ILIKE '%garlic%' OR 
    common_name ILIKE '%pepper%' OR 
    common_name ILIKE '%cucumber%' OR 
    common_name ILIKE '%zucchini%' OR 
    common_name ILIKE '%eggplant%' OR 
    common_name ILIKE '%cauliflower%' OR 
    common_name ILIKE '%asparagus%' OR 
    common_name ILIKE '%celery%' OR 
    common_name ILIKE '%radish%' OR 
    common_name ILIKE '%beet%'
);

-- 6. Ensure everything else is 'General'
UPDATE food_items 
SET category = 'General' 
WHERE category IS NULL;
