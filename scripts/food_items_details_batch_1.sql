-- Batch 1: Filling Details and Phytonutrients for 24 items
-- Categories: Leafy Greens, Spices, Oils, Brassicas, and Misc.

BEGIN;

-- 1. Spinach, Raw
UPDATE "public"."food_items" SET 
"details" = '{"facts":["Originates from ancient Persia.","Reaches peak nutrition within 24 hours of harvest."],"history":"Introduced to China in the 7th century, where it was known as the ''Persian Green''.","benefits":["Extremely high Vitamin K.","Rich in eye-protecting Zeaxanthin.","Excellent source of plant-based iron."],"producers":"China, USA, Turkey.","description":"A versatile, dark leafy green that is a foundational nutritional powerhouse."}',
"phytonutrients" = '{"Quercetin":"A powerful antioxidant that may help combat inflammation and support heart health.","Lutein":"A carotenoid essential for eye health and protecting against macular degeneration."}'
WHERE "id" = '3f8e3bed-83be-4b76-8d3e-ba5830cfffd9';

-- 2. Nutmeg
UPDATE "public"."food_items" SET 
"details" = '{"facts":["The nutmeg tree is the only tree to produce two different spices (Nutmeg and Mace).","Once worth more than its weight in gold in medieval Europe."],"history":"Native to the Banda Islands; it sparked fierce colonial trade wars during the Age of Discovery.","benefits":["Powerful digestive aid.","Natural sleep promoter (Myristicin).","Contains antimicrobial compounds."],"producers":"Indonesia, Grenada.","description":"A highly aromatic and warm spice derived from the seed of the nutmeg tree."}',
"phytonutrients" = '{"Myristicin":"A natural organic compound that has shown potential for neuroprotective effects in lab studies.","Macelignan":"A bioactive compound found in nutmeg with strong anti-inflammatory and antibacterial properties."}'
WHERE "id" = 'eccf6374-0769-48b5-b7a5-4839ba31f22f';

-- 3. Cumin, Ground
UPDATE "public"."food_items" SET 
"details" = '{"facts":["One of the oldest spices in cultivation, found in ancient Egyptian tombs.","Integral to Ayurvedic medicine for thousands of years."],"history":"Widely used since antiquity across the Mediterranean, India, and China.","benefits":["Excellent source of non-heme iron.","Supports healthy blood glucose levels.","Promotes efficient digestion and bile secretion."],"producers":"India, China, Mexico.","description":"A fundamental earth spice known for its distinctive nutty and warm profile."}',
"phytonutrients" = '{"Cuminaldehyde":"A characteristic terpene with potential blood sugar stabilizing and antimicrobial effects.","Luteolin":"A flavonoid that acts as a powerful antioxidant and cell-protective agent."}'
WHERE "id" = '7196948c-2954-4b7a-a5b5-66aea353cdf2';

-- 4. Fennel Seed
UPDATE "public"."food_items" SET 
"details" = '{"facts":["Ancient Greeks called it ''Marathos'' (slimming).","Used as a breath freshener in many cultures post-meal."],"history":"Revered by Romans for its medicinal properties and the belief it could impart strength.","benefits":["Relieves digestive gas and bloating.","Rich in heart-healthy potassium.","Contains powerful anti-carcinogenic compounds."],"producers":"India, China, Egypt.","description":"The licorice-flavored seeds of the fennel herb, widely used in both culinary and medicinal domains."}',
"phytonutrients" = '{"Anethole":"A compound that gives fennel its flavor and is known for anti-inflammatory and antimicrobial properties.","Fenchone":"A terpene that contributes to the herb''s unique aroma and therapeutic benefits."}'
WHERE "id" = 'c2c5d3b1-b38c-4a20-9210-dcc0b0c6777e';

