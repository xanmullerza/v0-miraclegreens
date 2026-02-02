'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy, Crown, TrendingUp, Shield, Activity, Share2, Printer, Zap, Battery, Droplet, Gem, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';

import { useUserPreferences } from '@/lib/context/user-preferences-context';

// Reuse types/interfaces if possible, or redefine locally
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

function ComparisonReportContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const ids = searchParams.get('ids')?.split(',') || [];
    const { energyUnit } = useUserPreferences();

    const [items, setItems] = useState<FoodItem[]>([]);
    const [loading, setLoading] = useState(true); // Keep loading state for internal data fetching

    // Initializing state for share button
    const [copied, setCopied] = useState(false);

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    useEffect(() => {
        if (ids.length === 0) {
            router.push('/dashboard/comparefoods');
            return;
        }

        const fetchItems = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('food_items')
                .select('*')
                .in('id', ids);

            if (data) setItems(data);
            setLoading(false);
        };

        fetchItems();
    }, [searchParams]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (items.length < 2) return null;

    // --- LOGIC: Determine Winner & Insights ---
    const BENEFICIAL_NUTRIENTS = [
        { k: 'protein_g', l: 'Protein' }, { k: 'Fiber', l: 'Fiber' }, { k: 'Calcium', l: 'Calcium' },
        { k: 'Iron', l: 'Iron' }, { k: 'Magnesium', l: 'Magnesium' }, { k: 'Potassium', l: 'Potassium' },
        { k: 'Zinc', l: 'Zinc' }, { k: 'Vitamin A', l: 'Vitamin A' }, { k: 'Vitamin C', l: 'Vitamin C' },
        { k: 'Vitamin D', l: 'Vitamin D' }, { k: 'Vitamin E', l: 'Vitamin E' }, { k: 'B12 (Cobalamin)', l: 'Vitamin B12' }
    ];

    const scores = items.map(item => ({ ...item, score: 0, winningTraits: [] as string[] }));

    BENEFICIAL_NUTRIENTS.forEach(({ k, l }) => {
        const getVal = (i: FoodItem) => k === 'protein_g' ? i.protein_g : (i.micronutrients[k] || 0);
        const sorted = [...items].sort((a, b) => getVal(b) - getVal(a));
        // Winner gets 3 points
        const win = scores.find(s => s.id === sorted[0].id)!;
        win.score += 3;
        win.winningTraits.push(l);
    });

    const winner = scores.sort((a, b) => b.score - a.score)[0];
    const runnerUp = scores[1];

    // Helper to find specific strengths
    const getStrengths = (item: FoodItem) => {
        const strengths = [];
        if (item.protein_g > 15) strengths.push({ label: 'High Protein', icon: Zap });
        if ((item.micronutrients['Fiber'] || 0) > 5) strengths.push({ label: 'Fiber Rich', icon: Activity });
        if ((item.micronutrients['Vitamin C'] || 0) > 60) strengths.push({ label: 'Immunity Boost', icon: Shield });
        if ((item.micronutrients['Iron'] || 0) > 4) strengths.push({ label: 'High Iron', icon: Gem });
        return strengths;
    };

    // Format top winning traits
    const topTraits = winner.winningTraits.slice(0, 3).join(', ');

    return (
        <div className="max-w-5xl mx-auto pb-20 space-y-12">
            {/* Header / Nav */}
            <div className="flex items-center justify-between print:hidden">
                <Button variant="ghost" className="gap-2" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4" /> Back to Comparison
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2" onClick={() => window.print()}>
                        <Printer className="w-4 h-4" /> Print Report
                    </Button>
                    <Button
                        className={cn("gap-2 transition-all", copied ? "bg-slate-900" : "bg-emerald-600 hover:bg-emerald-700")}
                        onClick={handleShare}
                    >
                        {copied ? "Copied Link!" : "Share Results"} <Share2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* MAIN HEADER: THE VERDICT */}
            <div className="text-center space-y-6">
                <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200 uppercase tracking-widest px-4 py-1">
                    Head-to-Head Analysis Report
                </Badge>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight">
                    The Superior Choice is <br />
                    <span className="text-emerald-500 underline decoration-4 decoration-emerald-200 underline-offset-4">
                        {winner.common_name || winner.name}
                    </span>
                </h1>
                <p className="text-xl text-slate-500 max-w-2xl mx-auto">
                    Based on our clinical nutrient density scoring marked against the RDA for an average adult.
                </p>
            </div>

            {/* WINNER SPOTLIGHT */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 rounded-[32px] p-8 md:p-12 border border-emerald-500/20">
                <div className="space-y-6">
                    <div className="flex items-center gap-3 text-emerald-600 font-bold uppercase tracking-widest text-sm">
                        <Trophy className="w-6 h-6" /> Overall Winner
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-3xl font-bold">{winner.common_name || winner.name}</h2>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
                            Dominating in <span className="font-bold text-slate-900 dark:text-white">{topTraits}</span> content, {winner.common_name || winner.name} provides a superior micronutrient profile per calorie, making it the more efficient metabolic choice.
                        </p>

                        <div className="flex flex-wrap gap-3 pt-2">
                            {getStrengths(winner).map((s, i) => (
                                <Badge key={i} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white hover:bg-white border-none py-2 px-3 gap-2 shadow-sm">
                                    <s.icon className="w-3 h-3 text-emerald-500" /> {s.label}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>
                {/* Stat Highlight Visual */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-800 space-y-6">
                    <h3 className="font-bold text-center uppercase tracking-widest text-slate-400 text-xs">Performance Highlights</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                            <div className="text-2xl font-black text-emerald-500">{(winner.protein_g).toFixed(1)}g</div>
                            <div className="text-[10px] font-bold uppercase text-slate-400">Protein</div>
                        </div>
                        <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                            <div className="text-2xl font-black text-blue-500">{(energyUnit === 'kJ' ? winner.energy_kj : winner.energy_kcal).toFixed(0)}</div>
                            <div className="text-[10px] font-bold uppercase text-slate-400">{energyUnit === 'kJ' ? 'Kilojoules' : 'Calories'}</div>
                        </div>
                    </div>
                    {runnerUp && (
                        <div className="py-2 px-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-center text-xs text-slate-500">
                            <span className="font-bold text-emerald-600">{(winner.score / runnerUp.score * 100 - 100).toFixed(0)}% more nutrient dense</span> than {runnerUp.common_name || runnerUp.name}
                        </div>
                    )}
                </div>
            </div>

            {/* SILVER LINING SECTION */}
            {items.length > 1 && (
                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <TrendingUp className="text-blue-500" /> The Silver Lining
                        </h3>
                        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {items.filter(i => i.id !== winner.id).map(item => {
                            // Find one thing this item does better than the winner
                            const advantages = [];
                            if (item.protein_g > winner.protein_g) advantages.push({ label: 'Higher Protein', diff: `+${(item.protein_g - winner.protein_g).toFixed(1)}g` });
                            if ((item.micronutrients['calcium_mg'] || 0) > (winner.micronutrients['calcium_mg'] || 0)) advantages.push({ label: 'More Calcium', diff: 'Bone Health' });

                            const itemEnergy = energyUnit === 'kJ' ? item.energy_kj : item.energy_kcal;
                            const winnerEnergy = energyUnit === 'kJ' ? winner.energy_kj : winner.energy_kcal;

                            if (itemEnergy < winnerEnergy) advantages.push({ label: 'Lower Energy', diff: `-${(winnerEnergy - itemEnergy).toFixed(0)} ${energyUnit}` });

                            if (advantages.length === 0) advantages.push({ label: 'Alternative Taste', diff: 'Flavor Profile' });

                            return (
                                <div key={item.id} className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                    <h4 className="font-bold mb-2">{item.common_name || item.name}</h4>
                                    <div className="flex gap-1 mb-4">
                                        {item.protein_g > 10 && <Badge variant="outline" className="text-[8px] h-4 px-1 border-red-200 text-red-600 bg-red-50">High Protein</Badge>}
                                        {item.carbs_g < 5 && item.fat_g > 5 && <Badge variant="outline" className="text-[8px] h-4 px-1 border-blue-200 text-blue-600 bg-blue-50">Keto</Badge>}
                                        {itemEnergy < (energyUnit === 'kJ' ? 200 : 50) && <Badge variant="outline" className="text-[8px] h-4 px-1 border-green-200 text-green-600 bg-green-50">Low Energy</Badge>}
                                    </div>
                                    <p className="text-xs text-slate-500 mb-4 h-10">
                                        While it didn't win the overall density score, it is still a superior choice for specific goals:
                                    </p>
                                    <div className="space-y-2">
                                        {advantages.slice(0, 3).map((adv, i) => (
                                            <div key={i} className="flex justify-between items-center bg-white dark:bg-slate-800 p-2.5 rounded-lg text-xs shadow-sm">
                                                <span className="font-bold text-slate-700 dark:text-slate-300">{adv.label}</span>
                                                <Badge variant="secondary" className="text-[10px] h-5">{adv.diff}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* BEST FOR... BADGES */}
            <div className="bg-slate-900 text-white rounded-[32px] p-8 md:p-12 space-y-8">
                <div className="text-center">
                    <h3 className="text-2xl font-black mb-2">Scenario Analysis</h3>
                    <p className="text-slate-400">Which ingredient suits your specific goals?</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { title: 'Weight Loss', icon: Scale, desc: 'Lowest energy density', winner: [...items].sort((a, b) => a.energy_kcal - b.energy_kcal)[0] },
                        { title: 'Muscle Gain', icon: Zap, desc: 'Highest protein content', winner: [...items].sort((a, b) => b.protein_g - a.protein_g)[0] },
                        { title: 'Energy Boost', icon: Battery, desc: 'Highest B-Vitamin Complex', winner: [...items].sort((a, b) => (b.micronutrients['B12 (Cobalamin)'] || 0) - (a.micronutrients['B12 (Cobalamin)'] || 0))[0] },
                    ].map((scenario, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-emerald-500 rounded-lg text-white">
                                    <scenario.icon size={20} />
                                </div>
                                <div>
                                    <div className="font-bold">{scenario.title}</div>
                                    <div className="text-[10px] text-slate-400">{scenario.desc}</div>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-white/10">
                                <div className="text-xs text-emerald-400 uppercase font-black tracking-widest mb-1">Best Choice</div>
                                <div className="text-xl font-bold">{scenario.winner.common_name || scenario.winner.name}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}

export default function ComparisonReportPage() {
    return (
        <div className="min-h-screen p-4 md:p-8">
            <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
                </div>
            }>
                <ComparisonReportContent />
            </Suspense>
        </div>
    );
}
