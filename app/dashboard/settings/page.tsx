'use client';

import React from 'react';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { useTheme } from 'next-themes';
import {
    Settings,
    Zap,
    Scale,
    Flame,
    BarChart3,
    Divide,
    Activity,
    Moon,
    Sun,
    Monitor,
    Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const {
        energyUnit,
        setEnergyUnit,
        measurementUnit,
        setMeasurementUnit,
        nutrientDisplayMode,
        setNutrientDisplayMode,
    } = useUserPreferences();

    const handleSave = async () => {
        toast.success('Preferences updated successfully!');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-2">
                        <Settings size={28} className="text-emerald-500" />
                        <h1 className="text-3xl font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">Settings</h1>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Customize your preferences and interface</p>
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

                {/* Save Button */}
                <div className="flex justify-center pt-8">
                    <Button
                        onClick={handleSave}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 h-12 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 text-xs uppercase tracking-widest"
                    >
                        <Save size={16} />
                        Save
                    </Button>
                </div>
            </div>
        </div>
    );
}
