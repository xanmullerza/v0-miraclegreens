/**
 * Week 1 Recipe Importer - Mock Data Test Suite
 * 
 * Tests the parsing logic with realistic HTML samples
 * Validates extraction strategies without external network calls
 */

import * as cheerio from 'cheerio';
import {
  extractSchemaOrg,
  extractMicrodata,
  extractWithSelectors,
  extractGenericDOM,
  normalizeToParseRecipe,
  detectRecipeSite,
} from '@/lib/utils/recipe-importer';

// ========== MOCK HTML SAMPLES ==========

const MOCK_SCHEMA_ORG: string = `
<!DOCTYPE html>
<html>
<head>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org/",
    "@type": "Recipe",
    "name": "Grilled Chicken with Lemon",
    "author": {
      "@type": "Person",
      "name": "Chef John"
    },
    "description": "A delicious grilled chicken recipe with fresh lemon",
    "prepTime": "PT15M",
    "cookTime": "PT20M",
    "totalTime": "PT35M",
    "recipeYield": "4 servings",
    "recipeCategory": "Main Course",
    "recipeCuisine": "Mediterranean",
    "recipeIngredient": [
      "4 chicken breasts",
      "2 lemons",
      "3 tablespoons olive oil",
      "2 cloves garlic, minced",
      "1 teaspoon dried oregano",
      "Salt and pepper to taste"
    ],
    "recipeInstructions": [
      {
        "@type": "HowToStep",
        "text": "Preheat grill to medium-high heat"
      },
      {
        "@type": "HowToStep",
        "text": "Mix olive oil, lemon juice, and garlic"
      },
      {
        "@type": "HowToStep",
        "text": "Brush chicken with marinade"
      },
      {
        "@type": "HowToStep",
        "text": "Grill for 6-8 minutes per side"
      }
    ],
    "image": "https://example.com/recipe.jpg"
  }
  </script>
</head>
<body>
  <h1>Grilled Chicken with Lemon</h1>
</body>
</html>
`;

const MOCK_MICRODATA: string = `
<!DOCTYPE html>
<html>
<body>
<div itemscope itemtype="https://schema.org/Recipe">
  <h1 itemprop="name">Classic Chocolate Chip Cookies</h1>
  <p itemprop="description">The best homemade chocolate chip cookies ever</p>
  
  <div itemprop="recipeYield">Makes 24 cookies</div>
  <div itemprop="prepTime">PT10M</div>
  <div itemprop="cookTime">PT12M</div>
  
  <h2>Ingredients</h2>
  <ul>
    <li itemprop="recipeIngredient">2 1/4 cups all-purpose flour</li>
    <li itemprop="recipeIngredient">1 teaspoon baking soda</li>
    <li itemprop="recipeIngredient">1 teaspoon salt</li>
    <li itemprop="recipeIngredient">1 cup butter, softened</li>
    <li itemprop="recipeIngredient">3/4 cup granulated sugar</li>
    <li itemprop="recipeIngredient">3/4 cup packed brown sugar</li>
    <li itemprop="recipeIngredient">2 large eggs</li>
    <li itemprop="recipeIngredient">2 teaspoons vanilla extract</li>
    <li itemprop="recipeIngredient">2 cups chocolate chips</li>
  </ul>
  
  <h2>Instructions</h2>
  <ol>
    <li itemprop="recipeInstructions">Preheat oven to 375°F</li>
    <li itemprop="recipeInstructions">Mix flour, baking soda and salt in bowl</li>
    <li itemprop="recipeInstructions">Beat butter and sugars until creamy</li>
    <li itemprop="recipeInstructions">Beat in eggs and vanilla</li>
    <li itemprop="recipeInstructions">Gradually mix in flour mixture</li>
    <li itemprop="recipeInstructions">Stir in chocolate chips</li>
    <li itemprop="recipeInstructions">Drop by rounded tablespoon onto baking sheet</li>
    <li itemprop="recipeInstructions">Bake 9 to 12 minutes or until golden brown</li>
  </ol>
  
  <img itemprop="image" src="https://example.com/cookies.jpg" alt="Chocolate Chip Cookies" />
</div>
</body>
</html>
`;

