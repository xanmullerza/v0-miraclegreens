'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Footer() {
  const pathname = usePathname();

  // Hide footer on foods page, library/widgets page and individual widget pages
  if (pathname === '/dashboard/library/foods' || pathname === '/dashboard/library/widgets' || pathname === '/dashboard/widgets/comparator' || pathname === '/dashboard/widgets/nutridex' || pathname === '/dashboard/widgets/lifeguard' || pathname.startsWith('/dashboard/widgets/nutridex/')) {
    return null;
  }

  // Global copyright and legal info footer
  return (
    <footer id="contact" className="fixed bottom-0 left-0 right-0 z-40 px-2 sm:px-4 flex md:hidden justify-center pointer-events-none animate-in slide-in-from-bottom-4 duration-700">
      <div className="pointer-events-auto w-full max-w-[900px]">
        <div className="py-4 px-6 bg-white dark:bg-slate-900 border-x border-t border-slate-200 dark:border-slate-800 rounded-t-[2rem] shadow-xl backdrop-blur-sm text-center">
          <div className="flex flex-wrap justify-center items-center gap-4 text-[10px] uppercase font-bold tracking-widest opacity-70 dark:opacity-60 text-slate-900 dark:text-slate-100">
            <span>© 2026 Vitala. All rights reserved.</span>
            <span className="w-1 h-1 rounded-full bg-current opacity-30 hidden sm:block"></span>
            <Link href="/privacy" className="hover:text-emerald-500 transition-all">Privacy Policy</Link>
            <span className="w-1 h-1 rounded-full bg-current opacity-30 hidden sm:block"></span>
            <Link href="/terms" className="hover:text-emerald-500 transition-all">Terms of Service</Link>
            <span className="w-1 h-1 rounded-full bg-current opacity-30 hidden sm:block"></span>
            <Link href="/support" className="hover:text-emerald-500 transition-all">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
