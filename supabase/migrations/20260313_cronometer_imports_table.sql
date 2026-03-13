-- Cronometer Food Imports Staging Table
-- Holds parsed food data from Cronometer before review and import into food_items

create table public.cronometer_imports (
  id uuid default gen_random_uuid() primary key,
  
  -- Reference to Cronometer food ID (e.g., "1", "2604", etc.)
  cronometer_food_id text not null unique,
  
  -- Full Cronometer food page URL
  source_url text,
  
  -- Raw parsed data from N8N parser (follows ParsedNutrition + servings structure)
  parsed_data jsonb not null,
  
  -- Status workflow: pending -> reviewed -> imported (or rejected)
  status text not null default 'pending',
  check (status in ('pending', 'reviewed', 'imported', 'rejected')),
  
  -- Optional rejection reason
  rejection_reason text,
  
  -- Timestamps
  parsed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  reviewed_at timestamp with time zone,
  imported_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for efficient querying
create index idx_cronometer_imports_status on public.cronometer_imports(status);
create index idx_cronometer_imports_cronometer_food_id on public.cronometer_imports(cronometer_food_id);
create index idx_cronometer_imports_created_at on public.cronometer_imports(created_at desc);

-- RLS Policies
alter table public.cronometer_imports enable row level security;

-- Allow authenticated users (admin) to see all imports
create policy "Allow authenticated read on cronometer_imports" on public.cronometer_imports 
  for select 
  to authenticated 
  using (true);

-- Allow authenticated users to insert new imports
create policy "Allow authenticated insert on cronometer_imports" on public.cronometer_imports 
  for insert 
  to authenticated 
  with check (true);

-- Allow authenticated users to update (for status changes during review)
create policy "Allow authenticated update on cronometer_imports" on public.cronometer_imports 
  for update 
  to authenticated 
  using (true) 
  with check (true);

-- Allow anon inserts for N8N webhook (if using unauthenticated)
create policy "Allow anon insert on cronometer_imports" on public.cronometer_imports 
  for insert 
  to anon 
  with check (true);

-- Allow anon updates for N8N webhook status changes
create policy "Allow anon update on cronometer_imports" on public.cronometer_imports 
  for update 
  to anon 
  using (true) 
  with check (true);