const MOCK_ALLRECIPES_CSS: string = `
<!DOCTYPE html>
<html>
<body>
<h1 class="recipe__title">Beef Tacos</h1>

<ul class="ingredients__list">
  <li data-qa="ingredient">1 pound ground beef</li>
  <li data-qa="ingredient">1 packet taco seasoning</li>
  <li data-qa="ingredient">1/2 cup water</li>
  <li data-qa="ingredient">8 taco shells</li>
  <li data-qa="ingredient">1 cup shredded lettuce</li>
  <li data-qa="ingredient">1 cup diced tomatoes</li>
  <li data-qa="ingredient">1/2 cup shredded cheese</li>
</ul>

<ol class="instructions__list">
  <li data-qa="instruction">Brown ground beef in a skillet over medium-high heat</li>
  <li data-qa="instruction">Add taco seasoning and water</li>
  <li data-qa="instruction">Simmer for 5 minutes</li>
  <li data-qa="instruction">Warm taco shells according to package directions</li>
  <li data-qa="instruction">Fill shells with beef mixture</li>
  <li data-qa="instruction">Top with lettuce, tomatoes, and cheese</li>
</ol>

<div class="recipe__info">
  <span data-serving-size>4 servings</span>
  <span data-prep-time>PT10M</span>
  <span data-cook-time>PT15M</span>
</div>
</body>
</html>
`;

const MOCK_WPRM: string = `
<!DOCTYPE html>
<html>
<body>
<div class="wprm-recipe">
  <h2 class="wprm-recipe-name">Pasta Carbonara</h2>
  
  <div class="wprm-recipe-ingredients">
    <li class="wprm-recipe-ingredient">
      <span class="wprm-recipe-ingredient-amount">400</span>
      <span class="wprm-recipe-ingredient-unit">g</span>
      <span class="wprm-recipe-ingredient-name">spaghetti</span>
    </li>
    <li class="wprm-recipe-ingredient">
      <span class="wprm-recipe-ingredient-amount">4</span>
      <span class="wprm-recipe-ingredient-unit">large</span>
      <span class="wprm-recipe-ingredient-name">eggs</span>
    </li>
    <li class="wprm-recipe-ingredient">
      <span class="wprm-recipe-ingredient-amount">200</span>
      <span class="wprm-recipe-ingredient-unit">g</span>
      <span class="wprm-recipe-ingredient-name">pancetta</span>
    </li>
    <li class="wprm-recipe-ingredient">
      <span class="wprm-recipe-ingredient-amount">100</span>
      <span class="wprm-recipe-ingredient-unit">g</span>
      <span class="wprm-recipe-ingredient-name">pecorino cheese</span>
    </li>
  </div>
  
  <div class="wprm-recipe-instructions">
    <li class="wprm-recipe-instruction">Cook spaghetti in salted boiling water</li>
    <li class="wprm-recipe-instruction">Fry pancetta until crispy</li>
    <li class="wprm-recipe-instruction">Beat eggs with grated cheese</li>
    <li class="wprm-recipe-instruction">Toss hot pasta with pancetta and fat</li>
    <li class="wprm-recipe-instruction">Remove from heat and mix in egg mixture</li>
  </div>
  
  <div class="wprm-recipe-servings">
    <span class="wprm-recipe-yield">4 servings</span>
  </div>
</div>
</body>
</html>
`;

const MOCK_GENERIC_HTML: string = `
<!DOCTYPE html>
<html>
<head><title>Vegetable Stir Fry Recipe</title></head>
<body>
<h1>Easy Vegetable Stir Fry</h1>
<p>A quick and tasty vegetable stir fry for busy weeknights</p>

<h2>What You'll Need</h2>
<ul>
  <li>2 tablespoons vegetable oil</li>
  <li>1 cup broccoli florets</li>
  <li>1 cup sliced carrots</li>
  <li>1 red bell pepper, sliced</li>
  <li>2 cups snap peas</li>
  <li>3 cloves garlic, minced</li>
  <li>3 tablespoons soy sauce</li>
  <li>1 tablespoon sesame oil</li>
</ul>

<h2>How to Make It</h2>
<ol>
  <li>Heat oil in a large wok or skillet over high heat</li>
  <li>Add garlic and cook for 30 seconds until fragrant</li>
  <li>Add broccoli and carrots, stir fry for 3 minutes</li>
  <li>Add bell pepper and peas, continue cooking for 2 minutes</li>
  <li>Add soy sauce and sesame oil, toss to combine</li>
  <li>Serve immediately with rice</li>
</ol>
</body>
</html>
`;

