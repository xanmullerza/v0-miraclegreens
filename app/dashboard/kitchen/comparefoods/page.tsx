'use client';

import React, { useEffect, useState } from 'react';
import { CompareView } from '../../library/foods/views/compare-view';
import { PageContainer } from '@/components/ui/page-container';
import { supabase } from '@/lib/supabase';
import { useUserPreferences } from '@/lib/context/user-preferences-context';

export default function CompareFoodsPage() {
    const { showHeroes } = useUserPreferences();
    const [stats, setStats] = useState({ foods: 0, recipes: 0, nutrients: 0, mixes: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [foodsCount, recipesCount, mixesCount] = await Promise.all([
                    supabase.from('food_items').select('id', { count: 'exact', head: true }),
                    supabase.from('recipes').select('id', { count: 'exact', head: true }).eq('is_mix', false),
                    supabase.from('recipes').select('id', { count: 'exact', head: true }).eq('is_mix', true),
                ]);
                setStats({
                    foods: foodsCount.count || 0,
                    recipes: recipesCount.count || 0,
                    nutrients: 30,
                    mixes: mixesCount.count || 0
                });
            } catch (e) {
                console.error('Error fetching comparefoods stats:', e);
            }
        };
        fetchStats();
    }, []);

    return (
        <PageContainer maxWidth="max-w-7xl" className="-mt-12 md:-mt-16">
            <div className="space-y-6 md:space-y-12 animate-in fade-in duration-700 pb-32 pt-0">
                {/* Content */}
                <div className="min-h-[600px] animate-in slide-in-from-bottom-4 duration-700">
                    <CompareView showStats={showHeroes} stats={stats} />
                </div>
            </div>
        </PageContainer>
    );
}

