-- Migration: Add source column to food_items
-- Adds a field to track the origin of nutritional data

-- 1. Add the column
ALTER TABLE public.food_items 
ADD COLUMN source text DEFAULT 'manual';

-- 2. Populate existing entries with 'usda'
UPDATE public.food_items
SET source = 'usda'
WHERE source = 'manual';
