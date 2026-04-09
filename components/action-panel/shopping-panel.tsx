'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TrackerTabShell } from '@/components/tracker/tracker-tab-shell';
import { ShoppingQuickAdd } from '@/components/tracker/shopping/shopping-quick-add';
import { ShoppingItemList } from '@/components/tracker/shopping/shopping-item-list';
import { SHOPPING_STORAGE_KEY } from '@/components/tracker/shopping/shopping-types';
import { supabase } from '@/lib/supabase';
import { formatFoodName, cn } from '@/lib/utils';
import { Leaf, ChevronRight, Search, Grid3x3, ALargeSmall } from 'lucide-react';
import { useUserPreferences } from '@/lib/context/user-preferences-context';

const CAL_TO_KJ = 4.184;

function formatEnergy(calories: number, unit: 'kcal' | 'kJ') {
    if (unit === 'kJ') return `${Math.round(calories * CAL_TO_KJ).toLocaleString()} kJ`;
    return `${Math.round(calories).toLocaleString()} kcal`;
}

interface ShoppingPanelProps {
    onBack?: () => void;
}

export function ShoppingPanel({ onBack }: ShoppingPanelProps) {
    const { energyUnit } = useUserPreferences();
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedFood, setSelectedFood] = useState<any>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Navigation and Display State
    const [sortField, setSortField] = useState('category');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [scaleValue, setScaleValue] = useState(1);

    // Cleanup old "Replenish: " format items on mount
    useEffect(() => {
        try {
            const list = JSON.parse(localStorage.getItem(SHOPPING_STORAGE_KEY) || '[]');
            const needsCleanup = list.some((item: any) =>
                item.name?.startsWith('Replenish: ') || item.source === 'auto-replenish'
            );
            if (needsCleanup) {
                const cleaned = list.filter((item: any) =>
                    !item.name?.startsWith('Replenish: ') && item.source !== 'auto-replenish'
                );
                localStorage.setItem(SHOPPING_STORAGE_KEY, JSON.stringify(cleaned));
                window.dispatchEvent(new Event('storage'));
            }
        } catch { /* ignore */ }
    }, []);

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

    const handleSearchChange = (val: string) => {
        setSearchQuery(val);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => performSearch(val), 300);
    };

    const handleSelectResult = (food: any) => {
        setSelectedFood(food);
        setSearchQuery('');
        setResults([]);
    };

    return (
        <TrackerTabShell
            title="Shopping"
            theme="amber"
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            placeholder="SEARCH FOODS TO ADD..."
            sortField={sortField}
            setSortField={setSortField}
            sortDirection={sortDirection}
            setSortDirection={setSortDirection}
            sortOptions={[
                { id: 'category', label: 'Category', icon: <Grid3x3 size={18} /> },
                { id: 'name', label: 'Name', icon: <ALargeSmall size={18} /> },
            ]}
            scaleValue={scaleValue}
            onScaleChange={setScaleValue}
        >
            <div className="flex-1 overflow-y-auto flex flex-col p-3 pt-0">
                <div className="space-y-4">
                    {/* Search Results Dropdown Overlay Logic */}
                    {searchQuery.length >= 2 && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            {isSearching ? (
                                <div className="p-4 text-center text-xs font-black uppercase tracking-widest text-slate-400">
                                    Searching...
                                </div>
                            ) : results.length === 0 ? (
                                <div className="p-4 text-center text-xs font-black uppercase tracking-widest text-slate-400">
                                    No matching foods found
                                </div>
                            ) : (
                                results.map((food) => (
                                    <button
                                        key={food.id}
                                        onClick={() => handleSelectResult(food)}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group border-b last:border-0 border-slate-100 dark:border-slate-800 text-left"
                                    >
                                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-100 dark:border-slate-800">
                                            {food.image ? (
                                                <img src={food.image} className="w-full h-full object-cover" alt={food.common_name || food.name} />
                                            ) : (
                                                <Leaf className="m-auto opacity-10 h-full w-5" />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
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

                    {/* Quick Add Panel */}
                    {selectedFood && (
                        <ShoppingQuickAdd
                            food={selectedFood}
                            onClose={() => setSelectedFood(null)}
                            onAdded={() => setSelectedFood(null)}
                        />
                    )}

                    {/* Shopping List */}
                    <div className="pt-2">
                        <ShoppingItemList />
                    </div>
                </div>
            </div>
        </TrackerTabShell>
    );
}
