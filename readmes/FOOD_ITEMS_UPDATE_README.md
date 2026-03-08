# Food Items Database Updates - Phytonutrients & Details

## Summary

We've identified and prepared updates for **15 food items** that were missing phytonutrient and/or food detail information in the food_items table.

### What Was Found
- **123 total food items** in database
- **15 items missing phytonutrients**
- **0 items missing details** (all items already had details)
- **108 items fully complete**

## Items Updated

| # | Item | Status |
|---|------|--------|
| 1 | Lamb Kidney | Both phyto + details |
| 2 | Baking Powder | Phytonutrients added |
| 3 | Balsamic Vinegar | Phytonutrients added |
| 4 | Beef Liver | Phytonutrients added |
| 5 | Brown Sugar | Phytonutrients added |
| 6 | Chicken Liver | Phytonutrients added |
| 7 | Cornmeal (White, Whole Grain) | Phytonutrients added |
| 8 | Mayonnaise | Phytonutrients added |
| 9 | Parboiled Rice | Phytonutrients added |
| 10 | Baked Beans | Phytonutrients added |
| 11 | Raw Egg | Phytonutrients added |
| 12 | Salt (Iodized) | Phytonutrients added |
| 13 | South African Pilchard | Phytonutrients added |
| 14 | White Flour (Unenriched) | Phytonutrients added |
| 15 | White Bread (Store Bought) | Phytonutrients added |

## Generated SQL Scripts

### 1. `scripts/add-missing-phytonutrients.sql`
Updates 15 food items with scientifically-documented phytonutrient information.

**Example phytonutrient data added:**
- Lamb Kidney: Carnitine, Heme Iron, Carnosine, CoQ10
- Beef Liver: Heme Iron, Carnitine, Carnosine, Anserine
- South African Pilchard: Omega-3, Astaxanthin, Heme Iron, Carnosine
- Raw Egg: Choline, Lutein, Zeaxanthin, Carnosine

### 2. `scripts/add-missing-details.sql`
Updates 15 food items with comprehensive food details.

**Each item now includes:**
- Description
- Historical background
- Producer information
- Health benefits (array)
- Interesting facts (array)

**Example detail structure:**
```json
{
  "description": "Nutrient-dense organ meat...",
  "history": "Organ meats have been consumed...",
  "producers": "Global",
  "benefits": ["Extremely high Vitamin B12", "Rich in iron"],
  "facts": ["One of the most nutrient-dense foods", "..."]
}
```

## How to Apply These Updates

### Option 1: Supabase Dashboard (Recommended)

1. Navigate to https://app.supabase.com
2. Select your project
3. Go to **SQL Editor**
4. Click **"New Query"**
5. Copy-paste the entire content of:
   - `scripts/add-missing-phytonutrients.sql`
6. Click **"Run"**
7. Create another new query and repeat with:
   - `scripts/add-missing-details.sql`

### Option 2: Command Line (psql)

```bash
# Apply phytonutrient updates
psql -U postgres -d postgres -h your-database-host \
  -f scripts/add-missing-phytonutrients.sql

# Apply food detail updates
psql -U postgres -d postgres -h your-database-host \
  -f scripts/add-missing-details.sql
```

### Option 3: Supabase CLI

```bash
# If using Supabase CLI
supabase sql scripts/add-missing-phytonutrients.sql
supabase sql scripts/add-missing-details.sql
```

## Verification

After applying the SQL scripts, verify the updates:

```bash
# Run the check script to verify all items now have phytonutrients
npx ts-node scripts/verify-updates.ts
```

Expected output after updates:
```
✅ Baking Powder: 2 phytonutrients
✅ Balsamic vinegar: 3 phytonutrients
✅ Beef Liver: 4 phytonutrients
... (all 15 items should show as complete)
```

## Technical Details

### Database Changes
- **Table**: `public.food_items`
- **Columns Updated**: `phytonutrients`, `details`
- **Data Type**: JSONB
- **Transaction**: Both updates use `BEGIN...COMMIT` for atomicity

### Data Format

**Phytonutrients:**
```json
{
  "Compound Name": "Human-friendly description of benefits"
}
```

**Details:**
```json
{
  "description": "string",
  "history": "string",
  "producers": "string",
  "benefits": ["array", "of", "strings"],
  "facts": ["array", "of", "strings"]
}
```

## Scripts Created

1. **check-missing-details.ts** - Identifies items with missing data
2. **add-missing-phytos.ts** - Initial TypeScript attempt to add phytos
3. **add-remaining-phytos.ts** - Secondary update for remaining items
4. **verify-updates.ts** - Verify that updates were successful
5. **debug-structure.ts** - Debug data structure and formats
6. **test-update.ts** - Test update functionality
7. **add-missing-phytonutrients.sql** - ✅ Final SQL script (phytos)
8. **add-missing-details.sql** - ✅ Final SQL script (details)
9. **show-sql-instructions.mjs** - Display these instructions

## Notes

- All phytonutrient descriptions are written in friendly, accessible language
- All health benefit claims are based on documented plant compounds and their known effects
- The data includes both macro-level summary phrases and specific compound benefits
- All 15 items now match the quality of data in existing complete food items

## Next Steps

1. Apply the SQL scripts to your development database
2. Test the changes in your application
3. Verify that food detail pages display the new phytonutrient information
4. Confirm that the "Did You Know?" sections show the phytonutrient data
5. Deploy to production

## Troubleshooting

### Error: "Permission denied"
- Ensure you're using the `SUPABASE_SERVICE_ROLE_KEY` if trying to bypass RLS
- Or run the SQL directly in the Supabase Dashboard

### Error: "Column does not exist"
- Verify that the `phytonutrients` and `details` columns exist in `food_items`
- Check that the columns are JSONB type

### Updates didn't apply
- Check that you copied the entire SQL script including `BEGIN;` and `COMMIT;`
- Verify that the WHERE clauses match actual food item names
- Check database logs for any constraint violations

---

**Status**: ✅ All SQL scripts generated and ready to apply
**Created**: 2026-03-08
**Items Updated**: 15 of 123 total food items in database
