-- Update phytonutrients for food items
-- This script uses raw SQL to add missing phytonutrient data
-- Run this in Supabase SQL editor

BEGIN;

-- 1. Lamb Kidney
UPDATE public.food_items SET 
phytonutrients = '{"Carnitine":"A compound essential for energy production, supporting metabolic health and muscle function.","Heme Iron":"The most bioavailable form of iron, crucial for oxygen transport and energy metabolism.","Carnosine":"A dipeptide found in animal tissues with potent antioxidant and anti-inflammatory properties.","CoQ10":"A mitochondrial powerhouse that supports cellular energy production and heart health."}'
WHERE name = 'Lamb Kidney' OR common_name = 'Lamb Kidneys';

-- 2. Baking Powder  
UPDATE public.food_items SET 
phytonutrients = '{"Baking Soda Compounds":"Although inorganic, baking powder enables nutrient-dense baked goods with long shelf life.","Acid Salts":"The acid components help leaven baked goods to proper texture and digestibility."}'
WHERE name = 'Baking Powder' OR common_name = 'Baking Powder';

-- 3. Balsamic vinegar
UPDATE public.food_items SET 
phytonutrients = '{"Polyphenols":"Antioxidant compounds from aged grapes that support heart health and antioxidant defenses.","Acetic Acid":"Supports digestive health and may help with blood sugar regulation.","Coumarin":"Found in small amounts, supports blood circulation and natural anti-inflammatory responses."}'
WHERE name = 'Balsamic vinegar' OR common_name = 'Vinegar';

-- 4. Beef Liver
UPDATE public.food_items SET 
phytonutrients = '{"Heme Iron":"The most bioavailable form of iron for oxygen transport and energy metabolism.","Carnitine":"Essential for cellular energy production and fat metabolism.","Carnosine":"A powerful antioxidant dipeptide that protects against cellular damage.","Anserine":"A unique compound researched for neuroprotective and anti-fatigue properties."}'
WHERE name = 'Beef Liver' OR common_name = 'Beef Livers';

-- 5. Brown sugar
UPDATE public.food_items SET 
phytonutrients = '{"Molasses Compounds":"Natural compounds from molasses with antioxidant potential.","Minerals":"Contains trace minerals like Iron and Potassium from the molasses fraction."}'
WHERE name = 'Brown sugar' OR common_name = 'Brown Sugar';

-- 6. Chicken Liver
UPDATE public.food_items SET 
phytonutrients = '{"Heme Iron":"The most bioavailable form of iron crucial for oxygen transport.","Carnitine":"Supports cellular energy production and fat oxidation.","Anserine":"A neuroprotective dipeptide with anti-fatigue potential.","Vitamin A Precursors":"Retinol and beta-carotene for vision, immune, and skin health."}'
WHERE name = 'Chicken Liver' OR common_name = 'Chicken Livers';

-- 7. Cornmeal, White, Whole Grain, Dry
UPDATE public.food_items SET 
phytonutrients = '{"Lutein":"A yellow carotenoid that supports eye health and protects tissues from blue light.","Zeaxanthin":"Found in corn kernels, it concentrates in the retina to support long-term vision.","Beta-Carotene":"Supports immune function and healthy vision through pro-Vitamin A activity."}'
WHERE name = 'Cornmeal, White, Whole Grain, Dry' OR common_name = 'Maize Meal';

-- 8. Mayonnaise regular, salted
UPDATE public.food_items SET 
phytonutrients = '{"Vitamin E":"From oil content, supports cell membrane protection and antioxidant defense.","Carotenoids":"If made with egg yolks, provides lutein and zeaxanthin for eye health."}'
WHERE name = 'Mayonnaise regular, salted' OR common_name = 'Mayonnaise';

-- 9. Parboiled Rice, Converted, Cooked in Salted Water
UPDATE public.food_items SET 
phytonutrients = '{"Gamma-Oryzanol":"A unique plant compound specific to rice bran that supports cholesterol balance.","Inositol":"A compound that supports cellular communication and may help stabilize blood sugar.","Phytic Acid":"Has antioxidant properties and may help metabolize heavy metals."}'
WHERE name = 'Parboiled Rice, Converted, Cooked in Salted Water' OR common_name = 'White Rice (Cooked)';

-- 10. PNP No Name Baked Beans
UPDATE public.food_items SET 
phytonutrients = '{"Phytates":"Plant compounds that bind minerals but have antioxidant potential.","Flavonoids":"Natural antioxidants from beans that protect cells from oxidative stress.","Saponins":"Compounds that may help support healthy cholesterol and immune function."}'
WHERE name = 'PNP No Name Baked Beans' OR common_name = 'Baked Beans';

-- 11. Raw Egg
UPDATE public.food_items SET 
phytonutrients = '{"Choline":"An essential nutrient crucial for brain development and cognitive function.","Lutein":"Concentrated in egg yolks, this carotenoid protects eyes from age-related damage.","Zeaxanthin":"Works synergistically with lutein to protect the macula and support vision.","Carnosine":"An antioxidant dipeptide with anti-aging and neuroprotective properties."}'
WHERE name = 'Raw Egg' OR common_name = 'Eggs';

-- 12. Salt, table, iodized
UPDATE public.food_items SET 
phytonutrients = '{"Iodine":"Essential for thyroid function and hormone production.","Minerals":"Contains trace minerals like sodium and potassium for electrolyte balance."}'
WHERE name = 'Salt, table, iodized' OR common_name = 'Salt (Iodized)';

-- 13. South African Pilchard
UPDATE public.food_items SET 
phytonutrients = '{"Omega-3 Fatty Acids":"EPA and DHA that support heart, brain, and eye health.","Heme Iron":"Highly bioavailable iron for oxygen transport and energy metabolism.","Astaxanthin":"A powerful carotenoid that provides the pink color and potent antioxidant protection.","Carnosine":"An antioxidant compound that protects cells from oxidative damage."}'
WHERE name = 'South African Pilchard' OR common_name = 'Pilchards';

-- 14. White All-Purpose Flour, Unenriched
UPDATE public.food_items SET 
phytonutrients = '{"Phytic Acid":"A compound with antioxidant properties and potential heavy metal binding.","Gliadin":"Part of gluten that provides structure to baked goods."}'
WHERE name = 'White All-Purpose Flour, Unenriched' OR common_name = 'Cake Wheat Flour';

-- 15. White Bread, Store Bought
UPDATE public.food_items SET 
phytonutrients = '{"B-Vitamins":"Often fortified with B1, B2, B3, and folic acid for metabolic support.","Iron":"Fortified in most commercial breads to support oxygen transport.","Gluten":"Provides structure and elasticity, though problematic for celiac individuals."}'
WHERE name = 'White Bread, Store Bought' OR common_name = 'White Bread';

COMMIT;
