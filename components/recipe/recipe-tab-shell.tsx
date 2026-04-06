import { TabShell } from '@/components/ui/tab-shell';
import { Clock, ChefHat, Flame, ArrowDownUp } from 'lucide-react';
import { useActionPanel } from '@/lib/context/action-panel-context';
import { useRecipeFilter } from '@/lib/context/recipe-filter-context';
import { RecipeFilterContent } from '@/components/recipe/recipe-filter-dialog';

export const RECIPE_SORT_OPTIONS = [
    { id: 'title', label: 'Title (A-Z)', icon: <ArrowDownUp size={14} /> },
    { id: 'prep_time', label: 'Prep Time', icon: <Clock size={14} /> },
    { id: 'difficulty', label: 'Difficulty', icon: <ChefHat size={14} /> },
    { id: 'calories', label: 'Calories', icon: <Flame size={14} /> }
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
}

export function RecipeTabShell(props: RecipeTabShellProps) {
    const { setIsActionPanelOpen, setActiveView, isActionPanelOpen, activeView } = useActionPanel();
    const { hasActiveFilters, filters, setFilters } = useRecipeFilter();
    
    // We add logic to artificially trigger the active filter highlight
    // if the panel is open specifically for recipe-filters
    const isFilterOpen = activeView === 'recipe-filters';

    return (
        <TabShell 
            {...props} 
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
            dropdownContent={props.additionalControls}
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
