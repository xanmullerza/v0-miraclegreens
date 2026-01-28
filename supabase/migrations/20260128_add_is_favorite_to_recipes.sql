-- Add is_favorite column to recipes table if it doesn't exist
ALTER TABLE public.recipes 
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- Update RLS policies for recipes to allow updating is_favorite
DROP POLICY IF EXISTS "Allow anon update on recipes" ON public.recipes;

CREATE POLICY "Allow anon update on recipes" 
ON public.recipes 
FOR UPDATE 
TO anon 
USING (true) 
WITH CHECK (true);
