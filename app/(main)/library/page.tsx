'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ChevronDown, Leaf, List, Package, ShoppingCart, Activity, Scale, LifeBuoy } from 'lucide-react';
import { PageContainer } from '@/components/ui/page-container';
import { TabHeader } from '@/components/ui/tab-header';
import { FoodsView } from '@/components/foods/food-library-view';
import { ShoppingListView } from '@/components/tracker/shopping-list-view';
import { PantryView } from '@/components/tracker/pantry-view';
import { useSearch } from '@/lib/context/search-context';
import { useActionPanel } from '@/lib/context/action-panel-context';
import { cn } from '@/lib/utils';

type InventoryView = 'foods' | 'nutridex' | 'comparator' | 'lifeguard' | 'list' | 'pantry' | 'cart';

function LibraryContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { searchQuery, setSearchQuery } = useSearch();
    const { setIsActionPanelOpen, setActiveView } = useActionPanel();

    const initialView = (searchParams.get('view') as InventoryView) || 'foods';
    const [inventoryView, setInventoryView] = useState<InventoryView>(initialView);
    const [showInventoryMenu, setShowInventoryMenu] = useState(false);
    const [scannerOpen, setScannerOpen] = useState(false);
    const [refreshKey] = useState(0);

    // Sync view with URL param changes (e.g. back/forward navigation)
    useEffect(() => {
        const view = searchParams.get('view') as InventoryView;
        if (view && view !== inventoryView) setInventoryView(view);
        if (!view && inventoryView !== 'foods') setInventoryView('foods');
    }, [searchParams]);

    // Clear search on unmount
    useEffect(() => () => setSearchQuery(''), [setSearchQuery]);

    const tabs = [
        { id: 'recipes', label: 'Cookbook' },
        { id: 'foods', label: 'Library' },
        { id: 'planner', label: 'Tracker' },
    ];

    const handleTabChange = (id: string) => {
        if (id === 'recipes') router.push('/cookbook');
        else if (id === 'planner') router.push('/tracker');
        else router.push('/library');
    };

    const handleViewChange = (view: InventoryView) => {
        if (view === 'nutridex') {
            setShowInventoryMenu(false);
            setActiveView('nutridex');
            setIsActionPanelOpen(true);
            return;
        }
        if (view === 'comparator') {
            setShowInventoryMenu(false);
            setActiveView('comparator');
            setIsActionPanelOpen(true);
            return;
        }
        if (view === 'lifeguard') {
            setShowInventoryMenu(false);
            setActiveView('lifeguard');
            setIsActionPanelOpen(true);
            return;
        }
        setInventoryView(view);
        setShowInventoryMenu(false);
        router.push(view === 'foods' ? '/library' : `/library?view=${view}`);
    };

    const inventorySwitcher = (
        <div className="relative">
            <button
                onClick={() => setShowInventoryMenu(!showInventoryMenu)}
                className={cn(
                    "h-10 px-4 rounded-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all border shrink-0",
                    inventoryView === 'foods'
                        ? "bg-cyan-600 text-white border-cyan-600 shadow-lg shadow-cyan-500/20"
                        : inventoryView === 'nutridex'
                        ? "bg-fuchsia-600 text-white border-fuchsia-600 shadow-lg shadow-fuchsia-500/20"
                        : inventoryView === 'comparator'
                        ? "bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20"
                        : inventoryView === 'lifeguard'
                        ? "bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20"
                        : inventoryView === 'list'
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/20"
                        : inventoryView === 'pantry'
                        ? "bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-500/20"
                        : "bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-500/20"
                )}
            >
                {inventoryView === 'foods' && <Leaf size={12} />}
                {inventoryView === 'nutridex' && <Activity size={12} />}
                {inventoryView === 'comparator' && <Scale size={12} />}
                {inventoryView === 'lifeguard' && <LifeBuoy size={12} />}
                {inventoryView === 'list' && <List size={12} />}
                {inventoryView === 'pantry' && <Package size={12} />}
                {inventoryView === 'cart' && <ShoppingCart size={12} />}
                <span>
                    {inventoryView === 'foods' ? 'Foods'
                        : inventoryView === 'nutridex' ? 'Nutridex'
                        : inventoryView === 'comparator' ? 'Comparator'
                        : inventoryView === 'lifeguard' ? 'Lifeguard'
                        : inventoryView === 'list' ? 'List'
                        : inventoryView === 'pantry' ? 'Pantry'
                        : 'Cart'}
                </span>
                <ChevronDown size={10} className={cn("transition-transform", showInventoryMenu && "rotate-180")} />
            </button>

            {showInventoryMenu && (
                <div className="absolute top-full mt-2 right-0 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xl z-50 p-1 min-w-[140px]">
                    {([
                        { view: 'foods',      label: 'Foods',      icon: <Leaf size={12} />,       color: 'cyan-600'    },
                        { view: 'nutridex',   label: 'Nutridex',   icon: <Activity size={12} />,   color: 'fuchsia-600' },
                        { view: 'comparator', label: 'Comparator', icon: <Scale size={12} />,      color: 'amber-500'   },
                        { view: 'lifeguard',  label: 'Lifeguard',  icon: <LifeBuoy size={12} />,   color: 'red-500'     },
                        { view: 'list',       label: 'List',       icon: <List size={12} />,       color: 'emerald-600' },
                        { view: 'pantry',     label: 'Pantry',     icon: <Package size={12} />,    color: 'amber-600'   },
                        { view: 'cart',       label: 'Cart',       icon: <ShoppingCart size={12} />, color: 'violet-600' },
                    ] as { view: InventoryView; label: string; icon: React.ReactNode; color: string }[]).map(({ view, label, icon }) => (
                        <button
                            key={view}
                            onClick={() => handleViewChange(view)}
                            className={cn(
                                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                inventoryView === view
                                    ? "bg-cyan-600 text-white"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                            )}
                        >
                            {icon}
                            {label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="animate-in fade-in duration-500">
            <TabHeader
                tabs={tabs}
                activeTab="foods"
                onTabChange={handleTabChange}
            />
            <PageContainer maxWidth="max-w-7xl">
                <div className="py-6 space-y-4 animate-in slide-in-from-bottom-4 duration-700">
                    {inventoryView === 'foods' && (
                        <FoodsView
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            dropdownContent={inventorySwitcher}
                        />
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
            </PageContainer>
        </div>
    );
}

export default function LibraryPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
                <Loader2 className="animate-spin text-cyan-500" size={48} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Loading Library...</p>
            </div>
        }>
            <LibraryContent />
        </Suspense>
    );
}
