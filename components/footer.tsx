'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { useSearch } from '@/lib/context/search-context';
import { cn } from '@/lib/utils';

export function Footer() {
  const pathname = usePathname();
  const { searchQuery, setSearchQuery } = useSearch();
  const isHomepage = pathname === '/dashboard';

  // Hide footer on foods page
  if (pathname === '/dashboard/library/foods') {
    return null;
  }

  if (isHomepage) {
    // Homepage footer with copyright and legal info
    return (
      <footer id="contact" className="fixed bottom-0 left-0 right-0 z-40 px-2 sm:px-4 flex justify-center pointer-events-none animate-in slide-in-from-bottom-4 duration-700">
        <div className="pointer-events-auto w-full max-w-[800px]">
          <div className="py-4 px-6 bg-white dark:bg-slate-900 border-x border-t border-slate-200 dark:border-slate-800 rounded-t-[2rem] shadow-xl backdrop-blur-sm text-center">
            <div className="flex flex-wrap justify-center items-center gap-4 text-[10px] uppercase font-bold tracking-widest opacity-70 dark:opacity-60 text-slate-900 dark:text-slate-100">
              <span>© 2026 Vitala. All rights reserved.</span>
              <span className="w-1 h-1 rounded-full bg-current opacity-30 hidden sm:block"></span>
              <Link href="#" className="hover:text-emerald-500 transition-all">Privacy Policy</Link>
              <span className="w-1 h-1 rounded-full bg-current opacity-30 hidden sm:block"></span>
              <Link href="#" className="hover:text-emerald-500 transition-all">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  // Search footer for all other pages
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 px-2 sm:px-4 flex justify-center pointer-events-none animate-in slide-in-from-bottom-4 duration-700">
      <div className="pointer-events-auto w-full max-w-[800px]">
        <div className="p-3 md:p-4 bg-white dark:bg-slate-900 border-x border-t border-slate-200 dark:border-slate-800 rounded-t-[2rem] shadow-xl flex items-center gap-3">
          <div className="flex-1 relative flex items-center">
            <div className="absolute left-5 transition-colors text-slate-300 dark:text-slate-700">
              <Search size={16} className="md:w-5 md:h-5" />
            </div>
            <input
              placeholder="SEARCH LIBRARIES..."
              className={cn(
                "w-full bg-slate-50 dark:bg-slate-800/50 border-2 transition-all shadow-sm text-[10px] md:text-sm font-black uppercase tracking-widest h-11 md:h-12 rounded-[1.5rem] pl-12 pr-6 text-slate-900 dark:text-white placeholder:text-slate-300",
                "border-slate-100 dark:border-slate-800 hover:border-emerald-500/20 focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/10 focus:bg-white dark:focus:bg-slate-800/80"
              )}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setSearchQuery('');
              }}
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="w-11 h-11 md:w-12 md:h-12 flex-shrink-0 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 flex items-center justify-center transition-all active:scale-95 group/cancel shadow-sm"
              title="Clear Search"
            >
              <X size={18} className="md:w-6 md:h-6 group-hover/cancel:rotate-90 transition-transform duration-300" />
            </button>
          )}
        </div>
      </div>
    </footer>
  );
}
