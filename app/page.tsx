import { Header } from '@/components/header';
import { WhyMoringa } from '@/components/why-moringa';
import { MoringaNutrition } from '@/components/moringa-nutrition';
import { MoringaMalnutrition } from '@/components/moringa-malnutrition';
import { Footer } from '@/components/footer';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <MoringaMalnutrition />
      <WhyMoringa />
      <MoringaNutrition />
      {/* Testimonials temporarily removed from homepage */}
      <Footer />
    </main>
  );
}
