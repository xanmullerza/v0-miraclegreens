
SELECT count(*) as remaining_bad_items FROM food_items WHERE micronutrients->>'_meta_source' LIKE 'usda_matched%';
