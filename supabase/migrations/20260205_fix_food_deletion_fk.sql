
-- Fix foreign key constraint on ingredients to allow deleting food items
-- This will automatically remove ingredients from recipes if the base food is deleted

-- 1. Identify the constraint name (usually ingredients_food_item_id_fkey)
-- 2. Drop it
-- 3. Re-create it with ON DELETE CASCADE

DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'ingredients_food_item_id_fkey' 
        AND table_name = 'ingredients'
    ) THEN
        ALTER TABLE ingredients DROP CONSTRAINT ingredients_food_item_id_fkey;
    END IF;
END $$;

ALTER TABLE ingredients 
ADD CONSTRAINT ingredients_food_item_id_fkey 
FOREIGN KEY (food_item_id) 
REFERENCES food_items(id) 
ON DELETE CASCADE;
