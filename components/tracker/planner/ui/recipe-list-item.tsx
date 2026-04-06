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
    const [activePanel, setActivePanel] = useState<'stocked' | 'toBuy' | null>(null);
    const { items: shoppingItems, addItem: addShoppingItem } = useShoppingList();
    const [addedToList, setAddedToList] = useState(false);

    // Scale nutrition based on selectedServings
    const sf = selectedServings;
    const displayCalories = (recipe.calories || 0) * sf;
    const displayEnergy = (recipe.energy_kj || 0) * sf;
    const displayCarbs = (recipe.carbs || 0) * sf;
    const displayFat = (recipe.fat || 0) * sf;
    const displayProtein = (recipe.protein || 0) * sf;

    // Fetch fresh ingredients
    useEffect(() => {
        let cancelled = false;
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
                'group relative rounded-[2.5rem] transition-all duration-500 cursor-pointer overflow-hidden backdrop-blur-sm shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] hover:-translate-y-1',
                isEaten 
                    ? 'bg-emerald-500/5 opacity-60 grayscale-[0.3]' 
                    : 'bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800/90',
            )}

        >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 sm:p-4">
                {/* Image Section */}
                <div className="relative shrink-0 flex items-center">
                    <div className="aspect-[16/9] sm:aspect-square w-full sm:w-24 bg-slate-100 dark:bg-slate-800 overflow-hidden relative rounded-2xl shadow-xl ring-1 ring-white/5">

                        {recipe.image ? (
                            <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600"><ChefHat size={28} /></div>
                        )}
                        <div className="absolute top-1.5 left-1.5 bg-slate-900/80 backdrop-blur-md text-white text-[7px] font-black tracking-widest px-2 py-0.5 rounded-md uppercase">{mealLabel}</div>

                    </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 min-w-0 space-y-3 sm:space-y-4">
                    <div className="space-y-0.5">
                        <h3 className="font-bold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white capitalize leading-tight group-hover:text-blue-500 transition-colors truncate">{recipe.title}</h3>
                    </div>

                    {/* Stats Grid - Enhanced size */}
                    <div className="flex flex-wrap gap-2">
                        <div className="bg-white/10 dark:bg-slate-800/70 px-2 py-2 rounded-2xl flex flex-col items-center flex-1 min-w-0 shadow-lg backdrop-blur-sm ring-1 ring-white/5 transition-all group-hover:bg-white/15">

                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Energy</span>
                            <span className="font-black text-[11px] sm:text-xs tracking-tight text-slate-900 dark:text-white leading-none w-full text-center">{formatEnergy(displayCalories, unit, displayEnergy)}</span>
                        </div>
                        <div className="bg-white/10 dark:bg-slate-800/70 px-2 py-2 rounded-2xl flex flex-col items-center flex-1 min-w-0 shadow-lg backdrop-blur-sm ring-1 ring-white/5 transition-all group-hover:bg-white/15">

                            <span className="text-[9px] font-black text-blue-500/60 uppercase tracking-widest leading-none mb-2">Carbs</span>
                            <span className="font-black text-[11px] sm:text-xs tracking-tight text-slate-900 dark:text-white leading-none w-full text-center">{displayCarbs.toFixed(1)}g</span>
                        </div>
                        <div className="bg-white/10 dark:bg-slate-800/70 px-2 py-2 rounded-2xl flex flex-col items-center flex-1 min-w-0 shadow-lg backdrop-blur-sm ring-1 ring-white/5 transition-all group-hover:bg-white/15">

                            <span className="text-[9px] font-black text-amber-500/60 uppercase tracking-widest leading-none mb-2">Fat</span>
                            <span className="font-black text-[11px] sm:text-xs tracking-tight text-slate-900 dark:text-white leading-none w-full text-center">{displayFat.toFixed(1)}g</span>
                        </div>
                        <div className="bg-white/10 dark:bg-slate-800/70 px-2 py-2 rounded-2xl flex flex-col items-center flex-1 min-w-0 shadow-lg backdrop-blur-sm ring-1 ring-white/5 transition-all group-hover:bg-white/15">

                            <span className="text-[9px] font-black text-rose-500/60 uppercase tracking-widest leading-none mb-2">Protein</span>
                            <span className="font-black text-[11px] sm:text-xs tracking-tight text-slate-900 dark:text-white leading-none w-full text-center">{displayProtein.toFixed(1)}g</span>
                        </div>
                    </div>
                </div>

                {/* Actions Section */}
                <div className="flex flex-row sm:flex-col gap-2 pt-2 sm:pt-0 sm:pl-4 sm:w-44">

                    <div className="flex flex-1 sm:flex-none gap-2">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setActivePanel(activePanel === 'stocked' ? null : 'stocked'); }}
                            className={cn(
                                'flex-1 text-[7px] font-black uppercase tracking-widest h-8 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5',
                                tierClasses[tier].replace('border-emerald-500/30 ', '').replace('border-blue-500/30 ', '').replace('border-amber-500/30 ', '')
                            )}

                        >
                            <ShoppingBasket size={12}/> {stockedIngs.length}/{filteredIngs.length}
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setActivePanel(activePanel === 'toBuy' ? null : 'toBuy'); }}
                            className={cn(
                                'flex-1 text-[7px] font-black uppercase tracking-widest h-8 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5',
                                toBuyState === 'toBuy' ? 'bg-blue-500/10 text-blue-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                            )}

                        >
                            <ShoppingCart size={12}/> {missingIngs.length}/{filteredIngs.length}
                        </button>
                    </div>

                    <button 
                        onClick={(e) => { e.stopPropagation(); if(!isEaten && onMarkEaten) onMarkEaten(); }}
                        className={cn(
                            'sm:w-full text-[9px] font-black uppercase tracking-[0.15em] h-10 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg px-3',
                            isEaten 
                                ? 'bg-emerald-500 text-white shadow-emerald-500/20 order-first sm:order-last' 
                                : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-[1.02] active:scale-[0.98]'
                        )}
                    >
                        {isEaten ? <CheckCircle2 size={14}/> : null}
                        <span>{isEaten ? 'Eaten' : 'Log Meal'}</span>
                    </button>

                    {onRegenerate && !isEaten && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onRegenerate(); }}
                            className="hidden sm:flex w-full text-[8px] font-bold uppercase tracking-widest h-8 items-center justify-center gap-1.5 text-slate-400 hover:text-blue-500 transition-colors"
                        >
                            <RotateCcw size={11}/> Swap
                        </button>
                    )}
                </div>
            </div>

            {/* Expanded Panel Section */}
            {activePanel && (
                <div className="p-6 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xl animate-in slide-in-from-top-4 duration-300">

                    <div className="flex items-center justify-between mb-4">
                        <div className="space-y-0.5">
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white">
                                {activePanel === 'stocked' ? 'Pantry Analysis' : 'Shopping Requirements'}
                            </h4>
                            <p className="text-[9px] text-slate-500 font-medium">Molecular ingredients needed for this protocol</p>
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setActivePanel(null); }}
                            className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                        >
                            <X size={14}/>
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {(activePanel === 'stocked' ? stockedIngs : missingIngs).map((ing, i) => (
                            <div key={i} className="group/ing relative flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-700">

                                <div className={cn("w-1.5 h-1.5 rounded-full", activePanel === 'stocked' ? "bg-emerald-500" : "bg-blue-500")} />
                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 capitalize">
                                    {ing.foodName || ing.baseIngredient || ing.item}
                                </span>
                                {activePanel !== 'stocked' && (
                                    <button 
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            await addShoppingItem({
                                                name: ing.foodName || ing.baseIngredient || ing.item,
                                                quantity: ing.amount,
                                                food_item_id: ing.food_item_id
                                            });
                                            toast.success('Added to shopping list');
                                        }}
                                        className="ml-2 p-1 hover:text-blue-500 transition-colors"
                                    >
                                        <Plus size={10}/>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
