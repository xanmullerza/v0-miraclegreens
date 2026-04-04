import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PanelWrapperProps {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    noPadding?: boolean;
    headerVariant?: 'default' | 'minimal' | 'none';
    closeVariant?: 'default' | 'prominent';
}

export function PanelWrapper({ 
    title, 
    onClose, 
    children, 
    noPadding = false,
    headerVariant = 'default',
    closeVariant = 'default'
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
                    <button
                        onClick={onClose}
                        className={cn(
                            "transition-all duration-300",
                            closeVariant === 'prominent' 
                                ? "w-10 h-10 rounded-full border-2 border-rose-500/50 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:border-rose-500 hover:text-white shadow-lg rotate-0 hover:rotate-90"
                                : "p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                        )}
                    >
                        <X size={closeVariant === 'prominent' ? 22 : 20} strokeWidth={closeVariant === 'prominent' ? 3 : 2} />
                    </button>
                </div>
            )}
            <div className={noPadding ? "flex-1 overflow-hidden" : (headerVariant === 'none' ? "flex-1" : "-mt-8 pb-10")}>
                {children}
            </div>
        </div>
    );
}
