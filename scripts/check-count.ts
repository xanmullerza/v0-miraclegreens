import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkCount() {
    const { count, error } = await supabase
        .from('food_items')
        .select('*', { count: 'exact', head: true });

    console.log(`Current DB Count: ${count}`);
}

checkCount();
