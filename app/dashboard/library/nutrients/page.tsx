'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    Activity,
    Scale,
    ChevronDown,
    ChevronRight,
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
    const pathname = usePathname();

    // We maintain a 'selected' state just for the UI of the dropdowns (to show what was last picked or highlight hierarchy)
    // But realistically, selecting one navigates away.
    const [selectedNutrientId, setSelectedNutrientId] = useState<string | null>('welcome');

    // Filter States passed to NutrientsView if we want to filter the grid (optional, but good for "Browse" feel)
    // The user asked for the "exact same filter", which usually implies the strip of dropdowns.
    // In the Library page, those dropdowns controlled the 'Top 10' view.
    // Here, we'll use them as quick navigation or high-level filtering.
    // Since the dropdowns pick a SPECIFIC nutrient, navigation is the best UX.

    const MACROS = ['energy_kcal', 'protein_g', 'carbs_g', 'fat_g', 'Fiber'];
    const MINERALS = ['Sodium', 'Potassium', 'Magnesium', 'Calcium', 'Phosphorus', 'Iron', 'Zinc', 'Copper', 'Manganese', 'Selenium', 'Oxalate'];
    const VITAMINS = ['Vitamin A', 'Vitamin C', 'Vitamin D', 'Vitamin E', 'Vitamin K', 'B1 (Thiamine)', 'B2 (Riboflavin)', 'B3 (Niacin)', 'B5 (Pantothenic Acid)', 'B6 (Pyridoxine)', 'B9 (Folate)', 'B12 (Cobalamin)', 'Choline'];

    const handleNutrientSelect = (id: string) => {
        setSelectedNutrientId(id);
        const encodedId = encodeURIComponent(id);
        router.push(`/dashboard/library/nutrients/${encodedId}`);
    };

    return (
        <div className="flex flex-col w-full min-h-screen">
            {/* Sticky Filter Header */}
            <div className="sticky top-0 z-50 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="px-8 py-3 flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                    {/* Breadcrumbs on the Left */}
                    <div className="flex items-center gap-2 whitespace-nowrap flex-shrink-0">
                        {pathname.split('/').filter(Boolean).map((segment, index, array) => {
                            const path = '/' + array.slice(0, index + 1).join('/');
                            const isLast = index === array.length - 1;
                            const isFirst = index === 0;

                            return (
                                <React.Fragment key={path}>
                                    {!isFirst && <ChevronRight size={12} className="text-slate-300 dark:text-slate-600" />}
                                    {isLast ? (
                                        <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">
                                            {decodeURIComponent(segment).replace(/-/g, ' ')}
                                        </span>
                                    ) : (
                                        <Link
                                            href={path}
                                            className="text-xs font-black text-slate-400 hover:text-emerald-500 uppercase tracking-widest transition-colors"
                                        >
                                            {decodeURIComponent(segment).replace(/-/g, ' ')}
                                        </Link>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>

                    {/* Filters on the Right */}
                    <div className="flex items-center gap-2 flex-wrap md:ml-auto">
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
            </div>

            {/* Main Content */}
            <div className="flex-1 space-y-12 p-4 md:p-8 pb-24 max-w-5xl mx-auto w-full">
                {/* Advisory Card */}
                <div className="bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-950/20 dark:to-blue-950/20 border-2 border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-8 md:p-10 shadow-sm">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                        <div className="flex-shrink-0 w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center">
                            <Sparkles size={32} className="text-white" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white mb-2">
                                Explore Essential Nutrients
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                Click on the <span className="font-bold">Macros</span>, <span className="font-bold">Minerals</span>, or <span className="font-bold">Vitamins</span> filters above to discover detailed information about each nutrient, including recommended daily intake, food sources, health benefits, and more.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Essential Nutrients Guide */}
                <div className="space-y-8">
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-wide text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                            <Scale size={24} className="text-blue-500" />
                            Macronutrients
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                                <h4 className="font-black text-sm uppercase tracking-wide text-blue-600 dark:text-blue-400 mb-2">Protein</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">Essential for building and repairing tissues, muscles, and organs. Supports immune function and hormone production.</p>
                            </div>
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                                <h4 className="font-black text-sm uppercase tracking-wide text-orange-600 dark:text-orange-400 mb-2">Carbohydrates</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">Primary source of energy for your body and brain. Choose whole grains and fiber-rich options for sustained energy.</p>
                            </div>
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                                <h4 className="font-black text-sm uppercase tracking-wide text-amber-600 dark:text-amber-400 mb-2">Fats</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">Crucial for nutrient absorption, hormone balance, and brain function. Focus on healthy unsaturated fats.</p>
                            </div>
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                                <h4 className="font-black text-sm uppercase tracking-wide text-emerald-600 dark:text-emerald-400 mb-2">Fiber</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">Supports digestive health, maintains stable blood sugar levels, and promotes healthy weight management.</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xl font-black uppercase tracking-wide text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                            <Gem size={24} className="text-slate-500" />
                            Minerals
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                                <h4 className="font-black text-sm uppercase tracking-wide text-slate-700 dark:text-slate-300 mb-2">Calcium & Phosphorus</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">Build and maintain strong bones and teeth. Essential for muscle function and nerve transmission.</p>
                            </div>
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                                <h4 className="font-black text-sm uppercase tracking-wide text-sky-600 dark:text-sky-400 mb-2">Potassium & Sodium</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">Regulate fluid balance, blood pressure, and heart rhythm. Critical for proper nerve and muscle function.</p>
                            </div>
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                                <h4 className="font-black text-sm uppercase tracking-wide text-purple-600 dark:text-purple-400 mb-2">Iron & Zinc</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">Support oxygen transport, immune function, and wound healing. Crucial for energy production.</p>
                            </div>
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                                <h4 className="font-black text-sm uppercase tracking-wide text-cyan-600 dark:text-cyan-400 mb-2">Magnesium</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">Supports muscle relaxation, nerve function, and energy production. Important for heart health.</p>
                            </div>
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                                <h4 className="font-black text-sm uppercase tracking-wide text-rose-600 dark:text-rose-400 mb-2">Copper & Manganese</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">Aid in bone formation, metabolism, and antioxidant defense. Support collagen synthesis.</p>
                            </div>
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                                <h4 className="font-black text-sm uppercase tracking-wide text-pink-600 dark:text-pink-400 mb-2">Selenium</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">Powerful antioxidant that protects cells from damage. Supports thyroid function and immunity.</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xl font-black uppercase tracking-wide text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                            <Battery size={24} className="text-yellow-500" />
                            Vitamins
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                                <h4 className="font-black text-sm uppercase tracking-wide text-blue-600 dark:text-blue-400 mb-2">B Vitamins</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">Essential for energy metabolism, nervous system function, and red blood cell formation. Support brain health and stress management.</p>
                            </div>
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                                <h4 className="font-black text-sm uppercase tracking-wide text-orange-600 dark:text-orange-400 mb-2">Vitamin A</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">Critical for vision, immune function, and skin health. Supports cellular growth and development.</p>
                            </div>
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                                <h4 className="font-black text-sm uppercase tracking-wide text-yellow-600 dark:text-yellow-400 mb-2">Vitamin C</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">Powerful antioxidant that boosts immunity and collagen production. Enhances iron absorption and supports wound healing.</p>
                            </div>
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                                <h4 className="font-black text-sm uppercase tracking-wide text-yellow-500 dark:text-yellow-300 mb-2">Vitamin D</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">Regulates calcium absorption for bone health. Supports immune function and mood regulation.</p>
                            </div>
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                                <h4 className="font-black text-sm uppercase tracking-wide text-emerald-600 dark:text-emerald-400 mb-2">Vitamin E</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">Antioxidant that protects cells from oxidative stress. Supports immune function and skin health.</p>
                            </div>
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                                <h4 className="font-black text-sm uppercase tracking-wide text-green-700 dark:text-green-400 mb-2">Vitamin K</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">Essential for blood clotting and bone metabolism. Supports cardiovascular health and calcium regulation.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
