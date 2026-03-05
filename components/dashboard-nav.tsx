'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Apple, Calendar, ShoppingBasket, Shapes, CookingPot, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DashboardNav() {
    const router = useRouter();
    const pathname = usePathname();

    // Determine active button
    const getActiveButton = () => {
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
        { id: 'foods', icon: Apple, label: 'Foods', path: '/dashboard/library/foods', theme: 'emerald' },
        { id: 'meals', icon: CookingPot, label: 'Meals', path: '/dashboard/library/meals', theme: 'emerald' },
        { id: 'shopping', icon: ShoppingBasket, label: 'Shopping', path: '/dashboard/meal-o-matic/shopping', theme: 'amber' },
        { id: 'pantry', icon: Shapes, label: 'Pantry', path: '/dashboard/meal-o-matic/pantry', theme: 'amber' },
        { id: 'planner', icon: Calendar, label: 'Planner', path: '/dashboard/meal-o-matic/planner', theme: 'amber' },
        { id: 'widgets', icon: LayoutGrid, label: 'Widgets', path: '/dashboard/library/widgets', theme: 'emerald' },
    ];

    return (
        <div className="sticky top-0 z-50 w-full bg-slate-950/95 backdrop-blur-sm border-b border-slate-800">
            <div className="flex items-center justify-center gap-2 px-4 py-4">
                {buttons.map((btn) => {
                    const Icon = btn.icon;
                    const isActive = activeButton === btn.id;
                    
                    return (
                        <button
                            key={btn.id}
                            onClick={() => router.push(btn.path)}
                            className={cn(
                                "w-10 h-10 rounded-full border flex items-center justify-center transition-all active:scale-95",
                                isActive && btn.theme === 'emerald' && "bg-emerald-500/10 border-emerald-500/50 text-emerald-500",
                                isActive && btn.theme === 'amber' && "bg-amber-500/10 border-amber-500/50 text-amber-500",
                                !isActive && btn.theme === 'emerald' && "bg-slate-100/10 border-slate-400/30 text-slate-400 hover:text-emerald-500 hover:border-emerald-500/40 hover:bg-emerald-500/5",
                                !isActive && btn.theme === 'amber' && "bg-slate-100/10 border-slate-400/30 text-slate-400 hover:text-amber-500 hover:border-amber-500/40 hover:bg-amber-500/5"
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
