'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
    Info
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

const NUTRIENT_CATEGORIES_DATA = [
    { title: "Macronutrients", icon: Zap, theme: "orange", keys: ['Energy', 'Protein', 'Carbs', 'Fat', 'Fiber'] },
    { title: "Electrolytes", icon: Droplet, theme: "indigo", keys: ['Potassium', 'Magnesium', 'Calcium', 'Sodium', 'Phosphorus'] },
    { title: "Trace Minerals", icon: Gem, theme: "rose", keys: ['Iron', 'Zinc', 'Selenium', 'Copper', 'Manganese'] },
    { title: "Vitamins", icon: Battery, theme: "emerald", keys: ['Vitamin A', 'B1 (Thiamine)', 'B2 (Riboflavin)', 'B3 (Niacin)', 'B5 (Pantothenic Acid)', 'B6 (Pyridoxine)', 'B9 (Folate)', 'B12 (Cobalamin)', 'Vitamin C', 'Vitamin D', 'Vitamin E', 'Vitamin K', 'Choline'] }
];

export function NutrientsView() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [favorites, setFavorites] = useState<string[]>([]);

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

    const themes = {
        orange: "text-orange-500 bg-orange-500/10 border-orange-500/20",
        indigo: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
        rose: "text-rose-500 bg-rose-500/10 border-rose-500/20",
        emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
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
            {/* Controls Row */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex items-center gap-4 flex-grow max-w-2xl">
                    <div className="relative group flex-grow">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" size={18} />
                        <Input
                            placeholder="Search..."
                            className="h-14 pl-12 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-4 bg-white dark:bg-slate-900/50 h-14 px-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                        <Globe size={18} className={cn("transition-all cursor-pointer", !showFavoritesOnly ? "text-blue-500" : "text-slate-300")} onClick={() => setShowFavoritesOnly(false)} />
                        <Switch checked={showFavoritesOnly} onCheckedChange={setShowFavoritesOnly} />
                        <Heart size={18} className={cn("transition-all cursor-pointer", showFavoritesOnly ? "text-rose-500 fill-rose-500" : "text-slate-300")} onClick={() => setShowFavoritesOnly(true)} />
                    </div>
                </div>

                <div className="relative">
                    <div className="flex bg-white dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 gap-1 h-14 items-center shadow-sm">
                        {MAIN_CATEGORIES.map(category => (
                            <button
                                key={category}
                                onClick={() => selectedCategories.includes(category)
                                    ? setSelectedCategories(prev => prev.filter(c => c !== category))
                                    : setSelectedCategories(prev => [...prev, category])
                                }
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    selectedCategories.includes(category) ? "bg-amber-600/10 text-amber-600 border border-amber-600/20" : "text-slate-500"
                                )}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* List Header */}
            <div className="hidden lg:grid lg:grid-cols-[60px_1fr_120px_120px_120px_100px] gap-6 px-10 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <div className="text-center"><Activity size={14} className="mx-auto" /></div>
                <div>Name</div>
                <div className="text-right">Main Use</div>
                <div className="text-right">Benefits</div>
                <div className="text-right">Found In</div>
                <div className="text-center">Favorite</div>
            </div>

            {/* Nutrient Items */}
            <div className="space-y-3">
                {filteredNutrients.map(name => {
                    const info = nutrientInfo[name];
                    const category = getNutrientCategory(name);
                    const isFav = favorites.includes(name);
                    const catData = NUTRIENT_CATEGORIES_DATA.find(c => c.keys.includes(name));
                    const Icon = catData?.icon || Activity;
                    const theme = catData?.theme || "orange";

                    return (
                        <div
                            key={name}
                            onClick={() => router.push(`/dashboard/nutrients/${encodeURIComponent(name)}`)}
                            className="group bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/30 hover:shadow-lg transition-all cursor-pointer overflow-hidden p-2 lg:p-0"
                        >
                            <div className="lg:grid lg:grid-cols-[60px_1fr_120px_120px_120px_100px] gap-6 lg:items-center lg:px-10">
                                <div className="p-3 lg:p-0">
                                    <div className={cn("p-2 rounded-xl w-10 h-10 flex items-center justify-center mx-auto", themes[theme as keyof typeof themes])}>
                                        <Icon size={20} />
                                    </div>
                                </div>

                                <div className="py-2 lg:py-6">
                                    <h3 className="font-black text-sm tracking-tight text-slate-900 dark:text-white leading-tight uppercase italic">{name}</h3>
                                    <p className="text-[10px] text-slate-500 line-clamp-1 italic">{info.description}</p>
                                    <Badge className={cn("mt-1.5 text-[8px] font-black uppercase tracking-widest border-none px-2",
                                        category === "Macros" ? "bg-orange-500/10 text-orange-600" :
                                            category === "Minerals" ? "bg-indigo-500/10 text-indigo-600" : "bg-emerald-500/10 text-emerald-600"
                                    )}>
                                        {category}
                                    </Badge>
                                </div>

                                <div className="hidden lg:block text-right text-[10px] font-bold text-slate-400 uppercase">Tips</div>
                                <div className="hidden lg:block text-right font-black text-xs text-slate-600 dark:text-slate-300">{info.benefits.length} Benefits</div>
                                <div className="hidden lg:block text-right font-black text-xs text-slate-600 dark:text-slate-300">{info.sources.length} Foods</div>

                                <div className="p-3 lg:p-0 flex justify-end lg:justify-center gap-2">
                                    <button
                                        onClick={(e) => toggleFavorite(name, e)}
                                        className={cn(
                                            "w-9 h-9 rounded-xl border flex items-center justify-center transition-all",
                                            isFav ? "bg-rose-500 text-white border-rose-600" : "bg-slate-50 dark:bg-slate-800 text-slate-400"
                                        )}
                                    >
                                        <Heart size={16} fill={isFav ? "currentColor" : "none"} />
                                    </button>
                                    <button className="w-9 h-9 rounded-xl border bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/10">
                                        <ChevronRight size={16} />
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
