-- IMPROVED CATEGORIZATION
-- Targeting Herbs, Spices, Oils, and Nuts/Seeds to clean up the "General" category

-- 1. Categorize Flavour (Herbs & Spices)
UPDATE food_items 
SET category = 'Flavour'
WHERE category = 'General'
AND (name ~* '\y(sage|thyme|mustard|pepper|cinnamon|clove|cloves|coriander|cumin|nutmeg|paprika|turmeric|ginger|basil|oregano|rosemary|bay leaf|anise|allspice|herb|spice|extract|powder|dried|mace|cardamom|saffron|vanilla)\y'
   OR common_name ~* '\y(sage|thyme|mustard|pepper|cinnamon|clove|cloves|coriander|cumin|nutmeg|paprika|turmeric|ginger|basil|oregano|rosemary|bay leaf|anise|allspice|herb|spice|extract|powder|dried|mace|cardamom|saffron|vanilla)\y');

-- 2. Categorize Oils
UPDATE food_items 
SET category = 'Oils'
WHERE category = 'General'
AND (name ~* '\y(oil|lard|tallow|butter|margarine|fat)\y'
   OR common_name ~* '\y(oil|lard|tallow|butter|margarine|fat)\y');

-- 3. Categorize Nuts & Seeds
UPDATE food_items 
SET category = 'Nuts'
WHERE category = 'General'
AND (name ~* '\y(nut|nuts|seed|seeds|almond|walnut|pecan|cashew|pistachio|hazelnut|macadamia|brazil nut|chia|flax|hemp|sunflower|pumpkin|sesame|poppy)\y'
   OR common_name ~* '\y(nut|nuts|seed|seeds|almond|walnut|pecan|cashew|pistachio|hazelnut|macadamia|brazil nut|chia|flax|hemp|sunflower|pumpkin|sesame|poppy)\y');

-- 4. Categorize Supplements
UPDATE food_items 
SET category = 'Supplements'
WHERE category = 'General'
AND (name ~* '\y(supplement|multivitamin|tablet|capsule|protein powder|creatine|moringa powder)\y'
   OR common_name ~* '\y(supplement|multivitamin|tablet|capsule|protein powder|creatine|moringa powder)\y');
