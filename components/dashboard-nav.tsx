'use client';

import { useRouter } from 'next/navigation';
import { Leaf, Calendar } from 'lucide-react';

export function DashboardNav() {
    const router = useRouter();

    return (
        <div className="sticky top-0 z-50 w-full bg-slate-950/95 backdrop-blur-sm border-b border-slate-800">
            <div className="flex items-center justify-center gap-8 px-4 py-6">
                {/* Left big button: Library */}
                <button
                    onClick={() => router.push('/dashboard/library/foods')}
                    className="w-14 h-14 rounded-full bg-slate-100/10 dark:bg-slate-800 border-2 border-slate-400/30 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all active:scale-95"
                    title="Library"
                >
                    <Leaf size={24} />
                </button>

                {/* Right big button: Mealomatic */}
                <button
                    onClick={() => router.push('/dashboard/meal-o-matic/planner')}
                    className="w-14 h-14 rounded-full bg-slate-100/10 dark:bg-slate-800 border-2 border-slate-400/30 flex items-center justify-center text-slate-400 hover:text-amber-500 hover:border-amber-500/50 hover:bg-amber-500/10 transition-all active:scale-95"
                    title="Mealomatic"
                >
                    <Calendar size={24} />
                </button>
            </div>
        </div>
    );
}
