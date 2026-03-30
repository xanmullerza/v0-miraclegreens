import React from 'react';
import { useRouter } from 'next/navigation';
import { Star, ShoppingBasket, ShoppingCart, MathIcon as Plus, MathIcon as Trash2, X, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { FoodDetailContextType } from './types';
import { usePantry } from '@/hooks/use-pantry';
import { useShoppingList } from '@/hooks/use-shopping-list';
import { mergeQuantityStrings, stripZeroEntries, buildQuantityString } from '@/components/tracker/pantry/pantry-types';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function FoodManagement({ ctx, user }: { ctx: FoodDetailContextType, user: any }) {
    const router = useRouter();
    const { 
        food, isAdmin, toggleFavorite, handleDelete, managementSubView, setManagementSubView,
        quickAddQty, setQuickAddQty, quickAddWeight, setQuickAddWeight, quickAddUnit, setQuickAddUnit,
        selectedPortion, setSelectedPortion
    } = ctx;
    
    const { quantities, updateQuantity, addToPantry: dbAddToPantry, removeFromPantry } = usePantry();
    const { items: shoppingItems, addItem: addShoppingListItem, removeItem: removeShoppingItem } = useShoppingList();

    if (!food) return null;

    const canEditDelete = isAdmin || (food.user_id && food.user_id === user?.id);

    return (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Favourite Toggle */}
            <button
                onClick={toggleFavorite}
                className={cn(
                    'w-full flex items-center gap-4 p-4 rounded-2xl border transition-all group text-left',
                    food.is_favorite
                        ? 'border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10 hover:bg-amber-100/60 dark:hover:bg-amber-900/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-100/60 dark:hover:bg-slate-800/30'
                )}
            >
                <div className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg',
                    food.is_favorite ? 'bg-amber-400 shadow-amber-400/20' : 'bg-slate-200 dark:bg-slate-700 shadow-slate-200/20'
                )}>
                    <Star size={16} className={food.is_favorite ? 'text-white fill-white' : 'text-slate-500 dark:text-slate-300'} />
                </div>
                <div className="flex-1">
                    <p className={cn('text-xs font-black uppercase tracking-[0.15em]', food.is_favorite ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-300')}>
                        {food.is_favorite ? 'Remove from Favourites' : 'Add to Favourites'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {food.is_favorite ? 'Tap to unfavourite this food' : 'Pin this food to your favourites'}
                    </p>
                </div>
                <Star size={14} className={cn('shrink-0', food.is_favorite ? 'text-amber-400 fill-amber-400' : 'text-slate-300')} />
            </button>

            {/* Pantry & Shopping Buttons */}
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={() => setManagementSubView(managementSubView === 'pantry' ? null : 'pantry')}
                    className={cn(
                        'flex items-center gap-3 p-4 rounded-2xl border transition-all group text-left',
                        managementSubView === 'pantry'
                            ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/20 ring-1 ring-emerald-400/30'
                            : quantities[food.id]
                                ? 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-900/10 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/20'
                                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-100/60 dark:hover:bg-slate-800/30'
                    )}
                >
                    <div className={cn(
                        'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-lg',
                        quantities[food.id] ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-slate-200 dark:bg-slate-700 shadow-slate-200/20'
                    )}>
                        <ShoppingBasket size={14} className={quantities[food.id] ? 'text-white' : 'text-slate-500 dark:text-slate-300'} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className={cn('text-xs font-black uppercase tracking-[0.15em]', quantities[food.id] ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300')}>Pantry</span>
                        {quantities[food.id] && (
                            <p className="text-[10px] text-emerald-500/70 font-medium mt-0.5 truncate">{quantities[food.id]}</p>
                        )}
                    </div>
                </button>

                <button
                    onClick={() => setManagementSubView(managementSubView === 'shopping' ? null : 'shopping')}
                    className={cn(
                        'flex items-center gap-3 p-4 rounded-2xl border transition-all group text-left',
                        managementSubView === 'shopping'
                            ? 'border-violet-400 dark:border-violet-600 bg-violet-50/50 dark:bg-violet-900/20 ring-1 ring-violet-400/30'
                            : shoppingItems.some(i => i.food_item_id === food.id)
                                ? 'border-violet-200 dark:border-violet-800/50 bg-violet-50/50 dark:bg-violet-900/10 hover:bg-violet-100/60 dark:hover:bg-violet-900/20'
                                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-100/60 dark:hover:bg-slate-800/30'
                    )}
                >
                    <div className={cn(
                        'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-lg',
                        shoppingItems.some(i => i.food_item_id === food.id) ? 'bg-violet-500 shadow-violet-500/20' : 'bg-slate-200 dark:bg-slate-700 shadow-slate-200/20'
                    )}>
                        <ShoppingCart size={14} className={shoppingItems.some(i => i.food_item_id === food.id) ? 'text-white' : 'text-slate-500 dark:text-slate-300'} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className={cn('text-xs font-black uppercase tracking-[0.15em]', shoppingItems.some(i => i.food_item_id === food.id) ? 'text-violet-600 dark:text-violet-400' : 'text-slate-600 dark:text-slate-300')}>Shopping</span>
                        {shoppingItems.some(i => i.food_item_id === food.id) && (
                            <p className="text-[10px] text-violet-500/70 font-medium mt-0.5">On list</p>
                        )}
                    </div>
                </button>
            </div>

            {/* Pantry Sub-Panel */}
            {managementSubView === 'pantry' && (
                <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/30 dark:bg-emerald-900/10 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-2">Pantry Quantity</p>
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            min="1"
                            value={quickAddQty}
                            onChange={(e) => setQuickAddQty(e.target.value)}
                            className="w-16 h-9 text-center text-sm font-bold bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-800"
                        />
                        {food.portions && food.portions.length > 0 ? (
                            <select
                                value={selectedPortion?.label || ''}
                                onChange={(e) => {
                                    const p = food.portions?.find(p => p.label === e.target.value);
                                    setSelectedPortion(p || null);
                                }}
                                className="flex-1 h-9 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 text-xs font-bold px-2"
                            >
                                <option value="">Whole</option>
                                {food.portions.map(p => (
                                    <option key={p.label} value={p.label}>{p.label} ({p.weight_g}g)</option>
                                ))}
                            </select>
                        ) : (
                            <div className="flex items-center gap-1.5 flex-1">
                                <Input
                                    type="number"
                                    placeholder="Weight"
                                    value={quickAddWeight}
                                    onChange={(e) => setQuickAddWeight(e.target.value)}
                                    className="flex-1 h-9 text-sm font-bold bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-800"
                                />
                                <select
                                    value={quickAddUnit}
                                    onChange={(e) => setQuickAddUnit(e.target.value)}
                                    className="w-14 h-9 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 text-xs font-bold px-1"
                                >
                                    <option value="g">g</option>
                                    <option value="kg">kg</option>
                                    <option value="ml">ml</option>
                                    <option value="L">L</option>
                                    <option value="oz">oz</option>
                                    <option value="lb">lb</option>
                                </select>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={async () => {
                                const quantityString = buildQuantityString(quickAddQty, selectedPortion, quickAddWeight, quickAddUnit);
                                const currentQty = quantities[food.id] || '';
                                try {
                                    if (currentQty) {
                                        const merged = mergeQuantityStrings(currentQty, quantityString);
                                        const cleaned = stripZeroEntries(merged);
                                        await updateQuantity(food.id, cleaned);
                                    } else {
                                        await dbAddToPantry(food as any, quantityString);
                                    }
                                    toast.success(`Added to pantry: ${quantityString}`);
                                    setQuickAddQty('1');
                                    setQuickAddWeight('');
                                } catch { toast.error('Failed to update pantry'); }
                            }}
                            className="flex-1 h-9 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl"
                        >
                            <Plus size={14} className="mr-1" /> Add
                        </Button>
                        {quantities[food.id] && (
                            <Button
                                variant="outline"
                                onClick={async () => {
                                    await removeFromPantry(food.id);
                                    toast.success('Removed from pantry');
                                    setManagementSubView(null);
                                }}
                                className="h-9 border-rose-300 dark:border-rose-800 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-[10px] font-black uppercase tracking-widest rounded-xl"
                            >
                                <Trash2 size={14} className="mr-1" /> Remove
                            </Button>
                        )}
                    </div>
                    {quantities[food.id] && (
                        <p className="text-[10px] text-emerald-500/70 font-medium">Current: {quantities[food.id]}</p>
                    )}
                </div>
            )}

            {/* Shopping Sub-Panel */}
            {managementSubView === 'shopping' && (
                <div className="p-4 rounded-2xl border border-violet-200 dark:border-violet-800/50 bg-violet-50/30 dark:bg-violet-900/10 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-500 mb-2">Shopping List</p>
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            min="1"
                            value={quickAddQty}
                            onChange={(e) => setQuickAddQty(e.target.value)}
                            className="w-16 h-9 text-center text-sm font-bold bg-white dark:bg-slate-900 border-violet-200 dark:border-violet-800"
                        />
                        {food.portions && food.portions.length > 0 ? (
                            <select
                                value={selectedPortion?.label || ''}
                                onChange={(e) => {
                                    const p = food.portions?.find(p => p.label === e.target.value);
                                    setSelectedPortion(p || null);
                                }}
                                className="flex-1 h-9 rounded-lg border border-violet-200 dark:border-violet-800 bg-white dark:bg-slate-900 text-xs font-bold px-2"
                            >
                                <option value="">Whole</option>
                                {food.portions.map(p => (
                                    <option key={p.label} value={p.label}>{p.label} ({p.weight_g}g)</option>
                                ))}
                            </select>
                        ) : (
                            <div className="flex items-center gap-1.5 flex-1">
                                <Input
                                    type="number"
                                    placeholder="Weight"
                                    value={quickAddWeight}
                                    onChange={(e) => setQuickAddWeight(e.target.value)}
                                    className="flex-1 h-9 text-sm font-bold bg-white dark:bg-slate-900 border-violet-200 dark:border-violet-800"
                                />
                                <select
                                    value={quickAddUnit}
                                    onChange={(e) => setQuickAddUnit(e.target.value)}
                                    className="w-14 h-9 rounded-lg border border-violet-200 dark:border-violet-800 bg-white dark:bg-slate-900 text-xs font-bold px-1"
                                >
                                    <option value="g">g</option>
                                    <option value="kg">kg</option>
                                    <option value="ml">ml</option>
                                    <option value="L">L</option>
                                    <option value="oz">oz</option>
                                    <option value="lb">lb</option>
                                </select>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={async () => {
                                const quantityString = buildQuantityString(quickAddQty, selectedPortion, quickAddWeight, quickAddUnit);
                                await addShoppingListItem({
                                    name: food.name,
                                    quantity: quantityString,
                                    food_item_id: food.id,
                                    category: food.category
                                });
                                toast.success(`Added to shopping list: ${quantityString}`);
                                setQuickAddQty('1');
                                setQuickAddWeight('');
                            }}
                            className="flex-1 h-9 bg-violet-500 hover:bg-violet-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl"
                        >
                            <Plus size={14} className="mr-1" /> Add to List
                        </Button>
                        {shoppingItems.filter(i => i.food_item_id === food.id).length > 0 && (
                            <Button
                                variant="outline"
                                onClick={async () => {
                                    const matching = shoppingItems.filter(i => i.food_item_id === food.id);
                                    for (const item of matching) {
                                        await removeShoppingItem(item.id);
                                    }
                                    toast.success('Removed from shopping list');
                                }}
                                className="h-9 border-rose-300 dark:border-rose-800 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-[10px] font-black uppercase tracking-widest rounded-xl"
                            >
                                <Trash2 size={14} className="mr-1" /> Remove
                            </Button>
                        )}
                    </div>
                    {shoppingItems.filter(i => i.food_item_id === food.id).length > 0 && (
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-violet-500/70">On your list:</p>
                            {shoppingItems.filter(i => i.food_item_id === food.id).map(item => (
                                <div key={item.id} className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                                    <span>{item.quantity || '1'} × {item.name}</span>
                                    <button onClick={() => removeShoppingItem(item.id)} className="text-rose-400 hover:text-rose-300 p-0.5">
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Edit & Delete — admin or food creator only */}
            {canEditDelete && (
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => router.push(`/foods/new?edit=${food.id}`)}
                        className="flex items-center gap-3 p-4 rounded-2xl border border-blue-200 dark:border-blue-800/50 bg-blue-100/60 dark:bg-blue-900/20 hover:bg-blue-200/60 dark:hover:bg-blue-900/30 transition-all group text-left"
                    >
                        <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                            <Pencil size={14} className="text-white" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-[0.15em] text-blue-600 dark:text-blue-400">Edit</span>
                    </button>
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-3 p-4 rounded-2xl border border-rose-200 dark:border-rose-800/50 bg-rose-100/60 dark:bg-rose-900/20 hover:bg-rose-200/60 dark:hover:bg-rose-900/30 transition-all group text-left"
                    >
                        <div className="w-8 h-8 rounded-xl bg-rose-500 flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/20">
                            <Trash2 size={14} className="text-white" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-[0.15em] text-rose-600 dark:text-rose-400">Delete</span>
                    </button>
                </div>
            )}
        </div>
    );
}
