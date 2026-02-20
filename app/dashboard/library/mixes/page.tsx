'use client';

import React, { useState } from 'react';
import { RecipesView } from '@/components/library/recipes-view';
import { PageContainer } from '@/components/ui/page-container';
import { Beaker, Search, X } from 'lucide-react';
import { useSearch } from '@/lib/context/search-context';

export default function MixesPage() {
    const { searchQuery, setSearchQuery } = useSearch();
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]); // Mixes don't strictly follow meal types but we keep them for now or use categories

    return (
        <PageContainer maxWidth="max-w-7xl">
            <div className="space-y-10 animate-in fade-in duration-700 pb-32 pt-8">
                {/* Header Section */}
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                                    <Beaker className="text-indigo-400" size={24} />
                                </div>
                                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
                                    The <span className="text-indigo-500">Mixes.</span>
                                </h1>
                            </div>
                            <p className="text-slate-500 max-w-md font-medium">
                                Base ingredients, spice blends, and custom prepared items for use in your meals.
                            </p>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative group max-w-2xl">
                        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                            <Search className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search your library of mixes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-16 pl-16 pr-12 bg-white dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] text-lg font-bold placeholder:text-slate-400 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-sm"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute inset-y-0 right-6 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="min-h-[600px] animate-in slide-in-from-bottom-4 duration-700">
                    <RecipesView
                        isMix={true}
                        isFilterOpen={isFilterOpen}
                        setIsFilterOpen={setIsFilterOpen}
                        selectedTypes={selectedTypes}
                        setSelectedTypes={setSelectedTypes}
                    />
                </div>
            </div>
        </PageContainer>
    );
}
