-- Add user_id and is_curated columns to recipes table
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS is_curated boolean DEFAULT false;

-- Update existing recipes to be curated
UPDATE public.recipes SET is_curated = true WHERE user_id IS NULL;

-- Update RLS Policies
-- First drop existing public read policy
DROP POLICY IF EXISTS "Allow public read access on recipes" ON public.recipes;

-- Policy to allow anyone to read curated recipes
CREATE POLICY "Allow public read access on curated recipes"
ON public.recipes FOR SELECT
TO anon, authenticated
USING (is_curated = true);

-- Policy to allow users to manage their own recipes
CREATE POLICY "Allow users to manage their own recipes"
ON public.recipes FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Update ingredients and instructions policies to reflect recipe ownership (simplified: inherit from recipe)
-- Note: ingredients/instructions rely on recipe_id join, but we can add policies to match
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on ingredients" ON public.ingredients;
CREATE POLICY "Allow read access on ingredients of visible recipes"
ON public.ingredients FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.recipes 
    WHERE public.recipes.id = public.ingredients.recipe_id 
    AND (public.recipes.is_curated = true OR public.recipes.user_id = auth.uid())
  )
);

CREATE POLICY "Allow users to manage ingredients of their own recipes"
ON public.ingredients FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.recipes 
    WHERE public.recipes.id = public.ingredients.recipe_id 
    AND public.recipes.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.recipes 
    WHERE public.recipes.id = public.ingredients.recipe_id 
    AND public.recipes.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Allow public read access on instructions" ON public.instructions;
CREATE POLICY "Allow read access on instructions of visible recipes"
ON public.instructions FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.recipes 
    WHERE public.recipes.id = public.instructions.recipe_id 
    AND (public.recipes.is_curated = true OR public.recipes.user_id = auth.uid())
  )
);

CREATE POLICY "Allow users to manage instructions of their own recipes"
ON public.instructions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.recipes 
    WHERE public.recipes.id = public.instructions.recipe_id 
    AND public.recipes.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.recipes 
    WHERE public.recipes.id = public.instructions.recipe_id 
    AND public.recipes.user_id = auth.uid()
  )
);
