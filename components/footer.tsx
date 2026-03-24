'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Home, Grid2x2, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatbot } from '@/lib/context/chatbot-context';
import { useSplitView } from '@/lib/context/split-view-context';

export function Footer() {
  const router = useRouter();
  const pathname = usePathname();
  const { setIsChatbotOpen, setChatbotView } = useChatbot();
  const { setResizeMode } = useSplitView();


  const isHome = pathname === '/dashboard' || pathname === '/' || pathname === '/about-us';

  // Mobile bottom navigation bar
  return (
    <footer id="contact" className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden justify-center pointer-events-none">
      <div className="pointer-events-auto w-full">
        <div className="border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between shrink-0">
          {/* Home Button */}
          <button
            onClick={() => {
              setResizeMode('content-focus');
              router.push('/');
            }}
            className={cn(
              "p-3 rounded-2xl transition-all active:scale-90",
              isHome
                ? "text-emerald-500"
                : "text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
            title="Home"
          >
            <Home size={24} />
          </button>

          {/* Grid (Apps/Dashboard) Button - Shows app grid: cookbook, planner, widgets */}
          <button
            onClick={() => {
              setIsChatbotOpen(true);
              setChatbotView('dashboard');
            }}
            className={cn(
              "w-12 h-12 flex items-center justify-center rounded-2xl shadow-lg transition-all active:scale-95 group",
              "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-emerald-500 shadow-xl shadow-black/5"
            )}
            title="Apps Grid"
          >
            <Grid2x2 size={24} className="group-hover:scale-110 transition-transform" />
          </button>

          {/* Chat Button - Opens chatbot conversation */}
          <button
            onClick={() => {
              setIsChatbotOpen(true);
              setChatbotView('messages');
            }}
            className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all active:scale-90 text-slate-400 hover:text-emerald-500"
            title="Chat"
          >
            <MessageCircle size={24} />
          </button>
        </div>
      </div>
    </footer>
  );
}
