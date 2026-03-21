# MyRecipes Display Bug - Comprehensive Debug Report

## Issue Summary
User manually creates a recipe via `/dashboard/library/meals/new`, saves successfully to database (confirmed), adds `recipeRefreshVersion` trigger, but recipe **still doesn't appear in "My Recipes" view**.

---

## 1. EXACT FETCH QUERY ANALYSIS

### Primary Query (use-data-persistence.ts, lines 62-110)

**Location**: `lib/hooks/use-data-persistence.ts` → `fetchRecipes()` function

**The Query**:
```typescript
let query = includeDetails 
    ? supabase.from('recipes').select('*, ingredients(*, food_item:food_items(*))', { count: 'exact' })
    : supabase.from('recipes').select('*', { count: 'exact' });

// CRITICAL FILTER
if (user) {
    query = query.or(`is_curated.eq.true,user_id.eq.${user.id}`);
} else {
    query = query.eq('is_curated', true);
}

// All these additional filters apply:
if (searchQuery.trim()) {
    query = query.ilike('title', `%${searchQuery}%`);
}
if (selectedTypes.length > 0) {
    query = query.in('type', selectedTypes);
}
if (showFavoritesOnly) {
    query = query.eq('is_favorite', true);
}
if (isMix !== undefined) {
    query = query.eq('is_mix', isMix);
}
```

**What This Means**:
- ✅ When user is logged in, returns BOTH curated recipes AND user's own recipes
- ✅ Additional filters are applied (search, meal types, etc.)
- ⚠️ `isMix` filter is critical - if mismatch, recipe won't appear

---

## 2. CLIENT-SIDE FILTERING IN MyRecipesView

### Ownership Filter (my-recipes-view.tsx, lines 153-160)

```typescript
let filteredItems = allRecipes.filter(r => {
    if (user) {
        return r.user_id === user.id && !r.is_curated;
    } else {
        return r.id.toString().startsWith('local-') || !r.user_id;
    }
});
```

**Purpose**: Filter to show **only** user's personal recipes (not curated ones)

**Both conditions must be true**:
1. `r.user_id === user.id` - Recipe belongs to logged-in user
2. `!r.is_curated` - Recipe is NOT marked as curated

**The Problem Could Be**: Either condition failing

---

### Additional Client-Side Filters (lines 162-280)

After ownership filter, **6 more filter layers** are applied:

1. **Dietary Preference Filter** (lines 162-168)
   - If `filters.selectedDietType !== 'anything'`
   - Recipe's `diet` array must include selected diet
   - **Issue**: If new recipe has `diet: []`, it won't pass this filter

2. **Health Conditions Filter** (lines 170-175)
   - Checks `r.diet` against health conditions
   
3. **Exclusions Filter** (lines 177-220)
   - Complex: identifies ingredients to exclude
   - **Issue**: If recipe contains excluded ingredients, filtered out

4. **Equipment Filter** (lines 222-237)
   - If `filters.selectedEquipment.length > 0`
   - All recipe instructions/ingredients must use selected equipment
   - **Issue**: Filters out recipes not using selected equipment

5. **Pantry Mode Filter** (lines 239-270)
   - If `filters.pantryMode === 'pantry-only'`
   - **Issue**: Recipe must have all ingredients in user's pantry
   - **MAJOR RED FLAG**: If new recipe ingredients aren't in pantry, recipe hidden

6. **Flavours/Supplements Filter** (lines 272-281)
   - If `filters.showFlavours = false`, filters out recipes with flavours
   - If `filters.showSupplements = false`, filters out recipes with supplements

---

## 3. WHERE THE DEFAULT FILTER IS HIDING RECIPES

### The Most Likely Culprit: Pantry Mode Filter

In `my-recipes-view.tsx` line 239-270:

```typescript
if (filters.pantryMode === 'pantry-only') {
    const pantryIds = new Set(currentPantry.map(pi => pi.food_item_id || pi.id));
    const pantryNames = new Set(currentPantry.map(pi => pi.name?.toLowerCase().trim()).filter(Boolean));

    filteredItems = filteredItems.filter(r => {
        const recipeIngredients = (r as any).ingredients || [];
        
        if (recipeIngredients.length === 0) return true;  // OK if no ingredients

        const missingIngredients = recipeIngredients.filter((ing: any) => {
            const category = ing.food_item?.category?.toLowerCase() || '';
            if (!filters.showFlavours && category === 'flavour') return false;
            if (!filters.showSupplements && category === 'supplements') return false;

            const inPantry = pantryIds.has(ing.food_item_id) || 
                           pantryNames.has(ing.item?.toLowerCase().trim());

            return !inPantry;  // Return true if NOT in pantry
        });

        return missingIngredients.length === 0;  // Hide if has missing ingredients
    });
}
```

**What Happens**:
- If `filters.pantryMode === 'pantry-only'` (user set to "show only pantry recipes")
- New recipe's ingredients must ALL be in their pantry
- **If they're not, recipe is hidden**

---

