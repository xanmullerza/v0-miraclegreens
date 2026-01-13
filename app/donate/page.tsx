import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Categories } from '@/components/categories';
import { FeaturedProducts } from '@/components/featured-products';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Heart, Sun, Gift } from 'lucide-react';

export const metadata = {
  title: 'Donate - Miracle Greens',
  description: 'Support our mission: donate to sponsor moringa distribution and community programs.',
};

const tiers = [
  { name: 'R50', amount: 50, icon: Heart },
  { name: 'R100', amount: 100, icon: Sun },
  { name: 'R200', amount: 200, icon: Gift },
];

export default function DonatePage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Categories />
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold mb-4">Donate</h1>
          <p className="text-muted-foreground mb-8">
            Browsing the site and applying what you learn is really great. Buying our powder, capsules or
            seedlings really keeps us going. For those that are able to, kindly
            consider making a donation to help us grow even more.
          </p>

          <div className="grid sm:grid-cols-3 gap-6 mb-8">
            {tiers.map((tier) => (
              <div key={tier.name} className="bg-card p-6 rounded-xl border border-border flex flex-col items-center text-center">
                <h3 className="text-xl font-semibold mb-4">{tier.name}</h3>
                <div className="mb-6 rounded-full bg-primary/10 p-4">
                  <tier.icon className="h-8 w-8 text-primary" />
                </div>
                <Link href={`/api/donate?amount=${tier.amount}`}>
                  <Button className="w-full">Donate {tier.name}</Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
      <FeaturedProducts />
      <Footer />
    </main>
  );
}