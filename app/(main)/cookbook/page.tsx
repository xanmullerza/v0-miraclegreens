'use client';

import { Suspense, useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { PageContainer } from '@/components/ui/page-container';
import { TabHeader } from '@/components/ui/tab-header';
import { RecipesCombinedView } from '@/components/recipe/recipes-combined-view';
import { FoodsView } from '@/components/foods/food-library-view';
import MealPlannerContent from '@/components/tracker/planner-content';
import { ShoppingListView } from '@/components/tracker/shopping-list-view';
import { PantryView } from '@/components/tracker/pantry-view';
import { useSearch } from '@/lib/context/search-context';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { useActionPanel } from '@/lib/context/action-panel-context';

import { cn } from '@/lib/utils';

type TabId = 'recipes' | 'foods' | 'planner';
type InventoryView = 'foods' | 'list' | 'pantry' | 'cart';

function RecipesPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { profile } = useUserPreferences();
    const { setIsActionPanelOpen, setActiveView, setContextRecipeId } = useActionPanel();
    
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

    const tabs: { id: TabId; label: string; activeColor: string }[] = [
        { id: 'recipes', label: 'Cookbook', activeColor: 'text-emerald-500' },
        { id: 'foods', label: 'Library', activeColor: 'text-cyan-500' },
        { id: 'planner', label: 'Tracker', activeColor: 'text-blue-500' },
    ];

    const handleTabChange = (id: TabId) => {
        setActiveTab(id);
        if (id === 'recipes') router.push('/cookbook');
        else if (id === 'planner') router.push('/tracker');
        else router.push('/library');
    };

    const handleViewChange = (view: InventoryView) => {
        setInventoryView(view);
        router.push(`/recipes?tab=foods&view=${view}`);
    };

    const handleRecipeClick = (recipeId: string) => {
        setContextRecipeId(recipeId);
        setActiveView('recipe-detail');
        setIsActionPanelOpen(true);
    };

    return (
        <>
            {/* Tab Bar - Standardized */}
            <TabHeader
                tabs={tabs.map(t => ({ id: t.id, label: t.label }))}
                activeTab={activeTab}
                onTabChange={(id) => handleTabChange(id as TabId)}
            />
            {/* Content */}
            <PageContainer maxWidth="max-w-7xl">
                <div className="space-y-6 animate-in fade-in duration-500 py-2 sm:py-6">
                    <div className="min-h-[600px] animate-in slide-in-from-bottom-4 duration-700">
                        {activeTab === 'recipes' && (
                            <RecipesCombinedView 
                                isPremium={profile.isPremium}
                                onRecipeClick={handleRecipeClick}
                            />
                        )}
                        {activeTab === 'foods' && (
                            <div className="space-y-4 animate-in fade-in duration-300">
                                {inventoryView === 'foods' && (
                                    <FoodsView />
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
