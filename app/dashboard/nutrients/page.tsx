'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Zap,
    X,
    Info,
    Search,
    ChevronRight,
    Activity,
    Gem,
    Droplet,
    Battery,
    ArrowLeft,
    ChevronLeft,
    Sparkles,
    Scale,
    Heart,
    Globe,
    Filter,
    ChevronDown,
    Check,
    Library,
    Plus,
    ChefHat
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { nutrientInfo, NutrientInfo } from '@/lib/data/nutrient-info';

const Card = ({ children, className, onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
    <div
        onClick={onClick}
        className={cn("bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm", className)}
    >
        {children}
    </div>
);

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

export default function NutrientsHub() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
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

    const handleNutrientClick = (name: string) => {
        router.push(`/dashboard/nutrients/${encodeURIComponent(name)}`);
    };

    const themes = {
        orange: "text-orange-500 bg-orange-500/10 border-orange-500/20",
        indigo: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
        rose: "text-rose-500 bg-rose-500/10 border-rose-500/20",
        emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
            {/* Header Actions */}
            <div className="flex justify-end gap-3">
                <Button
                    onClick={() => router.push('/dashboard/foods')}
                    className="bg-white/50 hover:bg-white text-slate-600 dark:text-white border border-slate-200 dark:border-white/10 backdrop-blur-md shadow-sm gap-2 px-4 h-11 rounded-xl font-black uppercase tracking-widest group/btn transition-all text-[10px]"
                >
                    <Library size={14} className="group-hover/btn:scale-110 transition-transform" />
                    Foods Hub
                </Button>
                <Button
                    onClick={() => router.push('/dashboard/recipes')}
                    className="bg-white/50 hover:bg-white text-slate-600 dark:text-white border border-slate-200 dark:border-white/10 backdrop-blur-md shadow-sm gap-2 px-4 h-11 rounded-xl font-black uppercase tracking-widest group/btn transition-all text-[10px]"
                >
                    <ChefHat size={14} className="group-hover/btn:scale-110 transition-transform" />
                    Recipes Hub
                </Button>
            </div>

            {/* Hero Section */}
            <div className="relative h-64 rounded-[2.5rem] bg-slate-900 overflow-hidden flex items-center px-12 group shadow-2xl">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576086213369-97a306d36557?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')] bg-cover bg-center mix-blend-overlay opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent" />

                <div className="relative z-10 space-y-4 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest">
                        <Zap size={12} className="fill-current" />
                        Biological Reference Hub
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-2 opacity-80">Clinical Lab</p>
                        <h1 className="text-4xl lg:text-6xl font-black tracking-tighter text-white uppercase italic leading-[0.85]">
                            Nutrients <span className="text-amber-500 font-black">Library.</span>
                        </h1>
                    </div>
                    <p className="text-slate-400 font-medium text-sm leading-relaxed">
                        Deep-dive into the clinical data of vitamins, minerals, and macronutrients. Understand the biological mechanisms that drive human performance.
                    </p>
                </div>

                <div className="absolute right-12 hidden lg:block">
                    <div className="w-48 h-48 rounded-full border-2 border-dashed border-slate-800 flex items-center justify-center animate-spin-slow">
                        <Activity size={80} className="text-slate-800" />
                    </div>
                </div>
            </div>

            {/* Controls Row */}
            <div className="flex flex-col md:flex-row gap-4 justify-center relative z-30">
                {/* Search Bar - Integrated in row */}
                <div className="relative group flex-grow max-w-md">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                        <Search className="text-slate-400 group-focus-within:text-amber-500 transition-colors" size={18} />
                    </div>
                    <Input
                        type="text"
                        placeholder="Search nutrients..."
                        className="w-full h-14 pl-12 pr-6 bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm font-bold"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Favorites Switch Toggle */}
                <div className="flex items-center gap-4 bg-white dark:bg-slate-900/50 h-14 px-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
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
                    <div className="flex bg-white dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto no-scrollbar items-center h-14 shadow-sm">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={cn(
                                "px-4 h-full rounded-xl flex items-center gap-2 transition-all duration-300",
                                isFilterOpen ? "bg-amber-600 text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                            )}
                        >
                            <Filter size={18} />
                            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Filter</span>
                            <ChevronDown size={14} className={cn("transition-transform", isFilterOpen && "rotate-180")} />
                        </button>

                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

                        {MAIN_CATEGORIES.map(category => {
                            const isActive = selectedCategories.includes(category);

                            return (
                                <button
                                    key={category}
                                    onClick={() => {
                                        if (isActive) {
                                            setSelectedCategories(prev => prev.filter(c => c !== category));
                                        } else {
                                            setSelectedCategories(prev => [...prev, category]);
                                        }
                                    }}
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

                    {/* Dropdown Menu */}
                    {isFilterOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setIsFilterOpen(false)}
                            />
                            <div className="absolute top-full mt-2 left-0 w-64 bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Biological Groups</p>
                                    <div className="space-y-1">
                                        {MAIN_CATEGORIES.map(category => {
                                            const isActive = selectedCategories.includes(category);
                                            return (
                                                <div
                                                    key={category}
                                                    onClick={() => {
                                                        if (isActive) {
                                                            setSelectedCategories(prev => prev.filter(c => c !== category));
                                                        } else {
                                                            setSelectedCategories(prev => [...prev, category]);
                                                        }
                                                    }}
                                                    className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer group transition-colors"
                                                >
                                                    <span className={cn(
                                                        "text-xs font-bold uppercase tracking-wide transition-colors",
                                                        isActive ? "text-amber-600" : "text-slate-600 dark:text-slate-400"
                                                    )}>
                                                        {category}
                                                    </span>
                                                    <div className={cn(
                                                        "w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center",
                                                        isActive
                                                            ? "bg-amber-600 border-amber-600"
                                                            : "border-slate-200 dark:border-slate-700 group-hover:border-amber-500/30"
                                                    )}>
                                                        {isActive && <Check size={12} className="text-white" />}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between gap-2">
                                        <button
                                            onClick={() => setSelectedCategories([])}
                                            className="flex-1 py-2 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            Clear
                                        </button>
                                        <button
                                            onClick={() => setSelectedCategories(MAIN_CATEGORIES)}
                                            className="flex-1 py-2 text-[9px] font-black uppercase tracking-widest text-amber-600 hover:text-amber-700 transition-colors"
                                        >
                                            All
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* List Header Labels */}
            <div className="hidden lg:grid lg:grid-cols-[60px_1fr_120px_120px_120px_100px] gap-6 px-10 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <div className="flex justify-center"><Activity size={14} className="opacity-50" /></div>
                <div>Name & Significance</div>
                <div className="text-right">Functional Role</div>
                <div className="text-right">Benefits</div>
                <div className="text-right">Sources</div>
                <div className="flex justify-center text-rose-500"><Heart size={14} /></div>
            </div>

            {/* Nutrient List Area */}
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
                                onClick={() => handleNutrientClick(name)}
                                className="group bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/30 hover:shadow-lg transition-all cursor-pointer overflow-hidden p-2 lg:p-0"
                            >
                                <div className="lg:grid lg:grid-cols-[60px_1fr_120px_120px_120px_100px] gap-6 lg:items-center lg:px-10">
                                    {/* Icon / Thumbnail Box */}
                                    <div className="aspect-square w-12 lg:w-12 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-500 mx-auto">
                                        <div className={cn("p-2 rounded-lg", themes[theme as keyof typeof themes])}>
                                            <Icon size={20} />
                                        </div>
                                    </div>

                                    {/* Info Panel */}
                                    <div className="py-4 lg:py-6">
                                        <div className="flex flex-col gap-0.5">
                                            <h3 className="font-black text-sm tracking-tight text-slate-900 dark:text-white leading-tight uppercase italic">
                                                {name}
                                            </h3>
                                            <p className="text-[10px] text-slate-500 line-clamp-1 max-w-xl">
                                                {info.description}
                                            </p>
                                            <Badge className={cn("w-fit mt-1.5 text-[8px] font-black uppercase tracking-widest border-none px-2",
                                                category === "Macros" ? "bg-orange-500/10 text-orange-600" :
                                                    category === "Minerals" ? "bg-indigo-500/10 text-indigo-600" :
                                                        "bg-emerald-500/10 text-emerald-600"
                                            )}>
                                                {category}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Secondary Stats/Info Columns (Desktop Only) */}
                                    <div className="hidden lg:block text-right">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Reference</span>
                                    </div>
                                    <div className="hidden lg:block text-right">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-slate-600 dark:text-slate-300">{info.benefits.length}</span>
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Benefits</span>
                                        </div>
                                    </div>
                                    <div className="hidden lg:block text-right">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-slate-600 dark:text-slate-300">{info.sources.length}</span>
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sources</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="p-3 lg:p-0 flex justify-end lg:justify-center gap-2">
                                        <button
                                            onClick={(e) => toggleFavorite(name, e)}
                                            className={cn(
                                                "w-10 h-10 rounded-full flex items-center justify-center transition-all border",
                                                isFav
                                                    ? "bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/20"
                                                    : "bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 border-slate-100 dark:border-slate-700"
                                            )}
                                        >
                                            <Heart size={16} fill={isFav ? "currentColor" : "none"} />
                                        </button>
                                        <button
                                            className="w-10 h-10 rounded-full flex lg:hidden items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-700"
                                        >
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-white/30 dark:bg-slate-900/10 backdrop-blur-sm group">
                        <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700 mb-6 group-hover:scale-110 transition-transform">
                            <Zap size={32} />
                        </div>
                        <p className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                            {showFavoritesOnly ? "No Favorites Found" : "No results matching your query."}
                        </p>
                        <p className="text-sm text-slate-500 text-center max-w-xs">
                            {showFavoritesOnly
                                ? "Tap the heart icon on any nutrient to add it to your clinical collection."
                                : "Try adjusting your search or filters to see more biological markers."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
