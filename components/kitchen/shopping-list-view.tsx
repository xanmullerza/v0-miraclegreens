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
    List
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn, formatFoodName } from '@/lib/utils';
import { fetchFoodMeasures } from '@/lib/utils/nutrition-calculator';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { generateShoppingList, ShoppingItem, DailyPlan } from '@/lib/utils/meal-generator';
import { BarcodeScanner } from './barcode-scanner';
import { ScanConfirmDialog } from './scan-confirm-dialog';
import { recordPurchase, saveScannedProduct } from '@/lib/services/product-lookup';
import { PantryMatchDialog } from './pantry-match-dialog';

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
    const [items, setItems] = useState<ShoppingListItem[]>([]);
    const [manualItems, setManualItems] = useState<ShoppingListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [enriching, setEnriching] = useState(false);
    const { searchQuery } = useSearch();
    const { dailyPlan } = useUserPreferences();
    const [pantryItems, setPantryItems] = useState<any[]>([]);

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

    // Load manual items from local storage on mount and when storage changes
    useEffect(() => {
        const loadManualItems = () => {
            const saved = localStorage.getItem('vitala_shopping_manual_items');
            if (saved) {
                try {
                    setManualItems(JSON.parse(saved));
                } catch (e) {
                    console.error('Failed to load shopping list', e);
                }
            }
        };

        loadManualItems();
        fetchData();

        // Listen for storage events from other components
        window.addEventListener('storage', loadManualItems);
        return () => window.removeEventListener('storage', loadManualItems);
    }, []);

    // Save manual items to local storage whenever they change
    useEffect(() => {
        if (!loading) { // Avoid saving empty list on initial load before manual items are restored
            localStorage.setItem('vitala_shopping_manual_items', JSON.stringify(manualItems));
        }
    }, [manualItems, loading]);

    // Combine manual items with meal plan items, then enrich before setting state
    useEffect(() => {
        let isCancelled = false;

        const combineAndEnrich = async () => {
            let combined = [...manualItems];

            if (dailyPlan) {
                const mealPlanItems = generateShoppingList(dailyPlan);

                // Load pantry quantities from localStorage for quantity-aware filtering
                let pantryQuantities: Record<string, string> = {};
                try {
                    const saved = localStorage.getItem('pantry_quantities');
                    if (saved) pantryQuantities = JSON.parse(saved);
                } catch (e) { /* ignore */ }

                // Build map of pantry stock in grams: food_item_id -> grams
                const pantryStockGrams = new Map<string, number>();
                // Also build name -> grams for fallback matching
                const pantryStockByName = new Map<string, number>();

                const normalize = (s?: string) =>
                    (s || '')
                        .toLowerCase()
                        .replace(/\(.*?\)/g, '')
                        .replace(/[^a-z0-9]/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim()
                        .replace(/s$/, '');

                // Helper to parse a pantry quantity string into total grams
                const parsePantryGrams = (qtyStr: string): number => {
                    let total = 0;
                    const entries = qtyStr.split(/\s*\+\s*/);
                    for (const entry of entries) {
                        const trimmed = entry.trim();
                        if (!trimmed) continue;
                        // "5 Large (223g)" or "1 kilogram (1000g)"
                        const labeled = trimmed.match(/^(\d+(?:\.\d+)?)\s+.+?\s+\((\d+(?:\.\d+)?)g\)$/);
                        if (labeled) { total += parseFloat(labeled[1]) * parseFloat(labeled[2]); continue; }
                        // "2 x 100g"
                        const weighted = trimmed.match(/^(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*(g|kg)$/i);
                        if (weighted) { const w = weighted[3].toLowerCase() === 'kg' ? parseFloat(weighted[2]) * 1000 : parseFloat(weighted[2]); total += parseFloat(weighted[1]) * w; continue; }
                        // "1.5 kg" or "300 grams" or "1 kilogram"
                        const textUnit = trimmed.match(/^(\d+(?:\.\d+)?)\s*(kg|kilograms?|grams?|g)$/i);
                        if (textUnit) { const val = parseFloat(textUnit[1]); const unit = textUnit[2].toLowerCase(); total += (unit === 'kg' || unit.startsWith('kilogram')) ? val * 1000 : val; continue; }
                        // Plain number � treat as quantity (assume ~1000g per unit for rough check)
                        const plain = trimmed.match(/^(\d+(?:\.\d+)?)$/);
                        if (plain) { total += parseFloat(plain[1]) * 1000; continue; }
                    }
                    return total;
                };

                for (const pantryItem of pantryItems) {
                    const qtyStr = pantryQuantities[pantryItem.id] || pantryItem.quantity || '';
                    const grams = parsePantryGrams(qtyStr);
                    const itemId = pantryItem.food_item_id || pantryItem.id;
                    pantryStockGrams.set(itemId, (pantryStockGrams.get(itemId) || 0) + grams);
                    const nameKey = normalize(pantryItem.common_name || pantryItem.name);
                    if (nameKey) {
                        pantryStockByName.set(nameKey, (pantryStockByName.get(nameKey) || 0) + grams);
                    }
                }

                // Quantity-aware filtering: only show items where pantry doesn't have enough
                const convertedItems: ShoppingListItem[] = [];
                let idx = 0;
                for (const item of mealPlanItems) {
                    const neededG = item.totalWeightG || 0;

                    // Find pantry stock for this item
                    let pantryG = 0;
                    if (item.food_item_id && pantryStockGrams.has(item.food_item_id)) {
                        pantryG = pantryStockGrams.get(item.food_item_id)!;
                    } else {
                        const nameKey = normalize(item.name);
                        if (pantryStockByName.has(nameKey)) {
                            pantryG = pantryStockByName.get(nameKey)!;
                        }
                    }

                    if (neededG > 0 && pantryG >= neededG) {
                        // Pantry fully covers this item � skip it
                        idx++;
                        continue;
                    }

                    // If pantry has 0 or no weight info � show full amount
                    // If pantry has partial � show deficit
                    let quantity = item.amounts.join(' + ');
                    if (neededG > 0 && pantryG > 0 && pantryG < neededG) {
                        const deficitG = neededG - pantryG;
                        // Show the deficit as the needed quantity
                        if (deficitG >= 1000) {
                            quantity = `${parseFloat((deficitG / 1000).toFixed(1))} kg`;
                        } else {
                            quantity = `${Math.round(deficitG)} g`;
                        }
                    }

                    convertedItems.push({
                        id: `mealplan-${idx}`,
                        name: item.name,
                        quantity,
                        unit: '',
                        is_miracle_product: item.isMiracleProduct,
                        source: 'mealplan' as const,
                        food_item_id: item.food_item_id
                    });
                    idx++;
                }

                const manualNames = new Set(manualItems.map(i => normalize(i.name)));
                const newMealPlanItems = convertedItems.filter(i => !manualNames.has(normalize(i.name)));

                combined = [...manualItems, ...newMealPlanItems];
            }

            // Enrich items before setting state to avoid the "Other" flash
            // Apply cached enrichment data first
            combined = combined.map(item => {
                const cacheKey = item.food_item_id || item.name.toLowerCase();
                const cached = enrichmentCache.get(cacheKey);
                if (cached) {
                    const updated = { ...item };
                    if (!item.category && cached.category) updated.category = cached.category;
                    if (!item.image && cached.image) updated.image = cached.image;
                    if (!item.common_name && cached.common_name) updated.common_name = cached.common_name;
                    if (!item.food_item_id && cached.id) updated.food_item_id = cached.id;
                    return updated;
                }
                return item;
            });

            const needEnrichById = combined.filter(i => i.food_item_id && (!i.category || !i.image));
            const needEnrichByName = combined.filter(i => !i.food_item_id && !i.category);

            if (needEnrichById.length > 0 || needEnrichByName.length > 0) {
                setEnriching(true);

                // Phase 1: Enrich by food_item_id (single batch query)
                const idToData = new Map<string, any>();
                if (needEnrichById.length > 0) {
                    const ids = needEnrichById.map(i => i.food_item_id).filter(Boolean) as string[];
                    if (ids.length > 0) {
                        const { data } = await supabase
                            .from('food_items')
                            .select('id, category, image, common_name')
                            .in('id', ids);
                        if (data) data.forEach((d: any) => {
                            idToData.set(d.id, d);
                            enrichmentCache.set(d.id, d);
                        });
                    }
                }

                // Phase 2: Enrich by name (single batch query using OR conditions)
                const nameToData = new Map<string, any>();
                if (needEnrichByName.length > 0 && !isCancelled) {
                    const uniqueNames = [...new Set(needEnrichByName.map(i => i.name.toLowerCase()))];
                    // Build a single query that matches all names at once
                    const orConditions = uniqueNames
                        .map(name => `name.ilike.%${name}%,common_name.ilike.%${name}%`)
                        .join(',');
                    const { data } = await supabase
                        .from('food_items')
                        .select('id, name, common_name, category, image')
                        .or(orConditions)
                        .limit(uniqueNames.length * 2);
                    if (data) {
                        // Match each result back to the original names
                        for (const d of data) {
                            const matchedName = uniqueNames.find(n =>
                                (d.name || '').toLowerCase().includes(n) ||
                                (d.common_name || '').toLowerCase().includes(n)
                            );
                            if (matchedName && !nameToData.has(matchedName)) {
                                nameToData.set(matchedName, d);
                                enrichmentCache.set(matchedName, d);
                            }
                        }
                    }
                }

                if (!isCancelled) {
                    combined = combined.map(item => {
                        if (item.food_item_id && idToData.has(item.food_item_id)) {
                            const d = idToData.get(item.food_item_id);
                            const updated = { ...item };
                            if (!item.category && d.category) updated.category = d.category;
                            if (!item.image && d.image) updated.image = d.image;
                            if (!item.common_name && d.common_name) updated.common_name = d.common_name;
                            return updated;
                        }
                        if (!item.category && nameToData.has(item.name.toLowerCase())) {
                            const d = nameToData.get(item.name.toLowerCase());
                            const updated = { ...item };
                            if (d.category) updated.category = d.category;
                            if (d.image) updated.image = d.image;
                            if (d.common_name) updated.common_name = d.common_name;
                            if (d.id) updated.food_item_id = d.id;
                            return updated;
                        }
                        return item;
                    });
                }

                setEnriching(false);
            }

            if (!isCancelled) {
                setItems(combined);
            }
        };

        combineAndEnrich();

        return () => {
            isCancelled = true;
        };
    }, [dailyPlan, pantryItems, manualItems]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            // Fetch curated pantry items (food_items where is_in_pantry = true)
            const { data: curatedData } = await supabase
                .from('food_items')
                .select('*')
                .eq('is_in_pantry', true);

            // Fetch personal pantry items if user is logged in
            const { data: personalData } = user ? await supabase
                .from('pantry_items')
                .select('*, scanned_products(name, brand, image_url), food_items(name, common_name, category)')
                .eq('user_id', user.id)
                : { data: [] };

            // Combine both sources
            const combinedPantry: any[] = [...(curatedData || [])];

            if (personalData) {
                personalData.forEach((item: any) => {
                    const foodItem = item.food_items;
                    const scannedProduct = item.scanned_products;
                    combinedPantry.push({
                        id: item.id,
                        name: foodItem?.name || scannedProduct?.name || item.custom_name || item.name,
                        common_name: foodItem?.common_name || foodItem?.name || scannedProduct?.name || item.custom_name || item.name,
                        category: foodItem?.category || 'General'
                    });
                });
            }

            if (combinedPantry) setPantryItems(combinedPantry);
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
        // Add to shopping list
        const newItem: ShoppingListItem = {
            id: `scanned-${Date.now()}`,
            name: product.name,
            quantity: `${product.quantity} ${product.unit}`,
            unit: product.unit,
            source: 'scanned',
            barcode: product.barcode,
            price: product.price,
            image_url: product.image_url,
            food_item_id: product.food_item_id
        };

        setManualItems(prev => [...prev, newItem]);
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
        if (id.startsWith('manual-') || id.startsWith('scanned-')) {
            setManualItems(prev => prev.filter(item => item.id !== id));
        } else {
            // For meal plan items, we can't 'remove' them permanently unless we ignore them.
            // UI-wise just remove from current view
            setItems(prev => prev.filter(item => item.id !== id));
        }
    };

    // Open the inline pantry-add panel for a grocery item
    const openPantryAddPanel = async (item: ShoppingListItem) => {
        // If already open for this item, close it
        if (pantryAddItem?.id === item.id) {
            setPantryAddItem(null);
            return;
        }

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
                    // Auto-select "Each" if available, else first portion
                    const each = measures.find((m: any) => /each/i.test(m.label));
                    setPantryAddSelectedPortion(each || measures[0] || null);
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

    // Confirm adding a grocery item to the pantry with the chosen qty + portion
    const confirmPantryAdd = async () => {
        if (!pantryAddItem) return;
        const foodItemId = pantryAddFoodId;
        if (!foodItemId) {
            // No food resolved � fall back to match dialog
            moveToPantry(pantryAddItem);
            setPantryAddItem(null);
            return;
        }

        setPantryAddLoading(true);
        try {
            // Build quantity string from the panel inputs
            const qty = pantryAddQty || '1';
            const quantityString = pantryAddSelectedPortion
                ? `${qty} ${pantryAddSelectedPortion.label} (${pantryAddSelectedPortion.weight_g}g)`
                : qty;

            const saved = localStorage.getItem('pantry_quantities');
            const quantities: Record<string, string> = saved ? JSON.parse(saved) : {};
            const current = quantities[foodItemId] || '';

            // Helper: format grams as kg when >= 1000g
            const fmtG = (g: number) => {
                if (g >= 1000) {
                    const kg = g / 1000;
                    const kgStr = kg % 1 === 0 ? kg.toString() : kg.toFixed(1);
                    const kgNum = parseFloat(kgStr);
                    const unit = kgNum === 1 ? 'kilogram' : 'kilograms';
                    return `${kgStr} ${unit}`;
                }
                const gramsNum = Math.round(g);
                const unit = gramsNum === 1 ? 'gram' : 'grams';
                return `${gramsNum} ${unit}`;
            };

            // Merge with existing stock
            const existingEntries = current
                .split(/\s*\+\s*/)
                .map((s: string) => s.trim())
                .filter((s: string) => {
                    if (!s) return false;
                    const m = s.match(/^(\d+(?:\.\d+)?)/);
                    return m ? parseFloat(m[1]) > 0 : true;
                });

            const parseEntry = (s: string) => {
                const labeled = s.match(/^(\d+(?:\.\d+)?)\s+(.+?)\s+\((\d+(?:\.\d+)?)g\)$/);
                if (labeled) return { qty: parseFloat(labeled[1]), label: labeled[2], wg: parseFloat(labeled[3]) };
                const xFmt = s.match(/^(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*g$/i);
                if (xFmt) return { qty: parseFloat(xFmt[1]), label: null, wg: parseFloat(xFmt[2]) };
                return null;
            };
            const isWeightOnly = (p: ReturnType<typeof parseEntry>) =>
                p != null && (p.label === null || /^(gram|kilogram)s?$/i.test(p.label));
            const totalG = (p: NonNullable<ReturnType<typeof parseEntry>>) => p.qty * p.wg;

            const incomingParsed = parseEntry(quantityString);
            let merged = false;

            if (incomingParsed && isWeightOnly(incomingParsed)) {
                let grams = totalG(incomingParsed);
                const nonWeight: string[] = [];
                for (const raw of existingEntries) {
                    const p = parseEntry(raw);
                    if (p && isWeightOnly(p)) grams += totalG(p);
                    else nonWeight.push(raw);
                }
                const consolidated = fmtG(grams);
                quantities[foodItemId] = nonWeight.length > 0 ? `${nonWeight.join(' + ')} + ${consolidated}` : consolidated;
                merged = true;
            } else if (incomingParsed && incomingParsed.label) {
                const matchIdx = existingEntries.findIndex((raw: string) => {
                    const m = raw.match(/^(\d+(?:\.\d+)?)\s+(.+?)\s+\((\d+(?:\.\d+)?)g\)$/);
                    return m && m[2] === incomingParsed.label && parseFloat(m[3]) === incomingParsed.wg;
                });
                if (matchIdx >= 0) {
                    const m = existingEntries[matchIdx].match(/^(\d+(?:\.\d+)?)/);
                    existingEntries[matchIdx] = `${(m ? parseFloat(m[1]) : 0) + incomingParsed.qty} ${incomingParsed.label} (${incomingParsed.wg}g)`;
                    quantities[foodItemId] = existingEntries.join(' + ');
                    merged = true;
                }
            }

            if (!merged) {
                quantities[foodItemId] = existingEntries.length > 0
                    ? `${existingEntries.join(' + ')} + ${quantityString}`
                    : quantityString;
            }

            localStorage.setItem('pantry_quantities', JSON.stringify(quantities));
            await supabase.from('food_items').update({ is_in_pantry: true } as any).eq('id', foodItemId);
            removeItem(pantryAddItem.id);
            toast.success(`"${pantryAddItem.name}" added to pantry: ${quantityString}`);
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
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Determine effective IDs
            // If foodItemId is passed (from search), use it.
            // If null (confirmed known item), use existing item's food_item_id or scannedIdToLink
            const effectiveFoodId = foodItemId || selectedMatchItem.food_item_id || null;
            const effectiveScannedId = (!foodItemId && scannedIdToLink) ? scannedIdToLink : null;

            // If no food_item was found, try to guess category from item name
            let categoryHint = '';
            if (!effectiveFoodId && name) {
                const lowerName = name.toLowerCase();
                if (lowerName.match(/(apple|banana|orange|grape|berry|mango|pineapple|melon|peach|pear|plum|cherry|lemon|lime|kiwi|avocado|coconut)/)) {
                    categoryHint = 'Fruit';
                } else if (lowerName.match(/(broccoli|spinach|kale|lettuce|carrot|tomato|potato|onion|garlic|pepper|cucumber|zucchini|cabbage)/)) {
                    categoryHint = 'Vegetables';
                } else if (lowerName.match(/(chicken|beef|pork|turkey|fish|salmon|tuna|egg|milk|cheese|yogurt|meat)/)) {
                    categoryHint = 'Proteins';
                } else if (lowerName.match(/(rice|wheat|oat|barley|quinoa|corn|bread|pasta|grain)/)) {
                    categoryHint = 'Grains';
                } else if (lowerName.match(/(peanut|almond|walnut|cashew|nut|seed)/)) {
                    categoryHint = 'Nuts';
                }
            }

            // Store category hint in notes
            const notesWithCategory = [selectedMatchItem.category || categoryHint ? `Category: ${selectedMatchItem.category || categoryHint}` : ''].filter(Boolean).join('; ');

            // Aggregation check: look for an existing item with the same identifier or name
            let existingItem = null;

            // Try to find by food_item_id first
            if (effectiveFoodId) {
                const { data } = await supabase
                    .from('pantry_items')
                    .select('id, quantity')
                    .eq('user_id', user.id)
                    .eq('food_item_id', effectiveFoodId)
                    .limit(1)
                    .single();
                if (data) existingItem = data;
            }

            // Try to find by scanned_product_id if no match yet
            if (!existingItem && effectiveScannedId) {
                const { data } = await supabase
                    .from('pantry_items')
                    .select('id, quantity')
                    .eq('user_id', user.id)
                    .eq('scanned_product_id', effectiveScannedId)
                    .limit(1)
                    .single();
                if (data) existingItem = data;
            }

            // Fallback: try to find by exact name match
            if (!existingItem) {
                const { data } = await supabase
                    .from('pantry_items')
                    .select('id, quantity')
                    .eq('user_id', user.id)
                    .ilike('name', name)
                    .limit(1)
                    .single();
                if (data) existingItem = data;
            }

            if (existingItem) {
                // Update existing item with combined quantity
                const newQuantity = aggregateQuantities(existingItem.quantity || '0', quantity);
                const { error } = await supabase
                    .from('pantry_items')
                    .update({
                        quantity: newQuantity,
                        food_item_id: effectiveFoodId || undefined,
                        scanned_product_id: effectiveScannedId || undefined,
                        notes: notesWithCategory || undefined
                    })
                    .eq('id', existingItem.id);
                if (error) throw error;
            } else {
                // Insert new row
                const { error } = await supabase.from('pantry_items').insert({
                    user_id: user.id,
                    name: name,
                    quantity: quantity,
                    food_item_id: effectiveFoodId,
                    scanned_product_id: effectiveScannedId,
                    notes: notesWithCategory || undefined
                });
                if (error) throw error;
            }

            removeItem(selectedMatchItem.id);

            // Also remove from manualItems if it's a manual/scanned item
            if (selectedMatchItem.id.startsWith('manual-') || selectedMatchItem.id.startsWith('scanned-')) {
                setManualItems(prev => prev.filter(item => item.id !== selectedMatchItem.id));
            }

            setMatchDialogOpen(false);
            setSelectedMatchItem(null);
            setScannedIdToLink(null);
            toast.success(`"${name}" updated in your pantry`);

            // Refresh pantry data so meal plan items that are now in pantry get filtered out
            fetchData();

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
                            onClick={() => {
                                if (!confirm('Clear all items from your grocery list?')) return;
                                setManualItems([]);
                                setItems([]);
                                localStorage.setItem('vitala_shopping_manual_items', JSON.stringify([]));
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
                                                        groupItems.forEach(item => removeItem(item.id));
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
                                                        onClick={(e) => { e.stopPropagation(); setExpandedActionId(expandedActionId === item.id ? null : item.id); }}
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

                                                        {/* Expand chevron */}
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setExpandedActionId(expandedActionId === item.id ? null : item.id); }}
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
                                                                title="Add to pantry"
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
                                                                onClick={(e) => { e.stopPropagation(); setExpandedBreakdownId(expandedBreakdownId === item.id ? null : item.id); }}
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
                                                                            removeItem(item.id);
                                                                            // Re-add with reduced quantity if > 1
                                                                            if (parseInt(updatedItem.quantity) > 0) {
                                                                                const manualItems = JSON.parse(localStorage.getItem('vitala_shopping_manual_items') || '[]');
                                                                                manualItems.push(updatedItem);
                                                                                localStorage.setItem('vitala_shopping_manual_items', JSON.stringify(manualItems));
                                                                                setManualItems(manualItems);
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
                                                        <div className="mb-0.5 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/20 animate-in slide-in-from-top-2 duration-200">
                                                            <div className="flex flex-wrap items-end gap-3">
                                                                <div>
                                                                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Qty</Label>
                                                                    <Input
                                                                        type="number"
                                                                        min="0.1"
                                                                        step="1"
                                                                        value={pantryAddQty}
                                                                        onChange={(e) => setPantryAddQty(e.target.value)}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="w-16 text-center h-9"
                                                                    />
                                                                </div>

                                                                {pantryAddPortions.length > 0 ? (
                                                                    <div>
                                                                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Serving</Label>
                                                                        <select
                                                                            value={pantryAddSelectedPortion?.label || ''}
                                                                            onChange={(e) => {
                                                                                const p = pantryAddPortions.find(p => p.label === e.target.value);
                                                                                if (p) setPantryAddSelectedPortion(p);
                                                                            }}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="px-2 py-2 h-9 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white"
                                                                        >
                                                                            {pantryAddPortions.map(p => (
                                                                                <option key={p.label} value={p.label}>{p.label} ({p.weight_g}g)</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-xs text-slate-400 pb-2">No portions found</span>
                                                                )}

                                                                <Button
                                                                    size="sm"
                                                                    onClick={(e) => { e.stopPropagation(); setPantryAddItem(null); }}
                                                                    disabled={pantryAddLoading}
                                                                    className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold"
                                                                >
                                                                    {pantryAddLoading ? <Loader2 size={14} className="animate-spin" /> : <ShoppingCart size={14} className="mr-1" />}
                                                                    Add to Groceries
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={(e) => { e.stopPropagation(); confirmPantryAdd(); }}
                                                                    disabled={pantryAddLoading || !pantryAddSelectedPortion}
                                                                    className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                                                >
                                                                    {pantryAddLoading ? <Loader2 size={14} className="animate-spin" /> : <Package size={14} className="mr-1" />}
                                                                    Add to Pantry
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={(e) => { e.stopPropagation(); setPantryAddItem(null); }}
                                                                    className="h-9 px-3 text-slate-500"
                                                                >
                                                                    Cancel
                                                                </Button>

                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); removeItem(item.id); setPantryAddItem(null); }}
                                                                    className="p-2 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/40 text-slate-300 dark:text-slate-600 hover:text-rose-500 transition-all flex-shrink-0 ml-auto"
                                                                    title="Remove from list"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                            {pantryAddSelectedPortion && (
                                                                <p className="text-[10px] text-slate-400 mt-2">
                                                                    Total: {Math.round(parseFloat(pantryAddQty || '0') * pantryAddSelectedPortion.weight_g)}g
                                                                </p>
                                                            )}
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
