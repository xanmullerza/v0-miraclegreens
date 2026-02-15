'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
    Plus,
    Loader2,
    Search,
    Beef,
    Zap,
    Wheat,
    Droplet,
    ArrowRight,
    Camera,
    Info,
    ShoppingCart,
    ShoppingBasket,
    Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FoodItem {
    id: string;
    name: string;
    common_name: string;
    energy_kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    image: string | null;
    is_in_pantry: boolean;
    category?: string;
    quantity?: string;
}

export function AllFoodsView() {
    const router = useRouter();
    const [foods, setFoods] = useState<FoodItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Quick-add state
    const [quickAddItem, setQuickAddItem] = useState<FoodItem | null>(null);
    const [quickAddQty, setQuickAddQty] = useState('1');
    const [quickAddMode, setQuickAddMode] = useState<'pantry' | 'shopping'>('pantry');

    useEffect(() => {
        fetchFoods();
    }, []);

    const fetchFoods = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('food_items')
                .select('*')
                .order('common_name', { ascending: true });

            if (error) throw error;

            const fetchedFoods = data || [];

            // Merge in locally-stored quantities (persists without login)
            try {
                const savedQuantities = localStorage.getItem('pantry_quantities');
                if (savedQuantities) {
                    const quantities: Record<string, string> = JSON.parse(savedQuantities);
                    fetchedFoods.forEach(item => {
                        if (quantities[item.id]) {
                            item.quantity = quantities[item.id];
                            item.is_in_pantry = true;
                        }
                    });
                }
            } catch (e) {
                console.error('Failed to load saved quantities', e);
            }

            setFoods(fetchedFoods);
        } catch (error) {
            console.error('Error fetching foods:', error);
            toast.error("Failed to load foods.");
        } finally {
            setLoading(false);
        }
    };

    const addToPantry = async (food: FoodItem) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;
            if (!user) {
                toast.info('Sign in to save pantry items to the cloud');
                setQuickAddItem(null);
                return;
            }

            // Check if already in pantry_items
            const { data: existing } = await supabase
                .from('pantry_items')
                .select('id, quantity')
                .eq('user_id', user.id)
                .eq('food_item_id', food.id)
                .limit(1)
                .single();

            if (existing) {
                // Aggregate
                const parseQty = (s: string) => {
                    const match = s.trim().match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
                    return match ? { num: parseFloat(match[1]), unit: match[2].trim() } : null;
                };
                const oldQty = parseQty(existing.quantity || '0');
                const newQty = parseQty(quickAddQty);

                let finalQty = quickAddQty;
                if (oldQty && newQty && oldQty.unit === newQty.unit) {
                    const sum = oldQty.num + newQty.num;
                    finalQty = oldQty.unit ? `${sum} ${oldQty.unit}` : `${sum}`;
                } else if (existing.quantity) {
                    finalQty = `${existing.quantity} + ${quickAddQty}`;
                }

                await supabase
                    .from('pantry_items')
                    .update({ quantity: finalQty })
                    .eq('id', existing.id);
            } else {
                await supabase.from('pantry_items').insert({
                    user_id: user.id,
                    name: food.common_name || food.name,
                    quantity: quickAddQty,
                    food_item_id: food.id
                });
            }

            toast.success(`Added ${quickAddQty}× "${food.common_name || food.name}" to pantry`);
            setQuickAddItem(null);
            setQuickAddQty('1');
        } catch (error) {
            console.error('Error adding to pantry:', error);
            toast.error('Failed to add to pantry');
        }
    };

    const addToShoppingList = (food: FoodItem) => {
        const saved = localStorage.getItem('vitala_shopping_manual_items');
        let manualItems: any[] = [];
        try {
            manualItems = saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Failed to parse shopping list', e);
        }

        const itemName = food.common_name || food.name;

        // Check for existing
        const existingIndex = manualItems.findIndex(item =>
            item.food_item_id === food.id ||
            item.name.toLowerCase() === itemName.toLowerCase()
        );

        if (existingIndex >= 0) {
            const existing = manualItems[existingIndex];
            const parseQty = (s: string) => {
                const match = s.trim().match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
                return match ? { num: parseFloat(match[1]), unit: match[2].trim() } : null;
            };

            const oldQty = parseQty(existing.quantity);
            const newQty = parseQty(quickAddQty);

            if (oldQty && newQty && oldQty.unit === newQty.unit) {
                const sum = oldQty.num + newQty.num;
                manualItems[existingIndex].quantity = oldQty.unit ? `${sum} ${oldQty.unit}` : `${sum}`;
            } else {
                manualItems[existingIndex].quantity = `${existing.quantity} + ${quickAddQty}`;
            }

            toast.success(`Updated "${itemName}" quantity in shopping list`);
        } else {
            manualItems.push({
                id: `manual-${Date.now()}`,
                name: itemName,
                quantity: quickAddQty,
                unit: '',
                checked: false,
                source: 'manual',
                food_item_id: food.id
            });
            toast.success(`Added ${quickAddQty}× "${itemName}" to shopping list`);
        }

        localStorage.setItem('vitala_shopping_manual_items', JSON.stringify(manualItems));
        setQuickAddItem(null);
        setQuickAddQty('1');
    };

    const filteredFoods = foods.filter(food =>
        (food.common_name || food.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
        food.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                    <Beef size={16} className="text-blue-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-blue-600">
                        {foods.length} Foods
                    </span>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input
                    placeholder="Search all foods..."
                    className="pl-12 h-14 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <Loader2 className="animate-spin text-blue-500" size={40} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Loading foods...</p>
                </div>
            ) : filteredFoods.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem]">
                    <p className="text-slate-400">No foods found</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* List Header */}
                    <div className="hidden lg:grid lg:grid-cols-[80px_1fr_100px_80px_80px_80px_140px] gap-4 px-8 pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-1.5"><Camera size={14} /> View</div>
                        <div className="flex items-center gap-1.5"><Info size={14} /> Name</div>
                        <div className="flex justify-end items-center gap-1.5"><Zap size={14} className="text-emerald-500" /> Cals</div>
                        <div className="flex justify-end items-center gap-1.5"><Wheat size={14} className="text-amber-500" /> Carbs</div>
                        <div className="flex justify-end items-center gap-1.5"><Droplet size={14} className="text-amber-900" /> Fat</div>
                        <div className="flex justify-end items-center gap-1.5"><Beef size={14} className="text-rose-500" /> Protein</div>
                        <div className="text-center">Actions</div>
                    </div>

                    {/* Food Items */}
                    <div className="space-y-3">
                        {filteredFoods.map((food) => (
                            <div
                                key={food.id}
                                className="group relative bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/30 hover:shadow-lg transition-all overflow-hidden"
                            >
                                <div className="lg:grid lg:grid-cols-[80px_1fr_100px_80px_80px_80px_140px] gap-4 lg:items-center lg:px-8">
                                    {/* Thumbnail */}
                                    <div className="aspect-[4/3] lg:aspect-square w-full lg:w-20 rounded-xl lg:rounded-none bg-slate-100 dark:bg-slate-950/50 overflow-hidden relative">
                                        {food.image ? (
                                            <img src={food.image} alt={food.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <Beef size={24} className="opacity-20" />
                                            </div>
                                        )}
                                        {food.is_in_pantry && (
                                            <div className="absolute top-1 right-1 bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase">
                                                In Pantry
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="p-3 lg:p-0">
                                        <h3 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white leading-tight capitalize">
                                            {food.common_name || food.name}
                                        </h3>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {/* Quantity badge - always visible if present */}
                                            {food.quantity && (
                                                <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[9px] border-none uppercase font-black tracking-tight">
                                                    {food.quantity}
                                                </Badge>
                                            )}
                                            {/* Category badge - desktop only */}
                                            {food.category && (
                                                <Badge className="hidden lg:inline-flex bg-slate-100 dark:bg-slate-800 text-slate-500 text-[8px] border-none uppercase font-black">
                                                    {food.category}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="hidden lg:block text-right font-black text-sm text-slate-600 dark:text-slate-300">
                                        {Math.round(food.energy_kcal)}
                                    </div>
                                    <div className="hidden lg:block text-right font-black text-sm text-slate-600 dark:text-slate-300">
                                        {food.carbs_g.toFixed(1)}g
                                    </div>
                                    <div className="hidden lg:block text-right font-black text-sm text-slate-600 dark:text-slate-300">
                                        {food.fat_g.toFixed(1)}g
                                    </div>
                                    <div className="hidden lg:block text-right font-black text-sm text-slate-600 dark:text-slate-300">
                                        {food.protein_g.toFixed(1)}g
                                    </div>

                                    {/* Actions */}
                                    <div className="p-3 lg:p-0 flex justify-end lg:justify-center relative">
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setQuickAddItem(quickAddItem?.id === food.id ? null : food);
                                                    setQuickAddQty('1');
                                                    setQuickAddMode('pantry');
                                                }}
                                                className={cn(
                                                    "h-9 w-9 rounded-xl transition-colors",
                                                    quickAddItem?.id === food.id
                                                        ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                                                        : "text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                                                )}
                                            >
                                                <Plus size={16} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => router.push(`/library/foods/${food.id}`)}
                                                className="h-9 w-9 rounded-xl text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                                            >
                                                <ArrowRight size={16} />
                                            </Button>
                                        </div>

                                        {/* Quick Add Slide-out */}
                                        {quickAddItem?.id === food.id && (
                                            <div className="absolute top-0 right-24 lg:right-28 flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-lg border border-emerald-200 dark:border-emerald-700 z-20 animate-in slide-in-from-right-2 duration-200">
                                                <Input
                                                    value={quickAddQty}
                                                    onChange={(e) => setQuickAddQty(e.target.value)}
                                                    placeholder="Qty"
                                                    className="w-16 h-9 text-center text-sm rounded-lg border-emerald-200 dark:border-emerald-700"
                                                    onClick={(e) => e.stopPropagation()}
                                                    autoFocus
                                                />
                                                <Button
                                                    size="icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        addToPantry(food);
                                                    }}
                                                    className="h-9 w-9 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white"
                                                    title="Add to Pantry"
                                                >
                                                    <ShoppingBasket size={14} />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        addToShoppingList(food);
                                                    }}
                                                    className="h-9 w-9 rounded-lg bg-rose-500 hover:bg-rose-600 text-white"
                                                    title="Add to Shopping List"
                                                >
                                                    <ShoppingCart size={14} />
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Mobile Stats Row */}
                                    <div className="lg:hidden grid grid-cols-4 gap-2 px-3 pb-3">
                                        {[
                                            { label: 'CAL', val: food.energy_kcal, sub: 'k', color: 'text-orange-500' },
                                            { label: 'CHO', val: food.carbs_g, sub: 'g', color: 'text-amber-500' },
                                            { label: 'FAT', val: food.fat_g, sub: 'g', color: 'text-amber-900' },
                                            { label: 'PRO', val: food.protein_g, sub: 'g', color: 'text-rose-500' }
                                        ].map(stat => (
                                            <div key={stat.label} className="text-center">
                                                <p className="text-[8px] font-black text-slate-400 mb-0.5">{stat.label}</p>
                                                <p className={cn("text-xs font-black", stat.color)}>{Math.round(stat.val)}{stat.sub}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

