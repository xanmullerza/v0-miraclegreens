# Cronometer Food Parser Setup

This guide explains how to set up the Cronometer food parser integration using N8N and the new admin testing page.

---

## Overview

The Cronometer parser flow:
1. **Admin page** (`/admin/cronometer-importer`) → User enters food ID
2. **API route** (`/api/cronometer/parse`) → Calls N8N webhook
3. **N8N workflow** → Fetches Cronometer HTML & parses nutrition data
4. **Response** → Returns JSON data to admin page for review
5. **Database** → Saves to `cronometer_imports` staging table

---

## Setup Steps

### Step 1: Environment Variables

Add to your `.env.local`:

```env
# N8N Webhook URL for Cronometer food parser
N8N_CRONOMETER_WEBHOOK_URL=https://your-n8n-instance.com/webhook/cronometer-food
```

### Step 2: Database Migration

The `cronometer_imports` table has been created with the migration:
```
supabase/migrations/20260313_cronometer_imports_table.sql
```

Run migrations in Supabase to apply the table.

### Step 3: N8N Workflow Setup

In your existing N8N workflow (`Privvy/workflow.json`), add the Cronometer food parser:

#### 3a. Add to Content Type Router

Find your existing "Content Type Router" node that currently routes `recipe-url`, `audio`, `image`, etc.

**Add a new rule:**
```
If: contentType equals "cronometer-food"
Then: Output to "cronometer-food" (create new output)
```

#### 3b. Create Cronometer Parser Chain

Build a new sub-chain in the workflow with these nodes:

**Node 1: HTTP Request (Fetch HTML)**
- **Method:** GET
- **URL:** `{{$json.body.url}}`
- **Headers:** Add User-Agent to avoid blocks
  ```
  User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
  ```

