# Dynamic Nutrition Calculation - IMPLEMENTED ✅

## What Changed

### Before
- Recipe nutrition was **hardcoded** (estimated values)
- Changing ingredient data had no effect
- No way to verify accuracy

### After  
- Recipe nutrition is **calculated dynamically** from `food_items` database
- Changing ingredient data automatically updates all recipes using it
- Full audit trail from food database to final recipe

## How It Works

1. **Food Database** (`food_items` table)
   - Stores verified nutrition per 100g (from Cronometer)
   - Example: Egg, Raw = 155 kcal, 12.58g protein, 1.12g carbs, 10.61g fat per 100g

2. **Measurements** (`food_measures` table)
   - Stores unit conversions
   - Example: 1 large egg = 50g

3. **Recipe Ingredients** (linked via `food_item_id`)
   - Each ingredient links to a food item
   - Stores the weight used (e.g., 50g)

4. **Dynamic Calculation** (`meal-generator.ts`)
   - When generating a plan, fetches recipes WITH linked food items
   - Calculates: `nutrition = (food_item_per_100g × weight_g) / 100`
   - Sums all ingredients to get recipe totals

## Current Status

### Working
✅ Egg recipe calculates from food database (77.5 kcal, 6.29g protein, 0.56g carbs, 5.305g fat)
✅ UI displays with 1 decimal precision (6.3g, 0.6g, 5.3g)
✅ System falls back to stored values for recipes without linked ingredients

### Not Yet Done
❌ Other recipes (tacos, soup, etc.) still use estimated values
❌ Need to add their ingredients to food database
❌ Need to link their recipe ingredients to food items

## Next Steps

To make ALL recipes accurate:

1. **Add food items** - Add each ingredient to `food_items` with Cronometer data
2. **Link ingredients** - Update recipe ingredients to reference `food_item_id` and set `weight_g`
3. **Verify** - Generate plans and confirm accurate nutrition

## Testing

**To verify it's working:**
1. Generate a Vegetarian meal plan
2. Check the egg breakfast shows: 77.5 kcal, 6.3g protein, 0.6g carbs, 5.3g fat
3. Go to Supabase and change "Egg, Raw" protein from 12.58 to 15.00
4. Regenerate the plan - protein should update to 7.5g automatically

This proves the system is truly dynamic!
