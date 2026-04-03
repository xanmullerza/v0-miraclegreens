import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChefHat, Clock, Users, Flame, ShoppingBasket, ShoppingCart, Check, CheckCircle2, X, Plus, Sparkles, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { formatEnergy } from '../utils';
import { RecipeListItemProps } from '../types';
import { useShoppingList } from '@/hooks/use-shopping-list';
import { toast } from 'sonner';

export const RecipeListItem = ({
    recipe, mealLabel, unit = 'kJ', onRegenerate, onMarkEaten, isEaten = false,
    pantryItems = [], onRecipeClick, showFlavours = false, showSupplements = false,
    selectedServings = 1,
}: RecipeListItemProps & { selectedServings?: number }) => {
    const router = useRouter();
    const [liveIngs, setLiveIngs] = useState(recipe.ingredients || []);
    const [liveRecipe, setLiveRecipe] = useState<any>(null); // Start with null to avoid stale render
    const [isLoading, setIsLoading] = useState(true);
    const [activePanel, setActivePanel] = useState<'stocked' | 'toBuy' | null>(null);
    const { items: shoppingItems, addItem: addShoppingItem } = useShoppingList();
    const [addedToList, setAddedToList] = useState(false);

    // Calculate nutrition values based on selectedServings (always normalized from 1 serving)
    // Use fresh recipe data (servings, calories) to handle recipe edits
    const displayRecipe = liveRecipe || recipe; // Fallback to recipe prop if liveRecipe not loaded yet
    const currentServings = Math.max(displayRecipe.servings || 1, 1);
    const sf = (1 / currentServings) * selectedServings;
    const displayCalories = (displayRecipe.calories || 0) * sf;
    const displayEnergy = (displayRecipe.energyKj || 0) * sf;
    const displayCarbs = (displayRecipe.carbs || 0) * sf;
    const displayFat = (displayRecipe.fat || 0) * sf;
    const displayProtein = (displayRecipe.protein || 0) * sf;

    // DEBUG
    console.log(`[${displayRecipe.title}] currentServings=${currentServings}, selectedServings=${selectedServings}, isLoading=${isLoading}, hasLiveData=${!!liveRecipe}, recipe.calories=${displayRecipe.calories}, recipe.energyKj=${displayRecipe.energyKj}, sf=${sf.toFixed(3)}, displayCalories=${displayCalories.toFixed(1)}, displayEnergy=${displayEnergy.toFixed(1)}`);

    // 1. Fetch fresh recipe metadata AND ingredients (to handle recipe edits)
    useEffect(() => {
        let cancelled = false;
        setIsLoading(true); // Reset loading when recipe changes
        
        // Fetch fresh recipe data - include all fields needed for display
        supabase.from('recipes')
            .select('id, title, servings, calories, energy_kj, protein, carbs, fat, micronutrients, image, type, prep_time')
            .eq('id', recipe.id)
            .single()
            .then(({ data: recipeData, error: recipeError }) => {
                if (!cancelled && recipeData && !recipeError) {
                    // Merge fresh recipe data with existing recipe, mapping snake_case to camelCase
                    const mappedRecipe = {
                        ...recipe, // Keep all original fields (diet, ingredients, instructions, etc.)
                        ...recipeData, // Override with fresh database data
                        energyKj: (recipeData as any).energy_kj, // Map energy_kj to energyKj
                        prepTime: (recipeData as any).prep_time, // Map prep_time to prepTime
                    };
                    setLiveRecipe(mappedRecipe as any);
                    setIsLoading(false); // Fresh data loaded
                }
            });
        
        // Fetch fresh ingredients
        supabase.from('ingredients')
            .select('item, base_ingredient, food_item_id, weight_g, amount, measure_label, is_miracle_product, food_items(name, common_name, category)')
            .eq('recipe_id', recipe.id)
            .then(({ data }) => {
                if (cancelled || !data || data.length === 0) return;
                setLiveIngs(data.map((i: any) => ({
                    item: i.item, amount: i.amount, isMiracleProduct: i.is_miracle_product,
                    baseIngredient: i.base_ingredient, food_item_id: i.food_item_id,
                    weightG: i.weight_g, measureLabel: i.measure_label,
                    foodName: i.food_items?.common_name || i.food_items?.name || null,
                    category: i.food_items?.category?.toLowerCase() || '',
                })));
            });
        return () => { cancelled = true; };
    }, [recipe.id]);

    // 2. Pantry Match Analysis
    const pantryIds = new Set(pantryItems.map(f => f.id));
    const pantryNames = new Set(pantryItems.flatMap(f => [
        (f.common_name || f.name || '').toLowerCase().trim(),
        (f.common_name || f.name || '').toLowerCase().trim() + 's'
    ]));

    const filteredIngs = liveIngs.filter(ing => {
        const cat = (ing as any).category || '';
        if (!showFlavours && cat === 'flavour') return false;
        if (!showSupplements && cat === 'supplements') return false;
        return true;
    });

    const stockedIngs = filteredIngs.filter(ing => 
        (ing.food_item_id && pantryIds.has(ing.food_item_id)) ||
        (ing.baseIngredient && pantryNames.has(ing.baseIngredient.toLowerCase().trim())) ||
        (ing.item && pantryNames.has(ing.item.toLowerCase().trim()))
    );

    const missingIngs = filteredIngs.filter(ing => !stockedIngs.includes(ing));
    const matchScore = filteredIngs.length > 0 ? stockedIngs.length / filteredIngs.length : 1;

    useEffect(() => {
        if (missingIngs.length === 0) { setAddedToList(false); return; }
        const allInList = missingIngs.every(m => shoppingItems.some((item: any) => 
            (item.food_item_id && m.food_item_id && item.food_item_id === m.food_item_id) ||
            (item.name || '').toLowerCase().includes((m.foodName || m.baseIngredient || m.item || '').toLowerCase().trim())
        ));
        setAddedToList(allInList);
    }, [missingIngs, shoppingItems]);

    const toBuyState = missingIngs.length === 0 ? 'ready' : addedToList ? 'toBuy' : 'toAdd';
    const tier = matchScore === 1 ? 'green' : matchScore >= 0.5 ? 'blue' : 'orange';
    const tierClasses = {
        green: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500',
        blue: 'border-blue-500/30 bg-blue-500/10 text-blue-500 hover:bg-blue-500',
        orange: 'border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500',
    };

    return (
        <div 
            onClick={() => onRecipeClick ? onRecipeClick(recipe.id) : router.push(`/recipes/${recipe.id}`)}
            className={cn(
                'group relative rounded-2xl border transition-all cursor-pointer overflow-hidden p-1 lg:p-0',
                isEaten ? 'bg-emerald-500/10 border-emerald-500/20 opacity-75' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500/30',
            )}
        >
            <div className="lg:grid lg:grid-cols-[100px_1fr_60px_60px_60px_60px_240px] gap-1.5 lg:items-center lg:px-6">
                <div className="aspect-[4/3] lg:aspect-square w-full lg:w-24 bg-slate-100 dark:bg-slate-800 overflow-hidden relative rounded-xl lg:rounded-none">
                    {displayRecipe.image ? (
                        <img src={displayRecipe.image} alt={displayRecipe.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300"><ChefHat size={18} /></div>
                    )}
                    <div className="absolute top-1 left-1 bg-black/60 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full backdrop-blur-sm uppercase">{mealLabel}</div>
                </div>

                <div className="p-1 lg:p-0">
                    <h3 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white capitalize">{displayRecipe.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center gap-0.5 text-[8px] text-slate-400 font-bold uppercase tracking-tighter"><Clock size={8}/>{displayRecipe.prepTime || 0}m</div>
                        <div className="flex items-center gap-0.5 text-[8px] text-slate-400 font-bold uppercase tracking-tighter"><Users size={8}/>{displayRecipe.servings}P</div>
                        <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[7px] border-none px-1 py-0">{displayRecipe.type}</Badge>
                    </div>
                </div>

                {/* Stats (Desktop View) */}
                <div className="hidden lg:flex flex-col items-end"><span className="text-[7px] font-black text-slate-400 uppercase">Energy</span><span className="font-black text-[10px]">{formatEnergy(displayCalories, unit)}</span></div>
                <div className="hidden lg:flex flex-col items-end"><span className="text-[7px] font-black text-slate-400 uppercase">Carbs</span><span className="font-black text-[10px]">{displayCarbs.toFixed(1)}g</span></div>
                <div className="hidden lg:flex flex-col items-end"><span className="text-[7px] font-black text-slate-400 uppercase">Fat</span><span className="font-black text-[10px]">{displayFat.toFixed(1)}g</span></div>
                <div className="hidden lg:flex flex-col items-end"><span className="text-[7px] font-black text-slate-400 uppercase">Protein</span><span className="font-black text-[10px]">{displayProtein.toFixed(1)}g</span></div>

                {/* Action Grid */}
                <div className="hidden lg:grid grid-cols-2 gap-1 px-4">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setActivePanel(activePanel === 'stocked' ? null : 'stocked'); }}
                        className={cn('text-[7px] font-black uppercase tracking-wide px-1.5 py-1 rounded-lg border hover:text-white transition-all flex items-center justify-center gap-0.5', tierClasses[tier])}
                    >
                        <ShoppingBasket size={8}/> {stockedIngs.length}/{filteredIngs.length} Stocked
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setActivePanel(activePanel === 'toBuy' ? null : 'toBuy'); }}
                        className={cn('text-[7px] font-black uppercase tracking-wide px-1.5 py-1 rounded-lg border hover:text-white transition-all flex items-center justify-center gap-0.5', toBuyState === 'toBuy' ? 'border-blue-500/30 bg-blue-500/10 text-blue-500 hover:bg-blue-500' : 'border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500')}
                    >
                        <ShoppingCart size={8}/> {missingIngs.length}/{filteredIngs.length} {toBuyState === 'toBuy' ? 'To Buy' : 'To Add'}
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); if(!isEaten && onMarkEaten) onMarkEaten(); }}
                        className={cn('text-[7px] font-black uppercase tracking-wide px-1.5 py-1 rounded-lg border flex items-center justify-center gap-0.5', isEaten ? 'bg-emerald-500 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-500')}
                    >
                        {isEaten ? <Check size={8}/> : null} {isEaten ? 'Eaten' : 'Mark Eaten'}
                    </button>
                    {onRegenerate && !isEaten && (
                        <button onClick={(e) => { e.stopPropagation(); onRegenerate(); }} className="text-[7px] font-black uppercase tracking-wide px-1.5 py-1 rounded-lg border bg-slate-50 dark:bg-slate-800 text-slate-500">
                           <RotateCcw size={8}/> Shuffle
                        </button>
                    )}
                </div>
            </div>

            {/* Inline ingredient list on mobile/panel click */}
            {activePanel && (
                <div className="border-t border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/50 animate-in slide-in-from-top-2">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {activePanel === 'stocked' ? 'In Your Pantry' : 'Shopping List'}
                        </h4>
                        <button onClick={() => setActivePanel(null)}><X size={12}/></button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {(activePanel === 'stocked' ? stockedIngs : missingIngs).map((ing, i) => (
                            <span key={i} className="text-[9px] font-bold px-2 py-1 rounded bg-white dark:bg-slate-800 border dark:border-slate-700 capitalize">
                                {ing.foodName || ing.baseIngredient || ing.item}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
