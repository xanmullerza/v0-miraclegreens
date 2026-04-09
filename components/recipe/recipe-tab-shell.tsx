import { TabShell } from '@/components/ui/tab-shell';
import { Clock, ChefHat, Flame, ALargeSmall } from 'lucide-react';
import { useActionPanel } from '@/lib/context/action-panel-context';
import { useRecipeFilter } from '@/lib/context/recipe-filter-context';
import { RecipeFilterContent } from '@/components/recipe/recipe-filter-dialog';
import { getSharedNavOptions } from '@/lib/constants/nav-options';

export const RECIPE_SORT_OPTIONS = [
    { id: 'title', label: 'Title (A-Z)', icon: <ALargeSmall size={18} /> },
    { id: 'prep_time', label: 'Prep Time', icon: <Clock size={18} /> },
    { id: 'difficulty', label: 'Difficulty', icon: <ChefHat size={18} /> },
    { id: 'calories', label: 'Calories', icon: <Flame size={18} /> }
] as const;

interface RecipeTabShellProps {
    children: React.ReactNode;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    sortField: string;
    setSortField: (field: string) => void;
    sortDirection: 'asc' | 'desc';
    setSortDirection: (dir: 'asc' | 'desc') => void;
    title: string;
    additionalControls?: React.ReactNode;
    dropdownOptions?: { id: string; label: string; icon: React.ReactNode; onClick: () => void; active?: boolean }[];
}

export function RecipeTabShell({ fullHeight, ...props }: RecipeTabShellProps & { fullHeight?: boolean }) {
    const { setIsActionPanelOpen, setActiveView, activeView, navigateTo } = useActionPanel();
    const { hasActiveFilters, filters, setFilters } = useRecipeFilter();
    
    // We add logic to artificially trigger the active filter highlight
    // if the panel is open specifically for recipe-filters
    const isFilterOpen = activeView === 'recipe-filters';

    return (
        <TabShell 
            {...props} 
            fullHeight={fullHeight}
            theme="emerald"
            sortOptions={[...RECIPE_SORT_OPTIONS]}
            showFilters={true}
            isFiltersOpen={isFilterOpen}
            onFilterClick={() => {
                if (isFilterOpen) {
                    setActiveView('home');
                    setIsActionPanelOpen(false);
                } else {
                    setActiveView('recipe-filters');
                    // Only open ActionPanel on desktop
                    if (window.innerWidth >= 640) {
                        setIsActionPanelOpen(true);
                    }
                }
            }}
            hasActiveFilters={hasActiveFilters}
            scaleValue={filters.globalServings || 1}
            onScaleChange={(val: number) => {
                setFilters({
                    ...filters,
                    globalServings: val,
                    servingsOverrides: {} // Reset individual tweaks when using global scale
                });
            }}
            filterChildren={<RecipeFilterContent onClose={() => { setActiveView('home'); setIsActionPanelOpen(false); }} />}
        />
    );
}
