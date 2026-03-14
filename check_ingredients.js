const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qvbfdqxrvrbjorwiaksn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2YmZkcXhydnJiam9yd2lha3NuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQxMjE5MywiZXhwIjoyMDgzOTg4MTkzfQ.rnr89_ONBDhK3Bgvuw9j1p-AYruocURWE_zdMNcgBC8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFoods() {
    const searchTerms = ['Olive Oil', 'Chicken Thigh', 'Onion', 'Garlic'];
    
    for (const term of searchTerms) {
        console.log(`\nSearching for: ${term}`);
        const { data: foods } = await supabase.from('food_items')
            .select('*')
            .ilike('name', `%${term}%`)
            .limit(1);
            
        if (foods?.length) {
            const food = foods[0];
            console.log(`Found: ${food.name}`);
            console.log(`Portions: ${JSON.stringify(food.portions, null, 2)}`);
        } else {
            console.log('Not found');
        }
    }
}

checkFoods();
