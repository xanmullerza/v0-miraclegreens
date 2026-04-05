'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Home, BookOpen, BarChart3, Wand2, Smartphone, TabletSmartphone, Monitor as Computer, Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActionPanel } from '@/lib/context/action-panel-context';
import { useSplitView } from '@/lib/context/split-view-context';

export function Footer() {
  const router = useRouter();
  const pathname = usePathname();
  const { isActionPanelOpen, setIsActionPanelOpen, setActiveView } = useActionPanel();
  const { resizeMode, toggleResize, setResizeMode } = useSplitView();


  const isHome = pathname === '/dashboard' || pathname === '/';

  // Mobile bottom navigation bar - Standardized 4-button floating bar
  return (
    <footer id="contact" className="fixed bottom-6 left-0 right-0 z-[100] sm:bottom-8 lg:hidden flex justify-center pointer-events-none px-4">
      <div className="pointer-events-auto max-w-sm w-full">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl px-2 py-2 flex items-center justify-between rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)] ring-1 ring-black/5 dark:ring-white/5">
          
          {/* Recipes Button */}
          <button
            onClick={() => {
              setIsActionPanelOpen(false);
              router.push('/cookbook');
            }}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-2xl transition-all active:scale-95 group flex-1",
              pathname === '/cookbook' ? "text-emerald-500 bg-emerald-500/5" : "text-slate-400 hover:text-emerald-500"
            )}
            title="Cookbook"
          >
            <BookOpen size={20} />
            <span className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-60">Recipes</span>
          </button>

          {/* Library Button */}
          <button
            onClick={() => {
              setIsActionPanelOpen(false);
              router.push('/library');
            }}
            className={cn(
              "flex-1 flex flex-col items-center justify-center p-2 rounded-2xl transition-all active:scale-95 group",
              pathname.startsWith('/library') ? "text-cyan-500 bg-cyan-500/5" : "text-slate-400 hover:text-cyan-500"
            )}
            title="Library"
          >
            <Leaf size={20} />
            <span className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-60">Library</span>
          </button>

          {/* Home / Action Button - Center */}
          <button
            onClick={() => {
              setIsActionPanelOpen(!isActionPanelOpen);
              if (!isActionPanelOpen) setActiveView('home');
            }}
            className={cn(
              "flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 group mx-1",
              isActionPanelOpen ? "text-emerald-500" : "text-slate-400"
            )}
            title="Home"
          >
            <div className={cn(
              "w-12 h-12 flex items-center justify-center rounded-2xl transition-all shadow-sm",
              isActionPanelOpen ? "bg-emerald-600 text-white shadow-emerald-500/40" : "bg-slate-100 dark:bg-slate-800"
            )}>
              <Home size={22} className={cn("transition-transform group-hover:scale-110", isActionPanelOpen && "animate-pulse")} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest scale-[0.9] mt-1 opacity-60">
              {isActionPanelOpen ? 'Close' : 'Home'}
            </span>
          </button>

          {/* Tracker Button */}
          <button
            onClick={() => {
              setIsActionPanelOpen(false);
              router.push('/tracker');
            }}
            className={cn(
              "flex-1 flex flex-col items-center justify-center p-2 rounded-2xl transition-all active:scale-95 group",
              pathname === '/tracker' ? "text-blue-500 bg-blue-500/5" : "text-slate-400 hover:text-blue-500"
            )}
            title="Tracker"
          >
            <BarChart3 size={20} />
            <span className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-60">Tracker</span>
          </button>

          {/* Assistant / Action Toggle Placeholder if needed, but 4 is enough */}
        </div>
      </div>
    </footer>

  );
}
