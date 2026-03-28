'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    Zap,
    Activity,
    Gem,
    Droplet,
    Battery,
    ArrowLeft,
    ChevronLeft,
    Sparkles,
    Scale,
    Beef,
    Search,
    ChevronRight,
    Star,
    Info,
    Calendar,
    ArrowRight,
    Heart,
    UtensilsCrossed,
    ShoppingCart,
    ShoppingBasket,
    LayoutGrid,
    Trophy,
    X,
    Filter,
    ChevronDown,
    Lightbulb
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSearch } from '@/lib/context/search-context';
import { useHeaderActions } from '@/lib/context/header-actions-context';
import { nutrientInfo, NutrientInfo } from '@/lib/data/nutrient-info';
import { supabase } from '@/lib/supabase';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { useRDA } from '@/hooks/use-rda';

// Category Groups for Navigation
const MACROS_LIST = ['Energy', 'Protein', 'Carbs', 'Fat', 'Fiber'];
const MINERALS_LIST = ['Sodium', 'Potassium', 'Magnesium', 'Calcium', 'Phosphorus', 'Iron', 'Zinc', 'Copper', 'Manganese', 'Selenium', 'Oxalate'];
const VITAMINS_LIST = ['Vitamin A', 'Vitamin C', 'Vitamin D', 'Vitamin E', 'Vitamin K', 'B1 (Thiamine)', 'B2 (Riboflavin)', 'B3 (Niacin)', 'B5 (Pantothenic Acid)', 'B6 (Pyridoxine)', 'B9 (Folate)', 'B12 (Cobalamin)', 'Choline'];

// Mapping from URL IDs (database column names) to nutrient info keys
const URL_ID_TO_NUTRIENT_INFO: Record<string, string> = {
    'energy_kcal': 'Energy',
    'protein_g': 'Protein',
    'carbs_g': 'Carbs',
    'fat_g': 'Fat',
};

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm", className)}>
        {children}
    </div>
);

