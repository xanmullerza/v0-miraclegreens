import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export const metadata = {
  title: 'Our Vision - Miracle Greens',
  description: 'Why growing our own moringa trees changes everything for our mission.',
};

export default function VisionPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
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

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Lower Costs',
                desc: 'Eliminate sourcing markups and reduce per-capsule cost by up to 60%',
              },
              {
                title: 'Quality Control',
                desc: 'Oversee every step from seed to capsule for maximum nutritional value',
              },
              {
                title: 'Sustainability',
                desc: 'Build a self-sustaining operation that grows with community needs',
              },
              {
                title: 'Local Jobs',
                desc: 'Create employment opportunities in the communities we serve',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-card rounded-2xl p-6 border border-border text-center"
              >
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}