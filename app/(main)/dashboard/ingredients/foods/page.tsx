'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, Leaf, ChevronRight, Search, Plus } from 'lucide-react';
import { ExploreView } from './views/explore-view';
import { ShoppingView } from './views/shopping-view';
import { StaplesView } from '@/components/ingredients/staples-view';
import { CompareView } from './views/compare-view';
import { NutrientsView } from './views/nutrients-view';
import { PageContainer } from '@/components/ui/page-container';
import { HeroSearch } from '@/components/ui/hero-search';
import { supabase } from '@/lib/supabase';
import { useUserPreferences } from '@/lib/context/user-preferences-context';

const CAL_TO_KJ = 4.184;

function formatEnergy(calories: number, unit: 'kcal' | 'kJ') {
    if (unit === 'kJ') {
        return `${Math.round(calories * CAL_TO_KJ).toLocaleString()} kJ`;
    }
    return `${Math.round(calories).toLocaleString()} kC`;
}

export default function IngredientsHub() {
    return (
        <Suspense fallback={
            <div className="h-96 flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-emerald-500" size={48} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Loading Ingredients Hub...</p>
            </div>
        }>
            <IngredientsContent />
        </Suspense>
    );
}

type FoodTab = 'foods' | 'groceries' | 'pantry' | 'compare' | 'nutrients';

function IngredientsContent() {

    const router = useRouter();
    const { energyUnit } = useUserPreferences();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<FoodTab>('foods');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [showAddFood, setShowAddFood] = useState(false);
    const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const renderResult = (item: any) => (
        <div className="flex items-center gap-4 min-w-0 w-full">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-100 dark:border-slate-800">
                {item.image ? (
                    <img src={item.image} className="w-full h-full object-cover" alt={item.common_name || item.name} />
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
    );


    const performSearch = async (query: string) => {
        if (!query || query.length < 2) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const { data, error } = await supabase
                .from('food_items')
                .select('*')
                .or(`name.ilike.%${query}%,common_name.ilike.%${query}%`)
                .limit(8);
            if (error) throw error;
            setSearchResults(data || []);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearchInput = (val: string) => {
        setSearchQuery(val);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => performSearch(val), 300);
    };

    return (
        <PageContainer maxWidth="max-w-7xl">
            <div className="space-y-12 animate-in fade-in duration-500">
                {/* Search Hero */}
                {activeTab === 'foods' && (
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
                                onClick={() => setShowAddFood(true)}
                                className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all hover:border-emerald-500 hover:bg-emerald-500/10 shrink-0"
                            >
                                <Plus size={16} className="text-slate-900 dark:text-white" />
                            </button>
                        }
                    />
                )}

                {/* Dynamic Content Area */}
                <div className="min-h-[600px] animate-in slide-in-from-bottom-4 duration-700">
                    {activeTab === 'foods' && <ExploreView showHero={false} showAddFood={showAddFood} setShowAddFood={setShowAddFood} />}
                    {activeTab === 'groceries' && <ShoppingView />}
                    {activeTab === 'pantry' && <StaplesView />}
                    {activeTab === 'compare' && <CompareView />}
                    {activeTab === 'nutrients' && <NutrientsView />}
                </div>
            </div>
        </PageContainer>
    );
}
