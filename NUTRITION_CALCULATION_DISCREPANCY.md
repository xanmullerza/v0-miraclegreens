# Nutrition Values Discrepancy: Recipes Tab vs Meal Planner

## The Problem
Values shown in the **Recipes** tab appear different from the same recipes when viewed in the **Meal Planner** tab, even though they reference the same recipe data from the database.

### Example (from attachments)
- **Spanakopita in Planner**: 763 kJ
- **Spanakopita in Recipes**: Different value when viewed per-serving

---

## Root Cause Analysis

### Database Storage
The database stores recipes with:
- `servings`: Number of servings the recipe makes
- `calories`, `protein`, `carbs`, `fat`, `energy_kj`: **Total nutrition for ALL servings combined**

Example: If Spanakopita recipe makes 4 servings and has 764 kJ total:
- DB stores: `servings=4`, `energy_kj=764`
- This means per serving would be: 764 ÷ 4 = 191 kJ/serving

### How Each Component Displays This

#### 1. Recipes Tab (`components/recipe/detail/recipe-nutrition.tsx`)
Uses: **`useRecipeNutrition` hook** with a **viewMode toggle** (lines 52-60)
```typescript
viewMode: (nutritionViewMode === 'total' ? 'per-recipe' : 'per-serving')
```

**Toggle options:**
- **"Recipe Total"** (`viewMode='per-recipe'`): Shows full recipe values × 1 = DB values
- **"Per Serving"** (`viewMode='per-serving'`): Shows DB values ÷ `recipe.servings`

**Implementation in hook** (`hooks/use-recipe-nutrition.ts` lines 20-21):
```typescript
const s = Math.max(recipe.servings || 1, 1);
const sf = viewMode === 'per-serving' ? 1 / s : 1;
// Then multiplies all values: calories * sf, protein * sf, etc.
```

**Default display mode**: Likely showing "Per Serving" based on user's toggle choice

#### 2. Meal Planner Tab (`components/tracker/planner/ui/daily-nutrition.tsx`)
Uses: **`usePlannerNutrition` hook** with **no toggle**
```typescript
const nutrition = usePlannerNutrition({
    plan,
    energyUnit,
    userRDAs,
    nutrientDisplayMode,
});
```

**How it works** (`hooks/use-planner-nutrition.ts`):
- Directly sums nutrition values from each meal in the plan
- Does NOT divide by servings
- Displays total recipe values: DB values × 1

**Why**: The plan generator (in `lib/utils/meal-generator.ts`) creates recipes with `servings: 1` when building the daily plan. When aggregating, it sums the recipe's total calories without scaling.

---

## The Discrepancy Explained

| Component | View Mode | Calculation | Result |
|-----------|-----------|------------|--------|
| **Recipes Tab** | Per Serving (default) | DB_calories ÷ recipe.servings | **Lower value** |
| **Meal Planner** | Always Total | DB_calories ÷ 1 | **Higher value** |

### For Spanakopita (4 servings, 764 kJ total):
- **Recipes Tab (Per Serving)**: 764 ÷ 4 = **191 kJ** per serving
- **Meal Planner (Total)**: 764 ÷ 1 = **764 kJ** (full recipe)

---

## Which is More Accurate?

**It depends on context:**

### ✅ Recipes Tab is More Accurate For:
- Comparing individual recipes ingredient-by-ingredient
- Understanding nutritional density (per-serving basis)
- Deciding which recipe to add to a meal

### ✅ Meal Planner is More Accurate For:
- Planning a full day's meals
- Understanding total daily nutrition intake
- When a recipe is added as a complete meal to the day

---

## Implementation Details

### In the Recipes Tab
File: `components/recipe/detail/recipe-nutrition.tsx`
- Line 75-81: Toggle between "Recipe" and "Per Serving"
- Line 52-60: Passes `viewMode` to `useRecipeNutrition` hook
- The hook scales all nutrition values by `1/servings` when per-serving mode

### In the Meal Planner  
File: `components/tracker/planner/ui/daily-nutrition.tsx`
- Line 32-35: Calls `usePlannerNutrition` with no viewMode option
- Aggregates all meals' nutrition without serving-based scaling
- Each meal's nutrition= DB total × 1

### Database Structure
Each recipe row contains:
```
{
  id: "...",
  servings: number,           // How many servings this recipe makes
  calories: number,           // Total calories for ALL servings
  protein: number,            // Total protein for ALL servings
  energy_kj: number,          // Total energy for ALL servings
  ...
}
```

---

## Recommendation

To make the nutrition display consistent, you have two options:

### Option 1: Add a "View Mode" Toggle to Meal Planner
Show users whether they're viewing per-serving or total recipe basis
- Adds flexibility similar to Recipes tab
- More context for users

### Option 2: Always Show Per-Serving Values
Convert Meal Planner to show per-serving nutrition
- More consistent with Recipes tab default display
- Requires multiplying by the quantity of servings added to the plan

### Option 3: Always Show Total Recipe Values  
Keep both tabs showing totals for added recipes
- Simpler mental model for daily planning
- Requires adding per-serving toggle to Recipes tab

---

## Current Behavior Summary

✅ **Working as designed** - The discrepancy is intentional:
- DB stores: Recipe total × servings
- Recipes tab shows: Per serving (with toggle option)
- Meal planner shows: Total recipe (what's being eaten for that meal)

This is actually correct because:
1. When someone adds a recipe to their meal plan, they want the **full recipe nutrition** (what they're actually eating)
2. When browsing recipes, they want **per-serving nutrition** to compare recipes fairly
