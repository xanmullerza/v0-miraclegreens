'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Library,
    Apple,
    ChefHat,
    Activity,
    Search,
    Loader2,
    Zap,
    Scale,
    X,
    Filter,
    ChevronDown,
    Plus,
    LayoutGrid,
    Globe,
    Heart,
    Trophy,
    Check,
    CheckSquare,
    Square
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useSearch } from '@/lib/context/search-context';

import { FoodsView, CATEGORIES } from '@/components/library/foods-view';
import { RecipesView, MEAL_TYPES } from '@/components/library/recipes-view';
import { NutrientsView } from '@/components/library/nutrients-view';
import { TopTenView, NUTRIENTS } from './views/top-ten-view';

// ...

function LibraryContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<'nutrients' | 'top10'>('nutrients');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);

    // ...

    // Sync tab and nutrient from URL if needed
    useEffect(() => {
        const tab = searchParams.get('tab') as any;
        const nutrientIdFromUrl = searchParams.get('nutrientId');

        if (tab && ['nutrients', 'top10'].includes(tab)) {
            setActiveTab(tab);
        }

        // ...
    }, [searchParams]);

    const handleTabChange = (tab: 'nutrients' | 'top10') => {
        setActiveTab(tab);
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        window.history.pushState(null, '', `?${params.toString()}`);
    };

    const tabs = [
        { id: 'nutrients', label: 'All Nutrients', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { id: 'top10', label: 'Top 10', icon: Trophy, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    ];

    const tabConfig: Record<'nutrients' | 'top10', { heading: string; description: string; color: string }> = {
        nutrients: {
            heading: 'All Nutrients',
            description: 'Browse & explore our essential nutrient database',
            color: 'text-blue-500'
        },
        top10: {
            heading: 'Top 10 Richest',
            description: 'Discover the richest food sources per nutrient',
            color: 'text-blue-500'
        },
    };

    // ...

    {/* Comparison Search Results Dropdown (Pill Bar Context) - REMOVED */ }
            </div >


        </div >
    );

    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-32">
            {/* Unified Header */}
            {/* ... */}

            {/* Dynamic Content Area */}
            <div className="min-h-[600px] animate-in slide-in-from-bottom-4 duration-700">


                {activeTab === 'nutrients' && (
                    <NutrientsView
                        showFavoritesOnly={showNutrientFavorites}
                        setShowFavoritesOnly={setShowNutrientFavorites}
                        selectedCategories={selectedNutrientCategories}
                        setSelectedCategories={setSelectedNutrientCategories}
                    />
                )}
                {activeTab === 'top10' && (
                    <TopTenView
                        showFavoritesOnly={showTop10Favorites}
                        setShowFavoritesOnly={setShowTop10Favorites}
                        selectedCategories={selectedTop10Categories}
                        setSelectedCategories={setSelectedTop10Categories}
                        selectedNutrientId={selectedNutrientId}
                        onNutrientChange={setSelectedNutrientId}
                    />
                )}
            </div>
        </div>
    );
}
