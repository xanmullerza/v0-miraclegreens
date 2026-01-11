import { Header } from '@/components/header';
import { WhyMoringa } from '@/components/why-moringa';
import { Testimonials } from '@/components/testimonials';
import { Newsletter } from '@/components/newsletter';
import { Footer } from '@/components/footer';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <WhyMoringa />
      {/* FeaturedProducts removed from homepage (now on /donate /shop) */}
      <Testimonials />
      <Newsletter />
      <Footer />
    </main>
  );
}
