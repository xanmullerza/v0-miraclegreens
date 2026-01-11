import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Categories } from '@/components/categories';
import { FeaturedProducts } from '@/components/featured-products';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Donate - Miracle Greens',
  description: 'Support our mission: donate to sponsor moringa distribution and community programs.',
};

const tiers = [
  { name: 'R100', amount: 50, description: 'Provide moringa capsules for a child' },
  { name: 'R200', amount: 150, description: 'Sponsor a sapling and care guide' },
  { name: 'R300', amount: 500, description: 'Community distribution pack' },
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
            Your donation helps us grow moringa initiatives, distribute capsules to families in need,
            and run community programs. Choose an amount below to donate securely through our payment
            processor.
          </p>

          <div className="grid sm:grid-cols-3 gap-6 mb-8">
            {tiers.map((tier) => (
              <div key={tier.name} className="bg-card p-6 rounded-xl border border-border">
                <h3 className="text-xl font-semibold mb-2">{tier.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{tier.description}</p>
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