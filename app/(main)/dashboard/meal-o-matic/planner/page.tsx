'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DidYouKnow } from '@/components/DidYouKnow';
import { PageContainer } from '@/components/ui/page-container';
import { cn } from '@/lib/utils';

import {
    Flame,
    Check,
    CheckCircle2,
    ChevronRight,
    RotateCcw,
    ChefHat,
    ShoppingBasket,
    ShoppingCart,
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
    Database,
    CalendarDays,
    HelpCircle,
    Package,
    ShoppingBag,
    Leaf,
    Loader2,
    ArrowRight
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
import { generateDailyPlan, DailyPlan, getRandomRecipeByType } from '@/lib/utils/meal-generator';
import { supabase } from '@/lib/supabase';
import { scaleIngredient } from '@/lib/utils/recipe-scaling';
import Link from 'next/link';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { getNutrientLevelStyles } from '@/lib/utils/nutrient-styles';
import { useRouter } from 'next/navigation';
import { useSearch } from '@/lib/context/search-context';
import { HeroSearch } from '@/components/ui/hero-search';

import { FoodItemCreatorContent } from '../maker/food/page';
import { UserRecipeBuilder as MealBuilderContent } from '../maker/meal/page';
import { UserRecipeBuilder as MixBuilderContent } from '../maker/mix/page';

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

    // Always use live DB ingredients so stale plan snapshots don't show removed items
    const [liveIngs, setLiveIngs] = useState(recipe.ingredients || []);
    useEffect(() => {
        let cancelled = false;
        supabase
            .from('ingredients')
            .select('item, base_ingredient, food_item_id, weight_g, amount, measure_label, is_miracle_product, food_items(name, common_name)')
            .eq('recipe_id', recipe.id)
            .then(({ data }) => {
                if (cancelled || !data || data.length === 0) return;
                setLiveIngs(data.map((i: any) => ({
                    item: i.item,
                    amount: i.amount,
                    isMiracleProduct: i.is_miracle_product,
                    baseIngredient: i.base_ingredient,
                    food_item_id: i.food_item_id,
                    weightG: i.weight_g,
                    measureLabel: i.measure_label,
                    // Use the food_items table name instead of the stale ingredient name
                    foodName: i.food_items?.common_name || i.food_items?.name || null,
                })));
            });
        return () => { cancelled = true; };
    }, [recipe.id]);

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
    const recipeIngs = liveIngs;

    let matchCount = 0;
    const matchedIngredients: { name: string; food_item_id?: string }[] = [];
    const missingIngredients: { name: string; food_item_id?: string }[] = [];

    recipeIngs.forEach(ing => {
        const displayName = ing.foodName || ing.baseIngredient || ing.item;
        const isMatch = (ing.food_item_id && pantryIds.has(ing.food_item_id)) ||
            (ing.baseIngredient && pantryNames.has(ing.baseIngredient.toLowerCase().trim())) ||
            (ing.item && pantryNames.has(ing.item.toLowerCase().trim()));

        if (isMatch) {
            matchCount++;
            matchedIngredients.push({ name: displayName, food_item_id: ing.food_item_id });
        } else {
            missingIngredients.push({ name: displayName, food_item_id: ing.food_item_id });
        }
    });

    const matchScore = recipeIngs.length > 0 ? matchCount / recipeIngs.length : 0;
    // Deduplicate by food_item_id when available, otherwise by name
    const dedup = (arr: { name: string; food_item_id?: string }[]) => {
        const seen = new Set<string>();
        return arr.filter(item => {
            const key = item.food_item_id || item.name.toLowerCase().trim();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    };
    const uniqueMatched = dedup(matchedIngredients);
    const uniqueMissing = dedup(missingIngredients);
    const [activePanel, setActivePanel] = useState<'stocked' | 'toBuy' | null>(null);
    // Initialise from localStorage so the disabled state survives a page refresh
    const [addedToList, setAddedToList] = useState(() => {
        if (typeof window === 'undefined') return false;
        try {
            const list = JSON.parse(localStorage.getItem('vitala_shopping_manual_items') || '[]');
            return uniqueMissing.length > 0 && uniqueMissing.every(m =>
                list.some((item: any) =>
                    (item.food_item_id && m.food_item_id && item.food_item_id === m.food_item_id) ||
                    (item.name || '').toLowerCase().trim() === m.name.toLowerCase().trim()
                )
            );
        } catch { return false; }
    });
    // 3-state to-buy button: toAdd → toBuy → ready
    const toBuyState: 'toAdd' | 'toBuy' | 'ready' =
        uniqueMissing.length === 0 ? 'ready' : addedToList ? 'toBuy' : 'toAdd';

    // Re-check when live DB ingredients load in (uniqueMissing may change after fetch)
    useEffect(() => {
        if (typeof window === 'undefined' || addedToList) return;
        try {
            const list = JSON.parse(localStorage.getItem('vitala_shopping_manual_items') || '[]');
            if (uniqueMissing.length > 0 && uniqueMissing.every(m =>
                list.some((item: any) =>
                    (item.food_item_id && m.food_item_id && item.food_item_id === m.food_item_id) ||
                    (item.name || '').toLowerCase().trim() === m.name.toLowerCase().trim()
                )
            )) setAddedToList(true);
        } catch { /* ignore */ }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [liveIngs]);
    return (
        <div
            onClick={() => router.push(`/dashboard/library/meals/${recipe.id}`)}
            className={cn(
                "group relative rounded-2xl border hover:shadow-lg transition-all cursor-pointer overflow-hidden p-1 lg:p-0",
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
            <div className="lg:grid lg:grid-cols-[100px_1fr_60px_60px_60px_60px_240px] gap-1.5 lg:items-center lg:px-6">
                {/* Thumbnail */}
                <div className="aspect-[4/3] lg:aspect-square w-full lg:w-24 rounded-xl lg:rounded-none bg-slate-100 dark:bg-slate-950/50 overflow-hidden relative">
                    {recipe.image ? (
                        <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <ChefHat size={18} className="opacity-20" />
                        </div>
                    )}
                    <div className="absolute top-1 left-1 bg-black/60 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full backdrop-blur-sm uppercase">{mealLabel}</div>
                </div>

                {/* Info */}
                <div className="p-1 lg:p-0">
                    <h3 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white leading-tight capitalize">
                        {recipe.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center gap-0.5 text-[8px] text-slate-400 font-bold uppercase tracking-tighter">
                            <Clock size={8} />
                            {recipe.prepTime}m
                        </div>
                        <div className="flex items-center gap-0.5 text-[8px] text-slate-400 font-bold uppercase tracking-tighter">
                            <Users size={8} />
                            {recipe.servings}P
                        </div>
                        <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[7px] border-none uppercase tracking-wide px-1 py-0">
                            {recipe.type}
                        </Badge>
                    </div>

                    {/* Action Grid */}
                    {(() => {
                        // orange = <50% possessed, blue = 50-99%, green = 100%
                        const tier = matchScore === 1 ? 'green' : matchScore >= 0.5 ? 'blue' : 'orange';
                        const colors = {
                            green: { btn: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500' },
                            blue: { btn: 'border-blue-500/30 bg-blue-500/10 text-blue-500 hover:bg-blue-500' },
                            orange: { btn: 'border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500' },
                        };
                        const c = colors[tier];
                        return (
                            <div className="mt-2 grid grid-cols-2 gap-1 lg:hidden">
                                <button
                                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); setActivePanel(activePanel === 'stocked' ? null : 'stocked'); }}
                                    className={cn("text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg border hover:text-white transition-all flex items-center justify-center gap-1.5", c.btn, activePanel === 'stocked' && "ring-2 ring-offset-1 ring-current")}
                                >
                                    <ShoppingBasket size={10} />
                                    {matchCount} / {recipeIngs.length} Stocked
                                </button>
                                {toBuyState === 'ready' ? (
                                    <div className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 flex items-center justify-center gap-1.5">
                                        <Sparkles size={10} /> Ready
                                    </div>
                                ) : (
                                    <button
                                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); setActivePanel(activePanel === 'toBuy' ? null : 'toBuy'); }}
                                        className={cn(
                                            "text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg border hover:text-white transition-all flex items-center justify-center gap-1.5",
                                            toBuyState === 'toBuy'
                                                ? "border-blue-500/30 bg-blue-500/10 text-blue-500 hover:bg-blue-500"
                                                : "border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500",
                                            activePanel === 'toBuy' && "ring-2 ring-offset-1 ring-current"
                                        )}
                                    >
                                        {toBuyState === 'toBuy'
                                            ? <><ShoppingCart size={10} />{uniqueMissing.length} / {recipeIngs.length} To Buy</>
                                            : <><ShoppingBasket size={10} />{uniqueMissing.length} / {recipeIngs.length} To Add</>
                                        }
                                    </button>
                                )}
                                {onMarkEaten && (
                                    <button
                                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); if (!isEaten) onMarkEaten(); }}
                                        className={cn(
                                            "text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg border transition-all flex items-center justify-center gap-1.5",
                                            isEaten
                                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500 cursor-default"
                                                : "border-slate-500/30 bg-slate-500/10 text-slate-400 hover:bg-slate-500 hover:text-white"
                                        )}
                                    >
                                        {isEaten && <Check size={10} />}
                                        {isEaten ? "Eaten" : "Eaten?"}
                                    </button>
                                )}
                                {onRegenerate && !isEaten && (
                                    <button
                                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); onRegenerate(); }}
                                        className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg border border-slate-500/30 bg-slate-500/10 text-slate-400 hover:bg-slate-500 hover:text-white transition-all flex items-center justify-center gap-1.5"
                                    >
                                        <RotateCcw size={10} />
                                        Shuffle
                                    </button>
                                )}
                            </div>
                        );
                    })()}
                </div>

                {/* Stats (Desktop View) */}
                <div className="hidden lg:flex flex-col items-end gap-0.5">
                    <span className="text-[7px] uppercase font-black text-slate-400">Energy</span>
                    <span className="font-black text-[10px] text-slate-900 dark:text-white">{formatEnergy(recipe.calories, unit)}</span>
                </div>
                <div className="hidden lg:flex flex-col items-end gap-0.5">
                    <span className="text-[7px] uppercase font-black text-slate-400">Carbs</span>
                    <span className="font-black text-[10px] text-slate-900 dark:text-white">{recipe.carbs.toFixed(1)}g</span>
                </div>
                <div className="hidden lg:flex flex-col items-end gap-0.5">
                    <span className="text-[7px] uppercase font-black text-slate-400">Fat</span>
                    <span className="font-black text-[10px] text-slate-900 dark:text-white">{recipe.fat.toFixed(1)}g</span>
                </div>
                <div className="hidden lg:flex flex-col items-end gap-0.5">
                    <span className="text-[7px] uppercase font-black text-slate-400">Protein</span>
                    <span className="font-black text-[10px] text-slate-900 dark:text-white">{recipe.protein.toFixed(1)}g</span>
                </div>

                {/* Action Grid (Desktop only — last column) */}
                {(() => {
                    const tier = matchScore === 1 ? 'green' : matchScore >= 0.5 ? 'blue' : 'orange';
                    const colors = {
                        green: { btn: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500' },
                        blue: { btn: 'border-blue-500/30 bg-blue-500/10 text-blue-500 hover:bg-blue-500' },
                        orange: { btn: 'border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500' },
                    };
                    const c = colors[tier];
                    return (
                        <div className="hidden lg:grid grid-cols-2 gap-1">
                            <button
                                onClick={(e: React.MouseEvent) => { e.stopPropagation(); setActivePanel(activePanel === 'stocked' ? null : 'stocked'); }}
                                className={cn("text-[7px] font-black uppercase tracking-wide px-1.5 py-1 rounded-lg border hover:text-white transition-all flex items-center justify-center gap-0.5", c.btn, activePanel === 'stocked' && "ring-2 ring-offset-1 ring-current")}
                            >
                                <ShoppingBasket size={8} />
                                {matchCount}/{recipeIngs.length} Stocked
                            </button>
                            {toBuyState === 'ready' ? (
                                <div className="text-[7px] font-black uppercase tracking-wide px-1.5 py-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 flex items-center justify-center gap-0.5">
                                    <Sparkles size={8} /> Ready
                                </div>
                            ) : (
                                <button
                                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); setActivePanel(activePanel === 'toBuy' ? null : 'toBuy'); }}
                                    className={cn(
                                        "text-[7px] font-black uppercase tracking-wide px-1.5 py-1 rounded-lg border hover:text-white transition-all flex items-center justify-center gap-0.5",
                                        toBuyState === 'toBuy'
                                            ? "border-blue-500/30 bg-blue-500/10 text-blue-500 hover:bg-blue-500"
                                            : "border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500",
                                        activePanel === 'toBuy' && "ring-2 ring-offset-1 ring-current"
                                    )}
                                >
                                    {toBuyState === 'toBuy'
                                        ? <><ShoppingCart size={8} />{uniqueMissing.length}/{recipeIngs.length} To Buy</>
                                        : <><ShoppingBasket size={8} />{uniqueMissing.length}/{recipeIngs.length} To Add</>
                                    }
                                </button>
                            )}
                            {onMarkEaten ? (
                                <button
                                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); if (!isEaten) onMarkEaten(); }}
                                    className={cn(
                                        "text-[7px] font-black uppercase tracking-wide px-1.5 py-1 rounded-lg border transition-all flex items-center justify-center gap-0.5",
                                        isEaten
                                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500 cursor-default"
                                            : "border-slate-500/30 bg-slate-500/10 text-slate-400 hover:bg-slate-500 hover:text-white"
                                    )}
                                >
                                    {isEaten && <Check size={8} />}
                                    {isEaten ? "Eaten" : "Eaten?"}
                                </button>
                            ) : <div />}
                            {onRegenerate && !isEaten ? (
                                <button
                                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); onRegenerate(); }}
                                    className="text-[7px] font-black uppercase tracking-wide px-1.5 py-1 rounded-lg border border-slate-500/30 bg-slate-500/10 text-slate-400 hover:bg-slate-500 hover:text-white transition-all flex items-center justify-center gap-0.5"
                                >
                                    <RotateCcw size={8} /> Shuffle
                                </button>
                            ) : <div />}
                        </div>
                    );
                })()}
            </div>

            {/* Inline ingredient panel */}
            {activePanel && (
                <div
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    className="border-t border-slate-200 dark:border-slate-800 px-4 py-3 animate-in slide-in-from-top-2 duration-200"
                >
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                            {activePanel === 'stocked' ? (
                                <span className="flex items-center gap-1.5">
                                    <Check size={10} className="text-emerald-500" />
                                    In Your Pantry ({uniqueMatched.length})
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5">
                                    <ShoppingBasket size={10} className="text-amber-500" />
                                    Need to Buy ({uniqueMissing.length})
                                </span>
                            )}
                        </h4>
                        <button
                            onClick={() => setActivePanel(null)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {(activePanel === 'stocked' ? uniqueMatched : uniqueMissing).map((entry, i) => (
                            <span
                                key={entry.food_item_id || i}
                                className={cn(
                                    "text-[10px] font-bold px-2 py-1 rounded-md capitalize",
                                    activePanel === 'stocked'
                                        ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                                        : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                                )}
                            >
                                {entry.name}
                            </span>
                        ))}
                        {(activePanel === 'stocked' ? uniqueMatched : uniqueMissing).length === 0 && (
                            <span className="text-[10px] text-slate-400 italic">
                                {activePanel === 'stocked' ? 'No ingredients in pantry yet' : 'All ingredients stocked!'}
                            </span>
                        )}
                    </div>
                    {activePanel === 'toBuy' && uniqueMissing.length > 0 && (
                        <button
                            onClick={() => {
                                const currentList = JSON.parse(localStorage.getItem('vitala_shopping_manual_items') || '[]');
                                let addedCount = 0;
                                for (const entry of uniqueMissing) {
                                    const exists = currentList.some((item: any) =>
                                        (item.food_item_id && entry.food_item_id && item.food_item_id === entry.food_item_id) ||
                                        (item.name || '').toLowerCase().trim() === entry.name.toLowerCase().trim()
                                    );
                                    if (!exists) {
                                        currentList.push({
                                            id: `plan-${Date.now()}-${addedCount}`,
                                            name: entry.name,
                                            food_item_id: entry.food_item_id || null,
                                            quantity: 'As needed',
                                            unit: '',
                                            checked: false,
                                            source: 'mealplan'
                                        });
                                        addedCount++;
                                    }
                                }
                                localStorage.setItem('vitala_shopping_manual_items', JSON.stringify(currentList));
                                window.dispatchEvent(new CustomEvent('shopping-list-updated'));
                                setAddedToList(true);
                                toast.success(`${addedCount > 0 ? `${addedCount} item${addedCount !== 1 ? 's' : ''} added` : 'Already on your list'}`);
                            }}
                            disabled={addedToList}
                            className={cn(
                                "mt-2.5 w-full text-[10px] font-black uppercase tracking-widest py-2 rounded-lg border transition-all flex items-center justify-center gap-1.5",
                                addedToList
                                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 cursor-default"
                                    : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white cursor-pointer"
                            )}
                        >
                            <Plus size={10} /> {addedToList ? 'Added to Shopping List' : 'Add All to Shopping List'}
                        </button>
                    )}
                </div>
            )}
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

    // HeroSearch state
    const [heroSearchQuery, setHeroSearchQuery] = useState('');
    const [heroSearchResults, setHeroSearchResults] = useState<any[]>([]);
    const [isHeroSearching, setIsHeroSearching] = useState(false);
    const [isHeroActive, setIsHeroActive] = useState(false);
    const heroSearchTimeout = React.useRef<NodeJS.Timeout | null>(null);

    // Page mode state - planner or maker
    const [pageMode, setPageMode] = useState<'planner' | 'maker'>('planner');
    const [makerMode, setMakerMode] = useState<'menu' | 'food' | 'meal' | 'mix'>('menu');

    const MAKER_OPTIONS = [
        {
            id: 'food',
            label: 'New Food',
            description: 'Add a whole food ingredient with full nutrition data',
            icon: Leaf,
            iconColor: 'text-emerald-500',
            borderColor: 'border-emerald-500/30',
            bgColor: 'bg-emerald-500/10',
            hoverBorder: 'hover:border-emerald-500/60',
            shadowColor: 'hover:shadow-emerald-500/10',
        },
        {
            id: 'meal',
            label: 'New Recipe',
            description: 'Build a meal recipe with ingredients and instructions',
            icon: ChefHat,
            iconColor: 'text-amber-500',
            borderColor: 'border-amber-500/30',
            bgColor: 'bg-amber-500/10',
            hoverBorder: 'hover:border-amber-500/60',
            shadowColor: 'hover:shadow-amber-500/10',
        },
    ];

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

                    // Remove from pantry (only admin modifies global flag)
                    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
                    const { data: { user: currentUser } } = await supabase.auth.getUser();
                    const admin = !!(currentUser?.email && adminEmail && currentUser.email === adminEmail);

                    if (admin) {
                        const foodItemUpdate = await supabase
                            .from('food_items')
                            .update({ is_in_pantry: false } as any)
                            .eq('id', item.id);

                        if (foodItemUpdate.error) {
                            console.warn('[markEaten] Failed to remove', item.name, 'from pantry:', foodItemUpdate.error);
                        } else {
                            console.log('[markEaten] Auto-removed', item.name, 'from pantry and added to shopping list');
                        }
                    } else if (currentUser) {
                        // Non-admin: delete from per-user pantry_items
                        await supabase.from('pantry_items').delete().eq('user_id', currentUser.id).eq('food_item_id', item.id);
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
                const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
                const admin = !!(user?.email && adminEmail && user.email === adminEmail);

                const [foodItemsRes, pantryItemsRes] = await Promise.all([
                    admin
                        ? supabase.from('food_items')
                            .select('*')
                            .eq('is_in_pantry', true)
                        : Promise.resolve({ data: [], error: null }),
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

                // Merge in LocalStorage quantities — only overlay on already-fetched items,
                // and only create phantom entries for admins (non-admins use pantry_items)
                const saved = localStorage.getItem('pantry_quantities');
                if (saved) {
                    const localQ = JSON.parse(saved);
                    if (admin) {
                        Object.keys(localQ).forEach(id => {
                            if (!items.find(it => it.id === id)) {
                                items.push({ id: id, is_in_pantry: true });
                            }
                        });
                    }
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

    // Build a stable key from the current plan's recipe IDs so eaten state
    // is tied to THIS specific plan and resets when a new plan is generated.
    const planKey = plan
        ? `${plan.breakfast.id}_${plan.lunch.id}_${plan.dinner.id}`
        : null;

    const EATEN_STORAGE_KEY = 'vitala_eaten_meals';
    const eatenHydrated = React.useRef(false);

    const [eatenMeals, setEatenMeals] = useState<Set<string>>(new Set());

    // Restore eaten state from localStorage when planKey first becomes available
    useEffect(() => {
        if (!planKey) return;
        try {
            const saved = JSON.parse(localStorage.getItem(EATEN_STORAGE_KEY) || '{}');
            if (saved.planKey === planKey && Array.isArray(saved.meals) && saved.meals.length > 0) {
                setEatenMeals(new Set<string>(saved.meals));
            } else if (saved.planKey && saved.planKey !== planKey) {
                // Different plan — ensure we start fresh
                setEatenMeals(new Set());
            }
        } catch { /* ignore */ }
        // Mark hydration complete AFTER this render cycle so persist doesn't overwrite
        requestAnimationFrame(() => { eatenHydrated.current = true; });
    }, [planKey]);

    // Persist eaten state — only after hydration to avoid overwriting saved data
    useEffect(() => {
        if (!planKey || !eatenHydrated.current) return;
        localStorage.setItem(EATEN_STORAGE_KEY, JSON.stringify({
            planKey,
            meals: [...eatenMeals],
        }));
    }, [eatenMeals, planKey]);

    const [showRecipeNutrients, setShowRecipeNutrients] = useState(false);
    const [recipeMoringaGrams, setRecipeMoringaGrams] = useState(0);
    const [moringaGrams, setMoringaGrams] = useState(0);
    const [showDailyNutrients, setShowDailyNutrients] = useState(false);
    const [nutrientsView, setNutrientView] = useState<'closed' | 'essential' | 'advanced'>('closed');
    const [mineralThreshold, setMineralThreshold] = useState<50 | 75 | 100>(75);
    const [vitaminThreshold, setVitaminThreshold] = useState<50 | 75 | 100>(75);
    const [b7InfoOpen, setB7InfoOpen] = useState(false);
    const [dailyMoringaGrams, setDailyMoringaGrams] = useState(0);
    const [activeBoostContext, setActiveBoostContext] = useState<'daily' | 'recipe' | null>(null);
    const [breakdownNutrient, setBreakdownNutrient] = useState<string | null>(null);
    const [expandedBreakdownSections, setExpandedBreakdownSections] = useState<Record<string, boolean>>({});

    // Browse/Filter State
    const [localShowFavoritesOnly, setLocalShowFavoritesOnly] = useState(false);
    const [localSelectedTypes, setLocalSelectedTypes] = useState<string[]>(['breakfast', 'lunch', 'dinner']);

    const [showSummary, setShowSummary] = useState(false);
    const [alwaysSkip, setAlwaysSkip] = useState(skipPlannerQuiz);
    const { searchQuery } = useSearch();

    const showFavoritesOnly = externalShowFavoritesOnly !== undefined ? externalShowFavoritesOnly : localShowFavoritesOnly;
    const setShowFavoritesOnly = externalSetShowFavoritesOnly !== undefined ? externalSetShowFavoritesOnly : setLocalShowFavoritesOnly;
    const selectedTypes = externalSelectedTypes !== undefined ? externalSelectedTypes : localSelectedTypes;
    const setSelectedTypes = externalSetSelectedTypes !== undefined ? externalSetSelectedTypes : setLocalSelectedTypes;

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

    const handleShuffleAll = async () => {
        setEatenMeals(new Set());
        setGenerating(true);
        try {
            const newPlan = await generateDailyPlan({
                targetCalories: calories,
                diet,
                numMeals: 3,
                favoritesOnly: showFavoritesOnly,
                pantryItems,
                searchQuery,
            });
            setPlan(newPlan);
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


    return (
        <PageContainer maxWidth="max-w-7xl">
            <div className="space-y-8 animate-in fade-in duration-500 text-slate-800 dark:text-slate-100 pb-20">
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
                    powerButton={
                        <button
                            onClick={() => {
                                setPageMode(pageMode === 'maker' ? 'planner' : 'maker');
                                setMakerMode('menu');
                            }}
                            className={cn(
                                "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                                pageMode === 'maker'
                                    ? "bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/30"
                                    : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-amber-500 hover:bg-amber-500/10"
                            )}
                            title="Open Maker"
                        >
                            <Plus size={16} className={pageMode === 'maker' ? 'text-white rotate-45 transition-transform' : 'text-slate-900 dark:text-white transition-transform'} />
                        </button>
                    }
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

                {/* Maker Overlay */}
                {pageMode === 'maker' && (
                    <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 animate-in fade-in duration-300 flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                            <div className="flex items-center gap-3">
                                {makerMode !== 'menu' && (
                                    <button
                                        onClick={() => setMakerMode('menu')}
                                        className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                                        title="Back to Menu"
                                    >
                                        <ChevronRight size={16} className="rotate-180" />
                                    </button>
                                )}
                                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                    <Plus size={16} className="text-amber-500" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                                        {makerMode === 'menu' ? 'Maker' : `New ${makerMode}`}
                                    </h3>
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                        {makerMode === 'menu' ? 'Create new foods, meals & mixes' : 'Builder workspace'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setPageMode('planner')}
                                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                                title="Close"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        {/* Maker Options */}
                        {makerMode === 'menu' && (
                            <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center">
                                <div className="flex flex-col md:flex-row gap-6 w-full max-w-3xl">
                                    {MAKER_OPTIONS.map((option) => {
                                        const Icon = option.icon;
                                        return (
                                            <button
                                                key={option.id}
                                                onClick={() => setMakerMode(option.id as any)}
                                                className={cn(
                                                    'group text-left p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer flex-1',
                                                    'bg-white dark:bg-slate-900',
                                                    option.borderColor,
                                                    option.hoverBorder,
                                                    'hover:shadow-xl',
                                                    option.shadowColor,
                                                )}
                                            >
                                                <div className="flex flex-col items-start gap-4">
                                                    <div className={cn(
                                                        'w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110',
                                                        option.bgColor,
                                                    )}>
                                                        <Icon size={24} className={option.iconColor} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">{option.label}</h4>
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2">{option.description}</p>
                                                    </div>
                                                    <ArrowRight
                                                        size={20}
                                                        className={cn(
                                                            'shrink-0 transition-all duration-300 text-slate-300 dark:text-slate-600 self-end',
                                                            'group-hover:translate-x-1',
                                                        )}
                                                    />
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        {/* Inline Workspaces */}
                        {makerMode === 'food' && (
                            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                                <Suspense fallback={<div className="p-12 text-center text-slate-400"><Loader2 className="animate-spin inline mr-2" /></div>}>
                                    <FoodItemCreatorContent />
                                </Suspense>
                            </div>
                        )}
                        {makerMode === 'meal' && (
                            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                                <Suspense fallback={<div className="p-12 text-center text-slate-400"><Loader2 className="animate-spin inline mr-2" /></div>}>
                                    <MealBuilderContent />
                                </Suspense>
                            </div>
                        )}
                        {makerMode === 'mix' && (
                            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                                <Suspense fallback={<div className="p-12 text-center text-slate-400"><Loader2 className="animate-spin inline mr-2" /></div>}>
                                    <MixBuilderContent />
                                </Suspense>
                            </div>
                        )}
                    </div>
                )}

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
                            <div className="hidden lg:grid lg:grid-cols-[100px_1fr_60px_60px_60px_60px_240px] gap-1.5 px-6 pb-2 text-[8px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-1.5"><Camera size={12} /> Plate</div>
                                <div className="flex items-center gap-1.5"><ChefHat size={12} /> Meal Details</div>
                                <div className="text-right flex items-center justify-end gap-1.5"><Zap size={12} /> Energy</div>
                                <div className="text-right flex items-center justify-end gap-1.5"><Wheat size={12} /> Carbs</div>
                                <div className="text-right flex items-center justify-end gap-1.5"><Droplet size={12} /> Fat</div>
                                <div className="text-right flex items-center justify-end gap-1.5"><Beef size={12} /> Protein</div>
                                <div className="text-right flex items-center justify-end gap-1.5"><Activity size={12} /> Control</div>
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

                            {/* Macros + Minerals Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                                {/* Left: Macros */}
                                {(() => {
                                    const energyRdaKcal = Math.max(1200, Math.round((profile?.gender === 'male'
                                        ? ((10 * (Number(profile?.weight) || 70)) + (6.25 * (Number(profile?.height) || 170)) - (5 * (Number(profile?.age) || 30)) + 5)
                                        : ((10 * (Number(profile?.weight) || 70)) + (6.25 * (Number(profile?.height) || 170)) - (5 * (Number(profile?.age) || 30)) - 161)) * 1.2));
                                    const energyRda = unit === 'kJ' ? energyRdaKcal * 4.184 : energyRdaKcal;
                                    const proteinRda = userRDAs?.['Protein'] || (Number(profile?.weight) || 70) * 1.6;
                                    const carbsRda = userRDAs?.['Carbs'] || 250;
                                    const fatRda = userRDAs?.['Fat'] || 70;

                                    const energyVal = unit === 'kJ' ? plan.totalCalories * 4.184 : plan.totalCalories;
                                    const proteinVal = plan.macros.protein;
                                    const carbsVal = plan.macros.carbs;
                                    const fatVal = plan.macros.fat;

                                    const energyPct = Math.round((energyVal / energyRda) * 100);
                                    const proteinPct = Math.min(Math.round((proteinVal / proteinRda) * 100), 100);
                                    const carbsPct = Math.min(Math.round((carbsVal / carbsRda) * 100), 100);
                                    const fatPct = Math.min(Math.round((fatVal / fatRda) * 100), 100);

                                    // Donut segments — proportional to caloric contribution, ring fills to energy % of RDA (capped at 100%)
                                    const proteinCal = proteinVal * 4;
                                    const carbsCal = carbsVal * 4;
                                    const fatCal = fatVal * 9;
                                    const totalCal = proteinCal + carbsCal + fatCal || 1;
                                    const fillPct = Math.min(energyPct, 100) / 100;

                                    const carbsFrac = (carbsCal / totalCal) * fillPct;
                                    const fatFrac = (fatCal / totalCal) * fillPct;
                                    const proteinFrac = (proteinCal / totalCal) * fillPct;

                                    const R = 44, STROKE = 9, C = 2 * Math.PI * R;
                                    const seg = (offset: number, frac: number) => ({
                                        strokeDasharray: `${frac * C} ${C}`,
                                        strokeDashoffset: `${-offset * C}`,
                                        transition: 'stroke-dasharray 0.7s ease, stroke-dashoffset 0.7s ease',
                                    });
                                    let off = 0;
                                    const carbsSeg = seg(off, carbsFrac); off += carbsFrac;
                                    const fatSeg = seg(off, fatFrac); off += fatFrac;
                                    const proteinSeg = seg(off, proteinFrac);

                                    const fmt = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v % 1 === 0 ? `${v}` : v.toFixed(1);
                                    const remaining = Math.max(0, energyRda - energyVal);
                                    const over = energyVal > energyRda;

                                    const MacroBar = ({ pct, color }: { pct: number; color: string }) => (
                                        <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
                                        </div>
                                    );

                                    return (
                                        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4">
                                            {/* Top row: donut left, energy summary right */}
                                            <div className="flex items-center gap-4 mb-4">
                                                {/* Donut */}
                                                <div className="relative flex-shrink-0" style={{ width: 96, height: 96 }}>
                                                    <svg viewBox="0 0 96 96" className="w-full h-full -rotate-90">
                                                        <circle cx="48" cy="48" r={R} fill="none" stroke="currentColor" strokeWidth={STROKE} className="text-slate-200 dark:text-slate-800" />
                                                        <circle cx="48" cy="48" r={R} fill="none" stroke="#3b82f6" strokeWidth={STROKE} strokeLinecap="butt" style={carbsSeg} />
                                                        <circle cx="48" cy="48" r={R} fill="none" stroke="#f59e0b" strokeWidth={STROKE} strokeLinecap="butt" style={fatSeg} />
                                                        <circle cx="48" cy="48" r={R} fill="none" stroke="#f43f5e" strokeWidth={STROKE} strokeLinecap="butt" style={proteinSeg} />
                                                    </svg>
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                        <span className="text-base font-black text-slate-900 dark:text-white leading-none">{fmt(energyVal)}</span>
                                                        <span className="text-[8px] text-slate-400 font-bold mt-0.5">{unit}</span>
                                                    </div>
                                                </div>

                                                {/* Energy stats */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-baseline gap-1.5 flex-wrap">
                                                        <span className="text-2xl font-black text-slate-900 dark:text-white">{energyPct}%</span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">of daily target</span>
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                                        {fmt(energyVal)} / {fmt(energyRda)} {unit}
                                                    </div>
                                                    <div className={cn("text-[11px] font-bold mt-1.5", over ? "text-rose-500" : "text-emerald-500")}>
                                                        {over
                                                            ? `${fmt(energyVal - energyRda)} ${unit} over target`
                                                            : `${fmt(remaining)} ${unit} remaining`
                                                        }
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Macro bars */}
                                            <div className="space-y-2.5">
                                                {[
                                                    { label: 'Carbs', val: carbsVal, rda: carbsRda, pct: carbsPct, color: '#3b82f6', textColor: 'text-blue-500' },
                                                    { label: 'Fat', val: fatVal, rda: fatRda, pct: fatPct, color: '#f59e0b', textColor: 'text-amber-500' },
                                                    { label: 'Protein', val: proteinVal, rda: proteinRda, pct: proteinPct, color: '#f43f5e', textColor: 'text-rose-500' },
                                                ].map(({ label, val, rda, pct, color, textColor }) => (
                                                    <div key={label} className="flex items-center gap-2.5">
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 w-12 flex-shrink-0">{label}</span>
                                                        <MacroBar pct={pct} color={color} />
                                                        <span className={cn("text-[10px] font-black w-7 text-right flex-shrink-0", textColor)}>{pct}%</span>
                                                        <span className="text-[10px] text-slate-400 whitespace-nowrap flex-shrink-0">{val.toFixed(1)}g / {rda.toFixed(0)}g</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Right: Minerals Coverage */}
                                {(() => {
                                    const MINERALS = [
                                        { label: 'Sodium', keys: ['Sodium', 'sodium_mg'] },
                                        { label: 'Potassium', keys: ['Potassium', 'potassium_mg'] },
                                        { label: 'Magnesium', keys: ['Magnesium', 'magnesium_mg'] },
                                        { label: 'Calcium', keys: ['Calcium', 'calcium_mg'] },
                                        { label: 'Phosphorus', keys: ['Phosphorus', 'phosphorus_mg'] },
                                        { label: 'Iron', keys: ['Iron', 'iron_mg'] },
                                        { label: 'Zinc', keys: ['Zinc', 'zinc_mg'] },
                                        { label: 'Copper', keys: ['Copper', 'copper_mg'] },
                                        { label: 'Manganese', keys: ['Manganese', 'manganese_mg'] },
                                        { label: 'Selenium', keys: ['Selenium', 'selenium_ug'] },
                                    ];
                                    const micro = plan.micronutrients || {};
                                    const mineralData = MINERALS.map(({ label, keys }) => {
                                        let val = 0;
                                        for (const k of keys) {
                                            const match = findNutrientMatch(micro, k);
                                            if (match !== null && match !== undefined && micro[match] !== undefined) { val = micro[match]; break; }
                                        }
                                        const rda = userRDAs?.[label] || 0;
                                        const pct = rda > 0 ? Math.round((val / rda) * 100) : 0;
                                        return { label, pct };
                                    });
                                    const total = mineralData.length;
                                    const count = mineralData.filter(m => m.pct >= mineralThreshold).length;
                                    const thresholds: (50 | 75 | 100)[] = [50, 75, 100];
                                    const arcPct = total > 0 ? count / total : 0;
                                    const R2 = 38, S2 = 8, C2 = 2 * Math.PI * R2;
                                    return (
                                        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4 flex flex-col gap-4">
                                            {/* Threshold toggle */}
                                            <div className="flex gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5">
                                                {thresholds.map(t => (
                                                    <button
                                                        key={t}
                                                        onClick={() => setMineralThreshold(t)}
                                                        className={cn(
                                                            'flex-1 text-[10px] font-black py-1.5 rounded-md transition-all uppercase tracking-widest',
                                                            mineralThreshold === t
                                                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                                        )}
                                                    >
                                                        {t}%
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Donut + big number */}
                                            <div className="flex items-center justify-center gap-4">
                                                <div className="relative flex-shrink-0" style={{ width: 88, height: 88 }}>
                                                    <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90" overflow="visible">
                                                        <circle cx="40" cy="40" r={R2} fill="none" stroke="currentColor" strokeWidth={S2} className="text-slate-200 dark:text-slate-800" />
                                                        <circle cx="40" cy="40" r={R2} fill="none" stroke="#10b981" strokeWidth={S2} strokeLinecap="butt"
                                                            style={{ strokeDasharray: `${arcPct * C2} ${C2}`, transition: 'stroke-dasharray 0.7s ease' }} />
                                                    </svg>
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                        <span className="text-lg font-black text-slate-900 dark:text-white leading-none">{count}</span>
                                                        <span className="text-[8px] text-slate-400 font-bold">/ {total}</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-xl font-black text-slate-900 dark:text-white">{Math.round(arcPct * 100)}%</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-tight">minerals<br />≥ {mineralThreshold}% RDA</div>
                                                </div>
                                            </div>

                                            {/* Mineral pills */}
                                            <div className="grid grid-cols-2 gap-1.5">
                                                {mineralData.map(({ label, pct }) => {
                                                    const hit = pct >= mineralThreshold;
                                                    return (
                                                        <div key={label} className={cn(
                                                            'flex items-center justify-between rounded-lg px-2 py-1.5 text-[10px] font-bold border',
                                                            hit
                                                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                                                                : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-400'
                                                        )}>
                                                            <span>{label}</span>
                                                            <span className={hit ? 'font-black' : ''}>{pct}%</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })()}

                            </div>{/* end macros+minerals grid */}

                            {/* Second row: Often Overlooked + Vitamins */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                                {/* Left: Often Overlooked */}
                                {(() => {
                                    const OVERLOOKED = [
                                        { label: 'Water', keys: ['Water'], unit: 'g', rdaOverride: 700, color: '#06b6d4', desc: 'from food' },
                                        { label: 'Fiber', keys: ['Fiber', 'fiber_g'], unit: 'g', rdaOverride: null, color: '#22c55e', desc: null },
                                        { label: 'Vitamin D', keys: ['Vitamin D', 'vitamin_d_iu'], unit: 'IU', rdaOverride: null, color: '#f59e0b', desc: null },
                                        { label: 'Choline', keys: ['Choline', 'choline_mg'], unit: 'mg', rdaOverride: null, color: '#a855f7', desc: null },
                                    ];
                                    const micro = plan.micronutrients || {};
                                    return (
                                        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4 flex flex-col gap-3 order-2 md:order-1">
                                            <div>
                                                <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">Often Overlooked</div>
                                                <div className="text-[10px] text-slate-400 mt-0.5">Nutrients people rarely track</div>
                                            </div>
                                            <div className="space-y-3">
                                                {OVERLOOKED.map(({ label, keys, unit, rdaOverride, color, desc }) => {
                                                    let val = 0;
                                                    for (const k of keys) {
                                                        const match = findNutrientMatch(micro, k);
                                                        if (match !== null && match !== undefined && micro[match] !== undefined) { val = micro[match]; break; }
                                                    }
                                                    const rda = rdaOverride ?? (userRDAs?.[label] || 0);
                                                    const pct = rda > 0 ? Math.min(Math.round((val / rda) * 100), 150) : 0;
                                                    const barPct = Math.min(pct, 100);
                                                    return (
                                                        <div key={label}>
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">{label}</span>
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="text-[10px] text-slate-400">{val.toFixed(1)}{unit}{desc ? ` (${desc})` : ''}</span>
                                                                    {rda > 0 && <span className="text-[10px] font-black" style={{ color }}>{pct}%</span>}
                                                                </div>
                                                            </div>
                                                            <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                                                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${barPct}%`, backgroundColor: color }} />
                                                            </div>
                                                            {rda > 0 && (
                                                                <div className="text-[9px] text-slate-300 dark:text-slate-600 mt-0.5">
                                                                    target {rda % 1 === 0 ? rda : rda.toFixed(1)}{unit}{label === 'Water' ? ' (from food est.)' : ' RDA'}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Right: Vitamins 6+6 */}
                                {(() => {
                                    const ALL_VITAMINS = [
                                        { label: 'B1 (Thiamine)', fullName: 'Vitamin B1', subtitle: 'Thiamine' },
                                        { label: 'B2 (Riboflavin)', fullName: 'Vitamin B2', subtitle: 'Riboflavin' },
                                        { label: 'B3 (Niacin)', fullName: 'Vitamin B3', subtitle: 'Niacin' },
                                        { label: 'B5 (Pantothenic Acid)', fullName: 'Vitamin B5', subtitle: 'Pantothenic Acid' },
                                        { label: 'B6 (Pyridoxine)', fullName: 'Vitamin B6', subtitle: 'Pyridoxine' },
                                        { label: 'B7 (Biotin)', fullName: 'Vitamin B7', subtitle: 'Biotin', excludeFromCount: true },
                                        { label: 'B9 (Folate)', fullName: 'Vitamin B9', subtitle: 'Folate' },
                                        { label: 'B12 (Cobalamin)', fullName: 'Vitamin B12', subtitle: 'Cobalamin' },
                                        { label: 'Vitamin A', fullName: 'Vitamin A', subtitle: 'Retinol' },
                                        { label: 'Vitamin C', fullName: 'Vitamin C', subtitle: 'Ascorbic Acid' },
                                        { label: 'Vitamin E', fullName: 'Vitamin E', subtitle: 'Tocopherol' },
                                        { label: 'Vitamin K', fullName: 'Vitamin K', subtitle: 'Phylloquinone' },
                                    ];
                                    const micro = plan.micronutrients || {};
                                    const vitaminData = ALL_VITAMINS.map(({ label, fullName, subtitle, excludeFromCount }) => {
                                        let val = 0;
                                        const match = findNutrientMatch(micro, label);
                                        if (match !== null && match !== undefined && micro[match] !== undefined) { val = micro[match]; }
                                        const rda = userRDAs?.[label] || 0;
                                        const pct = rda > 0 ? Math.round((val / rda) * 100) : 0;
                                        return { label, fullName, subtitle, pct, excludeFromCount: !!excludeFromCount };
                                    });
                                    const counted = vitaminData.filter(v => !v.excludeFromCount);
                                    const count = counted.filter(v => v.pct >= vitaminThreshold).length;
                                    const total = counted.length;
                                    const arcPct = total > 0 ? count / total : 0;
                                    const R2 = 38, S2 = 8, C2 = 2 * Math.PI * R2;
                                    const thresholds: (50 | 75 | 100)[] = [50, 75, 100];
                                    return (
                                        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4 flex flex-col gap-4 order-1 md:order-2">
                                            {/* Threshold toggle */}
                                            <div className="flex gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5">
                                                {thresholds.map(t => (
                                                    <button
                                                        key={t}
                                                        onClick={() => setVitaminThreshold(t)}
                                                        className={cn(
                                                            'flex-1 text-[10px] font-black py-1.5 rounded-md transition-all uppercase tracking-widest',
                                                            vitaminThreshold === t
                                                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                                        )}
                                                    >
                                                        {t}%
                                                    </button>
                                                ))}
                                            </div>
                                            {/* Donut + big number */}
                                            <div className="flex items-center justify-center gap-4">
                                                <div className="relative flex-shrink-0" style={{ width: 88, height: 88 }}>
                                                    <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90" overflow="visible">
                                                        <circle cx="40" cy="40" r={R2} fill="none" stroke="currentColor" strokeWidth={S2} className="text-slate-200 dark:text-slate-800" />
                                                        <circle cx="40" cy="40" r={R2} fill="none" stroke="#8b5cf6" strokeWidth={S2} strokeLinecap="butt"
                                                            style={{ strokeDasharray: `${arcPct * C2} ${C2}`, transition: 'stroke-dasharray 0.7s ease' }} />
                                                    </svg>
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                        <span className="text-lg font-black text-slate-900 dark:text-white leading-none">{count}</span>
                                                        <span className="text-[8px] text-slate-400 font-bold">/ {total}</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-xl font-black text-slate-900 dark:text-white">{Math.round(arcPct * 100)}%</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-tight">vitamins<br />≥ {vitaminThreshold}% RDA</div>
                                                </div>
                                            </div>
                                            {/* Vitamin pills — 6+6 in 2 cols */}
                                            <div className="grid grid-cols-2 gap-1.5">
                                                {vitaminData.map(({ label, fullName, subtitle, pct, excludeFromCount }) => {
                                                    if (excludeFromCount) {
                                                        return (
                                                            <React.Fragment key={label}>
                                                                <button
                                                                    onClick={() => setB7InfoOpen(o => !o)}
                                                                    className="flex items-center justify-between rounded-lg px-2 py-2 font-bold border bg-slate-100 dark:bg-slate-800 border-transparent text-slate-400 hover:border-amber-400/40 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
                                                                >
                                                                    <div className="text-left">
                                                                        <div className="text-[10px] font-black">{fullName}</div>
                                                                        <div className="text-[8px] font-normal opacity-60">{subtitle}</div>
                                                                    </div>
                                                                    <HelpCircle className="w-4 h-4 text-amber-400 dark:text-amber-500 flex-shrink-0" />
                                                                </button>
                                                                {b7InfoOpen && (
                                                                    <div className="col-span-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 p-2.5 text-[9px] text-amber-800 dark:text-amber-300 leading-relaxed">
                                                                        <p className="font-black uppercase tracking-wide mb-1">Why isn't B7 (Biotin) tracked?</p>
                                                                        <ul className="space-y-0.5 list-none">
                                                                            <li>• Biotin is <strong>everywhere</strong> in food — deficiency is extremely rare in healthy people.</li>
                                                                            <li>• Your gut bacteria <strong>synthesise meaningful amounts</strong> of it continuously, independent of diet.</li>
                                                                            <li>• It has <strong>no established Tolerable Upper Intake Level</strong> — it's that safe.</li>
                                                                            <li>• Nutrition databases have <strong>incomplete biotin data</strong>, so any figure would be unreliable.</li>
                                                                            <li>• For these reasons it's <strong>rarely printed on food labels</strong> and excluded from most dietary tracking tools.</li>
                                                                        </ul>
                                                                    </div>
                                                                )}
                                                            </React.Fragment>
                                                        );
                                                    }
                                                    const hit = pct >= vitaminThreshold;
                                                    return (
                                                        <div key={label} className={cn(
                                                            'flex items-center justify-between rounded-lg px-2 py-2 font-bold border',
                                                            hit
                                                                ? 'bg-violet-500/10 border-violet-500/30 text-violet-600 dark:text-violet-400'
                                                                : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-400'
                                                        )}>
                                                            <div className="text-left">
                                                                <div className="text-[10px] font-black">{fullName}</div>
                                                                <div className="text-[8px] font-normal opacity-60">{subtitle}</div>
                                                            </div>
                                                            <span className={cn('text-[10px]', hit ? 'font-black' : '')}>{pct}%</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })()}

                            </div>{/* end overlooked+vitamins grid */}

                            {/* Action Buttons */}
                            <div className="grid grid-cols-3 gap-3 pt-2">
                                <button
                                    onClick={handleShuffleAll}
                                    className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all"
                                >
                                    <RotateCcw size={16} />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Shuffle All</span>
                                </button>
                                <button
                                    onClick={() => setNutrientView(nutrientsView === 'closed' ? 'essential' : 'closed')}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border transition-all",
                                        nutrientsView !== 'closed'
                                            ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600"
                                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10"
                                    )}
                                >
                                    <Activity size={16} />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Nutrients</span>
                                </button>
                                <button
                                    disabled
                                    className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-400 dark:text-slate-600 opacity-60 cursor-not-allowed transition-all"
                                >
                                    <CalendarDays size={16} />
                                    <span className="text-[9px] font-black uppercase tracking-widest">7 Day Plan</span>
                                </button>
                            </div>

                            <div className="space-y-4 pt-4 border-t">

                                {nutrientsView !== 'closed' && (
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
                                                    {/* ESSENTIAL NUTRIENTS CARD */}
                                                    {nutrientsView === 'essential' && (
                                                        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm animate-in fade-in slide-in-from-top-4">
                                                            <div className="pt-2 pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                                                                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-amber-500 italic flex items-center gap-2">
                                                                    <Activity size={18} />
                                                                    Essential Nutrients
                                                                </h3>
                                                            </div>

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

                                                            <button
                                                                onClick={() => setNutrientView('advanced')}
                                                                className="w-full mt-6 px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-foreground font-semibold text-sm transition-colors"
                                                            >
                                                                Advanced Nutrition →
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* ADVANCED ANALYSIS CARD */}
                                                    {nutrientsView === 'advanced' && (
                                                        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm animate-in fade-in slide-in-from-top-4">
                                                            <div className="pt-2 pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                                                                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-amber-500 italic flex items-center gap-2">
                                                                    <Activity size={18} />
                                                                    Advanced Analysis
                                                                </h3>
                                                            </div>

                                                            <NutrientGrid title="Extra Markers" icon={Activity} theme="amber" subtitle="Extra health markers worth tracking" forceRaw={true} items={{
                                                                'Fiber': ['Fiber', 'fiber_g'],
                                                                'Sugars': ['Sugars', 'sugars_g'],
                                                                'Oxalate': ['Oxalate', 'oxalate_mg'],
                                                                'Cholesterol': ['Cholesterol', 'cholesterol_mg'],
                                                            }} />
                                                            {(() => {
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
                                                                        className="mb-2"
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

                                                            <button
                                                                onClick={() => setNutrientView('essential')}
                                                                className="w-full mt-6 px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-foreground font-semibold text-sm transition-colors"
                                                            >
                                                                ← Back to Essential
                                                            </button>
                                                        </div>
                                                    )}
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

            </div>
        </PageContainer>
    );
}

// Default export for Next.js page routing
export default function MealPlannerPage() {
    return <MealPlannerContent />;
}
