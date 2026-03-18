/**
 * Equipment inference utility
 * Detects required equipment from ingredient names, modifiers, and cooking states
 */

export interface EquipmentInference {
  equipment: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface EquipmentCategory {
  id: string;
  tier: 0 | 1 | 2 | 3 | 4;
  label: string;
  emoji: string;
  description: string;
  items: string[];
}

/**
 * Tiered equipment categories for the Cooking Setup filter.
 * Tier 0 = Raw/No Prep, Tier 4 = Full Electronic kitchen.
 * Filter logic is "at least": a recipe is eligible if every piece of
 * equipment it requires is present in the user's selected set.
 */
export const EQUIPMENT_CATEGORIES: EquipmentCategory[] = [
  {
    id: 'raw',
    tier: 0,
    label: 'No Prep / Raw',
    emoji: '🥗',
    description: 'No heat or tools needed — edible straight away',
    items: ['raw'],
  },
  {
    id: 'manual',
    tier: 1,
    label: 'Manual',
    emoji: '🔪',
    description: 'Muscle-powered tools only — no heat, no electricity',
    items: [
      'knife',
      'cutting board',
      'mortar and pestle',
      'grater',
      'peeler',
      'mandoline',
      'whisk',
      'rolling pin',
      'colander',
      'can opener',
      'salad spinner',
    ],
  },
  {
    id: 'fire',
    tier: 2,
    label: 'Fire / Thermal',
    emoji: '🔥',
    description: 'Open flame or gas — no socket required',
    items: [
      'open fire',
      'gas stovetop',
      'charcoal grill',
      'gas wok',
      'charcoal smoker',
    ],
  },
  {
    id: 'electric',
    tier: 3,
    label: 'Electric',
    emoji: '⚡',
    description: 'Plugs in — simple motor or heating element, no circuit board',
    items: [
      'electric stovetop',
      'electric grill',
      'toaster',
      'electric kettle',
      'hand mixer',
      'juicer',
      'immersion blender',
    ],
  },
  {
    id: 'electronic',
    tier: 4,
    label: 'Electronic',
    emoji: '💡',
    description: 'Has a circuit board — digital controls or programmable logic',
    items: [
      'blender',
      'food processor',
      'microwave',
      'air fryer',
      'instant pot',
      'deep fryer',
      'rice cooker',
      'sous vide',
    ],
  },
];

/**
 * Flat list of all available equipment strings (derived from categories).
 * Kept for backward compatibility with existing code.
 */
export const AVAILABLE_EQUIPMENT: string[] = EQUIPMENT_CATEGORIES.flatMap(
  (cat) => cat.items
);

/**
 * Look up which category/tier an equipment item belongs to.
 */
export function getEquipmentTier(equipmentId: string): number {
  const cat = EQUIPMENT_CATEGORIES.find((c) => c.items.includes(equipmentId));
  return cat ? cat.tier : -1;
}

const EQUIPMENT_KEYWORDS: Record<string, string[]> = {
  // Raw
  raw: ['raw', 'uncooked', 'fresh', 'no cook', 'no-cook'],

  // Manual
  knife: ['slice', 'sliced', 'dice', 'diced', 'chop', 'chopped', 'mince', 'minced', 'julienne', 'cut'],
  'cutting board': ['chop', 'dice', 'slice', 'cut'],
  'mortar and pestle': ['mortar', 'pestle', 'ground', 'crush', 'crushed', 'pound', 'pounded'],
  grater: ['grate', 'grated', 'shred', 'shredded', 'zest', 'zested'],
  peeler: ['peel', 'peeled'],
  mandoline: ['mandoline', 'mandolin', 'thin slice', 'paper thin'],
  whisk: ['whisk', 'whisked', 'beat', 'beaten'],
  'rolling pin': ['roll', 'rolled', 'flatten', 'flattened'],
  colander: ['drain', 'drained', 'rinse', 'rinsed', 'strain', 'strained'],
  'can opener': ['canned', 'tinned', 'tin of', 'can of'],
  'salad spinner': ['salad spinner', 'spin dry'],

  // Fire / Thermal
  'open fire': ['open fire', 'campfire', 'camp fire', 'fire pit', 'coal'],
  'gas stovetop': ['gas stove', 'gas range', 'gas burner', 'gas hob'],
  'charcoal grill': ['charcoal grill', 'charcoal bbq', 'charcoal barbecue', 'bbq', 'barbecue', 'grill', 'grilled'],
  'gas wok': ['gas wok', 'wok', 'wok fried', 'stir fry', 'stir-fry'],
  'charcoal smoker': ['smoker', 'smoked', 'smoking', 'wood smoke'],

  // Electric
  'electric stovetop': ['electric stove', 'electric range', 'electric hob', 'coil stove', 'radiant stove', 'stovetop', 'pan fry', 'pan-fry', 'sauté', 'saute', 'boil', 'boiled', 'simmer', 'simmered', 'fry', 'fried'],
  'electric grill': ['electric grill', 'contact grill', 'panini press', 'george foreman'],
  toaster: ['toast', 'toasted', 'toaster'],
  'electric kettle': ['kettle', 'boiling water', 'hot water'],
  'hand mixer': ['hand mixer', 'stand mixer', 'electric mixer', 'beat', 'whip', 'whipped cream'],
  juicer: ['juice', 'juiced', 'extract juice', 'cold press', 'centrifugal'],
  'immersion blender': ['immersion blend', 'hand blend', 'stick blend', 'stick blender'],

  // Electronic
  blender: ['blend', 'blended', 'puree', 'pureed', 'smoothie', 'slurry', 'high speed blend'],
  'food processor': ['food processor', 'process', 'processed', 'chop finely'],
  microwave: ['microwave', 'microwaved'],
  'air fryer': ['air fry', 'air-fry', 'air fried', 'air fryer'],
  'instant pot': ['instant pot', 'pressure cook', 'pressure cooked', 'pressure cooker'],
  'deep fryer': ['deep fry', 'deep-fry', 'deep fried', 'deep fryer'],
  'rice cooker': ['rice cooker', 'rice machine'],
  'sous vide': ['sous vide', 'sous-vide', 'water bath', 'immersion circulator'],
};

/**
 * Infer equipment from ingredient details and cooking state
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
        if (cookingState.toLowerCase().includes(keyword)) highConfidenceMatches++;
      }
    }
  }

  // Knife implied when there's chopping/cutting but not a purely liquid recipe
  const isLiquidRecipe = textToCheck.includes('blend') || textToCheck.includes('smoothie') || textToCheck.includes('juice');
  if (!isLiquidRecipe && inferredEquipment.size > 0 && !inferredEquipment.has('raw')) {
    inferredEquipment.add('knife');
    inferredEquipment.add('cutting board');
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

  const suggested = Object.entries(equipmentFrequency)
    .sort(([, freqA], [, freqB]) => freqB - freqA)
    .map(([eq]) => eq);

  return { suggested, frequency: equipmentFrequency };
}

/**
 * Infer equipment from recipe instructions text
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
