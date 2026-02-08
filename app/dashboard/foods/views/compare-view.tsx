'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    Scale,
    Zap,
    Sparkles,
    Search,
    X,
    BarChart3,
    Gem,
    Droplet,
    Battery,
    FileText,
    ArrowRight,
    RotateCcw,
    Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    PolarAngleAxis,
    PolarGrid,
    Radar,
    RadarChart,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    Legend
} from 'recharts';
import { cn } from '@/lib/utils';
import { useRDA } from '@/hooks/use-rda';
import { getNutrientLevelStyles } from '@/lib/utils/nutrient-styles';
import { useSearch } from '@/lib/context/search-context';
import { useUserPreferences } from '@/lib/context/user-preferences-context';

interface FoodItem {
    id: string;
    name: string;
    common_name: string;
    energy_kcal: number;
    energy_kj: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    micronutrients: Record<string, number>;
}

const COMPARISON_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#f43f5e', '#06b6d4', '#84cc16', '#d946ef', '#6366f1', '#14b8a6'];

export function CompareView() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { profile, dailyTargets, energyUnit, nutrientDisplayMode } = useUserPreferences();
    const { searchQuery, setSearchQuery, setResults, setIsLoading, registerResultClickHandler, setKeepFocusAfterSelect } = useSearch();
    const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
    const [selectedItems, setSelectedItems] = useState<FoodItem[]>([]);

    useEffect(() => {
        setKeepFocusAfterSelect(true);
        return () => setKeepFocusAfterSelect(false);
    }, [setKeepFocusAfterSelect]);

    useEffect(() => {
        registerResultClickHandler((result) => {
            const item = result.data as FoodItem;
            if (!item) return;
            setSelectedItems(prev => prev.some(i => i.id === item.id) ? prev.filter(i => i.id !== item.id) : prev.length < 10 ? [...prev, item] : prev);
        });
    }, [registerResultClickHandler]);

    useEffect(() => {
        const idsparam = searchParams.get('ids');
        if (idsparam) {
            const ids = idsparam.split(',');
            if (ids.length > 0) {
                const fetchSelected = async () => {
                    const { data } = await supabase.from('food_items').select('*').in('id', ids);
                    if (data) setSelectedItems(data);
                };
                fetchSelected();
            }
        }
    }, [searchParams]);

    useEffect(() => {
        const searchFoodItems = async () => {
            if (!searchQuery.trim()) {
                setResults([]);
                return;
            };
            setIsLoading(true);
            try {
                const { data } = await supabase.from('food_items').select('*').or(`name.ilike.%${searchQuery.trim()}%,common_name.ilike.%${searchQuery.trim()}%`).limit(20);
                if (data) {
                    setResults(data.map(item => ({
                        id: item.id,
                        title: item.common_name || item.name,
                        subtitle: selectedItems.some(i => i.id === item.id) ? '✓ In comparison' : 'Add to comparison',
                        data: item
                    })));
                }
            } catch (error) { console.error(error); } finally { setIsLoading(false); }
        };
        const timer = setTimeout(searchFoodItems, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, selectedItems, setResults, setIsLoading]);

    const radarData = ['Protein', 'Carbs', 'Fat', 'Fiber', 'Calories'].map(subject => {
        const entry: any = { subject };
        selectedItems.forEach((item, idx) => {
            let val = 0;
            if (subject === 'Protein') val = item.protein_g;
            else if (subject === 'Carbs') val = item.carbs_g;
            else if (subject === 'Fat') val = item.fat_g;
            else if (subject === 'Fiber') val = item.micronutrients?.['Fiber'] || 0;
            else if (subject === 'Calories') val = item.energy_kcal / 10;
            entry[`item${idx}`] = val;
        });
        return entry;
    });

    const userRDAs = useRDA(profile.age || 30, profile.gender || 'female', dailyTargets.energy || 2000);
    const getVal = (item: FoodItem, key: string) => {
        if (key === 'energy_kcal') return energyUnit === 'kJ' ? item.energy_kj : item.energy_kcal;
        return (item as any)[key] || item.micronutrients?.[key] || 0;
    };

    const ComparisonChart = ({ items, label }: { items: Record<string, string[]>, label: string }) => (
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900 space-y-4">
            <h4 className="font-black text-xs uppercase tracking-widest text-slate-400">{label}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                {Object.entries(items).map(([macro, keys]) => (
                    <div key={macro} className="p-4 rounded-xl border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                        <p className="text-[10px] uppercase font-black text-slate-400 mb-2">{macro}</p>
                        <div className="space-y-1.5">
                            {selectedItems.map((item, idx) => {
                                const val = getVal(item, keys[0]);
                                const rda = userRDAs?.[macro];
                                const pct = rda ? Math.round((val / rda) * 100) : 0;
                                const styles = getNutrientLevelStyles(pct, macro);
                                return (
                                    <div key={item.id} className="flex items-center justify-between text-[11px]">
                                        <div className="flex items-center gap-2 truncate flex-1">
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COMPARISON_COLORS[idx] }} />
                                            <span className="truncate opacity-70">{item.common_name || item.name}</span>
                                        </div>
                                        <span className="font-black">{val >= 10 ? Math.round(val) : val.toFixed(1)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">Comparison Lab</h2>
                    <p className="text-slate-500 font-medium text-sm max-w-lg">
                        Select and compare up to 10 foods side-by-side to find the most nutrient-dense options.
                    </p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                    {selectedItems.length === 0 ? <p className="text-xs text-slate-500 italic">Select items to compare...</p> : selectedItems.map((item, idx) => (
                        <Badge key={item.id} variant="outline" className="gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COMPARISON_COLORS[idx] }} />
                            {item.common_name || item.name}
                            <X size={12} className="cursor-pointer hover:text-rose-500" onClick={() => setSelectedItems(selectedItems.filter(i => i.id !== item.id))} />
                        </Badge>
                    ))}
                </div>
                {selectedItems.length > 0 && <Button variant="ghost" className="h-14 px-6 rounded-2xl text-rose-500 font-black uppercase tracking-widest text-[10px]" onClick={() => setSelectedItems([])}><RotateCcw size={16} className="mr-2" /> Reset</Button>}
            </div>

            {selectedItems.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] bg-white/30">
                    <Scale size={32} className="text-slate-300 mb-4" />
                    <p className="text-lg font-bold text-slate-900 dark:text-white mb-2">Analysis Lab Ready</p>
                </div>
            ) : (
                <div className="space-y-8 animate-in slide-in-from-bottom-2">
                    <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="#64748b" strokeOpacity={0.2} />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                                {selectedItems.map((item, idx) => <Radar key={item.id} name={item.common_name || item.name} dataKey={`item${idx}`} stroke={COMPARISON_COLORS[idx]} fill={COMPARISON_COLORS[idx]} fillOpacity={0.1} />)}
                                <RechartsTooltip />
                                <Legend />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    <ComparisonChart label="Macros & Energy" items={{ 'Energy': ['energy_kcal'], 'Protein': ['protein_g'], 'Carbs': ['carbs_g'], 'Fat': ['fat_g'] }} />
                    <ComparisonChart label="Electrolytes" items={{ 'Sodium': ['Sodium'], 'Potassium': ['Potassium'], 'Magnesium': ['Magnesium'], 'Calcium': ['Calcium'] }} />
                </div>
            )}
        </div>
    );
}
