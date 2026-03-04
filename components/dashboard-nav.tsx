'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Book, Apple, Calendar, ShoppingBasket, Shell, CookingPot, LayoutGrid, Salad } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DashboardNav() {
    const router = useRouter();
    const pathname = usePathname();

    // Determine if we're in Library or Mealomatic section
    const isLibrary = pathname.includes('/dashboard/library') || pathname.includes('/dashboard/widgets');
    const isMealomatic = pathname.includes('/dashboard/meal-o-matic');

    // Determine which center button should be highlighted
    const getLibraryActive = () => {
        if (pathname.includes('/dashboard/library/foods')) return 'foods';
        if (pathname.includes('/dashboard/library/meals')) return 'meals';
        if (pathname.includes('/dashboard/library/widgets')) return 'widgets';
        return null;
    };

    const getMealomaticActive = () => {
        if (pathname.includes('/dashboard/meal-o-matic/shopping')) return 'shopping';
        if (pathname.includes('/dashboard/meal-o-matic/pantry')) return 'pantry';
        if (pathname.includes('/dashboard/meal-o-matic/planner')) return 'planner';
        return 'planner'; // default
    };

    const libraryActive = getLibraryActive();
    const mealomaticActive = getMealomaticActive();

    return (
        <div className="sticky top-0 z-50 w-full bg-slate-950/95 backdrop-blur-sm border-b border-slate-800">
            <div className="flex items-center justify-center gap-8 px-4 py-6">
                {/* Left big button: Library */}
                <button
                    onClick={() => router.push('/dashboard/library/foods')}
                    className={cn(
                        "w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all active:scale-95",
                        isLibrary
                            ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-500"
                            : "bg-slate-100/10 dark:bg-slate-800 border-slate-400/30 text-slate-400 hover:text-emerald-500 hover:border-emerald-500/50 hover:bg-emerald-500/10"
                    )}
                    title="Library"
                >
                    <Book size={24} />
                </button>

                {/* Center buttons - Library section */}
                {isLibrary && (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push('/dashboard/library/foods')}
                            className={cn(
                                "w-10 h-10 rounded-full border flex items-center justify-center transition-all active:scale-95",
                                libraryActive === 'foods'
                                    ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-500"
                                    : "bg-slate-100/10 border-slate-400/30 text-slate-400 hover:text-emerald-500 hover:border-emerald-500/40 hover:bg-emerald-500/5"
                            )}
                            title="Foods"
                        >
                            <Apple size={16} />
                        </button>
                        <button
                            onClick={() => router.push('/dashboard/library/meals')}
                            className={cn(
                                "w-10 h-10 rounded-full border flex items-center justify-center transition-all active:scale-95",
                                libraryActive === 'meals'
                                    ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-500"
                                    : "bg-slate-100/10 border-slate-400/30 text-slate-400 hover:text-emerald-500 hover:border-emerald-500/40 hover:bg-emerald-500/5"
                            )}
                            title="Meals"
                        >
                            <CookingPot size={16} />
                        </button>
                        <button
                            onClick={() => router.push('/dashboard/library/widgets')}
                            className={cn(
                                "w-10 h-10 rounded-full border flex items-center justify-center transition-all active:scale-95",
                                libraryActive === 'widgets'
                                    ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-500"
                                    : "bg-slate-100/10 border-slate-400/30 text-slate-400 hover:text-emerald-500 hover:border-emerald-500/40 hover:bg-emerald-500/5"
                            )}
                            title="Widgets"
                        >
                            <LayoutGrid size={16} />
                        </button>
                    </div>
                )}

                {/* Center buttons - Mealomatic section */}
                {isMealomatic && (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push('/dashboard/meal-o-matic/shopping')}
                            className={cn(
                                "w-10 h-10 rounded-full border flex items-center justify-center transition-all active:scale-95",
                                mealomaticActive === 'shopping'
                                    ? "bg-amber-500/10 border-amber-500/50 text-amber-500"
                                    : "bg-slate-100/10 border-slate-400/30 text-slate-400 hover:text-amber-500 hover:border-amber-500/40 hover:bg-amber-500/5"
                            )}
                            title="Shopping"
                        >
                            <ShoppingBasket size={16} />
                        </button>
                        <button
                            onClick={() => router.push('/dashboard/meal-o-matic/pantry')}
                            className={cn(
                                "w-10 h-10 rounded-full border flex items-center justify-center transition-all active:scale-95",
                                mealomaticActive === 'pantry'
                                    ? "bg-amber-500/10 border-amber-500/50 text-amber-500"
                                    : "bg-slate-100/10 border-slate-400/30 text-slate-400 hover:text-amber-500 hover:border-amber-500/40 hover:bg-amber-500/5"
                            )}
                            title="Pantry"
                        >
                            <Shell size={16} />
                        </button>
                        <button
                            onClick={() => router.push('/dashboard/meal-o-matic/planner')}
                            className={cn(
                                "w-10 h-10 rounded-full border flex items-center justify-center transition-all active:scale-95",
                                mealomaticActive === 'planner'
                                    ? "bg-amber-500/10 border-amber-500/50 text-amber-500"
                                    : "bg-slate-100/10 border-slate-400/30 text-slate-400 hover:text-amber-500 hover:border-amber-500/40 hover:bg-amber-500/5"
                            )}
                            title="Planner"
                        >
                            <Calendar size={16} />
                        </button>
                    </div>
                )}

                {/* Right big button: Mealomatic */}
                <button
                    onClick={() => router.push('/dashboard/meal-o-matic/planner')}
                    className={cn(
                        "w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all active:scale-95",
                        isMealomatic
                            ? "bg-amber-500/10 border-amber-500/50 text-amber-500"
                            : "bg-slate-100/10 dark:bg-slate-800 border-slate-400/30 text-slate-400 hover:text-amber-500 hover:border-amber-500/50 hover:bg-amber-500/10"
                    )}
                    title="Mealomatic"
                >
                    <Salad size={24} />
                </button>
            </div>
        </div>
    );
}
