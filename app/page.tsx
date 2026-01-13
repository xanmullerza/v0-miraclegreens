import { Header } from '@/components/header';
import { Hero } from '@/components/hero';
import { WhyMoringa } from '@/components/why-moringa';
import { MoringaMalnutrition } from '@/components/moringa-malnutrition';
import { Footer } from '@/components/footer';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <MoringaMalnutrition />
      <WhyMoringa />
      {/* Testimonials temporarily removed from homepage */}
      <Footer />
    </main>
  );
}
