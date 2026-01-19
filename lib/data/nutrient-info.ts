export interface NutrientInfo {
    description: string;
    history: string;
    importance: string;
    benefits: string[];
    deficiencySigns: string[];
    sources: string[];
}

export const nutrientInfo: Record<string, NutrientInfo> = {
    // Electrolytes
    'Potassium': {
        description: "An essential mineral that functions as an electrolyte.",
        history: "First isolated in 1807 by Humphry Davy from caustic potash.",
        importance: "Critical for nerve function, muscle contraction, and maintaining fluid balance.",
        benefits: ["Lowers blood pressure", "Protects against stroke", "Prevents kidney stones", "Reduces water retention"],
        deficiencySigns: ["Weakness", "Fatigue", "Muscle cramps", "Constipation"],
        sources: ["Bananas", "Sweet potatoes", "Spinach", "Avocados", "Coconut water"]
    },
    'Magnesium': {
        description: "A mineral involved in hundreds of chemical reactions in your body.",
        history: "First recognized as an element in 1755; named after the Greek district of Magnesia.",
        importance: "Supports muscle and nerve function, energy production, and DNA synthesis.",
        benefits: ["Improves sleep", "Boosts exercise performance", "Fights depression", "Supports heart health"],
        deficiencySigns: ["Muscle twitches and cramps", "Mental disorders", "Osteoporosis", "Fatigue"],
        sources: ["Dark chocolate", "Avocados", "Nuts", "Legumes", "Tofu", "Seeds"]
    },
    'Calcium': {
        description: "The most abundant mineral in the body.",
        history: "Isolated in 1808 by Humphry Davy.",
        importance: "Vital for building and maintaining strong bones and teeth, and for heart, muscle, and nerve function.",
        benefits: ["Bone health", "Dental health", "Muscle contraction", "Cardiovascular health"],
        deficiencySigns: ["Muscle problems", "Extreme fatigue", "Nail and skin symptoms", "Osteopenia/Osteoporosis"],
        sources: ["Dairy products", "Leafy greens", "Sardines", "Fortified foods", "Almonds"]
    },
    'Sodium': {
        description: "Essential electrolyte that helps maintain the balance of water in and around your cells.",
        history: "Isolated in 1807 by Humphry Davy.",
        importance: "Crucial for nerve and muscle function and controlling blood pressure/volume.",
        benefits: ["Fluid balance", "Nerve transmission", "Muscle contraction"],
        deficiencySigns: ["Nausea and vomiting", "Headache", "Confusion", "Loss of energy", "Muscle weakness"],
        sources: ["Table salt", "Pickles", "Cheese", "Beets", "Celery"]
    },
    'Phosphorus': {
        description: "The second most abundant mineral in the body.",
        history: "Discovered in 1669 by Hennig Brand in Hamburg.",
        importance: "Works with calcium to build strong bones and teeth; helps filter waste in kidneys.",
        benefits: ["Bone formation", "Digestion regulation", "Protein formation", "Cell repair"],
        deficiencySigns: ["Bone pain", "Fragile bones", "Stiff joints", "Fatigue"],
        sources: ["Chicken", "Turkey", "Organ meats", "Seafood", "Dairy", "Sunflower seeds"]
    },

    // Trace Minerals
    'Iron': {
        description: "A mineral that the body needs for growth and development.",
        history: "Known since ancient times; strictly biological role identified in the 18th century.",
        importance: "Used to make hemoglobin, a protein in red blood cells that carries oxygen from the lungs to all parts of the body.",
        benefits: ["Reduces fatigue", "Improves muscle strength", "Boosts immunity", "Improves concentration"],
        deficiencySigns: ["Extreme fatigue", "Weakness", "Pale skin", "Chest pain", "Cold hands and feet"],
        sources: ["Shellfish", "Spinach", "Liver", "Legumes", "Red meat", "Pumpkin seeds"]
    },
    'Zinc': {
        description: "Signaling molecule and structural component of many proteins and enzymes.",
        history: "Pure metallic zinc was discovered in 1746 by Andreas Marggraf.",
        importance: "Essential for immune system function, DNA synthesis, and wound healing.",
        benefits: ["Boosts immunity", "Accelerates wound healing", "Reduces inflammation", "Treats acne"],
        deficiencySigns: ["Impaired immune function", "Hair loss", "Delayed wound healing", "Loss of appetite"],
        sources: ["Meat", "Shellfish", "Legumes", "Seeds", "Nuts", "Dairy"]
    },
    'Selenium': {
        description: "A powerful antioxidant mineral.",
        history: "Discovered in 1817 by Jöns Jacob Berzelius.",
        importance: "Critical for thyroid function, DNA synthesis, and protection from oxidative damage.",
        benefits: ["Antioxidant protection", "Thyroid health", "Immune system support", "Asthma reduction"],
        deficiencySigns: ["Infertility in men", "Muscle weakness", "Fatigue", "Mental fog", "Hair loss"],
        sources: ["Brazil nuts", "Fish", "Ham", "Pork", "Beef", "Turkey"]
    },
    'Copper': {
        description: "Essential trace mineral for survival.",
        history: "One of the first metals used by humans.",
        importance: "Helps make red blood cells and maintains nerve cells and the immune system.",
        benefits: ["Supports collagen production", "Energy production", "Brain health", "Immune function"],
        deficiencySigns: ["Fatigue", "Weakness", "Brittle bones", "Pale skin", "Sensitivity to cold"],
        sources: ["Liver", "Oysters", "Spirulina", "Shiitake mushrooms", "Nuts and seeds"]
    },
    'Manganese': {
        description: "Trace mineral needed for the normal functioning of your brain / nervous system.",
        history: "Isolated in 1774 by Johan Gottlieb Gahn.",
        importance: "Involved in fat and carbohydrate metabolism, calcium absorption, and blood sugar regulation.",
        benefits: ["Bone health", "Antioxidant properties", "Reduces inflammation", "Blood sugar regulation"],
        deficiencySigns: ["Poor bone growth", "Skeletal defects", "Impaired glucose tolerance", "Changes in hair color"],
        sources: ["Whole grains", "Clams", "Oysters", "Mussels", "Nuts", "Soybeans"]
    },

    // Vitamins
    'Vitamin A': {
        description: "Generic term for a group of fat-soluble compounds involved in immune function, vision, reproduction, and cellular communication.",
        history: "Discovered in 1913; chemical structure described in 1931.",
        importance: "Critical for vision as an essential component of rhodopsin.",
        benefits: ["Protects eyes from night blindness", "Supports a healthy immune system", "Reduces acne risk", "Supports bone health"],
        deficiencySigns: ["Night blindness", "Dry skin", "Eye inflammation", "Growth retardation in children"],
        sources: ["Beef liver", "Sweet potato", "Carrots", "Black-eyed peas", "Spinach"]
    },
    'B1 (Thiamine)': {
        description: "Water-soluble vitamin that enables the body to use carbohydrates as energy.",
        history: "First B vitamin to be discovered.",
        importance: "Essential for glucose metabolism, and it plays a key role in nerve, muscle, and heart function.",
        benefits: ["Energy production", "Nerve system support", "Healthy heart function", "Improved mood"],
        deficiencySigns: ["Weight loss", "Confusion", "Memory loss", "Muscle weakness", "Heart problems"],
        sources: ["Whole grains", "Meat", "Fish", "Nutritional yeast", "Seeds", "Nuts"]
    },
    'B2 (Riboflavin)': {
        description: "Water-soluble vitamin involved in energy production.",
        history: "Discovered in 1920, isolated in 1933.",
        importance: "Helps break down proteins, fats, and carbohydrates.",
        benefits: ["Energy production", "Antioxidant functions", "Healthy skin and hair", "Migraine prevention"],
        deficiencySigns: ["Cracked lips", "Sore throat", "Swelling of mouth and throat", "Skin disorders"],
        sources: ["Eggs", "Organ meats", "Lean meats", "Milk", "Green vegetables"]
    },
    'B3 (Niacin)': {
        description: "A B vitamin that's made and used by your body to turn food into energy.",
        history: "Discovered as a treatment for pellagra in 1937.",
        importance: "Helps keep your nervous system, digestive system and skin healthy.",
        benefits: ["Lowers LDL cholesterol", "Increases HDL cholesterol", "Boosts brain function", "Protects skin"],
        deficiencySigns: ["Thick, scaly pigmented rash on skin exposed to sunlight", "Swollen mouth", "Vomiting", "Depression"],
        sources: ["Liver", "Chicken breast", "Tuna", "Turkey", "Salmon"]
    },
    // We can map different names if needed in the UI component
    'B5 (Pantothenic Acid)': {
        description: "Essential for making blood cells and converting food into energy.",
        history: "Discovered by Roger J. Williams in 1933.",
        importance: "Critical for the manufacture of red blood cells and sex/stress-related hormones.",
        benefits: ["Hormone production", "Reduces stress", "Healthy skin and hair", "Energy stamina"],
        deficiencySigns: ["Numbness", "Burning sensation in hands/feet", "Headache", "Extreme fatigue"],
        sources: ["Shiitake mushrooms", "Salmon", "Avocados", "Chicken", "Beef"]
    },
    'B6 (Pyridoxine)': {
        description: "Significant to protein, fat and carbohydrate metabolism and the creation of red blood cells and neurotransmitters.",
        history: "Discovered in 1934 by Paul György.",
        importance: "Crucial for normal brain development and for keeping the nervous system and immune system healthy.",
        benefits: ["Mood regulation", "Promotes brain health", "Treats anemia", "Eye health"],
        deficiencySigns: ["Skin rashes", "Cracked lips", "Mood changes", "Weakened immune function"],
        sources: ["Salmon", "Chickpeas", "Poultry", "Dark leafy greens", "Bananas"]
    },
    'B9 (Folate)': {
        description: "Naturally occurring form of vitamin B9.",
        history: "Identified in 1931 by Lucy Wills using yeast extract to treat anemia.",
        importance: "Crucial for early pregnancy to reduce the risk of birth defects of the brain and spine.",
        benefits: ["Healthy fetal development", "Reduces depression risk", "Supports heart health", "Brain function"],
        deficiencySigns: ["Weakness", "Fatigue", "Irritability", "Palpitations", "Shortness of breath"],
        sources: ["Dark leafy greens", "Beans", "Peanuts", "Sunflower seeds", "Fresh fruits"]
    },
    'B12 (Cobalamin)': {
        description: "Water-soluble vitamin involved in the metabolism of every cell of the human body.",
        history: "Structure determined by Dorothy Hodgkin in 1956.",
        importance: "Key player in the function and development of the brain and nerve cells.",
        benefits: ["Red blood cell formation", "Prevents major birth defects", "Bone health", "Macular degeneration prevention"],
        deficiencySigns: ["Weakness", "Tiredness", "Lightheadedness", "Pale skin", "Nerve problems"],
        sources: ["Clams", "Liver", "Trout", "Salmon", "Fortified cereals"]
    },
    'Vitamin C': {
        description: "Powerful antioxidant that can strengthen your body’s natural defenses.",
        history: "Discovered in 1912, isolated in 1928, and first chemically produced in 1933.",
        importance: "Necessary for the growth, development and repair of all body tissues.",
        benefits: ["Strong immunity", "Lowers blood pressure", "Prevents gout", "Improves iron absorption"],
        deficiencySigns: ["Rough, bumpy skin", "Corkscrew-shaped body hair", "Bright red hair follicles", "Slow wound healing"],
        sources: ["Citrus fruits", "Bell peppers", "Strawberries", "Tomatoes", "Cruciferous vegetables"]
    },
    'Vitamin D': {
        description: "Fat-soluble vitamin that helps regulate the amount of calcium and phosphate in the body.",
        history: "Identified as a vitamin in the early 20th century.",
        importance: "Needed to keep bones, teeth and muscles healthy.",
        benefits: ["Bone health", "Enhanced immunity", "Mood regulation", "Weight management"],
        deficiencySigns: ["Getting sick often", "Fatigue", "Bone and back pain", "Depression"],
        sources: ["Sunlight exposure", "Fatty fish", "Egg yolks", "Fortified foods", "Mushrooms"]
    },
    'Vitamin E': {
        description: "Nutrient that's important to vision, reproduction, and the health of your blood, brain and skin.",
        history: "Discovered in 1922.",
        importance: "Acts as an antioxidant, helping to protect cells from the damage caused by free radicals.",
        benefits: ["Skin health", "Cellular restoration", "Reduced oxidative stress", "Eye health"],
        deficiencySigns: ["Muscle pain/weakness", "Vision problems", "Immune system changes", "Walking difficulties"],
        sources: ["Sunflower seeds", "Almonds", "Avocados", "Spinach", "Butternut squash"]
    },
    'Vitamin K': {
        description: "Group of vitamins that the body needs for blood clotting and helping wounds to heal.",
        history: "Discovered in 1929 by Henrik Dam.",
        importance: "Essential for blood clotting and bone metabolism.",
        benefits: ["Blood clotting", "Bone health", "Heart health", "Brain function"],
        deficiencySigns: ["Easy bruising", "Excessive bleeding from wounds", "Blood in urine/stool", "Heavy periods"],
        sources: ["Kale", "Spinach", "Collard greens", "Parsley", "Broccoli"]
    },

    // Other
    'Choline': {
        description: "Nutrient specific for brain health and synaptic transmission.",
        history: "Discovered by Adolph Strecker in 1862.",
        importance: "Required to make acetylcholine, an important neurotransmitter for memory, mood, muscle control.",
        benefits: ["Cell maintenance", "DNA synthesis", "Metabolism", "Nervous system function"],
        deficiencySigns: ["Muscle damage", "Liver damage", "Non-alcoholic fatty liver disease"],
        sources: ["Whole eggs", "Organ meats", "Caviar", "Fish", "Shiitake mushrooms"]
    },
    'Fiber': {
        description: "Carbohydrate that the body cannot digest.",
        history: "Concept developed by Hipsley in 1953.",
        importance: "Helps regulate the body's use of sugars, helping to keep hunger and blood sugar in check.",
        benefits: ["Digestive health", "Cholesterol control", "Blood sugar regulation", "Weight management"],
        deficiencySigns: ["Constipation", "Weight gain", "Blood sugar fluctuations", "Nausea/Tiredness"],
        sources: ["Whole grains", "Fruits", "Vegetables", "Beans", "Legumes"]
    },

    // Macros
    'Energy': {
        description: "The fuel your body needs to function, measured in calories or kilojoules.",
        history: "The concept of calorie as a unit of heat was first introduced by Nicolas Clément in 1824.",
        importance: "Provides the energy necessary for all biological processes, from breathing to strenuous exercise.",
        benefits: ["Powers all body functions", "Maintains body temperature", "Enables physical movement", "Supports brain activity"],
        deficiencySigns: ["Weight loss", "Fatigue", "Brain fog", "Weakness"],
        sources: ["All foods containing macronutrients", "Fats", "Carbohydrates", "Proteins"]
    },
    'Protein': {
        description: "The building blocks of body tissue.",
        history: "Term coined by Jöns Jacob Berzelius in 1838 from the Greek 'protos' meaning first.",
        importance: "Essential for growth, repair, and maintenance of all cells and tissues.",
        benefits: ["Muscle building", "Tissue repair", "Enzyme production", "Hormone regulation"],
        deficiencySigns: ["Muscle wasting", "Stunted growth", "Weakened immunity", "Thinning hair"],
        sources: ["Meat", "Eggs", "Legumes", "Nuts", "Dairy", "Quinoa"]
    },
    'Carbs': {
        description: "The body's primary source of energy.",
        history: "Known as 'saccharides' from the Greek 'sakkharon' meaning sugar.",
        importance: "Quickly converted to glucose to fuel your brain and muscles.",
        benefits: ["Rapid energy source", "Spares protein for muscle repair", "Fuels the central nervous system", "Supports gut health (via fiber)"],
        deficiencySigns: ["Low energy", "Hypoglycemia", "Headaches", "Difficulty concentrating"],
        sources: ["Whole grains", "Fruits", "Vegetables", "Legumes", "Potatoes"]
    },
    'Fat': {
        description: "A concentrated source of energy and essential fatty acids.",
        history: "Humanity has been using fats for fuel and nutrition since prehistoric times.",
        importance: "Crucial for absorption of fat-soluble vitamins (A, D, E, K), hormone production, and cell membrane integrity.",
        benefits: ["Organ protection", "Vitamin absorption", "Long-term energy storage", "Skin and hair health"],
        deficiencySigns: ["Dry skin", "Vitamin deficiencies", "Hormonal imbalances", "Feeling cold"],
        sources: ["Avocados", "Nuts", "Seeds", "Olive oil", "Fatty fish"]
    }
};
