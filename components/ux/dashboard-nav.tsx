'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Calendar, ShoppingBasket, Shapes, X as CloseIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActionPanel } from '@/lib/context/action-panel-context';


export function DashboardNav() {
    const router = useRouter();
    const pathname = usePathname();
    const { setIsActionPanelOpen } = useActionPanel();

    // Determine active button
    const getActiveButton = () => {
        if (pathname.includes('/tracker')) {
            if (typeof window !== 'undefined') {
                const searchParams = new URLSearchParams(window.location.search);
                const tab = searchParams.get('tab');
                if (tab === 'shopping') return 'shopping';
                if (tab === 'pantry') return 'pantry';
                if (tab === 'planner') return 'planner';
            }
        }
        return null;
    };



    const activeButton = getActiveButton();

    const buttons = [
        { id: 'shopping', icon: ShoppingBasket, label: 'Shopping', path: '/tracker?tab=shopping', color: 'amber' },
        { id: 'pantry', icon: Shapes, label: 'Pantry', path: '/tracker?tab=pantry', color: 'sky' },
        { id: 'planner', icon: Calendar, label: 'Planner', path: '/tracker?tab=planner', color: 'purple' },
    ];

    return (
        <>
            <div suppressHydrationWarning className="w-full bg-slate-950/95 backdrop-blur-sm">
                <div className="flex items-center justify-center gap-2 px-4 py-4">
                    {/* Debug: Show state */}
                    {/* {isActionPanelOpen ? "OPEN" : "CLOSED"} */}
                {buttons.map((btn) => {
                    const Icon = btn.icon;
                    const isActive = activeButton === btn.id;
                    const color = btn.color;
                    const colorClasses: Record<string, { active: string; inactive: string }> = {
                        indigo: {
                            active: "bg-indigo-500/10 border-indigo-500/50 text-indigo-500",
                            inactive: "bg-slate-100/10 border-slate-400/30 text-slate-400 hover:text-indigo-500 hover:border-indigo-500/40 hover:bg-indigo-500/5"
                        },
                        emerald: {
                            active: "bg-emerald-500/10 border-emerald-500/50 text-emerald-500",
                            inactive: "bg-slate-100/10 border-slate-400/30 text-slate-400 hover:text-emerald-500 hover:border-emerald-500/40 hover:bg-emerald-500/5"
                        },
                        rose: {
                            active: "bg-rose-500/10 border-rose-500/50 text-rose-500",
                            inactive: "bg-slate-100/10 border-slate-400/30 text-slate-400 hover:text-rose-500 hover:border-rose-500/40 hover:bg-rose-500/5"
                        },
                        amber: {
                            active: "bg-amber-500/10 border-amber-500/50 text-amber-500",
                            inactive: "bg-slate-100/10 border-slate-400/30 text-slate-400 hover:text-amber-500 hover:border-amber-500/40 hover:bg-amber-500/5"
                        },
                        sky: {
                            active: "bg-sky-500/10 border-sky-500/50 text-sky-500",
                            inactive: "bg-slate-100/10 border-slate-400/30 text-slate-400 hover:text-sky-500 hover:border-sky-500/40 hover:bg-sky-500/5"
                        },
                        purple: {
                            active: "bg-purple-500/10 border-purple-500/50 text-purple-500",
                            inactive: "bg-slate-100/10 border-slate-400/30 text-slate-400 hover:text-purple-500 hover:border-purple-500/40 hover:bg-purple-500/5"
                        },
                        cyan: {
                            active: "bg-cyan-500/10 border-cyan-500/50 text-cyan-500",
                            inactive: "bg-slate-100/10 border-slate-400/30 text-slate-400 hover:text-cyan-500 hover:border-cyan-500/40 hover:bg-cyan-500/5"
                        }
                    };
                    
                    return (
                        <button
                            key={btn.id}
                            onClick={() => router.push(btn.path)}
                            className={cn(
                                "w-10 h-10 rounded-full border flex items-center justify-center transition-all active:scale-95",
                                isActive ? colorClasses[color].active : colorClasses[color].inactive
                            )}
                            title={btn.label}
                        >
                            <Icon size={16} />
                        </button>
                    );
                })}

            </div>
            </div>
        </>
    );
}