// ========== TEST FUNCTIONS ==========

interface TestResult {
  name: string;
  success: boolean;
  method: string;
  ingredientCount: number;
  instructionCount: number;
  hasTitle: boolean;
  hasImage: boolean;
  errorMessage?: string;
}

async function testSchemaOrg(): Promise<TestResult> {
  try {
    const data = extractSchemaOrg(MOCK_SCHEMA_ORG);
    if (!data) throw new Error('No data extracted');

    return {
      name: 'JSON-LD (schema.org)',
      success: true,
      method: 'schema-org',
      ingredientCount: data.ingredients?.length || 0,
      instructionCount: data.instructions?.length || 0,
      hasTitle: !!data.title,
      hasImage: !!data.image,
    };
  } catch (e) {
    return {
      name: 'JSON-LD (schema.org)',
      success: false,
      method: 'error',
      ingredientCount: 0,
      instructionCount: 0,
      hasTitle: false,
      hasImage: false,
      errorMessage: e instanceof Error ? e.message : String(e),
    };
  }
}

async function testMicrodata(): Promise<TestResult> {
  try {
    const data = extractMicrodata(MOCK_MICRODATA);
    if (!data) throw new Error('No data extracted');

    const ingredients = (data.ingredients || []).filter(
      (i) => typeof i === 'string' && i.length > 0
    );
    const instructions = (data.instructions || []).filter(
      (i) => typeof i === 'string' && i.length > 0
    );

    return {
      name: 'Microdata (itemprop)',
      success: true,
      method: 'microdata',
      ingredientCount: ingredients.length,
      instructionCount: instructions.length,
      hasTitle: !!data.title,
      hasImage: !!data.image,
    };
  } catch (e) {
    return {
      name: 'Microdata (itemprop)',
      success: false,
      method: 'error',
      ingredientCount: 0,
      instructionCount: 0,
      hasTitle: false,
      hasImage: false,
      errorMessage: e instanceof Error ? e.message : String(e),
    };
  }
}

async function testAllRecipes(): Promise<TestResult> {
  try {
    const data = extractWithSelectors(MOCK_ALLRECIPES_CSS, '');
    if (!data) throw new Error('No data extracted');

    const ingredients = (data.ingredients || []).filter(
      (i) => typeof i === 'string' && i.length > 0
    );
    const instructions = (data.instructions || []).filter(
      (i) => typeof i === 'string' && i.length > 0
    );

    return {
      name: 'CSS Selectors (AllRecipes)',
      success: true,
      method: 'selectors-allrecipes',
      ingredientCount: ingredients.length,
      instructionCount: instructions.length,
      hasTitle: !!data.title,
      hasImage: !!data.image,
    };
  } catch (e) {
    return {
      name: 'CSS Selectors (AllRecipes)',
      success: false,
      method: 'error',
      ingredientCount: 0,
      instructionCount: 0,
      hasTitle: false,
      hasImage: false,
      errorMessage: e instanceof Error ? e.message : String(e),
    };
  }
}

async function testWPRM(): Promise<TestResult> {
  try {
    const data = extractWithSelectors(MOCK_WPRM, '');
    if (!data) throw new Error('No data extracted');

    const ingredients = (data.ingredients || []).filter(
      (i) => typeof i === 'string' && i.length > 0
    );
    const instructions = (data.instructions || []).filter(
      (i) => typeof i === 'string' && i.length > 0
    );

    return {
      name: 'CSS Selectors (WPRM)',
      success: true,
      method: 'selectors-wprm',
      ingredientCount: ingredients.length,
      instructionCount: instructions.length,
      hasTitle: !!data.title,
      hasImage: !!data.image,
    };
  } catch (e) {
    return {
      name: 'CSS Selectors (WPRM)',
      success: false,
      method: 'error',
      ingredientCount: 0,
      instructionCount: 0,
      hasTitle: false,
      hasImage: false,
      errorMessage: e instanceof Error ? e.message : String(e),
    };
  }
}

