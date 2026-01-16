# Base Ingredient System - Implementation Guide

## Purpose
Separates **what you see in recipes** from **what you buy at the store**.

## How It Works

### Database Schema
```sql
ingredients {
  item TEXT               -- "Egg, Scrambled" (recipe display)
  base_ingredient TEXT    -- "Egg" (shopping list)
  food_item_id UUID      -- Links to "Egg, Scrambled" nutrition data
}
```

### Examples

#### Example 1: Scrambled Eggs
```typescript
{
  item: "Egg, Scrambled",
  base_ingredient: "Egg",
  food_item_id: "egg-scrambled-id",
  amount: "2 large"
}
```
- **Recipe shows**: "2 large eggs, scrambled"
- **Shopping list shows**: "Egg - 2 large"
- **Nutrition from**: "Egg, Scrambled" food data

#### Example 2: Grilled Chicken
```typescript
{
  item: "Chicken Breast, Grilled",
  base_ingredient: "Chicken Breast",
  food_item_id: "chicken-grilled-id",
  amount: "200g"
}
```
- **Recipe shows**: "200g chicken breast, grilled"
- **Shopping list shows**: "Chicken Breast - 200g"
- **Nutrition from**: "Chicken Breast, Grilled" food data

#### Example 3: Raw Kale (Smoothie)
```typescript
{
  item: "Kale, Raw",
  base_ingredient: "Kale",
  food_item_id: "kale-raw-id",
  amount: "1 cup chopped"
}
```
- **Recipe shows**: "1 cup kale, raw, chopped"
- **Shopping list shows**: "Kale - 1 cup chopped"
- **Nutrition from**: "Kale, Raw" food data

## Naming Convention

### In `food_items` table (nutrition database):
- `Egg, Raw` - for smoothies, raw dishes
- `Egg, Boiled` - for meal prep
- `Egg, Fried` - for breakfast
- `Egg, Scrambled` - with milk/butter
- `Chicken Breast, Raw`
- `Chicken Breast, Grilled`
- `Chicken Breast, Baked`

### In `ingredients.base_ingredient`:
- `Egg` (all egg preparations)
- `Chicken Breast` (all chicken preparations)
- `Kale` (all kale preparations)

## Shopping List Grouping

The shopping list generator groups by `base_ingredient`:

**If you have 3 recipes:**
1. Smoothie: 1 raw egg
2. Breakfast: 2 scrambled eggs
3. Salad: 2 boiled eggs

**Shopping list shows:**
- **Egg**: 5 total (buy 5 raw eggs)

NOT:
- ~~Egg, Raw: 1~~
- ~~Egg, Scrambled: 2~~
- ~~Egg, Boiled: 2~~

## Next Steps

After running `add-base-ingredient.sql`:
1. Update shopping list generator to use `base_ingredient`
2. When creating new recipes, always set both `item` and `base_ingredient`
3. Add new food preparations as needed (e.g., "Egg, Boiled" when you create a boiled egg recipe)

## Migration Applied
- ✅ Column added to database
- ✅ Existing "Egg, Raw" → base: "Egg"
- ✅ Existing "Kale, Raw" → base: "Kale"
- [ ] Update shopping list logic (next step)
