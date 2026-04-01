import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CAL_TO_KJ = 4.184;

export function formatEnergy(calories: number, unit: 'kcal' | 'kJ') {
  if (unit === 'kJ') return `${Math.round(calories * CAL_TO_KJ).toLocaleString()} kJ`;
  return `${Math.round(calories).toLocaleString()} kcal`;
}

/** Minimal food item shape used across the ingredients hub. */
export interface FoodItem {
  id: string;
  name: string;
  common_name: string;
  energy_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  image: string | null;
  is_favorite: boolean;
  is_in_pantry: boolean;
  category?: string;
  quantity?: string;
  user_id?: string | null;
  is_curated?: boolean;
  price?: number | null;
  stocked?: boolean | null;
}

// Replaces cooking method words in food names with 🔥 for display purposes.
// e.g. "Chicken, cooked, roasted" → "Chicken 🔥"
// e.g. "Kale, boiled" → "Kale 🔥"
export function formatFoodName(name: string): string {
  const cookingWords = [
    'cooked', 'boiled', 'fried', 'roasted', 'steamed', 'baked',
    'grilled', 'sautéed', 'sauteed', 'smoked', 'braised', 'stewed',
    'broiled', 'poached', 'blanched', 'toasted', 'microwaved', 'barbecued',
  ];
  let result = name;
  for (const word of cookingWords) {
    // Handle "(Cooked)", "( cooked )", "(cooked, roasted)" style — strip the whole parenthetical
    result = result.replace(new RegExp(`,?\\s*\\(\\s*${word}\\s*\\)`, 'gi'), ' 🔥');
    // Handle plain ", cooked" or " cooked" style
    result = result.replace(new RegExp(`,?\\s*\\b${word}\\b`, 'gi'), ' 🔥');
  }
  // Collapse multiple fire emojis into one
  result = result.replace(/(🔥\s*)+/g, '🔥 ');
  // Clean up trailing commas, extra spaces
  return result.replace(/,\s*$/, '').replace(/\s{2,}/g, ' ').trim();
}
