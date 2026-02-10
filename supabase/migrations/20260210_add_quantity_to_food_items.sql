-- Add quantity column to food_items table
ALTER TABLE public.food_items 
ADD COLUMN IF NOT EXISTS quantity VARCHAR(50);
