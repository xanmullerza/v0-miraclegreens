-- Run this in the Supabase Dashboard → SQL Editor
-- Adds gram (1g) and kilogram (1000g) to food_items.portions for all foods missing them.
-- Uses Postgres JSONB operators, bypasses RLS entirely.

-- Step 1: Foods that already have a portions array — append missing entries
UPDATE food_items
SET portions = (
    SELECT jsonb_agg(p ORDER BY (p->>'label'))
    FROM (
        -- Keep all existing entries
        SELECT jsonb_array_elements(portions) AS p
        UNION ALL
        -- Add gram only if not already there
        SELECT '{"label":"gram","weight_g":1}'::jsonb
        WHERE NOT (portions @> '[{"label":"gram"}]'::jsonb)
        UNION ALL
        -- Add kilogram only if not already there
        SELECT '{"label":"kilogram","weight_g":1000}'::jsonb
        WHERE NOT (portions @> '[{"label":"kilogram"}]'::jsonb)
    ) sub
)
WHERE portions IS NOT NULL
  AND jsonb_typeof(portions) = 'array'
  AND jsonb_array_length(portions) > 0;

-- Step 2: Foods with NULL or empty portions — seed with gram + kilogram
UPDATE food_items
SET portions = '[{"label":"gram","weight_g":1},{"label":"kilogram","weight_g":1000}]'::jsonb
WHERE portions IS NULL
   OR portions = '[]'::jsonb;
