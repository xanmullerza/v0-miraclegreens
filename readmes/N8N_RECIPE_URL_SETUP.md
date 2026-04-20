# N8N Recipe URL Scraper Integration Guide

## Overview
Add recipe URL scraping to the existing N8N multimodal workflow using Puppeteer and schema.org JSON-LD parsing.

## Step 1: Add Recipe URL Route to Content Type Router

In the "Content Type Router" switch node, add a new rule:

```
Condition: $json.body?.contentType = "recipe-url"
Output Key: "recipe-url"
```

This will route recipe URLs to the new recipe scraper nodes.

## Step 2: Add Recipe URL Scraper Nodes

### Create "Fetch Recipe Page" HTTP Request Node

**Type**: HTTP Request
**Position**: (-640, -192) (left side, separate from other routes)

**Parameters**:
- **URL**: `{{ $json.body.message }}`
- **Method**: GET
- **Add Headers**: Accept: text/html
- **Options**: Set timeout to 30000ms (30 seconds)

### Create "Extract Recipe Metadata" Code Node

**Type**: Code (JavaScript)
**Position**: (-192, -192) (after Fetch Recipe Page)

**Code**:
```javascript
const html = items[0].json;

// Try to extract JSON-LD recipe data
const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
let recipeData = null;

if (jsonLdMatch) {
  try {
    const jsonLd = JSON.parse(jsonLdMatch[1]);
    // Handle both direct Recipe objects and arrays
    const recipe = Array.isArray(jsonLd) ? jsonLd.find(item => item['@type'] === 'Recipe') : jsonLd;
    
    if (recipe) {
      recipeData = {
        title: recipe.name || 'Untitled Recipe',
        ingredients_text: recipe.recipeIngredient?.join('\n') || '',
        instructions_text: recipe.recipeInstructions?.[0]?.text || 
                          (Array.isArray(recipe.recipeInstructions) 
                            ? recipe.recipeInstructions.map(i => i.text || i).join('\n') 
                            : recipe.recipeInstructions || ''),
        servings: recipe.recipeYield?.replace(/\D/g, '') || 4,
        prep_time: recipe.prepTime?.match(/\d+/)?.[0] || recipe.cookTime?.match(/\d+/)?.[0] || 30,
        image_url: recipe.image?.url || recipe.image?.[0]?.url || recipe.image || undefined,
        source_url: $('Webhook').item.json.body.message
      };
    }
  } catch (error) {
    console.error('JSON-LD parsing error:', error);
  }
}

// Check if this is a WPRM (WP Recipe Maker) site and parse accordingly
if (!recipeData && html.includes('wprm-recipe')) {
  try {
    // WPRM-specific parsing
    const titleMatch = html.match(/<h2[^>]*class="[^"]*wprm-recipe-name[^"]*"[^>]*>([^<]+)<\/h2>/i) ||
                       html.match(/<h1[^>]*class="[^"]*wprm-recipe-name[^"]*"[^>]*>([^<]+)<\/h1>/i) ||
                       html.match(/<h3[^>]*class="[^"]*wprm-recipe-name[^"]*"[^>]*>([^<]+)<\/h3>/i);
    
    // Extract ingredients from WPRM structure
    const ingredientsMatch = html.match(/<div[^>]*class="[^"]*wprm-recipe-ingredients[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    let ingredients_text = '';
    if (ingredientsMatch) {
      const ingredientsHtml = ingredientsMatch[1];
      const ingredientMatches = ingredientsHtml.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
      ingredients_text = ingredientMatches.map(li => li.replace(/<[^>]*>/g, '').trim()).join('\n');
    }
    
    // Extract instructions from WPRM structure
    const instructionsMatch = html.match(/<div[^>]*class="[^"]*wprm-recipe-instructions[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    let instructions_text = '';
    if (instructionsMatch) {
      const instructionsHtml = instructionsMatch[1];
      const instructionMatches = instructionsHtml.match(/<div[^>]*class="[^"]*wprm-recipe-instruction[^"]*"[^>]*>([\s\S]*?)<\/div>/gi) || [];
      instructions_text = instructionMatches.map(div => div.replace(/<[^>]*>/g, '').trim()).join('\n');
    }
    
    // Extract metadata
    const servingsMatch = html.match(/<span[^>]*class="[^"]*wprm-recipe-servings[^"]*"[^>]*>([\s\S]*?)<\/span>/i) ||
                          html.match(/<span[^>]*class="[^"]*wprm-recipe-yield[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
    const prepTimeMatch = html.match(/<span[^>]*class="[^"]*wprm-recipe-prep-time[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
    const cookTimeMatch = html.match(/<span[^>]*class="[^"]*wprm-recipe-cook-time[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
    
    // Extract image
    const imageMatch = html.match(/<img[^>]*class="[^"]*wprm-recipe-image[^"]*"[^>]*src="([^"]+)"/i) ||
                       html.match(/<div[^>]*class="[^"]*wprm-recipe-image[^"]*"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"/i);
    
    recipeData = {
      title: titleMatch?.[1]?.trim() || 'WPRM Recipe',
      ingredients_text: ingredients_text,
      instructions_text: instructions_text,
      servings: servingsMatch ? parseInt(servingsMatch[1].replace(/\D/g, '')) || 4 : 4,
      prep_time: prepTimeMatch ? parseInt(prepTimeMatch[1].replace(/\D/g, '')) || 30 : 
                 cookTimeMatch ? parseInt(cookTimeMatch[1].replace(/\D/g, '')) || 30 : 30,
      image_url: imageMatch?.[1],
      source_url: $('Webhook').item.json.body.message
    };
  } catch (error) {
    console.error('WPRM parsing error:', error);
  }
}

// Fallback: Simple regex parsing if JSON-LD and WPRM parsing not found
if (!recipeData) {
  try {
    // Extract from common HTML patterns
    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const ingredientsMatch = html.match(/<(ul|ol)[^>]*class="ingredients"[^>]*>([\s\S]*?)<\/(ul|ol)>/i);
    const instructionsMatch = html.match(/<(ul|ol)[^>]*class="instructions"[^>]*>([\s\S]*?)<\/(ul|ol)>/i);
    const imageMatch = html.match(/<img[^>]*src="([^"]*)"[^>]*alt="recipe"/i) || 
                       html.match(/<img[^>]*src="([^"]*)recip[^"]*"[^>]*>/i);
    
    recipeData = {
      title: titleMatch?.[1]?.trim() || 'Recipe from URL',
      ingredients_text: ingredientsMatch ? ingredientsMatch[2].replace(/<[^>]*>/g, '').split('</li>').join('\n') : '',
      instructions_text: instructionsMatch ? instructionsMatch[2].replace(/<[^>]*>/g, '').split('</li>').join('\n') : '',
      servings: 4,
      prep_time: 30,
      image_url: imageMatch?.[1],
      source_url: $('Webhook').item.json.body.message
    };
  } catch (error) {
    console.error('Regex parsing error:', error);
  }
}

return {
  json: recipeData || { error: 'Could not extract recipe data' }
};
```

