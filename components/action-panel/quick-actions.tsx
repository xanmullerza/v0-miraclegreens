import React from 'react';
import { 
    ChevronRight, 
    Salad, 
    Package, 
    ShoppingBag, 
    Calendar, 
    Menu 
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { ActionPanelView } from '@/lib/context/action-panel-context';

interface QuickActionsProps {
    showQuickActions: boolean;
    setShowQuickActions: (show: boolean) => void;
    expandedRecipeMenu: boolean;
    setExpandedRecipeMenu: (expanded: boolean) => void;
    expandedAppsMenu: boolean;
    setExpandedAppsMenu: (expanded: boolean) => void;
    expandedWidgetsMenu: boolean;
    setExpandedWidgetsMenu: (expanded: boolean) => void;
    activeView: ActionPanelView;
    setActiveView: (view: ActionPanelView) => void;
    previousView: ActionPanelView | null;
    setPreviousView: (view: ActionPanelView | null) => void;
    handleViewAllRecipes: () => void;
    handleViewMyRecipes: () => void;
    handleCreateNewRecipe: () => void;
}

export function QuickActions({
    showQuickActions,
    setShowQuickActions,
    expandedRecipeMenu,
    setExpandedRecipeMenu,
    expandedAppsMenu,
    setExpandedAppsMenu,
    expandedWidgetsMenu,
    setExpandedWidgetsMenu,
    activeView,
    setActiveView,
    previousView,
    setPreviousView,
    handleViewAllRecipes,
    handleViewMyRecipes,
    handleCreateNewRecipe
}: QuickActionsProps) {
    if (!showQuickActions) return null;

    return (
        <div className="absolute bottom-full left-0 right-0 z-50 bg-card border-t border-border p-4 space-y-2 animate-in slide-in-from-bottom-3 shadow-2xl rounded-t-2xl">
            {/* Recipe Button */}
            <div>
                <button
                    onClick={() => {
                        setExpandedWidgetsMenu(false);
                        setExpandedAppsMenu(false);
                        setExpandedRecipeMenu(!expandedRecipeMenu);
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <Salad size={18} className="text-emerald-500" />
                        <span className="font-medium text-sm">Recipes</span>
                    </div>
                    <ChevronRight 
                        size={16} 
                        className={cn(
                            "transition-transform",
                            expandedRecipeMenu ? "rotate-90" : ""
                        )}
                    />
                </button>

                {/* Recipe Sub-menu */}
                {expandedRecipeMenu && (
                    <div className="mt-2 ml-4 space-y-2 pl-4 border-l-2 border-emerald-500">
                        <button
                            onClick={() => {
                                handleViewAllRecipes();
                                setExpandedRecipeMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-sm transition-colors"
                        >
                            📚 View All Recipes
                        </button>
                        <button
                            onClick={() => {
                                handleViewMyRecipes();
                                setExpandedRecipeMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-sm transition-colors"
                        >
                            ❤️ View My Recipes
                        </button>
                        <button
                            onClick={() => {
                                handleCreateNewRecipe();
                                setExpandedRecipeMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-sm transition-colors"
                        >
                            ➕ Create New Recipe
                        </button>
                    </div>
                )}
            </div>

            {/* Apps Button */}
            <div>
                <button
                    onClick={() => {
                        setExpandedRecipeMenu(false);
                        setExpandedWidgetsMenu(false);
                        setExpandedAppsMenu(!expandedAppsMenu);
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <Package size={18} className="text-purple-500" />
                        <span className="font-medium text-sm">Apps</span>
                    </div>
                    <ChevronRight 
                        size={16} 
                        className={cn(
                            "transition-transform",
                            expandedAppsMenu ? "rotate-90" : ""
                        )}
                    />
                </button>

                {/* Apps Sub-menu */}
                {expandedAppsMenu && (
                    <div className="mt-2 ml-4 space-y-2 pl-4 border-l-2 border-purple-500">
                        <button
                            onClick={() => {
                                setActiveView('shopping');
                                setShowQuickActions(false);
                                setExpandedAppsMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-sm transition-colors flex items-center gap-2"
                        >
                            <ShoppingBag size={14} className="text-blue-500" />
                            Shopping
                        </button>
                        <button
                            onClick={() => {
                                setActiveView('pantry');
                                setShowQuickActions(false);
                                setExpandedAppsMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-sm transition-colors flex items-center gap-2"
                        >
                            <Package size={14} className="text-orange-500" />
                            Pantry
                        </button>
                        <button
                            onClick={() => {
                                setActiveView('planner');
                                setShowQuickActions(false);
                                setExpandedAppsMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-sm transition-colors flex items-center gap-2"
                        >
                            <Calendar size={14} className="text-pink-500" />
                            Planner
                        </button>
                    </div>
                )}
            </div>

            {/* Widgets Button */}
            <div>
                <button
                    onClick={() => {
                        setExpandedRecipeMenu(false);
                        setExpandedAppsMenu(false);
                        setExpandedWidgetsMenu(!expandedWidgetsMenu);
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <Salad size={18} className="text-cyan-500" />
                        <span className="font-medium text-sm">Widgets</span>
                    </div>
                    <ChevronRight 
                        size={16} 
                        className={cn(
                            "transition-transform",
                            expandedWidgetsMenu ? "rotate-90" : ""
                        )}
                    />
                </button>

                {/* Widgets Sub-menu */}
                {expandedWidgetsMenu && (
                    <div className="mt-2 ml-4 space-y-2 pl-4 border-l-2 border-cyan-500">
                        <button
                            onClick={() => {
                                setActiveView('nutridex');
                                setShowQuickActions(false);
                                setExpandedWidgetsMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-sm transition-colors flex items-center gap-2"
                        >
                            <span className="text-lg">📊</span>
                            Nutrients Guide
                        </button>
                        <button
                            onClick={() => {
                                setActiveView('comparator');
                                setShowQuickActions(false);
                                setExpandedWidgetsMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-sm transition-colors flex items-center gap-2"
                        >
                            <span className="text-lg">⚡</span>
                            Comparator
                        </button>
                        <button
                            onClick={() => {
                                setActiveView('lifeguard');
                                setShowQuickActions(false);
                                setExpandedWidgetsMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-sm transition-colors flex items-center gap-2"
                        >
                            <span className="text-lg">🛡️</span>
                            Lifeguard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
