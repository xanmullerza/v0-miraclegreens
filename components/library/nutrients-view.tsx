'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearch } from '@/lib/context/search-context';
import {
    Zap,
    Search,
    ChevronRight,
    Activity,
    Gem,
    Droplet,
    Battery,
    Heart,
    Globe,
    Filter,
    ChevronDown,
    Check,
    Info,
    Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { nutrientInfo } from '@/lib/data/nutrient-info';

const MAIN_CATEGORIES = ["Macros", "Minerals", "Vitamins"];
const CATEGORY_MAP: Record<string, string> = {
    "Macronutrients": "Macros",
    "Electrolytes": "Minerals",
    "Trace Minerals": "Minerals",
    "Vitamins": "Vitamins"
};

const SHORTHAND_MAP: Record<string, string> = {
    // Electrolytes & Minerals
    'Potassium': 'K',
    'Magnesium': 'Mg',
    'Calcium': 'Ca',
    'Sodium': 'Na',
    'Phosphorus': 'P',
    'Iron': 'Fe',
    'Zinc': 'Zn',
    'Selenium': 'Se',
    'Copper': 'Cu',
    'Manganese': 'Mn',
    'Oxalate': 'Ox',

    // Vitamins
    'Vitamin A': 'A',
    'B1 (Thiamine)': 'B1',
    'B2 (Riboflavin)': 'B2',
    'B3 (Niacin)': 'B3',
    'B5 (Pantothenic Acid)': 'B5',
    'B6 (Pyridoxine)': 'B6',
    'B9 (Folate)': 'B9',
    'B12 (Cobalamin)': 'B12',
    'Vitamin C': 'C',
    'Vitamin D': 'D',
    'Vitamin E': 'E',
    'Vitamin K': 'K',
    'Choline': 'Ch',

    // Macros
    'Energy': 'kcal',
    'Protein': 'PR',
    'Carbs': 'CHO',
    'Fat': 'FAT',
    'Fiber': 'FIB',
    'Sugar': 'SUG',
    'Omega-3': 'Ω3',
    'Cholesterol': 'CHL',
    'welcome': 'W'
};

const NUTRIENT_CATEGORIES_DATA = [
    { title: "Macronutrients", icon: Zap, theme: "orange", keys: ['welcome', 'Energy', 'Protein', 'Carbs', 'Fat', 'Fiber', 'Sugar', 'Omega-3', 'Cholesterol'] },
    { title: "Electrolytes", icon: Droplet, theme: "indigo", keys: ['Potassium', 'Magnesium', 'Calcium', 'Sodium', 'Phosphorus'] },
    { title: "Trace Minerals", icon: Gem, theme: "blue", keys: ['Iron', 'Zinc', 'Selenium', 'Copper', 'Manganese', 'Oxalate'] },
    { title: "Vitamins", icon: Battery, theme: "emerald", keys: ['Vitamin A', 'B1 (Thiamine)', 'B2 (Riboflavin)', 'B3 (Niacin)', 'B5 (Pantothenic Acid)', 'B6 (Pyridoxine)', 'B9 (Folate)', 'B12 (Cobalamin)', 'Vitamin C', 'Vitamin D', 'Vitamin E', 'Vitamin K', 'Choline'] }
];

interface NutrientElementProps {
    shorthand: string;
    theme: string;
    subscript?: string;
    category: string;
}

function NutrientElement({ shorthand, theme, subscript, category }: NutrientElementProps) {
    const isMacro = category === 'Macros';

    return (
        <div className={cn(
            "relative w-12 h-12 rounded-xl flex flex-col items-center justify-center border-2 shadow-inner transition-transform group-hover:scale-105 duration-500",
            theme === "orange" ? "bg-orange-500/10 border-orange-500/30 text-orange-600" :
                theme === "indigo" ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-600" :
                    theme === "blue" ? "bg-blue-500/10 border-blue-500/30 text-blue-600" :
                        "bg-emerald-500/10 border-emerald-500/30 text-emerald-600"
        )}>
            <span className={cn(
                "font-black tracking-tighter leading-none",
                shorthand.length > 2 ? "text-[10px]" : "text-base"
            )}>
                {shorthand}
            </span>
            {subscript && (
                <span className="absolute bottom-1 right-1 text-[8px] font-black opacity-50">
                    {subscript}
                </span>
            )}
            <div className={cn(
                "absolute top-0.5 left-1 text-[6px] font-black uppercase tracking-widest opacity-40",
            )}>
                {category.substring(0, 3)}
            </div>
        </div>
    );
}

interface NutrientsViewProps {
    showFavoritesOnly?: boolean;
    setShowFavoritesOnly?: (value: boolean) => void;
    selectedCategories?: string[];
    setSelectedCategories?: (value: string[]) => void;
}

export function NutrientsView(props: NutrientsViewProps = {}) {
    const {
        showFavoritesOnly: externalShowFavorites,
        setShowFavoritesOnly: externalSetShowFavorites,
        selectedCategories: externalSelectedCategories,
        setSelectedCategories: externalSetSelectedCategories,
    } = props;

    const router = useRouter();
    const { searchQuery } = useSearch();
    const [localShowFavoritesOnly, setLocalShowFavoritesOnly] = useState(false);
    const [localSelectedCategories, setLocalSelectedCategories] = useState<string[]>(MAIN_CATEGORIES);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [favorites, setFavorites] = useState<string[]>([]);

    // Use external state if provided, otherwise use local state
    const showFavoritesOnly = externalShowFavorites !== undefined ? externalShowFavorites : localShowFavoritesOnly;
    const setShowFavoritesOnly = externalSetShowFavorites || setLocalShowFavoritesOnly;
    const selectedCategories = externalSelectedCategories !== undefined ? externalSelectedCategories : localSelectedCategories;
    const setSelectedCategories = externalSetSelectedCategories || setLocalSelectedCategories;

    useEffect(() => {
        const stored = localStorage.getItem('nutrient-favorites');
        if (stored) {
            try { setFavorites(JSON.parse(stored)); } catch (e) { }
        }
    }, []);

    const toggleFavorite = (name: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newFavorites = favorites.includes(name)
            ? favorites.filter(n => n !== name)
            : [...favorites, name];
        setFavorites(newFavorites);
        localStorage.setItem('nutrient-favorites', JSON.stringify(newFavorites));
    };

    const getNutrientCategory = (name: string) => {
        const cat = NUTRIENT_CATEGORIES_DATA.find(c => c.keys.includes(name));
        return cat ? CATEGORY_MAP[cat.title] || "Other" : "Other";
    };

    const filteredNutrients = Object.keys(nutrientInfo).filter(name => {
        const info = nutrientInfo[name];
        const category = getNutrientCategory(name);
        const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            info.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFavorites = !showFavoritesOnly || favorites.includes(name);
        const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(category);
        return matchesSearch && matchesFavorites && matchesCategory;
    });

    return (
        <div className="space-y-6">
            {/* Nutrient Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                {filteredNutrients.map(name => {
                    const info = nutrientInfo[name];
                    const category = getNutrientCategory(name);
                    const isFav = favorites.includes(name);
                    const catData = NUTRIENT_CATEGORIES_DATA.find(c => c.keys.includes(name));
                    const shorthand = SHORTHAND_MAP[name] || name.substring(0, 2);
                    const theme = catData?.theme || "orange";

                    return (
                        <div
                            key={name}
                            onClick={() => router.push(`/dashboard/nutrients/${encodeURIComponent(name)}`)}
                            className="group bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500 cursor-pointer overflow-hidden"
                        >
                            <div className="lg:grid lg:grid-cols-[100px_1fr_120px_120px_120px_140px] gap-6 lg:items-center">
                                {/* Element Tile */}
                                <div className="p-4 lg:p-6 flex items-center justify-center bg-slate-50/50 dark:bg-slate-800/30 border-r border-slate-100 dark:border-slate-800">
                                    <NutrientElement
                                        shorthand={shorthand}
                                        theme={theme}
                                        category={category}
                                    />
                                </div>

                                <div className="px-6 py-2 lg:py-6">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-black text-lg tracking-tighter text-slate-900 dark:text-white leading-tight uppercase italic">{name}</h3>
                                        <Badge className={cn("text-[8px] font-black uppercase tracking-widest border-none px-2 rounded-lg",
                                            category === "Macros" ? "bg-orange-500/10 text-orange-600" :
                                                category === "Minerals" ? "bg-indigo-500/10 text-indigo-600" : "bg-emerald-500/10 text-emerald-600"
                                        )}>
                                            {category}
                                        </Badge>
                                    </div>
                                    <p className="text-[10px] text-slate-500 line-clamp-1 italic font-medium">{info.description}</p>
                                </div>

                                <div className="hidden lg:flex flex-col gap-1 text-center">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Analysis</span>
                                    <span className="font-black text-xs text-slate-600 dark:text-slate-300 italic group-hover:text-blue-500 transition-colors">Profiles</span>
                                </div>

                                <div className="hidden lg:flex flex-col gap-1 text-center">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Medical</span>
                                    <span className="font-black text-xs text-slate-600 dark:text-slate-300 italic">{info.benefits.length} Benefits</span>
                                </div>

                                <div className="hidden lg:flex flex-col gap-1 text-center">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Culinary</span>
                                    <span className="font-black text-xs text-slate-600 dark:text-slate-300 italic">{info.sources.length} Sources</span>
                                </div>

                                <div className="p-6 flex justify-end items-center gap-3">
                                    <button
                                        onClick={(e) => toggleFavorite(name, e)}
                                        className={cn(
                                            "w-10 h-10 rounded-2xl border flex items-center justify-center transition-all duration-300 hover:scale-110",
                                            isFav ? "bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-500/20" : "bg-white dark:bg-slate-800 text-slate-300 border-slate-200 dark:border-slate-700 hover:text-rose-500 hover:border-rose-200"
                                        )}
                                    >
                                        <Heart size={16} fill={isFav ? "currentColor" : "none"} />
                                    </button>
                                    <button className="w-10 h-10 rounded-2xl border border-blue-600 bg-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-600/20 transition-all hover:translate-x-1 duration-300">
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

