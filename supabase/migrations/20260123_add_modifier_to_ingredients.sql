
-- Add modifier column to ingredients table to store prep state (e.g. chopped, shredded)
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS modifier text;
