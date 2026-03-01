'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DidYouKnow } from '@/components/DidYouKnow';
import { cn } from '@/lib/utils';

import {
    Flame,
    Check,
    CheckCircle2,
    ChevronRight,
    RotateCcw,
    ChefHat,
    ShoppingBasket,
    Sparkles,
    Download,
    Egg,
    TrendingDown,
    Activity,
    Dumbbell,
    Armchair,
    Footprints,
    Zap,
    Beef,
    Droplet,
    Wheat,
    X,
    Clock,
    Filter,
    ChevronDown,
    Gem,
    Microscope,
    FlaskConical,
    Dna,
    LayoutGrid,
    Info,
    RefreshCw,
    Shield,
    User,
    Apple,
    Plus,
    Library,
    Scale,
    Calendar,
    Battery,
    Layers,
    Heart,
    Users,
    Camera,
    Database
} from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { HeaderActions } from '@/lib/context/header-actions-context';
import { CheckSquare, Square } from 'lucide-react';
import { useRDA } from '@/hooks/use-rda';
import { DietType, Recipe } from '@/lib/data/recipes';
import { nutrientInfo, NutrientInfo } from '@/lib/data/nutrient-info';
import { generateDailyPlan, DailyPlan, generateShoppingList, ShoppingItem, getRandomRecipeByType } from '@/lib/utils/meal-generator';
import { supabase } from '@/lib/supabase';
import { scaleIngredient } from '@/lib/utils/recipe-scaling';
import Link from 'next/link';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { getNutrientLevelStyles } from '@/lib/utils/nutrient-styles';
import { useRouter } from 'next/navigation';
import { useSearch } from '@/lib/context/search-context';
import { HeroSearch } from '@/components/ui/hero-search';

const showShop = false;

const BOOSTABLE_NUTRIENTS = [
    'Potassium', 'Magnesium', 'Calcium', 'Sodium', 'Iron',
    'Vitamin A', 'B1 (Thiamine)', 'B2 (Riboflavin)', 'B3 (Niacin)',
    'Vitamin C', 'Fiber', 'Energy', 'Protein', 'Carbs', 'Fat'
];

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

// --- HELPERS ---
const CAL_TO_KJ = 4.184;
type UnitType = 'kcal' | 'kJ';

type GoalType = 'lose-fat' | 'maintain' | 'build-muscle';
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active';

const formatEnergy = (calories: number, unit: UnitType, energyKj?: number) => {
    if (unit === 'kJ') {
        const value = energyKj !== undefined ? energyKj : calories * CAL_TO_KJ;
        return `${Math.round(value).toLocaleString()} kJ`;
    }
    return `${Math.round(calories).toLocaleString()} kcal`;
};



const DietCard = ({ type, selected, onClick, icon: Icon, label }: { type: DietType, selected: boolean, onClick: () => void, icon: any, label?: string }) => (
    <div onClick={onClick} className={cn("cursor-pointer flex flex-col items-center justify-center gap-1 rounded-xl border p-2 transition-all hover:opacity-90", selected ? "bg-primary text-primary-foreground border-primary shadow-md" : "border-border bg-card text-muted-foreground hover:bg-muted/50")}>
        <Icon className={cn("h-5 w-5 mb-1", selected ? "text-primary-foreground" : "text-muted-foreground")} />
        <span className="text-xs font-semibold text-center leading-tight">{label || (type === 'anything' ? 'Anything' : type)}</span>
    </div>
);

const GoalCard = ({ type, selected, onClick, icon: Icon, label }: { type: GoalType, selected: boolean, onClick: () => void, icon: any, label?: string }) => (
    <div onClick={onClick} className={cn("cursor-pointer flex flex-col items-center justify-center gap-1 rounded-xl border p-2 transition-all hover:opacity-90", selected ? "bg-primary text-primary-foreground border-primary shadow-md" : "border-border bg-card text-muted-foreground hover:bg-muted/50")}>
        <Icon className={cn("h-5 w-5 mb-1", selected ? "text-primary-foreground" : "text-muted-foreground")} />
        <span className="text-xs font-semibold text-center leading-tight">{label || type.replace('-', ' ')}</span>
    </div>
);

const ActivityCard = ({ type, selected, onClick, icon: Icon, label }: { type: ActivityLevel, selected: boolean, onClick: () => void, icon: any, label?: string }) => (
    <div onClick={onClick} className={cn("cursor-pointer flex flex-col items-center justify-center gap-1 rounded-xl border p-2 transition-all hover:opacity-90", selected ? "bg-primary text-primary-foreground border-primary shadow-md" : "border-border bg-card text-muted-foreground hover:bg-muted/50")}>
        <Icon className={cn("h-5 w-5 mb-1", selected ? "text-primary-foreground" : "text-muted-foreground")} />
        <span className="text-xs font-semibold text-center leading-tight">{label || type}</span>
    </div>
);

const RecipeCard = ({ recipe, mealLabel, unit = 'kJ', onRegenerate }: {
    recipe: Recipe,
    mealLabel: string,
    unit?: UnitType,
    onRegenerate?: () => void
}) => {
    const [imageError, setImageError] = useState(false);
    return (
        <div className="group relative bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all animate-in fade-in zoom-in-95 duration-500 flex flex-col h-full">
            <Link href={`/dashboard/library/meals/${recipe.id}`} className="absolute inset-x-0 top-0 bottom-[140px] z-10" />
            <div className="aspect-video relative overflow-hidden bg-muted flex-shrink-0">
                <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-muted-foreground">
                    {recipe.image && !imageError ? (
                        <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" onError={() => setImageError(true)} />
                    ) : (
                        <ChefHat className="h-10 w-10 opacity-20" />
                    )}
                </div>
                <div className="absolute top-3 left-3 bg-black/60 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm uppercase">{mealLabel}</div>
                {recipe.servings && recipe.servings !== 1 && (
                    <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-[10px] font-black px-2 py-1 rounded-md shadow-lg animate-in zoom-in-50">x{recipe.servings}</div>
                )}
            </div>
            <div className="p-5 flex flex-col flex-grow">
                <h4 className="font-bold text-lg mb-2 line-clamp-1">{recipe.title}</h4>
                <div className="grid grid-cols-2 gap-y-1 text-sm text-muted-foreground mt-auto">
                    <span className="flex items-center gap-1"><Flame className="h-4 w-4 text-orange-500" />{formatEnergy(recipe.calories * (recipe.servings || 1), unit)}</span>
                    <span className="flex items-center gap-1"><Beef className="h-4 w-4 text-red-500" />{Number(recipe.protein * (recipe.servings || 1)).toFixed(1)}g</span>
                    <span className="flex items-center gap-1"><Droplet className="h-4 w-4 text-yellow-500" />{Number(recipe.fat * (recipe.servings || 1)).toFixed(1)}g</span>
                    <span className="flex items-center gap-1"><Wheat className="h-4 w-4 text-amber-600" />{Number(recipe.carbs * (recipe.servings || 1)).toFixed(1)}g</span>
                </div>
                <Link href={`/dashboard/library/meals/${recipe.id}`} className="mt-auto block w-full">
                    <button className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-bold shadow-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 group/btn">
                        View Full Recipe <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
                    </button>
                </Link>
                {onRegenerate && (
                    <button className="mt-2 w-full py-2 px-4 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 relative z-20" onClick={(e) => { e.stopPropagation(); onRegenerate(); }}>
                        <RotateCcw className="h-4 w-4" /> Try Another
                    </button>
                )}
            </div>
        </div>
    );
};

const RecipeListItem = ({ recipe, mealLabel, unit = 'kJ', onRegenerate, onMarkEaten, isEaten = false, pantryItems = [] }: {
    recipe: Recipe,
    mealLabel: string,
    unit?: UnitType,
    onRegenerate?: () => void,
    onMarkEaten?: () => void,
    isEaten?: boolean,
    pantryItems?: any[]
}) => {
    const router = useRouter();

    // Match Analysis Logic
    const pantryIds = new Set(pantryItems.map(f => f.id));
    const pantryNames = new Set<string>();
    pantryItems.forEach(f => {
        if (f.common_name) {
            const cn = f.common_name.toLowerCase().trim();
            pantryNames.add(cn);
            if (cn.endsWith('s')) pantryNames.add(cn.replace(/s$/, ''));
            else pantryNames.add(cn + 's');
        }
        if (f.name) {
            const n = f.name.toLowerCase().trim();
            pantryNames.add(n);
            if (n.endsWith('s')) pantryNames.add(n.replace(/s$/, ''));
            else pantryNames.add(n + 's');
        }
    });
    const recipeIngs = recipe.ingredients || [];

    let matchCount = 0;
    const missingIngredients: string[] = [];

    recipeIngs.forEach(ing => {
        const isMatch = (ing.food_item_id && pantryIds.has(ing.food_item_id)) ||
            (ing.baseIngredient && pantryNames.has(ing.baseIngredient.toLowerCase().trim())) ||
            (ing.item && pantryNames.has(ing.item.toLowerCase().trim()));

        if (isMatch) {
            matchCount++;
        } else {
            missingIngredients.push(ing.baseIngredient || ing.item);
        }
    });

    const matchScore = recipeIngs.length > 0 ? matchCount / recipeIngs.length : 0;
    const uniqueMissing = Array.from(new Set(missingIngredients));
    return (
        <div
            onClick={() => router.push(`/dashboard/library/meals/${recipe.id}`)}
            className={cn(
                "group relative rounded-2xl border hover:shadow-lg transition-all cursor-pointer overflow-hidden p-2 lg:p-0",
                isEaten
                    ? "bg-emerald-50/60 dark:bg-emerald-900/20 border-emerald-400/40 opacity-75"
                    : "bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-emerald-500/30"
            )}
        >
            {isEaten && (
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                    <CheckCircle2 size={10} /> Eaten
                </div>
            )}
            <div className="lg:grid lg:grid-cols-[120px_1fr_100px_80px_80px_80px_150px] gap-4 lg:items-center lg:px-8">
                {/* Thumbnail */}
                <div className="aspect-[4/3] lg:aspect-square w-full lg:w-30 rounded-xl lg:rounded-none bg-slate-100 dark:bg-slate-950/50 overflow-hidden relative">
                    {recipe.image ? (
                        <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <ChefHat size={24} className="opacity-20" />
                        </div>
                    )}
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-[8px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm uppercase">{mealLabel}</div>
                </div>

                {/* Info */}
                <div className="p-3 lg:p-0">
                    <h3 className="font-bold text-lg tracking-tight text-slate-900 dark:text-white leading-tight capitalize">
                        {recipe.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                            <Clock size={10} />
                            {recipe.prepTime}m
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                            <Users size={10} />
                            {recipe.servings}P
                        </div>
                        <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[8px] border-none uppercase tracking-widest px-1.5 py-0">
                            {recipe.type}
                        </Badge>
                    </div>

                    {/* Pantry Match UI */}
                    <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2">
                            <div className={cn(
                                "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg flex items-center gap-1.5",
                                matchScore === 1 ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                            )}>
                                <ShoppingBasket size={12} />
                                {matchCount} / {recipeIngs.length} Possessed
                            </div>
                            {matchScore === 1 && (
                                <div className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg bg-emerald-500 text-white flex items-center gap-1">
                                    <Sparkles size={10} /> Fully Stocked
                                </div>
                            )}
                        </div>
                        {uniqueMissing.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                <span className="text-[9px] font-black uppercase tracking-widest text-rose-500/60 mt-1">Missing:</span>
                                {uniqueMissing.map((ing, idx) => (
                                    <span key={idx} className="text-[9px] font-bold text-rose-500 dark:text-rose-400 bg-rose-500/5 px-1.5 py-0.5 rounded-md border border-rose-500/10">
                                        {ing}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats (Desktop View) */}
                <div className="hidden lg:flex flex-col items-end">
                    <span className="text-[9px] uppercase font-black text-slate-400">Energy</span>
                    <span className="font-black text-sm text-slate-900 dark:text-white">{formatEnergy(recipe.calories, unit)}</span>
                </div>
                <div className="hidden lg:flex flex-col items-end">
                    <span className="text-[9px] uppercase font-black text-slate-400">Carbs</span>
                    <span className="font-black text-sm text-slate-900 dark:text-white">{recipe.carbs.toFixed(1)}g</span>
                </div>
                <div className="hidden lg:flex flex-col items-end">
                    <span className="text-[9px] uppercase font-black text-slate-400">Fat</span>
                    <span className="font-black text-sm text-slate-900 dark:text-white">{recipe.fat.toFixed(1)}g</span>
                </div>
                <div className="hidden lg:flex flex-col items-end">
                    <span className="text-[9px] uppercase font-black text-slate-400">Protein</span>
                    <span className="font-black text-sm text-slate-900 dark:text-white">{recipe.protein.toFixed(1)}g</span>
                </div>

                {/* Actions */}
                <div className="p-3 lg:p-0 flex justify-end gap-2">
                    {onMarkEaten && !isEaten && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); onMarkEaten(); }}
                            className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-emerald-500 hover:text-emerald-700 transition-all gap-2"
                        >
                            <Check size={14} />
                            Eaten
                        </Button>
                    )}
                    {onRegenerate && !isEaten && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); onRegenerate(); }}
                            className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-slate-400 hover:text-emerald-600 transition-all gap-2"
                        >
                            <RotateCcw size={14} />
                            Shuffle
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};


