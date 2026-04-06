import React from 'react';
import { TabShell, SortOption } from '@/components/ui/tab-shell';

export type { SortOption };

interface TrackerTabShellProps {
    children: React.ReactNode;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    sortField: string;
    setSortField: (field: string) => void;
    sortDirection: 'asc' | 'desc';
    setSortDirection: (dir: 'asc' | 'desc') => void;
    title: string;
    placeholder?: string;
    sortOptions: SortOption[];
    showFilters?: boolean;
    onFilterClick?: () => void;
    hasActiveFilters?: boolean;
    activeFilterCount?: number;
    dropdownContent?: React.ReactNode;
}

export function TrackerTabShell(props: TrackerTabShellProps) {
    return (
        <TabShell 
            {...props} 
            theme="blue" 
        />
    );
}
