import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface ParseRequest {
  foodId: string; // Cronometer food ID (numeric or URL)
  url?: string;   // Optional full Cronometer URL
}

interface ParsedNutrition {
  name: string;
  common_name?: string;
  energy_kcal?: number;
  energy_kj?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  servings?: Array<{ label: string; weight_g: number }>;
  micronutrients: Record<string, number>;
}

/**
 * POST /api/cronometer/parse
 * 
 * Accepts a Cronometer food ID and triggers the N8N parser workflow.
 * Returns parsed nutrition data in JSON format for review.
 * 
 * Request body:
 * {
 *   "foodId": "1" | "2604" | "1&amount=100&measure=0",
 *   "url": "https://cronometer.com/food.html?food=1&amount=100&measure=0" (optional)
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": { ParsedNutrition object },
 *   "message": "Food parsed successfully"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client at request time (not build time)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body: ParseRequest = await request.json();
    const { foodId, url } = body;

    if (!foodId && !url) {
      return NextResponse.json(
        { error: 'Either foodId or url is required' },
        { status: 400 }
      );
    }

    // Build Cronometer URL if not provided
    const cronometerUrl = url || `https://cronometer.com/food.html?food=${foodId}&amount=100&measure=0`;

    // Extract food ID for storage (remove query params)
    const cleanFoodId = foodId.split('&')[0];

    console.log(`[Cronometer Parser] Parsing food ID: ${cleanFoodId} from URL: ${cronometerUrl}`);

    // Call N8N webhook to parse the Cronometer page
    // The N8N workflow will:
    // 1. Fetch the HTML from the URL
    // 2. Parse nutrition facts
    // 3. Return structured JSON
    const n8nWebhookUrl = process.env.N8N_CRONOMETER_WEBHOOK_URL;

    if (!n8nWebhookUrl) {
      return NextResponse.json(
        { error: 'N8N webhook URL not configured' },
        { status: 500 }
      );
    }

    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contentType: 'cronometer-food',
        url: cronometerUrl,
        foodId: cleanFoodId,
      }),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error(`[Cronometer Parser] N8N error: ${n8nResponse.status}`, errorText);
      return NextResponse.json(
        { error: 'Failed to parse food from N8N workflow', details: errorText },
        { status: 500 }
      );
    }

    const parsedData: ParsedNutrition = await n8nResponse.json();

    // Calculate auto common name if not provided
    if (!parsedData.common_name && parsedData.name) {
      parsedData.common_name = autoCommonName(parsedData.name);
    }

    console.log(`[Cronometer Parser] Successfully parsed: ${parsedData.name}`);

    // Store in cronometer_imports table for review
    const { data: importRecord, error: dbError } = await supabase
      .from('cronometer_imports')
      .upsert(
        {
          cronometer_food_id: cleanFoodId,
          source_url: cronometerUrl,
          parsed_data: parsedData,
          status: 'pending',
        },
        { onConflict: 'cronometer_food_id' }
      )
      .select()
      .single();

    if (dbError) {
      console.error('[Cronometer Parser] Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to store parsed data', details: dbError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: parsedData,
      importId: importRecord?.id,
      message: 'Food parsed successfully and saved to staging table',
    });
  } catch (error) {
    console.error('[Cronometer Parser] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Auto-generate common name from official name (Cronometer format)
 * e.g., "Sour dressing, non-butterfat, cultured, filled cream-type" → "Sour dressing"
 * or "Chives, Raw" → "Chives"
 */
function autoCommonName(officialName: string): string {
  if (!officialName) return '';
  let n = officialName.trim();
  n = n.replace(/,+\s*$/, ''); // Remove trailing commas
  
  // If contains 'raw' or 'fresh', use part before comma
  if (/,(\s*)?(raw|fresh)/i.test(n)) {
    return n.split(/,\s*(raw|fresh)/i)[0].trim();
  }
  
  // If contains any other word after comma, treat as cooked
  if (/,\s*([a-zA-Z]+)/.test(n)) {
    return n.split(',')[0].trim() + ' (cooked)';
  }
  
  // Default: use as is or just part before first comma
  return n.split(',')[0].trim();
}
