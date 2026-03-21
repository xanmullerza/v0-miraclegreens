# Recipe Visibility Investigation - Findings

## 1. EXACT FETCH QUERY BEING USED

**File:** [lib/hooks/use-data-persistence.ts](lib/hooks/use-data-persistence.ts#L87-L89)

```typescript
if (user) {
    // If logged in, get curated OR user's own
    query = query.or(`is_curated.eq.true,user_id.eq.${user.id}`);
}
```

### Query Structure:
- Base query: `supabase.from('recipes').select('*', { count: 'exact' })`
- When logged in: Adds OR condition: `is_curated.eq.true,user_id.eq.${user.id}`
- Then applies additional filters: searchQuery, selectedTypes, showFavoritesOnly, isMix, pagination & sorting

## 2. FILTERS APPLIED IN FETCH

**These filters are applied INSIDE `fetchRecipesBridge()`:**

✅ **Correct filters:**
- `is_curated.eq.true` - includes curated recipes
- `user_id.eq.${user.id}` - includes user's own recipes
- `ilike('title', ...)` - search query
- `in('type', ...)` - meal type filter
- `eq('is_favorite', true)` - favorites filter
- `eq('is_mix', isMix)` - mix classification filter
- Pagination: `.range(from, to)`
- Sorting: `.order(sortField, {...})`

## 3. CRITICAL FILTER IN MyRecipesView

**File:** [components/ingredients/my-recipes-view.tsx](components/ingredients/my-recipes-view.tsx#L152-L157)

```typescript
// AFTER fetching from use-data-persistence, MyRecipesView applies ANOTHER filter
let filteredItems = allRecipes.filter(r => {
    if (user) {
        return r.user_id === user.id && !r.is_curated;  // ⭐ CRITICAL
    } else {
        return r.id.toString().startsWith('local-') || !r.user_id;
    }
});
```

**This filter says:** "Only show recipes where user_id matches AND is_curated is false"

### Problem Identified:
The ownership filter is **CORRECT** for user-created recipes. BUT there could be an issue:

## 4. POTENTIAL ROOT CAUSES

### Issue A: User Object Not Being Passed Correctly
**Location:** [use-data-persistence.ts](lib/hooks/use-data-persistence.ts#L26-L39) line 26-39

```typescript
const [user, setUser] = useState<any>(null);

useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setLoading(false);
    });
    // ...
});
```

**Question:** Is `user.id` being populated correctly? If the user object is null when `fetchRecipes()` is called, the OR query won't include user's recipes.

### Issue B: Supabase OR Logic May Fail If:
1. `user.id` is `undefined` or null when query is built
2. The OR condition is being evaluated but returned recipes don't have the expected structure
3. Recipes are being saved but `user_id` field is not set (though job said DB confirms it is)

### Issue C: NO REFETCH TRIGGER AFTER RECIPE SAVE ⚠️ **LIKELY CULPRIT**

**Dependencies for refetch:** [components/ingredients/my-recipes-view.tsx](components/ingredients/my-recipes-view.tsx#L77-L84)

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
    user,  // ⭐ Depends on user
    filters.pantryMode, 
    filters.selectedDietType, 
    filters.selectedExclusions, 
    filters.showFlavours, 
    filters.showSupplements
]);
```

**The Issue:**
- When a recipe is saved via RecipePreview/ChatbotModal → saveRecipe() is called
- `saveRecipe()` updates the database
- BUT `MyRecipesView` doesn't have a callback to refetch!
- The useEffect will ONLY re-run if one of these dependencies changes
- **Since `user` isn't changing, the refetch won't trigger automatically**

## 5. CURRENT_USER_ID PASSING VALIDATION

**In saveRecipe():** [use-data-persistence.ts](lib/hooks/use-data-persistence.ts#L145-L152)

```typescript
const saveRecipe = async (recipe: any, ingredients?: any[], instructions?: any[]) => {
    try {
        if (user) {
            // SAVE TO CLOUD
            const recipeId = recipe.id || uuidv4();
            const recipeData = {
                ...recipe,
                id: recipeId,
                user_id: user.id,  // ✅ user.id is being set correctly
                is_curated: false   // ✅ is_curated is false
            };
```

✅ **This looks correct** - user.id is being set and is_curated is false.

## 6. COMPREHENSIVE RECOMMENDATIONS

### Recommendation 1: **ADD EXPLICIT REFETCH AFTER RECIPE SAVE** (HIGH PRIORITY)
The saveRecipe() function needs to return a signal that triggers MyRecipesView to refetch.

**Current Problem:**
- Recipe is saved but MyRecipesView doesn't know to refetch
- Only visible if page is refreshed manually

**Solution Options:**
a) Add a refetch callback parameter to `saveRecipe()`
b) Use React Context/state management for recipe list version/timestamp
c) Add a `refreshKey` or `recipeRefreshTrigger` to dependencies

### Recommendation 2: **VERIFY USER OBJECT IS SET BEFORE SAVE**
Add console logging in `saveRecipe()` to confirm user.id is populated:

```typescript
const saveRecipe = async (recipe: any, ingredients?: any[], instructions?: any[]) => {
    console.log('Current user:', user);
    console.log('User ID:', user?.id);
    if (!user?.id) {
        toast.error('Not authenticated');
        throw new Error('User not authenticated');
    }
    // ... continue with save
```

### Recommendation 3: **ADD USER_ID VALIDATION IN FETCH**
In `fetchRecipes()`, add validation:

```typescript
if (user?.id) {  // ⭐ Validate user.id exists
    query = query.or(`is_curated.eq.true,user_id.eq.${user.id}`);
} else {
    // User not authenticated, only show curated
    query = query.eq('is_curated', true);
}
```

### Recommendation 4: **VERIFY RECIPE DATA STRUCTURE**
Check that recipes being saved have:
- ✅ `id` starts with "recipe-" (confirmed by user)
- ✅ `user_id` = current user's ID (confirmed by user)
- ✅ `is_curated` = false (confirmed by user)
- ✅ `type`, `calories`, `protein` etc. are set (confirmed by user)

### Recommendation 5: **ADD QUERY DEBUGGING**
Modify fetchRecipes to log the actual query being executed:

```typescript
if (user?.id) {
    const debugQuery = `is_curated.eq.true,user_id.eq.${user.id}`;
    console.log('Fetching with OR condition:', debugQuery);
    query = query.or(debugQuery);
}
```

## SUMMARY

| Component | Status | Finding |
|-----------|--------|---------|
| **Fetch Query** | ✅ Correct | OR condition includes both curated and user's own |
| **Filters Applied** | ✅ Correct | Properly filters by type, search, favorites |
| **Ownership Filter** | ✅ Correct | Checks `user_id === user.id && !is_curated` |
| **User Object Passing** | 🟡 Verify | Need to confirm user.id is set when fetch runs |
| **Refetch After Save** | ❌ MISSING | **ROOT CAUSE - No callback to refetch after save** |
| **Recipe Data Saved** | ✅ Correct | DB confirms correct values are saved |

## ROOT CAUSE CONCLUSION

**Primary Issue:** When recipes are saved (via RecipePreview, ChatbotModal, etc.), there is **NO mechanism to trigger MyRecipesView to refetch the list**. The component only refetches when its dependencies change, and saving a recipe doesn't trigger any dependency changes.

The recipes ARE in the database with correct ownership data, but the UI doesn't show them because:
1. MyRecipesView fetches on initial load while user is loading/undefined
2. Recipe is saved
3. MyRecipesView doesn't refetch because `user` object hasn't changed
4. User manually refreshes page and then sees the recipe

**Next Steps:** Implement one of the refetch solutions in Recommendations 1-3 above.
