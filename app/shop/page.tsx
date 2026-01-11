import { Header } from '@/components/header';
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
      <ShopSection />
      <Footer />
    </main>
  );
}