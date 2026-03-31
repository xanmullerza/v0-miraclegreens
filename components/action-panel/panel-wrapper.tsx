import React from 'react';
import { X } from 'lucide-react';

interface PanelWrapperProps {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    noPadding?: boolean;
}

export function PanelWrapper({ title, onClose, children, noPadding = false }: PanelWrapperProps) {
    return (
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar pb-20 animate-in fade-in duration-200">
            <div className="flex justify-between items-center p-4 pb-0 bg-white dark:bg-slate-900 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <h2 className="text-lg font-black italic uppercase tracking-wider text-slate-900 dark:text-white">
                    {title}
                </h2>
                <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>
            <div className={noPadding ? "flex-1 overflow-hidden" : "-mt-8 pb-10"}>
                {children}
            </div>
        </div>
    );
}
