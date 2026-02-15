'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Activity,
    Scale,
    ChevronDown,
    Gem,
    Battery,
    Sparkles,
    Droplet,
    Zap
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
import { NutrientsView } from '@/components/library/nutrients-view';

const NUTRIENTS = [
    { id: 'B1 (Thiamine)', label: 'B1 (Thiamine)', unit: 'mg', color: 'bg-blue-500', icon: Droplet },
    { id: 'B2 (Riboflavin)', label: 'B2 (Riboflavin)', unit: 'mg', color: 'bg-blue-500', icon: Droplet },
    { id: 'B3 (Niacin)', label: 'B3 (Niacin)', unit: 'mg', color: 'bg-blue-500', icon: Droplet },
    { id: 'B5 (Pantothenic Acid)', label: 'B5 (Pantothenic Acid)', unit: 'mg', color: 'bg-blue-500', icon: Droplet },
    { id: 'B6 (Pyridoxine)', label: 'B6 (Pyridoxine)', unit: 'mg', color: 'bg-blue-500', icon: Droplet },
    { id: 'B9 (Folate)', label: 'B9 (Folate)', unit: 'µg', color: 'bg-blue-500', icon: Droplet },
    { id: 'B12 (Cobalamin)', label: 'B12 (Cobalamin)', unit: 'µg', color: 'bg-blue-500', icon: Droplet },
    { id: 'Calcium', label: 'Calcium', unit: 'mg', color: 'bg-slate-500', icon: Gem },
    { id: 'carbs_g', label: 'Carbs', unit: 'g', color: 'bg-orange-500', icon: Zap },
    { id: 'Choline', label: 'Choline', unit: 'mg', color: 'bg-indigo-500', icon: Droplet },
    { id: 'Copper', label: 'Copper', unit: 'mg', color: 'bg-rose-500', icon: Gem },
    { id: 'energy_kcal', label: 'Energy (Calories)', unit: 'kcal', color: 'bg-amber-500', icon: Zap },
    { id: 'fat_g', label: 'Fat', unit: 'g', color: 'bg-amber-500', icon: Zap },
    { id: 'Fiber', label: 'Fiber', unit: 'g', color: 'bg-emerald-500', icon: Activity },
    { id: 'Iron', label: 'Iron', unit: 'mg', color: 'bg-red-500', icon: Gem },
    { id: 'Magnesium', label: 'Magnesium', unit: 'mg', color: 'bg-purple-500', icon: Gem },
    { id: 'Manganese', label: 'Manganese', unit: 'mg', color: 'bg-stone-500', icon: Gem },
    { id: 'Phosphorus', label: 'Phosphorus', unit: 'mg', color: 'bg-indigo-400', icon: Gem },
    { id: 'Potassium', label: 'Potassium', unit: 'mg', color: 'bg-sky-500', icon: Gem },
    { id: 'protein_g', label: 'Protein', unit: 'g', color: 'bg-blue-600', icon: Scale },
    { id: 'Selenium', label: 'Selenium', unit: 'µg', color: 'bg-pink-500', icon: Gem },
    { id: 'Sodium', label: 'Sodium', unit: 'mg', color: 'bg-slate-400', icon: Gem },
    { id: 'Vitamin A', label: 'Vitamin A', unit: 'µg', color: 'bg-orange-400', icon: Battery },
    { id: 'Vitamin C', label: 'Vitamin C', unit: 'mg', color: 'bg-yellow-400', icon: Droplet },
    { id: 'Vitamin D', label: 'Vitamin D', unit: 'IU', color: 'bg-yellow-200', icon: Battery },
    { id: 'Vitamin E', label: 'Vitamin E', unit: 'mg', color: 'bg-emerald-400', icon: Battery },
    { id: 'Vitamin K', label: 'Vitamin K', unit: 'µg', color: 'bg-green-600', icon: Battery },
    { id: 'Zinc', label: 'Zinc', unit: 'mg', color: 'bg-cyan-500', icon: Gem },
    { id: 'Cholesterol', label: 'Cholesterol', unit: 'mg', color: 'bg-red-400', icon: Activity },
    { id: 'Omega-3', label: 'Omega-3', unit: 'g', color: 'bg-teal-500', icon: Droplet },
    { id: 'Oxalate', label: 'Oxalate', unit: 'mg', color: 'bg-amber-600', icon: Gem },
    { id: 'Sugar', label: 'Sugar', unit: 'g', color: 'bg-pink-400', icon: Zap },
    { id: 'welcome', label: 'Welcome', unit: '', color: 'bg-emerald-500', icon: Sparkles },
];

