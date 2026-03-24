-- Add cook_time column to recipes table (if it doesn't already exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recipes' AND column_name = 'cook_time'
  ) THEN
    ALTER TABLE public.recipes
    ADD COLUMN cook_time INTEGER DEFAULT 0;
    
    COMMENT ON COLUMN public.recipes.cook_time IS 'Cooking time in minutes';
  END IF;
END $$;
