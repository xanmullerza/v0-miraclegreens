# Recipe Creation System - Integration Guide

## Overview
The recipe system now integrates with the standardized food items database (1,603 items, all per 100g USDA values). This ensures accurate, consistent nutrition calculations across all recipes.

## How It Works

### Database Structure
```
recipes
  ├─ id, title, type, calories, protein, fat, carbs, diet[], prep_time, servings
  │
  └─> ingredients
       ├─ recipe_id (FK)
       ├─ food_item_id (FK to food_items)
       ├─ item (display name)
       ├─ amount (display text, e.g., "200g")
       ├─ weight_g (actual weight for calculation)
       ├─ quantity (numeric amount)
       └─ measure_label (unit, e.g., "g", "cup")
       │
       └─> food_items
            ├─ id
            ├─ name
            ├─ energy_kcal (per 100g)
            ├─ protein_g (per 100g)
            ├─ fat_g (per 100g)
            ├─ carbs_g (per 100g)
            └─ micronutrients (JSONB)
```

### Nutrition Calculation Formula
```typescript
// For each ingredient:
const multiplier = ingredient.weight_g / 100;
const calories = food_item.energy_kcal * multiplier;
const protein = food_item.protein_g * multiplier;
// etc...

// For total recipe:
const totalCalories = sum(all ingredient calories);
```

## Usage

### Creating a Recipe

1. **Navigate to Recipe Creation**
   ```
   /plan/create
   ```

2. **Add Ingredients**
   - Click "Add Ingredient"
   - Search for food items (e.g., "chicken breast")
   - Select from 1,603 standardized items
   - Specify weight in grams
   - Nutrition is calculated automatically

3. **Add Instructions**
   - Add step-by-step cooking instructions
   - Reorder as needed

4. **Save**
   - Recipe is saved with calculated nutrition
   - All ingredients are linked to food_items table

### Fetching Recipe with Nutrition

```typescript
import { fetchRecipeWithNutrition } from '@/lib/utils/nutrition-calculator';

const recipe = await fetchRecipeWithNutrition('recipe-123');

console.log(recipe.calculated_nutrition);
// {
//   calories: 450,
//   protein: 35.2,
//   fat: 12.5,
//   carbs: 42.1
// }
```

### Manual Calculation

```typescript
import { calculateNutrition } from '@/lib/utils/nutrition-calculator';

const foodItem = {
  id: '...',
  name: 'Chicken breast, raw',
  energy_kcal: 165,  // per 100g
  protein_g: 31,     // per 100g
  fat_g: 3.6,        // per 100g
  carbs_g: 0         // per 100g
};

const nutrition = calculateNutrition(foodItem, 200); // 200g
// Returns: { calories: 330, protein: 62, fat: 7.2, carbs: 0 }
```

## Components

### FoodItemPicker
Search and select food items from the database.
```tsx
import FoodItemPicker from '@/components/recipe/food-item-picker';

<FoodItemPicker
  onSelect={(foodItem) => console.log(foodItem)}
  onClose={() => setShowPicker(false)}
/>
```

### IngredientBuilder
Manage recipe ingredients with automatic nutrition calculation.
```tsx
import IngredientBuilder from '@/components/recipe/ingredient-builder';

<IngredientBuilder
  ingredients={ingredients}
  onChange={setIngredients}
/>
```

## Data Integrity

✅ **All food items are standardized to 100g**
- Consistent calculations across all recipes
- USDA-verified nutrition data
- 1,603 items covering all major food categories

✅ **Automatic calculation**
- No manual entry of nutrition values
- Real-time updates when changing quantities
- Accurate totals for entire recipe

✅ **Foreign key relationships**
- Ingredients link to food_items
- Deleting a food item is prevented if used in recipes
- Data integrity maintained

## Migration Notes

### Existing Recipes
Old recipes may have:
- `ingredients.item` = text only (e.g., "2 cups chicken")
- `ingredients.amount` = text only
- No `food_item_id` link

To migrate:
1. Parse the text ingredient
2. Search food_items for a match
3. Update the ingredient record with `food_item_id` and `weight_g`
4. Recalculate recipe nutrition

### Adding New Food Items
If a food item is missing:
1. Search USDA FoodData Central API
2. Import using the bulk-import script
3. Ensure 100g standardization
4. Item becomes available immediately

## Best Practices

1. **Always use grams** for precise calculations
2. **Verify food item matches** - ensure you're selecting the right variant (raw vs cooked, etc.)
3. **Update recipe totals** - when editing ingredients, recalculate the recipe's stored nutrition
4. **Consider servings** - nutrition is for the entire recipe; divide by servings for per-serving values

## Troubleshooting

**Q: Nutrition seems incorrect**
A: Verify the food item is the correct variant (raw vs cooked, with/without skin, etc.)

**Q: Can't find a food item**
A: Search with different terms (e.g., "chicken breast" vs "chicken, breast, raw")

**Q: Want to add a custom food item**
A: Use the USDA import script or manually add to food_items table with per-100g values

## Future Enhancements

- [ ] Support for volume measures (cups, tbsp) with automatic weight conversion
- [ ] Recipe scaling (adjust servings, recalculate nutrition)
- [ ] Meal planning with daily nutrition targets
- [ ] Micronutrient tracking (vitamins, minerals)
- [ ] Recipe import from URLs
- [ ] Barcode scanning for packaged foods
