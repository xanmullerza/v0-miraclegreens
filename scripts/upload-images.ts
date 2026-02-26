
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Map of Recipe ID to Filename in public/images/recipes/
const IMAGE_MAPPING: Record<string, string> = {
    'b1': 'green-smoothie.png',
    'b2': 'keto-eggs.png',
    // 'b3': 'oatmeal.png', // Skipped
    'l1': 'quinoa-salad.png',
    'l2': 'chicken-veg.png',
    'd1': 'lentil-curry.png',
    'd2': 'salmon.png',
    // 's1': 'energy-balls.png',
    // 's2': 'yogurt.png',
    // 's3': 'eggs.png'
};

async function uploadImages() {
    console.log('Starting image upload...');
    const imagesDir = path.resolve(__dirname, '../public/images/recipes');

    for (const [recipeId, filename] of Object.entries(IMAGE_MAPPING)) {
        const filePath = path.join(imagesDir, filename);
        if (!fs.existsSync(filePath)) {
            console.warn(`File not found: ${filename} (skipping)`);
            continue;
        }

        console.log(`Uploading ${filename} for Recipe ${recipeId}...`);

        const fileBuffer = fs.readFileSync(filePath);

        // 1. Upload to Storage
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('recipes')
            .upload(filename, fileBuffer, {
                contentType: 'image/png',
                upsert: true
            });

        if (uploadError) {
            console.error(`Error uploading ${filename}:`, uploadError);
            continue;
        }

        // 2. Get Public URL
        const { data: { publicUrl } } = supabase
            .storage
            .from('recipes')
            .getPublicUrl(filename);

        console.log(`Uploaded! Public URL: ${publicUrl}`);

        // 3. Update Recipe Record
        const { error: dbError } = await supabase
            .from('recipes')
            .update({ image: publicUrl })
            .eq('id', recipeId);

        if (dbError) {
            console.error(`Error updating recipe ${recipeId} in DB:`, dbError);
        } else {
            console.log(`Database updated for Recipe ${recipeId}`);
        }
    }

    console.log('Upload process complete!');
}

uploadImages().catch(console.error);
