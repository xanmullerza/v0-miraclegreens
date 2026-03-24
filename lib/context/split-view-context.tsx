'use client';

import React, { ReactNode, createContext, useContext, useState, useEffect } from 'react';

type ResizeMode = 'equal' | 'content-focus' | 'dashboard-only';

interface SplitViewContextType {
    resizeMode: ResizeMode;
    setResizeMode: (mode: ResizeMode) => void;
    toggleResize: () => void;
}

const SplitViewContext = createContext<SplitViewContextType | undefined>(undefined);

export function SplitViewProvider({ children }: { children: ReactNode }) {
    const [resizeMode, setResizeMode] = useState<ResizeMode>('content-focus');
    const [isMounted, setIsMounted] = useState(false);

    // Load saved resize mode on mount
    useEffect(() => {
        const saved = localStorage.getItem('app-split-mode') as ResizeMode | null;
        if (saved && ['equal', 'content-focus', 'dashboard-only'].includes(saved)) {
            setResizeMode(saved);
        }
        setIsMounted(true);
    }, []);

    // Save resize mode to localStorage whenever it changes
    useEffect(() => {
        if (isMounted) {
            localStorage.setItem('app-split-mode', resizeMode);
        }
    }, [resizeMode, isMounted]);

    const toggleResize = () => {
        setResizeMode(prev => {
            if (prev === 'content-focus') return 'equal';
            if (prev === 'equal') return 'dashboard-only';
            return 'content-focus';
        });
    };

    return (
        <SplitViewContext.Provider value={{ resizeMode, setResizeMode, toggleResize }}>
            {children}
        </SplitViewContext.Provider>
    );
}

export function useSplitView() {
    const context = useContext(SplitViewContext);
    if (context === undefined) {
        throw new Error('useSplitView must be used within SplitViewProvider');
    }
    return context;
}
