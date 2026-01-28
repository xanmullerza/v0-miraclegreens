'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface SearchResult {
    id: string;
    title: string;
    subtitle?: string;
    image?: string | null;
    badges?: string[];
    onClick: () => void;
}

interface SearchContextType {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    results: SearchResult[];
    setResults: (results: SearchResult[]) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    isFocused: boolean;
    setIsFocused: (focused: boolean) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    return (
        <SearchContext.Provider value={{
            searchQuery,
            setSearchQuery,
            results,
            setResults,
            isLoading,
            setIsLoading,
            isFocused,
            setIsFocused
        }}>
            {children}
        </SearchContext.Provider>
    );
}

export function useSearch() {
    const context = useContext(SearchContext);
    if (context === undefined) {
        throw new Error('useSearch must be used within a SearchProvider');
    }
    return context;
}
