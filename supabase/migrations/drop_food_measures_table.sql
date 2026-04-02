-- Migration: Deprecate food_measures table
-- Reason: All portion data is now stored in food_items.portions column
-- Date: 2024-04-02

-- Drop the foreign key constraints first
ALTER TABLE food_measures 
DROP CONSTRAINT IF EXISTS food_measures_food_item_id_fkey;

-- Drop the table
DROP TABLE IF EXISTS food_measures CASCADE;

-- Note: If you need to restore this, run:
-- CREATE TABLE food_measures (
--   id uuid NOT NULL DEFAULT gen_random_uuid(),
--   food_item_id uuid NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
--   label text NOT NULL,
--   weight_g numeric NOT NULL,
--   created_at timestamp NOT NULL DEFAULT now(),
--   CONSTRAINT food_measures_pkey PRIMARY KEY (id),
--   CONSTRAINT food_measures_food_item_id_label_key UNIQUE (food_item_id, label)
-- );
