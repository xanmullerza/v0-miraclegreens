import { Recipe } from '../../lib/data/recipes';

export const RECIPES: Recipe[] = [
    // BREAKFAST
    {
        id: 'b1',
        title: 'Miracle Green Power Smoothie',
        type: 'breakfast',
        calories: 320,
        protein: 24,
        carbs: 45,
        fat: 6,
        diet: ['vegan', 'vegetarian', 'anything'],
        image: '/images/recipes/green-smoothie.jpg',
        prepTime: 5,
        ingredients: [
            { item: 'Miracle Greens Moringa Powder', amount: '1 tsp', isMiracleProduct: true },
            { item: 'Spinach', amount: '1 cup' },
            { item: 'Banana', amount: '1 medium' },
            { item: 'Plant Protein Powder', amount: '1 scoop' },
            { item: 'Almond Milk', amount: '1 cup' }
        ],
        instructions: ['Blend all ingredients until smooth.', 'Top with hemp seeds if desired.']
    },
    {
        id: 'b2',
        title: 'Avocado & Egg Bowl',
        type: 'breakfast',
        calories: 450,
        protein: 22,
        carbs: 8,
        fat: 35,
        diet: ['vegetarian', 'anything'],
        image: '/images/recipes/keto-eggs.jpg',
        prepTime: 10,
        ingredients: [
            { item: 'Eggs', amount: '2 large' },
            { item: 'Avocado', amount: '1/2 medium' },
            { item: 'Spinach', amount: '1 cup' },
            { item: 'Olive Oil', amount: '1 tbsp' }
        ],
        instructions: ['Fry eggs in olive oil.', 'Serve over fresh spinach.', 'Top with sliced avocado.']
    },
    {
        id: 'b3',
        title: 'Oatmeal with Moringa Honey',
        type: 'breakfast',
        calories: 380,
        protein: 12,
        carbs: 65,
        fat: 8,
        diet: ['anything', 'vegan', 'vegetarian'],
        image: '/images/recipes/oatmeal.jpg',
        prepTime: 10,
        ingredients: [
            { item: 'Rolled Oats', amount: '1/2 cup' },
            { item: 'Almond Milk', amount: '1 cup' },
            { item: 'Miracle Greens Moringa Powder', amount: '1/2 tsp', isMiracleProduct: true },
            { item: 'Honey or Maple Syrup', amount: '1 tbsp' }
        ],
        instructions: ['Cook oats with milk.', 'Stir in Moringa powder once slightly cooled to preserve nutrients.', 'Drizzle with sweetener.']
    },

    // LUNCH
    {
        id: 'l1',
        title: 'Quinoa & Moringa Salad',
        type: 'lunch',
        calories: 420,
        protein: 15,
        carbs: 58,
        fat: 18,
        diet: ['vegan', 'vegetarian', 'anything'],
        image: '/images/recipes/quinoa-salad.jpg',
        prepTime: 15,
        ingredients: [
            { item: 'Cooked Quinoa', amount: '1 cup' },
            { item: 'Cucumber', amount: '1/2 chopped' },
            { item: 'Cherry Tomatoes', amount: '1/2 cup' },
            { item: 'Lemon Juice', amount: '2 tbsp' },
            { item: 'Moringa Oil', amount: '1 tbsp', isMiracleProduct: true }
        ],
        instructions: ['Toss all ingredients together.', 'Season with salt and pepper.', 'Let chill for 10 mins before serving.']
    },
    {
        id: 'l2',
        title: 'Grilled Chicken & Veggies',
        type: 'lunch',
        calories: 550,
        protein: 45,
        carbs: 10,
        fat: 25,
        diet: ['anything'],
        image: '/images/recipes/chicken-veg.jpg',
        prepTime: 25,
        ingredients: [
            { item: 'Chicken Breast', amount: '150g' },
            { item: 'Broccoli', amount: '1 cup' },
            { item: 'Olive Oil', amount: '1 tbsp' },
            { item: 'Herbs de Provence', amount: '1 tsp' }
        ],
        instructions: ['Season chicken with herbs.', 'Grill chicken and broccoli with oil.', 'Serve hot.']
    },

    // DINNER
    {
        id: 'd1',
        title: 'Moringa Lentil Curry',
        type: 'dinner',
        calories: 480,
        protein: 28,
        carbs: 70,
        fat: 12,
        diet: ['vegan', 'vegetarian', 'anything'],
        image: '/images/recipes/lentil-curry.jpg',
        prepTime: 35,
        ingredients: [
            { item: 'Red Lentils', amount: '1 cup dry' },
            { item: 'Coconut Milk', amount: '1/2 cup' },
            { item: 'Miracle Greens Moringa Powder', amount: '1 tbsp', isMiracleProduct: true },
            { item: 'Garlic & Ginger', amount: '1 tbsp each' }
        ],
        instructions: ['Sauté garlic and ginger.', 'Add lentils and water, simmer until soft.', 'Stir in coconut milk and Moringa at the end.']
    },
    {
        id: 'd2',
        title: 'Salmon with Asparagus',
        type: 'dinner',
        calories: 600,
        protein: 40,
        carbs: 8,
        fat: 42,
        diet: ['anything'],
        image: '/images/recipes/salmon.jpg',
        prepTime: 20,
        ingredients: [
            { item: 'Salmon Fillet', amount: '180g' },
            { item: 'Asparagus', amount: '1 bunch' },
            { item: 'Lemon', amount: '2 slices' },
            { item: 'Butter or Ghee', amount: '1 tbsp' }
        ],
        instructions: ['Pan sear salmon in butter.', 'Add asparagus to the pan for the last 5 minutes.', 'Serve with lemon.']
    },

    // SNACKS
    {
        id: 's1',
        title: 'Moringa Energy Balls',
        type: 'snack',
        calories: 180,
        protein: 6,
        carbs: 15,
        fat: 12,
        diet: ['vegan', 'vegetarian', 'anything'],
        image: '/images/recipes/energy-balls.jpg',
        prepTime: 10,
        ingredients: [
            { item: 'Dates', amount: '3' },
            { item: 'Cashews', amount: '1/4 cup' },
            { item: 'Miracle Greens Moringa Powder', amount: '1/2 tsp', isMiracleProduct: true }
        ],
        instructions: ['Pulse everything in a food processor.', 'Roll into balls.', 'Refrigerate.']
    },
    {
        id: 's2',
        title: 'Greek Yogurt Cup',
        type: 'snack',
        calories: 150,
        protein: 15,
        carbs: 10,
        fat: 0,
        diet: ['anything', 'vegetarian'],
        image: '/images/recipes/yogurt.jpg',
        prepTime: 2,
        ingredients: [
            { item: 'Non-fat Greek Yogurt', amount: '1 cup' },
            { item: 'Berries', amount: '1/4 cup' }
        ],
        instructions: ['Mix and enjoy.']
    },
    {
        id: 's3',
        title: 'Hard Boiled Eggs',
        type: 'snack',
        calories: 140,
        protein: 12,
        carbs: 1,
        fat: 10,
        diet: ['vegetarian', 'anything'],
        image: '/images/recipes/eggs.jpg',
        prepTime: 10,
        ingredients: [
            { item: 'Eggs', amount: '2' }
        ],
        instructions: ['Boil for 9 minutes.', 'Peel and eat.']
    }
];
