-- Create shopping_list_items table for cloud persistence
CREATE TABLE IF NOT EXISTS public.shopping_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    food_item_id UUID REFERENCES public.food_items(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    quantity TEXT,
    unit TEXT,
    checked BOOLEAN DEFAULT FALSE,
    source TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only manage their own items
CREATE POLICY "Users can view own shopping list" 
    ON public.shopping_list_items FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shopping list" 
    ON public.shopping_list_items FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shopping list" 
    ON public.shopping_list_items FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shopping list" 
    ON public.shopping_list_items FOR DELETE 
    USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_shopping_list_user ON public.shopping_list_items(user_id);

-- Add quantity to pantry_items if it doesn't match the new sync strategy
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pantry_items' AND column_name = 'quantity'
    ) THEN
        ALTER TABLE public.pantry_items ADD COLUMN quantity VARCHAR(50);
    END IF;
END $$;
