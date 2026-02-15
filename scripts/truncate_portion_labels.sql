BEGIN;

-- 1. Identify the 'survivor' rows and pre-calculate their new labels.
-- We use DISTINCT ON to pick exactly one row for every (food_item, clean_label) pair.
CREATE TEMP TABLE measures_to_keep AS
SELECT DISTINCT ON (
    food_item_id, 
    INITCAP(TRIM(SPLIT_PART(SPLIT_PART(label, ',', 1), ' - ', 1)))
)
    id,
    INITCAP(TRIM(SPLIT_PART(SPLIT_PART(label, ',', 1), ' - ', 1))) as cleaned_label
FROM "public"."food_measures"
ORDER BY 
    food_item_id, 
    INITCAP(TRIM(SPLIT_PART(SPLIT_PART(label, ',', 1), ' - ', 1))),
    id ASC; -- Keep the original first record as the survivor

-- 2. Delete all records that ARE NOT the survivors.
-- This clears the path so the subsequent UPDATE doesn't hit a Unique Constraint error.
DELETE FROM "public"."food_measures"
WHERE id NOT IN (SELECT id FROM measures_to_keep);

-- 3. Update the survivors with their new, beautiful labels.
UPDATE "public"."food_measures" m
SET "label" = k.cleaned_label
FROM measures_to_keep k
WHERE m.id = k.id;

DROP TABLE measures_to_keep;

COMMIT;
