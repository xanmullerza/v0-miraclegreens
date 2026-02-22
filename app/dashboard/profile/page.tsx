'use client';

import React, { useState } from 'react';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    User,
    Zap,
    Flame,
    TrendingDown,
    Plus,
    Calendar,
    ChefHat,
    Library,
    Activity,
    Dumbbell,
    Utensils,
    Egg,
    Leaf,
    Fish,
    Apple,
    ChevronRight,
    Save,
    LogOut,
    Fingerprint,
    Info,
    ChevronDown,
    X,
    Users
} from 'lucide-react';
import { PageContainer } from '@/components/ui/page-container';
import { useRDA } from '@/hooks/use-rda';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { type FamilyMember } from '@/lib/context/user-preferences-context';
import { GoalType, ActivityLevel } from '@/lib/utils/nutrition-calculator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

function FamilyMemberForm({ initialData, onSave, onCancel }: { initialData?: Partial<FamilyMember>, onSave: (data: FamilyMember) => void, onCancel: () => void }) {
    const generateId = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return Math.random().toString(36).substring(2, 11);
    };

    const defaultMember: FamilyMember = {
        id: generateId(),
        name: '',
        age: 10,
        gender: 'male',
        weight: 30,
        height: 140,
        activityLevel: 'moderate',
        goal: 'maintain'
    };

    const [data, setData] = useState<FamilyMember>({ ...defaultMember, ...initialData } as FamilyMember);

    const GoalCard = ({ type, selected, onClick, icon: Icon, label }: { type: any, selected: boolean, onClick: () => void, icon: any, label?: string }) => (
        <div
            onClick={onClick}
            className={cn(
                "cursor-pointer flex flex-col items-center justify-center gap-0.5 rounded-xl border p-2.5 transition-all hover:scale-[1.02] text-center flex-1 min-w-[80px]",
                selected
                    ? "bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400 shadow-sm"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            )}
        >
            <Icon className={cn("h-4 w-4 mb-0.5", selected ? "text-purple-500" : "text-slate-400")} />
            <span className="text-[9px] font-bold uppercase tracking-tight leading-tight">{label || type.replace('-', ' ')}</span>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onCancel}>
            <div className="bg-white dark:bg-slate-950 w-full max-w-2xl rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 rounded-t-[2rem]">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-xl text-purple-600 dark:text-purple-400">
                            <Users size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase italic">Member Protocol</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Define bio-data for calculation</p>
                        </div>
                    </div>
                    <button onClick={onCancel} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Name</Label>
                            <Input
                                value={data.name}
                                onChange={(e) => setData({ ...data, name: e.target.value })}
                                placeholder="e.g. Johnny"
                                className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gender</Label>
                            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl h-10">
                                <button onClick={() => setData({ ...data, gender: 'male' })} className={cn("flex-1 text-xs font-black uppercase tracking-wider rounded-lg transition-all", data.gender === 'male' ? "bg-white dark:bg-slate-800 text-purple-600 shadow-sm" : "text-slate-400")}>Male</button>
                                <button onClick={() => setData({ ...data, gender: 'female' })} className={cn("flex-1 text-xs font-black uppercase tracking-wider rounded-lg transition-all", data.gender === 'female' ? "bg-white dark:bg-slate-800 text-purple-600 shadow-sm" : "text-slate-400")}>Female</button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Age (yrs)</Label>
                            <Input type="number" value={data.age} onChange={e => setData({ ...data, age: Number(e.target.value) })} className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl font-bold text-center" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Weight (kg)</Label>
                            <Input type="number" value={data.weight} onChange={e => setData({ ...data, weight: Number(e.target.value) })} className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl font-bold text-center" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Height (cm)</Label>
                            <Input type="number" value={data.height} onChange={e => setData({ ...data, height: Number(e.target.value) })} className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl font-bold text-center" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Activity Level</Label>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            <GoalCard type="sedentary" label="Sedentary" selected={data.activityLevel === 'sedentary'} onClick={() => setData({ ...data, activityLevel: 'sedentary' })} icon={User} />
                            <GoalCard type="light" label="Light" selected={data.activityLevel === 'light'} onClick={() => setData({ ...data, activityLevel: 'light' })} icon={ChevronRight} />
                            <GoalCard type="moderate" label="Moderate" selected={data.activityLevel === 'moderate'} onClick={() => setData({ ...data, activityLevel: 'moderate' })} icon={Zap} />
                            <GoalCard type="active" label="Active" selected={data.activityLevel === 'active'} onClick={() => setData({ ...data, activityLevel: 'active' })} icon={Flame} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Biological Goal</Label>
                        <div className="flex gap-2">
                            <GoalCard type="lose-fat" label="Lose Fat" selected={data.goal === 'lose-fat'} onClick={() => setData({ ...data, goal: 'lose-fat' })} icon={TrendingDown} />
                            <GoalCard type="maintain" label="Maintain" selected={data.goal === 'maintain'} onClick={() => setData({ ...data, goal: 'maintain' })} icon={Activity} />
                            <GoalCard type="build-muscle" label="Build Muscle" selected={data.goal === 'build-muscle'} onClick={() => setData({ ...data, goal: 'build-muscle' })} icon={Dumbbell} />
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-[2rem] flex justify-end gap-3">
                    <Button variant="ghost" onClick={onCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">Cancel</Button>
                    <Button onClick={() => onSave(data)} className="bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl px-8">Save Profile</Button>
                </div>
            </div>
        </div>
    );
}

