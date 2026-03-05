-- 1. Drop the existing table if it exists
DROP TABLE IF EXISTS food_measures;

-- 2. Create the new table
CREATE TABLE food_measures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  food_item_id UUID NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  weight_g NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Validation to ensure no duplicate labels for the same food (e.g. can't have two "cup" entries for Spinach)
  UNIQUE(food_item_id, label)
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE food_measures ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies (Adjust based on your security needs)

-- Allow everyone to read measures
CREATE POLICY "Enable read access for all users" 
ON food_measures FOR SELECT 
USING (true);

-- Allow authenticated users (or valid API usage) to insert new measures
-- Since we are saving "as we go" from the create page, we need insert permissions
CREATE POLICY "Enable insert access for all users" 
ON food_measures FOR INSERT 
WITH CHECK (true);

-- Allow updates if needed
CREATE POLICY "Enable update access for all users" 
ON food_measures FOR UPDATE 
USING (true);
