'use client';

import React, { useState } from 'react';
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
    Scale
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { nutrientInfo, NutrientInfo } from '@/lib/data/nutrient-info';

const Card = ({ children, className, onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
    <div
        onClick={onClick}
        className={cn("bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm", className)}
    >
        {children}
    </div>
);
const NUTRIENT_CATEGORIES = [
    { title: "Macronutrients", icon: Zap, theme: "orange", keys: ['Energy', 'Protein', 'Carbs', 'Fat', 'Fiber'] },
    { title: "Electrolytes", icon: Droplet, theme: "indigo", keys: ['Potassium', 'Magnesium', 'Calcium', 'Sodium', 'Phosphorus'] },
    { title: "Trace Minerals", icon: Gem, theme: "rose", keys: ['Iron', 'Zinc', 'Selenium', 'Copper', 'Manganese'] },
    { title: "Vitamins", icon: Battery, theme: "emerald", keys: ['Vitamin A', 'B1 (Thiamine)', 'B2 (Riboflavin)', 'B3 (Niacin)', 'B5 (Pantothenic Acid)', 'B6 (Pyridoxine)', 'B9 (Folate)', 'B12 (Cobalamin)', 'Vitamin C', 'Vitamin D', 'Vitamin E', 'Vitamin K', 'Choline'] }
];

export default function NutrientsHub() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNutrient, setSelectedNutrient] = useState<string | null>(null);

    const filteredNutrients = Object.keys(nutrientInfo).filter(key =>
        key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        nutrientInfo[key].description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const themes = {
        orange: "text-orange-500 bg-orange-500/10 border-orange-500/20",
        indigo: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
        rose: "text-rose-500 bg-rose-500/10 border-rose-500/20",
        emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
            {/* Nav */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-bold text-sm transition-colors group"
                >
                    <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Dashboard
                </button>
            </div>

            {/* Hero Section */}
            <div className="relative h-64 rounded-[2.5rem] bg-slate-900 overflow-hidden flex items-center px-12 group">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576086213369-97a306d36557?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')] bg-cover bg-center mix-blend-overlay opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent" />

                <div className="relative z-10 space-y-4 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest">
                        <Zap size={12} className="fill-current" />
                        Biological Reference Hub
                    </div>
                    <h1 className="text-4xl lg:text-6xl font-black tracking-tighter text-white uppercase italic leading-[0.85]">
                        Nutrients <span className="text-amber-500 font-black">Library.</span>
                    </h1>
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

            {/* Search Bar */}
            <div className="max-w-xl mx-auto -mt-8 relative z-20">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                        <Search className="text-slate-400 group-focus-within:text-amber-500 transition-colors" size={20} />
                    </div>
                    <Input
                        type="text"
                        placeholder="Search nutrients, vitamins, minerals..."
                        className="w-full h-16 pl-14 pr-6 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-lg font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Content Sections */}
            {searchQuery ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-8">
                    {filteredNutrients.map(k => (
                        <NutrientSmallCard key={k} name={k} info={nutrientInfo[k]} onClick={() => setSelectedNutrient(k)} />
                    ))}
                </div>
            ) : (
                <div className="space-y-16 pt-8">
                    {NUTRIENT_CATEGORIES.map(cat => (
                        <div key={cat.title} className="space-y-6">
                            <div className="flex items-center gap-3 px-2">
                                <div className={cn("p-2 rounded-xl", (themes as any)[cat.theme])}>
                                    <cat.icon size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-tighter italic">{cat.title}</h2>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Biological Markers</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {cat.keys.filter(k => nutrientInfo[k]).map(k => (
                                    <NutrientSmallCard key={k} name={k} info={nutrientInfo[k]} onClick={() => setSelectedNutrient(k)} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Nutrient Detail Modal */}
            {selectedNutrient && nutrientInfo[selectedNutrient] && (
                <div
                    className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setSelectedNutrient(null)}
                >
                    <div
                        className="bg-white dark:bg-slate-900 rounded-[3rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl relative border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedNutrient(null)}
                            className="absolute top-8 right-8 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-all z-10"
                        >
                            <X size={24} />
                        </button>

                        <div className="p-10 lg:p-14 space-y-10">
                            {/* Header */}
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] font-black uppercase tracking-widest">
                                    <Activity size={10} className="fill-current" />
                                    Clinical Profile
                                </div>
                                <h3 className="text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-[0.85]">
                                    {selectedNutrient}
                                </h3>
                                <p className="text-xl font-medium text-slate-500 leading-relaxed italic border-l-4 border-amber-500 pl-6">
                                    "{nutrientInfo[selectedNutrient].description}"
                                </p>
                            </div>

                            {/* Main Body */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-8">
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Functional Role</h4>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                                            {nutrientInfo[selectedNutrient].importance}
                                        </p>
                                    </div>

                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Historical Context</h4>
                                        <p className="text-xs font-medium text-slate-500 leading-relaxed">
                                            {nutrientInfo[selectedNutrient].history}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Primary Benefits</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {nutrientInfo[selectedNutrient].benefits.map((b, i) => (
                                                <Badge key={i} className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl">
                                                    {b}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Deficiency Signals</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {nutrientInfo[selectedNutrient].deficiencySigns.map((s, i) => (
                                                <Badge key={i} className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl">
                                                    {s}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sources Section */}
                            <div className="pt-10 border-t border-slate-100 dark:border-slate-800">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Bio-Available Sources</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                    {nutrientInfo[selectedNutrient].sources.map((s, i) => (
                                        <div key={i} className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center hover:border-amber-500/50 transition-all cursor-default">
                                            <p className="text-[10px] font-black uppercase tracking-tighter truncate">{s}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function NutrientSmallCard({ name, info, onClick }: { name: string, info: NutrientInfo, onClick: () => void }) {
    return (
        <Card
            className="p-6 group hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300 cursor-pointer flex flex-col h-full active:scale-95 bg-white dark:bg-slate-900 overflow-hidden relative"
            onClick={onClick}
        >
            <div className="absolute top-0 right-0 p-4 opacity-5 bg-amber-500 rounded-bl-[3rem] group-hover:opacity-10 transition-opacity">
                <Zap size={40} />
            </div>

            <div className="space-y-4 flex-grow relative z-10">
                <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase tracking-widest border border-amber-500/20">
                    Marker
                </div>
                <h3 className="text-xl font-black uppercase tracking-tighter italic group-hover:text-amber-500 transition-colors">
                    {name}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium line-clamp-3">
                    {info.description}
                </p>
            </div>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800 relative z-10">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-amber-500 transition-colors">View Profile</span>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
            </div>
        </Card>
    );
}
