import { Home, BookOpen, BarChart3, Wand2, Sparkles, Leaf } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

import { useActionPanel, ActionPanelView } from '@/lib/context/action-panel-context';

interface ActionPanelBottomNavProps {
    activeView: ActionPanelView;
    onClose: () => void;
}

export function ActionPanelBottomNav({
    activeView,
    onClose
}: ActionPanelBottomNavProps) {
    const { navigateTo, setIsActionPanelOpen } = useActionPanel();
    const router = useRouter();
    const pathname = usePathname();

    return (
        <div className="md:hidden mt-auto border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-2 py-4 flex items-center justify-center pointer-events-auto shrink-0 z-50 gap-1">
            {/* Recipes - Left Side */}
            <button
                onClick={() => navigateTo('view-recipes')}
                className={cn(
                    "flex-1 flex flex-col items-center justify-center p-2 rounded-2xl transition-all active:scale-95 group",
                    activeView === 'view-recipes' ? "text-emerald-500 bg-emerald-500/5" : "text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
                title="Recipes"
            >
                <BookOpen size={20} />
                <span className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-60">Recipes</span>
            </button>

            {/* Library - Center-Left */}
            <button
                onClick={() => {
                    setIsActionPanelOpen(false);
                    router.push('/library');
                }}
                className={cn(
                    "flex-1 flex flex-col items-center justify-center p-2 rounded-2xl transition-all active:scale-95 group",
                    pathname.startsWith('/library') ? "text-cyan-500 bg-cyan-500/5" : "text-slate-400 hover:text-cyan-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
                title="Library"
            >
                <Leaf size={20} />
                <span className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-60">Library</span>
            </button>

            {/* Home - Center */}
            <button
                onClick={() => navigateTo('home')}
                className={cn(
                    "flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 group mx-4",
                    activeView === 'home' ? "text-emerald-500" : "text-slate-400"
                )}
                title="Home"
            >
                <div className={cn(
                    "w-12 h-12 flex items-center justify-center rounded-2xl transition-all",
                    activeView === 'home' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30" : "bg-slate-100 dark:bg-slate-800"
                )}>
                    <Home size={24} className={cn("transition-transform group-hover:scale-110", activeView === 'home' && "animate-pulse")} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest scale-[0.7] origin-top opacity-60 mt-1">Home</span>
            </button>

            {/* Tracker - Right Side */}
            <button
                onClick={() => navigateTo('shopping')}
                className={cn(
                    "flex-1 flex flex-col items-center justify-center p-2 rounded-2xl transition-all active:scale-95 group",
                    activeView === 'shopping' ? "text-amber-500 bg-amber-500/5" : "text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
                title="Tracker"
            >
                <BarChart3 size={20} />
                <span className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-60">Tracker</span>
            </button>
        </div>
    );
}
