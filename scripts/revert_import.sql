
DO $$
DECLARE
    deleted_count integer;
BEGIN
    DELETE FROM food_items 
    WHERE micronutrients->>'_meta_source' = 'usda_matched'
    OR micronutrients->>'_meta_source' = 'usda_matched_v2';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % rows', deleted_count;
END $$;
