import { Header } from '@/components/header';
import { WhyMoringa } from '@/components/why-moringa';
import { HowItWorks } from '@/components/how-it-works';
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
      <HowItWorks />
      <ShopSection />
      <Categories />
      <FeaturedProducts />
      {/* Benefits section moved to /vision */}
      <Testimonials />
      <Newsletter />
      <Footer />
    </main>
  );
}
