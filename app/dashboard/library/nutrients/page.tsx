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
                <div className="space-y-8 prose prose-invert max-w-none">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 md:p-10 space-y-6">
                        <h3 className="text-2xl font-black uppercase tracking-wide text-slate-900 dark:text-white">
                            Understanding Essential Nutrients
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base">
                            Essential nutrients are substances your body cannot produce on its own, so you must obtain them through food and supplements. These vital compounds are the building blocks of life, enabling your body to function optimally, maintain energy, support growth, and fight off disease. Without adequate nutrition, your body cannot perform basic functions like breathing, thinking, digesting food, or maintaining a healthy immune system.
                        </p>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base">
                            There are six main categories of essential nutrients: carbohydrates, proteins, fats, vitamins, minerals, and water. Each plays a unique and critical role in maintaining health, preventing disease, and allowing your body to perform at its best.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 md:p-10 space-y-6">
                        <h3 className="text-2xl font-black uppercase tracking-wide text-slate-900 dark:text-white">
                            Why Minerals Matter
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base">
                            Minerals are inorganic substances essential for countless bodily functions. These elemental compounds regulate nerve signals, support muscle contraction, maintain fluid balance, and strengthen bones and teeth. Calcium, magnesium, potassium, sodium, iron, zinc, and selenium are just a few of the critical minerals your body needs daily.
                        </p>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base">
                            Minerals work synergistically with other nutrients to support your cardiovascular system, metabolic processes, and immune defense. For example, iron carries oxygen throughout your blood, magnesium helps muscles relax and nerves communicate, and potassium regulates blood pressure and heart function. A deficiency in even one mineral can cascade into multiple health problems, which is why consuming a varied diet rich in mineral-dense foods is crucial for optimal health.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 md:p-10 space-y-6">
                        <h3 className="text-2xl font-black uppercase tracking-wide text-slate-900 dark:text-white">
                            The Vital Role of Vitamins
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base">
                            Vitamins are organic compounds that your body needs to function properly. Unlike minerals, vitamins can be broken down by heat or acid, so they're more delicate and require careful handling during food preparation. There are 13 essential vitamins that fall into two categories: water-soluble (B vitamins and vitamin C) and fat-soluble (vitamins A, D, E, and K).
                        </p>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base">
                            Vitamins serve as cofactors for hundreds of metabolic reactions in your body. They boost immunity, support energy production, promote wound healing, protect against cellular damage, and help convert food into usable energy. B vitamins, for instance, are critical for energy metabolism and nervous system function. Vitamin C strengthens your immune system and supports collagen production. Vitamin D regulates calcium absorption and influences gene expression. Vitamin deficiencies can lead to serious conditions like scurvy, beriberi, pellagra, and anemia—conditions that were once common but can easily be prevented through proper nutrition.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 md:p-10 space-y-6">
                        <h3 className="text-2xl font-black uppercase tracking-wide text-slate-900 dark:text-white">
                            Macronutrients: Your Body's Fuel and Structure
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base">
                            Macronutrients—carbohydrates, proteins, and fats—are needed in larger quantities because they provide energy and serve as structural components of cells. Carbohydrates are your brain and muscles' preferred fuel source. Proteins are building blocks for tissues, enzymes, and hormones. Fats support hormone production, insulate organs, and enable the absorption of fat-soluble vitamins. Fiber, though technically a carbohydrate, deserves special mention for its role in digestive health, blood sugar regulation, and maintaining healthy cholesterol levels.
                        </p>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base">
                            The key to good nutrition is balance. Consuming the right proportion of macronutrients alongside adequate micronutrients (vitamins and minerals) creates the foundation for vibrant health. This is where exploring individual nutrients becomes valuable—understanding each nutrient's role helps you make informed food choices that nourish your body completely.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
