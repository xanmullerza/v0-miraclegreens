import { Header } from '@/components/header';
import { HowItWorks } from '@/components/how-it-works';
import { Hero } from '@/components/hero';
import { ShopSection } from '@/components/shop-section';
import { Footer } from '@/components/footer';

export const metadata = {
  title: 'Shop - Miracle Greens',
  description: 'Buy moringa saplings, capsules, and more from Miracle Greens.',
};

export default function ShopPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <HowItWorks />
      <Hero />
      <ShopSection />
      <Footer />
    </main>
  );
}