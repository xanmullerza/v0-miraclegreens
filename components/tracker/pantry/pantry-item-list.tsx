'use client';

import React, { useState, useEffect, Fragment } from 'react';
import {
    Plus, Minus, ShoppingBasket, Loader2, Trash2, Beef,
    ChevronDown, List,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { fetchFoodMeasures } from '@/lib/utils/nutrition-calculator';
import { formatFoodName } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { usePantry } from '@/hooks/use-pantry';
import { useShoppingList } from '@/hooks/use-shopping-list';
import { useFoodFilter, CATEGORIES } from '@/lib/context/food-filter-context';
import {
    type PantryFoodItem,
    type QuantityEntry,
    cn,
    getCategoryGroup,
    getCategoryColor,
    CATEGORY_ORDER,
    PANTRY_QUANTITIES_KEY,
    PORTION_EXCLUDE_REGEX,
    parseQuantityEntry,
    parseQuantityEntries,
    isWeightOnlyEntry,
    entryTotalGrams,
    formatGramsEntry,
    stripZeroEntries,
    buildQuantityString,
    mergeQuantityStrings,
    pluralizeUnit,
} from './pantry-types';

interface PantryItemListProps {
    refreshKey?: number;
}

export function PantryItemList({ refreshKey = 0 }: PantryItemListProps) {
    const { pantryItems, loading: pantryLoading, updateQuantity, removeFromPantry: dbRemoveFromPantry, refresh } = usePantry();
    const { addItem: addShoppingListItem } = useShoppingList();
    const { showFavoritesOnly, selectedCategories } = useFoodFilter();

    const [foods, setFoods] = useState<PantryFoodItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    // Expanded panel state
    const [expandedQuantityId, setExpandedQuantityId] = useState<string | null>(null);
    const [expandedAddId, setExpandedAddId] = useState<string | null>(null);
    const [expandedRemoveId, setExpandedRemoveId] = useState<string | null>(null);
    const [expandedBreakdownId, setExpandedBreakdownId] = useState<string | null>(null);

    // Add-more panel
    const [buyMoreItem, setBuyMoreItem] = useState<PantryFoodItem | null>(null);
    const [buyMoreQty, setBuyMoreQty] = useState('1');
    const [buyMoreWeight, setBuyMoreWeight] = useState('');
    const [buyMoreUnit, setBuyMoreUnit] = useState('g');
    const [buyMorePortions, setBuyMorePortions] = useState<{ label: string; weight_g: number }[]>([]);
    const [buyMoreSelectedPortion, setBuyMoreSelectedPortion] = useState<{ label: string; weight_g: number } | null>(null);
    const [buyMoreAdding, setBuyMoreAdding] = useState(false);

    // Remove panel
    const [removeItem, setRemoveItem] = useState<PantryFoodItem | null>(null);
    const [removeQty, setRemoveQty] = useState('1');
    const [removeWeight, setRemoveWeight] = useState('');
    const [removeUnit, setRemoveUnit] = useState('g');
    const [removePortions, setRemovePortions] = useState<{ label: string; weight_g: number }[]>([]);
    const [removeSelectedPortion, setRemoveSelectedPortion] = useState<{ label: string; weight_g: number } | null>(null);
    const [removeRemoving, setRemoveRemoving] = useState(false);

    // ── Fetch pantry ────────────────────────────────────────────
    useEffect(() => { refresh(); }, [refreshKey, refresh]);

    // Re-apply localStorage quantities from external updates
    useEffect(() => {
        const handler = () => {
            try {
                const saved = localStorage.getItem(PANTRY_QUANTITIES_KEY);
                if (!saved) return;
                const quantities: Record<string, string> = JSON.parse(saved);
                setFoods(prev => prev.map(item => quantities[item.id] !== undefined ? { ...item, quantity: quantities[item.id] } : item));
            } catch { /* ignore */ }
        };
        window.addEventListener('pantry-quantities-updated', handler);
        return () => window.removeEventListener('pantry-quantities-updated', handler);
    }, []);

    // Fetch portions for buyMoreItem
    useEffect(() => {
        if (!buyMoreItem) { setBuyMorePortions([]); setBuyMoreSelectedPortion(null); return; }
        const foodId = buyMoreItem.source_table === 'food_items' ? buyMoreItem.id : null;
        if (!foodId) return;
        fetchFoodMeasures(foodId).then(m => setBuyMorePortions(m || [])).catch(() => setBuyMorePortions([]));
    }, [buyMoreItem?.id]);

    // Fetch portions for removeItem
    useEffect(() => {
        if (!removeItem) { setRemovePortions([]); setRemoveSelectedPortion(null); return; }
        const foodId = removeItem.source_table === 'food_items' ? removeItem.id : null;
        if (!foodId) return;
        fetchFoodMeasures(foodId).then(m => setRemovePortions(m || [])).catch(() => setRemovePortions([]));
    }, [removeItem?.id]);

    useEffect(() => {
        setLoading(pantryLoading);
        if (!pantryLoading) {
            // Transform pantryItems to PantryFoodItem format if needed
            const items = pantryItems.map((item: any) => {
                const sp = item.scanned_products;
                const fi = item.food_items;
                const nutrition = sp?.nutrition || {};
                let category = fi?.category || 'General';
                if (category === 'General' && item.notes) {
                    const m = item.notes.match(/Category:\s*(\w+)/);
                    if (m) category = m[1];
                }
                return {
                    id: fi?.id || item.id,
                    name: sp?.name || fi?.name || item.custom_name || 'Personal Item',
                    common_name: fi?.common_name || sp?.name || fi?.name || item.custom_name || 'Personal Item',
                    energy_kcal: nutrition.energy || fi?.energy_kcal || 0,
                    protein_g: nutrition.protein || fi?.protein_g || 0,
                    carbs_g: nutrition.carbs || fi?.carbs_g || 0,
                    fat_g: nutrition.fat || fi?.fat_g || 0,
                    image: sp?.image_url || fi?.image || null,
                    is_in_pantry: true,
                    is_favorite: fi?.is_favorite || false,
                    category,
                    source_table: fi ? 'food_items' : 'pantry_items',
                    quantity: item.quantity,
                    pantry_item_id: item.id
                } as PantryFoodItem;
            });
            setFoods(items);
        }
    }, [pantryItems, pantryLoading]);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
            setIsAdmin(!!(user?.email && adminEmail && user.email === adminEmail));
        });
    }, []);

    // ── Actions ─────────────────────────────────────────────────

    const removeFromPantry = async (id: string, name: string) => {
        try {
            await dbRemoveFromPantry(id);
            toast.success(`${name} removed from pantry`);
        } catch { toast.error('Failed to remove item.'); }
    };

    const confirmDelete = (food: PantryFoodItem) => {
        const displayName = food.common_name || food.name;
        toast.custom(
            (t) => (
                <div className="bg-card border border-border rounded-lg p-4 shadow-lg max-w-sm">
                    <p className="text-sm font-semibold text-foreground mb-3">Remove <span className="font-black text-rose-600 dark:text-rose-400">{displayName}</span> from pantry?</p>
                    <div className="flex gap-2 justify-end">
                        <button onClick={() => toast.dismiss(t)} className="px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted rounded transition-colors">Cancel</button>
                        <button onClick={() => { toast.dismiss(t); removeFromPantry(food.id, food.name); }} className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded transition-colors">Remove</button>
                    </div>
                </div>
            ),
            { duration: Infinity }
        );
    };

    const confirmDeleteCategory = (categoryName: string, items: PantryFoodItem[]) => {
        if (items.length === 0) return;
        toast.custom(
            (t) => (
                <div className="bg-card border border-border rounded-lg p-4 shadow-lg max-w-sm">
                    <p className="text-sm font-semibold text-foreground mb-3">Remove all <span className="font-black text-rose-600 dark:text-rose-400">{items.length} {categoryName}</span> items?</p>
                    <div className="flex gap-2 justify-end">
                        <button onClick={() => toast.dismiss(t)} className="px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted rounded transition-colors">Cancel</button>
                        <button onClick={async () => {
                            toast.dismiss(t);
                            for (const food of items) {
                                const source = food.source_table || 'food_items';
                                if (source === 'pantry_items') { await supabase.from('pantry_items').delete().eq('id', food.id); }
                                else if (isAdmin) { await supabase.from('food_items').update({ is_in_pantry: false } as any).eq('id', food.id); }
                                try { const s = localStorage.getItem(PANTRY_QUANTITIES_KEY); if (s) { const q = JSON.parse(s); delete q[food.id]; localStorage.setItem(PANTRY_QUANTITIES_KEY, JSON.stringify(q)); } } catch { /* */ }
                            }
                            setFoods(prev => prev.filter(f => !items.find(i => i.id === f.id)));
                            toast.success(`${categoryName} category cleared`);
                        }} className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded transition-colors">Delete All</button>
                    </div>
                </div>
            ),
            { duration: Infinity }
        );
    };

    const clearPantry = async () => {
        if (!confirm('Remove all items from your pantry?')) return;
        try {
            const foodItemIds = foods.filter(f => f.source_table === 'food_items').map(f => f.id);
            const pantryItemIds = foods.filter(f => f.source_table === 'pantry_items').map(f => f.id);
            if (foodItemIds.length > 0 && isAdmin) { await supabase.from('food_items').update({ is_in_pantry: false } as any).in('id', foodItemIds); }
            if (pantryItemIds.length > 0) { await supabase.from('pantry_items').delete().in('id', pantryItemIds); }
            try { const s = localStorage.getItem(PANTRY_QUANTITIES_KEY); if (s) { const q = JSON.parse(s); foods.forEach(f => delete q[f.id]); localStorage.setItem(PANTRY_QUANTITIES_KEY, JSON.stringify(q)); } } catch { /* */ }
            setFoods([]);
            toast.success('Pantry cleared');
        } catch { toast.error('Failed to clear pantry'); }
    };

    // ── Add more / Remove stock handlers ────────────────────────

    const openBuyMore = (food: PantryFoodItem) => {
        if (expandedAddId === food.id) { setExpandedAddId(null); setBuyMoreItem(null); return; }
        setExpandedRemoveId(null); setRemoveItem(null);
        setBuyMoreItem(food); setBuyMoreQty('1'); setBuyMoreWeight(''); setBuyMoreUnit('g'); setBuyMoreSelectedPortion(null);
        setExpandedAddId(food.id);
    };

    const openRemove = (food: PantryFoodItem) => {
        if (expandedRemoveId === food.id) { setExpandedRemoveId(null); setRemoveItem(null); return; }
        setExpandedAddId(null); setBuyMoreItem(null);
        setRemoveItem(food); setRemoveQty('1'); setRemoveWeight(''); setRemoveUnit('g'); setRemoveSelectedPortion(null);
        setExpandedRemoveId(food.id);
    };

    const handleBuyMoreAdd = async () => {
        if (!buyMoreItem) return;
        setBuyMoreAdding(true);
        try {
            const quantityString = buildQuantityString(buyMoreQty, buyMoreSelectedPortion, buyMoreWeight, buyMoreUnit);
            const currentQty = buyMoreItem.quantity || '0';
            const merged = mergeQuantityStrings(currentQty, quantityString);
            const cleaned = stripZeroEntries(merged);
            
            await updateQuantity(buyMoreItem.id, cleaned);
            toast.success(`Updated quantity for ${buyMoreItem.common_name || buyMoreItem.name}`);
            setBuyMoreItem(null); setExpandedAddId(null);
        } catch { toast.error('Failed to add item'); }
        finally { setBuyMoreAdding(false); }
    };

    const handleRemove = async () => {
        if (!removeItem) return;
        setRemoveRemoving(true);
        try {
            const quantityString = buildQuantityString(removeQty, removeSelectedPortion, removeWeight, removeUnit);
            const saved = localStorage.getItem(PANTRY_QUANTITIES_KEY);
            const quantities: Record<string, string> = saved ? JSON.parse(saved) : {};
            const currentQty = quantities[removeItem.id] || removeItem.quantity || '0';

            const currentRaw = currentQty.split(/\s*\+\s*/).map(s => s.trim()).filter(Boolean);
            let currentGrams = 0;
            for (const entry of currentRaw) { const p = parseQuantityEntry(entry); currentGrams += (p.qty || 0) * (p.weight_g || 0); }
            const removeEntry = parseQuantityEntry(quantityString);
            const removeGrams = (removeEntry.qty || 0) * (removeEntry.weight_g || 0);
            const remainingGrams = Math.max(0, currentGrams - removeGrams);

            if (remainingGrams === 0 || currentGrams === 0) {
                // Depleted — add to shopping list
                await addShoppingListItem({
                    name: removeItem.common_name || removeItem.name,
                    quantity: 'As needed',
                    food_item_id: removeItem.id,
                    category: removeItem.category,
                    source: 'manual'
                });
                
                await dbRemoveFromPantry(removeItem.id);
                toast.success(`${removeItem.common_name || removeItem.name} depleted and moved to shopping list`);
            } else {
                // Subtract proportionally
                let gramsToRemove = removeGrams;
                const updatedEntries: string[] = [];
                for (const entry of currentRaw) {
                    const parsed = parseQuantityEntry(entry);
                    const entryG = (parsed.qty || 0) * (parsed.weight_g || 0);
                    if (entryG <= 0) continue;
                    if (gramsToRemove >= entryG) { gramsToRemove -= entryG; }
                    else if (gramsToRemove > 0 && parsed.weight_g && parsed.weight_g > 0) {
                        const remainingEntryG = entryG - gramsToRemove; gramsToRemove = 0;
                        if (parsed.label && !isWeightOnlyEntry(parsed)) {
                            const newQty = Math.max(0, Math.round((remainingEntryG / parsed.weight_g) * 100) / 100);
                            if (newQty > 0) updatedEntries.push(`${newQty} ${parsed.label} (${parsed.weight_g}g)`);
                        } else { updatedEntries.push(formatGramsEntry(remainingEntryG)); }
                    } else { updatedEntries.push(entry); }
                }
                const remainingStr = updatedEntries.length > 0 ? updatedEntries.join(' + ') : formatGramsEntry(remainingGrams);
                const cleaned = stripZeroEntries(remainingStr);
                
                await updateQuantity(removeItem.id, cleaned);
                toast.success(`Removed ${quantityString} from ${removeItem.common_name || removeItem.name}`);
            }
            setRemoveItem(null); setExpandedRemoveId(null);
        } catch { toast.error('Failed to remove quantity'); }
        finally { setRemoveRemoving(false); }
    };

    // ── Portion select helper ───────────────────────────────────
    const renderPortionSelect = (portions: { label: string; weight_g: number }[], selected: { label: string; weight_g: number } | null, onSelect: (p: { label: string; weight_g: number }) => void) => {
        const seen = new Set<number>();
        const filtered = portions.filter(p => !PORTION_EXCLUDE_REGEX.test(p.label)).filter(p => { if (seen.has(p.weight_g)) return false; seen.add(p.weight_g); return true; });
        if (filtered.length === 0) return null;
        return (
            <div>
                <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">Serving</Label>
                <select
                    value={selected?.label || ''}
                    onChange={(e) => { const p = filtered.find(p => p.label === e.target.value); if (p) onSelect(p); }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full px-3 py-2 h-8 border border-border rounded-lg bg-card text-sm font-bold text-foreground"
                >
                    <option value="">Weight...</option>
                    {filtered.map(p => <option key={p.label} value={p.label}>{p.label} ({p.weight_g}g)</option>)}
                </select>
            </div>
        );
    };

    // ── Group items ─────────────────────────────────────────────
    
    // Filter based on global FoodFilterContext
    const filtered = foods.filter(food => {
        // Filter by category
        if (selectedCategories.length < CATEGORIES.length) {
            const group = getCategoryGroup(food.category);
            if (!selectedCategories.includes(group)) return false;
        }
        
        // Filter by favorites
        if (showFavoritesOnly && !food.is_favorite) return false;

        return true;
    });

    const grouped = filtered.reduce((acc, food) => {
        const g = getCategoryGroup(food.category);
        if (!acc[g]) acc[g] = [];
        acc[g].push(food);
        return acc;
    }, {} as Record<string, PantryFoodItem[]>);

    const groupNames = Object.keys(grouped).sort((a, b) => {
        const ia = CATEGORY_ORDER.indexOf(a), ib = CATEGORY_ORDER.indexOf(b);
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });

    // ── Render ──────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="animate-spin text-amber-500" size={32} />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Checking your kitchen...</p>
            </div>
        );
    }

    if (foods.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-border rounded-2xl bg-card/50">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground/30 mb-4">
                    <ShoppingBasket size={32} />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">Pantry Empty</h3>
                <p className="text-muted-foreground text-center text-sm max-w-xs px-4">Search for foods above to stock your pantry.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {filtered.length} item{filtered.length !== 1 ? 's' : ''}
                    {filtered.length < foods.length && <span className="ml-1 opacity-50">({foods.length} total)</span>}
                </p>
                <button onClick={clearPantry} className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-rose-500 transition-colors flex items-center gap-1.5">
                    <Trash2 size={12} /> Clear All
                </button>
            </div>

            {/* Category Groups */}
            {groupNames.map((groupName) => {
                const items = grouped[groupName];
                const colors = getCategoryColor(groupName);
                return (
                    <div key={groupName} className={cn("rounded-xl border p-3", colors.bg, colors.border)}>
                        <div className="text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2 text-muted-foreground">
                            <colors.icon size={16} className="text-muted-foreground/60" />
                            {groupName}
                            <button onClick={(e) => { e.stopPropagation(); confirmDeleteCategory(groupName, items); }} className="ml-auto p-1 rounded-lg text-muted-foreground hover:bg-rose-100 dark:hover:bg-rose-950/40 hover:text-rose-500 transition-colors" title="Delete category">
                                <Trash2 size={12} />
                            </button>
                        </div>
                        <div className="space-y-1.5">
                            {items.map(food => (
                                <Fragment key={food.id}>
                                    {/* Item Row */}
                                    <div
                                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all bg-card border-border hover:border-amber-400/50 cursor-pointer"
                                        onClick={() => setExpandedQuantityId(expandedQuantityId === food.id ? null : food.id)}
                                    >
                                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-muted border-border shrink-0 flex items-center justify-center">
                                            {food.image ? <img src={food.image} alt={food.common_name || food.name} className="w-full h-full object-cover" /> : <Beef size={16} className="text-muted-foreground/40" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="font-black text-[11px] uppercase tracking-wide text-foreground truncate block">
                                                {formatFoodName(food.common_name || food.name)}
                                            </span>
                                        </div>

                                        {/* Weight badge */}
                                        {(() => {
                                            const rawEntries = parseQuantityEntries(food.quantity);
                                            if (rawEntries.length === 0) return <span className="text-[10px] font-bold text-muted-foreground/30 px-2 py-1 rounded-md bg-muted shrink-0">In Stock</span>;
                                            let totalG = 0;
                                            for (const raw of rawEntries) {
                                                const p = parseQuantityEntry(raw);
                                                if (p.qty > 0 && p.weight_g != null) totalG += p.qty * p.weight_g;
                                            }
                                            if (totalG > 0) return <span className="text-xs font-black text-white bg-emerald-900 px-3 py-1 rounded-md whitespace-nowrap shrink-0">{formatGramsEntry(totalG)}</span>;
                                            return null;
                                        })()}

                                        <button
                                            onClick={(e) => { e.stopPropagation(); setExpandedQuantityId(expandedQuantityId === food.id ? null : food.id); }}
                                            className={cn("p-1 rounded-lg transition-all shrink-0", expandedQuantityId === food.id ? "text-amber-500 bg-amber-100 dark:bg-amber-950/40" : "text-muted-foreground hover:text-amber-500")}
                                        >
                                            <ChevronDown size={12} className={cn("transition-transform", expandedQuantityId === food.id && "rotate-180")} />
                                        </button>
                                    </div>

                                    {/* Action Buttons */}
                                    {expandedQuantityId === food.id && (
                                        <div className="flex items-center gap-2 justify-center px-2 py-2 bg-muted/30 border border-t-0 border-border rounded-b-lg">
                                            <button onClick={(e) => { e.stopPropagation(); openBuyMore(food); }} className="p-2 rounded-lg text-muted-foreground hover:bg-amber-100 dark:hover:bg-amber-950/40 hover:text-amber-500" title="Add stock"><Plus size={16} /></button>
                                            <button onClick={(e) => { e.stopPropagation(); openRemove(food); }} className="p-2 rounded-lg text-muted-foreground hover:bg-rose-100 dark:hover:bg-rose-950/40 hover:text-rose-500" title="Remove stock"><Minus size={16} /></button>
                                            <button onClick={(e) => { e.stopPropagation(); setExpandedBreakdownId(expandedBreakdownId === food.id ? null : food.id); }} className="p-2 rounded-lg text-muted-foreground hover:bg-amber-100 dark:hover:bg-amber-950/40 hover:text-amber-500" title="Stock breakdown"><List size={16} /></button>
                                            <button onClick={(e) => { e.stopPropagation(); confirmDelete(food); }} className="p-2 rounded-lg text-muted-foreground/30 hover:bg-rose-100 dark:hover:bg-rose-950/40 hover:text-rose-500" title="Delete"><Trash2 size={16} /></button>
                                        </div>
                                    )}

                                    {/* Add Stock Panel */}
                                    {expandedAddId === food.id && buyMoreItem && (
                                        <div className="px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 animate-in slide-in-from-top-2 duration-200">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-2">Add Stock</p>
                                            <div className="space-y-2">
                                                <div>
                                                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">Qty</Label>
                                                    <Input type="number" value={buyMoreQty} onChange={(e) => setBuyMoreQty(e.target.value)} onClick={(e) => e.stopPropagation()} className="w-full h-8 text-sm" />
                                                </div>
                                                {buyMorePortions.length > 0 ? renderPortionSelect(buyMorePortions, buyMoreSelectedPortion, setBuyMoreSelectedPortion) : (
                                                    <div className="flex gap-2">
                                                        <div className="flex-1">
                                                            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">Weight</Label>
                                                            <Input type="number" value={buyMoreWeight} onChange={(e) => setBuyMoreWeight(e.target.value)} onClick={(e) => e.stopPropagation()} placeholder="e.g. 100" className="w-full h-8 text-sm" />
                                                        </div>
                                                        <div>
                                                            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">Unit</Label>
                                                            <select value={buyMoreUnit} onChange={(e) => setBuyMoreUnit(e.target.value)} onClick={(e) => e.stopPropagation()} className="w-20 px-2 py-1.5 h-8 border border-border rounded-lg bg-card text-sm font-bold text-foreground">
                                                                <option value="g">g</option><option value="ml">ml</option><option value="oz">oz</option><option value="lb">lb</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                )}
                                                <Button onClick={(e) => { e.stopPropagation(); handleBuyMoreAdd(); }} disabled={buyMoreAdding} className="w-full h-8 gap-1 bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest text-[9px]">
                                                    <Plus size={14} /> {buyMoreAdding ? 'Adding...' : 'Add'}
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Remove Stock Panel */}
                                    {expandedRemoveId === food.id && removeItem && (
                                        <div className="px-3 py-2 rounded-lg border border-rose-200 dark:border-rose-800/50 bg-rose-50 dark:bg-rose-950/20 animate-in slide-in-from-top-2 duration-200">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-2">Remove Stock</p>
                                            <div className="space-y-2">
                                                <div>
                                                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">Qty</Label>
                                                    <Input type="number" value={removeQty} onChange={(e) => setRemoveQty(e.target.value)} onClick={(e) => e.stopPropagation()} className="w-full h-8 text-sm" />
                                                </div>
                                                {removePortions.length > 0 ? renderPortionSelect(removePortions, removeSelectedPortion, setRemoveSelectedPortion) : (
                                                    <div className="flex gap-2">
                                                        <div className="flex-1">
                                                            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">Weight</Label>
                                                            <Input type="number" value={removeWeight} onChange={(e) => setRemoveWeight(e.target.value)} onClick={(e) => e.stopPropagation()} placeholder="e.g. 100" className="w-full h-8 text-sm" />
                                                        </div>
                                                        <div>
                                                            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">Unit</Label>
                                                            <select value={removeUnit} onChange={(e) => setRemoveUnit(e.target.value)} onClick={(e) => e.stopPropagation()} className="w-20 px-2 py-1.5 h-8 border border-border rounded-lg bg-card text-sm font-bold text-foreground">
                                                                <option value="g">g</option><option value="ml">ml</option><option value="oz">oz</option><option value="lb">lb</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                )}
                                                <Button onClick={(e) => { e.stopPropagation(); handleRemove(); }} disabled={removeRemoving} className="w-full h-8 gap-1 bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-[9px]">
                                                    <Minus size={14} /> {removeRemoving ? 'Removing...' : 'Remove'}
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Stock Breakdown */}
                                    {expandedBreakdownId === food.id && (() => {
                                        const rawEntries = parseQuantityEntries(food.quantity).map(e => parseQuantityEntry(e)).filter(e => e.qty > 0);
                                        let weightGramsTotal = 0;
                                        const nonWeightEntries: QuantityEntry[] = [];
                                        for (const e of rawEntries) {
                                            if (isWeightOnlyEntry(e)) { weightGramsTotal += entryTotalGrams(e); }
                                            else {
                                                const existing = nonWeightEntries.find(n => n.label && e.label && n.label.toLowerCase() === e.label.toLowerCase() && n.weight_g != null && e.weight_g != null && Math.abs(n.weight_g - e.weight_g) < 1);
                                                if (existing) { existing.qty += e.qty; } else { nonWeightEntries.push({ ...e }); }
                                            }
                                        }
                                        const entries = [...nonWeightEntries];
                                        if (weightGramsTotal > 0) entries.push(parseQuantityEntry(formatGramsEntry(weightGramsTotal)));
                                        const foodName = formatFoodName(food.common_name || food.name);
                                        return (
                                            <div className="px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/20 animate-in slide-in-from-top-2 duration-200">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">Stock Breakdown</p>
                                                <div className="space-y-1.5">
                                                    {entries.map((e, i) => {
                                                        const totalWeight = e.weight_g != null ? e.qty * e.weight_g : null;
                                                        const isBulk = isWeightOnlyEntry(e);
                                                        return (
                                                            <div key={i} className="flex items-center justify-between gap-3 py-1 border-b border-emerald-100 dark:border-emerald-900/40 last:border-0">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                                                                    {isBulk ? (
                                                                        <><span className="text-xs font-black text-foreground">{totalWeight != null ? formatGramsEntry(totalWeight) : ''}</span><span className="text-xs font-semibold text-muted-foreground">{foodName}</span></>
                                                                    ) : (
                                                                        <><span className="text-xs font-black text-foreground">{e.qty}</span>
                                                                        {e.label ? <span className="text-xs font-semibold text-muted-foreground">{pluralizeUnit(e.label, e.qty)} {foodName}</span>
                                                                        : <span className="text-xs font-semibold text-muted-foreground/60">{foodName}</span>}</>
                                                                    )}
                                                                </div>
                                                                {!isBulk && totalWeight != null && <span className="text-[10px] font-black text-white bg-emerald-500 px-2 py-0.5 rounded-md">{totalWeight.toLocaleString()}g total</span>}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </Fragment>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
