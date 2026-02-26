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
    ChevronDown,
    ChevronRight,
    CheckCircle2,
    Trash2,
    Leaf,
    Library
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useSearch } from '@/lib/context/search-context';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { ChevronDown as ChevronDownIcon, CheckSquare, Square, ChefHat } from 'lucide-react';

const CAL_TO_KJ = 4.184;

function formatEnergy(calories: number, unit: 'kcal' | 'kJ') {
    if (unit === 'kJ') {
        return `${Math.round(calories * CAL_TO_KJ).toLocaleString()} kJ`;
    }
    return `${Math.round(calories).toLocaleString()} kC`;
}

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
    category?: string;
    quantity?: string;
    user_id?: string | null;
    is_curated?: boolean;
}


interface ExploreViewProps {
    showFavoritesOnly?: boolean;
    setShowFavoritesOnly?: React.Dispatch<React.SetStateAction<boolean>>;
    selectedCategories?: string[];
    setSelectedCategories?: React.Dispatch<React.SetStateAction<string[]>>;
    hideControls?: boolean;
    showHero?: boolean;
}

export function ExploreView({
    showFavoritesOnly: externalShowFavoritesOnly,
    setShowFavoritesOnly: externalSetShowFavoritesOnly,
    selectedCategories: externalSelectedCategories,
    setSelectedCategories: externalSetSelectedCategories,
    hideControls = false,
    showHero = true
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
    const [user, setUser] = useState<any>(null);
    const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            const u = session?.user ?? null;
            setUser(u);
            const email = u?.email ?? null;
            setCurrentUserEmail(email);

            const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';
            setIsAdmin(email?.toLowerCase() === adminEmail.toLowerCase());
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const u = session?.user ?? null;
            setUser(u);
            const email = u?.email ?? null;
            setCurrentUserEmail(email);

            const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';
            setIsAdmin(email?.toLowerCase() === adminEmail.toLowerCase());
        });

        return () => subscription.unsubscribe();
    }, []);


    // Quick Add State (Sophisticated matching Pantry)
    const [quickAddItem, setQuickAddItem] = useState<FoodItem | null>(null);
    const [quickAddQty, setQuickAddQty] = useState('1');
    const [quickAddWeight, setQuickAddWeight] = useState('');
    const [quickAddUnit, setQuickAddUnit] = useState('g');
    const [quickAddMode, setQuickAddMode] = useState<'pantry' | 'shopping'>('pantry');
    const { measurementUnit, energyUnit } = useUserPreferences();

    // Hero Search State
    const [heroSearchQuery, setHeroSearchQuery] = useState('');
    const [heroResults, setHeroResults] = useState<FoodItem[]>([]);
    const [isHeroSearching, setIsHeroSearching] = useState(false);
    const [isHeroActive, setIsHeroActive] = useState(false);
    const heroSearchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const CATEGORIES = ["General", "Vegetables", "Grains", "Legumes", "Oils", "Proteins", "Fruit", "Nuts", "Flavour", "Supplements", "Mixes"];

    // Hero Search Logic
    const performHeroSearch = async (query: string) => {
        if (!query || query.length < 2) {
            setHeroResults([]);
            return;
        }
        setIsHeroSearching(true);
        try {
            let heroQuery = supabase.from('food_items').select('*').limit(8);
            if (user) {
                heroQuery = heroQuery.or(`is_curated.eq.true,user_id.eq.${user.id}`);
            } else {
                heroQuery = heroQuery.eq('is_curated', true);
            }
            heroQuery = heroQuery.or(`name.ilike.%${query}%,common_name.ilike.%${query}%`);
            heroQuery = heroQuery.order('name', { ascending: true });
            const { data, error } = await heroQuery;
            if (error) throw error;
            setHeroResults((data as FoodItem[]) || []);
        } catch (error) {
            console.error('Hero search error:', error);
        } finally {
            setIsHeroSearching(false);
        }
    };

    const handleHeroSearchInput = (val: string) => {
        setHeroSearchQuery(val);
        if (heroSearchTimeoutRef.current) clearTimeout(heroSearchTimeoutRef.current);
        heroSearchTimeoutRef.current = setTimeout(() => performHeroSearch(val), 300);
    };

    useEffect(() => {
        fetchFoods(1, true);
    }, [searchQuery, showFavoritesOnly, selectedCategories, user]);

    const fetchFoods = async (pageNum: number, isNewSearch = false) => {
        setLoading(true);
        try {
            let query = supabase.from('food_items').select('*', { count: 'exact' });

            // 1. Scoping: Curated OR User's own
            if (user) {
                query = query.or(`is_curated.eq.true,user_id.eq.${user.id}`);
            } else {
                query = query.eq('is_curated', true);
            }

            // 2. Filtering
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

            const { data, error, count } = await query.order('name', { ascending: true });
            if (error) throw error;

            let fetchedItems = (data as FoodItem[]) || [];

            // 3. If NOT logged in, merge with LocalStorage foods
            if (!user) {
                try {
                    const localFoodsData = localStorage.getItem('local_foods');
                    if (localFoodsData) {
                        let localFoods: FoodItem[] = JSON.parse(localFoodsData);

                        // Apply filters to local foods
                        if (searchQuery.trim()) {
                            localFoods = localFoods.filter(f =>
                                f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                (f.common_name && f.common_name.toLowerCase().includes(searchQuery.toLowerCase()))
                            );
                        }
                        if (showFavoritesOnly) {
                            localFoods = localFoods.filter(f => f.is_favorite);
                        }
                        if (selectedCategories.length > 0 && selectedCategories.length < CATEGORIES.length) {
                            localFoods = localFoods.filter(f => f.category && selectedCategories.includes(f.category));
                        }

                        fetchedItems = [...localFoods, ...fetchedItems];
                    }
                } catch (e) {
                    console.error("Error loading local foods:", e);
                }
            }

            // Merge in locally-stored quantities (persists without login)
            try {
                const savedQuantities = localStorage.getItem('pantry_quantities');
                if (savedQuantities) {
                    const quantities: Record<string, string> = JSON.parse(savedQuantities);
                    fetchedItems.forEach(item => {
                        if (quantities[item.id]) {
                            item.quantity = quantities[item.id];
                            item.is_in_pantry = true;
                        }
                    });
                }
            } catch (e) {
                console.error('Failed to load saved quantities', e);
            }

            if (isNewSearch) {
                setFoods(fetchedItems);
                setPage(1);
            } else {
                setFoods(prev => {
                    const existingIds = new Set(prev.map(f => f.id));
                    const uniqueNew = fetchedItems.filter(f => !existingIds.has(f.id));
                    return [...prev, ...uniqueNew];
                });
                setPage(pageNum);
            }
            setHasMore(fetchedItems.length === 20);
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

    const toggleGroup = (groupName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedGroups(prev => ({
            ...prev,
            [groupName]: !prev[groupName]
        }));
    };

    const groupedFoods = foods.reduce((acc, food) => {
        const key = food.common_name || food.name;
        if (!acc[key]) acc[key] = [];
        acc[key].push(food);
        return acc;
    }, {} as Record<string, FoodItem[]>);

    const groupNames = Object.keys(groupedFoods).sort();

    const toggleFavorite = async (item: FoodItem, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const { error } = await supabase.from('food_items').update({ is_favorite: !item.is_favorite } as any).eq('id', item.id);
            if (error) throw error;
            setFoods(prev => prev.map(f => f.id === item.id ? { ...f, is_favorite: !f.is_favorite } : f));
            toast.success(item.is_favorite ? "Removed from favourites" : "Added to favourites");
        } catch (error) { toast.error("Action failed"); }
    };

    const handleDelete = async (e: React.MouseEvent, food: FoodItem) => {
        e.stopPropagation();
        if (!confirm(`Are you sure you want to delete "${food.name}"?`)) return;

        try {
            if (food.id.startsWith('food-')) {
                // Local Deletion
                const localData = localStorage.getItem('local_foods');
                if (localData) {
                    const localFoods = JSON.parse(localData).filter((f: any) => f.id !== food.id);
                    localStorage.setItem('local_foods', JSON.stringify(localFoods));
                }
                setFoods(prev => prev.filter(f => f.id !== food.id));
                toast.success("Food item removed locally");
            } else {
                // Cloud Deletion
                const { error } = await supabase.from('food_items').delete().eq('id', food.id);
                if (error) throw error;
                setFoods(prev => prev.filter(f => f.id !== food.id));
                toast.success("Food item deleted successfully");
            }
        } catch (error: any) {
            console.error("Delete error:", error);
            toast.error(error.message || "Failed to delete food item");
        }
    };



    const handleQuickAdd = async () => {
        if (!quickAddItem) return;

        const quantityString = quickAddWeight ? `${quickAddQty} x ${quickAddWeight}${quickAddUnit}` : quickAddQty;

        if (quickAddMode === 'pantry') {
            try {
                // Update UI immediately
                setFoods(prev => prev.map(f => f.id === quickAddItem.id ? { ...f, is_in_pantry: true, quantity: quantityString } : f));

                // Persist to localStorage
                const saved = localStorage.getItem('pantry_quantities');
                const quantities: Record<string, string> = saved ? JSON.parse(saved) : {};
                quantities[quickAddItem.id] = quantityString;
                localStorage.setItem('pantry_quantities', JSON.stringify(quantities));

                // Update DB
                const { error } = await supabase.from('food_items').update({ is_in_pantry: true } as any).eq('id', quickAddItem.id);
                if (error) throw error;

                toast.success(`"${quickAddItem.name}" added to pantry with ${quantityString}`);
            } catch (error) { toast.error("Failed to update pantry"); }
        } else {
            const currentList = JSON.parse(localStorage.getItem('vitala_shopping_manual_items') || '[]');
            const newItem = {
                id: `manual-${Date.now()}`,
                name: quickAddItem.name,
                quantity: quantityString,
                unit: '',
                checked: false,
                source: 'manual'
            };
            localStorage.setItem('vitala_shopping_manual_items', JSON.stringify([...currentList, newItem]));
            toast.success(`"${quickAddItem.name}" added to groceries`);
        }
        setQuickAddItem(null);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Food Search Hero Workspace */}
            {showHero && (
                <div className="w-full md:max-w-[900px] mx-auto bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all duration-500 flex flex-col mb-10">
                    <div className="h-[180px] overflow-y-auto p-4 md:p-8 no-scrollbar bg-slate-50/50 dark:bg-slate-800/10 order-1">
                        {isHeroActive ? (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                {isHeroSearching ? (
                                    <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-4">
                                        <div className="relative">
                                            <Activity className="animate-spin text-emerald-500" size={32} />
                                            <div className="absolute inset-0 animate-ping bg-emerald-500/20 rounded-full" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-widest">Searching Foods...</p>
                                    </div>
                                ) : heroResults.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {heroResults.map(food => (
                                            <button
                                                key={food.id}
                                                onClick={() => router.push(`/dashboard/library/foods/${food.id}`)}
                                                className="w-full p-4 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-900/10 flex items-center justify-between group transition-all border border-slate-100 dark:border-slate-800 hover:border-emerald-500/30 text-left"
                                            >
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-100 dark:border-slate-800">
                                                        {food.image ? <img src={food.image} className="w-full h-full object-cover" /> : <Leaf className="m-auto opacity-10 h-full w-5" />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-black text-sm uppercase text-slate-900 dark:text-white truncate">{food.common_name || food.name}</h4>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                                            {formatEnergy(food.energy_kcal, energyUnit)} <span className="text-slate-200 dark:text-slate-700">|</span> {food.category || 'General'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <ChevronRight className="text-slate-200 group-hover:text-emerald-500 transition-colors shrink-0" size={20} />
                                            </button>
                                        ))}
                                    </div>
                                ) : heroSearchQuery.length > 1 ? (
                                    <div className="py-12 text-center text-slate-400">
                                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200 dark:border-slate-700">
                                            <Search size={24} className="opacity-20" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">No matching foods found</p>
                                    </div>
                                ) : (
                                    <div className="py-12 text-center text-slate-400">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Enter food name to explore</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-start pt-8 md:pt-10 text-center h-full animate-in fade-in duration-700">
                                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 relative">
                                    <Library size={24} className="text-emerald-500" />
                                    <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-1">Ready to Explore?</h3>
                                <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest max-w-xs">
                                    Search below to find your next ingredient
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="p-4 md:p-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-white dark:bg-slate-900 order-2 rounded-b-[2.5rem]">
                        <div className="flex-1 relative flex items-center">
                            <div className={cn("absolute left-5 transition-colors", isHeroActive ? "text-emerald-500/50" : "text-slate-300")}>
                                <Search size={16} className="md:w-5 md:h-5" />
                            </div>
                            <input
                                placeholder={isHeroActive ? "SEARCH FOOD LIBRARY..." : "CLICK TO SEARCH..."}
                                className={cn(
                                    "w-full bg-slate-50 dark:bg-slate-800/50 border-2 transition-all shadow-sm text-[10px] md:text-sm font-black uppercase tracking-widest h-12 md:h-14 rounded-[1.5rem] md:rounded-[2rem] pl-12 pr-6 text-slate-900 dark:text-white placeholder:text-slate-300",
                                    isHeroActive
                                        ? "border-emerald-500/30 focus:border-emerald-500/80 focus:ring-4 focus:ring-emerald-500/10 focus:bg-white dark:focus:bg-slate-800/80"
                                        : "border-slate-100 dark:border-slate-800 cursor-pointer hover:border-emerald-500/20"
                                )}
                                value={heroSearchQuery}
                                onFocus={() => setIsHeroActive(true)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                        setIsHeroActive(false);
                                        setHeroSearchQuery('');
                                        setHeroResults([]);
                                    }
                                }}
                                onChange={(e) => {
                                    if (!isHeroActive) setIsHeroActive(true);
                                    handleHeroSearchInput(e.target.value);
                                }}
                            />
                        </div>
                        {isHeroActive ? (
                            <button
                                onClick={() => {
                                    setIsHeroActive(false);
                                    setHeroSearchQuery("");
                                    setHeroResults([]);
                                }}
                                className="w-12 h-12 md:w-14 md:h-14 flex-shrink-0 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 flex items-center justify-center transition-all active:scale-95 group/cancel shadow-sm"
                                title="Close Search"
                            >
                                <X size={18} className="md:w-6 md:h-6 group-hover/cancel:rotate-90 transition-transform duration-300" />
                            </button>
                        ) : (
                            <div className="w-12 h-12 md:w-14 md:h-14 flex-shrink-0 rounded-full bg-slate-50 dark:bg-slate-800/50 text-slate-300 flex items-center justify-center">
                                <Search size={18} className="md:w-6 md:h-6" />
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* Filter Section Below Header */}
            {!hideControls && (
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 justify-between items-center px-4 md:px-0">
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className={cn(
                                    "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 shrink-0 border shadow-sm outline-none",
                                    (showFavoritesOnly || (selectedCategories.length > 0 && selectedCategories.length < CATEGORIES.length))
                                        ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/20"
                                        : "bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-emerald-200 hover:text-emerald-600"
                                )}>
                                    <Filter size={12} />
                                    <span className="hidden sm:inline">
                                        {showFavoritesOnly ? "Favorites" :
                                            (selectedCategories.length === 0 || selectedCategories.length === CATEGORIES.length ? "FILTER" :
                                                `${selectedCategories.length} Groups`)}
                                    </span>
                                    <ChevronDown size={10} className="opacity-50" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                side="bottom"
                                align="start"
                                sideOffset={8}
                                collisionPadding={20}
                                className="w-56 rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-950 z-[100] flex flex-col max-h-[var(--radix-dropdown-menu-content-available-height)]"
                            >
                                <div className="p-2 overflow-y-auto no-scrollbar">
                                    {/* Scope Section */}
                                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-2">Scope</DropdownMenuLabel>
                                    <DropdownMenuCheckboxItem
                                        checked={showFavoritesOnly}
                                        onCheckedChange={setShowFavoritesOnly}
                                        className="rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 focus:bg-rose-50 dark:focus:bg-rose-900/10 focus:text-rose-600 py-2.5 cursor-pointer"
                                    >
                                        <Heart size={12} className={cn("mr-2 transition-transform", showFavoritesOnly && "fill-current scale-110")} />
                                        Favorites Only
                                    </DropdownMenuCheckboxItem>

                                    <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 mx-2" />

                                    {/* Category Section */}
                                    <div className="flex items-center justify-between pr-2">
                                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-2">Groups</DropdownMenuLabel>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault(); e.stopPropagation();
                                                    setSelectedCategories(CATEGORIES);
                                                }}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-500 transition-colors"
                                                title="Select All"
                                            >
                                                <CheckSquare size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault(); e.stopPropagation();
                                                    setSelectedCategories([]);
                                                }}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                                                title="Select None"
                                            >
                                                <Square size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="py-1">
                                        {CATEGORIES.map(category => {
                                            const isActive = selectedCategories.includes(category);
                                            return (
                                                <DropdownMenuCheckboxItem
                                                    key={category}
                                                    checked={isActive}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setSelectedCategories(prev => [...prev, category]);
                                                        } else {
                                                            setSelectedCategories(prev => prev.filter(c => c !== category));
                                                        }
                                                    }}
                                                    className="rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 focus:bg-emerald-50 dark:focus:bg-emerald-900/10 focus:text-emerald-600 py-2.5 cursor-pointer"
                                                >
                                                    {category}
                                                </DropdownMenuCheckboxItem>
                                            );
                                        })}
                                    </div>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <Button
                        onClick={() => router.push('/dashboard/library/foods/new')}
                        className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 shrink-0 bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 h-auto"
                    >
                        <Plus size={12} />
                        Add Food
                    </Button>
                </div>
            )}

            {/* List Area */}
            <div className="space-y-0 mx-auto max-w-6xl">
                {groupNames.map((groupName) => {
                    const items = groupedFoods[groupName];
                    const isExpanded = expandedGroups[groupName] || (searchQuery.length > 0 && items.length > 0);
                    const hasMultiple = items.length > 1;

                    return (
                        <div key={groupName} className="">
                            {/* Items in Group */}
                            <div className="space-y-2">
                                {items.map((food) => (
                                    <div
                                        key={food.id}
                                        onClick={() => router.push(`/dashboard/library/foods/${food.id}`)}
                                        className="group relative bg-transparent rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:border-emerald-500/30 hover:shadow-lg transition-all duration-500 overflow-hidden cursor-pointer"
                                    >
                                        <div className="flex flex-row lg:grid lg:grid-cols-[60px_1fr_100px_80px_80px_80px_150px] gap-3 lg:gap-4 lg:items-center lg:px-6 py-1 w-full">
                                            {/* Thumbnail */}
                                            <div className="aspect-square w-16 lg:w-12 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-950/50 overflow-hidden relative group-hover:scale-105 transition-transform duration-500">
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
                                            <div className="flex-1 min-w-0 lg:p-0">
                                                <h3 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white leading-tight capitalize truncate">
                                                    {hasMultiple ? food.name : (food.common_name || food.name)}
                                                </h3>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {/* Quantity badge - always visible if present */}
                                                    {food.quantity && (
                                                        <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[9px] border-none uppercase font-black tracking-tight">
                                                            {food.quantity}
                                                        </Badge>
                                                    )}
                                                </div>

                                                {/* Mobile-only stats row */}
                                                <div className="flex lg:hidden items-center gap-2 mt-1.5 text-[9px] font-black">
                                                    <span className="text-blue-500">{formatEnergy(food.energy_kcal, energyUnit)}</span>
                                                    <span className="text-slate-300 text-[8px]">•</span>
                                                    <span className="text-emerald-500">{food.protein_g.toFixed(0)}g P</span>
                                                    <span className="text-slate-300 text-[8px]">•</span>
                                                    <span className="text-amber-500">{food.carbs_g.toFixed(0)}g C</span>
                                                    <span className="text-slate-300 text-[8px]">•</span>
                                                    <span className="text-rose-500">{food.fat_g.toFixed(0)}g F</span>
                                                </div>
                                            </div>

                                            {/* Stats (Desktop View) */}
                                            <div className="hidden lg:flex flex-col items-end">
                                                <span className="font-black text-[11px] text-slate-900 dark:text-white">{formatEnergy(food.energy_kcal, energyUnit)}</span>
                                                <span className="text-[8px] uppercase font-black text-slate-400">E</span>
                                            </div>
                                            <div className="hidden lg:flex flex-col items-end">
                                                <span className="text-[8px] uppercase font-black text-slate-400">Carbs</span>
                                                <span className="font-black text-[11px] text-slate-900 dark:text-white">{food.carbs_g.toFixed(1)}g</span>
                                            </div>
                                            <div className="hidden lg:flex flex-col items-end">
                                                <span className="text-[8px] uppercase font-black text-slate-400">Fat</span>
                                                <span className="font-black text-[11px] text-slate-900 dark:text-white">{food.fat_g.toFixed(1)}g</span>
                                            </div>
                                            <div className="hidden lg:flex flex-col items-end">
                                                <span className="text-[8px] uppercase font-black text-slate-400">Protein</span>
                                                <span className="font-black text-[11px] text-slate-900 dark:text-white">{food.protein_g.toFixed(1)}g</span>
                                            </div>
                                        </div>



                                        {/* Quick Add Advanced Slide-out */}
                                        {quickAddItem?.id === food.id && (
                                            <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-6 animate-in slide-in-from-top duration-300">
                                                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                                                            <ShoppingBasket size={24} className="text-emerald-500" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Quick Action</p>
                                                            <h4 className="font-black text-sm uppercase italic">Add to {quickAddMode === 'pantry' ? 'Inventory' : 'Shopping List'}</h4>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <div className="flex bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-1">
                                                            <button
                                                                onClick={() => setQuickAddMode('pantry')}
                                                                className={cn("px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all", quickAddMode === 'pantry' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-slate-400")}
                                                            >
                                                                Pantry
                                                            </button>
                                                            <button
                                                                onClick={() => setQuickAddMode('shopping')}
                                                                className={cn("px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all", quickAddMode === 'shopping' ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "text-slate-400")}
                                                            >
                                                                Groceries
                                                            </button>
                                                        </div>

                                                        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-3 h-11">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase">Qty</span>
                                                            <input
                                                                type="text"
                                                                value={quickAddQty}
                                                                onChange={(e) => setQuickAddQty(e.target.value)}
                                                                className="w-10 bg-transparent border-none text-center font-black text-sm focus:ring-0"
                                                            />
                                                        </div>

                                                        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-3 h-11">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Weight/Vol</span>
                                                            <input
                                                                type="text"
                                                                value={quickAddWeight}
                                                                onChange={(e) => setQuickAddWeight(e.target.value)}
                                                                placeholder="500"
                                                                className="w-14 bg-transparent border-none text-center font-black text-sm focus:ring-0 placeholder:text-slate-300"
                                                            />
                                                            <select
                                                                value={quickAddUnit}
                                                                onChange={(e) => setQuickAddUnit(e.target.value)}
                                                                className="bg-transparent border-none text-[10px] font-black uppercase text-slate-500 focus:ring-0 p-0 h-full cursor-pointer w-12"
                                                            >
                                                                {measurementUnit === 'imperial' ? (
                                                                    <>
                                                                        <option value="oz">oz</option>
                                                                        <option value="lb">lb</option>
                                                                        <option value="fl oz">fl oz</option>
                                                                        <option value="pt">pt</option>
                                                                        <option value="qt">qt</option>
                                                                        <option value="gal">gal</option>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <option value="g">g</option>
                                                                        <option value="kg">kg</option>
                                                                        <option value="ml">ml</option>
                                                                        <option value="L">L</option>
                                                                    </>
                                                                )}
                                                            </select>
                                                        </div>

                                                        <Button
                                                            onClick={handleQuickAdd}
                                                            className={cn("h-11 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl", quickAddMode === 'pantry' ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-rose-600 hover:bg-rose-700 text-white")}
                                                        >
                                                            Confirm
                                                        </Button>

                                                        <Button variant="ghost" size="icon" onClick={() => setQuickAddItem(null)} className="h-11 w-11 rounded-xl text-slate-400">
                                                            <X size={18} />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {
                hasMore && (
                    <div className="flex justify-center pt-8">
                        <Button
                            variant="outline"
                            onClick={() => fetchFoods(page + 1)}
                            className="h-16 w-16 p-0 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center hover:bg-transparent bg-transparent"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin text-slate-300 dark:text-slate-700" />
                            ) : (
                                <ChevronDown size={36} className="text-slate-100 dark:text-slate-100" />
                            )}
                        </Button>
                    </div>
                )
            }
        </div >
    );
}

