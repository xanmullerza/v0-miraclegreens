export interface NutrientInfo {
    description: string;
    history: string;
    importance: string;
    benefits: string[];
    deficiencySigns: string[];
    toxicitySymptoms?: string[];
    upperLimit?: string;
    sources: string[];
    relatedFacts?: string[]; // Added: Array of 5 related facts
}

export const nutrientInfo: Record<string, NutrientInfo> = {
    // Electrolytes
    'Potassium': {
        description: "An essential mineral that functions as an electrolyte.",
        history: "First isolated in 1807 by Humphry Davy from caustic potash.",
        importance: "Critical for nerve function, muscle contraction, and maintaining fluid balance.",
        benefits: ["Lowers blood pressure", "Protects against stroke", "Prevents kidney stones", "Reduces water retention"],
        deficiencySigns: ["Weakness", "Fatigue", "Muscle cramps", "Constipation"],
        toxicitySymptoms: ["Muscle weakness", "Palpitations", "Numbness", "Arrhythmia"],
        upperLimit: "None (Dietary)",
        sources: ["Bananas", "Sweet potatoes", "Spinach", "Avocados", "Coconut water"],
        relatedFacts: [
            "Every single heartbeat relies on potassium to trigger the electrical impulse.",
            "Potassium was the first metal ever isolated by electrolysis (1807).",
            "98% of the potassium in your body is found inside your cells.",
            "A medium potato has more potassium than a banana.",
            "Ancient people used potassium-rich plant ash ('pot ash') to make soap."
        ]
    },
    'Magnesium': {
        description: "A mineral involved in hundreds of chemical reactions in your body.",
        history: "First recognized as an element in 1755; named after the Greek district of Magnesia.",
        importance: "Supports muscle and nerve function, energy production, and DNA synthesis.",
        benefits: ["Improves sleep", "Boosts exercise performance", "Fights depression", "Supports heart health"],
        deficiencySigns: ["Muscle twitches and cramps", "Mental disorders", "Osteoporosis", "Fatigue"],
        toxicitySymptoms: ["Diarrhea", "Nausea", "Abdominal cramping", "Lethargy"],
        upperLimit: "350mg (Supplemental)",
        sources: ["Dark chocolate", "Avocados", "Nuts", "Legumes", "Tofu", "Seeds"],
        relatedFacts: [
            "Magnesium is the central atom in the chlorophyll molecule, making plants green.",
            "60% of your body's magnesium is stored in your bones.",
            "Your body uses magnesium to create ATP, the primary energy molecule.",
            "Refining grains removes up to 80% of their magnesium content.",
            "Epsom salts (magnesium sulfate) were discovered in Epsom, England in 1618."
        ]
    },
    'Calcium': {
        description: "The most abundant mineral in the body.",
        history: "Isolated in 1808 by Humphry Davy.",
        importance: "Vital for building and maintaining strong bones and teeth, and for heart, muscle, and nerve function.",
        benefits: ["Bone health", "Dental health", "Muscle contraction", "Cardiovascular health"],
        deficiencySigns: ["Muscle problems", "Extreme fatigue", "Nail and skin symptoms", "Osteopenia/Osteoporosis"],
        toxicitySymptoms: ["Kidney stones", "Constipation", "Hypercalcemia", "Soft tissue calcification"],
        upperLimit: "2500mg",
        sources: ["Dairy products", "Leafy greens", "Sardines", "Fortified foods", "Almonds"],
        relatedFacts: [
            "Calcium is the 5th most abundant element in the Earth's crust.",
            "99% of your body's calcium is in your bones and teeth; only 1% circulates in blood.",
            "Vitamin D is required for your body to absorb calcium efficiently.",
            "Calcium ions are the key signal that tells muscles to contract.",
            "Roman concrete used lime (calcium oxide) to last for thousands of years."
        ]
    },
    'Sodium': {
        description: "Essential electrolyte that helps maintain the balance of water in and around your cells.",
        history: "Isolated in 1807 by Humphry Davy.",
        importance: "Crucial for nerve and muscle function and controlling blood pressure/volume.",
        benefits: ["Fluid balance", "Nerve transmission", "Muscle contraction"],
        deficiencySigns: ["Nausea and vomiting", "Headache", "Confusion", "Loss of energy", "Muscle weakness"],
        toxicitySymptoms: ["High blood pressure", "Swelling", "Increased thirst", "Stiff joints"],
        upperLimit: "2300mg",
        sources: ["Table salt", "Pickles", "Cheese", "Beets", "Celery"],
        relatedFacts: [
            "Sodium is essential for generating nerve impulses in your brain.",
            "The word 'salary' comes from the Latin word for salt, as Roman soldiers were paid in it.",
            "Natural foods are low in sodium; 75% of intake comes from processed foods.",
            "Your body needs less than 500mg of sodium per day to survive.",
            "Sodium helps transport nutrients like glucose across cell membranes."
        ]
    },
    'Phosphorus': {
        description: "The second most abundant mineral in the body.",
        history: "Discovered in 1669 by Hennig Brand in Hamburg.",
        importance: "Works with calcium to build strong bones and teeth; helps filter waste in kidneys.",
        benefits: ["Bone formation", "Digestion regulation", "Protein formation", "Cell repair"],
        deficiencySigns: ["Bone pain", "Fragile bones", "Stiff joints", "Fatigue"],
        toxicitySymptoms: ["Diarrhea", "Hardening of organs", "Mineral imbalance"],
        upperLimit: "4000mg",
        sources: ["Chicken", "Turkey", "Organ meats", "Seafood", "Dairy", "Sunflower seeds"],
        relatedFacts: [
            "Phosphorus was the first element discovered by an individual person (Hennig Brand).",
            "It glows in the dark when exposed to oxygen (chemiluminescence).",
            "Every strand of your DNA is held together by a phosphorus backbone.",
            "Phosphorus is essential for filtering waste in your kidneys.",
            "The 'P' in ATP stands for Phosphate, highlighting its role in energy."
        ]
    },

    // Trace Minerals
    'Iron': {
        description: "A mineral that the body needs for growth and development.",
        history: "Known since ancient times; strictly biological role identified in the 18th century.",
        importance: "Used to make hemoglobin, a protein in red blood cells that carries oxygen from the lungs to all parts of the body.",
        benefits: ["Reduces fatigue", "Improves muscle strength", "Boosts immunity", "Improves concentration"],
        deficiencySigns: ["Extreme fatigue", "Weakness", "Pale skin", "Chest pain", "Cold hands and feet"],
        toxicitySymptoms: ["Stomach pain", "Nausea", "Vomiting", "Organ damage (with high doses)"],
        upperLimit: "45mg",
        sources: ["Red meat", "Spinach", "Shellfish", "Legumes", "Pumpkin seeds"],
        relatedFacts: [
            "Iron gives your blood its red color when oxygen binds to it.",
            "Hemoglobin contains 70% of your body's iron.",
            "Vitamin C can increase iron absorption from plants by up to 300%.",
            "Iron deficiency is the most common nutrient deficiency worldwide.",
            "Cooking in cast-iron skillets can add significant iron to your food."
        ]
    },
    'Zinc': {
        description: "Signaling molecule and structural component of many proteins and enzymes.",
        history: "Pure metallic zinc was discovered in 1746 by Andreas Marggraf.",
        importance: "Essential for immune system function, DNA synthesis, and wound healing.",
        benefits: ["Boosts immunity", "Accelerates wound healing", "Reduces inflammation", "Treats acne"],
        deficiencySigns: ["Impaired immune function", "Hair loss", "Delayed wound healing", "Loss of appetite"],
        toxicitySymptoms: ["Metal taste", "Loss of appetite", "Headaches", "Reduced copper absorption"],
        upperLimit: "40mg",
        sources: ["Meat", "Shellfish", "Legumes", "Seeds", "Nuts", "Dairy"],
        relatedFacts: [
            "Zinc is involved in over 300 enzymatic reactions in the body.",
            "It is crucial for taste and smell perception.",
            "Zinc deficiency can lead to stunted growth in children.",
            "The body has no specialized zinc storage system, so daily intake is important.",
            "Oysters are by far the richest food source of zinc."
        ]
    },
    'Selenium': {
        description: "A powerful antioxidant mineral.",
        history: "Discovered in 1817 by Jöns Jacob Berzelius.",
        importance: "Critical for thyroid function, DNA synthesis, and protection from oxidative damage.",
        benefits: ["Antioxidant protection", "Thyroid health", "Immune system support", "Asthma reduction"],
        deficiencySigns: ["Infertility in men", "Muscle weakness", "Fatigue", "Mental fog", "Hair loss"],
        toxicitySymptoms: ["Garlic breath", "Hair/nail loss", "Fatigue", "Nerve damage"],
        upperLimit: "400µg",
        sources: ["Brazil nuts", "Fish", "Ham", "Pork", "Beef", "Turkey"],
        relatedFacts: [
            "A single Brazil nut can provide more than your daily requirement of Selenium.",
            "Selenium is critical for the proper functioning of your thyroid gland.",
            "It was named after Selene, the Greek goddess of the Moon.",
            "Selenium protects cells from damage and infections.",
            "Soil levels of selenium vary wildly around the world, affecting food content."
        ]
    },
    'Copper': {
        description: "Essential trace mineral for survival.",
        history: "One of the first metals used by humans.",
        importance: "Helps make red blood cells and maintains nerve cells and the immune system.",
        benefits: ["Supports collagen production", "Energy production", "Brain health", "Immune function"],
        deficiencySigns: ["Fatigue", "Weakness", "Brittle bones", "Pale skin", "Sensitivity to cold"],
        toxicitySymptoms: ["Nausea", "Dizziness", "Stomach pain", "Liver damage"],
        upperLimit: "10000µg",
        sources: ["Liver", "Oysters", "Spirulina", "Shiitake mushrooms", "Nuts and seeds"],
        relatedFacts: [
            "Copper is essential for melanin production, which colors your skin and eyes.",
            "It works with iron to help the body form red blood cells.",
            "Copper pipes have natural antimicrobial properties that kill bacteria.",
            "The Statue of Liberty is green because its copper skin has oxidized.",
            "Your body contains only about 100mg of copper total, mostly in the liver."
        ]
    },
    'Manganese': {
        description: "Trace mineral needed for the normal functioning of your brain / nervous system.",
        history: "Isolated in 1774 by Johan Gottlieb Gahn.",
        importance: "Involved in fat and carbohydrate metabolism, calcium absorption, and blood sugar regulation.",
        benefits: ["Bone health", "Antioxidant properties", "Reduces inflammation", "Blood sugar regulation"],
        deficiencySigns: ["Poor bone growth", "Skeletal defects", "Impaired glucose tolerance", "Changes in hair color"],
        toxicitySymptoms: ["Tremors", "Muscle stiffness", "Nerve system disorders"],
        upperLimit: "11mg",
        sources: ["Whole grains", "Clams", "Oysters", "Mussels", "Nuts", "Soybeans"],
        relatedFacts: [
            "Manganese is a key component of the antioxidant enzyme SOD, which protects mitochondria.",
            "It was used by Stone Age cave painters as a black pigment.",
            "Manganese is crucial for the formation of cartilage and bone.",
            "High levels of iron in your diet can reduce manganese absorption.",
            "Tea is one of the richest naturally occurring sources of manganese."
        ]
    },

    // Vitamins
    'Vitamin A': {
        description: "Generic term for a group of fat-soluble compounds involved in immune function, vision, reproduction, and cellular communication.",
        history: "Discovered in 1913; chemical structure described in 1931.",
        importance: "Critical for vision as an essential component of rhodopsin.",
        benefits: ["Protects eyes from night blindness", "Supports a healthy immune system", "Reduces acne risk", "Supports bone health"],
        deficiencySigns: ["Night blindness", "Dry skin", "Eye inflammation", "Growth retardation in children"],
        toxicitySymptoms: ["Dizziness", "Nausea", "Headaches", "Vision blurred", "Liver damage (Excess Retinol)"],
        upperLimit: "3000µg (Retinol)",
        sources: ["Beef liver", "Sweet potato", "Carrots", "Black-eyed peas", "Spinach"],
        relatedFacts: [
            "Vitamin A comes in two forms: preformed (from animals) and provitamin (carotenoids from plants).",
            "It is essential for the production of rhodopsin, a pigment in your eyes used for low-light vision.",
            "Ancient Egyptians cured night blindness by eating liver, thousands of years before Vitamin A was discovered.",
            "Beta-carotene is what makes carrots and sweet potatoes orange.",
            "Polar bear liver contains toxic levels of Vitamin A."
        ]
    },
    'B1 (Thiamine)': {
        description: "Water-soluble vitamin that enables the body to use carbohydrates as energy.",
        history: "First B vitamin to be discovered.",
        importance: "Essential for glucose metabolism, and it plays a key role in nerve, muscle, and heart function.",
        benefits: ["Energy production", "Nerve system support", "Healthy heart function", "Improved mood"],
        deficiencySigns: ["Weight loss", "Confusion", "Memory loss", "Muscle weakness", "Heart problems"],
        toxicitySymptoms: ["No known level", "Rare digestive upset"],
        upperLimit: "None established",
        sources: ["Whole grains", "Meat", "Fish", "Nutritional yeast", "Seeds", "Nuts"],
        relatedFacts: [
            "Thiamine was the first B vitamin to be identified, hence 'B1'.",
            "It is crucial for converting carbohydrates into energy.",
            "Beriberi, a disease affecting the heart and nervous system, is caused by thiamine deficiency.",
            "Alcoholism is a major risk factor for thiamine deficiency.",
            "Cooking can destroy thiamine, especially prolonged boiling."
        ]
    },
    'B2 (Riboflavin)': {
        description: "Water-soluble vitamin involved in energy production.",
        history: "Discovered in 1920, isolated in 1933.",
        importance: "Helps break down proteins, fats, and carbohydrates.",
        benefits: ["Energy production", "Antioxidant functions", "Healthy skin and hair", "Migraine prevention"],
        deficiencySigns: ["Cracked lips", "Sore throat", "Swelling of mouth and throat", "Skin disorders"],
        toxicitySymptoms: ["No known level", "Harmless yellow urine"],
        upperLimit: "None established",
        sources: ["Eggs", "Organ meats", "Lean meats", "Milk", "Green vegetables"],
        relatedFacts: [
            "Riboflavin gives many vitamin supplements their characteristic yellow color.",
            "It is easily destroyed by light, which is why milk is often sold in opaque containers.",
            "The name 'riboflavin' comes from 'ribose' (the sugar) and 'flavin' (the yellow color).",
            "It plays a vital role in the electron transport chain, producing ATP.",
            "Deficiency is rare in developed countries due to fortification of foods."
        ]
    },
    'B3 (Niacin)': {
        description: "A B vitamin that's made and used by your body to turn food into energy.",
        history: "Discovered as a treatment for pellagra in 1937.",
        importance: "Helps keep your nervous system, digestive system and skin healthy.",
        benefits: ["Lowers LDL cholesterol", "Increases HDL cholesterol", "Boosts brain function", "Protects skin"],
        deficiencySigns: ["Thick, scaly pigmented rash on skin exposed to sunlight", "Swollen mouth", "Vomiting", "Depression"],
        toxicitySymptoms: ["Skin flushing", "Itching", "Nausea", "Liver toxicity (High Supplemental)"],
        upperLimit: "35mg",
        sources: ["Liver", "Chicken breast", "Tuna", "Turkey", "Salmon"],
        relatedFacts: [
            "Niacin can be made by the body from the amino acid tryptophan.",
            "Pellagra, a disease of the 4 Ds (dermatitis, diarrhea, dementia, death), is caused by niacin deficiency.",
            "Corn contains niacin, but it's bound up unless treated with lime (nixtamalization) like in tortillas.",
            "High doses of niacin are sometimes prescribed to help lower cholesterol.",
            "Niacin is a component of NAD and NADP, coenzymes involved in cellular metabolism."
        ]
    },
    'B5 (Pantothenic Acid)': {
        description: "Essential for making blood cells and converting food into energy.",
        history: "Discovered by Roger J. Williams in 1933.",
        importance: "Critical for the manufacture of red blood cells and sex/stress-related hormones.",
        benefits: ["Hormone production", "Reduces stress", "Healthy skin and hair", "Energy stamina"],
        deficiencySigns: ["Numbness", "Burning sensation in hands/feet", "Headache", "Extreme fatigue"],
        toxicitySymptoms: ["Diarrhea", "Water retention"],
        upperLimit: "None established",
        sources: ["Shiitake mushrooms", "Salmon", "Avocados", "Chicken", "Beef"],
        relatedFacts: [
            "Its name comes from the Greek 'pantos', meaning 'everywhere', because it's in almost all foods.",
            "It is required to synthesize Coenzyme A (CoA), which is vital for fatty acid metabolism.",
            "Deficiency is extremely rare because the vitamin is so widespread.",
            "B5 is critical for manufacturing red blood cells and sex/stress hormones.",
            "Gut bacteria produce some of your daily Vitamin B5 requirement."
        ]
    },
    'B6 (Pyridoxine)': {
        description: "Significant to protein, fat and carbohydrate metabolism and the creation of red blood cells and neurotransmitters.",
        history: "Discovered in 1934 by Paul György.",
        importance: "Crucial for normal brain development and for keeping the nervous system and immune system healthy.",
        benefits: ["Mood regulation", "Promotes brain health", "Treats anemia", "Eye health"],
        deficiencySigns: ["Skin rashes", "Cracked lips", "Mood changes", "Weakened immune function"],
        toxicitySymptoms: ["Nerve damage", "Lesions", "Numbness"],
        upperLimit: "100mg",
        sources: ["Salmon", "Chickpeas", "Poultry", "Dark leafy greens", "Bananas"],
        relatedFacts: [
            "Vitamin B6 is involved in over 100 enzyme reactions, mostly related to protein metabolism.",
            "It is essential for the production of neurotransmitters like serotonin and dopamine.",
            "Deficiency can lead to microcytic anemia, where red blood cells are smaller than normal.",
            "Some medications, like those for tuberculosis, can interfere with B6 metabolism.",
            "It helps the body make hemoglobin, which carries oxygen in red blood cells."
        ]
    },
    'B9 (Folate)': {
        description: "Naturally occurring form of vitamin B9.",
        history: "Identified in 1931 by Lucy Wills using yeast extract to treat anemia.",
        importance: "Crucial for early pregnancy to reduce the risk of birth defects of the brain and spine.",
        benefits: ["Healthy fetal development", "Reduces depression risk", "Supports heart health", "Brain function"],
        deficiencySigns: ["Weakness", "Fatigue", "Irritability", "Palpitations", "Shortness of breath"],
        toxicitySymptoms: ["Masks B12 deficiency", "Rare stomach issues"],
        upperLimit: "1000µg (Folic Acid)",
        sources: ["Dark leafy greens", "Beans", "Peanuts", "Sunflower seeds", "Fresh fruits"],
        relatedFacts: [
            "Folate gets its name from the Latin word 'folium', which means leaf.",
            "It is absolutely critical during early pregnancy to prevent neural tube defects.",
            "Your body needs folate to make DNA and other genetic material.",
            "Folic acid is the synthetic form used in supplements; folate is the natural form in food.",
            "Alcohol consumption interferes with folate absorption and increases excretion."
        ]
    },
    'B12 (Cobalamin)': {
        description: "Water-soluble vitamin involved in the metabolism of every cell of the human body.",
        history: "Structure determined by Dorothy Hodgkin in 1956.",
        importance: "Key player in the function and development of the brain and nerve cells.",
        benefits: ["Red blood cell formation", "Prevents major birth defects", "Bone health", "Macular degeneration prevention"],
        deficiencySigns: ["Weakness", "Tiredness", "Lightheadedness", "Pale skin", "Nerve problems"],
        toxicitySymptoms: ["Low risk", "None generally established"],
        upperLimit: "None established",
        sources: ["Clams", "Liver", "Trout", "Salmon", "Fortified cereals"],
        relatedFacts: [
            "Vitamin B12 is the largest and most complex vitamin molecule.",
            "It contains the mineral cobalt, which gives it its name, cobalamin.",
            "It is only found naturally in animal products; vegans must supplement or eat fortified foods.",
            "Your stomach acid is required to separate B12 from protein in food so it can be absorbed.",
            "The body stores several years' worth of Vitamin B12 in the liver."
        ]
    },
    'Vitamin C': {
        description: "Powerful antioxidant that can strengthen your body’s natural defenses.",
        history: "Discovered in 1912, isolated in 1928, and first chemically produced in 1933.",
        importance: "Necessary for the growth, development and repair of all body tissues.",
        benefits: ["Strong immunity", "Lowers blood pressure", "Prevents gout", "Improves iron absorption"],
        deficiencySigns: ["Rough, bumpy skin", "Corkscrew-shaped body hair", "Bright red hair follicles", "Slow wound healing"],
        toxicitySymptoms: ["Diarrhea", "Nausea", "Abdominal cramps", "Kidney stones (In some)"],
        upperLimit: "2000mg",
        sources: ["Citrus fruits", "Bell peppers", "Strawberries", "Tomatoes", "Cruciferous vegetables"],
        relatedFacts: [
            "Humans are one of the few mammals that cannot synthesize their own Vitamin C.",
            "Scurvy, caused by Vitamin C deficiency, was a major problem for sailors on long voyages.",
            "It is crucial for the synthesis of collagen, a key protein in skin, tendons, and blood vessels.",
            "Vitamin C can regenerate other antioxidants, like Vitamin E.",
            "High doses of Vitamin C are often used to shorten the duration of the common cold."
        ]
    },
    'Vitamin D': {
        description: "Fat-soluble vitamin that helps regulate the amount of calcium and phosphate in the body.",
        history: "Identified as a vitamin in the early 20th century.",
        importance: "Needed to keep bones, teeth and muscles healthy.",
        benefits: ["Bone health", "Enhanced immunity", "Mood regulation", "Weight management"],
        deficiencySigns: ["Getting sick often", "Fatigue", "Bone and back pain", "Depression"],
        toxicitySymptoms: ["Hypercalcemia", "Nausea", "Vomiting", "Poor bone health (In extreme excess)"],
        upperLimit: "4000IU (100µg)",
        sources: ["Sunlight exposure", "Fatty fish", "Egg yolks", "Fortified foods", "Mushrooms"],
        relatedFacts: [
            "Vitamin D is unique because your body can produce it when exposed to sunlight.",
            "It functions more like a hormone than a vitamin, regulating over 200 genes.",
            "Deficiency is widespread globally, affecting about 1 billion people.",
            "Darker skin tones require more sun exposure to produce the same amount of Vitamin D.",
            "It plays a crucial role in calcium absorption and bone mineralization."
        ]
    },
    'Vitamin E': {
        description: "Nutrient that's important to vision, reproduction, and the health of your blood, brain and skin.",
        history: "Discovered in 1922.",
        importance: "Acts as an antioxidant, helping to protect cells from the damage caused by free radicals.",
        benefits: ["Skin health", "Cellular restoration", "Reduced oxidative stress", "Eye health"],
        deficiencySigns: ["Muscle pain/weakness", "Vision problems", "Immune system changes", "Walking difficulties"],
        toxicitySymptoms: ["Increased bleeding risk", "Muscle weakness", "Fatigue", "Nausea"],
        upperLimit: "1000mg",
        sources: ["Sunflower seeds", "Almonds", "Avocados", "Spinach", "Butternut squash"],
        relatedFacts: [
            "Vitamin E is actually a group of eight fat-soluble compounds, with alpha-tocopherol being the most active.",
            "It sits in cell membranes to protect them from oxidative damage.",
            "Vitamin E was first identified as a 'fertility factor' in rats in 1922.",
            "It helps widen blood vessels and keeps blood from clotting within them.",
            "Wheat germ oil is the most concentrated natural source of Vitamin E."
        ]
    },
    'Vitamin K': {
        description: "Group of vitamins that the body needs for blood clotting and helping wounds to heal.",
        history: "Discovered in 1929 by Henrik Dam.",
        importance: "Essential for blood clotting and bone metabolism.",
        benefits: ["Blood clotting", "Bone health", "Heart health", "Brain function"],
        deficiencySigns: ["Easy bruising", "Excessive bleeding from wounds", "Blood in urine/stool", "Heavy periods"],
        toxicitySymptoms: ["Rare", "Interferes with blood thinners"],
        upperLimit: "None established",
        sources: ["Kale", "Spinach", "Collard greens", "Parsley", "Broccoli"],
        relatedFacts: [
            "The 'K' stands for 'Koagulation' (German for clotting).",
            "Vitamin K has two main forms: K1 (from plants) and K2 (from fermented foods/animals).",
            "Newborn babies are given a Vitamin K shot because they are born with very low levels.",
            "Vitamin K2 helps direct calcium into bones and away from arteries.",
            "Natto (fermented soybeans) is the richest food source of Vitamin K2."
        ]
    },

    // Other
    'Choline': {
        description: "Nutrient specific for brain health and synaptic transmission.",
        history: "Discovered by Adolph Strecker in 1862.",
        importance: "Required to make acetylcholine, an important neurotransmitter for memory, mood, muscle control.",
        benefits: ["Cell maintenance", "DNA synthesis", "Metabolism", "Nervous system function"],
        deficiencySigns: ["Muscle damage", "Liver damage", "Non-alcoholic fatty liver disease"],
        toxicitySymptoms: ["Fishy body odor", "Sweating", "Low blood pressure", "Liver toxicity"],
        upperLimit: "3500mg",
        sources: ["Whole eggs", "Organ meats", "Caviar", "Fish", "Shiitake mushrooms"],
        relatedFacts: [
            "Choline was only officially recognized as an essential nutrient by the Institute of Medicine in 1998.",
            "It is a precursor to acetylcholine, a neurotransmitter involved in memory and muscle control.",
            "Choline helps prevent fat from accumulating in your liver.",
            "Eggs are one of the richest sources; specifically, the yolk contains almost all the choline.",
            "It is essentially for structural integrity of cell membranes."
        ]
    },
    'Fiber': {
        description: "Carbohydrate that the body cannot digest.",
        history: "Concept developed by Hipsley in 1953.",
        importance: "Helps regulate the body's use of sugars, helping to keep hunger and blood sugar in check.",
        benefits: ["Digestive health", "Cholesterol control", "Blood sugar regulation", "Weight management"],
        deficiencySigns: ["Constipation", "Weight gain", "Blood sugar fluctuations", "Nausea/Tiredness"],
        toxicitySymptoms: ["Bloating", "Gas", "Mineral malabsorption", "Dehydration"],
        upperLimit: "70g+",
        sources: ["Whole grains", "Fruits", "Vegetables", "Beans", "Legumes"],
        relatedFacts: [
            "There are two main types: soluble (dissolves in water) and insoluble (doesn't dissolve).",
            "Soluble fiber helps lower cholesterol and blood sugar levels.",
            "Insoluble fiber adds bulk to stool and helps food pass more quickly through the stomach and intestines.",
            "Most Americans consume far less fiber than recommended.",
            "Fiber is found only in plant-based foods."
        ]
    },

    // Macros
    'Energy': {
        description: "The fuel your body needs to function, measured in calories or kilojoules.",
        history: "The concept of calorie as a unit of heat was first introduced by Nicolas Clément in 1824.",
        importance: "Provides the energy necessary for all biological processes, from breathing to strenuous exercise.",
        benefits: ["Powers all body functions", "Maintains body temperature", "Enables physical movement", "Supports brain activity"],
        deficiencySigns: ["Weight loss", "Fatigue", "Brain fog", "Weakness"],
        toxicitySymptoms: ["Weight gain", "Metabolic syndrome", "Inflammation"],
        upperLimit: "Varies by TDEE",
        sources: ["All foods containing macronutrients", "Fats", "Carbohydrates", "Proteins"]
    },
    'Protein': {
        description: "The building blocks of body tissue.",
        history: "Term coined by Jöns Jacob Berzelius in 1838 from the Greek 'protos' meaning first.",
        importance: "Essential for growth, repair, and maintenance of all cells and tissues.",
        benefits: ["Muscle building", "Tissue repair", "Enzyme production", "Hormone regulation"],
        deficiencySigns: ["Muscle wasting", "Stunted growth", "Weakened immunity", "Thinning hair"],
        toxicitySymptoms: ["Kidney strain (In predisposed)", "Dehydration", "Digestive upset"],
        upperLimit: "35% of Total Calories",
        sources: ["Meat", "Eggs", "Legumes", "Nuts", "Dairy", "Quinoa"]
    },
    'Carbs': {
        description: "The body's primary source of energy.",
        history: "Known as 'saccharides' from the Greek 'sakkharon' meaning sugar.",
        importance: "Quickly converted to glucose to fuel your brain and muscles.",
        benefits: ["Rapid energy source", "Spares protein for muscle repair", "Fuels the central nervous system", "Supports gut health (via fiber)"],
        deficiencySigns: ["Low energy", "Hypoglycemia", "Headaches", "Difficulty concentrating"],
        toxicitySymptoms: ["Blood sugar spikes", "Insulin resistance", "Triglyceride increase"],
        upperLimit: "Varies by activity",
        sources: ["Whole grains", "Fruits", "Vegetables", "Legumes", "Potatoes"]
    },
    'Fat': {
        description: "A concentrated source of energy and essential fatty acids.",
        history: "Humanity has been using fats for fuel and nutrition since prehistoric times.",
        importance: "Crucial for absorption of fat-soluble vitamins (A, D, E, K), hormone production, and cell membrane integrity.",
        benefits: ["Organ protection", "Vitamin absorption", "Long-term energy storage", "Skin and hair health"],
        deficiencySigns: ["Dry skin", "Vitamin deficiencies", "Hormonal imbalances", "Feeling cold"],
        toxicitySymptoms: ["Digestive distress", "Heart disease risk (Saturated/Trans excess)", "Inflammation"],
        upperLimit: "Varies by diet type",
        sources: ["Avocados", "Nuts", "Seeds", "Olive oil", "Fatty fish"]
    },
    'welcome': {
        description: "welcome",
        history: "welcome",
        importance: "welcome",
        benefits: ["welcome"],
        deficiencySigns: ["welcome"],
        sources: ["welcome"],
        relatedFacts: ["welcome", "welcome", "welcome", "welcome", "welcome"]
    }
};
