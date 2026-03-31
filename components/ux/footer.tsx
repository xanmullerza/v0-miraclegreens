'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Home, Grid2x2, MessageCircle, Wand2, Smartphone, TabletSmartphone, Monitor as Computer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActionPanel } from '@/lib/context/action-panel-context';
import { useSplitView } from '@/lib/context/split-view-context';

export function Footer() {
  const router = useRouter();
  const pathname = usePathname();
  const { isActionPanelOpen, setIsActionPanelOpen, setActiveView } = useActionPanel();
  const { resizeMode, toggleResize, setResizeMode } = useSplitView();


  const isHome = pathname === '/dashboard' || pathname === '/';

  // Mobile bottom navigation bar
  return (
    <footer id="contact" className="fixed bottom-6 left-0 right-0 z-[100] sm:bottom-8 lg:hidden flex justify-center pointer-events-none px-6">
      <div className="pointer-events-auto max-w-sm w-full">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl px-4 py-2.5 flex items-center justify-between gap-4 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)] ring-1 ring-black/5 dark:ring-white/5">
          {/* Home Button - Navigates to dashboard and closes chatbot */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setIsActionPanelOpen(false);
              router.push('/');
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-1.5 rounded-[2rem] transition-all duration-300 active:scale-95 group flex-1",
              pathname === '/' || pathname === '/dashboard'
                ? "text-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10"
                : "text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
            title="Home"
          >
            <div className={cn(
              "w-11 h-11 flex items-center justify-center rounded-2xl transition-all duration-300",
              (pathname === '/' || pathname === '/dashboard') && !isActionPanelOpen
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                : "bg-transparent text-slate-400 group-hover:text-emerald-500"
            )}>
              <Home size={22} className="group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest scale-[0.7] origin-top opacity-60">Home</span>
          </button>

          {/* Assistant Button - The main entry for all side-panel functionality */}
          <button
            onClick={() => {
              setIsActionPanelOpen(!isActionPanelOpen);
              if (!isActionPanelOpen) setActiveView('desktop-guide');
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-1.5 rounded-[2rem] transition-all duration-300 active:scale-95 group flex-1",
              isActionPanelOpen 
                ? "text-blue-500 bg-blue-50/50 dark:bg-blue-900/10"
                : "text-slate-400 hover:text-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            )}
            title="Assistant"
          >
            <div className={cn(
              "w-11 h-11 flex items-center justify-center rounded-2xl transition-all duration-300 font-bold",
              isActionPanelOpen
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                : "bg-transparent text-slate-400 group-hover:text-blue-500"
            )}>
              <Wand2 size={22} className={cn("transition-transform group-hover:scale-110", isActionPanelOpen ? "rotate-12" : "")} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest scale-[0.7] origin-top opacity-60">
              {isActionPanelOpen ? 'Close' : 'Assistant'}
            </span>
          </button>
        </div>
      </div>
    </footer>

  );
}
