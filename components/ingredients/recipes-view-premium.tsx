'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search,
    Plus,
    CircleHelp,
    ArrowDownUp,
    Filter,
    Heart,
    ChevronDown,
    X,
    Clock,
    ChefHat,
    Salad
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useChatbot } from '@/lib/context/chatbot-context';
import { useRecipeFilter } from '@/lib/context/recipe-filter-context';
import { RecipesView, MEAL_TYPES } from '@/components/ingredients/recipes-view';
import { RecipeFilterDialog } from '@/components/recipe/recipe-filter-dialog';
import { FoodsView } from '@/components/ingredients/foods-view';
import { NutridexView } from '@/components/nutridex-view';

type TabId = 'recipes' | 'remixes' | 'mixes' | 'foods' | 'nutrients';

interface RecipesViewPremiumProps {
    onRecipeClick?: (recipeId: string) => void;
    onTabChange?: (tab: TabId) => void;
    initialTab?: TabId;
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
}

export function RecipesViewPremium({
    onRecipeClick,
    onTabChange,
    initialTab = 'recipes',
    searchQuery: externalSearchQuery,
    onSearchChange: externalOnSearchChange,
}: RecipesViewPremiumProps) {
    const router = useRouter();
    const { setIsChatbotOpen, setChatbotView } = useChatbot();
    const { filters, hasActiveFilters, resetAllFilters } = useRecipeFilter();

    const [activeTab, setActiveTab] = useState<TabId>(initialTab);
    const [localSearchQuery, setLocalSearchQuery] = useState('');
    const [showSortOptions, setShowSortOptions] = useState(false);
    const [sortField, setSortField] = useState<string>('title');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [selectedTypes, setSelectedTypes] = useState<string[]>(MEAL_TYPES);
    const [showFilterDialog, setShowFilterDialog] = useState(false);

    const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : localSearchQuery;
    const onSearchChange = externalOnSearchChange !== undefined ? externalOnSearchChange : setLocalSearchQuery;

    const handleTabChange = (tab: TabId) => {
        setActiveTab(tab);
        onTabChange?.(tab);
    };

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const isMix = activeTab === 'mixes';
    const isRemix = activeTab === 'remixes';

    return (
        <div className="space-y-0 animate-in fade-in duration-500">
            {/* Unified Card Container */}
            <div className="w-full max-w-6xl mx-auto bg-slate-100 dark:bg-slate-900/80 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                
                {/* Big Tab Bar - Inside Card */}
                <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 py-4 px-4">
                    <div className="flex bg-slate-100 dark:bg-slate-900/50 rounded-xl p-1 max-w-xl mx-auto border border-slate-200 dark:border-slate-800">
                        {([
                            { id: 'recipes' as TabId, label: 'Recipes', activeColor: 'text-emerald-500' },
                            { id: 'remixes' as TabId, label: 'Remixes', activeColor: 'text-indigo-500' },
                            { id: 'mixes' as TabId, label: 'Mixes', activeColor: 'text-amber-500' },
                            { id: 'foods' as TabId, label: 'Foods', activeColor: 'text-cyan-500' },
                            { id: 'nutrients' as TabId, label: 'Nutrients', activeColor: 'text-violet-500' },
                        ]).map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={cn(
                                    "flex-1 py-2 text-[8px] font-black uppercase tracking-[0.2em] rounded-lg transition-all",
                                    activeTab === tab.id
                                        ? `bg-white dark:bg-slate-800 ${tab.activeColor} shadow-sm`
                                        : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Recipe-specific controls - only visible for recipe tabs */}
                {(activeTab === 'recipes' || activeTab === 'remixes' || activeTab === 'mixes') && (
                    <>
                        {/* Premium Controls Row - Inside Card */}
                        <div className="sticky top-[68px] z-10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                            <div className="px-6 py-3 flex items-center justify-center gap-4">
                                {/* Search Bar */}
                                <div className="relative w-full max-w-md">
                                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={searchQuery ?? ''}
                                        onChange={(e) => onSearchChange(e.target.value)}
                                        placeholder="Search recipes..."
                                        className="w-full pl-10 pr-10 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-slate-400 transition-all shadow-sm"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => onSearchChange('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>

                                {/* Actions Group */}
                                <div className="flex items-center gap-2 shrink-0">
                                    {/* Sort Button */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowSortOptions(!showSortOptions)}
                                            className={cn(
                                                "p-2 rounded-xl transition-all flex items-center gap-2 border shadow-sm",
                                                showSortOptions
                                                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 border-indigo-200"
                                                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-500 hover:border-indigo-200"
                                            )}
                                            title="Sort Options"
                                        >
                                            <ArrowDownUp size={18} />
                                            <span className="text-[9px] font-black uppercase tracking-widest hidden lg:inline">
                                                {sortField === 'title' ? 'A-Z' : sortField === 'prep_time' ? 'Time' : sortField === 'calories' ? 'Cal' : 'Diff'}
                                            </span>
                                        </button>

                                        {showSortOptions && (
                                            <div className="absolute top-full right-0 mt-3 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-[100] p-1.5 animate-in fade-in zoom-in-95 duration-200">
                                                {[
                                                    { id: 'title', label: 'Title (A-Z)', icon: <ArrowDownUp size={14} /> },
                                                    { id: 'prep_time', label: 'Prep Time', icon: <Clock size={14} /> },
                                                    { id: 'difficulty', label: 'Difficulty', icon: <ChefHat size={14} /> },
                                                    { id: 'calories', label: 'Calories', icon: <Salad size={14} /> },
                                                ].map((opt) => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => {
                                                            handleSort(opt.id);
                                                            setShowSortOptions(false);
                                                        }}
                                                        className={cn(
                                                            "w-full text-left px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-between transition-all",
                                                            sortField === opt.id
                                                                ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600"
                                                                : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                                                        )}
                                                    >
                                                        <span className="flex items-center gap-2">
                                                            {opt.icon}
                                                            {opt.label}
                                                        </span>
                                                        {sortField === opt.id && (
                                                            <span className="text-[8px]">
                                                                {sortDirection === 'asc' ? '↑' : '↓'}
                                                            </span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Filter Button */}
                                    <button 
                                        onClick={() => setShowFilterDialog(true)}
                                        className={cn(
                                            "p-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 border shadow-sm outline-none",
                                            hasActiveFilters
                                                ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20"
                                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-blue-200 hover:text-blue-600"
                                        )}
                                        title="Advanced Filters"
                                    >
                                        <Filter size={18} />
                                        <span className="hidden lg:inline">Filters</span>
                                        {hasActiveFilters && (
                                            <span className="flex h-2 w-2 rounded-full bg-white animate-pulse" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Recipe Filter Dialog */}
                        <RecipeFilterDialog 
                            isOpen={showFilterDialog} 
                            onClose={() => setShowFilterDialog(false)} 
                        />

                        {/* Recipe List */}
                        <div className="flex-1 overflow-hidden">
                            <RecipesView
                                key={`${activeTab}-${filters.onlyMyRecipes}`}
                                onRecipeClick={onRecipeClick}
                                hideControls={true}
                                isMix={isMix}
                                isRemix={isRemix}
                                onlyMyRecipes={filters.onlyMyRecipes}
                                showFavoritesOnly={showFavoritesOnly}
                                setShowFavoritesOnly={setShowFavoritesOnly}
                                selectedTypes={selectedTypes}
                                setSelectedTypes={setSelectedTypes}
                                sortField={sortField}
                                sortDirection={sortDirection}
                                searchQuery={searchQuery}
                                onSearchChange={onSearchChange}
                                isPremium={true}
                                noContainer={true}
                            />
                        </div>
                    </>
                )}

                {/* Foods View */}
                {activeTab === 'foods' && (
                    <div className="flex-1 overflow-hidden animate-in fade-in duration-300">
                        <FoodsView noContainer={true} />
                    </div>
                )}

                {/* Nutrients View */}
                {activeTab === 'nutrients' && (
                    <div className="flex-1 overflow-hidden animate-in fade-in duration-300">
                        <NutridexView compact={false} noContainer={true} />
                    </div>
                )}
            </div>
        </div>
    );
}
