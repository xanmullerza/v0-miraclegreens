export interface FoodItem {
    id: string;
    name: string;
    common_name: string;
    energy_kcal: number;
    energy_kj: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    image: string | null;
    micronutrients: Record<string, number>;
    phytonutrients?: Record<string, string>;
    category: string;
    is_favorite?: boolean;
    quantity?: string;
    is_in_pantry?: boolean;
    user_id?: string | null;
    details?: import('@/lib/data/food-details').FoodDetail;
    portions?: { label: string; weight_g: number }[];
    pantry_id?: string;
}

export type ActiveFoodSection = 'facts' | 'nutrition' | 'recipes' | 'management' | null;

export interface FoodDetailContextType {
    // Core data
    food: FoodItem | null;
    loading: boolean;
    id: string;

    // Permissions & user pref
    user: any;
    isAdmin: boolean;
    energyUnit: 'kcal' | 'kJ';
    nutrientDisplayMode: 'percentage' | 'value' | 'both';
    dailyTargets: any;
    userRDAs: any;

    // Current selections
    amount: number;
    setAmount: (val: number) => void;
    selectedPortion: { label: string, weight_g: number } | null;
    setSelectedPortion: (val: { label: string, weight_g: number } | null) => void;
    activeSection: ActiveFoodSection;
    setActiveSection: React.Dispatch<React.SetStateAction<ActiveFoodSection>>;
    
    // Quick Add
    quickAddQty: string;
    setQuickAddQty: (val: string) => void;
    quickAddWeight: string;
    setQuickAddWeight: (val: string) => void;
    quickAddUnit: string;
    setQuickAddUnit: (val: string) => void;
    quickAddMode: 'pantry' | 'shopping';
    setQuickAddMode: (val: 'pantry' | 'shopping') => void;
    handleQuickAdd: () => void;

    // Recipes
    foodRecipes: any[];
    recipesLoading: boolean;

    // Interaction toggles
    breakdownNutrient: string | null;
    setBreakdownNutrient: (val: string | null) => void;
    showAdvancedNutrition: boolean;
    setShowAdvancedNutrition: (val: boolean) => void;
    managementSubView: 'pantry' | 'shopping' | null;
    setManagementSubView: (val: 'pantry' | 'shopping' | null) => void;

    // Actions
    toggleFavorite: () => void;
    handleDelete: () => void;
    fetchFoodDetails: () => void;

    // Edit block states
    isEditing: boolean;
    setIsEditing: (val: boolean) => void;
    editName: string;
    setEditName: (val: string) => void;
    editCommonName: string;
    setEditCommonName: (val: string) => void;
    editCategory: string;
    setEditCategory: (val: string) => void;
    editImage: string;
    setEditImage: (val: string) => void;
    editNutrientText: string;
    setEditNutrientText: (val: string) => void;
    editServingText: string;
    setEditServingText: (val: string) => void;
    uploading: boolean;
    saveLoading: boolean;
    handleEditStart: () => void;
    handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleEditSave: () => void;
}
