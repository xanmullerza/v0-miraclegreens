import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Benefits } from '@/components/benefits';

export const metadata = {
  title: 'Our Vision - Miracle Greens',
  description: 'Why growing our own moringa trees changes everything for our mission.',
};

export default function VisionPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="py-8 md:py-12"> {/* reduced vertical padding */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6"> {/* tighter bottom margin */}
             <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
               Our Vision
             </p>
             <h1 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-4">
               Why Growing Our Own Changes Everything
             </h1>
             <p className="text-muted-foreground max-w-2xl mx-auto">
               By establishing our own moringa farm and processing facility, we can dramatically
               increase our impact while reducing costs and ensuring the highest quality for those
               we serve.
             </p>
           </div>
         </div>
       </section>

      {/* Reuse the canonical Benefits component here to avoid duplicate messaging */}
      <div className="mt-0"> {/* ensure no extra top gap */}
        <Benefits />
      </div>
      <Footer />
    </main>
  );
}