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
                "cursor-pointer flex flex-col items-center justify-center gap-1 rounded-xl border p-4 transition-all hover:scale-[1.02]",
                selected
                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            )}
        >
            <Icon className={cn("h-6 w-6 mb-1", selected ? "text-emerald-500" : "text-slate-400")} />
            <span className="text-xs font-bold uppercase tracking-tight text-center">{label || type.replace('-', ' ')}</span>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto animate-in fade-in duration-500 px-4 py-8">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Main Content (Scrollable) */}
                <div className="flex-1 w-full space-y-12 pb-24">
                    <div className="grid grid-cols-1 gap-12">
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
                                        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 h-10 mt-2">
                                            <button
                                                onClick={() => setFormData({ ...formData, gender: 'male' })}
                                                className={cn("flex-1 text-xs font-bold rounded-lg transition-all", formData.gender === 'male' ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-slate-400")}
                                            >
                                                M
                                            </button>
                                            <button
                                                onClick={() => setFormData({ ...formData, gender: 'female' })}
                                                className={cn("flex-1 text-xs font-bold rounded-lg transition-all", formData.gender === 'female' ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-slate-400")}
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
                            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-10 shadow-sm">
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

                {/* Sticky Sidebar: RDA Blueprint Preview */}
                <aside className="w-full lg:w-96 lg:sticky lg:top-24 space-y-6">
                    <div className="bg-slate-950 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                        {/* Background Decoration */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors duration-700" />

                        <div className="relative space-y-8">
                            <div className="flex items-center gap-4 text-blue-400">
                                <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 shadow-inner">
                                    <Fingerprint size={28} />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black uppercase tracking-[0.2em] italic">Genetic Blueprint</h2>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Live RDA Calculation</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 pr-1">
                                {Object.entries(userRDAs || {}).filter(([k]) => !['calories', 'energy_kj'].includes(k.toLowerCase())).map(([nutrient, value]) => {
                                    const unit = (nutrient === 'Vitamin D') ? 'IU' : (nutrient.includes('Folate') || nutrient.includes('B12') || nutrient.includes('Biotin') || nutrient.includes('Selenium') || nutrient === 'Vitamin A' || nutrient === 'Vitamin K') ? 'µg' : 'mg';
                                    return (
                                        <div key={nutrient} className="bg-slate-900/50 border border-slate-800/50 p-1.5 rounded-lg flex flex-col items-center justify-center text-center hover:border-blue-500/30 transition-all hover:bg-slate-900 group/item aspect-square">
                                            <p className="text-[7px] uppercase font-black text-slate-500 group-hover/item:text-slate-400 transition-colors leading-none mb-1 line-clamp-2">{nutrient}</p>
                                            <div className="flex items-baseline gap-0.5">
                                                <span className="text-xs font-black text-slate-200 tracking-tighter italic">{value}</span>
                                                <span className="text-[6px] font-black text-slate-600 uppercase tracking-widest">{unit}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="pt-6 border-t border-slate-800">
                                <div className="flex items-center justify-between px-1">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Calculation Status</span>
                                        <div className="flex items-center gap-2">
                                            <span className="flex h-2 w-2 relative">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                            </span>
                                            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-emerald-500 italic">Analysis Active</span>
                                        </div>
                                    </div>
                                    <Dumbbell size={24} className="text-slate-800 opacity-50" />
                                </div>
                            </div>
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
