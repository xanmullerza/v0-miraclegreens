-- Scanned Products Table
-- Stores products that users have scanned via barcode for quick lookup and offline access

CREATE TABLE IF NOT EXISTS scanned_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barcode VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    weight_g DECIMAL(10, 2),
    default_unit VARCHAR(50) DEFAULT 'g',
    image_url TEXT,
    nutrition JSONB,
    source VARCHAR(50) DEFAULT 'manual', -- 'manual', 'openfoodfacts', 'user'
    food_item_id UUID REFERENCES food_items(id), -- Link to our food library
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shopping List Purchases Table
-- Tracks purchases with prices for budget insights

CREATE TABLE IF NOT EXISTS shopping_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    scanned_product_id UUID REFERENCES scanned_products(id),
    product_name VARCHAR(255) NOT NULL, -- Denormalized for history
    barcode VARCHAR(50),
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
    unit VARCHAR(50) DEFAULT 'item',
    weight_g DECIMAL(10, 2),
    price DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'ZAR',
    store VARCHAR(255),
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster barcode lookups
CREATE INDEX IF NOT EXISTS idx_scanned_products_barcode ON scanned_products(barcode);

-- Index for user purchase history
CREATE INDEX IF NOT EXISTS idx_shopping_purchases_user ON shopping_purchases(user_id, purchased_at DESC);

-- RLS Policies
ALTER TABLE scanned_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_purchases ENABLE ROW LEVEL SECURITY;

-- Scanned products are public read (shared database of products)
CREATE POLICY "Scanned products are viewable by everyone" 
    ON scanned_products FOR SELECT 
    USING (true);

-- Any authenticated user can add scanned products
CREATE POLICY "Authenticated users can insert scanned products" 
    ON scanned_products FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- Shopping purchases are private to each user
CREATE POLICY "Users can view their own purchases" 
    ON shopping_purchases FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchases" 
    ON shopping_purchases FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchases" 
    ON shopping_purchases FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own purchases" 
    ON shopping_purchases FOR DELETE 
    USING (auth.uid() = user_id);

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

CREATE POLICY "Users can manage their own pantry items" 
    ON pantry_items FOR ALL 
    USING (auth.uid() = user_id);

-- Index for pantry items
CREATE INDEX IF NOT EXISTS idx_pantry_items_user ON pantry_items(user_id);
