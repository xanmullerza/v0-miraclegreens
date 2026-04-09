'use client';

import React, { useState, useEffect, Fragment } from 'react';
import {
    Plus, Minus, List, Trash2, ChevronDown, CheckCircle2,
    Loader2, ShoppingBasket, Sparkles, Beef,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { fetchFoodMeasures } from '@/lib/utils/nutrition-calculator';
import { formatFoodName } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
    type ShoppingItem,
    SHOPPING_STORAGE_KEY,
    enrichmentCache,
    cn,
    getCategoryGroup,
    getCategoryColor,
    CATEGORY_ORDER,
    smartCombineQuantities,
    aggregateQuantities,
    formatGramsFull,
    PORTION_EXCLUDE_REGEX,
} from './shopping-types';
import { useShoppingList } from '@/hooks/use-shopping-list';
import { usePantry } from '@/hooks/use-pantry';
import { useFoodFilter, CATEGORIES } from '@/lib/context/food-filter-context';
import { mergeQuantityStrings, stripZeroEntries } from '../pantry/pantry-types';

export function ShoppingItemList() {
    const { items: hookItems, loading: hookLoading, removeItem: hookRemoveItem, addItem: hookAddItem, clearAll: hookClearAll } = useShoppingList();
    const { quantities, updateQuantity, addToPantry: dbAddToPantry } = usePantry();
    const { showFavoritesOnly, selectedCategories } = useFoodFilter();
    const [items, setItems] = useState<ShoppingItem[]>([]);
    const [enriching, setEnriching] = useState(false);

    // Expanded panel state
    const [expandedActionId, setExpandedActionId] = useState<string | null>(null);
    const [expandedRemoveId, setExpandedRemoveId] = useState<string | null>(null);
    const [expandedBreakdownId, setExpandedBreakdownId] = useState<string | null>(null);

    // Inline add panel state
    const [pantryAddItem, setPantryAddItem] = useState<ShoppingItem | null>(null);
    const [pantryAddQty, setPantryAddQty] = useState('1');
    const [pantryAddPortions, setPantryAddPortions] = useState<{ label: string; weight_g: number }[]>([]);
    const [pantryAddSelectedPortion, setPantryAddSelectedPortion] = useState<{ label: string; weight_g: number } | null>(null);
    const [pantryAddFoodId, setPantryAddFoodId] = useState<string | null>(null);

    // Pantry tick loading
    const [tickLoadingId, setTickLoadingId] = useState<string | null>(null);

    const clearAllPanels = () => {
        setExpandedActionId(null);
        setExpandedRemoveId(null);
        setExpandedBreakdownId(null);
        setPantryAddItem(null);
    };


    // ── Enrichment loop (Cloud First) ───────────────────────────
    useEffect(() => {
        let cancelled = false;
        const enrichAndCombine = async () => {
            if (hookLoading) return;
            
            let combined = [...hookItems].map(item => {
                const key = item.food_item_id || item.name.toLowerCase();
                const cached = enrichmentCache.get(key);
                if (cached) {
                    const u = { ...item };
                    if (!item.category && cached.category) u.category = cached.category;
                    if (!item.image && cached.image) u.image = cached.image;
                    if (!item.common_name && cached.common_name) u.common_name = cached.common_name;
                    if (!item.food_item_id && cached.id) u.food_item_id = cached.id;
                    return u;
                }
                return item;
            });

            const needById = combined.filter(i => i.food_item_id && (!i.category || !i.image));
            const needByName = combined.filter(i => !i.food_item_id && !i.category);

            if (needById.length > 0 || needByName.length > 0) {
                setEnriching(true);
                // ... same enrichment logic ...
                const idMap = new Map<string, any>();
                if (needById.length > 0) {
                    const ids = needById.map(i => i.food_item_id).filter(Boolean) as string[];
                    const { data } = await supabase.from('food_items').select('id, category, image, common_name, is_favorite').in('id', ids);
                    data?.forEach((d: any) => { idMap.set(d.id, d); enrichmentCache.set(d.id, d); });
                }
                
                const nameMap = new Map<string, any>();
                if (needByName.length > 0 && !cancelled) {
                    const names = [...new Set(needByName.map(i => i.name.toLowerCase()))];
                    const orConds = names.map(n => `name.ilike.%${n}%,common_name.ilike.%${n}%`).join(',');
                    const { data } = await supabase.from('food_items').select('id, name, common_name, category, image, is_favorite').or(orConds).limit(names.length * 5);
                    if (data) {
                        for (const searchName of names) {
                            let best: any = null, bestScore = 0;
                            for (const d of data) {
                                const dn = (d.name || '').toLowerCase(), dc = (d.common_name || '').toLowerCase();
                                let score = 0;
                                if (dn === searchName || dc === searchName) score = 4;
                                else if (dn.startsWith(searchName) || dc.startsWith(searchName)) score = 3;
                                else if (searchName.startsWith(dn) || searchName.startsWith(dc)) score = 2;
                                else if (dn.includes(searchName) || dc.includes(searchName)) score = 1;
                                if (score > bestScore) { bestScore = score; best = d; }
                            }
                            if (best) { nameMap.set(searchName, best); enrichmentCache.set(searchName, best); }
                        }
                    }
                }

                if (!cancelled) {
                    combined = combined.map(item => {
                        if (item.food_item_id && idMap.has(item.food_item_id)) {
                            const d = idMap.get(item.food_item_id);
                            return { ...item, category: item.category || d.category, image: item.image || d.image, common_name: item.common_name || d.common_name, is_favorite: d.is_favorite };
                        }
                        if (!item.category && nameMap.has(item.name.toLowerCase())) {
                            const d = nameMap.get(item.name.toLowerCase());
                            return { ...item, category: d.category, image: d.image, common_name: d.common_name, food_item_id: d.id, is_favorite: d.is_favorite };
                        }
                        return item;
                    });
                }
                setEnriching(false);
            }

            if (!cancelled) setItems(combined);
        };
        enrichAndCombine();
        return () => { cancelled = true; };
    }, [hookItems, hookLoading]);

    // ── Item actions ────────────────────────────────────────────

    const removeItem = async (id: string) => {
        await hookRemoveItem(id);
    };

    const confirmDelete = (item: ShoppingItem) => {
        const name = item.common_name || item.name;
        toast.custom(
            (t) => (
                <div className="bg-card border border-border rounded-lg p-4 shadow-lg max-w-sm">
                    <p className="text-sm font-semibold text-foreground mb-3">
                        Remove <span className="font-black text-rose-600 dark:text-rose-400">{name}</span> from list?
                    </p>
                    <div className="flex gap-2 justify-end">
                        <button onClick={() => toast.dismiss(t)} className="px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted rounded transition-colors">Cancel</button>
                        <button onClick={() => { toast.dismiss(t); removeItem(item.id); setExpandedActionId(null); }} className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded transition-colors">Remove</button>
                    </div>
                </div>
            ),
            { duration: Infinity }
        );
    };

    // ── Pantry tick (quick add) ─────────────────────────────────

    const quickAddToPantry = async (item: ShoppingItem) => {
        setTickLoadingId(item.id);
        try {
            let foodItemId = item.food_item_id || null;
            if (!foodItemId && item.name) {
                const normalize = (s: string) => s.replace(/\(.*?\)/g, '').replace(/[^a-zA-Z0-9 ]/g, '').trim();
                const { data } = await supabase.from('food_items').select('id, name, common_name, category, image').or(`name.ilike.%${normalize(item.name)}%,common_name.ilike.%${normalize(item.name)}%`).limit(1).maybeSingle();
                if (data) foodItemId = data.id;
            }
            if (!foodItemId) { await removeItem(item.id); return; }

            const rawQty = (item.quantity || '').trim();
            const qtyStr = rawQty.split(/\s*\+\s*/).map(s => s.trim()).filter(s => !/^as\s+needed$/i.test(s) && s.length > 0).join(' + ') || rawQty || '1';

            const currentPantryQty = quantities[foodItemId] || '';
            const merged = mergeQuantityStrings(currentPantryQty, qtyStr);
            const cleaned = stripZeroEntries(merged);

            if (currentPantryQty) {
                await updateQuantity(foodItemId, cleaned);
            } else {
                await dbAddToPantry({ id: foodItemId, name: item.name, common_name: item.common_name, category: item.category, image: item.image }, cleaned);
            }

            await removeItem(item.id);
            toast.success(`"${item.common_name || item.name}" added to pantry`);
        } catch (error) {
            console.error('Error adding to pantry:', error);
            toast.error('Failed to add to pantry');
        } finally {
            setTickLoadingId(null);
        }
    };

    // ── Inline add-more panel ───────────────────────────────────

    const openAddPanel = async (item: ShoppingItem) => {
        if (pantryAddItem?.id === item.id) { setPantryAddItem(null); return; }
        setExpandedRemoveId(null); setExpandedBreakdownId(null);

        const qtyMatch = (item.quantity || '1').match(/^(\d+(?:\.\d+)?)/);
        setPantryAddQty(qtyMatch ? qtyMatch[1] : '1');
        setPantryAddPortions([]); setPantryAddSelectedPortion(null); setPantryAddFoodId(null);
        setPantryAddItem(item);

        let foodItemId = item.food_item_id || null;
        if (!foodItemId && item.name) {
            try {
                const normalize = (s: string) => s.replace(/\(.*?\)/g, '').replace(/[^a-zA-Z0-9 ]/g, '').trim();
                const { data } = await supabase.from('food_items').select('id').or(`name.ilike.%${normalize(item.name)}%,common_name.ilike.%${normalize(item.name)}%`).limit(1).maybeSingle();
                if (data) foodItemId = data.id;
            } catch { /* ignore */ }
        }

        if (foodItemId) {
            setPantryAddFoodId(foodItemId);
            try {
                const measures = await fetchFoodMeasures(foodItemId);
                if (measures?.length) {
                    setPantryAddPortions(measures);
                    const filtered = measures.filter((m: any) => !PORTION_EXCLUDE_REGEX.test(m.label));
                    const seen = new Set<number>();
                    const deduped = filtered.filter((m: any) => { if (seen.has(m.weight_g)) return false; seen.add(m.weight_g); return true; });
                    const each = deduped.find((m: any) => /each/i.test(m.label));
                    setPantryAddSelectedPortion(each || deduped[0] || null);
                }
            } catch { /* ignore */ }
        }
    };

    const confirmAddToList = async () => {
        if (!pantryAddItem) return;
        const qty = pantryAddQty || '1';
        const qtyStr = pantryAddSelectedPortion ? `${qty} ${pantryAddSelectedPortion.label} (${pantryAddSelectedPortion.weight_g}g)` : qty;

        await hookAddItem({
            ...pantryAddItem,
            quantity: qtyStr,
        });
        
        setPantryAddItem(null);
    };

    // ── Group items by category ─────────────────────────────────
    
    // Filter based on global FoodFilterContext
    const filtered = items.filter(item => {
        // Filter by category
        if (selectedCategories.length < CATEGORIES.length) {
            const group = getCategoryGroup(item.category);
            if (!selectedCategories.includes(group)) return false;
        }
        
        // Filter by favorites
        if (showFavoritesOnly && !(item as any).is_favorite) return false;

        return true;
    });

    const grouped = filtered.reduce((acc, item) => {
        const g = getCategoryGroup(item.category);
        if (!acc[g]) acc[g] = [];
        acc[g].push(item);
        return acc;
    }, {} as Record<string, ShoppingItem[]>);

    // ── Render ──────────────────────────────────────────────────

    if (hookLoading || enriching) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="animate-spin text-emerald-500" size={32} />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Loading your list...</p>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-border rounded-2xl bg-card/50">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground/30 mb-4">
                    <ShoppingBasket size={32} />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">Your List is Empty</h3>
                <p className="text-muted-foreground text-center text-sm max-w-xs px-4">
                    Search for foods above to add items to your shopping list.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {filtered.length} item{filtered.length !== 1 ? 's' : ''}
                    {filtered.length < items.length && <span className="ml-1 opacity-50">({items.length} total)</span>}
                </p>
                <button
                    onClick={async () => {
                        if (!confirm('Clear all items from your grocery list?')) return;
                        if (hookClearAll) {
                            await hookClearAll();
                        } else {
                            // Fallback if clearAll not in hook yet
                            for (const item of hookItems) {
                                await hookRemoveItem(item.id);
                            }
                        }
                        toast.success('Grocery list cleared');
                    }}
                    className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-rose-500 transition-colors flex items-center gap-1.5"
                >
                    <Trash2 size={12} /> Clear All
                </button>
            </div>

            {/* Category Groups */}
            {Object.entries(grouped)
                .sort(([a], [b]) => {
                    const ia = CATEGORY_ORDER.indexOf(a), ib = CATEGORY_ORDER.indexOf(b);
                    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
                })
                .map(([group, groupItems]) => {
                    const colors = getCategoryColor(group);
                    return (
                        <div key={group} className={cn("rounded-xl border p-3", colors.bg, colors.border)}>
                            <div className="text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2 text-muted-foreground">
                                <colors.icon size={16} className="text-muted-foreground/60" />
                                {group}
                                <button
                                    onClick={() => { groupItems.forEach(i => removeItem(i.id)); toast.success(`${group} cleared`); }}
                                    className="ml-auto p-1 rounded-lg text-muted-foreground hover:bg-rose-100 dark:hover:bg-rose-950/40 hover:text-rose-500 transition-colors"
                                    title="Delete category"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                            <div className="space-y-1.5">
                                {groupItems.map(item => (
                                    <Fragment key={item.id}>
                                        {/* Item Row */}
                                        <div
                                            className="flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all bg-card border-border hover:border-emerald-400/50 cursor-pointer group"
                                            onClick={() => { clearAllPanels(); setExpandedActionId(expandedActionId === item.id ? null : item.id); }}
                                        >
                                            <div className="w-8 h-8 rounded-lg overflow-hidden bg-muted border-border shrink-0 flex items-center justify-center">
                                                {(item.image || item.image_url) ? (
                                                    <img src={item.image || item.image_url} alt={item.common_name || item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Beef size={16} className="text-muted-foreground/40" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1">
                                                    {item.is_miracle_product && <Sparkles size={10} className="text-amber-500 shrink-0" />}
                                                    <span className="font-black text-[11px] uppercase tracking-wide text-foreground truncate block">
                                                        {formatFoodName(item.common_name || item.name)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Pantry tick */}
                                            {(() => {
                                                const parts = (item.quantity || '').split(/\s*\+\s*/).map(s => s.trim()).filter(s => s.length > 0 && !/^as\s+needed$/i.test(s) && /\d/.test(s));
                                                const hasWeight = parts.length > 0;
                                                return (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); if (hasWeight) quickAddToPantry(item); }}
                                                        disabled={tickLoadingId === item.id || !hasWeight}
                                                        title={hasWeight ? 'Add to pantry' : 'Add a weight first'}
                                                        className={cn(
                                                            "p-1 rounded-full border-2 transition-all shrink-0",
                                                            hasWeight
                                                                ? "border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                                                                : "border-border text-muted-foreground/30 cursor-not-allowed"
                                                        )}
                                                    >
                                                        {tickLoadingId === item.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                                                    </button>
                                                );
                                            })()}

                                            <button
                                                onClick={(e) => { e.stopPropagation(); clearAllPanels(); setExpandedActionId(expandedActionId === item.id ? null : item.id); }}
                                                className={cn(
                                                    "p-1 rounded-lg transition-all shrink-0",
                                                    expandedActionId === item.id ? "text-emerald-500 bg-emerald-100 dark:bg-emerald-950/40" : "text-muted-foreground hover:text-emerald-500"
                                                )}
                                            >
                                                <ChevronDown size={12} className={cn("transition-transform", expandedActionId === item.id && "rotate-180")} />
                                            </button>
                                        </div>

                                        {/* Action Buttons */}
                                        {expandedActionId === item.id && (
                                            <div className="flex items-center gap-2 justify-center px-2 py-2 bg-muted/30 border border-t-0 border-border rounded-b-lg">
                                                <button onClick={(e) => { e.stopPropagation(); openAddPanel(item); }} className="p-2 rounded-lg text-muted-foreground hover:bg-emerald-100 dark:hover:bg-emerald-950/40 hover:text-emerald-500" title="Add more"><Plus size={16} /></button>
                                                <button onClick={(e) => { e.stopPropagation(); setPantryAddItem(null); setExpandedBreakdownId(null); setExpandedRemoveId(expandedRemoveId === item.id ? null : item.id); }} className="p-2 rounded-lg text-muted-foreground hover:bg-rose-100 dark:hover:bg-rose-950/40 hover:text-rose-500" title="Remove"><Minus size={16} /></button>
                                                <button onClick={(e) => { e.stopPropagation(); setPantryAddItem(null); setExpandedRemoveId(null); setExpandedBreakdownId(expandedBreakdownId === item.id ? null : item.id); }} className="p-2 rounded-lg text-muted-foreground hover:bg-amber-100 dark:hover:bg-amber-950/40 hover:text-amber-500" title="Details"><List size={16} /></button>
                                                <button onClick={(e) => { e.stopPropagation(); confirmDelete(item); }} className="p-2 rounded-lg text-muted-foreground/30 hover:bg-rose-100 dark:hover:bg-rose-950/40 hover:text-rose-500" title="Delete"><Trash2 size={16} /></button>
                                            </div>
                                        )}

                                        {/* Remove Panel */}
                                        {expandedRemoveId === item.id && (
                                            <div className="p-3 rounded-lg border border-rose-200 dark:border-rose-800/50 bg-rose-50 dark:bg-rose-950/20 animate-in slide-in-from-top-2 duration-200">
                                                <p className="text-xs font-bold text-foreground mb-2">Remove from {item.name}</p>
                                                <div className="flex items-center gap-2">
                                                    <Button size="sm" variant="outline" onClick={async (e) => {
                                                        e.stopPropagation();
                                                        const qty = parseInt(item.quantity);
                                                        if (qty && qty > 1) {
                                                            await hookAddItem({ ...item, quantity: '-1' }); // useShoppingList should handle negative for subtraction
                                                        } else {
                                                            await hookRemoveItem(item.id);
                                                        }
                                                        setExpandedRemoveId(null);
                                                    }} className="h-8 px-3 text-xs">Remove 1</Button>
                                                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setExpandedRemoveId(null); }} className="h-8 px-3 text-xs text-muted-foreground">Cancel</Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Breakdown Panel */}
                                        {expandedBreakdownId === item.id && (
                                            <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 animate-in slide-in-from-top-2 duration-200">
                                                <p className="text-xs font-bold text-foreground mb-2">Package Details</p>
                                                <div className="flex justify-between items-center p-2 bg-card rounded border border-border">
                                                    <span className="text-xs text-foreground">{item.quantity} {item.unit}</span>
                                                    <span className="text-[10px] text-muted-foreground">Qty in list</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Add-More Panel */}
                                        {pantryAddItem?.id === item.id && (
                                            <div className="px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/20 animate-in slide-in-from-top-2 duration-200">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">Add to List</p>
                                                <div className="space-y-2">
                                                    <div>
                                                        <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">Qty</Label>
                                                        <Input type="number" min="0.1" step="1" value={pantryAddQty} onChange={(e) => setPantryAddQty(e.target.value)} onClick={(e) => e.stopPropagation()} className="w-full h-8 text-sm" />
                                                    </div>
                                                    {pantryAddPortions.length > 0 && (
                                                        <div>
                                                            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">Serving</Label>
                                                            <select
                                                                value={pantryAddSelectedPortion?.label || ''}
                                                                onChange={(e) => { const p = pantryAddPortions.find(p => p.label === e.target.value); if (p) setPantryAddSelectedPortion(p); }}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="w-full px-3 py-1.5 h-8 border border-border rounded-lg bg-card text-sm font-bold text-foreground"
                                                            >
                                                                <option value="">Weight...</option>
                                                                {(() => {
                                                                    const seen = new Set<number>();
                                                                    return pantryAddPortions
                                                                        .filter(p => !PORTION_EXCLUDE_REGEX.test(p.label))
                                                                        .filter(p => { if (seen.has(p.weight_g)) return false; seen.add(p.weight_g); return true; })
                                                                        .map(p => <option key={p.label} value={p.label}>{p.label} ({p.weight_g}g)</option>);
                                                                })()}
                                                            </select>
                                                        </div>
                                                    )}
                                                    <Button onClick={(e) => { e.stopPropagation(); confirmAddToList(); }} className="w-full h-8 gap-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-[9px]">
                                                        <Plus size={14} /> Add
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </Fragment>
                                ))}
                            </div>
                        </div>
                    );
                })}
        </div>
    );
}
