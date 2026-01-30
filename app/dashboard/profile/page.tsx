'use client';

import React, { useState } from 'react';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import {
    User,
    Settings,
    Zap,
    Scale,
    Flame,
    TrendingDown,
    Activity,
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
    ChefHat,
    Library,
    Plus,
    Calendar
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function ProfilePage() {
    const {
        profile,
        updateProfile,
        energyUnit,
        setEnergyUnit,
        measurementUnit,
        setMeasurementUnit
    } = useUserPreferences();
    const { theme, setTheme } = useTheme();
    const router = useRouter();

    const [formData, setFormData] = useState({
        ...profile,
        exclusions: profile.exclusions || []
    });

    const handleSave = () => {
        updateProfile(formData);
        toast.success("Profile updated successfully!");
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
        <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500">
            {/* Hero Section */}
            <div className="relative h-48 rounded-[2.5rem] bg-indigo-600 overflow-hidden flex items-center px-12 group">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1511367461989-f85a21fda167?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')] bg-cover bg-center mix-blend-overlay opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600/50 mix-blend-multiply opacity-50" />

                <div className="relative z-10 space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                            <User className="text-white" size={24} />
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-white uppercase italic">Laboratory Profile</h1>
                    </div>
                    <p className="text-indigo-50 font-medium max-w-md text-sm pl-1 uppercase tracking-tighter">
                        Manage your biometrics, diet protocols, and interface settings.
                    </p>
                </div>

                <div className="absolute right-12 top-1/2 -translate-y-1/2 flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">Active DNA Protocol</p>
                        <p className="text-3xl font-black text-white leading-none tracking-tighter italic uppercase">
                            {formData.dietType}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            onClick={() => router.push('/dashboard/plan')}
                            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md shadow-xl gap-2 px-4 h-11 rounded-xl font-black uppercase tracking-widest group/btn transition-all text-[10px]"
                        >
                            <Calendar size={14} className="group-hover/btn:scale-110 transition-transform" />
                            Plan Meals
                        </Button>
                        <Button
                            onClick={() => router.push('/dashboard/recipes')}
                            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md shadow-xl gap-2 px-4 h-11 rounded-xl font-black uppercase tracking-widest group/btn transition-all text-[10px]"
                        >
                            <ChefHat size={14} className="group-hover/btn:scale-110 transition-transform" />
                            Recipes Hub
                        </Button>
                        <Button
                            onClick={() => router.push('/dashboard/food')}
                            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md shadow-xl gap-2 px-4 h-11 rounded-xl font-black uppercase tracking-widest group/btn transition-all text-[10px]"
                        >
                            <Plus size={14} className="group-hover/btn:rotate-90 transition-transform" />
                            Add Food
                        </Button>
                        <Button
                            onClick={() => router.push('/dashboard/foods')}
                            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md shadow-xl gap-2 px-4 h-11 rounded-xl font-black uppercase tracking-widest group/btn transition-all text-[10px]"
                        >
                            <Library size={14} className="group-hover/btn:scale-110 transition-transform" />
                            Foods Hub
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto space-y-12">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Basic Info */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-2 text-emerald-500 mb-2">
                            <User size={20} />
                            <h2 className="text-sm font-black uppercase tracking-[0.2em]">Identification</h2>
                        </div>
                        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Enter your full name"
                                    className="bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nickname</Label>
                                <Input
                                    value={formData.nickname}
                                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                                    placeholder="Codenames or nicknames"
                                    className="bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 rounded-xl"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Units & Energy */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-2 text-emerald-500 mb-2">
                            <Settings size={20} />
                            <h2 className="text-sm font-black uppercase tracking-[0.2em]">Preferences</h2>
                        </div>
                        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-8">
                            {/* Energy Unit */}
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Energy Measurement</Label>
                                <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
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
                                <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
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

                            {/* Theme */}
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Interface Theme</Label>
                                <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
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

                {/* Diet Profile */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2 text-emerald-500 mb-2">
                        <Utensils size={20} />
                        <h2 className="text-sm font-black uppercase tracking-[0.2em]">Dietary & Biometric Profile</h2>
                    </div>
                    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-10">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1 block">Gender</Label>
                                <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 h-10 mt-2">
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

                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Biological Goal</Label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <GoalCard type="lose-fat" label="Lose Fat" selected={formData.goal === 'lose-fat'} onClick={() => setFormData({ ...formData, goal: 'lose-fat' })} icon={TrendingDown} />
                                <GoalCard type="maintain" label="Maintain" selected={formData.goal === 'maintain'} onClick={() => setFormData({ ...formData, goal: 'maintain' })} icon={Activity} />
                                <GoalCard type="build-muscle" label="Build Muscle" selected={formData.goal === 'build-muscle'} onClick={() => setFormData({ ...formData, goal: 'build-muscle' })} icon={Dumbbell} />
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
                                                    : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                                            )}
                                        >
                                            {exclusion}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-[10px] text-slate-400 italic">These items will be marked as "Excluded" even if the meal otherwise fits your diet.</p>
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
                    </div>
                </section>

                {/* Save Button */}
                <div className="flex justify-end pt-8">
                    <Button
                        onClick={handleSave}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-6 rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 text-lg"
                    >
                        <Save size={20} />
                        Save Profile
                    </Button>
                </div>
            </div>
        </div>
    );
}
