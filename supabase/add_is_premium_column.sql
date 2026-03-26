-- Migration: Add is_premium column to profiles table
-- This column tracks whether a user has premium access to full-screen pages and enhanced features.

ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE NOT NULL;

-- Example: How to manually upgrade a user to premium
-- UPDATE public.profiles SET is_premium = true WHERE id = 'user-uuid-here';

-- Ensure the column is included in the realtime replication if needed
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
