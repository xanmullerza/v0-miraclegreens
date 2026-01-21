import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkFinalStatus() {
    console.log("📊 Checking FINAL Import Status...");

    // 1. Total items in DB
    const { count: total, error: countError } = await supabase
        .from('food_items')
        .select('*', { count: 'exact', head: true });

    // 2. Total processed with USDA standardized values
    const { count: processed, error: procError } = await supabase
        .from('food_items')
        .select('*', { count: 'exact', head: true })
        .eq('micronutrients->_meta_source', '"usda_100g_standard"');

    console.log(`\n---------------------------------`);
    console.log(`📦 TOTAL ITEMS IN DB:      ${total}`);
    console.log(`✅ MATCHED & STANDARDIZED: ${processed}`);
    console.log(`⚠️  PENDING / UNMATCHED:   ${(total || 0) - (processed || 0)}`);
    console.log(`---------------------------------\n`);

    if (processed === total) {
        console.log("🎉 SUCCESS! 100% of items have been processed.");
    } else {
        console.log("🚧 Import INCOMPLETE. Resuming might be needed.");

        // Find first unprepared item
        const { data: pending } = await supabase
            .from('food_items')
            .select('name')
            .not('micronutrients->_meta_source', 'eq', '"usda_100g_standard"')
            .limit(3);

        if (pending && pending.length > 0) {
            console.log("Example pending items:");
            pending.forEach(p => console.log(` - ${p.name}`));
        }
    }
}

checkFinalStatus();
