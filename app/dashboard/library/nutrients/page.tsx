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
    { id: 'energy_kcal', label: 'Energy', unit: 'kcal', color: 'bg-amber-500', icon: Zap },
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
    const MINERALS = ['Sodium', 'Potassium', 'Magnesium', 'Calcium', 'Phosphorus', 'Iron', 'Zinc', 'Copper', 'Manganese', 'Selenium'];
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
            <div className="flex-1 space-y-12 p-4 md:p-8 pb-24 max-w-3xl mx-auto w-full">
                {/* Advisory Card */}
                <section className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 bg-emerald-500/20 p-3 rounded-2xl text-emerald-500">
                            <Sparkles size={24} className="stroke-[2.5]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white italic">Explore Essential Nutrients</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Learn About Your Health</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-950 rounded-3xl p-8 shadow-sm relative overflow-hidden before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-gradient-to-b before:from-emerald-500 before:to-emerald-500/50">
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            Click on the <span className="font-bold">Macros</span>, <span className="font-bold">Minerals</span>, or <span className="font-bold">Vitamins</span> filters above to discover detailed information about each nutrient, including recommended daily intake, food sources, health benefits, and more.
                        </p>
                    </div>
                </section>

                {/* Essential Nutrients Guide */}
                <div className="space-y-8 prose prose-invert max-w-none">
                    {/* Understanding Essential Nutrients */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 bg-emerald-500/20 p-3 rounded-2xl text-emerald-500">
                                <Activity size={24} className="stroke-[2.5]" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white italic">Understanding Essential Nutrients</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">The Basics</p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-950 rounded-3xl p-8 space-y-4 shadow-sm relative overflow-hidden before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-gradient-to-b before:from-emerald-500 before:to-emerald-500/50">
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base">
                                Essential nutrients are substances your body needs but cannot make on its own. Think of them like ingredients your body needs daily to work properly. Without them, your body can't do basic things like get energy, build muscle, fight infections, or think clearly.
                            </p>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base">
                                There are six main groups of nutrients: carbohydrates (energy), proteins (building material), fats (hormone and energy support), vitamins (help with body functions), minerals (strengthen bones and regulate body processes), and water. We need all of them to stay healthy.
                            </p>
                        </div>
                    </section>

                    {/* Why Minerals Matter */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 bg-emerald-500/20 p-3 rounded-2xl text-emerald-500">
                                <Gem size={24} className="stroke-[2.5]" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white italic">Why Minerals Matter</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Building Blocks of Health</p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-950 rounded-3xl p-8 space-y-4 shadow-sm relative overflow-hidden before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-gradient-to-b before:from-emerald-500 before:to-emerald-500/50">
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base">
                                Minerals are natural substances found in foods that your body needs to function. Common minerals like calcium, magnesium, iron, and potassium do important jobs: calcium makes bones strong, iron carries oxygen in your blood, potassium keeps your heart beating properly, and magnesium helps your muscles relax.
                            </p>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base">
                                Without enough minerals, your body struggles. For example, if you don't get enough iron, you feel tired and weak. If you don't get enough calcium, your bones become weak and fragile. The good news is that eating a variety of foods—vegetables, whole grains, nuts, and beans—gives you the minerals you need to feel your best and stay healthy.
                            </p>
                        </div>
                    </section>

                    {/* The Vital Role of Vitamins */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 bg-emerald-500/20 p-3 rounded-2xl text-emerald-500">
                                <Battery size={24} className="stroke-[2.5]" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white italic">The Vital Role of Vitamins</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Essential Compounds</p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-950 rounded-3xl p-8 space-y-4 shadow-sm relative overflow-hidden before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-gradient-to-b before:from-emerald-500 before:to-emerald-500/50">
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base">
                                Vitamins are organic compounds that keep your body running smoothly. They help turn food into energy, boost your immune system, heal wounds, and protect your cells from damage. There are 13 essential vitamins your body can't do without.
                            </p>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base">
                                Think of vitamins like the spark plugs in a car—they make things happen. Vitamin C helps you fight colds and makes your skin glow. B vitamins give you energy and keep your brain working well. Vitamin D helps your body absorb calcium and keeps you feeling happy. Without the right vitamins, you get tired, get sick more often, and don't feel like yourself. Eating fruits, vegetables, and whole foods makes sure you get all the vitamins you need.
                            </p>
                        </div>
                    </section>

                    {/* Macronutrients */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 bg-emerald-500/20 p-3 rounded-2xl text-emerald-500">
                                <Zap size={24} className="stroke-[2.5]" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white italic">Macronutrients: Your Body's Fuel</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Energy & Structure</p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-950 rounded-3xl p-8 space-y-4 shadow-sm relative overflow-hidden before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-gradient-to-b before:from-emerald-500 before:to-emerald-500/50">
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base">
                                Macronutrients are the big three: carbs, proteins, and fats. You need them in larger amounts because they provide energy and build your body. Carbs are your brain's favorite fuel—they give you energy to think and move. Proteins build your muscles, skin, and hair. Fats help your brain work, protect your organs, and help your body absorb vitamins.
                            </p>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base">
                                Fiber is also important—it helps your digestion work smoothly, keeps your blood sugar stable, and makes you feel full longer. The secret to good health is eating the right balance of all these nutrients. That's where this tool comes in handy. By exploring individual nutrients, you'll learn which foods give you what you need, so you can eat smart and feel great.
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
