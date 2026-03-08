-- Add missing food details
-- Run this in Supabase SQL editor

BEGIN;

-- 1. Lamb Kidney
UPDATE public.food_items SET 
details = '{"description":"Nutrient-dense organ meat rich in essential minerals and B-vitamins.","history":"Organ meats have been consumed for thousands of years, especially in traditional cuisines.","producers":"Global.","benefits":["Extremely high Vitamin B12.","Rich in iron and selenium.","Source of choline for brain health."],"facts":["One of the most nutrient-dense foods per calorie.","Supports metabolic health and energy production."]}'
WHERE name = 'Lamb Kidney' OR common_name = 'Lamb Kidneys';

-- 2. Baking Powder
UPDATE public.food_items SET 
details = '{"description":"A leavening agent used in baking to help dough and batter rise.","history":"Developed in the 1840s as a convenient alternative to yeast for home bakers.","producers":"Global.","benefits":["Enables higher-quality baked goods.","Shelf-stable and convenient.","Works reliably in recipes."],"facts":["Contains baking soda and acid salts.","Creates carbon dioxide gas for leavening."]}'
WHERE name = 'Baking Powder' OR common_name = 'Baking Powder';

-- 3. Balsamic vinegar
UPDATE public.food_items SET 
details = '{"description":"A dark, aged vinegar from aged balsam grapes used in Italian cooking.","history":"Originated in Modena, Italy in the 11th century; traditionally aged in wooden barrels.","producers":"Italy.","benefits":["Supports digestive health.","Rich in antioxidants from aging process.","Enhances nutrient absorption."],"facts":["True balsamic is aged 12-100+ years.","Develops complex, sweet flavor profile."]}'
WHERE name = 'Balsamic vinegar' OR common_name = 'Vinegar';

-- 4. Beef Liver
UPDATE public.food_items SET 
details = '{"description":"The liver of cattle, an organ meat packed with micronutrients.","history":"Consumed since ancient times; a staple in traditional and ancestral diets.","producers":"Global.","benefits":["Highest source of Vitamin B12.","Rich in heme iron and folate.","Supports immune function and energy."],"facts":["Contains all essential amino acids.","Should be consumed in moderation due to Vitamin A content."]}'
WHERE name = 'Beef Liver' OR common_name = 'Beef Livers';

-- 5. Brown sugar
UPDATE public.food_items SET 
details = '{"description":"Refined sugar with molasses reintroduced for color and flavor.","history":"Created in the 1800s as refineries separated sugar from molasses.","producers":"Global.","benefits":["Contains small amounts of minerals from molasses.","More moist texture than white sugar."],"facts":["Same caloric content as white sugar.","Molasses provides subtle caramel flavor."]}'
WHERE name = 'Brown sugar' OR common_name = 'Brown Sugar';

-- 6. Chicken Liver
UPDATE public.food_items SET 
details = '{"description":"The liver of poultry, a nutrient-dense organ meat.","history":"Used in traditional cuisines worldwide for its nutritional density.","producers":"Global.","benefits":["Nature''s multivitamin source.","High in choline for brain health.","Rich in iron and B-vitamins."],"facts":["Should be consumed in moderation due to Vitamin A.","Gentle flavor profile versatile for cooking."]}'
WHERE name = 'Chicken Liver' OR common_name = 'Chicken Livers';

-- 7. Cornmeal, White, Whole Grain, Dry
UPDATE public.food_items SET 
details = '{"description":"Whole grain corn meal, retaining all parts of the kernel.","history":"Ground corn has been a staple food in the Americas for over 7,000 years.","producers":"USA, Brazil.","benefits":["Complete grain with bran, germ, and endosperm.","Source of lutein for eye health.","Gluten-free naturally."],"facts":["More nutritious than refined cornmeal.","Requires cooking before consumption."]}'
WHERE name = 'Cornmeal, White, Whole Grain, Dry' OR common_name = 'Maize Meal';

