-- Migration to add admin role and fix food_items RLS
-- 1. Add is_admin column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- 2. Update RLS Policies for food_items to allow admins
-- Drop existing insert/update policy to replace it
DROP POLICY IF EXISTS "Allow users to manage their own food items" ON public.food_items;

-- A. New policy for users to manage their own items OR admins to manage everything
CREATE POLICY "Manage food items"
ON public.food_items FOR ALL
TO authenticated
USING (
  auth.uid() = user_id 
  OR 
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
)
WITH CHECK (
  auth.uid() = user_id 
  OR 
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- B. Ensure SELECT policy also covers non-curated items for the owner/admin
-- (Policy A already covered SELECT for curated, but let's be explicit for privacy)
DROP POLICY IF EXISTS "Allow public read access on curated foods" ON public.food_items;

CREATE POLICY "Read food items"
ON public.food_items FOR SELECT
TO anon, authenticated
USING (
  is_curated = true 
  OR 
  auth.uid() = user_id 
  OR 
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);
