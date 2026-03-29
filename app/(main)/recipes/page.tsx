'use client';

import { Suspense, useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { PageContainer } from '@/components/ui/page-container';
import { LibraryView } from '@/components/ingredients/library-view';
import { MyRecipesView } from '@/components/ingredients/my-recipes-view';
import { RemixesView } from '@/components/ingredients/remixes-view';
import { MixesView } from '@/components/ingredients/mixes-view';
import { FoodsView } from '@/components/shared/foods-view';
import { NutrientsView } from '@/components/shared/nutrients-view';
import { useSearch } from '@/lib/context/search-context';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { cn } from '@/lib/utils';

type TabId = 'library' | 'mines' | 'remixes' | 'mixes' | 'foods' | 'nutrients';

function RecipesPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { profile } = useUserPreferences();
    
    const initialTab = (searchParams.get('tab') as TabId) || 'library';
    const [activeTab, setActiveTab] = useState<TabId>(initialTab);

    const tabs: { id: TabId; label: string; activeColor: string }[] = [
        { id: 'library', label: 'Library', activeColor: 'text-emerald-500' },
        { id: 'mines', label: 'My Recipes', activeColor: 'text-indigo-500' },
        { id: 'remixes', label: 'Remixes', activeColor: 'text-violet-500' },
        { id: 'mixes', label: 'Mixes', activeColor: 'text-amber-500' },
        { id: 'foods', label: 'Foods', activeColor: 'text-cyan-500' },
        { id: 'nutrients', label: 'Nutrients', activeColor: 'text-violet-500' },
    ];

    const handleTabChange = (id: TabId) => {
        setActiveTab(id);
        if (id === 'library') router.push('/recipes');
        else router.push(`/recipes?tab=${id}`);
    };

    return (
        <>
            {/* Tab Bar */}
            <div className="sticky top-0 z-20 bg-gradient-to-b from-slate-50 dark:from-slate-950 to-transparent py-4 px-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex bg-slate-100 dark:bg-slate-900 rounded-xl p-1 max-w-2xl mx-auto border border-emerald-800/10 shadow-sm overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={cn(
                                "flex-1 min-w-[70px] py-2 text-[8px] font-black uppercase tracking-[0.2em] rounded-lg transition-all whitespace-nowrap",
                                activeTab === tab.id
                                    ? `bg-white dark:bg-slate-800 ${tab.activeColor} shadow-sm`
                                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <PageContainer maxWidth="max-w-7xl">
                <div className="space-y-6 animate-in fade-in duration-500 py-6">
                    <div className="min-h-[600px] animate-in slide-in-from-bottom-4 duration-700">
                        {activeTab === 'library' && (
                            <LibraryView 
                                isPremium={profile.isPremium}
                            />
                        )}
                        {activeTab === 'mines' && (
                            <MyRecipesView 
                                isPremium={profile.isPremium}
                            />
                        )}
                        {activeTab === 'remixes' && (
                            <RemixesView 
                                isPremium={profile.isPremium}
                            />
                        )}
                        {activeTab === 'mixes' && (
                            <MixesView 
                                isPremium={profile.isPremium}
                            />
                        )}
                        {activeTab === 'foods' && (
                            <div className="animate-in fade-in duration-300">
                                <FoodsView />
                            </div>
                        )}
                        {activeTab === 'nutrients' && (
                            <div className="animate-in fade-in duration-300">
                                <NutrientsView compact={false} />
                            </div>
                        )}
                    </div>
                </div>
            </PageContainer>
        </>
    );
}

export default function RecipesPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
                <Loader2 className="animate-spin text-emerald-500" size={48} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Loading Recipes...</p>
            </div>
        }>
            <RecipesPageContent />
        </Suspense>
    );
}
