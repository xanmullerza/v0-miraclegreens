-- Add missing columns to profiles table for enhanced persistence
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS health_conditions TEXT[];

-- Update the existing data if any (optional, but good for defaults)
UPDATE public.profiles SET country = 'Australia' WHERE country IS NULL;
UPDATE public.profiles SET health_conditions = '{}' WHERE health_conditions IS NULL;
