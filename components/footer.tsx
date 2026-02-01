import Link from 'next/link';
import { Mail, MapPin, Instagram, Facebook, Twitter, Leaf } from 'lucide-react';

export function Footer() {
  return (
    <footer id="contact" className="bg-[#4A3728] text-[#E8E8E8] py-12 border-t border-[#5D4636]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-xs opacity-50 mb-4">
          © 2026 Vitala. All rights reserved. Professional Nutrition Intelligence.
        </p>
        <div className="flex justify-center gap-8 text-xs opacity-50">
          <Link href="#" className="hover:opacity-100 hover:text-white transition-all">Privacy Policy</Link>
          <Link href="#" className="hover:opacity-100 hover:text-white transition-all">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