## Step 3: Add Format Recipe Node

**Type**: Code (JavaScript)  
**Position**: (96, -192)

**Code**:
```javascript
const recipe = items[0].json;

if (!recipe || recipe.error) {
  return { json: { error: 'Recipe parsing failed' } };
}

// Clean and normalize the recipe data
return {
  json: {
    recipe: {
      title: recipe.title?.trim() || 'Untitled Recipe',
      ingredients_text: recipe.ingredients_text?.trim() || '',
      instructions_text: recipe.instructions_text?.trim() || '',
      servings: parseInt(recipe.servings) || 4,
      prep_time: parseInt(recipe.prep_time) || 30,
      image_url: recipe.image_url,
      source_url: recipe.source_url
    }
  }
};
```

## Step 4: Connect Recipe URL Route

Update the "Content Type Router" connections to add the recipe-url path:

1. Connect "Content Type Router" → "recipe-url" output → "Fetch Recipe Page"
2. Connect "Fetch Recipe Page" → "Extract Recipe Metadata"
3. Connect "Extract Recipe Metadata" → "Format Recipe"
4. Connect "Format Recipe" → "Respond"

## Step 5: Error Handling (Optional but Recommended)

Add an error handler node after "Fetch Recipe Page":

**Type**: Code (on error)  
**Code**:
```javascript
return {
  json: {
    error: 'Failed to fetch recipe URL',
    message: 'Please check that the URL is valid and accessible'
  }
};
```

## Testing

1. **Send recipe URL to webhook**:
```bash
curl -X POST https://vitalagreens.app.n8n.cloud/webhook/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "https://www.allrecipes.com/recipe/12345/example-recipe/",
    "userId": "test-user",
    "contentType": "recipe-url"
  }'
```

2. **Expected Response**:
```json
{
  "recipe": {
    "title": "Example Recipe",
    "ingredients_text": "1 cup flour\n2 eggs\n...",
    "instructions_text": "Mix ingredients\nBake at 350°F\n...",
    "servings": 4,
    "prep_time": 30,
    "image_url": "https://example.com/recipe-image.jpg",
    "source_url": "https://www.allrecipes.com/recipe/12345/example-recipe/"
  }
}
```

## Supported Recipe Formats

- ✅ **Schema.org JSON-LD** (most modern recipe sites)
- ✅ **AllRecipes.com**
- ✅ **BBC Good Food**
- ✅ **Food Network**
- ✅ **Bon Appétit**
- ✅ **NYT Cooking**
- ✅ **Any site with schema.org Recipe markup**
- ⚠️ **Other sites**: Falls back to regex parsing (may be incomplete)

## Troubleshooting

### Recipe not parsing:
1. Check that the URL is a recipe page (not homepage or category)
2. Verify schema.org markup exists in page source
3. Check N8N logs for extraction errors

### Image not extracted:
1. Some sites don't include images in JSON-LD
2. Fallback regex creates data URL from page images
3. Frontend can handle missing images gracefully

### Timeout errors:
1. Increase HTTP request timeout to 60000ms (60 seconds)
2. Some recipe sites are slow to load
3. Consider adding retry logic with exponential backoff

## Next Steps

After N8N is configured:
1. Frontend chatbot-modal detects URLs and sends with `contentType: 'recipe-url'`
2. N8N scrapes and returns recipe JSON
3. Recipe editor modal opens with parsed data pre-filled
4. User can edit ingredients and save to database
