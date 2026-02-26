'use client';

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
    RotateCcw,
    ChefHat,
    Search,
    AlertCircle,
    Activity,
    Beaker
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { findSpiceFactor, transformPortions, transformNutritionPer100g, SpiceState, SpiceTransformationFactor, isSpice, getSpiceMeasures } from '@/lib/utils/spice-conversion';
import FoodItemPicker from '@/components/recipe/food-item-picker';

export function LabView() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const foodId = searchParams.get('foodId');
    const [selectedFood, setSelectedFood] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [targetState, setTargetState] = useState<SpiceState>('ground');
    const [showPicker, setShowPicker] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [customFactor, setCustomFactor] = useState<SpiceTransformationFactor | null>(null);

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';
                const userEmail = (user.email || '').toLowerCase();
                setIsAdmin(userEmail === adminEmail.toLowerCase() && adminEmail !== '');
            }
        };
        checkAdmin();
    }, []);

    useEffect(() => { if (foodId) fetchFood(foodId); }, [foodId]);

    const fetchFood = async (id: string) => {
        setLoading(true);
        try {
            const { data } = await supabase.from('food_items').select('*').eq('id', id).single();
            if (data) {
                setSelectedFood(data);
                const factor = findSpiceFactor(data.name);
                setCustomFactor(factor);
                setTargetState(data.name.toLowerCase().includes('ground') ? 'whole' : 'ground');
            }
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const handleSaveAsNew = async () => {
        if (!selectedFood || !customFactor) return;
        setSaving(true);
        try {
            const newName = targetState === 'ground' ? `${selectedFood.name.split(',')[0]}, ground` : `${selectedFood.name.split(',')[0]}, whole`;
            // Simplified logic for brevity, matches original SpiceConverter closely
            const transformedNutrition = transformNutritionPer100g(selectedFood, customFactor, targetState);
            const { data, error } = await supabase.from('food_items').insert({ ...selectedFood, ...transformedNutrition, id: undefined, name: newName, common_name: `${selectedFood.common_name || selectedFood.name} (${targetState})`, created_at: undefined, updated_at: undefined }).select().single();
            if (error) throw error;
            toast.success(`Created "${newName}" successfully!`);
        } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">Spice Lab</h2>
                    <p className="text-slate-500 font-medium text-sm max-w-lg">
                        Advanced molecular state transformation for herbs and spices.
                    </p>
                </div>
                {!selectedFood && (
                    <Button onClick={() => setShowPicker(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white h-12 px-6 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-500/20">
                        <Search size={16} className="mr-2" /> Select Base Spice
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="animate-spin text-indigo-500" size={32} />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 italic">Calibration in progress...</p>
                </div>
            ) : selectedFood && customFactor ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-4">
                        <h3 className="text-lg font-black uppercase italic text-indigo-500">{targetState === 'ground' ? `${selectedFood.name.split(',')[0]}, ground` : `${selectedFood.name.split(',')[0]}, whole`}</h3>
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Molecule shift</span>
                                <span className="text-[10px] font-black text-indigo-500">{customFactor.concentrationFactor}x Concentration</span>
                            </div>
                            <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full"><div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(customFactor.concentrationFactor / 5) * 100}%` }} /></div>
                        </div>
                        <div className="flex gap-4">
                            <Button disabled={!isAdmin || saving} onClick={handleSaveAsNew} className="flex-1 bg-indigo-600 font-black uppercase tracking-widest text-[10px] h-12 rounded-xl">Generate Item</Button>
                            <Button variant="ghost" onClick={() => setSelectedFood(null)} className="h-12 text-[10px] font-black uppercase tracking-widest">Discard</Button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400">Yield Factor</Label>
                            <input type="range" min="0.5" max="3.0" step="0.05" value={customFactor.vToG} onChange={(e) => setCustomFactor({ ...customFactor, vToG: parseFloat(e.target.value) })} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400">Concentration Factor</Label>
                            <input type="range" min="1.0" max="8.0" step="0.1" value={customFactor.concentrationFactor} onChange={(e) => setCustomFactor({ ...customFactor, concentrationFactor: parseFloat(e.target.value) })} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                        </div>
                    </div>
                </div>
            ) : (
                <div onClick={() => setShowPicker(true)} className="py-24 flex flex-col items-center justify-center gap-4 bg-slate-50/50 dark:bg-slate-900/20 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-100/50 transition-colors">
                    <Beaker size={48} className="text-slate-300" />
                    <p className="font-black uppercase tracking-widest text-slate-400 text-xs">Enter Lab Environment</p>
                </div>
            )}

            {showPicker && <FoodItemPicker onSelect={(item) => { fetchFood(item.id); setShowPicker(false); }} onClose={() => setShowPicker(false)} />}
        </div>
    );
}
