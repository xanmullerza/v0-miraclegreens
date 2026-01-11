import { Header } from '@/components/header';
import { WhyMoringa } from '@/components/why-moringa';
import { ShopSection } from '@/components/shop-section';
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
      <ShopSection />
      <Categories />
      <FeaturedProducts />
      <Testimonials />
      <Newsletter />
      <Footer />
    </main>
  );
}
