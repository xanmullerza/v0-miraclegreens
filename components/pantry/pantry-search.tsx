'use client';

import React, { useState, useRef } from 'react';
import { Search, Leaf, ChevronRight, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatFoodName } from '@/lib/utils';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { cn } from './pantry-types';

const CAL_TO_KJ = 4.184;
function formatEnergy(calories: number, unit: 'kcal' | 'kJ') {
    if (unit === 'kJ') return `${Math.round(calories * CAL_TO_KJ).toLocaleString()} kJ`;
    return `${Math.round(calories).toLocaleString()} kcal`;
}

interface PantrySearchProps {
    onSelect: (food: any) => void;
}

export function PantrySearch({ onSelect }: PantrySearchProps) {
    const { energyUnit } = useUserPreferences();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const performSearch = async (q: string) => {
        if (!q || q.length < 2) { setResults([]); return; }
        setIsSearching(true);
        try {
            const { data, error } = await supabase
                .from('food_items')
                .select('id, name, common_name, image, energy_kcal, category')
                .or(`name.ilike.%${q}%,common_name.ilike.%${q}%`)
                .limit(8);
            if (error) throw error;
            setResults(data || []);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleInput = (val: string) => {
        setQuery(val);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => performSearch(val), 300);
    };

    const handleSelect = (food: any) => {
        onSelect(food);
        setIsActive(false);
        setQuery('');
        setResults([]);
    };

    const handleClear = () => {
        setQuery('');
        setResults([]);
        setIsActive(false);
    };

    return (
        <div className="relative">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-amber-500 transition-all">
                <Search size={16} className="text-slate-400 shrink-0" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => { handleInput(e.target.value); setIsActive(true); }}
                    onFocus={() => setIsActive(true)}
                    placeholder="SEARCH FOODS TO ADD..."
                    className="flex-1 bg-transparent text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white placeholder-slate-400 outline-none"
                />
                {(query || isActive) && (
                    <button onClick={handleClear} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        <X size={14} className="text-slate-400" />
                    </button>
                )}
            </div>

            {isActive && query.length >= 2 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 max-h-72 overflow-y-auto">
                    {isSearching ? (
                        <div className="p-4 text-center text-xs font-black uppercase tracking-widest text-slate-400">Searching...</div>
                    ) : results.length === 0 ? (
                        <div className="p-4 text-center text-xs font-black uppercase tracking-widest text-slate-400">No matching foods found</div>
                    ) : (
                        results.map((food) => (
                            <button
                                key={food.id}
                                onClick={() => handleSelect(food)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                            >
                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-100 dark:border-slate-800">
                                    {food.image ? (
                                        <img src={food.image} className="w-full h-full object-cover" alt={food.common_name || food.name} />
                                    ) : (
                                        <Leaf className="m-auto opacity-10 h-full w-5" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1 text-left">
                                    <h4 className="font-black text-xs uppercase text-slate-900 dark:text-white truncate">
                                        {formatFoodName(food.common_name || food.name)}
                                    </h4>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                        {formatEnergy(food.energy_kcal || 0, energyUnit)} <span className="text-slate-200 dark:text-slate-700">|</span> {food.category || 'General'}
                                    </p>
                                </div>
                                <ChevronRight className="text-slate-200 group-hover:text-amber-500 transition-colors shrink-0" size={16} />
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