-- 5. Mace
UPDATE "public"."food_items" SET 
"details" = '{"facts":["The lacy outer coating of the nutmeg seed.","Known as the ''delicate cousin'' of nutmeg with a brighter citrus tone."],"history":"Valued as much as nutmeg during the 16th-century Spice Trade.","benefits":["Supports blood circulation.","Relieves joint discomfort.","Aids in focus and mental clarity."],"producers":"Indonesia, Sri Lanka.","description":"The vibrant, red skeletal membrane that covers the nutmeg kernel, offering a refined woodsy flavor."}',
"phytonutrients" = '{"Elemicin":"A terpene that provides aromatic complexity and has been studied for its effects on cognitive support.","Safrole":"A small amount of this volatile oil contributes to the distinctive mace aroma."}'
WHERE "id" = '3b7d5a14-4dc5-4e9c-b4a3-25f6f61c611c';

-- 6. Coriander, Seed
UPDATE "public"."food_items" SET 
"details" = '{"facts":["The seed of the cilantro plant.","One of the few spices that actually contains Vitamin C."],"history":"Mentioned in the Old Testament and used in ancient Sanskrit texts.","benefits":["Supports healthy cholesterol balance.","Promotes regular bowel function.","Natural heavy metal detoxifier."],"producers":"Russia, India, Morocco.","description":"A mellow, citrusy seed that forms the backbone of many global spice blends."}',
"phytonutrients" = '{"Linalool":"A natural terpene known for its calming properties and ability to support liver health.","Geraniol":"A compound with strong antioxidant potential and gut-protective qualities."}'
WHERE "id" = '82df62de-8891-48f3-a351-65d3aba2c767';

-- 7. Cumin, Seed
UPDATE "public"."food_items" SET 
"details" = '{"facts":["Cumin seeds are actually the dried fruit of the plant.","Cumin water (Jeera) is a traditional remedy for metabolic health."],"history":"Spread through the Mediterranean by the Romans as a substitute for black pepper.","benefits":["High concentration of antioxidants.","Antibacterial properties against food-borne illness.","Boosts memory and cognitive function."],"producers":"India, Iran, Syria.","description":"The whole dried seeds of the Cuminum cyminum plant, essential for deep, earthy flavoring."}',
"phytonutrients" = '{"Terpenoids":"Active compounds that contribute to the plant''s immune-modulating effects.","Glycosides":"Compounds currently under research for their role in metabolism support."}'
WHERE "id" = 'a7cb72ac-b9a0-4169-ad83-9b24294efc03';

-- 8. Margarine (Homemade)
UPDATE "public"."food_items" SET 
"details" = '{"facts":["Invented by Hippolyte Mège-Mouriès in response to a challenge by Emperor Napoleon III.","Modern homemade versions focus on high-quality cold-pressed oils."],"history":"Originally used beef tallow; now largely transitioned to plant-based lipids.","benefits":["Trans-fat free (when homemade).","Customizable fatty acid ratios.","Alternative for dairy sensitivity."],"producers":"Global.","description":"A plant-based spread created by emulsifying liquid fats with a water-based phase."}',
"phytonutrients" = '{"Tocopherols":"Essential Vitamin E isomers that protect the fats from oxidation and support skin health."}'
WHERE "id" = 'bc2e44c9-08e7-4d71-aa79-d5fbddbb6b0e';

-- 9. Turmeric, Ground
UPDATE "public"."food_items" SET 
"details" = '{"facts":["Contains a bioactive compound called Curcumin.","Known as ''The Golden Spice'' and used as a natural dye."],"history":"Used in India for 4,000 years in both religious ceremonies and culinary arts.","benefits":["Exceedingly powerful anti-inflammatory.","Boosts Brain-Derived Neurotrophic Factor (BDNF).","Strong antioxidant capacity."],"producers":"India, Indonesia.","description":"A bright yellow rhizome spice famously linked to systemic health and inflammation reduction."}',
"phytonutrients" = '{"Curcumin":"The primary active compound in turmeric, world-renowned for its anti-inflammatory and longevity-supporting effects.","Turmerone":"A bioactive oil that may help support stem cell health in the brain."}'
WHERE "id" = '2d77d3e3-ccf2-45f4-aa8a-d3f25da0cd15';

