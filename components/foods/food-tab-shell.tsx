import React, { useState, useEffect } from 'react';
import { TabShell } from '@/components/ui/tab-shell';
import { ALargeSmall, Activity, Beef, Leaf, Droplet } from 'lucide-react';
import { useActionPanel } from '@/lib/context/action-panel-context';
import { useFoodFilter, CATEGORIES } from '@/lib/context/food-filter-context';
import { FoodFiltersPanel } from '@/components/foods/food-filters-panel';
import { FoodsView } from '@/components/foods/food-library-view';

export const FOOD_SORT_OPTIONS = [
    { id: 'name', label: 'A-Z', icon: <ALargeSmall size={18} /> },
    { id: 'energy_kcal', label: 'Energy', icon: <Activity size={18} /> },
    { id: 'protein_g', label: 'Protein', icon: <Beef size={18} /> },
    { id: 'carbs_g', label: 'Carbs', icon: <Leaf size={18} /> },
    { id: 'fat_g', label: 'Fat', icon: <Droplet size={18} /> }
] as const;

interface FoodTabShellProps {
    children?: React.ReactNode;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    sortField: string;
    setSortField: (field: string) => void;
    sortDirection: 'asc' | 'desc';
    setSortDirection: (dir: 'asc' | 'desc') => void;
    title: string;
    showAddFood?: boolean;
    setShowAddFood?: (show: boolean) => void;
}

export function FoodTabShell({
    children,
    searchQuery,
    onSearchChange,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    title,
    showAddFood = false,
    setShowAddFood,
    fullHeight,
}: FoodTabShellProps & { fullHeight?: boolean; children?: React.ReactNode }) {
    const { setIsActionPanelOpen, setActiveView, activeView, navigateTo } = useActionPanel();
    const { selectedCategories, setSelectedCategories, showFavoritesOnly, setShowFavoritesOnly, portionGrams, setPortionGrams } = useFoodFilter();
    
    const hasActiveFilters = showFavoritesOnly || selectedCategories.length < CATEGORIES.length;
    
    // Add local state for mobile filters to keep TabShell visible
    const [isMobile, setIsMobile] = useState(false);
    const [localFiltersOpen, setLocalFiltersOpen] = useState(false);
    const [localShowAddFood, setLocalShowAddFood] = useState(showAddFood);
    
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        setLocalShowAddFood(showAddFood);
    }, [showAddFood]);
    
    // It's open if local state is open (mobile) or if the action panel view says so
    const isFilterOpen = localFiltersOpen || activeView === 'food-filters';

    return (
        <TabShell 
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            sortField={sortField}
            setSortField={setSortField}
            sortDirection={sortDirection}
            setSortDirection={setSortDirection}
            title={title}
            fullHeight={fullHeight}
            theme="cyan"
            sortOptions={[...FOOD_SORT_OPTIONS]}
            showFilters={true}
            showPlusButton={true}
            onPlusClick={() => {
                if (setShowAddFood) {
                    setShowAddFood(true);
                }
            }}
            isFiltersOpen={isFilterOpen}
            onFilterClick={() => {
                if (isMobile) {
                    setLocalFiltersOpen(!localFiltersOpen);
                    if (activeView === 'food-filters') {
                        setActiveView('home'); // Fallback if it was somehow open
                    }
                } else {
                    if (activeView === 'food-filters') {
                        setActiveView('home');
                    } else {
                        setActiveView('food-filters');
                        setIsActionPanelOpen(true);
                    }
                }
            }}
            hasActiveFilters={hasActiveFilters}
            activeFilterCount={selectedCategories.length}
            filterChildren={<FoodFiltersPanel 
                showFavoritesOnly={showFavoritesOnly}
                setShowFavoritesOnly={setShowFavoritesOnly}
                selectedCategories={selectedCategories}
                setSelectedCategories={setSelectedCategories}
                onClose={() => { 
                if (isMobile) {
                    setLocalFiltersOpen(false);
                } else {
                    setActiveView('home'); 
                }
            }} />}
        >
            {children}
        </TabShell>
    );
}
