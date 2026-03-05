
-- Add state concepts to the database for dynamic scaling
ALTER TABLE ingredients ADD COLUMN cooking_state TEXT DEFAULT 'raw';

-- Add a default molecular state to food items for baseline reference
ALTER TABLE food_items ADD COLUMN molecular_state TEXT DEFAULT 'whole';
