'use client';

import { useState, useEffect, Fragment, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSearch } from '@/lib/context/search-context';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
    Plus,
    ShoppingBasket,
    ShoppingCart,
    Loader2,
    Search,
    ChevronRight,
    ChevronDown,
    Sparkles,
    ChefHat,
    Package,
    X,
    ScanLine,
    Trash2,
    Apple,
    Carrot,
    Beef,
    Bean,
    Wheat,
    Droplet,
    Flame,
    Leaf,
    Pill,
    Box,
    Minus,
    List,
    CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn, formatFoodName } from '@/lib/utils';
import { fetchFoodMeasures } from '@/lib/utils/nutrition-calculator';
// meal-generator import removed — shopping list is now manual-only
import { BarcodeScanner } from '@/components/kitchen/barcode-scanner';
import { ScanConfirmDialog } from '@/components/kitchen/scan-confirm-dialog';
import { recordPurchase, saveScannedProduct } from '@/lib/services/product-lookup';
import { PantryMatchDialog } from '@/components/kitchen/pantry-match-dialog';
import { useShoppingList } from '@/hooks/use-shopping-list';
import { usePantry } from '@/hooks/use-pantry';
import { mergeQuantityStrings, stripZeroEntries } from '../pantry/pantry-types';

interface ShoppingListItem {
    id: string;
    name: string;
    quantity: string;
    unit: string;
    category?: string;
    is_miracle_product?: boolean;
    source?: 'manual' | 'mealplan' | 'scanned';
    barcode?: string;
    price?: number;
    image_url?: string;
    image?: string;
    common_name?: string;
    food_item_id?: string;
}

interface ShoppingListViewProps {
    scannerOpen?: boolean;
    onScannerOpenChange?: (open: boolean) => void;
}

// Module-level cache for enrichment data to avoid re-fetching on re-renders
const enrichmentCache = new Map<string, { id: string; category: string; image: string; common_name: string }>();

