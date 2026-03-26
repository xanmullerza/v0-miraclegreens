-- Migration: Add trigger to sync profiles automatically
-- This ensures that EVERY user (including Google/Auth signups) gets a profile row.

-- 1. Ensure the function exists (it might already be there from previous migrations)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, nickname)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', ''), 
    COALESCE(new.raw_user_meta_data->>'custom_claims'->>'nickname', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the missing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Retroactively sync any missing profiles (Optional)
-- INSERT INTO public.profiles (id, full_name)
-- SELECT id, COALESCE(raw_user_meta_data->>'full_name', '')
-- FROM auth.users
-- ON CONFLICT (id) DO NOTHING;
