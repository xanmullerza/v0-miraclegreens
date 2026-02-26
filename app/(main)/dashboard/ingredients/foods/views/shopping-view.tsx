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
    ChefHat,
    X,
    ScanLine,
    Package,
    Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { generateShoppingList } from '@/lib/utils/meal-generator';
import { BarcodeScanner } from '@/components/kitchen/barcode-scanner';
import { ScanConfirmDialog } from '@/components/kitchen/scan-confirm-dialog';
import { recordPurchase, saveScannedProduct } from '@/lib/services/product-lookup';
import { PantryMatchDialog } from '@/components/kitchen/pantry-match-dialog';

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

export function ShoppingView() {
    const router = useRouter();
    const [items, setItems] = useState<ShoppingListItem[]>([]);
    const [manualItems, setManualItems] = useState<ShoppingListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [newItemName, setNewItemName] = useState('');
    const [newItemQty, setNewItemQty] = useState('');
    const { dailyPlan } = useUserPreferences();
    const [pantryItems, setPantryItems] = useState<any[]>([]);

    const [scannerOpen, setScannerOpen] = useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [scannedBarcode, setScannedBarcode] = useState('');

    const [matchDialogOpen, setMatchDialogOpen] = useState(false);
    const [selectedMatchItem, setSelectedMatchItem] = useState<ShoppingListItem | null>(null);
    const [scannedIdToLink, setScannedIdToLink] = useState<string | null>(null);

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

    useEffect(() => {
        if (!loading) {
            localStorage.setItem('vitala_shopping_manual_items', JSON.stringify(manualItems));
        }
    }, [manualItems, loading]);

    useEffect(() => {
        let combined = [...manualItems];
        if (dailyPlan) {
            const mealPlanItems = generateShoppingList(dailyPlan);
            const pantryNames = new Set<string>();
            pantryItems.forEach(f => {
                if (f.common_name) {
                    const cn = f.common_name.toLowerCase().trim();
                    pantryNames.add(cn);
                    if (cn.endsWith('s')) pantryNames.add(cn.replace(/s$/, ''));
                    else pantryNames.add(cn + 's');
                }
                if (f.name) {
                    const n = f.name.toLowerCase().trim();
                    pantryNames.add(n);
                    if (n.endsWith('s')) pantryNames.add(n.replace(/s$/, ''));
                    else pantryNames.add(n + 's');
                }
            });

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

            const manualNames = new Set(manualItems.map(i => i.name.toLowerCase().trim()));
            const newMealPlanItems = convertedItems.filter(i => !manualNames.has(i.name.toLowerCase().trim()));
            combined = [...manualItems, ...newMealPlanItems];
        }
        setItems(combined);
    }, [dailyPlan, pantryItems, manualItems]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const [foodItemsRes, pantryItemsRes] = await Promise.all([
                supabase.from('food_items')
                    .select('*')
                    .eq('is_in_pantry', true),
                user ? supabase.from('pantry_items')
                    .select('*, scanned_products(name, common_name), food_items(*)')
                    .eq('user_id', user.id)
                    : { data: [] }
            ]);

            let items: any[] = foodItemsRes.data || [];

            if (pantryItemsRes.data) {
                const personalItems = pantryItemsRes.data.map((item: any) => {
                    const sp = item.scanned_products;
                    const fi = item.food_items;
                    return {
                        id: item.food_item_id || item.id,
                        name: sp?.name || fi?.name || item.custom_name,
                        common_name: fi?.common_name || sp?.common_name || sp?.name || fi?.name || item.custom_name,
                        is_in_pantry: true,
                    };
                });
                items = [...items, ...personalItems];
            }

            setPantryItems(items);
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
        toast.success(`Added "${newItemName}" to list`);
    };

    const handleBarcodeScan = (barcode: string) => {
        setScannerOpen(false);
        setScannedBarcode(barcode);
        setConfirmDialogOpen(true);
    };

    const handleScannedProductConfirm = async (product: any) => {
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
        saveScannedProduct({
            barcode: product.barcode,
            name: product.name,
            source: 'manual',
            weight_g: product.weight_g,
            default_unit: product.unit,
            image_url: product.image_url,
            nutrition: product.nutrition
        });
        toast.success(`Added "${product.name}" to list`);
    };

    const toggleItem = (id: string) => {
        if (id.startsWith('manual-') || id.startsWith('scanned-')) {
            setManualItems(prev => prev.map(item =>
                item.id === id ? { ...item, checked: !item.checked } : item
            ));
        } else {
            setItems(prev => prev.map(item =>
                item.id === id ? { ...item, checked: !item.checked } : item
            ));
        }
    };

    const removeItem = (id: string) => {
        if (id.startsWith('manual-') || id.startsWith('scanned-')) {
            setManualItems(prev => prev.filter(item => item.id !== id));
        } else {
            setItems(prev => prev.filter(item => item.id !== id));
        }
    };

    const moveToPantry = async (item: ShoppingListItem) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('Login required');
                return;
            }
            if (item.source === 'scanned' && item.barcode) {
                const { data: scanDef } = await supabase
                    .from('scanned_products')
                    .select('id')
                    .eq('barcode', item.barcode)
                    .single();
                if (scanDef) setScannedIdToLink(scanDef.id);
            }
            setSelectedMatchItem(item);
            setMatchDialogOpen(true);
        } catch (error) {
            console.error('Error moving to pantry:', error);
        }
    };

    const handleMatchConfirm = async (foodItemId: string | null, name: string, quantity: string) => {
        if (!selectedMatchItem) return;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            // Simplified logic for brevity, matches the original ShoppingListView closely
            const effectiveFoodId = foodItemId || selectedMatchItem.food_item_id || null;
            const effectiveScannedId = (!foodItemId && scannedIdToLink) ? scannedIdToLink : null;

            // Just calling the update or insert logic as per the original component
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
            toast.success(`"${name}" moved to stables`);
            fetchData();
        } catch (error) {
            console.error('Error linking to pantry:', error);
            toast.error('Update failed');
        }
    };

    const clearCheckedItems = () => {
        setManualItems(prev => prev.filter(item => !item.checked));
        setItems(prev => prev.filter(item => !item.checked));
        toast.success(`Cleared checked items`);
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const uncheckedItems = filteredItems.filter(i => !i.checked);
    const checkedItems = filteredItems.filter(i => i.checked);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <BarcodeScanner isOpen={scannerOpen} onClose={() => setScannerOpen(false)} onScan={handleBarcodeScan} />
            <ScanConfirmDialog isOpen={confirmDialogOpen} barcode={scannedBarcode} onClose={() => setConfirmDialogOpen(false)} onConfirm={handleScannedProductConfirm} />
            <PantryMatchDialog
                isOpen={matchDialogOpen}
                initialQuery={selectedMatchItem?.name || ''}
                onClose={() => setMatchDialogOpen(false)}
                onConfirm={handleMatchConfirm}
                knownItem={selectedMatchItem ? { name: selectedMatchItem.name, image: selectedMatchItem.image_url, quantity: selectedMatchItem.quantity } : undefined}
            />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">Shopping List</h2>
                    <p className="text-slate-500 font-medium text-sm max-w-lg">
                        Items you need to acquire. Synchronized with your meal plans and scanned products.
                    </p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl">
                <div className="flex-1 flex gap-3">
                    <Input placeholder="Item name..." value={newItemName} onChange={(e) => setNewItemName(e.target.value)} className="flex-1 h-12 rounded-xl border-slate-200 dark:border-slate-700" onKeyDown={(e) => e.key === 'Enter' && addManualItem()} />
                    <Input placeholder="Qty" value={newItemQty} onChange={(e) => setNewItemQty(e.target.value)} className="w-24 h-12 rounded-xl border-slate-200 dark:border-slate-700 text-center" onKeyDown={(e) => e.key === 'Enter' && addManualItem()} />
                </div>
                <div className="flex gap-3">
                    <Button onClick={() => setScannerOpen(true)} variant="outline" className="h-12 px-6 rounded-xl border-amber-300 dark:border-amber-700 text-amber-600 hover:bg-amber-50 font-black uppercase tracking-widest text-[10px]">
                        <ScanLine size={16} className="mr-2" /> Scan
                    </Button>
                    <Button onClick={addManualItem} disabled={!newItemName.trim()} className="h-12 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest shadow-xl text-[10px]">
                        <Plus size={16} className="mr-2" /> Add
                    </Button>
                </div>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input placeholder="Search your list..." className="pl-12 h-12 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <Loader2 className="animate-spin text-emerald-500" size={40} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic font-mono uppercase tracking-[0.2em]">Synchronizing...</p>
                </div>
            ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] bg-white/50 dark:bg-slate-900/10 backdrop-blur-sm group">
                    <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700 mb-6 group-hover:scale-110 transition-transform">
                        <ShoppingBasket size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">List Empty</h3>
                    <p className="text-slate-500 text-center max-w-sm px-4">
                        Acquire ingredients from the <strong>Explore</strong> tab or via meal generation.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {uncheckedItems.length > 0 && (
                        <div className="space-y-3">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> Need to Buy ({uncheckedItems.length})
                            </span>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {uncheckedItems.map((item) => (
                                    <div key={item.id} className={cn("flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group", item.is_miracle_product ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500/50")} onClick={() => toggleItem(item.id)}>
                                        <div className="w-6 h-6 rounded-lg border-2 border-slate-300 dark:border-slate-600 group-hover:border-emerald-500 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                {item.is_miracle_product && <Sparkles size={12} className="text-amber-500" />}
                                                <span className="font-bold text-slate-900 dark:text-white truncate">{item.name}</span>
                                            </div>
                                            <span className="text-xs text-slate-500">{item.quantity}</span>
                                        </div>
                                        {item.source === 'mealplan' && <Badge className="text-[8px] bg-blue-500/10 text-blue-600 border-none shrink-0"><ChefHat size={10} className="mr-1" /> Plan</Badge>}
                                        <button onClick={(e) => { e.stopPropagation(); removeItem(item.id); }} className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-rose-500 transition-all"><X size={16} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {checkedItems.length > 0 && (
                        <div className="space-y-3">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Completed ({checkedItems.length})
                            </span>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {checkedItems.map((item) => (
                                    <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 opacity-60 cursor-pointer group" onClick={() => toggleItem(item.id)}>
                                        <div className="w-6 h-6 rounded-lg border-2 border-emerald-500 bg-emerald-500 flex items-center justify-center shrink-0"><Check size={14} className="text-white" /></div>
                                        <div className="flex-1 min-w-0"><span className="font-bold text-slate-500 line-through truncate block">{item.name}</span><span className="text-xs text-slate-400">{item.quantity}</span></div>
                                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); moveToPantry(item); }} className="opacity-0 group-hover:opacity-100 text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700"><Package size={12} className="mr-1" /> To Staples</Button>
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
