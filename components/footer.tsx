import Link from 'next/link';
import { Mail, MapPin, Instagram, Facebook, Twitter, Leaf } from 'lucide-react';

export function Footer() {
  return (
    <footer id="contact" className="bg-[#4A3728] text-[#E8E8E8] pt-16 pb-8 border-t border-[#5D4636]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-6 group">
              <Leaf className="h-6 w-6 text-emerald-400 transition-transform group-hover:rotate-12" />
              <span className="font-serif text-2xl font-bold tracking-tight text-white">Miracle Greens</span>
            </Link>
            <p className="text-sm opacity-80 leading-relaxed mb-8 max-w-xs">
              Empowering communities through the nutritional power of Moringa. Growing hope and health, one tree at a time.
            </p>
            <div className="flex gap-5">
              <a href="#" className="p-2 rounded-full bg-[#5D4636] hover:bg-emerald-500/20 hover:text-emerald-400 transition-all duration-300">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 rounded-full bg-[#5D4636] hover:bg-emerald-500/20 hover:text-emerald-400 transition-all duration-300">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 rounded-full bg-[#5D4636] hover:bg-emerald-500/20 hover:text-emerald-400 transition-all duration-300">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold text-white mb-6 uppercase tracking-wider text-xs">Organization</h3>
            <ul className="space-y-4 text-sm opacity-80">
              <li><Link href="/#story" className="hover:text-emerald-400 transition-colors block">Our Story</Link></li>
              <li><Link href="/vision" className="hover:text-emerald-400 transition-colors block">Our Vision</Link></li>
              <li><Link href="/#how-it-works" className="hover:text-emerald-400 transition-colors block">How It Works</Link></li>
              <li><Link href="/donate" className="hover:text-emerald-400 transition-colors block">Support Us</Link></li>
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="font-semibold text-white mb-6 uppercase tracking-wider text-xs">Resources</h3>
            <ul className="space-y-4 text-sm opacity-80">
              <li><Link href="/browse" className="hover:text-emerald-400 transition-colors block">Learning Library</Link></li>
              <li><Link href="/dashboard" className="hover:text-emerald-400 transition-colors block">Nutrient Dashboard</Link></li>
              <li><Link href="/dashboard/recipes" className="hover:text-emerald-400 transition-colors block">Recipe Builder</Link></li>
              <li><Link href="/dashboard/plan" className="hover:text-emerald-400 transition-colors block">Meal Planning</Link></li>
            </ul>
          </div>

          {/* Contact Section */}
          <div>
            <h3 className="font-semibold text-white mb-6 uppercase tracking-wider text-xs">Get in Touch</h3>
            <ul className="space-y-4 text-sm opacity-80">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 shrink-0 text-emerald-400" />
                <span>Limpopo & Gauteng,<br />South Africa</span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="h-5 w-5 shrink-0 text-emerald-400" />
                <a href="mailto:info@miraclegreens.org.za" className="hover:text-emerald-400 transition-colors">info@miraclegreens.org.za</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#5D4636] flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs opacity-50 text-center md:text-left">
            © {new Date().getFullYear()} Miracle Greens. All rights reserved. A registered PBO in South Africa.
          </p>
          <div className="flex gap-8 text-xs opacity-50">
            <Link href="#" className="hover:opacity-100 hover:text-white transition-all">Privacy Policy</Link>
            <Link href="#" className="hover:opacity-100 hover:text-white transition-all">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