## 4. STEP-BY-STEP TRACE OF WHAT SHOULD HAPPEN

### Flow When User Saves Recipe Manually

```
User navigates to: /dashboard/library/meals/new
    ↓
Fills in recipe details (title, ingredients, instructions)
    ↓
Clicks "Save"
    ↓
[meals/new/page.tsx, handleSave() at line 253]
    - Calls: await saveRecipe(recipeData, ingredients, instructions)
    ↓
[use-data-persistence.ts, saveRecipe() at line 298]
    RecipeData = {
        id: generated UUID,
        user_id: user.id,        ← ✓ SET TO LOGGED-IN USER
        is_curated: false,       ← ✓ SET TO FALSE
        title: user input,
        type: user input,
        is_mix: false (default),
        ...other fields
    }
    ↓
    Supabase UPSERT recipes table
    Supabase INSERT ingredients table
    Supabase INSERT instructions table
    ↓
    setRecipeRefreshVersion(prev => prev + 1)  ← TRIGGER REFETCH
    ↓
    return { ...recipeData, ingredients, instructions }
    ↓
toast.success("saved!")
    ↓
router.push('/dashboard/library/recipes')  ← Redirect to recipes view
    ↓

[If user now navigates to /dashboard/library/my-recipes]
    ↓
[my-recipes-view.tsx, useEffect at line 75]
    - Dependency: recipeRefreshVersion changed!
    - Calls: fetchMyRecipes(0, true)
    ↓
[my-recipes-view.tsx, fetchMyRecipes() at line 120]
    - Calls: fetchRecipesBridge({ ... isMix: isMix, ... })
    - isMix = false (component default)
    ↓
[use-data-persistence.ts, fetchRecipes() at line 62]
    - Query: is_curated.eq.true OR user_id.eq.${user.id}
    - Filter: is_mix.eq.false (because isMix=false passed)
    - Returns: [curated recipes + user's recipes with is_mix=false]
    ↓
[Back in my-recipes-view.tsx]
    - Ownership filter: r.user_id === user.id && !r.is_curated
    - ✓ Should PASS because user_id matches and is_curated=false
    ↓
    [Additional filters applied]
    - Possible FAILURES here if filters don't match recipe
    ↓
[Display recipes or "No Recipes Yet"]
```

---

## 5. ROOT CAUSE ANALYSIS

### Scenario A: Recipe Saved But Ownership Filter Fails
**Why This Could Happen**:
- Save function isn't setting `user_id` correctly
- Save function isn't setting `is_curated = false`
- **Check**: Query database `SELECT id, user_id, is_curated FROM recipes WHERE title = 'user recipe title'`

### Scenario B: Ownership Pass, But Client Filters Hide It

**Most Likely**: One of the 6 client-side filters is hiding the recipe.

**To Identify Which Filter**:
1. Check if `filters.pantryMode === 'pantry-only'` - this is the most aggressive filter
2. Check if `filters.selectedDietType !== 'anything'` but recipe has `diet: []`
3. Check if `filters.selectedExclusions` is active and recipe contains those ingredients
4. Check if `filters.showSupplements = false` and recipe contains supplement ingredients
5. Check if `filters.showFlavours = false` and recipe contains flavour ingredients

### Scenario C: isMix Mismatch
- Recipe saved with `is_mix = false`
- MyRecipesView passes `isMix = false`
- **Should match**, but verify in database query

### Scenario D: Ingredients Not Fetching
- Line 119: `includeDetails` logic determines if ingredients are fetched
- If `includeDetails = false`, ingredients won't be in object
- **Impact**: Pantry filter can't work properly (returns false for all recipes)

---

## 6. DEPENDENCY ARRAY VERIFICATION

[my-recipes-view.tsx, line 75]:

```typescript
useEffect(() => {
    if (!authLoading) {
        fetchMyRecipes(0, true);
    }
}, [
    searchQuery,
    selectedTypes,
    showFavoritesOnly,
    sortField,
    sortDirection,
    authLoading,
    user,
    filters.pantryMode,
    filters.selectedDietType,
    filters.selectedExclusions,
    filters.showFlavours,
    filters.showSupplements,
    recipeRefreshVersion  ← ✓ PRESENT
]);
```

✅ `recipeRefreshVersion` **IS in the dependency array**
✅ When recipe saves, it increments `recipeRefreshVersion`
✅ This should trigger `fetchMyRecipes(0, true)` call

**BUT**: If none of the filters match, even after refetch, recipe still won't show

---

## 7. PAGINATION CHECK

In `fetchMyRecipes()` at line 148:
- `pageSize: 1000` - Fetches up to 1000 recipes at once
- Very unlikely pagination is hiding recipe in initial fetch

---

## 8. SPECIFIC RECOMMENDATIONS TO FIX

### Quick Debugging Steps (before code changes):

1. **Check If Recipe Saved Correctly**:
   ```sql
   SELECT id, user_id, is_curated, is_mix, title, type FROM recipes 
   WHERE title = 'Your Recipe Title'
   LIMIT 1;
   ```
   - Is `user_id` set to your user ID?
   - Is `is_curated` = `false`?
   - Is `is_mix` = `false`?

