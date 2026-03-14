-- Migration script to add 'cook_time' to the 'recipes' table
-- Run this in your Supabase SQL Editor

DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'cook_time'
    ) THEN 
        ALTER TABLE public.recipes ADD COLUMN cook_time integer NOT NULL DEFAULT 0;
    END IF;
END $$;
