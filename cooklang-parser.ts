// Cooklang Recipe Parser - Zero dependency parser for Cooklang format
// Single file, drop-in component for any app

export interface Ingredient {
  name: string;
  quantity?: number;
  unit?: string;
  originalText?: string;
}

export interface Cookware {
  name: string;
  originalText?: string;
}

export interface Timer {
  duration: number;
  unit: 'minutes' | 'hours' | 'seconds';
  originalText?: string;
}

export interface Step {
  text: string;
  ingredients: Ingredient[];
  cookware: Cookware[];
  timers: Timer[];
}

export interface Recipe {
  title: string;
  description?: string;
  author?: string;
  source?: string;
  image?: string;
  cuisine?: string;
  course?: string;
  metadata: Record<string, string>;
  ingredients: Ingredient[];
  cookware: Cookware[];
  steps: Step[];
  servings?: string;
  time?: string;
  prepTime?: string;
  cookTime?: string;
  yields?: string;
  nutrition?: {
    energy?: string;
    carbs?: string;
    protein?: string;
    fat?: string;
    sugar?: string;
    fiber?: string;
    sodium?: string;
    saturatedFat?: string;
  };
}

export class CooklangParser {
  /**
   * Parse Cooklang text and return structured recipe
   */
  parse(content: string): Recipe {
    const recipe: Recipe = {
      title: '',
      metadata: {},
      ingredients: [],
      cookware: [],
      steps: [],
    };

    // Split into YAML front matter and content
    let yamlMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    let recipeContent = content;
    
    if (yamlMatch) {
      // Parse YAML front matter
      const yamlContent = yamlMatch[1];
      recipeContent = yamlMatch[2];
      
      this.parseYAMLMetadata(yamlContent, recipe);
    } else {
      // Parse metadata lines starting with >>
      const lines = content.split('\n');
      let contentStartIdx = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('>>')) {
          const metaLine = line.substring(2).trim();
          const [key, ...valueParts] = metaLine.split(':');
          const value = valueParts.join(':').trim();
          const cleanKey = key.trim().toLowerCase();
          
          if (cleanKey === 'title') recipe.title = value;
          else if (cleanKey === 'servings') recipe.servings = value;
          else if (cleanKey === 'time') recipe.time = value;
          else if (cleanKey === 'source') recipe.source = value;
          else if (cleanKey === 'author') recipe.author = value;
          else if (cleanKey === 'description') recipe.description = value;
          else if (cleanKey === 'image') recipe.image = value;
          else if (cleanKey === 'cuisine') recipe.cuisine = value;
          else if (cleanKey === 'course') recipe.course = value;
          else if (cleanKey === 'preptime' || cleanKey === 'prep time') recipe.prepTime = value;
          else if (cleanKey === 'cooktime' || cleanKey === 'cook time') recipe.cookTime = value;
          else if (cleanKey === 'yields') recipe.yields = value;
          else if (cleanKey.startsWith('nutrition:') || cleanKey.startsWith('nutrition_')) {
            const nutritionKey = cleanKey.replace('nutrition:', '').replace('nutrition_', '');
            if (!recipe.nutrition) recipe.nutrition = {};
            (recipe.nutrition as any)[nutritionKey] = value;
          }
          
          recipe.metadata[cleanKey] = value;
        } else if (line !== '' && !line.startsWith('--')) {
          contentStartIdx = i;
          recipeContent = lines.slice(i).join('\n');
          break;
        }
      }
    }

    // Parse steps and extract ingredients/cookware
    const steps = this.extractSteps(recipeContent);
    const allIngredients = new Map<string, Ingredient>();
    const allCookware = new Map<string, Cookware>();

    // Try to extract nutrition from metadata as a fallback
    this.extractNutritionFromMetadata(recipe);

    recipe.steps = steps.map((stepText) => {
      const step: Step = {
        text: '',
        ingredients: [],
        cookware: [],
        timers: [],
      };

      // First, extract all timers and ingredients/cookware while preserving their positions
      const timerRegex = /~\{([^}]*)\}/g;
      let timerMatch;
      while ((timerMatch = timerRegex.exec(stepText)) !== null) {
        const timerStr = timerMatch[1] || '1 minute';
        const timer = this.parseTimer(timerStr);
        step.timers.push(timer);
      }

      // Extract ingredients
      const ingredientRegex = /@([a-zA-Z\s]+)(?:\{([^}]*)\})?/g;
      let match;
      while ((match = ingredientRegex.exec(stepText)) !== null) {
        const name = match[1].trim();
        const quantityStr = match[2] || '';
        
        let quantity: number | undefined;
        let unit: string | undefined;
        
        if (quantityStr) {
          const quantityMatch = quantityStr.match(/^([0-9./-]+)(?:%|\s)?(.*)$/);
          if (quantityMatch) {
            quantity = this.parseQuantity(quantityMatch[1]);
            unit = quantityMatch[2].trim() || undefined;
          }
        }
        
        const ingredient: Ingredient = {
          name,
          quantity,
          unit,
          originalText: match[0],
        };
        
        step.ingredients.push(ingredient);
        allIngredients.set(name.toLowerCase(), ingredient);
      }

      // Extract cookware
      const cookwareRegex = /#([a-zA-Z\s]+)(?:\{([^}]*)\})?/g;
      while ((match = cookwareRegex.exec(stepText)) !== null) {
        const name = match[1].trim();
        const cookware: Cookware = {
          name,
          originalText: match[0],
        };
        step.cookware.push(cookware);
        allCookware.set(name.toLowerCase(), cookware);
      }

      // Clean text: keep ingredients, cookware, and timers inline but format them nicely
      step.text = stepText
        // Format ingredients as [ingredient name - qty unit]
        .replace(/@([a-zA-Z\s]+)(?:\{([^}]*)\})?/g, (match, name, quantityStr) => {
          const cleanName = name.trim();
          if (quantityStr) {
            const quantityMatch = quantityStr.match(/^([0-9./-]+)(?:%|\s)?(.*)$/);
            if (quantityMatch) {
              const qty = quantityMatch[1];
              const unit = quantityMatch[2].trim();
              return `[${cleanName}${qty ? ': ' + qty : ''}${unit ? ' ' + unit : ''}]`;
            }
          }
          return `[${cleanName}]`;
        })
        // Format cookware as {cookware name}
        .replace(/#([a-zA-Z\s]+)(?:\{[^}]*\})?/g, (match, name) => {
          return `{${name.trim()}}`;
        })
        // Format timers as ⏱ duration unit
        .replace(/~\{([^}]*)\}/g, (match, timerStr) => {
          const timer = this.parseTimer(timerStr || '1 minute');
          return `⏱${timer.duration}${timer.unit[0].toUpperCase()}`;
        })
        .replace(/\s+/g, ' ')
        .trim();

      return step;
    });

    recipe.ingredients = Array.from(allIngredients.values());
    recipe.cookware = Array.from(allCookware.values());

    return recipe;
  }

  /**
   * Parse YAML front matter from recipe
   */
  private parseYAMLMetadata(yaml: string, recipe: Recipe): void {
    const lines = yaml.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      const [key, ...valueParts] = trimmed.split(':');
      const value = valueParts.join(':').trim();
      
      if (!key || !value) continue;
      
      const cleanKey = key.trim().toLowerCase();
      
      if (cleanKey === 'title') recipe.title = value;
      else if (cleanKey === 'servings') recipe.servings = value;
      else if (cleanKey === 'time required' || cleanKey === 'time') recipe.time = value;
      else if (cleanKey === 'cook time' || cleanKey === 'cooktime') recipe.cookTime = value;
      else if (cleanKey === 'prep time' || cleanKey === 'preptime') recipe.prepTime = value;
      else if (cleanKey === 'source') recipe.source = value;
      else if (cleanKey === 'author') recipe.author = value;
      else if (cleanKey === 'description') recipe.description = value;
      else if (cleanKey === 'image') recipe.image = value;
      else if (cleanKey === 'cuisine') recipe.cuisine = value;
      else if (cleanKey === 'course') recipe.course = value;
      else if (cleanKey === 'yields') recipe.yields = value;
      else if (cleanKey.startsWith('nutrition:') || cleanKey.startsWith('nutrition_')) {
        const nutritionKey = cleanKey.replace('nutrition:', '').replace('nutrition_', '');
        if (!recipe.nutrition) recipe.nutrition = {};
        (recipe.nutrition as any)[nutritionKey] = value;
      }
      
      recipe.metadata[cleanKey] = value;
    }
  }

  /**
   * Parse quantity string like "1", "2.5", "1-3", "1(24-ounce)"
   */
  private parseQuantity(str: string): number | undefined {
    // Handle ranges like "1-3"
    if (str.includes('-')) {
      const parts = str.split('-');
      const first = parseFloat(parts[0]);
      const second = parseFloat(parts[1]);
      if (!isNaN(first) && !isNaN(second)) {
        return first; // Return the first value for simplicity
      }
    }
    
    // Handle fractions or regular numbers
    const num = parseFloat(str);
    return isNaN(num) ? undefined : num;
  }

  /**
   * Extract steps from recipe content, skipping comments
   */
  private extractSteps(content: string): string[] {
    const steps: string[] = [];
    let currentStep = '';
    
    // Remove block comments
    let cleaned = content.replace(/\[-[\s\S]*?-\]/g, '');
    
    const lines = cleaned.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines and comment lines
      if (!trimmed || trimmed.startsWith('--') || trimmed.startsWith('>')) {
        if (currentStep.trim()) {
          steps.push(currentStep.trim());
          currentStep = '';
        }
        continue;
      }
      
      // Remove inline comments
      const commentIdx = trimmed.indexOf('--');
      const cleanLine = commentIdx !== -1 ? trimmed.substring(0, commentIdx) : trimmed;
      
      if (cleanLine.trim()) {
        currentStep += (currentStep ? ' ' : '') + cleanLine;
      }
    }
    
    if (currentStep.trim()) {
      steps.push(currentStep.trim());
    }
    
    return steps;
  }

  /**
   * Parse a timer duration string and return structured timer
   * Handles formats like "13%minutes", "1%minute", "1-3%minutes"
   */
  private parseTimer(text: string): Timer {
    // Handle "13%minutes" format
    const match = text.match(/^([0-9./-]+)(?:%|\s+)?(.*)$/i);
    
    let duration = 1;
    let unit: 'minutes' | 'hours' | 'seconds' = 'minutes';
    
    if (match) {
      duration = this.parseQuantity(match[1]) || 1;
      const unitStr = match[2].trim().toLowerCase();
      
      if (unitStr.startsWith('hour')) {
        unit = 'hours';
      } else if (unitStr.startsWith('sec')) {
        unit = 'seconds';
      } else {
        unit = 'minutes';
      }
    }
    
    return {
      duration,
      unit,
      originalText: text,
    };
  }

  /**
   * Extract nutrition data from metadata object
   * Handles formats like "nutrition: calories: 641 kcal fat: 35 g..."
   */
  private extractNutritionFromMetadata(recipe: Recipe): void {
    const nutritionStr = recipe.metadata['nutrition'];
    if (!nutritionStr) return;

    // Parse nutrition string like "calories: 641 kcal fat: 35 g saturated fat: 6 g..."
    if (!recipe.nutrition) recipe.nutrition = {};

    // Extract specific values
    const caloriesMatch = nutritionStr.match(/calories?:\s*([0-9.]+)/i);
    if (caloriesMatch) recipe.nutrition.energy = caloriesMatch[1] + ' kcal';

    const carbsMatch = nutritionStr.match(/carbohydrates?:\s*([0-9.]+)/i);
    if (carbsMatch) recipe.nutrition.carbs = carbsMatch[1] + ' g';

    const proteinMatch = nutritionStr.match(/protein:\s*([0-9.]+)/i);
    if (proteinMatch) recipe.nutrition.protein = proteinMatch[1] + ' g';

    const fatMatch = nutritionStr.match(/^fat:\s*([0-9.]+)|[^d]fat:\s*([0-9.]+)/m);
    if (fatMatch) recipe.nutrition.fat = (fatMatch[1] || fatMatch[2]) + ' g';

    const sugarMatch = nutritionStr.match(/sugar:\s*([0-9.]+)/i);
    if (sugarMatch) recipe.nutrition.sugar = sugarMatch[1] + ' g';

    const fiberMatch = nutritionStr.match(/fiber:\s*([0-9.]+)/i);
    if (fiberMatch) recipe.nutrition.fiber = fiberMatch[1] + ' g';

    const sodiumMatch = nutritionStr.match(/sodium:\s*([0-9.]+)/i);
    if (sodiumMatch) recipe.nutrition.sodium = sodiumMatch[1] + ' mg';

    const satFatMatch = nutritionStr.match(/saturated\s+fat:\s*([0-9.]+)/i);
    if (satFatMatch) recipe.nutrition.saturatedFat = satFatMatch[1] + ' g';
  }
}

// Export standalone functions for quick usage
export function parseCooklang(content: string): Recipe {
  const parser = new CooklangParser();
  return parser.parse(content);
}

export async function parseCooklangFile(file: File | Blob): Promise<Recipe> {
  const content = await file.text();
  return parseCooklang(content);
}

export function isValidCooklang(content: string): boolean {
  return (
    content.includes('@') ||
    content.includes('#') ||
    content.includes('~') ||
    content.includes('>>')
  );
}
