'use client';

import React, { useState, useEffect } from 'react';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { useActionPanel } from '@/lib/context/action-panel-context';
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
    Users,
    Target,
    Globe,
    Check,
    Scale,
    Monitor,
    Sun,
    Moon,
    X,
    ChevronUp,
    ChevronDown,
    BarChart3,
    Eye,
    Tag,
    Shapes,
    Settings,
    ShieldCheck,
    ExternalLink,
    LayoutGrid,
    ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useRDA } from '@/hooks/use-rda';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { type FamilyMember } from '@/lib/context/user-preferences-context';
import { GoalType, ActivityLevel } from '@/lib/utils/nutrition-calculator';

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

function ProfileContentInner({ className }: { className?: string }) {
    const {
        profile,
        updateProfile,
        energyUnit,
        setEnergyUnit,
        measurementUnit,
        setMeasurementUnit,
        nutrientDisplayMode,
        setNutrientDisplayMode,
        setShowRDADrawer,
        showHeroes,
        setShowHeroes,
        headerStyle,
        setHeaderStyle,
    } = useUserPreferences();
    const { activeView, setActiveView: setActiveViewContext, setPreviousView, navigateTo, goBack } = useActionPanel();
    const { theme, setTheme } = useTheme();
    const router = useRouter();
    const searchParams = useSearchParams();
    const from = searchParams.get('from');

    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();
    }, []);

    const isAdmin = (user?.email || user?.user_metadata?.email || '').toLowerCase() === (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').toLowerCase();

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

    const [formData, setFormData] = useState({
        ...profile,
        exclusions: profile.exclusions || [],
        healthConditions: profile.healthConditions || [],
        familyMembers: profile.familyMembers || []
    });

    const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
    const [isAddingMember, setIsAddingMember] = useState(false);

    // Sync formData with profile when profile changes (e.g. after async cloud sync)
    React.useEffect(() => {
        setFormData({
            ...profile,
            exclusions: profile.exclusions || [],
            healthConditions: profile.healthConditions || [],
            familyMembers: profile.familyMembers || []
        });
    }, [profile]);

    // 1. Calculate BMR (Mifflin-St Jeor) - Formula expects metric (kg, cm)
    const weightVal = Number(formData.weight) || 70;
    const heightVal = Number(formData.height) || 170;

    // Convert to metric if needed
    const weight = measurementUnit === 'imperial' ? weightVal * 0.453592 : weightVal;
    const height = measurementUnit === 'imperial' ? heightVal * 2.54 : heightVal;

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

    const macroRDAs: Record<string, number> = {
        'Energy': energyUnit === 'kJ' ? tdee * 4.184 : tdee,
        'Protein': (tdee * (formData.nutrientStrategy === 'high-protein' ? 0.4 : 0.25)) / 4,
        'Carbs': (tdee * (formData.nutrientStrategy === 'low-carb' ? 0.15 : 0.45)) / 4,
        'Fat': (tdee * (formData.nutrientStrategy === 'keto' ? 0.7 : 0.3)) / 9
    };

    const userRDAs = useRDA(age, gender, tdee, weight);
    const combinedRDAs = { ...macroRDAs, ...(userRDAs || {}) };

    const COUNTRY_PRESETS: Record<string, { energy: 'kJ' | 'kcal', measurement: 'metric' | 'imperial' }> = {
        'N America': { energy: 'kcal', measurement: 'imperial' },
        'Europe': { energy: 'kJ', measurement: 'metric' },
        'Asia': { energy: 'kJ', measurement: 'metric' },
        'S America': { energy: 'kJ', measurement: 'metric' },
        'Africa': { energy: 'kJ', measurement: 'metric' },
        'Oceania': { energy: 'kJ', measurement: 'metric' }
    };

    const handleCountryChange = (country: string) => {
        const preset = COUNTRY_PRESETS[country];
        if (preset) {
            setEnergyUnit(preset.energy);
            setMeasurementUnit(preset.measurement);
        }
        setFormData({ ...formData, country });
    };

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

    const [expandedAccordion, setExpandedAccordion] = useState<string | null>(null);

    const toggleAccordion = (section: string) => {
        setExpandedAccordion(expandedAccordion === section ? null : section);
    };

    return (
        <div className={cn("animate-in fade-in duration-500 py-8 px-4", className)}>
            {/* Profile Header */}
            <div className="max-w-2xl mx-auto mb-12 flex flex-col items-center text-center space-y-4">
                <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 shadow-2xl shadow-purple-500/10 overflow-hidden transition-transform group-hover:scale-105 duration-500">
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
                                <Fingerprint size={12} className="text-purple-500" />
                                <span className="text-purple-500">Security Officer / Admin</span>
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

                <div className="flex items-center gap-2 pt-4">
                    <Button
                        variant="outline"
                        className="h-9 px-4 text-[10px] font-black uppercase tracking-widest border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-xl transition-all"
                        onClick={() => {
                            if (activeView !== undefined && activeView !== null) {
                                navigateTo('recommended-intake');
                            } else {
                                setShowRDADrawer(true);
                            }
                        }}
                    >
                        <Target size={14} className="mr-2" />
                        Recommended Intake
                    </Button>

                    {user ? (
                        <Button
                            variant="ghost"
                            className="h-9 px-4 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                            onClick={async () => {
                                await supabase.auth.signOut();
                                router.push('/');
                            }}
                        >
                            <LogOut size={14} className="mr-2" />
                            Sign Out
                        </Button>
                    ) : (
                        <Button
                            variant="ghost"
                            onClick={handleLogin}
                            disabled={loading}
                            className="h-9 px-4 text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10 rounded-xl transition-all flex items-center gap-2"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-500" />
                            ) : (
                                <>
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor" opacity="0.8" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor" opacity="0.6" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor" opacity="0.4" />
                                    </svg>
                                    <span>Sign In</span>
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-6 items-start justify-center overflow-x-hidden">
                <div className="max-w-2xl w-full mx-auto space-y-8 pb-10">
                    <div className="grid grid-cols-1 gap-8">
                        {/* Identification Card */}
                        <section className="space-y-1">
                            <button 
                                onClick={() => toggleAccordion('identification')}
                                className="w-full flex items-center justify-between gap-4 px-6 py-5 bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 dark:from-emerald-950/20 dark:to-emerald-900/10 border border-emerald-500/20 rounded-t-2xl hover:opacity-95 transition-all group"
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="flex-shrink-0 bg-emerald-500/5 p-3 rounded-xl text-emerald-500 shadow-sm border border-current/10 group-hover:opacity-80 transition-opacity">
                                        <User size={24} className="stroke-[2.5]" />
                                    </div>
                                    <div className="text-left">
                                        <h2 className="text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white italic">Identification</h2>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Basic Information</p>
                                    </div>
                                </div>
                                <div className={cn("text-emerald-500 transition-transform duration-300", expandedAccordion === 'identification' ? "rotate-180" : "")}>
                                    <ChevronDown size={20} />
                                </div>
                            </button>
                            
                            {expandedAccordion === 'identification' && (
                            <div className="bg-white dark:bg-slate-900/50 rounded-b-2xl p-8 space-y-8 shadow-md relative overflow-hidden border border-t-0 border-emerald-500/20">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Name</Label>
                                    <Input
                                        value={formData.nickname}
                                        onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                                        placeholder="Enter your name"
                                        className="bg-slate-50/50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl"
                                    />
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
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
                                        <div className="relative group/stepper">
                                            <Input
                                                type="number"
                                                value={formData.age === '' ? '' : formData.age}
                                                onChange={(e) => setFormData({ ...formData, age: e.target.value ? Number(e.target.value) : '' })}
                                                placeholder="Age"
                                                className="bg-slate-50/50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl h-8 text-xs font-bold text-center pr-6 pl-2"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1 block">Weight ({measurementUnit === 'imperial' ? 'lb' : 'kg'})</Label>
                                        <div className="relative group/stepper">
                                            <Input
                                                type="number"
                                                value={formData.weight === '' ? '' : formData.weight}
                                                onChange={(e) => setFormData({ ...formData, weight: e.target.value ? Number(e.target.value) : '' })}
                                                placeholder={measurementUnit === 'imperial' ? "lb" : "kg"}
                                                className="bg-slate-50/50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl h-8 text-xs font-bold text-center pr-6 pl-2"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1 block">Height ({measurementUnit === 'imperial' ? 'in' : 'cm'})</Label>
                                        <div className="relative group/stepper">
                                            <Input
                                                type="number"
                                                value={formData.height === '' ? '' : formData.height}
                                                onChange={(e) => setFormData({ ...formData, height: e.target.value ? Number(e.target.value) : '' })}
                                                placeholder={measurementUnit === 'imperial' ? "in" : "cm"}
                                                className="bg-slate-50/50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl h-8 text-xs font-bold text-center pr-6 pl-2"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-500">
                                            <Flame size={16} />
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white leading-none">Basal Metabolic Rate</h4>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1">Calculated using Mifflin-St Jeor equation</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-baseline gap-1 justify-end">
                                            <span className="text-xl font-black italic tracking-tighter text-slate-900 dark:text-white">
                                                {energyUnit === 'kJ' ? Math.round(bmr * 4.184).toLocaleString() : Math.round(bmr).toLocaleString()}
                                            </span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{energyUnit === 'kJ' ? 'kJ' : 'kcal'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            )}
                        </section>

                        {/* Measures Card */}
                        <section className="space-y-1">
                            <button 
                                onClick={() => toggleAccordion('measures')}
                                className="w-full flex items-center justify-between gap-4 px-6 py-5 bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 dark:from-emerald-950/20 dark:to-emerald-900/10 border border-emerald-500/20 rounded-t-2xl hover:opacity-95 transition-all group"
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="flex-shrink-0 bg-emerald-500/5 p-3 rounded-xl text-emerald-500 shadow-sm border border-current/10 group-hover:opacity-80 transition-opacity">
                                        <Globe size={24} className="stroke-[2.5]" />
                                    </div>
                                    <div className="text-left">
                                        <h2 className="text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white italic">Measures</h2>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Location & Units</p>
                                    </div>
                                </div>
                                <div className={cn("text-emerald-500 transition-transform duration-300", expandedAccordion === 'measures' ? "rotate-180" : "")}>
                                    <ChevronDown size={20} />
                                </div>
                            </button>
                            
                            {expandedAccordion === 'measures' && (
                            <div className="bg-white dark:bg-slate-900/50 rounded-b-2xl p-8 space-y-8 shadow-md relative overflow-hidden border border-t-0 border-emerald-500/20">
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1 block">Your Region</Label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {Object.keys(COUNTRY_PRESETS).map(country => (
                                            <button
                                                key={country}
                                                onClick={() => handleCountryChange(country)}
                                                className={cn(
                                                    "px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all text-center",
                                                    formData.country === country ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm" : "bg-slate-100 dark:bg-slate-900 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400"
                                                )}
                                            >
                                                {country}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Energy Unit</Label>
                                        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                                            <button onClick={() => setEnergyUnit("kJ")} className={cn("flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all", energyUnit === "kJ" ? "bg-white dark:bg-slate-800 text-emerald-600 shadow-sm" : "text-slate-500")}>kJ</button>
                                            <button onClick={() => setEnergyUnit("kcal")} className={cn("flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all", energyUnit === "kcal" ? "bg-white dark:bg-slate-800 text-emerald-600 shadow-sm" : "text-slate-500")}>kcal</button>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Measurement</Label>
                                        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                                            <button onClick={() => setMeasurementUnit("metric")} className={cn("flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all", measurementUnit === "metric" ? "bg-white dark:bg-slate-800 text-emerald-600 shadow-sm" : "text-slate-500")}>Metric</button>
                                            <button onClick={() => setMeasurementUnit("imperial")} className={cn("flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all", measurementUnit === "imperial" ? "bg-white dark:bg-slate-800 text-emerald-600 shadow-sm" : "text-slate-500")}>Imperial</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            )}
                        </section>

                        {/* Goals Card */}
                        <section className="space-y-1">
                            <button 
                                onClick={() => toggleAccordion('goals')}
                                className="w-full flex items-center justify-between gap-4 px-6 py-5 bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 dark:from-emerald-950/20 dark:to-emerald-900/10 border border-emerald-500/20 rounded-t-2xl hover:opacity-95 transition-all group"
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="flex-shrink-0 bg-emerald-500/5 p-3 rounded-xl text-emerald-500 shadow-sm border border-current/10 group-hover:opacity-80 transition-opacity">
                                        <Activity size={24} className="stroke-[2.5]" />
                                    </div>
                                    <div className="text-left">
                                        <h2 className="text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white italic">Goals</h2>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fitness Direction</p>
                                    </div>
                                </div>
                                <div className={cn("text-emerald-500 transition-transform duration-300", expandedAccordion === 'goals' ? "rotate-180" : "")}>
                                    <ChevronDown size={20} />
                                </div>
                            </button>
                            
                            {expandedAccordion === 'goals' && (
                            <div className="bg-white dark:bg-slate-900/50 rounded-b-2xl p-8 space-y-8 shadow-md relative overflow-hidden border border-t-0 border-emerald-500/20">
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
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        <GoalCard type="sedentary" label="Sedentary" selected={formData.activityLevel === 'sedentary'} onClick={() => setFormData({ ...formData, activityLevel: 'sedentary' })} icon={User} />
                                        <GoalCard type="light" label="Lightly Active" selected={formData.activityLevel === 'light'} onClick={() => setFormData({ ...formData, activityLevel: 'light' })} icon={ChevronRight} />
                                        <GoalCard type="moderate" label="Moderate" selected={formData.activityLevel === 'moderate'} onClick={() => setFormData({ ...formData, activityLevel: 'moderate' })} icon={Zap} />
                                        <GoalCard type="active" label="Very Active" selected={formData.activityLevel === 'active'} onClick={() => setFormData({ ...formData, activityLevel: 'active' })} icon={Flame} />
                                    </div>
                                </div>
                            </div>
                            )}
                        </section>

                        {/* Dietary Profile Card */}
                        <section className="space-y-1">
                            <button 
                                onClick={() => toggleAccordion('dietary')}
                                className="w-full flex items-center justify-between gap-4 px-6 py-5 bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 dark:from-emerald-950/20 dark:to-emerald-900/10 border border-emerald-500/20 rounded-t-2xl hover:opacity-95 transition-all group"
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="flex-shrink-0 bg-emerald-500/5 p-3 rounded-xl text-emerald-500 shadow-sm border border-current/10 group-hover:opacity-80 transition-opacity">
                                        <Utensils size={24} className="stroke-[2.5]" />
                                    </div>
                                    <div className="text-left">
                                        <h2 className="text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white italic">Dietary Profile</h2>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nutritional Approach</p>
                                    </div>
                                </div>
                                <div className={cn("text-emerald-500 transition-transform duration-300", expandedAccordion === 'dietary' ? "rotate-180" : "")}>
                                    <ChevronDown size={20} />
                                </div>
                            </button>
                            
                            {expandedAccordion === 'dietary' && (
                            <div className="bg-white dark:bg-slate-900/50 rounded-b-2xl p-8 space-y-8 shadow-md relative overflow-hidden border border-t-0 border-emerald-500/20">
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dietary Protocol</Label>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                                </div>
                            </div>
                            )}
                        </section>

                        {isAdmin && (
                        <section className="space-y-1">
                            <button 
                                onClick={() => toggleAccordion('admin')}
                                className="w-full flex items-center justify-between gap-4 px-6 py-5 bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 dark:from-emerald-950/20 dark:to-emerald-900/10 border border-emerald-500/20 rounded-t-2xl hover:opacity-95 transition-all group"
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="flex-shrink-0 bg-emerald-500/5 p-3 rounded-xl text-emerald-500 shadow-sm border border-current/10 group-hover:opacity-80 transition-opacity">
                                        <ShieldCheck size={24} className="stroke-[2.5]" />
                                    </div>
                                    <div className="text-left">
                                        <h2 className="text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white italic">Admin Terminal</h2>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Authorized Access Only</p>
                                    </div>
                                </div>
                                <div className={cn("text-emerald-500 transition-transform duration-300", expandedAccordion === 'admin' ? "rotate-180" : "")}>
                                    <ChevronDown size={20} />
                                </div>
                            </button>
                            
                            {expandedAccordion === 'admin' && (
                            <div className="bg-white dark:bg-slate-900/50 rounded-b-2xl p-8 space-y-6 shadow-md relative overflow-hidden border border-t-0 border-emerald-500/20">
                                <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black h-12 rounded-xl flex items-center justify-between px-6">
                                    <Link href="/admin">
                                        <div className="flex items-center gap-3">
                                            <LayoutGrid size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Admin Workspace</span>
                                        </div>
                                        <ArrowRight size={14} />
                                    </Link>
                                </Button>
                            </div>
                            )}
                        </section>
                        )}
                    </div>

                    <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
                        <Button
                            onClick={handleSave}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black h-12 rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-widest transition-all"
                        >
                            <Save size={16} />
                            Save Profile
                        </Button>
                    </div>
                </div>
            </div>

            {(isAddingMember || editingMember) && (
                <FamilyMemberForm
                    initialData={editingMember || {}}
                    onSave={handleSaveMember}
                    onCancel={() => { setIsAddingMember(false); setEditingMember(null); }}
                />
            )}
        </div>
    );
}

export function ProfileContent(props: { className?: string }) {
    return (
        <React.Suspense fallback={
            <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
                <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading DNA Protocol...</p>
            </div>
        }>
            <ProfileContentInner {...props} />
        </React.Suspense>
    );
}
