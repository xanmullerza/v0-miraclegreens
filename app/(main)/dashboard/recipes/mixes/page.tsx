'use client';

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ChefHat, ChevronRight } from 'lucide-react';
import { PageContainer } from '@/components/ui/page-container';
import { RecipesView } from '@/components/ingredients/recipes-view';
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

export default function MixesPage() {
    return (
        <Suspense fallback={
            <div className="h-96 flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-indigo-500" size={48} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Loading Mixes...</p>
            </div>
        }>
            <MixesContent />
        </Suspense>
    );
}

function MixesContent() {
    const router = useRouter();
    const { energyUnit } = useUserPreferences();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSearchActive, setIsSearchActive] = useState(false);
    const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const renderResult = (item: any) => (
        <div className="flex items-center gap-4 min-w-0 w-full">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-100 dark:border-slate-800">
                {item.image ? (
                    <img src={item.image} className="w-full h-full object-cover" alt={item.title} />
                ) : (
                    <ChefHat className="m-auto opacity-10 h-full w-5" />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <h4 className="font-black text-sm uppercase text-slate-900 dark:text-white truncate">
                    {item.title}
                </h4>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    {formatEnergy(item.calories, energyUnit)} <span className="text-slate-200 dark:text-slate-700">|</span> {item.type}
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
                .from('recipes')
                .select('*')
                .eq('is_mix', true)
                .ilike('title', `%${query}%`)
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
                <HeroSearch
                    searchQuery={searchQuery}
                    onQueryChange={handleSearchInput}
                    results={searchResults}
                    isLoading={isSearching}
                    isActive={isSearchActive}
                    setIsActive={setIsSearchActive}
                    onSelect={(item) => router.push(`/dashboard/recipes/mixes/${item.id}`)}
                    renderResult={renderResult}
                    theme="emerald"
                    placeholder="SEARCH MIXES..."
                    idleTitle="Ready to Browse?"
                    idleSubtitle="Search for custom ingredient blends"
                    noResultsMessage="No matching mixes found"
                    enterMessage="Enter mix name to search"
                    searchingMessage="Searching Mixes..."
                />

                {/* Dynamic Content Area */}
                <div className="min-h-[600px] animate-in slide-in-from-bottom-4 duration-700">
                    <RecipesView showHero={false} isMix={true} />
                </div>
            </div>
        </PageContainer>
    );
}