-- 10. Coconut Cream
UPDATE "public"."food_items" SET 
"details" = '{"facts":["Lower water content than coconut milk.","Rich in Medium-Chain Triglycerides (MCTs)."],"history":"A staple ingredient in Southeast Asian and Caribbean tropical cuisines.","benefits":["Quick energy source from MCTs.","Contains Lauric acid for immune support.","Satisfying healthy fat source."],"producers":"Philippines, Indonesia, Thailand.","description":"A thick, rich liquid extracted from the grated flesh of mature coconuts."}',
"phytonutrients" = '{"Lauric Acid":"A unique saturated fat that has been shown to have antimicrobial and antiviral properties in the body."}'
WHERE "id" = '1881dd83-8dcb-46a6-8418-94cacadf4043';

-- 11. Canola Oil
UPDATE "public"."food_items" SET 
"details" = '{"facts":["Developed in Canada in the 1970s.","Name stands for CANadian Oil Low Acid."],"history":"Bred from rapeseed to be lower in erucic acid for safe consumption.","benefits":["High in Omega-3.","Lowest saturated fat of common oils.","High smoke point (400°F)."],"producers":"Canada, USA, Australia.","description":"A neutral-flavored vegetable oil derived from rapeseed plants."}',
"phytonutrients" = '{"Beta-Sitosterol":"A plant sterol that helps maintain healthy cholesterol levels by blocking some absorption."}'
WHERE "id" = '024fda25-7aa2-4bc7-8a01-1e19b5b94987';

-- 12. White Bread, Store Bought
UPDATE "public"."food_items" SET 
"details" = '{"facts":["Most standardized breads are fortified with B-vitamins in the USA.","Invented in its modern sliced form by Otto Rohwedder in 1928."],"history":"Historically a status symbol for the wealthy before modern industrial milling made it common.","benefits":["Provides quick carbohydrate energy.","Fortified with Folic Acid (regulated).","Neutral base for varied nutrients."],"producers":"Global.","description":"A refined wheat product characterized by its soft texture and mild flavor."}'
WHERE "id" = 'cb13a961-d4ce-4be4-b903-ade0a00e5237';

-- 13. Red Pepper, Cayenne, Ground
UPDATE "public"."food_items" SET 
"details" = '{"facts":["Named after the city of Cayenne in French Guiana.","Scoville heat rating of 30,000 to 50,000 units."],"history":"Used for thousands of years in the Americas for both food and defense.","benefits":["Boosts metabolism via thermogenesis.","Capsaicin provides natural pain relief.","Promotes circulatory health."],"producers":"China, India, Mexico.","description":"A spicy, red chili powder famous for its metabolic and cardiovascular benefits."}',
"phytonutrients" = '{"Capsaicin":"The compound responsible for heat that also supports metabolism and natural pain management.","Lutein":"Small amounts of this eye-supporting antioxidant are present in the red hull."}'
WHERE "id" = 'f0025d34-7db0-43eb-98b1-b541244b5e43';

-- 14. Yellow Bell Pepper, Raw
UPDATE "public"."food_items" SET 
"details" = '{"facts":["Higher in Vitamin C than an orange.","Harvested later than green peppers but earlier than red."],"history":"Part of the Solanaceae family, native to Mexico and Central America.","benefits":["Essential for collagen production.","Supports immune system response.","High in carotenoids for eye health."],"producers":"China, Mexico, Netherlands.","description":"A sweet, crisp pepper that excels in both raw snacking and culinary brightness."}',
"phytonutrients" = '{"Violaxanthin":"A carotenoid antioxidant responsible for the bright yellow color.","Quercetin":"Found in the skin, this flavonoid helps support a healthy inflammatory response."}'
WHERE "id" = '9ef7db8d-ad9f-4294-a20c-5702a689f351';

