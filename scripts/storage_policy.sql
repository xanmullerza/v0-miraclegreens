-- 1. Policy to allow uploads (INSERT) to the 'recipes' bucket
create policy "Allow anon uploads"
on storage.objects for insert
to anon
with check ( bucket_id = 'recipes' );

-- 2. Policy to allow updates (UPDATE) to files in 'recipes' bucket
create policy "Allow anon updates"
on storage.objects for update
to anon
using ( bucket_id = 'recipes' );

-- 3. Policy to allow reading (SELECT) is usually enabled if Public, but just in case:
create policy "Allow anon selects"
on storage.objects for select
to anon
using ( bucket_id = 'recipes' );
