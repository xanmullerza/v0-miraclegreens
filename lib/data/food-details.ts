export interface FoodDetail {
    description: string;
    history: string;
    producers: string;
    benefits: string[];
    facts: string[];
}

export const FOOD_DETAILS: Record<string, FoodDetail> = {
    // Cucumber, Raw, With Peel
    "596ae074-33c5-418c-b054-305c0d0672de": {
        description: "The cucumber is a widely-cultivated creeping vine plant in the Cucurbitaceae gourd family that bears cucumiform fruits, which are used as vegetables.",
        history: "Originated in South Asia, particularly India, and has been cultivated for at least 3,000 years. It was introduced to Europe by the Romans.",
        producers: "China is by far the largest producer, followed by Turkey, Russia, and Iran.",
        benefits: [
            "High water content (95%) promotes hydration.",
            "Contains antioxidants like flavonoids and tannins.",
            "Low in calories, supporting weight management."
        ],
        facts: [
            "Botanically, cucumbers are classified as fruits (berries).",
            "The phrase 'cool as a cucumber' comes from the fruit's ability to stay 20° cooler than the outside air temperature."
        ]
    },
    // Garlic powder
    "a3703653-d3b4-46e6-a258-0c49d6d6d45a": {
        description: "Garlic powder is ground, dehydrated garlic. It is a common seasoning used in pasta, pizza, and grilled chicken.",
        history: "Garlic usage dates back over 5,000 years to ancient Egypt and India. Powdered forms became popular in the 20th century for convenience and shelf stability.",
        producers: "China accounts for about 80% of the world's garlic supply.",
        benefits: [
            "Contains allicin, which has immune-boosting properties.",
            "May help reduce blood pressure and cholesterol levels.",
            "Provides concentrated flavor without added sodium."
        ],
        facts: [
            "It takes about 4 lbs of fresh garlic to make 1 lb of garlic powder.",
            "Garlic was used as a performance enhancer for athletes in the original Olympic Games in Ancient Greece."
        ]
    },
    // Onion powder
    "402849cc-f982-4e59-96d3-052e02e587a2": {
        description: "Onion powder is dehydrated, ground onion that is commonly used as a seasoning. It is a common ingredient in seasoned salts and spice mixes.",
        history: "Onions have been cultivated for over 5,000 years. The dehydration process allows the flavor to be preserved for long periods, making it a staple in global cuisines.",
        producers: "Major producers include China, India, and the United States.",
        benefits: [
            "Rich in prebiotic fibers that support gut health.",
            "Contains quercetin, a powerful antioxidant.",
            "Supports bone density and heart health."
        ],
        facts: [
            "Onion powder has a more concentrated flavor than fresh onions.",
            "During the American Civil War, General Ulysses S. Grant reportedly declared, 'I will not move my army without onions!'"
        ]
    },
    // Hot cocoa mix powder
    "53e70c6a-439b-4335-afd9-4b98bd3bc321": {
        description: "A dry mixture of cocoa solids, sugar, and milk powder, commonly rehydrated with hot water or milk for a chocolate beverage.",
        history: "The Mayans drank a spicy chocolate drink 2,000 years ago. The sweet, powdered version we know today evolved in Europe after cocoa was introduced by Spanish explorers.",
        producers: "Major cocoa production occurs in Côte d'Ivoire and Ghana. Processed mixes are produced globally by companies like Nestlé and Swiss Miss.",
        benefits: [
            "Cocoa is rich in polyphenols which may improve blood flow.",
            "Provides a quick source of energy.",
            "Can improve mood by triggering the release of endorphins."
        ],
        facts: [
            "The first chocolate bar was invented in 1847, long after chocolate was consumed as a drink.",
            "White chocolate technically isn't chocolate as it contains no cocoa solids."
        ]
    },
    // Lettuce, Iceberg
    "573fa358-25b5-4191-90b8-e5c492f02f7f": {
        description: "Iceberg lettuce is a variety of crisphead lettuce with pale green leaves and a mild flavor. It is known for its crunch and high water content.",
        history: "Developed in the United States in the late 19th century. Originally called 'Crisphead', it gained the name 'Iceberg' because it was shipped in train cars covered in crushed ice.",
        producers: "California and Arizona produce the majority of iceberg lettuce in the USA.",
        benefits: [
            "Extremely low in calories.",
            "Provides decent amounts of Vitamin K and Vitamin A.",
            "High water content aids in hydration."
        ],
        facts: [
            "It became the dominant lettuce in the US due to its durability during shipping.",
            "Contrary to popular belief, it is not devoid of nutrients, though darker lettuces are generally denser."
        ]
    }
};