export default function NutrientsPage() {
    const router = useRouter();

    // We maintain a 'selected' state just for the UI of the dropdowns (to show what was last picked or highlight hierarchy)
    // But realistically, selecting one navigates away.
    const [selectedNutrientId, setSelectedNutrientId] = useState<string | null>('welcome');

    // Filter States passed to NutrientsView if we want to filter the grid (optional, but good for "Browse" feel)
    // The user asked for the "exact same filter", which usually implies the strip of dropdowns.
    // In the Library page, those dropdowns controlled the 'Top 10' view.
    // Here, we'll use them as quick navigation or high-level filtering.
    // Since the dropdowns pick a SPECIFIC nutrient, navigation is the best UX.

    const MACROS = ['energy_kcal', 'protein_g', 'carbs_g', 'fat_g', 'Fiber', 'Sugar', 'Omega-3', 'Cholesterol'];
    const MINERALS = ['Sodium', 'Potassium', 'Magnesium', 'Calcium', 'Phosphorus', 'Iron', 'Zinc', 'Copper', 'Manganese', 'Selenium', 'Oxalate'];
    const VITAMINS = ['Vitamin A', 'Vitamin C', 'Vitamin D', 'Vitamin E', 'Vitamin K', 'B1 (Thiamine)', 'B2 (Riboflavin)', 'B3 (Niacin)', 'B5 (Pantothenic Acid)', 'B6 (Pyridoxine)', 'B9 (Folate)', 'B12 (Cobalamin)', 'Choline'];

    const handleNutrientSelect = (id: string) => {
        setSelectedNutrientId(id);
        const encodedId = encodeURIComponent(id);
        router.push(`/dashboard/library/nutrients/${encodedId}`);
    };

    return (
        <div className="space-y-8 p-4 md:p-8 pb-24">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Nutrients Explorer</h2>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Master your micronutrients</p>
                </div>

                {/* The Filter Bar */}
                <div className="flex items-center gap-2">
                    {/* Welcome Button */}
                    <button
                        onClick={() => handleNutrientSelect('welcome')}
                        className={cn(
                            "px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-3 shrink-0 border shadow-sm outline-none",
                            selectedNutrientId === 'welcome'
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/20 px-5"
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-emerald-500"
                        )}
                    >
                        <Sparkles size={14} />
                        <span>Welcome</span>
                    </button>

                    {/* Macro Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className={cn(
                                "px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-3 shrink-0 border shadow-sm outline-none",
                                selectedNutrientId && MACROS.includes(selectedNutrientId)
                                    ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20 px-5"
                                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-500"
                            )}>
                                <Scale size={14} />
                                <span>{selectedNutrientId && MACROS.includes(selectedNutrientId) ? NUTRIENTS.find(n => n.id === selectedNutrientId)?.label : "Macros"}</span>
                                <ChevronDown size={12} className="opacity-50" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 p-2 rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-950">
                            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-2">Select Macro</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 mx-2" />
                            {MACROS.map(id => {
                                const nutrient = NUTRIENTS.find(n => n.id === id);
                                if (!nutrient) return null;
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={id}
                                        checked={selectedNutrientId === id}
                                        onCheckedChange={() => handleNutrientSelect(id)}
                                        className="rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 focus:bg-blue-50 dark:focus:bg-blue-900/10 focus:text-blue-600 py-2.5 cursor-pointer"
                                    >
                                        {nutrient.label}
                                    </DropdownMenuCheckboxItem>
                                )
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Mineral Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className={cn(
                                "px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-3 shrink-0 border shadow-sm outline-none",
                                selectedNutrientId && MINERALS.includes(selectedNutrientId)
                                    ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20 px-5"
                                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-500"
                            )}>
                                <Gem size={14} />
                                <span>{selectedNutrientId && MINERALS.includes(selectedNutrientId) ? NUTRIENTS.find(n => n.id === selectedNutrientId)?.label : "Minerals"}</span>
                                <ChevronDown size={12} className="opacity-50" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 p-2 rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-950 max-h-[400px] overflow-y-auto no-scrollbar">
                            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-2">Select Mineral</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 mx-2" />
                            {MINERALS.map(id => {
                                const nutrient = NUTRIENTS.find(n => n.id === id);
                                if (!nutrient) return null;
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={id}
                                        checked={selectedNutrientId === id}
                                        onCheckedChange={() => handleNutrientSelect(id)}
                                        className="rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 focus:bg-blue-50 dark:focus:bg-blue-900/10 focus:text-blue-600 py-2.5 cursor-pointer"
                                    >
                                        {nutrient.label}
                                    </DropdownMenuCheckboxItem>
                                )
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Vitamin Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className={cn(
                                "px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-3 shrink-0 border shadow-sm outline-none",
                                selectedNutrientId && VITAMINS.includes(selectedNutrientId)
                                    ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20 px-5"
                                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-500"
                            )}>
                                <Battery size={14} />
                                <span>{selectedNutrientId && VITAMINS.includes(selectedNutrientId) ? NUTRIENTS.find(n => n.id === selectedNutrientId)?.label : "Vitamins"}</span>
                                <ChevronDown size={12} className="opacity-50" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 p-2 rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-950 max-h-[400px] overflow-y-auto no-scrollbar">
                            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-2">Select Vitamin</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 mx-2" />
                            {VITAMINS.map(id => {
                                const nutrient = NUTRIENTS.find(n => n.id === id);
                                if (!nutrient) return null;
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={id}
                                        checked={selectedNutrientId === id}
                                        onCheckedChange={() => handleNutrientSelect(id)}
                                        className="rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 focus:bg-blue-50 dark:focus:bg-blue-900/10 focus:text-blue-600 py-2.5 cursor-pointer"
                                    >
                                        {nutrient.label}
                                    </DropdownMenuCheckboxItem>
                                )
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Nutrients Grid View */}
            <div className="animate-in slide-in-from-bottom-4 duration-700">
                <NutrientsView
                    selectedCategories={["Macros", "Minerals", "Vitamins"]}
                    showFavoritesOnly={false}
                    setShowFavoritesOnly={() => { }}
                    setSelectedCategories={() => { }}
                />
            </div>
        </div>
    );
}
