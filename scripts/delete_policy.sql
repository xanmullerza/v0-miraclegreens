-- Allow anonymous users to DELETE recipes
-- Required to thoroughly wipe the old data
create policy "Allow anon delete on recipes"
on public.recipes for delete
to anon
using (true);
