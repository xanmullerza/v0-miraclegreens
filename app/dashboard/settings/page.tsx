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
    Eye,
    ShieldCheck,
    ExternalLink,
    Tag,
    Shapes
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { PageContainer } from '@/components/ui/page-container';

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const {
        energyUnit,
        setEnergyUnit,
        measurementUnit,
        setMeasurementUnit,
        nutrientDisplayMode,
        setNutrientDisplayMode,
        showHeroes,
        setShowHeroes,
        headerStyle,
        setHeaderStyle,
    } = useUserPreferences();


    const [user, setUser] = React.useState<any>(null);

    React.useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();
    }, []);

    const isAdmin = (user?.email || user?.user_metadata?.email || '').toLowerCase() === (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').toLowerCase();

    const handleSave = async () => {
        toast.success('Preferences updated successfully!');
    };

    return (
        <PageContainer maxWidth="max-w-2xl">
            <div className="animate-in fade-in duration-500 py-8">
                <div className="space-y-8 pb-32">
                {/* Admin Trigger */}
                {isAdmin && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-700">
                        <Button
                            asChild
                            variant="outline"
                            className="w-full bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-100 font-black h-16 rounded-[2rem] flex items-center justify-between px-8 group transition-all shadow-xl shadow-emerald-500/10"
                        >
                            <a href="https://www.yourtestsite.xyz/admin" target="_blank" rel="noopener noreferrer">
                                <div className="flex items-center gap-4">
                                    <div className="bg-emerald-500/20 p-2.5 rounded-2xl text-emerald-500 group-hover:bg-emerald-500/30 transition-colors">
                                        <ShieldCheck size={24} />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-sm font-black uppercase tracking-wider italic leading-none">Admin Terminal</h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Authorized Access Only</p>
                                    </div>
                                </div>
                                <div className="bg-slate-800 p-2 rounded-xl group-hover:bg-emerald-500/20 group-hover:text-emerald-500 transition-all">
                                    <ExternalLink size={16} />
                                </div>
                            </a>
                        </Button>
                    </div>
                )}

                {/* Measures Card */}
                <section className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 bg-yellow-500/20 p-3 rounded-2xl text-yellow-500">
                            <Scale size={24} className="stroke-[2.5]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white italic">Measures</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Units & Standards</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-950 rounded-3xl p-8 space-y-8 shadow-sm relative overflow-hidden before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-gradient-to-b before:from-yellow-500 before:to-yellow-500/50">
                        {/* Energy Unit */}
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Energy Measurement</Label>
                            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                                <button
                                    onClick={() => setEnergyUnit("kJ")}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all",
                                        energyUnit === "kJ" ? "bg-white dark:bg-slate-800 text-yellow-600 dark:text-yellow-400 shadow-sm" : "text-slate-500"
                                    )}
                                >
                                    <Zap size={14} /> Kilojoules (kJ)
                                </button>
                                <button
                                    onClick={() => setEnergyUnit("kcal")}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all",
                                        energyUnit === "kcal" ? "bg-white dark:bg-slate-800 text-yellow-600 dark:text-yellow-400 shadow-sm" : "text-slate-500"
                                    )}
                                >
                                    <Flame size={14} /> Calories (kcal)
                                </button>
                            </div>
                        </div>

                        {/* Measurement System */}
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Measurement System</Label>
                            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                                <button
                                    onClick={() => setMeasurementUnit("metric")}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all",
                                        measurementUnit === "metric" ? "bg-white dark:bg-slate-800 text-yellow-600 dark:text-yellow-400 shadow-sm" : "text-slate-500"
                                    )}
                                >
                                    <Scale size={14} /> Metric (kg/cm)
                                </button>
                                <button
                                    onClick={() => setMeasurementUnit("imperial")}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all",
                                        measurementUnit === "imperial" ? "bg-white dark:bg-slate-800 text-yellow-600 dark:text-yellow-400 shadow-sm" : "text-slate-500"
                                    )}
                                >
                                    <Scale size={14} /> Imperial (lb/ft)
                                </button>
                            </div>
                        </div>

                        {/* Nutrient Display Mode */}
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Nutrient Display (App-wide)</Label>
                            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                                <button
                                    onClick={() => setNutrientDisplayMode("value")}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-black uppercase tracking-tight rounded-lg transition-all",
                                        nutrientDisplayMode === "value" ? "bg-white dark:bg-slate-800 text-yellow-600 dark:text-yellow-400 shadow-sm" : "text-slate-500"
                                    )}
                                    title="Show raw nutrient values (e.g., 500mg)"
                                >
                                    <BarChart3 size={12} /> Values
                                </button>
                                <button
                                    onClick={() => setNutrientDisplayMode("percentage")}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-black uppercase tracking-tight rounded-lg transition-all",
                                        nutrientDisplayMode === "percentage" ? "bg-white dark:bg-slate-800 text-yellow-600 dark:text-yellow-400 shadow-sm" : "text-slate-500"
                                    )}
                                    title="Show % of your personal RDA"
                                >
                                    <Divide size={12} /> RDA %
                                </button>
                                <button
                                    onClick={() => setNutrientDisplayMode("both")}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-black uppercase tracking-tight rounded-lg transition-all",
                                        nutrientDisplayMode === "both" ? "bg-white dark:bg-slate-800 text-yellow-600 dark:text-yellow-400 shadow-sm" : "text-slate-500"
                                    )}
                                    title="Show both values and percentages"
                                >
                                    <Activity size={12} /> Combined
                                </button>
                            </div>
                            <p className="text-[9px] text-slate-400 italic px-1">This setting affects how nutrition is displayed across all foods and recipes.</p>
                        </div>
                    </div>
                </section>

                {/* Appearance Card */}
                <section className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 bg-yellow-500/20 p-3 rounded-2xl text-yellow-500">
                            <Monitor size={24} className="stroke-[2.5]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white italic">Appearance</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Interface & Theme</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-950 rounded-3xl p-8 space-y-8 shadow-sm relative overflow-hidden before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-gradient-to-b before:from-yellow-500 before:to-yellow-500/50">
                        {/* Show Heroes */}
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Dashboard Hero Sections</Label>
                            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                                <button
                                    onClick={() => setShowHeroes(true)}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-black uppercase tracking-tight rounded-lg transition-all",
                                        showHeroes ? "bg-white dark:bg-slate-800 text-yellow-600 dark:text-yellow-400 shadow-sm" : "text-slate-500"
                                    )}
                                    title="Show hero sections with welcome and overview"
                                >
                                    <Eye size={12} /> Show
                                </button>
                                <button
                                    onClick={() => setShowHeroes(false)}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-black uppercase tracking-tight rounded-lg transition-all",
                                        !showHeroes ? "bg-white dark:bg-slate-800 text-yellow-600 dark:text-yellow-400 shadow-sm" : "text-slate-500"
                                    )}
                                    title="Hide hero sections for experienced users"
                                >
                                    <Eye size={12} className="line-through" /> Hide
                                </button>
                            </div>
                            <p className="text-[9px] text-slate-400 italic px-1">For experienced users who prefer to go straight to the action grid.</p>
                        </div>

                        {/* Header Navigation Style */}
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Header Navigation</Label>
                            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                                <button
                                    onClick={() => setHeaderStyle('labels')}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-black uppercase tracking-tight rounded-lg transition-all",
                                        headerStyle === 'labels' ? "bg-white dark:bg-slate-800 text-yellow-600 dark:text-yellow-400 shadow-sm" : "text-slate-500"
                                    )}
                                    title="Show text labels in the header breadcrumb bar"
                                >
                                    <Tag size={12} /> Labels
                                </button>
                                <button
                                    onClick={() => setHeaderStyle('icons')}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-black uppercase tracking-tight rounded-lg transition-all",
                                        headerStyle === 'icons' ? "bg-white dark:bg-slate-800 text-yellow-600 dark:text-yellow-400 shadow-sm" : "text-slate-500"
                                    )}
                                    title="Show icons in the header breadcrumb bar"
                                >
                                    <Shapes size={12} /> Icons
                                </button>
                            </div>
                            <p className="text-[9px] text-slate-400 italic px-1">Switch between text labels and icons in the header breadcrumb bar.</p>
                        </div>

                        {/* Theme */}
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Interface Theme</Label>
                            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                                <button
                                    onClick={() => setTheme("light")}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-black uppercase tracking-tight rounded-lg transition-all",
                                        theme === "light" ? "bg-white dark:bg-slate-800 text-yellow-600 dark:text-yellow-400 shadow-sm" : "text-slate-500"
                                    )}
                                >
                                    <Sun size={12} /> Light
                                </button>
                                <button
                                    onClick={() => setTheme("dark")}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-black uppercase tracking-tight rounded-lg transition-all",
                                        theme === "dark" ? "bg-white dark:bg-slate-800 text-yellow-600 dark:text-yellow-400 shadow-sm" : "text-slate-500"
                                    )}
                                >
                                    <Moon size={12} /> Dark
                                </button>
                                <button
                                    onClick={() => setTheme("system")}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-black uppercase tracking-tight rounded-lg transition-all",
                                        theme === "system" ? "bg-white dark:bg-slate-800 text-yellow-600 dark:text-yellow-400 shadow-sm" : "text-slate-500"
                                    )}
                                >
                                    <Monitor size={12} /> System
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Save Button */}
                <div className="flex flex-col gap-4 justify-center pt-8 border-t border-slate-100 dark:border-slate-800">
                    <Button
                        onClick={handleSave}
                        className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-black px-8 h-12 rounded-xl shadow-lg shadow-yellow-500/30 flex items-center gap-2 text-xs uppercase tracking-widest"
                    >
                        <Save size={16} />
                        Save
                    </Button>
                </div>
            </div>
        </PageContainer>
    );
}
