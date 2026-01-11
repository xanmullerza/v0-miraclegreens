import { Header } from '@/components/header';
import { WhyMoringa } from '@/components/why-moringa';
import { FeaturedProducts } from '@/components/featured-products';
import { Testimonials } from '@/components/testimonials';
import { Newsletter } from '@/components/newsletter';
import { Footer } from '@/components/footer';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <WhyMoringa />
      {/* Shop moved to /shop */}
      <FeaturedProducts />
      <Testimonials />
      <Newsletter />
      <Footer />
    </main>
  );
}
