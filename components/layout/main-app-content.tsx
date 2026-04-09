'use client';

import { useState, useEffect } from 'react';
import { PageContainer } from '@/components/ui/page-container';
import { TabHeader } from '@/components/ui/tab-header';
import { RecipesCombinedView } from '@/components/recipe/recipes-combined-view';
import { FoodsView } from '@/components/foods/food-library-view';
import MealPlannerContent from '@/components/tracker/planner-content';
import { ShoppingListView } from '@/components/tracker/shopping-list-view';
import { PantryView } from '@/components/tracker/pantry-view';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { useActionPanel } from '@/lib/context/action-panel-context';

type TabId = 'recipes' | 'foods' | 'planner';
type InventoryView = 'foods' | 'list' | 'pantry' | 'cart';

export function MainAppContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const { profile } = useUserPreferences();
    const { setIsActionPanelOpen, setActiveView, setContextRecipeId, navigateTo } = useActionPanel();
    
    const initialTab = (searchParams.get('tab') as TabId) || 'recipes';
    const initialView = (searchParams.get('view') as InventoryView) || 'foods';
    
    const [activeTab, setActiveTab] = useState<TabId>(initialTab);
    const [inventoryView, setInventoryView] = useState<InventoryView>(initialView);
    const [scannerOpen, setScannerOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    // Sync state with URL params
    useEffect(() => {
        const tab = searchParams.get('tab') as TabId;
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        }
        
        const view = searchParams.get('view') as InventoryView;
        if (view && view !== inventoryView) {
            setInventoryView(view);
        }
    }, [searchParams]);

    const tabs: { id: TabId; label: string }[] = [
        { id: 'recipes', label: 'Cookbook' },
        { id: 'foods', label: 'Library' },
        { id: 'planner', label: 'Tracker' },
    ];

    const handleTabChange = (id: TabId) => {
        setActiveTab(id);
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', id);
        // Clean up other params if needed
        if (id !== 'foods') params.delete('view');
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const handleRecipeClick = (recipeId: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('recipeId', recipeId);
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const handleFoodClick = (foodId: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('foodId', foodId);
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    return (
        <div className="flex flex-col w-full min-h-screen">
            <TabHeader
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={(id) => handleTabChange(id as TabId)}
            />
            
            <PageContainer maxWidth="max-w-7xl">
                <div className="space-y-6 animate-in fade-in duration-500 py-2 sm:py-6">
                    <div className="min-h-[600px] animate-in slide-in-from-bottom-4 duration-700">
                        {activeTab === 'recipes' && (
                            <RecipesCombinedView 
                                isPremium={profile?.isPremium}
                                onRecipeClick={handleRecipeClick}
                            />
                        )}
                        {activeTab === 'foods' && (
                            <div className="space-y-4 animate-in fade-in duration-300">
                                {inventoryView === 'foods' && (
                                    <FoodsView onFoodClick={handleFoodClick} />
                                )}
                                {inventoryView === 'list' && (
                                    <ShoppingListView
                                        scannerOpen={scannerOpen}
                                        onScannerOpenChange={setScannerOpen}
                                    />
                                )}
                                {inventoryView === 'pantry' && (
                                    <PantryView 
                                        refreshKey={refreshKey} 
                                    />
                                )}
                                {inventoryView === 'cart' && (
                                    <ShoppingListView
                                        scannerOpen={scannerOpen}
                                        onScannerOpenChange={setScannerOpen}
                                    />
                                )}
                            </div>
                        )}
                        {activeTab === 'planner' && (
                            <div className="animate-in fade-in duration-300">
                                <MealPlannerContent 
                                    onSubViewChange={(view) => navigateTo(view as any)}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </PageContainer>
        </div>
    );
}
