/**
 * Week 1 Recipe Importer Test Suite
 * 
 * Run this with: npx tsx test-recipe-importer.ts
 * 
 * Tests Cheerio parsing against real recipe URLs
 * Measures success rate, confidence, and execution time
 */

import { testRecipeImportBatch, formatMetricsSummary, formatDetailedResults } from '@/lib/utils/recipe-import-handler';
import { parseAndMetrics } from '@/lib/utils/recipe-importer';

// Test URLs - curated list of common recipe sources
const TEST_URLS = [
  // AllRecipes
  'https://www.allrecipes.com/recipe/20144/meat-lasagna/',
  'https://www.allrecipes.com/recipe/12682/chocolate-chip-cookies/',

  // Food Network
  'https://www.foodnetwork.com/recipes/ina-garten/tomato-soup-12373',

  // Tasty
  'https://tasty.co/recipe/the-best-chocolate-chip-cookies',

  // Food blogs (often have schema.org or microdata)
  'https://www.foodandwine.com/recipes/grilled-fish-tacos',
  'https://www.bonappetitmag.com/recipe/crispy-roasted-red-potatoes',
];

/**
 * Test mode 1: Single URL parsing with detailed output
 */
export async function testSingleURL(url: string) {
  console.log(`\n📋 Testing single URL: ${url}\n`);

  try {
    const metrics = await parseAndMetrics(url);

    console.log('Result:');
    console.log(`  ✓ Success: ${metrics.success}`);
    console.log(`  📊 Method: ${metrics.method}`);
    console.log(`  🎯 Confidence: ${(metrics.confidence * 100).toFixed(1)}%`);
    console.log(`  📖 Ingredients: ${metrics.ingredientCount}`);
    console.log(`  👨‍🍳 Instructions: ${metrics.instructionCount}`);
    console.log(`  🖼️  Image: ${metrics.hasImage ? 'Yes' : 'No'}`);
    console.log(`  ⏱️  Time: ${metrics.executionTimeMs}ms`);

    if (!metrics.success && metrics.errorMessage) {
      console.log(`  ❌ Error: ${metrics.errorMessage}`);
    }
  } catch (error) {
    console.error('Test failed:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Test mode 2: Batch testing with summary stats
 */
export async function testBatch(urls: string[]) {
  console.log(`\n🚀 Running batch test on ${urls.length} URLs...\n`);

  try {
    const batchResult = await testRecipeImportBatch(urls);

    console.log(formatDetailedResults(batchResult.results));
    console.log(formatMetricsSummary(batchResult.summary));
  } catch (error) {
    console.error('Batch test failed:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Test mode 3: Performance comparison
 * Shows which extraction methods are used most
 */
export async function testPerformanceComparison(urls: string[]) {
  console.log(`\n⚡ Performance Comparison (${urls.length} URLs)...\n`);

  const methodCounts: Record<string, number> = {};
  const confidenceByMethod: Record<string, number[]> = {};
  let totalTime = 0;

  for (const url of urls) {
    try {
      const metrics = await parseAndMetrics(url);
      totalTime += metrics.executionTimeMs;

      if (metrics.success) {
        methodCounts[metrics.method] = (methodCounts[metrics.method] || 0) + 1;
        if (!confidenceByMethod[metrics.method]) {
          confidenceByMethod[metrics.method] = [];
        }
        confidenceByMethod[metrics.method].push(metrics.confidence);
      }
    } catch (e) {
      // Skip on error
    }
  }

  console.log('Method Usage Distribution:');
  for (const [method, count] of Object.entries(methodCounts)) {
    const percentage = ((count / urls.length) * 100).toFixed(1);
    const confidences = confidenceByMethod[method];
    const avgConf = (confidences.reduce((a, b) => a + b, 0) / confidences.length * 100).toFixed(1);
    console.log(`  ${method.padEnd(20)} │ ${String(count).padEnd(3)} (${percentage}%) │ Avg Conf: ${avgConf}%`);
  }

  console.log(`\nTotal execution time: ${totalTime}ms`);
  console.log(`Average per recipe: ${(totalTime / urls.length).toFixed(0)}ms`);
}

/**
 * Test mode 4: Expected vs Actual success rates
 * Week 1 goal: 90-95% vs baseline 65%
 */
export async function testSuccessRateComparison(urls: string[]) {
  console.log(`\n📈 Success Rate Comparison\n`);
  console.log('Week 1 Goal: 90-95% success rate');
  console.log('Current Baseline: ~65% (regex only)\n');

  const results = await testRecipeImportBatch(urls);
  const rate = results.summary.avgSuccessRate;

  const baseline = 65;
  const improvement = rate - baseline;
  const improvementPercent = ((improvement / baseline) * 100).toFixed(1);

  console.log(`Actual Week 1 Result: ${rate.toFixed(1)}%`);
  console.log(`Improvement over baseline: +${improvement.toFixed(1)}% (+${improvementPercent}%)`);

  if (rate >= 90) {
    console.log('✅ Target achieved! 🎉');
  } else if (rate >= 80) {
    console.log('⚠️  Close to target. Fine-tuning may help.');
  } else {
    console.log('❌ Below target. Check error logs.');
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║      Week 1: Recipe Importer Test Suite              ║');
  console.log('║    Cheerio DOM Parsing + Multi-Strategy Extraction   ║');
  console.log('╚══════════════════════════════════════════════════════╝');

  // Get test mode from command line argument
  const mode = process.argv[2] || 'batch';
  const urlArg = process.argv[3];

  try {
    switch (mode) {
      case 'single':
        if (!urlArg) {
          console.error('Usage: npx tsx test-recipe-importer.ts single <URL>');
          process.exit(1);
        }
        await testSingleURL(urlArg);
        break;

      case 'batch':
        await testBatch(TEST_URLS);
        break;

      case 'perf':
        await testPerformanceComparison(TEST_URLS);
        break;

      case 'compare':
        await testSuccessRateComparison(TEST_URLS);
        break;

      default:
        console.log('Available test modes:');
        console.log('  single <URL>  - Test a single URL');
        console.log('  batch         - Test all URLs and show results');
        console.log('  perf          - Performance comparison');
        console.log('  compare       - Success rate vs baseline');
        console.log('\nExample:');
        console.log('  npx tsx test-recipe-importer.ts batch');
        console.log('  npx tsx test-recipe-importer.ts single https://www.allrecipes.com/recipe/20144/');
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
