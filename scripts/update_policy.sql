-- Allow anonymous users (client) to update recipes
-- This is necessary for the migration script to save the new image URLs
create policy "Allow anon update on recipes"
on public.recipes for update
to anon
using (true)
with check (true);
