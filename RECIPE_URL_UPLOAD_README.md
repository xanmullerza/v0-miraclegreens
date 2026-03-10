# Recipe URL Upload Implementation - Complete Guide

## 🎯 Overview
You can now add recipes to your library directly from recipe URLs! The system supports two methods:
1. **Via Chatbot**: Paste a recipe URL in your Q&A Assistant
2. **Via Recipe Builder**: Use the "Import from Recipe URL" field to scrape and parse recipes

## 📋 What Was Implemented

### Core Features
✅ **URL Detection in Chatbot**: Automatically detects recipe URLs in chat messages  
✅ **Recipe Scraping**: Parses recipe data from website URLs using schema.org JSON-LD  
✅ **Image Download & Upload**: Automatically downloads recipe images and uploads to Supabase  
✅ **Recipe Editor Integration**: Parsed data opens in the recipe editor for final adjustments  
✅ **Ingredient Matching**: Leverages existing ingredient database for automatic matching  
✅ **Flexible Workflow**: Users can edit, skip, or manually match unmatched ingredients  

## 🚀 Getting Started

### Method 1: Via Chatbot (Easiest)
1. Open your **Q&A Assistant** (bottom right)
2. Paste a recipe URL: `https://www.allrecipes.com/recipe/12345/my-recipe/`
3. The bot detects the URL and shows "Adding recipe..."
4. Recipe editor opens with pre-filled data
5. Edit ingredients/instructions and save

### Method 2: Via Recipe Builder
1. Go to **Dashboard** → **Library** → **Add New Meal**
2. In the **"Import from Recipe URL"** section, paste the URL
3. Click **"Parse"** button
4. Recipe details auto-fill (title, prep time, servings)
5. Manual ingredient addition or use the imported text
6. Save to library

## 🔧 N8N Workflow Configuration (Required)

Before testing, you must configure N8N to handle recipe URL scraping.

### Quick Setup
1. Open your N8N instance
2. Import the `Privvy/multimodal.json` workflow (if not already done)
3. Follow the detailed guide below to add recipe URL route

### Detailed N8N Setup

**Step 1**: Update "Content Type Router" switch node
- Add new rule for `recipe-url` content type
- Route output key: `"recipe-url"`

**Step 2**: Add recipe scraping nodes (in order)
1. **"Fetch Recipe Page"** - HTTP Request node
   - URL: `{{ $json.body.message }}`
   - Method: GET
   - Timeout: 30000ms

2. **"Extract Recipe Metadata"** - Code node
   - Parses schema.org JSON-LD from HTML
   - Falls back to regex extraction
   - Returns: `{ title, ingredients_text, instructions_text, servings, prep_time, image_url, source_url }`

3. **"Format Recipe"** - Code node
   - Normalizes data
   - Outputs clean recipe JSON
   - Maps fields for frontend consumption

**Step 3**: Connect workflow
```
Content Type Router (recipe-url output)
  ↓
Fetch Recipe Page
  ↓
Extract Recipe Metadata
  ↓
Format Recipe
  ↓
Respond
```

See [N8N_RECIPE_URL_SETUP.md](N8N_RECIPE_URL_SETUP.md) for complete code examples.

## 📊 Supported Recipe Websites

**Schema.org JSON-LD Support (Recommended)**
- AllRecipes.com ✅
- BBC Good Food ✅
- Food Network ✅
- Bon Appétit ✅
- NYT Cooking ✅
- NYTimes.com recipes ✅
- Any site with schema.org Recipe markup ✅

**Fallback HTML Parsing**
- Generic recipe pages with common HTML patterns
- Success rate varies by site structure

## 🔄 Data Flow

```
User enters recipe URL
↓
Frontend detects URL pattern (https?://\S+)
↓
Chatbot sends to N8N with contentType: 'recipe-url'
↓
N8N fetches HTML and parses recipe metadata
↓
N8N returns JSON with title, ingredients, instructions, image
↓
Frontend downloads image and uploads to Supabase
↓
Recipe editor modal opens with pre-filled data
↓
User reviews/edits ingredients and saves
↓
Recipe stored in database with source URL tracked
```

## 🛠️ Component Files

**Frontend Components**:
- [components/chatbot-modal.tsx](components/chatbot-modal.tsx) - URL detection and sending
- [components/recipe/recipe-url-handler.tsx](components/recipe/recipe-url-handler.tsx) - Recipe modal handler
- [components/ingredients/recipe-form-dialog.tsx](components/ingredients/recipe-form-dialog.tsx) - Recipe editor with URL parser
- [app/(main)/layout.tsx](app/(main)/layout.tsx) - Integration layer with callbacks