export function ShoppingListView({ scannerOpen: externalScannerOpen, onScannerOpenChange }: ShoppingListViewProps = {}) {
    const router = useRouter();
    const { items: manualItems, loading: shoppingLoading, addItem: addShoppingListItem, toggleChecked, removeItem: removeShoppingListItem, clearChecked, clearAll: clearShoppingList } = useShoppingList();
    const { addToPantry, updateQuantity, quantities } = usePantry();

    const [items, setItems] = useState<ShoppingListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [enriching, setEnriching] = useState(false);
    const { searchQuery } = useSearch();

    // Barcode scanner state
    const [internalScannerOpen, setInternalScannerOpen] = useState(false);
    const scannerOpen = externalScannerOpen !== undefined ? externalScannerOpen : internalScannerOpen;
    const setScannerOpen = onScannerOpenChange || setInternalScannerOpen;
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [scannedBarcode, setScannedBarcode] = useState('');

    // Pantry match state
    const [matchDialogOpen, setMatchDialogOpen] = useState(false);
    const [selectedMatchItem, setSelectedMatchItem] = useState<ShoppingListItem | null>(null);
    const [scannedIdToLink, setScannedIdToLink] = useState<string | null>(null);

    // Inline pantry-add panel state
    const [pantryAddItem, setPantryAddItem] = useState<ShoppingListItem | null>(null);
    const [pantryAddQty, setPantryAddQty] = useState('1');
    const [pantryAddPortions, setPantryAddPortions] = useState<{ label: string; weight_g: number }[]>([]);
    const [pantryAddSelectedPortion, setPantryAddSelectedPortion] = useState<{ label: string; weight_g: number } | null>(null);
    const [pantryAddFoodId, setPantryAddFoodId] = useState<string | null>(null);
    const [pantryAddLoading, setPantryAddLoading] = useState(false);
    const [expandedActionId, setExpandedActionId] = useState<string | null>(null);
    const [expandedRemoveId, setExpandedRemoveId] = useState<string | null>(null);
    const [selectedRemoveItem, setSelectedRemoveItem] = useState<ShoppingListItem | null>(null);
    const [expandedBreakdownId, setExpandedBreakdownId] = useState<string | null>(null);

    // Helper to clear all expanded sub-panels
    const clearAllPanels = (exceptAction?: boolean) => {
        if (!exceptAction) setExpandedActionId(null);
        setExpandedRemoveId(null);
        setSelectedRemoveItem(null);
        setExpandedBreakdownId(null);
        setPantryAddItem(null);
    };

    // Combine manual items with meal plan items, then enrich before setting state
    useEffect(() => {
        setLoading(shoppingLoading);
    }, [shoppingLoading]);

    // ── Enrichment loop (Cloud First) ───────────────────────────
    useEffect(() => {
        let isCancelled = false;
        const combineAndEnrich = async () => {
            if (shoppingLoading) return;
            
            let combined = [...manualItems].map(item => {
                const cacheKey = item.food_item_id || item.name.toLowerCase();
                const cached = enrichmentCache.get(cacheKey);
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

            const needEnrichById = combined.filter(i => i.food_item_id && (!i.category || !i.image));
            const needEnrichByName = combined.filter(i => !i.food_item_id && !i.category);

            if (needEnrichById.length > 0 || needEnrichByName.length > 0) {
                setEnriching(true);
                const idToData = new Map<string, any>();
                if (needEnrichById.length > 0) {
                    const ids = needEnrichById.map(i => i.food_item_id).filter(Boolean) as string[];
                    const { data } = await supabase.from('food_items').select('id, category, image, common_name').in('id', ids);
                    data?.forEach((d: any) => { idToData.set(d.id, d); enrichmentCache.set(d.id, d); });
                }
                
                const nameToData = new Map<string, any>();
                if (needEnrichByName.length > 0 && !isCancelled) {
                    const uniqueNames = [...new Set(needEnrichByName.map(i => i.name.toLowerCase()))];
                    const orConditions = uniqueNames.map(name => `name.ilike.%${name}%,common_name.ilike.%${name}%`).join(',');
                    const { data } = await supabase.from('food_items').select('id, name, common_name, category, image').or(orConditions).limit(uniqueNames.length * 5);
                    if (data) {
                        for (const searchName of uniqueNames) {
                            let bestMatch: any = null, bestScore = 0;
                            for (const d of data) {
                                const dbName = (d.name || '').toLowerCase(), dbCommon = (d.common_name || '').toLowerCase();
                                let score = 0;
                                if (dbName === searchName || dbCommon === searchName) score = 4;
                                else if (dbName.startsWith(searchName) || dbCommon.startsWith(searchName)) score = 3;
                                else if (searchName.startsWith(dbName) || searchName.startsWith(dbCommon)) score = 2;
                                else if (dbName.includes(searchName) || dbCommon.includes(searchName)) score = 1;
                                if (score > bestScore) { bestScore = score; bestMatch = d; }
                            }
                            if (bestMatch) { nameToData.set(searchName, bestMatch); enrichmentCache.set(searchName, bestMatch); }
                        }
                    }
                }

                if (!isCancelled) {
                    combined = combined.map(item => {
                        if (item.food_item_id && idToData.has(item.food_item_id)) {
                            const d = idToData.get(item.food_item_id);
                            return { ...item, category: item.category || d.category, image: item.image || d.image, common_name: item.common_name || d.common_name };
                        }
                        if (!item.category && nameToData.has(item.name.toLowerCase())) {
                            const d = nameToData.get(item.name.toLowerCase());
                            return { ...item, category: d.category, image: d.image, common_name: d.common_name, food_item_id: d.id };
                        }
                        return item;
                    });
                }
                setEnriching(false);
            }

            if (!isCancelled) setItems(combined);
        };
        combineAndEnrich();
        return () => { isCancelled = true; };
    }, [manualItems, shoppingLoading]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // No-op — shopping list is now fully manual.
            // Kept as a callable so existing callers (e.g. pantry-match confirm) don't break.
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };



    // Barcode scanner handlers
    const handleBarcodeScan = (barcode: string) => {
        setScannerOpen(false);
        setScannedBarcode(barcode);
        setConfirmDialogOpen(true);
    };

    const handleScannedProductConfirm = async (product: {
        name: string;
        barcode: string;
        quantity: number;
        unit: string;
        weight_g?: number;
        price?: number;
        store?: string;
        food_item_id?: string;
        image_url?: string;
        nutrition?: any;
    }) => {
        await addShoppingListItem({
            name: product.name,
            quantity: `${product.quantity} ${product.unit}`,
            unit: product.unit,
            source: 'scanned',
            barcode: product.barcode,
            price: product.price,
            image_url: product.image_url,
            food_item_id: product.food_item_id
        });

        setConfirmDialogOpen(false);
        setScannedBarcode('');

        // Save the product definition to the global database for future scans
        saveScannedProduct({
            barcode: product.barcode,
            name: product.name,
            source: 'manual', // Mark as user-contributed
            brand: undefined, // We don't capture brand in dialog yet
            weight_g: product.weight_g,
            default_unit: product.unit,
            image_url: product.image_url,
            nutrition: product.nutrition
        });

        toast.success(`Added "${product.name}" to shopping list`);
    };


    const removeItem = (id: string) => {
        removeShoppingListItem(id);
    };

    // Tick button: directly add item to pantry using its existing shopping-list quantity
    const [tickLoadingId, setTickLoadingId] = useState<string | null>(null);

    const quickAddToPantry = async (item: ShoppingListItem) => {
        setTickLoadingId(item.id);
        try {
            let foodItemId = item.food_item_id || null;
            if (!foodItemId && item.name) {
                const normalize = (s: string) => s.replace(/\(.*?\)/g, '').replace(/[^a-zA-Z0-9 ]/g, '').trim();
                const { data } = await supabase.from('food_items').select('id, name, common_name, category, image').or(`name.ilike.%${normalize(item.name)}%,common_name.ilike.%${normalize(item.name)}%`).limit(1).maybeSingle();
                if (data) foodItemId = data.id;
            }
            if (!foodItemId) { removeItem(item.id); moveToPantry(item); return; }

            const rawQty = (item.quantity || '').trim();
            const qtyStr = rawQty.split(/\s*\+\s*/).map(s => s.trim()).filter(s => !/^as\s+needed$/i.test(s) && s.length > 0).join(' + ') || rawQty || '1';

            const currentPantryQty = quantities[foodItemId] || '';
            const merged = mergeQuantityStrings(currentPantryQty, qtyStr);
            const cleaned = stripZeroEntries(merged);

            if (currentPantryQty) {
                await updateQuantity(foodItemId, cleaned);
            } else {
                await addToPantry({ id: foodItemId, name: item.name, common_name: item.common_name, category: item.category, image: item.image }, cleaned);
            }

            removeItem(item.id);
            toast.success(`"${item.common_name || item.name}" added to pantry`);
        } catch (e) {
            toast.error('Failed to add to pantry');
        } finally {
            setTickLoadingId(null);
        }
    };

    // Open the inline add panel for a grocery item
    const openPantryAddPanel = async (item: ShoppingListItem) => {
        // If already open for this item, close it
        if (pantryAddItem?.id === item.id) {
            setPantryAddItem(null);
            return;
        }

        // Close sibling panels
        setExpandedRemoveId(null);
        setSelectedRemoveItem(null);
        setExpandedBreakdownId(null);

        // Pre-fill qty from the grocery item's quantity (strip non-numeric prefixes)
        const qtyMatch = (item.quantity || '1').match(/^(\d+(?:\.\d+)?)/);
        setPantryAddQty(qtyMatch ? qtyMatch[1] : '1');
        setPantryAddPortions([]);
        setPantryAddSelectedPortion(null);
        setPantryAddFoodId(null);
        setPantryAddItem(item);

        // Resolve food_item_id if missing � look up by name
        let foodItemId = item.food_item_id || null;
        if (!foodItemId && item.name) {
            try {
                const normalize = (s: string) => s.replace(/\(.*?\)/g, '').replace(/[^a-zA-Z0-9 ]/g, '').trim();
                const { data } = await supabase
                    .from('food_items')
                    .select('id')
                    .or(`name.ilike.%${normalize(item.name)}%,common_name.ilike.%${normalize(item.name)}%`)
                    .limit(1)
                    .maybeSingle();
                if (data) foodItemId = data.id;
            } catch (e) { /* ignore */ }
        }

        if (foodItemId) {
            setPantryAddFoodId(foodItemId);
            // Fetch portions for the portion picker
            try {
                const measures = await fetchFoodMeasures(foodItemId);
                if (measures && measures.length > 0) {
                    setPantryAddPortions(measures);
                    // Auto-select from shopping-friendly measures only
                    const filtered = measures.filter((m: any) => !/cup|tbsp|tsp|tablespoon|teaspoon|slice|serving|fluid|pint|quart|gallon|ring|wedge|strip|stalk|sprig|patty|fillet|spear|floret|link/i.test(m.label));
                    // Deduplicate by weight_g (keep first occurrence)
                    const seen = new Set<number>();
                    const deduped = filtered.filter((m: any) => { if (seen.has(m.weight_g)) return false; seen.add(m.weight_g); return true; });
                    const each = deduped.find((m: any) => /each/i.test(m.label));
                    setPantryAddSelectedPortion(each || deduped[0] || null);
                }
            } catch (e) { /* ignore */ }
        }
    };

    // Open remove panel for an item
    const openRemovePanel = (item: ShoppingListItem) => {
        if (expandedRemoveId === item.id) {
            setExpandedRemoveId(null);
            setSelectedRemoveItem(null);
            return;
        }
        // Close sibling panels
        setPantryAddItem(null);
        setExpandedBreakdownId(null);
        setSelectedRemoveItem(item);
        setExpandedRemoveId(item.id);
    };

    // Confirm delete with toast dialog
    const confirmDelete = (item: ShoppingListItem) => {
        const displayName = item.common_name || item.name;
        toast.custom(
            (t) => (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-lg max-w-sm">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                        Remove <span className="font-black text-rose-600 dark:text-rose-400">{displayName}</span> from list?
                    </p>
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={() => toast.dismiss(t)}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                toast.dismiss(t);
                                removeItem(item.id);
                                setExpandedActionId(null);
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-800 rounded transition-colors"
                        >
                            Remove
                        </button>
                    </div>
                </div>
            ),
            { duration: Infinity }
        );
    };

    // Add item to groceries (shopping list) with aggregation
    const confirmAddToGroceries = async () => {
        if (!pantryAddItem) return;

        const qty = pantryAddQty || '1';
        const quantityString = pantryAddSelectedPortion
            ? `${qty} ${pantryAddSelectedPortion.label} (${pantryAddSelectedPortion.weight_g}g)`
            : qty;

        await addShoppingListItem({
            name: pantryAddItem.common_name || pantryAddItem.name,
            quantity: quantityString,
            food_item_id: pantryAddItem.food_item_id,
        });

        toast.success(`Updated ${pantryAddItem.common_name || pantryAddItem.name} in shopping list`);

        // Close the form and reset
        setPantryAddItem(null);
        setPantryAddQty('1');
        setPantryAddPortions([]);
        setPantryAddSelectedPortion(null);
        setPantryAddFoodId(null);
    };

    // Smart quantity combiner — sums same-portion entries, concatenates different portions
    const smartCombineQuantities = (existing: string, incoming: string): string => {
        // Parse a quantity string like "5 Extra Large (223g)" or "3" or "200 Extra Large (223g) + 5 Medium (145g)"
        const parseEntry = (s: string) => {
            const portionMatch = s.trim().match(/^(\d+(?:\.\d+)?)\s+(.+?)\s+\((\d+(?:\.\d+)?)g\)$/);
            if (portionMatch) return { value: parseFloat(portionMatch[1]), label: portionMatch[2].trim(), weight: portionMatch[3] };
            const simpleMatch = s.trim().match(/^(\d+(?:\.\d+)?)$/);
            if (simpleMatch) return { value: parseFloat(simpleMatch[1]), label: '', weight: '' };
            return null;
        };

        // Split existing multi-part quantities and incoming into entries
        const existingParts = existing.split(/\s*\+\s*/).map(s => s.trim()).filter(Boolean);
        const incomingParsed = parseEntry(incoming);
        if (!incomingParsed) return existing ? `${existing} + ${incoming}` : incoming;

        // Try to find a matching entry with the same label+weight to sum
        let merged = false;
        const updatedParts = existingParts.map(part => {
            const parsed = parseEntry(part);
            if (parsed && parsed.label === incomingParsed.label && parsed.weight === incomingParsed.weight) {
                merged = true;
                const newValue = parsed.value + incomingParsed.value;
                return parsed.label
                    ? `${newValue} ${parsed.label} (${parsed.weight}g)`
                    : `${newValue}`;
            }
            return part;
        });

        if (merged) return updatedParts.join(' + ');
        // Different portion type — append
        return existing ? `${existing} + ${incoming}` : incoming;
    };

    // Confirm adding a grocery item to the pantry with the chosen qty + portion
    const confirmPantryAdd = async () => {
        if (!pantryAddItem) return;

        setPantryAddLoading(true);
        try {
            const qty = pantryAddQty || '1';
            const qtyStr = pantryAddSelectedPortion ? `${qty} ${pantryAddSelectedPortion.label} (${pantryAddSelectedPortion.weight_g}g)` : qty;
            
            let foodItemId = pantryAddFoodId;
            if (foodItemId) {
                const currentPantryQty = quantities[foodItemId] || '';
                const merged = mergeQuantityStrings(currentPantryQty, qtyStr);
                const cleaned = stripZeroEntries(merged);
                
                if (currentPantryQty) {
                    await updateQuantity(foodItemId, cleaned);
                } else {
                    await addToPantry({ id: foodItemId, name: pantryAddItem.name, common_name: pantryAddItem.common_name, category: pantryAddItem.category, image: pantryAddItem.image }, cleaned);
                }
            } else {
                // Fallback to direct addToPantry if no ID resolved (should be rare now)
                await addToPantry(pantryAddItem, qtyStr);
            }

            removeShoppingListItem(pantryAddItem.id);
            toast.success(`"${pantryAddItem.name}" added to pantry`);
            setPantryAddItem(null);
        } catch (e) {
            toast.error('Failed to add to pantry');
        } finally {
            setPantryAddLoading(false);
        }
    };

    const moveToPantry = async (item: ShoppingListItem) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;
            if (!user) {
                toast.info('Sign in to save pantry items to the cloud');
                return;
            }

            // Reset state
            setScannedIdToLink(null);

            // Check if already linked or scanned
            // If scanned: determine ID to link
            if (item.source === 'scanned' && item.barcode) {
                const { data: scanDef } = await supabase
                    .from('scanned_products')
                    .select('id')
                    .eq('barcode', item.barcode)
                    .single();
                if (scanDef) setScannedIdToLink(scanDef.id);
            }

            // Always open dialog to confirm quantity/match
            setSelectedMatchItem(item);
            setMatchDialogOpen(true);

        } catch (error) {
            console.error('Error moving to pantry:', error);
            toast.error('Failed to move item to pantry');
        }
    };

    const aggregateQuantities = (existing: string, added: string): string => {
        if (!existing) return added;
        if (!added) return existing;

        const parse = (s: string) => {
            const match = s.trim().match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
            if (!match) return null;
            return { num: parseFloat(match[1]), unit: match[2].trim() };
        };

        // Strip zero-quantity segments from the existing string before merging
        const nonZeroExisting = existing
            .split(/\s*\+\s*/)
            .filter(s => { const p = parse(s.trim()); return p ? p.num > 0 : !!s.trim(); })
            .join(' + ');

        if (!nonZeroExisting) return added;

        const e = parse(nonZeroExisting);
        const a = parse(added);

        if (e && a && e.unit === a.unit) {
            const sum = e.num + a.num;
            return e.unit ? `${sum} ${e.unit}` : `${sum}`;
        }

        // If units mismatch or parsing fails, combine with +
        return `${nonZeroExisting} + ${added}`;
    };

    const handleMatchConfirm = async (foodItemId: string | null, name: string, quantity: string) => {
        if (!selectedMatchItem) return;
        try {
            const effectiveFoodId = foodItemId || selectedMatchItem.food_item_id || null;
            if (!effectiveFoodId) {
                // If no food_item resolved, fallback to legacy move (or alert user)
                await addToPantry(selectedMatchItem, quantity);
                removeItem(selectedMatchItem.id);
                setMatchDialogOpen(false);
                return;
            }

            const currentPantryQty = quantities[effectiveFoodId] || '';
            const merged = mergeQuantityStrings(currentPantryQty, quantity);
            const cleaned = stripZeroEntries(merged);

            if (currentPantryQty) {
                await updateQuantity(effectiveFoodId, cleaned);
            } else {
                await addToPantry({ 
                    id: effectiveFoodId, 
                    name: name, 
                    common_name: selectedMatchItem.common_name || name,
                    category: selectedMatchItem.category, 
                    image: selectedMatchItem.image
                }, cleaned);
            }

            removeItem(selectedMatchItem.id);
            setMatchDialogOpen(false);
            setSelectedMatchItem(null);
            setScannedIdToLink(null);
            toast.success(`"${name}" updated in your pantry`);
        } catch (error) {
            console.error('Error linking to pantry:', error);
            toast.error('Failed to update pantry');
        }
    };



    // Category grouping for shopping list - use actual DB categories
    const getCategoryGroup = (category?: string) => {
        if (!category) return 'Other';
        // Capitalize first letter and return the DB category as-is
        return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
    };

    // Quantity parsing helpers for weight badge display
    const parseQuantityToGrams = (quantity: string): number => {
        let totalGrams = 0;
        const entries = quantity.split(/\s*\+\s*/);
        for (const entry of entries) {
            const trimmed = entry.trim();
            if (!trimmed) continue;
            const labeled = trimmed.match(/^(\d+(?:\.\d+)?)\s+.+?\s+\((\d+(?:\.\d+)?)g\)$/);
            if (labeled) { totalGrams += parseFloat(labeled[1]) * parseFloat(labeled[2]); continue; }
            const weighted = trimmed.match(/^(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*(g|kg)$/i);
            if (weighted) { const w = weighted[3].toLowerCase() === 'kg' ? parseFloat(weighted[2]) * 1000 : parseFloat(weighted[2]); totalGrams += parseFloat(weighted[1]) * w; continue; }
            const textUnit = trimmed.match(/^(\d+(?:\.\d+)?)\s*(kg|kilograms?|grams?|g)$/i);
            if (textUnit) { const val = parseFloat(textUnit[1]); const unit = textUnit[2].toLowerCase(); totalGrams += (unit === 'kg' || unit.startsWith('kilogram')) ? val * 1000 : val; continue; }
        }
        return totalGrams;
    };

    const formatGramsShort = (grams: number): string => {
        if (grams >= 1000) { const kg = grams / 1000; return `${parseFloat(kg.toFixed(1))} kg`; }
        return `${Math.round(grams)} g`;
    };

    const getCategoryColor = (group: string) => {
        const normalized = group.toLowerCase();
        switch (normalized) {
            case 'fruit':
                return { bg: 'bg-slate-50 dark:bg-slate-800/30', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-400', icon: Apple };
            case 'vegetables':
                return { bg: 'bg-slate-50 dark:bg-slate-800/30', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-400', icon: Carrot };
            case 'proteins':
                return { bg: 'bg-slate-50 dark:bg-slate-800/30', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-400', icon: Beef };
            case 'legumes':
                return { bg: 'bg-slate-50 dark:bg-slate-800/30', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-400', icon: Bean };
            case 'grains':
                return { bg: 'bg-slate-50 dark:bg-slate-800/30', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-400', icon: Wheat };
            case 'oils':
                return { bg: 'bg-slate-50 dark:bg-slate-800/30', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-400', icon: Droplet };
            case 'flavour':
                return { bg: 'bg-slate-50 dark:bg-slate-800/30', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-400', icon: Flame };
            case 'nuts':
                return { bg: 'bg-slate-50 dark:bg-slate-800/30', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-400', icon: Leaf };
            case 'supplements':
                return { bg: 'bg-slate-50 dark:bg-slate-800/30', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-400', icon: Pill };
            default:
                return { bg: 'bg-slate-50 dark:bg-slate-800/30', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-400', icon: Box };
        }
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Group items by category
    const groupedItems = filteredItems.reduce((acc, item) => {
        const group = getCategoryGroup(item.category);
        if (!acc[group]) acc[group] = [];
        acc[group].push(item);
        return acc;
    }, {} as Record<string, ShoppingListItem[]>);

    return (
        <div className="space-y-8">
            {/* Barcode Scanner Modal */}
            <BarcodeScanner
                isOpen={scannerOpen}
                onClose={() => setScannerOpen(false)}
                onScan={handleBarcodeScan}
            />

            {/* Scan Confirm Dialog */}
            <ScanConfirmDialog
                isOpen={confirmDialogOpen}
                barcode={scannedBarcode}
                onClose={() => {
                    setConfirmDialogOpen(false);
                    setScannedBarcode('');
                }}
                onConfirm={handleScannedProductConfirm}
            />

            {/* Pantry Match Dialog */}
            <PantryMatchDialog
                isOpen={matchDialogOpen}
                initialQuery={selectedMatchItem?.name || ''}
                onClose={() => {
                    setMatchDialogOpen(false);
                    setSelectedMatchItem(null);
                    setScannedIdToLink(null);
                }}
                onConfirm={handleMatchConfirm}
                knownItem={(selectedMatchItem && (selectedMatchItem.source === 'scanned' || selectedMatchItem.food_item_id)) ? {
                    name: selectedMatchItem.name,
                    image: selectedMatchItem.image_url,
                    quantity: selectedMatchItem.quantity
                } : undefined}
            />





            {/* Loading State */}
            {(loading || enriching) ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <Loader2 className="animate-spin text-emerald-500" size={40} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Loading your list...</p>
                </div>
            ) : items.length === 0 ? (
                /* Empty State */
                <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] bg-white/50 dark:bg-slate-900/10">
                    <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700 mb-6">
                        <ShoppingBasket size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Your List is Empty</h3>
                    <p className="text-slate-500 text-center max-w-sm mb-8 px-4">
                        Add items manually above, or generate a meal plan to automatically create a shopping list.
                    </p>
                    <Button
                        onClick={() => router.push('/dashboard/library/meals?tab=mealplanner')}
                        className="rounded-xl px-10 h-14 font-black uppercase tracking-widest text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/20"
                    >
                        <ChefHat size={18} className="mr-2" />
                        Create Meal Plan
                    </Button>
                </div>
            ) : (
                /* Items List */
                <div className="space-y-4">
                    {/* Toolbar */}
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
                        </p>
                        <button
                            onClick={async () => {
                                if (!confirm('Clear all items from your grocery list?')) return;
                                await clearShoppingList();
                                setItems([]);
                                toast.success('Grocery list cleared');
                            }}
                            className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1.5"
                        >
                            <Trash2 size={12} />
                            Clear All
                        </button>
                    </div>
                    {/* Items - Grouped by Category */}
                    {filteredItems.length > 0 && (
                        <div className="space-y-3">
                                {Object.entries(groupedItems)
                                    .sort(([a], [b]) => {
                                        const categoryOrder = ['Fruit', 'Vegetables', 'Grains', 'Legumes', 'Proteins', 'Nuts', 'Oils', 'Flavour', 'Supplements', 'Other'];
                                        const indexA = categoryOrder.indexOf(a);
                                        const indexB = categoryOrder.indexOf(b);
                                        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
                                    })
                                    .map(([group, groupItems]) => {
                                    const colors = getCategoryColor(group);
                                    return (
                                        <div key={group} className={cn("rounded-xl border p-4", colors.bg, colors.border)}>
                                            <div className={cn("text-sm font-black uppercase tracking-widest mb-3 flex items-center gap-2 text-slate-700 dark:text-slate-400")}>
                                                <colors.icon size={18} className="text-slate-600 dark:text-slate-500" />
                                                {group}
                                                <button
                                                    onClick={() => {
                                                        groupItems.forEach(item => removeShoppingListItem(item.id));
                                                        toast.success(`${group} category cleared`);
                                                    }}
                                                    className="ml-auto p-1.5 rounded-lg text-slate-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 hover:text-rose-500 transition-colors flex-shrink-0"
                                                    title="Delete all items in this category"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            <div className="space-y-1.5">
                                                {groupItems.map((item) => (
                                                    <Fragment key={item.id}>
                                                    <div
                                                        className="flex items-center gap-3 px-3 py-2 rounded-xl border transition-all bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-emerald-400/50 hover:bg-white dark:hover:bg-slate-800 cursor-pointer group"
                                                        onClick={(e) => { e.stopPropagation(); clearAllPanels(false); setExpandedActionId(expandedActionId === item.id ? null : item.id); }}
                                                    >
                                                        {/* Food Image */}
                                                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shrink-0 flex items-center justify-center">
                                                            {(item.image || item.image_url) ? (
                                                                <img src={item.image || item.image_url} alt={item.common_name || item.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Beef size={20} className="text-slate-400 dark:text-slate-500" />
                                                            )}
                                                        </div>

                                                        {/* Name */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                {item.is_miracle_product && (
                                                                    <Sparkles size={12} className="text-amber-500 shrink-0" />
                                                                )}
                                                                <span className="font-black text-xs uppercase tracking-wide text-slate-900 dark:text-white truncate block">
                                                                    {formatFoodName(item.common_name || item.name)}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Pantry tick button — green only when a real weight exists */}
                                                        {(() => {
                                                            const realParts = (item.quantity || '')
                                                                .split(/\s*\+\s*/)
                                                                .map((s: string) => s.trim())
                                                                .filter((s: string) => s.length > 0 && !/^as\s+needed$/i.test(s) && /\d/.test(s));
                                                            const hasWeight = realParts.length > 0;
                                                            return (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); if (hasWeight) quickAddToPantry(item); }}
                                                                    disabled={tickLoadingId === item.id || !hasWeight}
                                                                    title={hasWeight ? 'Add to pantry' : 'Use the + button to add a weight first'}
                                                                    className={cn(
                                                                        "p-1.5 rounded-full border-2 transition-all flex-shrink-0",
                                                                        hasWeight
                                                                            ? "border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-white cursor-pointer"
                                                                            : "border-slate-300 dark:border-slate-600 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                                                                    )}
                                                                >
                                                                    {tickLoadingId === item.id
                                                                        ? <Loader2 size={13} className="animate-spin" />
                                                                        : <CheckCircle2 size={13} />}
                                                                </button>
                                                            );
                                                        })()}

                                                        {/* Expand chevron */}
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); clearAllPanels(false); setExpandedActionId(expandedActionId === item.id ? null : item.id); }}
                                                            className={cn(
                                                                "p-1.5 rounded-lg transition-all flex-shrink-0",
                                                                expandedActionId === item.id
                                                                    ? "text-emerald-500 bg-emerald-100 dark:bg-emerald-950/40"
                                                                    : "text-slate-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 hover:text-emerald-500"
                                                            )}
                                                            title="Actions"
                                                        >
                                                            <ChevronDown size={14} className={cn("transition-transform", expandedActionId === item.id && "rotate-180")} />
                                                        </button>
                                                    </div>

                                                    {/* Action buttons menu - shown when expanded */}
                                                    {expandedActionId === item.id && (
                                                        <div className="flex items-center gap-2 justify-center px-3 py-3 bg-slate-50 dark:bg-slate-900/30 border border-t-0 border-slate-200 dark:border-slate-700 rounded-b-xl">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); openPantryAddPanel(item); }}
                                                                className="p-2.5 rounded-lg transition-all flex-shrink-0 text-slate-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 hover:text-emerald-500"
                                                                title="Add more to list"
                                                            >
                                                                <Plus size={18} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); openRemovePanel(item); }}
                                                                className="p-2.5 rounded-lg transition-all flex-shrink-0 text-slate-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 hover:text-rose-500"
                                                                title="Remove items"
                                                            >
                                                                <Minus size={18} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setPantryAddItem(null); setExpandedRemoveId(null); setSelectedRemoveItem(null); setExpandedBreakdownId(expandedBreakdownId === item.id ? null : item.id); }}
                                                                className="p-2.5 rounded-lg transition-all flex-shrink-0 text-slate-400 hover:bg-amber-100 dark:hover:bg-amber-950/40 hover:text-amber-500"
                                                                title="View package sizes"
                                                            >
                                                                <List size={18} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); confirmDelete(item); }}
                                                                className="p-2.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/40 text-slate-300 dark:text-slate-600 hover:text-rose-500 transition-all flex-shrink-0"
                                                                title="Remove from list"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Inline remove panel */}
                                                    {expandedRemoveId === item.id && (
                                                        <div className="mb-0.5 p-4 rounded-xl border border-rose-200 dark:border-rose-800/50 bg-rose-50 dark:bg-rose-950/20 animate-in slide-in-from-top-2 duration-200">
                                                            <p className="text-sm font-bold text-slate-900 dark:text-white mb-3">Remove from {item.name}</p>
                                                            <div className="flex items-center gap-3">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={(e) => { 
                                                                        e.stopPropagation(); 
                                                                        const qty = parseInt(item.quantity);
                                                                        if (qty && qty > 1) {
                                                                            const updatedItem = { ...item, quantity: String(qty - 1) };
                                                                            removeShoppingListItem(item.id);
                                                                            // Re-add with reduced quantity if > 1
                                                                            if (parseInt(updatedItem.quantity) > 0) {
                                                                                addShoppingListItem(updatedItem);
                                                                            }
                                                                            setExpandedRemoveId(null);
                                                                            setSelectedRemoveItem(null);
                                                                        }
                                                                    }}
                                                                    className="h-9 px-3"
                                                                >
                                                                    Remove 1
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={(e) => { e.stopPropagation(); setExpandedRemoveId(null); setSelectedRemoveItem(null); }}
                                                                    className="h-9 px-3 text-slate-500"
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Inline breakdown panel */}
                                                    {expandedBreakdownId === item.id && (
                                                        <div className="mb-0.5 p-4 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 animate-in slide-in-from-top-2 duration-200">
                                                            <p className="text-sm font-bold text-slate-900 dark:text-white mb-3">Package Details for {item.name}</p>
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between items-center p-2 bg-white dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-700">
                                                                    <span className="text-sm text-slate-600 dark:text-slate-300">{item.quantity} {item.unit}</span>
                                                                    <span className="text-xs text-slate-400">Qty in list</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Inline pantry-add panel */}
                                                    {pantryAddItem?.id === item.id && (
                                                        <div className="mt-1 mb-0.5 px-4 py-3 rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/20 animate-in slide-in-from-top-2 duration-200">
                                                            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3">Add to List</p>
                                                            <div className="space-y-3">
                                                                <div>
                                                                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Qty</Label>
                                                                    <Input
                                                                        type="number"
                                                                        min="0.1"
                                                                        step="1"
                                                                        value={pantryAddQty}
                                                                        onChange={(e) => setPantryAddQty(e.target.value)}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="w-full h-9 text-sm"
                                                                    />
                                                                </div>

                                                                {pantryAddPortions.length > 0 && !pantryAddSelectedPortion ? (
                                                                    <div>
                                                                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Serving</Label>
                                                                        <select
                                                                            onChange={(e) => {
                                                                                const p = pantryAddPortions.find(p => p.label === e.target.value);
                                                                                if (p) setPantryAddSelectedPortion(p);
                                                                            }}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="w-full px-3 py-2 h-9 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white"
                                                                        >
                                                                            <option value="">Weight...</option>
                                                                            {(() => {
                                                                                const seen = new Set<number>();
                                                                                return pantryAddPortions
                                                                                    .filter(p => !/cup|tbsp|tsp|tablespoon|teaspoon|slice|serving|fluid|pint|quart|gallon|ring|wedge|strip|stalk|sprig|patty|fillet|spear|floret|link/i.test(p.label))
                                                                                    .filter(p => { if (seen.has(p.weight_g)) return false; seen.add(p.weight_g); return true; })
                                                                                    .map(p => (
                                                                                        <option key={p.label} value={p.label}>{p.label} ({p.weight_g}g)</option>
                                                                                    ));
                                                                            })()}
                                                                        </select>
                                                                    </div>
                                                                ) : pantryAddSelectedPortion ? (
                                                                    <div>
                                                                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Serving</Label>
                                                                        <select
                                                                            value={pantryAddSelectedPortion.label}
                                                                            onChange={(e) => {
                                                                                const p = pantryAddPortions.find(p => p.label === e.target.value);
                                                                                if (p) setPantryAddSelectedPortion(p);
                                                                            }}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="w-full px-3 py-2 h-9 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white"
                                                                        >
                                                                            {(() => {
                                                                                const seen = new Set<number>();
                                                                                return pantryAddPortions
                                                                                    .filter(p => !/cup|tbsp|tsp|tablespoon|teaspoon|slice|serving|fluid|pint|quart|gallon|ring|wedge|strip|stalk|sprig|patty|fillet|spear|floret|link/i.test(p.label))
                                                                                    .filter(p => { if (seen.has(p.weight_g)) return false; seen.add(p.weight_g); return true; })
                                                                                    .map(p => (
                                                                                        <option key={p.label} value={p.label}>{p.label} ({p.weight_g}g)</option>
                                                                                    ));
                                                                            })()}
                                                                        </select>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-xs text-slate-400">No portions found</span>
                                                                )}

                                                                <Button
                                                                    onClick={(e) => { e.stopPropagation(); confirmAddToGroceries(); }}
                                                                    disabled={pantryAddLoading}
                                                                    className="w-full h-10 gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-xs"
                                                                >
                                                                    <Plus size={16} />
                                                                    {pantryAddLoading ? 'Adding...' : 'Add'}
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
                    )}
                </div>
            )}
        </div>
    );
}
