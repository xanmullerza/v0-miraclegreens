import { parseRecipeURL, parseAndMetrics, ParsingMetrics } from './recipe-importer';
import { ParsedRecipe } from '@/types/recipe';

/**
 * Week 1: Integrated Recipe Importer Wrapper
 * 
 * This wrapper manages the fallback strategy:
 * 1. Try Cheerio DOM parsing (fast, local, free)
 * 2. Fall back to n8n LLM webhook (slower, but handles edge cases)
 * 3. Return best result with confidence score
 */

export interface ImportResult {
  success: boolean;
  recipe?: ParsedRecipe;
  method: 'cheerio' | 'llm' | 'error';
  confidence: number;
  errorMessage?: string;
  executionTimeMs: number;
}

/**
 * Type-safe version: when success is true, recipe is guaranteed to exist
 */
export type SuccessfulImportResult = ImportResult & {
  success: true;
  recipe: ParsedRecipe;
};

/**
 * Smart import handler: tries Cheerio first, falls back to LLM
 */
export async function importRecipeFromURL(
  url: string,
  webhookUrl: string,
  userId?: string
): Promise<ImportResult> {
  const startTime = Date.now();
  console.log(`[RECIPE_IMPORTER] Starting import for URL: ${url}`);

  // Step 1: Try Cheerio parsing first (fast, local)
  try {
    console.log(`[RECIPE_IMPORTER] Attempting Cheerio DOM parsing...`);
    const result = await parseRecipeURL(url, {
      timeout: 8000,
      fallbackToGeneric: true,
    });

    // Success if we got title + ingredients
    if (
      result.recipe.title &&
      result.recipe.title !== 'Recipe' &&
      result.recipe.ingredients_text.split('\n').filter((l) => l.trim()).length >= 2
    ) {
      console.log(`[RECIPE_IMPORTER] ✅ SUCCESS: Cheerio parsed "${result.recipe.title}"`);
      console.log(`[RECIPE_IMPORTER]   - Method: ${result.method}`);
      console.log(`[RECIPE_IMPORTER]   - Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`[RECIPE_IMPORTER]   - Ingredients: ${result.recipe.ingredients_text.split('\n').filter(l => l.trim()).length}`);
      console.log(`[RECIPE_IMPORTER]   - Instructions: ${result.recipe.instructions_text.split('\n').filter(l => l.trim()).length}`);
      return {
        success: true,
        recipe: result.recipe,
        method: 'cheerio',
        confidence: result.confidence,
        executionTimeMs: Date.now() - startTime,
      };
    }

    console.log(`[RECIPE_IMPORTER] ⚠️ Cheerio incomplete - title: "${result.recipe.title}", ingredients: ${result.recipe.ingredients_text.split('\n').length}`);
  } catch (error) {
    console.log(`[RECIPE_IMPORTER] ❌ Cheerio failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Step 2: Fall back to LLM webhook
  console.log(`[RECIPE_IMPORTER] Falling back to LLM webhook...`);
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: url,
        userId: userId || 'anonymous',
        contentType: 'recipe-url',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const recipe = data.recipe || data.data;

    if (recipe && recipe.title) {
      console.log(`[RECIPE_IMPORTER] ✅ SUCCESS: LLM parsed "${recipe.title}"`);
      console.log(`[RECIPE_IMPORTER]   - Ingredients: ${recipe.ingredients_text?.split('\n').length || 0}`);
      console.log(`[RECIPE_IMPORTER]   - Instructions: ${recipe.instructions_text?.split('\n').length || 0}`);
      const parsedRecipe: ParsedRecipe = {
        title: recipe.title,
        ingredients_text: recipe.ingredients_text || recipe.ingredients || '',
        instructions_text: recipe.instructions_text || recipe.instructions || '',
        servings: recipe.servings || 4,
        prep_time: recipe.prep_time || 30,
        cook_time: recipe.cook_time || 0,
        source_url: url,
        image_url: recipe.image_url || recipe.image || undefined,
        image: recipe.image || recipe.image_url || undefined,
        type: recipe.type || recipe.meal_type || 'dinner',
        meal_type: recipe.meal_type || undefined,
      };

      return {
        success: true,
        recipe: parsedRecipe,
        method: 'llm',
        confidence: 0.85,
        executionTimeMs: Date.now() - startTime,
      };
    }

    throw new Error('LLM returned no recipe data');
  } catch (error) {
    console.error(`[RECIPE_IMPORTER] ❌ LLM fallback failed: ${error instanceof Error ? error.message : String(error)}`);
    return {
      success: false,
      method: 'error',
      confidence: 0,
      errorMessage:
        error instanceof Error
          ? error.message
          : 'Failed to import recipe from URL',
      executionTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Batch test multiple URLs and report metrics
 * Useful for testing Week 1 improvements
 */
export async function testRecipeImportBatch(
  urls: string[],
  webhookUrl?: string
): Promise<{
  results: (ParsingMetrics & { fallbackUsed: boolean })[];
  summary: {
    totalTested: number;
    successCount: number;
    failureCount: number;
    avgSuccessRate: number;
    avgConfidence: number;
    cheerioSuccessRate: number;
    totalTimeMs: number;
  };
}> {
  const startTime = Date.now();
  const results: (ParsingMetrics & { fallbackUsed: boolean })[] = [];

  for (const url of urls) {
    try {
      const metrics = await parseAndMetrics(url);
      results.push({
        ...metrics,
        fallbackUsed: false,
      });
    } catch (e) {
      results.push({
        url,
        success: false,
        method: 'error',
        confidence: 0,
        hasTitle: false,
        ingredientCount: 0,
        instructionCount: 0,
        hasImage: false,
        errorMessage:
          e instanceof Error ? e.message : 'Unknown error',
        executionTimeMs: 0,
        fallbackUsed: false,
      });
    }
  }

  const successCount = results.filter((r) => r.success).length;
  const avgConfidence =
    results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
  const cheerioSuccess = results.filter(
    (r) => r.success && r.method.includes('schema')
  ).length;

  return {
    results,
    summary: {
      totalTested: urls.length,
      successCount,
      failureCount: urls.length - successCount,
      avgSuccessRate: (successCount / urls.length) * 100,
      avgConfidence,
      cheerioSuccessRate: (cheerioSuccess / urls.length) * 100,
      totalTimeMs: Date.now() - startTime,
    },
  };
}

/**
 * Log metrics in a readable format
 */
export function formatMetricsSummary(summary: {
  totalTested: number;
  successCount: number;
  failureCount: number;
  avgSuccessRate: number;
  avgConfidence: number;
  cheerioSuccessRate: number;
  totalTimeMs: number;
}): string {
  return `
╔════════════════════════════════════════════════════╗
║         Week 1 Recipe Importer Metrics             ║
╠════════════════════════════════════════════════════╣
║ Total Tested:          ${String(summary.totalTested).padEnd(30)}║
║ Success Count:         ${String(summary.successCount).padEnd(30)}║
║ Failure Count:         ${String(summary.failureCount).padEnd(30)}║
║ Success Rate:          ${String(`${summary.avgSuccessRate.toFixed(1)}%`).padEnd(30)}║
║ Cheerio Success Rate:  ${String(`${summary.cheerioSuccessRate.toFixed(1)}%`).padEnd(30)}║
║ Avg Confidence:        ${String(`${summary.avgConfidence.toFixed(2)}`).padEnd(30)}║
║ Total Time:            ${String(`${summary.totalTimeMs}ms`).padEnd(30)}║
║ Avg Time/Recipe:       ${String(`${(summary.totalTimeMs / summary.totalTested).toFixed(0)}ms`).padEnd(30)}║
╚════════════════════════════════════════════════════╝
  `;
}

/**
 * Log detailed results per URL
 */
export function formatDetailedResults(
  results: (ParsingMetrics & { fallbackUsed: boolean })[]
): string {
  const lines = [
    '╔════════════════════════════════════════════════════════════════════════════════════════╗',
    '║ URL                      │ Success │ Method       │ Conf  │ Ings │ Steps │ Time   │ Img ║',
    '╠════════════════════════════════════════════════════════════════════════════════════════╣',
  ];

  for (const result of results) {
    const urlShort = result.url.length > 24 ? result.url.substring(0, 21) + '...' : result.url;
    const status = result.success ? '✓' : '✗';
    const methodStr = result.method.substring(0, 12).padEnd(12);
    const confStr = `${(result.confidence * 100).toFixed(0)}%`.padEnd(5);
    const ingsStr = String(result.ingredientCount).padEnd(5);
    const stepsStr = String(result.instructionCount).padEnd(5);
    const timeStr = `${result.executionTimeMs}ms`.padEnd(6);
    const imgStr = result.hasImage ? '✓' : '-';

    lines.push(
      `║ ${urlShort.padEnd(24)} │ ${status.padEnd(7)} │ ${methodStr} │ ${confStr} │ ${ingsStr} │ ${stepsStr} │ ${timeStr} │ ${imgStr} ║`
    );
  }

  lines.push(
    '╚════════════════════════════════════════════════════════════════════════════════════════╝'
  );

  return lines.join('\n');
}
