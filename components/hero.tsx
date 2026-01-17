import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingBag, Heart, LayoutGrid, Calendar, TreeDeciduous } from 'lucide-react';

const SHOW_SHOP = false;

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="max-w-xl">
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground leading-tight text-balance">
              Nutrition for everyone
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              {SHOW_SHOP ? (
                <>
                  At Miracle Greens, we sell premium moringa saplings, capsules and powder to the public. As a registered non-profit, every purchase funds the
                  production and distribution of moringa powder to families fighting malnutrition.
                  Shop with purpose — your wellness supports their health.
                </>
              ) : (
                <>
                  As a registered non-profit, Miracle Greens is dedicated to the production and distribution of moringa powder to families fighting malnutrition.
                  Your support helps us bring this miracle tree to those who need it most.
                </>
              )}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              {SHOW_SHOP && (
                <Button size="lg" className="h-12 px-8 text-base gap-2" asChild>
                  <a href="/shop">
                    <ShoppingBag className="h-5 w-5" />
                    Shop Now
                  </a>
                </Button>
              )}
              <div className="flex flex-wrap gap-2 sm:gap-4">
                <Button variant="outline" size="lg" className="h-12 px-6 text-base gap-2" asChild>
                  <a href="/browse">
                    <LayoutGrid className="h-5 w-5" />
                    Browse
                  </a>
                </Button>
                <Button variant="outline" size="lg" className="h-12 px-6 text-base gap-2" asChild>
                  <a href="/plan">
                    <Calendar className="h-5 w-5" />
                    Plan
                  </a>
                </Button>
                <Button variant="outline" size="lg" className="h-12 px-6 text-base gap-2" asChild>
                  <a href="/donate">
                    <TreeDeciduous className="h-5 w-5" />
                    Donate
                  </a>
                </Button>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-muted">
              <Image
                src="/child_with_plant.jpg"
                alt="Child with plant"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-card p-4 rounded-xl shadow-lg border border-border">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Every Donation Helps</p>
                  <p className="text-sm text-muted-foreground">
                    Donations fund nutritious moringa leaf powder for the needy
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
