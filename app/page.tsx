import { Header } from '@/components/header';
import { WhyMoringa } from '@/components/why-moringa';
import { Categories } from '@/components/categories';
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
      <Categories />
      <FeaturedProducts />
      <Testimonials />
      <Newsletter />
      <Footer />
    </main>
  );
}
