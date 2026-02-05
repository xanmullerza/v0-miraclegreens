"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    ArrowLeft,
    Save,
    Loader2,
    Zap,
    Scale,
    Database,
    ChevronRight,
    RotateCcw,
    ChefHat,
    Search,
    AlertCircle,
    CheckCircle2,
    Activity,
    Beaker
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { findSpiceFactor, transformPortions, SpiceState, SpiceTransformationFactor } from '@/lib/utils/spice-conversion';
import FoodItemPicker from '@/components/recipe/food-item-picker';

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden", className)}>
        {children}
    </div>
);

export default function SpiceConverterPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const foodId = searchParams.get('foodId');

    const [selectedFood, setSelectedFood] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [targetState, setTargetState] = useState<SpiceState>('ground');
    const [showPicker, setShowPicker] = useState(false);

    const [isAdmin, setIsAdmin] = useState(false);

    // Configuration states
    const [customFactor, setCustomFactor] = useState<SpiceTransformationFactor | null>(null);

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';
                const userEmail = (user.email || user.user_metadata?.email || '').toLowerCase();
                setIsAdmin(userEmail === adminEmail.toLowerCase() && adminEmail !== '');
            }
        };
        checkAdmin();
    }, []);

    useEffect(() => {
        if (foodId) {
            fetchFood(foodId);
        }
    }, [foodId]);

    const fetchFood = async (id: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('food_items')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setSelectedFood(data);

            // Auto-detect target state and factor
            const factor = findSpiceFactor(data.name);
            setCustomFactor(factor);

            if (data.name.toLowerCase().includes('ground') || data.name.toLowerCase().includes('powder')) {
                setTargetState('whole');
            } else {
                setTargetState('ground');
            }
        } catch (err: any) {
            console.error("Error fetching food:", err);
            toast.error("Failed to load food item");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAsNew = async () => {
        if (!selectedFood || !customFactor) return;

        setSaving(true);
        try {
            const newName = targetState === 'ground'
                ? `${selectedFood.name.split(',')[0]}, ground`
                : `${selectedFood.name.split(',')[0]}, whole`;

            const transformedPortions = transformPortions(selectedFood.portions || [], customFactor, targetState);

            const newFood = {
                ...selectedFood,
                id: undefined, // Let DB generate new ID
                name: newName,
                common_name: `${selectedFood.common_name || selectedFood.name} (${targetState})`,
                portions: transformedPortions,
                source: 'manual', // Mark as custom transformation
                created_at: undefined,
                updated_at: undefined
            };

            const { data, error } = await supabase
                .from('food_items')
                .insert(newFood)
                .select()
                .single();

            if (error) throw error;

            toast.success(`Created "${newName}" successfully!`);
            router.push(`/dashboard/foods/${data.id}`);
        } catch (err: any) {
            console.error("Error saving food:", err);
            toast.error(`Error: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const renderPreview = () => {
        if (!selectedFood || !customFactor) return null;

        const transformedPortions = transformPortions(selectedFood.portions || [], customFactor, targetState);

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Source Item */}
                    <Card className="p-6 border-slate-200 dark:border-slate-800 bg-slate-50/50">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
                                <Database size={18} />
                            </div>
                            <h3 className="font-bold text-sm uppercase tracking-widest text-slate-500">Source Material</h3>
                        </div>
                        <div className="space-y-3">
                            <p className="text-xl font-black italic uppercase tracking-tighter">{selectedFood.name}</p>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase text-slate-400">Portion Weights</p>
                                {selectedFood.portions?.map((p: any, i: number) => (
                                    <div key={i} className="flex justify-between text-xs font-mono">
                                        <span>1 {p.label}</span>
                                        <span className="font-bold">{p.weight_g}g</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* Target Preview */}
                    <Card className="p-6 border-indigo-500/20 bg-indigo-500/[0.02]">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-500">
                                <ChefHat size={18} />
                            </div>
                            <h3 className="font-bold text-sm uppercase tracking-widest text-indigo-500">Target Output ({targetState})</h3>
                        </div>
                        <div className="space-y-3">
                            <p className="text-xl font-black italic uppercase tracking-tighter text-indigo-600 dark:text-indigo-400">
                                {targetState === 'ground' ? `${selectedFood.name.split(',')[0]}, ground` : `${selectedFood.name.split(',')[0]}, whole`}
                            </p>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase text-indigo-400/60">Adjusted Weights</p>
                                {transformedPortions.map((p: any, i: number) => (
                                    <div key={i} className="flex justify-between text-xs font-mono text-indigo-700 dark:text-indigo-300">
                                        <span>1 {p.label}</span>
                                        <span className="font-black">{p.weight_g}g</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Transition Factor Control */}
                <Card className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Beaker size={20} className="text-amber-500" />
                            <h3 className="font-black text-sm uppercase tracking-widest">Calibration Parameters</h3>
                        </div>
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            {customFactor.name} Standards
                        </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <Label className="text-[10px] uppercase font-black text-slate-400">Target State</Label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setTargetState('ground')}
                                        className={cn(
                                            "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                            targetState === 'ground' ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-400"
                                        )}
                                    >
                                        Ground
                                    </button>
                                    <button
                                        onClick={() => setTargetState('whole')}
                                        className={cn(
                                            "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                            targetState === 'whole' ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-400"
                                        )}
                                    >
                                        Whole
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label className="text-[10px] uppercase font-black text-slate-400 italic">Volume Yield Factor (V {'->'} G)</Label>
                                    <span className="text-xs font-bold text-indigo-500">{customFactor.vToG}x</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="3.0"
                                    step="0.05"
                                    value={customFactor.vToG}
                                    onChange={(e) => setCustomFactor({ ...customFactor, vToG: parseFloat(e.target.value) })}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                                <p className="text-[9px] text-slate-400 italic leading-tight">
                                    The increase in volume after grinding. e.g. 1 tsp whole {'->'} 1.25 tsp ground.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label className="text-[10px] uppercase font-black text-slate-400 italic">Ground Density (g/tsp)</Label>
                                    <span className="text-xs font-bold text-indigo-500">{customFactor.gPerTspGround}g</span>
                                </div>
                                <input
                                    type="range"
                                    min="1.0"
                                    max="5.0"
                                    step="0.05"
                                    value={customFactor.gPerTspGround}
                                    onChange={(e) => setCustomFactor({ ...customFactor, gPerTspGround: parseFloat(e.target.value) })}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                                <p className="text-[9px] text-slate-400 italic leading-tight">
                                    The mass of standard powdered form. McCormick standard for {customFactor.name} is {customFactor.gPerTspGround}g.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label className="text-[10px] uppercase font-black text-slate-400 italic">Whole Density (g/tsp)</Label>
                                    <span className="text-xs font-bold text-indigo-500">{customFactor.gPerTspWhole}g</span>
                                </div>
                                <input
                                    type="range"
                                    min="1.0"
                                    max="10.0"
                                    step="0.05"
                                    value={customFactor.gPerTspWhole}
                                    onChange={(e) => setCustomFactor({ ...customFactor, gPerTspWhole: parseFloat(e.target.value) })}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                                <p className="text-[9px] text-slate-400 italic leading-tight">
                                    The mass of seeds/pods. Used as the baseline for the transformation ratio.
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="flex gap-4">
                    <Button
                        onClick={() => router.back()}
                        variant="ghost"
                        className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-500"
                    >
                        <RotateCcw size={16} className="mr-2" /> Discard
                    </Button>
                    {isAdmin ? (
                        <Button
                            onClick={handleSaveAsNew}
                            disabled={saving}
                            className="flex-[2] h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-500/20 group"
                        >
                            {saving ? <Loader2 className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                            Generate & Save New Reference Item
                        </Button>
                    ) : (
                        <div className="flex-[2] flex items-center justify-center gap-3 px-6 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-800 h-14">
                            <AlertCircle size={16} />
                            <p className="text-[9px] font-black uppercase tracking-widest">Read-Only: Admin authorization required to save new items</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-indigo-500 font-bold text-xs uppercase tracking-widest mb-2 hover:translate-x-[-4px] transition-transform"
                >
                    <ArrowLeft size={14} /> Back
                </button>
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">Spice Lab</h1>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Activity size={12} className="text-indigo-500" /> Advanced Molecular State Transformation
                        </p>
                    </div>
                    {!selectedFood && (
                        <Button
                            onClick={() => setShowPicker(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white h-12 px-6 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 shadow-lg shadow-indigo-500/20"
                        >
                            <Search size={16} /> Select Base Spice
                        </Button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="h-[40vh] flex flex-col items-center justify-center gap-4">
                    <Loader2 className="animate-spin text-indigo-500" size={32} />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Calibrating Transducers...</p>
                </div>
            ) : selectedFood ? (
                renderPreview()
            ) : (
                <div className="py-20 flex flex-col items-center justify-center gap-8 bg-slate-50/50 dark:bg-slate-900/20 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <div className="text-center space-y-2">
                        <Scale size={48} className="text-slate-200 mx-auto mb-4" />
                        <h4 className="text-xl font-black uppercase tracking-tighter text-slate-400">No Material Selected</h4>
                        <p className="text-sm font-medium text-slate-500 max-w-xs mx-auto">Select a spice from the clinical database to begin state transformation.</p>
                    </div>
                    <Button
                        onClick={() => setShowPicker(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white h-12 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-500/20"
                    >
                        Open Material Picker
                    </Button>
                </div>
            )}

            {showPicker && (
                <FoodItemPicker
                    onSelect={(item) => {
                        fetchFood(item.id);
                        setShowPicker(false);
                    }}
                    onClose={() => setShowPicker(false)}
                />
            )}
        </div>
    );
}
