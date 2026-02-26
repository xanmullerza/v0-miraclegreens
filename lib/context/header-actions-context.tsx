'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface HeaderActionsContextType {
    actions: ReactNode | null;
    setActions: (actions: ReactNode | null) => void;
    customSegmentLabel: string | null;
    setCustomSegmentLabel: (label: string | null) => void;
    filterContent: ReactNode | null;
    setFilterContent: (content: ReactNode | null) => void;
    isFilterExpanded: boolean;
    setIsFilterExpanded: (expanded: boolean) => void;
    isFilterActive: boolean;
    setIsFilterActive: (active: boolean) => void;
}

const HeaderActionsContext = createContext<HeaderActionsContextType | undefined>(undefined);

export function HeaderActionsProvider({ children }: { children: ReactNode }) {
    const [actions, setActions] = useState<ReactNode | null>(null);
    const [customSegmentLabel, setCustomSegmentLabel] = useState<string | null>(null);
    const [filterContent, setFilterContent] = useState<ReactNode | null>(null);
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);
    const [isFilterActive, setIsFilterActive] = useState(false);

    return (
        <HeaderActionsContext.Provider value={{
            actions, setActions,
            customSegmentLabel, setCustomSegmentLabel,
            filterContent, setFilterContent,
            isFilterExpanded, setIsFilterExpanded,
            isFilterActive, setIsFilterActive
        }}>
            {children}
        </HeaderActionsContext.Provider>
    );
}

export function useHeaderActions() {
    const context = useContext(HeaderActionsContext);
    if (context === undefined) {
        throw new Error('useHeaderActions must be used within a HeaderActionsProvider');
    }
    return context;
}

export function HeaderActions({ children }: { children: ReactNode }) {
    const { setActions } = useHeaderActions();

    React.useEffect(() => {
        setActions(children);
        return () => setActions(null);
    }, [children, setActions]);

    return null;
}

export function HeaderFilter({ children, label }: { children: ReactNode, label?: string }) {
    const { setFilterContent, setCustomSegmentLabel } = useHeaderActions();

    React.useEffect(() => {
        setFilterContent(children);
        if (label) setCustomSegmentLabel(label);
        return () => {
            setFilterContent(null);
            setCustomSegmentLabel(null);
        };
    }, [children, label, setFilterContent, setCustomSegmentLabel]);

    return null;
}
