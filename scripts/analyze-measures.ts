import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function listLongMeasures() {
    console.log("🔍 Broad search for long/complex labels...");
    const { data, error } = await supabase
        .from('food_measures')
        .select('label')
        .limit(2000);

    if (error) {
        console.error("❌ Error:", error);
        return;
    }

    const labels = data.map(m => m.label);
    const unique = Array.from(new Set(labels));

    // Patterns that usually result in long strings
    const complex = unique.filter(l =>
        l.length > 20 ||
        l.includes(',') ||
        l.includes('(') ||
        l.includes(' - ') ||
        /\d/.test(l) // contains numbers
    );

    complex.sort((a, b) => b.length - a.length);

    console.log("📝 COMPLEX LABEL CANDIDATES:");
    console.log(JSON.stringify(complex.slice(0, 100), null, 2));
}

listLongMeasures();
