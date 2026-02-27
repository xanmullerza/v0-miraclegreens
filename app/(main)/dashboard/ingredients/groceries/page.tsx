'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Leaf, ChevronRight, ShoppingCart } from 'lucide-react';
import { ShoppingListView } from '@/components/kitchen/shopping-list-view';
import { PageContainer } from '@/components/ui/page-container';
import { HeroSearch } from '@/components/ui/hero-search';
import { supabase } from '@/lib/supabase';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { formatFoodName } from '@/lib/utils';

const CAL_TO_KJ = 4.184;

function formatEnergy(calories: number, unit: 'kcal' | 'kJ') {
    if (unit === 'kJ') return `${Math.round(calories * CAL_TO_KJ).toLocaleString()} kJ`;
    return `${Math.round(calories).toLocaleString()} kcal`;
}

export default function ShoppingListPage() {
    const router = useRouter();
    const { energyUnit } = useUserPreferences();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSearchActive, setIsSearchActive] = useState(false);
    const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const performSearch = async (query: string) => {
        if (!query || query.length < 2) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const { data, error } = await supabase
                .from('food_items')
                .select('id, name, common_name, image, energy_kcal, category')
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

    const handleSelectFood = (food: any) => {
        // Add to shopping list via localStorage (same mechanism as other pages)
        const currentList = JSON.parse(localStorage.getItem('vitala_shopping_manual_items') || '[]');
        const newItem = {
            id: `manual-${Date.now()}`,
            name: food.common_name || food.name,
            quantity: '1',
            unit: '',
            checked: false,
            source: 'manual',
            food_item_id: food.id,
        };
        localStorage.setItem('vitala_shopping_manual_items', JSON.stringify([...currentList, newItem]));
        setIsSearchActive(false);
        setSearchQuery('');
        // Trigger a storage event so ShoppingListView picks up the change
        window.dispatchEvent(new Event('storage'));
        // Force reload by navigating to same page
        router.refresh();
    };

    return (
        <PageContainer>
            <div className="space-y-8 animate-in fade-in duration-500">
                <HeroSearch
                    searchQuery={searchQuery}
                    onQueryChange={handleSearchInput}
                    results={searchResults}
                    isLoading={isSearching}
                    isActive={isSearchActive}
                    setIsActive={setIsSearchActive}
                    onSelect={handleSelectFood}
                    theme="emerald"
                    placeholder="SEARCH FOODS TO ADD..."
                    idleIcon={<ShoppingCart size={20} className="text-emerald-500" />}
                    idleTitle="Grocery List"
                    idleSubtitle="Search foods to add to your shopping list"
                    noResultsMessage="No matching foods found"
                    enterMessage="Enter food name to search"
                    searchingMessage="Searching Foods..."
                    renderResult={(food: any) => (
                        <div className="flex items-center gap-4 min-w-0 w-full">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-100 dark:border-slate-800">
                                {food.image ? (
                                    <img src={food.image} className="w-full h-full object-cover" alt={food.common_name || food.name} />
                                ) : (
                                    <Leaf className="m-auto opacity-10 h-full w-5" />
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className="font-black text-sm uppercase text-slate-900 dark:text-white truncate">
                                    {formatFoodName(food.common_name || food.name)}
                                </h4>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                    {formatEnergy(food.energy_kcal || 0, energyUnit)} <span className="text-slate-200 dark:text-slate-700">|</span> {food.category || 'General'}
                                </p>
                            </div>
                            <ChevronRight className="text-slate-200 group-hover:text-emerald-500 transition-colors shrink-0" size={20} />
                        </div>
                    )}
                />
                <ShoppingListView />
            </div>
        </PageContainer>
    );
}