-- 8. Mayonnaise
UPDATE public.food_items SET 
details = '{"description":"An emulsion of oil, egg yolks, and acid (usually vinegar).","history":"Created in the 18th century in Mahon, Spain; became a global condiment.","producers":"Global.","benefits":["Source of Vitamin E from oils.","Contains choline from eggs.","Enhances absorption of fat-soluble vitamins."],"facts":["Homemade mayonnaise contains raw egg.","Commercial versions often contain emulsifiers."]}'
WHERE name = 'Mayonnaise regular, salted' OR common_name = 'Mayonnaise';

-- 9. Parboiled Rice
UPDATE public.food_items SET 
details = '{"description":"Partially cooked, then dried rice that retains more nutrients than white rice.","history":"Developed to retain nutrients from the bran while providing a light grain.","producers":"USA, India.","benefits":["Retains B-vitamins through parboiling.","More texture than white rice.","Longer shelf life than brown rice."],"facts":["Steamed before final drying.","Named ''converted'' rice in some regions."]}'
WHERE name = 'Parboiled Rice, Converted, Cooked in Salted Water' OR common_name = 'White Rice (Cooked)';

-- 10. Baked Beans
UPDATE public.food_items SET 
details = '{"description":"Beans cooked slowly in a tomato or molasses-based sauce.","history":"Originated as a way to preserve beans through long, slow cooking.","producers":"Global.","benefits":["Good source of plant-based protein.","Rich in fiber and minerals.","Supports healthy digestion."],"facts":["Slow cooking makes beans easier to digest.","Often contains added sugars and sodium."]}'
WHERE name = 'PNP No Name Baked Beans' OR common_name = 'Baked Beans';

-- 11. Raw Egg
UPDATE public.food_items SET 
details = '{"description":"Uncooked egg in shell containing yolk and white.","history":"Eggs have been consumed as food for millennia.","producers":"Global.","benefits":["Complete protein with all amino acids.","Rich in choline for brain health.","High in lutein for eye protection."],"facts":["Contains enzyme inhibitors that heat deactivates.","Raw yolks contain more bioavailable lutein."]}'
WHERE name = 'Raw Egg' OR common_name = 'Eggs';

-- 12. Salt, table, iodized
UPDATE public.food_items SET 
details = '{"description":"Refined table salt fortified with iodine for thyroid health.","history":"Iodine fortification began in the 1920s to prevent iodine deficiency.","producers":"Global.","benefits":["Provides bioavailable iodine for thyroid.","Essential for electrolyte balance.","Enables mineral absorption."],"facts":["Fortified in most developed countries.","Too much salt increases blood pressure risk."]}'
WHERE name = 'Salt, table, iodized' OR common_name = 'Salt (Iodized)';

-- 13. South African Pilchard
UPDATE public.food_items SET 
details = '{"description":"Small, oily fish from South African waters, typically canned.","history":"A nutritious, sustainable seafood source for centuries.","producers":"South Africa.","benefits":["Rich in Omega-3 fatty acids EPA and DHA.","Excellent source of heme iron.","Supports cardiovascular and brain health."],"facts":["One of the lowest mercury fish.","Often packed in tomato sauce or oil."]}'
WHERE name = 'South African Pilchard' OR common_name = 'Pilchards';

-- 14. White All-Purpose Flour, Unenriched
UPDATE public.food_items SET 
details = '{"description":"Refined wheat flour without nutrient enrichment, used in baking.","history":"White flour became popular after industrial milling in the 1800s.","producers":"Global.","benefits":["Fine texture for tender baked goods.","Long shelf life.","Neutral flavor profile."],"facts":["Lacks B-vitamins compared to whole wheat.","Causes rapid blood sugar spike."]}'
WHERE name = 'White All-Purpose Flour, Unenriched' OR common_name = 'Cake Wheat Flour';

-- 15. White Bread
UPDATE public.food_items SET 
details = '{"description":"Refined bread made from white wheat flour, typically store-bought.","history":"Became a staple in Western diets in the 20th century.","producers":"Global.","benefits":["Often fortified with B-vitamins and iron.","Convenient quick-carb source.","Soft, familiar texture."],"facts":["Most commercial white bread is fortified.","Causes rapid blood sugar spike due to refinement."]}'
WHERE name = 'White Bread, Store Bought' OR common_name = 'White Bread';

COMMIT;
