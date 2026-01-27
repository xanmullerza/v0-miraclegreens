'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Scale,
    Zap,
    Beef,
    Utensils,
    Sparkles,
    Search,
    X,
    Plus,
    Activity,
    BarChart3,
    Divide
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden", className)}>
        {children}
    </div>
);

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

const COMPARISON_COLORS = [
    '#10b981', // emerald-500
    '#3b82f6', // blue-500
    '#f59e0b', // amber-500
    '#8b5cf6', // violet-500
];

export default function DashboardComparisonPage() {
    const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
    const [selectedItems, setSelectedItems] = useState<FoodItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const searchFoodItems = async () => {
            setLoading(true);
            try {
                let query = supabase
                    .from('food_items')
                    .select('id, name, common_name, energy_kcal, energy_kj, protein_g, carbs_g, fat_g, micronutrients')
                    .limit(50);

                if (searchQuery.trim()) {
                    query = query.or(`name.ilike.%${searchQuery.trim()}%,common_name.ilike.%${searchQuery.trim()}%`);
                } else {
                    query = query.order('name', { ascending: true });
                }

                const { data, error } = await query;

                if (error) throw error;
                if (data) setSearchResults(data);
            } catch (error) {
                console.error('Error searching foods:', error);
            } finally {
                setLoading(false);
            }
        };

        const debounceTimer = setTimeout(searchFoodItems, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchQuery]);

    const toggleItem = (item: FoodItem) => {
        if (selectedItems.some(i => i.id === item.id)) {
            setSelectedItems(selectedItems.filter(i => i.id !== item.id));
        } else if (selectedItems.length < 4) {
            setSelectedItems([...selectedItems, item]);
        }
    };

    // Prepare radar data
    const radarData = [
        { subject: 'Protein', fullMark: 100 },
        { subject: 'Carbs', fullMark: 100 },
        { subject: 'Fat', fullMark: 100 },
        { subject: 'Fiber', fullMark: 100 },
        { subject: 'Calories', fullMark: 100 },
    ].map(base => {
        const entry: any = { subject: base.subject };
        selectedItems.forEach((item, idx) => {
            let val = 0;
            switch (base.subject) {
                case 'Protein': val = parseFloat(item.protein_g as any) || 0; break;
                case 'Carbs': val = parseFloat(item.carbs_g as any) || 0; break;
                case 'Fat': val = parseFloat(item.fat_g as any) || 0; break;
                case 'Fiber': val = parseFloat(item.micronutrients['Fiber'] as any) || 0; break;
                case 'Calories': val = (parseFloat(item.energy_kcal as any) || 0) / 10; break;
            }
            entry[`item${idx}`] = val;
        });
        return entry;
    });

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Ingredient Analysis</h1>
                    <p className="text-slate-500 mt-1 text-sm">Compare clinical-grade nutritional profiles side-by-side.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/20 px-3 py-1">
                        {selectedItems.length} / 4 Selected
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Selector Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search library..."
                                    className="pl-10 h-9 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="space-y-1 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {loading ? (
                                    <div className="p-8 text-center">
                                        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-emerald-500 border-r-transparent align-[-0.125em]" />
                                    </div>
                                ) : searchResults.length === 0 ? (
                                    <div className="p-4 text-center text-slate-500 text-sm italic">No ingredients found</div>
                                ) : (
                                    searchResults.map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => toggleItem(item)}
                                            className={cn(
                                                "w-full text-left p-3 rounded-xl border transition-all duration-200 flex justify-between items-center group",
                                                selectedItems.some(i => i.id === item.id)
                                                    ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500/50 text-emerald-700 dark:text-emerald-400"
                                                    : "bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-800"
                                            )}
                                        >
                                            <div className="min-w-0">
                                                <div className="font-semibold text-xs truncate capitalize">{item.name}</div>
                                                {item.common_name && (
                                                    <div className="text-[10px] opacity-60 truncate">Common: {item.common_name}</div>
                                                )}
                                            </div>
                                            {selectedItems.some(i => i.id === item.id) ? (
                                                <X size={14} className="text-emerald-500" />
                                            ) : (
                                                <Plus size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </Card>

                    <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                            <Activity size={12} />
                            Comparison Tips
                        </h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                            Compare high-oxalate foods like Spinach with alternatives like Kale to visualize your metabolic load.
                        </p>
                    </div>
                </div>

                {/* Comparison Result Area */}
                <div className="lg:col-span-3 space-y-8">
                    {selectedItems.length === 0 ? (
                        <div className="h-[600px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white/30 dark:bg-slate-900/10 backdrop-blur-sm group">
                            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700 mb-6 group-hover:scale-110 transition-transform">
                                <BarChart3 size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-400">Analysis Lab Ready</h3>
                            <p className="text-sm text-slate-500 mt-1">Select ingredients from the library to begin</p>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Visual Radar Overlap */}
                            <Card className="p-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative mb-8">
                                <div className="absolute top-0 right-0 p-8">
                                    <Sparkles className="w-12 h-12 text-emerald-500/5" />
                                </div>
                                <h3 className="font-bold text-lg mb-8 flex items-center gap-3 text-slate-900 dark:text-white">
                                    <Zap className="w-5 h-5 text-yellow-500" />
                                    Nutrient Footprint Overlap
                                </h3>
                                <div className="h-[450px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                            <PolarGrid stroke="#e2e8f0" strokeOpacity={0.5} />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} />
                                            {selectedItems.map((item, idx) => (
                                                <Radar
                                                    key={item.id}
                                                    name={item.common_name || item.name}
                                                    dataKey={`item${idx}`}
                                                    stroke={COMPARISON_COLORS[idx]}
                                                    fill={COMPARISON_COLORS[idx]}
                                                    fillOpacity={0.2}
                                                />
                                            ))}
                                            <RechartsTooltip
                                                contentStyle={{
                                                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                                    backdropFilter: 'blur(8px)',
                                                    border: 'none',
                                                    borderRadius: '12px',
                                                    color: '#fff',
                                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                                }}
                                            />
                                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>

                            {/* Detailed Stats Table */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-xl flex items-center gap-3 text-slate-900 dark:text-white">
                                        <Divide className="w-5 h-5 text-emerald-500 rotate-12" />
                                        Clinical Data Matrix
                                    </h3>
                                    <Badge variant="outline" className="text-[10px] uppercase tracking-tighter opacity-50">
                                        Values per 100g
                                    </Badge>
                                </div>

                                <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 dark:bg-slate-800/50">
                                                <th className="p-6 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px] w-64">Nutrient</th>
                                                {selectedItems.map((item, idx) => (
                                                    <th key={item.id} className="p-6 font-bold text-center border-l border-slate-100 dark:border-slate-800" style={{ color: COMPARISON_COLORS[idx] }}>
                                                        <div className="text-xs uppercase tracking-tight truncate max-w-[120px] mx-auto">
                                                            {item.common_name || item.name}
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                            {/* Core Macros */}
                                            <tr className="bg-slate-50/30 dark:bg-slate-800/20">
                                                <td colSpan={selectedItems.length + 1} className="p-3 pl-6 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Energy & Macronutrients</td>
                                            </tr>
                                            {[
                                                { label: 'Calories (kcal)', key: 'energy_kcal', bold: true },
                                                { label: 'Energy (kJ)', key: 'energy_kj' },
                                                { label: 'Protein (g)', key: 'protein_g' },
                                                { label: 'Carbs (g)', key: 'carbs_g' },
                                                { label: 'Fat (g)', key: 'fat_g' },
                                            ].map(row => (
                                                <tr key={row.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                                                    <td className="p-5 pl-6 font-medium text-xs text-slate-600 dark:text-slate-400">{row.label}</td>
                                                    {selectedItems.map(item => (
                                                        <td key={item.id} className={cn(
                                                            "p-5 text-center text-xs border-l border-slate-100 dark:border-slate-800",
                                                            row.bold ? "font-bold text-slate-900 dark:text-white" : "font-semibold"
                                                        )}>
                                                            {parseFloat((item as any)[row.key] || 0).toFixed(row.key === 'energy_kcal' ? 0 : 2)}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}

                                            {/* High Impact Markers */}
                                            <tr className="bg-slate-50/30 dark:bg-slate-800/20">
                                                <td colSpan={selectedItems.length + 1} className="p-3 pl-6 text-[10px] font-black text-rose-600 uppercase tracking-widest text-[10px]">Critical Health Markers</td>
                                            </tr>
                                            {[
                                                { label: 'Oxalate (mg)', key: 'Oxalate', alert: true },
                                                { label: 'Fiber (g)', key: 'Fiber' },
                                                { label: 'Vitamin C (mg)', key: 'Vitamin C' },
                                                { label: 'Vitamin A (µg)', key: 'Vitamin A' },
                                                { label: 'Omega-3 (g)', key: 'Omega-3' },
                                                { label: 'Sugars (g)', key: 'Sugars' },
                                            ].map(row => (
                                                <tr key={row.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                                                    <td className="p-5 pl-6 text-xs flex items-center gap-3">
                                                        <span className="font-medium text-slate-600 dark:text-slate-400">{row.label}</span>
                                                        {row.alert && <Badge variant="outline" className="text-[8px] h-4 px-1.5 border-rose-200 text-rose-600 bg-rose-50 font-black">ALERT</Badge>}
                                                    </td>
                                                    {selectedItems.map(item => (
                                                        <td key={item.id} className="p-5 text-center text-xs font-bold border-l border-slate-100 dark:border-slate-800">
                                                            {parseFloat(item.micronutrients[row.key] as any || 0).toFixed(2)}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
