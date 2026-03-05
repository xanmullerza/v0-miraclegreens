-- Add survival_state column to profiles for cloud persistence
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS survival_state JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.profiles.survival_state IS 'Stores the persistence state of the survival mode simulation (inventory, step, status).';
