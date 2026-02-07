'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
    const [searchQuery, setSearchQuery] = useState('');
    const [newItemName, setNewItemName] = useState('');
    const [newItemQty, setNewItemQty] = useState('');
    const { dailyPlan } = useUserPreferences();
    const [pantryItems, setPantryItems] = useState<any[]>([]);

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
            const pantryNames = new Set(pantryItems.map(f => (f.common_name || f.name).toLowerCase().trim()));

            // Convert to our format and filter out pantry items
            const convertedItems: ShoppingListItem[] = mealPlanItems
                .filter(item => !pantryNames.has(item.name.toLowerCase().trim()))
                .map((item, idx) => ({
                    id: `mealplan-${idx}`,
                    name: item.name,
                    quantity: item.amounts.join(' + '),
                    unit: '',
                    checked: false,
                    is_miracle_product: item.isMiracleProduct,
                    source: 'mealplan' as const
                }));

            // Deduplicate: If item exists in manual/scanned list, don't show from meal plan
            const manualNames = new Set(manualItems.map(i => i.name.toLowerCase().trim()));
            const newMealPlanItems = convertedItems.filter(i => !manualNames.has(i.name.toLowerCase().trim()));

            combined = [...manualItems, ...newMealPlanItems];
        }

        setItems(combined);
    }, [dailyPlan, pantryItems, manualItems]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch pantry items to compare against
            const { data: pantryData } = await supabase
                .from('food_items')
                .select('*')
                .eq('is_in_pantry', true);

            if (pantryData) setPantryItems(pantryData);
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

    const moveToPantry = async (item: ShoppingListItem) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('You must be logged in to manage your pantry');
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

            const { error } = await supabase.from('pantry_items').insert({
                user_id: user.id,
                name: name,
                quantity: quantity,
                food_item_id: effectiveFoodId,
                scanned_product_id: effectiveScannedId
            });

            if (error) throw error;

            removeItem(selectedMatchItem.id);
            setMatchDialogOpen(false);
            setSelectedMatchItem(null);
            setScannedIdToLink(null);
            toast.success(`"${name}" moved to your pantry`);

        } catch (error) {
            console.error('Error linking to pantry:', error);
            toast.error('Failed to move item to pantry');
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

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const uncheckedItems = filteredItems.filter(i => !i.checked);
    const checkedItems = filteredItems.filter(i => i.checked);

    // Calculate total price of items with prices
    const totalPrice = items
        .filter(i => i.price && !i.checked)
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
                        className="h-14 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20"
                    >
                        <Plus size={20} className="mr-2" />
                        Add
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input
                    placeholder="Search your list..."
                    className="pl-12 h-14 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <ShoppingBasket size={16} className="text-emerald-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
                        {uncheckedItems.length} Items to Buy
                    </span>
                </div>
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
                        onClick={() => router.push('/dashboard/kitchen?tab=mealplanner')}
                        className="rounded-xl px-10 h-14 font-black uppercase tracking-widest text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/20"
                    >
                        <ChefHat size={18} className="mr-2" />
                        Create Meal Plan
                    </Button>
                </div>
            ) : (
                /* Items List */
                <div className="space-y-6">
                    {/* Unchecked Items */}
                    {uncheckedItems.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">
                                    Need to Buy ({uncheckedItems.length})
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {uncheckedItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className={cn(
                                            "flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group",
                                            item.is_miracle_product
                                                ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50"
                                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500/50"
                                        )}
                                        onClick={() => toggleItem(item.id)}
                                    >
                                        <div className={cn(
                                            "w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all",
                                            "border-slate-300 dark:border-slate-600 group-hover:border-emerald-500"
                                        )}>
                                            {/* Empty checkbox */}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                {item.is_miracle_product && (
                                                    <Sparkles size={14} className="text-amber-500 shrink-0" />
                                                )}
                                                <span className="font-bold text-slate-900 dark:text-white truncate">
                                                    {item.name}
                                                </span>
                                            </div>
                                            <span className="text-xs text-slate-500">{item.quantity}</span>
                                        </div>
                                        {item.source === 'mealplan' && (
                                            <Badge className="text-[8px] bg-blue-500/10 text-blue-600 border-none shrink-0">
                                                <ChefHat size={10} className="mr-1" /> Meal Plan
                                            </Badge>
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                                            className="opacity-0 group-hover:opacity-100 p-2 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-500 transition-all"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Checked Items */}
                    {checkedItems.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">
                                    Completed ({checkedItems.length})
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {checkedItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 opacity-60 cursor-pointer group"
                                        onClick={() => toggleItem(item.id)}
                                    >
                                        <div className="w-6 h-6 rounded-lg border-2 border-emerald-500 bg-emerald-500 flex items-center justify-center shrink-0">
                                            <Check size={14} className="text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="font-bold text-slate-500 line-through truncate block">
                                                {item.name}
                                            </span>
                                            <span className="text-xs text-slate-400">{item.quantity}</span>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={(e) => { e.stopPropagation(); moveToPantry(item); }}
                                            className="opacity-0 group-hover:opacity-100 text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                                        >
                                            <Package size={12} className="mr-1" /> To Pantry
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
