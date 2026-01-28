'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
    Battery,
    FileText,
    ArrowRight,
    RotateCcw
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
import { useSearch } from '@/lib/context/search-context';

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

function DashboardComparisonContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { searchQuery, setSearchQuery, setResults, setIsLoading } = useSearch();
    const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
    const [selectedItems, setSelectedItems] = useState<FoodItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Initial load from URL
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
    }, []); // Run once on mount

    // Update URL when selection changes
    useEffect(() => {
        if (selectedItems.length > 0) {
            const ids = selectedItems.map(i => i.id).join(',');
            router.replace(`/dashboard/compare?ids=${ids}`, { scroll: false });
        } else {
            router.replace('/dashboard/compare', { scroll: false });
        }
    }, [selectedItems, router]);

    useEffect(() => {
        const searchFoodItems = async () => {
            if (!searchQuery.trim()) {
                setResults([]);
                setSearchResults([]);
                return;
            }

            setIsLoading(true);
            setLoading(true);
            try {
                let query = supabase
                    .from('food_items')
                    .select('id, name, common_name, energy_kcal, energy_kj, protein_g, carbs_g, fat_g, micronutrients')
                    .limit(15);

                query = query.or(`name.ilike.%${searchQuery.trim()}%,common_name.ilike.%${searchQuery.trim()}%`);

                const { data, error } = await query;

                if (error) throw error;
                if (data) {
                    setSearchResults(data);
                    // Push to global context for universal search bar dropdown
                    setResults(data.map(item => {
                        const isSelected = selectedItems.some(i => i.id === item.id);
                        return {
                            id: item.id,
                            title: item.common_name || item.name,
                            subtitle: isSelected ? '✓ Already in comparison' : 'Click to add to comparison',
                            badges: [
                                ...(item.protein_g > 10 ? ['High Protein'] : []),
                                ...(item.energy_kcal < 50 ? ['Low Calorie'] : [])
                            ],
                            onClick: () => {
                                if (!isSelected && selectedItems.length < 10) {
                                    setSelectedItems(prev => [...prev, item]);
                                }
                            }
                        };
                    }));
                }
            } catch (error) {
                console.error('Error searching foods:', error);
            } finally {
                setIsLoading(false);
                setLoading(false);
            }
        };

        const debounceTimer = setTimeout(searchFoodItems, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchQuery, selectedItems, setResults, setIsLoading]);

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
            <div className="flex flex-col md:flex-row md:items-center justify-end gap-4">
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/20 px-3 py-1">
                        {selectedItems.length} / 10 Selected
                    </Badge>
                    {selectedItems.length > 0 && (
                        <Button
                            size="sm"
                            className="bg-rose-500 hover:bg-rose-600 text-white shadow-md h-8 gap-2 font-bold px-4 transition-all animate-in zoom-in-50"
                            onClick={() => setSelectedItems([])}
                        >
                            <RotateCcw className="h-3.5 w-3.5" /> Reset
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Selector Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Selected Items</h3>
                                <span className="text-[10px] text-slate-500">{selectedItems.length}/10</span>
                            </div>

                            <div className="space-y-1 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {selectedItems.length === 0 ? (
                                    <div className="p-4 text-center text-slate-500 text-sm italic">
                                        Use the search bar above to add items
                                    </div>
                                ) : (
                                    selectedItems.map((item, idx) => (
                                        <button
                                            key={item.id}
                                            onClick={() => toggleItem(item)}
                                            className="w-full text-left p-3 rounded-xl border transition-all duration-200 flex justify-between items-center group bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500/50 text-emerald-700 dark:text-emerald-400"
                                        >
                                            <div className="min-w-0 flex-1 mr-2 flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COMPARISON_COLORS[idx] }} />
                                                <div>
                                                    <div className="font-semibold text-xs truncate capitalize">{item.common_name || item.name}</div>
                                                    <div className="text-[10px] opacity-60">Click to remove</div>
                                                </div>
                                            </div>
                                            <X size={14} className="text-emerald-500" />
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

                            {/* Scoreboard / Leaderboard */}
                            {selectedItems.length > 1 && (() => {
                                const BENEFICIAL_NUTRIENTS = [
                                    { key: 'protein_g', label: 'Protein' },
                                    { key: 'Fiber', label: 'Fiber' },
                                    { key: 'Calcium', label: 'Calcium' },
                                    { key: 'Iron', label: 'Iron' },
                                    { key: 'Magnesium', label: 'Magnesium' },
                                    { key: 'Potassium', label: 'Potassium' },
                                    { key: 'Zinc', label: 'Zinc' },
                                    { key: 'Vitamin A', label: 'Vit A' },
                                    { key: 'Vitamin C', label: 'Vit C' },
                                    { key: 'Vitamin D', label: 'Vit D' },
                                    { key: 'Vitamin E', label: 'Vit E' },
                                    { key: 'Vitamin K', label: 'Vit K' },
                                    { key: 'B1 (Thiamine)', label: 'B1' },
                                    { key: 'B2 (Riboflavin)', label: 'B2' },
                                    { key: 'B3 (Niacin)', label: 'B3' },
                                    { key: 'B5 (Pantothenic Acid)', label: 'B5' },
                                    { key: 'B6 (Pyridoxine)', label: 'B6' },
                                    { key: 'B9 (Folate)', label: 'Folate' },
                                    { key: 'B12 (Cobalamin)', label: 'B12' },
                                    { key: 'Choline', label: 'Choline' }
                                ];

                                const scores = selectedItems.map(item => ({ ...item, score: 0, wins: 0 }));

                                BENEFICIAL_NUTRIENTS.forEach(({ key }) => {
                                    // Sort items by this nutrient
                                    const sorted = [...selectedItems].sort((a, b) => getVal(b, key) - getVal(a, key));

                                    sorted.forEach((item, rank) => {
                                        const scoreItem = scores.find(s => s.id === item.id);
                                        if (scoreItem) {
                                            // 3 points for 1st, 2 for 2nd, 1 for 3rd
                                            if (rank === 0) { scoreItem.score += 3; scoreItem.wins += 1; }
                                            else if (rank === 1) scoreItem.score += 2;
                                            else if (rank === 2) scoreItem.score += 1;
                                        }
                                    });
                                });

                                const rankedItems = scores.sort((a, b) => b.score - a.score);
                                const winner = rankedItems[0];
                                const maxScore = rankedItems[0].score;

                                return (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                        {/* Winner Card */}
                                        <Card className="md:col-span-1 p-6 bg-gradient-to-br from-amber-100 to-orange-50 dark:from-amber-900/40 dark:to-orange-900/20 border-amber-200 dark:border-amber-800/50 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                                <Gem className="w-24 h-24 text-amber-500" />
                                            </div>
                                            <div className="relative z-10 flex flex-col h-full justify-between">
                                                <div>
                                                    <h3 className="text-amber-600 dark:text-amber-400 font-bold uppercase tracking-widest text-xs mb-2 flex items-center gap-2">
                                                        <Sparkles className="w-4 h-4" /> Nutrient Density Winner
                                                    </h3>
                                                    <div className="text-2xl font-black text-slate-900 dark:text-white mb-1 capitalize leading-tight">
                                                        {winner.common_name || winner.name}
                                                    </div>
                                                    <p className="text-xs text-amber-700/70 dark:text-amber-400/70 font-medium">
                                                        Won {winner.wins} categories
                                                    </p>
                                                </div>
                                                <div className="mt-6">
                                                    <div className="text-4xl font-black text-amber-500">{winner.score}</div>
                                                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6">Total Score</div>

                                                    <Button
                                                        onClick={() => {
                                                            const ids = selectedItems.map(i => i.id).join(',');
                                                            router.push(`/dashboard/compare/report?ids=${ids}`);
                                                        }}
                                                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 group"
                                                    >
                                                        <FileText className="w-4 h-4 mr-2" /> View Full Report <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>

                                        {/* Leaderboard */}
                                        <Card className="md:col-span-2 p-6 bg-white dark:bg-slate-900">
                                            <h3 className="font-bold text-sm uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                                                <Activity className="w-4 h-4" /> Official Leaderboard
                                            </h3>
                                            <div className="space-y-3">
                                                {rankedItems.map((item, idx) => {
                                                    const originalIdx = selectedItems.findIndex(i => i.id === item.id);
                                                    const isWinner = idx === 0;

                                                    return (
                                                        <div key={item.id} className="flex items-center gap-4 group">
                                                            <div className={cn(
                                                                "w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0",
                                                                isWinner ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                                                            )}>
                                                                {idx + 1}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex justify-between items-end mb-1">
                                                                    <div className="font-bold text-sm truncate capitalize flex items-center gap-2">
                                                                        {item.common_name || item.name}
                                                                        {isWinner && <Sparkles className="w-3 h-3 text-amber-500" />}
                                                                    </div>
                                                                    <div className="font-mono font-bold text-sm">{item.score} <span className="text-[10px] text-slate-400 font-normal">pts</span></div>
                                                                </div>
                                                                {/* Progress bar relative to winner */}
                                                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={cn("h-full rounded-full transition-all duration-500", isWinner ? "bg-amber-500" : "bg-emerald-500 opacity-50")}
                                                                        style={{
                                                                            width: `${(item.score / maxScore) * 100}%`,
                                                                            backgroundColor: isWinner ? undefined : COMPARISON_COLORS[originalIdx]
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </Card>
                                    </div>
                                );
                            })()}

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

export default function DashboardComparisonPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
            </div>
        }>
            <DashboardComparisonContent />
        </Suspense>
    );
}
