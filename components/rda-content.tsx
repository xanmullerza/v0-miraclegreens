'use client';

import React, { useState } from 'react';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { useRDA } from '@/hooks/use-rda';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RDAContentProps {
    compact?: boolean;
    showBackButton?: boolean;
    onBack?: () => void;
}

export function RDAContent({ compact = false, showBackButton = false, onBack }: RDAContentProps) {
    const {
        profile,
        energyUnit,
        measurementUnit,
    } = useUserPreferences();

    // 1. Calculate BMR (Mifflin-St Jeor) - Formula expects metric (kg, cm)
    const weightVal = Number(profile.weight) || 70;
    const heightVal = Number(profile.height) || 170;

    // Convert to metric if needed
    const weight = measurementUnit === 'imperial' ? weightVal * 0.453592 : weightVal;
    const height = measurementUnit === 'imperial' ? heightVal * 2.54 : heightVal;

    const age = Number(profile.age) || 30;
    const gender = profile.gender || 'female';
    const s = gender === 'male' ? 5 : -161;
    const bmr = (10 * weight) + (6.25 * height) - (5 * age) + s;

    // 2. Apply Activity Factor
    const activityFactors: Record<string, number> = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725
    };
    const factor = activityFactors[profile.activityLevel || 'sedentary'] || 1.2;
    let tdee = bmr * factor;

    // 3. Adjust for Goal
    if (profile.goal === 'lose-fat') tdee -= 500;
    if (profile.goal === 'build-muscle') tdee += 500;
    tdee = Math.max(tdee, 1200); // Floor safety

    // Strategy Allocation
    let pPct = 0.25, cPct = 0.45, fPct = 0.30;
    switch (profile.nutrientStrategy) {
        case 'low-carb': pPct = 0.35; cPct = 0.15; fPct = 0.50; break;
        case 'high-protein': pPct = 0.40; cPct = 0.35; fPct = 0.25; break;
        case 'keto': pPct = 0.25; cPct = 0.05; fPct = 0.70; break;
        case 'high-carb': pPct = 0.20; cPct = 0.60; fPct = 0.20; break;
    }

    let proteinTarget, carbsTarget, fatTarget;
    if (age < 14) {
        proteinTarget = weight * 1.0;
        const remainingCals = tdee - (proteinTarget * 4);
        const macroRatioSum = cPct + fPct;
        carbsTarget = (remainingCals * (cPct / macroRatioSum)) / 4;
        fatTarget = (remainingCals * (fPct / macroRatioSum)) / 9;
    } else {
        proteinTarget = (tdee * pPct) / 4;
        carbsTarget = (tdee * cPct) / 4;
        fatTarget = (tdee * fPct) / 9;
    }

    const macroRDAs: Record<string, number> = {
        'Energy': energyUnit === 'kJ' ? tdee * 4.184 : tdee,
        'Protein': proteinTarget,
        'Carbs': carbsTarget,
        'Fat': fatTarget
    };

    const userRDAs = useRDA(age, gender, tdee, weight);
    const combinedRDAs = { ...macroRDAs, ...(userRDAs || {}) };

    const [showSafety, setShowSafety] = useState(false);

    return (
        <div className={cn(
            "flex flex-col h-full bg-slate-950",
            compact && "rounded-xl border border-slate-800"
        )}>
            {/* Header */}
            <div className="bg-gradient-to-br from-cyan-50/10 to-cyan-100/5 dark:from-cyan-950/30 dark:to-cyan-900/10 p-6 border-b border-cyan-500/20 flex items-center justify-between">
                <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic leading-none">Recommended Intake</h2>
                {showBackButton && onBack && (
                    <button
                        onClick={onBack}
                        className="p-2 rounded-lg hover:bg-cyan-500/10 transition-colors text-cyan-400 hover:text-cyan-300"
                    >
                        <ArrowLeft size={20} />
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                {/* View toggles */}
                <div className="mb-6">
                    <div className="flex bg-slate-900 p-1 rounded-2xl">
                        <button
                            onClick={() => setShowSafety(false)}
                            className={cn(
                                "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors",
                                !showSafety
                                    ? "bg-slate-800 text-cyan-400 shadow-lg"
                                    : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            Daily Targets
                        </button>
                        <button
                            onClick={() => setShowSafety(true)}
                            className={cn(
                                "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors",
                                showSafety
                                    ? "bg-slate-800 text-cyan-400 shadow-lg"
                                    : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            Safety Limits
                        </button>
                    </div>
                    <p className="mt-2 text-[8px] uppercase tracking-widest text-slate-400">
                        {showSafety ? 'Showing safety range (50%-200%)' : 'Showing daily targets'}
                    </p>
                </div>

                {(() => {
                    const categories = [
                        {
                            title: "Essential Macros",
                            nutrients: ['Energy', 'Protein', 'Carbs', 'Fat', 'Fiber', 'ALA', 'EPA + DHA']
                        },
                        {
                            title: "Minerals",
                            nutrients: ['Sodium', 'Potassium', 'Magnesium', 'Calcium', 'Phosphorus', 'Iron', 'Zinc', 'Selenium', 'Copper', 'Manganese']
                        },
                        {
                            title: "Vitamins & Choline",
                            nutrients: ['Vitamin A', 'Vitamin C', 'Vitamin D', 'Vitamin E', 'Vitamin K', 'B1 (Thiamine)', 'B2 (Riboflavin)', 'B3 (Niacin)', 'B5 (Pantothenic Acid)', 'B6 (Pyridoxine)', 'B7 (Biotin)', 'B9 (Folate)', 'B12 (Cobalamin)', 'Choline']
                        },
                        {
                            title: "Amino Acids",
                            nutrients: ['Histidine', 'Isoleucine', 'Leucine', 'Lysine', 'Methionine', 'Phenylalanine', 'Threonine', 'Tryptophan', 'Valine']
                        }
                    ];

                    return categories.map((cat, idx) => {
                        const availableNutrients = Object.entries(combinedRDAs).filter(([name]) => cat.nutrients.includes(name));
                        if (availableNutrients.length === 0) return null;

                        return (
                            <div key={idx} className="space-y-3 mb-6">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500/80 pl-1 font-sans">{cat.title}</h4>
                                <div className="space-y-1.5">
                                    {availableNutrients.map(([nutrient, value]) => {
                                        const unit = (nutrient === 'Energy') ? energyUnit : (nutrient === 'Protein' || nutrient === 'Carbs' || nutrient === 'Fat' || nutrient === 'Fiber' || nutrient === 'ALA' || nutrient.includes('_g') || cat.title === "Amino Acids") ? 'g' : (nutrient === 'Vitamin D') ? 'IU' : (nutrient.includes('Folate') || nutrient.includes('B12') || nutrient.includes('Biotin') || nutrient.includes('Selenium') || nutrient === 'Vitamin A' || nutrient === 'Vitamin K' || nutrient.includes('EPA')) ? 'µg' : 'mg';
                                        // compute display value depending on view
                                        let displayVal: string | number;
                                        if (showSafety) {
                                            // simple min-max: 50% to 200% of target
                                            const min = value * 0.5;
                                            const max = value * 2;
                                            const fmt = (v: number) => v < 1 ? v.toFixed(2) : v < 10 ? v.toFixed(1) : Math.round(v);
                                            displayVal = `${fmt(min)} - ${fmt(max)} ${unit}`;
                                        } else {
                                            displayVal = value < 1 ? value.toFixed(2) : value < 10 ? value.toFixed(1) : Math.round(value);
                                        }
                                        return (
                                            <div key={nutrient} className="bg-gradient-to-br from-cyan-50/5 to-cyan-100/[0.02] dark:from-cyan-950/20 dark:to-cyan-900/10 px-5 py-3 rounded-2xl flex items-center justify-between hover:bg-gradient-to-br hover:from-cyan-50/10 hover:to-cyan-100/5 dark:hover:from-cyan-950/30 dark:hover:to-cyan-900/20 transition-all group/item border border-cyan-500/10 hover:border-cyan-500/20">
                                                <div className="flex flex-col min-w-0 pr-2">
                                                    <p className="text-[11px] uppercase font-black text-slate-400 group-hover/item:text-slate-200 transition-colors leading-none font-sans">{nutrient}</p>
                                                    {['ALA', 'EPA', 'Histidine', 'Leucine', 'Isoleucine', 'Lysine', 'Methionine', 'Phenylalanine', 'Threonine', 'Tryptophan', 'Valine'].includes(nutrient) && (
                                                        <span className="text-[7px] text-cyan-500 font-black uppercase mt-1 tracking-widest font-sans">Constituent</span>
                                                    )}
                                                </div>
                                                <div className="flex items-baseline gap-1 font-sans">
                                                    <span className="text-sm font-black text-white tracking-tighter leading-none">{displayVal}</span>
                                                    {!showSafety && <span className="text-[9px] text-slate-500 font-black uppercase">{unit}</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    });
                })()}
            </div>


        </div>
    );
}
