import React from 'react';
import { useActionPanel, ActionPanelView } from '@/lib/context/action-panel-context';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface MenuWrapperProps {
    onBack: () => void;
    children: React.ReactNode;
}

function MenuWrapper({ onBack, children }: MenuWrapperProps) {
    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 animate-in fade-in duration-200">
            <div className="flex justify-end mb-3">
                <button
                    onClick={onBack}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors uppercase tracking-widest"
                >
                    🏠 Back to Dashboard
                </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
                {children}
            </div>
        </div>
    );
}

// Menu Button Helper
export function MenuButton({ onClick, icon, label, colorClass }: { onClick: () => void, icon: string, label: string, colorClass: string }) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center justify-center gap-2 p-2 text-center transform transition duration-200 hover:scale-[1.05] active:scale-95 group"
        >
            <span className="text-3xl transition-all">{icon}</span>
            <span className={`text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white transition-colors ${colorClass}`}>
                {label}
            </span>
        </button>
    );
}

export function CookbookMenuPanel({ onBack, navigateTo }: { onBack: () => void; navigateTo: (v: ActionPanelView) => void }) {
    const router = useRouter();
    const { setIsActionPanelOpen } = useActionPanel();
    return (
        <MenuWrapper onBack={onBack}>
            <MenuButton onClick={() => navigateTo('cookbook')} icon="📖" label="View Recipes" colorClass="group-hover:text-emerald-500" />
            <MenuButton onClick={() => navigateTo('import-options')} icon="✍️" label="Add Recipes" colorClass="group-hover:text-indigo-500" />
            <MenuButton onClick={() => toast('Export is coming soon 👀')} icon="🤝" label="Share Recipes" colorClass="group-hover:text-cyan-500" />
        </MenuWrapper>
    );
}

export function PlannerMenuPanel({ onBack, navigateTo }: { onBack: () => void; navigateTo: (v: ActionPanelView) => void }) {
    const router = useRouter();
    const { setIsActionPanelOpen } = useActionPanel();
    return (
        <MenuWrapper onBack={onBack}>
            <MenuButton onClick={() => { setIsActionPanelOpen(false); router.push('/tracker'); }} icon="🗂️" label="Meal Planner" colorClass="group-hover:text-blue-500" />
            <MenuButton onClick={() => navigateTo('pantry')} icon="🧺" label="Pantry" colorClass="group-hover:text-green-500" />
            <MenuButton onClick={() => navigateTo('shopping')} icon="🛒" label="Shopping List" colorClass="group-hover:text-amber-500" />
            <div className="flex flex-col items-center justify-center gap-2 p-2 text-center opacity-40">
                <span className="text-3xl">⏳</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Coming Soon</span>
            </div>
        </MenuWrapper>
    );
}

export function WidgetsMenuPanel({ onBack, navigateTo }: { onBack: () => void; navigateTo: (v: ActionPanelView) => void }) {
    return (
        <MenuWrapper onBack={onBack}>
            <MenuButton onClick={() => navigateTo('nutridex')} icon="🧪" label="Nutridex" colorClass="group-hover:text-fuchsia-500" />
            <MenuButton onClick={() => navigateTo('comparator')} icon="⚖️" label="Comparator" colorClass="group-hover:text-indigo-500" />
            <MenuButton onClick={() => navigateTo('lifeguard')} icon="🛡️" label="Lifeguard" colorClass="group-hover:text-teal-500" />
            <MenuButton onClick={() => navigateTo('recommended-intake')} icon="📊" label="RDA" colorClass="group-hover:text-emerald-500" />
        </MenuWrapper>
    );
}
