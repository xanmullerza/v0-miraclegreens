'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
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

export default function ComparisonPage() {
    const [allItems, setAllItems] = useState<FoodItem[]>([]);
    const [selectedItems, setSelectedItems] = useState<FoodItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        const { data, error } = await supabase
            .from('food_items')
            .select('*')
            .order('name');

        if (data) {
            setAllItems(data);
        }
        setLoading(false);
    };

    const toggleItem = (item: FoodItem) => {
        if (selectedItems.some(i => i.id === item.id)) {
            setSelectedItems(selectedItems.filter(i => i.id !== item.id));
        } else if (selectedItems.length < 4) {
            setSelectedItems([...selectedItems, item]);
        }
    };

    const filteredItems = allItems.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.common_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                case 'Protein': val = item.protein_g; break;
                case 'Carbs': val = item.carbs_g; break;
                case 'Fat': val = item.fat_g; break;
                case 'Fiber': val = item.micronutrients['Fiber'] || 0; break;
                case 'Calories': val = item.energy_kcal / 10; break; // Scale calories down for viz
            }
            entry[`item${idx}`] = val;
        });
        return entry;
    });

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100 flex flex-col font-sans">
            <Header />

            <main className="flex-grow pt-24 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Hero Header */}
                    <div className="mb-12 text-center">
                        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300">
                            Ingredient Comparison
                        </h1>
                        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                            Analyze and compare clinical-grade nutritional profiles side-by-side to find the ultimate performance fuel.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Selector Sidebar */}
                        <div className="lg:col-span-1 space-y-6">
                            <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            placeholder="Search ingredients..."
                                            className="pl-10 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {loading ? (
                                            <div className="p-4 text-center text-slate-500">Loading...</div>
                                        ) : filteredItems.length === 0 ? (
                                            <div className="p-4 text-center text-slate-500 text-sm">No ingredients found</div>
                                        ) : (
                                            filteredItems.map(item => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => toggleItem(item)}
                                                    className={cn(
                                                        "w-full text-left p-3 rounded-lg border transition-all duration-200 flex justify-between items-center group",
                                                        selectedItems.some(i => i.id === item.id)
                                                            ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400"
                                                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800"
                                                    )}
                                                >
                                                    <div>
                                                        <div className="font-medium text-sm">{item.name}</div>
                                                        {item.common_name && (
                                                            <div className="text-xs opacity-60">{item.common_name}</div>
                                                        )}
                                                    </div>
                                                    {selectedItems.some(i => i.id === item.id) ? (
                                                        <X className="w-4 h-4" />
                                                    ) : (
                                                        <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    )}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-4 bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-none shadow-lg shadow-emerald-500/10">
                                <h4 className="font-bold flex items-center gap-2 mb-2">
                                    <Activity className="w-4 h-4" />
                                    Pro Tip
                                </h4>
                                <p className="text-xs text-emerald-50 opacity-90 leading-relaxed">
                                    Compare high-oxalate foods (like Spinach) with low-oxalate alternatives (like Kale) to optimize your health markers.
                                </p>
                            </Card>
                        </div>

                        {/* Comparison Result Area */}
                        <div className="lg:col-span-3">
                            {selectedItems.length === 0 ? (
                                <div className="h-[500px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-900/20 backdrop-blur-sm">
                                    <BarChart3 className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
                                    <h3 className="text-xl font-semibold text-slate-400">Select at least one ingredient to begin</h3>
                                    <p className="text-sm text-slate-500 mt-2">Add up to 4 items for a side-by-side analysis</p>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {/* Selected Item Badges */}
                                    <div className="flex flex-wrap gap-2">
                                        {selectedItems.map((item, idx) => (
                                            <Badge
                                                key={item.id}
                                                className="px-4 py-2 text-sm flex items-center gap-2 border-none shadow-sm"
                                                style={{ backgroundColor: COMPARISON_COLORS[idx], color: '#fff' }}
                                            >
                                                {item.common_name || item.name}
                                                <button onClick={() => toggleItem(item)} className="hover:opacity-70 transition-opacity">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>

                                    {/* Visual Radar Overlap */}
                                    <Card className="p-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative">
                                        <div className="absolute top-0 right-0 p-4">
                                            <Sparkles className="w-8 h-8 text-emerald-500/10" />
                                        </div>
                                        <h3 className="font-bold text-xl mb-8 flex items-center gap-3 text-slate-900 dark:text-white">
                                            <Zap className="w-6 h-6 text-yellow-500" />
                                            Nutrient Footprint Overview
                                        </h3>
                                        <div className="h-[400px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                                    <PolarGrid stroke="#e2e8f0" />
                                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                                    {selectedItems.map((item, idx) => (
                                                        <Radar
                                                            key={item.id}
                                                            name={item.common_name || item.name}
                                                            dataKey={`item${idx}`}
                                                            stroke={COMPARISON_COLORS[idx]}
                                                            fill={COMPARISON_COLORS[idx]}
                                                            fillOpacity={0.15}
                                                        />
                                                    ))}
                                                    <RechartsTooltip
                                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                                    />
                                                    <Legend />
                                                </RadarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </Card>

                                    {/* Detailed Stats Table */}
                                    <div className="space-y-6">
                                        <h3 className="font-bold text-2xl flex items-center gap-3 text-slate-900 dark:text-white mt-12 pb-2 border-b-2 border-slate-100 dark:border-slate-800">
                                            <Divide className="w-6 h-6 text-emerald-600 dark:text-emerald-400 rotate-12" />
                                            Precise Data Breakdown
                                        </h3>

                                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                            <table className="w-full text-left border-collapse bg-white dark:bg-slate-900">
                                                <thead>
                                                    <tr className="bg-slate-50 dark:bg-slate-800/50">
                                                        <th className="p-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px]">Nutrient (per 100g)</th>
                                                        {selectedItems.map((item, idx) => (
                                                            <th key={item.id} className="p-4 font-bold text-center" style={{ color: COMPARISON_COLORS[idx] }}>
                                                                {item.common_name || item.name}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                                    {/* Core Macros */}
                                                    <tr className="bg-slate-50/50 dark:bg-slate-800/20"><td colSpan={5} className="p-2 pl-4 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Core Micros</td></tr>
                                                    {[
                                                        { label: 'Calories (kcal)', key: 'energy_kcal' },
                                                        { label: 'Energy (kJ)', key: 'energy_kj' },
                                                        { label: 'Protein (g)', key: 'protein_g' },
                                                        { label: 'Carbs (g)', key: 'carbs_g' },
                                                        { label: 'Fat (g)', key: 'fat_g' },
                                                    ].map(row => (
                                                        <tr key={row.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                                                            <td className="p-4 font-medium text-sm">{row.label}</td>
                                                            {selectedItems.map(item => (
                                                                <td key={item.id} className="p-4 text-center text-sm font-semibold">
                                                                    {(item as any)[row.key]?.toFixed(row.key === 'energy_kcal' ? 0 : 2) || 0}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}

                                                    {/* High Impact Markers */}
                                                    <tr className="bg-slate-50/50 dark:bg-slate-800/20"><td colSpan={5} className="p-2 pl-4 text-[10px] font-bold text-rose-600 uppercase tracking-widest">Health & Lifestyle Markers</td></tr>
                                                    {[
                                                        { label: 'Oxalate (mg)', key: 'Oxalate' },
                                                        { label: 'Fiber (g)', key: 'Fiber' },
                                                        { label: 'Water (g)', key: 'Water' },
                                                        { label: 'Vitamin C (mg)', key: 'Vitamin C' },
                                                        { label: 'Vitamin A (µg)', key: 'Vitamin A' },
                                                        { label: 'Lutein (µg)', key: 'Lutein + Zeaxanthin' },
                                                    ].map(row => (
                                                        <tr key={row.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                                                            <td className="p-4 font-medium text-sm flex items-center gap-2">
                                                                {row.label}
                                                                {row.key === 'Oxalate' && <Badge variant="outline" className="text-[8px] h-4 px-1 border-rose-200 text-rose-600">Health Alert</Badge>}
                                                            </td>
                                                            {selectedItems.map(item => (
                                                                <td key={item.id} className="p-4 text-center text-sm font-bold">
                                                                    {item.micronutrients[row.key]?.toFixed(2) || '0.00'}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}

                                                    {/* Lipid Breakdown */}
                                                    <tr className="bg-slate-50/50 dark:bg-slate-800/20"><td colSpan={5} className="p-2 pl-4 text-[10px] font-bold text-blue-600 uppercase tracking-widest">Lipid Profile (g)</td></tr>
                                                    {[
                                                        { label: 'Saturated', key: 'Saturated Fat' },
                                                        { label: 'Omega-3', key: 'Omega-3' },
                                                        { label: 'Omega-6', key: 'Omega-6' },
                                                        { label: 'Cholesterol (mg)', key: 'Cholesterol' },
                                                    ].map(row => (
                                                        <tr key={row.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                                                            <td className="p-4 font-medium text-sm">{row.label}</td>
                                                            {selectedItems.map(item => (
                                                                <td key={item.id} className="p-4 text-center text-sm">
                                                                    {item.micronutrients[row.key]?.toFixed(2) || '0'}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}

                                                    {/* Amino Acids */}
                                                    <tr className="bg-slate-50/50 dark:bg-slate-800/20"><td colSpan={5} className="p-2 pl-4 text-[10px] font-bold text-purple-600 uppercase tracking-widest">Amino Acid Profile (g)</td></tr>
                                                    {[
                                                        'Alanine', 'Arginine', 'Aspartic acid', 'Glutamic acid', 'Glycine',
                                                        'Histidine', 'Isoleucine', 'Leucine', 'Lysine', 'Methionine',
                                                        'Phenylalanine', 'Proline', 'Serine', 'Threonine', 'Tryptophan',
                                                        'Tyrosine', 'Valine'
                                                    ].map(amino => (
                                                        <tr key={amino} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                                                            <td className="p-4 font-medium text-sm">{amino}</td>
                                                            {selectedItems.map(item => (
                                                                <td key={item.id} className="p-4 text-center text-sm">
                                                                    {item.micronutrients[amino]?.toFixed(3) || '0.000'}
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
            </main>

            <Footer />
        </div>
    );
}
