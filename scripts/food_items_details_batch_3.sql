-- Batch 3: Completing Details and Phytonutrients for the final set of identified items
-- Categories: Nuts, Herbs, Oils, and Condiments.

BEGIN;

-- 1. Cashews, Raw
UPDATE "public"."food_items" SET 
"details" = '{"facts":["The cashew is actually a seed that grows at the bottom of the cashew apple.","Raw cashew shells contain urushiol, the same toxin found in poison ivy."],"history":"Native to Northeastern Brazil, cashews were spread to India and Africa by Portuguese explorers in the 1500s.","benefits":["Excellent source of Copper for collagen production.","Rich in Magnesium for bone and muscle health.","Heart-healthy monounsaturated fats."],"producers":"Vietnam, Nigeria, India.","description":"A buttery, sweet seed that serves as a nutrient-dense snack and a versatile base for plant-based creams."}',
"phytonutrients" = '{"Anacardic Acid":"A compound found in raw cashews that has been studied for its potential antioxidant and antimicrobial effects.","Zeaxanthin":"A carotenoid that is selectively absorbed by the retina to protect against oxidative damage."}'
WHERE "id" = '4bcd0992-c1ed-42de-b452-bf4ccd3be3f9';

-- 2. Rosemary dried
UPDATE "public"."food_items" SET 
"details" = '{"facts":["The name Rosemary means ''Dew of the Sea'' (Ros Marinus) in Latin.","Drying rosemary preserves its volatile oils better than most other herbs."],"history":"Ancient Greek students wore garlands of rosemary to improve their memory during exams; it was later used at weddings as a symbol of fidelity.","benefits":["Contains powerful antioxidant carnosic acid.","Supports healthy blood circulation.","Helps relieve digestive discomfort."],"producers":"Spain, Morocco, Italy.","description":"A fragrant, needle-like herb with an earthy, pine-like aroma and significant therapeutic properties."}',
"phytonutrients" = '{"Rosmarinic Acid":"A natural polyphenol that has powerful antioxidant and anti-inflammatory activities.","Carnosol":"A bioactive compound researched for its role in protecting cells and supporting neurological health."}'
WHERE "id" = '7cd3e495-5978-4d37-af61-208dac7bf61f';

-- 3. Sunflower Oil
UPDATE "public"."food_items" SET 
"details" = '{"facts":["Sunflower plants can be used to extract toxic heavy metals from soil.","High in Vitamin E, one of the primary fat-soluble antioxidants."],"history":"Domesticated by Native Americans as early as 3,000 BC; later became a major industrial crop in Russia and Ukraine.","benefits":["Promotes skin health and cell regeneration.","High smoke point (450°F) makes it safe for high-heat cooking.","Rich in heart-supporting plant sterols."],"producers":"Ukraine, Russia, Argentina.","description":"A versatile, light-flavored oil extracted from the seeds of the Helianthus annuus plant."}',
"phytonutrients" = '{"Alpha-Tocopherol":"The most biologically active form of Vitamin E, crucial for protecting cell membranes from free radical damage.","Phytosterols":"Plant compounds that compete with cholesterol for absorption in the gut, helping to lower overall levels."}'
WHERE "id" = '9b8da72e-9baa-4269-a9e4-d6f0bfe91aec';

-- 4. Chili powder
UPDATE "public"."food_items" SET 
"details" = '{"facts":["Usually a blend of ground dried chilies, cumin, garlic powder, and oregano.","The heat is measured in Scoville Heat Units, primarily driven by capsaicin."],"history":"Though inspired by Mexican flavors, the modern spice blend was popularized in Texas in the late 19th century.","benefits":["Capsaicin boosts metabolic rate.","Contains Vitamin A for eye and immune health.","Supports healthy sinus function."],"producers":"India, Mexico, USA.","description":"A deep-red spice blend that adds warmth, color, and a metabolic kick to various dishes."}',
"phytonutrients" = '{"Capsaicin":"A bioactive alkaloid that stimulates circulation and may help reduce appetite and boost calorie burning.","Quercetin":"A powerful flavonoid with antioxidant properties found in the dried pepper components."}'
WHERE "id" = '38dfd70c-bc04-4ad5-8d35-44aa2af55454';

-- 5. Yellow mustard
UPDATE "public"."food_items" SET 
"details" = '{"facts":["The vibrant yellow color comes from the addition of ground Turmeric.","Mustard seeds were used for snakebites in ancient medicine."],"history":"Romans were the first to experiment with mustard as a condiment, mixing it with unfermented grape juice (Mustum).","benefits":["Extremely low-calorie flavor enhancer.","Contains Selenium for thyroid support.","Source of Omega-3 through mustard seeds."],"producers":"Canada, Nepal, Ukraine.","description":"A tangy, classic condiment made from ground mustard seeds, water, vinegar, and turmeric."}',
"phytonutrients" = '{"Glucosinolates":"A group of sulfur-containing compounds that help the body manage natural detoxification.","Curcumin":"Provided by the turmeric addition, it offers powerful anti-inflammatory and brain-protective benefits."}'
WHERE "id" = 'c3f9cbbd-db8f-48b3-943a-bfc172021cea';

COMMIT;
