# My Recipes Feature - Implementation Guide

## Overview
The **My Recipes** feature is a new user-specific recipe management system that allows authenticated users to save, organize, and manage their personal recipe collections. This is separate from the curated public recipe library and lets users store recipes in a database persisted per-user account.

## Architecture

### New Files Created
1. **[app/(main)/dashboard/library/my-recipes/page.tsx](../../app/(main)/dashboard/library/my-recipes/page.tsx)**
   - Main page component for the My Recipes view
   - Handles authentication checks and redirects unauthenticated users to login
   - Integrates the MyRecipesView component

2. **[components/ingredients/my-recipes-view.tsx](../../components/ingredients/my-recipes-view.tsx)**
   - React component that displays and manages user's personal recipes
   - Features: filtering, sorting, favorites, edit, delete, and add new recipes
   - Only shows recipes where `user_id` matches the logged-in user and `is_curated = false`

### Route Structure
```
/dashboard/library/my-recipes/        → List all personal recipes
/dashboard/library/my-recipes/[id]    → Edit specific recipe (inherits from meals structure)
```

## Features

### 1. Authentication
- Only authenticated users can access the My Recipes page
- Automatic redirect to login if user is not authenticated
- Checks user state via `useDataPersistence` hook

### 2. Recipe Management
- **View**: Display all personal recipes with thumbnails, nutrition info, and recipe details
- **Filter**: Filter by meal type (breakfast, lunch, dinner, snack) and favorites
- **Search**: Full-text search across recipe titles
- **Sort**: Sort by title or other fields in ascending/descending order
- **Favorite**: Mark recipes as favorites for quick access
- **Edit**: Click on a recipe to edit it
- **Delete**: Remove recipes from personal library with confirmation

### 3. Add Recipes
- Button to add new recipes from URLs
- Users can parse recipe metadata from websites and save to their personal library
- Redirects to the meal creation flow: `/dashboard/library/meals/new`

### 4. Data Isolation
- Only shows recipes `WHERE user_id = current_user.id AND is_curated = false`
- All modifications are isolated to the logged-in user
- Uses Supabase RLS policies for security

## Database Schema Integration

The feature uses existing tables:
- **recipes**: Main recipe table with `user_id` field for ownership
- **ingredients**: Associated ingredients for each recipe
- **instructions**: Step-by-step instructions for recipes

### Key Fields
```typescript
{
  id: string;              // Unique recipe identifier
  title: string;           // Recipe name
  type: string;            // breakfast | lunch | dinner | snack
  user_id: string;         // Owner's user ID (NULL for curated recipes)
  is_curated: boolean;     // false for personal recipes
  is_favorite: boolean;    // User's favorite flag
  is_mix: boolean;         // Whether this is a mix/staple
  image: string | null;    // Recipe image URL
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  // ... nutrition data
}
```

## Component APIs

### MyRecipesView Props
The component is self-contained and doesn't require props:
```typescript
export function MyRecipesView() {
  // Auto-fetches only logged-in user's recipes
  // Handles all state locally
}
```

### Page Component
```typescript
// app/(main)/dashboard/library/my-recipes/page.tsx
- Checks authentication
- Redirects to login if not authenticated
- Shows loading state during auth check
- Renders MyRecipesView when authenticated
```

## Usage Flow

### For Users

1. **Access My Recipes**
   - Navigate to `/dashboard/library/my-recipes`
   - Auto-redirects to login if not authenticated

2. **Add a Recipe**
   - Click "Add Recipe" button
   - Paste recipe URL
   - System extracts recipe metadata (title, ingredients, instructions, images)
   - Review and save to personal library

3. **Manage Recipes**
   - Filter by meal type and favorites
   - Search by recipe name
   - Mark as favorite with heart icon
   - Edit recipe details
   - Delete unwanted recipes

### Toast Notifications
- ✅ "Recipe deleted successfully"
- ✅ "Added to favorites" / "Removed from favorites"
- ❌ "Failed to delete recipe"
- ❌ "Failed to load your recipes"

## Data Persistence

The `useDataPersistence` hook handles all data operations:

### Save Recipe
```typescript
const { saveRecipe } = useDataPersistence();

await saveRecipe(recipeData, ingredientsArray, instructionsArray);
// Automatically uses user.id for user_id field
```

### Fetch User's Recipes
```typescript
const { fetchRecipes } = useDataPersistence();

const { recipes, count } = await fetchRecipes({
  searchQuery: 'chicken',
  selectedTypes: ['lunch', 'dinner'],
  showFavoritesOnly: false,
  page: 0,
  pageSize: 20
});
// Filters locally to only show current user's recipes (not curated)
```

### Delete Recipe
```typescript
const { deleteRecipe } = useDataPersistence();

await deleteRecipe(recipeId);
// Ensures user ownership before deleting via RLS policy
```

## Security

1. **Authentication Required**: Page redirects unauthenticated users to login
2. **User Isolation**: Queries filter by `user_id` to prevent seeing other users' recipes
3. **RLS Policies**: Supabase RLS ensures DELETE/UPDATE only work on user's own recipes
4. **Ownership Check**: All operations verify user ownership before executing

## Styling

Uses the Vitala design system:
- **Primary Color**: Emerald (for personal/user recipes)
- **Dark Mode**: Full dark mode support with Tailwind
- **Responsive**: Mobile-first design with desktop optimizations
- **Animations**: Smooth transitions and loading states

## Error Handling

- Toast notifications for all user actions
- Try-catch blocks on all async operations
- Graceful fallback when no recipes exist
- Loading states for async data fetching
- Console logging for debugging

## Future Enhancements

Potential improvements for future iterations:

1. **Bulk Operations**
   - Batch delete multiple recipes
   - Bulk favoriting/unfavoriting

2. **Export/Import**
   - Export recipes as PDF
   - Import from CSV or JSON

3. **Sharing**
   - Share personal recipes with other users
   - Recipe collections/folders

4. **Analytics**
   - Most-used recipes
   - Nutrition summaries
   - Cooking frequency stats

5. **Recipe Customization**
   - Scale servings automatically
   - Dietary restrictions filtering
   - Ingredient substitutions

## Testing Checklist

- [ ] User can access `/dashboard/library/my-recipes`
- [ ] Unauthenticated users are redirected to login
- [ ] Recipes are filtered to user's own only
- [ ] Add recipe button works and redirects to meal creation
- [ ] Filter by meal type works
- [ ] Filter by favorites works
- [ ] Search works correctly
- [ ] Favorite toggle works
- [ ] Edit recipe navigation works
- [ ] Delete recipe works with confirmation
- [ ] Toast notifications appear correctly
- [ ] Empty state displays properly
- [ ] Loading states animate smoothly
- [ ] Responsive design works on mobile
- [ ] Dark mode theme applies correctly

## Related Files

- [hooks/use-data-persistence.ts](../../lib/hooks/use-data-persistence.ts) - Core data hook
- [components/recipe/recipe-preview.tsx](../../components/recipe/recipe-preview.tsx) - Recipe URL parser
- [app/(main)/dashboard/library/meals/page.tsx](../../app/(main)/dashboard/library/meals/page.tsx) - Curated recipes (comparison)
- [components/ui/page-container.tsx](../../components/ui/page-container.tsx) - Layout wrapper
