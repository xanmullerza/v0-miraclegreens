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
        <div className="md:hidden absolute bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-4 transition-all duration-500 animate-in slide-in-from-bottom-8">
            <div className="pointer-events-auto max-w-[340px] w-full bg-white/80 dark:bg-slate-900/90 backdrop-blur-3xl px-2 py-2 flex items-center justify-between rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.7)] ring-1 ring-black/5 dark:ring-emerald-500/10">
                {/* Recipes Button */}
                <button
                    onClick={() => {
                        setIsActionPanelOpen(false);
                        router.push('/cookbook');
                    }}
                    className={cn(
                        "flex flex-col items-center justify-center p-2 rounded-2xl transition-all active:scale-90 group flex-1",
                        pathname === '/cookbook' ? "text-emerald-500" : "text-slate-400 hover:text-emerald-500"
                    )}
                    title="Recipes"
                >
                    <BookOpen size={20} className={cn("transition-transform group-hover:scale-110", pathname === '/cookbook' && "animate-pulse")} />
                    <span className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-60">Recipes</span>
                </button>

                {/* Library Button */}
                <button
                    onClick={() => {
                        setIsActionPanelOpen(false);
                        router.push('/library');
                    }}
                    className={cn(
                        "flex-1 flex-col items-center justify-center p-2 rounded-2xl transition-all active:scale-90 group",
                        pathname.startsWith('/library') ? "text-cyan-500" : "text-slate-400 hover:text-cyan-500"
                    )}
                    title="Library"
                >
                    <Leaf size={20} className={cn("transition-transform group-hover:scale-110", pathname.startsWith('/library') && "animate-pulse")} />
                    <span className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-60">Library</span>
                </button>

                {/* Home / Close Button - Center */}
                <button
                    onClick={() => {
                        if (activeView === 'home') {
                            onClose();
                        } else {
                            navigateTo('home');
                        }
                    }}
                    className={cn(
                        "flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 group mx-1",
                        activeView === 'home' ? "text-emerald-500" : "text-slate-400"
                    )}
                    title="Home"
                >
                    <div className={cn(
                        "w-12 h-12 flex items-center justify-center rounded-2xl transition-all shadow-sm",
                        activeView === 'home' ? "bg-emerald-600 text-white shadow-emerald-500/40" : "bg-slate-100 dark:bg-slate-800"
                    )}>
                        {activeView === 'home' ? (
                            <Sparkles size={22} className="animate-pulse" />
                        ) : (
                            <Home size={22} className="group-hover:scale-110 transition-transform" />
                        )}
                    </div>
                    <span className={cn(
                        "text-[8px] font-black uppercase tracking-widest scale-[0.9] mt-1 opacity-60",
                        activeView === 'home' && "text-emerald-500 opacity-100"
                    )}>
                        {activeView === 'home' ? 'Close' : 'Home'}
                    </span>
                </button>

                {/* Tracker Button */}
                <button
                    onClick={() => {
                        setIsActionPanelOpen(false);
                        router.push('/tracker');
                    }}
                    className={cn(
                        "flex-1 flex flex-col items-center justify-center p-2 rounded-2xl transition-all active:scale-90 group",
                        pathname === '/tracker' ? "text-blue-500" : "text-slate-400 hover:text-blue-500"
                    )}
                    title="Tracker"
                >
                    <BarChart3 size={20} className={cn("transition-transform group-hover:scale-110", pathname === '/tracker' && "animate-pulse")} />
                    <span className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-60">Tracker</span>
                </button>
            </div>
        </div>
    );
}
