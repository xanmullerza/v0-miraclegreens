import React from 'react';
import { cn } from '@/lib/utils';

interface PanelWrapperProps {
    title: string;
    children: React.ReactNode;
    noPadding?: boolean;
    headerVariant?: 'default' | 'minimal' | 'none';
}

export function PanelWrapper({ 
    title, 
    children, 
    noPadding = false,
    headerVariant = 'default'
}: PanelWrapperProps) {
    return (
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar pb-20 animate-in fade-in duration-200">
            {headerVariant !== 'none' && (
                <div className={cn(
                    "flex justify-between items-center p-4 sticky top-0 z-10 shrink-0",
                    headerVariant === 'default' ? "bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 pb-2" : "bg-transparent pb-0"
                )}>
                    <h2 className="text-lg font-black italic uppercase tracking-wider text-slate-900 dark:text-white">
                        {headerVariant === 'default' ? title : ""}
                    </h2>
                </div>
            )}
            <div className={noPadding ? "flex-1" : (headerVariant === 'none' ? "flex-1" : "-mt-8 pb-10")}>
                {children}
            </div>
        </div>
    );
}
