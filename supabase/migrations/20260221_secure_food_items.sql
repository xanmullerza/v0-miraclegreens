-- Migration to secure food_items and add user scoping
-- 1. Add user_id and is_curated columns
ALTER TABLE public.food_items ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.food_items ADD COLUMN IF NOT EXISTS is_curated boolean DEFAULT false;

-- 2. Update existing items to be curated (assuming they are starting point curated data)
UPDATE public.food_items SET is_curated = true WHERE user_id IS NULL AND is_curated = false;

-- 3. Update RLS Policies
-- First enable RLS (just in case)
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;

-- Drop insecure legacy policies
DROP POLICY IF EXISTS "Allow anon update on food_items" ON public.food_items;
DROP POLICY IF EXISTS "Allow public read access on food_items" ON public.food_items;

-- A. Policy to allow anyone (anon and authenticated) to read curated foods
CREATE POLICY "Allow public read access on curated foods"
ON public.food_items FOR SELECT
TO anon, authenticated
USING (is_curated = true);

-- B. Policy to allow users to manage their own food items
CREATE POLICY "Allow users to manage their own food items"
ON public.food_items FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- C. (Optional) If favorites still need anon update on curated items, 
-- we should probably rethink this as it lets anyone edit curated metadata.
-- For now, we'll stick to the secure pattern above.