async function testGenericDOM(): Promise<TestResult> {
  try {
    const data = extractGenericDOM(MOCK_GENERIC_HTML);
    if (!data) throw new Error('No data extracted');

    const ingredients = (data.ingredients || []).filter(
      (i) => typeof i === 'string' && i.length > 0
    );
    const instructions = (data.instructions || []).filter(
      (i) => typeof i === 'string' && i.length > 0
    );

    return {
      name: 'Generic DOM Fallback',
      success: true,
      method: 'generic-dom',
      ingredientCount: ingredients.length,
      instructionCount: instructions.length,
      hasTitle: !!data.title,
      hasImage: !!data.image,
    };
  } catch (e) {
    return {
      name: 'Generic DOM Fallback',
      success: false,
      method: 'error',
      ingredientCount: 0,
      instructionCount: 0,
      hasTitle: false,
      hasImage: false,
      errorMessage: e instanceof Error ? e.message : String(e),
    };
  }
}

async function testSiteDetection(): Promise<TestResult> {
  try {
    const detected = await detectRecipeSite('https://example.com', MOCK_WPRM);
    if (detected !== 'wprm') throw new Error(`Expected 'wprm', got '${detected}'`);

    return {
      name: 'Site Detection (WPRM)',
      success: true,
      method: 'detection',
      ingredientCount: 0,
      instructionCount: 0,
      hasTitle: true,
      hasImage: false,
    };
  } catch (e) {
    return {
      name: 'Site Detection (WPRM)',
      success: false,
      method: 'error',
      ingredientCount: 0,
      instructionCount: 0,
      hasTitle: false,
      hasImage: false,
      errorMessage: e instanceof Error ? e.message : String(e),
    };
  }
}

// ========== MAIN TEST RUNNER ==========

async function main() {
  console.log(
    '\n╔════════════════════════════════════════════════════════╗'
  );
  console.log('║  Week 1 Recipe Importer - Mock Data Test Suite        ║');
  console.log('║     Testing Parsing Logic (No Network Calls)          ║');
  console.log(
    '╚════════════════════════════════════════════════════════╝\n'
  );

  const results: TestResult[] = [];

  console.log('🧪 Running tests...\n');

  results.push(await testSchemaOrg());
  results.push(await testMicrodata());
  results.push(await testAllRecipes());
  results.push(await testWPRM());
  results.push(await testGenericDOM());
  results.push(await testSiteDetection());

  // Print results table
  console.log(
    '╔════════════════════════════════════════════════════════════════════════╗'
  );
  console.log(
    '║ Strategy                           │ Status │ Ings │ Steps │ Title │ Img ║'
  );
  console.log(
    '╠════════════════════════════════════════════════════════════════════════╣'
  );

  for (const result of results) {
    const status = result.success ? '✓' : '✗';
    const nameStr = result.name.padEnd(34);
    const ingsStr = String(result.ingredientCount).padEnd(5);
    const stepsStr = String(result.instructionCount).padEnd(5);
    const titleStr = result.hasTitle ? '✓' : '-';
    const imgStr = result.hasImage ? '✓' : '-';

    console.log(
      `║ ${nameStr} │ ${status.padEnd(6)} │ ${ingsStr} │ ${stepsStr} │ ${titleStr}     │ ${imgStr}   ║`
    );
  }

  console.log(
    '╚════════════════════════════════════════════════════════════════════════╝\n'
  );

  // Summary
  const successCount = results.filter((r) => r.success).length;
  const successRate = ((successCount / results.length) * 100).toFixed(1);

  console.log('📊 Summary:');
  console.log(`  Total Tests: ${results.length}`);
  console.log(`  Passed: ${successCount}`);
  console.log(`  Failed: ${results.length - successCount}`);
  console.log(`  Success Rate: ${successRate}%`);

  // Error details
  const failures = results.filter((r) => !r.success);
  if (failures.length > 0) {
    console.log('\n❌ Failures:');
    for (const fail of failures) {
      console.log(`  ${fail.name}: ${fail.errorMessage}`);
    }
  }

  if (successCount === results.length) {
    console.log('\n✅ All tests passed! Week 1 parsing logic is working correctly.');
  }

  console.log('\n');
}

main().catch((e) => {
  console.error('Test suite failed:', e);
  process.exit(1);
});
