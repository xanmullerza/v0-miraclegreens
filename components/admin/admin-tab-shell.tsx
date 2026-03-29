'use client';

import React, { useState, Suspense } from 'react';
import { cn } from '@/lib/utils';
import { 
    LayoutDashboard, 
    Table, 
    ChefHat, 
    Plus, 
    Wallet, 
    Scale, 
    Beaker,
    Loader2
} from 'lucide-react';
import dynamic from 'next/dynamic';

const AdminOverview = dynamic(() => import('./admin-overview').then(m => m.AdminOverview), { 
    loading: () => <TabLoading placeholder="Loading Dashboard..." /> 
});
const ManageFoodsView = dynamic(() => import('./ingredients/manage-foods-view'), { 
    loading: () => <TabLoading placeholder="Loading Database..." /> 
});
const ManageRecipesView = dynamic(() => import('./recipes/manage-recipes-view'), { 
    loading: () => <TabLoading placeholder="Loading Recipes..." /> 
});
const UserRecipeBuilder = dynamic(() => import('../recipe/user-recipe-builder').then(m => m.UserRecipeBuilder), { 
    loading: () => <TabLoading placeholder="Loading Builder..." /> 
});
const FoodItemCreatorContent = dynamic(() => import('./ingredients/food-item-creator').then(m => m.FoodItemCreatorContent), { 
    loading: () => <TabLoading placeholder="Loading Creator..." /> 
});
const LifeguardView = dynamic(() => import('./lifeguard-view'), { 
    loading: () => <TabLoading placeholder="Loading Simulator..." /> 
});
const ComparatorView = dynamic(() => import('./comparator-view'), { 
    loading: () => <TabLoading placeholder="Loading Comparator..." /> 
});
const LabView = dynamic(() => import('./ingredients/lab-view').then(m => m.LabView), { 
    loading: () => <TabLoading placeholder="Loading Spice Lab..." /> 
});

function TabLoading({ placeholder }: { placeholder: string }) {
    return (
        <div className="flex flex-col items-center justify-center p-24 h-[60vh]">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-500 mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{placeholder}</p>
        </div>
    );
}

const TABS = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'food-db', label: 'Food DB', icon: Table },
    { id: 'recipes', label: 'Recipes', icon: ChefHat },
    { id: 'builder', label: 'Builder', icon: Plus },
    { id: 'creator', label: 'Creator', icon: Plus },
    { id: 'lifeguard', label: 'Lifeguard', icon: Wallet },
    { id: 'comparator', label: 'Compare', icon: Scale },
    { id: 'spice-lab', label: 'Spice Lab', icon: Beaker },
];

export function AdminTabShell() {
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <div className="flex flex-col min-h-screen bg-transparent">
            {/* Tabs Header */}
            <div className="sticky top-0 z-20 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="px-4 py-3 hide-scrollbar overflow-x-auto">
                    <div className="flex items-center gap-2 max-w-7xl mx-auto">
                        {TABS.map((tab) => {
                            const isActive = activeTab === tab.id;
                            const Icon = tab.icon;
                            
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                                        isActive 
                                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25" 
                                            : "bg-slate-100 dark:bg-slate-800/50 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800"
                                    )}
                                >
                                    <Icon size={14} className={cn("transition-transform duration-300", isActive && "scale-110")} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 w-full animate-in fade-in duration-500 relative">
                <div className="max-w-7xl mx-auto p-4 md:p-8">
                    {activeTab === 'overview' && <AdminOverview onTabSelect={setActiveTab} />}
                    {activeTab === 'food-db' && <ManageFoodsView />}
                    {activeTab === 'recipes' && <ManageRecipesView />}
                    {activeTab === 'builder' && <UserRecipeBuilder />}
                    {activeTab === 'creator' && <FoodItemCreatorContent />}
                    {activeTab === 'lifeguard' && <LifeguardView />}
                    {activeTab === 'comparator' && <ComparatorView />}
                    {activeTab === 'spice-lab' && <LabView />}
                </div>
            </div>
        </div>
    );
}
