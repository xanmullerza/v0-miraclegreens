-- Batch 2: Filling Details and Phytonutrients for the final identified items
-- Categories: Grains, Baking Agents, Oils, and Proteins.

BEGIN;

-- 1. Cornmeal Mush, Plain
UPDATE "public"."food_items" SET 
"details" = '{"facts":["A traditional staple often known as polenta in Italy or grits in the Southern US.","One of the few cereals that contains significant amounts of Lutein."],"history":"Milled corn has been a foundational energy source for the Americas for over 7,000 years.","benefits":["Provides slow-release energy.","Gluten-free by nature.","Source of protective carotenoids."],"producers":"USA, Brazil, China.","description":"A smooth, boiled cereal porridge made from ground yellow or white corn."}',
"phytonutrients" = '{"Lutein":"A yellow carotenoid that supports eye health and helps protect tissues from blue light damage.","Zeaxanthin":"Found in the corn kernels, it concentrates in the retina to support long-term vision."}'
WHERE "id" = '718615a0-d293-441e-9db5-816d51b4af62';

-- 2. Baking Yeast, Active Dry
UPDATE "public"."food_items" SET 
"details" = '{"facts":["Consists of living yeast cells in a dormant state.","Active Dry yeast was developed to be shelf-stable without refrigeration."],"history":"The use of yeast for fermentation dates back to Ancient Egypt; commercial dry versions revolutionized home baking.","benefits":["Excellent source of B-vitamins (when fortified).","High selenium content.","Supports natural fermentation processes."],"producers":"Global.","description":"A biological leavening agent that converts sugars into carbon dioxide to make dough rise."}',
"phytonutrients" = '{"Beta-Glucan":"A type of fiber found in yeast cell walls that has been studied for its ability to support a healthy immune system."}'
WHERE "id" = '011a47ca-121d-4ee0-964e-69d3b365ee84';

-- 3. Baking Powder
UPDATE "public"."food_items" SET 
"details" = '{"facts":["A chemical leavener made of a carbonate, an acid, and a buffer (usually cornstarch).","Invented in 1843 by Alfred Bird."],"history":"Released bakers from the long wait-times of biological yeast, leading to the rise of quick breads and cakes.","benefits":["Enables instant leavening for baked goods.","Consistency in texture and volume.","Allows for varied crumb structure."],"producers":"Global.","description":"A complete chemical leavening agent that releases CO2 when exposed to heat and moisture."}'
WHERE "id" = 'd01aaba1-8e39-4c13-92f8-2f4e02d252c6';

-- 4. Soybean Oil, Unhydrogenated
UPDATE "public"."food_items" SET 
"details" = '{"facts":["One of the most widely consumed vegetable oils in the world.","Contains a high ratio of Polyunsaturated Fatty Acids (PUFA)."],"history":"Soybeans were first cultivated in East Asia but became a massive global crop in the 20th century.","benefits":["High in Vitamin K.","Good source of Omega-6 fatty acids.","Neutral flavor profile for versatile use."],"producers":"USA, Brazil, Argentina.","description":"A clear, pale yellow oil extracted from whole soybeans, used for frying, baking, and dressings."}',
"phytonutrients" = '{"Isoflavones":"Trace amounts of these plant-based compounds may support bone density and hormonal balance.","Tocopherols":"Natural forms of Vitamin E that protect the oil from oxidation and support skin health."}'
WHERE "id" = '4bede918-646b-4dcf-823d-b7343b435f61';

-- 5. Chicken Breast, Skin Removed Before Cooking
UPDATE "public"."food_items" SET 
"details" = '{"facts":["The leanest part of the chicken, containing very little saturated fat.","High quality complete protein with all essential amino acids."],"history":"Domesticated from the red junglefowl in Asia around 8,000 years ago.","benefits":["Supreme source of highly bioavailable protein.","Rich in Selenium and Vitamin B6.","Supports muscle growth and repair."],"producers":"USA, Brazil, Europe.","description":"A high-protein, low-fat animal protein source that is a staple of a health-conscious diet."}',
"phytonutrients" = '{"Anserine":"A dipeptide found primarily in poultry that has been researched for its potential neuroprotective and anti-fatigue properties."}'
WHERE "id" = '45c06987-a1c9-407e-bcd6-e83ef131e44f';

COMMIT;
