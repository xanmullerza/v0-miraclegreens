
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Reusing existing images as requested
const IMAGES = [
    'https://qvbfdqxrvrbjorwiaksn.supabase.co/storage/v1/object/public/recipes/green-smoothie.png',
    'https://qvbfdqxrvrbjorwiaksn.supabase.co/storage/v1/object/public/recipes/keto-eggs.png',
    'https://qvbfdqxrvrbjorwiaksn.supabase.co/storage/v1/object/public/recipes/quinoa-salad.png',
    'https://qvbfdqxrvrbjorwiaksn.supabase.co/storage/v1/object/public/recipes/chicken-veg.png',
    'https://qvbfdqxrvrbjorwiaksn.supabase.co/storage/v1/object/public/recipes/lentil-curry.png',
    'https://qvbfdqxrvrbjorwiaksn.supabase.co/storage/v1/object/public/recipes/salmon.png'
];

const NEW_RECIPES = [
    // MEXICAN
    {
        id: 'mex1',
        title: 'Moringa Tacos',
        type: 'lunch',
        calories: 450,
        protein: 20,
        carbs: 40,
        fat: 22,
        diet: ['anything', 'vegetarian'],
        image: IMAGES[2],
        prepTime: 20,
        ingredients: [
            { item: 'Corn Tortillas', amount: '3' },
            { item: 'Black Beans', amount: '1 cup' },
            { item: 'Moringa Salsa', amount: '2 tbsp', isMiracleProduct: true },
            { item: 'Avocado', amount: '1/2' }
        ],
        instructions: ['Warm tortillas.', 'Fill with beans and avocado.', 'Top with salsa.']
    },
    {
        id: 'mex2',
        title: 'Spicy Chicken Enchiladas',
        type: 'dinner',
        calories: 600,
        protein: 45,
        carbs: 35,
        fat: 28,
        diet: ['anything'],
        image: IMAGES[4],
        prepTime: 40,
        ingredients: [
            { item: 'Chicken Breast', amount: '200g' },
            { item: 'Enchilada Sauce', amount: '1/2 cup' },
            { item: 'Cheese', amount: '1/4 cup' }
        ],
        instructions: ['Roll chicken in tortillas.', 'Cover with sauce and cheese.', 'Bake until bubbly.']
    },
    {
        id: 'mex3',
        title: 'Moringa Guacamole Bowl',
        type: 'snack',
        calories: 250,
        protein: 5,
        carbs: 15,
        fat: 20,
        diet: ['vegan', 'vegetarian', 'anything'],
        image: IMAGES[0],
        prepTime: 10,
        ingredients: [
            { item: 'Avocado', amount: '1' },
            { item: 'Moringa Powder', amount: '1 tsp', isMiracleProduct: true },
            { item: 'Tortilla Chips', amount: '1 handful' }
        ],
        instructions: ['Mash avocado with moringa.', 'Serve with chips.']
    },

    // JAPANESE
    {
        id: 'jap1',
        title: 'Miso Moringa Soup',
        type: 'breakfast',
        calories: 150,
        protein: 8,
        carbs: 10,
        fat: 5,
        diet: ['vegan', 'vegetarian', 'anything'],
        image: IMAGES[1], // Soup-ish image
        prepTime: 10,
        ingredients: [
            { item: 'Miso Paste', amount: '1 tbsp' },
            { item: 'Tofu', amount: '1/2 cup' },
            { item: 'Moringa Leaves', amount: '1 handful', isMiracleProduct: true }
        ],
        instructions: ['Dissolve miso in hot water.', 'Add tofu and moringa.', 'Serve warm.']
    },
    {
        id: 'jap2',
        title: 'Teriyaki Salmon Bowl',
        type: 'dinner',
        calories: 550,
        protein: 42,
        carbs: 45,
        fat: 20,
        diet: ['anything'],
        image: IMAGES[5], // Definitely use the salmon image
        prepTime: 25,
        ingredients: [
            { item: 'Salmon', amount: '150g' },
            { item: 'Rice', amount: '1 cup' },
            { item: 'Teriyaki Sauce', amount: '2 tbsp' }
        ],
        instructions: ['Glaze salmon with teriyaki.', 'Pan sear.', 'Serve over rice.']
    },
    {
        id: 'jap3',
        title: 'Matcha Moringa Latte',
        type: 'snack',
        calories: 120,
        protein: 4,
        carbs: 12,
        fat: 6,
        diet: ['vegan', 'vegetarian', 'anything'],
        image: IMAGES[0],
        prepTime: 5,
        ingredients: [
            { item: 'Matcha Powder', amount: '1 tsp' },
            { item: 'Moringa Powder', amount: '1 tsp', isMiracleProduct: true },
            { item: 'Oat Milk', amount: '1 cup' }
        ],
        instructions: ['Whisk powders with hot water.', 'Add frothed milk.']
    }
];

async function seedNewCuisines() {
    console.log('Clearing existing recipes...');
    const { error: deleteError } = await supabase.from('recipes').delete().neq('id', '0'); // Delete all
    if (deleteError) {
        console.error('Error clearing recipes:', deleteError);
        return;
    }
    console.log('Old recipes cleared.');

    console.log('Seeding new Mexican & Japanese recipes...');

    for (const r of NEW_RECIPES) {
        // 1. Insert Recipe
        const { error: recipeError } = await supabase.from('recipes').insert({
            id: r.id,
            title: r.title,
            type: r.type,
            calories: r.calories,
            protein: r.protein,
            carbs: r.carbs,
            fat: r.fat,
            diet: r.diet,
            image: r.image,
            prep_time: r.prepTime
        });

        if (recipeError) {
            console.error(`Error inserting recipe ${r.title}:`, recipeError);
            continue;
        }

        // 2. Insert Ingredients
        const ingredients = r.ingredients.map(i => ({
            recipe_id: r.id,
            item: i.item,
            amount: i.amount,
            is_miracle_product: i.isMiracleProduct || false
        }));

        const { error: ingError } = await supabase.from('ingredients').insert(ingredients);
        if (ingError) console.error(`Error inserting ingredients for ${r.title}:`, ingError);

        // 3. Insert Instructions
        const instructions = r.instructions.map((step, idx) => ({
            recipe_id: r.id,
            step_order: idx + 1,
            step_text: step
        }));

        const { error: instError } = await supabase.from('instructions').insert(instructions);
        if (instError) console.error(`Error inserting instructions for ${r.title}:`, instError);

        console.log(`Created: ${r.title}`);
    }

    console.log('Seeding complete! Go check the app.');
}

seedNewCuisines().catch(console.error);
