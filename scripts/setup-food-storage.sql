-- Create the 'food-items' bucket if it doesn't exist
insert into storage.buckets (id, name, public)
select 'food-items', 'food-items', true
where not exists (
    select 1 from storage.buckets where id = 'food-items'
);

-- Policies for 'food-items' bucket
create policy "Allow anon uploads to food-items"
on storage.objects for insert
to anon
with check ( bucket_id = 'food-items' );

create policy "Allow anon updates to food-items"
on storage.objects for update
to anon
using ( bucket_id = 'food-items' );

create policy "Allow anon selects from food-items"
on storage.objects for select
to anon
using ( bucket_id = 'food-items' );
