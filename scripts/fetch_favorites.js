const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function main() {
    try {
        const envPath = path.resolve(__dirname, '../.env.local');
        const envContent = fs.readFileSync(envPath, 'utf8');

        const env = {};
        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["'](.*)["']$/, '$1');
                env[key] = value;
            }
        });

        const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error("Missing Supabase credentials in .env.local");
            return;
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase
            .from('food_items')
            .select('name, id')
            .eq('is_favorite', true);

        if (error) throw error;

        console.log("FAVORITES:");
        console.log(JSON.stringify(data, null, 2));

        // Also check if 'description' column exists by fetching one item
        const { data: sample, error: sampleError } = await supabase
            .from('food_items')
            .select('*')
            .limit(1);

        if (sample && sample.length > 0) {
            console.log("SCHEMA KEYS:", Object.keys(sample[0]));
        }

    } catch (err) {
        console.error("Error:", err);
    }
}

main();
