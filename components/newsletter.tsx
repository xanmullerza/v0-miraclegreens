import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShoppingBag, TreeDeciduous, LayoutGrid } from 'lucide-react';

export function Newsletter() {
  return (
    <section className="py-16 md:py-24 bg-primary">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-primary-foreground mb-8">
            How you can help
          </h2>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="secondary" size="lg" className="gap-2" asChild>
              <Link href="/browse">
                <LayoutGrid className="h-4 w-4" />
                Browse
              </Link>
            </Button>

            <Button variant="secondary" size="lg" className="gap-2" asChild>
              <Link href="/shop">
                <ShoppingBag className="h-4 w-4" />
                Buy
              </Link>
            </Button>

            <Button variant="secondary" size="lg" className="gap-2" asChild>
              <Link href="/donate">
                <TreeDeciduous className="h-4 w-4" />
                Donate
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
