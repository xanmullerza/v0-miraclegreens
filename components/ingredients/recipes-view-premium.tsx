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

type TabId = 'recipes' | 'remixes' | 'mixes';

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
    const { hasActiveFilters } = useRecipeFilter();

    const [activeTab, setActiveTab] = useState<TabId>(initialTab);
    const [showOnlyMyRecipes, setShowOnlyMyRecipes] = useState(false);
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
            {/* Big Tab Bar */}
            <div className="sticky top-0 z-20 bg-gradient-to-b from-slate-50 dark:from-slate-950 to-transparent py-4 px-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex bg-slate-100 dark:bg-slate-900 rounded-xl p-1 max-w-md mx-auto">
                    {([
                        { id: 'recipes' as TabId, label: 'Recipes', activeColor: 'text-emerald-500' },
                        { id: 'remixes' as TabId, label: 'Remixes', activeColor: 'text-indigo-500' },
                        { id: 'mixes' as TabId, label: 'Mixes', activeColor: 'text-amber-500' },
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

            {/* Premium Controls Row */}
            <div className="sticky top-[60px] z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
                <div className="px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center gap-3">
                    <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-between sm:justify-start">
                        {/* All | Mine Toggle */}
                        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                            <button
                                onClick={() => setShowOnlyMyRecipes(false)}
                                className={cn(
                                    "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                    !showOnlyMyRecipes
                                        ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                )}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setShowOnlyMyRecipes(true)}
                                className={cn(
                                    "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                    showOnlyMyRecipes
                                        ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                )}
                            >
                                Mine
                            </button>
                        </div>

                        {/* Recipes | Remixes | Mixes inline tabs */}
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                            {([
                                { id: 'recipes' as TabId, label: 'Recipes' },
                                { id: 'remixes' as TabId, label: 'Remixes' },
                                { id: 'mixes' as TabId, label: 'Mixes' },
                            ]).map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={cn(
                                        "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                        activeTab === tab.id
                                            ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                                            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    )}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="flex-1 relative w-full sm:max-w-xs">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery ?? ''}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Search recipes..."
                            className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-slate-400 transition-all shadow-sm"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => onSearchChange('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>

                    {/* Actions Group */}
                    <div className="flex items-center gap-2 shrink-0">
                        {/* Add Button */}
                        <button
                            onClick={() => {
                                setChatbotView('import');
                                setIsChatbotOpen(true);
                            }}
                            className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all text-emerald-500 hover:text-emerald-600 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm group"
                            title="AI Recipe Import"
                        >
                            <Plus size={18} className="group-hover:scale-110 transition-transform" />
                        </button>

                        {/* Help Button */}
                        <button
                            onClick={() => {
                                setChatbotView('help-cookbook');
                                setIsChatbotOpen(true);
                            }}
                            className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all text-blue-500 hover:text-blue-600 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm group"
                            title="Cookbook Help"
                        >
                            <CircleHelp size={18} className="group-hover:scale-110 transition-transform" />
                        </button>

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

                        {/* Filter Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className={cn(
                                    "p-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 border shadow-sm outline-none",
                                    (showFavoritesOnly || (selectedTypes.length > 0 && selectedTypes.length < MEAL_TYPES.length) || hasActiveFilters)
                                        ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20"
                                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-blue-200 hover:text-blue-600"
                                )}>
                                    <Filter size={18} />
                                    <span className="hidden lg:inline">Filter</span>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                side="bottom"
                                align="end"
                                className="w-56 rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-950 z-[100]"
                            >
                                <div className="p-2">
                                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-2">Scope</DropdownMenuLabel>
                                    <DropdownMenuCheckboxItem
                                        checked={showFavoritesOnly}
                                        onCheckedChange={setShowFavoritesOnly}
                                        className="rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 focus:bg-rose-50 dark:focus:bg-rose-900/10 focus:text-rose-600 py-2.5 cursor-pointer"
                                    >
                                        <Heart size={12} className={cn("mr-2 transition-transform", showFavoritesOnly && "fill-current scale-110")} />
                                        Favorites Only
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 mx-2" />
                                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-2">Types</DropdownMenuLabel>
                                    {MEAL_TYPES.map(type => (
                                        <DropdownMenuCheckboxItem
                                            key={type}
                                            checked={selectedTypes.includes(type)}
                                            onCheckedChange={(checked) => {
                                                if (checked) setSelectedTypes(prev => [...prev, type]);
                                                else setSelectedTypes(prev => prev.filter(t => t !== type));
                                            }}
                                            className="rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 py-2.5 cursor-pointer focus:bg-blue-50 dark:focus:bg-blue-900/10 focus:text-blue-600"
                                        >
                                            {type}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                    <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 mx-2" />
                                    <div className="px-1 py-1">
                                        <button
                                            onClick={() => setShowFilterDialog(true)}
                                            className="w-full text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-xl transition-colors mt-1"
                                        >
                                            Advanced Filters →
                                        </button>
                                    </div>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
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
                    key={`${activeTab}-${showOnlyMyRecipes}`}
                    onRecipeClick={onRecipeClick}
                    hideControls={true}
                    isMix={isMix}
                    isRemix={isRemix}
                    onlyMyRecipes={showOnlyMyRecipes}
                    showFavoritesOnly={showFavoritesOnly}
                    setShowFavoritesOnly={setShowFavoritesOnly}
                    selectedTypes={selectedTypes}
                    setSelectedTypes={setSelectedTypes}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    searchQuery={searchQuery}
                    onSearchChange={onSearchChange}
                    isPremium={true}
                />
            </div>
        </div>
    );
}
