import { Header } from '@/components/header';
import { WhyMoringa } from '@/components/why-moringa';
import { MoringaHistory } from '@/components/moringa-history';
import { MoringaNutrition } from '@/components/moringa-nutrition';
import { MoringaMalnutrition } from '@/components/moringa-malnutrition';
import { Newsletter } from '@/components/newsletter';
import { Footer } from '@/components/footer';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <WhyMoringa />
      <MoringaHistory />
      <MoringaNutrition />
      <MoringaMalnutrition />
      {/* Testimonials temporarily removed from homepage */}
      <Newsletter />
      <Footer />
    </main>
  );
}
