-- Pantry Items Table
-- Stores user's personal pantry inventory (unlike global food_items)

CREATE TABLE IF NOT EXISTS pantry_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    scanned_product_id UUID REFERENCES scanned_products(id),
    food_item_id UUID REFERENCES food_items(id),
    name VARCHAR(255) NOT NULL,
    quantity VARCHAR(50),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expiry_date DATE,
    notes TEXT,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- RLS for Pantry Items
ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own pantry items
-- We use a DO block here to avoid errors if the policy already exists during re-runs, 
-- or you can simply drop it first if you are iterating.
-- But for a fresh run, standard CREATE POLICY is fine.

DROP POLICY IF EXISTS "Users can manage their own pantry items" ON pantry_items;

CREATE POLICY "Users can manage their own pantry items" 
    ON pantry_items FOR ALL 
    USING (auth.uid() = user_id);

-- Index for pantry items
CREATE INDEX IF NOT EXISTS idx_pantry_items_user ON pantry_items(user_id);
