'use client';

import React, { useState } from 'react';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { useTheme } from 'next-themes';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    User,
    Settings,
    Zap,
    Scale,
    Flame,
    TrendingDown,
    Plus,
    Calendar,
    ChefHat,
    Library,
    Activity,
    BarChart3,
    Divide,
    Dumbbell,
    Utensils,
    Egg,
    Leaf,
    Fish,
    Apple,
    Moon,
    Sun,
    Monitor,
    ChevronRight,
    Save,
    LogOut,
    Fingerprint,
    Info,
    ChevronDown
} from 'lucide-react';
import { useRDA } from '@/hooks/use-rda';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

function ProfilePageContent() {
    const {
        profile,
        updateProfile,
        energyUnit,
        setEnergyUnit,
        measurementUnit,
        setMeasurementUnit,
        nutrientDisplayMode,
        setNutrientDisplayMode
    } = useUserPreferences();
    const { theme, setTheme } = useTheme();
    const router = useRouter();
    const searchParams = useSearchParams();
    const from = searchParams.get('from');

    const [formData, setFormData] = useState({
        ...profile,
        exclusions: profile.exclusions || []
    });

    const userRDAs = useRDA(
        typeof formData.age === 'number' ? formData.age : 30,
        formData.gender || 'female',
        formData.goal === 'build-muscle' ? 3000 : formData.goal === 'lose-fat' ? 2000 : 2500
    );

    const handleSave = () => {
        updateProfile(formData);
        toast.success("Profile updated successfully!");
        if (from) {
            router.push(from);
        }
    };

    const GoalCard = ({ type, selected, onClick, icon: Icon, label }: { type: any, selected: boolean, onClick: () => void, icon: any, label?: string }) => (
        <div
            onClick={onClick}
            className={cn(
                "cursor-pointer flex flex-col items-center justify-center gap-0.5 rounded-xl border p-2.5 transition-all hover:scale-[1.02] text-center",
                selected
                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            )}
        >
            <Icon className={cn("h-4 w-4 mb-0.5", selected ? "text-emerald-500" : "text-slate-400")} />
            <span className="text-[10px] font-bold uppercase tracking-tight leading-tight">{label || type.replace('-', ' ')}</span>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto animate-in fade-in duration-500 px-4 py-8">
            <div className="flex flex-col lg:flex-row gap-6 items-start">
                {/* Main Content (Compact Settings) */}
                <div className="w-full lg:w-1/2 space-y-8 pb-24">
                    <div className="grid grid-cols-1 gap-8">
                        {/* Basic Info */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-2 text-emerald-500 mb-2">
                                <User size={20} />
                                <h2 className="text-sm font-black uppercase tracking-[0.2em]">Identification</h2>
                            </div>
                            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-6 shadow-sm">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Enter your full name"
                                        className="bg-slate-50/50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nickname</Label>
                                    <Input
                                        value={formData.nickname}
                                        onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                                        placeholder="Codenames or nicknames"
                                        className="bg-slate-50/50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl"
                                    />
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1 block">Gender</Label>
                                        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 h-8 mt-1">
                                            <button
                                                onClick={() => setFormData({ ...formData, gender: 'male' })}
                                                className={cn("flex-1 text-[10px] font-bold rounded-lg transition-all", formData.gender === 'male' ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-slate-400")}
                                            >
                                                M
                                            </button>
                                            <button
                                                onClick={() => setFormData({ ...formData, gender: 'female' })}
                                                className={cn("flex-1 text-[10px] font-bold rounded-lg transition-all", formData.gender === 'female' ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-slate-400")}
                                            >
                                                F
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1 block">Age</Label>
                                        <Input
                                            type="number"
                                            value={formData.age}
                                            onChange={(e) => setFormData({ ...formData, age: e.target.value ? Number(e.target.value) : '' })}
                                            className="bg-transparent border-none text-xl font-bold h-10 mt-1 focus-visible:ring-0 px-0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1 block">Weight ({measurementUnit === 'metric' ? 'kg' : 'lb'})</Label>
                                        <Input
                                            type="number"
                                            value={formData.weight}
                                            onChange={(e) => setFormData({ ...formData, weight: e.target.value ? Number(e.target.value) : '' })}
                                            className="bg-transparent border-none text-xl font-bold h-10 mt-1 focus-visible:ring-0 px-0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1 block">Height ({measurementUnit === 'metric' ? 'cm' : 'ft/in'})</Label>
                                        <Input
                                            type="number"
                                            value={formData.height}
                                            onChange={(e) => setFormData({ ...formData, height: e.target.value ? Number(e.target.value) : '' })}
                                            className="bg-transparent border-none text-xl font-bold h-10 mt-1 focus-visible:ring-0 px-0"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Diet Profile */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-2 text-emerald-500 mb-2">
                                <Utensils size={20} />
                                <h2 className="text-sm font-black uppercase tracking-[0.2em]">Dietary Profile</h2>
                            </div>
                            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-sm">
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Biological Goal</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <GoalCard type="lose-fat" label="Lose Fat" selected={formData.goal === 'lose-fat'} onClick={() => setFormData({ ...formData, goal: 'lose-fat' })} icon={TrendingDown} />
                                        <GoalCard type="maintain" label="Maintain" selected={formData.goal === 'maintain'} onClick={() => setFormData({ ...formData, goal: 'maintain' })} icon={Activity} />
                                        <GoalCard type="build-muscle" label="Build Muscle" selected={formData.goal === 'build-muscle'} onClick={() => setFormData({ ...formData, goal: 'build-muscle' })} icon={Dumbbell} />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Activity Level</Label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <GoalCard type="sedentary" label="Sedentary" selected={formData.activityLevel === 'sedentary'} onClick={() => setFormData({ ...formData, activityLevel: 'sedentary' })} icon={User} />
                                        <GoalCard type="light" label="Lightly Active" selected={formData.activityLevel === 'light'} onClick={() => setFormData({ ...formData, activityLevel: 'light' })} icon={ChevronRight} />
                                        <GoalCard type="moderate" label="Moderate" selected={formData.activityLevel === 'moderate'} onClick={() => setFormData({ ...formData, activityLevel: 'moderate' })} icon={Zap} />
                                        <GoalCard type="active" label="Very Active" selected={formData.activityLevel === 'active'} onClick={() => setFormData({ ...formData, activityLevel: 'active' })} icon={Flame} />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dietary Protocol</Label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <GoalCard type="anything" label="Balanced" selected={formData.dietType === 'anything'} onClick={() => setFormData({ ...formData, dietType: 'anything' })} icon={Apple} />
                                        <GoalCard type="pescatarian" label="Pescatarian" selected={formData.dietType === 'pescatarian'} onClick={() => setFormData({ ...formData, dietType: 'pescatarian' })} icon={Fish} />
                                        <GoalCard type="vegetarian" label="Vegetarian" selected={formData.dietType === 'vegetarian'} onClick={() => setFormData({ ...formData, dietType: 'vegetarian' })} icon={Egg} />
                                        <GoalCard type="vegan" label="Vegan" selected={formData.dietType === 'vegan'} onClick={() => setFormData({ ...formData, dietType: 'vegan' })} icon={Leaf} />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nutrient Strategy</Label>
                                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                                        <GoalCard type="balanced" label="Balanced" selected={formData.nutrientStrategy === 'balanced'} onClick={() => setFormData({ ...formData, nutrientStrategy: 'balanced' })} icon={Activity} />
                                        <GoalCard type="low-carb" label="Low Carb" selected={formData.nutrientStrategy === 'low-carb'} onClick={() => setFormData({ ...formData, nutrientStrategy: 'low-carb' })} icon={TrendingDown} />
                                        <GoalCard type="high-protein" label="High Protein" selected={formData.nutrientStrategy === 'high-protein'} onClick={() => setFormData({ ...formData, nutrientStrategy: 'high-protein' })} icon={Dumbbell} />
                                        <GoalCard type="keto" label="Keto Diet" selected={formData.nutrientStrategy === 'keto'} onClick={() => setFormData({ ...formData, nutrientStrategy: 'keto' })} icon={Zap} />
                                        <GoalCard type="high-carb" label="High Carb" selected={formData.nutrientStrategy === 'high-carb'} onClick={() => setFormData({ ...formData, nutrientStrategy: 'high-carb' })} icon={Apple} />
                                    </div>
                                    <p className="text-[10px] text-slate-400 italic">Adjusts your macro ratio targets (Energy/Protein/Carbs/Fat) across the entire app.</p>
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Specific Exclusions</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Eggs', 'Dairy', 'Honey', 'Nuts', 'Peanuts', 'Soy', 'Gluten', 'Shellfish', 'Fish', 'Corn', 'Nightshades'].map(exclusion => {
                                            const isSelected = formData.exclusions?.includes(exclusion);
                                            return (
                                                <button
                                                    key={exclusion}
                                                    onClick={() => {
                                                        const newExclusions = isSelected
                                                            ? formData.exclusions.filter(e => e !== exclusion)
                                                            : [...(formData.exclusions || []), exclusion];
                                                        setFormData({ ...formData, exclusions: newExclusions });
                                                    }}
                                                    className={cn(
                                                        "px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                                                        isSelected
                                                            ? "bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-500/20"
                                                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                                                    )}
                                                >
                                                    {exclusion}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="text-[10px] text-slate-400 italic">These items will be marked as "Excluded" even if the meal otherwise fits your diet.</p>
                                </div>
                            </div>
                        </section>

                        {/* Preferences */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-2 text-emerald-500 mb-2">
                                <Settings size={20} />
                                <h2 className="text-sm font-black uppercase tracking-[0.2em]">Preferences</h2>
                            </div>
                            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-8 shadow-sm">
                                {/* Energy Unit */}
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Energy Measurement</Label>
                                    <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                                        <button
                                            onClick={() => setEnergyUnit("kJ")}
                                            className={cn(
                                                "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all",
                                                energyUnit === "kJ" ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-slate-500"
                                            )}
                                        >
                                            <Zap size={14} /> Kilojoules (kJ)
                                        </button>
                                        <button
                                            onClick={() => setEnergyUnit("kcal")}
                                            className={cn(
                                                "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all",
                                                energyUnit === "kcal" ? "bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 shadow-sm" : "text-slate-500"
                                            )}
                                        >
                                            <Flame size={14} /> Calories (kcal)
                                        </button>
                                    </div>
                                </div>

                                {/* Measurement System */}
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Measurement System</Label>
                                    <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                                        <button
                                            onClick={() => setMeasurementUnit("metric")}
                                            className={cn(
                                                "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all",
                                                measurementUnit === "metric" ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-slate-500"
                                            )}
                                        >
                                            <Scale size={14} /> Metric (kg/cm)
                                        </button>
                                        <button
                                            onClick={() => setMeasurementUnit("imperial")}
                                            className={cn(
                                                "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all",
                                                measurementUnit === "imperial" ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-slate-500"
                                            )}
                                        >
                                            <Scale size={14} /> Imperial (lb/ft)
                                        </button>
                                    </div>
                                </div>

                                {/* Nutrient Display Mode */}
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Nutrient Display (App-wide)</Label>
                                    <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                                        <button
                                            onClick={() => setNutrientDisplayMode("value")}
                                            className={cn(
                                                "flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-black uppercase tracking-tight rounded-lg transition-all",
                                                nutrientDisplayMode === "value" ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-slate-500"
                                            )}
                                            title="Show raw nutrient values (e.g., 500mg)"
                                        >
                                            <BarChart3 size={12} /> Values
                                        </button>
                                        <button
                                            onClick={() => setNutrientDisplayMode("percentage")}
                                            className={cn(
                                                "flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-black uppercase tracking-tight rounded-lg transition-all",
                                                nutrientDisplayMode === "percentage" ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-slate-500"
                                            )}
                                            title="Show % of your personal RDA"
                                        >
                                            <Divide size={12} /> RDA %
                                        </button>
                                        <button
                                            onClick={() => setNutrientDisplayMode("both")}
                                            className={cn(
                                                "flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-black uppercase tracking-tight rounded-lg transition-all",
                                                nutrientDisplayMode === "both" ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-slate-500"
                                            )}
                                            title="Show both values and percentages"
                                        >
                                            <Activity size={12} /> Combined
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-slate-400 italic px-1">This setting affects how nutrition is displayed across all foods and recipes.</p>
                                </div>

                                {/* Theme */}
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Interface Theme</Label>
                                    <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                                        <button
                                            onClick={() => setTheme("light")}
                                            className={cn(
                                                "flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-black uppercase tracking-tight rounded-lg transition-all",
                                                theme === "light" ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-slate-500"
                                            )}
                                        >
                                            <Sun size={12} /> Light
                                        </button>
                                        <button
                                            onClick={() => setTheme("dark")}
                                            className={cn(
                                                "flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-black uppercase tracking-tight rounded-lg transition-all",
                                                theme === "dark" ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-slate-500"
                                            )}
                                        >
                                            <Moon size={12} /> Dark
                                        </button>
                                        <button
                                            onClick={() => setTheme("system")}
                                            className={cn(
                                                "flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-black uppercase tracking-tight rounded-lg transition-all",
                                                theme === "system" ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-slate-500"
                                            )}
                                        >
                                            <Monitor size={12} /> System
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-start pt-8 border-t border-slate-100 dark:border-slate-800">
                        <Button
                            onClick={handleSave}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-12 py-8 rounded-[2rem] shadow-2xl shadow-emerald-500/20 flex items-center gap-3 text-xl uppercase tracking-tighter italic"
                        >
                            <Save size={24} />
                            Commit Protocol Changes
                        </Button>
                    </div>
                </div>

                {/* Sticky Sidebar (Full-heightish Split) */}
                <aside className="w-full lg:w-1/2 lg:sticky lg:top-8 space-y-6">
                    <div className="bg-slate-950 border border-slate-800 rounded-[2.5rem] p-6 pt-7 shadow-2xl relative overflow-hidden group">
                        {/* Background Decoration */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors duration-700" />

                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 pr-1">
                            {(() => {
                                // 1. Calculate BMR (Mifflin-St Jeor)
                                const weight = Number(formData.weight) || 70;
                                const height = Number(formData.height) || 170;
                                const age = Number(formData.age) || 30;
                                const s = formData.gender === 'male' ? 5 : -161;
                                const bmr = (10 * weight) + (6.25 * height) - (5 * age) + s;

                                // 2. Apply Activity Factor
                                const activityFactors: Record<string, number> = {
                                    sedentary: 1.2,
                                    light: 1.375,
                                    moderate: 1.55,
                                    active: 1.725
                                };
                                const factor = activityFactors[formData.activityLevel || 'sedentary'] || 1.2;
                                let tdee = bmr * factor;

                                // 3. Adjust for Goal
                                if (formData.goal === 'lose-fat') tdee -= 500;
                                if (formData.goal === 'build-muscle') tdee += 500;
                                tdee = Math.max(tdee, 1200); // Floor safety

                                // Strategy Allocation
                                let pPct = 0.25, cPct = 0.45, fPct = 0.30;
                                switch (formData.nutrientStrategy) {
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

                                const combinedRDAs = { ...macroRDAs, ...(userRDAs || {}) };

                                return Object.entries(combinedRDAs).map(([nutrient, value]) => {
                                    const unit = (nutrient === 'Energy') ? energyUnit : (nutrient === 'Protein' || nutrient === 'Carbs' || nutrient === 'Fat' || nutrient === 'Fiber') ? 'g' : (nutrient === 'Vitamin D') ? 'IU' : (nutrient.includes('Folate') || nutrient.includes('B12') || nutrient.includes('Biotin') || nutrient.includes('Selenium') || nutrient === 'Vitamin A' || nutrient === 'Vitamin K') ? 'µg' : 'mg';

                                    const displayVal = value < 1 ? value.toFixed(2) : value < 10 ? value.toFixed(1) : Math.round(value);

                                    return (
                                        <div key={nutrient} className="bg-slate-900/50 border border-slate-800/50 px-4 py-3 rounded-2xl flex items-center justify-between hover:border-blue-500/30 transition-all hover:bg-slate-900 group/item">
                                            <p className="text-xs uppercase font-black text-slate-400 group-hover/item:text-slate-300 transition-colors leading-none truncate pr-2">{nutrient}</p>
                                            <div className="flex-shrink-0">
                                                <span className="text-lg font-black text-white tracking-tighter italic leading-none">{displayVal}</span>
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>

                    </div>
                </aside>
            </div>
        </div>
    );
}

export default function ProfilePage() {
    return (
        <React.Suspense fallback={
            <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
                <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading DNA Protocol...</p>
            </div>
        }>
            <ProfilePageContent />
        </React.Suspense>
    );
}
