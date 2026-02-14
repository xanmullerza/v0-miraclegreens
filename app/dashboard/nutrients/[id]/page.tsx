'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
    Heart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { nutrientInfo, NutrientInfo } from '@/lib/data/nutrient-info';
import { supabase } from '@/lib/supabase';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { useRDA } from '@/hooks/use-rda';

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm", className)}>
        {children}
    </div>
);

export default function NutrientDetailsPage() {
    const router = useRouter();
    const { id } = useParams();
    const nutrientId = decodeURIComponent(id as string);
    const info = nutrientInfo[nutrientId];
    const { profile, dailyTargets, energyUnit } = useUserPreferences();

    // Context-aware RDAs
    const userRDAs = useRDA(
        typeof profile.age === 'number' ? profile.age : 30,
        profile.gender || 'female',
        dailyTargets.energy || 2000
    );

    const [favorites, setFavorites] = useState<string[]>([]);
    const [topFoods, setTopFoods] = useState<any[]>([]);
    const [loadingFoods, setLoadingFoods] = useState(true);

    // --- Simulation Logic ---
    let targetVal = 0;
    let unit = 'mg';

    if (info) {
        if (nutrientId === 'Energy') {
            targetVal = energyUnit === 'kJ' ? dailyTargets.energy * 4.184 : dailyTargets.energy;
            unit = energyUnit;
        } else if (nutrientId === 'Protein') {
            targetVal = dailyTargets.protein;
            unit = 'g';
        } else if (nutrientId === 'Carbs') {
            targetVal = dailyTargets.carbs;
            unit = 'g';
        } else if (nutrientId === 'Fat') {
            targetVal = dailyTargets.fat;
            unit = 'g';
        } else if (userRDAs?.[nutrientId]) {
            targetVal = userRDAs[nutrientId];
            if (nutrientId === 'Vitamin D') unit = 'IU';
            else if (nutrientId.includes('Folate') || nutrientId.includes('B12') || nutrientId.includes('Biotin') || nutrientId.includes('Selenium') || nutrientId === 'Vitamin A' || nutrientId === 'Vitamin K' || nutrientId.includes('µg')) unit = 'µg';
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
        if (nutrientId === 'Protein') rawUL = (dailyTargets.energy * percent) / 4;
        else if (nutrientId === 'Carbs') rawUL = (dailyTargets.energy * percent) / 4;
        else if (nutrientId === 'Fat') rawUL = (dailyTargets.energy * percent) / 9;
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

    useEffect(() => {
        if (info) {
            fetchTopFoods();
        }
    }, [nutrientId]);

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

            const col = columnMap[nutrientId] || nutrientId.toLowerCase().replace(/ /g, '_').replace(/[()]/g, '');

            // Try to find foods high in this nutrient, but exclude herbs/spices/supplements for "practical" diet additions
            const { data, error } = await supabase
                .from('food_items')
                .select('id, name, common_name, image, ' + col + ', category')
                .not(col, 'is', null)
                .not('category', 'in', '(Flavour,Supplements)')
                .order(col, { ascending: false })
                .limit(6);

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
                        .filter(f => f.micronutrients && f.micronutrients[nutrientId] !== undefined)
                        .sort((a, b) => (b.micronutrients[nutrientId] || 0) - (a.micronutrients[nutrientId] || 0))
                        .slice(0, 6);
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
                <Button onClick={() => router.push('/dashboard/nutrients')} className="rounded-full px-8 bg-emerald-600">
                    Back to Library
                </Button>
            </div>
        );
    }

    const dynamicMax = Math.max(targetVal, effectiveUL) * 1.5;

    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700 pt-8 px-4">
            {/* Nav */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-bold text-sm transition-colors group"
            >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                Back
            </button>

            {/* Header / Hero with Intake Readout */}
            <div className="flex flex-col lg:flex-row gap-8 lg:items-center">
                {/* Fixed Readout Square */}
                <div className={cn(
                    "w-full lg:w-48 h-48 rounded-[2.5rem] border-2 transition-all duration-700 flex flex-col items-center justify-center shadow-2xl flex-shrink-0 animate-in fade-in zoom-in duration-1000",
                    isDeficient ? "bg-amber-50 border-amber-300 text-amber-800 shadow-amber-200/50" :
                        isToxic ? "bg-rose-50 border-rose-300 text-rose-800 shadow-rose-200/50" :
                            "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-emerald-500/10"
                )}>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Intake</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-black italic tracking-tighter">
                            {simValue >= 100 ? Math.round(simValue) : simValue.toFixed(1)}
                        </span>
                        <span className="text-sm font-black uppercase">{unit}</span>
                    </div>
                    <div className={cn(
                        "mt-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5",
                        isDeficient ? "bg-amber-500 text-white" :
                            isToxic ? "bg-rose-600 text-white" :
                                "bg-emerald-600 text-white"
                    )}>
                        {isDeficient ? "⚠️ Deficit" : isToxic ? "☢️ Toxicity" : "✅ Optimal"}
                    </div>
                </div>

                {/* Title & Description */}
                <div className="space-y-6 flex-grow">
                    <div>
                        <h1 className="text-6xl lg:text-8xl font-black text-emerald-600 dark:text-emerald-400 mb-4 uppercase tracking-tighter italic leading-none">
                            {nutrientId}
                        </h1>
                        <p className="text-xl lg:text-2xl text-slate-400 italic leading-relaxed font-medium">
                            "{info.description}"
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Button
                            onClick={toggleFavorite}
                            variant="outline"
                            className={cn(
                                "rounded-2xl h-12 px-6 font-black uppercase tracking-widest text-[10px] gap-2 border-slate-200 dark:border-slate-800 transition-all shadow-sm",
                                isFav ? "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400" : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
                            )}
                        >
                            <Heart size={18} fill={isFav ? "currentColor" : "none"} />
                            {isFav ? "Favorited" : "Favorite"}
                        </Button>
                        <div className="px-5 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                            <Zap size={16} />
                            Health Knowledge Base
                        </div>
                    </div>
                </div>
            </div>

            {/* Dose Simulator Section - Just Slider */}
            <div className="space-y-6 pt-4">
                <div className="flex items-center justify-between px-2">
                    <div className="space-y-1">
                        <h4 className="font-black text-[11px] uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">Clinical Dose Simulator</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Slide to simulate intake levels and see biological thresholds</p>
                    </div>
                </div>

                <div className="space-y-12">
                    {/* Simulator Interface */}
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
                                    if (nutrientId === 'Magnesium') return "Nature’s Magnesium is 100% safe. You can’t consume too many seeds or greens—your body handles them perfectly. Only concentrated pills carry a risk of over-doing it.";
                                    if (nutrientId === 'Sodium') return "The salt naturally found inside foods like celery or meat is totally safe. The real danger is almost always from added table salt and factory-made snacks, not the food itself.";
                                    if (nutrientId === 'Vitamin A') return "Carrots and leafy greens are always safe. Your body only has trouble with 'pre-made' Vitamin A from things like animal liver or high-dose supplements.";
                                    if (nutrientId === 'Vitamin K') return "Eat as much as you like! There is no known way to eat too much Vitamin K from natural foods like kale or spinach. Your body handles it all beautifully.";
                                    if (nutrientId === 'Potassium') return "Healthy bodies are experts at balancing potassium. Unless you have specific kidney issues, your body safely flushes out what it doesn't need from your diet.";
                                    if (nutrientId === 'Vitamin D') return "Sunlight and real food are safe. It’s almost impossible to get too much Vitamin D naturally. Hazards only happen with extremely high doses of synthetic pills.";
                                    if (hasNoUL) return "This nutrient is naturally safe. When you eat whole foods, your body knows exactly how to absorb what it needs and simply ignores the rest.";
                                    return `Whole foods are naturally balanced. Your body handles real food much better than it handles concentrated chemical supplements.`;
                                })()}
                            </p>
                        </div>
                    </div>

                    {/* Interactive Threshold Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                        {/* 1. Deficiency Box */}
                        <div className={cn(
                            "p-6 rounded-[2.5rem] border transition-all duration-700 relative overflow-hidden flex flex-col h-full",
                            isDeficient
                                ? "bg-amber-500 border-amber-400 shadow-2xl shadow-amber-500/40 text-white scale-[1.02] z-10"
                                : "bg-amber-50 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/30 opacity-40 grayscale"
                        )}>
                            <div className="space-y-4 flex-grow">
                                <div className="flex items-center justify-between">
                                    <h4 className={cn("font-black text-[10px] uppercase tracking-[0.2em]", isDeficient ? "text-white" : "text-amber-700 dark:text-amber-400")}>Deficiency</h4>
                                    {isDeficient && <Badge className="bg-white/20 text-white border-white/30 text-[8px] uppercase tracking-widest font-black">ACTIVE</Badge>}
                                </div>
                                <div className="space-y-3">
                                    <p className={cn("text-[9px] font-black uppercase tracking-widest leading-none", isDeficient ? "text-amber-100" : "text-amber-600/50")}>Clinical Red Flags</p>
                                    <div className="flex flex-wrap gap-2">
                                        {info.deficiencySigns.map((s, i) => (
                                            <span key={i} className={cn(
                                                "text-[8px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg border",
                                                isDeficient ? "bg-amber-400 border-amber-300 text-white" : "bg-white dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-800"
                                            )}>
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Optimal Intake Box (Replacing Key Benefits) */}
                        <div className={cn(
                            "p-6 rounded-[2.5rem] border transition-all duration-700 relative overflow-hidden flex flex-col h-full",
                            isOptimal
                                ? "bg-emerald-600 border-emerald-400 shadow-2xl shadow-emerald-600/40 text-white scale-[1.02] z-10"
                                : "bg-emerald-50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30 opacity-40 grayscale"
                        )}>
                            <div className="space-y-4 flex-grow">
                                <div className="flex items-center justify-between">
                                    <h4 className={cn("font-black text-[10px] uppercase tracking-[0.2em]", isOptimal ? "text-white" : "text-emerald-700 dark:text-emerald-400")}>Optimal Intake</h4>
                                    {isOptimal && <Badge className="bg-white/20 text-white border-white/30 text-[8px] uppercase tracking-widest font-black">PEAK ZONE</Badge>}
                                </div>
                                <div className="space-y-3">
                                    <p className={cn("text-[9px] font-black uppercase tracking-widest leading-none", isOptimal ? "text-emerald-100" : "text-emerald-600/50")}>Biological Benefits</p>
                                    <div className="flex flex-wrap gap-2">
                                        {info.benefits.map((b, i) => (
                                            <span key={i} className={cn(
                                                "text-[8px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg border",
                                                isOptimal ? "bg-emerald-500 border-emerald-400 text-white" : "bg-white dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800"
                                            )}>
                                                {b}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Excessive Intake Box */}
                        <div className={cn(
                            "p-6 rounded-[2.5rem] border transition-all duration-700 relative overflow-hidden flex flex-col h-full",
                            isToxic
                                ? "bg-rose-600 border-rose-400 shadow-2xl shadow-rose-600/40 text-white scale-[1.02] z-10"
                                : "bg-rose-50 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/30 opacity-40 grayscale"
                        )}>
                            <div className="space-y-4 flex-grow">
                                <div className="flex items-center justify-between">
                                    <h4 className={cn("font-black text-[10px] uppercase tracking-[0.2em]", isToxic ? "text-white" : "text-rose-700 dark:text-rose-400")}>
                                        {isSupplementalUL ? "Suppl. Hazard" : hasNoUL ? "Food Safety" : "Toxicity"}
                                    </h4>
                                    {isToxic && <Badge className="bg-white/20 text-white border-white/30 text-[8px] uppercase tracking-widest font-black">CRITICAL</Badge>}
                                </div>
                                <div className="space-y-3">
                                    <p className={cn("text-[9px] font-black uppercase tracking-widest leading-none", isToxic ? "text-rose-100" : "text-rose-600/50")}>Toxicity Symptoms</p>
                                    <div className="flex flex-wrap gap-2">
                                        {(info.toxicitySymptoms || ['No whole-food risks recorded.']).map((s, i) => (
                                            <span key={i} className={cn(
                                                "text-[8px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg border",
                                                isToxic ? "bg-rose-500 border-rose-400 text-white" : "bg-white dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-800"
                                            )}>
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Secondary Info Area */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-12 border-t border-slate-100 dark:border-slate-800">
                        <div className="space-y-6">
                            <h4 className="font-black text-[11px] uppercase tracking-[0.2em] text-slate-400">Biological Significance</h4>
                            <p className="text-xl font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic">
                                "{info.history} {info.importance}"
                            </p>
                        </div>

                        <div className="space-y-6">
                            <h4 className="font-black text-[11px] uppercase tracking-[0.2em] text-slate-400">Traditional Dietary Sources</h4>
                            <div className="flex flex-wrap gap-2">
                                {info.sources.map((s, i) => (
                                    <span key={i} className="text-[10px] bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 px-5 py-3 rounded-2xl font-black uppercase tracking-widest border border-slate-200 dark:border-slate-800 shadow-sm">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Top Food Sources */}
                    <div className="space-y-5">
                        <div className="flex items-center justify-between px-2">
                            <div className="space-y-1">
                                <h4 className="font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 leading-none">Natural Sources</h4>
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none">Ordered by nutrient richness (per 100g)</p>
                            </div>
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest underline cursor-pointer hover:text-emerald-600" onClick={() => router.push('/dashboard/ingredients')}>Browse Ingredients</span>
                        </div>
                        <div className="space-y-3">
                            {loadingFoods ? (
                                [1, 2, 3].map(i => <div key={i} className="h-16 w-full animate-pulse bg-slate-100 dark:bg-slate-800 rounded-3xl" />)
                            ) : topFoods.length > 0 ? (
                                topFoods.map((food: any) => (
                                    <button
                                        key={food.id}
                                        onClick={() => router.push(`/dashboard/ingredients/${food.id}`)}
                                        className="w-full flex items-center gap-4 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-emerald-500/50 hover:shadow-xl transition-all text-left group"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-950 overflow-hidden flex-shrink-0 border border-slate-100 dark:border-slate-800">
                                            {food.image ? (
                                                <img src={food.image} alt={food.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    <Beef size={20} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <p className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white truncate italic">
                                                {food.common_name || food.name}
                                            </p>
                                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">View Profile</p>
                                        </div>
                                        <ChevronRight size={18} className="text-slate-200 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                                    </button>
                                ))
                            ) : (
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No whole food sources identified.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
