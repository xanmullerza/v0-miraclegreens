-- Add is_favorite column to food_items table if it doesn't exist
ALTER TABLE public.food_items 
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- Update RLS policies to allow updating is_favorite
-- Drop first to prevent "already exists" error
DROP POLICY IF EXISTS "Allow anon update on food_items" ON public.food_items;

CREATE POLICY "Allow anon update on food_items" 
ON public.food_items 
FOR UPDATE 
TO anon 
USING (true) 
WITH CHECK (true);
