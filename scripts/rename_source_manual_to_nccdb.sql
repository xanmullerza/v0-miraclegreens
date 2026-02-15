-- Batch 4: Renaming source entries from 'manual' to 'nccdb' for all relevant food items

BEGIN;

UPDATE "public"."food_items" 
SET "source" = 'nccdb' 
WHERE "source" = 'manual';

COMMIT;
