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
    Beef,
    Zap,
    Wheat,
    Droplet,
    ChevronRight,
    ChevronDown,
    ArrowRight,
    Camera,
    Info,
    Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { DailyPlan } from '@/lib/utils/meal-generator';
import { Recipe } from '@/lib/data/recipes';

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
}

export function PantryView() {
    const router = useRouter();
    const [foods, setFoods] = useState<FoodItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const { dailyPlan, updateDailyPlan } = useUserPreferences();

    useEffect(() => {
        fetchPantry();
    }, []);

    const toggleGroup = (groupName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedGroups(prev => ({
            ...prev,
            [groupName]: !prev[groupName]
        }));
    };

    const fetchPantry = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('food_items')
                .select('*')
                .eq('is_in_pantry', true)
                .order('common_name', { ascending: true });

            if (error) throw error;
            setFoods(data || []);
        } catch (error: any) {
            console.error('Error fetching pantry:', error);
            if (error.code === '42703') {
                toast.error("Database schema update required. Please run the latest migration.");
            } else {
                toast.error("Failed to load pantry.");
            }
        } finally {
            setLoading(false);
        }
    };

    const removeFromPantry = async (id: string, name: string) => {
        try {
            const { error } = await supabase
                .from('food_items')
                .update({ is_in_pantry: false } as any)
                .eq('id', id);

            if (error) throw error;

            setFoods(prev => prev.filter(f => f.id !== id));
            toast.success(`${name} removed from pantry`);
        } catch (error) {
            console.error('Error removing from pantry:', error);
            toast.error("Failed to remove item.");
        }
    };

    const filteredFoods = foods.filter(food =>
        (food.common_name || food.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
        food.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Grouping logic
    const groupedFoods = filteredFoods.reduce((acc, food) => {
        const key = food.common_name || food.name;
        if (!acc[key]) acc[key] = [];
        acc[key].push(food);
        return acc;
    }, {} as Record<string, FoodItem[]>);

    const groupNames = Object.keys(groupedFoods).sort();

    return (
        <div className="space-y-8">
            {/* Action Bar */}
            <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                        <ShoppingBasket size={16} className="text-emerald-500" />
                        <span className="text-xs font-black uppercase tracking-widest text-emerald-600">
                            {foods.length} Items
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {foods.length > 0 && (
                        <Button
                            onClick={() => router.push('/dashboard/kitchen?tab=mealplanner')}
                            className="bg-slate-900 border border-slate-800 text-slate-100 px-6 h-12 rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center gap-2 group transition-all hover:bg-black text-[10px]"
                        >
                            <Sparkles size={16} className="text-amber-400 group-hover:scale-125 transition-transform" />
                            Generate Meals
                        </Button>
                    )}
                    <Button
                        onClick={() => router.push('/dashboard/foods')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 h-12 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-emerald-500/10 flex items-center gap-2 group transition-all text-[10px]"
                    >
                        <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                        Add Items
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input
                    placeholder="Search your pantry..."
                    className="pl-12 h-14 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* List Area */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <Loader2 className="animate-spin text-emerald-500" size={40} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Checking your kitchen...</p>
                </div>
            ) : filteredFoods.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] bg-white/50 dark:bg-slate-900/10 backdrop-blur-sm group">
                    <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700 mb-6 group-hover:scale-110 transition-transform">
                        <ShoppingBasket size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Pantry Empty</h3>
                    <p className="text-slate-500 text-center max-w-sm mb-8 px-4">
                        Add your favorite healthy foods to your pantry to make meal planning a breeze.
                    </p>
                    <Button
                        onClick={() => router.push('/dashboard/foods')}
                        className="rounded-xl px-10 h-14 font-black uppercase tracking-widest text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/20"
                    >
                        Stock Up Now
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* List Header - Matching Explore Foods */}
                    <div className="hidden lg:grid lg:grid-cols-[80px_1fr_100px_80px_80px_80px_100px] gap-4 px-8 pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-1.5"><Camera size={14} /> View</div>
                        <div className="flex items-center gap-1.5"><Info size={14} /> Name</div>
                        <div className="flex justify-end items-center gap-1.5"><Zap size={14} className="text-emerald-500" /> Cals</div>
                        <div className="flex justify-end items-center gap-1.5"><Wheat size={14} className="text-amber-500" /> Carbs</div>
                        <div className="flex justify-end items-center gap-1.5"><Droplet size={14} className="text-amber-900" /> Fat</div>
                        <div className="flex justify-end items-center gap-1.5"><Beef size={14} className="text-rose-500" /> Protein</div>
                        <div className="text-center">Actions</div>
                    </div>

                    {/* Food Items Grouped List */}
                    <div className="space-y-6">
                        {groupNames.map((groupName) => {
                            const items = groupedFoods[groupName];
                            const isExpanded = expandedGroups[groupName] || (searchQuery.length > 0 && items.length > 0);
                            const hasMultiple = items.length > 1;

                            return (
                                <div key={groupName} className="space-y-2">
                                    {/* Group Header */}
                                    {hasMultiple && (
                                        <div
                                            onClick={(e) => toggleGroup(groupName, e)}
                                            className={cn(
                                                "flex items-center gap-4 px-4 py-3 rounded-2xl border transition-all shadow-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 group/header",
                                                isExpanded && "border-emerald-500/30 ring-1 ring-emerald-500/10"
                                            )}
                                        >
                                            {/* Thumbnail for group */}
                                            <div className="w-16 h-12 rounded-xl bg-slate-200 dark:bg-slate-950 overflow-hidden shrink-0 border border-slate-300 dark:border-slate-700 shadow-inner group-hover/header:scale-105 transition-transform duration-300">
                                                {items[0]?.image ? (
                                                    <img src={items[0].image} alt={groupName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                        <Beef size={16} />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-3 overflow-hidden flex-1">
                                                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                                                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                </div>
                                                <div className="flex flex-col overflow-hidden">
                                                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2 truncate">
                                                        {groupName}
                                                        <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[10px] px-2 py-0 shrink-0">
                                                            {items.length} options
                                                        </Badge>
                                                    </h2>
                                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter truncate opacity-70">
                                                        {items.map(i => i.name).join(' • ')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {!hasMultiple && (
                                        <div className="px-4 py-1">
                                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">
                                                {groupName}
                                            </h2>
                                        </div>
                                    )}

                                    {/* Items in Group */}
                                    <div className={cn("space-y-3", hasMultiple && "pl-6 lg:pl-8 border-l-2 border-slate-100 dark:border-slate-800 ml-3 lg:ml-7")}>
                                        {(isExpanded || !hasMultiple) && items.map((food) => (
                                            <div
                                                key={food.id}
                                                className="group relative bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/30 hover:shadow-lg transition-all overflow-hidden"
                                            >
                                                <div className="lg:grid lg:grid-cols-[80px_1fr_100px_80px_80px_80px_100px] gap-4 lg:items-center lg:px-8">
                                                    {/* Thumbnail */}
                                                    <div className="aspect-[4/3] lg:aspect-square w-full lg:w-20 rounded-xl lg:rounded-none bg-slate-100 dark:bg-slate-950/50 overflow-hidden relative">
                                                        {food.image ? (
                                                            <img src={food.image} alt={food.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                                <Beef size={24} className="opacity-20" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="p-3 lg:p-0">
                                                        <h3 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white leading-tight capitalize">
                                                            {food.name}
                                                        </h3>
                                                        {food.category && (
                                                            <Badge className="mt-2 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[8px] border-none">
                                                                {food.category}
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    {/* Stats (Desktop View) */}
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
                                                    <div className="p-3 lg:p-0 flex justify-end lg:justify-center">
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => removeFromPantry(food.id, food.name)}
                                                                className="h-9 w-9 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => router.push(`/dashboard/foods/${food.id}`)}
                                                                className="h-9 w-9 rounded-xl text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                                                            >
                                                                <ArrowRight size={16} />
                                                            </Button>
                                                        </div>
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
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
