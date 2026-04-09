'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PageContainer } from '@/components/ui/page-container';
import { TabHeader } from '@/components/ui/tab-header';

import {
    useFoodDetail,
    FoodHeader,
    FoodFacts,
    FoodNutrition,
    FoodRecipes,
    FoodManagement,
    FoodEditCard
} from '@/components/foods/detail';
import { FOOD_DETAILS } from '@/lib/data/food-details';

export default function FoodDetailsPage() {
    const router = useRouter();
    const ctx = useFoodDetail();
    const { food, loading, activeSection } = ctx;

    const [user, setUser] = React.useState<any>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center">
                    <Loader2 className="animate-spin text-emerald-500" size={32} />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">Scanning Bio-Reference...</p>
            </div>
        );
    }

    if (!food) return null;

    return (
        <>
            <TabHeader
                tabs={[
                    { id: 'recipes', label: 'Cookbook' },
                    { id: 'foods', label: 'Library' },
                    { id: 'planner', label: 'Tracker' },
                ]}
                activeTab="foods"
                onTabChange={(tabId) => {
                    if (tabId === 'recipes') {
                        router.push('/');
                    } else if (tabId === 'planner') {
                        router.push('/?tab=planner');
                    } else {
                        router.push(`/?tab=${tabId}`);
                    }
                }}
            />

            <PageContainer maxWidth="max-w-6xl">
                <div className="space-y-6 pb-20 animate-in fade-in duration-700">
                    <div className="bg-slate-100 dark:bg-slate-900/80 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                        <FoodHeader ctx={ctx} />
                        
                        <div className="px-6 py-4 space-y-6">
                            {activeSection === 'management' && <FoodManagement ctx={ctx} user={user} />}
                            {activeSection === 'facts' && (food.details || FOOD_DETAILS[food.id]) && <FoodFacts ctx={ctx} />}
                            {activeSection === 'recipes' && <FoodRecipes ctx={ctx} />}
                            {activeSection === 'nutrition' && <FoodNutrition ctx={ctx} />}
                        </div>
                    </div>
                </div>
            </PageContainer>
            
            <FoodEditCard ctx={ctx} />
        </>
    );
}
