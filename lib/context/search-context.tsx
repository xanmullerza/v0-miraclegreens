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
    activeSearchId: string | null;
    setActiveSearchId: (id: string | null) => void;
    onResultClickRef: React.MutableRefObject<((result: SearchResult) => void) | null>;
    registerResultClickHandler: (handler: (result: SearchResult) => void) => void;
    searchInputRef: React.RefObject<HTMLInputElement | null>;
    keepFocusAfterSelect: boolean;
    setKeepFocusAfterSelect: (keep: boolean) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [activeSearchId, setActiveSearchId] = useState<string | null>(null);
    const onResultClickRef = useRef<((result: SearchResult) => void) | null>(null);
    const searchInputRef = useRef<HTMLInputElement | null>(null);
    const [keepFocusAfterSelect, setKeepFocusAfterSelect] = useState(false);

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
            activeSearchId,
            setActiveSearchId,
            onResultClickRef,
            registerResultClickHandler,
            searchInputRef,
            keepFocusAfterSelect,
            setKeepFocusAfterSelect
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
