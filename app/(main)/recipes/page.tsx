'use client';

import { Suspense, useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { PageContainer } from '@/components/ui/page-container';
import { RecipesCombinedView } from '@/components/recipe/recipes-combined-view';
import { FoodsView } from '@/components/foods/food-library-view';
import MealPlannerContent from '@/components/tracker/planner-content';
import { ShoppingListView } from '@/components/tracker/shopping-list-view';
import { PantryView } from '@/components/tracker/pantry-view';
import { useSearch } from '@/lib/context/search-context';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { cn } from '@/lib/utils';
import { ChevronDown, ShoppingCart, Package, Leaf, List } from 'lucide-react';

type TabId = 'recipes' | 'foods' | 'planner';
type InventoryView = 'foods' | 'list' | 'pantry' | 'cart';

function RecipesPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { profile } = useUserPreferences();
    
    const initialTab = (searchParams.get('tab') as TabId) || 'recipes';
    const initialView = (searchParams.get('view') as InventoryView) || 'foods';
    
    const [activeTab, setActiveTab] = useState<TabId>(initialTab);
    const [inventoryView, setInventoryView] = useState<InventoryView>(initialView);
    const [showInventoryMenu, setShowInventoryMenu] = useState(false);
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
        { id: 'recipes', label: 'Recipes', activeColor: 'text-emerald-500' },
        { id: 'foods', label: 'Foods', activeColor: 'text-cyan-500' },
        { id: 'planner', label: 'Planner', activeColor: 'text-blue-500' },
    ];

    const handleTabChange = (id: TabId) => {
        setActiveTab(id);
        if (id === 'recipes') router.push('/recipes');
        else if (id === 'planner') router.push('/recipes/planner');
        else {
            const viewQuery = id === 'foods' && inventoryView !== 'foods' ? `&view=${inventoryView}` : '';
            router.push(`/recipes?tab=${id}${viewQuery}`);
        }
    };

    const handleViewChange = (view: InventoryView) => {
        setInventoryView(view);
        setShowInventoryMenu(false);
        router.push(`/recipes?tab=foods&view=${view}`);
    };

    const inventorySwitcher = (
        <div className="relative">
            <button
                onClick={() => setShowInventoryMenu(!showInventoryMenu)}
                className={cn(
                    "h-10 px-4 rounded-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all border shrink-0",
                    inventoryView === 'foods'
                        ? "bg-cyan-600 text-white border-cyan-600 shadow-lg shadow-cyan-500/20"
                        : inventoryView === 'list'
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/20"
                        : inventoryView === 'pantry'
                        ? "bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-500/20"
                        : "bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-500/20"
                )}
            >
                {inventoryView === 'foods' && <Leaf size={12} />}
                {inventoryView === 'list' && <List size={12} />}
                {inventoryView === 'pantry' && <Package size={12} />}
                {inventoryView === 'cart' && <ShoppingCart size={12} />}
                <span>
                    {inventoryView === 'foods' ? 'Foods' : inventoryView === 'list' ? 'List' : inventoryView === 'pantry' ? 'Pantry' : 'Cart'}
                </span>
                <ChevronDown size={10} className={cn("transition-transform", showInventoryMenu && "rotate-180")} />
            </button>

            {showInventoryMenu && (
                <div className="absolute top-full mt-2 right-0 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xl z-50 p-1 min-w-[140px]">
                    <button
                        onClick={() => handleViewChange('foods')}
                        className={cn(
                            "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                            inventoryView === 'foods'
                                ? "bg-cyan-600 text-white"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                        )}
                    >
                        <Leaf size={12} />
                        Foods
                    </button>
                    <button
                        onClick={() => handleViewChange('list')}
                        className={cn(
                            "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                            inventoryView === 'list'
                                ? "bg-emerald-600 text-white"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                        )}
                    >
                        <List size={12} />
                        List
                    </button>
                    <button
                        onClick={() => handleViewChange('pantry')}
                        className={cn(
                            "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                            inventoryView === 'pantry'
                                ? "bg-amber-600 text-white"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                        )}
                    >
                        <Package size={12} />
                        Pantry
                    </button>
                    <button
                        onClick={() => handleViewChange('cart')}
                        className={cn(
                            "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                            inventoryView === 'cart'
                                ? "bg-violet-600 text-white"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                        )}
                    >
                        <ShoppingCart size={12} />
                        Cart
                    </button>
                </div>
            )}
        </div>
    );

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
                            <div className="space-y-4 animate-in fade-in duration-300">
                                {inventoryView === 'foods' && (
                                    <FoodsView dropdownContent={inventorySwitcher} />
                                )}
                                {inventoryView === 'list' && (
                                    <ShoppingListView
                                        scannerOpen={scannerOpen}
                                        onScannerOpenChange={setScannerOpen}
                                        dropdownContent={inventorySwitcher}
                                    />
                                )}
                                {inventoryView === 'pantry' && (
                                    <PantryView 
                                        refreshKey={refreshKey} 
                                        dropdownContent={inventorySwitcher}
                                    />
                                )}
                                {inventoryView === 'cart' && (
                                    <ShoppingListView
                                        scannerOpen={scannerOpen}
                                        onScannerOpenChange={setScannerOpen}
                                        dropdownContent={inventorySwitcher}
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