function ProfilePageContent() {
    const {
        profile,
        updateProfile,
        energyUnit,
    } = useUserPreferences();
    const router = useRouter();
    const searchParams = useSearchParams();
    const from = searchParams.get('from');

    const [formData, setFormData] = useState({
        ...profile,
        exclusions: profile.exclusions || [],
        healthConditions: profile.healthConditions || [],
        familyMembers: profile.familyMembers || []
    });

    const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
    const [isAddingMember, setIsAddingMember] = useState(false);

    // 1. Calculate BMR (Mifflin-St Jeor)
    const weight = Number(formData.weight) || 70;
    const height = Number(formData.height) || 170;
    const age = Number(formData.age) || 30;
    const gender = formData.gender || 'female';
    const s = gender === 'male' ? 5 : -161;
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

    const userRDAs = useRDA(
        age,
        gender,
        tdee,
        weight
    );

    const combinedRDAs = { ...macroRDAs, ...(userRDAs || {}) };

    const handleSave = () => {
        updateProfile(formData);
        toast.success("Profile updated successfully!");
        if (from) {
            router.push(from);
        }
    };

    const handleSaveMember = (member: FamilyMember) => {
        let updatedMembers = [...formData.familyMembers];
        const index = updatedMembers.findIndex(m => m.id === member.id);
        if (index >= 0) {
            updatedMembers[index] = member;
        } else {
            updatedMembers.push(member);
        }
        setFormData({ ...formData, familyMembers: updatedMembers });
        setIsAddingMember(false);
        setEditingMember(null);
    };

    const handleDeleteMember = (id: string) => {
        const updatedMembers = formData.familyMembers.filter(m => m.id !== id);
        setFormData({ ...formData, familyMembers: updatedMembers });
    };

    const GoalCard = ({ type, selected, onClick, icon: Icon, label }: { type: any, selected: boolean, onClick: () => void, icon: any, label?: string }) => (
        <div
            onClick={onClick}
            className={cn(
                "cursor-pointer flex flex-col items-center justify-center gap-0.5 rounded-xl border p-2.5 transition-all hover:scale-[1.02] text-center",
                selected
                    ? "bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400 shadow-sm"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            )}
        >
            <Icon className={cn("h-4 w-4 mb-0.5", selected ? "text-purple-500" : "text-slate-400")} />
            <span className="text-[10px] font-bold uppercase tracking-tight leading-tight">{label || type.replace('-', ' ')}</span>
        </div>
    );

    const [showRDASheet, setShowRDASheet] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    React.useEffect(() => {
        const getUser = async () => {
            const { data: { user: supabaseUser } } = await supabase.auth.getUser();
            setUser(supabaseUser);
        };
        getUser();
    }, []);

    const handleLogin = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });
            if (error) throw error;
        } catch (error: any) {
            toast.error(error.message);
            setLoading(false);
        }
    };

    const isAdmin = (user?.email || user?.user_metadata?.email || '').toLowerCase() === (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').toLowerCase();

    return (
        <PageContainer maxWidth="max-w-7xl">
            <div className="animate-in fade-in duration-500 py-8">
                {/* Profile Header */}
                <div className="max-w-2xl mx-auto mb-12 flex flex-col items-center text-center space-y-4">
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 shadow-2xl shadow-emerald-500/10 overflow-hidden transition-transform group-hover:scale-105 duration-500">
                            {user?.user_metadata?.avatar_url ? (
                                <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User size={40} className="stroke-[1.5]" />
                            )}
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic leading-none">
                            {user?.user_metadata?.full_name || formData.nickname || profile.name || 'Anonymous User'}
                        </h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2 flex items-center justify-center gap-2">
                            {isAdmin ? (
                                <>
                                    <Fingerprint size={12} className="text-emerald-500" />
                                    <span className="text-emerald-500">Security Officer / Admin</span>
                                </>
                            ) : user ? (
                                <>
                                    <User size={12} className="text-purple-500" />
                                    <span>Verified Member</span>
                                </>
                            ) : (
                                <>
                                    <Info size={12} />
                                    <span>Guest Explorer</span>
                                </>
                            )}
                        </p>
                    </div>
                </div>

                <Sheet open={showRDASheet} onOpenChange={setShowRDASheet}>
                    <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
                        {/* Main Content (Compact Settings) */}
                        <div className="max-w-2xl w-full space-y-8 pb-32">
                            <div className="grid grid-cols-1 gap-8">
                                {/* Identification Card */}
                                <section className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="flex-shrink-0 bg-purple-500/20 p-3 rounded-2xl text-purple-500">
                                            <User size={24} className="stroke-[2.5]" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white italic">Identification</h2>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Know Your Profile</p>
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-950 rounded-3xl p-8 space-y-6 shadow-sm relative overflow-hidden before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-gradient-to-b before:from-purple-500 before:to-purple-500/50">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Name</Label>
                                            <Input
                                                value={formData.nickname}
                                                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                                                placeholder="Enter your name"
                                                className="bg-slate-50/50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1 block">Gender</Label>
                                                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl h-8 mt-1">
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
                                                    value={formData.age === '' ? '' : formData.age}
                                                    onChange={(e) => setFormData({ ...formData, age: e.target.value ? Number(e.target.value) : '' })}
                                                    placeholder="Age"
                                                    className="bg-slate-50/50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl h-8 text-xs font-bold"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1 block">Weight (kg)</Label>
                                                <Input
                                                    type="number"
                                                    value={formData.weight === '' ? '' : formData.weight}
                                                    onChange={(e) => setFormData({ ...formData, weight: e.target.value ? Number(e.target.value) : '' })}
                                                    placeholder="kg"
                                                    className="bg-slate-50/50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl h-8 text-xs font-bold"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1 block">Height (cm)</Label>
                                                <Input
                                                    type="number"
                                                    value={formData.height === '' ? '' : formData.height}
                                                    onChange={(e) => setFormData({ ...formData, height: e.target.value ? Number(e.target.value) : '' })}
                                                    placeholder="cm"
                                                    className="bg-slate-50/50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl h-8 text-xs font-bold"
                                                />
                                            </div>
                                        </div>

                                        {/* BMR Result Section */}
                                        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-500">
                                                    <Flame size={16} />
                                                </div>
                                                <div>
                                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white leading-none">Basal Metabolic Rate</h4>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1">Calculated Energy Floor</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-baseline gap-1 justify-end">
                                                    <span className="text-xl font-black italic tracking-tighter text-slate-900 dark:text-white">
                                                        {Math.round(bmr).toLocaleString()}
                                                    </span>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kcal</span>
                                                </div>
                                                <p className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest mt-0.5">
                                                    ≈ {Math.round(bmr * 4.184).toLocaleString()} kJ
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Dietary Profile Card */}
                                <section className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="flex-shrink-0 bg-purple-500/20 p-3 rounded-2xl text-purple-500">
                                            <Utensils size={24} className="stroke-[2.5]" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white italic">Dietary Profile</h2>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Nutritional Approach</p>
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-950 rounded-3xl p-6 space-y-6 shadow-sm relative overflow-hidden before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-gradient-to-b before:from-purple-500 before:to-purple-500/50">
                                        {/* Dietary Protocol */}
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dietary Protocol</Label>
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                                <GoalCard type="anything" label="Balanced" selected={formData.dietType === 'anything'} onClick={() => setFormData({ ...formData, dietType: 'anything' })} icon={Apple} />
                                                <GoalCard type="pescatarian" label="Pescatarian" selected={formData.dietType === 'pescatarian'} onClick={() => setFormData({ ...formData, dietType: 'pescatarian' })} icon={Fish} />
                                                <GoalCard type="vegetarian" label="Vegetarian" selected={formData.dietType === 'vegetarian'} onClick={() => setFormData({ ...formData, dietType: 'vegetarian' })} icon={Egg} />
                                                <GoalCard type="vegan" label="Vegan" selected={formData.dietType === 'vegan'} onClick={() => setFormData({ ...formData, dietType: 'vegan' })} icon={Leaf} />
                                            </div>
                                        </div>
                                        {/* Nutrient Strategy */}
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
                                    </div>
                                </section>

                                {/* Health Considerations Card */}
                                <section className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="flex-shrink-0 bg-purple-500/20 p-3 rounded-2xl text-purple-500">
                                            <Zap size={24} className="stroke-[2.5]" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white italic">Health Considerations</h2>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Wellness & Conditions</p>
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-950 rounded-3xl p-6 space-y-6 shadow-sm relative overflow-hidden before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-gradient-to-b before:from-purple-500 before:to-purple-500/50">
                                        {/* Exclusions */}
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
                                                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                                isSelected
                                                                    ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                                                                    : "bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                                                            )}
                                                        >
                                                            {exclusion}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <p className="text-[10px] text-slate-400 italic">These items will be marked as "Excluded" even if the meal otherwise fits your diet.</p>
                                        </div>

                                        {/* Health Conditions */}
                                        <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Health Conditions</Label>
                                            <div className="flex flex-wrap gap-2">
                                                {['Diabetes', 'Hypertension', 'Heart Disease', 'High Cholesterol', 'Celiac', 'IBS', 'Kidney Disease', 'Thyroid Issues', 'PCOS', 'Gout'].map(condition => {
                                                    const isSelected = (formData.healthConditions || [])?.includes(condition);
                                                    return (
                                                        <button
                                                            key={condition}
                                                            onClick={() => {
                                                                const newConditions = isSelected
                                                                    ? (formData.healthConditions || []).filter(c => c !== condition)
                                                                    : [...(formData.healthConditions || []), condition];
                                                                setFormData({ ...formData, healthConditions: newConditions });
                                                            }}
                                                            className={cn(
                                                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                                isSelected
                                                                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                                                                    : "bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                                                            )}
                                                        >
                                                            {condition}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <p className="text-[10px] text-slate-400 italic">Select conditions to optimize meal plans with appropriate nutritional considerations.</p>
                                        </div>
                                    </div>
                                </section>

                                {/* Goals Card */}
                                <section className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="flex-shrink-0 bg-purple-500/20 p-3 rounded-2xl text-purple-500">
                                            <Activity size={24} className="stroke-[2.5]" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white italic">Goals</h2>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Fitness Direction</p>
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-950 rounded-3xl p-8 space-y-8 shadow-sm relative overflow-hidden before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-gradient-to-b before:from-purple-500 before:to-purple-500/50">
                                        {/* Biological Goal */}
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Biological Goal</Label>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <GoalCard type="lose-fat" label="Lose Fat" selected={formData.goal === 'lose-fat'} onClick={() => setFormData({ ...formData, goal: 'lose-fat' })} icon={TrendingDown} />
                                                <GoalCard type="maintain" label="Maintain" selected={formData.goal === 'maintain'} onClick={() => setFormData({ ...formData, goal: 'maintain' })} icon={Activity} />
                                                <GoalCard type="build-muscle" label="Build Muscle" selected={formData.goal === 'build-muscle'} onClick={() => setFormData({ ...formData, goal: 'build-muscle' })} icon={Dumbbell} />
                                            </div>
                                        </div>
                                        {/* Activity Level */}
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

                                {/* FAMILY PROTOCOLS - Hidden for now */}
                                {false && (
                                    <section className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="flex-shrink-0 bg-purple-500/20 p-3 rounded-2xl text-purple-500">
                                                <Users size={24} className="stroke-[2.5]" />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white italic">Family Protocols</h2>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Household Management</p>
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-slate-950 rounded-3xl p-6 space-y-6 shadow-sm relative overflow-hidden before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-gradient-to-b before:from-purple-500 before:to-purple-500/50">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Existing Members */}
                                                {formData.familyMembers.map((member) => (
                                                    <div key={member.id} onClick={() => setEditingMember(member)} className="group cursor-pointer p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 transition-all relative">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className={cn("w-2 h-2 rounded-full", member.gender === 'male' ? "bg-blue-400" : "bg-rose-400")} />
                                                                <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200">{member.name || 'Unnamed'}</h3>
                                                            </div>
                                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteMember(member.id); }} className="text-slate-300 hover:text-rose-500 transition-colors p-1"><X size={14} /></button>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                            <span className="bg-white dark:bg-slate-950 px-2 py-1 rounded-md">{member.age} yrs</span>
                                                            <span className="bg-white dark:bg-slate-950 px-2 py-1 rounded-md">{member.goal}</span>
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Add Button */}
                                                <button
                                                    onClick={() => setIsAddingMember(true)}
                                                    className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/5 transition-all text-slate-400 hover:text-emerald-500 h-[100px]"
                                                >
                                                    <div className="p-2 rounded-full bg-slate-50 dark:bg-slate-900 group-hover:bg-white transition-colors">
                                                        <Plus size={20} />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Add Member</span>
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-slate-400 italic">Add family members to automatically calculate scale-appropriate portion sizes in recipes.</p>
                                        </div>
                                    </section>
                                )}

                                {(isAddingMember || editingMember) && (
                                    <FamilyMemberForm
                                        initialData={editingMember || {}}
                                        onSave={handleSaveMember}
                                        onCancel={() => { setIsAddingMember(false); setEditingMember(null); }}
                                    />
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-4 justify-center pt-8 border-t border-slate-100 dark:border-slate-800">
                                <Button
                                    onClick={handleSave}
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-black px-8 h-12 rounded-xl shadow-lg shadow-purple-500/30 flex items-center gap-2 text-xs uppercase tracking-widest"
                                >
                                    <Save size={16} />
                                    Save Profile
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full font-black text-xs uppercase tracking-widest border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/10 h-12 rounded-xl"
                                    onClick={() => setShowRDASheet(true)}
                                >
                                    Recommended Intake
                                </Button>

                                {user ? (
                                    <Button
                                        variant="ghost"
                                        className="w-full mt-4 font-black text-xs uppercase tracking-widest text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 h-12 rounded-xl"
                                        onClick={async () => {
                                            await supabase.auth.signOut();
                                            router.push('/');
                                        }}
                                    >
                                        <LogOut size={16} className="mr-2" />
                                        Sign Out
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleLogin}
                                        disabled={loading}
                                        className="w-full mt-8 h-12 bg-slate-950 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 border-none shadow-2xl shadow-emerald-500/10 font-black text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500" />
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                                </svg>
                                                <span>Authorize with Google</span>
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* RDA Sheet Slider */}
                        <SheetContent side="left" className="max-w-md w-full bg-slate-950 border-l-0 border-r border-slate-800 p-0 flex flex-col">
                            <SheetHeader className="bg-slate-900/80 p-6 border-b border-slate-800">
                                <SheetTitle className="text-lg font-black text-purple-400 uppercase tracking-widest font-sans">Recommended Intake</SheetTitle>
                            </SheetHeader>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
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
                                            <div key={idx} className="space-y-3">
                                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-500/60 pl-1 font-sans">{cat.title}</h4>
                                                <div className="space-y-1">
                                                    {availableNutrients.map(([nutrient, value]) => {
                                                        const unit = (nutrient === 'Energy') ? energyUnit : (nutrient === 'Protein' || nutrient === 'Carbs' || nutrient === 'Fat' || nutrient === 'Fiber' || nutrient === 'ALA' || nutrient.includes('_g') || cat.title === "Amino Acids") ? 'g' : (nutrient === 'Vitamin D') ? 'IU' : (nutrient.includes('Folate') || nutrient.includes('B12') || nutrient.includes('Biotin') || nutrient.includes('Selenium') || nutrient === 'Vitamin A' || nutrient === 'Vitamin K' || nutrient.includes('EPA')) ? 'µg' : 'mg';
                                                        const displayVal = value < 1 ? value.toFixed(2) : value < 10 ? value.toFixed(1) : Math.round(value);
                                                        return (
                                                            <div key={nutrient} className="bg-slate-900/40 px-5 py-3 rounded-2xl flex items-center justify-between hover:bg-slate-900 transition-colors group/item border border-transparent hover:border-slate-800">
                                                                <div className="flex flex-col min-w-0 pr-2">
                                                                    <p className="text-[11px] uppercase font-black text-slate-400 group-hover/item:text-slate-200 transition-colors leading-none font-sans">{nutrient}</p>
                                                                    {['ALA', 'EPA', 'Histidine', 'Leucine', 'Isoleucine', 'Lysine', 'Methionine', 'Phenylalanine', 'Threonine', 'Tryptophan', 'Valine'].includes(nutrient) && (
                                                                        <span className="text-[7px] text-blue-500 font-black uppercase mt-1 tracking-widest font-sans">Constituent</span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-baseline gap-1 font-sans">
                                                                    <span className="text-sm font-black text-white tracking-tighter leading-none">{displayVal}</span>
                                                                    <span className="text-[9px] text-slate-500 font-black uppercase">{unit}</span>
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
                        </SheetContent>
                    </div>
                </Sheet>
            </div>
        </PageContainer>
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