export default function NutrientDetailsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { id } = useParams();
    const nutrientId = decodeURIComponent(id as string);

    // Filter expansion state from URL
    // Filter expansion state from URL
    const isFilterExpandedParam = searchParams.get('filter') === 'open';

    const {
        setCustomSegmentLabel,
        setFilterContent,
        setIsFilterExpanded,
        isFilterExpanded: contextIsFilterExpanded
    } = useHeaderActions();

    // Map URL ID to nutrient info key
    const nutrientInfoKey = URL_ID_TO_NUTRIENT_INFO[nutrientId] || nutrientId;
    const info = nutrientInfo[nutrientInfoKey];
    const { profile, dailyTargets, energyUnit } = useUserPreferences();

    // Context-aware RDAs
    const userRDAs = useRDA(
        typeof profile.age === 'number' ? profile.age : 30,
        profile.gender || 'female',
        dailyTargets.energy || 2000
    );

    // Hub Navigation State
    const { searchQuery, setSearchQuery, setIsFocused, activeSearchId, setActiveSearchId } = useSearch();
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [topFoods, setTopFoods] = useState<any[]>([]);
    const [loadingFoods, setLoadingFoods] = useState(true);
    const [measureGrams, setMeasureGrams] = useState(100);
    const [activeContentTab, setActiveContentTab] = useState('foods');
    const [visibleFoodsCount, setVisibleFoodsCount] = useState(5);
    const [isAdmin, setIsAdmin] = useState(false);

    // --- Simulation Logic ---
    let targetVal = 0;
    let unit = 'mg';

    if (info) {
        if (nutrientInfoKey === 'Energy') {
            targetVal = energyUnit === 'kJ' ? dailyTargets.energy * 4.184 : dailyTargets.energy;
            unit = energyUnit;
        } else if (nutrientInfoKey === 'Protein') {
            targetVal = dailyTargets.protein;
            unit = 'g';
        } else if (nutrientInfoKey === 'Carbs') {
            targetVal = dailyTargets.carbs;
            unit = 'g';
        } else if (nutrientInfoKey === 'Fat') {
            targetVal = dailyTargets.fat;
            unit = 'g';
        } else if (userRDAs?.[nutrientInfoKey]) {
            targetVal = userRDAs[nutrientInfoKey];
            if (nutrientInfoKey === 'Vitamin D') unit = 'IU';
            else if (nutrientInfoKey.includes('Folate') || nutrientInfoKey.includes('B12') || nutrientInfoKey.includes('Biotin') || nutrientInfoKey.includes('Selenium') || nutrientInfoKey === 'Vitamin A' || nutrientInfoKey === 'Vitamin K' || nutrientInfoKey.includes('µg')) unit = 'µg';
        }
    }

    const ulMatch = info?.upperLimit?.match(/(\d+)/);
    const hasNoUL = info?.upperLimit?.includes("None") || !info?.upperLimit;
    const isPercentUL = info?.upperLimit?.includes("%");
    const isSupplementalUL = info?.upperLimit?.toLowerCase().includes("supplemental");

    let rawUL = ulMatch ? parseInt(ulMatch[0]) : (targetVal > 0 ? targetVal * 4 : 100);

    // Handle Percentage-based ULs (Protein, Carbs, Fat)
    if (isPercentUL && dailyTargets.energy) {
        const percent = rawUL / 100;
        if (nutrientInfoKey === 'Protein') rawUL = (dailyTargets.energy * percent) / 4;
        else if (nutrientInfoKey === 'Carbs') rawUL = (dailyTargets.energy * percent) / 4;
        else if (nutrientInfoKey === 'Fat') rawUL = (dailyTargets.energy * percent) / 9;
    }

    const parsedUL = rawUL;

    // For nutrients like Magnesium, the Supplemental UL (350mg) is lower than the RDA (400mg+).
    // In these cases, we shouldn't show 'Toxicity' for total intake at the Target level.
    const effectiveUL = (isSupplementalUL && parsedUL <= targetVal) ? targetVal * 1.5 : parsedUL;
    const ulVal = parsedUL; // Use for the marker label

    const [simValue, setSimValue] = useState(targetVal || 0);

    useEffect(() => {
        if (targetVal > 0 && simValue === 0) setSimValue(targetVal);
    }, [targetVal]);

    const isDeficient = simValue < (targetVal * 0.8) && targetVal > 0;
    const isToxic = !hasNoUL && simValue >= effectiveUL;
    const isOptimal = !isDeficient && !isToxic;
    // --- End Simulation Logic ---

    useEffect(() => {
        const stored = localStorage.getItem('nutrient-favorites');
        if (stored) {
            try {
                setFavorites(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse favorites", e);
            }
        }
    }, []);

    const toggleFavorite = () => {
        const newFavorites = favorites.includes(nutrientId)
            ? favorites.filter(n => n !== nutrientId)
            : [...favorites, nutrientId];
        setFavorites(newFavorites);
        localStorage.setItem('nutrient-favorites', JSON.stringify(newFavorites));
    };

    const isFav = favorites.includes(nutrientId);

    const libraryTabs = [
        { id: 'nutrients', label: 'All Nutrients', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { id: 'top10', label: 'Top 10', icon: Trophy, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { id: 'compare', label: 'Compare', icon: Scale, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    ];

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';
                const userEmail = (user.email || user.user_metadata?.email || '').toLowerCase();
                setIsAdmin(userEmail === adminEmail.toLowerCase() && adminEmail !== '');
            }
        };
        checkAdmin();
    }, []);

    // Inject Header Content
    useEffect(() => {
        setCustomSegmentLabel(nutrientInfoKey);

        // Sync URL param to context state initially
        if (isFilterExpandedParam) {
            setIsFilterExpanded(true);
        }

        setFilterContent(
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {/* Macro Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className={cn(
                            "px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 shrink-0 border shadow-sm outline-none",
                            MACROS_LIST.includes(nutrientInfoKey)
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-500"
                        )}>
                            <Scale size={12} />
                            <span>{MACROS_LIST.includes(nutrientInfoKey) ? nutrientInfoKey : "Macros"}</span>
                            <ChevronDown size={10} className="opacity-50" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 p-2 rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-950">
                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-2">Select Macro</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 mx-2" />
                        {MACROS_LIST.map(id => (
                            <DropdownMenuCheckboxItem
                                key={id}
                                checked={nutrientInfoKey === id}
                                onCheckedChange={() => {
                                    const params = new URLSearchParams(searchParams.toString());
                                    router.push(`/nutrients/${encodeURIComponent(id)}?${params.toString()}`);
                                }}
                                className="rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 focus:bg-blue-50 dark:focus:bg-blue-900/10 focus:text-blue-600 py-2.5 cursor-pointer"
                            >
                                {id}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Mineral Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className={cn(
                            "px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 shrink-0 border shadow-sm outline-none",
                            MINERALS_LIST.includes(nutrientInfoKey)
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-500"
                        )}>
                            <Gem size={12} />
                            <span>{MINERALS_LIST.includes(nutrientInfoKey) ? nutrientInfoKey : "Minerals"}</span>
                            <ChevronDown size={10} className="opacity-50" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 p-2 rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-950 max-h-[400px] overflow-y-auto no-scrollbar">
                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-2">Select Mineral</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 mx-2" />
                        {MINERALS_LIST.map(id => (
                            <DropdownMenuCheckboxItem
                                key={id}
                                checked={nutrientInfoKey === id}
                                onCheckedChange={() => {
                                    const params = new URLSearchParams(searchParams.toString());
                                    router.push(`/nutrients/${encodeURIComponent(id)}?${params.toString()}`);
                                }}
                                className="rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 focus:bg-blue-50 dark:focus:bg-blue-900/10 focus:text-blue-600 py-2.5 cursor-pointer"
                            >
                                {id}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Vitamin Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className={cn(
                            "px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 shrink-0 border shadow-sm outline-none",
                            VITAMINS_LIST.includes(nutrientInfoKey)
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-500"
                        )}>
                            <Battery size={12} />
                            <span>{VITAMINS_LIST.includes(nutrientInfoKey) ? nutrientInfoKey : "Vitamins"}</span>
                            <ChevronDown size={10} className="opacity-50" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 p-2 rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-950 max-h-[400px] overflow-y-auto no-scrollbar">
                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-2">Select Vitamin</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 mx-2" />
                        {VITAMINS_LIST.map(id => (
                            <DropdownMenuCheckboxItem
                                key={id}
                                checked={nutrientInfoKey === id}
                                onCheckedChange={() => {
                                    const params = new URLSearchParams(searchParams.toString());
                                    router.push(`/nutrients/${encodeURIComponent(id)}?${params.toString()}`);
                                }}
                                className="rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 focus:bg-blue-50 dark:focus:bg-blue-900/10 focus:text-blue-600 py-2.5 cursor-pointer"
                            >
                                {id}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        );

        return () => {
            setCustomSegmentLabel(null);
            setFilterContent(null);
        };
    }, [nutrientInfoKey, isFilterExpandedParam, searchParams, router]);

    useEffect(() => {
        if (info) {
            fetchTopFoods();
            setVisibleFoodsCount(5);
        }
    }, [nutrientId]);

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';
                const userEmail = (user.email || user.user_metadata?.email || '').toLowerCase();
                setIsAdmin(userEmail === adminEmail.toLowerCase() && adminEmail !== '');
            }
        };
        checkAdmin();
    }, []);

    const tabs = [
        { id: 'foods', label: `${nutrientInfoKey} Rich Foods`, icon: UtensilsCrossed },
        { id: 'learn', label: 'Learn', icon: Lightbulb },
        ...(isAdmin ? [{ id: 'dosage', label: 'Dosage Simulator', icon: Activity }] : []),
    ];

    const fetchTopFoods = async () => {
        setLoadingFoods(true);
        try {
            // Map common display names to database columns
            const columnMap: Record<string, string> = {
                'Potassium': 'potassium_mg',
                'Magnesium': 'magnesium_mg',
                'Calcium': 'calcium_mg',
                'Sodium': 'sodium_mg',
                'Iron': 'iron_mg',
                'Zinc': 'zinc_mg',
                'Vitamin A': 'vitamin_a_ug',
                'Vitamin C': 'vitamin_c_mg',
                'Vitamin D': 'vitamin_d_ug',
                'Vitamin E': 'vitamin_e_mg',
                'Vitamin K': 'vitamin_k_ug',
                'Protein': 'protein_g',
                'Fiber': 'fiber_g',
                'Carbs': 'carbs_g',
                'Fat': 'fat_g'
            };

            const col = columnMap[nutrientInfoKey] || nutrientInfoKey.toLowerCase().replace(/ /g, '_').replace(/[()]/g, '');

            // Try to find foods high in this nutrient, but exclude herbs/spices/supplements for "practical" diet additions
            const { data, error } = await supabase
                .from('food_items')
                .select('id, name, common_name, image, ' + col + ', category')
                .not(col, 'is', null)
                .not('category', 'in', '(Flavour,Supplements)')
                .order(col, { ascending: false })
                .limit(20);

            if (error) {
                // FALLBACK: If column doesn't exist, search the micronutrients JSONB column
                const { data: jsonMatch, error: jsonError } = await supabase
                    .from('food_items')
                    .select('id, name, common_name, image, micronutrients, category')
                    .not('category', 'in', '(Flavour,Supplements)')
                    .not(`micronutrients`, 'is', null)
                    .limit(200); // Fetch a larger sample for better JS-side sorting

                if (!jsonError && jsonMatch) {
                    const sorted = jsonMatch
                        .filter(f => f.micronutrients && f.micronutrients[nutrientInfoKey] !== undefined)
                        .sort((a, b) => (b.micronutrients[nutrientInfoKey] || 0) - (a.micronutrients[nutrientInfoKey] || 0))
                        .slice(0, 20);
                    setTopFoods(sorted);
                }
            } else {
                setTopFoods(data || []);
            }
        } catch (err) {
            console.error('Error fetching typical sources:', err);
        } finally {
            setLoadingFoods(false);
        }
    };

    if (!info) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center gap-6">
                <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300">
                    <Info size={40} />
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Nutrient Not Found</h2>
                    <p className="text-slate-500 max-w-xs mx-auto text-sm">The requested nutrient does not exist in our health guide.</p>
                </div>
                <Button onClick={() => router.push('/nutrients')} className="rounded-full px-8 bg-emerald-600">
                    Back to Nutridex
                </Button>
            </div>
        );
    }

    const dynamicMax = Math.max(targetVal, effectiveUL) * 1.5;

    // Helper function to get nutrient value from food
    const columnMap: Record<string, string> = {
        'Potassium': 'potassium_mg',
        'Magnesium': 'magnesium_mg',
        'Calcium': 'calcium_mg',
        'Sodium': 'sodium_mg',
        'Iron': 'iron_mg',
        'Zinc': 'zinc_mg',
        'Vitamin A': 'vitamin_a_ug',
        'Vitamin C': 'vitamin_c_mg',
        'Vitamin D': 'vitamin_d_ug',
        'Vitamin E': 'vitamin_e_mg',
        'Vitamin K': 'vitamin_k_ug',
        'Protein': 'protein_g',
        'Fiber': 'fiber_g',
        'Carbs': 'carbs_g',
        'Fat': 'fat_g'
    };

    const col = columnMap[nutrientInfoKey] || nutrientInfoKey.toLowerCase().replace(/ /g, '_').replace(/[()]/g, '');

    const getNutrientValue = (food: any): number => {
        const value = food[col] || (food.micronutrients ? food.micronutrients[nutrientInfoKey] : 0);
        return parseFloat(value) || 0;
    };

    const maxNutrientValue = topFoods.length > 0 ? Math.max(...topFoods.map(getNutrientValue)) : 1;

    return (
        <div className="flex flex-col w-full min-h-screen">

            <div className="max-w-7xl mx-auto space-y-8 pb-32 animate-in fade-in duration-700 flex-1 w-full px-4 pt-8">
                {/* Tabbed Content Section */}
                <div className="pt-4 space-y-6">
                    {/* Tab Bar */}
                    <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-fit">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeContentTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveContentTab(tab.id)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 md:px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.12em] transition-all duration-300 whitespace-nowrap",
                                        isActive
                                            ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-lg"
                                            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                    )}
                                >
                                    <Icon size={14} className={cn(isActive ? "text-emerald-500" : "text-slate-400")} />
                                    <span className="hidden md:inline">{tab.label}</span>
                                    <span className="md:hidden">
                                        {tab.id === 'foods' ? 'Foods' : tab.id === 'learn' ? 'Learn' : tab.id === 'dosage' ? 'Dosage' : ''}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* ===== TAB 1: Rich Foods ===== */}
                    {activeContentTab === 'foods' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="bg-slate-50 dark:bg-slate-900/40 rounded-[3rem] p-8 border border-slate-100 dark:border-slate-800/50 flex flex-col gap-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                                            <UtensilsCrossed size={32} />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <h4 className="font-black text-sm uppercase tracking-[0.3em] text-emerald-500">{nutrientInfoKey} Rich Foods</h4>
                                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Top bioavailable sources per {measureGrams}g clinical sample</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 bg-emerald-50/50 dark:bg-emerald-900/5 px-4 py-2 rounded-2xl border border-emerald-200/50 dark:border-emerald-800/20">
                                        <button
                                            onClick={() => setMeasureGrams(Math.max(10, measureGrams - 10))}
                                            className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                            title="Decrease grams"
                                        >
                                            <ChevronDown size={14} />
                                        </button>
                                        <div className="flex flex-col items-center min-w-[50px] text-center">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter leading-none">Measure</span>
                                            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 leading-none">{measureGrams}g</span>
                                        </div>
                                        <button
                                            onClick={() => setMeasureGrams(measureGrams + 10)}
                                            className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                            title="Increase grams"
                                        >
                                            <ChevronDown size={14} className="rotate-180" />
                                        </button>
                                    </div>
                                </div>

                                <div className="w-full">
                                    <div className="mt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                                        {loadingFoods ? (
                                            [1, 2, 3, 4, 5].map(i => <div key={i} className="h-32 w-full animate-pulse bg-slate-50 dark:bg-slate-900/50 rounded-[2rem]" />)
                                        ) : topFoods.length > 0 ? (
                                            topFoods.slice(0, visibleFoodsCount).map((food: any) => {
                                                const nutrientValue = getNutrientValue(food);
                                                const rdaPercent = targetVal > 0 ? (nutrientValue * (measureGrams / 100) / targetVal) * 100 : 0;
                                                const rdaPercentage = Math.round(rdaPercent);
                                                return (
                                                    <button
                                                        key={food.id}
                                                        onClick={() => router.push(`/foods/${food.id}`)}
                                                        className="relative flex flex-col gap-3 p-4 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/5 transition-all group text-left"
                                                    >
                                                        <div className="w-full h-24 rounded-xl bg-slate-50 dark:bg-slate-950 overflow-hidden flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-500">
                                                            {food.image ? (
                                                                <img src={food.image} alt={food.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-slate-200 dark:text-slate-800">
                                                                    <Beef size={28} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="absolute top-3 right-3 bg-emerald-500 text-white px-2 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider shadow-lg z-30">
                                                            {rdaPercentage > 0 ? `${rdaPercentage}%` : '—'}
                                                        </div>

                                                        <div className="space-y-2 z-10 min-w-0">
                                                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                                View Source
                                                            </p>
                                                            <p className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white leading-tight italic line-clamp-2">
                                                                {food.common_name || food.name}
                                                            </p>

                                                            <div className="pt-1">
                                                                <div className="flex items-center justify-between mb-1.5">
                                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                                                                        {(nutrientValue * (measureGrams / 100)).toFixed(1)} {unit}
                                                                    </span>
                                                                </div>
                                                                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-300"
                                                                        style={{ width: `${Math.min(rdaPercent, 100)}%` }}
                                                                    />
                                                                </div>
                                                                <div className="mt-2 flex items-center justify-between">
                                                                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Portion</span>
                                                                    <span className="text-[11px] font-black text-emerald-500 uppercase tracking-wider">{rdaPercentage > 0 ? `${rdaPercentage}% RDA` : '—'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </button>
                                                )
                                            })
                                        ) : (
                                            <div className="col-span-full py-16 text-center bg-slate-50/50 dark:bg-slate-900/30 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic">No whole food scans recorded for this profile.</p>
                                            </div>
                                        )}
                                    </div>
                                    {/* Load More Button */}
                                    {!loadingFoods && topFoods.length > visibleFoodsCount && visibleFoodsCount < 30 && (
                                        <div className="flex justify-center pt-4">
                                            <button
                                                onClick={() => setVisibleFoodsCount(prev => Math.min(prev + 5, 30))}
                                                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all text-[10px] font-black uppercase tracking-widest active:scale-95"
                                            >
                                                <ChevronDown size={14} />
                                                Load More ({Math.min(visibleFoodsCount + 5, 30, topFoods.length)} of {Math.min(topFoods.length, 30)})
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== TAB 2: Learn ===== */}
                    {activeContentTab === 'learn' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            {/* Know Your Nutrients */}
                            <div className="bg-slate-50 dark:bg-slate-900/40 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800/50 flex flex-col md:flex-row gap-10 items-start">
                                <div className="w-16 h-16 rounded-[2rem] bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                                    <Lightbulb size={32} />
                                </div>
                                <div className="space-y-6 flex-1">
                                    <div className="space-y-1">
                                        <h4 className="font-black text-xs uppercase tracking-[0.3em] text-amber-500">Know Your Nutrients</h4>
                                        <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">Biological Heritage & Significance</h3>
                                    </div>
                                    <p className="text-xl font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic border-l-4 border-amber-500/20 pl-6 py-1">
                                        "{info.history} {info.importance}"
                                    </p>

                                    {info.relatedFacts && info.relatedFacts.length > 0 && (
                                        <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800/50">
                                            <h5 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-4">5 Fast Facts</h5>
                                            <div className="grid grid-cols-1 gap-4">
                                                {info.relatedFacts.map((fact, i) => (
                                                    <div key={i} className="flex gap-4 items-start group">
                                                        <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                                                            <span className="text-xs font-black">{i + 1}</span>
                                                        </div>
                                                        <p className="text-sm font-bold text-slate-600 dark:text-slate-400 leading-relaxed group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                                                            {fact}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Whole Food Safety Advisory */}
                            <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center gap-6 shadow-sm">
                                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 flex-shrink-0">
                                    <Sparkles size={32} />
                                </div>
                                <div className="space-y-1 text-center md:text-left">
                                    <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-emerald-600">Whole Food Safety Advisory</h4>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
                                        {(() => {
                                            if (nutrientId === 'Protein') return "Real protein for real people. Your body is incredibly good at handling high protein from steak, eggs, or beans. The official 'limits' are just guidelines for extreme diets, not real-world safety risks.";
                                            if (nutrientId === 'Magnesium') return "Nature's Magnesium is 100% safe. You can't consume too many seeds or greens—your body handles them perfectly. Only concentrated pills carry a risk of over-doing it.";
                                            if (nutrientId === 'Sodium') return "The salt naturally found inside foods like celery or meat is totally safe. The real danger is almost always from added table salt and factory-made snacks, not the food itself.";
                                            if (nutrientId === 'Vitamin A') return "Carrots and leafy greens are always safe. Your body only has trouble with 'pre-made' Vitamin A from things like animal liver or high-dose supplements.";
                                            if (nutrientId === 'Vitamin K') return "Eat as much as you like! There is no known way to eat too much Vitamin K from natural foods like kale or spinach. Your body handles it all beautifully.";
                                            if (nutrientId === 'Potassium') return "Healthy bodies are experts at balancing potassium. Unless you have specific kidney issues, your body safely flushes out what it doesn't need from your diet.";
                                            if (nutrientId === 'Vitamin D') return "Sunlight and real food are safe. It's almost impossible to get too much Vitamin D naturally. Hazards only happen with extremely high doses of synthetic pills.";
                                            if (hasNoUL) return "This nutrient is naturally safe. When you eat whole foods, your body knows exactly how to absorb what it needs and simply ignores the rest.";
                                            return `Whole foods are naturally balanced. Your body handles real food much better than it handles concentrated chemical supplements.`;
                                        })()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== TAB 3: Dosage Simulator ===== */}
                    {activeContentTab === 'dosage' && isAdmin && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            {/* Intake Box and Title */}
                            <div className="flex flex-col md:flex-row items-center gap-6 px-2">
                                <div className={cn(
                                    "w-24 h-24 rounded-[1.5rem] border-2 transition-all duration-700 flex flex-col items-center justify-center shadow-lg flex-shrink-0",
                                    isDeficient ? "bg-amber-50 border-amber-300 text-amber-800 shadow-amber-200/50" :
                                        isToxic ? "bg-rose-50 border-rose-300 text-rose-800 shadow-rose-200/50" :
                                            "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-emerald-500/10"
                                )}>
                                    <p className="text-[7px] font-black uppercase tracking-widest opacity-60">Intake</p>
                                    <div className="flex items-baseline gap-0.5">
                                        <span className="text-2xl font-black italic tracking-tighter leading-none">
                                            {simValue >= 100 ? Math.round(simValue) : simValue.toFixed(1)}
                                        </span>
                                        <span className="text-[8px] font-black uppercase">{unit}</span>
                                    </div>
                                    <div className={cn(
                                        "mt-1 px-2.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest flex items-center gap-1",
                                        isDeficient ? "bg-amber-500 text-white" :
                                            isToxic ? "bg-rose-600 text-white" :
                                                "bg-emerald-600 text-white"
                                    )}>
                                        {isDeficient ? "Deficit" : isToxic ? "Toxicity" : "Optimal"}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <h4 className="font-black text-xs uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">Intake Box</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Slide to simulate intake levels and see biological thresholds</p>
                                </div>
                            </div>

                            {/* Simulator Slider */}
                            <div className="space-y-12">
                                <div className="relative pt-6 pb-2">
                                    <input
                                        type="range"
                                        min="0"
                                        max={dynamicMax}
                                        step={dynamicMax / 100}
                                        value={simValue}
                                        onChange={(e) => setSimValue(parseFloat(e.target.value))}
                                        className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-600 transition-all [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-emerald-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:appearance-none"
                                    />

                                    <div className="absolute top-0 left-0 w-full flex justify-between px-1 text-[8px] font-black uppercase text-slate-400 tracking-widest pointer-events-none">
                                        <span>Zero</span>
                                        <div
                                            className="absolute h-4 border-l-2 border-dashed border-emerald-500/50 flex flex-col items-center"
                                            style={{ left: `${(targetVal / dynamicMax) * 100}%` }}
                                        >
                                            <span className="mt-4 text-emerald-600 font-black">Target</span>
                                        </div>
                                        {!hasNoUL && (
                                            <div
                                                className="absolute h-4 border-l-2 border-dashed border-rose-500/50 flex flex-col items-center"
                                                style={{ left: `${(ulVal / dynamicMax) * 100}%` }}
                                            >
                                                <span className="mt-4 text-rose-600 font-black">UL</span>
                                            </div>
                                        )}
                                        <span>High Hazard</span>
                                    </div>
                                </div>

                                {/* Status Tags */}
                                <div className="pt-6 pb-2 min-h-[80px]">
                                    <div className="flex flex-wrap gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                        {isDeficient && info.deficiencySigns.map((s, i) => (
                                            <span key={i} className="text-[10px] font-black uppercase tracking-widest px-5 py-3 rounded-2xl bg-amber-50 dark:bg-amber-400/5 border border-amber-200 dark:border-amber-400/20 text-amber-700 dark:text-amber-400 shadow-sm">
                                                {s}
                                            </span>
                                        ))}
                                        {isOptimal && info.benefits.map((b, i) => (
                                            <span key={i} className="text-[10px] font-black uppercase tracking-widest px-5 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-400/5 border border-emerald-200 dark:border-emerald-400/20 text-emerald-700 dark:text-emerald-400 shadow-sm">
                                                {b}
                                            </span>
                                        ))}
                                        {isToxic && (info.toxicitySymptoms || ['No whole-food risks recorded.']).map((s, i) => (
                                            <span key={i} className="text-[10px] font-black uppercase tracking-widest px-5 py-3 rounded-2xl bg-rose-50 dark:bg-rose-400/5 border border-rose-200 dark:border-rose-400/20 text-rose-700 dark:text-rose-400 shadow-sm">
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
