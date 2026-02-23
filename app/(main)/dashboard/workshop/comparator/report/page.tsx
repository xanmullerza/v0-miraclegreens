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
            router.push('/dashboard/workshop/comparator');
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
        { k: 'protein_g', l: 'Protein' },
        { k: 'Fiber', l: 'Fiber' },
        { k: 'Calcium', l: 'Calcium' },
        { k: 'Iron', l: 'Iron' },
        { k: 'Magnesium', l: 'Magnesium' },
        { k: 'Potassium', l: 'Potassium' },
        { k: 'Zinc', l: 'Zinc' },
        { k: 'Vitamin A', l: 'Vitamin A' },
        { k: 'Vitamin C', l: 'Vitamin C' },
        { k: 'Vitamin D', l: 'Vitamin D' },
        { k: 'Vitamin E', l: 'Vitamin E' },
        { k: 'Vitamin B12', l: 'Vitamin B12' }
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
        <div className="max-w-5xl mx-auto pb-20 space-y-12 px-4 md:px-0">
            {/* Header / Nav */}
            <div className="flex items-center justify-between print:hidden">
                <Button variant="ghost" className="gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4" /> Back to Comparison
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2 text-[10px] font-black uppercase tracking-widest rounded-xl" onClick={() => window.print()}>
                        <Printer className="w-4 h-4" /> Print
                    </Button>
                    <Button
                        className={cn(
                            "gap-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg",
                            copied ? "bg-slate-900 border-none" : "bg-emerald-500 hover:bg-emerald-600 text-white border-none shadow-emerald-500/20"
                        )}
                        onClick={handleShare}
                    >
                        {copied ? "Copied!" : "Share"} <Share2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* MAIN HEADER: THE VERDICT */}
            <div className="text-center space-y-6">
                <Badge className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-none uppercase tracking-[0.2em] px-4 py-1.5 font-black text-[10px]">
                    Analysis Verdict
                </Badge>
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tighter">
                    THE SUPERIOR CHOICE IS <br />
                    <span className="text-emerald-500 uppercase italic">
                        {winner.common_name || winner.name}
                    </span>
                </h1>
                <p className="text-lg md:text-xl text-slate-400 dark:text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
                    Based on a comprehensive nutrient density check per 100g, optimized for your daily health goals.
                </p>
            </div>

            {/* WINNER SPOTLIGHT */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-12 border border-slate-100 dark:border-slate-800 shadow-2xl shadow-emerald-500/5">
                <div className="space-y-6">
                    <div className="flex items-center gap-3 text-emerald-500 font-black uppercase tracking-widest text-[10px]">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <Trophy className="w-4 h-4 text-emerald-500" />
                        </div>
                        Overall Winner
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-3xl md:text-4xl font-black uppercase text-slate-900 dark:text-white tracking-tight">{winner.common_name || winner.name}</h2>
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-base md:text-lg">
                            With more <span className="font-black text-emerald-500">{topTraits}</span>, {winner.common_name || winner.name} delivers significantly higher nutrient density in every serving.
                        </p>

                        <div className="flex flex-wrap gap-2 pt-2">
                            {getStrengths(winner).map((s, i) => (
                                <Badge key={i} className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-100 border-none py-2 px-3 gap-2 font-black text-[10px] uppercase tracking-widest">
                                    <s.icon className="w-3 h-3 text-emerald-500" /> {s.label}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>
                {/* Stat Highlight Visual */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 space-y-6">
                    <h3 className="font-black text-center uppercase tracking-[0.2em] text-slate-400 text-[10px]">Nutrient Intensity</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm">
                            <div className="text-3xl font-black text-emerald-500 tracking-tighter">{(winner.protein_g).toFixed(1)}g</div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Protein</div>
                        </div>
                        <div className="text-center p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm">
                            <div className="text-3xl font-black text-emerald-500 tracking-tighter">
                                {(energyUnit === 'kJ' ? winner.energy_kcal * 4.184 : winner.energy_kcal).toFixed(0)}
                            </div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{energyUnit}</div>
                        </div>
                    </div>
                    {runnerUp && (
                        <div className="py-3 px-4 bg-emerald-500/5 rounded-xl text-center">
                            <span className="font-black text-emerald-600 text-[10px] uppercase tracking-widest group italic">
                                {(winner.score / runnerUp.score * 100 - 100).toFixed(0)}% more nutrient dense
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* SILVER LINING SECTION */}
            {items.length > 1 && (
                <div className="space-y-12">
                    <div className="flex items-center gap-6">
                        <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                        <h3 className="text-sm font-black uppercase tracking-[0.3em] flex items-center gap-3 text-slate-400">
                            <TrendingUp className="text-emerald-500" size={16} /> The Runner Up
                        </h3>
                        <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {items.filter(i => i.id !== winner.id).map(item => {
                            // Find one thing this item does better than the winner
                            const advantages = [];
                            if (item.protein_g > winner.protein_g) advantages.push({ label: 'Higher Protein', diff: `+${(item.protein_g - winner.protein_g).toFixed(1)}g` });
                            if ((item.micronutrients['Calcium'] || 0) > (winner.micronutrients['Calcium'] || 0)) advantages.push({ label: 'More Calcium', diff: 'Bone Health' });

                            const itemEnergy = energyUnit === 'kJ' ? item.energy_kcal * 4.184 : item.energy_kcal;
                            const winnerEnergy = energyUnit === 'kJ' ? winner.energy_kcal * 4.184 : winner.energy_kcal;

                            if (itemEnergy < winnerEnergy) advantages.push({ label: 'Lower Energy', diff: `-${(winnerEnergy - itemEnergy).toFixed(0)} ${energyUnit}` });

                            if (advantages.length === 0) advantages.push({ label: 'Alternative Source', diff: 'Bio-Variety' });

                            return (
                                <div key={item.id} className="p-8 rounded-[2rem] bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 transition-all hover:shadow-xl hover:shadow-slate-500/5 group/card">
                                    <h4 className="font-black uppercase tracking-tight text-xl mb-3 text-slate-900 dark:text-white">{item.common_name || item.name}</h4>
                                    <div className="flex gap-1.5 mb-6">
                                        {item.protein_g > 10 && <Badge className="text-[8px] h-5 px-2 border-none font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">High Protein</Badge>}
                                        {itemEnergy < (energyUnit === 'kJ' ? 200 : 50) && <Badge className="text-[8px] h-5 px-2 border-none font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">Lean Choice</Badge>}
                                    </div>
                                    <p className="text-xs font-medium text-slate-400 mb-6 leading-relaxed">
                                        While not the overall winner, it offers specific strategic advantages:
                                    </p>
                                    <div className="space-y-2.5">
                                        {advantages.slice(0, 3).map((adv, i) => (
                                            <div key={i} className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border border-slate-50 dark:border-slate-800 group-hover/card:border-emerald-500/20 transition-colors">
                                                <span className="text-slate-600 dark:text-slate-400">{adv.label}</span>
                                                <span className="text-emerald-500 italic">{adv.diff}</span>
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
            <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-[3rem] p-8 md:p-16 space-y-12 border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full" />

                <div className="text-center relative z-10">
                    <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-4 italic">Optimized Per Goal</h3>
                    <p className="text-slate-400 font-medium max-w-xl mx-auto">Specific situational wins depending on your current training or dietary phase.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                    {[
                        { title: 'Weight Loss', icon: Scale, desc: 'Lowest energy density', winner: [...items].sort((a, b) => a.energy_kcal - b.energy_kcal)[0] },
                        { title: 'Muscle Gain', icon: Zap, desc: 'Highest protein content', winner: [...items].sort((a, b) => b.protein_g - a.protein_g)[0] },
                        { title: 'Vitality', icon: Battery, desc: 'Highest Vitamin B12', winner: [...items].sort((a, b) => (b.micronutrients['Vitamin B12'] || 0) - (a.micronutrients['Vitamin B12'] || 0))[0] },
                    ].map((scenario, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 rounded-[2rem] p-8 hover:bg-white/10 transition-all hover:scale-[1.02] duration-500 group">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-emerald-500 rounded-2xl text-white shadow-lg shadow-emerald-500/40 group-hover:rotate-12 transition-transform">
                                    <scenario.icon size={24} />
                                </div>
                                <div>
                                    <div className="font-black uppercase tracking-widest text-[10px] text-emerald-400 mb-1">{scenario.title}</div>
                                    <div className="text-xs text-slate-400 font-medium">{scenario.desc}</div>
                                </div>
                            </div>
                            <div className="pt-6 border-t border-white/10">
                                <div className="text-[8px] text-white/30 uppercase font-black tracking-[0.3em] mb-3">Superior Choice</div>
                                <div className="text-2xl font-black uppercase tracking-tight text-white line-clamp-2 leading-tight">{scenario.winner.common_name || scenario.winner.name}</div>
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
