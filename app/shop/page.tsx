import { Header } from '@/components/header';
import { HowItWorks } from '@/components/how-it-works';
import { ShopSection } from '@/components/shop-section';
import { Footer } from '@/components/footer';

export const metadata = {
  title: 'Shop - Vitala',
  description: 'Bio-optimized nutritional supplements and resources from Vitala.',
};

export default function ShopPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <ShopSection />
      <HowItWorks />
      <Footer />
    </main>
  );
}