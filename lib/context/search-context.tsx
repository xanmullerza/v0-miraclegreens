'use client';

import React, { createContext, useContext, useState, ReactNode, useRef, useCallback } from 'react';

export interface SearchResult {
    id: string;
    title: string;
    subtitle?: string;
    image?: string | null;
    badges?: string[];
    data?: any; // Store the raw data for the click handler to use
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
    onResultClickRef: React.MutableRefObject<((result: SearchResult) => void) | null>;
    registerResultClickHandler: (handler: (result: SearchResult) => void) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const onResultClickRef = useRef<((result: SearchResult) => void) | null>(null);

    const registerResultClickHandler = useCallback((handler: (result: SearchResult) => void) => {
        onResultClickRef.current = handler;
    }, []);

    return (
        <SearchContext.Provider value={{
            searchQuery,
            setSearchQuery,
            results,
            setResults,
            isLoading,
            setIsLoading,
            isFocused,
            setIsFocused,
            onResultClickRef,
            registerResultClickHandler
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