**Node 2: HTML Parse** (use n8n's built-in HTML parsing)
- Extract from the fetched HTML:
  - **Food name:** CSS selector for heading (e.g., `h1` or first `.food-name` element)
  - **Serving sizes table:** Parse the table with measure labels and gram values
  - **Nutrition Facts:** Extract from the nutrition table (Calories, Macros)
  - **Micronutrients:** Extract all vitamin & mineral rows from the extended nutrition section

**Node 3: Function / Code** (JavaScript)

Use this template to transform extracted data into the standard format:

```javascript
// Input: From HTML parser (name, macros, micros, servings)
// Output: ParsedNutrition object

const result = {
  name: $json.foodName,
  common_name: undefined, // Will be auto-generated in API
  energy_kcal: parseFloat($json.calories),
  energy_kj: parseFloat($json.kilojoules),
  protein_g: parseFloat($json.protein),
  carbs_g: parseFloat($json.carbohydrates),
  fat_g: parseFloat($json.fat),
  servings: $json.servings, // Array of { label, weight_g }
  micronutrients: {
    // Map extracted micronutrient values
    "Potassium": parseFloat($json.potassium) || undefined,
    "Magnesium": parseFloat($json.magnesium) || undefined,
    "Calcium": parseFloat($json.calcium) || undefined,
    "Iron": parseFloat($json.iron) || undefined,
    "Zinc": parseFloat($json.zinc) || undefined,
    "Vitamin A": parseFloat($json.vitaminA) || undefined,
    "Vitamin C": parseFloat($json.vitaminC) || undefined,
    "Vitamin D": parseFloat($json.vitaminD) || undefined,
    "Vitamin E": parseFloat($json.vitaminE) || undefined,
    "Vitamin K": parseFloat($json.vitaminK) || undefined,
    "B1 (Thiamine)": parseFloat($json.b1) || undefined,
    "B2 (Riboflavin)": parseFloat($json.b2) || undefined,
    "B3 (Niacin)": parseFloat($json.b3) || undefined,
    "B5 (Pantothenic Acid)": parseFloat($json.b5) || undefined,
    "B6 (Pyridoxine)": parseFloat($json.b6) || undefined,
    "B9 (Folate)": parseFloat($json.b9) || undefined,
    "B12 (Cobalamin)": parseFloat($json.b12) || undefined,
    // Add more as needed based on what the page shows
  }
};

return result;
```

**Node 4: Respond to Webhook** (Output)
- Return the result from above as JSON

---

## Using the Admin Page

1. Navigate to: **`/admin/cronometer-importer`**
2. Enter a Cronometer food ID (e.g., `1`, `2604`, or full params like `1&amount=100&measure=0`)
3. Click **"Parse"**
4. Results display in collapsible sections:
   - **Food Basics:** Name and auto-generated common name
   - **Macronutrients:** Energy, protein, carbs, fat per 100g
   - **Serving Sizes:** Table of measures and gram weights
   - **Micronutrients:** All extracted vitamins and minerals
   - **Raw JSON:** Full parsed data for debugging

---

## Database Schema

**Table:** `cronometer_imports`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid | Primary key |
| `cronometer_food_id` | text | Cronometer food ID (unique) |
| `source_url` | text | Full Cronometer URL |
| `parsed_data` | jsonb | Complete ParsedNutrition object |
| `status` | text | `pending` \| `reviewed` \| `imported` \| `rejected` |
| `rejection_reason` | text | Optional reason if rejected |
| `parsed_at` | timestamp | When parsed |
| `reviewed_at` | timestamp | When reviewed (if applicable) |
| `imported_at` | timestamp | When imported to food_items |
| `created_at` | timestamp | Creation timestamp |
| `updated_at` | timestamp | Last update |

---

## Testing Workflow

1. **Single Test:** Use admin page to parse food ID `1` (Sour dressing)
   - Verify macros are correct
   - Verify serving sizes extract properly
   - Verify micronutrients table is populated
   
2. **Validate Against Cronometer:** Compare parsed values to live Cronometer page to ensure accuracy

3. **Debug Failures:** Check N8N execution logs to see where HTML parsing failed

4. **Fix Selectors:** If parsing is wrong, adjust CSS selectors in N8N nodes and re-test

---

## API Endpoint

### POST `/api/cronometer/parse`

**Request:**
```json
{
  "foodId": "1"
}
```

Or with full URL:
```json
{
  "url": "https://cronometer.com/food.html?food=1&amount=100&measure=0"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "name": "Sour dressing, non-butterfat, cultured, filled cream-type",
    "common_name": "Sour dressing",
    "energy_kcal": 178,
    "energy_kj": 745,
    "protein_g": 3.3,
    "carbs_g": 4.68,
    "fat_g": 16.9,
    "servings": [
      { "label": "cup", "weight_g": 235 },
      { "label": "tbsp", "weight_g": 12 }
    ],
    "micronutrients": {
      "Potassium": 100,
      "Calcium": 142,
      "Vitamin A": 3,
      ...
    }
  },
  "importId": "uuid-of-staging-record",
  "message": "Food parsed successfully and saved to staging table"
}
```

**Response (Error):**
```json
{
  "error": "Failed to parse food from N8N workflow",
  "details": "..."
}
```

---

## Troubleshooting

**Q: Parser returns empty values or "-"**
- The N8N HTML selectors might be incorrect for the current Cronometer page structure
- Check the actual HTML in your browser (right-click → Inspect)
- Update CSS selectors in N8N nodes

**Q: "N8N webhook URL not configured"**
- Add `N8N_CRONOMETER_WEBHOOK_URL` to `.env.local`
- Ensure format is correct (e.g., `https://n8n.example.com/webhook/cronometer-food`)

**Q: Data saves to staging table but with wrong values**
- N8N parser is running but extracting wrong fields
- Check raw JSON output in admin page
- Debug N8N workflow manually by running the node chain independently

**Q: Common name not auto-generating**
- Function in API route should always auto-generate if not provided
- Check browser console for errors

---

## Next Steps (After Testing Parser)

Once the parser accuracy is verified on 10-15 test items:

1. **Batch Import Script** (`scripts/cronometer-batch-import.ts`)
   - Loop through food IDs 1-7604
   - Call parser for each
   - Save all to `cronometer_imports`

2. **Batch Approval Endpoint** (`POST /api/cronometer/approve`)
   - Merge staging records into `food_items`
   - Handle duplicates by name
   - Move status to `imported`

3. **Monitor Progress** 
   - Track parse success/failure rate
   - Identify problematic food items for manual review

---

## Files Created

- `supabase/migrations/20260313_cronometer_imports_table.sql` — Database table
- `app/api/cronometer/parse/route.ts` — Parse API endpoint
- `app/admin/cronometer-importer/page.tsx` — Testing UI

---

That's it! The parser is ready for testing. Start with food ID 1 and verify the HTML parsing in N8N works correctly before batch importing.
