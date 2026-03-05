-- Migration: Add source column to food_items
-- Adds a field to track the origin of nutritional data

-- 1. Add the column
ALTER TABLE public.food_items 
ADD COLUMN source text DEFAULT 'manual';

-- 2. Populate existing entries with 'usda' since they were mostly derived from USDA
UPDATE public.food_items
SET source = 'usda'
WHERE source = 'manual';

-- 3. Update the creator script to default to 'manual' for new entries unless specified
-- (This is handled in the UI/API layer)
