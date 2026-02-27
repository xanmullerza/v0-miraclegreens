'use client';

import { useState, useEffect, Fragment, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSearch } from '@/lib/context/search-context';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
    Plus,
    ShoppingBasket,
    Loader2,
    Search,
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
import { Label } from '@/components/ui/label';
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
    category?: string;
    is_miracle_product?: boolean;
    source?: 'manual' | 'mealplan' | 'scanned';
    barcode?: string;
    price?: number;
    image_url?: string;
    food_item_id?: string;
}

interface ShoppingListViewProps {
    scannerOpen?: boolean;
    onScannerOpenChange?: (open: boolean) => void;
}

export function ShoppingListView({ scannerOpen: externalScannerOpen, onScannerOpenChange }: ShoppingListViewProps = {}) {
    const router = useRouter();
    const [items, setItems] = useState<ShoppingListItem[]>([]);
    const [manualItems, setManualItems] = useState<ShoppingListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { searchQuery } = useSearch();
    const { dailyPlan } = useUserPreferences();
    const [pantryItems, setPantryItems] = useState<any[]>([]);

    // Filter state
    const [showMealPlanOnly, setShowMealPlanOnly] = useState(false);
    const [showManualOnly, setShowManualOnly] = useState(false);

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

    // Category enrichment for meal plan items that don't have categories
    // Manual items added via HeroSearch already have categories from DB
    useEffect(() => {
        const needCategory = items.filter(i => !i.category && i.food_item_id);
        if (needCategory.length === 0) return;

        let isCancelled = false;

        const enrich = async () => {
            const ids = needCategory.map(i => i.food_item_id).filter(Boolean) as string[];
            if (ids.length === 0) return;

            const { data } = await supabase
                .from('food_items')
                .select('id, category')
                .in('id', ids);
                
            if (data && !isCancelled) {
                const idToCat = new Map(data.map((d: any) => [d.id, d.category]));
                setItems(prev => prev.map(item => {
                    if (item.food_item_id && idToCat.has(item.food_item_id) && !item.category) {
                        return { ...item, category: idToCat.get(item.food_item_id) };
                    }
                    return item;
                }));
            }
        };

        enrich();

        return () => {
            isCancelled = true;
        };
    }, [items.length]);

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

        // Resolve food_item_id if missing — look up by name
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
                    // Filter out gram/kilogram — those are always available implicitly
                    const meaningful = measures.filter((m: any) => !/^(gram|kilogram)s?$/i.test(m.label));
                    setPantryAddPortions(meaningful);
                    // Auto-select "Each" if available, else first meaningful portion
                    const each = meaningful.find((m: any) => /each/i.test(m.label));
                    setPantryAddSelectedPortion(each || meaningful[0] || null);
                }
            } catch (e) { /* ignore */ }
        }
    };

    // Confirm adding a grocery item to the pantry with the chosen qty + portion
    const confirmPantryAdd = async () => {
        if (!pantryAddItem) return;
        const foodItemId = pantryAddFoodId;
        if (!foodItemId) {
            // No food resolved — fall back to match dialog
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
                    return `${kgStr} kilogram (1000g)`;
                }
                return `${Math.round(g)} gram (1g)`;
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

    const getCategoryColor = (group: string) => {
        const normalized = group.toLowerCase();
        switch (normalized) {
            case 'fruit':
            case 'vegetables':
                return { bg: 'bg-green-50 dark:bg-green-950/20', border: 'border-green-200 dark:border-green-800/50', text: 'text-green-700 dark:text-green-400', icon: '🍎' };
            case 'proteins':
            case 'legumes':
                return { bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-200 dark:border-red-800/50', text: 'text-red-700 dark:text-red-400', icon: '🥩' };
            case 'grains':
                return { bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-800/50', text: 'text-amber-700 dark:text-amber-400', icon: '🌾' };
            case 'oils':
            case 'flavour':
                return { bg: 'bg-orange-50 dark:bg-orange-950/20', border: 'border-orange-200 dark:border-orange-800/50', text: 'text-orange-700 dark:text-orange-400', icon: '🫙' };
            case 'nuts':
                return { bg: 'bg-purple-50 dark:bg-purple-950/20', border: 'border-purple-200 dark:border-purple-800/50', text: 'text-purple-700 dark:text-purple-400', icon: '🥜' };
            case 'supplements':
                return { bg: 'bg-teal-50 dark:bg-teal-950/20', border: 'border-teal-200 dark:border-teal-800/50', text: 'text-teal-700 dark:text-teal-400', icon: '💊' };
            default:
                return { bg: 'bg-slate-50 dark:bg-slate-800/30', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-400', icon: '📦' };
        }
    };

    const filteredItems = items.filter(item => {
        // Search filter
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        // Source filter
        const matchesSource = !((showMealPlanOnly && item.source !== 'mealplan') || (showManualOnly && item.source !== 'manual'));
        return matchesSearch && matchesSource;
    });

    // Group items by category
    const groupedItems = filteredItems.reduce((acc, item) => {
        const group = getCategoryGroup(item.category);
        if (!acc[group]) acc[group] = [];
        acc[group].push(item);
        return acc;
    }, {} as Record<string, ShoppingListItem[]>);

    // Calculate total price of items with prices
    const totalPrice = filteredItems
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
                    {/* Items - Grouped by Category */}
                    {filteredItems.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                                        Need to Buy
                                    </span>
                                </div>
                                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{filteredItems.length}</span>
                            </div>
                            <div className="space-y-3">
                                {Object.entries(groupedItems)
                                    .sort(([a], [b]) => {
                                        // Sort categories - use actual DB category names
                                        const categoryOrder = ['Fruit', 'Vegetables', 'Grains', 'Legumes', 'Proteins', 'Nuts', 'Oils', 'Flavour', 'Supplements', 'Other'];
                                        const indexA = categoryOrder.indexOf(a);
                                        const indexB = categoryOrder.indexOf(b);
                                        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
                                    })
                                    .map(([group, items]) => {
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
                                                    <Fragment key={item.id}>
                                                    <div
                                                        className={cn(
                                                            "flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all cursor-pointer group",
                                                            item.is_miracle_product
                                                                ? "bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40 hover:border-amber-300"
                                                                : "bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 hover:border-emerald-400/50 hover:bg-white dark:hover:bg-slate-800/50"
                                                        )}
                                                    >
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
                                                            onClick={(e) => { e.stopPropagation(); openPantryAddPanel(item); }}
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
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
