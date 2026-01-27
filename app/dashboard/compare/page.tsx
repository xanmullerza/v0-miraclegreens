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
    Divide,
    Gem,
    Droplet,
    Battery
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
import { useRDA } from '@/hooks/use-rda';
import { getNutrientLevelStyles } from '@/lib/utils/nutrient-styles';

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
    '#f43f5e', // rose-500
    '#06b6d4', // cyan-500
    '#84cc16', // lime-500
    '#d946ef', // fuchsia-500
    '#6366f1', // indigo-500
    '#14b8a6', // teal-500
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
        } else if (selectedItems.length < 10) {
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

    // Default RDA for comparison context (Adult Female, 30yo, 2000kcal)
    const userRDAs = useRDA(30, 'female', 2000);

    const getVal = (item: FoodItem, key: string) => {
        if (key === 'energy_kcal') return item.energy_kcal;
        if (key === 'protein_g') return item.protein_g;
        if (key === 'carbs_g') return item.carbs_g;
        if (key === 'fat_g') return item.fat_g;
        return item.micronutrients?.[key] || 0;
    };

    const ComparisonGrid = ({ title, items, icon: Icon, theme = 'indigo', subtitle }: { title: string, items: Record<string, string[]>, icon: any, theme?: 'indigo' | 'rose' | 'emerald' | 'blue' | 'amber', subtitle?: string }) => {
        const themes = {
            indigo: { bg: "bg-slate-900 border-slate-800", text: "text-indigo-400", border: "border-slate-800", itemBorder: "border-indigo-900/50" },
            rose: { bg: "bg-slate-900 border-slate-800", text: "text-rose-400", border: "border-slate-800", itemBorder: "border-rose-900/50" },
            emerald: { bg: "bg-slate-900 border-slate-800", text: "text-emerald-400", border: "border-slate-800", itemBorder: "border-emerald-900/50" },
            blue: { bg: "bg-slate-900 border-slate-800", text: "text-blue-400", border: "border-slate-800", itemBorder: "border-blue-900/50" },
            amber: { bg: "bg-slate-900 border-slate-800", text: "text-amber-400", border: "border-slate-800", itemBorder: "border-amber-900/50" }
        };
        const t = themes[theme];

        return (
            <div className={cn("p-6 rounded-2xl border bg-gradient-to-br", t.bg)}>
                <h4 className={cn("font-black flex items-center gap-2 mb-1 uppercase tracking-widest text-sm", t.text)}><Icon className="h-5 w-5" /> {title}</h4>
                {subtitle && <p className={cn("text-[10px] text-muted-foreground mb-4 border-b pb-2", t.border)}>{subtitle}</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(items).map(([label, keys]) => {
                        const unitLabel = label.includes('Folate') || label.includes('B12') || label.includes('Biotin') || label.includes('Selenium') || label.includes('Vitamin A') || label.includes('Vitamin K') || label.includes('Vitamin D') ? 'µg' : label.includes('Vitamin D') ? 'IU' : 'mg';

                        return (
                            <div key={label} className={cn("p-4 rounded-xl border bg-white dark:bg-slate-900 hover:shadow-md transition-all", t.itemBorder)}>
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-[10px] uppercase font-black text-foreground/60 truncate">{label}</p>
                                    <span className="text-[10px] text-muted-foreground font-bold">{unitLabel}</span>
                                </div>
                                <div className="space-y-2">
                                    {selectedItems.map((item, idx) => {
                                        const key = keys.find(k => k === 'energy_kcal' || k === 'protein_g' || k === 'carbs_g' || k === 'fat_g' || item.micronutrients?.[k] !== undefined) || keys[0];
                                        const val = getVal(item, key);
                                        const rda = userRDAs?.[label];
                                        const pct = rda ? Math.round((val / rda) * 100) : 0;
                                        const styles = getNutrientLevelStyles(pct, label);

                                        return (
                                            <div key={item.id} className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2 truncate max-w-[60%]">
                                                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COMPARISON_COLORS[idx] }} />
                                                    <span className="truncate opacity-80">{item.common_name || item.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold">{val >= 1 ? val.toFixed(0) : val.toFixed(1)}</span>
                                                    {rda && (
                                                        <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-black min-w-[32px] text-center", styles.bg, styles.textFill)}>
                                                            {pct}%
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Ingredient Analysis</h1>
                    <p className="text-slate-500 mt-1 text-sm">Compare clinical-grade nutritional profiles side-by-side.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/20 px-3 py-1">
                        {selectedItems.length} / 10 Selected
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
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                            {/* Visual Radar Overlap */}
                            <Card className="p-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative">
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

                            {/* Detailed Stats Cards */}

                            {/* MACROS */}
                            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900 space-y-6">
                                <div>
                                    <h4 className="font-black flex items-center gap-2 mb-1 text-orange-400 uppercase tracking-widest text-sm"><Zap className="h-5 w-5" /> Macronutrients</h4>
                                    <p className="text-[10px] text-slate-400 mb-4 border-b border-slate-800 pb-2">Energy providers • Fuel for your body</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {[
                                            { label: 'Energy', keys: ['energy_kcal'], unit: 'kcal' },
                                            { label: 'Protein', keys: ['protein_g'], unit: 'g' },
                                            { label: 'Carbs', keys: ['carbs_g'], unit: 'g' },
                                            { label: 'Fat', keys: ['fat_g'], unit: 'g' },
                                        ].map(macro => (
                                            <div key={macro.label} className="p-4 rounded-xl border bg-white dark:bg-slate-900 hover:shadow-md transition-all">
                                                <div className="flex justify-between items-center mb-2">
                                                    <p className="text-[10px] uppercase font-black text-foreground/60 truncate">{macro.label}</p>
                                                    <span className="text-[10px] text-muted-foreground font-bold">{macro.unit}</span>
                                                </div>
                                                <div className="space-y-2">
                                                    {selectedItems.map((item, idx) => {
                                                        const val = getVal(item, macro.keys[0]);
                                                        const target = macro.label === 'Energy' ? 2000 : macro.label === 'Protein' ? 50 : macro.label === 'Carbs' ? 250 : 70; // Rough averages
                                                        const pct = Math.round((val / target) * 100);
                                                        const styles = getNutrientLevelStyles(pct, macro.label);

                                                        return (
                                                            <div key={item.id} className="flex items-center justify-between text-xs">
                                                                <div className="flex items-center gap-2 truncate max-w-[60%]">
                                                                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COMPARISON_COLORS[idx] }} />
                                                                    <span className="truncate opacity-80">{item.common_name || item.name}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold">{Math.round(val)}</span>
                                                                    <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-black min-w-[32px] text-center", styles.bg, styles.textFill)}>
                                                                        {pct}%
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* ELECTROLYTES */}
                            <ComparisonGrid title="Electrolytes" icon={Zap} theme="indigo" subtitle="Hydration • Muscle & Nerve Function" items={{
                                'Sodium': ['Sodium', 'sodium_mg'],
                                'Potassium': ['Potassium', 'potassium_mg'],
                                'Magnesium': ['Magnesium', 'magnesium_mg'],
                                'Calcium': ['Calcium', 'calcium_mg'],
                                'Phosphorus': ['Phosphorus', 'phosphorus_mg']
                            }} />

                            {/* TRACE MINERALS */}
                            <ComparisonGrid title="Trace Minerals" icon={Gem} theme="rose" subtitle="Essential micro-minerals" items={{
                                'Iron': ['Iron', 'iron_mg'],
                                'Zinc': ['Zinc', 'zinc_mg'],
                                'Copper': ['Copper', 'copper_mg'],
                                'Manganese': ['Manganese', 'manganese_mg'],
                                'Selenium': ['Selenium', 'selenium_ug']
                            }} />

                            {/* DAILY VITAMINS */}
                            <ComparisonGrid title="Daily Vitamins" icon={Droplet} theme="blue" subtitle="Water-soluble • Must be replenished daily" items={{
                                'B1 (Thiamine)': ['B1 (Thiamine)', 'thiamine_mg'],
                                'B2 (Riboflavin)': ['B2 (Riboflavin)', 'riboflavin_mg'],
                                'B3 (Niacin)': ['B3 (Niacin)', 'niacin_mg'],
                                'B5 (Pantothenic)': ['B5 (Pantothenic Acid)', 'pantothenic_acid_mg'],
                                'B6 (Pyridoxine)': ['B6 (Pyridoxine)', 'vitamin_b6_mg'],
                                'B7 (Biotin)': ['Biotin', 'biotin_ug'],
                                'B9 (Folate)': ['B9 (Folate)', 'folate_ug'],
                                'B12 (Cobalamin)': ['B12 (Cobalamin)', 'vitamin_b12_ug'],
                                'Vitamin C': ['Vitamin C', 'vitamin_c_mg'],
                                'Choline': ['Choline', 'choline_mg'],
                            }} />

                            {/* STORED VITAMINS */}
                            <ComparisonGrid title="Stored Vitamins" icon={Battery} theme="emerald" subtitle="Fat-soluble • Stored in body tissues" items={{
                                'Vitamin A': ['Vitamin A', 'vitamin_a_ug'],
                                'Vitamin D': ['Vitamin D', 'vitamin_d_iu', 'vitamin_d_ug'],
                                'Vitamin E': ['Vitamin E', 'vitamin_e_mg'],
                                'Vitamin K': ['Vitamin K', 'vitamin_k_ug'],
                            }} />

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
