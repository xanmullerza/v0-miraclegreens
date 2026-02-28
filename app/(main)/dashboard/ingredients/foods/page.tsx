'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Leaf, ChevronRight, Plus } from 'lucide-react';
import { ExploreView } from './views/explore-view';
import { PageContainer } from '@/components/ui/page-container';
import { HeroSearch } from '@/components/ui/hero-search';
import { supabase } from '@/lib/supabase';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { useSearch } from '@/lib/context/search-context';
import { formatEnergy } from '@/lib/utils';

/** Narrow shape — only what the hero dropdown actually fetches and displays. */
interface FoodItemPreview {
    id: string;
    name: string;
    common_name: string;
    energy_kcal: number;
    category?: string;
    image: string | null;
}

export default function IngredientsPage() {
    const router = useRouter();
    const { energyUnit } = useUserPreferences();
    const { searchQuery, setSearchQuery } = useSearch();

    const [searchResults, setSearchResults] = useState<FoodItemPreview[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [showAddFood, setShowAddFood] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const performSearch = useCallback(async (query: string) => {
        if (!query || query.length < 2) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const { data, error } = await supabase
                .from('food_items')
                .select('id, name, common_name, energy_kcal, category, image')
                .or(`name.ilike.%${query}%,common_name.ilike.%${query}%`)
                .limit(8);
            if (error) throw error;
            setSearchResults((data ?? []) as FoodItemPreview[]);
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setIsSearching(false);
        }
    }, []);

    // Single timer: updates the shared context (→ ExploreView list) and fires the
    // hero dropdown query together, avoiding two overlapping DB round-trips.
    const handleSearchInput = useCallback((val: string) => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
            setSearchQuery(val);   // ExploreView's effect reads this from context
            performSearch(val);    // hero dropdown query
        }, 300);
    }, [setSearchQuery, performSearch]);

    const renderResult = useCallback((item: FoodItemPreview) => (
        <div className="flex items-center gap-4 min-w-0 w-full">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-100 dark:border-slate-800 relative">
                {item.image ? (
                    <Image src={item.image} fill className="object-cover" alt={item.common_name || item.name} />
                ) : (
                    <Leaf className="m-auto opacity-10 h-full w-5" />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <h4 className="font-black text-sm uppercase text-slate-900 dark:text-white truncate">
                    {item.common_name || item.name}
                </h4>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    {formatEnergy(item.energy_kcal, energyUnit)} <span className="text-slate-200 dark:text-slate-700">|</span> {item.category || 'General'}
                </p>
            </div>
            <ChevronRight className="text-slate-200 group-hover:text-emerald-500 transition-colors shrink-0" size={20} />
        </div>
    ), [energyUnit]);

    return (
        <PageContainer maxWidth="max-w-7xl">
            <div className="space-y-12 animate-in fade-in duration-500">
                <HeroSearch
                    searchQuery={searchQuery}
                    onQueryChange={handleSearchInput}
                    results={searchResults}
                    isLoading={isSearching}
                    isActive={isSearchActive}
                    setIsActive={setIsSearchActive}
                    onSelect={(item) => router.push(`/dashboard/ingredients/foods/${item.id}`)}
                    renderResult={renderResult}
                    theme="emerald"
                    placeholder="SEARCH FOOD LIBRARY..."
                    idleIcon={<Leaf size={20} className="text-emerald-500" />}
                    idleTitle="Food Library"
                    idleSubtitle="Explore whole food profiles with full nutrition data"
                    noResultsMessage="No matching foods found"
                    enterMessage="Enter food name to search"
                    searchingMessage="Searching Library..."
                    powerButton={
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setShowAddFood(true); }}
                            className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all hover:border-emerald-500 hover:bg-emerald-500/10 shrink-0 relative z-10"
                        >
                            <Plus size={16} className="text-slate-900 dark:text-white" />
                        </button>
                    }
                />

                <div className="min-h-[600px] animate-in slide-in-from-bottom-4 duration-700">
                    <ExploreView showAddFood={showAddFood} setShowAddFood={setShowAddFood} />
                </div>
            </div>
        </PageContainer>
    );
}
