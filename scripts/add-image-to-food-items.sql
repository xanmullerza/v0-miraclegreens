-- Add image column to food_items
alter table public.food_items add column if not exists image text;
