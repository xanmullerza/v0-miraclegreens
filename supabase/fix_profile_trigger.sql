-- Migration: Add missing avatar_url and setup trigger
-- This ensures that EVERY user (including Google/Auth signups) gets a profile row.

-- 1. Add missing avatar_url column if it doesn't exist
ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Ensure handle_new_user function is correctly defined
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', ''), 
    COALESCE(new.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the missing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Retroactively sync any missing profiles
INSERT INTO public.profiles (id, full_name, avatar_url)
SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'full_name', ''), 
    COALESCE(raw_user_meta_data->>'avatar_url', '')
FROM auth.users
ON CONFLICT (id) DO NOTHING;
