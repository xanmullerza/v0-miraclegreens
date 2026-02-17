'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    UtensilsCrossed,
    ShoppingCart,
    ShoppingBasket,
    Scale,
    Battery,
    Search,
    Loader2,
    X,
    LayoutGrid,
    ChefHat,
    ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearch } from '@/lib/context/search-context';
import { HeaderActions } from '@/lib/context/header-actions-context';

// Views
import { ExploreView } from './views/explore-view';
import { ShoppingView } from './views/shopping-view';
import { StaplesView } from '@/components/library/staples-view';
import { CompareView } from './views/compare-view';
import { NutrientsView } from './views/nutrients-view';

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
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<FoodTab>('foods');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const { searchQuery, setSearchQuery, setIsFocused, activeSearchId, setActiveSearchId } = useSearch();

    // Check for admin/user context if needed (omitted for brevity unless required by logic)
    // The previous implementation snippet hinted at admin checks but views handle them mostly.

    // Sync tab from URL
    useEffect(() => {
        const tab = searchParams.get('tab') as FoodTab;
        if (tab && ['foods', 'groceries', 'pantry', 'compare', 'nutrients'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const handleTabChange = (tab: FoodTab) => {
        setActiveTab(tab);
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        window.history.pushState(null, '', `?${params.toString()}`);
    };

    const tabs = [
        { id: 'foods', label: 'Foods', icon: UtensilsCrossed, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { id: 'groceries', label: 'Groceries', icon: ShoppingCart, color: 'text-rose-500', bg: 'bg-rose-500/10' },
        { id: 'pantry', label: 'Pantry', icon: ShoppingBasket, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { id: 'compare', label: 'Compare Foods', icon: Scale, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { id: 'nutrients', label: 'Nutrients', icon: Battery, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    ];

    const tabConfig: Record<FoodTab, { heading: string; description: string; color: string }> = {
        foods: {
            heading: 'Foods',
            description: 'Explore our complete database of nutritional building blocks',
            color: 'text-emerald-500'
        },
        groceries: {
            heading: 'Shopping List',
            description: 'Plan your purchases and manage grocery needs',
            color: 'text-rose-500'
        },
        pantry: {
            heading: 'My Staples',
            description: 'Manage your kitchen inventory and available stocks',
            color: 'text-amber-500'
        },
        compare: {
            heading: 'Compare Foods',
            description: 'Analyze and compare nutritional profiles side-by-side',
            color: 'text-blue-500'
        },
        nutrients: {
            heading: 'Nutrients',
            description: 'Deep dive into micronutrients and health benefits',
            color: 'text-indigo-500'
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-32 pt-8">
            {/* Unified Header Removed */}
            {/* Navigation Pillbox Removed */}

            {/* Dynamic Content Area */}
            <div className="min-h-[600px] animate-in slide-in-from-bottom-4 duration-700">
                {activeTab === 'foods' && <ExploreView hideControls={false} />}
                {activeTab === 'groceries' && <ShoppingView />}
                {activeTab === 'pantry' && <StaplesView />}
                {activeTab === 'compare' && <CompareView />}
                {activeTab === 'nutrients' && <NutrientsView />}
            </div>
        </div>
    );
}
