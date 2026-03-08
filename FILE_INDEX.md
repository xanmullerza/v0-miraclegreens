# 📋 Food Items Update - Complete File Index

## 🎯 Main Update Files (Apply These to Database)

### SQL Scripts - Ready to Execute
Located in `scripts/`

| File | Purpose | Size | Status |
|------|---------|------|--------|
| `add-missing-phytonutrients.sql` | Add phytonutrients to 15 items | 6.4 KB | ✅ Ready |
| `add-missing-details.sql` | Add food details to 15 items | 8.2 KB | ✅ Ready |

**How to apply:**
- Option 1: Copy/paste into Supabase SQL Editor and click "Run"
- Option 2: Execute with `psql -f scripts/add-missing-phytonutrients.sql`
- Option 3: Use Supabase CLI: `supabase sql scripts/add-missing-phytonutrients.sql`

---

## 📚 Documentation Files

### Primary Guides
| File | Purpose | Read Time |
|------|---------|-----------|
| `PHYTONUTRIENTS_UPDATE.md` | Quick start guide with checklist | 5 min |
| `readmes/FOOD_ITEMS_UPDATE_README.md` | Detailed technical guide | 10 min |

### Quick Reference
- **PHYTONUTRIENTS_UPDATE.md**: Start here - overview, items list, quick steps
- **FOOD_ITEMS_UPDATE_README.md**: Comprehensive - formatting, troubleshooting, verification

---

## 🔧 Helper Scripts (In `scripts/`)

| Script | Purpose | Type | Status |
|--------|---------|------|--------|
| `verify-updates.ts` | Verify updates were applied | TypeScript | ✅ Ready |
| `check-missing-details.ts` | Identify missing data (already run) | TypeScript | ✅ Complete |
| `show-sql-instructions.mjs` | Display application instructions | Node.js | ✅ Done |

### How to use helper scripts:
```bash
# Verify that updates were successfully applied
npx ts-node scripts/verify-updates.ts

# Display application instructions
node scripts/show-sql-instructions.mjs

# (Already completed - no need to run)
# npx ts-node scripts/check-missing-details.ts
```

---

## 📊 Data Summary

### What's Being Updated

**15 Food Items across categories:**

#### Proteins (4)
- Beef Liver
- Chicken Liver  
- Lamb Kidney
- South African Pilchard

#### Grains & Starches (4)
- Cornmeal (White, Whole Grain)
- Parboiled Rice
- White Bread (Store Bought)
- White Flour (Unenriched)

#### Eggs & Condiments (5)
- Raw Egg
- Balsamic Vinegar
- Baking Powder
- Mayonnaise
- Salt (Iodized)

#### Other (2)
- Brown Sugar
- Baked Beans

### Data Added per Item

**Phytonutrients:**
- 2-4 key compounds per item
- Evidence-based descriptions
- Health benefit focus

**Food Details:**
- Description (1-2 sentences)
- Historical background
- Producer information
- 3-5 documented health benefits
- 2-3 interesting facts

---

## ✅ Complete Workflow Checklist

```
Phase 1: Preparation (✅ COMPLETE)
─────────────────────────────────
 ✅ Analyzed database (123 items scanned)
 ✅ Identified gaps (15 items needing data)
 ✅ Researched phytonutrient data
 ✅ Compiled food details
 ✅ Generated SQL scripts
 ✅ Created documentation

Phase 2: Application (← YOU ARE HERE)
──────────────────────────────────────
 ⏳ Review documentation
 ⏳ Apply add-missing-phytonutrients.sql
 ⏳ Apply add-missing-details.sql
 ⏳ Run verify-updates.ts

Phase 3: Validation (After applying SQL)
─────────────────────────────────────────
 ⏳ Verify all 15 items updated
 ⏳ Check food detail pages load new data
 ⏳ Test "Did You Know?" sections
 ⏳ Preview phytonutrient display

Phase 4: Deployment (After testing)
────────────────────────────────────
 ⏳ Commit changes to git
 ⏳ Create pull request
 ⏳ Merge to main/production
 ⏳ Deploy to live environment
```

