import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
    result = result.replace(new RegExp(`,?\\s*\\b${word}\\b`, 'gi'), ' 🔥');
  }
  // Collapse multiple fire emojis into one
  result = result.replace(/(🔥\s*)+/g, '🔥 ');
  // Clean up trailing commas, extra spaces
  return result.replace(/,\s*$/, '').replace(/\s{2,}/g, ' ').trim();
}