-- 15. Red Bell Peppers, Raw
UPDATE "public"."food_items" SET 
"details" = '{"facts":["Fully ripened version of the green bell pepper.","Contains nearly double the Vitamin C of green varieties."],"history":"Brought to Europe and Asia by Spanish and Portuguese explorers.","benefits":["Extremely high Vitamin A and C.","Rich in antioxidants.","Low calorie density with high fiber."],"producers":"China, Spain, Mexico.","description":"The sweet, fully ripened fruit of the pepper plant, offering a rich nutritional profile."}',
"phytonutrients" = '{"Capsanthin":"The red pigment that is a powerful antioxidant, specifically protecting cells from oxidative stress.","Zeaxanthin":"A key nutrient for maintaining crystal-clear vision as we age."}'
WHERE "id" = 'b1e1243c-6860-47bf-9113-e3fa709d9f9d';

-- 16. Avocado Oil
UPDATE "public"."food_items" SET 
"details" = '{"facts":["One of the few oils extracted from the fruit pulp rather than the seed.","Highest smoke point of all unrefined oils (480°F)."],"history":"Historically used by Native American cultures for skin health and food preservation.","benefits":["Excellent source of Lutein for eyes.","High in heart-healthy Oleic acid.","Enhances absorption of carotenoids."],"producers":"Mexico, USA, New Zealand.","description":"A premium, nutrient-dense oil extracted from the pulp of mature avocados."}',
"phytonutrients" = '{"Lutein":"Uniquely high for an oil, supporting macular health and protecting against blue light.","Chlorophyll":"Present in unrefined oils, adding a subtle green hue and detoxifying potential."}'
WHERE "id" = '9a63c5e0-a413-4aee-8546-56ca544745b3';

-- 17. Extra Virgin Olive Oil
UPDATE "public"."food_items" SET 
"details" = '{"facts":["Obtained solely through mechanical means without heat or chemicals.","Integral foundation of the Mediterranean Diet."],"history":"Cultivated since at least 6,000 BC; Homer called it ''liquid gold''.","benefits":["Significant anti-inflammatory effect (Oleocanthal).","Reduces risk of heart disease.","Protects against chronic cognitive decline."],"producers":"Spain, Italy, Greece.","description":"The highest grade of olive oil, rich in polyphenols and vital monounsaturated fats."}',
"phytonutrients" = '{"Oleocanthal":"A polyphenol that mimics the anti-inflammatory action of ibuprofen in a natural way.","Hydroxytyrosol":"Considered one of the most powerful natural antioxidants for protecting heart health."}'
WHERE "id" = '1de968ac-0f77-4600-ab7f-ea7fecbe5d71';

-- 18. Olive Oil
UPDATE "public"."food_items" SET 
"details" = '{"facts":["A blend of refined olive oil and virgin grade oils.","Highly stable for frying and everyday cooking."],"history":"Essential for the rise of Mediterranean civilizations as both fuel and food.","benefits":["High in fat-soluble Vitamin E.","Excellent source of Monounsaturated Fats.","Shelf-stable and versatile."],"producers":"Tunisia, Spain, Turkey.","description":"A versatile cooking oil that balances nutritional stability with classic flavor."}'
WHERE "id" = '290b81f0-9020-4955-bea2-1e980a55db94';

-- 19. Brazil Nuts, Unsalted
UPDATE "public"."food_items" SET 
"details" = '{"facts":["Single highest natural food source of Selenium.","Grows on trees that live for 500+ years."],"history":"Gathers nutrients from deep rainforest soil, concentrating rare minerals.","benefits":["Powerful support for Thyroid function.","Anti-cancer potential (via Selenium).","Boosts natural testosterone levels."],"producers":"Brazil, Bolivia, Peru.","description":"Large, buttery nuts that serve as a potent mineral supplement in whole-food form."}',
"phytonutrients" = '{"Ellagic Acid":"A polyphenol that has been studied for its potential to help protect the brain and reduce inflammation.","Phytic Acid":"Has antioxidant properties and helps the body process heavy metals."}'
WHERE "id" = '333e93d7-de21-4dcf-a265-6aa1a36edff4';

