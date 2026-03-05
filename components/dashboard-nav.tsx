'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Home, Apple, Calendar, ShoppingBasket, Shapes, Salad, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DashboardNav() {
    const router = useRouter();
    const pathname = usePathname();

    // Determine active button
    const getActiveButton = () => {
        if (pathname.includes('/browse')) return 'home';
        if (pathname.includes('/dashboard/library/foods')) return 'foods';
        if (pathname.includes('/dashboard/library/meals')) return 'meals';
        if (pathname.includes('/dashboard/library/widgets')) return 'widgets';
        if (pathname.includes('/dashboard/meal-o-matic/shopping')) return 'shopping';
        if (pathname.includes('/dashboard/meal-o-matic/pantry')) return 'pantry';
        if (pathname.includes('/dashboard/meal-o-matic/planner')) return 'planner';
        return null;
    };

    const activeButton = getActiveButton();

    const buttons = [
        { id: 'home', icon: Home, label: 'Home', path: '/browse', color: 'indigo' },
        { id: 'foods', icon: Apple, label: 'Foods', path: '/dashboard/library/foods', color: 'emerald' },
        { id: 'meals', icon: Salad, label: 'Meals', path: '/dashboard/library/meals', color: 'rose' },
        { id: 'shopping', icon: ShoppingBasket, label: 'Shopping', path: '/dashboard/meal-o-matic/shopping', color: 'amber' },
        { id: 'pantry', icon: Shapes, label: 'Pantry', path: '/dashboard/meal-o-matic/pantry', color: 'sky' },
        { id: 'planner', icon: Calendar, label: 'Planner', path: '/dashboard/meal-o-matic/planner', color: 'purple' },
        { id: 'widgets', icon: LayoutGrid, label: 'Widgets', path: '/dashboard/library/widgets', color: 'cyan' },
    ];

    return (
        <div className="sticky top-0 z-50 w-full bg-slate-950/95 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-2 px-4 py-4">
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
    );
}
