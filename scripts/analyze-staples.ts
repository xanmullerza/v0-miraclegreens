import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function analyzeStaples() {
    console.log("📊 Analyzing Food Database Coverage...\n");

    // Fetch all food names
    const { data: foods } = await supabase
        .from('food_items')
        .select('name')
        .order('name');

    if (!foods) return;

    // Categorize by common staples
    const categories = {
        'Proteins': ['chicken', 'beef', 'pork', 'fish', 'turkey', 'egg', 'tofu', 'tempeh'],
        'Grains': ['rice', 'pasta', 'bread', 'oat', 'quinoa', 'flour', 'tortilla'],
        'Dairy': ['milk', 'cheese', 'yogurt', 'butter', 'cream'],
        'Vegetables': ['tomato', 'onion', 'garlic', 'pepper', 'carrot', 'broccoli', 'spinach', 'lettuce'],
        'Fruits': ['apple', 'banana', 'orange', 'berry', 'lemon', 'lime'],
        'Legumes': ['bean', 'lentil', 'chickpea', 'pea'],
        'Oils & Fats': ['oil', 'lard', 'shortening'],
        'Spices': ['salt', 'pepper', 'cumin', 'paprika', 'oregano', 'basil', 'thyme'],
        'Nuts & Seeds': ['almond', 'peanut', 'walnut', 'cashew', 'seed'],
        'Sweeteners': ['sugar', 'honey', 'syrup', 'molasses']
    };

    for (const [category, keywords] of Object.entries(categories)) {
        const matches = foods.filter(f =>
            keywords.some(k => f.name.toLowerCase().includes(k))
        );
        console.log(`${category}: ${matches.length} items`);
        if (matches.length > 0 && matches.length <= 10) {
            matches.forEach(m => console.log(`  - ${m.name}`));
        }
    }

    console.log(`\n📦 Total Items: ${foods.length}`);
}

analyzeStaples();
