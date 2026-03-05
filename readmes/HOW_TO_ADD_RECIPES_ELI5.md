# ELI5: How to Add Ingredients & Recipes (Simple Guide)

## The Big Picture 🎯

Think of it like this:
- **Food Database** = Your nutrition encyclopedia (like Cronometer)
- **Base Ingredient** = What you buy at the store
- **Recipe Ingredient** = What you actually use in the recipe

## Rule of Thumb

**If the ingredient name has a comma and preparation method → Set base_ingredient to the part BEFORE the comma**

Examples:
- `Egg, Raw` → base: `Egg`
- `Egg, Scrambled` → base: `Egg`
- `Chicken Breast, Grilled` → base: `Chicken Breast`
- `Kale, Cooked` → base: `Kale`

**If the ingredient name is already simple → base_ingredient = item**

Examples:
- `Avocado` → base: `Avocado`
- `Rice` → base: `Rice`
- `Moringa Powder` → base: `Moringa Powder`

---

## Step-by-Step: Adding a New Recipe

### Scenario: You want to add "Grilled Chicken Salad"

**Step 1: Get Cronometer Data**
- Go to Cronometer
- Search "Chicken Breast, Grilled"
- Copy the nutrition data (per 100g)

**Step 2: Add to Food Database**
Create a seed script (like `seed-grilled-chicken.ts`):

```typescript
const GRILLED_CHICKEN_DATA = {
    name: 'Chicken Breast, Grilled',
    energy_kcal: 165,  // from Cronometer
    energy_kj: 690,
    protein_g: 31,
    carbs_g: 0,
    fat_g: 3.6,
    micronutrients: { /* ... */ }
};
```

Run it to add to database.

**Step 3: Create the Recipe**
Create recipe script (like `create-grilled-chicken-salad.ts`):

```typescript
// In the ingredients section:
{
    recipe_id: 'grilled-chicken-salad',
    item: 'Chicken Breast, Grilled',           // ← Recipe shows this
    base_ingredient: 'Chicken Breast',         // ← Shopping list uses this
    food_item_id: grilled_chicken_id,
    amount: '200g',
    weight_g: 200
}
```

**The Key Decision:**
- `item` = What's in the recipe ("Chicken Breast, Grilled")
- `base_ingredient` = What you buy ("Chicken Breast" - you buy it raw)

---

## Common Patterns

### Pattern 1: Raw Ingredients (Most Common)
**Food Item:** `Broccoli, Raw`

**In Recipe:**
```typescript
{
    item: 'Broccoli, Raw',
    base_ingredient: 'Broccoli',  // ← remove ", Raw"
    amount: '1 cup'
}
```

**Result:**
- Recipe: "1 cup broccoli, raw"
- Shopping: "Broccoli - 1 cup"

---

### Pattern 2: Cooked Ingredients
**Food Item:** `Egg, Scrambled`

**In Recipe:**
```typescript
{
    item: 'Egg, Scrambled',
    base_ingredient: 'Egg',  // ← what you buy at store
    amount: '2 large'
}
```

**Result:**
- Recipe: "2 large eggs, scrambled"
- Shopping: "Egg - 2 large"

---

### Pattern 3: Processed/Packaged Items
**Food Item:** `Moringa Powder`

**In Recipe:**
```typescript
{
    item: 'Moringa Powder',
    base_ingredient: 'Moringa Powder',  // ← same! It's already base form
    amount: '1 tsp'
}
```

**Result:**
- Recipe: "1 tsp moringa powder"
- Shopping: "Moringa Powder - 1 tsp"

---

### Pattern 4: Multiple Preparations of Same Ingredient
**You have 3 recipes:**
1. Smoothie uses `Egg, Raw`
2. Breakfast uses `Egg, Fried`
3. Salad uses `Egg, Boiled`

**Each has different nutrition in food_items table, but ALL set:**
```typescript
base_ingredient: 'Egg'
```

**Shopping list automatically combines:**
- **Egg**: 5 total (buy 5 raw eggs)

---

## Quick Reference Chart

| Food Item Name           | base_ingredient     | Why?                           |
|-------------------------|---------------------|--------------------------------|
| Egg, Raw                | Egg                 | Remove preparation method      |
| Egg, Boiled             | Egg                 | Remove preparation method      |
| Chicken Breast, Grilled | Chicken Breast      | Remove preparation method      |
| Kale, Cooked            | Kale                | Remove preparation method      |
| Rice                    | Rice                | Already base form              |
| Avocado                 | Avocado             | Already base form              |
| Moringa Powder          | Moringa Powder      | Already base form              |
| Black Beans             | Black Beans         | Already base form              |

---

## The Simple Rule ✅

**When creating a recipe, ask yourself:**

**"What would I write on my physical shopping list?"**

That's your `base_ingredient`.

Examples:
- Recipe says "Chicken Breast, Grilled" → Shopping list: "Chicken Breast" ✅
- Recipe says "Egg, Scrambled" → Shopping list: "Egg" ✅
- Recipe says "Avocado" → Shopping list: "Avocado" ✅

---

## Template for Future Recipes

```typescript
// When creating any recipe:
{
    recipe_id: 'my-new-recipe',
    item: '[INGREDIENT NAME FROM CRONOMETER]',        // What recipe shows
    base_ingredient: '[WHAT YOU BUY AT STORE]',       // What shopping list shows
    food_item_id: food_item_id,
    amount: '1 cup',
    weight_g: 100
}
```

**Example filled out:**
```typescript
{
    recipe_id: 'stir-fry',
    item: 'Chicken Breast, Stir-Fried',    // Cronometer name
    base_ingredient: 'Chicken Breast',      // Buy raw chicken
    food_item_id: chicken_stir_fried_id,
    amount: '200g',
    weight_g: 200
}
```

---

## Saved for Future Reference ✅

This guide explains everything you need to know about linking base ingredients when creating recipes!
