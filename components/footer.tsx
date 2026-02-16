import Link from 'next/link';
import { Mail, MapPin, Instagram, Facebook, Twitter, Leaf } from 'lucide-react';

export function Footer() {
  return (
    <footer id="contact" className="fixed bottom-0 left-0 w-full z-40 bg-[#4A3728]/95 text-[#E8E8E8] py-6 border-t border-[#5D4636] backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="flex flex-wrap justify-center items-center gap-4 text-[10px] uppercase font-bold tracking-widest opacity-80">
          <span>© 2026 Vitala. All rights reserved. Professional Nutrition Intelligence.</span>
          <span className="w-1 h-1 rounded-full bg-current opacity-50 hidden sm:block"></span>
          <Link href="#" className="hover:opacity-100 hover:text-white transition-all">Privacy Policy</Link>
          <span className="w-1 h-1 rounded-full bg-current opacity-50 hidden sm:block"></span>
          <Link href="#" className="hover:opacity-100 hover:text-white transition-all">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
