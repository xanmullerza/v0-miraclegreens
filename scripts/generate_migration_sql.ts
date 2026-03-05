
import { FOOD_DETAILS } from '../lib/data/food-details';
import * as fs from 'fs';
import * as path from 'path';

const migrationDir = path.join(process.cwd(), 'supabase', 'migrations');
if (!fs.existsSync(migrationDir)) {
    fs.mkdirSync(migrationDir, { recursive: true });
}

const filePath = path.join(migrationDir, '20260203_populate_details.sql');

let sql = `-- Add details column if it doesn't exist
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS details JSONB;

`;

for (const [id, details] of Object.entries(FOOD_DETAILS)) {
    const json = JSON.stringify(details).replace(/'/g, "''"); // Escape single quotes for SQL
    sql += `UPDATE food_items SET details = '${json}'::jsonb WHERE id = '${id}';\n`;
}

fs.writeFileSync(filePath, sql);

console.log(`Migration file created at: ${filePath}`);
