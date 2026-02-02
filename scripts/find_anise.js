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
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase
            .from('food_items')
            .select('id, name')
            .ilike('name', '%anise%');

        if (error) throw error;
        console.log(JSON.stringify(data, null, 2));

    } catch (err) {
        console.error("Error:", err);
    }
}

main();
