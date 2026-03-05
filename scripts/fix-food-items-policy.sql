-- Allow users to update food items (needed for saving Friendly Names)
CREATE POLICY "Allow anon update on food_items" 
ON public.food_items FOR UPDATE 
TO anon 
USING (true)
WITH CHECK (true);
