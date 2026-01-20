-- 1. Food Items Table (Source of Truth)
create table public.food_items (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  
  -- Macros per 100g
  energy_kj numeric,
  energy_kcal numeric,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  
  -- Flexible JSON for all other micronutrients (Vitamins, Minerals, etc.)
  -- STANDARD KEYS: 'Potassium', 'Magnesium', 'Calcium', 'Phosphorus', 'Sodium', 
  -- 'Iron', 'Zinc', 'Selenium', 'Copper', 'Manganese', 'Vitamin A', 'Vitamin C', 
  -- 'Vitamin D', 'Vitamin E', 'Vitamin K', 'B1 (Thiamine)', 'B2 (Riboflavin)', 
  -- 'B3 (Niacin)', 'B5 (Pantothenic Acid)', 'B6 (Pyridoxine)', 'B9 (Folate)', 
  -- 'B12 (Cobalamin)', 'Choline', 'Fiber'
  micronutrients jsonb default '{}'::jsonb,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Food Measures Table (Unit Conversions)
-- Links a food item to specific measures (e.g. "1 cup = 245g")
create table public.food_measures (
  id uuid default gen_random_uuid() primary key,
  food_item_id uuid references public.food_items(id) on delete cascade,
  label text not null, -- 'cup', 'jumbo', 'tbsp'
  weight_g numeric not null, -- The weight in grams of this measure
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Modify Ingredients Table
-- Add link to food_items and track precise weight
alter table public.ingredients 
add column food_item_id uuid references public.food_items(id),
add column measure_label text, -- Stores which measure was used (e.g. 'large')
add column quantity numeric, -- Stores how many of that measure (e.g. 2)
add column weight_g numeric; -- Stores calculated total weight (e.g. 100g)

-- RLS Policies
alter table public.food_items enable row level security;
alter table public.food_measures enable row level security;

create policy "Allow public read access on food_items" on public.food_items for select to anon using (true);
create policy "Allow public read access on food_measures" on public.food_measures for select to anon using (true);

-- Allow anon insert/delete for seeding purposes (remove in prod)
create policy "Allow anon insert on food_items" on public.food_items for insert to anon with check (true);
create policy "Allow anon delete on food_items" on public.food_items for delete to anon using (true);

create policy "Allow anon insert on food_measures" on public.food_measures for insert to anon with check (true);
create policy "Allow anon delete on food_measures" on public.food_measures for delete to anon using (true);
