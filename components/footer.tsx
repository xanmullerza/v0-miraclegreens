import Link from 'next/link';

export function Footer() {
  return (
    <footer id="contact" className="bg-[#4A3728] text-[#E8E8E8] py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm opacity-90 text-center md:text-left">
            © {new Date().getFullYear()} Miracle Greens. A social enterprise for nutrition.
          </p>
          <div className="flex gap-6">
            <Link
              href="#"
              className="text-sm opacity-90 hover:opacity-100 transition-opacity"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              className="text-sm opacity-90 hover:opacity-100 transition-opacity"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