interface MealPlannerContentProps {
    showFavoritesOnly?: boolean;
    setShowFavoritesOnly?: React.Dispatch<React.SetStateAction<boolean>>;
    selectedTypes?: string[];
    setSelectedTypes?: React.Dispatch<React.SetStateAction<string[]>>;
    hideControls?: boolean;
    isFilterOpen?: boolean;
    setIsFilterOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}

// Named export for use in other components (like Kitchen tabs)
export function MealPlannerContent({
    showFavoritesOnly: externalShowFavoritesOnly,
    setShowFavoritesOnly: externalSetShowFavoritesOnly,
    selectedTypes: externalSelectedTypes,
    setSelectedTypes: externalSetSelectedTypes,
    hideControls = false,
    isFilterOpen: externalIsFilterOpen,
    setIsFilterOpen: externalSetIsFilterOpen
}: MealPlannerContentProps) {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [generating, setGenerating] = useState(false);
    const [pantryItems, setPantryItems] = useState<any[]>([]);
    const [eatenMeals, setEatenMeals] = useState<Set<string>>(new Set());

    // HeroSearch state
    const [heroSearchQuery, setHeroSearchQuery] = useState('');
    const [heroSearchResults, setHeroSearchResults] = useState<any[]>([]);
    const [isHeroSearching, setIsHeroSearching] = useState(false);
    const [isHeroActive, setIsHeroActive] = useState(false);
    const heroSearchTimeout = React.useRef<NodeJS.Timeout | null>(null);

    const performHeroSearch = async (query: string) => {
        if (!query || query.length < 2) { setHeroSearchResults([]); return; }
        setIsHeroSearching(true);
        try {
            const { data, error } = await supabase
                .from('recipes')
                .select('*')
                .eq('is_mix', false)
                .ilike('title', `%${query}%`)
                .limit(8);
            if (error) throw error;
            setHeroSearchResults(data || []);
        } catch (e) { console.error('Search error:', e); }
        finally { setIsHeroSearching(false); }
    };

    const handleHeroInput = (val: string) => {
        setHeroSearchQuery(val);
        if (heroSearchTimeout.current) clearTimeout(heroSearchTimeout.current);
        heroSearchTimeout.current = setTimeout(() => performHeroSearch(val), 300);
    };

    // Parse a pantry quantity string to total grams (returns null if no weight info)
    const parseTotalGrams = (quantityStr: string): number | null => {
        if (!quantityStr) return null;
        const entries = quantityStr.split(/\s*\+\s*/).map(s => s.trim()).filter(Boolean);
        let total = 0;
        let hasWeight = false;
        for (const entry of entries) {
            // "5 Large (223g)" or "1 kilogram (1000g)"
            const labeled = entry.match(/^(\d+(?:\.\d+)?)\s+.+?\s+\((\d+(?:\.\d+)?)g\)$/);
            if (labeled) { total += parseFloat(labeled[1]) * parseFloat(labeled[2]); hasWeight = true; continue; }
            // "1 x 100g" or "1 x 100ml"
            const weighted = entry.match(/^(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*(g|ml)$/i);
            if (weighted) { total += parseFloat(weighted[1]) * parseFloat(weighted[2]); hasWeight = true; continue; }
            // "1 kilogram" or "0.7 kilograms" or "10 kg" or "10kg"
            const kgFmt = entry.match(/^(\d+(?:\.\d+)?)\s*(?:kg|kilograms?|kilogrammes?)$/i);
            if (kgFmt) { total += parseFloat(kgFmt[1]) * 1000; hasWeight = true; continue; }
            // "300 grams" or "1 gram" or "500g" or "500 g"
            const gramFmt = entry.match(/^(\d+(?:\.\d+)?)\s*(?:g|grams?|grammes?)$/i);
            if (gramFmt) { total += parseFloat(gramFmt[1]); hasWeight = true; continue; }
            // "10 ml" (treat ml as g for water-based items)
            const mlFmt = entry.match(/^(\d+(?:\.\d+)?)\s*(?:ml|millilitres?|milliliters?)$/i);
            if (mlFmt) { total += parseFloat(mlFmt[1]); hasWeight = true; continue; }
            // "10 lb" (pounds)
            const lbFmt = entry.match(/^(\d+(?:\.\d+)?)\s*(?:lb|lbs|pounds?)$/i);
            if (lbFmt) { total += parseFloat(lbFmt[1]) * 453.592; hasWeight = true; continue; }
            // "10 oz" (ounces)
            const ozFmt = entry.match(/^(\d+(?:\.\d+)?)\s*(?:oz|ounces?)$/i);
            if (ozFmt) { total += parseFloat(ozFmt[1]) * 28.3495; hasWeight = true; continue; }
            // Plain number with no unit (e.g. "1") - treat as kilograms
            const plainNum = entry.match(/^(\d+(?:\.\d+)?)$/);
            if (plainNum) { total += parseFloat(plainNum[1]) * 1000; hasWeight = true; continue; }
        }
        return hasWeight ? total : null;
    };

    // Format a gram value as a readable weight string: kg when >= 1000g, g otherwise
    // Uses labeled portion format: "{qty} kilograms / grams" with proper pluralization
    const formatWeightStr = (grams: number): string => {
        if (grams >= 1000) {
            const kg = grams / 1000;
            // Use up to 3 decimal places, stripping trailing zeros
            const kgStr = parseFloat(kg.toFixed(3)).toString();
            const kgNum = parseFloat(kgStr);
            const unit = kgNum === 1 ? 'kilogram' : 'kilograms';
            return `${kgStr} ${unit}`;
        }
        const gramsNum = Math.round(grams);
        const unit = gramsNum === 1 ? 'gram' : 'grams';
        return `${gramsNum} ${unit}`;
    };

    const handleMarkEaten = async (recipe: Recipe, mealType: string) => {
        const servings = recipe.servings || 1;

        // Always fetch latest ingredients from DB (the plan snapshot may be stale if user edited the recipe)
        let ingredients = recipe.ingredients || [];
        try {
            const { data: freshIngs } = await supabase
                .from('ingredients')
                .select('*, food_items(*)')
                .eq('recipe_id', recipe.id);
            if (freshIngs && freshIngs.length > 0) {
                ingredients = freshIngs.map((i: any) => ({
                    item: i.item,
                    amount: i.amount,
                    isMiracleProduct: i.is_miracle_product,
                    baseIngredient: i.base_ingredient,
                    food_item_id: i.food_item_id,
                    weightG: i.weight_g,
                    measureLabel: i.measure_label
                }));
                console.log('[markEaten] Fetched fresh ingredients from DB:', ingredients.length);
            }
        } catch (e) {
            console.log('[markEaten] Failed to fetch fresh ingredients, using plan snapshot');
        }

        const saved = localStorage.getItem('pantry_quantities');
        const quantities: Record<string, string> = saved ? JSON.parse(saved) : {};

        let subtracted = 0;

        console.log('[markEaten] Recipe:', recipe.title, 'Servings:', servings);
        console.log('[markEaten] Ingredients:', ingredients.map(i => ({ item: i.item, baseIngredient: i.baseIngredient, food_item_id: i.food_item_id, weightG: i.weightG })));
        console.log('[markEaten] Pantry items:', pantryItems.length, pantryItems.map(p => ({ id: p.id, name: p.name, common_name: p.common_name })));
        console.log('[markEaten] Current localStorage quantities:', JSON.stringify(quantities));

        for (const ing of ingredients) {
            const weightToSubtract = (ing.weightG ?? 0) * servings;
            if (!weightToSubtract) {
                console.log('[markEaten] Skipping (no weightG):', ing.item, 'weightG:', ing.weightG);
                continue;
            }

            // Strategy: find the pantry item ID for this ingredient
            // 1. Direct food_item_id lookup — most reliable (bypasses pantryItems state)
            let itemId: string | null = null;
            if (ing.food_item_id && quantities[ing.food_item_id] !== undefined) {
                itemId = ing.food_item_id;
                console.log('[markEaten] Direct food_item_id match in localStorage:', ing.item, '->', itemId);
            }

            // 2. food_item_id exists but not in localStorage yet — check pantryItems for the ID
            if (!itemId && ing.food_item_id) {
                const pantryMatch = pantryItems.find(p => p.id === ing.food_item_id);
                if (pantryMatch) {
                    itemId = pantryMatch.id;
                    console.log('[markEaten] food_item_id matched pantry item:', ing.item, '->', pantryMatch.name || pantryMatch.common_name);
                }
            }

            // 3. Fuzzy name matching against pantryItems
            if (!itemId) {
                const ingName = (ing.item || '').toLowerCase().trim();
                const ingBase = (ing.baseIngredient || '').toLowerCase().trim();
                const matchItem = pantryItems.find(p => {
                    const pName = (p.common_name || p.name || '').toLowerCase().trim();
                    // Exact match
                    if (ingBase && pName === ingBase) return true;
                    if (ingName && pName === ingName) return true;
                    // Partial match
                    if (ingBase && (pName.startsWith(ingBase) || ingBase.startsWith(pName))) return true;
                    if (ingName && (pName.startsWith(ingName) || ingName.startsWith(pName))) return true;
                    // First word match
                    const pFirstWord = pName.split(/[,\s]/)[0];
                    if (ingBase && ingBase.split(/[,\s]/)[0] === pFirstWord) return true;
                    if (ingName && ingName.split(/[,\s]/)[0] === pFirstWord) return true;
                    // Word-set match (handles "Rice, White" <-> "White Rice")
                    const splitWords = (str: string): Set<string> => new Set<string>(str.replace(/,/g, '').split(/\s+/).filter((s: string) => s.length > 0));
                    const pWords = splitWords(pName);
                    const ingBaseWords = ingBase ? splitWords(ingBase) : null;
                    const ingNameWords = ingName ? splitWords(ingName) : null;
                    const setsEqual = (a: Set<string>, b: Set<string>) => a.size === b.size && [...a].every(w => b.has(w));
                    if (ingBaseWords && setsEqual(ingBaseWords, pWords)) return true;
                    if (ingNameWords && setsEqual(ingNameWords, pWords)) return true;
                    return false;
                });
                if (matchItem) {
                    itemId = matchItem.id;
                    console.log('[markEaten] Name-matched:', ing.item, '->', matchItem.name || matchItem.common_name, '(id:', matchItem.id, ')');
                }
            }

            // 4. Last resort: scan ALL localStorage quantity keys against food_items by food_item_id
            //    (catches cases where pantryItems didn't load yet)
            if (!itemId && ing.food_item_id) {
                if (ing.food_item_id in quantities) {
                    itemId = ing.food_item_id;
                    console.log('[markEaten] Found food_item_id in localStorage keys as fallback:', itemId);
                }
            }

            if (!itemId) {
                console.log('[markEaten] No match for:', ing.item, 'baseIngredient:', ing.baseIngredient, 'food_item_id:', ing.food_item_id);
                continue;
            }

            const currentQtyStr = quantities[itemId] || '';
            const totalG = parseTotalGrams(currentQtyStr);
            console.log('[markEaten] itemId:', itemId, 'currentQtyStr:', JSON.stringify(currentQtyStr), '-> totalG:', totalG, '- weightToSubtract:', weightToSubtract);
            if (totalG === null || totalG === 0) {
                console.log('[markEaten] No parseable quantity, skipping');
                continue;
            }

            const remaining = Math.max(0, totalG - weightToSubtract);
            console.log('[markEaten] remaining:', remaining, '= totalG:', totalG, '- subtract:', weightToSubtract);
            quantities[itemId] = formatWeightStr(remaining);
            console.log('[markEaten] New quantity for', itemId, ':', quantities[itemId]);
            subtracted++;
        }

        console.log('[markEaten] Final quantities to save:', quantities);
        console.log('[markEaten] Total subtracted:', subtracted);
        
        // Log if any item is being set to 0 and move to shopping list
        const savedBefore = localStorage.getItem('pantry_quantities');
        const beforeObj = savedBefore ? JSON.parse(savedBefore) : {};
        const itemsToReplenish: { id: string; name: string }[] = [];
        
        Object.entries(quantities).forEach(([id, qty]) => {
            if ((qty === '0 grams' || qty === '0 g' || qty === '0') && beforeObj[id] !== qty) {
                console.warn('🥔 [markEaten] ⚠️ ITEM ZEROED OUT!', { id, wasBefore: beforeObj[id], nowIs: qty, recipe: recipe.title });
                // Find the item name from pantryItems
                const item = pantryItems.find(p => p.id === id);
                if (item) {
                    itemsToReplenish.push({ id, name: item.common_name || item.name });
                }
            }
        });
        
        localStorage.setItem('pantry_quantities', JSON.stringify(quantities));
        
        // Move zeroed items to shopping list and remove from pantry
        if (itemsToReplenish.length > 0) {
            try {
                // Add to shopping list
                const shoppingList = JSON.parse(localStorage.getItem('vitala_shopping_manual_items') || '[]');
                for (const item of itemsToReplenish) {
                    shoppingList.push({
                        id: `replenish-${Date.now()}-${item.id}`,
                        name: `Replenish: ${item.name}`,
                        quantity: 'As needed',
                        unit: '',
                        checked: false,
                        source: 'auto-replenish'
                    });
                    
                    // Remove from pantry
                    const foodItemUpdate = await supabase
                        .from('food_items')
                        .update({ is_in_pantry: false } as any)
                        .eq('id', item.id);
                    
                    if (foodItemUpdate.error) {
                        console.warn('[markEaten] Failed to remove', item.name, 'from pantry:', foodItemUpdate.error);
                    } else {
                        console.log('[markEaten] Auto-removed', item.name, 'from pantry and added to shopping list');
                    }
                }
                localStorage.setItem('vitala_shopping_manual_items', JSON.stringify(shoppingList));
                window.dispatchEvent(new CustomEvent('shopping-list-updated'));
            } catch (e) {
                console.error('[markEaten] Failed to auto-replenish items:', e);
            }
        }
        
        // Notify any mounted pantry views to re-apply the updated quantities
        window.dispatchEvent(new CustomEvent('pantry-quantities-updated'));
        setEatenMeals(prev => new Set([...prev, mealType]));

        if (subtracted > 0) {
            // Verify the save worked
            const verify = localStorage.getItem('pantry_quantities');
            console.log('[markEaten] VERIFIED localStorage after save:', verify);
            toast.success(`Marked as eaten. ${subtracted} pantry item${subtracted !== 1 ? 's' : ''} updated`);
        } else {
            const unmatched = ingredients.filter(i => (i.weightG ?? 0) > 0).map(i => i.item).join(', ');
            console.log('[markEaten] No items subtracted. Unmatched ingredients:', unmatched);
            toast.success(`${recipe.title} marked as eaten (no pantry items matched: ${unmatched || 'none had weight'})`);
        }
    };

    useEffect(() => {
        const fetchPantry = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                const [foodItemsRes, pantryItemsRes] = await Promise.all([
                    supabase.from('food_items')
                        .select('*')
                        .eq('is_in_pantry', true),
                    user ? supabase.from('pantry_items')
                        .select('*, scanned_products(name, nutrition, image_url), food_items(*)')
                        .eq('user_id', user.id)
                        : { data: [] }
                ]);

                let items: any[] = foodItemsRes.data || [];

                // Transform and add personal items
                if (pantryItemsRes.data) {
                    const personalItems = pantryItemsRes.data.map((item: any) => {
                        const sp = item.scanned_products;
                        const fi = item.food_items;
                        return {
                            id: item.food_item_id || item.id,
                            name: sp?.name || fi?.name || item.custom_name,
                            common_name: fi?.common_name || sp?.name || fi?.name || item.custom_name,
                            is_in_pantry: true,
                        };
                    });
                    items = [...items, ...personalItems];
                }

                // Merge in LocalStorage quantities (even for logged out users)
                const saved = localStorage.getItem('pantry_quantities');
                if (saved) {
                    const localQ = JSON.parse(saved);
                    Object.keys(localQ).forEach(id => {
                        if (!items.find(it => it.id === id)) {
                            items.push({ id: id, is_in_pantry: true });
                        }
                    });
                }

                setPantryItems(items);
            } catch (err) {
                console.error('Failed to fetch pantry:', err);
            }
        };
        fetchPantry();
    }, []);

    const {
        profile,
        energyUnit: unit,
        skipPlannerQuiz,
        setSkipPlannerQuiz,
        measurementUnit,
        dailyPlan: plan,
        updateDailyPlan: setPlan
    } = useUserPreferences();
    const [showRecipeNutrients, setShowRecipeNutrients] = useState(false);
    const [recipeMoringaGrams, setRecipeMoringaGrams] = useState(0);
    const [moringaGrams, setMoringaGrams] = useState(0);
    const [showDailyNutrients, setShowDailyNutrients] = useState(true);
    const [dailyMoringaGrams, setDailyMoringaGrams] = useState(0);
    const [activeBoostContext, setActiveBoostContext] = useState<'daily' | 'recipe' | null>(null);
    const [breakdownNutrient, setBreakdownNutrient] = useState<string | null>(null);
    const [expandedBreakdownSections, setExpandedBreakdownSections] = useState<Record<string, boolean>>({});

    // Browse/Filter State
    const [localShowFavoritesOnly, setLocalShowFavoritesOnly] = useState(false);
    const [localSelectedTypes, setLocalSelectedTypes] = useState<string[]>(['breakfast', 'lunch', 'dinner']);

    const showFavoritesOnly = externalShowFavoritesOnly !== undefined ? externalShowFavoritesOnly : localShowFavoritesOnly;
    const setShowFavoritesOnly = externalSetShowFavoritesOnly !== undefined ? externalSetShowFavoritesOnly : setLocalShowFavoritesOnly;
    const selectedTypes = externalSelectedTypes !== undefined ? externalSelectedTypes : localSelectedTypes;
    const setSelectedTypes = externalSetSelectedTypes !== undefined ? externalSetSelectedTypes : setLocalSelectedTypes;

    const [showSummary, setShowSummary] = useState(false);
    const [alwaysSkip, setAlwaysSkip] = useState(skipPlannerQuiz);
    const { searchQuery } = useSearch();

    // Nutrient breakdown definitions
    const NUTRIENT_BREAKDOWNS: Record<string, { label: string, keys: string[], unit: string, isEssential?: boolean, hiddenByDefault?: boolean, isExpandable?: boolean }[]> = {
        'Vitamin A': [
            { label: 'Retinol', keys: ['Retinol', 'retinol_ug'], unit: '�g' },
            { label: 'Alpha-carotene', keys: ['Alpha-carotene', 'alpha_carotene_ug'], unit: '�g' },
            { label: 'Beta-carotene', keys: ['Beta-carotene', 'beta_carotene_ug'], unit: '�g' },
            { label: 'Beta-cryptoxanthin', keys: ['Beta-cryptoxanthin', 'beta_cryptoxanthin_ug'], unit: '�g' },
            { label: 'Lutein+Zeaxanthin', keys: ['Lutein+Zeaxanthin', 'lutein_zeaxanthin_ug'], unit: '�g' },
            { label: 'Lycopene', keys: ['Lycopene', 'lycopene_ug'], unit: '�g' },
        ],
        'Vitamin E': [
            { label: 'Alpha-tocopherol', keys: ['Vitamin E', 'vitamin_e_mg', 'alpha_tocopherol_mg'], unit: 'mg' },
            { label: 'Beta-tocopherol', keys: ['Beta Tocopherol', 'beta_tocopherol_mg'], unit: 'mg' },
            { label: 'Delta-tocopherol', keys: ['Delta Tocopherol', 'delta_tocopherol_mg'], unit: 'mg' },
            { label: 'Gamma-tocopherol', keys: ['Gamma Tocopherol', 'gamma_tocopherol_mg'], unit: 'mg' },
        ],
        'Protein': [
            { label: 'Histidine', keys: ['Histidine', 'histidine_g'], unit: 'g', isEssential: true },
            { label: 'Isoleucine', keys: ['Isoleucine', 'isoleucine_g'], unit: 'g', isEssential: true },
            { label: 'Leucine', keys: ['Leucine', 'leucine_g'], unit: 'g', isEssential: true },
            { label: 'Lysine', keys: ['Lysine', 'lysine_g'], unit: 'g', isEssential: true },
            { label: 'Methionine', keys: ['Methionine', 'methionine_g'], unit: 'g', isEssential: true },
            { label: 'Phenylalanine', keys: ['Phenylalanine', 'phenylalanine_g'], unit: 'g', isEssential: true },
            { label: 'Threonine', keys: ['Threonine', 'threonine_g'], unit: 'g', isEssential: true },
            { label: 'Tryptophan', keys: ['Tryptophan', 'tryptophan_g'], unit: 'g', isEssential: true },
            { label: 'Valine', keys: ['Valine', 'valine_g'], unit: 'g', isEssential: true },
            { label: 'Alanine', keys: ['Alanine', 'alanine_g'], unit: 'g' },
            { label: 'Arginine', keys: ['Arginine', 'arginine_g'], unit: 'g' },
            { label: 'Aspartic acid', keys: ['Aspartic acid', 'aspartic_acid_g'], unit: 'g' },
            { label: 'Cystine', keys: ['Cystine', 'cystine_g'], unit: 'g' },
            { label: 'Glutamic acid', keys: ['Glutamic acid', 'glutamic_acid_g'], unit: 'g' },
            { label: 'Glycine', keys: ['Glycine', 'glycine_g'], unit: 'g' },
            { label: 'Proline', keys: ['Proline', 'proline_g'], unit: 'g' },
            { label: 'Serine', keys: ['Serine', 'serine_g'], unit: 'g' },
            { label: 'Tyrosine', keys: ['Tyrosine', 'tyrosine_g'], unit: 'g' },
        ],
        'Carbs': [
            { label: 'Fiber', keys: ['Fiber', 'fiber_g'], unit: 'g' },
            { label: 'Starch', keys: ['Starch', 'starch_g'], unit: 'g' },
            { label: 'Sugars (Total)', keys: ['Sugars', 'sugars_g', 'sugar_g'], unit: 'g', isExpandable: true },
            { label: 'Fructose', keys: ['Fructose', 'fructose_g'], unit: 'g', hiddenByDefault: true },
            { label: 'Glucose', keys: ['Glucose', 'glucose_g'], unit: 'g', hiddenByDefault: true },
            { label: 'Sucrose', keys: ['Sucrose', 'sucrose_g'], unit: 'g', hiddenByDefault: true },
            { label: 'Lactose', keys: ['Lactose', 'lactose_g'], unit: 'g', hiddenByDefault: true },
            { label: 'Maltose', keys: ['Maltose', 'maltose_g'], unit: 'g', hiddenByDefault: true },
            { label: 'Galactose', keys: ['Galactose', 'galactose_g'], unit: 'g', hiddenByDefault: true },
            { label: 'Added Sugars', keys: ['Added Sugars', 'added_sugars_g'], unit: 'g', hiddenByDefault: true },
        ],
        'Fat': [
            { label: 'Saturated Fat', keys: ['Saturated', 'saturated_fat_g', 'saturated_g'], unit: 'g' },
            { label: 'Monounsaturated', keys: ['Monounsaturated', 'monounsaturated_fat_g'], unit: 'g' },
            { label: 'Polyunsaturated', keys: ['Polyunsaturated', 'polyunsaturated_fat_g'], unit: 'g' },
            { label: 'Omega-3', keys: ['Omega-3', 'omega3_g', 'omega_3_g'], unit: 'g', isExpandable: true },
            { label: 'ALA', keys: ['ALA', 'alpha_linolenic_acid_g'], unit: 'g', hiddenByDefault: true },
            { label: 'EPA', keys: ['EPA', 'eicosapentaenoic_acid_g'], unit: 'g', hiddenByDefault: true },
            { label: 'DHA', keys: ['DHA', 'docosahexaenoic_acid_g'], unit: 'g', hiddenByDefault: true },
            { label: 'Omega-6', keys: ['Omega-6', 'omega6_g', 'omega_6_g'], unit: 'g' },
            { label: 'Trans Fat', keys: ['Trans-Fats', 'trans_fat_g'], unit: 'g' },
            { label: 'Cholesterol', keys: ['Cholesterol', 'cholesterol_mg'], unit: 'mg' },
        ],
    };

    const findNutrientMatch = (record: Record<string, any>, key: string) => {
        const mKeys = Object.keys(record);
        const kL = key.toLowerCase();
        const exact = mKeys.find(mk => mk.toLowerCase() === kL);
        if (exact) return exact;
        if (kL.includes('vitamin')) {
            const letter = kL.split(' ')[1]?.toLowerCase();
            if (letter && letter.length === 1) {
                const match = mKeys.find(mk => {
                    const mkL = mk.toLowerCase();
                    return mkL.includes('vitamin') && new RegExp(`\\b${letter}\\b`, 'i').test(mkL);
                });
                if (match) return match;
            }
        }
        if (kL.startsWith('b') && /\b[b]\d+\b/.test(kL)) {
            const bNum = kL.split(' ')[0].toLowerCase();
            const match = mKeys.find(mk => {
                const mkL = mk.toLowerCase();
                return mkL.includes(bNum) || (kL.includes('thiamine') && mkL.includes('thiamine')) || (kL.includes('riboflavin') && mkL.includes('riboflavin'));
            });
            if (match) return match;
        }
        const firstWord = kL.split(' ')[0];
        if (firstWord.length > 3) {
            const fuzzy = mKeys.find(mk => mk.toLowerCase().includes(firstWord));
            if (fuzzy) return fuzzy;
        }
        return null;
    };

    const MORINGA_TSP = {
        energy_kcal: 5.00, energy_kj: 20.93, protein_g: 0.50, carbs_g: 0.80, fat_g: 0.05,
        micronutrients: {
            'Vitamin A': 112.50, 'Vitamin C': 4.50, 'B1 (Thiamine)': 0.05, 'B2 (Riboflavin)': 0.41,
            'B3 (Niacin)': 0.20, 'Calcium': 40.00, 'Iron': 0.76, 'Magnesium': 7.35, 'Potassium': 26.50,
            'Sodium': 0.50, 'Fiber': 0.80
        }
    };

    const [calories, setCalories] = useState(2000);
    const [diet, setDiet] = useState<DietType>('anything');
    const [goal, setGoal] = useState<GoalType>('maintain');
    const [activityLevel, setActivityLevel] = useState<ActivityLevel>('sedentary');
    const [gender, setGender] = useState<'male' | 'female'>('female');
    const [age, setAge] = useState<number | ''>('');
    const [weight, setWeight] = useState<number | ''>('');
    const [height, setHeight] = useState<number | ''>('');

    // Sync profile data to local state for the planner
    useEffect(() => {
        if (profile.age) {
            setAge(profile.age);
            setWeight(profile.weight);
            setHeight(profile.height);
            setGender(profile.gender);
            setGoal(profile.goal);
            setDiet(profile.dietType as DietType);
            setActivityLevel(profile.activityLevel);

            if (skipPlannerQuiz) {
                // Auto-calculate and go to step 2
                const w = Number(profile.weight) || 70;
                const h = Number(profile.height) || 170;
                const a = Number(profile.age) || 30;
                let bmr = (10 * w) + (6.25 * h) - (5 * a);
                if (profile.gender === 'male') bmr += 5; else bmr -= 161;
                let tdee = bmr;
                switch (profile.activityLevel) {
                    case 'light': tdee = bmr * 1.375; break;
                    case 'moderate': tdee = bmr * 1.55; break;
                    case 'active': tdee = bmr * 1.725; break;
                    default: tdee = bmr * 1.2;
                }
                if (profile.goal === 'build-muscle') tdee *= 1.10;
                const targetCals = Math.max(1200, Math.round(tdee / 50) * 50);
                setCalories(targetCals);

                // Jump straight to generation
                // We'll let the user click generate or handle it elsewhere to avoid race conditions with pantry fetch
                setStep(2);
            } else {
                setShowSummary(true);
            }
        }
    }, [profile, skipPlannerQuiz]);

    // Update step if plan exists
    useEffect(() => {
        if (plan && step === 1) {
            setStep(3);
        }
    }, [plan, step]);

    const userRDAs = useRDA(age === '' ? undefined : Number(age), gender, calories);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const newPlan = await generateDailyPlan({
                targetCalories: calories,
                diet,
                numMeals: 3,
                favoritesOnly: showFavoritesOnly,
                pantryItems,
                searchQuery
            });
            setPlan(newPlan);
            setStep(3);
        } catch (error) { console.error(error); } finally { setGenerating(false); }
    };

    const handleNextStep = () => {
        const w = Number(weight) || 70; const h = Number(height) || 170; const a = Number(age) || 30;
        let bmr = (10 * w) + (6.25 * h) - (5 * a);
        if (gender === 'male') bmr += 5; else bmr -= 161;
        let tdee = bmr;
        switch (activityLevel) {
            case 'light': tdee = bmr * 1.375; break;
            case 'moderate': tdee = bmr * 1.55; break;
            case 'active': tdee = bmr * 1.725; break;
            default: tdee = bmr * 1.2;
        }
        if (goal === 'lose-fat') tdee *= 0.80; if (goal === 'build-muscle') tdee *= 1.10;
        setCalories(Math.max(1200, Math.round(tdee / 50) * 50));
        setStep(2);
    };

    const handleRegenerateMeal = async (mealType: 'breakfast' | 'lunch' | 'dinner', currentId: string) => {
        if (!plan) return;
        const result = await getRandomRecipeByType(mealType, diet, currentId, showFavoritesOnly, searchQuery);
        if (result) {
            const { recipe: newRecipe, micronutrients: newMicros } = result;
            const up = { ...plan };
            up.recipeMicronutrients = { ...plan.recipeMicronutrients, [newRecipe.id]: newMicros };
            if (mealType === 'breakfast') up.breakfast = newRecipe;
            else if (mealType === 'lunch') up.lunch = newRecipe;
            else if (mealType === 'dinner') up.dinner = newRecipe;

            // Recalculate totals
            up.totalCalories = (up.breakfast.calories * (up.breakfast.servings || 1)) +
                (up.lunch.calories * (up.lunch.servings || 1)) +
                (up.dinner.calories * (up.dinner.servings || 1));

            up.macros = {
                protein: (up.breakfast.protein * (up.breakfast.servings || 1)) +
                    (up.lunch.protein * (up.lunch.servings || 1)) +
                    (up.dinner.protein * (up.dinner.servings || 1)),
                carbs: (up.breakfast.carbs * (up.breakfast.servings || 1)) +
                    (up.lunch.carbs * (up.lunch.servings || 1)) +
                    (up.dinner.carbs * (up.dinner.servings || 1)),
                fat: (up.breakfast.fat * (up.breakfast.servings || 1)) +
                    (up.lunch.fat * (up.lunch.servings || 1)) +
                    (up.dinner.fat * (up.dinner.servings || 1)),
            };

            const combinedM: Record<string, number> = {};
            [up.breakfast, up.lunch, up.dinner].forEach(r => {
                const rm = up.recipeMicronutrients[r.id];
                const factor = r.servings || 1;
                if (rm) {
                    Object.entries(rm).forEach(([k, v]) => {
                        combinedM[k] = (combinedM[k] || 0) + ((v as number) * factor);
                    });
                }
            });
            up.micronutrients = combinedM;
            setPlan(up);
        }
    };

    const updateServings = (rid: string, n: number) => {
        if (!plan) return;
        const up = { ...plan };
        const m = (r: Recipe) => r.id === rid ? { ...r, servings: n } : r;
        up.breakfast = m(up.breakfast);
        up.lunch = m(up.lunch);
        up.dinner = m(up.dinner);

        // Recalculate totals
        up.totalCalories = (up.breakfast.calories * (up.breakfast.servings || 1)) +
            (up.lunch.calories * (up.lunch.servings || 1)) +
            (up.dinner.calories * (up.dinner.servings || 1));

        up.macros = {
            protein: (up.breakfast.protein * (up.breakfast.servings || 1)) +
                (up.lunch.protein * (up.lunch.servings || 1)) +
                (up.dinner.protein * (up.dinner.servings || 1)),
            carbs: (up.breakfast.carbs * (up.breakfast.servings || 1)) +
                (up.lunch.carbs * (up.lunch.servings || 1)) +
                (up.dinner.carbs * (up.dinner.servings || 1)),
            fat: (up.breakfast.fat * (up.breakfast.servings || 1)) +
                (up.lunch.fat * (up.lunch.servings || 1)) +
                (up.dinner.fat * (up.dinner.servings || 1)),
        };

        const combinedM: Record<string, number> = {};
        [up.breakfast, up.lunch, up.dinner].forEach(r => {
            const rm = up.recipeMicronutrients[r.id];
            const factor = r.servings || 1;
            if (rm) {
                Object.entries(rm).forEach(([k, v]) => {
                    combinedM[k] = (combinedM[k] || 0) + ((v as number) * factor);
                });
            }
        });
        up.micronutrients = combinedM;
        setPlan(up);
    };

    const isFormComplete = Boolean(age && weight && height);

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 text-slate-800 dark:text-slate-100 pb-20">
            {/* Hero Search */}
            <HeroSearch
                searchQuery={heroSearchQuery}
                onQueryChange={handleHeroInput}
                results={heroSearchResults}
                isLoading={isHeroSearching}
                isActive={isHeroActive}
                setIsActive={setIsHeroActive}
                onSelect={(item) => {
                    const base = item.is_mix ? 'mixes' : 'meals';
                    router.push(`/dashboard/library/${base}/${item.id}`);
                }}
                theme="amber"
                placeholder="SEARCH RECIPES..."
                idleIcon={<Calendar size={20} className="text-amber-500" />}
                idleTitle="Meal Planner"
                idleSubtitle="Search recipes or generate a daily meal plan below"
                noResultsMessage="No matching recipes found"
                enterMessage="Enter recipe name to search"
                searchingMessage="Searching Recipes..."
                renderResult={(item: any) => (
                    <div className="flex items-center gap-4 min-w-0 w-full">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-100 dark:border-slate-800">
                            {item.image ? (
                                <img src={item.image} className="w-full h-full object-cover" alt={item.title} />
                            ) : (
                                <ChefHat className="m-auto opacity-10 h-full w-5" />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h4 className="font-black text-sm uppercase text-slate-900 dark:text-white truncate">{item.title}</h4>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                {formatEnergy(item.energy_kcal || 0, unit)} <span className="text-slate-200 dark:text-slate-700">|</span> {item.type || (item.is_mix ? 'Mix' : 'Meal')}
                            </p>
                        </div>
                        <ChevronRight className="text-slate-200 group-hover:text-amber-500 transition-colors shrink-0" size={20} />
                    </div>
                )}
            />

            {/* Controls Row */}
            {/* Header Actions (Refactored from Controls Row) */}
            {/* Header Actions (Refactored from Controls Row) */}
            {!hideControls && (
                <HeaderActions>
                    <div className="flex items-center gap-2">
                        {/* Unified Filter Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className={cn(
                                    "px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 shrink-0 border shadow-sm outline-none",
                                    (selectedTypes.length < MEAL_TYPES.length || showFavoritesOnly)
                                        ? "bg-yellow-600 text-white border-yellow-600 shadow-lg shadow-yellow-500/20"
                                        : "bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-yellow-200 hover:text-yellow-600"
                                )}>
                                    <Filter size={12} />
                                    <span className="hidden sm:inline">
                                        {(selectedTypes.length === MEAL_TYPES.length && !showFavoritesOnly) ? "Filter" :
                                            "Filters Active"}
                                    </span>
                                    <ChevronDown size={10} className={cn("opacity-50")} />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-950">
                                {/* Favorites Section */}
                                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-2">Filter Scope</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 mx-2" />
                                <DropdownMenuCheckboxItem
                                    checked={!showFavoritesOnly}
                                    onCheckedChange={(checked) => checked && setShowFavoritesOnly(false)}
                                    className="rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 focus:bg-slate-50 py-2.5 cursor-pointer"
                                >
                                    Show All Recipes
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={showFavoritesOnly}
                                    onCheckedChange={(checked) => checked && setShowFavoritesOnly(true)}
                                    className="rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 focus:bg-rose-50 dark:focus:bg-rose-900/10 focus:text-rose-600 py-2.5 cursor-pointer"
                                >
                                    Favorites Only
                                </DropdownMenuCheckboxItem>

                                <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 mx-2 my-1" />

                                {/* Meal Types Section */}
                                <div className="flex items-center justify-between pr-2">
                                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-2">Meal Types</DropdownMenuLabel>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setSelectedTypes(MEAL_TYPES);
                                            }}
                                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-yellow-500 transition-colors"
                                            title="Select All"
                                        >
                                            <CheckSquare size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setSelectedTypes([]);
                                            }}
                                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                                            title="Select None"
                                        >
                                            <Square size={14} />
                                        </button>
                                    </div>
                                </div>
                                <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 mx-2" />
                                <div className="py-1 max-h-[300px] overflow-y-auto no-scrollbar">
                                    {MEAL_TYPES.map(type => {
                                        const isActive = selectedTypes.includes(type);
                                        return (
                                            <DropdownMenuCheckboxItem
                                                key={type}
                                                checked={isActive}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setSelectedTypes(prev => [...prev, type]);
                                                    } else {
                                                        setSelectedTypes(prev => prev.filter(t => t !== type));
                                                    }
                                                }}
                                                className="rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 focus:bg-yellow-50 dark:focus:bg-yellow-900/10 focus:text-yellow-600 py-2.5 cursor-pointer"
                                            >
                                                {type}
                                            </DropdownMenuCheckboxItem>
                                        );
                                    })}
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </HeaderActions>
            )}


            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-10 shadow-sm relative overflow-hidden">
                {step === 1 && showSummary && (
                    <div className="space-y-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4">
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-bold">Welcome back, {profile.nickname || profile.name || 'Researcher'}</h2>
                            <p className="text-slate-500">We've loaded your saved health and dietary preferences.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Metrics</p>
                                <p className="font-bold">{profile.age}y � {profile.weight}{measurementUnit === 'metric' ? 'kg' : 'lb'} � {profile.height}{measurementUnit === 'metric' ? 'cm' : 'ft'}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Dietary Goal</p>
                                <p className="font-bold capitalize">{profile.goal.replace('-', ' ')}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Diet Protocol</p>
                                <p className="font-bold capitalize">{profile.dietType}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Activity Level</p>
                                <p className="font-bold capitalize">{profile.activityLevel}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Button size="lg" onClick={handleNextStep} className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-emerald-500/20">
                                Generate Daily Nutrition <ChevronRight className="ml-2 h-5 w-5" />
                            </Button>

                            <div className="flex items-center justify-between px-2">
                                <button
                                    onClick={() => router.push('/profile?from=/dashboard/meal-o-matic/planner')}
                                    className="text-xs font-bold text-slate-500 hover:text-emerald-500 transition-colors flex items-center gap-1"
                                >
                                    Edit these settings
                                </button>

                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div
                                        onClick={() => {
                                            const newVal = !alwaysSkip;
                                            setAlwaysSkip(newVal);
                                            setSkipPlannerQuiz(newVal);
                                        }}
                                        className={cn(
                                            "w-4 h-4 rounded border transition-colors flex items-center justify-center",
                                            alwaysSkip ? "bg-emerald-500 border-emerald-500" : "border-slate-300 dark:border-slate-700 hover:border-emerald-500"
                                        )}
                                    >
                                        {alwaysSkip && <Check size={10} className="text-white" />}
                                    </div>
                                    <span className="text-xs font-medium text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">Always skip this summary</span>
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {step === 1 && !showSummary && (
                    <div className="flex flex-col items-center justify-center py-10 text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 max-w-xl mx-auto">
                        <div className="h-24 w-24 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-600 border border-emerald-500/20">
                            <User size={48} className="animate-pulse" />
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-3xl font-black tracking-tight uppercase italic">Personalisation Required</h2>
                            <p className="text-slate-500 font-medium">
                                To curate a personalised meal plan, we need some information from you. This includes your age, weight, height, and diet goals. This is stored locally on your device and not on our servers. You are welcome to skip this and have a look at our recipes for some ideas on your next meal. We value and respect your privacy.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 w-full gap-4">
                            <Button
                                size="lg"
                                onClick={() => router.push('/dashboard/library/meals')}
                                className="h-16 text-lg font-black uppercase tracking-widest rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all"
                            >
                                <ChefHat className="mr-2 h-5 w-5" /> View Meals
                            </Button>
                            <Button
                                size="lg"
                                onClick={() => router.push('/profile?from=/dashboard/meal-o-matic/planner')}
                                className="h-16 text-lg font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20 group"
                            >
                                Complete Profile <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-8 animate-in fade-in">
                        {!generating ? (
                            <div className="space-y-6 max-w-sm">
                                <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary"><ChefHat size={40} /></div>
                                <h2 className="text-3xl font-bold">Plan Ready</h2>
                                <p className="text-muted-foreground">Roughly <strong>{formatEnergy(calories, unit)}</strong> across 3 meals.</p>
                                <Button size="lg" onClick={handleGenerate} className="w-full h-14 text-lg">Generate Menu</Button>
                                <Button variant="ghost" onClick={() => setStep(1)} className="text-muted-foreground">Edit details</Button>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-pulse"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" /><h3 className="text-xl font-bold">Curating...</h3></div>
                        )}
                    </div>
                )}

                {step === 3 && plan && (
                    <div className="space-y-6 animate-in fade-in-up duration-500">
                        {/* List Header */}
                        <div className="hidden lg:grid lg:grid-cols-[120px_1fr_100px_80px_80px_80px_150px] gap-4 px-8 pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2"><Camera size={14} /> Plate</div>
                            <div className="flex items-center gap-2"><ChefHat size={14} /> Meal Details</div>
                            <div className="text-right flex items-center justify-end gap-2"><Zap size={14} /> Energy</div>
                            <div className="text-right flex items-center justify-end gap-2"><Wheat size={14} /> Carbs</div>
                            <div className="text-right flex items-center justify-end gap-2"><Droplet size={14} /> Fat</div>
                            <div className="text-right flex items-center justify-end gap-2"><Beef size={14} /> Protein</div>
                            <div className="text-right flex items-center justify-end gap-2"><Activity size={14} /> Control</div>
                        </div>

                        <div className="space-y-4">
                            {selectedTypes.map(st => st.toLowerCase()).includes('breakfast') && (
                                <RecipeListItem recipe={plan.breakfast} mealLabel="Breakfast" unit={unit} onRegenerate={() => handleRegenerateMeal('breakfast', plan.breakfast.id)} onMarkEaten={() => handleMarkEaten(plan.breakfast, 'breakfast')} isEaten={eatenMeals.has('breakfast')} pantryItems={pantryItems} />
                            )}
                            {selectedTypes.map(st => st.toLowerCase()).includes('lunch') && (
                                <RecipeListItem recipe={plan.lunch} mealLabel="Lunch" unit={unit} onRegenerate={() => handleRegenerateMeal('lunch', plan.lunch.id)} onMarkEaten={() => handleMarkEaten(plan.lunch, 'lunch')} isEaten={eatenMeals.has('lunch')} pantryItems={pantryItems} />
                            )}
                            {selectedTypes.map(st => st.toLowerCase()).includes('dinner') && (
                                <RecipeListItem recipe={plan.dinner} mealLabel="Dinner" unit={unit} onRegenerate={() => handleRegenerateMeal('dinner', plan.dinner.id)} onMarkEaten={() => handleMarkEaten(plan.dinner, 'dinner')} isEaten={eatenMeals.has('dinner')} pantryItems={pantryItems} />
                            )}
                        </div>

                        {/* Shopping List Section */}
                        <div className="space-y-4 pt-4">
                            <div className="animate-in slide-in-from-top-4 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                                {/* Header */}
                                <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                                <ShoppingBasket size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">Shopping List</h3>
                                                <p className="text-xs font-medium text-slate-500">Ingredients for your meal plan</p>
                                            </div>
                                        </div>
                                        <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[10px] uppercase tracking-widest px-3 py-1.5">
                                            {generateShoppingList(plan).length} Items
                                        </Badge>
                                    </div>
                                </div>

                                {/* Shopping List Items */}
                                <div className="p-6">
                                    {(() => {
                                        const shoppingItems = generateShoppingList(plan);
                                        const pantryNames = new Set<string>();
                                        pantryItems.forEach(f => {
                                            if (f.common_name) {
                                                const cn = f.common_name.toLowerCase().trim();
                                                pantryNames.add(cn);
                                                if (cn.endsWith('s')) pantryNames.add(cn.replace(/s$/, ''));
                                                else pantryNames.add(cn + 's');
                                            }
                                            if (f.name) {
                                                const n = f.name.toLowerCase().trim();
                                                pantryNames.add(n);
                                                if (n.endsWith('s')) pantryNames.add(n.replace(/s$/, ''));
                                                else pantryNames.add(n + 's');
                                            }
                                        });

                                        // Split items into "need to buy" and "in pantry"
                                        const needToBuy = shoppingItems.filter(item => !pantryNames.has(item.name.toLowerCase().trim()));
                                        const inPantry = shoppingItems.filter(item => pantryNames.has(item.name.toLowerCase().trim()));

                                        return (
                                            <div className="space-y-6">
                                                {/* Items to Buy */}
                                                {needToBuy.length > 0 && (
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">
                                                                Need to Buy ({needToBuy.length})
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                            {needToBuy.map((item, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className={cn(
                                                                        "flex items-center justify-between p-4 rounded-xl border transition-all",
                                                                        item.isMiracleProduct
                                                                            ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50"
                                                                            : "bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700"
                                                                    )}
                                                                >
                                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                        {item.isMiracleProduct && (
                                                                            <Sparkles size={14} className="text-amber-500 shrink-0" />
                                                                        )}
                                                                        <span className="font-bold text-slate-900 dark:text-white truncate">
                                                                            {item.name}
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-right shrink-0 ml-2">
                                                                        <span className="text-xs font-medium text-slate-500">
                                                                            {item.amounts.join(' + ')}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Items in Pantry */}
                                                {inPantry.length > 0 && (
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">
                                                                Already in Pantry ({inPantry.length})
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                            {inPantry.map((item, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className="flex items-center justify-between p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 opacity-70"
                                                                >
                                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                        <Check size={14} className="text-emerald-500 shrink-0" />
                                                                        <span className="font-bold text-slate-700 dark:text-slate-300 truncate line-through">
                                                                            {item.name}
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-right shrink-0 ml-2">
                                                                        <span className="text-xs font-medium text-slate-400">
                                                                            {item.amounts.join(' + ')}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Empty State */}
                                                {shoppingItems.length === 0 && (
                                                    <div className="flex flex-col items-center justify-center py-10 text-center">
                                                        <ShoppingBasket size={48} className="text-slate-200 dark:text-slate-700 mb-4" />
                                                        <p className="text-slate-500">No ingredients found in meal plan</p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Footer */}
                                <div className="px-6 pb-6 pt-0 flex justify-center">
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-950/50 border border-slate-200/50 dark:border-slate-800/50">
                                        <Sparkles size={12} className="text-amber-500" />
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                                            Miracle Products are highlighted in gold
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-10 border-t">

                            {showDailyNutrients && (
                                <div className="space-y-6 animate-in slide-in-from-top-4">
                                    {/* Summaries categorized by health focus */}
                                    {(() => {
                                        const m = { ...plan.micronutrients };
                                        if (dailyMoringaGrams > 0) {
                                            const r = dailyMoringaGrams / 2;
                                            Object.entries(MORINGA_TSP.micronutrients).forEach(([k, v]) => {
                                                const match = findNutrientMatch(m, k);
                                                if (match) m[match] = (m[match] || 0) + (v * r);
                                            });
                                        }
                                        const getVal = (keys: string[]) => { for (const k of keys) if (m[k] !== undefined) return m[k]; return 0; };

                                        const NutrientGrid = ({ title, items, icon: Icon, theme = 'indigo', subtitle, breakdownLabels = [], forceRaw = false }: { title: string, items: Record<string, any[]>, icon: any, theme?: string, subtitle?: string, breakdownLabels?: string[], forceRaw?: boolean }) => {
                                            const themes = {
                                                indigo: { bg: "bg-slate-900 border-slate-800", text: "text-indigo-400", border: "border-slate-800", itemBorder: "border-indigo-900/50" },
                                                rose: { bg: "bg-slate-900 border-slate-800", text: "text-rose-400", border: "border-slate-800", itemBorder: "border-rose-900/50" },
                                                orange: { bg: "bg-slate-900 border-slate-800", text: "text-orange-400", border: "border-slate-800", itemBorder: "border-orange-900/50" },
                                                emerald: { bg: "bg-slate-900 border-slate-800", text: "text-emerald-400", border: "border-slate-800", itemBorder: "border-emerald-900/50" },
                                                blue: { bg: "bg-slate-900 border-slate-800", text: "text-blue-400", border: "border-slate-800", itemBorder: "border-blue-900/50" },
                                                amber: { bg: "bg-slate-900 border-slate-800", text: "text-amber-400", border: "border-slate-800", itemBorder: "border-amber-900/50" }
                                            };
                                            const t = (themes as any)[theme] || themes.indigo;

                                            return (
                                                <div className={cn("p-6 pt-5 rounded-3xl border bg-gradient-to-br mb-6", t.bg)}>
                                                    <h4 className={cn("font-black flex items-center gap-2 mb-1 uppercase tracking-widest text-[10px]", t.text)}><Icon className="h-4 w-4" /> {title}</h4>
                                                    {subtitle && <p className={cn("text-[9px] text-slate-400 mb-4 border-b pb-2 transition-colors", t.border)}>{subtitle}</p>}
                                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                                        {Object.entries(items).map(([label, keys]) => {
                                                            let val = 0;
                                                            let rda = null;
                                                            let unitStr = '';

                                                            const m_map = m || {};

                                                            if (title === 'Biological Ratios') {
                                                                const k1 = findNutrientMatch(m_map, keys[0]);
                                                                const k2 = findNutrientMatch(m_map, keys[1]);
                                                                const v1 = k1 ? m_map[k1] : 0;
                                                                const v2 = k2 ? m_map[k2] : 0;
                                                                val = v2 > 0 ? v1 / v2 : 0;
                                                                unitStr = ': 1';
                                                            } else {
                                                                val = (label === 'Energy') ? (unit === 'kJ' ? plan.totalCalories * 4.184 : plan.totalCalories) :
                                                                    (label === 'Protein') ? plan.macros.protein :
                                                                        (label === 'Carbs') ? plan.macros.carbs :
                                                                            (label === 'Fat') ? plan.macros.fat :
                                                                                getVal(keys as string[]);

                                                                const macroRDAs: Record<string, number> = {
                                                                    'Energy': unit === 'kJ' ? Math.max(1200, Math.round((profile.gender === 'male' ? ((10 * (Number(profile.weight) || 70)) + (6.25 * (Number(profile.height) || 170)) - (5 * (Number(profile.age) || 30)) + 5) : ((10 * (Number(profile.weight) || 70)) + (6.25 * (Number(profile.height) || 170)) - (5 * (Number(profile.age) || 30)) - 161)) * 1.2)) * 4.184 : Math.max(1200, Math.round((profile.gender === 'male' ? ((10 * (Number(profile.weight) || 70)) + (6.25 * (Number(profile.height) || 170)) - (5 * (Number(profile.age) || 30)) + 5) : ((10 * (Number(profile.weight) || 70)) + (6.25 * (Number(profile.height) || 170)) - (5 * (Number(profile.age) || 30)) - 161)) * 1.2)),
                                                                    'Protein': (Number(profile.weight) || 70) * 1.6,
                                                                    'Carbs': 250,
                                                                    'Fat': 70
                                                                };
                                                                rda = userRDAs?.[label] || macroRDAs[label];
                                                                unitStr = (label === 'Energy') ? unit :
                                                                    (label === 'Protein' || label === 'Carbs' || label === 'Fat' || label === 'Fiber' || label === 'Sugars') ? 'g' :
                                                                        (label === 'Vitamin D') ? 'IU' :
                                                                            (label.includes('Folate') || label.includes('Selenium') || label.includes('Iodine') || label.includes('B12') || label === 'Vitamin A' || label === 'Vitamin K' || label.includes('�g')) ? '�g' : 'mg';
                                                            }

                                                            const pct = rda ? Math.round((val / rda) * 100) : null;
                                                            let styles = getNutrientLevelStyles(pct || 0, label);

                                                            // Custom styling for ratios
                                                            if (title === 'Biological Ratios') {
                                                                let ratioStatus: 'good' | 'fair' | 'poor' = 'good';
                                                                if (label === 'Sodium:Potassium') ratioStatus = val <= 1.0 ? 'good' : val <= 2.0 ? 'fair' : 'poor';
                                                                if (label === 'Zinc:Copper') ratioStatus = (val >= 8 && val <= 12) ? 'good' : (val >= 5 && val <= 15) ? 'fair' : 'poor';
                                                                if (label === 'Omega 6:3 Ratio') ratioStatus = val <= 4.0 ? 'good' : val <= 10.0 ? 'fair' : 'poor';
                                                                if (label === 'Calcium:Magnesium') ratioStatus = (val >= 1.7 && val <= 2.5) ? 'good' : (val >= 1.5 && val <= 3.0) ? 'fair' : 'poor';
                                                                if (label === 'Calcium:Phosphorus') ratioStatus = (val >= 1.0 && val <= 2.0) ? 'good' : (val >= 0.8 && val <= 2.5) ? 'fair' : 'poor';

                                                                styles = ratioStatus === 'good' ? { text: "text-emerald-500", borderLight: "border-emerald-500/30", fade: "bg-emerald-500/5", textFill: "text-emerald-500", bg: "bg-emerald-500", border: "border-emerald-500" } :
                                                                    ratioStatus === 'fair' ? { text: "text-amber-500", borderLight: "border-amber-500/30", fade: "bg-amber-500/5", textFill: "text-amber-500", bg: "bg-amber-500", border: "border-amber-500" } :
                                                                        { text: "text-rose-500", borderLight: "border-rose-500/30", fade: "bg-rose-500/5", textFill: "text-rose-500", bg: "bg-rose-500", border: "border-rose-500" };
                                                            }

                                                            const ratioTarget = title === 'Biological Ratios' ? (
                                                                label === 'Sodium:Potassium' ? 'Under 1:1' :
                                                                    label === 'Zinc:Copper' ? '8:1 - 12:1' :
                                                                        label === 'Omega 6:3 Ratio' ? 'Under 4:1' :
                                                                            label === 'Calcium:Magnesium' ? '1.7:1 - 2.5:1' :
                                                                                label === 'Calcium:Phosphorus' ? '1:1 - 2:1' : null
                                                            ) : null;

                                                            const labelColor = title === 'Biological Ratios' ? (
                                                                label === 'Sodium:Potassium' ? 'text-blue-400' :
                                                                    label === 'Zinc:Copper' ? 'text-orange-400' :
                                                                        label === 'Omega 6:3 Ratio' ? 'text-indigo-400' :
                                                                            label === 'Calcium:Magnesium' ? 'text-violet-400' :
                                                                                label === 'Calcium:Phosphorus' ? 'text-cyan-400' : 'text-foreground/60'
                                                            ) : 'text-foreground/60';

                                                            const hasBreakdown = breakdownLabels.includes(label);

                                                            return (
                                                                <div key={label} onClick={() => router.push(`/dashboard/widgets/nutridex/${encodeURIComponent(label)}`)} className={cn("p-4 rounded-2xl border bg-white dark:bg-slate-950 cursor-pointer hover:shadow-md transition-all relative group", t.itemBorder, (pct !== null || title === 'Biological Ratios') ? `${styles.borderLight} ${styles.fade}` : "")}>
                                                                    <p className={cn("text-[8px] uppercase font-black truncate mb-1 flex items-center gap-0.5 whitespace-nowrap overflow-hidden")}>
                                                                        {title === 'Biological Ratios' && label.includes(':') ? (
                                                                            <>
                                                                                <span className={
                                                                                    label.startsWith('Sodium') ? 'text-blue-400' :
                                                                                        label.startsWith('Zinc') ? 'text-orange-400' :
                                                                                            label.startsWith('Omega') ? 'text-indigo-400' :
                                                                                                label.startsWith('Calcium') && label.includes('Magnesium') ? 'text-violet-400' :
                                                                                                    label.startsWith('Calcium') && label.includes('Phosphorus') ? 'text-cyan-400' : ''
                                                                                }>
                                                                                    {label.split(':')[0]}
                                                                                </span>
                                                                                <span className="opacity-30 text-slate-500">:</span>
                                                                                <span className={
                                                                                    label.endsWith('Potassium') ? 'text-emerald-400' :
                                                                                        label.endsWith('Copper') ? 'text-rose-400' :
                                                                                            label.includes('3 Ratio') ? 'text-purple-400' :
                                                                                                label.endsWith('Magnesium') ? 'text-pink-400' :
                                                                                                    label.endsWith('Phosphorus') ? 'text-amber-400' : ''
                                                                                }>
                                                                                    {label.split(':')[1]}
                                                                                </span>
                                                                            </>
                                                                        ) : (
                                                                            <span className={labelColor}>{label}</span>
                                                                        )}
                                                                    </p>
                                                                    <div className="space-y-0.5">
                                                                        {(pct !== null && !forceRaw) ? (
                                                                            <>
                                                                                <div className="flex items-baseline gap-1">
                                                                                    <span className={cn("text-xl font-black tracking-tighter", styles.text)}>{pct}%</span>
                                                                                </div>
                                                                                <p className="text-[9px] font-bold text-slate-400">
                                                                                    {val.toFixed(1)}{unitStr}
                                                                                </p>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <div className="flex items-baseline gap-1">
                                                                                    <span className={cn("text-lg font-bold", title === 'Biological Ratios' ? styles.text : "")}>{val.toFixed(2)}</span>
                                                                                    <span className={cn("text-[10px] font-bold", (unitStr === '�g') ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground")}>{unitStr}</span>
                                                                                </div>
                                                                                {rda && (
                                                                                    <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                                                                                        Target: {Math.round(rda)}{unitStr === 'kcal' ? 'kcal' : unitStr}
                                                                                    </p>
                                                                                )}
                                                                                {ratioTarget && (
                                                                                    <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                                                                                        Ideal: {ratioTarget}
                                                                                    </p>
                                                                                )}
                                                                            </>
                                                                        )}
                                                                    </div>

                                                                    {hasBreakdown && (
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); setBreakdownNutrient(label); }}
                                                                            className="absolute top-2 right-2 p-1 rounded-lg bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400 opacity-40 group-hover:opacity-100 hover:bg-orange-200 dark:hover:bg-orange-800 transition-all border border-orange-200/50 dark:border-orange-700/50"
                                                                        >
                                                                            <Layers className="h-3 w-3" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        };

                                        return (
                                            <div className="space-y-6">
                                                <div className="pt-4 pb-2 border-b border-slate-100 dark:border-slate-800 mb-6">
                                                    <h3 className="text-sm font-black uppercase tracking-[0.3em] text-amber-500 italic flex items-center gap-2">
                                                        <Activity size={18} />
                                                        Personal Health Insights
                                                    </h3>
                                                </div>

                                                {(() => {
                                                    // Build source map: phytonutrient -> { description, sources (recipe titles) }
                                                    const allRecipes = [plan.breakfast, plan.lunch, plan.dinner, ...plan.snacks];
                                                    const phytoSourceMap: Record<string, { description: string; sources: string[] }> = {};
                                                    allRecipes.forEach(r => {
                                                        const phytos = plan.recipePhytonutrients?.[r.id];
                                                        if (phytos) {
                                                            Object.entries(phytos).forEach(([name, desc]) => {
                                                                if (!phytoSourceMap[name]) {
                                                                    phytoSourceMap[name] = { description: desc, sources: [] };
                                                                }
                                                                if (!phytoSourceMap[name].sources.includes(r.title)) {
                                                                    phytoSourceMap[name].sources.push(r.title);
                                                                }
                                                            });
                                                        }
                                                    });
                                                    if (Object.keys(phytoSourceMap).length === 0) return null;
                                                    return (
                                                        <DidYouKnow
                                                            phytonutrientsWithSources={phytoSourceMap}
                                                            className="mb-8"
                                                        />
                                                    );
                                                })()}

                                                <NutrientGrid title="Biological Ratios" icon={Dna} theme="amber" subtitle="Key nutrient balances for your overall wellbeing" items={{
                                                    'Sodium:Potassium': ['Sodium', 'Potassium'],
                                                    'Zinc:Copper': ['Zinc', 'Copper'],
                                                    'Omega 6:3 Ratio': ['Omega-6', 'Omega-3'],
                                                    'Calcium:Magnesium': ['Calcium', 'Magnesium'],
                                                    'Calcium:Phosphorus': ['Calcium', 'Phosphorus'],
                                                }} />

                                                <NutrientGrid title="Core Macronutrients" icon={Zap} theme="orange" subtitle="Caloric & Macro Breakdown" breakdownLabels={['Protein', 'Carbs', 'Fat']} items={{
                                                    'Energy': ['calories'],
                                                    'Protein': ['protein'],
                                                    'Carbs': ['carbs'],
                                                    'Fat': ['fat']
                                                }} />
                                                <NutrientGrid title="Electrolytes" icon={Zap} theme="indigo" subtitle="Hydration & Mineral Balance" items={{
                                                    'Sodium': ['Sodium', 'sodium_mg'],
                                                    'Potassium': ['Potassium', 'potassium_mg'],
                                                    'Magnesium': ['Magnesium', 'magnesium_mg'],
                                                    'Calcium': ['Calcium', 'calcium_mg'],
                                                    'Phosphorus': ['Phosphorus', 'phosphorus_mg']
                                                }} />
                                                <NutrientGrid title="Trace Minerals" icon={Gem} theme="rose" subtitle="Essential micro-minerals" items={{
                                                    'Iron': ['Iron', 'iron_mg'],
                                                    'Zinc': ['Zinc', 'zinc_mg'],
                                                    'Copper': ['Copper', 'copper_mg'],
                                                    'Manganese': ['Manganese', 'manganese_mg'],
                                                    'Selenium': ['Selenium', 'selenium_ug']
                                                }} />
                                                <NutrientGrid title="Daily Vitamins" icon={Droplet} theme="blue" subtitle="Water-soluble vitamins (B-Complex & C)" items={{
                                                    'B1 (Thiamine)': ['B1 (Thiamine)', 'thiamine_mg'],
                                                    'B2 (Riboflavin)': ['B2 (Riboflavin)', 'riboflavin_mg'],
                                                    'B3 (Niacin)': ['B3 (Niacin)', 'niacin_mg'],
                                                    'B5 (Pantothenic Acid)': ['B5 (Pantothenic Acid)', 'pantothenic_acid_mg'],
                                                    'B6 (Pyridoxine)': ['B6 (Pyridoxine)', 'vitamin_b6_mg'],
                                                    'B9 (Folate)': ['B9 (Folate)', 'folate_ug'],
                                                    'B12 (Cobalamin)': ['B12 (Cobalamin)', 'vitamin_b12_ug'],
                                                    'Vitamin C': ['Vitamin C', 'vitamin_c_mg'],
                                                    'Choline': ['Choline', 'choline_mg'],
                                                }} />
                                                <NutrientGrid title="Stored Vitamins" icon={Battery} theme="emerald" subtitle="Fat-soluble storage (A, D, E, K)" breakdownLabels={['Vitamin A', 'Vitamin E']} items={{
                                                    'Vitamin A': ['Vitamin A', 'vitamin_a_ug'],
                                                    'Vitamin D': ['Vitamin D', 'vitamin_d_iu', 'vitamin_d_ug'],
                                                    'Vitamin E': ['Vitamin E', 'vitamin_e_mg'],
                                                    'Vitamin K': ['Vitamin K', 'vitamin_k_ug'],
                                                }} />
                                                <NutrientGrid title="Extra Markers" icon={Activity} theme="amber" subtitle="Extra health markers worth tracking" forceRaw={true} items={{
                                                    'Fiber': ['Fiber', 'fiber_g'],
                                                    'Sugars': ['Sugars', 'sugars_g'],
                                                    'Oxalate': ['Oxalate', 'oxalate_mg'],
                                                    'Cholesterol': ['Cholesterol', 'cholesterol_mg'],
                                                }} />
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </div >
                    </div >
                )}
            </div >



            {/* NUTRIENT BREAKDOWN MODAL */}
            {
                breakdownNutrient && NUTRIENT_BREAKDOWNS[breakdownNutrient] && plan && (
                    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setBreakdownNutrient(null)}>
                        <div className="bg-background rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in zoom-in-95 fade-in duration-200" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setBreakdownNutrient(null)} className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full transition-colors"><X className="h-5 w-5" /></button>

                            <div className="flex items-center gap-3 mb-6">
                                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center",
                                    breakdownNutrient === 'Protein' ? "bg-red-100 dark:bg-red-900/50 text-red-600" :
                                        breakdownNutrient === 'Carbs' ? "bg-amber-100 dark:bg-amber-900/50 text-amber-600" :
                                            breakdownNutrient === 'Fat' ? "bg-orange-100 dark:bg-orange-900/50 text-orange-600" :
                                                "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600"
                                )}>
                                    <Layers className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold">{breakdownNutrient}</h3>
                                    <p className="text-sm text-muted-foreground">Constituent Breakdown</p>
                                </div>
                            </div>

                            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                                {NUTRIENT_BREAKDOWNS[breakdownNutrient].map(({ label, keys, unit, isEssential, hiddenByDefault, isExpandable }) => {
                                    // Skip hidden items unless expanded
                                    // For now, we assume 'Sugars (Total)' is the parent for all hidden items in Carbs
                                    if (hiddenByDefault && !expandedBreakdownSections['Sugars (Total)']) return null;

                                    const m = plan.micronutrients || {};
                                    let val = 0;
                                    for (const k of keys) {
                                        if (m[k] !== undefined) { val = m[k]; break; }
                                    }
                                    const isZero = val === 0;

                                    const activeColor = breakdownNutrient === 'Protein' ? "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" :
                                        breakdownNutrient === 'Carbs' ? "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" :
                                            breakdownNutrient === 'Fat' ? "text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800" :
                                                "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800";

                                    const isExpanded = isExpandable && expandedBreakdownSections[label];

                                    return (
                                        <div
                                            key={label}
                                            className={cn(
                                                "p-4 rounded-xl border transition-all animate-in fade-in slide-in-from-top-1 duration-200",
                                                isZero ? "bg-muted/30 border-border/50" : activeColor,
                                                hiddenByDefault ? "ml-8 border-l-4 border-l-current" : "", // Indent sub-items
                                            )}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("h-2 w-2 rounded-full flex-shrink-0",
                                                        isZero ? "bg-muted-foreground/30" :
                                                            breakdownNutrient === 'Protein' ? "bg-red-500" :
                                                                breakdownNutrient === 'Carbs' ? "bg-amber-500" :
                                                                    breakdownNutrient === 'Fat' ? "bg-orange-500" :
                                                                        "bg-emerald-500"
                                                    )} />
                                                    <div>
                                                        <div className="flex items-center gap-2"
                                                            onClick={() => {
                                                                if (isExpandable) {
                                                                    setExpandedBreakdownSections(prev => ({ ...prev, [label]: !prev[label] }));
                                                                }
                                                            }}
                                                        >
                                                            <span className={cn("font-medium block", isZero ? "text-muted-foreground" : "text-foreground", isExpandable ? "cursor-pointer hover:underline" : "")}>{label}</span>
                                                            {isExpandable && (
                                                                <ChevronDown className={cn("h-4 w-4 transition-transform opacity-50", isExpanded ? "rotate-180" : "")} />
                                                            )}
                                                        </div>
                                                        {isEssential && <span className="text-[9px] uppercase font-black tracking-wider bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded text-foreground/50">Essential</span>}
                                                    </div>
                                                </div>
                                                <div className="flex items-baseline gap-1">
                                                    <span className={cn("text-lg font-bold tabular-nums", isZero ? "text-muted-foreground" : "")}>
                                                        {val >= 1 ? val.toFixed(1) : val.toFixed(2)}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">{unit}</span>
                                                </div>
                                            </div>

                                            {/* Progress Bar for constituent */}
                                            {(() => {
                                                const rda = userRDAs?.[label];
                                                if (!rda || isZero) return null;
                                                const pct = Math.min(100, Math.round((val / rda) * 100));
                                                return (
                                                    <div className="space-y-1">
                                                        <div className="h-1.5 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                                                            <div
                                                                className={cn("h-full transition-all duration-1000",
                                                                    breakdownNutrient === 'Protein' ? "bg-red-500" :
                                                                        breakdownNutrient === 'Carbs' ? "bg-amber-500" :
                                                                            breakdownNutrient === 'Fat' ? "bg-orange-500" :
                                                                                "bg-emerald-500"
                                                                )}
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest opacity-40">
                                                            <span>Target Progress</span>
                                                            <span>{pct}% of {rda.toFixed(1)}{unit}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-6 pt-4 border-t border-border">
                                <p className="text-xs text-muted-foreground text-center">
                                    {breakdownNutrient === 'Vitamin A' && "Carotenoids (plant-based) are converted to retinol. Beta-carotene is the most efficient precursor."}
                                    {breakdownNutrient === 'Vitamin E' && "Alpha-tocopherol is the most biologically active form. Other tocopherols have antioxidant properties."}
                                    {breakdownNutrient === 'Protein' && "Essential amino acids cannot be made by the body and must come from food."}
                                    {breakdownNutrient === 'Carbs' && "Sugars include natural fruit sugars (fructose) and milk sugars (lactose). Added sugars should be minimized."}
                                    {breakdownNutrient === 'Fat' && "Unsaturated fats (Mono/Poly) are heart-healthy. Omega-3s are vital for brain & heart health."}
                                </p>
                            </div>
                        </div>
                    </div>
                )
            }

        </div >
    );
}

// Default export for Next.js page routing
export default function MealPlannerPage() {
    return <MealPlannerContent />;
}