**Utilities**:
- [lib/utils/recipe-image-upload.ts](lib/utils/recipe-image-upload.ts) - Image download/upload to Supabase
- [lib/utils/recipe-parser.ts](lib/utils/recipe-parser.ts) - Existing recipe text parsing

**Configuration**:
- [Privvy/multimodal.json](Privvy/multimodal.json) - N8N workflow (needs recipe-url route added)

## 🧪 Testing Checklist

### 1. Chatbot URL Detection
- [ ] Open chatbot from dashboard
- [ ] Send message with URL: `I love this recipe: https://www.allrecipes.com/recipe/12345/example/`
- [ ] Verify bot detects URL and shows "Adding recipe..." message
- [ ] Verify recipe editor opens within a few seconds

### 2. Recipe Parsing
- [ ] Test with AllRecipes example: `https://www.allrecipes.com/recipe/20039/chocolate-chip-cookies/`
- [ ] Verify title, ingredients, and instructions are populated
- [ ] Verify image is downloaded and visible in editor

### 3.  Image Upload
- [ ] Check that recipe image appears in the editor preview
- [ ] Verify image is stored in Supabase storage bucket `recipes`
- [ ] Check that saved recipe has public image URL

### 4. Recipe Building via URL Input
- [ ] Go to Dashboard → Library → Add New Meal
- [ ] Paste URL in "Import from Recipe URL" field
- [ ] Click "Parse" button
- [ ] Verify recipe details auto-fill
- [ ] Edit ingredients if needed
- [ ] Save recipe and verify it appears in library

### 5. Ingredient Matching
- [ ] After parsing recipe, review auto-matched ingredients
- [ ] Verify unmatched ingredients allow skip or manual entry
- [ ] Save recipe with mixed automatic and manually-matched ingredients
- [ ] View saved recipe to confirm ingredients saved correctly

### 6. Error Handling
- [ ] Paste invalid URL: `https://google.com`
- [ ] Verify error message: "Could not parse recipe from URL..."
- [ ] Paste URL to non-recipe page: `https://bbc.com`
- [ ] Verify graceful error handling

### 7. Edge Cases
- [ ] Test with shorter recipe URLs (bit.ly, tiny.cc)
- [ ] Test with international recipe sites
- [ ] Test with recipes missing images
- [ ] Test with recipes missing prep time
- [ ] Save recipe and verify can be viewed/edited later

## 📝 Troubleshooting

### Recipe not parsing from valid URL
**Issue**: N8N webhook returns error or no recipe data
**Solutions**:
1. Check URL is actually a recipe page (not homepage)
2. Verify schema.org Recipe markup exists in page source
3. Check N8N logs for specific parsing errors
4. Try simpler recipe site (AllRecipes vs obscure blog)

### Image not downloading
**Issue**: Recipe parses but image is missing or broken
**Solutions**:
1. Image URLs on some sites may be blocked (CORS)
2. Setting image to null is safe - user can upload manually
3. Check Supabase storage permissions

### Ingredient matching incomplete
**Issue**: Many ingredients not matched to food database
**Solutions**:
1. This is expected for very niche or processed recipes
2. User can manually search and match from picker
3. Can skip unmatched ingredients
4. System shows which ingredients are unmatched

### URL detection not working in chatbot
**Issue**: URL in message not detected
**Solutions**:
1. Ensure URL starts with `http://` or `https://`
2. URL should not have spaces before/after it
3. Try sending just the URL alone: `https://example.com/recipe`

## 🔐 Security & Privacy

- Recipe URLs are stored in database `source` field
- Images downloaded from external sites are re-uploaded to your Supabase (owned by you)
- N8N makes HTTP requests to recipe websites (ensure compliance with their robots.txt/ToS)
- User data (ingredients, nutrition) stays in your database

## 📈 Future Enhancements

Possible expansions:
- Bulk import multiple recipes at once
- Recipe collection/cookbook import from URLs
- Schedule periodic re-parsing of recipes to update nutrition
- Support for more specialized recipe formats
- AI-powered ingredient substitution suggestions
- Recipe scaling UI in editor

## 💬 Support

For issues or questions:
1. Check N8N_RECIPE_URL_SETUP.md for workflow configuration
2. Review troubleshooting section above
3. Check N8N webhook logs for parsing errors
4. Verify all required imports and dependencies installed

## ✅ Success Indicators

You'll know it's working when:
- ✅ Pasting a recipe URL in chatbot triggers parsing
- ✅ Recipe editor opens with title and ingredients auto-filled
- ✅ Recipe image displays in preview
- ✅ Successfully saved recipes appear in library
- ✅ Saved recipes retain source URL for reference
- ✅ No console errors in browser dev tools
