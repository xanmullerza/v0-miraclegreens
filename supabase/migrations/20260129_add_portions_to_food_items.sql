alter table food_items 
add column if not exists portions jsonb default '[]'::jsonb;
