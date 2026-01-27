-- Add is_favorite column to food_items table
ALTER TABLE public.food_items 
ADD COLUMN is_favorite BOOLEAN DEFAULT false;

-- Update RLS policies to allow updating is_favorite
-- Assuming we want anyone (anon) to be able to toggle favorites for now as per current app design
CREATE POLICY "Allow anon update on food_items" 
ON public.food_items 
FOR UPDATE 
TO anon 
USING (true) 
WITH CHECK (true);