---

## 🚀 Quick Start (3 Steps)

### Step 1: Review (2 min)
```bash
cat PHYTONUTRIENTS_UPDATE.md
```

### Step 2: Apply (2 min)
Option A - Supabase Dashboard:
- Open https://app.supabase.com/project/*/sql/new
- Copy content from `scripts/add-missing-phytonutrients.sql`
- Click "Run"
- Repeat for `scripts/add-missing-details.sql`

Option B - Command Line:
```bash
psql -U postgres -h your-host -d postgres \
  -f scripts/add-missing-phytonutrients.sql
psql -U postgres -h your-host -d postgres \
  -f scripts/add-missing-details.sql
```

### Step 3: Verify (1 min)
```bash
npx ts-node scripts/verify-updates.ts
```

---

## 📝 SQL Script Details

### add-missing-phytonutrients.sql
- 15 UPDATE statements (one per item)
- Transaction wrapped (BEGIN/COMMIT)
- JSONB format
- Multiple WHERE clause options for matching
- Total: ~6.4 KB

**Example:**
```sql
UPDATE public.food_items SET 
phytonutrients = '{"Heme Iron":"The most bioavailable form of iron..."}'
WHERE name = 'Beef Liver' OR common_name = 'Beef Livers';
```

### add-missing-details.sql  
- 15 UPDATE statements (one per item)
- Transaction wrapped (BEGIN/COMMIT)
- JSONB format with nested arrays
- Multiple WHERE clause options for matching
- Total: ~8.2 KB

**Example:**
```sql
UPDATE public.food_items SET 
details = '{"description":"...", "history":"...", "benefits":[...], ...}'
WHERE name = 'Beef Liver' OR common_name = 'Beef Livers';
```

---

## 🔍 File Locations

```
Project Root/
├── PHYTONUTRIENTS_UPDATE.md          ← START HERE
├── readmes/
│   └── FOOD_ITEMS_UPDATE_README.md   ← Detailed guide
├── scripts/
│   ├── add-missing-phytonutrients.sql  ← Apply this 1️⃣
│   ├── add-missing-details.sql         ← Apply this 2️⃣
│   ├── verify-updates.ts               ← Run after applying
│   ├── show-sql-instructions.mjs       ← Reference
│   ├── check-missing-details.ts        ← Already run
│   └── [other scripts]
```

---

## 📞 Support / Troubleshooting

### Common Issues

**Q: "Permission denied" error**
- A: Use Supabase Dashboard SQL Editor instead, OR
- A: Ensure using SERVICE_ROLE_KEY for psql/CLI

**Q: "Column does not exist"**  
- A: Check that food_items table has `phytonutrients` and `details` columns
- A: Both should be JSONB type

**Q: Updates didn't apply**
- A: Verify you copied the ENTIRE script including BEGIN/COMMIT
- A: Check that food item names match exactly
- A: Verify WHERE clauses in SQL

**Q: How do I rollback?**
- A: Restore from database backup (safest)
- A: Or DELETE the JSON values and re-run

### Need Help?
- Review the detailed README: `readmes/FOOD_ITEMS_UPDATE_README.md`
- Check Supabase SQL Editor error messages
- Verify database credentials in `.env.local`

---

## ✨ Success Criteria

After applying updates, verify with:

```bash
npx ts-node scripts/verify-updates.ts
```

Expected output:
```
✅ Baking Powder: 2 phytonutrients
✅ Balsamic vinegar: 3 phytonutrients
✅ Beef Liver: 4 phytonutrients
✅ Brown sugar: 2 phytonutrients
... (all 15 items showing counts)
```

---

**Status**: All scripts and documentation ready for deployment ✅
**Created**: 2026-03-08
**Items**: 15 food items (100% of incomplete items covered)
**Data Quality**: Science-backed, following existing patterns
