'use client';

import React, { useState } from 'react';
import { PageContainer } from '@/components/ui/page-container';
import MealPlannerContent from '@/components/tracker/planner-content';
import { ShoppingListView } from '@/components/tracker/shopping-list-view';
import { PantryView } from '@/components/tracker/pantry-view';
import { FoodsView } from '@/components/foods/food-library-view';
import { NutrientsView } from '@/components/nutrients/nutrients-view';
import { cn } from '@/lib/utils';
import { ChevronDown, ShoppingCart, Package, Leaf, List } from 'lucide-react';

type TabId = 'shopping' | 'pantry' | 'planner' | 'foods' | 'nutrients';
type InventoryView = 'foods' | 'list' | 'pantry' | 'cart';

export default function TrackerPage() {
    const [activeTab, setActiveTab] = useState<TabId>('shopping');
    const [scannerOpen, setScannerOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [inventoryView, setInventoryView] = useState<InventoryView>('foods');
    const [showInventoryMenu, setShowInventoryMenu] = useState(false);

    const tabs: { id: TabId; label: string; activeColor: string }[] = [
        { id: 'shopping', label: 'Shopping', activeColor: 'text-emerald-500' },
        { id: 'pantry', label: 'Pantry', activeColor: 'text-amber-500' },
        { id: 'planner', label: 'Planner', activeColor: 'text-blue-500' },
        { id: 'foods', label: 'Foods', activeColor: 'text-cyan-500' },
        { id: 'nutrients', label: 'Nutrients', activeColor: 'text-violet-500' },
    ];

    const inventoryViewOptions: { value: InventoryView; label: string; icon: React.ReactNode; color: string }[] = [
        { value: 'foods', label: 'Foods', icon: <Leaf size={12} />, color: 'cyan' },
        { value: 'list', label: 'List', icon: <List size={12} />, color: 'emerald' },
        { value: 'pantry', label: 'Pantry', icon: <Package size={12} />, color: 'amber' },
        { value: 'cart', label: 'Cart', icon: <ShoppingCart size={12} />, color: 'violet' },
    ];

    return (
        <>
            {/* Tab Bar */}
            <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl py-6 px-4 border-b border-border/50">
                <div className="flex items-center justify-between max-w-5xl mx-auto bg-slate-950/40 dark:bg-slate-900/60 p-1.5 rounded-[2rem] border border-white/5 shadow-2xl overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
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
                <div className="space-y-8 animate-in fade-in duration-500">
                    {activeTab === 'shopping' && (
                        <ShoppingListView
                            scannerOpen={scannerOpen}
                            onScannerOpenChange={setScannerOpen}
                        />
                    )}
                    {activeTab === 'pantry' && (
                        <PantryView refreshKey={refreshKey} />
                    )}
                    {activeTab === 'planner' && (
                        <MealPlannerContent />
                    )}
                    {activeTab === 'foods' && (
                        <div className="space-y-4 animate-in fade-in duration-300">
                            {/* Inventory View Dropdown */}
                            <div className="flex justify-start px-4">
                                <div className="relative">
                                    <button
                                        onClick={() => setShowInventoryMenu(!showInventoryMenu)}
                                        className={cn(
                                            "h-10 px-4 rounded-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all border",
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
                                        <div className="absolute top-full mt-2 left-0 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xl z-50 p-1 min-w-[140px]">
                                            <button
                                                onClick={() => {
                                                    setInventoryView('foods');
                                                    setShowInventoryMenu(false);
                                                }}
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
                                                onClick={() => {
                                                    setInventoryView('list');
                                                    setShowInventoryMenu(false);
                                                }}
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
                                                onClick={() => {
                                                    setInventoryView('pantry');
                                                    setShowInventoryMenu(false);
                                                }}
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
                                                onClick={() => {
                                                    setInventoryView('cart');
                                                    setShowInventoryMenu(false);
                                                }}
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
                            </div>

                            {/* View Content */}
                            <div>
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
                                    <PantryView refreshKey={refreshKey} />
                                )}
                                {inventoryView === 'cart' && (
                                    <ShoppingListView
                                        scannerOpen={scannerOpen}
                                        onScannerOpenChange={setScannerOpen}
                                    />
                                )}
                            </div>
                        </div>
                    )}
                    {activeTab === 'nutrients' && (
                        <div className="animate-in fade-in duration-300">
                            <NutrientsView compact={false} />
                        </div>
                    )}
                </div>
            </PageContainer>
        </>
    );
}

