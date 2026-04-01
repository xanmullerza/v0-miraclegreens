'use client';

import { Suspense, useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { PageContainer } from '@/components/ui/page-container';
import { RecipesCombinedView } from '@/components/recipe/recipes-combined-view';
import { FoodsView } from '@/components/foods/food-library-view';
import MealPlannerContent from '@/components/tracker/planner-content';
import { useSearch } from '@/lib/context/search-context';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { cn } from '@/lib/utils';

type TabId = 'recipes' | 'foods' | 'planner';

function RecipesPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { profile } = useUserPreferences();
    
    const initialTab = (searchParams.get('tab') as TabId) || 'recipes';
    const [activeTab, setActiveTab] = useState<TabId>(initialTab);

    const tabs: { id: TabId; label: string; activeColor: string }[] = [
        { id: 'recipes', label: 'Recipes', activeColor: 'text-emerald-500' },
        { id: 'foods', label: 'Foods', activeColor: 'text-cyan-500' },
        { id: 'planner', label: 'Planner', activeColor: 'text-blue-500' },
    ];

    const handleTabChange = (id: TabId) => {
        setActiveTab(id);
        if (id === 'recipes') router.push('/recipes');
        else if (id === 'planner') router.push('/recipes/planner');
        else router.push(`/recipes?tab=${id}`);
    };

    return (
        <>
            {/* Tab Bar */}
            <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl py-6 px-4 border-b border-border/50">
                <div className="flex items-center justify-between max-w-5xl mx-auto bg-slate-950/40 dark:bg-slate-900/60 p-1.5 rounded-[2rem] border border-white/5 shadow-2xl overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={cn(
                                "flex-1 min-w-[100px] py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-[1.5rem] transition-all duration-300 whitespace-nowrap px-4",
                                activeTab === tab.id
                                    ? "bg-slate-800/80 text-emerald-400 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)] ring-1 ring-white/10"
                                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
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
                        {activeTab === 'recipes' && (
                            <RecipesCombinedView 
                                isPremium={profile.isPremium}
                            />
                        )}
                        {activeTab === 'foods' && (
                            <div className="animate-in fade-in duration-300">
                                <FoodsView />
                            </div>
                        )}
                        {activeTab === 'planner' && (
                            <div className="animate-in fade-in duration-300">
                                <MealPlannerContent />
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