2. **Check What Filters Are Active**:
   - Open browser DevTools → Network
   - Trigger MyRecipes fetch
   - Look for the `fetchRecipes` call in React state
   - What are the values of: `filters.pantryMode`, `filters.selectedDietType`, `filters.selectedExclusions`, etc.?

3. **Check If Fetched Recipe Reaches Component**:
   - In `my-recipes-view.tsx`, add `console.log('allRecipes:', allRecipes)` after line 150
   - Is your recipe in this array?

4. **Check If Ownership Filter Removes It**:
   - Add `console.log('After ownership filter:', filteredItems)` after line 160
   - Did recipe survive?

5. **Check Which Client Filter Removes It**:
   - Add `console.log()` statements after each filter block (lines 162-281)
   - Which filter removes it?

### Code Fixes (if identified):

#### Fix #1: If Pantry Mode Is Hiding It
Change line 239 to make pantry filter less strict:
```typescript
// Instead of:
if (filters.pantryMode === 'pantry-only') {

// Consider:
if (filters.pantryMode === 'pantry-only' && filters !== defaultFilters) {
// OR use a mode that's specifically enabled, not default
```

#### Fix #2: If Empty Diet Array Is the Issue
Line 126 in `my-recipes-view.tsx`:
```typescript
// Current:
if (filters.selectedDietType && filters.selectedDietType !== 'anything') {
    filteredItems = filteredItems.filter(r => 
        r.diet && r.diet.map((d: string) => d.toLowerCase()).includes(filters.selectedDietType.toLowerCase())
    );
}

// Fix: Allow recipes with no diet specified
if (filters.selectedDietType && filters.selectedDietType !== 'anything') {
    filteredItems = filteredItems.filter(r => 
        !r.diet || r.diet.length === 0 ||  // ← ALLOW EMPTY DIET
        r.diet.map((d: string) => d.toLowerCase()).includes(filters.selectedDietType.toLowerCase())
    );
}
```

#### Fix #3: Ensure Ingredients Fetch When Needed
Line 119 in `my-recipes-view.tsx`:
```typescript
// Current:
const needsIngredients = filters.pantryMode === 'pantry-only' || 
                        filters.selectedExclusions.length > 0 || 
                        filters.selectedDietType !== 'anything' ||
                        filters.selectedEquipment.length > 0;

// Consider adding:
const needsIngredients = (filters.pantryMode === 'pantry-only' || 
                         filters.selectedExclusions.length > 0 || 
                         filters.selectedDietType !== 'anything' ||
                         filters.selectedEquipment.length > 0) &&
                        filters.pantryMode !== 'all';  // Don't fetch if no filtering
```

#### Fix #4: Bypass Pantry Filter on New Recipe Creation
Add a flag to track if recipe was just created:
```typescript
const [justCreated, setJustCreated] = useState(false);

// In pantry filter:
if (filters.pantryMode === 'pantry-only' && !justCreated) {
    // ... pantry filter logic
}

// Clear flag after render:
useEffect(() => {
    setJustCreated(false);
}, [recipes]);
```

#### Fix #5: Ensure Redirect to My Recipes
In `meals/new/page.tsx` line 288, instead of:
```typescript
router.push(`/dashboard/library/${isMix ? 'mixes' : 'recipes'}`);
```

Change to:
```typescript
router.push(`/dashboard/library/${isMix ? 'mixes' : 'my-recipes'}`);
```

---

## 9. SUMMARY TABLE

| Check Point | Status | Issue Impact |
|-------------|--------|--------------|
| Recipe saved with correct user_id | ❓ UNKNOWN | CRITICAL - if not, ownership filter fails |
| Recipe saved with is_curated=false | ❓ UNKNOWN | CRITICAL - if not, ownership filter fails |
| Ownership filter passes | ❓ UNKNOWN | HIGH - recipe removed before client filters |
| Client-side filters pass | ❓ UNKNOWN | HIGH - recipe hidden by active filters |
| recipeRefreshVersion in deps | ✅ YES | GOOD - trigger is connected |
| Pagination hiding recipe | ✅ NO | pageSize=1000 makes this unlikely |
| isMix mismatch | ❓ UNKNOWN | MEDIUM - if true, recipe excluded by Supabase |

---

## 10. MOST LIKELY ROOT CAUSE

**#1 Likelihood**: `filters.pantryMode === 'pantry-only'` is active, and new recipe's ingredients aren't in user's pantry yet, so recipe is filtered out.

**#2 Likelihood**: Recipe saved with `user_id` or `is_curated` set incorrectly due to timing issue in saveRecipe function.

**#3 Likelihood**: Recipe saved with `diet: []` and user has `selectedDietType !== 'anything'`, causing dietary filter to fail.

**Recommendation**: Start with the quick debugging steps (check DB, check active filters, check console logs) to identify which layer is filtering out the recipe.
