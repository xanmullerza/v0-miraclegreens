'use client';

import { useState, useMemo } from 'react';
import { Search, X, Activity, Leaf, ArrowRight, Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import { searchUSDAFood, getUSDAFoodDetails } from '@/lib/services/nutrition';
import { toast } from 'sonner';

interface USDAHeroSearchProps {
    onSelect: (item: any) => void;
    placeholder?: string;
    className?: string;
}

export function USDAHeroSearch({ onSelect, placeholder = "CLICK TO SEARCH GLOBAL DATABASE...", className }: USDAHeroSearchProps) {
    const [heroSearchQuery, setHeroSearchQuery] = useState('');
    const [heroResults, setHeroResults] = useState<any[]>([]);
    const [isHeroSearching, setIsHeroSearching] = useState(false);
    const [isHeroActive, setIsHeroActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const heroSearchTimeoutRef = useMemo(() => ({ current: null as NodeJS.Timeout | null }), []);

    const performUSDASearch = async (query: string) => {
        if (!query || query.length < 2) {
            setHeroResults([]);
            return;
        }
        setIsHeroSearching(true);
        try {
            const results = await searchUSDAFood(query);
            setHeroResults(results);
        } catch (error) {
            console.error('USDA search error:', error);
        } finally {
            setIsHeroSearching(false);
        }
    };

    const handleHeroSearchInput = (val: string) => {
        setHeroSearchQuery(val);
        if (heroSearchTimeoutRef.current) clearTimeout(heroSearchTimeoutRef.current);
        heroSearchTimeoutRef.current = setTimeout(() => performUSDASearch(val), 300);
    };

    const handleSelectUSDAResult = async (heroItem: any) => {
        setLoading(true);
        try {
            const details = await getUSDAFoodDetails(heroItem.fdcId);
            const itemToImport = {
                ...heroItem,
                ...details,
                common_name: heroItem.name
            };
            onSelect(itemToImport);
            setIsHeroActive(false);
            setHeroSearchQuery('');
            setHeroResults([]);
        } catch (error) {
            console.error('Error selecting USDA result:', error);
            toast.error('Failed to import food details');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={cn("w-full md:max-w-[900px] mx-auto bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all duration-500 flex flex-col mb-10", className)}>
            <div className="h-[180px] overflow-y-auto p-4 md:p-8 no-scrollbar bg-slate-50/50 dark:bg-slate-800/10 order-1">
                {isHeroActive ? (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        {isHeroSearching || loading ? (
                            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-4">
                                <div className="relative">
                                    <Activity className="animate-spin text-emerald-500" size={32} />
                                    <div className="absolute inset-0 animate-ping bg-emerald-500/20 rounded-full" />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
                                    {loading ? "Importing Food Details..." : "Searching Global Database..."}
                                </p>
                            </div>
                        ) : heroResults.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {heroResults.map(food => (
                                    <button
                                        key={food.fdcId}
                                        onClick={() => handleSelectUSDAResult(food)}
                                        className="w-full p-4 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-900/10 flex items-center justify-between group transition-all border border-slate-100 dark:border-slate-800 hover:border-emerald-500/30 text-left"
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800">
                                                <Leaf className="m-auto opacity-10 h-full w-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-black text-sm uppercase text-slate-900 dark:text-white truncate">{food.name}</h4>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                                    {Math.round(food.energy_kcal)} KCAL <span className="text-slate-200 dark:text-slate-700">|</span> {food.dataType || 'USDA'}
                                                </p>
                                            </div>
                                        </div>
                                        <ArrowRight className="text-slate-200 group-hover:text-emerald-500 transition-colors shrink-0" size={20} />
                                    </button>
                                ))}
                            </div>
                        ) : heroSearchQuery.length > 1 ? (
                            <div className="py-12 text-center text-slate-400">
                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200 dark:border-slate-700">
                                    <Search size={24} className="opacity-20" />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">No matching items found</p>
                            </div>
                        ) : (
                            <div className="py-12 text-center text-slate-400">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Enter ingredient name to import details</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center animate-in fade-in duration-700">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 relative">
                            <Database size={24} className="text-emerald-500" />
                            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-1">Ready to Import?</h3>
                        <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest max-w-xs">
                            Search the Global USDA Database for instant nutrition facts
                        </p>
                    </div>
                )}
            </div>

            <div className="p-4 md:p-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-white dark:bg-slate-900 order-2 rounded-b-[2.5rem]">
                <div className="flex-1 relative flex items-center">
                    <div className={cn("absolute left-5 transition-colors", isHeroActive ? "text-emerald-500/50" : "text-slate-300")}>
                        <Search size={16} className="md:w-5 md:h-5" />
                    </div>
                    <input
                        placeholder={isHeroActive ? "SEARCH GLOBAL DATABASE..." : placeholder}
                        className={cn(
                            "w-full bg-slate-50 dark:bg-slate-800/50 border-2 transition-all shadow-sm text-[10px] md:text-sm font-black uppercase tracking-widest h-12 md:h-14 rounded-[1.5rem] md:rounded-[2rem] pl-12 pr-6 text-slate-900 dark:text-white placeholder:text-slate-300 outline-none",
                            isHeroActive
                                ? "border-emerald-500/30 focus:border-emerald-500/80 focus:ring-4 focus:ring-emerald-500/10 focus:bg-white dark:focus:bg-slate-800/80"
                                : "border-slate-100 dark:border-slate-800 cursor-pointer hover:border-emerald-500/20"
                        )}
                        value={heroSearchQuery}
                        onFocus={() => setIsHeroActive(true)}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                                setIsHeroActive(false);
                                setHeroSearchQuery('');
                                setHeroResults([]);
                            }
                        }}
                        onChange={(e) => {
                            if (!isHeroActive) setIsHeroActive(true);
                            handleHeroSearchInput(e.target.value);
                        }}
                    />
                </div>
                {isHeroActive ? (
                    <button
                        onClick={() => {
                            setIsHeroActive(false);
                            setHeroSearchQuery("");
                            setHeroResults([]);
                        }}
                        className="w-12 h-12 md:w-14 md:h-14 flex-shrink-0 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 flex items-center justify-center transition-all active:scale-95 group/cancel shadow-sm"
                        title="Close Search"
                    >
                        <X size={18} className="md:w-6 md:h-6 group-hover/cancel:rotate-90 transition-transform duration-300" />
                    </button>
                ) : (
                    <div className="w-12 h-12 md:w-14 md:h-14 flex-shrink-0 rounded-full bg-slate-50 dark:bg-slate-800/50 text-slate-300 flex items-center justify-center">
                        <Search size={18} className="md:w-6 md:h-6" />
                    </div>
                )}
            </div>
        </div>
    );
}
