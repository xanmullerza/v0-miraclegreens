import { redirect } from 'next/navigation';
import { Header } from '@/components/header';
import { Hero } from '@/components/hero';
import { NutritionImpact } from '@/components/nutrition-impact';
import { WhyVitala } from '@/components/why-vitala';
import { Footer } from '@/components/footer';

export default function Home() {
  redirect('/dashboard');

  // Original Landing Page Content (Preserved)
  /*
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <NutritionImpact />
      <WhyVitala />
      <Footer />
    </main>
  );
  */
}
