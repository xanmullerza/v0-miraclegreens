-- Create app/dashboard/pantry directory
-- (This is just a note for the migration file)

-- Add is_in_pantry column to food_items table if it doesn't exist
ALTER TABLE public.food_items 
ADD COLUMN IF NOT EXISTS is_in_pantry BOOLEAN DEFAULT false;

-- The existing "Allow anon update on food_items" policy already covers this.