-- 20. Parsley, Dried
UPDATE "public"."food_items" SET 
"details" = '{"facts":["Drying concentrates the mineral content significantly.","High in Apigenin, an anti-inflammatory flavonoid."],"history":"Greeks used it to decorate victors and Romans used it in food as early as 300 BC.","benefits":["Excellent source of Vitamin K1.","Supports bone health maintenance.","Contains powerful cancer-fighting flavonoids."],"producers":"Europe, North Africa.","description":"A concentrated herb that provides essential micronutrients and deep savory flavor."}',
"phytonutrients" = '{"Apigenin":"A flavonoid that shows promise as an anti-cancer agent and natural stress reducer.","Myristicin":"A volatile oil that may help inhibit tumor formation in the lungs and liver."}'
WHERE "id" = '24eb3945-6332-489e-8e1c-d5a51b450c4d';

-- 21. Parsley, Fresh
UPDATE "public"."food_items" SET 
"details" = '{"facts":["Chewing fresh parsley acts as a natural breath deodorizer.","More Vitamin C than most citrus fruits per 100g."],"history":"Used for over 2,000 years, and once considered sacred by the ancient Greeks.","benefits":["High concentration of Vitamin C and A.","Diuretic properties for kidney health.","Protects against DNA damage."],"producers":"Global.","description":"A bright, peppery culinary herb with major concentrations of vital protective nutrients."}',
"phytonutrients" = '{"Luteolin":"A flavonoid that protects against oxidative damage and supports heart health.","Limonene":"A citrus-scented compound that may help with healthy digestion and cellular repair."}'
WHERE "id" = '31356e60-f778-4423-99f6-54e910894012';

-- 22. Chinese Cabbage, Pak-Choi, Cooked
UPDATE "public"."food_items" SET 
"details" = '{"facts":["Cooking Pak-Choi makes its calcium more bioavailable.","One of the lowest calorie density vegetables."],"history":"Cultivated in the Yangtze River Delta for over 1,500 years.","benefits":["Source of bioavailable calcium.","Excellent for cardiovascular health.","Contains glucosinolates for detox support."],"producers":"China, Japan.","description":"A tender, nutrient-dense brassica that becomes mild and sweet when lightly cooked."}'
WHERE "id" = 'd93a80f8-91bc-4477-8089-a17973eb951c';

-- 23. Chinese Cabbage, Pak-Choi, Raw
UPDATE "public"."food_items" SET 
"details" = '{"facts":["Also known as Bok Choy.","Retains delicate heat-sensitive Vitamin C when eaten raw."],"history":"Likely bred from the Chinese turnip cabbage across centuries of selection.","benefits":["Extremely high in Vitamin K.","Natural source of Folate.","Supports healthy skin and eyes via Vitamin A."],"producers":"China, USA.","description":"A crisp, dark-leafed green that provides a heavy dose of nutrients with minimal calories."}',
"phytonutrients" = '{"Glucosinolates":"Natural chemicals that have been widely studied for their role in reducing cancer risk.","Quercetin":"A flavonoid that supports the immune system and helps stabilize cellular histamine."}'
WHERE "id" = '957fe51b-2a01-44ba-a0c9-8c44bff49725';

-- 24. Cabbage, Green, Cooked
UPDATE "public"."food_items" SET 
"details" = '{"facts":["Cooking releases more of the plant''s powerful Sulforaphane.","One of the most cost-effective sources of nutrition globally."],"history":"Domesticated in Europe before 1000 BC; a staple food of winter survival.","benefits":["Supports gut health and lining.","Rich in antioxidants like Vitamin C.","Promotes natural liver detoxification."],"producers":"Russia, China, India.","description":"A dense, satisfying brassica vegetable that is a cornerstone of digestive health."}'
WHERE "id" = 'c165b859-ca2d-47a2-8a19-b8c01747b65c';

COMMIT;
