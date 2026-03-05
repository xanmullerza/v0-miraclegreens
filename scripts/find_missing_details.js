const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function main() {
    try {
        // 1. Get Environment Variables
        const envPath = path.resolve(__dirname, '../.env.local');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const env = {};
        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) env[match[1].trim()] = match[2].trim().replace(/^["'](.*)["']$/, '$1');
        });

        const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

        // 2. Fetch All Favorites
        const { data: favorites, error } = await supabase
            .from('food_items')
            .select('id, name')
            .eq('is_favorite', true);

        if (error) throw error;

        // 3. Read Local File to see what's populated
        const detailsPath = path.resolve(__dirname, '../lib/data/food-details.ts');
        const detailsContent = fs.readFileSync(detailsPath, 'utf8');

        // Extract IDs using Regex (keys in the object)
        // Matches keys roughly: "uuid": {
        const populatedIds = new Set();
        const regex = /"([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})":/g;
        let match;
        while ((match = regex.exec(detailsContent)) !== null) {
            populatedIds.add(match[1]);
        }

        // 4. Compare
        const missing = favorites.filter(f => !populatedIds.has(f.id));

        console.log(`Total Favorites: ${favorites.length}`);
        console.log(`Populated: ${populatedIds.size}`);
        console.log(`Missing: ${missing.length}`);

        if (missing.length > 0) {
            console.log("\n--- ITEMS NEEDING POPULATION ---");
            missing.forEach(m => console.log(`- ${m.name} (ID: ${m.id})`));
        } else {
            console.log("All favorites are populated!");
        }

    } catch (err) {
        console.error(err);
    }
}

main();
