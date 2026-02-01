import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/dashboard');

  // Original Landing Page Content (Preserved)
  /*
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <MoringaMalnutrition />
      <WhyMoringa />
      <Footer />
    </main>
  );
  */
}
