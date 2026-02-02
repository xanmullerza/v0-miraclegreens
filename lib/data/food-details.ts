export interface FoodDetail {
    description: string;
    history: string;
    producers: string;
    benefits: string[];
    facts: string[];
}

export const FOOD_DETAILS: Record<string, FoodDetail> = {
    // --- PREVIOUS ENTRIES ---
    "739a6ee4-c1d5-4466-8d79-e370d3e55ec9": {
        description: "Star Anise is a star-shaped spice fruit with a distinct licorice flavor, widely used in Asian cooking and as a key ingredient in five-spice powder.",
        history: "Native to Northeast Vietnam and Southwest China. It has been used as a spice and medicine for over 3,000 years.",
        producers: "China and Vietnam are the dominant global producers.",
        benefits: ["Rich in Shikimic acid (antiviral).", "Traditionally used for digestion.", "High antioxidants (linalool)."],
        facts: ["Source of shikimic acid for Tamiflu.", "Not related to anise seed."]
    },
    "69638ba3-b73f-4a23-820d-da71b872b049": {
        description: "Allspice is the dried unripe berry of Pimenta dioica, tasting like cinnamon, nutmeg, and cloves.",
        history: "Discovered by Columbus in Jamaica. Named by the English in 1621.",
        producers: "Jamaica, Mexico.",
        benefits: ["Anti-inflammatory (eugenol).", "Digestive aid.", "Antioxidant rich."],
        facts: ["It is a single berry, not a blend.", "Wood used for Jamaican jerk smoking."]
    },
    "58c8e0c0-8a4d-45a5-967f-a6d547e45da2": {
        description: "The almond is the edible seed of the Prunus dulcis tree. Technically a drupe (stone fruit).",
        history: "Native to Iran and surrounds. Spread via Silk Road.",
        producers: "USA (California) produces >80%.",
        benefits: ["High Vitamin E.", "Magnesium for blood sugar.", "Heart-healthy fats."],
        facts: ["Member of the rose family.", "Relies heavily on bees for pollination."]
    },
    "0018c3e8-03ff-4599-8c87-857a7a0e428e": {
        description: "Amaranth is an ancient pseudocereal grain, gluten-free and protein-rich.",
        history: "Staple of Aztecs, banned by Spanish conquistadors.",
        producers: "China, India, Peru.",
        benefits: ["Complete protein.", "Gluten-free.", "High minerals (Mn, Mg, Fe)."],
        facts: ["Name means 'unfading' in Greek.", "Used in ancient religious rituals."]
    },
    "bb036fb6-f627-4331-b873-0b2df153ad08": {
        description: "The apple is a pomaceous fruit of the apple tree (Malus domestica).",
        history: "Originated in Central Asia (Kazakhstan).",
        producers: "China, USA, Turkey.",
        benefits: ["Pectin (fiber).", "Vitamin C.", "Lung health support."],
        facts: ["Apples float (25% air).", "Over 7,500 varieties exist."]
    },
    "a785d796-5357-426a-9b24-b461d95a21a0": {
        description: "The apricot is a golden-orange stone fruit with velvety skin.",
        history: "Cultivated in China/Central Asia since 3000 BC.",
        producers: "Turkey, Iran, Uzbekistan.",
        benefits: ["Vitamin A/Beta-carotene.", "Hydration.", "Catechins."],
        facts: ["Called 'eggs of the sun' by Persians.", "Related to peaches."]
    },
    "e82530f1-f8e8-4170-86bd-bf965b110325": {
        description: "The avocado is a creamy, nutrient-dense fruit native to the Americas.",
        history: "Native to Mexico (~10,000 years ago). Aztec 'ahuacatl'.",
        producers: "Mexico, Peru, Indonesia.",
        benefits: ["Healthy monounsaturated fats.", "More potassium than bananas.", "High fiber."],
        facts: ["Ripens only after harvest.", "Toxic to birds (persin)."]
    },
    "596ae074-33c5-418c-b054-305c0d0672de": {
        description: "Cucumber is a widely cultivated creeping vine plant bearing cylindrical fruits.",
        history: "Originated in India 3,000 years ago.",
        producers: "China, Turkey, Russia.",
        benefits: ["High water (95%).", "Antioxidants.", "Low calorie."],
        facts: ["Botanically a berry.", "'Cool as a cucumber' refers to its internal temp."]
    },
    "a3703653-d3b4-46e6-a258-0c49d6d6d45a": {
        description: "Garlic powder is dehydrated, ground garlic used for seasoning.",
        history: "Garlic used for 5,000 years (Egypt/India).",
        producers: "China (80%).",
        benefits: ["Immune boosting (allicin).", "Heart health.", "Flavor without salt."],
        facts: ["4lbs fresh = 1lb powder.", "Performance enhancer in ancient Olympics."]
    },
    "402849cc-f982-4e59-96d3-052e02e587a2": {
        description: "Onion powder is dehydrated, ground onion.",
        history: "Onions cultivated for 5,000+ years.",
        producers: "China, India, USA.",
        benefits: ["Prebiotic fiber.", "Quercetin.", "Bone health."],
        facts: ["Concentrated flavor.", "Grant wouldn't move army without onions."]
    },
    "53e70c6a-439b-4335-afd9-4b98bd3bc321": {
        description: "Cocoa mix is a blend of cocoa solids and sweeteners.",
        history: "Mayans drank spicy chocolate 2000 years ago.",
        producers: "Ivory Coast, Ghana affect cocoa supply.",
        benefits: ["Polyphenols.", "Energy.", "Mood booster."],
        facts: ["First chocolate bar invented 1847.", "White chocolate has no cocoa solids."]
    },
    "573fa358-25b5-4191-90b8-e5c492f02f7f": {
        description: "Iceberg lettuce is a crisphead lettuce known for crunch and water content.",
        history: "USA late 19th century. Named for shipping in ice.",
        producers: "USA (California/Arizona).",
        benefits: ["Hydration.", "Vitamin K.", "Low calorie."],
        facts: ["Dominant US lettuce for decades.", "Often unfairly maligned as nutrient-empty."]
    },

    // --- NEW ENTRIES FROM JSON ---

    // Zucchini (Baby Marrow)
    "a1564f83-a04f-4684-bc86-7287f8ba9ccf": {
        description: "Zucchini is a summer squash, harvested while immature.",
        history: "Developed in Italy in the late 19th century from Americas squash.",
        producers: "China, India, Russia.",
        benefits: ["Low calorie.", "Vitamin A.", "Antioxidants (lutein/zeaxanthin)."],
        facts: ["A type of berry (pepo).", "Can grow 5cm in 24 hours."]
    },
    "64cfa9a0-b1a0-4804-9f7e-063381d50d7b": {
        description: "Cooked zucchini offers a softer texture and concentrated nutrients.",
        history: "See fresh zucchini.",
        producers: "China, India.",
        benefits: ["Easier digestion.", "Concentrated minerals.", "Hydration."],
        facts: ["Flower is also edible.", "Often used in baking (breads)."]
    },
    // Baked Beans
    "7b59d2ea-a8ad-4b7d-b7a6-5790562a45d9": {
        description: "Haricot beans stewed in a tomato-based sauce.",
        history: "Native American roots, adapted by settlers. Canned famously by Heinz in 1895.",
        producers: "USA, UK (consumption).",
        benefits: ["High fiber.", "Plant protein.", "Low GI."],
        facts: ["UK eats more baked beans than anywhere else.", "Originally baked with bear fat."]
    },
    // Banana
    "0fcd3dfd-5224-4029-bdd2-8e06206b21db": {
        description: "Elongated, edible fruit biologically classified as a berry.",
        history: "Domesticated in Papua New Guinea (~8000 BC).",
        producers: "India, China, Indonesia.",
        benefits: ["Potassium.", "Vitamin B6.", "Quick energy."],
        facts: ["Radioactive (tiny amount).", "Bananas float in water."]
    },
    // Basil
    "72e34333-0ac5-454c-9d06-be213f35814e": {
        description: "Culinary herb of the mint family (Lamiaceae).",
        history: "Native to India/SE Asia. 'Royal herb' in Greek.",
        producers: "Egypt, USA.",
        benefits: ["Anti-inflammatory.", "Vitamin K.", "Antioxidant."],
        facts: ["Holy Basil is sacred in Hinduism.", "Used in embalming mummies."]
    },
    // Bay Leaf
    "77de6b5e-7d72-46f4-9180-0b805786c83e": {
        description: "Aromatic leaf of the bay laurel tree.",
        history: "Ancient Greece symbol of victory (Laurel wreath).",
        producers: "Turkey.",
        benefits: ["Digestion aid.", "Anti-inflammatory.", "Vitamin A/C."],
        facts: ["Don't eat whole (sharp edges).", "Used to flavor soups/stews."]
    },
    // Beets
    "a9e04a36-36f4-4fac-9a12-662905fa3f5f": {
        description: "The taproot portion of a beet plant.",
        history: "Domesticated in Middle East. Romans ate the leaves first.",
        producers: "Russia, France, USA.",
        benefits: ["Nitrates (blood pressure).", "Folate.", "Liver support."],
        facts: ["Can turn urine pink (beeturia).", "Used as sugar source (sugar beet)."]
    },
    // Black Pepper
    "cd939756-0ae5-46bf-be67-877e307c45a0": {
        description: "Dried unripe fruit of Piper nigrum.",
        history: "Native to Kerala, India. Traded for 4000 years.",
        producers: "Vietnam, Brazil, Indonesia.",
        benefits: ["Piperine (nutrient absorption).", "Antioxidant.", "Digestion."],
        facts: ["Once used as currency ('black gold').", "Most traded spice globally."]
    },
    "b7c38ad0-254a-4aac-af83-b920e605a851": {
        description: "Ground black pepper, a kitchen staple.",
        history: "See peppercorns.",
        producers: "Vietnam.",
        benefits: ["Enhances turmeric absorption.", "Flavor enhancer.", "Digestion."],
        facts: ["Sneezing caused by piperine irritating nose.", "Used in mummification."]
    },
    // Blackberries
    "3cc6bfa7-2aba-496b-a597-ab14d23801b6": {
        description: "Edible fruit of the genus Rubus.",
        history: "Native to Europe/North America. Used medicinally by Greeks.",
        producers: "Mexico, USA.",
        benefits: ["High fiber.", "Vitamin C/K.", "Antocyanins."],
        facts: ["Aggregate fruit (cluster of drupelets).", "Darker color = more antioxidants."]
    },
    // Blueberries
    "307f57e3-7ad4-447f-aed1-4745136256ef": {
        description: "Perennial flowering plants with blue/purple berries.",
        history: "Native to North America. Commercially cultivated only since 1900s.",
        producers: "USA, Canada, Peru.",
        benefits: ["Brain health.", "Heart health.", "Top antioxidant source."],
        facts: ["One of the only natural blue foods.", "Star shape on blossom end."]
    },
    // Broccoli
    "84e9b89d-ffd1-4481-ad09-c1fb49449dc5": {
        description: "Edible green plant in the cabbage family.",
        history: "Bred in Italy (Roman times) from wild cabbage.",
        producers: "China, India.",
        benefits: ["Sulforaphane (cancer fighter).", "Vitamin C/K.", "Fiber."],
        facts: ["Man-made (selective breeding).", "More Vitamin C than oranges."]
    },
    // Butternut
    "604a2c48-c9f9-4b59-8fe1-f784d44d404f": {
        description: "Winter squash with sweet, nutty taste.",
        history: "Developed in Waltham, Massachusetts (1940s).",
        producers: "USA, South Africa.",
        benefits: ["Vitamin A.", "Fiber.", "Potassium."],
        facts: ["Technically a fruit.", "Seeds are edible."]
    },
    // Cabbage
    "2a7cc236-d750-4440-ae7e-0ea35d270d4d": {
        description: "Leafy green, red, or white biennial plant.",
        history: "Domesticated in Europe ~1000 BC.",
        producers: "China, India.",
        benefits: ["Vitamin K/C.", "Anti-inflammatory.", "Digestion (prebiotic)."],
        facts: ["Related to broccoli/kale (Brassica).", "Sauerkraut prevents scurvy."]
    },
    // Carrots
    "974bbda0-d7db-46a4-900d-a2bd7c1e4261": {
        description: "Root vegetable, usually orange.",
        history: "Originated in Persia (purple/yellow). Orange bred in Netherlands (17th C).",
        producers: "China.",
        benefits: ["Beta-carotene (eyes).", "Fiber.", "Heart health."],
        facts: ["Originally purple.", "World's most popular root vegetable."]
    },
    // Cashews
    "4bcd0992-c1ed-42de-b452-bf4ccd3be3f9": {
        description: "Seed of the cashew apple.",
        history: "Native to Brazil. Spread by Portuguese to India.",
        producers: "Vietnam, India, Ivory Coast.",
        benefits: ["Iron/Zinc.", "Heart healthy fats.", "Eye health (lutein)."],
        facts: ["Urushiol (poison ivy toxin) in shell.", "Not a true nut."]
    },
    // Cauliflower
    "7aa47385-55ac-4df7-b71b-c7a01d162a1d": {
        description: "Brassica oleracea, clustered white flower head.",
        history: "Originated in Mediterranean/Asia Minor.",
        producers: "China, India.",
        benefits: ["Choline.", "Sulforaphane.", "Low carb substitute."],
        facts: ["Comes in purple/orange too.", "Flower buds are called 'curds'."]
    },
    // Chia Seeds
    "2405eee2-0625-4b7e-928b-6c2b9dde36a3": {
        description: "Edible seeds of Salvia hispanica.",
        history: "Aztec/Mayan staple. 'Chia' means strength.",
        producers: "Paraguay, Bolivia, Argentina.",
        benefits: ["Omega-3s.", "Fiber bomb.", "Protein."],
        facts: ["Absorb 10x weight in water.", "Used as currency by Aztecs."]
    },
    // Chicken Liver
    "f6635c23-a4af-4cd5-8c94-a26b0f6a5e78": {
        description: "Organ meat from chicken.",
        history: "Ancient dietary staple.",
        producers: "Global.",
        benefits: ["Vitamin A bomb.", "Iron/B12.", "Protein."],
        facts: ["Nature's multivitamin.", "Don't eat too much (Vit A toxicity)."]
    },
    // Chili Powder
    "38dfd70c-bc04-4ad5-8d35-44aa2af55454": {
        description: "Blend of dried chilies and spices.",
        history: "Invented in Texas (19th C) for chili con carne.",
        producers: "USA, India.",
        benefits: ["Capsaicin (metabolism).", "Pain relief.", "Immunity."],
        facts: ["Usually contains cumin/garlic.", "Capsaicin tricks brain into feeling heat."]
    },
    // Cinnamon
    "08b6a425-4064-46ee-a588-a6c50802d2a4": {
        description: "Inner bark of Cinnamomum tree.",
        history: "Imported to Egypt 2000 BC. Worth more than gold.",
        producers: "Indonesia, China (Cassia); Sri Lanka (Ceylon).",
        benefits: ["Blood sugar control.", "Anti-inflammatory.", "Antimicrobial."],
        facts: ["Two main types: Cassia and Ceylon.", "Used in embalming."]
    },
    // Cloves
    "7a9ea9d6-6cf0-4cc4-883d-7fcb83d1ac76": {
        description: "Flower buds of Syzygium aromaticum.",
        history: "Native to Maluku Islands (Indonesia).",
        producers: "Indonesia, Madagascar.",
        benefits: ["Oral health (toothache).", "Antioxidant.", "Liver health."],
        facts: ["Highest antioxidant spice.", "Used in kretek cigarettes."]
    },
    // Coriander Seed
    "696e2069-55fe-4f5b-a4f2-ebadfacbf272": {
        description: "Dried fruit of cilantro plant.",
        history: "Oldest spice (7000 BC).",
        producers: "India, Russia.",
        benefits: ["Digestion.", "Blood sugar.", "Heart health."],
        facts: ["Different flavor from leaves.", "Thickens curries."]
    },
    // Cumin
    "8fe1bcd4-7868-4f9b-9518-3b8b0fbf8656": {
        description: "Flowering plant seed in parsley family.",
        history: "Syrian origin, used in Bible.",
        producers: "India (70%).",
        benefits: ["Digestion.", "Iron.", "Weight management."],
        facts: ["2nd most popular spice.", "Symbol of love in Middle Ages."]
    },
    // Curry Powder
    "773a08f2-f06b-40e3-a113-3a31c208764d": {
        description: "British invention imitating Indian spice blends.",
        history: "Created for British returning from India (18th C).",
        producers: "Global.",
        benefits: ["Anti-inflammatory (Turmeric).", "Digestion.", "Antioxidant."],
        facts: ["Not used in authentic Indian cooking.", "Contains turmeric, cumin, coriander."]
    },
    // Dahl (Lentils)
    "88d2624c-2a52-4253-9a73-3be16b9f9553": {
        description: "Red/Pink Split Lentils.",
        history: "Domesticated in Fertile Crescent.",
        producers: "Canada, India.",
        benefits: ["Quick cooking.", "Protein/Fiber.", "Folate."],
        facts: ["Become soft/mushy when cooked.", "Staple of Indian diet."]
    },
    // Dhania (Coriander / Cilantro)
    "af191b14-81e1-4911-b3c4-5313bc71deac": {
        description: "Fresh leaves of coriander plant.",
        history: "Used in Ancient Greece/Rome.",
        producers: "Global.",
        benefits: ["Heavy metal detox.", "Antioxidant.", "Vitamin K."],
        facts: ["Genes determine if it tastes soapy.", "Also called Chinese parsley."]
    },
    // Egg
    "bbbde49a-7e9e-460f-ad26-cd95c7135083": {
        description: "Laid by female fowl, usually chicken.",
        history: "Domesticated in SE Asia 7500 BC.",
        producers: "China, USA, India.",
        benefits: ["Choline (brain).", "Complete protein.", "Eye health."],
        facts: ["Shell color depends on breed.", "Yolk color depends on hen diet."]
    },
    // Cardamom
    "d359b24f-c50b-48da-a61f-3778a4bd50b8": {
        description: "Pod spice of ginger family.",
        history: "Native to India/Indonesia.",
        producers: "Guatemala, India.",
        benefits: ["Breath freshener.", "Digestion.", "Lower BP."],
        facts: ["Queen of Spices.", "3rd most expensive spice."]
    },
    // Flax Seeds
    "cc5a7bf5-f998-4240-8f83-dbf962bbc370": {
        description: "Seeds of flax plant (linseed).",
        history: "Cultivated in Babylon 3000 BC.",
        producers: "Russia, Canada.",
        benefits: ["ALA Omega-3.", "Lignans (cancer fighter).", "Fiber."],
        facts: ["Humans can't digest whole seeds well.", "Used to make linen."]
    },
    // Ginger Ground
    "24bcc0f2-d5c6-4822-9d4b-0065e622b5d1": {
        description: "Dried powdered ginger root.",
        history: "Maritime SE Asia origin.",
        producers: "India, Nigeria, China.",
        benefits: ["Nausea relief.", "Anti-inflammatory.", "Pain relief."],
        facts: ["Related to turmeric/cardamom.", "Cleanses palate."]
    },
    // Grapes
    "1ecc17ea-7e0e-410c-bf9a-e74be71c5251": {
        description: "Berry of deciduous woody vines.",
        history: "Cultivated 8000 years ago (Near East).",
        producers: "China, Italy, USA.",
        benefits: ["Resveratrol (skins).", "Heart health.", "Hydration."],
        facts: ["71% of global production is for wine.", "Botanically berries."]
    },
    // Green Pepper
    "9644af5f-4e84-498f-a853-bbb0e7cbe877": {
        description: "Unripe bell pepper.",
        history: "Native to Mexico/Central America.",
        producers: "China.",
        benefits: ["Vitamin C.", "Eye health.", "Low calorie."],
        facts: ["Less sweet/more bitter than red.", "Same plant as red pepper."]
    },
    // Hazelnuts
    "bf88d2f3-e95a-43ca-8a8c-e5dfa09c80e5": {
        description: "Nut of the hazel fruit.",
        history: "Ancient China/Rome.",
        producers: "Turkey (65%).",
        benefits: ["Heart health.", "Vitamin E.", "Manganese."],
        facts: ["Flavoring for Nutella.", "Harvested mid-autumn."]
    },
    // Honey
    "d8ddffa0-a471-4d70-a5f6-1429b9f7f0e8": {
        description: "Sweet food made by bees exploring flowers.",
        history: "Cave paintings 8000 years ago depict honey gathering.",
        producers: "China, Turkey.",
        benefits: ["Antioxidants.", "Cough suppressant.", "Wound healing."],
        facts: ["Never spoils.", "1lb honey = 2 million flowers."]
    },
    // Kale
    "2d0a2b1c-fe92-4f31-9ef4-9d5461f1c3b3": {
        description: "Leaf cabbage, green or purple.",
        history: "Grown for 2000 years in Mediterranean.",
        producers: "USA, Europe.",
        benefits: ["Vitamin K King.", "Antioxidants.", "Cancer fighting."],
        facts: ["'Dig for Victory' WW2 crop.", "Frozen by frost = sweeter."]
    },
    // Lemon
    "198cecbf-a7e6-401a-bb07-703f25829a89": {
        description: "Yellow citrus fruit.",
        history: "Origin unknown, widely used in Asia.",
        producers: "India, Mexico, China.",
        benefits: ["Vitamin C.", "Kidney stones (citrate).", "Digestion."],
        facts: ["Trees produce fruit year-round.", "Scurvy fighter."]
    },
    // Lentil Sprouts
    "3f840840-7bff-4e0d-935a-1d185e716192": {
        description: "Germinated lentils.",
        history: "Ancient practice to increase nutrition.",
        producers: "Home grown.",
        benefits: ["Increased enzyme activity.", "Digestibility.", "Protein."],
        facts: ["Sprouting reduces phytates.", "Crunchy texture."]
    },
    // Beef Liver
    "7393e46a-3b99-4232-ac09-525aa64d8262": {
        description: "Liver of a cow.",
        history: "Prized by hunters/ancestors.",
        producers: "Global.",
        benefits: ["Iron/B12 superfood.", "Vitamin A.", "Protein."],
        facts: ["Most nutrient dense food on earth.", "Soaking in milk reduces bitter taste."]
    },
    // Macadamia
    "be056368-7c6e-457c-bbfe-c4ceeb5f10e4": {
        description: "Nut from Macadamia tree.",
        history: "Indigenous to Australia.",
        producers: "Australia, South Africa, Hawaii.",
        benefits: ["Healthy fats (monounsaturated).", "Heart health.", "Low carb."],
        facts: ["Hardest nut shell.", "Named after John Macadam."]
    },
    // Cornmeal
    "9991b994-0de6-4557-8806-e2ac0eae4360": {
        description: "Meal (coarse flour) ground from dried corn.",
        history: "Staple food in Americas for millennia.",
        producers: "USA, China.",
        benefits: ["Gluten-free.", "Energy.", "Fiber if whole."],
        facts: ["Polenta in Italy.", "Pap in South Africa."]
    },
    // Mint
    "a21c3ba9-3352-4c66-aa79-70f45080ec1e": {
        description: "Aromatic herb (Mentha).",
        history: "Named after Greek nymph Minthe.",
        producers: "USA, Morocco.",
        benefits: ["IBS relief.", "Indigestion.", "Brain function."],
        facts: ["Symbol of hospitality.", "Invasive in gardens."]
    },
    // Moringa
    "513ea54b-e0c1-482e-833e-952d2bb39566": {
        description: "Powder from leaves of Moringa oleifera.",
        history: "Native to India (Himalayas). 'Miracle Tree'.",
        producers: "India.",
        benefits: ["Complete protein.", "Anti-inflammatory.", "Nutrient powerhouse."],
        facts: ["Drought resistant.", "Used to purify water."]
    },
    // Mustard
    "c3f9cbbd-db8f-48b3-943a-bfc172021cea": {
        description: "Condiment from mustard seeds.",
        history: "Romans mixed grape must with seeds.",
        producers: "Canada (seeds).",
        benefits: ["Metabolism boost.", "Selenium.", "Low calorie."],
        facts: ["Yellow comes from turmeric.", "Member of cabbage family."]
    },
    // Mandarin / Naartjie
    "46efac71-54c9-44eb-abde-d9e25e7f0ebb": {
        description: "Small citrus tree fruit.",
        history: "Native to China/Japan.",
        producers: "China.",
        benefits: ["Vitamin C.", "Antioxidants.", "Eye health."],
        facts: ["Loose skin = easy peeling.", "Symbol of good fortune in China."]
    },
    // Nutmeg
    "f4f08e89-8cac-4916-8122-dc637ef7b40d": {
        description: "Seed of Myristica fragrans.",
        history: "Spice Islands (Indonesia). Caused wars.",
        producers: "Indonesia, Grenada.",
        benefits: ["Brain health.", "Pain relief.", "Sleep aid."],
        facts: ["Mace is covering of same seed.", "Hallucinogenic in massive doses."]
    },
    // Onion
    "e785383f-c432-4afd-baf8-ed3dbc5ef6e1": {
        description: "Bulb onion.",
        history: "Cultivated 5000+ years.",
        producers: "China, India.",
        benefits: ["Quercetin.", "Cancer fighting.", "Bone density."],
        facts: ["Sulfuric compounds cause tears.", "Layers metaphor."]
    },
    // Orange
    "a9b10712-4295-45b9-85e9-5513a02a7be9": {
        description: "Citrus fruit.",
        history: "Southern China origin.",
        producers: "Brazil, USA.",
        benefits: ["Vitamin C.", "Potassium.", "Heart health."],
        facts: ["Color named after fruit.", "Brazil makes 30% of world's oranges."]
    },
    // Papaya
    "591898f0-aea9-4a83-beb6-c37021a10705": {
        description: "Tropical fruit.",
        history: "southern Mexico/Central America.",
        producers: "India, Brazil.",
        benefits: ["Papain (enzyme).", "Digestion.", "Vitamin C."],
        facts: ["Seeds are edible/peppery.", "Can tenderize meat."]
    },
    // Paprika
    "034eb664-ecb3-4a47-8c5a-535103122f37": {
        description: "Ground spice from red air-dried fruits (peppers).",
        history: "Peppers to Spain 16th C. Paprika is Hungarian word.",
        producers: "Hungary, Spain, China.",
        benefits: ["Vitamin A.", "Antioxidants.", "Eye health."],
        facts: ["National spice of Hungary.", "Ranged from sweet to hot."]
    },
    // Parsley
    "23cb0c79-7466-42ef-9f74-b36c184857e2": {
        description: "Flowering plant, herb.",
        history: "Mediterranean. Symbol of death in Greece.",
        producers: "Europe, Middle East.",
        benefits: ["Vitamin K.", "Fresh breath.", "Diuretic."],
        facts: ["Two types: curly and flat.", "Legend says it visits hell before germinating."]
    },
    "34e18f8b-712e-4214-a391-28b7a956a886": {
        description: "Fresh parsley leaves.",
        history: "Mediterranean.",
        producers: "Global.",
        benefits: ["bone health.", "Vitamin C.", "Kidney health."],
        facts: ["More than a garnish.", "Rich in flavonoids."]
    },
    // Peach
    "3b3aa628-da31-4eb0-9b5c-ea74e5cc29be": {
        description: "Deciduous tree fruit.",
        history: "China (1000 BC).",
        producers: "China, Spain, Italy.",
        benefits: ["Digestion.", "Skin health.", "Vitamin A/C."],
        facts: ["Member of rose family.", "China produces 50%+."]
    },
    // Peanut Butter
    "3eb50184-e3c5-4d5a-b09f-caa29ba068ed": {
        description: "Paste made from dry-roasted peanuts.",
        history: "Aztecs did it first. Kellogg patented process 1895.",
        producers: "USA, China.",
        benefits: ["Protein.", "Healthy fats.", "Energy."],
        facts: ["Peanuts are legumes.", "Takes 540 peanuts for 12oz jar."]
    }
};
