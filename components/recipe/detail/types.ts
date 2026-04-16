export interface Recipe {
  id: string;
  title: string;
  image: string | null;
  type: string;
  calories: number;
  energy_kj: number;
  protein: number;
  fat: number;
  carbs: number;
  prep_time: number;
  cook_time: number;
  servings: number;
  diet: string[];
  is_favorite: boolean;
  difficulty: string;
  tags: string[];
  source?: string;
  micronutrients?: Record<string, number>;
  phytonutrients?: Record<string, string | { description: string; sources: string[] }>;
  user_id?: string;
}

export interface Ingredient {
  id: string;
  item: string;
  amount: string;
  base_ingredient: string;
  weight_g: number;
  food_item_id?: string;
  food_items?: {
    id: string;
    name?: string;
    common_name?: string;
    energy_kcal?: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
    micronutrients?: Record<string, number>;
    phytonutrients?: Record<string, string | { description: string; sources: string[] }>;
    portions?: { label: string; weight_g: number }[];
    [key: string]: unknown;
  };
}

export interface Instruction {
  step_text: string;
  step_order: number;
}

export interface CalculatedNutrition {
  calories: number;
  energy_kj: number;
  protein: number;
  carbs: number;
  fat: number;
  micronutrients: Record<string, number>;
  phytonutrients: Record<string, string | { description: string; sources: string[] }>;
}

type FoodItemMatch = {
  id?: string;
  name: string;
  common_name?: string;
  category?: string | null;
  image?: string | null;
  energy_kcal: number;
  energy_kj: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  micronutrients: Record<string, number>;
  phytonutrients?: Record<string, string>;
  source: 'local' | 'usda';
  fdcId?: number;
  portions?: { label: string; weight_g: number }[];
};

export interface RecipeDetailData {
  recipe: Recipe | null;
  ingredients: Ingredient[];
  instructions: Instruction[];
  loading: boolean;
  isOwner: boolean;

  // Section state
  activeSection: 'recipe' | 'nutrition' | 'related' | 'management' | null;
  setActiveSection: React.Dispatch<
    React.SetStateAction<'recipe' | 'nutrition' | 'related' | 'management' | null>
  >;

  // Nutrition
  calculatedNutrition: CalculatedNutrition;
  selectedServings: number;
  setSelectedServings: React.Dispatch<React.SetStateAction<number>>;
  totalWeight: number;

  // Thresholds
  mineralThreshold: 50 | 75 | 100;
  setMineralThreshold: React.Dispatch<React.SetStateAction<50 | 75 | 100>>;
  waterSolubleThreshold: 50 | 75 | 100;
  setWaterSolubleThreshold: React.Dispatch<React.SetStateAction<50 | 75 | 100>>;
  storedVitaminThreshold: 50 | 75 | 100;
  setStoredVitaminThreshold: React.Dispatch<React.SetStateAction<50 | 75 | 100>>;

  // Smart Match
  matchedIngredients: Record<string, FoodItemMatch>;
  setMatchedIngredients: React.Dispatch<React.SetStateAction<Record<string, FoodItemMatch>>>;
  flippedCards: Record<string, boolean>;
  setFlippedCards: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  skippedIngredients: Record<string, boolean>;
  setSkippedIngredients: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  acceptedMatches: Record<string, boolean>;
  setAcceptedMatches: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  mappingStep: 'FOOD_MATCH' | 'INGREDIENT_REVIEW' | 'PORTION_MATCH';
  setMappingStep: React.Dispatch<
    React.SetStateAction<'FOOD_MATCH' | 'INGREDIENT_REVIEW' | 'PORTION_MATCH'>
  >;
  stepTwoInputs: Record<string, { multiplier: string; measure: string; isSaving?: boolean }>;
  setStepTwoInputs: React.Dispatch<
    React.SetStateAction<
      Record<string, { multiplier: string; measure: string; isSaving?: boolean }>
    >
  >;
  stepTwoSaved: Record<string, boolean>;
  setStepTwoSaved: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  smartMatchRunning: boolean;

  // USDA
  usdaResults: Record<string, FoodItemMatch[]>;
  setUsdaResults: React.Dispatch<React.SetStateAction<Record<string, FoodItemMatch[]>>>;
  usdaLoading: Record<string, boolean>;
  setUsdaLoading: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  usdaExpanded: Record<string, boolean>;
  setUsdaExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;

  // Related
  relatedRecipes: Recipe[];
  loadingRelated: boolean;

  // Tags
  showTagsDialog: boolean;
  setShowTagsDialog: React.Dispatch<React.SetStateAction<boolean>>;

  // Actions
  toggleFavorite: () => Promise<void>;
  runSmartMatch: () => Promise<void>;
  runAutoMatch: () => Promise<void>;
  finalizeRecipeNutrition: () => Promise<void>;
  processAcceptIngredient: (ing: Ingredient, matchedItem: FoodItemMatch) => void;
  handleEditClick: () => void;
  setRecipe: React.Dispatch<React.SetStateAction<Recipe | null>>;
  setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>;
  fetchRecipeDetails: () => Promise<void>;

  // Helpers
  findNutrientMatch: (record: Record<string, unknown>, key: string) => string | null;

  // User preferences forwarded
  energyUnit: string;
  nutrientDisplayMode: string;
  userRDAs: Record<string, number> | null;
  profile: {
    name: string;
    nickname: string;
    gender: 'male' | 'female';
    age: number | '';
    weight: number | '';
    height: number | '';
    goal: import('@/lib/utils/nutrition-calculator').GoalType;
    dietType: string;
    activityLevel: import('@/lib/utils/nutrition-calculator').ActivityLevel;
    nutrientStrategy: import('@/lib/utils/nutrition-calculator').NutrientStrategy;
    exclusions: string[];
    healthConditions: string[];
    country: string;
    familyMembers: unknown[];
    isPremium: boolean;
    isAdmin: boolean;
  };

  // Callbacks
  onBack?: () => void;
  onShare?: (recipe: Recipe) => void;
  onRemix?: (recipe: Recipe, ingredients: Ingredient[], instructions: Instruction[]) => void;
}
