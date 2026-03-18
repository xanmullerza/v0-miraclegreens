/**
 * Equipment inference utility
 * Detects required equipment from ingredient names, modifiers, and cooking states
 */

export interface EquipmentInference {
  equipment: string[];
  confidence: 'high' | 'medium' | 'low';
}

const EQUIPMENT_KEYWORDS: Record<string, string[]> = {
  blender: ['blend', 'blended', 'puree', 'pureed', 'smoothie', 'slurry'],
  'food processor': ['process', 'processed', 'chop finely', 'minced'],
  wok: ['wok', 'stir fry', 'stir-fry', 'wok fried'],
  oven: ['bake', 'baked', 'roast', 'roasted', 'broil', 'broiled'],
  stovetop: ['pan fry', 'pan-fry', 'sauté', 'saute', 'boil', 'boiled', 'simmer', 'simmered', 'fry', 'fried'],
  'instant pot': ['instant pot', 'pressure cook', 'pressure cooked'],
  'air fryer': ['air fry', 'air-fry', 'air fried'],
  microwave: ['microwave', 'microwaved'],
  griller: ['grill', 'grilled', 'bbq', 'barbecue'],
  'deep fryer': ['deep fry', 'deep-fry', 'deep fried'],
  mortar: ['mortar', 'pestle', 'ground', 'crush', 'crushed'],
  'immersion blender': ['immersion blend', 'hand blend', 'stick blend'],
  juicer: ['juice', 'juiced', 'extract', 'extracted'],
};

/**
 * Standardized equipment types available for selection
 */
export const AVAILABLE_EQUIPMENT = [
  'knife',
  'stovetop',
  'oven',
  'blender',
  'food processor',
  'wok',
  'instant pot',
  'air fryer',
  'microwave',
  'griller',
  'deep fryer',
  'mortar',
  'immersion blender',
  'juicer',
  'can opener',
  'chopping board',
];

/**
 * Infer equipment from ingredient details and cooking state
 * @param ingredientName - name of the ingredient
 * @param modifier - how the ingredient is prepared (chopped, diced, etc.)
 * @param cookingState - cooking state of the ingredient
 * @param instructionText - recipe instruction text to check for equipment mentions
 * @returns Inferred equipment list and confidence level
 */
export function inferEquipmentFromIngredient(
  ingredientName: string = '',
  modifier: string = '',
  cookingState: string = '',
  instructionText: string = ''
): EquipmentInference {
  const inferredEquipment = new Set<string>();
  const textToCheck = (
    ingredientName + ' ' +
    modifier + ' ' +
    cookingState + ' ' +
    instructionText
  ).toLowerCase();

  let highConfidenceMatches = 0;
  let totalMatches = 0;

  for (const [equipment, keywords] of Object.entries(EQUIPMENT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (textToCheck.includes(keyword)) {
        inferredEquipment.add(equipment);
        totalMatches++;
        // High confidence for cooking states, medium for modifiers
        if (cookingState.toLowerCase().includes(keyword)) highConfidenceMatches++;
      }
    }
  }

  // Knife is almost always needed unless it's a smoothie/blended recipe
  const isLiquidRecipe = textToCheck.includes('blend') || textToCheck.includes('smoothie');
  if (!isLiquidRecipe && inferredEquipment.size > 0) {
    inferredEquipment.add('knife');
  }

  const confidence =
    highConfidenceMatches > 0 ? 'high' : totalMatches > 0 ? 'medium' : 'low';

  return {
    equipment: Array.from(inferredEquipment),
    confidence,
  };
}

/**
 * Infer equipment from an array of ingredients
 * @param ingredients - array of ingredient objects
 * @returns Combined equipment list with frequency info
 */
export function inferEquipmentFromIngredients(
  ingredients: Array<{
    food_item_name?: string;
    modifier?: string;
    cooking_state?: string;
  }>
): {
  suggested: string[];
  frequency: Record<string, number>;
} {
  const equipmentFrequency: Record<string, number> = {};

  ingredients.forEach((ing) => {
    const { equipment } = inferEquipmentFromIngredient(
      ing.food_item_name || '',
      ing.modifier || '',
      ing.cooking_state || '',
      ''
    );

    equipment.forEach((eq) => {
      equipmentFrequency[eq] = (equipmentFrequency[eq] || 0) + 1;
    });
  });

  // Sort by frequency and return top suggestions
  const suggested = Object.entries(equipmentFrequency)
    .sort(([, freqA], [, freqB]) => freqB - freqA)
    .map(([eq]) => eq);

  return { suggested, frequency: equipmentFrequency };
}

/**
 * Infer equipment from recipe instructions text
 * @param instructions - array of instruction texts
 * @returns Inferred equipment from instructions
 */
export function inferEquipmentFromInstructions(
  instructions: string[]
): string[] {
  const equipment = new Set<string>();
  const combinedText = instructions.join(' ').toLowerCase();

  for (const [eq, keywords] of Object.entries(EQUIPMENT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (combinedText.includes(keyword)) {
        equipment.add(eq);
        break;
      }
    }
  }

  return Array.from(equipment);
}

/**
 * Combine inferred equipment from ingredients and instructions
 * @param ingredients - ingredient array
 * @param instructions - instruction array
 * @returns Combined equipment suggestions
 */
export function inferEquipmentFromRecipe(
  ingredients: Array<{
    food_item_name?: string;
    modifier?: string;
    cooking_state?: string;
  }>,
  instructions: string[] = []
): string[] {
  const ingredientEquipment = new Set(
    inferEquipmentFromIngredients(ingredients).suggested
  );
  const instructionEquipment = new Set(
    inferEquipmentFromInstructions(instructions)
  );

  return Array.from(
    new Set([...ingredientEquipment, ...instructionEquipment])
  ).filter((eq) => AVAILABLE_EQUIPMENT.includes(eq));
}
