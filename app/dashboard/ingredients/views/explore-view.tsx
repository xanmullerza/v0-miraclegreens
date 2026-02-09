'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    ShoppingBasket,
    Plus,
    Search,
    Loader2,
    Heart,
    ArrowRight,
    Edit2,
    Check,
    X,
    Camera,
    Info,
    Zap,
    Wheat,
    Droplet,
    Beef,
    Activity,
    Globe,
    Filter,
    ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useSearch } from '@/lib/context/search-context';

interface FoodItem {
    id: string;
    name: string;
    common_name: string;
    energy_kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    image: string | null;
    is_favorite: boolean;
    is_in_pantry: boolean;
}

interface ExploreViewProps {
    showFavoritesOnly?: boolean;
    setShowFavoritesOnly?: React.Dispatch<React.SetStateAction<boolean>>;
    selectedCategories?: string[];
    setSelectedCategories?: React.Dispatch<React.SetStateAction<string[]>>;
    hideControls?: boolean;
}

export function ExploreView({
    showFavoritesOnly: externalShowFavoritesOnly,
    setShowFavoritesOnly: externalSetShowFavoritesOnly,
    selectedCategories: externalSelectedCategories,
    setSelectedCategories: externalSetSelectedCategories,
    hideControls = false
}: ExploreViewProps) {
    const router = useRouter();
    const [foods, setFoods] = useState<FoodItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { searchQuery, setSearchQuery } = useSearch();

    const [localShowFavoritesOnly, setLocalShowFavoritesOnly] = useState(false);
    const showFavoritesOnly = externalShowFavoritesOnly !== undefined ? externalShowFavoritesOnly : localShowFavoritesOnly;
    const setShowFavoritesOnly = externalSetShowFavoritesOnly !== undefined ? externalSetShowFavoritesOnly : setLocalShowFavoritesOnly;

    const [localSelectedCategories, setLocalSelectedCategories] = useState<string[]>([]);
    const selectedCategories = externalSelectedCategories !== undefined ? externalSelectedCategories : localSelectedCategories;
    const setSelectedCategories = externalSetSelectedCategories !== undefined ? externalSetSelectedCategories : setLocalSelectedCategories;

    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

    // Quick Add State
    const [quickAddItem, setQuickAddItem] = useState<FoodItem | null>(null);
    const [quickAddQty, setQuickAddQty] = useState('1');
    const [quickAddMode, setQuickAddMode] = useState<'pantry' | 'shopping'>('pantry');

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const CATEGORIES = ["General", "Vegetables", "Grains", "Legumes", "Oils", "Proteins", "Fruit", "Nuts", "Flavour", "Supplements"];

    useEffect(() => {
        fetchFoods(1, true);
    }, [searchQuery, showFavoritesOnly, selectedCategories]);

    const fetchFoods = async (pageNum: number, isNewSearch = false) => {
        setLoading(true);
        try {
            let query = supabase.from('food_items').select('*').order('name', { ascending: true });

            if (searchQuery) {
                query = query.or(`name.ilike.%${searchQuery}%,common_name.ilike.%${searchQuery}%`);
            }

            if (showFavoritesOnly) {
                query = query.eq('is_favorite', true);
            }

            if (selectedCategories.length > 0 && selectedCategories.length < CATEGORIES.length) {
                query = query.in('category', selectedCategories);
            }

            const from = (pageNum - 1) * 20;
            const to = from + 19;
            query = query.range(from, to);

            const { data, error } = await query;
            if (error) throw error;

            if (isNewSearch) {
                setFoods(data || []);
                setPage(1);
            } else {
                setFoods(prev => [...prev, ...(data || [])]);
            }
            setHasMore((data || []).length === 20);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load foods");
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchFoods(1, true);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const toggleFavorite = async (item: FoodItem, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const { error } = await supabase.from('food_items').update({ is_favorite: !item.is_favorite } as any).eq('id', item.id);
            if (error) throw error;
            setFoods(prev => prev.map(f => f.id === item.id ? { ...f, is_favorite: !f.is_favorite } : f));
            toast.success(item.is_favorite ? "Removed from favourites" : "Added to favourites");
        } catch (error) { toast.error("Action failed"); }
    };


    const handleQuickAdd = async () => {
        if (!quickAddItem) return;
        if (quickAddMode === 'pantry') {
            try {
                const { error } = await supabase.from('food_items').update({ is_in_pantry: true } as any).eq('id', quickAddItem.id);
                if (error) throw error;
                setFoods(prev => prev.map(f => f.id === quickAddItem.id ? { ...f, is_in_pantry: true } : f));
                toast.success(`"${quickAddItem.name}" added to staples`);
            } catch (error) { toast.error("Failed to update kitchen"); }
        } else {
            const currentList = JSON.parse(localStorage.getItem('vitala_shopping_manual_items') || '[]');
            const newItem = {
                id: `manual-${Date.now()}`,
                name: quickAddItem.name,
                quantity: quickAddQty,
                unit: '',
                checked: false,
                source: 'manual'
            };
            localStorage.setItem('vitala_shopping_manual_items', JSON.stringify([...currentList, newItem]));
            toast.success(`"${quickAddItem.name}" added to shopping list`);
        }
        setQuickAddItem(null);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Search and Filters */}
            {!hideControls && (
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-xl">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <Input
                                placeholder="Search clinical database..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                className="pl-12 h-14 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        {/* Favorites Switch Toggle */}
                        <div className="flex items-center gap-4 bg-white dark:bg-slate-900/50 h-14 px-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0 transition-all">
                            <Globe
                                size={18}
                                className={cn(
                                    "transition-all cursor-pointer",
                                    !showFavoritesOnly ? "text-blue-500 scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]" : "text-slate-300 hover:text-slate-400"
                                )}
                                onClick={() => setShowFavoritesOnly(false)}
                            />
                            <Switch
                                id="favorites-mode"
                                checked={showFavoritesOnly}
                                onCheckedChange={setShowFavoritesOnly}
                                className="data-[state=checked]:bg-rose-500 data-[state=unchecked]:bg-blue-600 dark:data-[state=unchecked]:bg-blue-600"
                            />
                            <Heart
                                size={18}
                                className={cn(
                                    "transition-all cursor-pointer",
                                    showFavoritesOnly ? "text-rose-500 fill-rose-500 scale-110 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]" : "text-slate-300 hover:text-slate-400"
                                )}
                                onClick={() => setShowFavoritesOnly(true)}
                            />
                        </div>

                        {/* Category Filter */}
                        <div className="relative">
                            <div className="flex bg-white dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto no-scrollbar items-center h-14 shadow-sm w-fit transition-all duration-500">
                                <button
                                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                                    className={cn(
                                        "px-4 h-full rounded-xl flex items-center gap-2 transition-all duration-300 shrink-0",
                                        isFilterOpen ? "bg-emerald-600 text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                    )}
                                >
                                    <Filter size={18} />
                                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Filter Groups</span>
                                    <ChevronDown size={14} className={cn("transition-transform duration-300", isFilterOpen && "rotate-180")} />
                                </button>

                                <div className="w-px h-6 bg-slate-100 dark:bg-slate-800 mx-1 shrink-0" />

                                <div className={cn("flex items-center gap-1 transition-all duration-500 ease-in-out overflow-hidden", isFilterOpen ? "max-w-[1000px] opacity-100 px-1" : "max-w-0 opacity-0 px-0")}>
                                    {CATEGORIES.map(category => {
                                        const isActive = selectedCategories.includes(category);
                                        return (
                                            <button
                                                key={category}
                                                onClick={() => isActive
                                                    ? setSelectedCategories(prev => prev.filter(c => c !== category))
                                                    : setSelectedCategories(prev => [...prev, category])
                                                }
                                                className={cn(
                                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 whitespace-nowrap",
                                                    isActive
                                                        ? "bg-emerald-600/10 text-emerald-600 border border-emerald-600/20"
                                                        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                                                )}
                                            >
                                                {category}
                                            </button>
                                        );
                                    })}
                                </div>

                                {!isFilterOpen && (
                                    <div className="px-4 whitespace-nowrap">
                                        <span className="text-[10px] font-bold text-slate-400 italic">
                                            {selectedCategories.length === 0 || selectedCategories.length === CATEGORIES.length ? "All Samples" : `${selectedCategories.length} Categories Selected`}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* List Header */}
            <div className="hidden lg:grid lg:grid-cols-[80px_1fr_100px_80px_80px_80px_200px] gap-4 px-10 pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5"><Camera size={14} /> View</div>
                <div className="flex items-center gap-1.5"><Info size={14} /> Name</div>
                <div className="flex justify-end items-center gap-1.5"><Zap size={14} className="text-emerald-500" /> ENERGY</div>
                <div className="flex justify-end items-center gap-1.5"><Wheat size={14} className="text-amber-500" /> CARBS</div>
                <div className="flex justify-end items-center gap-1.5"><Droplet size={14} className="text-amber-900" /> FAT</div>
                <div className="flex justify-end items-center gap-1.5"><Beef size={14} className="text-rose-500" /> PROTEIN</div>
                <div className="flex justify-center items-center gap-1.5">
                    <Activity size={14} className="text-slate-400" /> CONTROL
                </div>
            </div>

            {/* List Area */}
            <div className="space-y-3">
                {foods.map((food) => (
                    <div key={food.id} className="group relative bg-white dark:bg-slate-900/50 rounded-[2rem] border border-slate-200 dark:border-slate-800 hover:border-emerald-500/30 hover:shadow-2xl transition-all duration-500 overflow-hidden">
                        <div className="lg:grid lg:grid-cols-[80px_1fr_100px_80px_80px_80px_200px] gap-4 lg:items-center lg:px-10 py-2">
                            {/* Thumbnail */}
                            <div className="aspect-square w-16 lg:w-16 rounded-2xl bg-slate-100 dark:bg-slate-950 overflow-hidden relative group-hover:scale-105 transition-transform duration-500 mx-auto">
                                {food.image ? (
                                    <img src={food.image} alt={food.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <Beef size={24} className="opacity-10" />
                                    </div>
                                )}
                                {food.is_in_pantry && (
                                    <div className="absolute top-1 right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-md">
                                        <Check size={8} strokeWidth={4} />
                                    </div>
                                )}
                            </div>

                            {/* Name */}
                            <div className="p-3 lg:p-0">
                                <h3 className="font-black text-sm tracking-tight text-slate-900 dark:text-white uppercase italic leading-tight group-hover:text-emerald-500 transition-colors">
                                    {food.common_name || food.name}
                                </h3>
                                {food.is_in_pantry && (
                                    <Badge className="mt-1 bg-emerald-500/10 text-emerald-600 border-none text-[8px] uppercase font-black px-1.5 py-0">In Kitchen</Badge>
                                )}
                            </div>

                            {/* Stats */}
                            <div className="hidden lg:block text-right font-black text-[13px] text-slate-600 dark:text-slate-300">{Math.round(food.energy_kcal)}</div>
                            <div className="hidden lg:block text-right font-black text-[13px] text-slate-600 dark:text-slate-300">{food.carbs_g?.toFixed(1) || '0.0'}g</div>
                            <div className="hidden lg:block text-right font-black text-[13px] text-slate-600 dark:text-slate-300">{food.fat_g?.toFixed(1) || '0.0'}g</div>
                            <div className="hidden lg:block text-right font-black text-[13px] text-slate-600 dark:text-slate-300">{food.protein_g?.toFixed(1) || '0.0'}g</div>

                            {/* Actions */}
                            <div className="p-3 lg:p-0 flex justify-center items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn("h-9 w-9 rounded-xl transition-all bg-transparent", food.is_favorite ? "text-rose-500" : "text-slate-400 hover:text-rose-500")}
                                    onClick={(e) => toggleFavorite(food, e)}
                                    title="Favorite"
                                >
                                    <Heart size={16} fill={food.is_favorite ? "currentColor" : "none"} />
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-xl text-slate-400 hover:text-emerald-500 transition-all"
                                    onClick={(e) => { e.stopPropagation(); setQuickAddItem(quickAddItem?.id === food.id ? null : food); }}
                                    title="Quick Add"
                                >
                                    <Plus size={16} />
                                </Button>



                                {/* Admin Edit */}
                                {currentUserEmail?.toLowerCase() === (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').toLowerCase() && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/dashboard/admin/foods/${food.id}`);
                                        }}
                                        className="h-9 w-9 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                        title="Admin Edit"
                                    >
                                        <Edit2 size={16} />
                                    </Button>
                                )}

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-xl text-slate-400 hover:text-emerald-500 transition-all"
                                    onClick={(e) => router.push(`/dashboard/ingredients/${food.id}`)}
                                    title="View Details"
                                >
                                    <ArrowRight size={16} />
                                </Button>
                            </div>
                        </div>

                        {/* Quick Add Slide-out */}
                        {quickAddItem?.id === food.id && (
                            <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-6 animate-in slide-in-from-top duration-300">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                                            <ShoppingBasket size={24} className="text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Quick Action</p>
                                            <h4 className="font-black text-sm uppercase italic">Add to Inventory</h4>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="flex bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-1">
                                            <button
                                                onClick={() => setQuickAddMode('pantry')}
                                                className={cn("px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all", quickAddMode === 'pantry' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-slate-400")}
                                            >
                                                Staples
                                            </button>
                                            <button
                                                onClick={() => setQuickAddMode('shopping')}
                                                className={cn("px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all", quickAddMode === 'shopping' ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "text-slate-400")}
                                            >
                                                Shopping
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-3 h-11">
                                            <span className="text-[10px] font-black text-slate-400 uppercase">Qty</span>
                                            <input
                                                type="text"
                                                value={quickAddQty}
                                                onChange={(e) => setQuickAddQty(e.target.value)}
                                                className="w-12 bg-transparent border-none text-center font-black text-sm focus:ring-0"
                                            />
                                        </div>
                                        <Button
                                            onClick={handleQuickAdd}
                                            className={cn("h-11 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl", quickAddMode === 'pantry' ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-rose-600 hover:bg-rose-700 text-white")}
                                        >
                                            Confirm Add
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => setQuickAddItem(null)} className="h-11 w-11 rounded-xl"><X size={18} /></Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {hasMore && (
                <div className="flex justify-center pt-8">
                    <Button
                        variant="outline"
                        onClick={() => fetchFoods(page + 1)}
                        className="h-14 px-12 rounded-2xl border-slate-200 dark:border-slate-800 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50"
                    >
                        {loading ? <Loader2 className="animate-spin mr-2" /> : <Plus size={16} className="mr-2" />}
                        Load Scientific Markers
                    </Button>
                </div>
            )}
        </div>
    );
}
