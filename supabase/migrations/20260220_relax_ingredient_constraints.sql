-- Relax constraints on ingredients table to allow structured data from the new builder
-- The new builder uses food_item_id, weight_g, quantity, and measure_label instead of legacy item/amount strings.

ALTER TABLE public.ingredients ALTER COLUMN item DROP NOT NULL;
ALTER TABLE public.ingredients ALTER COLUMN amount DROP NOT NULL;

-- Ensure all new columns exist and are correctly typed
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ingredients' AND column_name='food_item_id') THEN
        ALTER TABLE public.ingredients ADD COLUMN food_item_id uuid REFERENCES public.food_items(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ingredients' AND column_name='measure_label') THEN
        ALTER TABLE public.ingredients ADD COLUMN measure_label text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ingredients' AND column_name='quantity') THEN
        ALTER TABLE public.ingredients ADD COLUMN quantity numeric;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ingredients' AND column_name='weight_g') THEN
        ALTER TABLE public.ingredients ADD COLUMN weight_g numeric;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ingredients' AND column_name='base_ingredient') THEN
        ALTER TABLE public.ingredients ADD COLUMN base_ingredient text;
    END IF;
END $$;
