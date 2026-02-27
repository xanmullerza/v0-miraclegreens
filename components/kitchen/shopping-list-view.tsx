'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearch } from '@/lib/context/search-context';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
    Plus,
    ShoppingBasket,
    Loader2,
    Search,
    Trash2,
    Check,
    ChevronRight,
    Sparkles,
    ChefHat,
    Package,
    X,
    ScanLine,
    DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
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
    checked: boolean;
    category?: string;
    is_miracle_product?: boolean;
    source?: 'manual' | 'mealplan' | 'scanned';
    barcode?: string;
    price?: number;
    image_url?: string;
    food_item_id?: string;
}


export function ShoppingListView() {
    const router = useRouter();
    const [items, setItems] = useState<ShoppingListItem[]>([]);
    const [manualItems, setManualItems] = useState<ShoppingListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { searchQuery } = useSearch();
    const [newItemName, setNewItemName] = useState('');
    const [newItemQty, setNewItemQty] = useState('');
    const { dailyPlan } = useUserPreferences();
    const [pantryItems, setPantryItems] = useState<any[]>([]);

    // Filter state
    const [showMealPlanOnly, setShowMealPlanOnly] = useState(false);
    const [showManualOnly, setShowManualOnly] = useState(false);

    // Barcode scanner state
    const [scannerOpen, setScannerOpen] = useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [scannedBarcode, setScannedBarcode] = useState('');

    // Pantry match state
    const [matchDialogOpen, setMatchDialogOpen] = useState(false);
    const [selectedMatchItem, setSelectedMatchItem] = useState<ShoppingListItem | null>(null);
    const [scannedIdToLink, setScannedIdToLink] = useState<string | null>(null);

    // Load manual items from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem('vitala_shopping_manual_items');
        if (saved) {
            try {
                setManualItems(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load shopping list', e);
            }
        }
        fetchData();
    }, []);

    // Save manual items to local storage whenever they change
    useEffect(() => {
        if (!loading) { // Avoid saving empty list on initial load before manual items are restored
            localStorage.setItem('vitala_shopping_manual_items', JSON.stringify(manualItems));
        }
    }, [manualItems, loading]);

    // Combine manual items with meal plan items
    useEffect(() => {
        let combined = [...manualItems];

        if (dailyPlan) {
            const mealPlanItems = generateShoppingList(dailyPlan);

            // Build sets for filtering pantry items
            // For food_item_id matching (most reliable)
            const pantryFoodIds = new Set(
                pantryItems
                    .filter((f: any) => f.food_item_id)  // Only items with food_item_id
                    .map((f: any) => f.food_item_id)
            );

            // Fallback to name matching for items without food_item_id
            const normalize = (s?: string) =>
                (s || '')
                    .toLowerCase()
                    .replace(/\(.*?\)/g, '')
                    .replace(/[^a-z0-9]/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .replace(/s$/, '');
            const pantryNames = new Set(pantryItems.map(f => normalize(f.common_name || f.name)));

            // Convert to our format and filter out pantry items
            const convertedItems: ShoppingListItem[] = mealPlanItems
                .filter(item => {
                    // If item has food_item_id, use ID matching
                    if ((item as any).food_item_id) {
                        return !pantryFoodIds.has((item as any).food_item_id);
                    }
                    // Otherwise use name matching
                    return !pantryNames.has(normalize(item.name));
                })
                .map((item, idx) => ({
                    id: `mealplan-${idx}`,
                    name: item.name,
                    quantity: item.amounts.join(' + '),
                    unit: '',
                    checked: false,
                    is_miracle_product: item.isMiracleProduct,
                    source: 'mealplan' as const,
                    food_item_id: (item as any).food_item_id
                }));

            // Deduplicate: If item exists in manual/scanned list, don't show from meal plan
            const manualNames = new Set(manualItems.map(i => normalize(i.name)));
            const newMealPlanItems = convertedItems.filter(i => !manualNames.has(normalize(i.name)));

            combined = [...manualItems, ...newMealPlanItems];
        }

        setItems(combined);
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
                .select('*, scanned_products(name, common_name, category), food_items(name, common_name, category)')
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
                        common_name: foodItem?.common_name || scannedProduct?.common_name || foodItem?.name || scannedProduct?.name || item.custom_name || item.name,
                        category: foodItem?.category || scannedProduct?.category || 'General'
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

    const addManualItem = () => {
        if (!newItemName.trim()) return;

        const newItem: ShoppingListItem = {
            id: `manual-${Date.now()}`,
            name: newItemName.trim(),
            quantity: newItemQty.trim() || '1',
            unit: '',
            checked: false,
            source: 'manual'
        };

        setManualItems(prev => [...prev, newItem]);
        setNewItemName('');
        setNewItemQty('');
        toast.success(`Added "${newItemName}" to shopping list`);
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
            checked: false,
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

    const toggleItem = (id: string) => {
        // We need to update either manual items OR rely on local state override for meal plan items?
        // Simpler: Just update persisted manual items if it's manual, OR local state if it's meal plan?
        // Actually, for check-off functionality to persist properly for meal plan items, we might need a separate 'checkedItems' persistence.
        // For now, let's just toggling in the derived view 'items' won't persist well for meal plan items on refresh.
        // Let's implement better toggling:

        if (id.startsWith('manual-') || id.startsWith('scanned-')) {
            setManualItems(prev => prev.map(item =>
                item.id === id ? { ...item, checked: !item.checked } : item
            ));
        } else {
            // For meal plan items, since they are regenerated, handling persistence is trickier.
            // We'll update the local state 'items' for immediate UI feedback, 
            // but strictly speaking this state is transient for meal plan items.
            setItems(prev => prev.map(item =>
                item.id === id ? { ...item, checked: !item.checked } : item
            ));
        }
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

    const handleDirectAddToPantry = async (item: ShoppingListItem) => {
        // If linked to a known food item → add directly to localStorage, no dialog
        if (item.food_item_id) {
            try {
                const saved = localStorage.getItem('pantry_quantities');
                const quantities: Record<string, string> = saved ? JSON.parse(saved) : {};
                const current = quantities[item.food_item_id] || '';

                // Normalize incoming quantity to a standard gram-weight string so
                // parseTotalGrams in handleMarkEaten can always deduct correctly.
                const rawQty = item.quantity || '1';
                // Helper: format grams as kg when >= 1000g
                const fmtG = (g: number) => {
                    if (g >= 1000) {
                        const kg = g / 1000;
                        const kgStr = kg % 1 === 0 ? kg.toString() : kg.toFixed(1);
                        return `${kgStr} kilogram (1000g)`;
                    }
                    return `1 x ${Math.round(g)}g`;
                };
                const normalizeToGrams = (s: string): string => {
                    const t = s.trim();
                    // Already labeled, e.g. "1 kilogram (1000g)" or "3 Each (304g)"
                    if (/\(\d+(?:\.\d+)?g\)$/.test(t)) return t;
                    // "1 x 100g"
                    if (/^\d+(?:\.\d+)?\s*x\s*\d+(?:\.\d+)?\s*g$/i.test(t)) return t;
                    // "500g"
                    const plainG = t.match(/^(\d+(?:\.\d+)?)\s*g$/i);
                    if (plainG) return fmtG(parseFloat(plainG[1]));
                    // "10 kg" / "10kg" / "10 kilogram(s)"
                    const kg = t.match(/^(\d+(?:\.\d+)?)\s*(?:kg|kilo(?:gram)?s?)$/i);
                    if (kg) return fmtG(parseFloat(kg[1]) * 1000);
                    // "10 ml"
                    const ml = t.match(/^(\d+(?:\.\d+)?)\s*ml$/i);
                    if (ml) return fmtG(parseFloat(ml[1]));
                    // "10 lb"
                    const lb = t.match(/^(\d+(?:\.\d+)?)\s*(?:lb|lbs|pounds?)$/i);
                    if (lb) return fmtG(Math.round(parseFloat(lb[1]) * 453.592));
                    // "10 oz"
                    const oz = t.match(/^(\d+(?:\.\d+)?)\s*(?:oz|ounces?)$/i);
                    if (oz) return fmtG(Math.round(parseFloat(oz[1]) * 28.3495));
                    // Unknown — return as-is
                    return t;
                };
                let incoming = normalizeToGrams(rawQty);

                // If incoming is still a plain number (e.g. "3"), try to resolve it
                // against the food's portions so it carries weight info
                const isPlainNumber = /^\d+(?:\.\d+)?$/.test(incoming);
                if (isPlainNumber && item.food_item_id) {
                    // First try: merge with existing labeled entry if there's exactly one
                    const existingLabeled = current
                        .split(/\s*\+\s*/)
                        .map(s => s.trim())
                        .filter(s => {
                            const m = s.match(/^(\d+(?:\.\d+)?)\s+(.+?)\s+\((\d+(?:\.\d+)?)g\)$/);
                            return m && !/^(gram|kilogram)s?$/i.test(m[2]);
                        });

                    if (existingLabeled.length === 1) {
                        // Merge plain qty into the existing labeled portion
                        const lbl = existingLabeled[0].match(/^(\d+(?:\.\d+)?)\s+(.+?)\s+\((\d+(?:\.\d+)?)g\)$/);
                        if (lbl) {
                            incoming = `${incoming} ${lbl[2]} (${lbl[3]}g)`;
                        }
                    } else {
                        // Second try: look up the food's portions from DB
                        try {
                            const measures = await fetchFoodMeasures(item.food_item_id);
                            if (measures && measures.length > 0) {
                                const defaultPortion = measures.find((m: any) => /each/i.test(m.label))
                                    || measures.find((m: any) => !/^(gram|kilogram)s?$/i.test(m.label))
                                    || null;
                                if (defaultPortion && !/^(gram|kilogram)s?$/i.test(defaultPortion.label)) {
                                    incoming = `${incoming} ${defaultPortion.label} (${defaultPortion.weight_g}g)`;
                                }
                            }
                        } catch (e) { /* ignore, use plain number */ }
                    }
                }

                // Merge with existing quantity, consolidating pure-weight entries
                const existingEntries = current
                    .split(/\s*\+\s*/)
                    .map(s => s.trim())
                    .filter(s => {
                        if (!s) return false;
                        const m = s.match(/^(\d+(?:\.\d+)?)/);
                        return m ? parseFloat(m[1]) > 0 : true;
                    });

                // Parse an entry to check if it's a pure gram/kg weight
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

                const incomingParsed = parseEntry(incoming);
                let merged = false;

                if (incomingParsed && isWeightOnly(incomingParsed)) {
                    // Consolidate all weight entries
                    let grams = totalG(incomingParsed);
                    const nonWeight: string[] = [];
                    for (const raw of existingEntries) {
                        const p = parseEntry(raw);
                        if (p && isWeightOnly(p)) {
                            grams += totalG(p);
                        } else {
                            nonWeight.push(raw);
                        }
                    }
                    const consolidated = fmtG(grams);
                    quantities[item.food_item_id] = nonWeight.length > 0
                        ? `${nonWeight.join(' + ')} + ${consolidated}`
                        : consolidated;
                    merged = true;
                } else if (incomingParsed && incomingParsed.label) {
                    // Match by label + weight (e.g. "3 Each (304g)" + "5 Each (304g)" = "8 Each (304g)")
                    const matchIdx = existingEntries.findIndex(raw => {
                        const m = raw.match(/^(\d+(?:\.\d+)?)\s+(.+?)\s+\((\d+(?:\.\d+)?)g\)$/);
                        return m && m[2] === incomingParsed.label && parseFloat(m[3]) === incomingParsed.wg;
                    });
                    if (matchIdx >= 0) {
                        const m = existingEntries[matchIdx].match(/^(\d+(?:\.\d+)?)/);
                        const sumQty = (m ? parseFloat(m[1]) : 0) + incomingParsed.qty;
                        existingEntries[matchIdx] = `${sumQty} ${incomingParsed.label} (${incomingParsed.wg}g)`;
                        quantities[item.food_item_id] = existingEntries.join(' + ');
                        merged = true;
                    }
                }

                if (!merged) {
                    // Append as new entry
                    const currentStripped = existingEntries.join(' + ');
                    quantities[item.food_item_id] = currentStripped ? `${currentStripped} + ${incoming}` : incoming;
                }

                localStorage.setItem('pantry_quantities', JSON.stringify(quantities));
                // Ensure the food item is marked as in-pantry in DB (best effort)
                await supabase.from('food_items').update({ is_in_pantry: true } as any).eq('id', item.food_item_id);
                removeItem(item.id);
                toast.success(`"${item.name}" added to pantry`);
            } catch (e) {
                toast.error('Failed to add to pantry');
            }
            return;
        }
        // No food_item_id — fall back to the match dialog
        moveToPantry(item);
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

    const clearCheckedItems = () => {
        const checked = items.filter(i => i.checked);

        // Record purchases for items with price info
        checked.forEach(item => {
            if (item.price) {
                recordPurchase({
                    product_name: item.name,
                    barcode: item.barcode,
                    quantity: parseFloat(item.quantity) || 1,
                    unit: item.unit || 'item',
                    price: item.price
                });
            }
        });

        // Persist removal for manual items
        setManualItems(prev => prev.filter(item => !item.checked));
        // Update local view immediately
        setItems(prev => prev.filter(item => !item.checked));

        toast.success(`Cleared ${checked.length} checked items`);
    };

    // Category mapping for better store organization
    const getCategoryGroup = (category?: string) => {
        if (!category) return 'Other';
        const normalized = category.toLowerCase().trim();

        // Map DB categories to store sections
        switch (normalized) {
            case 'fruit':
            case 'vegetables':
                return 'Produce';
            case 'proteins':
            case 'legumes':
                return 'Proteins';
            case 'grains':
                return 'Grains';
            case 'oils':
            case 'flavour':
                return 'Pantry Staples';
            case 'nuts':
                return 'Nuts & Seeds';
            case 'supplements':
                return 'Supplements';
            case 'general':
            default:
                return 'Other';
        }
    };

    const getCategoryColor = (group: string) => {
        switch (group) {
            case 'Produce': return { bg: 'bg-green-50 dark:bg-green-950/20', border: 'border-green-200 dark:border-green-800/50', text: 'text-green-700 dark:text-green-400', icon: '🥬' };
            case 'Proteins': return { bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-200 dark:border-red-800/50', text: 'text-red-700 dark:text-red-400', icon: '🥩' };
            case 'Grains': return { bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-800/50', text: 'text-amber-700 dark:text-amber-400', icon: '🌾' };
            case 'Pantry Staples': return { bg: 'bg-orange-50 dark:bg-orange-950/20', border: 'border-orange-200 dark:border-orange-800/50', text: 'text-orange-700 dark:text-orange-400', icon: '🫙' };
            case 'Nuts & Seeds': return { bg: 'bg-purple-50 dark:bg-purple-950/20', border: 'border-purple-200 dark:border-purple-800/50', text: 'text-purple-700 dark:text-purple-400', icon: '🥜' };
            case 'Supplements': return { bg: 'bg-teal-50 dark:bg-teal-950/20', border: 'border-teal-200 dark:border-teal-800/50', text: 'text-teal-700 dark:text-teal-400', icon: '💊' };
            default: return { bg: 'bg-slate-50 dark:bg-slate-800/30', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-400', icon: '📦' };
        }
    };

    const filteredItems = items.filter(item => {
        // Search filter
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        // Source filter
        const matchesSource = !((showMealPlanOnly && item.source !== 'mealplan') || (showManualOnly && item.source !== 'manual'));
        return matchesSearch && matchesSource;
    });

    const uncheckedItems = filteredItems.filter(i => !i.checked);
    const checkedItems = filteredItems.filter(i => i.checked);

    // Group unchecked items by category
    const groupedUnchecked = uncheckedItems.reduce((acc, item) => {
        const group = getCategoryGroup(item.category);
        if (!acc[group]) acc[group] = [];
        acc[group].push(item);
        return acc;
    }, {} as Record<string, ShoppingListItem[]>);

    // Calculate total price of items with prices
    const totalPrice = uncheckedItems
        .filter(i => i.price)
        .reduce((sum, i) => sum + (i.price || 0), 0);

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

            {/* Add Item Bar */}
            <div className="flex flex-col sm:flex-row gap-4 p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl">
                <div className="flex-1 flex gap-3">
                    <Input
                        placeholder="Item name..."
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        className="flex-1 h-14 rounded-2xl border-slate-200 dark:border-slate-700"
                        onKeyDown={(e) => e.key === 'Enter' && addManualItem()}
                    />
                    <Input
                        placeholder="Qty"
                        value={newItemQty}
                        onChange={(e) => setNewItemQty(e.target.value)}
                        className="w-24 h-14 rounded-2xl border-slate-200 dark:border-slate-700 text-center"
                        onKeyDown={(e) => e.key === 'Enter' && addManualItem()}
                    />
                </div>
                <div className="flex gap-3">
                    <Button
                        onClick={() => setScannerOpen(true)}
                        variant="outline"
                        className="h-14 px-6 rounded-2xl border-amber-300 dark:border-amber-700 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 font-black uppercase tracking-widest"
                    >
                        <ScanLine size={20} className="mr-2" />
                        Scan
                    </Button>
                    <Button
                        onClick={addManualItem}
                        disabled={!newItemName.trim()}
                        className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 shrink-0 bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 h-auto"
                    >
                        <Plus size={14} />
                        Add
                    </Button>
                </div>
            </div>


            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-2 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-black uppercase tracking-widest text-slate-500 px-2">Filter:</span>
                <Button
                    size="sm"
                    variant={showMealPlanOnly ? "default" : "outline"}
                    onClick={() => {
                        setShowMealPlanOnly(!showMealPlanOnly);
                        if (showManualOnly) setShowManualOnly(false);
                    }}
                    className={cn(
                        "h-8 text-xs font-black uppercase tracking-widest rounded-xl",
                        showMealPlanOnly
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-300"
                    )}
                >
                    <ChefHat size={12} className="mr-1" /> Meal Plan
                </Button>
                <Button
                    size="sm"
                    variant={showManualOnly ? "default" : "outline"}
                    onClick={() => {
                        setShowManualOnly(!showManualOnly);
                        if (showMealPlanOnly) setShowMealPlanOnly(false);
                    }}
                    className={cn(
                        "h-8 text-xs font-black uppercase tracking-widest rounded-xl",
                        showManualOnly
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-300"
                    )}
                >
                    <Plus size={12} className="mr-1" /> Manual
                </Button>
                {(showMealPlanOnly || showManualOnly) && (
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                            setShowMealPlanOnly(false);
                            setShowManualOnly(false);
                        }}
                        className="h-8 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                        <X size={12} className="mr-1" /> Reset
                    </Button>
                )}
                {totalPrice > 0 && (
                    <div className="ml-auto px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="text-xs font-black text-slate-600 dark:text-slate-300">
                            <DollarSign size={12} className="inline mr-1" />
                            Total: ${totalPrice.toFixed(2)}
                        </span>
                    </div>
                )}
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-4">
                {checkedItems.length > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearCheckedItems}
                        className="text-xs font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                    >
                        <Trash2 size={14} className="mr-1" />
                        Clear {checkedItems.length} Checked
                    </Button>
                )}
            </div>

            {/* Loading State */}
            {loading ? (
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
                        onClick={() => router.push('/dashboard/recipes/meals?tab=mealplanner')}
                        className="rounded-xl px-10 h-14 font-black uppercase tracking-widest text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/20"
                    >
                        <ChefHat size={18} className="mr-2" />
                        Create Meal Plan
                    </Button>
                </div>
            ) : (
                /* Items List */
                <div className="space-y-4">
                    {/* Unchecked Items - Grouped by Category */}
                    {uncheckedItems.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                                        Need to Buy
                                    </span>
                                </div>
                                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{uncheckedItems.length}</span>
                            </div>
                            <div className="space-y-3">
                                {Object.entries(groupedUnchecked).map(([group, items]) => {
                                    const colors = getCategoryColor(group);
                                    return (
                                        <div key={group} className={cn("rounded-xl border p-4", colors.bg, colors.border)}>
                                            <div className={cn("text-sm font-black uppercase tracking-widest mb-3 flex items-center gap-2", colors.text)}>
                                                <span className="text-lg">{colors.icon}</span>
                                                {group}
                                                <Badge className="ml-auto text-[9px] bg-white/50 dark:bg-slate-900/50 border-none text-slate-700 dark:text-slate-300">
                                                    {items.length}
                                                </Badge>
                                            </div>
                                            <div className="space-y-1.5">
                                                {items.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className={cn(
                                                            "flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all cursor-pointer group",
                                                            item.is_miracle_product
                                                                ? "bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40 hover:border-amber-300"
                                                                : "bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 hover:border-emerald-400/50 hover:bg-white dark:hover:bg-slate-800/50"
                                                        )}
                                                        onClick={() => toggleItem(item.id)}
                                                    >
                                                        <div className={cn(
                                                            "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                                                            "border-slate-300 dark:border-slate-600 group-hover:border-emerald-500"
                                                        )}>
                                                            {/* Empty checkbox */}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                {item.is_miracle_product && (
                                                                    <Sparkles size={12} className="text-amber-500 shrink-0" />
                                                                )}
                                                                <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                                                                    {item.name}
                                                                </span>
                                                            </div>
                                                            <span className="text-xs text-slate-500 dark:text-slate-400">{item.quantity}</span>
                                                        </div>
                                                        {item.source === 'mealplan' && (
                                                            <Badge className="text-[7px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none shrink-0 h-5 px-1.5 flex items-center">
                                                                <ChefHat size={9} className="mr-0.5" /> Meal
                                                            </Badge>
                                                        )}
                                                        {item.price && (
                                                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                                                                ${item.price.toFixed(2)}
                                                            </span>
                                                        )}
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDirectAddToPantry(item); }}
                                                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all"
                                                            title="Add to pantry"
                                                        >
                                                            <Package size={14} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                                                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-500 transition-all"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Checked Items */}
                    {checkedItems.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                                        Completed
                                    </span>
                                </div>
                                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{checkedItems.length}</span>
                            </div>
                            <div className="space-y-1.5">
                                {checkedItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 opacity-70 cursor-pointer group hover:opacity-100 transition-all"
                                        onClick={() => toggleItem(item.id)}
                                    >
                                        <div className="w-5 h-5 rounded-md border-2 border-emerald-500 bg-emerald-500 flex items-center justify-center shrink-0">
                                            <Check size={12} className="text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="font-semibold text-sm text-slate-500 dark:text-slate-400 line-through truncate block">
                                                {item.name}
                                            </span>
                                            <span className="text-xs text-slate-400 dark:text-slate-500">{item.quantity}</span>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={(e) => { e.stopPropagation(); handleDirectAddToPantry(item); }}
                                            className="opacity-0 group-hover:opacity-100 h-6 px-2 text-[8px] font-black uppercase tracking-tight text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                                        >
                                            <Package size={10} className="mr-0.5" /> Add to Pantry
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
