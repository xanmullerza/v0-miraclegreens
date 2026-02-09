'use client';

import { useState, useEffect } from 'react';
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
    Check
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
    const { searchQuery } = useSearch();
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [favorites, setFavorites] = useState<string[]>([]);

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

    const getNutrientIcon = (name: string) => {
        const cat = NUTRIENT_CATEGORIES_DATA.find(c => c.keys.includes(name));
        return cat ? cat.icon : Activity;
    };

    const getNutrientTheme = (name: string) => {
        const cat = NUTRIENT_CATEGORIES_DATA.find(c => c.keys.includes(name));
        return cat ? cat.theme : "orange";
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

    const themes = {
        orange: "text-orange-500 bg-orange-500/10 border-orange-500/20",
        indigo: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
        rose: "text-rose-500 bg-rose-500/10 border-rose-500/20",
        emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">Nutrients Library</h2>
                    <p className="text-slate-500 font-medium text-sm max-w-lg">
                        Deep-dive into the clinical data of vitamins, minerals, and macronutrients.
                    </p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-center relative z-30">
                <div className="flex items-center gap-4 bg-white dark:bg-slate-900/50 h-14 px-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    <Globe
                        size={18}
                        className={cn("transition-all cursor-pointer", !showFavoritesOnly ? "text-blue-500 scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]" : "text-slate-300")}
                        onClick={() => setShowFavoritesOnly(false)}
                    />
                    <Switch
                        id="favorites-mode"
                        checked={showFavoritesOnly}
                        onCheckedChange={setShowFavoritesOnly}
                    />
                    <Heart
                        size={18}
                        className={cn("transition-all cursor-pointer", showFavoritesOnly ? "text-rose-500 fill-rose-500 scale-110 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]" : "text-slate-300")}
                        onClick={() => setShowFavoritesOnly(true)}
                    />
                </div>

                <div className="relative">
                    <div className="flex bg-white dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto no-scrollbar items-center h-14 shadow-sm w-fit transition-all duration-500">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={cn(
                                "px-4 h-full rounded-xl flex items-center gap-2 transition-all duration-300 shrink-0",
                                isFilterOpen ? "bg-amber-600 text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                            )}
                        >
                            <Filter size={18} />
                            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Filter Groups</span>
                            <ChevronDown size={14} className={cn("transition-transform duration-300", isFilterOpen && "rotate-180")} />
                        </button>

                        <div className="w-px h-6 bg-slate-100 dark:bg-slate-800 mx-1 shrink-0" />

                        <div className={cn("flex items-center gap-1 transition-all duration-500 ease-in-out overflow-hidden", isFilterOpen ? "max-w-[1000px] opacity-100 px-1" : "max-w-0 opacity-0 px-0")}>
                            {MAIN_CATEGORIES.map(category => {
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
                                                ? "bg-amber-600/10 text-amber-600 border border-amber-600/20"
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
                                    {selectedCategories.length === 0 ? "All Nutrients" : `${selectedCategories.length} Groups Selected`}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {filteredNutrients.length > 0 ? (
                    filteredNutrients.map(name => {
                        const info = nutrientInfo[name];
                        const category = getNutrientCategory(name);
                        const Icon = getNutrientIcon(name);
                        const theme = getNutrientTheme(name);
                        const isFav = favorites.includes(name);

                        return (
                            <div
                                key={name}
                                onClick={() => router.push(`/dashboard/nutrients/${encodeURIComponent(name)}`)}
                                className="group bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/30 hover:shadow-lg transition-all cursor-pointer overflow-hidden p-4"
                            >
                                <div className="flex items-center gap-6">
                                    <div className={cn("p-3 rounded-xl", themes[theme as keyof typeof themes])}>
                                        <Icon size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-black text-sm tracking-tight text-slate-900 dark:text-white uppercase italic leading-tight">{name}</h3>
                                        <p className="text-[10px] text-slate-500 line-clamp-1">{info.description}</p>
                                        <Badge className={cn("mt-1.5 text-[8px] font-black uppercase tracking-widest border-none px-2",
                                            category === "Macros" ? "bg-orange-500/10 text-orange-600" : category === "Minerals" ? "bg-indigo-500/10 text-indigo-600" : "bg-emerald-500/10 text-emerald-600"
                                        )}>
                                            {category}
                                        </Badge>
                                    </div>
                                    <button
                                        onClick={(e) => toggleFavorite(name, e)}
                                        className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-all border", isFav ? "bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/20" : "bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700")}
                                    >
                                        <Heart size={16} fill={isFav ? "currentColor" : "none"} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] bg-white/30">
                        <Zap size={32} className="text-slate-300 mb-4" />
                        <p className="text-lg font-bold text-slate-900 dark:text-white mb-2">No results matching your query.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
